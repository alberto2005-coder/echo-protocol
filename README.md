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

> 📖 **Full documentation lives in [`docs/`](./docs/README.md):** [functional requirements](./docs/requisitos-funcionales.md) · [user guide](./docs/guia-usuario.md) · [developer guide](./docs/guia-desarrollador.md) · [game systems & balance](./docs/sistemas-juego.md) · [API reference](./docs/api-referencia.md) · [changelog](./CHANGELOG.md)

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
- **Desktop & touch input** — pointer lock + keyboard on desktop, virtual D-pad plus FIRE / JUMP / **DASH / ADS** buttons on mobile.
- **Playground SDK integration** — score/lifecycle reporting with a sandbox fake SDK for local preview.

---

## 🚀 Quick Start

**Requirements:** Node.js **≥ 20.19** (v22/v24 LTS recommended) and npm ≥ 9. Verified on Node `24.14.0` / npm `11.9.0`.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev        # → http://localhost:5173

# 3. Run the test suite (Vitest + jsdom)
npm test

# 4. Production build
npm run build      # tsc -b && vite build → ./dist

# 5. Preview the production build
npm run preview
```

| Script | Description |
| :--- | :--- |
| `npm run dev` | Vite dev server with HMR |
| `npm test` | **Vitest** suite (67 tests: shop, audio, input, translations, waves…) |
| `npm run build` | Type-check (**strict**) + bundle to `dist/` |
| `npm run lint` | Static analysis with **oxlint** (0 errors / 0 warnings) |
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
| **Kinetic Dash** | **DASH** button |
| **Aim Down Sights** | **ADS** button (hold) |
| **Armory** | **ARMORY** button appears once the sector is cleared |

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
├── Game.tsx                # 3D scene + 60 FPS game loop, AI, combat, themes (lazy chunk)
├── input.ts                # useInput + setVirtualAction (keyboard / pointer / touch)
├── constants.ts            # CONFIG (only keys with a real effect) + playground overrides
├── translations.ts         # EN / ES dictionaries (103 keys)
├── types.ts                # Entity & theme TypeScript interfaces
├── themes.ts               # SECTOR_THEMES + getThemeForFloor
├── arena.ts                # Arena dimensions and static obstacles
├── waves.ts                # createFloorWave(): wave-composition formula
├── utils.ts                # Math helpers + re-exports
├── components/
│   └── FPSWeapon.tsx       # First-person weapon view model
├── utils/
│   ├── helper.tsx          # MenuOverlay, GameAudio (procedural SFX), GameState
│   ├── BackgroundMusic.tsx # Looping music element (degrades to silence if it fails)
│   ├── usePlayground.ts    # Playground SDK + RPC hooks
│   └── playground-fake.ts  # Sandbox SDK used in preview mode
├── tests/                  # Vitest suite (67 tests)
├── design/                 # Legacy game design document (JSON)
├── public/                 # favicon.svg, icons.svg
├── docs/                   # ← Full documentation (ES)
├── playground_config.json  # Host-tunable parameter schema
├── THIRD_PARTY_NOTICES.md
├── LICENSE
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
| [`CHANGELOG.md`](./CHANGELOG.md) | Keep a Changelog–style release history |
| [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) | Verified third-party dependencies and their full license texts |
| [`LICENSE`](./LICENSE) | Proprietary license of ECHO PROTOCOL (EN / ES) |

---

## ✅ Project Status

The game is **playable end-to-end** and the toolchain is green:

| Check | Status |
| :--- | :--- |
| `npx tsc -b` | 0 errors, **`strict: true`** |
| `npm run lint` | 0 errors, 0 warnings |
| `npm test` | **67/67** passing |
| `npm run build` | ✅ — critical path (menu/onboarding) is **~95 kB gzip**; the 3D engine (~1.13 MB gzip) loads on demand |
| CI | `.github/workflows/ci.yml` runs lint → test → build on every push/PR |

Known remaining debt is tracked in the [developer guide §7.2](./docs/guia-desarrollador.md) (frame-by-frame re-render during combat, entity pools, remote music asset).

---

## 📦 Third-Party Notices

Open-source dependencies and their licenses are listed in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

## 🔒 License

ECHO PROTOCOL is **proprietary software**. You may download, install and play it for personal, non-commercial use; you may not redistribute, modify, host or reuse its code or assets. The full bilingual text is in [`LICENSE`](./LICENSE).

Third-party open-source components remain under their own licenses (MIT, Apache-2.0, Zlib, ISC, CC0) — see [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

*Good luck, Operative. Ascend the core and pacify the rogue swarms.* 🌌
