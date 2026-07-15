#!/usr/bin/env node
/**
 * Resize bundled PNG/JPG assets to display-appropriate dimensions.
 * Run: node scripts/optimize-assets.mjs
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "src/assets");

function resize(file, maxPx) {
  const path = join(assets, file);
  if (!existsSync(path)) return;
  execSync(`sips -Z ${maxPx} "${path}"`, { stdio: "inherit" });
}

const jobs = [
  ["leaderboard-rank-1.png", 128],
  ["leaderboard-rank-2.png", 128],
  ["leaderboard-rank-3.png", 128],
  ["profile-bg.png", 1280],
  ["mobile-bg.png", 1280],
  ["mobile-bg-bottom.png", 800],
  ["hero-frame.png", 640],
  ["create-suggestion-cyberpunk.png", 480],
  ["create-suggestion-farm.png", 480],
  ["game1.png", 480],
  ["game2.png", 480],
  ["game3.png", 480],
  ["games4.png", 480],
  ["game5.png", 480],
  ["game6.png", 480],
  ["moments-1.jpg", 640],
  ["moments2.jpg", 640],
];

for (const [file, size] of jobs) resize(file, size);

console.log("Asset resize complete.");
