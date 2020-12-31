import { Matrix, MatrixCellCoords, MatrixCell } from './matrix';
import { Vector2 } from '../common';



export class TileAllocator {

  constructor(
    private matrix: Matrix,
  ) { }


  /**
   * Find all the 2x2 empty spaces (insertion points) into which
   * insert pairs of tiles in order to cover all empty space
   * optimally for current iteration.
   *
   * Algorithm:
   *   1. List all the 2x2 (maybe overlapped) empty spaces.
   *   2. Select the ones which are located in at least one corner,
   *      next to the diamond edge and/or other tiles. These are
   *      clearly valid insertion points, because no other could
   *      cover that corner cell.
   *   3. Mark the selected 2x2 spaces as occupied by tiles.
   *   4. Repeat from step 1 until all space is covered (as mentioned
   *      in the Mathologer video, there is always a way to do it).
   *
   * The whole process takes, at most, M iterations, being:
   *
   *   M = (initial number of empty spaces) / 4
   *
   * because in each iteration at least one valid insertion point must be found.
   */
  public findTilePairsInsertionPoints(): Vector2[] {

    const numEmptySpaces = this.matrix.getEmptyCellsCoords().length;

    const foundInsertionPoints: MatrixCellCoords[] = [];

    for (let i = 0; i < numEmptySpaces / 4; i++) {
      // Step 1
      const twoByTwoEmptySpaces = this.findAllTwoByTwoEmptySpaces();

      // No empy spaces found --> exit loop
      if (twoByTwoEmptySpaces.length === 0) {
        break;
      }

      // Step 2
      const spacesInCorners = this.findTwoByTwoEmptySpacesInCorners(
        twoByTwoEmptySpaces
      );

      // Step 3
      this.markTwoByTwoSpacesAsOccupied(spacesInCorners);

      foundInsertionPoints.push(...spacesInCorners);
    }

    return foundInsertionPoints
      .map(coords => this.matrix.transformGridCoordsToPos(coords))
      // Add a (0.5, 0.5) offset to obtain the 2x2 space center pos
      .map(v => new Vector2(v.x + 0.5, v.y + 0.5));
  }


  /**
   * Find all 2x2 empty spaces and list the lower-left
   * cell coords of each one
   */
  private findAllTwoByTwoEmptySpaces(): MatrixCellCoords[] {
    const result: MatrixCellCoords[] = [];

    this.matrix.getEmptyCellsCoords().forEach(c => {
      if (
        this.matrix.isCellEmpty({ u: c.u + 0, v: c.v + 0 })
        && this.matrix.isCellEmpty({ u: c.u + 1, v: c.v + 0 })
        && this.matrix.isCellEmpty({ u: c.u + 0, v: c.v + 1 })
        && this.matrix.isCellEmpty({ u: c.u + 1, v: c.v + 1 })
      ) {
        // Current cell is the lower-left cell of a 2x2 empty space
        result.push(c);
      }
    });
    return result;
  }


  /**
   * From a list of 2x2 empty spaces, returns the
   * ones which are located in at least one corner.
   */
  private findTwoByTwoEmptySpacesInCorners(
    twoByTwoEmptySpaces: MatrixCellCoords[]
  ): MatrixCellCoords[] {
    const result: MatrixCellCoords[] = [];

    twoByTwoEmptySpaces.forEach((es, i) => {

      const cornersAdjacentCellsCoords: MatrixCellCoords[][] = [
        // Lower-left
        [{ u: es.u + 0 - 1, v: es.v + 0 + 0 }, { u: es.u + 0 + 0, v: es.v + 0 - 1 }],
        // Lower-right
        [{ u: es.u + 1 + 1, v: es.v + 0 + 0 }, { u: es.u + 1 + 0, v: es.v + 0 - 1 }],
        // Upper-left
        [{ u: es.u + 0 - 1, v: es.v + 1 + 0 }, { u: es.u + 0 + 0, v: es.v + 1 + 1 }],
        // Upper-right
        [{ u: es.u + 1 + 1, v: es.v + 1 + 0 }, { u: es.u + 1 + 0, v: es.v + 1 + 1 }],
      ];

      for (const cellsCoords of cornersAdjacentCellsCoords) {
        if (
          this.matrix.isCellUnusable(cellsCoords[0])
          && this.matrix.isCellUnusable(cellsCoords[1])
        ) {
          result.push(es);
          break;
        }
      }
    });
    return result;
  }


  /**
   * Update the matrix cells for a list of 2x2 spaces,
   * marking them as occupied by tiles.
   */
  private markTwoByTwoSpacesAsOccupied(
    twoByTwoEmptySpaces: MatrixCellCoords[]
  ): void {
    const cell: MatrixCell = {
      hasGridCell: true,
      hasTile: true,
    };

    twoByTwoEmptySpaces.forEach(es => {
      this.matrix.setCellAtCoords({ u: es.u + 0, v: es.v + 0 }, cell);
      this.matrix.setCellAtCoords({ u: es.u + 1, v: es.v + 0 }, cell);
      this.matrix.setCellAtCoords({ u: es.u + 0, v: es.v + 1 }, cell);
      this.matrix.setCellAtCoords({ u: es.u + 1, v: es.v + 1 }, cell);
    });
  }
}
