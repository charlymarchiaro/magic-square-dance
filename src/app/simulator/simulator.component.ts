import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import * as scenes from './scenes';
import { CONTROL_PANEL_WIDTH_PX, FRAMES_PER_SEC } from './params';
import { SimulatorModel } from './model/simulator.model';
import { SimulatorTimer } from './model/simulator-timer';
import { GridCellModel } from './model/grid-cell.model';


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


  public controlPanelStyle = {
    width: CONTROL_PANEL_WIDTH_PX,
  }


  constructor() {
    this.simulatorModel = new SimulatorModel();
    this.simulatorTimer = new SimulatorTimer(this.simulatorModel, 1000 / FRAMES_PER_SEC, 1);

    const scene = new scenes.MainScene(
      this.simulatorModel,
      this.simulatorTimer,
    );

    this.config = {
      title: 'Magic square dance',
      type: Phaser.AUTO,
      scale: {
        width: window.innerWidth - CONTROL_PANEL_WIDTH_PX,
        height: window.innerHeight - 60,
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


  ngOnInit() {
    this.phaser = new Phaser.Game(this.config);
    this.simulatorTimer.play();
  }
}
