import React from "react";
import { Tile } from "./logic";

// Common function to create a background rectangle
const createBackground = (color: string) => (
  <rect width="20" height="20" fill={color} stroke={color} />
);
export const airAbove = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    {createBackground("#93C5FD")}
  </svg>
);

// Common function to create random ellipses
const createRandomEllipses = (
  rng: () => number,
  count: number,
  fillColor: string
) =>
  [...Array(count)].map((_, i) => (
    <ellipse
      key={i}
      cx={rng() * 20}
      cy={rng() * 20}
      rx={rng() * 2}
      ry={rng() * 2}
      fill={fillColor}
    />
  ));

// Common function to create random polygons
const createRandomPolygons = (
  rng: () => number,
  count: number,
  fillColor: string
) =>
  [...Array(count)].map((_, i) => {
    const r = rng() * 3 + 3;
    const x = rng() * (20 - 2 * r) + r;
    const y = rng() * (20 - 2 * r) + r;
    const points = [...Array(5)].map((_, i) => {
      const a = (Math.PI * 2 * i) / 5;
      return `${(x + Math.cos(a) * (r + rng() * 2 - 1)).toFixed(3)},${(
        y +
        Math.sin(a) * (r + rng() * 2 - 1)
      ).toFixed(3)}`;
    });
    return <polygon key={i} points={points.join(" ")} fill={fillColor} />;
  });

// Common function to create random question marks
const createRandomQuestionMarks = (
  rng: () => number,
  count: number,
  fillColor: string
) =>
  [...Array(count)].map((_, i) => (
    <text
      key={i}
      x={rng() * 20}
      y={rng() * 20}
      fontSize={rng() * 4 + 4}
      fill={fillColor}
    >
      ?
    </text>
  ));

const commonSVGProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor",
  // style: { overflow: "visible" },
};
export const svgs: { [t in Tile["type"]]: (rng: () => number) => JSX.Element } =
  {
    air: (rng) => <svg {...commonSVGProps}>{createBackground("#333")}</svg>,
    earth: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        {createRandomEllipses(rng, 5, "#888")}
      </svg>
    ),
    rock: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#555")}
        {createRandomEllipses(rng, 5, "#333")}
      </svg>
    ),
    copper: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        {createRandomPolygons(rng, 5, "#CB6D51")}
      </svg>
    ),
    iron: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        {createRandomPolygons(rng, 5, "#C0C0C0")}
      </svg>
    ),
    gold: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        {createRandomPolygons(rng, 5, "#FFD700")}
      </svg>
    ),
    diamond: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        {createRandomPolygons(rng, 5, "#B9F2FF")}
      </svg>
    ),
    lava: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#FF0000")}
        {createRandomPolygons(rng, 5, "#FF4500")}
      </svg>
    ),
    treasure: () => (
      <svg {...commonSVGProps}>
        {createBackground("#8B4513")}
        <rect x="3" y="8" width="14" height="8" fill="#CD853F" />
        <path d="M3 8 C3 5 17 5 17 8" fill="#CD853F" />
        <rect x="3" y="8" width="14" height="1" fill="#8B4513" />
        <rect x="8" y="8" width="4" height="8" fill="#FFD700" />
        <circle cx="10" cy="12" r="1" fill="#8B4513" />
      </svg>
    ),
    unknown: (rng) => (
      <svg {...commonSVGProps}>
        {createBackground("#5C4033")}
        {createRandomQuestionMarks(rng, 5, "#888")}
      </svg>
    ),
  };
