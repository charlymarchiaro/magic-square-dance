import { TileDirection, TileState, Vector2 } from './common';
import { BaseTileTransition } from './transition/base.tile-transition';
import { GridCellModel } from './grid-cell.model';


export interface OccupGridCells {
  centerPos1: Vector2;
  centerPos2: Vector2;
}


export class TileModel {

  private state: TileState;

  protected directionVersor: Vector2;

  private transition: BaseTileTransition;

  // Center position after transition ends
  private destCenterPos: Vector2;


  constructor(
    private centerPos: Vector2,
    private direction: TileDirection,
    private phase: number,
  ) {
    this.state = TileState.still;
    this.directionVersor = Vector2.fromDirection(direction);
    this.destCenterPos = { ...centerPos };
  }


  public getState(): TileState {
    return this.state;
  }


  public getCenterPos(): Vector2 {
    return { ...this.centerPos };
  }


  public getDestCenterPos(): Vector2 {
    return { ...this.destCenterPos };
  }


  public getOccupGridCells(): OccupGridCells {

    const rightSideVersor = new Vector2(
      this.directionVersor.y,
      -this.directionVersor.x,
    );

    return {
      centerPos1: new Vector2(
        this.destCenterPos.x - 0.5 * rightSideVersor.x,
        this.destCenterPos.y - 0.5 * rightSideVersor.y,
      ),
      centerPos2: new Vector2(
        this.destCenterPos.x + 0.5 * rightSideVersor.x,
        this.destCenterPos.y + 0.5 * rightSideVersor.y,
      ),
    };
  }


  public getDirection(): TileDirection {
    return this.direction;
  }


  public getDirectionVersor(): Vector2 {
    return this.directionVersor;
  }


  public getRotationAngleRads(): number {
    switch (this.direction) {
      case TileDirection.up:
        return 0.0;
      case TileDirection.left:
        return 3 * Math.PI / 2;
      case TileDirection.down:
        return Math.PI;
      case TileDirection.right:
        return Math.PI / 2;
    }
  }


  public startTransition(transition: BaseTileTransition) {
    this.state = TileState.transitioning;
    this.transition = transition;
    this.destCenterPos = this.transition.start(
      this.centerPos,
      this.direction,
      this.phase
    );
  }


  public update(phase: number) {
    this.phase = phase;

    if (this.state === TileState.transitioning) {
      this.centerPos = this.transition.calcPosition(phase);

      // A phase change of 1 indicates that the transition has ended
      if (this.transition.getTransitionPhase(phase) >= 1) {
        this.state = TileState.still;
      }
    }
  }
}
