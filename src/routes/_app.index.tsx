import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { GameRow } from "@/components/studio/GameRow";
import { gameTemplates } from "@/lib/templates";
import { engineOf, templateToGame } from "@/lib/studio-meta";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Home — Creator Studio" },
      { name: "description", content: "Prompt to playable game build console. Discover, play, and create games instantly." },
    ],
  }),
  component: Home,
});

const all = gameTemplates.map((t: any, i: number) => templateToGame(t, i));
const unityPicks = gameTemplates
  .filter((t: any) => engineOf(t) === "unity")
  .map((t: any, i: number) => templateToGame(t, i));
const webWorlds = gameTemplates
  .filter((t: any) => engineOf(t) === "threejs")
  .map((t: any, i: number) => templateToGame(t, i));
const html5Templates = gameTemplates
  .filter((t: any) => engineOf(t) === "construct")
  .map((t: any, i: number) => templateToGame(t, i));

function Home() {
  return (
    <div>
      <PageHeader title="Home" subtitle="Kult Creator Studio · Prompt Build Console" />
      <GameRow title="Players' Choice" games={all.slice(0, 10)} />
      <GameRow title="Trending" games={all.slice(6, 16)} />
      <GameRow title="HTML5 Templates" games={html5Templates} />
      <GameRow title="Unity Picks" games={unityPicks} />
      <GameRow title="Three.js Worlds" games={webWorlds} />
    </div>
  );
}
