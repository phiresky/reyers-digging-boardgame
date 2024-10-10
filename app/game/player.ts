import { makeAutoObservable } from "mobx";
import { Game, GameEvent, GameEventData, PlayerInfo, UpgradeId } from "./logic";
import { api } from "./api-client";
import { gameFromEvents } from "~/util";

export class TablePlayerSeat {
  warnings: string[] = [];
  upgradeDialog: boolean = false;
  game?: Game;
  playerId?: number;
  sessionSecret: string;
  sessionSecretHash: string;
  events: GameEvent[] = [];
  players: PlayerInfo[] = [];
  sse: EventSource;
  server: string;
  tableId: string;
  constructor(
    tableId: string,
    sessionSecret: string,
    sessionSecretHash: string,
    server: string
  ) {
    if (typeof window !== "undefined") Object.assign(window, { player: this });
    this.server = server;
    this.tableId = tableId;
    console.log("init TablePlayerSeat");
    this.sessionSecret = sessionSecret;
    this.sessionSecretHash = sessionSecretHash;
    makeAutoObservable(this);
    const url = new URL(server + "/sse");
    url.searchParams.append("tableId", tableId);
    this.sse = new EventSource(url);
    this.sse.addEventListener("message", (e) => {
      console.log("sse event", e);
      const event = JSON.parse(e.data) as GameEvent;
      if (this.events.length !== event.sequence) {
        this.warnings.push("Event sequence mismatch");
      }
      this.events.push(event);
      this.localApplyEvent(event);
    });
  }
  destructor() {
    this.sse.close();
  }
  localApplyEvent(event: GameEvent) {
    if (event.type === "system-join-player") {
      this.players = this.events
        .filter((e) => e.type === "system-join-player")
        .map((p) => p.player);
      const me = this.players.findIndex(
        (p) => p.sessionSecretHash === this.sessionSecretHash
      );
      if (me >= 0) this.playerId = me;
      console.log(this.players, this.sessionSecretHash);
    } else if (event.type === "system-start-game") {
      this.game = gameFromEvents(this.events, (event) => {
        this.localApplyEvent({
          clientTimestamp: new Date().toJSON(),
          serverTimestamp: new Date().toJSON(),
          ...event,
          sequence: -1,
        });
      });
    } else if (event.type === "system-message") {
      this.warnings.push(event.message);
    } else if (this.game) {
      this.game.applyEvent(event);
    } else {
      console.warn("not know how to apply event");
    }
  }

  async sendEvent(event: GameEventData) {
    try {
      await api(this.server, {
        sessionSecret: this.sessionSecret,
        tableId: this.tableId,
        event,
      });
    } catch (e) {
      console.error(e);
      this.warnings.push(String(e));
    }
  }
  async purchaseUpgrade(id: UpgradeId) {
    if (this.playerId === undefined) throw Error("not logged in");
    await this.sendEvent({
      type: "player-upgrade",
      player: this.playerId,
      upgrade: id,
    });
  }
  async clickTile(x: number, y: number) {
    if (this.playerId === undefined) throw Error("not logged in");
    await this.sendEvent({ type: "player-move", x, y, player: this.playerId });
  }
  async startGame() {
    await this.sendEvent({ type: "system-start-game" });
  }
}
