import { Vector2 } from './common';

export class GridCellModel {


  constructor(
    private centerPos: Vector2,
  ) { }


  public getCenterPos(): Vector2 {
    return { ...this.centerPos };
  }
}
