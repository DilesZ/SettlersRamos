import { existsSync } from 'node:fs';

// Lote 1 bloqueante: sin estos 12 no hay T003 ni build con juego real.
const required = [
  'assets/approved/grass.png',
  'assets/approved/pine.png',
  'assets/approved/leaf_tree.png',
  'assets/approved/log.png',
  'assets/approved/rock.png',
  'assets/approved/road.png',
  'assets/approved/warehouse.png',
  'assets/approved/woodcutter.png',
  'assets/approved/worker_idle.png',
  'assets/approved/worker_carry_log.png',
  'assets/approved/flag.png',
  'assets/approved/_style_master.png'
];

const missing = required.filter((f) => !existsSync(f));
if (missing.length > 0) {
  console.error('ASSET-CHECK FAIL. Faltan (genera con Nano Banana, lote 1):');
  for (const m of missing) console.error(' - ' + m);
  console.error('\nVer assets/NANO_BANANA_BRIEF.md');
  process.exit(1);
}
console.log('ASSET-CHECK OK: lote 1 presente.');
