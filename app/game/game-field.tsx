import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { randomGenerator } from "~/util";
import { JoinTable } from "./join-table";
import { Game, Tile } from "./logic";
import { TablePlayerSeat } from "./player";
import { airAbove, PlayerSvg, svgs } from "./svgs";
import { UpgradeDialog } from "./upgrade-dialog";

const GameField: React.FC<{ player: TablePlayerSeat }> = observer(
  ({ player }) => {
    // before game start, just list players
    if (!player.game)
      return (
        <div>
          <h4>Game hasn't started yet</h4>
          <p>Players:</p>
          <div>
            {player.players
              .map((p, i) => p.name + (player.playerId === i ? " (you)" : ""))
              .join(", ")}
          </div>
          {player.playerId === 0 ? (
            <button
              className="border border-black p-1"
              onClick={() => player.startGame()}
            >
              Start Game
            </button>
          ) : player.playerId === undefined ? (
            <JoinTable tableId={player.tableId} />
          ) : (
            "Waiting for host to start game..."
          )}
        </div>
      );
    return (
      <div className="w-100 overflow-x-scroll">
        <AboveGround player={player} />
        <GroundGrid player={player} />
        <CheatSheet game={player.game} />
        {player.upgradeDialog && <UpgradeDialog player={player} />}

        {player.warnings.length > 0 && (
          <div className="fixed flex h-screen top-0 left-0 w-screen bg-black bg-opacity-40">
            <div className="m-auto bg-gray-400 border-black text-red-500 p-2">
              <p>{player.warnings[0]}</p>
              <button
                className="text-black bg-white p-2 mx-auto block"
                onClick={() => player.warnings.shift()}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
export default GameField;

const tileSize = "3rem";
const fr = (width: number) => ({
  gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
});
const AboveGround: React.FC<{ player: TablePlayerSeat }> = observer((props) => {
  const me = props.player;
  const game = me.game;
  if (!game) return <div>no game</div>;
  return (
    <div
      className={`grid bg-blue-300`}
      style={{
        ...fr(game.players.length),
        width: `calc(${
          game.players.length * game.config.tileWidthPerPlayer
        } * ${tileSize})`,
      }}
    >
      {game.players.map((player, i) => (
        <div key={i} className="">
          <div className="text-center">
            <div className="inline-block w-8 h-8 align-bottom">
              <PlayerSvg playerIndex={i} />
            </div>
            {player.info.name} {me.playerId === i ? " (you)" : ""}
          </div>
          <div className="ml-3">
            <div>Coins: {player.state.coins}</div>
            <div>Fuel: {player.state.fuel}</div>
            <div>
              Upgrades: {player.state.upgrades.join(", ") || "None"}{" "}
              {player.state.y === 0 && i === me.playerId ? (
                <button
                  className="border border-black p-1"
                  onClick={() => (me.upgradeDialog = true)}
                >
                  Buy
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const layerBorder = {
  tailwind: "h-1",
  css: "0.25rem",
};
const GroundGrid: React.FC<{ player: TablePlayerSeat }> = observer(
  ({ player }) => {
    const game = player.game;
    if (!game) return <div>no game</div>;
    // game consists of a grid of width playercount*5 and he^ight 12.
    const width = game.players.length * game.config.tileWidthPerPlayer;

    // cumulative sum of lyaer depths
    const layerSplits = game.config.layerDepths.map((d, i) =>
      game.config.layerDepths.slice(0, i + 1).reduce((a, b) => a + b, 0)
    );
    const getDist = ({ dx, dy }: { dx: number; dy: number }) => {
      if (player.playerId === undefined) return { distance: 0, price: 0 };
      const p = game.players[player.playerId];
      let x = p.state.x;
      let y = p.state.y;
      let price = 1;
      let distance = 0;
      while (true) {
        x += dx;
        y += dy;
        const tile =
          y >= 0 && y < game.grid.length ? game.grid[y][x] : undefined;
        if (!tile) break;
        if (game.canDig(player.playerId, p, x, y)) break;
        distance++;
        price =
          tile.type === "unknown" ? 0 : game.config.digging.fuelUsed[tile.type];
      }
      return { distance, price };
    };
    const distances = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ]
      .map((d) => ({ ...d, ...getDist(d) }))
      .filter((d) => d.distance > 0);
    return (
      <div
        className={`grid relative`}
        style={{ ...fr(width), width: `calc(${width} * ${tileSize})` }}
      >
        {game.grid.map((row, y) => (
          <Fragment key={y}>
            {layerSplits.includes(y) && (
              <div
                className={`${layerBorder.tailwind} ${
                  y === 1 ? "bg-grass" : "bg-black"
                }`}
                style={{ gridColumn: `span ${width} / span ${width}` }}
              ></div>
            )}
            {row.map((tile, x) => (
              <button
                key={x}
                className=""
                style={{ width: tileSize, height: tileSize }}
                onClick={() => player.clickTile(x, y)}
              >
                <TileView tile={tile} x={x} y={y} />
              </button>
            ))}
          </Fragment>
        ))}
        <div
          className="h-2 bg-black"
          style={{ gridColumn: `span ${width} / span ${width}` }}
        ></div>
        {game.players.map((p, i) => (
          <PlayerView
            key={i}
            playerIndex={i}
            name={p.info.name + (i === player.playerId ? " (you)" : "")}
            x={p.state.x}
            y={p.state.y}
            fuelWarning={p.state.fuel < 5}
            yOffset={(() => {
              const inx = layerSplits.findIndex((d) => d > p.state.y);
              return inx >= 0 ? inx : layerSplits.length;
            })()}
            distances={i === player.playerId ? distances : []}
          />
        ))}
      </div>
    );
  }
);

function TileView({ tile, x, y }: { tile: Tile; x: number; y: number }) {
  const svg = useMemo(
    () =>
      y === 0 /*&& tile.type === "air"*/
        ? airAbove
        : svgs[tile.type]?.(randomGenerator(x + "." + y)),
    [tile.type, x, y]
  );
  return <>{svg}</>;
}
type DistanceHint = {
  dx: number;
  dy: number;
  distance: number;
  price: number;
};

function PlayerView({
  x,
  y,
  yOffset,
  fuelWarning,
  playerIndex,
  distances,
}: {
  name: string;
  x: number;
  y: number;
  yOffset: number;
  fuelWarning: boolean;
  playerIndex: number;
  distances: DistanceHint[];
}) {
  return (
    <div
      className="absolute"
      style={{
        top: `calc(${y} * ${tileSize} + ${layerBorder.css} * ${yOffset})`,
        left: `calc(${x} * ${tileSize})`,
        width: tileSize,
        height: tileSize,
      }}
    >
      <PlayerSvg playerIndex={playerIndex} />
      {fuelWarning && <div className="absolute inset-0 text-red-700">⚠</div>}
      <svg
        className="absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        overflow="visible"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/*<!-- A marker to be used as an arrowhead -->*/}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        {distances.map((d, i) => (
          <LineArrow key={i} {...d} />
        ))}
      </svg>
    </div>
  );
}

function LineArrow({ dx, dy, distance, price }: DistanceHint) {
  const textOffset = 0.07;
  return (
    <>
      {" "}
      <line
        x1={10 + dx * 5}
        y1={10 + dy * 5}
        x2={10 + dx * 20 * distance}
        y2={10 + dy * 20 * distance}
        stroke="black"
        markerEnd="url(#arrow)"
      />
      {/*<circle
        cx={10 + dx * 20 * (distance - textOffset)}
        cy={10 + dy * 20 * (distance - textOffset)}
        r={4}
        fill="black"
      />*/}
      <text
        x={10 + dx * 20 * (distance - textOffset)}
        y={10 + dy * 20 * (distance - textOffset)}
        fontSize={4}
        fill={"white"}
        textAnchor="middle"
        dominantBaseline={"middle"}
      >
        {price}
      </text>
    </>
  );
}

function CheatSheet(props: { game: Game }) {
  return (
    <>
      Cheat Sheet
      <div className="grid grid-cols-3 max-w-[20rem]">
        <div>Tile</div>
        <div>Dig Cost</div>
        <div>Value</div>
        {(
          Object.entries(props.game.config.digging.fuelUsed) as [
            Tile["type"],
            number
          ][]
        ).map(([mineral, cost], i) => (
          <>
            <div>
              <div className="w-8 h-8 inline-block align-middle">
                <TileView tile={{ type: mineral }} x={i} y={1} />
              </div>
              <div className="inline-block">
                {mineral.replace(/^./, (e) => e.toLocaleUpperCase())}
              </div>
            </div>
            <div>{cost} fuel</div>
            <div>
              {
                props.game.config.digging.coinsGained[
                  mineral as keyof typeof props.game.config.digging.coinsGained
                ]
              }{" "}
              coins
            </div>
          </>
        ))}
      </div>
    </>
  );
}
