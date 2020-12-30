import { GridCellModel } from "../model/grid-cell.model";
import { SimulatorModel } from '../model/simulator.model';
import { TileDirection, Vector2 } from '../model/common';
import * as params from '../params';
import { TileModel } from '../model/tile.model';
import { SimulatorTimer } from '../model/simulator-timer';


const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};


interface GridCellBinding {
  model: GridCellModel;
  img: Phaser.GameObjects.Image;
}


interface TileBinding {
  model: TileModel;
  img: Phaser.GameObjects.Image;
}



export class MainScene extends Phaser.Scene {

  private camera: Phaser.Cameras.Scene2D.Camera;

  private gridLayer: Phaser.GameObjects.Layer;
  private tileLayer: Phaser.GameObjects.Layer;

  private gridCells: GridCellBinding[] = [];
  private tiles: TileBinding[] = [];

  private phase: number;
  private iterationIndex: number;


  constructor(
    private simulatorModel: SimulatorModel,
    private simulatorTimer: SimulatorTimer,
  ) {
    super(sceneConfig);

    this.simulatorModel.iterationStarted.subscribe(ii => this.onIterationStarted(ii));
    this.simulatorModel.gridCellsAdded.subscribe(gc => this.onGridCellsAdded(gc));
    this.simulatorModel.tilesAdded.subscribe(t => this.onTilesAdded(t));
    this.simulatorModel.tilesRemoved.subscribe(t => this.onTilesRemoved(t));

    console.log(params.ITERATION_PHASE_DURATION)
  }


  public preload() {

    this.iterationIndex = 0;

    this.load.setBaseURL('assets/img/');

    this.load.image('tileUp', 'tile_up.png');
    this.load.image('tileDown', 'tile_down.png');
    this.load.image('tileLeft', 'tile_left.png');
    this.load.image('tileRight', 'tile_right.png');
    this.load.image('arrowTileGray', 'arrow_tile_gray.png');
    this.load.image('arrowTileOrange', 'arrow_tile_orange.png');
    this.load.image('arrowTileYellow', 'arrow_tile_yellow.png');
    this.load.image('placeholder', 'placeholder.png');
    this.load.image('gridCell', 'grid_cell.png');

    this.updateCamera();
  }


  public create() {
    this.gridLayer = this.add.layer().setDepth(0);
    this.tileLayer = this.add.layer().setDepth(100);
  }


  public update() {
    this.phase = this.simulatorModel.getPhase();

    this.tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.model.getCenterPos());
      t.img.setPosition(pos.x, pos.y)
    });

    this.updateCamera();
  }


  private updateCamera() {
    const camera = this.cameras.cameras[0];

    const fractionalIter = this.phase / params.ITERATION_PHASE_DURATION;
    const sceneSize = 2 * (1 + fractionalIter) * params.CELL_SIZE_PX;
    const minScreenSize = Math.min(camera.width, camera.height);
    const paddingPixels = 3 * params.CELL_SIZE_PX;

    const zoom = minScreenSize / (sceneSize + paddingPixels);

    camera.setZoom(zoom);
    camera.setScroll(-camera.width / 2, -camera.height / 2);
  }


  private onIterationStarted(iterationIndex: number) {
    this.iterationIndex = iterationIndex;
  }


  private onGridCellsAdded(gridCells: GridCellModel[]) {
    gridCells.forEach(gc => {
      const pos = this.transformToViewSpace(gc.getCenterPos());
      const img = this.add.image(pos.x, pos.y, 'gridCell');
      img.setAlpha(0);

      const fadeDuration = 2.5 * 1000 * this.getUnitPhaseDurationSecs();

      this.tweens.add({
        targets: img,
        alpha: { from: 0, to: 1 },
        ease: 'Linear',
        duration: fadeDuration,
        repeat: 0,
        yoyo: false,
      })

      // Add binding
      this.gridCells.push({ model: gc, img });

      // Add to layer
      this.gridLayer.add(img);
    });
  }


  private onTilesAdded(tiles: TileModel[]) {
    tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.getCenterPos());
      const ang = t.getRotationAngleRads();

      const texturesMap: { [direction in TileDirection]: string } = {
        up: 'tileUp',
        down: 'tileDown',
        left: 'tileLeft',
        right: 'tileRight',
      };
      const texture = texturesMap[t.getDirection()];

      const img = this.add.image(pos.x, pos.y, texture).setRotation(ang);
      // const img = this.add.image(pos.x, pos.y, 'arrowTileGray').setRotation(ang);

      // Add binding
      this.tiles.push({ model: t, img });

      // Add to layer
      this.tileLayer.add(img);
    });
  }


  private onTilesRemoved(tiles: TileModel[]) {
    tiles.forEach(t => {
      const index = this.tiles.findIndex(
        b => b.model === t
      );
      const tileBinding = this.tiles[index];
      tileBinding.img.destroy();
      this.tiles.splice(index, 1);
    });
  }


  private transformToViewSpace(v: Vector2): Vector2 {
    return new Vector2(
      v.x * params.CELL_SIZE_PX,
      -v.y * params.CELL_SIZE_PX ,
    );
  }


  private getUnitPhaseDurationSecs() {
    return 1 / this.simulatorTimer.getSimulationSpeed();
  }
}
