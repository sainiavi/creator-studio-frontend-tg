import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/studio/PageHeader";
import { GameRow } from "@/components/studio/GameRow";
import { type Game } from "@/lib/games-data";
import arenaVideo from "@/assets/IMG_9260.MOV";
import stepTwoVideo from "@/assets/step2.mp4";
import stepThreeVideo from "@/assets/step3.mp4";
import momentsOne from "@/assets/moments-1.jpg";
import momentsTwo from "@/assets/moments2.jpg";
import momentsThree from "@/assets/moments3.mp4";
import warzoneWarriors from "@/assets/game1.png";
import highwayHustle from "@/assets/game2.png";
import zeroGPool from "@/assets/game3.png";
import guessTheAi from "@/assets/games4.png";
import zeroDash from "@/assets/game5.png";
import roboWars from "@/assets/game6.png";

const arenaVideos = [
  {
    src: arenaVideo,
    title: "Enter The Arena",
    category: "AI Arena",
    description: "Create your contender and get ready for the first challenge.",
  },
  {
    src: stepTwoVideo,
    title: "Build Your Game",
    category: "Creator Studio",
    description: "Shape the mechanics, style, and action with AI-powered tools.",
  },
  {
    src: stepThreeVideo,
    title: "Play And Compete",
    category: "Community",
    description: "Launch your game, challenge players, and climb the arena.",
  },
];

const moments = [
  { src: momentsOne, title: "Arena Highlights", label: "Featured Moment", type: "image" },
  { src: momentsTwo, title: "Behind The Build", label: "Creator Moment", type: "image" },
  { src: momentsThree, title: "Ready To Launch", label: "Studio Moment", type: "video" },
];

const featuredGames: Game[] = [
  {
    title: "Warzone Warriors",
    category: "Shooter",
    plays: "24K",
    emoji: "",
    gradient: "warm",
    creator: "Kult Games",
    thumbnailUrl: warzoneWarriors,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/warzonewarriors",
  },
  {
    title: "Highway Hustle",
    category: "Racing",
    plays: "18K",
    emoji: "",
    gradient: "cyan",
    creator: "Kult Games",
    thumbnailUrl: highwayHustle,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/highwayhustle",
  },
  {
    title: "Zero G Pool",
    category: "Sports",
    plays: "15K",
    emoji: "",
    gradient: "violet",
    creator: "Kult Games",
    thumbnailUrl: zeroGPool,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/zerogpool",
  },
  {
    title: "Guess The AI",
    category: "Puzzle",
    plays: "12K",
    emoji: "",
    gradient: "pink",
    creator: "Kult Games",
    thumbnailUrl: guessTheAi,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/guesstheai",
  },
  {
    title: "Zero Dash",
    category: "Arcade",
    plays: "9K",
    emoji: "",
    gradient: "green",
    creator: "Kult Games",
    thumbnailUrl: zeroDash,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/zerodash",
  },
  {
    title: "Robo Wars",
    category: "Combat",
    plays: "21K",
    emoji: "",
    gradient: "pink",
    creator: "Kult Games",
    thumbnailUrl: roboWars,
    playUrl: "https://kult-browser-rust-l2lwg.ondigitalocean.app/game/robowars",
  },
];

export const Route = createFileRoute("/_app/more")({
  head: () => ({
    meta: [
      { title: "More — Creator Studio" },
      { name: "description", content: "Settings, community, help and more options for your creator account." },
    ],
  }),
  component: More,
});

function More() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % arenaVideos.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const visibleVideos = [arenaVideos[activeIndex], arenaVideos[(activeIndex + 1) % arenaVideos.length]];

  const moveCarousel = (direction: number) => {
    setActiveIndex((current) => (current + direction + arenaVideos.length) % arenaVideos.length);
  };

  return (
    <div>
      <PageHeader
        title="More"
        subtitle=""
        links={[
          { label: "AI Arena", href: "https://kult-browser-rust-l2lwg.ondigitalocean.app/ai-arena" },
          { label: "Moments", href: "https://kult-browser-rust-l2lwg.ondigitalocean.app/moments" },
          { label: "Games", href: "https://kult-browser-rust-l2lwg.ondigitalocean.app/games" },
          { label: "Leagues", href: "https://kult-browser-rust-l2lwg.ondigitalocean.app/league" },
          { label: "Battles", href: "https://kult-browser-rust-l2lwg.ondigitalocean.app/battles" },
        ]}
      />
      <section className="px-6 py-10 lg:px-10 lg:py-14">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-mono mb-2 text-[10px] text-neon-violet">Watch. Create. Compete.</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white lg:text-5xl">
              AI Arena Battles
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveCarousel(-1)}
              className="grid size-12 place-items-center rounded-lg border border-neon-violet/70 bg-[#1b072e]/50 text-[#d87cff] transition hover:bg-neon-violet/20"
              aria-label="Previous videos"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => moveCarousel(1)}
              className="grid size-12 place-items-center rounded-lg border border-neon-violet/70 bg-[#1b072e]/50 text-[#d87cff] transition hover:bg-neon-violet/20"
              aria-label="Next videos"
            >
              <ChevronRight className="size-5" />
            </button>
            <a
              href="https://kult-browser-rust-l2lwg.ondigitalocean.app/ai-arena"
              className="label-mono flex h-12 items-center gap-3 rounded-lg border border-neon-violet/70 bg-[#1b072e]/50 px-5 text-[10px] font-bold text-[#d87cff] transition hover:bg-neon-violet/20"
            >
              View All
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {visibleVideos.map((video, index) => (
            <article
              key={`${video.src}-${activeIndex}`}
              className="group relative h-[260px] overflow-hidden rounded-2xl border border-white/15 bg-[#070711] shadow-[0_24px_70px_-32px_rgba(126,34,206,0.8)] lg:h-[300px]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <video
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                src={video.src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={video.title}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#090314]/10 to-[#05030b]/95" />
              <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                <span className="label-mono inline-flex rounded-md border border-neon-violet/80 bg-[#1b072e]/75 px-3 py-2 text-[9px] font-bold text-[#d87cff] backdrop-blur-md">
                  {video.category}
                </span>
                <h3 className="mt-3 font-display text-xl font-black uppercase italic leading-tight text-white lg:text-2xl">
                  {video.title}
                </h3>
                <p className="mt-2 text-sm leading-5 text-white/70">{video.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-12 lg:px-10 lg:pb-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="label-mono mb-2 text-[10px] text-neon-violet">Latest From The Community</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white lg:text-5xl">
              Moments
            </h2>
          </div>
          <a
            href="https://kult-browser-rust-l2lwg.ondigitalocean.app/moments"
            className="label-mono flex h-12 items-center gap-3 rounded-lg border border-neon-violet/70 bg-[#1b072e]/50 px-5 text-[10px] font-bold text-[#d87cff] transition hover:bg-neon-violet/20"
          >
            View All
            <ArrowUpRight className="size-4" />
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {moments.map((moment) => (
            <article
              key={moment.title}
              className="group relative h-[210px] overflow-hidden rounded-2xl border border-white/15 bg-[#070711] shadow-[0_20px_60px_-34px_rgba(126,34,206,0.75)]"
            >
              {moment.type === "image" ? (
                <img
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  src={moment.src}
                  alt={moment.title}
                />
              ) : (
                <video
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  src={moment.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={moment.title}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05030b]/95 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="label-mono text-[9px] font-bold text-[#d87cff]">{moment.label}</p>
                <h3 className="mt-2 font-display text-xl font-black uppercase text-white">
                  {moment.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GameRow
        title="BROWSER GAMES"
        games={featuredGames}
        viewAllTo="https://kult-browser-rust-l2lwg.ondigitalocean.app/games"
      />

    </div>
  );
}
