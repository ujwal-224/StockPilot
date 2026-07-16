import Groq from "groq-sdk";

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

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      messages: [
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

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    return next(error);
  }
};
