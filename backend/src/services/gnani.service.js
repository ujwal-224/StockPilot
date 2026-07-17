import axios from "axios";
import FormData from "form-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const GNANI_STT_ENDPOINT = "https://api.vachana.ai/stt/v3";

/** Default options applied when the caller does not override them. */
const DEFAULT_OPTIONS = {
  languageCode:        "en-IN",        // BCP-47 language code (language_code field)
  preferredLanguage:   "en-IN",        // Fallback / preferred language (preferred_language field)
  format:              "transcribe",   // Task format — documented default (format field)
  itnNativeNumerals:   true,           // Output native-script numerals — documented default (itn_native_numerals field)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the plain transcript string from the Gnani API response body.
 * The API may return the transcript in several shapes depending on the model.
 *
 * @param {object} data - Parsed JSON response from the API.
 * @returns {string} The transcript, or an empty string when absent.
 */
function extractTranscript(data) {
  if (!data || typeof data !== "object") return "";

  // Primary: documented response shape { transcript: "..." }
  if (typeof data.transcript === "string") return data.transcript.trim();

  // Fallback 1: { result: { transcript: "..." } }
  if (typeof data.result?.transcript === "string")
    return data.result.transcript.trim();

  // Fallback 2: { results: [{ transcript: "..." }] }  (batch / streaming)
  if (Array.isArray(data.results) && data.results.length > 0) {
    const joined = data.results
      .map((r) => r.transcript || "")
      .join(" ")
      .trim();
    if (joined) return joined;
  }

  // Fallback 3: { text: "..." }
  if (typeof data.text === "string") return data.text.trim();

  return "";
}

// ─── transcribeAudio ──────────────────────────────────────────────────────────

/**
 * Transcribe an audio buffer using the Gnani (Vachana) Speech-to-Text API.
 *
 * @param {Buffer} audioBuffer
 *   Raw audio bytes to transcribe.  Must be a non-empty Node.js Buffer.
 *
 * @param {object} [options={}]
 *   Optional configuration:
 *   @param {string} [options.filename]
 *     Filename hint for the uploaded audio file (e.g. "audio.webm", "recording.wav").
 *   @param {string} [options.mimeType]
 *     MIME type of the audio data (e.g. "audio/webm", "audio/ogg", "audio/wav").
 *   @param {string} [options.languageCode="en-IN"]
 *     BCP-47 language code sent as `language_code` (e.g. "hi-IN", "kn-IN").
 *   @param {string} [options.preferredLanguage="en-IN"]
 *     Fallback / preferred language sent as `preferred_language`.
 *   @param {string} [options.format="transcribe"]
 *     Task format sent as `format`. The documented default is "transcribe".
 *   @param {boolean} [options.itnNativeNumerals=true]
 *     Output numerals in the native script of the target language.
 *     The documented default is true. Sent as `itn_native_numerals`.
 *
 * @returns {Promise<string>}
 *   The plain-text transcript.
 *
 * @throws {Error}
 *   Thrown for configuration errors (missing API key, invalid buffer).
 *   Network and API errors are caught internally and re-thrown with a clear
 *   message so callers can wrap this in try/catch and degrade gracefully.
 */
export async function transcribeAudio(audioBuffer, options = {}) {
  // ── 1. Validate configuration ────────────────────────────────────────────

  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "[Gnani] GNANI_API_KEY is not configured. " +
        "Set it in your .env file to enable voice transcription."
    );
  }

  // ── 2. Validate the audio buffer ─────────────────────────────────────────

  if (!Buffer.isBuffer(audioBuffer)) {
    throw new Error(
      "[Gnani] audioBuffer must be a Node.js Buffer, " +
        `received ${typeof audioBuffer}.`
    );
  }

  if (audioBuffer.length === 0) {
    throw new Error("[Gnani] audioBuffer is empty. Cannot transcribe silence.");
  }

  // ── 3. Resolve options and dynamically detect type if not provided ───────

  // Sniff magic bytes of the buffer to determine format if not provided
  let detectedMime = "audio/wav";
  let detectedExt = "wav";

  if (audioBuffer && audioBuffer.length >= 4) {
    const hex = audioBuffer.toString("hex", 0, 4).toUpperCase();
    if (hex === "1A45DFA3") {
      detectedMime = "audio/webm";
      detectedExt = "webm";
    } else if (hex === "4F676753") {
      detectedMime = "audio/ogg";
      detectedExt = "ogg";
    } else if (hex === "52494646") {
      detectedMime = "audio/wav";
      detectedExt = "wav";
    } else if (hex.startsWith("494433") || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
      detectedMime = "audio/mpeg";
      detectedExt = "mp3";
    }
  }

  const mimeType = options.mimeType || detectedMime;
  const filename = options.filename || `audio.${detectedExt}`;

  const languageCode       = options.languageCode       || DEFAULT_OPTIONS.languageCode;
  const preferredLanguage  = options.preferredLanguage  || DEFAULT_OPTIONS.preferredLanguage;
  const format             = options.format             || DEFAULT_OPTIONS.format;
  const itnNativeNumerals  =
    options.itnNativeNumerals !== undefined
      ? Boolean(options.itnNativeNumerals)
      : DEFAULT_OPTIONS.itnNativeNumerals;

  // ── 4. Build multipart/form-data payload ─────────────────────────────────

  const form = new FormData();

  // Primary audio field — documented field name: audio_file
  form.append("audio_file", audioBuffer, {
    filename,
    contentType: mimeType,
    knownLength: audioBuffer.length,
  });

  // Documented Gnani STT v3 fields
  form.append("language_code",       languageCode);
  form.append("preferred_language",  preferredLanguage);
  form.append("format",              format);
  form.append("itn_native_numerals", String(itnNativeNumerals));

  // ── 5. Send the request ──────────────────────────────────────────────────

  let response;
  try {
    response = await axios.post(GNANI_STT_ENDPOINT, form, {
      headers: {
        // Authentication header required by Vachana v3
        "X-API-Key-ID": apiKey.trim(),
        // Let form-data set the correct Content-Type boundary automatically
        ...form.getHeaders(),
      },
      // Generous timeout: STT can be slow for longer audio clips
      timeout: 30_000,
      maxContentLength: 10 * 1024 * 1024, // 10 MB response limit
    });
  } catch (err) {
    // Axios wraps HTTP errors in err.response; network failures have no response
    if (err.response) {
      const status  = err.response.status;
      const body    = err.response.data;
      const detail  =
        typeof body === "string"
          ? body.slice(0, 200)
          : JSON.stringify(body).slice(0, 200);

      throw new Error(
        `[Gnani] API returned HTTP ${status}: ${detail}`
      );
    }

    // ECONNREFUSED, ETIMEDOUT, DNS failures, etc.
    throw new Error(
      `[Gnani] Network error while contacting STT API: ${err.message}`
    );
  }

  // ── 6. Extract and validate the transcript ───────────────────────────────

  const transcript = extractTranscript(response.data);

  if (!transcript) {
    // Log the raw response to aid debugging without throwing (empty audio is
    // a valid edge-case — callers should handle an empty string gracefully)
    console.warn(
      "[Gnani] STT returned an empty transcript. Raw response:",
      JSON.stringify(response.data).slice(0, 300)
    );
    return "";
  }

  console.log(
    `[Gnani] Transcribed (${languageCode}, ${audioBuffer.length} bytes):`,
    transcript.slice(0, 80)
  );

  return transcript;
}
