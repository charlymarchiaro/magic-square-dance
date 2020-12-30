
export enum TileDirection {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right',
}


export const areDirectionsOpposite = (
  d1: TileDirection,
  d2: TileDirection
): boolean => {
  return (
    (d1 === TileDirection.up && d2 === TileDirection.down)
    || (d1 === TileDirection.down && d2 === TileDirection.up)
    || (d1 === TileDirection.left && d2 === TileDirection.right)
    || (d1 === TileDirection.right && d2 === TileDirection.left)
  );
};


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
