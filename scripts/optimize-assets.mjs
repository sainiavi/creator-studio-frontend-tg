#!/usr/bin/env node
/**
 * Resize + compress bundled PNG/JPG assets for faster loads.
 * Run: npm run optimize:assets
 */
import { execSync } from "node:child_process";
import { existsSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "src/assets");

function sizeKb(path) {
  return (statSync(path).size / 1024).toFixed(1);
}

function hasCmd(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const hasCwebp = hasCmd("cwebp");

/** maxPx = longest edge (sips -Z) */
const jobs = [
  // Home — popular worlds (~108px cards, 3x retina)
  ["goalArena.webp", 360],
  ["turuboLeague.webp", 360],
  ["dragonRealms.webp", 360],
  ["aiBattleDorm.webp", 360],
  ["skyKingdom.webp", 360],
  // Home — flow step icons (~44px display)
  ["flow1Img.webp", 160],
  ["flow2Img.webp", 160],
  ["flow3Img.webp", 160],
  ["flow4Img.webp", 160],
  // Console hero
  ["character1.webp", 480],
  ["character2.webp", 480],
  ["gameControllerCard.webp", 400],
  ["creatorStudioLogo.webp", 320],
  // Create suggestions
  ["create-suggestion-cyberpunk.webp", 480],
  ["create-suggestion-farm.webp", 480],
  ["game1.webp", 480],
  ["game2.webp", 480],
  ["game3.webp", 480],
  ["games4.webp", 480],
  ["game5.webp", 480],
  ["game6.webp", 480],
  ["moments-1.jpg", 640],
  ["moments2.jpg", 640],
  // Leaderboard avatars
  ["leaderboard-rank-1.webp", 128],
  ["leaderboard-rank-2.webp", 128],
  ["leaderboard-rank-3.webp", 128],
];

function toWebp(pngPath, quality = 82) {
  if (!hasCwebp) return null;
  const webpPath = pngPath.replace(/\.png$/i, ".webp");
  execSync(`cwebp -q ${quality} -m 6 -mt -quiet "${pngPath}" -o "${webpPath}"`, {
    stdio: "ignore",
  });
  return webpPath;
}

function optimize(file, maxPx) {
  const path = join(assets, file);
  if (!existsSync(path)) {
    console.log(`skip (missing): ${file}`);
    return;
  }

  const before = sizeKb(path);
  const dimOut = execSync(`sips -g pixelWidth -g pixelHeight "${path}"`, { encoding: "utf8" });
  const width = Number(dimOut.match(/pixelWidth: (\d+)/)?.[1] ?? 0);
  const height = Number(dimOut.match(/pixelHeight: (\d+)/)?.[1] ?? 0);
  const longest = Math.max(width, height);

  if (longest > maxPx) {
    execSync(`sips -Z ${maxPx} "${path}"`, { stdio: "ignore" });
  }

  const ext = extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") {
    execSync(`sips -s format jpeg -s formatOptions 80 "${path}" --out "${path}"`, {
      stdio: "ignore",
    });
  } else if (ext === ".png") {
    execSync(`sips -s format png "${path}" --out "${path}"`, { stdio: "ignore" });
  }

  let after = sizeKb(path);
  console.log(`resize ${file}: ${before}KB -> ${after}KB`);

  if (ext === ".png" && hasCwebp && Number(after) > 24) {
    const webpPath = toWebp(path, 82);
    if (webpPath && existsSync(webpPath) && Number(sizeKb(webpPath)) < Number(after)) {
      unlinkSync(path);
      console.log(`  webp ${file.replace(/\.png$/i, ".webp")}: ${sizeKb(webpPath)}KB (removed png)`);
    }
  }
}

console.log(`Optimizing assets in ${assets}${hasCwebp ? " (webp enabled)" : ""}…\n`);

for (const [file, maxPx] of jobs) optimize(file, maxPx);

console.log("\nAsset optimization complete.");
