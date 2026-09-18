import { existsSync, readFileSync } from 'node:fs';

// El lote lo define scripts/curate-uh.py vía assets/approved/MANIFEST.txt.
// Sin lote completo no hay build con juego real.
const manifest = 'assets/approved/MANIFEST.txt';
if (!existsSync(manifest)) {
  console.error('ASSET-CHECK FAIL: falta MANIFEST.txt. Regenera con python scripts/curate-uh.py');
  process.exit(1);
}
const required = readFileSync(manifest, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('_states:'))
  .map((s) => `assets/approved/${s}.png`);
required.push('assets/approved/_style_master.png');

const missing = required.filter((f) => !existsSync(f));
if (missing.length > 0) {
  console.error('ASSET-CHECK FAIL. Faltan:');
  for (const m of missing) console.error(' - ' + m);
  console.error('\nRegenera con python scripts/curate-uh.py');
  process.exit(1);
}
console.log(`ASSET-CHECK OK: lote UH-iso presente (${required.length} ficheros).`);
