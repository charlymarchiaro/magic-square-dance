import { EventEmitter } from '@angular/core';
import { SimPhaseState, Vector2, TileDirection } from './common';
import { TileModel } from './tile.model';
import { GridCellModel } from './grid-cell.model';
import { SimPhaseStateHandler } from './sim-phase-state-handler';

// Tile transition
import { LinearTileTransition } from './transition/linear.tile-transition';

// Helpers
import { Matrix } from './helpers/matrix';
import { TileAllocator } from './helpers/tile-allocator';
import { ClashingTilesDetector } from './helpers/clashing-tiles-detector';

// Seedranrom
import * as seedrandom from 'seedrandom';

import { filter } from 'rxjs/operators';


export enum DisplayMode {
  colors = 'colors',
  arrows = 'arrows,'
}

export interface SimulationParams {

  maxIterations: number;

  randomSeed: number;

  /**
   * Takes values between 0 and 1. A value of 0.5
   * produces a fair random generation, with a probability
   * of 50% for both outcomes.
   */
  randomBiasCoef: number;

  isArcticCircleActive: boolean;

  displayMode: DisplayMode;
}


export class SimulatorModel {

  // Global seedable random generator
  private random = seedrandom();

  // Global phase value
  private phase: number;

  // Global running state
  private isRunning: boolean;

  // Global iteration index
  private iterationIndex: number;

  // Simulation phase state
  private phaseState: SimPhaseState;
  private phaseStateHandler: SimPhaseStateHandler;

  // Tile models
  private tiles: TileModel[] = [];

  // Grid cells models
  private gridCells: GridCellModel[] = [];

  // Matrix
  private matrix: Matrix;

  // Current iteration insertion points
  private insertionPoints: Vector2[];

  // Event emitters
  public iterationStarted = new EventEmitter<number>();
  public runningStateChange = new EventEmitter<boolean>();
  public placeholdersAdded = new EventEmitter<Vector2[]>();
  public tilesAdded = new EventEmitter<TileModel[]>();
  public tilesRemoved = new EventEmitter<TileModel[]>();
  public gridCellsAdded = new EventEmitter<GridCellModel[]>();
  public phaseStateChange = new EventEmitter<SimPhaseState>();
  public maxIterationsChange = new EventEmitter<number>();
  public randomSeedChange = new EventEmitter<number>();
  public randomBiasCoefChange = new EventEmitter<number>();
  public arcticCircleActiveChange = new EventEmitter<boolean>();
  public displayModeChange = new EventEmitter<DisplayMode>();


  constructor(private params: SimulationParams) {
    this.phase = 0;
    this.iterationIndex = 0;
    this.setRunningState(true);

    this.random = seedrandom(params.randomSeed);

    this.phaseStateHandler = new SimPhaseStateHandler(this.phase);
    this.phaseStateHandler.state$.pipe(filter(s => !!s)).subscribe(s => {
      this.phaseState = s;
      this.phaseStateChange.emit(s);
      this.onPhaseStateChange();
    });
  }

  /**
   * Simulation params getters/setters
   */

  public getParams(): SimulationParams {
    return { ...this.params };
  }

  public setMaxIterations(maxIterations: number): void {
    if (maxIterations < 1) {
      throw new Error(`Invalid maxIterations value: ${maxIterations}`);
    }
    this.params.maxIterations = maxIterations;
    this.maxIterationsChange.emit(maxIterations);
  }

  public setRandomSeed(seed: number): void {
    this.params.randomSeed = seed;
    this.random = seedrandom(seed);
    this.randomSeedChange.emit(seed);
  }

  public setRandomBiasCoef(randomBiasCoef: number): void {
    if (randomBiasCoef < 0 || randomBiasCoef > 1) {
      throw new Error(`Invalid randomBiasCoef value: ${randomBiasCoef}`);
    }
    this.params.randomBiasCoef = randomBiasCoef;
    this.randomBiasCoefChange.emit(randomBiasCoef);
  }

  public setArcticCircleActiveState(isActive: boolean): void {
    this.params.isArcticCircleActive = isActive;
    this.arcticCircleActiveChange.emit(isActive);
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.params.displayMode = mode;
    this.displayModeChange.emit(mode);
  }



  public getPhase(): number {
    return this.phase;
  }


  public getTiles(): TileModel[] {
    return [...this.tiles];
  }


  public update(phase: number): void {
    if (!this.isRunning) {
      return;
    }

    this.phase = phase;

    this.tiles.forEach(t => {
      t.update(phase);
    });

    this.phaseStateHandler.update(phase);
  }


  private setRunningState(value: boolean): void {
    this.isRunning = value;
    this.runningStateChange.emit(value);
  }


  private onPhaseStateChange(): void {

    const handlers: { [state in SimPhaseState]: () => void } = {
      addingGridCells: this.addGridCells,
      removingTiles: this.removeTiles,
      transitioningTiles: this.transitionTiles,
      showingPlaceholders: this.showPlaceholders,
      addingTiles: this.addTiles,
    };

    handlers[this.phaseState].call(this);

    if (this.phaseState === SimPhaseState.addingGridCells) {
      // First state in the sequence --> update iteration index
      this.iterationIndex++;
      this.iterationStarted.emit(this.iterationIndex);
    }
  }


  private addGridCells(): void {
    const numAddedCellsPerQuadrant = 1 + this.iterationIndex;
    const offsetLength = 1 + this.iterationIndex;

    const addedCells: GridCellModel[] = [];

    for (let q = 0; q < 4; q++) {

      // Offset vector
      const ux = q === 0 ? 1 : q === 2 ? -1 : 0;
      const uy = q === 1 ? 1 : q === 3 ? -1 : 0;

      const offset = new Vector2(
        offsetLength * ux,
        offsetLength * uy
      );

      // Delta vector
      const dx = q === 0 || q === 1 ? -1 : 1;
      const dy = q === 0 || q === 3 ? 1 : -1;

      const delta = new Vector2(dx, dy);

      for (let i = 0; i < numAddedCellsPerQuadrant; i++) {
        const pos = new Vector2(
          offset.x + (i + 0.5) * delta.x,
          offset.y + (i + 0.5) * delta.y
        );

        addedCells.push(new GridCellModel(pos));
      }
    }

    this.gridCells.push(...addedCells);
    this.gridCellsAdded.emit(addedCells);
  }


  private removeTiles(): void {
    const clashingTilesDetector = new ClashingTilesDetector(
      this.tiles,
      this.matrix,
    );

    const clashes = clashingTilesDetector.findClashingTilePairs();

    const removedTiles = clashes.reduce((list, clash) => [
      ...list,
      ...[clash.tile1, clash.tile2],
    ], []);

    removedTiles.forEach(t => {
      const index = this.tiles.indexOf(t);
      this.tiles.splice(index, 1);

      this.matrix.removeTile(t);
    });

    this.tilesRemoved.emit(removedTiles);
  }


  private transitionTiles(): void {
    this.tiles.forEach(t => {
      t.startTransition(new LinearTileTransition());
    });
  }


  private showPlaceholders(): void {
    // Create matrix for current iteration
    this.matrix = new Matrix(this.tiles, this.gridCells);

    const tileAllocator = new TileAllocator(this.matrix);
    this.insertionPoints = tileAllocator.findTilePairsInsertionPoints();

    this.placeholdersAdded.emit(this.insertionPoints);
  }


  private addTiles(): void {
    const addedTiles: TileModel[] = [];

    this.insertionPoints.forEach(ip => {
      let tile1: TileModel;
      let tile2: TileModel;

      if (this.random() > this.params.randomBiasCoef) {
        tile1 = new TileModel(new Vector2(ip.x, ip.y + 0.5), TileDirection.up, this.phase);
        tile2 = new TileModel(new Vector2(ip.x, ip.y - 0.5), TileDirection.down, this.phase);
      } else {
        tile1 = new TileModel(new Vector2(ip.x + 0.5, ip.y), TileDirection.right, this.phase);
        tile2 = new TileModel(new Vector2(ip.x - 0.5, ip.y), TileDirection.left, this.phase);
      }

      this.tiles.push(tile1);
      this.tiles.push(tile2);
      addedTiles.push(tile1, tile2);
    });

    addedTiles.forEach(t => {
      this.matrix.addTile(t);
    });

    this.tilesAdded.emit(addedTiles);

    if (this.iterationIndex >= this.params.maxIterations) {
      this.setRunningState(false);
    }
  }
}

