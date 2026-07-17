import { listMemories, deleteMemory } from "../services/mem0.service.js";

// ─── List Memories ────────────────────────────────────────────────────────────

export const getMemories = async (req, res, next) => {
  try {
    const shopId = req.auth.shopId;
    const memories = await listMemories(shopId);

    // Normalise the Mem0 response into a consistent shape for the frontend
    const normalised = memories.map((m) => ({
      id: m.id,
      memory: m.memory,
      category: m.metadata?.category || "General Note",
      createdAt: m.metadata?.createdAt || m.created_at || new Date().toISOString(),
      userId: m.metadata?.userId || null,
    }));

    return res.status(200).json({
      success: true,
      memories: normalised,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Delete Memory ────────────────────────────────────────────────────────────

export const removeMemory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Memory ID is required" });
    }

    await deleteMemory(id);

    return res.status(200).json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};
