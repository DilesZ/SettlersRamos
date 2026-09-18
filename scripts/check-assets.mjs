import { existsSync } from 'node:fs';

// Lote 1+ bloqueante (T002b + V1 visual): 16 ficheros.
const required = [
  'assets/approved/grass.png',
  'assets/approved/grass_var.png',
  'assets/approved/dirt.png',
  'assets/approved/water.png',
  'assets/approved/pine.png',
  'assets/approved/leaf_tree.png',
  'assets/approved/log.png',
  'assets/approved/rock.png',
  'assets/approved/road.png',
  'assets/approved/warehouse.png',
  'assets/approved/woodcutter.png',
  'assets/approved/sawmill.png',
  'assets/approved/worker_idle.png',
  'assets/approved/worker_carry_log.png',
  'assets/approved/flag.png',
  'assets/approved/_style_master.png'
];

const missing = required.filter((f) => !existsSync(f));
if (missing.length > 0) {
  console.error('ASSET-CHECK FAIL. Faltan (regenera con python scripts/curate-cc0.py):');
  for (const m of missing) console.error(' - ' + m);
  console.error('\nVer scripts/curate-cc0.py y assets/NANO_BANANA_BRIEF.md');
  process.exit(1);
}
console.log('ASSET-CHECK OK: lote 1+ presente.');
