import { useNavigate } from "@remix-run/react";
import { useState } from "react";
import { cryptoRandomId } from "~/util";
import { api } from "./api-client";
import { useApiServer, useLocalStorage, usePlayerSessionSecret } from "./util";

export function JoinTable(props: { tableId?: string }) {
  const navigate = useNavigate();
  const server = useApiServer();
  const [name, setName] = useLocalStorage("playerName", () => "");
  const [sessionSecret, sessionSecretHash] = usePlayerSessionSecret();
  const [error, setError] = useState<string | null>(null);
  return (
    <nav className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6">
      Enter your name:
      <input
        className="border border-blue-500"
        value={name ?? ""}
        pattern="[A-Za-z0-9\-_\.]{3,20}"
        onChange={(e) => setName(e.target.value)}
        title="username must be 3-20 characters long and contain only letters, numbers, and -_."
      />
      <button
        className="group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline border border-black mx-auto"
        onClick={async () => {
          try {
            const tableId = props.tableId ?? cryptoRandomId(10);
            if (!server) throw Error("no server set");
            if (!name.match(/^[A-Za-z0-9\-_.]{3,20}$/))
              throw Error("invalid name (at least 3 letters)");
            await api(server, {
              tableId,
              sessionSecret,
              event: {
                type: "system-join-player",
                player: {
                  name,
                  sessionSecretHash,
                },
              },
            });
            navigate({
              pathname: `/table/${tableId}`,
              search: "?" + new URLSearchParams({ server }).toString(),
            });
          } catch (e) {
            console.error(e);
            setError(String(e));
          }
        }}
      >
        {props.tableId ? "Join this table!" : "Create new table"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </nav>
  );
}
