import { Matrix, MatrixCellCoords, MatrixCell } from './matrix';
import { TileDirection, Vector2, areDirectionsOpposite } from '../common';
import { TileModel } from '../tile.model';


export interface ClashingTilePair {
  tile1: TileModel;
  tile2: TileModel;
  clashingCenterPos: Vector2;
}


export class ClashingTilesDetector {

  constructor(
    private tiles: TileModel[],
    private matrix: Matrix,
  ) { }


  public findClashingTilePairs(): ClashingTilePair[] {
    /**
     * Consider only half of the tiles to avoid redundant
     * clash verifications. Get tiles pointing rather
     * up or right only.
     */
    const tilesToCheck = this.getPointingUpOrRightTiles();

    return this.getClashes(tilesToCheck);
  }


  private getPointingUpOrRightTiles(): TileModel[] {
    return this.tiles.filter(t =>
      t.getDirection() === TileDirection.up
      || t.getDirection() === TileDirection.right
    );
  }


  private getClashes(tilesToCheck: TileModel[]): ClashingTilePair[] {

    const clashes: ClashingTilePair[] = [];

    tilesToCheck.forEach(t1 => {

      // Consider only one of the occupied cells for each tile
      const coords1 = this.matrix.transformPosToGridCoords(
        t1.getOccupGridCells().centerPos1
      );
      const coords2 = {
        u: coords1.u + t1.getDirectionVersor().x,
        v: coords1.v + t1.getDirectionVersor().y,
      };
      const t2 = this.matrix.getCellAtCoords(coords2).tile;

      if (!!t2 && areDirectionsOpposite(
        t1.getDirection(),
        t2.getDirection()
      )) {
        clashes.push({
          tile1: t1,
          tile2: t2,
          clashingCenterPos: new Vector2(
            (t1.getDestCenterPos().x + t2.getDestCenterPos().x) / 2,
            (t1.getDestCenterPos().y + t2.getDestCenterPos().y) / 2,
          )
        });
      }
    });

    return clashes;
  }
}
