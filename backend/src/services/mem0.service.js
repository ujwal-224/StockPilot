import MemoryClient from "mem0ai";

// ─── Hidden-character sanitiser ───────────────────────────────────────────────
// The .env value can contain invisible Unicode characters (e.g. U+200B zero-
// width space) pasted from a browser.  Strip them before they reach the SDK.

function sanitiseKey(raw) {
  if (typeof raw !== "string") return raw;
  return raw.replace(/[^\x21-\x7E]/g, ""); // keep only printable ASCII
}

// ─── Client (lazy singleton) ──────────────────────────────────────────────────

let _client = null;

/**
 * Returns a configured Mem0 MemoryClient, or null when the API key is absent.
 * A null return means Mem0 is disabled; every exported function handles it.
 */
function getClient() {
  if (_client) return _client;

  const raw = process.env.MEM0_API_KEY;
  if (!raw) return null;

  const apiKey = sanitiseKey(raw);
  if (!apiKey) {
    console.warn("[Mem0] MEM0_API_KEY resolved to an empty string after sanitisation.");
    return null;
  }

  try {
    _client = new MemoryClient({ apiKey });
    return _client;
  } catch (err) {
    console.error("[Mem0] Failed to initialise MemoryClient:", err.message);
    return null;
  }
}

/** Call once at server start so operators know immediately if Mem0 is active. */
let _startupLogged = false;
export function logMem0Status() {
  if (_startupLogged) return;
  _startupLogged = true;
  if (process.env.MEM0_API_KEY) {
    console.log("[Mem0] API key configured. Long-term memory is ENABLED.");
  } else {
    console.warn("[Mem0] API key not configured. Running without long-term memory.");
  }
}

// ─── Shop user_id ─────────────────────────────────────────────────────────────
// All members of the same shop share one Mem0 user_id.

function shopUserId(shopId) {
  return `shop-${shopId}`;
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.85;

function jaccardSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().match(/\w+/g) || []);
  const wordsB = new Set(b.toLowerCase().match(/\w+/g) || []);
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Returns true when a memory very similar to `content` already exists.
 *
 * SDK v3.1.0 search() — user_id goes inside filters:
 *   client.search(query, { filters: { user_id }, top_k })
 */
async function isDuplicate(client, shopId, content) {
  try {
    const results = await client.search(content, {
      filters: { user_id: shopUserId(shopId) },
      top_k: 3,
    });

    const items = Array.isArray(results)
      ? results
      : Array.isArray(results?.results)
      ? results.results
      : [];

    for (const r of items) {
      const existing = r.memory || "";

      if (typeof r.score === "number" && r.score >= SIMILARITY_THRESHOLD) {
        console.log(
          `[Mem0] Duplicate Memory Ignored (semantic ${r.score.toFixed(2)}):`,
          content.slice(0, 60)
        );
        return true;
      }

      const sim = jaccardSimilarity(content, existing);
      if (sim >= SIMILARITY_THRESHOLD) {
        console.log(
          `[Mem0] Duplicate Memory Ignored (Jaccard ${sim.toFixed(2)}):`,
          content.slice(0, 60)
        );
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn("[Mem0] Duplicate check error (allowing save):", err.message);
    return false;
  }
}

// ─── Save Memory ──────────────────────────────────────────────────────────────

/**
 * Saves a business memory for a shop.
 *
 * SDK v3.1.0 add() — user_id goes at the TOP LEVEL of options (not in filters):
 *   client.add(messages, { userId, metadata })
 *   → _preparePayload camelToSnakeKeys({ messages, userId, metadata })
 *   → { messages, user_id, metadata }   ← what the API receives
 *
 * Note: filters is for search/getAll only. add() requires user_id top-level.
 */
export async function saveMemory(shopId, userId, content, category = "General Note") {
  const client = getClient();
  if (!client) {
    console.log("[Mem0] Mem0 Disabled – skipping memory save.");
    return null;
  }

  const duplicate = await isDuplicate(client, shopId, content);
  if (duplicate) return null;

  try {
    const messages = [{ role: "user", content }];

    // userId (camelCase) → SDK converts to user_id (snake_case) in the payload
    await client.add(messages, {
      userId: shopUserId(shopId),
      metadata: {
        shopId: shopId.toString(),
        userId: userId.toString(),
        category,
        createdAt: new Date().toISOString(),
      },
    });

    console.log(`[Mem0] Memory Saved [${category}] for shop ${shopId}:`, content.slice(0, 60));
    return true;
  } catch (err) {
    console.error("[Mem0] Save failed:", err.message);
    return null;
  }
}

// ─── Search Memory ────────────────────────────────────────────────────────────

const MAX_CONTEXT_MEMORIES = 5;

/**
 * Semantic search for memories relevant to a user query.
 *
 * SDK v3.1.0 search() — user_id goes inside filters:
 *   client.search(query, { filters: { user_id }, top_k })
 */
export async function searchMemory(shopId, query) {
  const client = getClient();
  if (!client) {
    console.log("[Mem0] Mem0 Disabled – skipping memory search.");
    return [];
  }

  try {
    console.log(`[Mem0] Memory Search for shop ${shopId}:`, query.slice(0, 60));

    const results = await client.search(query, {
      filters: { user_id: shopUserId(shopId) },
      top_k: MAX_CONTEXT_MEMORIES,
    });

    const items = Array.isArray(results)
      ? results
      : Array.isArray(results?.results)
      ? results.results
      : [];

    return items.slice(0, MAX_CONTEXT_MEMORIES);
  } catch (err) {
    console.error("[Mem0] Search failed:", err.message);
    return [];
  }
}

// ─── List Memories ────────────────────────────────────────────────────────────

/**
 * Returns all stored memories for a shop.
 *
 * SDK v3.1.0 getAll() — user_id goes inside filters:
 *   client.getAll({ filters: { user_id } })
 */
export async function listMemories(shopId) {
  const client = getClient();
  if (!client) {
    console.log("[Mem0] Mem0 Disabled – skipping memory list.");
    return [];
  }

  try {
    const results = await client.getAll({
      filters: { user_id: shopUserId(shopId) },
    });

    const items = Array.isArray(results)
      ? results
      : Array.isArray(results?.results)
      ? results.results
      : [];

    return items;
  } catch (err) {
    console.error("[Mem0] List failed:", err.message);
    return [];
  }
}

// ─── Get Single Memory ────────────────────────────────────────────────────────

/**
 * Fetches a single memory by its Mem0 ID.
 * SDK v3.1.0: client.get(memoryId)  — no entity params needed.
 */
export async function getMemoryById(memoryId) {
  const client = getClient();
  if (!client) return null;

  try {
    const result = await client.get(memoryId);
    return result || null;
  } catch (err) {
    console.error("[Mem0] Get-by-id failed:", err.message);
    return null;
  }
}

// ─── Delete Memory (ownership-verified) ──────────────────────────────────────

/**
 * Deletes a memory only after verifying it belongs to the requesting shop.
 * SDK v3.1.0: client.delete(memoryId)  — no entity params needed.
 *
 * Returns typed { success, reason } so the controller can map HTTP codes.
 */
export async function deleteMemoryVerified(memoryId, shopId) {
  const client = getClient();
  if (!client) {
    console.log("[Mem0] Mem0 Disabled – skipping memory delete.");
    return { success: false, reason: "disabled" };
  }

  // ── Ownership check ──────────────────────────────────────────────────────
  try {
    const memory = await client.get(memoryId);
    if (!memory) {
      return { success: false, reason: "not_found" };
    }

    const memShopId = memory.metadata?.shopId?.toString();
    if (memShopId && memShopId !== shopId.toString()) {
      console.warn(
        `[Mem0] Ownership violation: shop ${shopId} attempted to delete memory ` +
          `${memoryId} owned by shop ${memShopId}`
      );
      return { success: false, reason: "forbidden" };
    }

    // Fallback: compare user_id field when metadata is absent
    if (!memShopId) {
      const expectedUserId = shopUserId(shopId);
      const actualUserId = memory.user_id || "";
      if (actualUserId && actualUserId !== expectedUserId) {
        console.warn(
          `[Mem0] Ownership violation (user_id fallback): shop ${shopId}, memory ${memoryId}`
        );
        return { success: false, reason: "forbidden" };
      }
    }
  } catch (err) {
    console.error(
      "[Mem0] Ownership verification failed for memory",
      memoryId,
      ":",
      err.message
    );
    return { success: false, reason: "verification_error" };
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  try {
    await client.delete(memoryId);
    console.log(`[Mem0] Memory Deleted: ${memoryId} (shop ${shopId})`);
    return { success: true };
  } catch (err) {
    console.error("[Mem0] Delete failed:", err.message);
    return { success: false, reason: "delete_error" };
  }
}

/** Legacy bare delete — kept for internal use only. */
export async function deleteMemory(memoryId) {
  const client = getClient();
  if (!client) {
    console.log("[Mem0] Mem0 Disabled – skipping memory delete.");
    return null;
  }
  try {
    const result = await client.delete(memoryId);
    console.log("[Mem0] Memory Deleted:", memoryId);
    return result;
  } catch (err) {
    console.error("[Mem0] Delete failed:", err.message);
    return null;
  }
}
