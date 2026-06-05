const rawGameTemplates = [
  {
    id: "flappy",
    name: "Flappy Bird",
    category: "Arcade",
    time: "20s",
    reliability: "100%",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#ff3df2", "#ffd166"],
    mechanic: "Tap to jump through moving pipe gates.",
    controls: "Tap, click, or space",
    assets: "Bird block, pipes, score text, cloud bands",
    difficulty: {
      easy: { gravity: 520, jump: -290, speed: 165, gap: 180 },
      normal: { gravity: 600, jump: -320, speed: 200, gap: 150 },
      hard: { gravity: 680, jump: -340, speed: 240, gap: 128 },
      insane: { gravity: 760, jump: -360, speed: 285, gap: 112 }
    }
  },
  {
    id: "match3",
    name: "Match-3 Puzzle",
    category: "Puzzle",
    time: "25s",
    reliability: "100%",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#67ffb4", "#ffd166"],
    mechanic: "Swap adjacent gems and trigger chain reactions.",
    controls: "Tap two adjacent tiles",
    assets: "Gem tiles, power gems, board frame, score bursts",
    difficulty: {
      easy: { grid: 6, colors: 4, moves: 38, target: 800 },
      normal: { grid: 7, colors: 5, moves: 32, target: 1300 },
      hard: { grid: 8, colors: 6, moves: 28, target: 2000 },
      insane: { grid: 9, colors: 6, moves: 24, target: 3100 }
    }
  },
  {
    id: "clicker",
    name: "Clicker Economy",
    category: "Idle",
    time: "18s",
    reliability: "100%",
    accent: "#ffd166",
    colors: ["#ffd166", "#35e8ff", "#67ffb4"],
    mechanic: "Click to earn, buy upgrades, automate income.",
    controls: "Click, tap, upgrade buttons",
    assets: "Central token, upgrade cards, income meters",
    difficulty: {
      easy: { baseClick: 2, upgradeCost: 20, multiplier: 1.18, prestige: 5000 },
      normal: { baseClick: 1, upgradeCost: 35, multiplier: 1.24, prestige: 10000 },
      hard: { baseClick: 1, upgradeCost: 55, multiplier: 1.32, prestige: 18000 },
      insane: { baseClick: 1, upgradeCost: 80, multiplier: 1.42, prestige: 32000 }
    }
  },
  {
    id: "memory",
    name: "Memory Cards",
    category: "Casual",
    time: "20s",
    reliability: "100%",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ffffff", "#ff8bd6"],
    mechanic: "Flip cards, find pairs, clear the board.",
    controls: "Tap or click cards",
    assets: "Card backs, icons, timer, match effects",
    difficulty: {
      easy: { pairs: 6, timer: 120, preview: 3 },
      normal: { pairs: 8, timer: 100, preview: 2 },
      hard: { pairs: 10, timer: 85, preview: 1 },
      insane: { pairs: 12, timer: 70, preview: 0 }
    }
  },
  {
    id: "quiz",
    name: "Quiz Rush",
    category: "Trivia",
    time: "22s",
    reliability: "100%",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#35e8ff", "#ffd166"],
    mechanic: "Answer timed questions and build score streaks.",
    controls: "Tap answer cards or number keys",
    assets: "Question panels, answer buttons, timer ring",
    difficulty: {
      easy: { questions: 8, seconds: 20, penalty: 0 },
      normal: { questions: 10, seconds: 16, penalty: 20 },
      hard: { questions: 12, seconds: 12, penalty: 35 },
      insane: { questions: 15, seconds: 8, penalty: 50 }
    }
  },
  {
    id: "drawing",
    name: "Drawing Duel",
    category: "Creative",
    time: "28s",
    reliability: "100%",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#35e8ff", "#ffffff"],
    mechanic: "Draw prompts under time pressure and vote winners.",
    controls: "Pointer drawing tools",
    assets: "Canvas, brushes, palette, voting cards",
    difficulty: {
      easy: { roundSeconds: 90, brushLimit: 6, prompts: 5 },
      normal: { roundSeconds: 70, brushLimit: 5, prompts: 8 },
      hard: { roundSeconds: 55, brushLimit: 4, prompts: 10 },
      insane: { roundSeconds: 40, brushLimit: 3, prompts: 12 }
    }
  },
  {
    id: "runner",
    name: "Infinite Runner",
    category: "Action",
    time: "24s",
    reliability: "100%",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#ffd166", "#35e8ff"],
    mechanic: "Run, jump, slide, collect, and survive scaling speed.",
    controls: "Space, swipe, arrow keys",
    assets: "Runner, obstacles, coins, parallax lanes",
    difficulty: {
      easy: { speed: 260, spawn: 1.8, jump: -440, lanes: 2 },
      normal: { speed: 330, spawn: 1.45, jump: -470, lanes: 3 },
      hard: { speed: 410, spawn: 1.15, jump: -500, lanes: 3 },
      insane: { speed: 500, spawn: 0.9, jump: -530, lanes: 4 }
    }
  },
  {
    id: "racing",
    name: "2D Racing",
    category: "Racing",
    time: "27s",
    reliability: "100%",
    accent: "#ffffff",
    colors: ["#ffffff", "#35e8ff", "#ff4d6d"],
    mechanic: "Drift through checkpoints and beat lap targets.",
    controls: "Arrow keys, WASD, touch steering",
    assets: "Cars, track lanes, checkpoints, tire trails",
    difficulty: {
      easy: { laps: 2, grip: 0.88, traffic: 3, target: 95 },
      normal: { laps: 3, grip: 0.8, traffic: 5, target: 82 },
      hard: { laps: 4, grip: 0.72, traffic: 7, target: 72 },
      insane: { laps: 5, grip: 0.64, traffic: 9, target: 62 }
    }
  },
  {
    id: "idle",
    name: "Idle Factory",
    category: "Automation",
    time: "19s",
    reliability: "100%",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ffd166", "#8f7dff"],
    mechanic: "Build generators, unlock chains, and prestige.",
    controls: "Tap buttons and manage upgrade panels",
    assets: "Factory nodes, conveyors, resource counters",
    difficulty: {
      easy: { generators: 4, unlockRate: 0.72, offlineCap: 12 },
      normal: { generators: 5, unlockRate: 1, offlineCap: 8 },
      hard: { generators: 6, unlockRate: 1.35, offlineCap: 6 },
      insane: { generators: 7, unlockRate: 1.8, offlineCap: 4 }
    }
  },
  {
    id: "ai-arena",
    name: "AI Arena Battle",
    category: "Combat",
    time: "30s",
    reliability: "100%",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#35e8ff", "#ffd166"],
    mechanic: "Survive enemy robot waves with dash shots and health pickups.",
    controls: "WASD, arrows, Space, click, controller",
    assets: "Fighter sprites, robot enemies, arena tiles, laser effects, explosions, health UI",
    difficulty: {
      easy: { enemies: 4, speed: 95, fireRate: 0.42, health: 5 },
      normal: { enemies: 6, speed: 120, fireRate: 0.34, health: 4 },
      hard: { enemies: 8, speed: 150, fireRate: 0.28, health: 3 },
      insane: { enemies: 11, speed: 180, fireRate: 0.22, health: 3 }
    }
  },
  {
    id: "cyber-runner",
    name: "Cyberpunk Runner",
    category: "Arcade",
    time: "27s",
    reliability: "100%",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#ff3df2", "#67ffb4"],
    mechanic: "Dodge neon traffic, collect data shards, and boost through a cyber city.",
    controls: "Arrow keys, WASD, Space boost, touch steering",
    assets: "Neon road, hover vehicle, city props, data coins, powerups, particles, SFX hooks",
    difficulty: {
      easy: { speed: 260, traffic: 4, lanes: 3, boost: 1.35 },
      normal: { speed: 330, traffic: 6, lanes: 3, boost: 1.55 },
      hard: { speed: 410, traffic: 8, lanes: 4, boost: 1.75 },
      insane: { speed: 500, traffic: 10, lanes: 4, boost: 2 }
    }
  },
  {
    id: "space-shooter",
    name: "Space Shooter Boss Fight",
    category: "Shooter",
    time: "30s",
    reliability: "100%",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#35e8ff", "#ffffff"],
    mechanic: "Blast enemy ships, dodge bullets, and break the boss shield.",
    controls: "WASD, arrows, Space/click fire, controller",
    assets: "Player ship, enemy ships, bullets, boss sprite, explosions, starfield, score UI",
    difficulty: {
      easy: { enemies: 4, bossHealth: 36, bulletSpeed: 420, lives: 5 },
      normal: { enemies: 6, bossHealth: 52, bulletSpeed: 480, lives: 4 },
      hard: { enemies: 8, bossHealth: 72, bulletSpeed: 540, lives: 3 },
      insane: { enemies: 10, bossHealth: 96, bulletSpeed: 620, lives: 3 }
    }
  },
  {
    id: "minigames",
    name: "Mini-Game Pack",
    category: "Collection",
    time: "30s",
    reliability: "100%",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#ff8bd6", "#ffd166"],
    mechanic: "Rotate through short skill challenges with shared score.",
    controls: "Contextual tap, click, and keyboard controls",
    assets: "Challenge cards, timers, score rail, transition effects",
    difficulty: {
      easy: { games: 3, seconds: 25, lives: 5 },
      normal: { games: 4, seconds: 20, lives: 4 },
      hard: { games: 5, seconds: 16, lives: 3 },
      insane: { games: 6, seconds: 12, lives: 2 }
    }
  },
  {
    id: "realistic-driving",
    name: "3D City Driving",
    category: "Simulation",
    time: "45s",
    reliability: "100%",
    accent: "#ff3df2",
    colors: ["#ff3df2", "#35e8ff", "#ffffff"],
    mechanic: "Navigate a realistic 3D city with physics-based vehicle handling.",
    controls: "WASD, Space for handbrake, C for camera",
    assets: "High-poly car model, detailed city environment, PBR materials, dynamic lighting",
    difficulty: {
      easy: { trafficDensity: 0.2, handling: 1.5 },
      normal: { trafficDensity: 0.5, handling: 1.0 },
      hard: { trafficDensity: 0.8, handling: 0.7 },
      insane: { trafficDensity: 1.2, handling: 0.5 }
    }
  },
  {
    id: "fps-survival",
    name: "FPS Zombie Survival",
    category: "Action",
    time: "50s",
    reliability: "100%",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#67ffb4", "#ffd166"],
    mechanic: "Survive endless waves of zombies in a photorealistic environment.",
    controls: "WASD to move, Mouse to aim/shoot, R to reload",
    assets: "3D weapon models, zombie character rigs, post-processing effects, spatial audio",
    difficulty: {
      easy: { zombieSpeed: 2, ammo: 120, health: 100 },
      normal: { zombieSpeed: 4, ammo: 90, health: 80 },
      hard: { zombieSpeed: 6, ammo: 60, health: 60 },
      insane: { zombieSpeed: 8, ammo: 30, health: 40 }
    }
  },
  {
    id: "flight-sim",
    name: "Realistic Flight Simulator",
    category: "Simulation",
    time: "60s",
    reliability: "100%",
    accent: "#ffffff",
    colors: ["#ffffff", "#8f7dff", "#35e8ff"],
    mechanic: "Take off, fly, and land a commercial jet with realistic aerodynamics.",
    controls: "Mouse Yoke, W/S for throttle, Q/E for rudder",
    assets: "Detailed aircraft cockpit, volumetric clouds, terrain heightmaps, atmospheric scattering",
    difficulty: {
    }
  },
  {
    id: "unity-karting",
    name: "Unity Kart Racer",
    category: "Racing",
    time: "45s",
    reliability: "100%",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ffd166", "#35e8ff"],
    mechanic: "Complete 3 laps in a physics-based 3D kart racing game.",
    controls: "WASD / Arrow Keys, Space drift",
    assets: "3D Kart model, racetrack terrain, checkpoints, booster pads",
    engine: "unity",
    difficulty: {
      easy: { speedMultiplier: 0.8, gravity: 9.81 },
      normal: { speedMultiplier: 1.0, gravity: 9.81 },
      hard: { speedMultiplier: 1.2, gravity: 12.0 },
      insane: { speedMultiplier: 1.5, gravity: 15.0 }
    }
  },
  {
    id: "unity-fps",
    name: "Unity FPS Arena",
    category: "Action",
    time: "50s",
    reliability: "100%",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#67ffb4", "#ffffff"],
    mechanic: "Fight waves of robot drones inside a sci-fi arena.",
    controls: "WASD, Mouse to aim/shoot, Space to jump",
    assets: "3D character controller, robot drones, sci-fi weapons, laser beams",
    engine: "unity",
    difficulty: {
      easy: { dronesCount: 3, droneHealth: 50 },
      normal: { dronesCount: 5, droneHealth: 100 },
      hard: { dronesCount: 8, droneHealth: 150 },
      insane: { dronesCount: 12, droneHealth: 200 }
    }
  },
  {
    id: "unity-zombiesmasher",
    name: "Zombie Smasher",
    category: "Action",
    time: "55s",
    reliability: "100%",
    accent: "#ff3df2",
    colors: ["#ff3df2", "#ffd166", "#35e8ff"],
    mechanic: "Control a powerful tank to crush endless waves of zombies and destroy obstacles.",
    controls: "WASD to move, Mouse Click to shoot",
    assets: "3D Tank model, environment obstacle prefabs, detailed zombie assets",
    engine: "unity",
    difficulty: {
      easy: { speed: 5, health: 100 },
      normal: { speed: 8, health: 150 },
      hard: { speed: 12, health: 200 },
      insane: { speed: 18, health: 300 }
    }
  },
  {
    id: "unity-spaceinvaders",
    name: "Space Invaders",
    category: "Action",
    time: "30s",
    reliability: "100%",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#35e8ff", "#ffd166"],
    mechanic: "Destroy descending waves of alien invaders and dodge their plasma projectiles.",
    controls: "A / D or Arrow Keys to move ship, Space to shoot",
    assets: "Classic spaceship, dynamic alien invaders, barriers, particle explosions",
    engine: "unity",
    difficulty: {
      easy: { speed: 1.5, shootRate: 0.2 },
      normal: { speed: 3, shootRate: 0.5 },
      hard: { speed: 5, shootRate: 0.8 },
      insane: { speed: 7.5, shootRate: 1.2 }
    }
  },
  {
    id: "unity-pong",
    name: "Pong",
    category: "Sports",
    time: "15s",
    reliability: "100%",
    accent: "#ffd166",
    colors: ["#ffd166", "#35e8ff", "#ff3df2"],
    mechanic: "Classic table tennis simulation. Bounce the ball past the opponent's paddle.",
    controls: "W / S or Arrow Keys to move paddle",
    assets: "Paddles, ball, arena boundary, score labels",
    engine: "unity",
    difficulty: {
      easy: { speed: 5 },
      normal: { speed: 8 },
      hard: { speed: 12 },
      insane: { speed: 18 }
    }
  },
  {
    id: "unity-tetris",
    name: "Tetris",
    category: "Puzzle",
    time: "20s",
    reliability: "100%",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#ffd166", "#35e8ff"],
    mechanic: "Rotate and fit falling tetromino shapes to clear horizontal lines.",
    controls: "Arrow Keys / WASD, Space to drop",
    assets: "Tetromino blocks, grid frame, preview window, score text",
    engine: "unity",
    difficulty: {
      easy: { speed: 1 },
      normal: { speed: 2 },
      hard: { speed: 3 },
      insane: { speed: 5 }
    }
  },
  {
    id: "unity-snake",
    name: "Retro Snake",
    category: "Retro",
    time: "15s",
    reliability: "100%",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#35e8ff", "#ffd166"],
    mechanic: "Guide the growing snake to eat food while avoiding walls and your own tail.",
    controls: "Arrow Keys / WASD to steer",
    assets: "Snake head & segments, food items, boundary grid, score display",
    engine: "unity",
    difficulty: {
      easy: { speed: 5 },
      normal: { speed: 8 },
      hard: { speed: 12 },
      insane: { speed: 16 }
    }
  },
  {
    id: "unity-pacman",
    name: "Pac-Man",
    category: "Arcade",
    time: "25s",
    reliability: "100%",
    accent: "#ffd166",
    colors: ["#ffd166", "#ff3df2", "#35e8ff"],
    mechanic: "Navigate the maze to consume all dots while dodging wandering ghosts.",
    controls: "Arrow Keys / WASD to move",
    assets: "Pac-Man model, ghosts, maze walls, score dots, power pellets",
    engine: "unity",
    difficulty: {
      easy: { speed: 4, ghosts: 2 },
      normal: { speed: 6, ghosts: 4 },
      hard: { speed: 8, ghosts: 4 },
      insane: { speed: 10, ghosts: 4 }
    }
  },
  {
    id: "unity-towerdefense",
    name: "Tower Defense",
    category: "Strategy",
    time: "45s",
    reliability: "100%",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#ff3df2", "#35e8ff"],
    mechanic: "Place defensive towers along a path to destroy waves of incoming enemies.",
    controls: "Mouse Click to place towers",
    assets: "Turret towers, creeps/enemies, pathways, health bars, base core",
    engine: "unity",
    difficulty: {
      easy: { startingGold: 500, waveInterval: 20 },
      normal: { startingGold: 300, waveInterval: 15 },
      hard: { startingGold: 200, waveInterval: 12 },
      insane: { startingGold: 100, waveInterval: 10 }
    }
  },
  {
    id: "unity-solitaire",
    name: "Solitaire",
    category: "Card",
    time: "40s",
    reliability: "100%",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ffd166", "#35e8ff"],
    mechanic: "Sort cards by suit and descending order in this classic solitaire layout.",
    controls: "Mouse Drag & Drop / Click",
    assets: "Card deck sprites, board felt green background, suit signs, score tracking",
    engine: "unity",
    difficulty: {
      easy: { drawCount: 1 },
      normal: { drawCount: 3 },
      hard: { drawCount: 3, timed: true },
      insane: { drawCount: 3, timed: true, penalty: true }
    }
  },
  {
    id: "unity-flappybird",
    name: "Flappy Bird",
    category: "Casual",
    time: "20s",
    reliability: "100%",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#67ffb4", "#ffd166"],
    mechanic: "Tap or click to flap wings and navigate safely between pipes.",
    controls: "Mouse Click / Space",
    assets: "Flappy character model, scrolling columns/pipes, score trigger, sound controls",
    engine: "unity",
    difficulty: {
      easy: { gravity: 450, gap: 200 },
      normal: { gravity: 600, gap: 150 },
      hard: { gravity: 750, gap: 120 },
      insane: { gravity: 900, gap: 100 }
    }
  },
  {
    id: "unity-runner",
    name: "Endless Runner",
    category: "Action",
    time: "30s",
    reliability: "100%",
    accent: "#ff3df2",
    colors: ["#ff3df2", "#ffd166", "#35e8ff"],
    mechanic: "Run indefinitely, jump over hazards, and grab score pickups.",
    controls: "Space to jump, Mouse Click",
    assets: "Running avatar, procedural obstacles, coin pickups, parallax skyline background",
    engine: "unity",
    difficulty: {
      easy: { speedMultiplier: 0.8, obstacleFrequency: 1.5 },
      normal: { speedMultiplier: 1.0, obstacleFrequency: 1.2 },
      hard: { speedMultiplier: 1.25, obstacleFrequency: 0.9 },
      insane: { speedMultiplier: 1.6, obstacleFrequency: 0.7 }
    }
  },
  {
    id: "head-soccer-2026",
    name: "Head Soccer 2026",
    category: "Sports",
    time: "Ready",
    reliability: "HTML5",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#ffd166", "#67ffb4"],
    mechanic: "Play a fast arcade football match with oversized head-to-head characters.",
    controls: "Keyboard or touch controls from the original HTML5 build",
    assets: "Construct 3 Head Soccer 2026 export, teams, stadium, ball physics",
    engine: "construct",
    difficulty: {
      easy: { matchSpeed: 0.85 },
      normal: { matchSpeed: 1 },
      hard: { matchSpeed: 1.15 },
      insane: { matchSpeed: 1.3 }
    }
  },
  {
    id: "goof-runner",
    name: "Goof Runner",
    category: "Runner",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#35e8ff", "#ffd166"],
    mechanic: "Run forward, jump hazards, collect coins, and survive as long as possible.",
    controls: "Tap, click, or keyboard jump controls from the original HTML5 build",
    assets: "Construct 3 runner export, player, coins, enemies, scrolling world",
    engine: "construct",
    difficulty: {
      easy: { speedMultiplier: 0.85 },
      normal: { speedMultiplier: 1 },
      hard: { speedMultiplier: 1.2 },
      insane: { speedMultiplier: 1.45 }
    }
  },
  {
    id: "mini-racer",
    name: "Mini Racer",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ffd166",
    colors: ["#ffd166", "#ff4d6d", "#35e8ff"],
    mechanic: "Steer through traffic in a top-down mini racing challenge.",
    controls: "Keyboard or touch driving controls from the original HTML5 build",
    assets: "Construct 3 racing export, road, traffic cars, grass borders",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "bubble-shooter",
    name: "Bubble Shooter",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#35e8ff", "#ff8bd6"],
    mechanic: "Aim, shoot, and match bubbles to clear the board.",
    controls: "Mouse or touch aiming controls from the original HTML5 build",
    assets: "Construct 3 bubble shooter export, bubbles, cannon, fish background",
    engine: "construct",
    difficulty: {
      easy: { bubbleRows: 5 },
      normal: { bubbleRows: 7 },
      hard: { bubbleRows: 9 },
      insane: { bubbleRows: 11 }
    }
  },
  {
    id: "blocks-match3",
    name: "Blocks Super Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#67ffb4", "#ffd166"],
    mechanic: "Swap colorful blocks to make matches and score combos.",
    controls: "Mouse or touch swapping controls from the original HTML5 build",
    assets: "Construct 3 match-3 export, block sprites, timer, combo effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "happy-halloween-match3",
    name: "Happy Halloween Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#8f7dff", "#ffd166"],
    mechanic: "Swap spooky themed tiles to make matches and clear the Halloween board.",
    controls: "Mouse or touch swapping controls",
    assets: "Halloween themed block sprites, timer, combo effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "happy-chef-bubble-shooter",
    name: "Happy Chef Bubble Shooter",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ffd166", "#67ffb4"],
    mechanic: "Aim and shoot colorful food bubbles to match and pop clusters.",
    controls: "Mouse or touch aiming controls",
    assets: "Chef themed bubbles, cannon, kitchen background",
    engine: "construct",
    difficulty: {
      easy: { bubbleRows: 5 },
      normal: { bubbleRows: 7 },
      hard: { bubbleRows: 9 },
      insane: { bubbleRows: 11 }
    }
  },
  {
    id: "sea-animals",
    name: "Sea Animals",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#67ffb4", "#8f7dff"],
    mechanic: "Match sea creature tiles to clear levels in an underwater puzzle.",
    controls: "Mouse or touch controls",
    assets: "Sea creature sprites, underwater background, bubbles",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "christmas-candy",
    name: "Christmas Candy",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#67ffb4", "#ffd166"],
    mechanic: "Swap Christmas candy tiles to create matches and score combos.",
    controls: "Mouse or touch swapping controls",
    assets: "Candy cane sprites, Christmas background, snowflakes",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "lollipops-match3",
    name: "Lollipops Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ffd166", "#35e8ff"],
    mechanic: "Swap colorful lollipop tiles to make sweet matches.",
    controls: "Mouse or touch swapping controls",
    assets: "Lollipop sprites, candy background, combo effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "speed-racer",
    name: "Speed Racer",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#ffd166", "#35e8ff"],
    mechanic: "Race at high speed dodging traffic and obstacles on the road.",
    controls: "Keyboard or touch steering controls",
    assets: "Race car, road, traffic vehicles, speed effects",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "candy-match3",
    name: "Candy Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ffd166",
    colors: ["#ffd166", "#ff8bd6", "#67ffb4"],
    mechanic: "Swap candy tiles to create sweet matches and cascading combos.",
    controls: "Mouse or touch swapping controls",
    assets: "Candy sprites, sugar background, combo effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "smiles-match3",
    name: "Smiles Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ffd166",
    colors: ["#ffd166", "#ff7a3d", "#35e8ff"],
    mechanic: "Match smiley face tiles in rows and columns to clear the board.",
    controls: "Mouse or touch swapping controls",
    assets: "Smiley face sprites, colorful background, effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "valentines-match3",
    name: "Valentines Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ff4d6d", "#ffd166"],
    mechanic: "Swap romantic heart and love themed tiles to make matches.",
    controls: "Mouse or touch swapping controls",
    assets: "Heart sprites, Valentine's background, love effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "christmas-match3",
    name: "Christmas Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ff4d6d", "#ffd166"],
    mechanic: "Swap Christmas ornaments and holiday themed tiles to score.",
    controls: "Mouse or touch swapping controls",
    assets: "Christmas ornament sprites, snowy background, holiday effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "animals-crash-match3",
    name: "Animals Crash Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#67ffb4", "#ffd166"],
    mechanic: "Match wild animal tiles and trigger crashing chain reactions.",
    controls: "Mouse or touch swapping controls",
    assets: "Animal face sprites, jungle background, crash effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "halloween-match3",
    name: "Halloween Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#ff7a3d", "#ffd166"],
    mechanic: "Swap creepy Halloween tiles to make spooky matches.",
    controls: "Mouse or touch swapping controls",
    assets: "Halloween sprites, dark themed background, spooky effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "scary-run",
    name: "Scary Run",
    category: "Runner",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#8f7dff", "#ffd166"],
    mechanic: "Run through a scary world, jump over hazards, and survive.",
    controls: "Tap, click, or keyboard jump controls",
    assets: "Scary character, obstacles, dark world, collectibles",
    engine: "construct",
    difficulty: {
      easy: { speedMultiplier: 0.85 },
      normal: { speedMultiplier: 1 },
      hard: { speedMultiplier: 1.2 },
      insane: { speedMultiplier: 1.45 }
    }
  },
  {
    id: "billiards",
    name: "Billiards",
    category: "Sports",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#35e8ff", "#ffd166"],
    mechanic: "Aim, set power, and shoot billiard balls to pot them in pockets.",
    controls: "Mouse to aim and shoot",
    assets: "Billiard table, cue stick, colored balls, pockets",
    engine: "construct",
    difficulty: {
      easy: { friction: 0.98 },
      normal: { friction: 0.96 },
      hard: { friction: 0.94 },
      insane: { friction: 0.92 }
    }
  },
  {
    id: "crazy-match3",
    name: "Crazy Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff3df2",
    colors: ["#ff3df2", "#35e8ff", "#ffd166"],
    mechanic: "Swap crazy colorful tiles with wild power-ups and combos.",
    controls: "Mouse or touch swapping controls",
    assets: "Crazy block sprites, vibrant background, wild effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "cars",
    name: "Cars",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#35e8ff",
    colors: ["#35e8ff", "#ff4d6d", "#ffd166"],
    mechanic: "Drive your car through traffic and obstacles at high speed.",
    controls: "Keyboard or touch driving controls",
    assets: "Car sprites, road, traffic, obstacles",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "monster-match3",
    name: "Monster Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#67ffb4", "#ff7a3d"],
    mechanic: "Match monster tiles to defeat creatures and clear the board.",
    controls: "Mouse or touch swapping controls",
    assets: "Monster sprites, dark themed background, battle effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "sweet-match3",
    name: "Sweet Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff8bd6",
    colors: ["#ff8bd6", "#ffd166", "#67ffb4"],
    mechanic: "Swap sweet dessert tiles to make delicious matches.",
    controls: "Mouse or touch swapping controls",
    assets: "Dessert sprites, bakery background, sweet effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "crazy-car",
    name: "Crazy Car",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#35e8ff", "#ffd166"],
    mechanic: "Drive a crazy car through chaotic traffic and obstacles.",
    controls: "Keyboard or touch driving controls",
    assets: "Car sprites, road, crazy obstacles, boost effects",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "summer-match3",
    name: "Summer Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ffd166",
    colors: ["#ffd166", "#35e8ff", "#67ffb4"],
    mechanic: "Swap sunny summer themed tiles to make bright matches.",
    controls: "Mouse or touch swapping controls",
    assets: "Summer sprites, beach background, sunny effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "funny-faces-match3",
    name: "Funny Faces Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff7a3d",
    colors: ["#ff7a3d", "#ffd166", "#8f7dff"],
    mechanic: "Match hilarious face tiles for laughs and high scores.",
    controls: "Mouse or touch swapping controls",
    assets: "Funny face sprites, colorful background, laugh effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "space-match3",
    name: "Space Match 3",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#35e8ff", "#ffffff"],
    mechanic: "Swap cosmic tiles to make stellar matches in outer space.",
    controls: "Mouse or touch swapping controls",
    assets: "Space themed sprites, galaxy background, star effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "math-game-kids",
    name: "Math Game For Kids",
    category: "Educational",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ffd166", "#35e8ff"],
    mechanic: "Solve math problems with addition, subtraction, and more.",
    controls: "Mouse or touch to select answers",
    assets: "Number sprites, colorful UI, reward animations",
    engine: "construct",
    difficulty: {
      easy: { timer: 30 },
      normal: { timer: 20 },
      hard: { timer: 15 },
      insane: { timer: 10 }
    }
  },
  {
    id: "truck-racer",
    name: "Truck Racer",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#ffd166", "#35e8ff"],
    mechanic: "Race a heavy truck through traffic and challenging roads.",
    controls: "Keyboard or touch steering controls",
    assets: "Truck sprite, road, traffic vehicles, dust effects",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "christmas-gifts",
    name: "Christmas Gifts",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#67ffb4", "#ffd166"],
    mechanic: "Match Christmas gift boxes to unwrap presents and score.",
    controls: "Mouse or touch controls",
    assets: "Gift box sprites, Christmas background, ribbon effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "christmas-bubbles",
    name: "Christmas Bubbles",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ff4d6d", "#ffd166"],
    mechanic: "Shoot and match Christmas themed bubbles to clear the board.",
    controls: "Mouse or touch aiming controls",
    assets: "Christmas bubbles, cannon, snowy background",
    engine: "construct",
    difficulty: {
      easy: { bubbleRows: 5 },
      normal: { bubbleRows: 7 },
      hard: { bubbleRows: 9 },
      insane: { bubbleRows: 11 }
    }
  },
  {
    id: "stick-panda",
    name: "Stick Panda",
    category: "Runner",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ffffff", "#35e8ff"],
    mechanic: "Help the stick panda run and jump through bamboo obstacles.",
    controls: "Tap, click, or keyboard controls",
    assets: "Panda character, bamboo obstacles, forest background",
    engine: "construct",
    difficulty: {
      easy: { speedMultiplier: 0.85 },
      normal: { speedMultiplier: 1 },
      hard: { speedMultiplier: 1.2 },
      insane: { speedMultiplier: 1.45 }
    }
  },
  {
    id: "christmas-balls",
    name: "Christmas Balls",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ff4d6d",
    colors: ["#ff4d6d", "#67ffb4", "#ffd166"],
    mechanic: "Match Christmas ball ornaments to decorate the tree and score.",
    controls: "Mouse or touch controls",
    assets: "Christmas ball sprites, tree background, sparkle effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "road-racer",
    name: "Road Racer",
    category: "Racing",
    time: "Ready",
    reliability: "HTML5",
    accent: "#ffffff",
    colors: ["#ffffff", "#ff4d6d", "#35e8ff"],
    mechanic: "Race down the highway dodging traffic and collecting coins.",
    controls: "Keyboard or touch steering controls",
    assets: "Race car, highway road, traffic cars, coin pickups",
    engine: "construct",
    difficulty: {
      easy: { traffic: 0.8 },
      normal: { traffic: 1 },
      hard: { traffic: 1.25 },
      insane: { traffic: 1.5 }
    }
  },
  {
    id: "jewels-match",
    name: "Jewels Match",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#8f7dff",
    colors: ["#8f7dff", "#ff8bd6", "#ffd166"],
    mechanic: "Swap dazzling jewels to create matches and trigger cascades.",
    controls: "Mouse or touch swapping controls",
    assets: "Jewel sprites, treasure background, sparkle effects",
    engine: "construct",
    difficulty: {
      easy: { timer: 120 },
      normal: { timer: 90 },
      hard: { timer: 60 },
      insane: { timer: 45 }
    }
  },
  {
    id: "pops-billiards",
    name: "Pops Billiards",
    category: "Sports",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#ffd166", "#35e8ff"],
    mechanic: "A fun pop-style billiards game — aim and pot all balls.",
    controls: "Mouse to aim and shoot",
    assets: "Billiard table, colorful balls, cue stick, pockets",
    engine: "construct",
    difficulty: {
      easy: { friction: 0.98 },
      normal: { friction: 0.96 },
      hard: { friction: 0.94 },
      insane: { friction: 0.92 }
    }
  },
  {
    id: "frog-super-bubbles",
    name: "Frog Super Bubbles",
    category: "Puzzle",
    time: "Ready",
    reliability: "HTML5",
    accent: "#67ffb4",
    colors: ["#67ffb4", "#35e8ff", "#ffd166"],
    mechanic: "A frog shoots bubbles to match colors and clear the board.",
    controls: "Mouse or touch aiming controls",
    assets: "Frog shooter, colorful bubbles, pond background",
    engine: "construct",
    difficulty: {
      easy: { bubbleRows: 5 },
      normal: { bubbleRows: 7 },
      hard: { bubbleRows: 9 },
      insane: { bubbleRows: 11 }
    }
  }
];

export const themePresets = {
  neon: { label: "Neon", colors: ["#35e8ff", "#ff3df2", "#ffd166"], mood: "bright arcade glow" },
  retro: { label: "Retro", colors: ["#ff8bd6", "#ffd166", "#67ffb4"], mood: "pixel cabinet energy" },
  nature: { label: "Nature", colors: ["#67ffb4", "#a8e063", "#35e8ff"], mood: "lush bioluminescent garden" },
  space: { label: "Space", colors: ["#8f7dff", "#35e8ff", "#ffffff"], mood: "deep orbit spectacle" },
  fantasy: { label: "Fantasy", colors: ["#ff7a3d", "#67ffb4", "#ffd166"], mood: "rune-lit adventure" }
};

export const gameTemplates = rawGameTemplates;
