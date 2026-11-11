# 🌌 ECHO PROTOCOL

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Threejs](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-stable-brightgreen?style=for-the-badge)

[Español](#español) · [English](#english)

---

## Español

**ECHO PROTOCOL (PROTOCOLO ECHO)** es un FPS 3D cyberpunk trepidante y muy estilizado que corre íntegramente en el navegador, hecho con React, Three.js (React Three Fiber) y Tailwind CSS.

Sobrevive a sectores infinitos contra enjambres de drones cibernéticos rebeldes, gana Créditos Cibernéticos, compra mejoras permanentes en la Armería y derrota a un Titán de Sector masivo cada 5 pisos.

> 📖 **Documentación completa en [`docs/`](./docs/README.md):** [requisitos funcionales](./docs/requisitos-funcionales.md) · [guía de usuario](./docs/guia-usuario.md) · [guía de desarrollador](./docs/guia-desarrollador.md) · [sistemas y balanceo](./docs/sistemas-juego.md) · [referencia de API](./docs/api-referencia.md) · [changelog](./CHANGELOG.md)

---

### Índice

1. [Características principales](#características-principales)
2. [Inicio rápido](#inicio-rápido)
3. [Controles](#controles)
4. [Bestiario de Drones](#bestiario-de-drones)
5. [Stack tecnológico](#stack-tecnológico)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Arquitectura en pocas palabras](#arquitectura-en-pocas-palabras)
8. [Documentación](#documentación)
9. [Estado del proyecto](#estado-del-proyecto)
10. [Avisos de terceros](#avisos-de-terceros)
11. [Licencia](#licencia)

### Características principales

- **Combate infinito por oleadas** — enemigos que escalan proceduralmente en pisos de sector infinitos.
- **Mecánicas FPS "jugosas"** — apuntado 3D completo con pointer lock, salto, dash cinético con i-frames, ADS (apuntar con mira), screen shake, hit markers, fogonazo, retroceso y knockback.
- **Cinco arquetipos de enemigos** — Exploradores, Kamikazes, Francotiradores (IA que busca cobertura), Tanques con escudo frontal y el jefe Titán de Sector.
- **Economía y Armería permanente** — cada baja paga Créditos Cibernéticos al instante; las mejoras compradas entre pisos persisten para siempre vía `localStorage`.
- **Dificultad procedural** — cantidad de enemigos, PV, velocidad y agresividad de flanqueo escalan con el piso.
- **7 temas neón rotativos** — iluminación, niebla, rejilla y materiales hacen cross-fade suave en cada cambio de piso.
- **Interfaz bilingüe (EN / ES)** — diccionarios de traducción completos en inglés y español.
- **Audio procedural** — todos los efectos se sintetizan en tiempo real con Web Audio API (cero assets de audio) más una pista synthwave en loop.
- **Entrada de escritorio y táctil** — pointer lock + teclado en escritorio; D-pad virtual y botones FIRE / JUMP / **DASH / ADS** en móvil.
- **Integración con Playground SDK** — reporte de puntaje/ciclo de vida con SDK falso en sandbox para vista previa local.

---

### Inicio rápido

**Requisitos:** Node.js **≥ 20.19** (recomendado LTS v22/v24) y npm ≥ 9. Verificado con Node `24.14.0` / npm `11.9.0`.

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor de desarrollo
npm run dev        # → http://localhost:5173

# 3. Ejecutar los tests
npm test

# 4. Build de producción
npm run build      # tsc -b && vite build → ./dist

# 5. Previsualizar el build
npm run preview
```

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm test` | Suite **Vitest** (67 tests: tienda, audio, entrada, traducciones…) |
| `npm run build` | Type-check (**strict**) + bundle en `dist/` |
| `npm run lint` | Análisis estático con **oxlint** (0 errores / 0 avisos) |
| `npm run preview` | Sirve localmente la carpeta `dist/` construida |
| `npm run dev:tauri` | Ventana de escritorio en desarrollo (Vite en `:1420` + ventana nativa con HMR) |
| `npm run exe` | Compila el ejecutable de Windows autocontenido (~5 MB) |
| `npm run installer` | Genera `EchoProtocol-Setup-1.0.0.exe` (~7 MB, Inno Setup) |

#### Ejecutable de Windows

El juego también se empaqueta como aplicación de escritorio con **[Tauri 2](https://tauri.app)**: el binario lleva dentro el build web completo (no necesita navegador, Node ni archivos sueltos). Requisitos: Rust (MSVC), Inno Setup 7 y el WebView2 Runtime (viene en Windows 11 y en Windows 10 actualizado; el instalador lo bootstrapa si falta).

```bash
npm run installer   # → installer/output/EchoProtocol-Setup-1.0.0.exe
```

La música viaja dentro del binario (`public/music/`), así que el juego funciona **sin conexión**. Detalles en la [guía de desarrollador §10.2](./docs/guia-desarrollador.md).

---

### Controles

#### Escritorio

| Acción | Entrada |
| :--- | :--- |
| **Moverse** | `W` `A` `S` `D` o Flechas |
| **Apuntar** | Movimiento del ratón (clic en el lienzo para fijar el puntero) |
| **Disparar** | Clic izquierdo (mantener para auto-disparo) |
| **Apuntar con mira (ADS)** | Clic derecho (mantener) — FOV 65 → 45, velocidad ×0.6 |
| **Saltar** | `Espacio` |
| **Dash cinético** | `Shift` mientras te mueves — ráfaga de 0.28 s, recarga de 1.2 s, invulnerabilidad breve |
| **Pausa / Menú** | `Escape` |

#### Táctil (móvil)

| Acción | Entrada |
| :--- | :--- |
| **Moverse** | D-pad en pantalla (inferior izquierda) |
| **Apuntar** | Arrastra en el 65% derecho de la pantalla |
| **Disparar** | Botón grande **FIRE** (inferior derecha) |
| **Saltar** | Botón **JUMP** |
| **Dash cinético** | Botón **DASH** |
| **Apuntar con mira (ADS)** | Botón **ADS** (mantener) |
| **Armería** | El botón **ARMORY** aparece al asegurar el sector |

**Consejo:** las placas naranjas brillantes del suelo son **plataformas de salto**: te lanzan a ~18 m/s en vertical para escapar de enjambres o ganar altura.

---

### Bestiario de Drones

| Drone | Comportamiento | Contra-estrategia |
| :--- | :--- | :--- |
| 🔵 **Explorador** | Flota hacia ti y dispara láseres (`8 + 2×piso` de daño). Flanquea más agresivamente en pisos altos. | Cambia tiros usando los pilares como cobertura. |
| 🟠 **Kamikaze** | Carga a 4.8+ m/s, pita más rápido al acercarse y **detona a <2 m** por 28 de daño en área. | Atraviesalo con dash (i-frames) o derríbalo antes. |
| 🟣 **Francotirador** | Mantiene distancia, se esconde 1.2 s tras un pilar, asoma 1.3 s y dispara un riel de **32 de daño** cada 2.5 s con láser de puntería visible. | Rompe la línea de visión y castiga la ventana de asomo. |
| 🛡️ **Tanque** | Unidad pesada con **escudo frontal impenetrable de 140°**; dispara parejas de 18 de daño cada 2.8 s. | Flanquéalo y golpea el reactor trasero expuesto. |
| 🔴 **Titán de Sector** | Jefe cada 5 pisos. 450+ PV, alterna **ráfaga radial de 10** (12 de daño) y **doble disparo pesado** (22), invoca refuerzos al 66% y 33% de PV. | No te quedes quieto, usa plataformas de salto y limpia los adds. |

---

### Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| UI y estado | **React 19** (hooks + refs, sin librería de estado externa) |
| Render 3D | **Three.js 0.186** vía **@react-three/fiber 9** |
| Helpers 3D | **@react-three/drei 10** (`Html`, `Line`) |
| Física | **@react-three/rapier 2.2** (colisionadores estáticos del mundo) |
| Post-procesado | **@react-three/postprocessing 3** (Bloom) |
| Estilos | **Tailwind CSS 3.4** |
| Iconos | **lucide-react** |
| Build | **Vite 8.3** + **TypeScript ~6.0** |
| Linting | **oxlint** |
| Audio | Web Audio API (SFX procedurales) + `<audio>` HTML5 en loop |

> El README anterior citaba a Zustand como capa de estado: en realidad es una dependencia **transitiva** de `@react-three/fiber`. El juego guarda el estado crítico de cada frame en objetos `useRef` y refleja en estado de React solo lo que la interfaz necesita.

---

### Estructura del proyecto

```
project-files/
├── index.html              # HTML de entrada → /index.tsx
├── index.tsx               # Montaje del root de React
├── App.tsx                 # Shell UI: menús, HUD, tienda, ajustes, onboarding, persistencia
├── Game.tsx                # Escena 3D + bucle a 60 FPS, IA, combate, temas (chunk lazy)
├── input.ts                # useInput + setVirtualAction (teclado / puntero / táctil)
├── constants.ts            # CONFIG (solo claves con efecto real) + overrides de playground
├── translations.ts         # Diccionarios EN / ES (103 claves)
├── types.ts                # Interfaces TypeScript de entidades y temas
├── themes.ts               # SECTOR_THEMES + getThemeForFloor
├── arena.ts                # Dimensiones y obstáculos estáticos de la arena
├── waves.ts                # createFloorWave(): fórmula de oleadas
├── utils.ts                # Helpers matemáticos + re-exports
├── components/
│   └── FPSWeapon.tsx       # Vista del arma en primera persona
├── utils/
│   ├── helper.tsx          # MenuOverlay, GameAudio (SFX procedurales), GameState
│   ├── BackgroundMusic.tsx # Música en loop (degrada a silencio si falla)
│   ├── usePlayground.ts    # Hooks del Playground SDK y RPC
│   └── playground-fake.ts  # SDK ficticio para modo sandbox
├── tests/                  # Suite Vitest (67 tests)
├── src-tauri/              # Shell Tauri 2 (Rust) → ejecutable de Windows
├── installer/              # Script de Inno Setup + bootstrapper de WebView2
├── design/                 # Documento de diseño histórico (JSON)
├── public/                 # favicon.svg, icons.svg, music/grid_runner.mp3
├── docs/                   # ← Documentación completa (ES)
├── playground_config.json  # Esquema de parámetros ajustables por el host
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── CHANGELOG.md
```

---

### Arquitectura en pocas palabras

El código separa el bucle de render a 60 FPS del árbol DOM de React:

- **`App.tsx`** es dueño de todo lo que está fuera del lienzo: menú principal, slides de onboarding, ajustes, Armería, HUD, pausa, pantallas de fin de partida, persistencia en `localStorage` y gestión de idiomas.
- **`Game.tsx`** es dueño de la simulación: un solo bucle `useFrame` ejecuta apuntado/movimiento/disparo, IA de drones, colisión bala vs. AABB, daño, detección de piso limpio e interacción con el elevador. Los datos críticos viven en refs (`player`, `dronesRef`, `bulletsRef`); solo se copian a estado de React las listas ya listas para dibujar.
- **Callbacks como contrato** — `Game` reporta hacia arriba mediante `onHitDrone`, `onEnemyKilled`, `onFloorCompleted`, `onBossUpdate` y `onOpenShop`, de modo que el estado de React y la simulación nunca se pisarían.

Detalles completos en la [guía de desarrollador](./docs/guia-desarrollador.md) y la [referencia de API](./docs/api-referencia.md).

---

### Documentación

| Documento | Contenido |
| :--- | :--- |
| [`docs/README.md`](./docs/README.md) | Índice de documentación |
| [`docs/requisitos-funcionales.md`](./docs/requisitos-funcionales.md) | Requisitos funcionales y no funcionales, historias de usuario, criterios de aceptación |
| [`docs/guia-usuario.md`](./docs/guia-usuario.md) | Manual del jugador: instalación, controles, HUD, tienda, consejos, FAQ, solución de problemas |
| [`docs/guia-desarrollador.md`](./docs/guia-desarrollador.md) | Setup, arquitectura, cómo extender (nuevo enemigo / mejora / idioma / tema) |
| [`docs/api-referencia.md`](./docs/api-referencia.md) | Módulos, exports, hooks, claves CONFIG, claves de storage, claves de traducción |
| [`docs/sistemas-juego.md`](./docs/sistemas-juego.md) | Sistemas: oleadas, IA, economía, fases del jefe, temas, audio, puntuación |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historial de versiones al estilo Keep a Changelog |
| [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) | Dependencias de terceros verificadas con el texto íntegro de sus licencias |
| [`LICENSE`](./LICENSE) | Licencia propietaria de ECHO PROTOCOL (EN / ES) |

---

### Estado del proyecto

El juego es **jugable de principio a fin** y el chain de herramientas está en verde:

| Verificación | Estado |
| :--- | :--- |
| `npx tsc -b` | 0 errores, **`strict: true`** |
| `npm run lint` | 0 errores, 0 avisos |
| `npm test` | **67/67** en verde |
| `npm run build` | ✅ — la ruta crítica (menú/onboarding) pesa **~95 kB gzip**; el motor 3D (~1.13 MB gzip) se descarga bajo demanda |
| CI | `.github/workflows/ci.yml` ejecuta lint → test → build en cada push/PR |

La deuda que queda está documentada en la [guía de desarrollador §7.2](./docs/guia-desarrollador.md) (re-render por frame durante el combate, pools de entidades, música remota).

---

### Avisos de terceros

Las dependencias de código abierto y sus licencias están listadas en [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

### Licencia

ECHO PROTOCOL es **software propietario**. Puedes descargarlo, instalarlo y jugarlo con fines personales y no comerciales; no puedes redistribuirlo, modificarlo, alojarlo ni reutilizar su código o sus recursos. El texto completo bilingüe está en [`LICENSE`](./LICENSE).

Los componentes de código abierto de terceros permanecen bajo sus propias licencias (MIT, Apache-2.0, Zlib, ISC, CC0) — véase [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

*Buena suerte, Operativo. Asciende por el núcleo y pacifica los enjambres rebeldes.* 🌌

---

## English

**ECHO PROTOCOL** is a fast-paced, highly stylized 3D first-person cyber combat (FPS) game that runs entirely in the browser, built with React, Three.js (React Three Fiber) and Tailwind CSS.

Survive endless sectors against rogue cybernetic drone swarms, earn Cyber Credits, buy permanent upgrades in the Armory, and take down a massive Sector Titan boss every 5 floors.

> 📖 **Full documentation lives in [`docs/`](./docs/README.md):** [functional requirements](./docs/requisitos-funcionales.md) · [user guide](./docs/guia-usuario.md) · [developer guide](./docs/guia-desarrollador.md) · [game systems & balance](./docs/sistemas-juego.md) · [API reference](./docs/api-referencia.md) · [changelog](./CHANGELOG.md)

---

### Table of contents

1. [Key Features](#key-features)
2. [Quick Start](#quick-start)
3. [Controls](#controls)
4. [Enemy Drone Bestiary](#enemy-drone-bestiary)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Architecture at a Glance](#architecture-at-a-glance)
8. [Documentation](#documentation)
9. [Project Status](#project-status)
10. [Third-Party Notices](#third-party-notices)
11. [License](#license)

### Key Features

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

### Quick Start

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
| `npm run dev:tauri` | Desktop dev window (Vite on `:1420` + native window with HMR) |
| `npm run exe` | Builds the standalone Windows executable (~5 MB) |
| `npm run installer` | Builds `EchoProtocol-Setup-1.0.0.exe` (~7 MB, Inno Setup) |

#### Windows executable

The game also ships as a desktop app via **[Tauri 2](https://tauri.app)**: the binary embeds the whole web build (no browser, no Node, no loose files required). Requirements: Rust (MSVC), Inno Setup 7 and the WebView2 Runtime (preinstalled on Windows 11 / updated Windows 10 — the installer bootstraps it otherwise).

```bash
npm run installer   # → installer/output/EchoProtocol-Setup-1.0.0.exe
```

The music track ships inside the binary (`public/music/`), so the game runs fully offline. Details in the [developer guide §10.2](./docs/guia-desarrollador.md).

---

### Controls

#### Desktop

| Action | Input |
| :--- | :--- |
| **Move** | `W` `A` `S` `D` or Arrow Keys |
| **Aim** | Mouse movement (click the canvas to lock the pointer) |
| **Fire** | Left Mouse Button (hold to auto-fire) |
| **Aim Down Sights** | Right Mouse Button (hold) — FOV 65 → 45, speed ×0.6 |
| **Jump** | `Space` |
| **Kinetic Dash** | `Shift` while moving — 0.28 s burst, 1.2 s cooldown, brief invulnerability |
| **Pause / Menu** | `Escape` |

#### Touch (mobile)

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

### Enemy Drone Bestiary

| Drone | Behavior | Counter-play |
| :--- | :--- | :--- |
| 🔵 **Scout** | Floats toward you and fires pulse lasers (`8 + 2×floor` dmg). Flanks harder on higher floors. | Standard trading — use pillars as cover. |
| 🟠 **Kamikaze** | Charges at 4.8+ m/s, beeps faster as it closes in, detonates within 2 m for **28** area damage. | Dash through it (i-frames) or shoot it early. |
| 🟣 **Sniper** | Keeps its distance, hides behind pillars for 1.2 s, peeks 1.3 s and fires a **32 dmg** railgun every 2.5 s with a visible laser lock. | Break line of sight, punish the peek window. |
| 🛡️ **Tank** | Heavy unit with an **impenetrable frontal 140° shield**; fires 18 dmg twin shots every 2.8 s. | Flank and hit the exposed rear reactor. |
| 🔴 **Sector Titan** | Boss every 5 floors. 450+ HP, alternating **10-way radial blast** (12 dmg) and **twin heavy burst** (22 dmg), summons reinforcements at 66% and 33% HP. | Keep moving, use jump pads, clear the adds. |

---

### Technology Stack

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

### Project Structure

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
├── src-tauri/              # Tauri 2 shell (Rust) → ejecutable de Windows
├── installer/              # Script de Inno Setup + bootstrapper de WebView2
├── design/                 # Legacy game design document (JSON)
├── public/                 # favicon.svg, icons.svg, music/grid_runner.mp3
├── docs/                   # ← Full documentation (ES)
├── playground_config.json  # Host-tunable parameter schema
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── CHANGELOG.md
```

---

### Architecture at a Glance

The codebase separates the 60 FPS render loop from the React DOM tree:

- **`App.tsx`** owns everything outside the canvas: main menu, onboarding slides, settings, Armory/shop, HUD, pause and game-over screens, `localStorage` persistence and translation management.
- **`Game.tsx`** owns the simulation: one `useFrame` loop performs look/movement/shooting, drone AI, bullet vs. AABB collision, damage, floor-clear detection and elevator interaction. Frame-critical data lives in refs (`player`, `dronesRef`, `bulletsRef`); only render-ready snapshots are copied into React state.
- **Callbacks as the contract** — `Game` reports upward through `onHitDrone`, `onEnemyKilled`, `onFloorCompleted`, `onBossUpdate` and `onOpenShop`, so React state and the simulation never fight each other.

Full details in the [developer guide](./docs/guia-desarrollador.md) and [API reference](./docs/api-referencia.md).

---

### Documentation

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

### Project Status

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

### Third-Party Notices

Open-source dependencies and their licenses are listed in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

### License

ECHO PROTOCOL is **proprietary software**. You may download, install and play it for personal, non-commercial use; you may not redistribute, modify, host or reuse its code or assets. The full bilingual text is in [`LICENSE`](./LICENSE).

Third-party open-source components remain under their own licenses (MIT, Apache-2.0, Zlib, ISC, CC0) — see [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

*Good luck, Operative. Ascend the core and pacify the rogue swarms.* 🌌
