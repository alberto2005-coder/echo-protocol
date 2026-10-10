# 03 · Guía de Desarrollador — ECHO PROTOCOL

**Para:** equipo técnico · **Idioma:** Español · Índice: [`docs/README.md`](./README.md)
Compañeros: [Referencia de API](./api-referencia.md) · [Sistemas de juego](./sistemas-juego.md) · [Problemas conocidos](./problemas-conocidos.md)

---

## 1. Entorno de desarrollo

### 1.1 Requisitos

| Herramienta | Versión verificada | Notas |
| :--- | :--- | :--- |
| Node.js | **24.14.0** (mín. 20.19) | Vite 8 exige Node 20.19+ o 22.12+ |
| npm | **11.9.0** (≥ 9) | No hay `packageManager` fijado |
| Git | cualquiera | El repositorio actual no trae `.git` |
| Editor | VS Code / Cursor | Recomendado: extensión ESLint/oxlint + Vue/React DX |

`package.json` **no declara** `engines`; si quieres blindarlo:

```json
"engines": { "node": ">=20.19.0" }
```

### 1.2 Puesta en marcha

```bash
npm install        # instala ~1.1 GB (node_modules incluido en esta copia)
npm run dev        # http://localhost:5173 con HMR
npm run build      # tsc -b && vite build → dist/
npm run preview    # sirve dist/
npm run lint       # oxlint
```

### 1.3 Herramientas de la caja

| Archivo | Función |
| :--- | :--- |
| `vite.config.ts` | Solo plugin React (sin aliases ni base path) |
| `tsconfig.json` | Project references → `tsconfig.app.json` + `tsconfig.node.json` |
| `tsconfig.app.json` | `strict`-ish (sin `strict: true`), **`include: ["src"]`** ⚠️ |
| `.oxlintrc.json` | Plugins `react`, `typescript`, `oxc`; `react/rules-of-hooks` = error |
| `tailwind.config.js` | Content: `index.html`, `src/`, `components/`, `utils/`, raíz |
| `postcss.config.js` | Tailwind + autoprefixer |
| `playground_config.json` | Esquema de parámetros expuesto al host de Playground |

> ⚠️ **Importante:** `tsc -b` solo comprueba `src/` (una plantilla Vite heredada) y `vite.config.ts`. El código real del juego (raíz: `App.tsx`, `Game.tsx`, …) **no está siendo type-checkeado**. Ver `BUG-002` en [problemas conocidos](./problemas-conocidos.md).

---

## 2. Estructura del repositorio

```
/
├── index.html              # HTML de entrada (título aún: "vite-project")
├── index.tsx               # createRoot → <App/>
├── App.tsx                 # 1.553 líneas · shell de UI, HUD, tienda, ajustes, persistencia
├── Game.tsx                # 1.941 líneas · escena 3D + bucle de juego + IA
├── input.ts                # useInput(): teclado/puntero/táctil → InputSnapshot
├── constants.ts            # CONFIG (esquema ajustable) + overrides + música
├── translations.ts          # TRANSLATIONS.en / .es
├── types.ts                # DroneEntity, BulletEntity, SectorTheme, …
├── utils.ts                # math + re-export de utils/helper
├── components/
│   ├── FPSWeapon.tsx       # modelo del arma en primera persona (en uso)
│   ├── HumanoidCharacter.tsx  # ⚠️ no usado
│   └── AnimalCharacter.tsx    # ⚠️ no usado
├── utils/
│   ├── helper.tsx          # Overlay, MenuOverlay, GameAudio, GameState, useIsMobile
│   ├── BackgroundMusic.tsx # <audio> en loop
│   ├── usePlayground.ts    # usePlayground, usePlaygroundGameLifecycle, useRpc
│   └── playground-fake.ts  # FakePlaygroundSDK (sandbox, sin red)
├── src/                    # ⚠️ plantilla Vite residual (NO la usa index.html)
├── design/game_design_document.json  # ⚠️ GDD de otra variante del juego
├── public/                 # favicon.svg, icons.svg
├── docs/                   # esta documentación
├── playground_config.json
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
| 9 | Sync | `setDronesList([...])`, `setBulletsList([...])`, `setFloatingList([...])` |

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

`playground_config.json` declara ese mismo esquema para la UI del Playground (salud, velocidad, daño, PV de drones, bono de piso, intensidad de luz, volumen). **Nota:** varios valores (p. ej. `baseDroneHealth`) se declaran pero el código usa sus propias fórmulas (`22 + piso×8`); revisa [`sistemas-juego.md`](./sistemas-juego.md) antes de asumir que un slider afecta.

### 5.7 Añadir una pantalla / overlay

1. Crea el estado booleano en `App.tsx` (`const [isXOpen, setIsXOpen] = useState(false)`).
2. Renderiza condicionalmente con `<MenuOverlay tone="neutral" zIndex={55}>…</MenuOverlay>`.
3. Añade el botón de acceso en menú principal o pausa.
4. Recuerda cerrarlo en `returnToMainMenu()` para no dejar estados huérfanos.

### 5.8 Añadir entrada (teclas / botones)

- Escritorio: mapea la tecla en `input.ts → ACTION_KEYS` y consume la acción en el bucle (`actions.jump`, …).
- Móvil: en `App.tsx` (bloque *Persistent Mobile Controls*), despacha un evento sintético:
  ```tsx
  onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'}))}
  onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift'}))}
  ```

---

## 6. Flujo de trabajo de calidad

```bash
npm run lint      # 1. análisis estático (0 errores)
npm run build     # 2. type-check + bundle
npm run preview   # 3. prueba manual sobre el build
```

**Checklist QA manual (≈10 min)**

1. Borrar datos del sitio → aparece onboarding completo (EN y ES).
2. Jugar piso 1 → 3 drones, avisos tutoriales, créditos suben.
3. Limpiar piso → fanfarria + elevador encendido → Armería.
4. Comprar 2 mejoras → refrescar página → siguen ahí.
5. Subir al piso 3 y 4 → aparecen Kamikaze y Francotirador.
6. Alcanzar el piso 5 → barra del jefe + invocaciones + recompensa 250 CR.
7. Morir → pantalla de derrota con stats → Reintentar.
8. `Escape` → pausa → Ajustes → cambiar idioma y volumen.
9. Probar en móvil/emulador: D-pad, FIRE, JUMP, ARMORY.
10. Comprobar consola sin errores rojos.

---

## 7. Rendimiento

**Medido en build de producción (2026-10-10):**

| Métrica | Valor |
| :--- | :--- |
| JS principal | 3,618.87 kB (**1,219.95 kB gzip**) |
| CSS | 27.73 kB (5.51 kB gzip) |
| Tiempo de build | 1.52 s |
| Advertencia | `chunks > 500 kB` de Vite |

**Técnicas ya aplicadas**

- Vectores/Euler preasignados a nivel de módulo (sin allocations por frame).
- `dt` acotado a 0.05 s.
- `dpr` limitado a `[1, 2]` y sombras 2048².
- Bloom con umbral alto (0.8) para no inundar la GPU.
- Estado de frame en refs.

**Oportunidades abiertas** (detalle en [problemas conocidos](./problemas-conocidos.md))

- `setDronesList([...])` / `setBulletsList([...])` cada frame fuerza un re-render de `Scene` → mover a `useState` solo cuando cambia el número de entidades o usar `useSyncExternalStore`.
- Code splitting de `three`/drei/rapier (`manualChunks`) para bajar el JS inicial.
- Memoria de pools para balas y textos flotantes.

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
- `useRpc('ExitChat')` — `postMessage` hacia `window.parent` con `messageId` y promesa.

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
- Al crear una release: mover lo de `[Unreleased]` a una sección con fecha y actualizar `package.json → version` (hoy `0.0.0`).

---

## 12. Preguntas frecuentes de desarrollo

**¿Por qué no usamos Zustand/Redux?**
Porque el bucle corre a 60 Hz: cualquier store de React provocaría re-renders masivos. El estado vivo está en refs y React solo consume copias de dibujo.

**¿Por qué `Game` recibe `setGameState`?**
Para que el simulador pueda bajar PV del jugador o marcar `GAME_OVER` sin crear un canal de eventos paralelo. El resto de la progresión pasa por callbacks.

**¿Cómo funcionan los overlays dentro del Canvas?**
No están dentro: HUD y menús son hermanos del `<Canvas>` en `App.tsx`. `drei/Html` solo se usa para etiquetas puntuales de escena.

**¿Por qué hay una carpeta `src/` que no se usa?**
Es la plantilla inicial de Vite. `index.html` carga `/index.tsx` de la raíz. Puede eliminarse; antes hay que corregir `tsconfig.app.json` (ver `BUG-002`).

**¿Dónde está el GDD?**
`design/game_design_document.json`, pero describe una variante *third-person cover shooter* distinta del juego implementado: úsalo como referencia histórica, no como especificación vigente.
