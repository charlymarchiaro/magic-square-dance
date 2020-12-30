import { TileDirection, Vector2 } from '../common';

export abstract class BaseTileTransition {

  protected startPosition: Vector2;
  protected directionVersor: Vector2;
  protected startPhase: number;

  constructor() { }

  /**
   * Starts the transition, returns the final position
   */
  public start(
    startPosition: Vector2,
    direction: TileDirection,
    startPhase: number
  ): Vector2 {
    this.startPosition = startPosition;
    this.directionVersor = Vector2.fromDirection(direction);
    this.startPhase = startPhase;

    return new Vector2(
      startPosition.x + this.directionVersor.x,
      startPosition.y + this.directionVersor.y,
    );
  }

  /**
   * The phase difference relative to the transition start.
   */
  public getTransitionPhase(phase: number): number {
    // Transition phase should never be greater than 1
    return Math.min(phase - this.startPhase, 1.0);
  }

  public calcPosition(phase: number): Vector2 {
    return this.calcPositionImpl(
      this.getTransitionPhase(phase)
    );
  }

  /**
   * Implement custom tile translation animation.
   * A displacement of 1 unit corresponds to a 
   * phase change (transition phase) of 1.
   */
  protected abstract calcPositionImpl(transitionPhase: number): Vector2;
}
