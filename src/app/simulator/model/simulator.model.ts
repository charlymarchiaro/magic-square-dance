import { EventEmitter } from '@angular/core';
import { SimPhaseState, Vector2, TileDirection } from './common';
import { TileModel } from './tile.model';
import { SimPhaseStateHandler } from './sim-phase-state-handler';
import { filter } from 'rxjs/operators';
import { GridCellModel } from './grid-cell.model';
import { LinearTileTransition } from './transition/linear.tile-transition';


export class SimulatorModel {

  // Global phase value
  private phase: number;

  // Global iteration index
  private iterationIndex: number;

  // Simulation phase state
  private phaseState: SimPhaseState;
  private phaseStateHandler: SimPhaseStateHandler;

  // Tile models
  private tiles: TileModel[] = [];

  // Grid cells models
  private gridCells: GridCellModel[] = [];

  // Event emitters
  public iterationStarted = new EventEmitter<number>();
  public tilesAdded = new EventEmitter<TileModel[]>();
  public tilesRemoved = new EventEmitter<TileModel[]>();
  public gridCellsAdded = new EventEmitter<GridCellModel[]>();
  public phaseStateChange = new EventEmitter<SimPhaseState>();


  constructor() {
    this.phase = 0;
    this.iterationIndex = 0;

    this.phaseStateHandler = new SimPhaseStateHandler(this.phase);
    this.phaseStateHandler.state$.pipe(filter(s => !!s)).subscribe(s => {
      this.phaseState = s;
      this.phaseStateChange.emit(s);
      this.onPhaseStateChange();
    })
  }


  public getTiles(): TileModel[] {
    return [...this.tiles];
  }


  public update(phase: number) {
    this.phase = phase;

    this.tiles.forEach(t => {
      t.update(phase);
    });

    this.phaseStateHandler.update(phase);
  }


  private onPhaseStateChange() {
    console.log(this.phaseState)

    const handlers: { [state in SimPhaseState]: () => void } = {
      addingGridCells: this.addGridCells,
      removingTiles: this.removeTiles,
      transitioningTiles: this.transitionTiles,
      showingPlaceholders: this.showPlaceholders,
      addingTiles: this.addTiles,
    }

    handlers[this.phaseState].call(this);

    if (this.phaseState === SimPhaseState.addingGridCells) {
      // First state in the sequence --> update iteration index
      this.iterationIndex++;
      this.iterationStarted.emit(this.iterationIndex);
    }
  }


  private addGridCells() {
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
      )

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


  private removeTiles() {

  }


  private transitionTiles() {
    this.tiles.forEach(t => {
      t.startTransition(new LinearTileTransition());
    })
  }


  private showPlaceholders() {

  }


  private addTiles() {
    const tile1 = new TileModel(new Vector2(0, 0.5), TileDirection.up, this.phase);
    this.tiles.push(tile1)
    const tile2 = new TileModel(new Vector2(0, -0.5), TileDirection.down, this.phase);
    this.tiles.push(tile2)
    this.tilesAdded.emit([tile1, tile2])
  }
}

