/** Reads pixel dimensions from a JPEG, PNG or WebP header without decoding the image. */
export function readImageSize(buffer: Buffer): { width: number; height: number } | null {
  // PNG: IHDR chunk right after the 8-byte signature.
  if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X chunk.
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
    return null;
  }

  // JPEG: walk segments until a Start-Of-Frame marker.
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1]!;
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      offset += 2 + length;
    }
  }
  return null;
}

/**
 * Output size that keeps the photo's aspect ratio: long edge `longEdge`, both sides divisible
 * by 16, ratio clamped to 1:3–3:1 (the limits of the GPT image models).
 */
export function generationSize(source: { width: number; height: number } | null, longEdge = 1536): string {
  if (!source || source.width <= 0 || source.height <= 0) return '1536x1024';
  const ratio = Math.min(3, Math.max(1 / 3, source.width / source.height));
  const round16 = (value: number) => Math.max(16, Math.round(value / 16) * 16);
  return ratio >= 1
    ? `${round16(longEdge)}x${round16(longEdge / ratio)}`
    : `${round16(longEdge * ratio)}x${round16(longEdge)}`;
}
