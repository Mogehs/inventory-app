// Generates iOS app icon sizes into Images.xcassets/AppIcon.appiconset from assets/icon.png
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'assets', 'icon.png');
const appIconSet = path.join(
  projectRoot,
  'ios',
  'InventoryApp',
  'Images.xcassets',
  'AppIcon.appiconset',
);
const contentsPath = path.join(appIconSet, 'Contents.json');

const icons = [
  { size: 20, scales: [2, 3], idiom: 'iphone' },
  { size: 29, scales: [2, 3], idiom: 'iphone' },
  { size: 40, scales: [2, 3], idiom: 'iphone' },
  { size: 60, scales: [2, 3], idiom: 'iphone' },
  { size: 1024, scales: [1], idiom: 'ios-marketing' },
];

async function run() {
  if (!fs.existsSync(source)) {
    console.error('Source icon not found', source);
    process.exit(1);
  }
  if (!fs.existsSync(appIconSet)) {
    console.error('AppIcon.appiconset not found', appIconSet);
    process.exit(1);
  }

  const images = [];
  for (const icon of icons) {
    for (const scale of icon.scales) {
      const px = icon.size * scale;
      const name = `icon_${icon.size}x${icon.size}@${scale}x.png`;
      const out = path.join(appIconSet, name);
      await sharp(source).resize(px, px).png().toFile(out);
      images.push({
        idiom: icon.idiom,
        size: `${icon.size}x${icon.size}`,
        scale: `${scale}x`,
        filename: name,
      });
      console.log('Wrote', out);
    }
  }

  const contents = { images, info: { author: 'xcode', version: 1 } };
  fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));
  console.log('Updated Contents.json');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
