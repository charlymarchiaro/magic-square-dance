
export enum TileDirection {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right',
}


export enum TileState {
  still = 'still',
  transitioning = 'transitioning',
}


export enum SimPhaseState {
  addingGridCells = 'addingGridCells',
  removingTiles = 'removingTiles',
  transitioningTiles = 'transitioningTiles',
  showingPlaceholders = 'showingPlaceholders',
  addingTiles = 'addingTiles',
}


export interface SimPhaseStateTransitionSpec {
  phaseDuration: number;
}


export class Vector2 {
  constructor(public x: number, public y: number) { }

  public static fromDirection(direction: TileDirection): Vector2 {
    switch (direction) {
      case TileDirection.up:
        return new Vector2(0, 1);

      case TileDirection.down:
        return new Vector2(0, -1);

      case TileDirection.left:
        return new Vector2(-1, 0);

      case TileDirection.right:
        return new Vector2(1, 0);
    }
  }
}
