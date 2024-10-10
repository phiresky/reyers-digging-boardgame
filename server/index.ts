import sse, { DefaultSessionState } from "better-sse";
import express from "express";
import {
  defaultGameConfig,
  Game,
  GameEvent,
  GameEventData,
} from "~/game/logic";
import { cryptoRandomId, gameFromEvents, getSHA256Hash } from "~/util";
import cors from "cors";
import { promises as fs } from "node:fs";

const app = express();
app.use(express.json());
app.use(cors());

type Table = {
  events: GameEvent[];
  sessions: string[];
  game?: Game;
  channel: sse.Channel;
};
const tables = new Map<string, Table>();

export type GameApiCall = {
  tableId: string;
  sessionSecret: string;
  clientTimestamp: string;
  event: GameEventData;
};
app.post("/call", async (req, res) => {
  try {
    const body = req.body as GameApiCall;
    await applyGameEvent(body);
    res.send({ status: "ok" });
  } catch (e) {
    console.error(req.body, e);
    res.status(500).json(e);
  }
});
async function getTable(tableId: string) {
  let table = tables.get(tableId);
  if (!table) {
    try {
      const partialTable = await deserializeGame(tableId);
      table = {
        ...partialTable,
        channel: sse.createChannel(),
        game: undefined,
      };
      if (partialTable.game) {
        table.game = gameFromEvents(partialTable.events, () => {});
        for (const event of partialTable.events.slice(
          partialTable.events.findIndex((g) => g.type === "system-start-game")
        )) {
          table.game.applyEvent(event);
        }
      }
      tables.set(tableId, table);
    } catch (e) {
      console.log("new table?");
      return null;
    }
  }
  return table;
}
async function applyGameEvent(body: GameApiCall) {
  let table = await getTable(body.tableId);
  if (!table) {
    if (body.event.type !== "system-join-player") {
      throw Error("Table not found");
    }
    table = {
      events: [
        {
          type: "system-init",
          config: defaultGameConfig,
          sequence: 0,
          seed: cryptoRandomId(10),
          clientTimestamp: body.clientTimestamp,
          serverTimestamp: new Date().toJSON(),
        },
      ],
      sessions: [],
      channel: sse.createChannel(),
    };

    tables.set(body.tableId, table);
  }
  switch (body.event.type) {
    case "system-init": {
      if (table.game) {
        throw Error("Table already initialized");
      }
      if (body.sessionSecret !== table.sessions[0])
        throw Error("Not table creator");
      break;
    }
    case "system-start-game": {
      if (table.game) throw Error("Game already started");
      table.game = gameFromEvents(table.events, () => {});
      /*, (event) =>
        applyGameEvent({
          event,
          tableId: body.tableId,
          sessionSecret: body.sessionSecret,
          clientTimestamp: new Date().toJSON(),
        })
      );*/
      break;
    }
    case "system-join-player": {
      if (table.game) throw Error("Game already started");
      if (table.sessions.includes(body.sessionSecret))
        throw Error("Already joined");
      if (
        (await getSHA256Hash(body.sessionSecret)) !==
        body.event.player.sessionSecretHash
      )
        throw Error("Invalid session secret");
      table.sessions.push(body.sessionSecret);

      break;
    }
    case "player-move":
    case "player-upgrade": {
      if (!table.game) throw Error("Game not started");
      if (body.event.player !== table.sessions.indexOf(body.sessionSecret)) {
        throw Error("Not your player");
      }
      table.game.applyEvent(body.event);
      break;
    }
    case "system-message": {
      // no-op
      break;
    }
    default:
      throw Error(`unknown event type ${(body.event as any).type}`);
  }
  const finalEvent = {
    ...body.event,
    clientTimestamp: body.clientTimestamp,
    serverTimestamp: new Date().toJSON(),
    sequence: table.events.length,
  };
  table.events.push(finalEvent);
  await serializeGame(body.tableId, table);
  table.channel.broadcast(finalEvent, undefined, {
    eventId: finalEvent.sequence.toString(),
  });
}
async function serializeGame(id: string, table: Table) {
  // for now just write a json file to tables/id.json, moving the previous file (if exists) to .bak)
  const path = `server/tables/${id}.json`;
  const backup = `server/tables/${id}.json.bak`;
  // ensure dir exists
  await fs.mkdir("server/tables", { recursive: true });
  try {
    await fs.rename(path, backup);
  } catch (e) {
    if (
      typeof e !== "object" ||
      e == null ||
      !("code" in e) ||
      e.code !== "ENOENT"
    )
      throw e;
  }
  await fs.writeFile(path, JSON.stringify(table, null, 2));
}
async function deserializeGame(id: string) {
  const path = `server/tables/${id}.json`;
  const data = await fs.readFile(path, "utf-8");
  return JSON.parse(data) as Table;
}
app.get("/sse", async (req, res) => {
  const params = req.query as { tableId: string };
  try {
    const table = await getTable(params.tableId);
    if (!table) throw Error(`Table ${params.tableId} not found`);
    const session = await sse.createSession<DefaultSessionState>(req, res);
    table.channel.register(session);
    const queue = session.lastId
      ? table.events.slice(parseInt(session.lastId))
      : table.events;
    for (const event of queue) {
      session.push(event, undefined, event.sequence.toString());
    }
  } catch (e) {
    console.error(e);
    res.statusCode = 400;
    res.end();
  }
});

app.listen(3000);
