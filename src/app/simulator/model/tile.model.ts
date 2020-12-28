import { TileDirection, TileState, Vector2 } from "./common";
import { BaseTileTransition } from './transition/base.tile-transition';


export class TileModel {

  private state: TileState;

  private transition: BaseTileTransition;


  constructor(
    private centerPos: Vector2,
    private direction: TileDirection,
    private phase: number,
  ) {
    this.state = TileState.still;
  }


  public getState(): TileState {
    return this.state;
  }


  public getCenterPos(): Vector2 {
    return { ...this.centerPos };
  }


  public getDirection(): TileDirection {
    return this.direction;
  }

  public getRotationAngleRads(): number {
    switch (this.direction) {
      case TileDirection.up:
        return 0.0;
      case TileDirection.left:
        return Math.PI / 2;
      case TileDirection.down:
        return Math.PI;
      case TileDirection.right:
        return 3 * Math.PI / 2;
    }
  }


  public startTransition(transition: BaseTileTransition) {
    this.state = TileState.transitioning;
    this.transition = transition;
    this.transition.start(this.centerPos, this.direction, this.phase);
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
