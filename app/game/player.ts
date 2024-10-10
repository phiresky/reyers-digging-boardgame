import { makeAutoObservable } from "mobx";
import { Game, UpgradeId } from "./logic";

export class PlayerState {
  warnings: string[] = [];
  upgradeDialog: boolean = false;
  game: Game;
  playerId: number;

  constructor(game: Game, playerId: number) {
    this.game = game;
    this.playerId = playerId;
    makeAutoObservable(this);
  }

  purchaseUpgrade(id: UpgradeId) {
    this.game.purchaseUpgrade(this.playerId, id);
  }
  clickTile(x: number, y: number) {
    this.game.clickTile(this.playerId, x, y);
  }
}
