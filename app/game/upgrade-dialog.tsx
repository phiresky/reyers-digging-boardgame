import { observer } from "mobx-react-lite";
import { Game, UpgradeId } from "./logic";

export const UpgradeDialog: React.FC<{
  game: Game;
  purchased: string[];
  onClose: () => void;
  onPurchase: (upgradeId: UpgradeId) => void;
}> = observer(({ game, onClose, purchased, onPurchase }) => {
  // for each upgrade, display a header and description below with a buy button, if already bought gray it out and add purchased text
  return (
    <div className="fixed flex h-screen top-0 left-0 w-screen">
      <div className="m-auto bg-gray-400 border-black p-2">
        <div className="bg-white p-4">
          <div className="flex justify-between">
            <h1 className="text-2xl">Upgrades</h1>
            <button className="border border-black p-1" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="grid">
            {game.config.availableUpgrades.map((upgrade) => (
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
                  onClick={() => onPurchase(upgrade.id)}
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
