import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { randomGenerator } from "~/util";
import { JoinTable } from "./join-table";
import { Tile } from "./logic";
import { TablePlayerSeat } from "./player";
import { airAbove, svgs } from "./svgs";
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
      <div className="w-100">
        <AboveGround player={player} />
        <GroundGrid player={player} />
        {player.upgradeDialog && <UpgradeDialog player={player} />}

        {player.warnings.length > 0 && (
          <div className="fixed flex h-screen top-0 left-0 w-screen">
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
          <div className="text-center">{player.info.name}</div>
          <div>Coins: {player.state.coins}</div>
          <div>Fuel: {player.state.fuel}</div>
          <div>
            Upgrades: {player.state.upgrades.join(", ")}{" "}
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
            name={p.info.name + (i === player.playerId ? " (you)" : "")}
            x={p.state.x}
            y={p.state.y}
            fuelWarning={p.state.fuel < 5}
            yOffset={(() => {
              const inx = layerSplits.findIndex((d) => d > p.state.y);
              return inx >= 0 ? inx : layerSplits.length;
            })()}
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

function PlayerView({
  x,
  y,
  yOffset,
  fuelWarning,
}: {
  name: string;
  x: number;
  y: number;
  yOffset: number;
  fuelWarning: boolean;
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
      {playerSvg}
      {fuelWarning && <div className="absolute inset-0 text-red-700">⚠</div>}
    </div>
  );
}
const playerSvg = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
    {/*<!-- Wheels (4 wheels) -->*/}
    <circle cx="4" cy="17" r="1.5" fill="black" />
    <circle cx="8" cy="17" r="1.5" fill="black" />
    <circle cx="12" cy="17" r="1.5" fill="black" />
    <circle cx="16" cy="17" r="1.5" fill="black" />

    {/*<!-- Machine body -->*/}
    <rect x="2" y="14" width="16" height="2" fill="gray" />

    {/*<!-- Dome -->*/}
    <path d="M4 14 A 6 6 0 0 1 16 14" fill="blue" />

    {/*<!-- Window -->*/}
    <path d="M11 8 Q15 8 15 12 L15 14 Q11 14 11 10 Z" fill="lightblue" />

    {/*<!-- Pole for propeller -->*/}
    <rect x="9.5" y="5" width="1" height="3" fill="gray" />

    {/*<!-- Propeller (squished horizontally, centered on top of pole) -->*/}
    <g transform="translate(10 5)">
      <ellipse rx="6" ry="0.6" fill="gray" transform="rotate(10)" />
      <ellipse rx="5.8" ry="0.5" fill="lightgray" transform="rotate(160)" />
      <ellipse rx="5.6" ry="0.4" fill="darkgray" transform="rotate(190)" />
    </g>
  </svg>
);
