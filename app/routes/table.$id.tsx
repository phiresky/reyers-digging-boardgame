import { MetaFunction, useParams, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import GameField from "~/game/game-field";
import { TablePlayerSeat } from "~/game/player";
import { usePlayerSessionSecret } from "~/game/util";

export const meta: MetaFunction = () => {
  return [
    { title: "Reyers Digging Game!" },
    { name: "description", content: "Table xxx in digging game!" },
  ];
};

export default function Table() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const server = params.get("server");
  const [sessionSecret, sessionSecretHash] = usePlayerSessionSecret();
  if (!id || !server || !sessionSecretHash) return <div>no table</div>;
  return (
    <Wrap
      id={id}
      sessionSecret={sessionSecret}
      sessionSecretHash={sessionSecretHash}
      server={server}
    />
  );
}

function Wrap({
  id,
  sessionSecret,
  sessionSecretHash,
  server,
}: {
  id: string;
  sessionSecret: string;
  sessionSecretHash: string;
  server: string;
}) {
  const [game, setGame] = useState<TablePlayerSeat | null>(null);
  useEffect(() => {
    const seat = new TablePlayerSeat(
      id,
      sessionSecret,
      sessionSecretHash,
      server
    );
    setGame(seat);
    return () => seat.destructor();
  }, [id, sessionSecret, sessionSecretHash, server]);
  if (!game) return <div>loading...</div>;
  return <GameField player={game} />;
}
