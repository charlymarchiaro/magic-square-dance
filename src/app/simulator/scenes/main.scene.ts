import { GridCellModel } from "../model/grid-cell.model";
import { SimulatorModel } from '../model/simulator.model';
import { Vector2 } from '../model/common';
import { CELL_SIZE_PX } from '../params';
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
  }


  public preload() {

    this.iterationIndex = 0;

    this.camera = this.cameras.cameras[0];
    this.camera.setScroll(
      -this.camera.displayWidth / 2,
      -this.camera.displayHeight / 2
    );
    this.camera.setZoom(this.calcOptimumZoom());

    this.load.setBaseURL('assets/img/');

    this.load.image('tileLeft', 'tile_left.png');
    this.load.image('tileRight', 'tile_right.png');
    this.load.image('tileTop', 'tile_top.png');
    this.load.image('arrowTileGray', 'arrow_tile_gray.png');
    this.load.image('arrowTileOrange', 'arrow_tile_orange.png');
    this.load.image('arrowTileYellow', 'arrow_tile_yellow.png');
    this.load.image('gridCell', 'grid_cell.png');
    this.load.image('placeholder', 'placeholder.png');
    this.load.image('tileBottom', 'tile_bottom.png');
  }


  public create() {

    this.gridLayer = this.add.layer().setDepth(0);
    this.tileLayer = this.add.layer().setDepth(100);
  }


  public update() {
    this.tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.model.getCenterPos());
      t.img.setPosition(pos.x, pos.y)
    });
  }


  private calcOptimumZoom(): number {
    const camera = this.cameras.cameras[0];
    const diamondWidth = 2 * (1 + this.iterationIndex) * CELL_SIZE_PX;
    const minScreenSize = Math.min(camera.width, camera.height);
    const paddingPixels = 3 * CELL_SIZE_PX;

    return minScreenSize / (diamondWidth + paddingPixels);
  }


  private onIterationStarted(iterationIndex: number) {
    this.iterationIndex = iterationIndex;

    const zoom = this.calcOptimumZoom();
    const transitionDurationSecs = 10 / this.simulatorTimer.getSimulationSpeed();

    this.camera.zoomTo(zoom, 1000 * transitionDurationSecs);
  }


  private onGridCellsAdded(gridCells: GridCellModel[]) {
    gridCells.forEach(gc => {
      const pos = this.transformToViewSpace(gc.getCenterPos());
      const img = this.add.image(pos.x, pos.y, 'gridCell');

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
      const img = this.add.image(pos.x, pos.y, 'arrowTileGray').setRotation(ang);

      // Add binding
      this.tiles.push({ model: t, img });

      // Add to layer
      this.tileLayer.add(img);
    });
  }


  private onTilesRemoved(tiles: TileModel[]) {

  }


  private transformToViewSpace(v: Vector2): Vector2 {
    return new Vector2(
      v.x * CELL_SIZE_PX,
      -v.y * CELL_SIZE_PX ,
    )
  }
}
