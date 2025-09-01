// Generates Android mipmap icons from assets/icon.png using sharp
// Usage: node scripts/generate-android-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'assets', 'icon.png');
const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

const targets = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function run() {
  if (!fs.existsSync(source)) {
    console.error('Source icon not found at', source);
    process.exit(1);
  }

  for (const t of targets) {
    const outDir = path.join(resDir, t.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'ic_launcher.png');
    const outRound = path.join(outDir, 'ic_launcher_round.png');

    await sharp(source)
      .resize(t.size, t.size, { fit: 'contain' })
      .toFile(outFile);

    // For round, we'll center-crop to a circle by creating a rounded mask
    const circle = Buffer.from(
      `<svg><rect x="0" y="0" width="${t.size}" height="${t.size}" rx="${
        t.size / 2
      }" ry="${t.size / 2}"/></svg>`,
    );

    await sharp(source)
      .resize(t.size, t.size)
      .composite([{ input: circle, blend: 'dest-in' }])
      .png()
      .toFile(outRound);

    console.log('Wrote', outFile, 'and', outRound);
  }
  console.log('Done generating Android mipmap icons');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
