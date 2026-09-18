import Phaser from 'phaser';
import './style.css';
import { createDemoWorld, tick, World, BUILD_TIME } from './sim/economy';
import { ATLAS_META } from './view/atlasMeta';

const TW = 64;
const TH = 32;
const OX = 310;
const OY = 70;
const TICK = 0.05;

function iso(x: number, y: number): { sx: number; sy: number } {
  return { sx: OX + (x - y) * (TW / 2), sy: OY + (x + y) * (TH / 2) };
}

function footprintCenter(cells: Array<{ x: number; y: number }>): { x: number; y: number } {
  return {
    x: cells.reduce((a, c) => a + c.x, 0) / cells.length,
    y: cells.reduce((a, c) => a + c.y, 0) / cells.length,
  };
}

// Ángulo en pantalla (0° = este, 90° = sur) -> rotación UH (verificada en contact sheet).
function rotFor(dx: number, dy: number): string {
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'r180';
  if (a < 67.5) return 'r135';
  if (a < 112.5) return 'r270';
  if (a < 157.5) return 'r225';
  if (a < 202.5) return 'r0';
  if (a < 247.5) return 'r315';
  if (a < 292.5) return 'r90';
  return 'r45';
}

const SHROOMS: Array<[number, number]> = [[6, 3], [12, 5], [2, 6]];
const POSTS: Array<[number, number]> = [[3, 2], [7, 1], [11, 2], [12, 5], [8, 7], [3, 7]];
const GRASS_TINTS = [0xffffff, 0xf4ffea, 0xeafbdc, 0xfdffef];

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { this.scene.start('Preload'); }
}

class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }
  preload() {
    this.load.atlas('uh', 'atlas/atlas.png', 'atlas/atlas.json');
    this.load.audio('sfx-chop', 'sfx/chop.ogg');
    this.load.audio('sfx-click', 'sfx/click.ogg');
    this.load.audio('sfx-thud', 'sfx/thud.ogg');
    this.load.audio('sfx-plank', 'sfx/plank.ogg');
    this.load.audio('sfx-victory', 'sfx/victory.ogg');
  }
  create() { this.scene.start('Game'); }
}

class GameScene extends Phaser.Scene {
  private world!: World;
  private acc = 0;
  private speed = 1;
  private muted = false;
  private settlerSprites = new Map<number, Phaser.GameObjects.Image>();
  private settlerRot = new Map<number, string>();
  private treeSprites = new Map<string, Phaser.GameObjects.Image>();
  private treeBaseX = new Map<string, number>();
  private stumpSprites = new Map<string, Phaser.GameObjects.Image>();
  private chopKey: string | null = null;
  private hutImg!: Phaser.GameObjects.Image;
  private hutFrame = '';
  private siteImgs = new Map<string, Phaser.GameObjects.Image>();
  private siteBars = new Map<string, Phaser.GameObjects.Rectangle>();
  private flagImg!: Phaser.GameObjects.Image;
  private hud!: Phaser.GameObjects.Text;
  private sawBar!: Phaser.GameObjects.Rectangle;
  private chopBar!: Phaser.GameObjects.Rectangle;
  private winText!: Phaser.GameObjects.Text;
  private mm!: Phaser.GameObjects.Graphics;
  private mmTimer = 0;
  private panel!: Phaser.GameObjects.Container;
  private panelTitle!: Phaser.GameObjects.Text;
  private panelBody!: Phaser.GameObjects.Text;
  private panelTimer = 0;
  // estado previo para eventos de sonido/partículas
  private prevPlanks = 0;
  private prevStumps = 0;
  private prevBuilt = '';
  private chopSndAt = 0;

  constructor() { super('Game'); }

  private put(frame: string, x: number, y: number, depth: number): Phaser.GameObjects.Image {
    const m = ATLAS_META[frame];
    const { sx, sy } = iso(x, y);
    return this.add.image(sx, sy, 'uh', frame)
      .setOrigin(m.ax / m.w, m.ay / m.h)
      .setDepth(depth);
  }

  private sfx(key: string, volume = 1): void {
    if (this.muted) return;
    try { this.sound.play(key, { volume }); } catch { /* audio aún bloqueado */ }
  }

  private burst(x: number, y: number, color: number, n = 6): void {
    for (let i = 0; i < n; i++) {
      const c = this.add.circle(x, y, 2 + Math.random() * 2, color, 0.9)
        .setDepth(450);
      const ang = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 18;
      this.tweens.add({
        targets: c, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist - 10,
        alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => c.destroy(),
      });
    }
  }

  create() {
    this.world = createDemoWorld();
    const w = this.world;
    // Cámara RTS: zoom inicial + drag + rueda
    const cam = this.cameras.main;
    cam.setZoom(1.3);
    cam.centerOn(422, 235);
    let dragX = 0;
    let dragY = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { dragX = p.x; dragY = p.y; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown && !p.rightButtonDown()) {
        cam.scrollX = Phaser.Math.Clamp(cam.scrollX - (p.x - dragX) / cam.zoom, -120, 340);
        cam.scrollY = Phaser.Math.Clamp(cam.scrollY - (p.y - dragY) / cam.zoom, -80, 220);
      }
      dragX = p.x; dragY = p.y;
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, 1.0, 2.0));
    });
    // Suelo con variación de tinte determinista
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        const t = w.grid.get(x, y).terrain;
        const frame = t === 'road' ? 'road' : t === 'water' ? 'water' : t === 'rock' ? 'grass' : 'grass';
        const img = this.put(frame, x, y, (x + y) * 10);
        if (frame === 'grass') img.setTint(GRASS_TINTS[(x * 7 + y * 13) % GRASS_TINTS.length]);
        if (t === 'water') {
          this.tweens.add({ targets: img, alpha: 0.88, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        if (t === 'rock') this.put((x + y) % 2 === 0 ? 'rock' : 'rock2', x, y, (x + y) * 10 + 1);
      }
    }
    for (const [x, y] of SHROOMS) this.put('mushroom', x, y, (x + y) * 10 + 1);
    // Postes de territorio
    for (const [x, y] of POSTS) {
      const { sx, sy } = iso(x, y);
      this.add.rectangle(sx, sy - 8, 4, 14, 0x6b4a26).setDepth((x + y) * 10 + 1);
      this.add.triangle(sx, sy - 18, 0, 6, 8, 6, 4, 0, 0xb33a2e).setDepth((x + y) * 10 + 1);
    }
    // Edificios clicables
    const hc = footprintCenter(w.hut.cells);
    this.hutImg = this.put('hut', hc.x, hc.y, (hc.x + hc.y) * 10 + 3);
    this.hutFrame = 'hut';
    this.hutImg.setInteractive({ useHandCursor: true });
    this.hutImg.on('pointerdown', () => this.showPanel('Cabaña del leñador',
      () => `Troncos en stock: ${w.hut.logs}`));
    for (const b of [w.sawmill, w.warehouse]) {
      const c = footprintCenter(b.cells);
      const img = this.put('scaffold', c.x, c.y, (c.x + c.y) * 10 + 3);
      this.siteImgs.set(b.kind, img);
      const p = iso(c.x, c.y);
      const bar = this.add.rectangle(p.sx, p.sy - 84, 44, 5, 0xffd23f).setDepth(480);
      this.siteBars.set(b.kind, bar);
      img.setInteractive({ useHandCursor: true });
      const title = b.kind === 'sawmill' ? 'Sierra' : 'Almacén';
      img.on('pointerdown', () => this.showPanel(title, () => this.buildingInfo(b.kind)));
    }
    const tag = (x: number, y: number, name: string) => {
      const { sx, sy } = iso(x, y);
      this.add.text(sx, sy + 26, name, {
        fontSize: '11px', color: '#fff', backgroundColor: '#00000077',
      }).setOrigin(0.5).setDepth(490);
    };
    tag(hc.x, hc.y, 'LEÑADOR');
    const sc0 = footprintCenter(w.sawmill.cells);
    const wc0 = footprintCenter(w.warehouse.cells);
    tag(sc0.x, sc0.y, 'SIERRA');
    tag(wc0.x, wc0.y, 'ALMACÉN');
    this.flagImg = this.put('flag', 3.4, 6.1, 200);
    // Humo de la sierra
    const smoke = iso(sc0.x + 0.35, sc0.y - 0.15);
    for (let i = 0; i < 3; i++) {
      const puff = this.add.circle(smoke.sx, smoke.sy - 52, 5, 0xe8e8e8, 0.5).setDepth(400);
      this.tweens.add({
        targets: puff, y: puff.y - 30, alpha: 0, scale: 1.8,
        duration: 2200, delay: i * 700, repeat: -1,
      });
    }
    // Nubes
    for (let i = 0; i < 2; i++) {
      const c = this.add.container(i === 0 ? 200 : 700, 50 + i * 40).setDepth(490);
      c.add([
        this.add.ellipse(0, 0, 90, 30, 0xffffff, 0.85),
        this.add.ellipse(28, -9, 56, 26, 0xffffff, 0.85),
        this.add.ellipse(-30, -5, 50, 22, 0xffffff, 0.85),
      ]);
      this.tweens.add({
        targets: c, x: 1050, duration: 90000 + i * 30000, repeat: -1,
        onRepeat: () => c.setX(-100),
      });
    }
    for (const s of w.settlers) {
      const { sx, sy } = iso(s.x, s.y);
      const m = ATLAS_META['lj_idle_r135'];
      const img = this.add.image(sx, sy, 'uh', 'lj_idle_r135')
        .setOrigin(m.ax / m.w, m.ay / m.h);
      this.settlerSprites.set(s.id, img);
      this.settlerRot.set(s.id, 'r135');
    }
    this.sawBar = this.add.rectangle(0, 0, 40, 5, 0xffd23f).setDepth(480).setVisible(false);
    this.chopBar = this.add.rectangle(0, 0, 30, 4, 0x7ddf64).setDepth(480).setVisible(false);
    // HUD fijo (no sigue a la cámara)
    const fix = (o: Phaser.GameObjects.GameObject) => (o as Phaser.GameObjects.Image).setScrollFactor(0);
    const bar = this.add.rectangle(0, 0, 960, 42, 0x4a3220).setOrigin(0).setDepth(500);
    const bar2 = this.add.rectangle(0, 42, 960, 3, 0x2e1f14).setOrigin(0).setDepth(500);
    const title = this.add.text(12, 10, '⚒ SETTLERS RAMOS · iso UH', { fontSize: '17px', color: '#ffd98a' }).setDepth(501);
    this.hud = this.add.text(330, 10, '', { fontSize: '15px', color: '#fff' }).setDepth(501);
    for (const o of [bar, bar2, title, this.hud]) fix(o);
    const btn = (x: number, label: string, fn: () => void) => {
      const t = this.add.text(x, 8, label, {
        fontSize: '15px', color: '#ffe08a', backgroundColor: '#00000066', padding: { x: 8, y: 5 },
      }).setDepth(501).setInteractive({ useHandCursor: true }).setScrollFactor(0)
        .on('pointerdown', () => { this.sfx('sfx-click', 0.5); fn(); });
      return t;
    };
    const muteBtn = btn(740, '🔊', () => {
      this.muted = !this.muted;
      muteBtn.setText(this.muted ? '🔇' : '🔊');
      if (!this.muted) this.sfx('sfx-click', 0.5);
    });
    btn(786, '❚❚', () => { this.speed = 0; });
    btn(826, '1×', () => { this.speed = 1; });
    btn(876, '2×', () => { this.speed = 2; });
    this.input.keyboard?.on('keydown-M', () => { this.muted = !this.muted; });
    // Minimapa
    this.add.rectangle(828, 440, 124, 68, 0x000000, 0.55).setDepth(501).setScrollFactor(0);
    this.mm = this.add.graphics().setDepth(502).setScrollFactor(0);
    const mmZone = this.add.zone(830, 442, 120, 64).setOrigin(0).setDepth(503)
      .setScrollFactor(0).setInteractive({ useHandCursor: true });
    mmZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cx = Math.floor((p.x - 830) / 8);
      const cy = Math.floor((p.y - 442) / 8);
      if (cx < 0 || cy < 0 || cx >= w.grid.w || cy >= w.grid.h) return;
      const { sx, sy } = iso(cx, cy);
      cam.centerOn(sx, sy);
      this.sfx('sfx-click', 0.4);
    });
    // Panel de edificio
    this.panelTitle = this.add.text(16, 470, '', { fontSize: '15px', color: '#ffd98a' }).setDepth(502).setScrollFactor(0);
    this.panelBody = this.add.text(16, 492, '', { fontSize: '13px', color: '#fff' }).setDepth(502).setScrollFactor(0);
    const panelBg = this.add.rectangle(8, 462, 300, 70, 0x000000, 0.6).setOrigin(0).setDepth(501).setScrollFactor(0);
    this.panel = this.add.container(0, 0, [panelBg, this.panelTitle, this.panelBody]).setDepth(501).setScrollFactor(0).setVisible(false);
    this.winText = this.add.text(480, 250, '¡VICTORIA!\n10 tablones entregados', {
      fontSize: '36px', color: '#ffe08a', backgroundColor: '#000000cc',
      padding: { x: 24, y: 16 }, align: 'center',
    }).setOrigin(0.5).setDepth(600).setScrollFactor(0).setVisible(false);
  }

  private buildingInfo(kind: string): string {
    const w = this.world;
    const b = kind === 'sawmill' ? w.sawmill : w.warehouse;
    if (!b.built) {
      return b.constructing
        ? `En obra… ${Math.ceil(b.buildTimer)} s restantes`
        : `Solar: faltan ${b.needLogs - b.gotLogs} troncos`;
    }
    if (kind === 'sawmill') {
      return w.sawmill.busy ? 'Cortando tablón…' : w.sawmill.done ? 'Tablón listo para recoger' : 'Esperando troncos';
    }
    return `Tablones: ${w.warehouse.planks}/10`;
  }

  private showPanel(title: string, body: () => string): void {
    this.panelTitle.setText(title);
    this.panelBody.setText(body());
    this.panel.setVisible(true);
    this.panelTimer = 8;
    this.sfx('sfx-click', 0.4);
  }

  private drawMinimap(): void {
    const w = this.world;
    const g = this.mm;
    g.clear();
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        const c = w.grid.get(x, y);
        let col = 0x5a8f3e;
        if (c.terrain === 'road') col = 0xb08d57;
        else if (c.terrain === 'water') col = 0x5aa3c8;
        else if (c.terrain === 'forest') col = 0x2f6b2f;
        else if (c.terrain === 'rock') col = 0x9a9a9a;
        if (c.building) col = 0xc46a2e;
        g.fillStyle(col, 1);
        g.fillRect(830 + x * 8, 442 + y * 8, 8, 8);
      }
    }
    for (const s of w.settlers) {
      g.fillStyle(s.carry ? 0xffe08a : 0xffffff, 1);
      g.fillCircle(830 + s.x * 8 + 4, 442 + s.y * 8 + 4, 2.5);
    }
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
    // Árboles + tocones
    const seen = new Set<string>();
    for (let y = 0; y < w.grid.h; y++) {
      for (let x = 0; x < w.grid.w; x++) {
        if (w.grid.get(x, y).terrain !== 'forest') continue;
        const k = `${x},${y}`;
        seen.add(k);
        if (!this.treeSprites.has(k)) {
          const frame = (x + y) % 2 === 0 ? 'pine' : 'leaf_tree';
          const img = this.put(frame, x, y, (x + y) * 10 + 2);
          this.treeSprites.set(k, img);
          this.treeBaseX.set(k, img.x);
        }
      }
    }
    for (const [k, img] of this.treeSprites) {
      if (!seen.has(k)) { img.destroy(); this.treeSprites.delete(k); this.treeBaseX.delete(k); }
    }
    const seenStumps = new Set<string>();
    for (const t of w.stumps) {
      const k = `s${t.x},${t.y}`;
      seenStumps.add(k);
      if (!this.stumpSprites.has(k)) {
        this.stumpSprites.set(k, this.put('stump', t.x, t.y, (t.x + t.y) * 10 + 1));
      }
    }
    for (const [k, img] of this.stumpSprites) {
      if (!seenStumps.has(k)) { img.destroy(); this.stumpSprites.delete(k); }
    }
    // Eventos: tala (tocón nuevo), tablón, obra terminada, victoria
    if (w.stumps.length > this.prevStumps) {
      const st = w.stumps[w.stumps.length - 1];
      const p = iso(st.x, st.y);
      this.burst(p.sx, p.sy - 20, 0x8b5a2b, 8);
      this.sfx('sfx-thud', 0.8);
    }
    this.prevStumps = w.stumps.length;
    if (w.warehouse.planks > this.prevPlanks) {
      const wc = footprintCenter(w.warehouse.cells);
      const p = iso(wc.x, wc.y);
      this.burst(p.sx, p.sy - 40, 0xffd23f, 6);
      this.sfx('sfx-plank', 0.8);
    }
    this.prevPlanks = w.warehouse.planks;
    const builtKey = `${w.sawmill.built}${w.warehouse.built}`;
    if (this.prevBuilt && builtKey !== this.prevBuilt) {
      this.sfx('sfx-thud', 1);
      const b = w.warehouse.built && this.prevBuilt[1] === 'f' ? w.warehouse : w.sawmill;
      const c = footprintCenter(b.cells);
      const p = iso(c.x, c.y);
      this.burst(p.sx, p.sy - 40, 0xdddddd, 10);
    }
    this.prevBuilt = builtKey;
    // Obras
    for (const b of [w.sawmill, w.warehouse]) {
      const img = this.siteImgs.get(b.kind);
      const bar = this.siteBars.get(b.kind);
      if (!img || !bar) continue;
      if (b.built) {
        const frame = b.kind === 'sawmill' ? 'sawmill' : 'warehouse';
        if (img.texture.key !== 'uh' || img.frame.name !== frame) img.setTexture('uh', frame);
        bar.setVisible(false);
      } else {
        const total = b.constructing ? 1 : b.gotLogs / b.needLogs;
        const frac = b.constructing ? 1 - b.buildTimer / BUILD_TIME : total * 0.5;
        bar.setVisible(true);
        bar.setScale(Math.max(0.05, frac), 1);
      }
    }
    // Cabaña muestra stock
    const wantHut = w.hut.logs >= 3 ? 'hut_logs2' : w.hut.logs >= 1 ? 'hut_logs1' : 'hut';
    if (wantHut !== this.hutFrame) {
      this.hutFrame = wantHut;
      this.hutImg.setTexture('uh', wantHut);
    }
    // Leñador: temblor + sonido de hacha
    const jack = w.settlers[0];
    const newChopKey = jack.state === 'chopping' && jack.to ? `${jack.to.x},${jack.to.y}` : null;
    if (this.chopKey && this.chopKey !== newChopKey) {
      const prev = this.treeSprites.get(this.chopKey);
      if (prev) prev.x = this.treeBaseX.get(this.chopKey)!;
    }
    this.chopKey = newChopKey;
    if (newChopKey) {
      const t = this.treeSprites.get(newChopKey);
      if (t) {
        t.x = this.treeBaseX.get(newChopKey)! + Math.sin(time * 0.045) * 2;
        if (time - this.chopSndAt > 1500) {
          this.chopSndAt = time;
          this.sfx('sfx-chop', 0.5);
          const p = iso(jack.to!.x, jack.to!.y);
          this.burst(p.sx, p.sy - 50, 0x6fae4e, 3);
        }
      }
    }
    // Colonos en 8 direcciones
    for (const s of w.settlers) {
      const img = this.settlerSprites.get(s.id)!;
      const { sx, sy } = iso(s.x, s.y);
      const moving = s.path.length > 0;
      let rot = this.settlerRot.get(s.id)!;
      if (moving) {
        const n = iso(s.path[0].x, s.path[0].y);
        rot = rotFor(n.sx - sx, n.sy - sy);
        this.settlerRot.set(s.id, rot);
      } else if (s.state === 'chopping' && s.to) {
        const n = iso(s.to.x, s.to.y);
        rot = rotFor(n.sx - sx, n.sy - sy);
        this.settlerRot.set(s.id, rot);
      }
      const cyc = Math.floor(time / 150 + s.id * 2) % 4 + 1;
      let frame = `lj_idle_${rot}`;
      if (s.state === 'chopping') frame = `lj_work_${rot}`;
      else if (s.carry) frame = `lj_carry${cyc}_${rot}`;
      else if (moving) frame = `lj_walk${cyc}_${rot}`;
      img.setTexture('uh', frame);
      img.setPosition(sx, sy);
      img.setDepth((s.x + s.y) * 10 + 4);
    }
    this.flagImg.setScale(1 + Math.sin(time * 0.004) * 0.05, 1);
    if (jack.state === 'chopping' && jack.to) {
      const p = iso(jack.to.x, jack.to.y);
      this.chopBar.setVisible(true);
      this.chopBar.setPosition(p.sx, p.sy - 66);
      this.chopBar.setScale(Math.max(0.05, jack.timer / 8), 1);
    } else this.chopBar.setVisible(false);
    if (w.sawmill.built && w.sawmill.busy) {
      const sc = footprintCenter(w.sawmill.cells);
      const p = iso(sc.x, sc.y);
      this.sawBar.setVisible(true);
      this.sawBar.setPosition(p.sx, p.sy - 78);
      this.sawBar.setScale(Math.max(0.05, w.sawmill.timer / 10), 1);
    } else this.sawBar.setVisible(false);
    // Minimapa (4 Hz) + panel temporal
    this.mmTimer += delta;
    if (this.mmTimer > 250) {
      this.mmTimer = 0;
      this.drawMinimap();
    }
    if (this.panel.visible) {
      this.panelTimer -= delta / 1000;
      if (this.panelTimer <= 0) this.panel.setVisible(false);
      else {
        // refresca el cuerpo mientras se ve
        const t = this.panelTitle.text;
        if (t === 'Cabaña del leñador') this.panelBody.setText(`Troncos en stock: ${w.hut.logs}`);
        else if (t === 'Sierra' || t === 'Almacén') this.panelBody.setText(this.buildingInfo(t === 'Sierra' ? 'sawmill' : 'warehouse'));
      }
    }
    const spd = this.speed === 0 ? 'PAUSA' : `${this.speed}×`;
    const obra = !w.sawmill.built ? `Obra sierra ${w.sawmill.gotLogs}/2`
      : !w.warehouse.built ? `Obra almacén ${w.warehouse.gotLogs}/2` : 'Colonia lista';
    this.hud.setText(
      `🪵 ${w.hut.logs}   🧱 ${w.warehouse.planks}/10   ${obra}   [${spd}]`,
    );
    if (w.won && !this.winText.visible) {
      this.winText.setVisible(true);
      this.sfx('sfx-victory', 0.9);
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#20301c',
  scene: [BootScene, PreloadScene, GameScene],
});
