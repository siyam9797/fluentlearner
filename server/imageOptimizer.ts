import sharp from "sharp";

const imageFormats: Record<string, string> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
  avif: "heif",
  gif: "gif",
};

/** Keep the original format and animation; never store a larger result. */
export async function optimizeUploadedImage(
  data: Buffer | Uint8Array | string,
  extension: string
): Promise<Buffer | Uint8Array | string> {
  const format = imageFormats[extension.toLowerCase()];
  if (!format || typeof data === "string") return data;

  const original = Buffer.from(data);
  if (original.length < 1024 || original.length > 25 * 1024 * 1024) return data;

  try {
    const animated = format === "gif" || format === "webp";
    const image = sharp(original, {
      animated,
      autoOrient: true,
      limitInputPixels: 40_000_000,
    });
    const metadata = await image.metadata();
    if (metadata.format !== format) return data;
    // Re-encoding high-bit-depth images could discard detail.
    if (
      metadata.depth === "ushort" ||
      metadata.depth === "float" ||
      (metadata.bitsPerSample ?? 8) > 8 ||
      metadata.gainMap ||
      (format === "heif" && metadata.compression !== "av1")
    )
      return data;

    image.keepIccProfile();
    let optimized: Buffer;
    switch (format) {
      case "jpeg":
        optimized = await image
          .jpeg({ quality: 95, mozjpeg: true, progressive: true })
          .toBuffer();
        break;
      case "png":
        optimized = await image
          .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
          .toBuffer();
        break;
      case "webp":
        optimized = await image.webp({ lossless: true, effort: 6 }).toBuffer();
        break;
      case "heif":
        optimized = await image.avif({ lossless: true, effort: 4 }).toBuffer();
        break;
      case "gif":
        optimized = await image
          .gif({
            reuse: true,
            effort: 8,
            interFrameMaxError: 0,
            interPaletteMaxError: 0,
            keepDuplicateFrames: true,
          })
          .toBuffer();
        break;
      default:
        return data;
    }

    if (optimized.length >= original.length) return data;
    if (animated) {
      const result = await sharp(optimized, { animated: true }).metadata();
      if (
        result.pages !== metadata.pages ||
        result.loop !== metadata.loop ||
        JSON.stringify(result.delay) !== JSON.stringify(metadata.delay)
      )
        return data;
    }
    return optimized;
  } catch {
    // A decoder failure should not make an otherwise valid upload fail.
    return data;
  }
}
