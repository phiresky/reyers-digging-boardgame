import { makeAutoObservable, observable } from "mobx";
import { randomGenerator } from "~/util";

type PlayerState = {
  fuel: number;
  coins: number;
  hull: number;
  digger: number;
  radar: number;
};
export class Game {
  players: { info: { name: string }; state: PlayerState }[] = [
    "Frank",
    "Joyce",
    "Flonk",
    "Boar",
  ].map((name) => ({
    info: { name },
    state: { fuel: 100, coins: 0, hull: 1, digger: 0, radar: 1 },
  }));

  grid: Tile[][];
  seed = "Hello";
  tileWidthPerPlayer = 6;
  // how many rows each of the layers has
  layerDepths = [1, 5, 4, 3];
  playerPositions = this.players.map((_, i) => ({
    x: i * this.tileWidthPerPlayer + 3,
    y: 0,
  }));
  warnings: string[] = [];
  constructor() {
    this.grid = randomGrid(this);
    makeAutoObservable(this);
    if (typeof window === "object") Object.assign(window, { game: this });
  }

  clickTile(x: number, y: number) {
    // find nearest player
    const playerI = this.playerPositions.reduce(
      (bestI, pos, i) =>
        Math.abs(pos.x - x) < Math.abs(this.playerPositions[bestI].x - x)
          ? i
          : bestI,
      0
    );
    const playerPos = this.playerPositions[playerI];
    const dX = x - playerPos.x;
    const dY = y - playerPos.y;
    // check if player is close enough
    if (Math.abs(dX) + Math.abs(dY) > 1) {
      this.warn("You can not move there, it is too far!");
      return;
    }
    const isDigging = this.grid[y][x].type !== "air";
    if (isDigging && this.grid[y][x].type === "rock") {
      this.warn("You can not dig through rock!");
      return;
    }
    if (isDigging && dY < 0) {
      this.warn("You can not dig upwards!");
      return;
    }
    if (isDigging && this.grid[playerPos.y + 1][playerPos.x].type === "air") {
      this.warn("You can not dig while in air!");
      return;
    }
    // move player to clicked position
    this.playerPositions[playerI] = { x, y };
    this.grid[y][x] = { type: "air" };
  }
  warn(message: string) {
    this.warnings.push(message);
  }
}

function randomGrid(game: Game) {
  const rng = randomGenerator(game.seed);
  // between each player, there is a column of rock.
  // other than that, distribution depends on randomTile per layer.
  const width = game.players.length * game.tileWidthPerPlayer;
  const grid: Tile[][] = [];
  for (const [layerI, layerDepth] of game.layerDepths.entries()) {
    for (let y = 0; y < layerDepth; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        if (x % game.tileWidthPerPlayer === 0) {
          row.push({ type: "rock" });
        } else {
          row.push(randomTile(rng, layerI as 0 | 1 | 2 | 3));
        }
      }
      grid.push(row);
    }
  }
  return grid;
}

/**
 * 
- Air: Can be flown through but you can not dig while in air.
- Earth: Digging costs 1 fuel, worth 1 coin each.
- Rock: Digging costs 2 but only possible with digger upgrade. Worth 0.
- Copper: Digging costs 2, worth 10 coins each
- Iron:  Digging costs 2, worth 15 coins each
- Gold: Digging costs 3, worth 50 coins each
- Diamond: Digging costs 5, worth 100 coins each
- Treasure: Digging costs 1, worth 500 coins each
- Lave: Digging free with hull upgrade. Falls on you, kills you.
 */
export type Tile = {
  type:
    | "air"
    | "earth"
    | "rock"
    | "copper"
    | "iron"
    | "gold"
    | "diamond"
    | "treasure"
    | "lava";
};

/**
 * Air is distributed evenly through all layers. On the first layer, there's mostly earth, with some copper and iron. On the second layer, there is more iron and copper, and additionally some gold and diamond. On the third layer, there's more diamond and gold, and also some lava  and maybe treasure.
 */
function randomTile(rng: () => number, layer: 0 | 1 | 2 | 3): Tile {
  const weights = {
    0: { air: 1 },
    1: {
      air: 0.3,
      earth: 0.6,
      copper: 0.05,
      iron: 0.05,
    },
    2: {
      air: 0.1,
      earth: 0.4,
      copper: 0.1,
      iron: 0.1,
      gold: 0.1,
      diamond: 0.1,
      treasure: 0,
      lava: 0,
    },
    3: {
      air: 0.1,
      earth: 0.3,
      rock: 0.05,
      copper: 0.05,
      iron: 0.05,
      gold: 0.2,
      diamond: 0.2,
      treasure: 0.05,
      lava: 0,
    },
  }[layer];
  // weighted random. Get sum of weights:
  const sum = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  // get random number between 0 and sum:
  let random = rng() * sum;
  // subtract weights until random is below 0:
  for (const [type, weight] of Object.entries(weights) as [
    keyof typeof weights,
    number
  ][]) {
    if (random < weight) {
      return { type };
    }
    random -= weight;
  }
  throw Error("impossible");
}
