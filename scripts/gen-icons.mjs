// Gera os ícones do PWA a partir de scripts/icon.svg.  Uso: node scripts/gen-icons.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const svg = readFileSync(join(here, 'icon.svg'));

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  await sharp(svg).resize(t.size, t.size).png().toFile(join(pub, t.name));
  console.log('✓', t.name);
}

// Maskable: mesmo desenho com margem de segurança (safe zone) — o fundo já preenche tudo.
await sharp(svg).resize(512, 512).png().toFile(join(pub, 'icon-maskable-512.png'));
console.log('✓ icon-maskable-512.png');
