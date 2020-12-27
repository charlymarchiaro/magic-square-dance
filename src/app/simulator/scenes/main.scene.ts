export class MainScene extends Phaser.Scene {

  constructor() {
    super({ key: 'main' });
  }

  create() {
    console.log('create method');
  }

  preload() {
    console.log('preload method');
  }

  update() {
    console.log('update method');
  }
}
