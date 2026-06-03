# CLAUDE.md

Guidance for AI coding agents (Claude Code and others) working in this repo.

## What this project is

A full-screen **Lottie player** built on Skia's **Skottie** module (via
`canvaskit-wasm`), with a React + TypeScript + shadcn/ui control surface. It
exists so you can **generate a Lottie animation and watch it play immediately**.

## The core workflow — generating an animation

The whole point of this repo: an LLM writes an animation, the app shows it live.

1. **Write the animation JSON to `public/lottie.json`.** That single file is what
   the app renders — [`src/App.tsx`](src/App.tsx) fetches `/lottie.json` at
   startup.
2. **Run the dev server** (if it isn't already): `npm run dev`. A Vite plugin
   watches `public/lottie.json` and **full-reloads the page whenever you save**,
   so edits appear instantly.
3. To author a *renderable* file, **use the `write-lottie` skill** in
   [`.claude/skills/write-lottie/SKILL.md`](.claude/skills/write-lottie/SKILL.md).
   It documents the required JSON shape, the Skottie-specific gotchas (the big
   one: shapes must be wrapped in a `"ty": "gr"` group or they render blank),
   the keyframe/easing format, and a known-good starter example.

If the canvas is blank with **no** on-screen error, the file parsed but drew
nothing — re-check the group wrapping (see the skill).

## Setup

```bash
npm install   # postinstall copies the CanvasKit wasm into /public
npm run dev    # then open the printed local URL
```

## Project layout

- [`public/lottie.json`](public/lottie.json) — the animation the app renders. **Edit this to change the output.**
- [`public/controls.json`](public/controls.json) — optional sidecar: labels and slider ranges for the animation's slottable properties (see the write-lottie skill). Drives the live properties panel.
- [`src/lib/lottie-player.ts`](src/lib/lottie-player.ts) — the `LottiePlayer`: CanvasKit surface, rAF loop, frame-based playhead, camera input, slot get/set.
- [`src/components/PropertiesPanel.tsx`](src/components/PropertiesPanel.tsx) — auto-generated text/slider/color controls bound to the animation's slots.
- [`src/lib/camera.ts`](src/lib/camera.ts) — Figma-style pan/zoom math.
- [`src/App.tsx`](src/App.tsx) — fetches the Lottie file and wires the player to the UI.
- [`vite.config.ts`](vite.config.ts) — includes the dev plugin that hot-reloads on Lottie changes.
- [`scripts/copy-canvaskit.mjs`](scripts/copy-canvaskit.mjs) — copies the CanvasKit wasm into `/public` on postinstall.

## Conventions

- The CanvasKit **full** build is required (it includes Skottie). The wasm is not
  committed; it's copied in by postinstall.
- Match the existing code style: typed, small modules, comments that explain
  *why*. Keep changes minimal and focused.
