import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const sourceSvgPath = resolve(publicDir, "icon-source.svg");

const sizes = [
  { name: "pwa-192x192.png", size: 192, maskable: false },
  { name: "pwa-512x512.png", size: 512, maskable: false },
  { name: "pwa-maskable-512x512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
  { name: "favicon-32x32.png", size: 32, maskable: false },
  { name: "favicon-16x16.png", size: 16, maskable: false },
];

// Maskable icons get cropped by the OS into circles, squircles, etc., so we
// extend the brand background across the full bleed area and shrink the logo
// to the safe zone. Background matches icon-source.svg's gradient start.
const maskableSvgWrap = (innerSvg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b160c"/>
  <g transform="translate(64 64) scale(0.75)">
    ${innerSvg}
  </g>
</svg>`;

async function main() {
  await mkdir(publicDir, { recursive: true });
  const svg = await readFile(sourceSvgPath, "utf8");
  const innerSvg = svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

  for (const { name, size, maskable } of sizes) {
    const input = maskable ? Buffer.from(maskableSvgWrap(innerSvg)) : Buffer.from(svg);
    const target = resolve(publicDir, name);
    await sharp(input, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(target);
    console.log(`generated ${name}`);
  }

  // Favicon as ICO-compatible 48x48 PNG (browsers accept PNG favicons).
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(48, 48)
    .png()
    .toFile(resolve(publicDir, "favicon.png"));
  console.log("generated favicon.png");

  console.log("All PWA icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
