# 🌌 ECHO PROTOCOL

**English** · [Español](./README.es.md)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Threejs](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-stable-brightgreen?style=for-the-badge)

**ECHO PROTOCOL** is a fast-paced, highly stylized 3D first-person cyber combat (FPS) game that runs entirely in the browser, built with React, Three.js (React Three Fiber) and Tailwind CSS.

Survive endless sectors against rogue cybernetic drone swarms, earn Cyber Credits, buy permanent upgrades in the Armory, and take down a massive Sector Titan boss every 5 floors.

> 📖 **Full documentation lives in [`docs/`](./docs/README.md):** [functional requirements](./docs/requisitos-funcionales.md) · [user guide](./docs/guia-usuario.md) · [developer guide](./docs/guia-desarrollador.md) · [game systems & balance](./docs/sistemas-juego.md) · [API reference](./docs/api-referencia.md) · [known issues](./docs/problemas-conocidos.md) · [changelog](./CHANGELOG.md)

---

## ✨ Key Features

- **Endless arena combat** — procedurally escalating waves across infinite sector floors.
- **Juicy FPS mechanics** — full 3D mouselook with pointer lock, jump, kinetic dash with i-frames, ADS (aim-down-sights), screen shake, hit markers, muzzle flash, recoil and knockback.
- **Five enemy archetypes** — Scouts, Kamikazes, Snipers (with cover-seeking AI), Shielded Tanks (frontal arc immunity) and the Sector Titan boss.
- **Economy & permanent Armory** — every kill pays out Cyber Credits instantly; upgrades bought between floors persist forever via `localStorage`.
- **Procedural difficulty** — enemy count, HP, speed and flanking aggression scale with the floor number.
- **7 rotating neon sector themes** — lighting, fog, grid and materials cross-fade smoothly on every floor change.
- **Bilingual UI (EN / ES)** — complete translation dictionaries for English and Spanish.
- **Procedural audio** — all SFX are synthesized at runtime with the Web Audio API (zero audio assets) plus a looping synthwave music track.
- **Desktop & touch input** — pointer lock + keyboard on desktop, virtual D-pad and action buttons on mobile.
- **Playground SDK integration** — score/lifecycle reporting with a sandbox fake SDK for local preview.

---

## 🚀 Quick Start

**Requirements:** Node.js **≥ 20.19** (v22/v24 LTS recommended) and npm ≥ 9. Verified on Node `24.14.0` / npm `11.9.0`.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev        # → http://localhost:5173

# 3. Production build
npm run build      # tsc -b && vite build → ./dist

# 4. Preview the production build
npm run preview
```

| Script | Description |
| :--- | :--- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + bundle to `dist/` |
| `npm run lint` | Static analysis with **oxlint** (0 errors / 17 warnings today) |
| `npm run preview` | Serves the built `dist/` folder locally |

---

## 🎮 Controls

### Desktop

| Action | Input |
| :--- | :--- |
| **Move** | `W` `A` `S` `D` or Arrow Keys |
| **Aim** | Mouse movement (click the canvas to lock the pointer) |
| **Fire** | Left Mouse Button (hold to auto-fire) |
| **Aim Down Sights** | Right Mouse Button (hold) — FOV 65 → 45, speed ×0.6 |
| **Jump** | `Space` |
| **Kinetic Dash** | `Shift` while moving — 0.28 s burst, 1.2 s cooldown, brief invulnerability |
| **Pause / Menu** | `Escape` |

### Touch (mobile)

| Action | Input |
| :--- | :--- |
| **Move** | On-screen D-pad (bottom-left) |
| **Look** | Drag anywhere on the right 65% of the screen |
| **Fire** | Big **FIRE** button (bottom-right) |
| **Jump** | **JUMP** button |
| **Armory** | **ARMORY** button appears once the sector is cleared |

> ⚠️ Dash and ADS currently have no touch binding — see [known issues](./docs/problemas-conocidos.md).

**Tip:** orange glowing floor plates are **jump pads** — they launch you ~18 m/s straight up to escape swarms or take the high ground.

---

## 🤖 Enemy Drone Bestiary

| Drone | Behavior | Counter-play |
| :--- | :--- | :--- |
| 🔵 **Scout** | Floats toward you and fires pulse lasers (`8 + 2×floor` dmg). Flanks harder on higher floors. | Standard trading — use pillars as cover. |
| 🟠 **Kamikaze** | Charges at 4.8+ m/s, beeps faster as it closes in, detonates within 2 m for **28** area damage. | Dash through it (i-frames) or shoot it early. |
| 🟣 **Sniper** | Keeps its distance, hides behind pillars for 1.2 s, peeks 1.3 s and fires a **32 dmg** railgun every 2.5 s with a visible laser lock. | Break line of sight, punish the peek window. |
| 🛡️ **Tank** | Heavy unit with an **impenetrable frontal 140° shield**; fires 18 dmg twin shots every 2.8 s. | Flank and hit the exposed rear reactor. |
| 🔴 **Sector Titan** | Boss every 5 floors. 450+ HP, alternating **10-way radial blast** (12 dmg) and **twin heavy burst** (22 dmg), summons reinforcements at 66% and 33% HP. | Keep moving, use jump pads, clear the adds. |

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| UI & state | **React 19** (hooks + refs, no external state library) |
| 3D rendering | **Three.js 0.186** via **@react-three/fiber 9** |
| 3D helpers | **@react-three/drei 10** (`Html`, `Line`) |
| Physics | **@react-three/rapier 2.2** (static world colliders) |
| Post-processing | **@react-three/postprocessing 3** (Bloom) |
| Styling | **Tailwind CSS 3.4** |
| Icons | **lucide-react** |
| Build | **Vite 8.3** + **TypeScript ~6.0** |
| Linting | **oxlint** |
| Audio | Web Audio API (procedural SFX) + HTML5 `<audio>` music loop |

> The previous README listed Zustand as a state layer — it is only a **transitive** dependency of `@react-three/fiber`; the game keeps frame-critical state in `useRef` objects and mirrors what the UI needs into React state.

---

## 📁 Project Structure

```
project-files/
├── index.html              # Entry HTML → /index.tsx
├── index.tsx               # React root mount
├── App.tsx                 # UI shell: menus, HUD, shop, settings, onboarding, persistence
├── Game.tsx                # 3D scene + 60 FPS game loop, AI, combat, themes
├── input.ts                # useInput hook (keyboard / pointer / touch)
├── constants.ts            # CONFIG schema + playground overrides
├── translations.ts         # EN / ES dictionaries
├── types.ts                # Entity & theme TypeScript interfaces
├── utils.ts                # Math helpers + re-exports
├── components/
│   └── FPSWeapon.tsx       # First-person weapon view model
├── utils/
│   ├── helper.tsx          # Overlays, GameAudio (procedural SFX), GameState
│   ├── BackgroundMusic.tsx # Looping music element
│   ├── usePlayground.ts    # Playground SDK + RPC hooks
│   └── playground-fake.ts  # Sandbox SDK used in preview mode
├── design/                 # Original game design document (JSON)
├── public/                 # favicon.svg, icons.svg
├── docs/                   # ← Full documentation (ES)
└── CHANGELOG.md
```

---

## 🧩 Architecture at a Glance

The codebase separates the 60 FPS render loop from the React DOM tree:

- **`App.tsx`** owns everything outside the canvas: main menu, onboarding slides, settings, Armory/shop, HUD, pause and game-over screens, `localStorage` persistence and translation management.
- **`Game.tsx`** owns the simulation: one `useFrame` loop performs look/movement/shooting, drone AI, bullet vs. AABB collision, damage, floor-clear detection and elevator interaction. Frame-critical data lives in refs (`player`, `dronesRef`, `bulletsRef`); only render-ready snapshots are copied into React state.
- **Callbacks as the contract** — `Game` reports upward through `onHitDrone`, `onEnemyKilled`, `onFloorCompleted`, `onBossUpdate` and `onOpenShop`, so React state and the simulation never fight each other.

Full details in the [developer guide](./docs/guia-desarrollador.md) and [API reference](./docs/api-referencia.md).

---

## 📚 Documentation

| Document | Contents |
| :--- | :--- |
| [`docs/README.md`](./docs/README.md) | Documentation index |
| [`docs/requisitos-funcionales.md`](./docs/requisitos-funcionales.md) | Functional & non-functional requirements, user stories, acceptance criteria |
| [`docs/guia-usuario.md`](./docs/guia-usuario.md) | Player manual: setup, controls, HUD, shop, tips, FAQ, troubleshooting |
| [`docs/guia-desarrollador.md`](./docs/guia-desarrollador.md) | Dev setup, architecture, how to extend (new enemy / upgrade / language / theme) |
| [`docs/api-referencia.md`](./docs/api-referencia.md) | Modules, exports, hooks, CONFIG keys, storage keys, translation keys |
| [`docs/sistemas-juego.md`](./docs/sistemas-juego.md) | Game systems: waves, AI, economy, boss phases, themes, audio, scoring |
| [`docs/problemas-conocidos.md`](./docs/problemas-conocidos.md) | Known issues & technical debt (documented, intentionally unfixed) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Keep a Changelog–style release history |

---

## ⚠️ Project Status

The game is **playable end-to-end** and builds cleanly (`npm run build` ✅). Before shipping to production, review the [known issues](./docs/problemas-conocidos.md) — the highlights:

- The **Credit Vacuum** upgrade is persisted but has no gameplay effect (no coin pickups exist — credits are granted instantly).
- `tsc -b` only type-checks `src/` (leftover Vite template), **not** the actual game sources.
- Single bundle of **3.6 MB (1.22 MB gzip)** — no code splitting yet.
- `index.html` title is still `vite-project`.

---

## 📦 Third-Party Notices

Open-source dependencies and their licenses are listed in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

*Good luck, Operative. Ascend the core and pacify the rogue swarms.* 🌌
