import { observer } from "mobx-react-lite";
import { TablePlayerSeat } from "./player";

export const UpgradeDialog: React.FC<{
  player: TablePlayerSeat;
}> = observer(({ player }) => {
  if (!player.game || player.playerId === undefined) return null;
  const purchased = player.game.players[player.playerId].state.upgrades;
  // for each upgrade, display a header and description below with a buy button, if already bought gray it out and add purchased text
  return (
    <div className="fixed flex h-screen top-0 left-0 w-screen bg-black bg-opacity-40">
      <div className="m-auto bg-gray-400 border-black p-2">
        <div className="bg-white p-4">
          <div className="flex justify-between">
            <h1 className="text-2xl">Upgrades</h1>
            <button
              className="border border-black p-1"
              onClick={() => (player.upgradeDialog = false)}
            >
              Close
            </button>
          </div>
          <div className="grid">
            {player.game.config.availableUpgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className={`my-2 ${
                  purchased.includes(upgrade.id) ? "text-gray-600" : ""
                }`}
              >
                <div>
                  <h2 className="text-xl">{upgrade.name}</h2>
                  <p>{upgrade.description}</p>
                </div>
                <button
                  className="border border-black p-1"
                  disabled={purchased.includes(upgrade.id)}
                  onClick={() => player.purchaseUpgrade(upgrade.id)}
                >
                  {purchased.includes(upgrade.id)
                    ? "Purchased"
                    : `Buy (${upgrade.cost} coins)`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
