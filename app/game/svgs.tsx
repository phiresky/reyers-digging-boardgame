import React from "react";
import { Tile } from "./logic";

export const airAbove = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <rect width="20" height="20" fill={"#93C5FD"} />
  </svg>
);

// Common function to create a background rectangle
const createBackground = (color: string) => (
  <rect width="20" height="20" fill={color} />
);

// Common function to create random ellipses
const createRandomEllipses = (count: number, fillColor: string) =>
  [...Array(count)].map((_, i) => (
    <ellipse
      key={i}
      cx={Math.random() * 20}
      cy={Math.random() * 20}
      rx={Math.random() * 2}
      ry={Math.random() * 2}
      fill={fillColor}
    />
  ));

// Common function to create random polygons
const createRandomPolygons = (count: number, fillColor: string) =>
  [...Array(count)].map((_, i) => {
    const r = Math.random() * 3 + 3;
    const x = Math.random() * (20 - 2 * r) + r;
    const y = Math.random() * (20 - 2 * r) + r;
    const points = [...Array(5)].map((_, i) => {
      const a = (Math.PI * 2 * i) / 5;
      return `${x + Math.cos(a) * (r + Math.random() * 2 - 1)},${
        y + Math.sin(a) * (r + Math.random() * 2 - 1)
      }`;
    });
    return <polygon key={i} points={points.join(" ")} fill={fillColor} />;
  });

// Common function to create random question marks
const createRandomQuestionMarks = (count: number, fillColor: string) =>
  [...Array(count)].map((_, i) => (
    <text
      key={i}
      x={Math.random() * 20}
      y={Math.random() * 20}
      fontSize={Math.random() * 4 + 4}
      fill={fillColor}
    >
      ?
    </text>
  ));

export const svgs: { [t in Tile["type"]]: () => JSX.Element } = {
  air: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#333")}
    </svg>
  ),
  earth: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#8B4513")}
      {createRandomEllipses(5, "#888")}
    </svg>
  ),
  rock: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#555")}
      {createRandomEllipses(5, "#333")}
    </svg>
  ),
  copper: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#8B4513")}
      {createRandomPolygons(5, "#CB6D51")}
    </svg>
  ),
  iron: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#8B4513")}
      {createRandomPolygons(5, "#C0C0C0")}
    </svg>
  ),
  gold: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#8B4513")}
      {createRandomPolygons(5, "#FFD700")}
    </svg>
  ),
  diamond: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#8B4513")}
      {createRandomPolygons(5, "#B9F2FF")}
    </svg>
  ),
  lava: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#FF0000")}
      {createRandomPolygons(5, "#FF4500")}
    </svg>
  ),
  treasure: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      {createBackground("#8B4513")}
      <rect x="3" y="8" width="14" height="8" fill="#CD853F" />
      <path d="M3 8 C3 5 17 5 17 8" fill="#CD853F" />
      <rect x="3" y="8" width="14" height="1" fill="#8B4513" />
      <rect x="8" y="8" width="4" height="8" fill="#FFD700" />
      <circle cx="10" cy="12" r="1" fill="#8B4513" />
    </svg>
  ),
  unknown: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {createBackground("#5C4033")}
      {createRandomQuestionMarks(5, "#888")}
    </svg>
  ),
};
