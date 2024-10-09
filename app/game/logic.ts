import { makeAutoObservable } from "mobx";
import { randomGenerator } from "~/util";

type PlayerState = {
  fuel: number;
  coins: number;
  hull: number;
  digger: number;
  radar: number;
  x: number;
  y: number;
};
export class Game {
  tileWidthPerPlayer = 6;

  players: { info: { name: string }; state: PlayerState }[] = [
    "Frank",
    "Joyce",
    "Flonk",
    "Boar",
  ].map((name, i) => ({
    info: { name },
    state: {
      fuel: 20,
      coins: 10,
      hull: 1,
      digger: 0,
      radar: 1,
      x: i * this.tileWidthPerPlayer + 3,
      y: 0,
    },
  }));

  grid: Tile[][];
  seed = "Hello";
  // how many rows each of the layers has
  layerDepths = [1, 5, 4, 3];
  warnings: string[] = [];
  constructor() {
    this.grid = randomGrid(this);
    makeAutoObservable(this);
    if (typeof window === "object") Object.assign(window, { game: this });
  }

  clickTile(x: number, y: number) {
    // find nearest player
    const playerI = this.players.reduce(
      (bestI, pos, i) =>
        Math.abs(pos.state.x - x) < Math.abs(this.players[bestI].state.x - x)
          ? i
          : bestI,
      0
    );
    const player = this.players[playerI];
    const dX = x - player.state.x;
    const dY = y - player.state.y;
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
    if (
      isDigging &&
      this.grid[player.state.y + 1][player.state.x].type === "air"
    ) {
      this.warn("You can not dig while in air!");
      return;
    }
    // move player to clicked position
    player.state.x = x;
    player.state.y = y;
    /*
    - Earth: Digging costs 1 fuel, worth 1 coin each.
- Rock: Digging costs 2 but only possible with digger upgrade. Worth 0.
- Copper: Digging costs 2, worth 10 coins each
- Iron:  Digging costs 2, worth 15 coins each
- Gold: Digging costs 3, worth 50 coins each
- Diamond: Digging costs 5, worth 100 coins each
- Treasure: Digging costs 1, worth 500 coins each
- Lave: Digging free with hull upgrade. Falls on you, kills you.
*/
    const fuelUsed = {
      air: 0,
      earth: 1,
      rock: 2,
      copper: 2,
      iron: 2,
      gold: 3,
      diamond: 5,
      treasure: 1,
      lava: 0,
    };
    const coinsGained = {
      air: 0,
      earth: 1,
      rock: 0,
      copper: 10,
      iron: 15,
      gold: 50,
      diamond: 100,
      treasure: 500,
      lava: 0,
    };

    player.state.fuel -= fuelUsed[this.grid[y][x].type];
    player.state.coins += coinsGained[this.grid[y][x].type];
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
