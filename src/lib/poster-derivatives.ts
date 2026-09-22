import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MASTER_LONG_SIDE = 3840;
export const WEB_MIN_BYTES = 150 * 1024;
export const WEB_MAX_BYTES = Math.round(1.5 * 1024 * 1024);
export const WEB_WIDTH = 1600;

export function isVerified4k(width: number, height: number) {
  return Math.max(width, height) >= MASTER_LONG_SIDE;
}

export async function writePosterDerivatives(input: {
  buffer: Buffer;
  masterPath: string;
  webPath: string;
  publicPath: string;
  heroPath: string;
}) {
  const sharp = (await import("sharp")).default;
  const native = await sharp(input.buffer).rotate().metadata();
  const nativeWidth = native.width ?? 0;
  const nativeHeight = native.height ?? 0;
  const longSide = Math.max(nativeWidth, nativeHeight);
  const scale = longSide > 0 && longSide < MASTER_LONG_SIDE ? MASTER_LONG_SIDE / longSide : 1;

  let pipeline = sharp(input.buffer).rotate();
  if (scale > 1) {
    pipeline = pipeline.resize({
      width: Math.max(1, Math.round(nativeWidth * scale)),
      height: Math.max(1, Math.round(nativeHeight * scale)),
      kernel: "lanczos3",
      fit: "fill",
    });
  }
  const master = await pipeline.webp({ quality: 88 }).toBuffer();
  const masterMeta = await sharp(master).metadata();
  const masterWidth = masterMeta.width ?? 0;
  const masterHeight = masterMeta.height ?? 0;

  await mkdir(path.dirname(input.masterPath), { recursive: true });
  await writeFile(input.masterPath, master);

  const encode = (quality: number, width: number) =>
    sharp(master)
      .resize({ width, withoutEnlargement: true, kernel: "lanczos3" })
      .webp({ quality })
      .toBuffer();

  let quality = 82;
  let webWidth = Math.min(WEB_WIDTH, Math.max(1, masterWidth - 1));
  let web = await encode(quality, webWidth);
  while (web.length > WEB_MAX_BYTES && quality > 58) {
    quality -= 4;
    web = await encode(quality, webWidth);
  }
  while (web.length < WEB_MIN_BYTES && quality < 100) {
    quality += 4;
    web = await encode(quality, webWidth);
  }
  while (web.length < WEB_MIN_BYTES && webWidth < Math.min(masterWidth - 1, 2200)) {
    webWidth += 160;
    web = await encode(Math.min(100, quality + 6), webWidth);
  }
  while (web.length > WEB_MAX_BYTES && webWidth > 960) {
    webWidth -= 80;
    web = await encode(quality, webWidth);
  }

  await mkdir(path.dirname(input.webPath), { recursive: true });
  await mkdir(path.dirname(input.publicPath), { recursive: true });
  await mkdir(path.dirname(input.heroPath), { recursive: true });
  await writeFile(input.webPath, web);
  await writeFile(input.publicPath, web);
  await sharp(master)
    .resize({ width: 640, withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 80 })
    .toFile(input.heroPath);

  const webMeta = await sharp(web).metadata();
  return {
    nativeWidth,
    nativeHeight,
    masterWidth,
    masterHeight,
    webWidth: webMeta.width ?? 0,
    webHeight: webMeta.height ?? 0,
    webBytes: web.length,
    is4k: isVerified4k(masterWidth, masterHeight),
    resize: `sharp lanczos3 master=${masterWidth}x${masterHeight} web=${webMeta.width ?? 0}x${webMeta.height ?? 0} q${quality}`,
  };
}
