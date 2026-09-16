// 'sharp' não está declarado em package.json de propósito: resolve como dependência
// transitiva do próprio tooling de imagens do Astro. Se a árvore de deps do Astro
// mudar, isso pode passar a falhar com ERR_MODULE_NOT_FOUND.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('src/assets/og-image.svg');

await sharp(svg).resize(1200, 630).png().toFile('public/og-image.png');

console.log('Wrote public/og-image.png');
