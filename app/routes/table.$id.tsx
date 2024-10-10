import { MetaFunction, useParams } from "@remix-run/react";
import { useState } from "react";
import GameField from "~/game/game-field";
import { Game } from "~/game/logic";

export const meta: MetaFunction = () => {
  return [
    { title: "Digging Game!" },
    { name: "description", content: "Table xxx in digging game!" },
  ];
};

export default function Table() {
  const { id } = useParams();
  if (!id) return <div>no table</div>;
  const [game] = useState(() => new Game(id));
  return <GameField game={game} />;
}
