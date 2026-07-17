import multer from "multer";

// ─── Allowed Audio MIME Types ─────────────────────────────────────────────────
// Only these content-types are accepted.  All others are rejected with a 400.

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/ogg; codecs=opus",
]);

// ─── File Filter ──────────────────────────────────────────────────────────────
// Called by multer for every incoming file before it is buffered.
// Accepts the file when the MIME type is in the allow-list; rejects otherwise.

function audioFileFilter(_req, file, cb) {
  // Browsers sometimes append charset or codec parameters (e.g.
  // "audio/ogg; codecs=opus").  Normalise by trimming whitespace so the
  // Set lookup works correctly for both bare and parameterised MIME types.
  const mime = (file.mimetype || "").trim();

  if (ALLOWED_MIME_TYPES.has(mime)) {
    // null as the first argument means "no error" — accept the file
    cb(null, true);
  } else {
    // Passing an Error as the first argument causes multer to reject the
    // upload and forward the error to Express's error handler.
    cb(
      new Error(
        `Unsupported audio format "${mime}". ` +
          "Accepted formats: webm, wav, mp3, mp4, m4a, ogg."
      ),
      false
    );
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────
// Use memoryStorage so uploaded audio is held in req.file.buffer and never
// written to disk.  This keeps the server stateless and avoids managing
// temporary files.

const storage = multer.memoryStorage();

// ─── Multer Instance ──────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB — reject larger payloads early
  },
});

// ─── Export ───────────────────────────────────────────────────────────────────
// Consumers use this as:
//
//   router.post("/transcribe", upload.single("audio"), controller);
//
// After the middleware runs, the audio data is available as:
//   req.file.buffer   – raw audio bytes  (pass directly to gnani.service.js)
//   req.file.mimetype – detected MIME type
//   req.file.size     – byte length

export default upload;
