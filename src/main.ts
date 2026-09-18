import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1a2b1a',
  scene: [
    {
      key: 'Boot',
      create(this: Phaser.Scene) {
        this.add
          .text(480, 270, 'SettlersRamos S0\nT002 pendiente: genera el Lote 1 en Nano Banana', {
            align: 'center',
            fontSize: '18px',
            color: '#ffffff'
          })
          .setOrigin(0.5);
      }
    }
  ]
};

new Phaser.Game(config);
