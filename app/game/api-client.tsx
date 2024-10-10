import { GameApiCall } from "server";

export async function api(
  server: string,
  event: Omit<GameApiCall, "clientTimestamp">
) {
  const res = await fetch(server + "/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...event, clientTimestamp: new Date().toJSON() }),
  });
  if (!res.ok) {
    let text = `${res.status} ${res.statusText}`;
    try {
      text = await res.text();
      text = JSON.parse(text).message;
    } catch (e) {
      // throw below
    }
    throw new Error(text);
  }
  return res.json();
}
