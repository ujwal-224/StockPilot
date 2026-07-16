import Groq from "groq-sdk";
import Product from "../models/Product.js";

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

function buildSystemPrompt(inventorySummary) {
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

--- CURRENT INVENTORY DATA ---
${inventorySummary}
--- END OF INVENTORY DATA ---

Use the inventory data above whenever answering inventory questions.

Never invent stock quantities or product names.

If information is unavailable, clearly state that it is not present in the inventory.

Always provide practical recommendations whenever possible.`;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey || !model) {
      return res.status(500).json({
        success: false,
        message: "Groq AI is not configured",
      });
    }

    // 1. Fetch all products from MongoDB
    const products = await Product.find(
      {},
      "name category stock threshold unit price"
    ).lean();

    // 2. Build readable inventory summary
    const inventorySummary = buildInventorySummary(products);

    // 3. Build system prompt with inventory context
    const systemPrompt = buildSystemPrompt(inventorySummary);

    // 4. Send system prompt + user message to Groq
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      const error = new Error("Groq returned an empty response");
      error.statusCode = 502;
      throw error;
    }

    // 5. Return the reply exactly as before
    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    return next(error);
  }
};
