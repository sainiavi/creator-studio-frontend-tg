import type { Game } from "./games-data";

// Maps every template id to a poster emoji (ported from the original studio shell).
export const templateEmoji: Record<string, string> = {
  flappy: "🐤",
  match3: "💎",
  clicker: "🪙",
  memory: "🃏",
  quiz: "⚡",
  drawing: "🎨",
  runner: "🏃",
  racing: "🏎️",
  idle: "🏭",
  "ai-arena": "🤖",
  "cyber-runner": "🌃",
  "space-shooter": "🛸",
  minigames: "🎮",
  "realistic-driving": "🚗",
  "fps-survival": "🧟",
  "flight-sim": "✈️",
  "unity-karting": "🏁",
  "unity-fps": "🔫",
  "unity-platformer": "🕹️",
  "unity-zombiesmasher": "🧟",
  "unity-spaceinvaders": "👾",
  "unity-pong": "🏓",
  "unity-tetris": "🧱",
  "unity-snake": "🐍",
  "unity-pacman": "🟡",
  "unity-towerdefense": "🏰",
  "unity-solitaire": "🂡",
  "unity-flappybird": "🐤",
  "unity-runner": "🏃",
  "head-soccer-2026": "⚽",
  "goof-runner": "🏃",
  "mini-racer": "🏎️",
  "bubble-shooter": "🫧",
  "blocks-match3": "💎",
  "happy-halloween-match3": "🎃",
  "happy-chef-bubble-shooter": "👨‍🍳",
  "sea-animals": "🐠",
  "christmas-candy": "🍬",
  "lollipops-match3": "🍭",
  "speed-racer": "🏎️",
  "candy-match3": "🍫",
  "smiles-match3": "😊",
  "valentines-match3": "💝",
  "christmas-match3": "🎄",
  "animals-crash-match3": "🦁",
  "halloween-match3": "👻",
  "scary-run": "💀",
  "billiards": "🎱",
  "crazy-match3": "🤪",
  "cars": "🚗",
  "monster-match3": "👾",
  "sweet-match3": "🧁",
  "crazy-car": "🚙",
  "summer-match3": "☀️",
  "funny-faces-match3": "🤡",
  "space-match3": "🚀",
  "math-game-kids": "🔢",
  "truck-racer": "🚛",
  "christmas-gifts": "🎁",
  "christmas-bubbles": "🎅",
  "stick-panda": "🐼",
  "christmas-balls": "🎄",
  "road-racer": "🛣️",
  "jewels-match": "💎",
  "pops-billiards": "🎱",
  "frog-super-bubbles": "🐸",
};

// Standalone Unity WebGL build entry points (served from /public/templates).
export const unityGameUrls: Record<string, string> = {
  "unity-karting": "/templates/unity-karting/index.html",
  "unity-fps": "/templates/unity-fps/index.html",
  "unity-platformer": "/templates/unity-platformer/demo-api/unity/index.html",
  "unity-zombiesmasher": "/templates/unity-zombiesmasher/index.html",
  "unity-spaceinvaders": "/templates/unity-spaceinvaders/index.html",
  "unity-pong": "/templates/unity-pong/index.html",
  "unity-tetris": "/templates/unity-tetris/index.html",
  "unity-snake": "/templates/unity-snake/index.html",
  "unity-pacman": "/templates/unity-pacman/index.html",
  "unity-towerdefense": "/templates/unity-towerdefense/index.html",
  "unity-solitaire": "/templates/unity-solitaire/index.html",
  "unity-flappybird": "/templates/unity-flappybird/index.html",
  "unity-runner": "/templates/unity-runner/index.html",
};

// Standalone Construct/HTML5 game entry points (served from /public/templates).
export const constructGameUrls: Record<string, string> = {
  "head-soccer-2026": "/templates/head-soccer-2026/index.html",
  "goof-runner": "/templates/goof-runner/index.html",
  "mini-racer": "/templates/mini-racer/index.html",
  "bubble-shooter": "/templates/bubble-shooter/index.html",
  "blocks-match3": "/templates/blocks-match3/index.html",
  "happy-halloween-match3": "/templates/happy-halloween-match3/index.html",
  "happy-chef-bubble-shooter": "/templates/happy-chef-bubble-shooter/index.html",
  "sea-animals": "/templates/sea-animals/index.html",
  "christmas-candy": "/templates/christmas-candy/index.html",
  "lollipops-match3": "/templates/lollipops-match3/index.html",
  "speed-racer": "/templates/speed-racer/index.html",
  "candy-match3": "/templates/candy-match3/index.html",
  "smiles-match3": "/templates/smiles-match3/index.html",
  "valentines-match3": "/templates/valentines-match3/index.html",
  "christmas-match3": "/templates/christmas-match3/index.html",
  "animals-crash-match3": "/templates/animals-crash-match3/index.html",
  "halloween-match3": "/templates/halloween-match3/index.html",
  "scary-run": "/templates/scary-run/index.html",
  "billiards": "/templates/billiards/index.html",
  "crazy-match3": "/templates/crazy-match3/index.html",
  "cars": "/templates/cars/index.html",
  "monster-match3": "/templates/monster-match3/index.html",
  "sweet-match3": "/templates/sweet-match3/index.html",
  "crazy-car": "/templates/crazy-car/index.html",
  "summer-match3": "/templates/summer-match3/index.html",
  "funny-faces-match3": "/templates/funny-faces-match3/index.html",
  "space-match3": "/templates/space-match3/index.html",
  "math-game-kids": "/templates/math-game-kids/index.html",
  "truck-racer": "/templates/truck-racer/index.html",
  "christmas-gifts": "/templates/christmas-gifts/index.html",
  "christmas-bubbles": "/templates/christmas-bubbles/index.html",
  "stick-panda": "/templates/stick-panda/index.html",
  "christmas-balls": "/templates/christmas-balls/index.html",
  "road-racer": "/templates/road-racer/index.html",
  "jewels-match": "/templates/jewels-match/index.html",
  "pops-billiards": "/templates/pops-billiards/index.html",
  "frog-super-bubbles": "/templates/frog-super-bubbles/index.html",
};

export const templateThumbnails: Record<string, string> = {
  flappy: "/thumbnails/flappy-cover.png",
  match3: "/thumbnails/match3-cover.png",
  clicker: "/thumbnails/clicker-cover.png",
  memory: "/thumbnails/memory-cover.png",
  quiz: "/thumbnails/quiz-cover.png",
  drawing: "/thumbnails/drawing-cover.png",
  runner: "/thumbnails/runner-cover.png",
  racing: "/thumbnails/racing-cover.png",
  idle: "/thumbnails/idle-cover.png",
  "ai-arena": "/thumbnails/ai-arena-cover.png",
  "cyber-runner": "/thumbnails/cyber-runner-cover.png",
  "space-shooter": "/thumbnails/space-shooter-cover.png",
  minigames: "/thumbnails/minigames-cover.png",
  "realistic-driving": "/thumbnails/realistic-driving-cover.png",
  "fps-survival": "/thumbnails/fps-survival-cover.png",
  "flight-sim": "/thumbnails/flight-sim-cover.png",
  "unity-karting": "/thumbnails/unity-karting-cover.png",
  "unity-fps": "/thumbnails/unity-fps.png",
  "unity-zombiesmasher": "/thumbnails/unity-zombiesmasher-cover.png",
  "unity-spaceinvaders": "/thumbnails/unity-spaceinvaders-cover.png",
  "unity-pong": "/thumbnails/unity-pong-cover.png",
  "unity-tetris": "/thumbnails/unity-tetris-cover.png",
  "unity-snake": "/thumbnails/unity-snake-cover.png",
  "unity-pacman": "/thumbnails/unity-pacman-cover.png",
  "unity-towerdefense": "/thumbnails/unity-towerdefense-cover.png",
  "unity-solitaire": "/thumbnails/unity-solitaire.png",
  "unity-flappybird": "/thumbnails/unity-flappybird-cover.png",
  "unity-runner": "/thumbnails/unity-runner-cover.png",
  "head-soccer-2026": "/templates/head-soccer-2026/icons/icon-256.png",
  "goof-runner": "/templates/goof-runner/icons/icon-256.png",
  "mini-racer": "/templates/mini-racer/icons/icon-256.png",
  "bubble-shooter": "/templates/bubble-shooter/icons/icon-256.png",
  "blocks-match3": "/templates/blocks-match3/icons/icon-256.png",
  "happy-halloween-match3": "/templates/happy-halloween-match3/icons/icon-256.png",
  "happy-chef-bubble-shooter": "/templates/happy-chef-bubble-shooter/icons/icon-256.png",
  "sea-animals": "/templates/sea-animals/icon-256.png",
  "christmas-candy": "/templates/christmas-candy/icons/icon-256.png",
  "lollipops-match3": "/templates/lollipops-match3/icons/icon-256.png",
  "speed-racer": "/templates/speed-racer/icons/icon-256.png",
  "candy-match3": "/templates/candy-match3/icons/icon-256.png",
  "smiles-match3": "/templates/smiles-match3/icons/icon-256.png",
  "valentines-match3": "/templates/valentines-match3/icons/icon-256.png",
  "christmas-match3": "/templates/christmas-match3/icons/icon-256.png",
  "animals-crash-match3": "/templates/animals-crash-match3/icons/icon-256.png",
  "halloween-match3": "/templates/halloween-match3/icons/icon-256.png",
  "scary-run": "/templates/scary-run/icons/icon-256.png",
  "billiards": "/templates/billiards/icons/icon-256.png",
  "crazy-match3": "/templates/crazy-match3/icons/icon-256.png",
  "cars": "/templates/cars/icons/icon-256.png",
  "monster-match3": "/templates/monster-match3/icons/icon-256.png",
  "sweet-match3": "/templates/sweet-match3/icons/icon-256.png",
  "crazy-car": "/templates/crazy-car/icons/icon-256.png",
  "summer-match3": "/templates/summer-match3/icons/icon-256.png",
  "funny-faces-match3": "/templates/funny-faces-match3/icons/icon-256.png",
  "space-match3": "/templates/space-match3/icons/icon-256.png",
  "math-game-kids": "/templates/math-game-kids/icons/icon-256.png",
  "truck-racer": "/templates/truck-racer/icons/icon-256.png",
  "christmas-gifts": "/templates/christmas-gifts/icons/icon-256.png",
  "christmas-bubbles": "/templates/christmas-bubbles/icons/icon-256.png",
  "stick-panda": "/templates/stick-panda/icons/icon-256.png",
  "christmas-balls": "/templates/christmas-balls/icons/icon-256.png",
  "road-racer": "/templates/road-racer/icons/icon-256.png",
  "jewels-match": "/templates/jewels-match/icons/icon-256.png",
  "pops-billiards": "/templates/pops-billiards/icons/icon-256.png",
  "frog-super-bubbles": "/templates/frog-super-bubbles/icons/icon-256.png",
};

const gradientKeys: Game["gradient"][] = ["pink", "green", "cyan", "warm", "violet"];

// Deterministically assigns one of the design-system gradients to a template id,
// so real templates render with the same look as the mock GameCard data.
export function gradientForId(id: string): Game["gradient"] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return gradientKeys[hash % gradientKeys.length];
}

export type TemplateEngine = "threejs" | "unity" | "construct";

export function engineOf(template: { engine?: string }): TemplateEngine {
  if (template.engine === "unity") return "unity";
  if (template.engine === "construct") return "construct";
  return "threejs";
}

const samplePlays = ["343K", "1.5M", "429K", "612K", "3.3M", "2.2M", "85.6K", "888K"];

export function playCount(index: number): string {
  return samplePlays[index % samplePlays.length];
}

// Adapts a raw gameTemplate into the design-system Game shape used by GameCard.
export function templateToGame(template: any, index = 0): Game {
  return {
    title: template.name,
    category: template.category,
    plays: playCount(index),
    emoji: templateEmoji[template.id] ?? "🎮",
    gradient: gradientForId(template.id),
    creator:
      engineOf(template) === "unity"
        ? "Unity Build"
        : engineOf(template) === "construct"
          ? "Construct Template"
          : "3D Web Game",
    thumbnailUrl: templateThumbnails[template.id],
    templateId: template.id,
  };
}
