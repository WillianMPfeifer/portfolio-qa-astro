import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('src/assets/og-image.svg');

await sharp(svg).resize(1200, 630).png().toFile('public/og-image.png');

console.log('Wrote public/og-image.png');
