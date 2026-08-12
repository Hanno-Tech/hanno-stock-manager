// Gera a marca e os ícones do PWA a partir de public/new-logo.png.
// Uso: node scripts/gen-icons.mjs
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const SRC = join(pub, 'new-logo.png');

/**
 * Caixa do caminhão na arte (1536x1024). O x vem dos pixels de amarelo forte;
 * o bottom é 635 e não a borda da arte porque logo abaixo começa o wordmark
 * "DOCA", que num ícone quadrado entraria cortado.
 */
const TRUCK = { left: 412, top: 169, right: 1149, bottom: 635 };
/** Folga puxada da própria arte, para não perder o glow em volta do caminhão. */
const GLOW = 100;
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

const crop = {
  left: TRUCK.left - GLOW,
  top: TRUCK.top - GLOW,
  width: TRUCK.right - TRUCK.left + GLOW * 2,
  height: TRUCK.bottom - (TRUCK.top - GLOW), // sem folga embaixo: lá está o wordmark
};

/**
 * Compõe o caminhão centrado num quadrado preto.
 *
 * O quadrado é montado com `extend` em vez de extraído da arte: o caminhão é
 * bem mais largo que alto, então um quadrado tirado da imagem original
 * alcançaria o wordmark embaixo (ou estouraria o topo).
 * `pad` é a folga extra — o maskable precisa de mais, porque o Android pode
 * cortar até ~20% de cada borda.
 */
async function squareAroundTruck(pad) {
  const side = crop.width + pad * 2;
  const vertical = side - crop.height;
  const top = Math.floor(vertical / 2);

  // Materializa o quadrado antes de redimensionar: no pipeline do sharp o
  // `extend` roda DEPOIS do `resize`, então encadear os dois devolveria uma
  // imagem retangular.
  return sharp(SRC)
    .extract(crop)
    .extend({
      top,
      bottom: vertical - top, // absorve o ímpar, garantindo lado exato
      left: pad,
      right: pad,
      background: BLACK,
    })
    .flatten({ background: BLACK })
    .png()
    .toBuffer();
}

const targets = [
  { name: 'logo-mark.png', size: 512, pad: 0 },
  { name: 'icon-192.png', size: 192, pad: 0 },
  { name: 'icon-512.png', size: 512, pad: 0 },
  { name: 'apple-touch-icon.png', size: 180, pad: 0 },
  { name: 'icon-maskable-512.png', size: 512, pad: 130 },
];

for (const t of targets) {
  const square = await squareAroundTruck(t.pad);
  await sharp(square).resize(t.size, t.size).png().toFile(join(pub, t.name));
  console.log('✓', t.name);
}
