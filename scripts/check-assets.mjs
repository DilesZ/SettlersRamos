import { existsSync } from 'node:fs';

// Lote UH-iso (migración desde Kenney): 24 sprites + tablero. Regenera con python scripts/curate-uh.py.
const required = [
  'assets/approved/grass.png',
  'assets/approved/grass_var.png',
  'assets/approved/water.png',
  'assets/approved/road.png',
  'assets/approved/pine.png',
  'assets/approved/leaf_tree.png',
  'assets/approved/stump.png',
  'assets/approved/rock.png',
  'assets/approved/warehouse.png',
  'assets/approved/hut.png',
  'assets/approved/hut_logs1.png',
  'assets/approved/hut_logs2.png',
  'assets/approved/sawmill.png',
  'assets/approved/lj_idle.png',
  'assets/approved/lj_walk1.png',
  'assets/approved/lj_walk2.png',
  'assets/approved/lj_walk3.png',
  'assets/approved/lj_walk4.png',
  'assets/approved/lj_carry1.png',
  'assets/approved/lj_carry2.png',
  'assets/approved/lj_carry3.png',
  'assets/approved/lj_carry4.png',
  'assets/approved/lj_work.png',
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
