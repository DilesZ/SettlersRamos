import Phaser from 'phaser';
import './style.css';
import { createDemoWorld, tick, World } from './sim/economy';

const TILE = 64;
const TICK = 0.05;

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
  private hud!: Phaser.GameObjects.Text;
  private sawBar!: Phaser.GameObjects.Rectangle;
  private chopBar!: Phaser.GameObjects.Rectangle;
  private winText!: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  create() {
    this.world = createDemoWorld();
    const w = this.world;
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        const t = w.grid.get(x, y).terrain;
        const frame = t === 'road' ? 'road' : 'grass';
        this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', frame).setDepth(y * 10);
      }
    }
    // Rocas fijas
    for (let y = 0; y < w.grid.h; y++)
      for (let x = 0; x < w.grid.w; x++)
        if (w.grid.get(x, y).terrain === 'rock')
          this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'rock').setDepth(y * 10 + 1);
    // Edificios
    this.add.image(w.warehouse.x * TILE + 32, w.warehouse.y * TILE + 32, 'lote1', 'warehouse').setDepth(70);
    this.add.image(w.hut.x * TILE + 32, w.hut.y * TILE + 32, 'lote1', 'woodcutter').setDepth(70);
    this.add.image(w.sawmill.x * TILE + 32, w.sawmill.y * TILE + 32, 'lote1', 'woodcutter')
      .setDepth(70).setTint(0xd99055);
    this.add.text(w.sawmill.x * TILE + 32, w.sawmill.y * TILE + 58, 'SIERRA', {
      fontSize: '10px', color: '#fff', backgroundColor: '#00000088',
    }).setOrigin(0.5).setDepth(71);
    this.add.image(w.hut.x * TILE - 40, w.hut.y * TILE + 20, 'lote1', 'flag').setDepth(71);
    for (const s of w.settlers) {
      const img = this.add.image(s.x * TILE + 32, s.y * TILE + 32, 'lote1', 'worker_idle');
      this.settlerSprites.set(s.id, img);
    }
    this.sawBar = this.add.rectangle(0, 0, 40, 5, 0xffd23f).setDepth(80).setVisible(false);
    this.chopBar = this.add.rectangle(0, 0, 30, 4, 0x7ddf64).setDepth(80).setVisible(false);
    this.hud = this.add.text(8, 8, '', {
      fontSize: '15px', color: '#fff', backgroundColor: '#000000aa', padding: { x: 8, y: 6 },
    }).setDepth(100);
    const btn = (x: number, label: string, fn: () => void) => {
      this.add.text(x, 8, label, {
        fontSize: '15px', color: '#ffe08a', backgroundColor: '#000000aa', padding: { x: 8, y: 6 },
      }).setDepth(100).setInteractive({ useHandCursor: true }).on('pointerdown', fn);
    };
    btn(830, '❚❚', () => { this.speed = 0; });
    btn(872, '1×', () => { this.speed = 1; });
    btn(912, '2×', () => { this.speed = 2; });
    this.winText = this.add.text(480, 250, '¡VICTORIA!\n10 tablones entregados', {
      fontSize: '36px', color: '#ffe08a', backgroundColor: '#000000cc',
      padding: { x: 24, y: 16 }, align: 'center',
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  update(_time: number, delta: number) {
    const w = this.world;
    if (!w.won && this.speed > 0) {
      this.acc += (delta / 1000) * this.speed;
      let guard = 0;
      while (this.acc >= TICK && guard++ < 40 && !w.won) {
        tick(w, TICK);
        this.acc -= TICK;
      }
    }
    // Árboles: sincroniza sprites con la rejilla
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
        }
      }
    }
    for (const [k, img] of this.treeSprites) {
      if (!seen.has(k)) { img.destroy(); this.treeSprites.delete(k); }
    }
    // Colonos
    for (const s of w.settlers) {
      const img = this.settlerSprites.get(s.id)!;
      img.setPosition(s.x * TILE + 32, s.y * TILE + 32);
      img.setDepth(Math.floor(s.y) * 10 + 2);
      img.setTexture('lote1', s.carry ? 'worker_carry_log' : 'worker_idle');
      img.setFlipX(s.path.length > 0 && s.path[0].x * TILE + 32 < img.x);
    }
    // Barra de tala sobre el leñador
    const jack = w.settlers[0];
    if (jack.state === 'chopping') {
      this.chopBar.setVisible(true);
      this.chopBar.setPosition(jack.x * TILE + 32, jack.y * TILE - 6);
      this.chopBar.setScale(Math.max(0.05, jack.timer / 8), 1);
    } else this.chopBar.setVisible(false);
    // Barra de aserradero
    if (w.sawmill.busy) {
      this.sawBar.setVisible(true);
      this.sawBar.setPosition(w.sawmill.x * TILE + 32, w.sawmill.y * TILE - 10);
      this.sawBar.setScale(Math.max(0.05, w.sawmill.timer / 10), 1);
    } else this.sawBar.setVisible(false);
    const spd = this.speed === 0 ? 'PAUSA' : `${this.speed}×`;
    this.hud.setText(
      `Troncos: ${w.hut.logs}   Tablones: ${w.warehouse.planks}/10   Sierra: ` +
      `${w.sawmill.busy ? 'cortando…' : w.sawmill.done ? 'listo' : 'parada'}   [${spd}]`,
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
