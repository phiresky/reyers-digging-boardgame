# Preamble

You are a flying digging machine deployed on Mars by a company. You need to dig into the planet, collecting rare resources.

The goal of the game is to get the most profit.

# Gameplay

There is one playing field consisting of a grid of tiles. The grid is split into three sections of depth. Within each section the tiles are random and distributed at the start of the game. The second and third stage are only determined once the first person hits the start of the layer.

Each player is next to each other and can go into their neighbors space. The neighbors are on a torus, so the left most player can go to the rightmost players side.

The layers are 5x5, 5x4, 5x3 in size for each player. So a four player game looks like this:

```
x xcx|x xxx|xxxxx|xxxxx|
xixxx|xxcxx|xxxxx|xxxxx|
xx xx|x xxx|xxxxx|xxxxx|
x xxx|xxxix|xxxxx|xxxxx|
-----|-----|-----|-----|
xxxxx|xxxxx|xxxxx|xxxxx|
xxxxx|xxxxx|xxxxx|xxxxx|
xxxxx|xxxxx|xxxxx|xxxxx|
xxxxx|xxxxx|xxxxx|xxxxx|
-----|-----|-----|-----|
xxxxx|xxxxx|xxxxx|xxxxx|
xxxxx|xxxxx|xxxxx|xxxxx|
xxxxx|xxxxx|xxxxx|xxxxx|
```

# Resources

A tile is one of the following types, with the random distribution changing in each of the three layers:

- Air: Can be flown through (no digging)
- Earth: Digging costs 1 fuel, worth 1 coin each.
- Rock: Digging costs 2 but only possible with digger upgrade. Worth 0.
- Copper: Digging costs 2, worth 10 coins each
- Iron: Digging costs 2, worth 15 coins each
- Gold: Digging costs 3, worth 50 coins each
- Diamond: Digging costs 5, worth 100 coins each
- Treasure: Digging costs 1, worth 500 coins each
- Lave: Digging free with hull upgrade. Falls on you, kills you.

Air is distributed evenly through all layers. On the first layer, there's mostly earth, with some copper and iron. On the second layer, there is more iron and copper, and additionally some gold and diamond. On the third layer, there's more diamond and gold, and also some lava and maybe treasure.

# Constraints

- You have a tank with 20 (upgradable) fuel. You need to make sure you reach the ground again before running out of fuel, otherwise you die.
- You can dig left, right, and down, but only while you are sitting on a ground (field below you =not air).
- You can fly in all four directions.

# Upgrades

- Tank: upgrade to size 40 (cost 20),
- Propeller: fly two spaces per gas
- Digger: Digging costs less, can dig stone
- Storage: Carry More
- Hull: Can handle lava pockets

# Start of the game.

1. shuffle the layer-1 tiles and place them onto the grid.
2. Each player chooses their digging machine (player token color).
3. Give 20 gold to each player.
4. Each player chooses how much money to bid on each starting space. After all bids are collected, we look at the most money any player has put on any starting space. That player receives that space. All other coins are returned to each player. Repeat. In case of draw either player may withdraw their bid. If not ??

# Each turn

First, a player may purchase upgrades for money.

Then, the player may dig into the ground.

While no player has upgraded their stone, each turn is simultaneous. After that, the stone upgraders play last (in order).

Each turn consists of a sequence of moves and digs, hopefully returning to the base before running out of fuel.
