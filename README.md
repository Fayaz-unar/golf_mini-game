# Greenroom — Mini Golf

A browser-based three-hole mini golf game crafted with plain HTML5, CSS3, and modern JavaScript. Deploys instantly to Vercel as a zero-config static site.

## Play

[click here to play
](https://golfmini-game.vercel.app/)

### Controls
- **Aim:** Click or drag on the course to point in any direction, or use the **Left (←) / Right (→)** arrow keys (or mobile on-screen buttons) for precision aiming.
- **Power:** Set shot power using the slider, or **press and hold Space / "Take the Shot"** to charge up with smooth oscillating meter timing, then release to shoot.
- **Reset:** Click **Reset This Hole (↺)** to retry the current hole.

## Features

- **Interactive Hazards & Physical Obstacles:**
  - **Water Hazards:** Ball splashes into ponds, incurring a +1 penalty stroke and dropping the ball back to your previous shot location.
  - **Sand Bunkers:** Heavy abrasive drag slows down shots passing through sand traps.
  - **Trees & Wooden Bumpers:** Realistic elastic bounce collisions off trees and course walls with angle-of-reflection conservation.
  - **Cup Funnel & Gravity:** Subtle cup suction and sinking animation when rolling close at gentle speeds.
- **Unique Per-Hole Fairway Layouts:** Each hole features custom fairway geometry, putting green aprons, obstacle placement, and wind drift.
- **Dynamic Particle Effects:** Water splashes & ripples, sand puffs, tree foliage chips, ball turf trails, and victory confetti.
- **High-DPI / Retina Canvas:** Razor-sharp rendering on 1080p, 4K, and mobile screens using device pixel ratio scaling.
- **End-of-Round Scorecard:** Displays hole-by-hole results (Aces, Eagles, Birdies, Pars, Bogeys), total strokes relative to par, best round tracking in `localStorage`, and an instant **Play Next Round** flow.
- **Procedural Audio Synthesis:** Authentic procedural sound effects built with the Web Audio API for strikes, bounces, sand traps, splashes, and cup drops.

## Deploy to Vercel

Import this repository into Vercel. No build step or package dependencies are required; the root directory serves `index.html`.
# golf_mini-game
