import Groq from "groq-sdk";
import Product from "../models/Product.js";
import { searchMemory, saveMemory, listMemories } from "../services/mem0.service.js";
import { transcribeAudio } from "../services/gnani.service.js";
import { convertWebmToWav } from "../utils/audioConverter.js";

// ─── Inventory Summary Builder ────────────────────────────────────────────────

function buildInventorySummary(products) {
  if (!products || products.length === 0) {
    return "No products are currently in the inventory.";
  }

  return products
    .map((p) => {
      const stockStatus =
        p.stock === 0
          ? "OUT OF STOCK"
          : p.stock <= p.threshold
            ? "LOW STOCK"
            : "IN STOCK";

      return [
        `${p.name}`,
        `  Category : ${p.category}`,
        `  Stock    : ${p.stock} ${p.unit}`,
        `  Threshold: ${p.threshold} ${p.unit}`,
        `  Price    : ₹${p.price} per ${p.unit}`,
        `  Status   : ${stockStatus}`,
      ].join("\n");
    })
    .join("\n\n");
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(inventorySummary, businessMemories = []) {
  const memoriesSection =
    businessMemories.length > 0
      ? `--- BUSINESS MEMORY (remembered preferences & rules) ---
${businessMemories.map((m, i) => `${i + 1}. ${m.memory}`).join("\n")}
--- END OF BUSINESS MEMORY ---`
      : "";

  return `You are StockPilot AI, an intelligent inventory assistant built for Indian kirana store owners.

Your primary role is to help owners manage their store inventory by answering questions about:
- Current stock levels and which items are low or out of stock
- Restocking recommendations and purchase planning
- Sales trends and fast-moving vs slow-moving products
- Price and category information
- General inventory management best practices

Always be concise, friendly, and practical. Use simple language suitable for a small business owner.
When stock is low or out, proactively highlight it and suggest restocking.
Format lists clearly when there are multiple items.
You are StockPilot AI.

You are an intelligent inventory management assistant for small retail businesses.

Always answer inventory-related questions using the provided inventory data.

You may also answer general business questions such as:

- Inventory management
- Stock planning
- Sales strategies
- Procurement
- Retail operations
- Warehouse management

If the user asks something completely unrelated to business (movies, sports, politics, celebrities, jokes, etc.), politely explain that you are designed to assist with inventory and retail business management.

${memoriesSection}

--- CURRENT INVENTORY DATA ---
${inventorySummary}
--- END OF INVENTORY DATA ---

Use the inventory data above whenever answering inventory questions.

Use the business memory above to personalise your answers with known preferences, suppliers, restocking rules, and store information.

Never invent stock quantities or product names.

If information is unavailable, clearly state that it is not present in the inventory.

Always provide practical recommendations whenever possible.`;
}

// ─── Memory Worth Saving Heuristic ────────────────────────────────────────────
// Checks if a user message contains long-term business information worth storing.
// Avoids an extra Groq call to keep latency low.

const MEMORY_KEYWORDS = [
  "supplier", "vendor", "wholesaler", "distributor",
  "reorder", "restock", "order when", "buy when",
  "closed on", "holiday", "open on", "business hours", "timing",
  "prefer", "preference", "we always", "we never", "our policy",
  "my shop", "our shop", "we sell", "mainly sell", "specialise", "specialize",
  "remind me", "notify me",
  "regular customer", "loyal customer", "key client",
  "festival stock", "seasonal", "bulk order",
  "wholesale price", "buying price", "our margin",
  "payment terms", "credit limit",
];

// Phrases that indicate casual, transient, or non-valuable messages.
const SKIP_PATTERNS = [
  /^(hi|hello|hey|namaste|hlo|helo)\b/,
  /^(thanks|thank you|thx|ty|ok|okay|sure|got it|alright|cool|great|nice)\b/,
  /^(yes|no|yep|nope|yeah|nah|absolutely|definitely)\b/,
  /^(what is|what's|how much|how many|show me|tell me|list|give me|can you|please|could you)/,
  /^(good morning|good afternoon|good evening|good night)\b/,
];

function isWorthSaving(message) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // Too short to be meaningful long-term information
  if (trimmed.length < 20) return false;

  // Pure questions never contain persistent business facts
  if (trimmed.endsWith("?")) return false;

  // Explicitly skip casual / transient messages
  if (SKIP_PATTERNS.some((pattern) => pattern.test(lower))) return false;

  // Must contain at least one business keyword
  return MEMORY_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferCategory(message) {
  const lower = message.toLowerCase();
  if (["supplier", "vendor", "wholesaler", "distributor"].some((k) => lower.includes(k))) return "Supplier";
  if (["reorder", "restock", "order when", "buy when"].some((k) => lower.includes(k))) return "Restocking Rule";
  if (["closed on", "holiday", "open on", "business hours", "timing"].some((k) => lower.includes(k))) return "Store Information";
  if (["prefer", "preference", "we always", "we never", "our policy"].some((k) => lower.includes(k))) return "Business Preference";
  if (["remind me", "notify me"].some((k) => lower.includes(k))) return "Reminder";
  if (["regular customer", "loyal customer", "key client"].some((k) => lower.includes(k))) return "Customer Preference";
  if (["my shop", "our shop", "we sell", "mainly sell", "speciali"].some((k) => lower.includes(k))) return "Store Information";
  return "General Note";
}

// ─── Shared AI Processing ─────────────────────────────────────────────────────
// All AI logic lives here so it can be called by both the text chat endpoint
// and the voice chat endpoint without duplicating any code.
//
// @param {string} message  - The user's message (already validated & trimmed).
// @param {string} shopId   - Authenticated shop ID from req.auth.
// @param {string} userId   - Authenticated user ID from req.auth.
// @returns {Promise<string>} The AI reply string.

async function processAIMessage(message, shopId, userId) {
  const apiKey = process.env.GROQ_API_KEY;
  const model  = process.env.GROQ_MODEL;

  if (!apiKey || !model) {
    const err = new Error("Groq AI is not configured");
    err.statusCode = 500;
    throw err;
  }

  // Step 1: Search Mem0 for relevant business memories (non-blocking; capped at 5).
  // Failures here must never block the response.
  let businessMemories = [];
  try {
    businessMemories = await searchMemory(shopId, message);
  } catch (memErr) {
    console.error("[Mem0] Search error (non-fatal):", memErr.message);
  }

  // Step 2: Fetch all products from MongoDB.
  const products = await Product.find(
    { shop: shopId },
    "name category stock threshold unit price"
  ).sort({ stock: 1 }).limit(500).lean();

  // Step 3: Build readable inventory summary.
  const inventorySummary = buildInventorySummary(products);

  // Step 4: Build enriched system prompt with memories + inventory.
  const systemPrompt = buildSystemPrompt(inventorySummary, businessMemories);

  // Step 5: Send to Groq.
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: message },
    ],
  });

  const reply = completion.choices[0]?.message?.content;

  if (!reply) {
    const error = new Error("Groq returned an empty response");
    error.statusCode = 502;
    throw error;
  }

  // Step 6: Auto-save if message contains high-value business information.
  // Runs entirely in the background – never delays the response to the caller.
  if (isWorthSaving(message)) {
    const category = inferCategory(message);
    // saveMemory internally handles duplicate detection and disabled state.
    saveMemory(shopId, userId, message, category).catch((err) =>
      console.error("[Mem0] Background save error:", err.message)
    );
  }

  return reply;
}

// ─── Chat Controller ──────────────────────────────────────────────────────────
// Text-based chat endpoint.  Reads the message from req.body and delegates
// all AI processing to the shared processAIMessage() function.

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim() || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must contain between 1 and 2000 characters",
      });
    }

    const shopId = req.auth.shopId;
    const userId = req.auth.userId;

    const reply = await processAIMessage(message.trim(), shopId, userId);

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    return next(error);
  }
};

// ─── Speech-to-Text Chat Controller ──────────────────────────────────────────
// Voice-based chat endpoint.  Expects an audio file uploaded via multer
// (req.file.buffer), transcribes it with Gnani STT, then passes the
// transcript to the same processAIMessage() function used by text chat.
//
// Expected request: multipart/form-data with field name "audio".
// Response shape:
//   { success: true, transcript: "...", reply: "..." }

export const speechToTextChat = async (req, res, next) => {
  try {
    // ── 1. Validate that an audio file was uploaded ──────────────────────────
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No audio file received. Send a multipart/form-data request with field name \"audio\".",
      });
    }

    const shopId = req.auth.shopId;
    const userId = req.auth.userId;

    // ── 2. Transcribe the audio buffer with Gnani STT ────────────────────────
    let transcript;
    try {
      let audioBuffer = req.file.buffer;
      let filename = req.file.originalname || "audio.webm";
      let mimeType = req.file.mimetype || "audio/webm";

      // If the incoming audio is WebM, convert it to WAV first
      if (mimeType.includes("webm") || filename.endsWith(".webm")) {
        console.log("[STT] WebM audio detected. Converting to WAV...");
        audioBuffer = await convertWebmToWav(audioBuffer);
        filename = "audio.wav";
        mimeType = "audio/wav";
      }

      transcript = await transcribeAudio(audioBuffer, {
        filename,
        mimeType,
        languageCode: req.body.languageCode || "en-IN",
        preferredLanguage: req.body.preferredLanguage || "en-IN",
      });
    } catch (sttErr) {
      console.error("[Gnani] Transcription failed:", sttErr.message);
      return res.status(502).json({
        success: false,
        message: "Speech-to-text transcription failed. Please try again.",
      });
    }

    // ── 3. Validate the transcript ───────────────────────────────────────────
    if (!transcript || !transcript.trim()) {
      return res.status(422).json({
        success: false,
        message: "The audio was received but no speech was detected. Please speak clearly and try again.",
      });
    }

    const trimmedTranscript = transcript.trim();

    if (trimmedTranscript.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Transcribed message exceeds the 2000 character limit. Please record a shorter message.",
      });
    }

    // ── 4. Pass transcript to the shared AI processing function ─────────────
    const reply = await processAIMessage(trimmedTranscript, shopId, userId);

    // ── 5. Return transcript + AI reply ─────────────────────────────────────
    return res.status(200).json({
      success:    true,
      transcript: trimmedTranscript,
      reply,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Insights Controller ──────────────────────────────────────────────────────

const insightsSystemPrompt = `You are StockPilot AI.

Analyze the inventory and generate concise business insights.

Focus on:

- Low stock products
- Out of stock products
- Restocking priorities
- Overall inventory health
- Important observations

Return ONLY a JSON array of short insights.

Example:

[
  "Brown Rice stock is critically low.",
  "Amul Milk should be reordered this week.",
  "Inventory contains 5 products.",
  "No products are out of stock."
]

Do not include explanations.

Do not use markdown.`;

function buildFallbackInsights(products) {
  const outOfStock = products.filter((product) => product.stock === 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.threshold
  );

  const insights = [`Inventory contains ${products.length} products.`];

  insights.push(
    outOfStock.length > 0
      ? `${outOfStock.length} product${outOfStock.length === 1 ? " is" : "s are"} out of stock.`
      : "No products are out of stock."
  );

  insights.push(
    lowStock.length > 0
      ? `${lowStock.length} product${lowStock.length === 1 ? " needs" : "s need"} restocking soon.`
      : "No products are currently below their stock threshold."
  );

  if (outOfStock[0] || lowStock[0]) {
    insights.push(`${(outOfStock[0] || lowStock[0]).name} should be prioritized for restocking.`);
  } else {
    insights.push("Overall inventory health is good.");
  }

  return insights;
}

function parseInsights(content, fallback) {
  if (typeof content !== "string") return fallback;

  try {
    const arrayStart = content.indexOf("[");
    const arrayEnd = content.lastIndexOf("]");

    if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
      return fallback;
    }

    const parsed = JSON.parse(content.slice(arrayStart, arrayEnd + 1));
    const insights = Array.isArray(parsed)
      ? parsed.filter((insight) => typeof insight === "string" && insight.trim())
      : [];

    return insights.length > 0 ? insights : fallback;
  } catch {
    return fallback;
  }
}

export const getInsights = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey || !model) {
      return res.status(500).json({
        success: false,
        message: "Groq AI is not configured",
      });
    }

    const shopId = req.auth.shopId;

    // Fetch business preferences from Mem0 to personalise insights
    const allMemories = await listMemories(shopId);
    const prefMemories = allMemories
      .filter((m) =>
        ["Business Preference", "Restocking Rule", "Store Information"].includes(
          m.metadata?.category
        )
      )
      .slice(0, 5);

    const businessPrefsSection =
      prefMemories.length > 0
        ? `\n\nBusiness context from owner preferences:\n${prefMemories.map((m) => `- ${m.memory}`).join("\n")}`
        : "";

    const products = await Product.find(
      { shop: shopId },
      "name stock threshold category unit price"
    ).sort({ stock: 1 }).limit(500).lean();
    const inventorySummary = buildInventorySummary(products);
    const fallbackInsights = buildFallbackInsights(products);

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: insightsSystemPrompt },
        {
          role: "user",
          content: `Analyze this inventory:\n\n${inventorySummary}${businessPrefsSection}`,
        },
      ],
    });

    const insights = parseInsights(
      completion.choices[0]?.message?.content,
      fallbackInsights
    );

    return res.status(200).json({
      success: true,
      insights,
    });
  } catch (error) {
    return next(error);
  }
};
