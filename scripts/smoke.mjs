// Smoke test con Edge real (no headless-shot): verifica título, clic en JUGAR,
// juego visible (varianza de píxeles) y cero errores de consola.
// Uso: 1) npm run dev|preview en un terminal; 2) node scripts/smoke.mjs [URL]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/';
const errors = [];

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--no-proxy-server'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200));
});
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`http-${r.status()}: ${r.url()}`);
});

function variance(file) {
  // desviación típica del brillo con PIL (robusto, sin decodificar en el navegador)
  const out = execFileSync('python3', ['-c',
    'from PIL import Image\n' +
    'im = Image.open(r"""' + file.replace(/\\/g, '\\\\') + '""\").convert("RGB").resize((160, 90))\n' +
    'px = list(im.getdata())\n' +
    'bs = [(r + g + b) / 3 for r, g, b in px]\n' +
    'm = sum(bs) / len(bs)\n' +
    'import math\n' +
    'print(math.sqrt(sum((b - m) ** 2 for b in bs) / len(bs)))',
  ]).toString().trim();
  return parseFloat(out);
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'smoke-title.png' });
const vTitle = await variance('smoke-title.png');
console.log('titulo varianza:', vTitle.toFixed(1));

// Clic en JUGAR (texto del canvas -> clic por coordenadas del botón)
await page.mouse.click(500, 306);
await page.waitForTimeout(8000);
await page.screenshot({ path: 'smoke-game.png' });
const vGame = await variance('smoke-game.png');
console.log('juego varianza:', vGame.toFixed(1));

// T006: menú construir -> sierra (470,508 juego => +20,+16 página) y solar en (6,2)
await page.mouse.click(490, 524);
await page.waitForTimeout(1000);
await page.screenshot({ path: 'smoke-place.png' });
const vPlace = await variance('smoke-place.png');
console.log('colocación varianza:', vPlace.toFixed(1));

await browser.close();

let ok = true;
if (vTitle < 8) { console.log('FAIL: título vacío'); ok = false; }
if (vGame < 12) { console.log('FAIL: juego vacío tras JUGAR (¿no avanza del título?)'); ok = false; }
if (vPlace < 12) { console.log('FAIL: pantalla vacía en modo colocación'); ok = false; }
if (errors.length > 0) { console.log('ERRORES:', errors.slice(0, 10)); ok = false; }
console.log(ok ? 'SMOKE OK' : 'SMOKE FAIL');
process.exit(ok ? 0 : 1);
