import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Configure fluent-ffmpeg to use the static binary path provided by ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegPath.default || ffmpegPath);

/**
 * Converts a WebM audio buffer into a WAV audio buffer.
 *
 * @param {Buffer} webmBuffer - The raw WebM audio buffer.
 * @returns {Promise<Buffer>} The converted WAV audio buffer.
 * @throws {Error} If the conversion fails or file operations error out.
 */
export async function convertWebmToWav(webmBuffer) {
  if (!Buffer.isBuffer(webmBuffer) || webmBuffer.length === 0) {
    throw new Error("Invalid or empty input audio buffer provided.");
  }

  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const inputPath = path.join(tempDir, `input-${uniqueId}.webm`);
  const outputPath = path.join(tempDir, `output-${uniqueId}.wav`);

  try {
    // 1. Write the WebM buffer to a temporary file
    await fs.writeFile(inputPath, webmBuffer);

    // 2. Perform the conversion using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("wav")
        .output(outputPath)
        .on("end", () => {
          console.log(`[FFmpeg] Conversion completed: ${outputPath}`);
          resolve();
        })
        .on("error", (err) => {
          console.error("[FFmpeg] Error during conversion:", err);
          reject(err);
        })
        .run();
    });

    // 3. Read the converted WAV file back into a buffer
    const wavBuffer = await fs.readFile(outputPath);
    return wavBuffer;
  } catch (error) {
    console.error("[AudioConverter] Failed to convert WebM to WAV:", error.message);
    throw new Error(`Audio conversion failed: ${error.message}`);
  } finally {
    // 4. Safely clean up all temporary files
    await Promise.all([
      fs.unlink(inputPath).catch(() => { }),
      fs.unlink(outputPath).catch(() => { }),
    ]);
  }
}
