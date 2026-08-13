import { ApiError } from "./apiError.js";

export interface ImageDimensions {
  width: number;
  height: number;
}

function pngDimensions(buffer: Buffer): ImageDimensions | null {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null;
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : null;
}

const startOfFrameMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function jpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;

  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) return null;
    const marker = buffer[offset]!;
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;

    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += segmentLength;
  }
  return null;
}

export function getImageDimensions(
  buffer: Buffer,
  contentType: "image/jpeg" | "image/png",
): ImageDimensions {
  const dimensions = contentType === "image/png"
    ? pngDimensions(buffer)
    : jpegDimensions(buffer);
  if (!dimensions) {
    throw new ApiError(400, "The uploaded file is not a valid JPEG or PNG image");
  }
  return dimensions;
}
