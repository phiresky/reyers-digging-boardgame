import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { JoinTable } from "~/game/join-table";

export const meta: MetaFunction = () => {
  return [
    { title: "Reyers Digging Boardgame" },
    { name: "description", content: "dig dig dig!" },
    { property: "og:description", content: "dig dig dig!" },
    { property: "og:image", content: "/reyers-digging-boardgame/icon.png" },
  ];
};
export const links: LinksFunction = () => {
  return [{ rel: "icon", href: "/reyers-digging-boardgame/player.svg" }];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="leading text-2xl font-bold text-gray-800">
            <b>Reyers Digging Boardgame</b>
          </h1>
        </header>
        <JoinTable />
      </div>
    </div>
  );
}
