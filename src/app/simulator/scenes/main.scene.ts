import { GridCellModel } from '../model/grid-cell.model';
import { DisplayMode, SimulatorModel } from '../model/simulator.model';
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


type TextureName =
  | 'gridCell'
  | 'placeholder'
  | 'tileUp'
  | 'tileDown'
  | 'tileLeft'
  | 'tileRight'
  | 'clashingTile';

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

  private displayMode: DisplayMode;


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
    this.simulatorModel.displayModeChange.subscribe(m => this.setDisplayMode(m));
  }


  public preload(): void {
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


  public create(): void {
    this.gridLayer = this.add.layer().setDepth(0);
    this.placeholderLayer = this.add.layer().setDepth(50);
    this.tileLayer = this.add.layer().setDepth(100);
    this.arcticCircleLayer = this.add.layer().setDepth(150);

    this.arcticCircle = this.add.ellipse(0, 0, 2 * params.CELL_SIZE_PX, 2 * params.CELL_SIZE_PX);
    this.arcticCircle.setAlpha(0);
    this.arcticCircleLayer.add(this.arcticCircle);

    // Simulation params
    const sp = this.simulatorModel.getParams();
    this.setArcticCircleActiveState(sp.isArcticCircleActive);
    this.setDisplayMode(sp.displayMode);

    // Create dummy board
    this.createDummyBoard();
  }


  public destroy(): void {
    this.sys.game.destroy(true);
  }


  /**
   * Populate the empty screen with a starting dummy board.
   * These grid cells are not part of the grid cell list
   */
  private createDummyBoard(): void {

    const gcs: Vector2[] = [
      new Vector2(-0.5, -0.5),
      new Vector2(0.5, -0.5),
      new Vector2(-0.5, 0.5),
      new Vector2(0.5, 0.5),
    ];

    gcs.forEach(gc => {
      const pos = this.transformToViewSpace(gc);
      const img = this.add.image(pos.x, pos.y, this.getTextureName('gridCell'));
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
    });
  }


  public update(): void {
    this.phase = this.simulatorModel.getPhase();

    this.tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.model.getCenterPos());
      t.img.setPosition(pos.x, pos.y);
    });

    this.updateCamera();
    this.updateArcticCircle();
  }


  private updateCamera(): void {
    const fractionalIter = this.phase / params.ITERATION_PHASE_DURATION;

    const sceneSize = 2 * (1 + fractionalIter) * params.CELL_SIZE_PX;
    const minScreenSize = Math.min(this.camera.width, this.camera.height);
    const paddingPixels = 3 * params.CELL_SIZE_PX;

    const zoom = minScreenSize / (sceneSize + paddingPixels);

    this.camera.setZoom(zoom);
    this.camera.setScroll(-this.camera.width / 2, -this.camera.height / 2);
  }


  private updateArcticCircle(): void {
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
     * random bias coefficient, and finally the (normalized) ellipse
     * dimensions are obtained as:
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


  private onIterationStarted(iterationIndex: number): void {
    this.iterationIndex = iterationIndex;
  }


  private onGridCellsAdded(gridCells: GridCellModel[]): void {
    gridCells.forEach(gc => {
      const pos = this.transformToViewSpace(gc.getCenterPos());
      const img = this.add.image(pos.x, pos.y, this.getTextureName('gridCell'));
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


  private onPlaceholdersAdded(insertionPoints: Vector2[]): void {
    insertionPoints.forEach(ip => {

      const pos = this.transformToViewSpace(ip);
      const img = this.add.image(pos.x, pos.y, this.getTextureName('placeholder'));
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


  private onTilesAdded(tiles: TileModel[]): void {
    tiles.forEach(t => {
      const pos = this.transformToViewSpace(t.getCenterPos());
      const ang = t.getRotationAngleRads();
      const img = this.add.image(pos.x, pos.y, this.getTileTexture(t)).setRotation(ang);
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


  private onTilesRemoved(tiles: TileModel[]): void {
    tiles.forEach(t => {
      const index = this.tiles.findIndex(
        b => b.model === t
      );
      const tileBinding = this.tiles[index];

      tileBinding.img.setTexture(this.getTextureName('clashingTile'));

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


  private setArcticCircleActiveState(isActive: boolean): void {

    this.isArcticCircleActive = isActive;

    const fadeDuration = 0.2 * 1000;

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


  private setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;

    // Update already placed elements
    this.tiles.forEach(t => {
      t.img.setTexture(this.getTileTexture(t.model));
    });
  }


  private transformToViewSpace(v: Vector2): Vector2 {
    return new Vector2(
      v.x * params.CELL_SIZE_PX,
      -v.y * params.CELL_SIZE_PX ,
    );
  }


  private getUnitPhaseDurationSecs(): number {
    return 1 / this.simulatorTimer.getSimulationSpeed();
  }


  private getTextureName(
    kind: TextureName

  ): string {

    if (this.displayMode === DisplayMode.colors) {
      switch (kind) {
        case 'gridCell': return 'gridCell';
        case 'placeholder': return 'placeholderWhite';
        case 'tileUp': return 'tileUp';
        case 'tileDown': return 'tileDown';
        case 'tileLeft': return 'tileLeft';
        case 'tileRight': return 'tileRight';
        case 'clashingTile': return 'arrowTileWhite';

        default: throw new Error('No texture defined for kind: ' + kind);
      }
    }
    if (this.displayMode === DisplayMode.arrows) {
      switch (kind) {
        case 'gridCell': return 'gridCell';
        case 'placeholder': return 'placeholderOrange';
        case 'tileUp': return 'arrowTileGray';
        case 'tileDown': return 'arrowTileGray';
        case 'tileLeft': return 'arrowTileGray';
        case 'tileRight': return 'arrowTileGray';
        case 'clashingTile': return 'arrowTileYellow';

        default: throw new Error('No texture defined for kind: ' + kind);
      }
    }
    throw new Error('No textures defined for display mode: ' + this.displayMode);
  }


  private getTileTexture(tile: TileModel): string {
    const texturesMap: { [direction in TileDirection]: TextureName } = {
      up: 'tileUp',
      down: 'tileDown',
      left: 'tileLeft',
      right: 'tileRight',
    };
    return this.getTextureName(texturesMap[tile.getDirection()]);
  }
}
