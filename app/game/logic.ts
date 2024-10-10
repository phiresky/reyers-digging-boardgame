import { makeAutoObservable } from "mobx";
import { randomGenerator } from "~/util";

export type UpgradeId = "storage" | "fuel" | "digger";
type PlayerState = {
  fuel: number;
  coins: number;
  upgrades: UpgradeId[];
  x: number;
  y: number;
};
export class Game {
  config = {
    tileWidthPerPlayer: 6,
    fuelSizes: [10, 20],
    availableUpgrades: [
      {
        id: "fuel" as UpgradeId,
        name: "Big Tank",
        description: "Increase your gas tank from 10 to 20.",
        cost: 30,
      },
      {
        id: "storage" as UpgradeId,
        name: "Big Cargo Bay",
        description: "Allow carrying four instead of two minerals",
        cost: 30,
      },
      {
        id: "digger" as UpgradeId,
        name: "Durable Digger",
        description: "Allow digging through rocks",
        cost: 100,
      },
    ],
  };

  players: { info: { name: string }; state: PlayerState }[] = [
    "Frank",
    "Joyce",
    "Flonk",
    "Boar",
  ].map((name, i) => ({
    info: { name },
    state: {
      fuel: this.config.fuelSizes[0],
      coins: 10,
      upgrades: [],
      x: i * this.config.tileWidthPerPlayer + 3,
      y: 0,
    },
  }));

  grid: Tile[][];
  seed = "Hello";
  // how many rows each of the layers has
  layerDepths = [1, 5, 4, 4];
  warnings: string[] = [];
  upgradeDialog: boolean = false;
  constructor(seed: string) {
    this.seed = seed;
    this.grid = emptyGrid(this);
    for (let i = 0; i < this.players.length; i++) {
      revealLayer(this, 1, i);
    }
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
    if (Math.abs(dX) > 0 && Math.abs(dY) > 0) {
      this.warn("You can not move diagonally!");
      return;
    }
    if (Math.abs(dX) + Math.abs(dY) > 1) {
      // can move through air multiple spaces
      // check every space on the way is air
      const dx1 = Math.sign(dX);
      const dy1 = Math.sign(dY);
      let cx = player.state.x,
        cy = player.state.y;
      while (cx !== x || cy !== y) {
        cx += dx1;
        cy += dy1;
        if (this.grid[cy][cx].type !== "air") {
          this.warn("You can not fly through non-air tiles.");
          return;
        }
      }
    }
    const tgtType = this.grid[y][x].type;
    if (tgtType === "unknown") {
      this.warn("You can not dig unknown tiles!");
      return;
    }
    /*// find out which layer playre is digging into
      const layer = this.layerDepths.findIndex(
        (depth, layer) =>
          y >=
            this.layerDepths
              .slice(0, layer)
              .reduce((sum, depth) => sum + depth, 0) &&
          y <
            this.layerDepths
              .slice(0, layer + 1)
              .reduce((sum, depth) => sum + depth, 0)
      );
      revealLayer(this, layer as 1 | 2 | 3, playerI);
      return;
    }*/
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
      player.state.y + 1 < this.grid.length &&
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
      air: 1,
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

    if (y === 0) {
      player.state.fuel = this.getMaxFuel(player);
    } else {
      player.state.fuel -= fuelUsed[tgtType];
    }
    player.state.coins += coinsGained[tgtType];
    this.grid[y][x] = { type: "air" };
    if (player.state.fuel <= 0) {
      this.warn(
        "You ran out of fuel! Your money has been forfeit in order to pay for a new digger."
      );
      player.state.y = 0;
      player.state.coins = 0;
      player.state.fuel = this.getMaxFuel(player);
    }
    if (y < this.grid.length - 1 && this.grid[y + 1][x].type === "unknown") {
      // this.warn("You can not dig unknown tiles!");
      // find out which layer playre is digging into
      const layer = this.layerDepths.findIndex(
        (depth, layer) =>
          y + 1 >=
            this.layerDepths
              .slice(0, layer)
              .reduce((sum, depth) => sum + depth, 0) &&
          y + 1 <
            this.layerDepths
              .slice(0, layer + 1)
              .reduce((sum, depth) => sum + depth, 0)
      );
      revealLayer(this, layer as 1 | 2 | 3, playerI);
    }
  }
  getMaxFuel(player: { state: PlayerState }): number {
    const inx = player.state.upgrades.includes("fuel") ? 1 : 0;
    return this.config.fuelSizes[inx];
  }
  warn(message: string) {
    this.warnings.push(message);
  }
  purchaseUpgrade(playerI: number, id: UpgradeId) {
    const player = this.players[playerI];
    if (player.state.y > 0)
      throw Error("You can only purchase upgrades on the surface!");
    const upgrade = this.config.availableUpgrades.find((u) => u.id === id);
    if (!upgrade) throw Error("Upgrade not found!");
    if (player.state.coins < upgrade.cost) {
      throw Error("You can not afford this upgrade!");
    }
    // success!
    player.state.coins -= upgrade.cost;
    player.state.upgrades.push(id);
    if (id === "fuel") player.state.fuel = this.getMaxFuel(player);
  }
}

function emptyGrid(game: Game) {
  const grid: Tile[][] = [];
  const width = game.players.length * game.config.tileWidthPerPlayer;

  for (const [layerI, layerDepth] of game.layerDepths.entries()) {
    for (let y = 0; y < layerDepth; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        if (layerI === 0 && y === 0) {
          row.push({ type: "air" });
        } else if (x % game.config.tileWidthPerPlayer === 0) {
          row.push({ type: "rock" });
        } else {
          row.push({ type: "unknown" });
        }
      }
      grid.push(row);
    }
  }
  return grid;
}
function revealLayer(game: Game, layer: 1 | 2 | 3, playerI: number) {
  const rng = randomGenerator(game.seed + layer);
  const layerStartY = game.layerDepths
    .slice(0, layer)
    .reduce((sum, depth) => sum + depth, 0);
  const mineralCountsPerLayer: Record<
    1 | 2 | 3,
    Partial<Record<Tile["type"], number>>
  > = {
    1: { air: 5, copper: 2, iron: 1 },
    2: { air: 4, copper: 1, iron: 2, gold: 1, diamond: 1 },
    3: { air: 3, gold: 2, diamond: 2, treasure: 1, lava: 1 },
  };
  // for each player, we add minerals according to the above counts
  const targetChoices = [];
  const minX = playerI * game.config.tileWidthPerPlayer + 1;
  const maxX = minX + game.config.tileWidthPerPlayer - 1;
  for (let y = layerStartY; y < layerStartY + game.layerDepths[layer]; y++) {
    for (let x = minX; x < maxX; x++) {
      game.grid[y][x] = { type: "earth" };
      targetChoices.push(game.grid[y][x]);
    }
  }
  for (const [mineral, count] of Object.entries(
    mineralCountsPerLayer[layer]
  ) as [Tile["type"], number][]) {
    for (let i = 0; i < count; i++) {
      const target = targetChoices.splice(
        Math.floor(rng() * targetChoices.length),
        1
      )[0];
      target.type = mineral;
    }
  }
}

/*function randomGrid(game: Game) {
  const rng = randomGenerator(game.seed);
  // between each player, there is a column of rock.
  // other than that, distribution depends on randomTile per layer.
  const width = game.players.length * game.config.tileWidthPerPlayer;
  const grid: Tile[][] = [];
  for (const [layerI, layerDepth] of game.layerDepths.entries()) {
    for (let y = 0; y < layerDepth; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        if (x % game.config.tileWidthPerPlayer === 0) {
          row.push({ type: "rock" });
        } else {
          row.push(randomTile(rng, layerI as 0 | 1 | 2 | 3));
        }
      }
      grid.push(row);
    }
  }
  return grid;
}*/

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
    | "unknown"
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
*/
