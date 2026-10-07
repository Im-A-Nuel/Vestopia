import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(process.argv[2] ?? join(here, "..", "..", "..", "asset"));
const outputRoot = join(here, "..", "public", "assets", "artwork");

const ARTWORK = [
  ["Tech/Aaple.jpg", "aapl"],
  ["Tech/nvidia.jpg", "nvda"],
  ["Tech/Microsoft.jpg", "msft"],
  ["Tech/cisco.jpg", "csco"],
  ["Tech/Caterpillar.jpg", "cat"],
  ["main street/amazon.png", "amzn"],
  ["main street/ebay.png", "ebay"],
  ["main street/gamestop.png", "gme"],
  ["main street/Homedepot.png", "hd"],
  ["main street/macd.png", "mcd"],
  ["main street/nike.png", "nke"],
  ["main street/starbucks.png", "sbux"],
  ["main street/tsla.png", "tsla"],
  ["Media Row/disney.png", "dis"],
  ["Media Row/google.png", "googl"],
  ["Media Row/Meta.png", "meta"],
  ["Media Row/netflix.png", "nflx"],
  ["Media Row/reddit.png", "rddt"],
  ["Media Row/spotify.png", "spot"],
  ["Media Row/verizon.png", "vz"],
  ["Consumer Goods/Walmart.jpg", "wmt"],
  ["Harvestvaley/cocacola.png", "ko"],
  ["Harvestvaley/Isometric Farm Warehouse Club.png", "cost"],
];

const LOT_SIZE = 384;
const ICON_SIZE = 64;
const SATURATION_LIMIT = 16;
const TONE_MARGIN = 18;

const saturation = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

const backgroundTones = (data, width, height) => {
  const counts = new Map();
  const sample = (x, y) => {
    const i = (y * width + x) * 4;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (saturation(r, g, b) > SATURATION_LIMIT) return;
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (let x = 0; x < width; x += 1) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    sample(0, y);
    sample(width - 1, y);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => key.split(",").map((value) => Number(value) * 8 + 4));
};

const removeCheckerboard = (data, width, height) => {
  const levels = backgroundTones(data, width, height).map(([r, g, b]) => (r + g + b) / 3);
  const low = Math.min(...levels) - TONE_MARGIN;
  const high = Math.max(...levels) + TONE_MARGIN;
  const isBackground = (i) => {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (data[i + 3] === 0) return true;
    if (saturation(r, g, b) > SATURATION_LIMIT) return false;
    return Math.min(r, g, b) >= low && Math.max(r, g, b) <= high;
  };
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (x, y) => {
    const index = y * width + x;
    if (visited[index]) return;
    visited[index] = 1;
    if (!isBackground(index * 4)) return;
    queue[tail] = index;
    tail += 1;
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
};

const hasRealTransparency = (data) => {
  for (let i = 3; i < data.length; i += 4 * 97) if (data[i] < 250) return true;
  return false;
};

const processArtwork = async ([relativePath, id]) => {
  const { data, info } = await sharp(join(sourceRoot, relativePath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (!hasRealTransparency(data)) removeCheckerboard(data, info.width, info.height);

  const cleaned = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
  const trimmed = await sharp(await cleaned.toBuffer())
    .trim({ threshold: 1 })
    .toBuffer();

  await sharp(trimmed)
    .resize(LOT_SIZE, LOT_SIZE, { fit: "contain", position: "bottom", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(join(outputRoot, `${id}.webp`));

  await sharp(trimmed)
    .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, effort: 6 })
    .toFile(join(outputRoot, "icons", `${id}.webp`));
};

mkdirSync(join(outputRoot, "icons"), { recursive: true });
for (const entry of ARTWORK) await processArtwork(entry);
process.stdout.write(`imported ${ARTWORK.length} artworks from ${sourceRoot}\n`);
