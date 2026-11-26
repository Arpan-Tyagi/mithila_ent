import 'server-only';

// SEC-11: decide the image type from the file's own bytes, never from the
// client-declared MIME type. Only raster formats; SVG (which can carry script)
// is rejected.

export type AllowedImage = { contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'; ext: string };

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the bucket's file_size_limit (migration 0044)

export function sniffImage(buf: Buffer): AllowedImage | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { contentType: 'image/jpeg', ext: 'jpg' };
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { contentType: 'image/png', ext: 'png' };
  }
  // WebP: "RIFF" .... "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  // AVIF: ISO BMFF "ftyp" box with an avif/avis brand
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') return { contentType: 'image/avif', ext: 'avif' };
  }
  return null;
}

/** Parses a base64 data URL and returns the bytes plus the sniffed type. */
export function decodeImageDataUrl(dataUrl: unknown): { buffer: Buffer; image: AllowedImage } {
  if (typeof dataUrl !== 'string' || dataUrl.length > Math.ceil(MAX_IMAGE_BYTES * 1.4) + 100) {
    throw new Error('Image too large (max 5 MB)');
  }
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new Error('Unsupported image format');
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.byteLength === 0) throw new Error('Empty image');
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Image too large (max 5 MB)');
  const image = sniffImage(buffer);
  if (!image) throw new Error('Only JPEG, PNG, WebP or AVIF images are allowed');
  return { buffer, image };
}
