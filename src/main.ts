import Phaser from 'phaser';
import './style.css';
import { createDemoWorld, tick, World } from './sim/economy';

const TILE = 64;
const TICK = 0.05;

// Decorado fijo (no afecta a la sim): acentos de flores, tierra bajo edificios,
// senderos de tierra del camino a las puertas y estanque en la esquina.
const FLOWERS: Array<[number, number]> = [[6, 1], [9, 2], [2, 5], [11, 3], [8, 1], [5, 3], [13, 4]];
const DIRT: Array<[number, number]> = [
  [4, 6], [5, 6], [7, 6], [10, 6],
  [4, 5], [7, 5], [10, 5],
];
const POND: Array<[number, number]> = [[13, 6], [14, 6], [13, 7], [14, 7]];

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { this.scene.start('Preload'); }
}

class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }
  preload() {
    this.load.atlas('lote1', 'atlas/atlas.png', 'atlas/atlas.json');
  }
  create() { this.scene.start('Game'); }
}

class GameScene extends Phaser.Scene {
  private world!: World;
  private acc = 0;
  private speed = 1;
  private settlerSprites = new Map<number, Phaser.GameObjects.Image>();
  private treeSprites = new Map<string, Phaser.GameObjects.Image>();
  private treeBaseX = new Map<string, number>();
  private chopKey: string | null = null;
  private flagImg!: Phaser.GameObjects.Image;
  private hud!: Phaser.GameObjects.Text;
  private sawBar!: Phaser.GameObjects.Rectangle;
  private chopBar!: Phaser.GameObjects.Rectangle;
  private winText!: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  create() {
    this.world = createDemoWorld();
    const w = this.world;
    // Suelo base
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        const t = w.grid.get(x, y).terrain;
        const frame = t === 'road' ? 'road' : 'grass';
        this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', frame).setDepth(y * 10);
      }
    }
    for (const [x, y] of FLOWERS)
      this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'grass_var').setDepth(y * 10 + 0.5);
    for (const [x, y] of DIRT)
      this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'dirt').setDepth(y * 10 + 0.4);
    for (const [x, y] of POND)
      this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'water').setDepth(y * 10 + 0.6);
    // Rocas
    for (let y = 0; y < w.grid.h; y++)
      for (let x = 0; x < w.grid.w; x++)
        if (w.grid.get(x, y).terrain === 'rock')
          this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'rock').setDepth(y * 10 + 1);
    // Edificios con cartel
    const building = (x: number, y: number, frame: string, name: string) => {
      this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', frame).setDepth(y * 10 + 2);
      this.add.text(x * TILE + 32, y * TILE + 56, name, {
        fontSize: '10px', color: '#fff', backgroundColor: '#00000077',
      }).setOrigin(0.5).setDepth(y * 10 + 3);
    };
    building(w.warehouse.x, w.warehouse.y, 'warehouse', 'ALMACÉN');
    building(w.hut.x, w.hut.y, 'woodcutter', 'LEÑADOR');
    building(w.sawmill.x, w.sawmill.y, 'sawmill', 'SIERRA');
    // Pila de troncos junto a la cabaña + bandera de territorio
    this.add.image(5 * TILE + 32, 6 * TILE + 32, 'lote1', 'log').setDepth(61);
    this.flagImg = this.add.image(w.hut.x * TILE - 40, w.hut.y * TILE + 20, 'lote1', 'flag').setDepth(72);
    // Humo de la sierra
    for (let i = 0; i < 3; i++) {
      const puff = this.add.circle(w.sawmill.x * TILE + 44, w.sawmill.y * TILE + 6, 5, 0xdddddd, 0.55)
        .setDepth(73);
      this.tweens.add({
        targets: puff, y: puff.y - 30, alpha: 0, scale: 1.8,
        duration: 2200, delay: i * 700, repeat: -1,
      });
    }
    // Nubes a la deriva
    for (let i = 0; i < 2; i++) {
      const c = this.add.container(i === 0 ? 200 : 700, 60 + i * 50).setDepth(95);
      const e1 = this.add.ellipse(0, 0, 90, 34, 0xffffff, 0.9);
      const e2 = this.add.ellipse(30, -10, 60, 30, 0xffffff, 0.9);
      const e3 = this.add.ellipse(-32, -6, 54, 26, 0xffffff, 0.9);
      c.add([e1, e2, e3]);
      this.tweens.add({
        targets: c, x: 1050, duration: 90000 + i * 30000, repeat: -1,
        onRepeat: () => c.setX(-100),
      });
    }
    for (const s of w.settlers) {
      const img = this.add.image(s.x * TILE + 32, s.y * TILE + 32, 'lote1', 'worker_idle');
      this.settlerSprites.set(s.id, img);
    }
    this.sawBar = this.add.rectangle(0, 0, 40, 5, 0xffd23f).setDepth(80).setVisible(false);
    this.chopBar = this.add.rectangle(0, 0, 30, 4, 0x7ddf64).setDepth(80).setVisible(false);
    // Barra superior de madera
    this.add.rectangle(0, 0, 960, 42, 0x4a3220).setOrigin(0).setDepth(100);
    this.add.rectangle(0, 42, 960, 3, 0x2e1f14).setOrigin(0).setDepth(100);
    this.add.text(12, 10, '⚒ SETTLERS RAMOS', { fontSize: '17px', color: '#ffd98a' }).setDepth(101);
    this.hud = this.add.text(230, 10, '', { fontSize: '15px', color: '#fff' }).setDepth(101);
    const btn = (x: number, label: string, fn: () => void) => {
      this.add.text(x, 8, label, {
        fontSize: '15px', color: '#ffe08a', backgroundColor: '#00000066', padding: { x: 8, y: 5 },
      }).setDepth(101).setInteractive({ useHandCursor: true }).on('pointerdown', fn);
    };
    btn(836, '❚❚', () => { this.speed = 0; });
    btn(876, '1×', () => { this.speed = 1; });
    btn(916, '2×', () => { this.speed = 2; });
    this.winText = this.add.text(480, 250, '¡VICTORIA!\n10 tablones entregados', {
      fontSize: '36px', color: '#ffe08a', backgroundColor: '#000000cc',
      padding: { x: 24, y: 16 }, align: 'center',
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  update(time: number, delta: number) {
    const w = this.world;
    if (!w.won && this.speed > 0) {
      this.acc += (delta / 1000) * this.speed;
      let guard = 0;
      while (this.acc >= TICK && guard++ < 40 && !w.won) {
        tick(w, TICK);
        this.acc -= TICK;
      }
    }
    // Árboles sincronizados con la rejilla (+ temblor al talar)
    const seen = new Set<string>();
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        if (w.grid.get(x, y).terrain !== 'forest') continue;
        const k = `${x},${y}`;
        seen.add(k);
        if (!this.treeSprites.has(k)) {
          const frame = (x + y) % 2 === 0 ? 'pine' : 'leaf_tree';
          const img = this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', frame)
            .setDepth(y * 10 + 1);
          this.treeSprites.set(k, img);
          this.treeBaseX.set(k, img.x);
        }
      }
    }
    for (const [k, img] of this.treeSprites) {
      if (!seen.has(k)) { img.destroy(); this.treeSprites.delete(k); this.treeBaseX.delete(k); }
    }
    const jack = w.settlers[0];
    const newChopKey = jack.state === 'chopping' && jack.to ? `${jack.to.x},${jack.to.y}` : null;
    if (this.chopKey && this.chopKey !== newChopKey) {
      const prev = this.treeSprites.get(this.chopKey);
      if (prev) prev.x = this.treeBaseX.get(this.chopKey)!;
    }
    this.chopKey = newChopKey;
    if (newChopKey) {
      const t = this.treeSprites.get(newChopKey);
      if (t) t.x = this.treeBaseX.get(newChopKey)! + Math.sin(time * 0.045) * 2.5;
    }
    // Colonos (+ bote al andar)
    for (const s of w.settlers) {
      const img = this.settlerSprites.get(s.id)!;
      const walking = s.path.length > 0;
      const bob = walking ? -Math.abs(Math.sin(time * 0.012 + s.id * 2)) * 3 : 0;
      img.setPosition(s.x * TILE + 32, s.y * TILE + 32 + bob);
      img.setDepth(Math.floor(s.y) * 10 + 3);
      img.setTexture('lote1', s.carry ? 'worker_carry_log' : 'worker_idle');
      img.setFlipX(s.path.length > 0 && s.path[0].x * TILE + 32 < img.x);
    }
    // Bandera ondeando
    this.flagImg.setScale(1 + Math.sin(time * 0.004) * 0.05, 1);
    // Barras de progreso
    if (jack.state === 'chopping') {
      this.chopBar.setVisible(true);
      this.chopBar.setPosition(jack.x * TILE + 32, jack.y * TILE - 6);
      this.chopBar.setScale(Math.max(0.05, jack.timer / 8), 1);
    } else this.chopBar.setVisible(false);
    if (w.sawmill.busy) {
      this.sawBar.setVisible(true);
      this.sawBar.setPosition(w.sawmill.x * TILE + 32, w.sawmill.y * TILE - 12);
      this.sawBar.setScale(Math.max(0.05, w.sawmill.timer / 10), 1);
    } else this.sawBar.setVisible(false);
    const spd = this.speed === 0 ? 'PAUSA' : `${this.speed}×`;
    this.hud.setText(
      `🪵 ${w.hut.logs}   🧱 ${w.warehouse.planks}/10   Sierra: ` +
      `${w.sawmill.busy ? 'cortando…' : w.sawmill.done ? 'lista' : 'parada'}   [${spd}]`,
    );
    if (w.won) this.winText.setVisible(true);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1a2b1a',
  scene: [BootScene, PreloadScene, GameScene],
});
