import { useState } from "react";
import { ConsoleHero } from "./ConsoleHero";
import type { ChatMessage, ChatStage } from "@/lib/createChatFlow";
import flowSteps from "@/assets/Frame0.webp";
import goalArena from "@/assets/Frame1.webp";
import turboLeague from "@/assets/Frame2.webp";
import dragonRealms from "@/assets/Frame3.webp";
import aiBattleDome from "@/assets/Frame4.webp";
import skyKingdom from "@/assets/Frame5.webp";

const POPULAR_WORLDS = [
  {
    image: goalArena,
    title: "Goal Arena",
    seed: "Create a sports soccer arena game with exciting matches and stadium vibes",
  },
  {
    image: turboLeague,
    title: "Turbo League",
    seed: "Create a fast arcade racing game with drift boosts and checkered flags",
  },
  {
    image: dragonRealms,
    title: "Dragon Realms",
    seed: "Create a fantasy RPG adventure with dragons, castles, and quests",
  },
  {
    image: aiBattleDome,
    title: "AI Battle Dome",
    seed: "Create an arcade robot battle arena game with neon lights",
  },
  {
    image: skyKingdom,
    title: "Sky Kingdoms",
    seed: "Create a floating sky kingdom strategy game with castles and clouds",
  },
] as const;

type MobileHomeHeroProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCategoryPick: (seed: string) => void;
  onWorldPick: (seed: string) => void;
  messages?: ChatMessage[];
  chatStage?: ChatStage;
  onQuickReply?: (text: string) => void;
  isThinking?: boolean;
};

export function MobileHomeHero({
  value,
  onChange,
  onSubmit,
  onCategoryPick,
  onWorldPick,
  messages,
  chatStage,
  onQuickReply,
  isThinking,
}: MobileHomeHeroProps) {
  const [consoleOpen, setConsoleOpen] = useState(false);

  return (
    <section className="relative z-10 space-y-5 px-3 pb-4 pt-2 min-[1190px]:hidden">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="animate-float-up opacity-0" style={{ animationDelay: "0ms" }}>
          <div
            className={`relative text-center transition-opacity duration-200 ${
              consoleOpen ? "pointer-events-none opacity-0" : ""
            }`}
          >
            <p className="mx-auto inline-flex items-center gap-1.5 rounded-full px-3 pb-1 font-display text-xs font-black uppercase tracking-[0.12em] text-violet-950 shadow-[0_4px_14px_rgba(109,40,217,0.18)]">
              <span className="animate-pulse-glow inline-block text-violet-600">✧</span>
              AI BUILDS. YOU IMAGINE.
              <span
                className="animate-pulse-glow inline-block text-violet-600"
                style={{ animationDelay: "1s" }}
              >
                ✧
              </span>
            </p>
            <h1
              className="mt-2 flex flex-col items-center font-black uppercase leading-[0.78]"
              style={{ fontFamily: '"Syncopate", sans-serif' }}
              aria-label="Create Playable Worlds"
            >
              <span className="text-[2.4rem] tracking-[-0.04em] text-[#12051f] [-webkit-text-stroke:1.5px_white] [text-shadow:0_4px_0_#4c1d95,0_7px_12px_rgba(46,16,101,0.32)]">
                Create
              </span>
              <span
                className="mt-2 text-[2rem] tracking-[-0.045em]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7543e9 0%, #8245eb 25%, #8c43ef 50%, #a145f2 75%, #bb49f1 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "1.5px white",
                  filter: "drop-shadow(3px 4px 0 #100018)",
                }}
              >
                Playable
              </span>
              <span
                className="mt-2 text-[2.15rem] tracking-[-0.045em]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7543e9 0%, #8245eb 25%, #8c43ef 50%, #a145f2 75%, #bb49f1 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "1.5px white",
                  filter: "drop-shadow(3px 4px 0 #100018)",
                }}
              >
                Worlds
              </span>
            </h1>
            <p className="mx-auto mt-2.5 max-w-[280px] text-sm font-semibold leading-snug text-violet-950">
              Describe your game idea and our AI crafts the game, agents, and world.
            </p>
          </div>
        </div>
        <div
          className="animate-fade-in relative z-20  opacity-0"
          style={{ animationDelay: "90ms" }}
        >
          <ConsoleHero
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            onCategoryPick={onCategoryPick}
            messages={messages}
            chatStage={chatStage}
            onQuickReply={onQuickReply}
            isThinking={isThinking}
            onFocusChange={setConsoleOpen}
            characterBottom="46%"
            placeholder="Type your game idea here…"
            className="w-full"
          />
        </div>
      </div>

      <div
        className="animate-float-up relative z-10 mx-auto w-full max-w-[520px] opacity-0 min-[480px]:max-w-[640px]"
        style={{ animationDelay: "180ms" }}
      >
        <img
          src={flowSteps}
          alt="Describe, AI Builds, Playtest, Publish"
          className="w-full"
          draggable={false}
        />
      </div>

      <section className="mx-auto mt-4 w-full max-w-[760px] pt-2">
        <h2 className="animate-float-up mb-4 flex items-center justify-center gap-2 text-center font-display text-base font-black uppercase tracking-wide text-violet-950 opacity-0">
          <span className="animate-pulse-glow text-fuchsia-500">✦</span>
          Popular Worlds
          <span className="animate-pulse-glow text-fuchsia-500" style={{ animationDelay: "1.2s" }}>
            ✦
          </span>
        </h2>
        <div className="-mx-3 px-3 pb-2 min-[500px]:overflow-x-auto min-[500px]:[scrollbar-width:none] min-[500px]:[&::-webkit-scrollbar]:hidden">
          <div className="flex flex-wrap justify-center gap-2 min-[500px]:min-w-0 min-[500px]:flex-nowrap min-[500px]:justify-start min-[500px]:gap-2.5">
            {POPULAR_WORLDS.map((world, index) => (
              <div
                key={world.title}
                className="w-[calc((100%_-_1rem)/3)] shrink-0 min-[500px]:min-w-0 min-[500px]:flex-1"
              >
                <PopularWorldCard world={world} onPick={onWorldPick} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function PopularWorldCard({
  world,
  onPick,
  index = 0,
}: {
  world: (typeof POPULAR_WORLDS)[number];
  onPick: (seed: string) => void;
  index?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(world.seed)}
      aria-label={world.title}
      className="animate-float-up group w-full overflow-hidden rounded-[17px] border border-white text-left opacity-0 shadow-[0_8px_18px_rgba(109,40,217,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(109,40,217,0.32)] active:scale-[0.97]"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <img
        src={world.image}
        alt={world.title}
        className="w-full transition duration-300 group-hover:scale-[1.03]"
        draggable={false}
      />
    </button>
  );
}
