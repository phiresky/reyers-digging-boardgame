import { MetaFunction, useParams } from "@remix-run/react";
import { useState } from "react";
import GameField from "~/game/game-field";
import { defaultGameConfig, Game } from "~/game/logic";
import { PlayerState } from "~/game/player";

export const meta: MetaFunction = () => {
  return [
    { title: "Digging Game!" },
    { name: "description", content: "Table xxx in digging game!" },
  ];
};

export default function Table() {
  const { id } = useParams();
  if (!id) return <div>no table</div>;
  const [game] = useState(
    () =>
      new PlayerState(
        new Game({
          players: ["Rob", "Flob", "Bob"].map((name) => ({ name })),
          type: "system-init",
          config: defaultGameConfig,
          seed: id,
        }),
        0
      )
  );
  return <GameField player={game} />;
}
