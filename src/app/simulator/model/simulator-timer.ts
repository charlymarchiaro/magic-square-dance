import { SimulatorModel } from './simulator.model';

export class SimulatorTimer {


  private isActive: boolean;

  private timer;

  private phase;


  constructor(
    private simulatorModel: SimulatorModel,
    private stepIntervalMillisecs: number,
    private elapsedPhasePerSec: number,
  ) {
    this.isActive = false;
    this.phase = 0;
  }


  public setSimulationSpeed(elapsedPhasePerSec: number): void {
    this.elapsedPhasePerSec = elapsedPhasePerSec;
  }


  public getSimulationSpeed(): number {
    return this.elapsedPhasePerSec;
  }


  public play(): void {
    if (this.isActive) {
      return;
    }

    this.timer = setInterval(
      () => this.onTimerStep(),
      this.stepIntervalMillisecs
    );

    this.isActive = true;
  }


  public pause(): void {
    if (!this.isActive) {
      return;
    }

    clearInterval(this.timer);

    this.isActive = false;
  }


  private onTimerStep(): void {
    this.phase += this.elapsedPhasePerSec * this.stepIntervalMillisecs / 1000;
    this.simulatorModel.update(this.phase);
  }
}
