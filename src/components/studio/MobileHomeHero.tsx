import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { ConsoleHero } from "./ConsoleHero";
import type { ChatMessage, ChatStage } from "@/lib/createChatFlow";
import flow1Img from "@/assets/flow1Img.webp";
import flow2Img from "@/assets/flow2Img.webp";
import flow3Img from "@/assets/flow3Img.webp";
import flow4Img from "@/assets/flow4Img.webp";
import goalArena from "@/assets/goalArena.webp";
import turboLeague from "@/assets/turuboLeague.webp";
import dragonRealms from "@/assets/dragonRealms.webp";
import aiBattleDome from "@/assets/aiBattleDorm.webp";
import skyKingdom from "@/assets/skyKingdom.webp";

const FLOW_STEPS = [
  {
    image: flow1Img,
    title: "1. Describe",
    body: "Share your idea in simple words.",
  },
  {
    image: flow2Img,
    title: "2. AI Builds",
    body: "Artificial intelligence agents & world.",
  },
  {
    image: flow3Img,
    title: "3. Playtest",
    body: "Test instantly in play mode.",
  },
  {
    image: flow4Img,
    title: "4. Publish",
    body: "Launch your game to the world.",
  },
] as const;

const POPULAR_WORLDS = [
  {
    image: goalArena,
    title: "Goal Arena",
    category: "Sports",
    seed: "Create a sports soccer arena game with exciting matches and stadium vibes",
  },
  {
    image: turboLeague,
    title: "Turbo League",
    category: "Racing",
    seed: "Create a fast arcade racing game with drift boosts and checkered flags",
  },
  {
    image: dragonRealms,
    title: "Dragon Realms",
    category: "RPG",
    seed: "Create a fantasy RPG adventure with dragons, castles, and quests",
  },
  {
    image: aiBattleDome,
    title: "AI Battle Dome",
    category: "Arcade",
    seed: "Create an arcade robot battle arena game with neon lights",
  },
  {
    image: skyKingdom,
    title: "Sky Kingdoms",
    category: "Strategy",
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
    <section className="relative z-10 space-y-5 px-3 pb-4 pt-4 sm:hidden">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="animate-float-up opacity-0" style={{ animationDelay: "0ms" }}>
          <div
            className={`relative text-center transition-opacity duration-200 ${
              consoleOpen ? "pointer-events-none opacity-0" : ""
            }`}
          >
            <p className="font-display text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
              <span className="animate-pulse-glow inline-block">✧</span> AI BUILDS. YOU IMAGINE.{" "}
              <span className="animate-pulse-glow inline-block" style={{ animationDelay: "1s" }}>
                ✧
              </span>
            </p>
            <h1 className="mt-1.5 font-display text-[clamp(2rem,9vw,2.45rem)] font-black uppercase leading-[1.04]">
              <span className="block text-black drop-shadow-[0_2px_0_rgba(255,255,255,0.95)] [-webkit-text-stroke:1.2px_#fff]">
                Create
              </span>
              <span className="mx-auto block w-max bg-[linear-gradient(180deg,#ff6bea_0%,#8b5cf6_74%)] bg-clip-text text-transparent drop-shadow-[0_2px_0_#6d28d9] [-webkit-text-stroke:1px_#fff]">
                Playable
              </span>
              <span className="mx-auto block w-max bg-[linear-gradient(180deg,#ff75ec_0%,#7c3aed_78%)] bg-clip-text text-transparent drop-shadow-[0_2px_0_#6d28d9] [-webkit-text-stroke:1px_#fff]">
                Worlds
              </span>
            </h1>
            <p className="mx-auto mt-2.5 max-w-[280px] text-sm font-semibold leading-snug text-violet-950">
              Describe your game idea and our AI crafts the game, agents, and world.
            </p>
          </div>
        </div>
        <div className="animate-float-up relative mt-6 opacity-0" style={{ animationDelay: "90ms" }}>
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
            characterBottom="42%"
            placeholder="Type your game idea here…"
            className="w-full"
          />
        </div>
      </div>

      <div
        className="animate-float-up mx-auto rounded-[1.35rem] border border-white/90 bg-white/88 px-2.5 py-3 opacity-0 shadow-[0_8px_22px_rgba(124,58,237,0.16),0_0_16px_rgba(255,255,255,0.65),inset_0_1px_9px_rgba(255,255,255,0.92)] backdrop-blur-sm"
        style={{ animationDelay: "180ms" }}
      >
        <div className="grid grid-cols-4 gap-x-1 gap-y-1.5">
          {FLOW_STEPS.map((step) => (
            <div key={`${step.title}-icon`} className="flex justify-center px-0.5">
              <img
                src={step.image}
                alt=""
                className="h-[clamp(36px,10vw,44px)] w-auto object-contain"
                draggable={false}
              />
            </div>
          ))}
          {FLOW_STEPS.map((step) => (
            <p
              key={`${step.title}-label`}
              className="px-0.5 text-center text-[9px] font-black leading-tight text-violet-950"
            >
              {step.title}
            </p>
          ))}
          {FLOW_STEPS.map((step) => (
            <p
              key={`${step.title}-body`}
              className="flex min-h-[28px] items-start justify-center px-0.5 text-center text-[7px] font-bold leading-tight text-violet-900/85"
            >
              {step.body}
            </p>
          ))}
          {FLOW_STEPS.map((step) => (
            <div
              key={`${step.title}-arrow`}
              className="flex items-center gap-0.5 px-1 pt-1"
            >
              <span className="h-px flex-1 border-t border-dotted border-fuchsia-400/80" />
              <ArrowRight className="size-2.5 shrink-0 text-fuchsia-500" strokeWidth={3} />
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto mt-4 w-full max-w-[380px] pt-2">
        <h2 className="animate-float-up mb-4 flex items-center justify-center gap-2 text-center font-display text-base font-black uppercase tracking-wide text-violet-950 opacity-0">
          <span className="animate-pulse-glow text-fuchsia-500">✦</span>
          Popular Worlds
          <span className="animate-pulse-glow text-fuchsia-500" style={{ animationDelay: "1.2s" }}>
            ✦
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {POPULAR_WORLDS.slice(0, 3).map((world, index) => (
            <PopularWorldCard key={world.title} world={world} onPick={onWorldPick} index={index} />
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-2">
          {POPULAR_WORLDS.slice(3).map((world, index) => (
            <div key={world.title} className="w-1/3">
              <PopularWorldCard world={world} onPick={onWorldPick} index={index + 3} />
            </div>
          ))}
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
      className="animate-float-up group w-full overflow-hidden rounded-lg text-left opacity-0 shadow-[0_8px_18px_rgba(109,40,217,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(109,40,217,0.32)] active:scale-[0.97]"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden">
        <span
          className="animate-bob block h-full w-full"
          style={{ animationDelay: `${index * 0.3}s` }}
        >
          <img
            src={world.image}
            alt=""
            className="h-full w-full scale-110 object-cover object-center drop-shadow-[0_6px_12px_rgba(76,29,149,0.35)] transition duration-300 group-hover:scale-[1.16]"
            draggable={false}
          />
        </span>
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.5)_50%,transparent_80%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
      </div>
      <div className="relative z-[1] border-t border-white/25 bg-black/15 px-1.5 pb-1.5 pt-1 text-center backdrop-blur-[2px]">
        <p className="truncate text-[11px] font-black leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {world.title}
        </p>
        <p className="mt-px text-[8px] font-bold uppercase tracking-wide text-violet-100/90">
          {world.category}
        </p>
      </div>
    </button>
  );
}
