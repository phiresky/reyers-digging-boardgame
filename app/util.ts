import { Game, GameEvent, GameEventData } from "./game/logic";

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function xoshiro128ss(a: number, b: number, c: number, d: number) {
  return function () {
    let t = b << 9,
      r = b * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296;
  };
}

export const randomGenerator = (seedStr: string) => {
  const seed = cyrb128(seedStr);
  return xoshiro128ss(seed[0], seed[1], seed[2], seed[3]);
};

export async function getSHA256Hash(input: string) {
  const textAsBuffer = new TextEncoder().encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    textAsBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return hash;
}

export function cryptoRandomId(len: number) {
  // create a random hex string
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(len)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

export function gameFromEvents(
  events: GameEvent[],
  chainEvent: (d: GameEventData) => void
) {
  const config = events.filter((e) => e.type === "system-init").slice(-1)[0];
  if (!config) throw Error("No init event");
  const players = events
    .filter((g) => g.type === "system-join-player")
    .map((p) => p.player);
  return new Game(config, players, chainEvent);
}
