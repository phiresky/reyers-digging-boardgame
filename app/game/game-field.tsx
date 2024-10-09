import { Fragment } from "react/jsx-runtime";
import { Game, Tile } from "./logic";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";

const GameField: React.FC<{ game: Game }> = observer(({ game }) => {
  return (
    <div className="w-100">
      <AboveGround game={game} />
      <GroundGrid game={game} />
      {game.warnings.length > 0 && (
        <div className="fixed flex h-screen top-0 left-0 w-screen">
          <div className="m-auto bg-gray-400 border-black text-red-500 p-2">
            <p>{game.warnings[0]}</p>
            <button
              className="text-black bg-white p-2 mx-auto block"
              onClick={() => game.warnings.shift()}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
export default GameField;

const tileSize = "3rem";
const fr = (width: number) => ({
  gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
});
const AboveGround: React.FC<{ game: Game }> = observer((props) => {
  const game = props.game;
  return (
    <div
      className={`grid bg-blue-300`}
      style={{
        ...fr(game.players.length),
        width: `calc(${
          game.players.length * game.tileWidthPerPlayer
        } * ${tileSize})`,
      }}
    >
      {game.players.map((player, i) => (
        <div key={i} className="">
          <div className="text-center">{player.info.name}</div>
          <div>Coins: {player.state.coins}</div>
          <div>Fuel: {player.state.fuel}</div>
          <div>
            Upgrades: {player.state.digger ? "Digger" : ""}{" "}
            <button className="border border-black p-1">Buy</button>
          </div>
        </div>
      ))}
    </div>
  );
});

const GroundGrid: React.FC<{ game: Game }> = observer(({ game }) => {
  // game consists of a grid of width playercount*5 and he^ight 12.
  const width = game.players.length * game.tileWidthPerPlayer;

  // cumulative sum of lyaer depths
  const layerSplits = game.layerDepths.map((d, i) =>
    game.layerDepths.slice(0, i + 1).reduce((a, b) => a + b, 0)
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
              className={`h-1 ${y === 1 ? "bg-grass" : "bg-black"}`}
              style={{ gridColumn: `span ${width} / span ${width}` }}
            ></div>
          )}
          {row.map((tile, x) => (
            <button
              key={x}
              className=""
              style={{ width: tileSize, height: tileSize }}
              onClick={() => game.clickTile(x, y)}
            >
              <TileView tile={tile} y={y} />
            </button>
          ))}
        </Fragment>
      ))}
      <div
        className="h-2 bg-black"
        style={{ gridColumn: `span ${width} / span ${width}` }}
      ></div>
      {game.players.map((player, i) => (
        <PlayerView
          key={i}
          name={player.info.name}
          x={player.state.x}
          y={player.state.y}
        />
      ))}
    </div>
  );
});

function TileView({ tile, y }: { tile: Tile; y: number }) {
  const svg = useMemo(
    () =>
      y === 0 /*&& tile.type === "air"*/ ? airAbove() : svgs[tile.type]?.(),
    [tile.type, y]
  );
  return <>{svg}</>;
}

function PlayerView({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <div
      className="absolute"
      style={{
        top: `calc(${y} * ${tileSize})`,
        left: `calc(${x} * ${tileSize})`,
        width: tileSize,
        height: tileSize,
      }}
    >
      {playerSvg}
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
const airAbove = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <rect width="20" height="20" fill={"#93C5FD"} />
  </svg>
);
// all svgs have native size of 20px times 20px
const svgs: { [t in Tile["type"]]: () => JSX.Element } = {
  // air is just shown as a dark gray background
  air: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill={"#333"} />
    </svg>
  ),
  // earth is a brown square background with a few small random rocks (eclipses) in gray
  earth: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#8B4513" />
      {[...Array(5)].map((_, i) => (
        <ellipse
          key={i}
          cx={Math.random() * 20}
          cy={Math.random() * 20}
          rx={Math.random() * 2}
          ry={Math.random() * 2}
          fill="#888"
        />
      ))}
    </svg>
  ),
  // rock is a gray square background with a few small random rocks (eclipses) in black
  rock: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#555" />
      {[...Array(5)].map((_, i) => (
        <ellipse
          key={i}
          cx={Math.random() * 20}
          cy={Math.random() * 20}
          rx={Math.random() * 2}
          ry={Math.random() * 2}
          fill="#333"
        />
      ))}
    </svg>
  ),
  // copper is shown as a earth-colored background with larger bronze-colored rocks
  copper: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#8B4513" />
      {[...Array(5)].map((_, i) => {
        // each rock is a random polygon with five edges
        const r = Math.random() * 3 + 3;
        const x = Math.random() * (20 - 2 * r) + r;
        const y = Math.random() * (20 - 2 * r) + r;
        const points = [...Array(5)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 5;
          // move each point a bit randomly outwards or inwards

          // return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
          return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
            y + Math.sin(a) * (r + Math.random() * 2 - 1)
          }`;
        });
        return <polygon key={i} points={points.join(" ")} fill="#CB6D51" />;
      })}
    </svg>
  ),
  // iron is shown as a earth-colored background with larger silver-colored rocks
  iron: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#8B4513" />
      {[...Array(5)].map((_, i) => {
        // each rock is a random polygon with five edges
        const r = Math.random() * 3 + 3;
        const x = Math.random() * (20 - 2 * r) + r;
        const y = Math.random() * (20 - 2 * r) + r;
        const points = [...Array(5)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 5;
          // move each point a bit randomly outwards or inwards

          // return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
          return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
            y + Math.sin(a) * (r + Math.random() * 2 - 1)
          }`;
        });
        return <polygon key={i} points={points.join(" ")} fill="#C0C0C0" />;
      })}
    </svg>
  ),
  // gold is shown as a earth-colored background with larger gold-colored rocks
  gold: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#8B4513" />
      {[...Array(5)].map((_, i) => {
        // each rock is a random polygon with five edges
        const r = Math.random() * 3 + 3;
        const x = Math.random() * (20 - 2 * r) + r;
        const y = Math.random() * (20 - 2 * r) + r;
        const points = [...Array(5)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 5;
          // move each point a bit randomly outwards or inwards

          // return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
          return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
            y + Math.sin(a) * (r + Math.random() * 2 - 1)
          }`;
        });
        return <polygon key={i} points={points.join(" ")} fill="#FFD700" />;
      })}
    </svg>
  ),
  // diamond is shown as a earth-colored background with larger diamond-colored rocks
  diamond: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#8B4513" />
      {[...Array(5)].map((_, i) => {
        // each rock is a random polygon with five edges
        const r = Math.random() * 3 + 3;
        const x = Math.random() * (20 - 2 * r) + r;
        const y = Math.random() * (20 - 2 * r) + r;
        const points = [...Array(5)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 5;
          // move each point a bit randomly outwards or inwards

          // return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
          return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
            y + Math.sin(a) * (r + Math.random() * 2 - 1)
          }`;
        });
        return <polygon key={i} points={points.join(" ")} fill="#B9F2FF" />;
      })}
    </svg>
  ),
  // lava is red with brighter red magma chunks
  lava: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <rect width="20" height="20" fill="#FF0000" />
      {[...Array(5)].map((_, i) => {
        // each rock is a random polygon with five edges
        const r = Math.random() * 3 + 3;
        const x = Math.random() * (20 - 2 * r) + r;
        const y = Math.random() * (20 - 2 * r) + r;
        const points = [...Array(5)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 5;
          // move each point a bit randomly outwards or inwards

          // return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
          return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
            y + Math.sin(a) * (r + Math.random() * 2 - 1)
          }`;
        });
        return <polygon key={i} points={points.join(" ")} fill="#FF4500" />;
      })}
    </svg>
  ),
  // treasure is a treasure box shape
  treasure: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M 10 2 L 2 6 L 2 14 L 10 18 L 18 14 L 18 6 Z" fill="#FFD700" />
      <path d="M 10 2 L 10 6 L 18 10 L 10 14 L 2 10 L 10 6 Z" fill="#FFD700" />
    </svg>
  ),
};
