import { useNavigate, useSearchParams } from "@remix-run/react";
import { cryptoRandomId } from "~/util";
import { api } from "./api-client";
import { useLocalStorage, usePlayerSessionSecret } from "./util";
import { useState } from "react";

export function JoinTable(props: { tableId?: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const server = params.get("server");
  const [name, setName] = useLocalStorage("playerName", () => "");
  const [sessionSecret, sessionSecretHash] = usePlayerSessionSecret();
  const [error, setError] = useState<string | null>(null);
  return (
    <nav className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
      Enter your name:
      <input
        className="border border-blue-500"
        value={name}
        pattern="[A-Za-z0-9\-_\.]{3,20}"
        onChange={(e) => setName(e.target.value)}
        title="username must be 3-20 characters long and contain only letters, numbers, and -_."
      />
      <button
        className="group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500"
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
