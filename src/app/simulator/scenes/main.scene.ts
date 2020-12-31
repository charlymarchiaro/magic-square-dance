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
  private arcticCircle: Phaser.GameObjects.Ellipse;

  private gridLayer: Phaser.GameObjects.Layer;
  private placeholderLayer: Phaser.GameObjects.Layer;
  private tileLayer: Phaser.GameObjects.Layer;
  private arcticCircleLayer: Phaser.GameObjects.Layer;

  private gridCells: GridCellBinding[] = [];
  private tiles: TileBinding[] = [];

  private phase: number;
  private iterationIndex: number;

  private isArcticCircleActive: boolean;


  constructor(
    private simulatorModel: SimulatorModel,
    private simulatorTimer: SimulatorTimer,
  ) {
    super(sceneConfig);

    this.simulatorModel.iterationStarted.subscribe(ii => this.onIterationStarted(ii));
    this.simulatorModel.gridCellsAdded.subscribe(gc => this.onGridCellsAdded(gc));
    this.simulatorModel.placeholdersAdded.subscribe(p => this.onPlaceholdersAdded(p));
    this.simulatorModel.tilesAdded.subscribe(t => this.onTilesAdded(t));
    this.simulatorModel.tilesRemoved.subscribe(t => this.onTilesRemoved(t));
    this.simulatorModel.arcticCircleActiveChange.subscribe(s => this.setArcticCircleActiveState(s));
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
    this.load.image('arrowTileWhite', 'arrow_tile_white.png');
    this.load.image('placeholderOrange', 'placeholder_orange.png');
    this.load.image('placeholderWhite', 'placeholder_white.png');
    this.load.image('gridCell', 'grid_cell.png');

    this.camera = this.cameras.cameras[0];

    this.updateCamera();
  }


  public create() {
    this.gridLayer = this.add.layer().setDepth(0);
    this.placeholderLayer = this.add.layer().setDepth(50);
    this.tileLayer = this.add.layer().setDepth(100);
    this.arcticCircleLayer = this.add.layer().setDepth(150);

    this.arcticCircle = this.add.ellipse(0, 0, 2 * params.CELL_SIZE_PX, 2 * params.CELL_SIZE_PX);
    this.arcticCircle.setAlpha(0);
    this.arcticCircleLayer.add(this.arcticCircle);
    this.setArcticCircleActiveState(
      this.simulatorModel.getParams().isArcticCircleActive
    );
  }


  public update() {
    this.phase = this.simulatorModel.getPhase();

    this.tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.model.getCenterPos());
      t.img.setPosition(pos.x, pos.y);
    });

    this.updateCamera();
    this.updateArcticCircle();
  }


  private updateCamera() {
    const fractionalIter = this.phase / params.ITERATION_PHASE_DURATION;

    const sceneSize = 2 * (1 + fractionalIter) * params.CELL_SIZE_PX;
    const minScreenSize = Math.min(this.camera.width, this.camera.height);
    const paddingPixels = 3 * params.CELL_SIZE_PX;

    const zoom = minScreenSize / (sceneSize + paddingPixels);

    this.camera.setZoom(zoom);
    this.camera.setScroll(-this.camera.width / 2, -this.camera.height / 2);
  }


  private updateArcticCircle() {
    /**
     * When a random bias coefficient other than 0.5 (fair) is applied, the
     * arctic circle seems to take, in general, the shape of an ellipse
     * tangent to the sides of the diamond. The intersection point on each
     * side is such that the segment is divided in two parts whose lengths
     * have the same ratio as the probabilities of the two random outcomes.
     *
     * This is not proved but rather observed empirically by myself as a
     * good fit for a large number of iterations. This is a personal
     * hypothesis and haven't yet found any other information to support it.
     *
     * The width and height of the ellipse can be calculated by following
     * a reasoning such as the one shown here:
     * https://math.stackexchange.com/questions/1971097/what-are-the-axes-of-an-ellipse-within-a-rhombus
     *
     * Then, the intersection points are calculated as a function of the
     * random bias coefficient, and finally the ellipse dimensions are obtained as:
     *
     *   width = 2 * sqrt ( 1 - (random bias coef) )
     *   height = 2 * sqrt (random bias coef)
     */
    const fractionalIter = this.phase / params.ITERATION_PHASE_DURATION;

    const k = Math.max(1, fractionalIter);
    const randomBiasCoef = this.simulatorModel.getParams().randomBiasCoef;

    const width = 2 * Math.sqrt(1 - randomBiasCoef) * k * params.CELL_SIZE_PX;
    const height = 2 * Math.sqrt(randomBiasCoef) * k * params.CELL_SIZE_PX;

    const minDisplaySize = Math.min(this.camera.displayWidth, this.camera.displayHeight);

    this.arcticCircle.setSize(width, height);
    this.arcticCircle.setPosition(
      -width / 2 + params.CELL_SIZE_PX,
      -height / 2 + params.CELL_SIZE_PX
    );
    this.arcticCircle.setStrokeStyle(minDisplaySize * 0.008, 0xFFFF00);
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
      });

      // Add binding
      this.gridCells.push({ model: gc, img });

      // Add to layer
      this.gridLayer.add(img);
    });
  }


  private onPlaceholdersAdded(insertionPoints: Vector2[]) {
    insertionPoints.forEach(ip => {

      const pos = this.transformToViewSpace(ip);
      const img = this.add.image(pos.x, pos.y, 'placeholderWhite');
      img.setAlpha(0);

      const specs = params.SIM_PHASE_STATE_TRANSITION_SPECS;

      const duration =
        (
          specs.showingPlaceholders.phaseDuration
          + specs.addingGridCells.phaseDuration
        )
        * 1000 * this.getUnitPhaseDurationSecs();

      this.tweens.add({
        targets: img,
        alpha: { from: 0, to: 1 },
        ease: 'Linear',
        duration: duration * 0.25,
        repeat: 0,
        yoyo: false,
        completeDelay: duration * 0.75,
        onComplete: () => img.destroy(),
      });

      this.placeholderLayer.add(img);
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

      img.setAlpha(0);

      const fadeDuration = 0.5 * 1000 * this.getUnitPhaseDurationSecs();

      this.tweens.add({
        targets: img,
        alpha: { from: 0, to: 1 },
        ease: 'Linear',
        duration: fadeDuration,
        repeat: 0,
        yoyo: false,
      });

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

      tileBinding.img.setTexture('arrowTileWhite');

      const fadeDuration = 2.5 * 1000 * this.getUnitPhaseDurationSecs();

      this.tweens.add({
        targets: tileBinding.img,
        alpha: { from: 1, to: 0 },
        ease: 'Linear',
        duration: fadeDuration * 0.5,
        repeat: 0,
        yoyo: false,
        delay: fadeDuration * 0.5,
        onComplete: () => tileBinding.img.destroy(),
      });

      this.tiles.splice(index, 1);
    });
  }


  private setArcticCircleActiveState(isActive: boolean) {

    const fadeDuration = 2.5 * 1000 * this.getUnitPhaseDurationSecs();

    const alpha = isActive
      ? { from: this.arcticCircle.alpha, to: 1 }
      : { from: this.arcticCircle.alpha, to: 0 };

    this.tweens.add({
      targets: this.arcticCircle,
      alpha,
      ease: 'Linear',
      duration: fadeDuration,
      repeat: 0,
      yoyo: false,
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
