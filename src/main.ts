import Phaser from 'phaser';
import './style.css';

const TILE = 64;

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
  constructor() { super('Game'); }
  create() {
    // Suelo hierba 15x8
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 15; x++)
        this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', 'grass').setDepth(y);
    // Camino horizontal
    for (let x = 1; x < 14; x++)
      this.add.image(x * TILE + 32, 4 * TILE + 32, 'lote1', 'road').setDepth(4);
    // Bosque arriba-izquierda
    const trees: Array<[string, number, number]> = [
      ['pine', 1, 1], ['leaf_tree', 2, 1], ['pine', 3, 0],
      ['leaf_tree', 0, 2], ['pine', 4, 1], ['leaf_tree', 2, 2],
    ];
    for (const [f, x, y] of trees)
      this.add.image(x * TILE + 32, y * TILE + 32, 'lote1', f).setDepth(y + 0.1);
    // Rocas + troncos (cantera futura)
    this.add.image(12 * TILE + 32, 1 * TILE + 32, 'lote1', 'rock').setDepth(1.1);
    this.add.image(13 * TILE + 32, 2 * TILE + 32, 'lote1', 'rock').setDepth(2.1);
    this.add.image(12 * TILE + 32, 6 * TILE + 32, 'lote1', 'log').setDepth(6.1);
    // Edificios
    this.add.image(7 * TILE + 32, 6 * TILE + 32, 'lote1', 'warehouse').setDepth(6.1);
    this.add.image(4 * TILE + 32, 6 * TILE + 32, 'lote1', 'woodcutter').setDepth(6.1);
    this.add.image(9 * TILE + 32, 5 * TILE + 32, 'lote1', 'flag').setDepth(5.1);
    // Obreros: uno quieto, otro acarreando que recorre el camino
    this.add.image(6 * TILE + 32, 3 * TILE + 32, 'lote1', 'worker_idle').setDepth(3.1);
    const carrier = this.add
      .image(1 * TILE + 32, 4 * TILE + 32, 'lote1', 'worker_carry_log')
      .setDepth(4.1);
    this.tweens.add({
      targets: carrier, x: 13 * TILE + 32, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
    this.add
      .text(16, 508, 'SettlersRamos T003 — Lote 1 CC0 (Kenney). Sim económica en T004-T005.', {
        fontSize: '14px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 8, y: 4 },
      })
      .setDepth(100);
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
