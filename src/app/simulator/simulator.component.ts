import { Component, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import * as scenes from './scenes';
import * as params from './params';
import { DisplayMode, SimulatorModel } from './model/simulator.model';
import { SimulatorTimer } from './model/simulator-timer';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent implements OnInit, OnDestroy {

  private phaser: Phaser.Game;
  private config: Phaser.Types.Core.GameConfig;

  private simulatorModel: SimulatorModel;
  private simulatorTimer: SimulatorTimer;

  /**
   * Simulation params
   */
  public isPlaying = true;

  public iterationIndex = 0;
  public maxIterations = 100;

  public randomSeed: number;

  public simulationSpeed = params.DEFAULT_SIM_SPEED;
  public minSimulationSpeed = params.MIN_SIM_SPEED;
  public maxSimulationSpeed = params.MAX_SIM_SPEED;

  public randomBiasCoef = 0.5;

  public isArcticCircleActive = false;

  public DisplayMode = DisplayMode;
  public displayMode: DisplayMode = DisplayMode.colors;



  public controlPanelStyle = {
    width: params.CONTROL_PANEL_WIDTH_PX,
  };


  private modelSubscriptions = new Subscription();


  constructor() {
  }


  ngOnInit(): void {

    this.regenerateRandomSeed();

    this.initSimulation();

    // Start simulation
    this.simulatorTimer.play();
  }

  ngOnDestroy() {
    this.modelSubscriptions.unsubscribe();
  }


  /**
   * Components events handlers
   */

  public onPlayClick(): void {
    this.playSimulation();
  }

  public onPauseClick(): void {
    this.pauseSimulation();
  }

  public onRestartClick(): void {
    this.restartSimulation();
  }

  public onRandomSeedChange(value: number): void {
    this.randomSeed = value;
    this.simulatorModel.setRandomSeed(value);
  }

  public onRegenerateRandomSeedClick(): void {
    this.regenerateRandomSeed();
    this.simulatorModel.setRandomSeed(this.randomSeed);
  }

  public onMaxIterationsChange(value: number): void {
    value = value < 1 ? 1 : value;
    this.maxIterations = value;
    this.simulatorModel.setMaxIterations(value);
  }

  public onSimulationSpeedSliderChange(value: number): void {
    this.simulationSpeed = value;
    this.simulatorTimer.setSimulationSpeed(value);
  }

  public onRandomBiasCoefSliderChange(value: number): void {
    this.randomBiasCoef = value;
    this.simulatorModel.setRandomBiasCoef(value);
  }

  public onArcticCircleCheckboxChange(checked: boolean): void {
    this.isArcticCircleActive = checked;
    this.simulatorModel.setArcticCircleActiveState(checked);
  }

  public onDisplayModeChange(value: DisplayMode): void {
    this.displayMode = value;
    this.simulatorModel.setDisplayMode(value);
  }



  private regenerateRandomSeed(): void {
    this.randomSeed = Math.floor(Math.random() * (2 ** 31 - 1));
  }


  private initSimulation(): void {

    // Destroy previous instances if exist
    this.modelSubscriptions.unsubscribe();

    if (this.config && this.config.scene) {
      this.simulatorTimer.pause();
      (this.config.scene as scenes.MainScene).destroy();
    }

    // Instantiate simulator model
    this.simulatorModel = new SimulatorModel({
      maxIterations: this.maxIterations,
      randomSeed: this.randomSeed,
      randomBiasCoef: this.randomBiasCoef,
      isArcticCircleActive: this.isArcticCircleActive,
      displayMode: this.displayMode,
    });

    // Instantiate simulator timer
    this.simulatorTimer = new SimulatorTimer(
      this.simulatorModel,
      1000 / params.FRAMES_PER_SEC,
      this.simulationSpeed,
    );

    // Instantiate main scene
    const scene = new scenes.MainScene(
      this.simulatorModel,
      this.simulatorTimer,
    );

    // Phaser config
    this.config = {
      title: 'Magic Square Dance',
      type: Phaser.AUTO,
      scale: {
        width: window.innerWidth - params.CONTROL_PANEL_WIDTH_PX,
        height: window.innerHeight - 60,
        mode: Phaser.Scale.NONE,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      parent: 'phaser-canvas',
      backgroundColor: '#CCC',
      scene
    };

    // Instantiate phaser
    this.phaser = new Phaser.Game(this.config);

    // Subscribe to window resize event
    const onResize = () => {
      this.phaser.scale.resize(
        window.innerWidth - params.CONTROL_PANEL_WIDTH_PX,
        window.innerHeight - 60,
      );
    };
    window.addEventListener('resize', onResize);

    this.modelSubscriptions = new Subscription();
    this.modelSubscriptions.add(
      this.simulatorModel.iterationStarted.subscribe(
        i => this.iterationIndex = i
      )
    );
  }


  private playSimulation(): void {
    this.simulatorTimer.play();
    this.isPlaying = true;
  }


  private pauseSimulation(): void {
    this.simulatorTimer.pause();
    this.isPlaying = false;
  }

  private restartSimulation(): void {
    this.initSimulation();

    if (this.isPlaying) {
      this.simulatorTimer.play();
    }
  }
}
