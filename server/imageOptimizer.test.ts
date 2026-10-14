import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { optimizeUploadedImage } from "./imageOptimizer";
import { storagePut, storagePutNamed } from "./storage";

const sourcePng = () =>
  sharp({
    create: {
      width: 320,
      height: 240,
      channels: 3,
      background: "#3467ab",
    },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();

describe("image uploads", () => {
  it("reduces a JPEG while retaining its format and visual detail", async () => {
    const pixels = Buffer.alloc(256 * 256 * 3);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const index = (y * 256 + x) * 3;
        pixels[index] = x;
        pixels[index + 1] = y;
        pixels[index + 2] = (x + y) / 2;
      }
    }
    const original = await sharp(pixels, {
      raw: { width: 256, height: 256, channels: 3 },
    })
      .jpeg({ quality: 100 })
      .toBuffer();
    const result = await optimizeUploadedImage(original, "jpg");
    expect(Buffer.byteLength(result)).toBeLessThan(original.length);
    expect(await sharp(result).metadata()).toMatchObject({
      format: "jpeg",
      width: 256,
      height: 256,
    });

    const originalPixels = await sharp(original).raw().toBuffer();
    const optimizedPixels = await sharp(result).raw().toBuffer();
    const averageDifference =
      originalPixels.reduce(
        (total, value, index) =>
          total + Math.abs(value - optimizedPixels[index]),
        0
      ) / originalPixels.length;
    expect(averageDifference).toBeLessThan(2);
  });

  it("compresses a PNG without changing its pixels or dimensions", async () => {
    const original = await sourcePng();
    const uploadDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "fluent-images-")
    );
    const previousDir = ENV.uploadDir;
    ENV.uploadDir = uploadDir;

    try {
      const named = await storagePutNamed("images", "Example.PNG", original);
      const direct = await storagePut("uploads/avatars/example.png", original);
      for (const result of [named, direct]) {
        const stored = await fs.readFile(path.join(uploadDir, result.key));
        expect(stored.length).toBeLessThan(original.length);
        expect(result.size).toBe(stored.length);
        expect(await sharp(stored).raw().toBuffer()).toEqual(
          await sharp(original).raw().toBuffer()
        );
        expect(await sharp(stored).metadata()).toMatchObject({
          width: 320,
          height: 240,
          format: "png",
        });
      }
    } finally {
      ENV.uploadDir = previousDir;
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  });

  it("leaves non-image uploads unchanged", async () => {
    const original = Buffer.from("Course notes in a PDF-like file");
    const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "fluent-files-"));
    const previousDir = ENV.uploadDir;
    ENV.uploadDir = uploadDir;

    try {
      const result = await storagePutNamed("resources", "notes.pdf", original);
      expect(await fs.readFile(path.join(uploadDir, result.key))).toEqual(
        original
      );
      expect(result.size).toBe(original.length);
    } finally {
      ENV.uploadDir = previousDir;
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  });
});
