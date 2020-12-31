import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import * as scenes from './scenes';
import * as params from './params';
import { SimulatorModel } from './model/simulator.model';
import { SimulatorTimer } from './model/simulator-timer';


@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent implements OnInit {

  private phaser: Phaser.Game;
  private config: Phaser.Types.Core.GameConfig;


  private simulatorModel: SimulatorModel;
  private simulatorTimer: SimulatorTimer;


  public simulationSpeed = params.DEFAULT_SIM_SPEED;
  public minSimulationSpeed = params.MIN_SIM_SPEED;
  public maxSimulationSpeed = params.MAX_SIM_SPEED;

  public randomBiasCoef = 0.5;

  public isArcticCircleActive: boolean;

  public controlPanelStyle = {
    width: params.CONTROL_PANEL_WIDTH_PX,
  };


  constructor() {
    this.simulationSpeed = 2;

    this.simulatorModel = new SimulatorModel({
      maxIterations: 200,
      randomBiasCoef: this.randomBiasCoef,
      isArcticCircleActive: false,
    });

    this.simulatorTimer = new SimulatorTimer(
      this.simulatorModel,
      1000 / params.FRAMES_PER_SEC,
      this.simulationSpeed,
    );

    const scene = new scenes.MainScene(
      this.simulatorModel,
      this.simulatorTimer,
    );

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
  }


  ngOnInit(): void {
    this.phaser = new Phaser.Game(this.config);

    window.addEventListener('resize', () => {
      this.phaser.scale.resize(
        window.innerWidth - params.CONTROL_PANEL_WIDTH_PX,
        window.innerHeight - 60,
      );
    });

    this.simulatorTimer.play();
  }


  public onSimulationSpeedSliderChange(value: number): void {
    this.simulationSpeed = value;
    this.simulatorTimer.setSimulationSpeed(value);
  }


  public onRandomBiasCoefSliderChange(value: number): void {
    this.randomBiasCoef = value;
    this.simulatorModel.setRandomBiasCoef(value);
  }


  public onArcticCircleCheckboxChange(checked: boolean) {
    this.isArcticCircleActive = checked;
    this.simulatorModel.setArcticCircleActiveState(checked);
  }
}
