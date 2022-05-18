import { BehaviorSubject } from 'rxjs';
import { SimPhaseState } from './common';
import { SIM_PHASE_STATES, SIM_PHASE_STATE_TRANSITION_SPECS } from '../params';


export class SimPhaseStateHandler {


  private stateSubject = new BehaviorSubject<SimPhaseState>(null);
  public state$ = this.stateSubject.asObservable();

  private lastTransitionPhase: number;


  constructor(startPhase: number) {
    this.lastTransitionPhase = startPhase;
  }


  public update(phase: number): void {
    const elapsedPhase = phase - this.lastTransitionPhase;

    const currentState = this.stateSubject.getValue()
      // If undefined, init with the state preceding the first one
      || SIM_PHASE_STATES[SIM_PHASE_STATES.length - 1];

    const currentStateSpec = SIM_PHASE_STATE_TRANSITION_SPECS[currentState];

    const phaseDiff = elapsedPhase - currentStateSpec.phaseDuration;

    if (phaseDiff >= 0) {

      // Elapsed phase is greater than duration --> state change

      const states = SIM_PHASE_STATES;
      const currentIndex = states.findIndex(s => s === currentState);

      const nextIndex = (currentIndex + 1) % states.length;
      const nextState = states[nextIndex];

      this.stateSubject.next(nextState);

      this.lastTransitionPhase = phase - phaseDiff;
    }
  }
}
