import { listMemories, deleteMemoryVerified } from "../services/mem0.service.js";

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
    console.error("[Mem0] getMemories controller error:", error.message);
    // Return empty list rather than crashing the request
    return res.status(200).json({ success: true, memories: [] });
  }
};

// ─── Delete Memory ────────────────────────────────────────────────────────────

export const removeMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopId = req.auth.shopId;

    if (!id) {
      return res.status(400).json({ success: false, message: "Memory ID is required" });
    }

    const result = await deleteMemoryVerified(id, shopId);

    if (!result.success) {
      if (result.reason === "forbidden") {
        return res.status(403).json({ success: false, message: "You do not have permission to delete this memory" });
      }
      if (result.reason === "not_found") {
        return res.status(404).json({ success: false, message: "Memory not found" });
      }
      if (result.reason === "disabled") {
        return res.status(503).json({ success: false, message: "Memory service is currently disabled" });
      }
      // verification_error / delete_error
      return res.status(500).json({ success: false, message: "Failed to delete memory" });
    }

    return res.status(200).json({ success: true, message: "Memory deleted successfully" });
  } catch (error) {
    console.error("[Mem0] removeMemory controller error:", error.message);
    return next(error);
  }
};
