# 🌌 ECHO PROTOCOL — PROTOCOLO ECHO

[English](./README.md) · **Español**

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Threejs](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-estable-brightgreen?style=for-the-badge)

**ECHO PROTOCOL (PROTOCOLO ECHO)** es un FPS 3D cyberpunk trepidante y muy estilizado que corre íntegramente en el navegador, hecho con React, Three.js (React Three Fiber) y Tailwind CSS.

Sobrevive a sectores infinitos contra enjambres de drones cibernéticos rebeldes, gana Créditos Cibernéticos, compra mejoras permanentes en la Armería y derrota a un Titán de Sector masivo cada 5 pisos.

> 📖 **Documentación completa en [`docs/`](./docs/README.md):** [requisitos funcionales](./docs/requisitos-funcionales.md) · [guía de usuario](./docs/guia-usuario.md) · [guía de desarrollador](./docs/guia-desarrollador.md) · [sistemas y balanceo](./docs/sistemas-juego.md) · [referencia de API](./docs/api-referencia.md) · [problemas conocidos](./docs/problemas-conocidos.md) · [changelog](./CHANGELOG.md)

---

## ✨ Características principales

- **Combate infinito por oleadas** — enemigos que escalan proceduralmente en pisos de sector infinitos.
- **Mecánicas FPS "jugosas"** — apuntado 3D completo con pointer lock, salto, dash cinético con i-frames, ADS (apuntar con mira), screen shake, hit markers, fogonazo, retroceso y knockback.
- **Cinco arquetipos de enemigos** — Exploradores, Kamikazes, Francotiradores (IA que busca cobertura), Tanques con escudo frontal y el jefe Titán de Sector.
- **Economía y Armería permanente** — cada baja paga Créditos Cibernéticos al instante; las mejoras compradas entre pisos persisten para siempre vía `localStorage`.
- **Dificultad procedural** — cantidad de enemigos, PV, velocidad y agresividad de flanqueo escalan con el piso.
- **7 temas neón rotativos** — iluminación, niebla, rejilla y materiales hacen cross-fade suave en cada cambio de piso.
- **Interfaz bilingüe (EN / ES)** — diccionarios de traducción completos en inglés y español.
- **Audio procedural** — todos los efectos se sintetizan en tiempo real con Web Audio API (cero assets de audio) más una pista synthwave en loop.
- **Entrada de escritorio y táctil** — pointer lock + teclado en escritorio; D-pad virtual y botones de acción en móvil.
- **Integración con Playground SDK** — reporte de puntaje/ciclo de vida con SDK falso en sandbox para vista previa local.

---

## 🚀 Inicio rápido

**Requisitos:** Node.js **≥ 20.19** (recomendado LTS v22/v24) y npm ≥ 9. Verificado con Node `24.14.0` / npm `11.9.0`.

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor de desarrollo
npm run dev        # → http://localhost:5173

# 3. Build de producción
npm run build      # tsc -b && vite build → ./dist

# 4. Previsualizar el build
npm run preview
```

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm run build` | Type-check + bundle en `dist/` |
| `npm run lint` | Análisis estático con **oxlint** (hoy: 0 errores / 17 avisos) |
| `npm run preview` | Sirve localmente la carpeta `dist/` construida |

---

## 🎮 Controles

### Escritorio

| Acción | Entrada |
| :--- | :--- |
| **Moverse** | `W` `A` `S` `D` o Flechas |
| **Apuntar** | Movimiento del ratón (clic en el lienzo para fijar el puntero) |
| **Disparar** | Clic izquierdo (mantener para auto-disparo) |
| **Apuntar con mira (ADS)** | Clic derecho (mantener) — FOV 65 → 45, velocidad ×0.6 |
| **Saltar** | `Espacio` |
| **Dash cinético** | `Shift` mientras te mueves — ráfaga de 0.28 s, recarga de 1.2 s, invulnerabilidad breve |
| **Pausa / Menú** | `Escape` |

### Táctil (móvil)

| Acción | Entrada |
| :--- | :--- |
| **Moverse** | D-pad en pantalla (inferior izquierda) |
| **Apuntar** | Arrastra en el 65% derecho de la pantalla |
| **Disparar** | Botón grande **FIRE** (inferior derecha) |
| **Saltar** | Botón **JUMP** |
| **Armería** | El botón **ARMORY** aparece al asegurar el sector |

> ⚠️ El dash y el ADS no tienen asignación táctil todavía — ver [problemas conocidos](./docs/problemas-conocidos.md).

**Consejo:** las placas naranjas brillantes del suelo son **plataformas de salto**: te lanzan a ~18 m/s en vertical para escapar de enjambres o ganar altura.

---

## 🤖 Bestiario de Drones

| Drone | Comportamiento | Contra-estrategia |
| :--- | :--- | :--- |
| 🔵 **Explorador** | Flota hacia ti y dispara láseres (`8 + 2×piso` de daño). Flanquea más agresivamente en pisos altos. | Cambia tiros usando los pilares como cobertura. |
| 🟠 **Kamikaze** | Carga a 4.8+ m/s, pita más rápido al acercarse y **detona a <2 m** por 28 de daño en área. | Atraviesalo con dash (i-frames) o derríbalo antes. |
| 🟣 **Francotirador** | Mantiene distancia, se esconde 1.2 s tras un pilar, asoma 1.3 s y dispara un riel de **32 de daño** cada 2.5 s con láser de puntería visible. | Rompe la línea de visión y castiga la ventana de asomo. |
| 🛡️ **Tanque** | Unidad pesada con **escudo frontal impenetrable de 140°**; dispara parejas de 18 de daño cada 2.8 s. | Flanquéalo y golpea el reactor trasero expuesto. |
| 🔴 **Titán de Sector** | Jefe cada 5 pisos. 450+ PV, alterna **ráfaga radial de 10** (12 de daño) y **doble disparo pesado** (22), invoca refuerzos al 66% y 33% de PV. | No te quedes quieto, usa plataformas de salto y limpia los adds. |

---

## 🛠️ Stack tecnológico

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

## 📁 Estructura del proyecto

```
project-files/
├── index.html              # HTML de entrada → /index.tsx
├── index.tsx               # Montaje del root de React
├── App.tsx                 # Shell UI: menús, HUD, tienda, ajustes, onboarding, persistencia
├── Game.tsx                # Escena 3D + bucle de juego a 60 FPS, IA, combate, temas
├── input.ts                # Hook useInput (teclado / puntero / táctil)
├── constants.ts            # Esquema CONFIG + overrides de playground
├── translations.ts         # Diccionarios EN / ES
├── types.ts                # Interfaces TypeScript de entidades y temas
├── utils.ts                # Helpers matemáticos + re-exports
├── components/
│   └── FPSWeapon.tsx       # Vista del arma en primera persona
├── utils/
│   ├── helper.tsx          # Overlays, GameAudio (SFX procedurales), GameState
│   ├── BackgroundMusic.tsx # Música en loop
│   ├── usePlayground.ts    # Hooks del Playground SDK y RPC
│   └── playground-fake.ts  # SDK ficticio para modo sandbox
├── design/                 # Documento de diseño de juego original (JSON)
├── public/                 # favicon.svg, icons.svg
├── docs/                   # ← Documentación completa (ES)
└── CHANGELOG.md
```

---

## 🧩 Arquitectura en pocas palabras

El código separa el bucle de render a 60 FPS del árbol DOM de React:

- **`App.tsx`** es dueño de todo lo que está fuera del lienzo: menú principal, slides de onboarding, ajustes, Armería, HUD, pausa, pantallas de fin de partida, persistencia en `localStorage` y gestión de idiomas.
- **`Game.tsx`** es dueño de la simulación: un solo bucle `useFrame` ejecuta apuntado/movimiento/disparo, IA de drones, colisión bala vs. AABB, daño, detección de piso limpio e interacción con el elevador. Los datos críticos viven en refs (`player`, `dronesRef`, `bulletsRef`); solo se copian a estado de React las listas ya listas para dibujar.
- **Callbacks como contrato** — `Game` reporta hacia arriba mediante `onHitDrone`, `onEnemyKilled`, `onFloorCompleted`, `onBossUpdate` y `onOpenShop`, de modo que el estado de React y la simulación nunca se pisarían.

Detalles completos en la [guía de desarrollador](./docs/guia-desarrollador.md) y la [referencia de API](./docs/api-referencia.md).

---

## 📚 Documentación

| Documento | Contenido |
| :--- | :--- |
| [`docs/README.md`](./docs/README.md) | Índice de documentación |
| [`docs/requisitos-funcionales.md`](./docs/requisitos-funcionales.md) | Requisitos funcionales y no funcionales, historias de usuario, criterios de aceptación |
| [`docs/guia-usuario.md`](./docs/guia-usuario.md) | Manual del jugador: instalación, controles, HUD, tienda, consejos, FAQ, solución de problemas |
| [`docs/guia-desarrollador.md`](./docs/guia-desarrollador.md) | Setup, arquitectura, cómo extender (nuevo enemigo / mejora / idioma / tema) |
| [`docs/api-referencia.md`](./docs/api-referencia.md) | Módulos, exports, hooks, claves CONFIG, claves de storage, claves de traducción |
| [`docs/sistemas-juego.md`](./docs/sistemas-juego.md) | Sistemas: oleadas, IA, economía, fases del jefe, temas, audio, puntuación |
| [`docs/problemas-conocidos.md`](./docs/problemas-conocidos.md) | Problemas conocidos y deuda técnica (documentados, no corregidos a propósito) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historial de versiones al estilo Keep a Changelog |

---

## ⚠️ Estado del proyecto

El juego es **jugable de principio a fin** y compila limpio (`npm run build` ✅). Antes de publicar en producción, revisa los [problemas conocidos](./docs/problemas-conocidos.md); lo esencial:

- La mejora **Imán de Créditos** se guarda pero **no tiene efecto** en el juego (no existen monedas que recoger: los créditos se acreditan al instante).
- `tsc -b` solo revisa tipos de `src/` (plantilla Vite residual), **no** del código real del juego.
- Bundle único de **3.6 MB (1.22 MB gzip)** — todavía sin code splitting.
- El título de `index.html` sigue siendo `vite-project`.

---

## 📦 Avisos de terceros

Las dependencias de código abierto y sus licencias están listadas en [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

*Buena suerte, Operativo. Asciende por el núcleo y pacifica los enjambres rebeldes.* 🌌
