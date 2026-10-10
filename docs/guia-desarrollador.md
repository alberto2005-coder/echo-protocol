# 03 · Guía de Desarrollador — ECHO PROTOCOL

**Para:** equipo técnico · **Idioma:** Español · Índice: [`docs/README.md`](./README.md)
Compañeros: [Referencia de API](./api-referencia.md) · [Sistemas de juego](./sistemas-juego.md)

---

## 1. Entorno de desarrollo

### 1.1 Requisitos

| Herramienta | Versión verificada | Notas |
| :--- | :--- | :--- |
| Node.js | **24.14.0** (mín. 20.19) | Vite 8 exige Node 20.19+ o 22.12+ |
| npm | **11.9.0** (≥ 9) | No hay `packageManager` fijado |
| Git | cualquiera | Repositorio en rama `master` |
| Editor | VS Code / Cursor | Recomendado: extensión ESLint/oxlint + Vue/React DX |

`package.json` **no declara** `engines`; si quieres blindarlo:

```json
"engines": { "node": ">=20.19.0" }
```

### 1.2 Puesta en marcha

```bash
npm install        # instala ~1.1 GB (node_modules incluido en esta copia)
npm run dev        # http://localhost:5173 con HMR
npm run lint       # oxlint
npm test           # vitest run (jsdom)
npm run build      # tsc -b && vite build → dist/
npm run preview    # sirve dist/
```

### 1.3 Herramientas de la caja

| Archivo | Función |
| :--- | :--- |
| `vite.config.ts` | Plugin React + reparto de chunks (ver §7) |
| `tsconfig.json` | Project references → `tsconfig.app.json` + `tsconfig.node.json` |
| `tsconfig.app.json` | **`strict: true`**; cubre raíz, `components/`, `utils/` y `tests/` |
| `tsconfig.node.json` | `strict: true`; cubre `vite.config.ts` |
| `.oxlintrc.json` | Plugins `react`, `typescript`, `oxc`; `react/rules-of-hooks` = error |
| `tailwind.config.js` | Content: `index.html`, `components/`, `utils/`, raíz |
| `postcss.config.js` | Tailwind + autoprefixer |
| `playground_config.json` | Esquema de parámetros expuesto al host de Playground |
| `.github/workflows/ci.yml` | CI: `lint` → `test` → `build` en cada push/PR |

> ✅ **Type-check completo:** `tsc -b` comprueba el código real del juego (`App.tsx`, `Game.tsx`, `input.ts`, …) en modo estricto. La plantilla Vite heredada (`src/`) fue eliminada.

---

## 2. Estructura del repositorio

```
/
├── index.html              # HTML de entrada (título aún: "vite-project")
├── index.tsx               # createRoot → <App/>
├── App.tsx                 # 1.553 líneas · shell de UI, HUD, tienda, ajustes, persistencia
├── Game.tsx                # 1.941 líneas · escena 3D + bucle de juego + IA (lazy chunk)
├── input.ts                # useInput() + setVirtualAction(): teclado/puntero/táctil → InputSnapshot
├── constants.ts            # CONFIG (solo parámetros con efecto real) + overrides
├── translations.ts          # TRANSLATIONS.en / .es (103 claves)
├── types.ts                # DroneEntity, BulletEntity, SectorTheme, …
├── themes.ts               # SECTOR_THEMES + getThemeForFloor (testable sin WebGL)
├── arena.ts                # dimensiones y obstáculos de la arena
├── waves.ts                # createFloorWave(): fórmula de oleadas (testable)
├── utils.ts                # math + re-export de utils/helper
├── components/
│   └── FPSWeapon.tsx       # modelo del arma en primera persona
├── utils/
│   ├── helper.tsx          # MenuOverlay, GameAudio, GameState, useIsMobile
│   ├── BackgroundMusic.tsx # <audio> en loop (degrada a silencio si falla)
│   ├── usePlayground.ts    # usePlayground, usePlaygroundGameLifecycle, useRpc
│   └── playground-fake.ts  # FakePlaygroundSDK (sandbox, sin red)
├── tests/                  # vitest: 67 tests de comportamiento
├── design/game_design_document.legacy.json  # GDD de otra variante (histórico)
├── public/                 # favicon.svg, icons.svg
├── docs/                   # esta documentación
├── playground_config.json
├── LICENSE
├── THIRD_PARTY_NOTICES.md
└── CHANGELOG.md
```

---

## 3. Arquitectura

### 3.1 Separación de responsabilidades

```
┌──────────────────────── App.tsx (React DOM) ────────────────────────┐
│ Menú · Onboarding · Ajustes · Armería · HUD · Pausa · Game over      │
│ Estado React: gameState, persistentCoins, persistentUpgrades, i18n   │
│ localStorage: coins / upgrades / lang / tutorial / best_floor        │
└───────────────▲──────────────────────────────┬───────────────────────┘
                │ callbacks                    │ props
                │ (onEnemyKilled, …)           ▼ (gameState, setGameState)
┌───────────────┴──────────────────────────────────────────────────────┐
│ Game.tsx (React Three Fiber)                                        │
│  <Canvas> → <Physics> → <Scene>                                     │
│  useFrame(60 Hz): look → move → shoot → IA → balas → colisiones     │
│  Datos por frame en refs; snapshots de dibujo en useState           │
└──────────────────────────────────────────────────────────────────────┘
```

**Regla de oro:** el simulador (refs) es la fuente de verdad durante la partida; React state es solo el *vista* que consumen HUD y overlays.

### 3.2 Contrato de callbacks

`Game` nunca “decide” sobre la progresión: notifica y deja que `App` decida.

| Callback | Cuándo se emite | Qué hace `App` |
| :--- | :--- | :--- |
| `onHitDrone()` | una bala del jugador impacta | `triggerHitMarker()` → retícula roja 120 ms |
| `onEnemyKilled(coins, x, y, z)` | un dron muere | suma créditos, `score += 150×piso`, `dronesLeft--` |
| `onFloorCompleted(bonus)` | mueren todos los drones | bono de créditos, `elevatorReady = true`, suma score |
| `onOpenShop()` | jugador a <4 m del elevador con piso limpio | `isShopOpen = true` + stinger |
| `onBossUpdate(boss\|null)` | cada frame con jefe vivo / al morir | actualiza/clear la barra del jefe |

### 3.3 El bucle `useFrame` (paso a paso)

Ubicación: `Game.tsx` → `Scene`.

| # | Bloque | Detalle clave |
| :-: | :--- | :--- |
| 0 | Lerps de color | interpola luces, neones y niebla hacia el tema del piso (`lerpSpeed = 3.5×dt`) |
| — | *early return* | si `status !== 'PLAYING'` o `isShopOpen`, solo se anima ambiente |
| 1 | Look | `yaw/pitch` desde `pointer.movement*`, sensibilidad `0.0022`, clamp pitch `±1.35` |
| 2 | Cooldowns | dash, salto, disparo, recoil (`−6×dt`), fogonazo |
| 3 | Movimiento | vector relativo al yaw, dash ×2.5, ADS ×0.6, gravedad, colisiones AABB, límites de arena |
| 4 | Disparo | `intervalo = 1/fireRate`, bala a 54 m/s, vida 2.2 s |
| 5 | IA de drones | 5 arquetipos + evitación de obstáculos + flanqueo |
| — | HUD de jefe | `onBossUpdate` por frame |
| — | ¿Piso limpio? | `dronesAlive === 0` → `waveCleared` + `onFloorCompleted(bonus)` |
| 6 | Balles | integra posición, colisiona con obstáculos, drones (con escudo frontal del Tanque) y jugador |
| 7 | Textos flotantes | suben 1.5 m/s y expiran |
| 8 | Elevador | distancia < 4 m con `elevatorReady` → `onOpenShop()` |
| 9 | Sync | `setDronesList([...])`, `setBulletsList([...])`, `setFloatingList([...])` **solo si `status === 'PLAYING'`** |

`dt` se recorta a **0.05 s** para que una caída de FPS no provoque tunneling.

### 3.4 Modelo de colisiones

- **Jugador vs mundo:** AABB con radio 0.6, resuelto en 2 iteraciones de separación por eje; suelo en `y = 1.7`; límites de arena con margen 0.5 + radio.
- **Balas vs mundo:** caja expandida 0.15 alrededor de cada `ARENA_OBSTACLES` (mata la bala + `playShieldBlock()`).
- **Balas vs drones:** distancia 3D ≤ radio por tipo (boss 3.0, tank 1.5, kamikaze 0.75, resto 0.95).
- **Escudo del Tanque:** `|Δángulo| < 1.25 rad` respecto a `rotY` → deflexión sin daño.
- **Balas vs jugador:** distancia horizontal < 0.75 + comprobación vertical pies–cabeza; **ignorado si `dashTimer > 0`**.
- **Rapier** se usa para el suelo, muros perimetrales y obstáculos estáticos (`RigidBody type="fixed" cuboid`), no para la entidad del jugador (es un controlador cinemático manual).

---

## 4. Convenciones

| Tema | Convención |
| :--- | :--- |
| Idioma de comentarios | Inglés en el código fuente, español en la documentación |
| Estado de frame | `useRef` (`player.current`, `dronesRef`, `bulletsRef`) |
| Estado de UI | `useState` en `App.tsx` |
| Estilos | Tailwind utility classes; sin CSS modules; `index.css` solo lleva utilidades globales |
| Tipos | Interfaces en `types.ts` para entidades; `GameState` en `utils/helper.tsx` |
| I18n | **Nunca** hardcodear texto visible: usar `TRANSLATIONS[language]` y añadir la clave en `en` **y** `es` |
| Assets | Cero assets de audio/imagen procedural: SFX por Web Audio, modelos por primitivas Three.js |
| Lint | `npm run lint` debe quedar en **0 errores** antes de mergear |

---

## 5. Recetas (“how-to”)

### 5.1 Añadir un nuevo tipo de enemigo

1. **Tipo** — añade el literal en `types.ts`:
   ```ts
   export type DroneType = 'scout' | 'kamikaze' | 'tank' | 'sniper' | 'boss' | 'healer';
   ```
2. **Spawn** — en `Game.tsx → initFloor()`, asigna `type` según el piso y define `hp`, `speed`, `cd`:
   ```ts
   } else if (type === 'healer') {
     hp = baseHp * 1.4;
     speed = 1.9;
     cd = 3.0;
   }
   ```
3. **IA** — añade una rama en el bloque `// === ARCHETYPE BEHAVIORS ===` (mueve `moveDirX/Z` y emite balas a `bulletsRef`).
4. **Colisión** — ajusta el `hitRadius` del bloque de colisión de balas del jugador.
5. **Recompensa** — suma su crédito en el bloque `instantCoins`.
6. **Render** — añade su malla en el JSX de drones (bloque final de `Game.tsx`).
7. **Avisos** (opcional) — nueva clave en `translations.ts` + alerta en `App.tsx`.
8. **Verifica**: `npm run lint && npm run build`.

### 5.2 Añadir una mejora de la Armería

En `App.tsx`:

1. Estado inicial en `persistentUpgrades` (objeto por defecto) y en `initGame`.
2. Rama en `handleBuyUpgrade`:
   ```ts
   case 'lifesteal':
     updated.lifesteal += 1;   // persistente
     break;
   ```
3. Sincroniza también `setGameState` si el valor afecta a la partida en curso.
4. Tarjeta en la grid de la tienda (`handleBuyUpgrade('lifesteal', 120)`).
5. Claves `lifesteal` / `lifestealDesc` en `translations.ts` (EN + ES).
6. Consumo del valor dentro del bucle de `Game.tsx`.

### 5.3 Añadir una clave de traducción

```ts
// translations.ts
en: { newKey: 'TEXT' },
es: { newKey: 'TEXTO' },
```
Usar con `t.newKey`. Si falta en un idioma, TypeScript no lo detecta hoy (el tipo no está construido) — revisa manualmente que `en` y `es` tengan las mismas claves.

### 5.4 Añadir un tema de sector

En `Game.tsx → SECTOR_THEMES` añade un objeto `SectorTheme` nuevo. El ciclo es `(piso − 1) % SECTOR_THEMES.length`, así que no hay que tocar nada más: la interpolación de colores (lerp) ya suaviza el cambio.

### 5.5 Añadir un efecto de sonido

`utils/helper.tsx → class GameAudio`. Crea el método con `begin()`, `blip()` y/o `noiseBurst()`:

```ts
playNewThing() {
  const b = this.begin();
  if (!b) return;                    // respetar mute
  const v = this.vary();             // variación de tono
  this.blip(b, b.now, {type: 'square', freq: 880 * v, dur: 0.12, gain: 0.12});
}
```
Luego llámalo desde el bucle o desde un handler de UI.

### 5.6 Ajustar el balance sin tocar código

`constants.ts → CONFIG` define un esquema con `value`, `label`, `group`, `min`, `max`, `step`. Al inicio del módulo se aplican los overrides del host:

```ts
const {playgroundConfig} = globalThis;
if (playgroundConfig) { … CONFIG[key].value = value … }
```

`playground_config.json` declara ese mismo esquema para la UI del Playground: `floorCompletionBonus`, `sunIntensity` y `defaultMusicVolume`. **Todos los parámetros del esquema tienen efecto real en el código** (los sliders muertos fueron retirados); `tests/config.test.ts` comprueba que esquema y `CONFIG` siguen sincronizados. Para el resto de valores (salud, daño, PV de drones…) usa [`sistemas-juego.md`](./sistemas-juego.md), que documenta las fórmulas.

### 5.7 Añadir una pantalla / overlay

1. Crea el estado booleano en `App.tsx` (`const [isXOpen, setIsXOpen] = useState(false)`).
2. Renderiza condicionalmente con `<MenuOverlay tone="neutral" zIndex={55}>…</MenuOverlay>`.
3. Añade el botón de acceso en menú principal o pausa.
4. Recuerda cerrarlo en `returnToMainMenu()` para no dejar estados huérfanos.

### 5.8 Añadir entrada (teclas / botones)

- Escritorio: mapea la tecla en `input.ts → ACTION_KEYS` y consume la acción en el bucle (`actions.jump`, …).
- Móvil (teclas que existen como teclado real): en `App.tsx`, despacha un evento sintético:
  ```tsx
  onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: ' '}))}
  onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', {key: ' '}))}
  ```
- Móvil (acciones del juego): usa el puente de acciones, que escribe directamente en el `InputSnapshot`:
  ```tsx
  onPointerDown={() => setVirtualAction('dash', true)}
  onPointerUp={() => setVirtualAction('dash', false)}
  ```
  El botón vive en `App.tsx`, fuera del `<div>` de `Game.tsx` donde `useInput` escucha los `pointerdown`, por eso existe `setVirtualAction` (evento `echo-protocol:virtual-action`).

---

## 6. Flujo de trabajo de calidad

```bash
npm run lint      # 1. análisis estático (0 errores, 0 avisos)
npm test          # 2. vitest → 67 tests (comportamiento congelado)
npm run build     # 3. type-check (strict) + bundle
npm run preview   # 4. prueba manual sobre el build
```

En CI (`.github/workflows/ci.yml`) los tres primeros pasos se ejecutan en cada push a `master`/`main` y en cada PR.

**Checklist QA manual (≈10 min)**

1. Borrar datos del sitio → aparece onboarding completo (EN y ES).
2. Jugar piso 1 → 3 drones, avisos tutoriales, créditos suben.
3. Limpiar piso → fanfarria + elevador encendido → Armería.
4. Comprar 2 mejoras → refrescar página → siguen ahí.
5. Subir al piso 3 y 4 → aparecen Kamikaze y Francotirador.
6. Alcanzar el piso 5 → barra del jefe + invocaciones + recompensa 250 CR.
7. Morir → pantalla de derrota con stats → Reintentar.
8. `Escape` → pausa → Ajustes → cambiar idioma y volumen (recargar y comprobar que persisten).
9. Probar en móvil/emulador: D-pad, FIRE, JUMP, **DASH y ADS**, ARMORY.
10. Comprobar consola sin errores rojos.

### 6.1 Suite de tests

| Fichero | Qué congela |
| :--- | :--- |
| `tests/app.smoke.test.tsx` | arranque, onboarding, navegación de menús, idioma, persistencia |
| `tests/app.shop.test.tsx` | economía de la armería (precios, compras, limitaciones) |
| `tests/app.audio.test.tsx` | ajustes de audio persistidos en `echo_protocol_audio_v1` |
| `tests/input.test.tsx` | teclado/puntero y el puente `setVirtualAction` |
| `tests/translations.test.ts` | paridad EN/ES exacta (103 claves) |
| `tests/waves.test.ts` | fórmula de oleadas (recuento, PV, jefes) |
| `tests/themes.test.ts` | ciclo de temas por piso y paletas |
| `tests/arena.test.ts` | geometría y colisiones de `ARENA_OBSTACLES` |
| `tests/config.test.ts` | `package.json` sin dependencias muertas; esquema ↔ `CONFIG` sincronizados |

> **Regla:** los tests congelan el comportamiento actual. Si cambias balance o UI, actualiza el test en el mismo commit y documenta el porqué en `CHANGELOG.md`.

---

## 7. Rendimiento

**Medido en build de producción (2026-10-10, `vite build`):**

| Métrica | Valor |
| :--- | :--- |
| **Ruta crítica** (menú/onboarding) | `index.js` 79.59 kB + `react-vendor` 218.76 kB + CSS 27.33 kB ≈ **95 kB gzip** |
| Motor 3D (bajo demanda) | `Game` + `three` + `physics` + `postprocessing` ≈ **1.132 kB gzip**, se descarga al pulsar JUGAR |
| CSS | 27.33 kB (5.48 kB gzip) |
| Tiempo de build | < 1 s |

### 7.1 Code splitting

`App.tsx` importa el motor con `lazy(() => import('./Game'))` + `<Suspense>`: el shell de UI no paga por three/drei/rapier. `vite.config.ts` reparte además el grafo en chunks con `rolldownOptions.output.codeSplitting.groups`:

| Chunk | Contenido |
| :--- | :--- |
| `index` | UI, menús, HUD, tienda (crítica) |
| `react-vendor` | react + react-dom + scheduler (crítica) |
| `Game` | `Game.tsx`, `Scene`, el resto de la app 3D |
| `three` | three + three-stdlib |
| `physics` | rapier (`@dimforge/rapier3d-compat`) |
| `postprocessing` | postprocessing + n8ao |

> `chunkSizeWarningLimit: 2500` porque `physics` (842 kB gzip) supera los 500 kB por naturaleza, pero **no está en la ruta crítica**.

**Técnicas ya aplicadas**

- Vectores/Euler preasignados a nivel de módulo (sin allocations por frame).
- `dt` acotado a 0.05 s.
- `dpr` limitado a `[1, 2]` y sombras 2048².
- Bloom con umbral alto (0.8) para no inundar la GPU.
- Estado de frame en refs.
- El vuelco `setDronesList/setBulletsList/setFloatingList` solo ocurre en `PLAYING` (en menú, pausa o derrota nada se mueve).

### 7.2 Deuda restante

- **Re-render por frame durante el combate:** con partida en marcha, las listas se vuelcan cada frame y `Scene` re-renderiza a 60 Hz. La mitigación anterior solo elimina el coste fuera de `PLAYING`. La solución real es **imperativa**: dibujar drones/balas con `instancedMesh` o `useFrame` sobre refs de three, sin pasar por estado de React. Es un refactor de `Scene` con riesgo alto de regresión visual → **pendiente de decidir** con el equipo antes de tocarlo.
- **Pools de balas y textos flotantes:** `bulletsRef`/`floatingsRef` siguen creciendo en cada oleada (se limpian al cambiar de piso).
- **Música remota:** `backgroundMusicUrl` se descarga de la red; `BackgroundMusic` degrada a silencio con `console.warn` si falla, pero no hay reintento ni caché offline.

---

## 8. Depuración

| Objetivo | Técnica |
| :--- | :--- |
| Ver estado del juego | En la consola: `document.querySelector` sobre el árbol React o añade temporalmente `console.log` en el bloque 9 del bucle |
| Congelar un frame | `if (window.__PAUSE__) return;` al inicio de `useFrame` |
| Inspeccionar entidades | `dronesRef.current` vive en el closure de `Scene` |
| Probar pisos altos | Cambia temporalmente `initGame()` → `floor: 5` / `floor: 10` en `App.tsx` |
| Probar saldo | `localStorage.setItem('echo_protocol_coins_v1', '9999')` y recarga |
| Avisos de lint | `npm run lint -- --fix` no aplica reglas `react/*`; revísalas a mano |

---

## 9. Integración con Playground SDK

`utils/usePlayground.ts`:

- `usePlayground()` — carga el SDK; **en sandbox usa `playground-fake.ts`** (`isSandboxPreview = true` está hardcodeado). Para producción real, cambiar a `false` para cargar el script remoto.
- `usePlaygroundGameLifecycle(gameState, sdk)` — traduce `PLAYING/GAME_OVER/PAUSED` a `scoreUpdated`, `gameOver`, `levelComplete` y `pauseStateChanged`.
- `useRpc<Req, Res>(rpcName)` — `postMessage` hacia `window.parent` con `messageId` y promesa correlacionada. Hoy **no tiene consumidores** en la app (la llamada `ExitChat` se eliminó de `App.tsx`); se conserva como parte de la superficie de integración con el SDK.

---

## 10. Despliegue

```bash
npm run build      # genera ./dist
```

Publica `dist/` en cualquier estático (Netlify, Vercel, GitHub Pages, S3…).

- No hay `base` en `vite.config.ts`: si sirves desde un subdirectorio, define `"base": "/mi-ruta/"`.
- `dist/index.html` referencia `/index.tsx` compilado y `/favicon.svg` con ruta absoluta.
- No se requiere backend; el estado vive en `localStorage`.

---

## 11. Changelog y versionado

- Historial en [`../CHANGELOG.md`](../CHANGELOG.md) con formato **Keep a Changelog**.
- Versionado **SemVer**: `MAJOR` (rompe guardado/comportamiento), `MINOR` (nuevas mecánicas), `PATCH` (arreglos).
- Al crear una release: mover lo de `[Unreleased]` a una sección con fecha y actualizar `package.json → version` (hoy `1.0.0`).

---

## 12. Preguntas frecuentes de desarrollo

**¿Por qué no usamos Zustand/Redux?**
Porque el bucle corre a 60 Hz: cualquier store de React provocaría re-renders masivos. El estado vivo está en refs y React solo consume copias de dibujo.

**¿Por qué `Game` recibe `setGameState`?**
Para que el simulador pueda bajar PV del jugador o marcar `GAME_OVER` sin crear un canal de eventos paralelo. El resto de la progresión pasa por callbacks.

**¿Cómo funcionan los overlays dentro del Canvas?**
No están dentro: HUD y menús son hermanos del `<Canvas>` en `App.tsx`. `drei/Html` solo se usa para etiquetas puntuales de escena.

**¿Por qué hay dos README?**
`README.md` está en inglés (público general) y `README.es.md` en español; la documentación de `docs/` está en español. Si cambias comportamiento visible, actualiza ambos.

**¿Dónde está el GDD?**
`design/game_design_document.legacy.json`, pero describe una variante *third-person cover shooter* distinta del juego implementado: úsalo como referencia histórica, no como especificación vigente.
