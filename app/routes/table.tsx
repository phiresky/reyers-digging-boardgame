import { useState } from "react";
import GameField from "~/game/game-field";
import { Game } from "~/game/logic";

export default function Table() {
    const [game] = useState(() => new Game());
    return <GameField game={game} />;
}