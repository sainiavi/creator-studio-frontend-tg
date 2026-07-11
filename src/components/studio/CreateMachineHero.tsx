import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WandSparkles } from "lucide-react";

// The "creating machine" hero, built to the KULT developer-handoff spec
// (390px mobile, #0A0614 bg, #140B24 surface, #2A1547 border, #7C3AED→#B24DFF
// accents). Every asset is drawn in SVG/CSS — no raster images.

export function CreateMachineHero() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");

  const startCreating = (prompt?: string) => {
    const value = (prompt ?? idea).trim();
    if (value) sessionStorage.setItem("kult-create-prompt", value);
    navigate({ to: "/create" });
  };

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#2A1547] bg-[#0A0614] px-5 pb-6 pt-8">
      {/* Industrial backdrop: glow + bokeh lights + faint girders */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_40%_at_50%_30%,rgba(124,58,237,0.32),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_54px,rgba(168,85,247,0.35)_54px,rgba(168,85,247,0.35)_56px)]"
      />
      <span
        aria-hidden="true"
        className="absolute left-5 top-32 size-2 rounded-full bg-[#B24DFF]/80 blur-[2px]"
      />
      <span
        aria-hidden="true"
        className="absolute right-7 top-44 size-1.5 rounded-full bg-[#A855F7]/80 blur-[1px]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-32 left-8 size-1.5 rounded-full bg-[#E9D5FF]/50 blur-[1px]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-48 right-5 size-2 rounded-full bg-[#B24DFF]/70 blur-[2px]"
      />

      <div className="relative">
        {/* Hero headline: 34/36 extra-bold, gradient second line */}
        <h2 className="text-center font-sans text-[34px] font-extrabold uppercase leading-[36px] tracking-tight">
          <span className="block bg-gradient-to-b from-[#F5F3FF] to-[#C4B5FD] bg-clip-text text-transparent">
            Turn ideas into
          </span>
          <span className="block bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#B24DFF] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(124,58,237,0.6)]">
            Game universes
          </span>
        </h2>
        {/* Subtext */}
        <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-5 text-[#C4B5FD]">
          Describe your game idea and our AI crafts the game, agents, and world. ✦
        </p>

        {/* ——— The machine ——— */}
        <div className="relative mx-auto mt-8 max-w-[340px]">
          {/* Bloom behind the machine */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 bg-[radial-gradient(55%_45%_at_50%_30%,oklch(0.55_0.24_297/0.5),transparent_70%)] blur-md"
          />

          {/* Glass cylinder chamber */}
          <div className="relative z-[2] mx-auto -mb-2 flex w-48 flex-col items-center">
            {/* Lid */}
            <div className="h-3 w-32 rounded-t-[12px] bg-gradient-to-b from-[oklch(0.42_0.05_296)] to-[oklch(0.28_0.045_294)] shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]" />
            <div className="h-2.5 w-40 rounded-[6px] bg-gradient-to-b from-[oklch(0.35_0.05_295)] to-[oklch(0.22_0.04_293)] shadow-[inset_0_1px_0_oklch(1_0_0/0.25)]" />
            {/* Cylinder */}
            <div className="relative -mt-px h-[104px] w-36">
              <div className="absolute inset-0 overflow-hidden rounded-b-[14px] rounded-t-[10px] border-x border-b border-[oklch(0.75_0.15_300/0.5)] bg-[oklch(0.32_0.12_297/0.55)] shadow-[inset_0_0_34px_oklch(0.62_0.26_296/0.75)]">
                {/* Inner volumetric glow */}
                <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,oklch(0.65_0.25_297/0.55),transparent_75%)]" />
                {/* Glass reflections */}
                <span className="absolute left-2 top-2 h-4/5 w-1.5 rounded-full bg-white/30 blur-[1px]" />
                <span className="absolute right-3 top-3 h-2/3 w-1 rounded-full bg-white/15 blur-[1px]" />
              </div>
              {/* Crystal */}
              <Crystal className="absolute left-1/2 top-1/2 w-[74px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow drop-shadow-[0_0_18px_oklch(0.72_0.24_297)]" />
              {/* Energy rings wrapping the cylinder */}
              <span className="absolute -left-3 bottom-9 h-4 w-[168px] rounded-[50%] border-2 border-[oklch(0.68_0.24_297/0.8)] shadow-[0_0_12px_oklch(0.65_0.25_296/0.8)]" />
              <span className="absolute -left-1.5 bottom-5 h-3.5 w-[156px] rounded-[50%] border border-[oklch(0.68_0.24_297/0.6)]" />
              <span className="absolute left-0 bottom-1.5 h-3 w-[144px] rounded-[50%] border border-[oklch(0.68_0.24_297/0.4)]" />
            </div>
            {/* Pedestal drum */}
            <div className="h-4 w-44 rounded-[8px] bg-gradient-to-b from-[oklch(0.4_0.055_296)] to-[oklch(0.26_0.045_293)] shadow-[inset_0_1px_0_oklch(1_0_0/0.3)]" />
            <div className="h-3 w-52 rounded-[8px] bg-gradient-to-b from-[oklch(0.33_0.05_295)] to-[oklch(0.2_0.04_292)]" />
          </div>

          {/* Cat perched on the machine's top-left edge */}
          <CatBot className="absolute -top-7 left-0 z-[3] w-[84px] animate-bob" />
          {/* Helper bot floating beside the chamber */}
          <HelperBot className="absolute -top-6 right-0 z-[3] w-[68px] animate-bob [animation-delay:-1.7s]" />

          {/* Coiled hoses hugging the sides */}
          <Hose className="pointer-events-none absolute -left-5 top-32 z-0 w-16" />
          <Hose className="pointer-events-none absolute -right-5 top-32 z-0 w-16 -scale-x-100" />

          {/* Body */}
          <div className="relative z-[1] rounded-[2.1rem] bg-gradient-to-b from-[oklch(0.34_0.05_296)] via-[oklch(0.26_0.045_294)] to-[oklch(0.19_0.04_292)] p-4 pb-12 pt-6 shadow-[0_30px_70px_oklch(0_0_0/0.7),inset_0_1px_0_oklch(1_0_0/0.28),inset_0_-14px_30px_oklch(0_0_0/0.55)] ring-2 ring-[oklch(0.12_0.02_290)]">
            {/* Signature glowing inner rim */}
            <div className="pointer-events-none absolute inset-2 rounded-[1.7rem] border-2 border-[oklch(0.62_0.24_296/0.9)] shadow-[0_0_18px_oklch(0.62_0.24_296/0.7),inset_0_0_20px_oklch(0.62_0.24_296/0.45)]" />
            {/* Crystal light spilling onto the deck */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-[2.1rem] bg-[radial-gradient(50%_100%_at_50%_0%,oklch(0.6_0.22_297/0.4),transparent_75%)]" />

            {/* Side neon tubes + indicator dots */}
            <span className="absolute left-4 top-1/2 h-14 w-1.5 -translate-y-1/2 rounded-full bg-[oklch(0.66_0.24_296)] shadow-[0_0_12px_oklch(0.65_0.25_295)]" />
            <span className="absolute right-4 top-1/2 h-14 w-1.5 -translate-y-1/2 rounded-full bg-[oklch(0.66_0.24_296)] shadow-[0_0_12px_oklch(0.65_0.25_295)]" />
            <span className="absolute bottom-16 left-4 size-1.5 rounded-full bg-[oklch(0.7_0.19_50)] shadow-[0_0_8px_oklch(0.7_0.19_50/0.9)]" />
            <span className="absolute bottom-16 right-4 size-1.5 rounded-full bg-[oklch(0.7_0.19_50)] shadow-[0_0_8px_oklch(0.7_0.19_50/0.9)]" />

            {/* Screen recessed into the machine */}
            <div className="relative mx-3 mt-2 rounded-2xl bg-gradient-to-b from-[oklch(0.14_0.03_292)] to-[oklch(0.28_0.05_295)] p-1.5 shadow-[inset_0_2px_7px_oklch(0_0_0/0.9),0_1px_0_oklch(1_0_0/0.16)]">
              <div className="rounded-xl bg-[oklch(0.1_0.028_291/0.96)] p-3 shadow-[inset_0_2px_18px_oklch(0_0_0/0.95)]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={idea}
                    onChange={(event) => setIdea(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") startCreating();
                    }}
                    placeholder="Describe your game idea..."
                    className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-3.5 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-neon-violet/70 focus:shadow-[0_0_14px_oklch(0.6_0.24_296/0.4)]"
                  />
                  <button
                    type="button"
                    title="Start creating"
                    aria-label="Start creating"
                    onClick={() => startCreating()}
                    className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[oklch(0.82_0.13_300)] to-[oklch(0.62_0.24_296)] text-white shadow-[0_0_22px_oklch(0.68_0.23_296/0.9),inset_0_1px_0_oklch(1_0_0/0.6)] transition hover:brightness-110"
                  >
                    <WandSparkles className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tagline etched into the panel */}
            <p className="relative mx-3 mt-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#C4B5FD]">
              ✦ AI builds. You imagine. ✦
            </p>
          </div>

          {/* Base platform */}
          <div className="mx-auto h-4 w-[92%] rounded-b-[1.5rem] bg-gradient-to-b from-[oklch(0.28_0.048_294)] to-[oklch(0.18_0.038_292)] shadow-[inset_0_2px_3px_oklch(0_0_0/0.55)]" />
          <div className="relative mx-auto h-3.5 w-[78%] rounded-b-[1.3rem] bg-gradient-to-b from-[oklch(0.24_0.045_293)] to-[oklch(0.14_0.03_291)]">
            <span className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-neon-violet/90 blur-[1px] shadow-[0_0_10px_oklch(0.65_0.25_295)]" />
          </div>
          <div
            aria-hidden="true"
            className="mx-auto -mt-1.5 h-4 w-[70%] rounded-[50%] bg-[oklch(0.6_0.25_296/0.55)] blur-lg"
          />

          {/* START CREATING (56px / radius 28) straddles the machine's bottom edge */}
          <button
            type="button"
            onClick={() => startCreating()}
            className="absolute -bottom-7 left-1/2 z-[2] flex h-14 w-[82%] -translate-x-1/2 items-center justify-center gap-2.5 rounded-[28px] border border-[#B24DFF]/70 bg-gradient-to-b from-[#A855F7] to-[#7C3AED] font-sans text-base font-bold uppercase tracking-[0.06em] text-white shadow-[0_0_24px_#7C3AED,inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-110"
          >
            <StarBurst className="w-5" /> Start Creating
          </button>
        </div>
        {/* Room for the overlapping button */}
        <div className="h-9" />
      </div>
    </section>
  );
}

function Crystal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="crystal-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.78 0.2 300)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="oklch(0.78 0.2 300)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crystal-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.94 0.06 300)" />
          <stop offset="45%" stopColor="oklch(0.74 0.2 298)" />
          <stop offset="100%" stopColor="oklch(0.55 0.26 295)" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="37" fill="url(#crystal-halo)" />
      <path
        d="M40 8 L61 34 L40 72 L19 34 Z"
        fill="url(#crystal-body)"
        stroke="oklch(0.95 0.04 300)"
        strokeWidth="1.5"
      />
      <path d="M40 8 L40 72 M19 34 L61 34" stroke="oklch(0.96 0.03 300 / 0.7)" strokeWidth="1" />
      <path
        d="M40 8 L29 34 L40 72 M40 8 L51 34 L40 72"
        stroke="oklch(0.96 0.03 300 / 0.45)"
        strokeWidth="0.8"
        fill="none"
      />
      {/* sparkles */}
      <circle cx="26" cy="22" r="1.4" fill="oklch(0.95 0.04 300)" />
      <circle cx="57" cy="52" r="1.2" fill="oklch(0.95 0.04 300 / 0.8)" />
      <circle cx="52" cy="18" r="1" fill="oklch(0.95 0.04 300 / 0.7)" />
    </svg>
  );
}

function Hose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 150" className={className} aria-hidden="true" fill="none">
      {/* coiled ribbed tube */}
      <path
        d="M58 6 C18 10 6 34 10 62 C13 84 30 92 30 112 C30 128 20 138 12 144"
        stroke="oklch(0.2 0.04 293)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M58 6 C18 10 6 34 10 62 C13 84 30 92 30 112 C30 128 20 138 12 144"
        stroke="oklch(0.38 0.06 296)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="3.5 4.5"
      />
      <path
        d="M58 6 C18 10 6 34 10 62 C13 84 30 92 30 112 C30 128 20 138 12 144"
        stroke="oklch(0.62 0.2 297 / 0.5)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 2 L24 14 L34 8 L27 18 L38 20 L27 22 L34 32 L24 26 L20 38 L16 26 L6 32 L13 22 L2 20 L13 18 L6 8 L16 14 Z"
        fill="oklch(0.97 0.02 300)"
        stroke="oklch(0.8 0.14 300)"
        strokeWidth="1"
      />
    </svg>
  );
}

function CatBot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 104" className={className} aria-hidden="true">
      {/* ears */}
      <path
        d="M20 36 L8 6 L42 22 Z"
        fill="oklch(0.16 0.03 295)"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M80 36 L92 6 L58 22 Z"
        fill="oklch(0.16 0.03 295)"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* head */}
      <ellipse
        cx="50"
        cy="54"
        rx="38"
        ry="34"
        fill="oklch(0.16 0.03 295)"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="2.5"
      />
      {/* forehead star */}
      <path
        d="M50 26 L52.5 32 L58 34 L52.5 36 L50 42 L47.5 36 L42 34 L47.5 32 Z"
        fill="oklch(0.75 0.16 300)"
      />
      {/* winking left eye + glowing right eye */}
      <path
        d="M28 56 q8 8 16 0"
        stroke="oklch(0.92 0.06 300)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="68" cy="54" r="6.5" fill="oklch(0.92 0.06 300)" />
      <circle cx="68" cy="54" r="10" fill="oklch(0.75 0.18 300 / 0.35)" />
      {/* mouth */}
      <path
        d="M42 68 q4 5 8 0 q4 5 8 0"
        stroke="oklch(0.75 0.16 300)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* paws resting over the machine edge */}
      <ellipse
        cx="32"
        cy="93"
        rx="11"
        ry="8"
        fill="oklch(0.16 0.03 295)"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="2.5"
      />
      <ellipse
        cx="62"
        cy="93"
        rx="11"
        ry="8"
        fill="oklch(0.16 0.03 295)"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="2.5"
      />
      <path
        d="M28 93 v4 M36 93 v4 M58 93 v4 M66 93 v4"
        stroke="oklch(0.5 0.2 296)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HelperBot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 126" className={className} aria-hidden="true">
      {/* antenna */}
      <line x1="45" y1="20" x2="45" y2="30" stroke="oklch(0.6 0.03 295)" strokeWidth="3" />
      <path
        d="M45 4 L47.5 11 L54 13.5 L47.5 16 L45 23 L42.5 16 L36 13.5 L42.5 11 Z"
        fill="oklch(0.8 0.12 300)"
      />
      {/* helmet */}
      <ellipse
        cx="45"
        cy="54"
        rx="30"
        ry="27"
        fill="oklch(0.93 0.015 300)"
        stroke="oklch(0.78 0.03 300)"
        strokeWidth="2"
      />
      {/* visor */}
      <ellipse cx="45" cy="56" rx="22" ry="18" fill="oklch(0.13 0.02 295)" />
      <circle cx="37" cy="54" r="4" fill="oklch(0.9 0.08 300)" />
      <circle cx="53" cy="54" r="4" fill="oklch(0.9 0.08 300)" />
      <path
        d="M38 63 q7 6 14 0"
        stroke="oklch(0.9 0.08 300)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* arms */}
      <ellipse
        cx="14"
        cy="84"
        rx="7"
        ry="10"
        fill="oklch(0.93 0.015 300)"
        stroke="oklch(0.78 0.03 300)"
        strokeWidth="2"
      />
      <ellipse
        cx="76"
        cy="84"
        rx="7"
        ry="10"
        fill="oklch(0.93 0.015 300)"
        stroke="oklch(0.78 0.03 300)"
        strokeWidth="2"
      />
      {/* body */}
      <rect
        x="28"
        y="78"
        width="34"
        height="22"
        rx="10"
        fill="oklch(0.93 0.015 300)"
        stroke="oklch(0.78 0.03 300)"
        strokeWidth="2"
      />
      <circle cx="45" cy="89" r="5" fill="oklch(0.65 0.22 296)" />
      {/* rocket flame */}
      <path d="M45 102 L54 112 L45 126 L36 112 Z" fill="oklch(0.62 0.24 296)" />
      <path d="M45 104 L50 111 L45 120 L40 111 Z" fill="oklch(0.82 0.14 300)" />
    </svg>
  );
}
