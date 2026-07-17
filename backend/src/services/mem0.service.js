import MemoryClient from "mem0ai";

// ─── Client ───────────────────────────────────────────────────────────────────

let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      throw new Error("MEM0_API_KEY is not configured");
    }
    _client = new MemoryClient({ apiKey });
  }
  return _client;
}

// ─── Shop User ID Helper ───────────────────────────────────────────────────────
// All members of the same shop share a single Mem0 user_id.
// This ensures memory is shop-scoped, not user-scoped.

function shopUserId(shopId) {
  return `shop-${shopId}`;
}

// ─── Memory Categories ────────────────────────────────────────────────────────

export const MEMORY_CATEGORIES = [
  "Business Preference",
  "Supplier",
  "Reminder",
  "Restocking Rule",
  "Store Information",
  "General Note",
  "Customer Preference",
];

// ─── Save Memory ──────────────────────────────────────────────────────────────

/**
 * Save a business memory for a shop.
 * @param {string} shopId  - The authenticated shop's ID.
 * @param {string} userId  - The user who created the memory.
 * @param {string} content - The memory content to store.
 * @param {string} [category] - Optional category from MEMORY_CATEGORIES.
 */
export async function saveMemory(shopId, userId, content, category = "General Note") {
  const client = getClient();
  const messages = [
    {
      role: "user",
      content,
    },
  ];

  const result = await client.add(messages, {
    user_id: shopUserId(shopId),
    metadata: {
      shopId: shopId.toString(),
      userId: userId.toString(),
      category,
      createdAt: new Date().toISOString(),
    },
  });

  return result;
}

// ─── Search Memory ────────────────────────────────────────────────────────────

/**
 * Semantically search memories for a shop.
 * @param {string} shopId - The authenticated shop's ID.
 * @param {string} query  - The search query (e.g. the user's message).
 * @returns {Array} Relevant memory results.
 */
export async function searchMemory(shopId, query) {
  const client = getClient();
  try {
    const results = await client.search(query, {
      user_id: shopUserId(shopId),
      limit: 10,
    });
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

// ─── List Memories ────────────────────────────────────────────────────────────

/**
 * List all memories for a shop.
 * @param {string} shopId - The authenticated shop's ID.
 * @returns {Array} All stored memories for this shop.
 */
export async function listMemories(shopId) {
  const client = getClient();
  try {
    const results = await client.getAll({
      user_id: shopUserId(shopId),
    });
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

// ─── Delete Memory ────────────────────────────────────────────────────────────

/**
 * Delete a memory by ID.
 * @param {string} memoryId - The Mem0 memory ID.
 */
export async function deleteMemory(memoryId) {
  const client = getClient();
  return client.delete(memoryId);
}
