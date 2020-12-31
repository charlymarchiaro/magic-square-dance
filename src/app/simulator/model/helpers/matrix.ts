import { Vector2 } from '../common';
import { TileModel } from '../tile.model';
import { GridCellModel } from '../grid-cell.model';


export interface MatrixCell {
  hasGridCell: boolean;
  hasTile: boolean;
  tile?: TileModel;
}

/**
 * The matrix coordinates are named as (u, v),
 * with u // ex and v // ey, and the matrix
 * origin is located in the lower-left corner.
 */
export interface MatrixCellCoords {
  u: number;
  v: number;
}


export class Matrix {

  private cells: MatrixCell[][];
  private matrixSize: number;


  constructor(
    private tiles: TileModel[],
    private gridCells: GridCellModel[],
  ) {
    this.initCells();
  }


  private initCells(): void {
    /**
     * The matrix size can be calculated quickly as a function
     * of the number of grid cells:
     *
     * iteration | number of cells (N)
     *     0     |  0
     *     1     |  1*4 = 4
     *     2     |  1*4 + 2*4 = 12
     *     3     |  1*4 + 2*4 + 3*4 = 24
     *     n     |  (1 + ... + n)*4 = n*(n+1)/2*4 = 2*n*(n+1)
     *
     * Then, the iteration as a function of N is:
     *
     *     i = 1/2 * (-1 + sqr(1 + 2*N))
     */

    const N = this.gridCells.length;
    const iteration = (Math.sqrt(1 + 2 * N) - 1) / 2;

    // The size of the required square matrix is:
    this.matrixSize = 2 * iteration;


    // Init the matrix with empty cells.
    this.cells = [];

    for (let u = 0; u < this.matrixSize; u++) {
      const col: MatrixCell[] = [];

      for (let v = 0; v < this.matrixSize; v++) {
        col.push({
          hasGridCell: false,
          hasTile: false,
        });
      }
      this.cells.push(col);
    }

    // Set hasGridCell field
    this.gridCells.forEach(gc => {
      const coords = this.transformPosToGridCoords(gc.getCenterPos());
      this.cells[coords.u][coords.v].hasGridCell = true;
    });

    // Set tile fields
    this.tiles.forEach(t => {
      this.addTile(t);
    });
  }


  public addTile(tile: TileModel): void {
    const occupGridCells = tile.getOccupGridCells();
    // First tile cell
    const coords1 = this.transformPosToGridCoords(occupGridCells.centerPos1);
    this.cells[coords1.u][coords1.v].hasTile = true;
    this.cells[coords1.u][coords1.v].tile = tile;
    // Second tile cell
    const coords2 = this.transformPosToGridCoords(occupGridCells.centerPos2);
    this.cells[coords2.u][coords2.v].hasTile = true;
    this.cells[coords2.u][coords2.v].tile = tile;
  }


  public removeTile(tile: TileModel): void {
    const occupGridCells = tile.getOccupGridCells();
    // First tile cell
    const coords1 = this.transformPosToGridCoords(occupGridCells.centerPos1);
    this.cells[coords1.u][coords1.v].hasTile = false;
    this.cells[coords1.u][coords1.v].tile = null;
    // Second tile cell
    const coords2 = this.transformPosToGridCoords(occupGridCells.centerPos2);
    this.cells[coords2.u][coords2.v].hasTile = false;
    this.cells[coords2.u][coords2.v].tile = null;
  }


  public transformPosToGridCoords(pos: Vector2): MatrixCellCoords {
    return {
      u: Math.floor(pos.x + this.matrixSize / 2),
      v: Math.floor(pos.y + this.matrixSize / 2),
    };
  }


  public transformGridCoordsToPos(coords: MatrixCellCoords): Vector2 {
    return new Vector2(
      coords.u - this.matrixSize / 2 + 0.5,
      coords.v - this.matrixSize / 2 + 0.5,
    );
  }


  public getCellAtCoords(coords: MatrixCellCoords): MatrixCell {

    if (
      coords.u < 0
      || coords.u > this.matrixSize - 1
      || coords.v < 0
      || coords.v > this.matrixSize - 1
    ) {
      // Coords are outside the matrix
      return {
        hasGridCell: false,
        hasTile: false,
      };
    }
    return this.cells[coords.u][coords.v];
  }


  public setCellAtCoords(coords: MatrixCellCoords, cell: MatrixCell): void {
    this.cells[coords.u][coords.v] = { ...cell };
  }


  public getCellAtPos(pos: Vector2): MatrixCell {
    return this.getCellAtCoords(
      this.transformPosToGridCoords(pos)
    );
  }


  /**
   * Returns true if the cell is a grid cell
   * and is not used by a tile.
   */
  public isCellEmpty(coords: MatrixCellCoords): boolean {
    const cell = this.getCellAtCoords(coords);
    return cell.hasGridCell && !cell.hasTile;
  }


  /**
   * Returns true if the cell is either not
   * a grid cell or is used by a tile.
   */
  public isCellUnusable(coords: MatrixCellCoords): boolean {
    const cell = this.getCellAtCoords(coords);
    return !cell.hasGridCell || cell.hasTile;
  }


  public getEmptyCellsCoords(): MatrixCellCoords[] {
    const result: MatrixCellCoords[] = [];

    for (let u = 0; u < this.matrixSize; u++) {
      for (let v = 0; v < this.matrixSize; v++) {
        if (this.isCellEmpty({ u, v })) {
          result.push({ u, v });
        }
      }
    }
    return result;
  }
}
