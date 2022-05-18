import { Vector2 } from '../common';
import { BaseTileTransition } from './base.tile-transition';


export class LinearTileTransition extends BaseTileTransition {

  protected calcPositionImpl(tp: number): Vector2 {

    // A displacement of 1 unit corresponds to a transition phase of 1
    const newX = this.startPosition.x + tp * this.directionVersor.x;
    const newY = this.startPosition.y + tp * this.directionVersor.y;

    return new Vector2(newX, newY);
  }
}
