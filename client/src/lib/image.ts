/**
 * Serve photos through Next's image optimizer (/_next/image), which resizes them
 * and converts them to WebP. Uploads are often 2–3 MB phone photos, so without this
 * a phone downloads megabytes for a 200px thumbnail.
 */

// Widths must be in Next's default deviceSizes/imageSizes, or the optimizer rejects them.
const WIDTHS = [64, 128, 256, 384, 640, 828, 1080, 1200, 1920] as const;

// Uploaded files are sometimes saved with the site's full URL; the optimizer only
// reads local paths, so strip our own origin.
const OWN_ORIGIN = /^https?:\/\/(www\.)?fluentlearner\.com(?=\/)/i;

// Public folders the optimizer may read; must match images.localPatterns in next.config.ts.
const OPTIMIZABLE =
  /^\/(uploads\/(images|branding)\/[^?#]+|old-site\/[^?#]+|[^/?#]+)$/;

function localPath(src: string): string | null {
  const path = src.replace(OWN_ORIGIN, "");
  if (!OPTIMIZABLE.test(path)) return null;
  return /\.(jpe?g|png|webp)$/i.test(path) ? path : null;
}

/** A resized URL for `src` at `width`, or `src` unchanged when it can't be optimized. */
export function optimizedSrc(src: string, width: number): string {
  const path = localPath(src);
  if (!path) return src;
  const w = WIDTHS.find(size => size >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(path)}&w=${w}&q=75`;
}

/**
 * Props to spread onto an <img>: a srcset the browser picks from using `sizes`
 * (how wide the image is drawn, e.g. "(min-width: 1024px) 33vw, 50vw").
 * `maxWidth` caps the largest file offered.
 */
export function responsiveImage(
  src: string,
  sizes: string,
  maxWidth = 1920
): { src: string; srcSet?: string; sizes?: string } {
  if (!localPath(src)) return { src };
  const widths = WIDTHS.filter(w => w >= 256 && w <= maxWidth);
  return {
    src: optimizedSrc(src, Math.min(1080, maxWidth)),
    srcSet: widths.map(w => `${optimizedSrc(src, w)} ${w}w`).join(", "),
    sizes,
  };
}
