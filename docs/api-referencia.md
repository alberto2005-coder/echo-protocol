# 04 · Referencia de API — ECHO PROTOCOL

**Para:** equipo técnico · **Idioma:** Español · Índice: [`docs/README.md`](./README.md)
Compañero: [Guía de desarrollador](./guia-desarrollador.md)

> Fuente de verdad: el código. Este documento refleja los exports públicos de cada módulo en la fecha de verificación (2026-10-10).

---

## 1. Mapa de módulos

| Módulo | Exporta | Consumido por |
| :--- | :--- | :--- |
| `index.tsx` | — (efecto: monta el root) | `index.html` |
| `App.tsx` | `default App` | `index.tsx` |
| `Game.tsx` | `Game`, `Scene`(interno) | `App.tsx` (con `React.lazy`, chunk propio) |
| `themes.ts` | `SECTOR_THEMES`, `getThemeForFloor` | `Game.tsx` |
| `arena.ts` | `ARENA_WIDTH`, `ARENA_DEPTH`, `ARENA_OBSTACLES`, `ArenaObstacle` | `Game.tsx`, `waves.ts` |
| `waves.ts` | `createFloorWave(floor, startId)` | `Game.tsx` |
| `input.ts` | `useInput`, `setVirtualAction`, `VIRTUAL_ACTION_EVENT`, `InputAction`, `PointerState`, `InputSnapshot` | `Game.tsx`, `App.tsx` |
| `constants.ts` | `CONFIG`, `ConfigKey`, `getConfig` | `App.tsx`, `Game.tsx` |
| `translations.ts` | `TRANSLATIONS` | `App.tsx`, `Game.tsx` |
| `types.ts` | `Vec3`, `Position3D`, `Entity3D`, `Particle`, `DroneType`, `DroneEntity`, `BulletEntity`, `FloatingReward`, `BossHudData`, `SectorTheme`, `Language` | `Game.tsx`, `App.tsx` |
| `utils.ts` | `gameAudio`, `useIsMobile`, `randomRange` | `Game.tsx`, `waves.ts` |
| `utils/helper.tsx` | `MenuOverlay`, `gameAudio`, `useIsMobile`, `GamePhase`, `GameState` | `App.tsx`, `utils.ts` |
| `utils/BackgroundMusic.tsx` | `BackgroundMusic` (default y nombrado), `BackgroundMusicProps` | `App.tsx` |
| `utils/usePlayground.ts` | `usePlayground`, `usePlaygroundGameLifecycle`, `useRpc`, `BaseGameState` | `App.tsx` |
| `utils/playground-fake.ts` | `FakePlaygroundSDK` | `usePlayground` (sandbox) |
| `components/FPSWeapon.tsx` | `FPSWeapon` (`forwardRef<THREE.Group>`) | `Game.tsx` |

---

## 2. `App.tsx` — componente raíz

```tsx
export default function App(): JSX.Element
```

### 2.1 Estado expuesto (selección)

| Estado | Tipo | Persistencia |
| :--- | :--- | :--- |
| `gameState` | `GameState` | no |
| `persistentCoins` | `number` (default **100**) | `echo_protocol_coins_v1` |
| `persistentUpgrades` | `{maxHealth, weaponDamage, fireRate, speed}` | `echo_protocol_upgrades_v1` |
| `language` | `'en' \| 'es'` | `echo_protocol_lang_v1` |
| `bestFloor` | `number` (min. 1) | `echo_protocol_best_floor_v1` |
| `isFirstTimeUser` | `boolean` | `echo_protocol_tutorial_completed_v1` |
| `musicVolume` / `sfxVolume` / `isAudioMuted` | `number`/`number`/`boolean` | `echo_protocol_audio_v1` |
| `bossData` | `BossHudData \| null` | no |

**Defaults de mejora:** `maxHealth 100` · `weaponDamage 25` · `fireRate 3.5` · `speed 8.5`.
**Defaults de audio:** `musicVolume 0.35` (ajustable con `CONFIG.defaultMusicVolume`) · `sfxVolume 0.6` · `isMuted false`.

### 2.2 Funciones principales

| Función | Efecto |
| :--- | :--- |
| `initGame()` | reinicia la partida desde el piso 1, `gameKey++` (remonta `<Game/>`) y `sdk.startGame()` |
| `returnToMainMenu()` | limpia HUD/toasts/jefe/menús y vuelve a `START` |
| `handleEnemyKilled(coins)` | `+score 150×piso`, `dronesLeft--`, `+créditos` |
| `handleFloorCompleted(bonus)` | toast + `elevatorReady` + `score += bono×5 + (600\|2000)` |
| `handleAscendFloor()` | `floor+1`, `score += 1000×piso`, comprueba récord |
| `handleBuyUpgrade(type, cost)` | valida saldo y aplica la mejora (ver §6) |
| `triggerHitMarker()` | retícula roja 120 ms |
| `addCoins(amount, toast?)` | suma saldo y muestra toast opcional 2.5 s |
| `completeOnboarding()` / `replayOnboarding()` | marca/repite el tutorial |

---

## 3. `Game.tsx`

### 3.1 `<Game />`

```tsx
export function Game(props: {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  gameStateRef: React.MutableRefObject<GameState>;
  onOpenShop: () => void;
  onHitDrone: () => void;
  onEnemyKilled: (coinsEarned: number, x: number, y: number, z: number) => void;
  onFloorCompleted: (bonus: number) => void;
  onBossUpdate: (boss: BossHudData | null) => void;
  language: Language;
}): JSX.Element
```

Monta `<Canvas>` (sombras, `dpr [1,2]`, FOV desde `CONFIG.fov`, ACES tone mapping 1.15) → `<Physics gravity={[0, −15, 0]}>` → `<Scene/>` → `<EffectComposer><Bloom/></EffectComposer>`.

### 3.2 Constantes de juego (módulos propios)

Las paletas y la geometría de la arena viven fuera de `Game.tsx` (para poder testearlas sin WebGL):

| Módulo | Export | Descripción |
| :--- | :--- | :--- |
| `themes.ts` | `SECTOR_THEMES: SectorTheme[]` | 7 paletas neón (Outrun, Solar Flare, Abyss, Vapor, Toxic, Matrix, Blood) |
| `themes.ts` | `getThemeForFloor(floor): SectorTheme` | `(max(1,piso) − 1) % 7` |
| `arena.ts` | `ARENA_WIDTH` / `ARENA_DEPTH` | `50` / `60` |
| `arena.ts` | `ARENA_OBSTACLES: ArenaObstacle[]` | 8 columnas de cobertura y 2 plataformas de salto |
| `arena.ts` | `interface ArenaObstacle` | `{id, x, y, z, width, depth, height, color?, stripType, type?: 'wall'\|'jumppad'}` |
| `waves.ts` | `createFloorWave(floor, startId): {drones, boss, nextId}` | composición de la oleada (recuento, PV, tipos, jefe) |

> `waves.ts` aísla la fórmula de oleadas para que `tests/waves.test.ts` congele el balanceo actual.

### 3.3 Constantes internas relevantes

| Constante | Valor |
| :--- | :--- |
| `ARENA_WIDTH` / `ARENA_DEPTH` | 50 / 60 |
| `RAIN_COUNT` | 160 partículas |
| Sensibilidad de cámara | `0.0022` |
| Clamp de pitch | `±1.35 rad` |
| FOV | 65 → 45 en ADS |
| Velocidad de bala (jugador) | 54 m/s, vida 2.2 s |
| Impulso de salto / dash | 7.5 / ×2.5 durante 0.28 s (recarga 1.2 s) |
| Gravedad | −15 (`CONFIG.gravity`) |
| Elevador | `(0, −25)`, radio de activación 4 m |

---

## 4. `input.ts`

```ts
export function useInput(
  containerRef: RefObject<HTMLDivElement | null>,
  options?: {enabled?: boolean},
): MutableRefObject<InputSnapshot>

/** Publica una acción desde la UI externa (botones táctiles DASH/ADS). */
export function setVirtualAction(action: InputAction, pressed: boolean): void
```

`setVirtualAction` despacha un `CustomEvent` (`VIRTUAL_ACTION_EVENT`, `echo-protocol:virtual-action`) que `useInput` vuelca al snapshot. Existe porque los botones táctiles viven en `App.tsx`, fuera del `<div>` de `Game.tsx` donde se escuchan los eventos `pointerdown`.

### 4.1 Acciones

```ts
type InputAction =
  | 'left' | 'right' | 'up' | 'down'
  | 'confirm' | 'cancel' | 'aim' | 'dash'
  | 'jump';
```

| Acción | Tecla(s) | ¿Se consume en el bucle? |
| :--- | :--- | :--- |
| `left/right/up/down` | `A/D/W/S`, Flechas | ✅ movimiento |
| `confirm` | Clic izq., `Enter` | ✅ disparo (también FIRE móvil) |
| `aim` | Clic der., botón ADS móvil | ✅ ADS |
| `jump` | `Espacio` | ✅ salto |
| `dash` | `Shift`, botón DASH móvil | ✅ dash |
| `cancel` | `Escape` | ✅ (menú, en `App.tsx`) |

> Las acciones heredadas sin consumir (`reload`, `interact`, `tap`) fueron retiradas.

### 4.2 `PointerState`

```ts
{ nx, ny, clientX, clientY, movementX, movementY, down, rightDown, isLocked }
```
`movementX/Y` son **acumulados** y se ponen a 0 tras cada frame (consumo en el paso 1 del bucle). Hay *fallback* de arrastre si no hay pointer lock y soporte táctil (solo la mitad derecha, factor ×1.5).

---

## 5. `constants.ts`

```ts
CONFIG: Record<ConfigKey, {value, type: 'number'|'string'|'color', label, group, min?, max?, step?}>
getConfig<K extends ConfigKey>(key: K): typeof CONFIG[K]['value']
```

### 5.1 Claves de `CONFIG`

Solo existen parámetros que el juego lee realmente (toda la configuración muerta fue retirada):

| Grupo | Clave | Default | ¿Se usa? |
| :--- | :--- | :---: | :--: |
| Rules | `floorCompletionBonus` | 120 | ✅ bono de piso (`25×piso` se suma encima) |
| Camera | `fov` | 65 | ✅ FOV base (45 en ADS) |
| Visuals | `ambientIntensity` | 1.8 | ✅ luz ambiental |
| Visuals | `sunIntensity` | 3.5 | ✅ luz direccional |
| Visuals | `hemiIntensity` | 0.8 | ✅ luz hemisférica |
| Physics | `gravity` | −15 | ✅ `Physics gravity` + balísticas |
| Audio | `defaultMusicVolume` | 0.35 | ✅ volumen inicial de música en `App` |
| Audio | `backgroundMusicUrl` | grid_runner.mp3 | ✅ pista en `BackgroundMusic` |

**Override desde el host:** `globalThis.playgroundConfig = {clave: valor}` al cargar (aplicado a nivel de módulo). El esquema público está en `playground_config.json` y `tests/config.test.ts` garantiza que esquema y `CONFIG` coinciden.

---

## 6. `translations.ts`

```ts
TRANSLATIONS: { en: Record<string,string>, es: Record<string,string> }
```

105 claves idénticas en ambos idiomas (paridad verificada). Bloques principales:

| Bloque | Ejemplos |
| :--- | :--- |
| Navegación | `gameTitle`, `play`, `shop`, `settings`, `guide`, `resume`, `restartFloor1`, `abortToTitle`, `mainMenu`, `playAgain` |
| HUD | `armorIntegrity`, `credits`, `coins`, `hostiles`, `score`, `sectorFloor`, `bossFloor`, `highestFloor`, `bestFloor` |
| Partida | `sectorSecured`, `bossDefeated`, `armorCompromised`, `newRecordBanner`, `reachedFloor`, `totalScore`, `totalCredits`, `redeploy`, `earnedPopup` |
| Jefe / alertas | `bossEncounter`, `bossHealth`, `kamikazeAlert`, `sniperAlert`, `tankAlert` |
| Mejoras | `armorRepair(+Desc)`, `platingBoost(+Desc)`, `plasmaCore(+Desc)`, `overclockSights(+Desc)`, `kineticThrusters(+Desc)` |
| Ajustes | `settingsTitle`, `language`, `musicVolume`, `sfxVolume`, `audioMuted`, `closeSettings`, `replayTutorial` |
| Onboarding | `chooseLanguageTitle`, `slide1..3Title/Desc`, `ctrl*Title/Desc`, `obj1..3*`, `next`, `back`, `skip`, `startDeploy` |
| Guía | `guideTitle`, `guide1..4`, `desktopControls`, `tutorialMove/Aim/Shoot/Jump`, `backToMission` |
| Tienda | `elevatorTerminal`, `shopSubtitle`, `availableCredits`, `ascendToFloor`, `closeShop` |

> No existe un tipo TypeScript que garantice paridad EN/ES; añade claves en ambos y revisa manualmente.

---

## 7. Tipos de `types.ts`

```ts
type DroneType = 'scout' | 'kamikaze' | 'tank' | 'sniper' | 'boss';

interface DroneEntity {
  id, x, y, z, rotY, vx, vz, health, maxHealth, type, cooldown, speed,
  sniperAimTimer?, isSniperAiming?, kamikazeChargeTimer?, kamikazeBeepTick?,
  bossPhase?, bossAttackPattern?, bossAttackTimer?, bossName?,
  shieldActive?, flashTimer?
}

interface BulletEntity {
  id, x, y, z, vx, vy, vz, damage, fromPlayer, life,
  color?, radius?, isRailgun?, isBossRadial?
}

interface FloatingReward { id, x, y, z, text, life, maxLife, color? }
interface BossHudData  { name, health, maxHealth, floor }

interface SectorTheme {
  id, name, primaryNeon, secondaryNeon, accentGlow, fogColor,
  ambientLight, sunLight, hemiSky, hemiGround, gridColor,
  droneOptics, droneJetColor, droneHealthBarColor, bulletTrailColor
}

type Language = 'en' | 'es';
```

---

## 8. `utils/helper.tsx`

### 8.1 Componentes de UI

```tsx
<MenuOverlay tone? zIndex? >{children}</MenuOverlay>
```
`tone`: `'neutral' | 'danger' | 'victory'`.

### 8.2 `gameAudio` (singleton `GameAudio`)

```ts
gameAudio: {
  playArcadeLaser, playChiptuneExplosion, playCoinPickup, playPowerupChime,
  playLevelUpStinger, playVictoryFanfare, playDefeatMotif, playCrispClick,
  playConfirmSelect, playRetroJump, playShieldBlock, playMeleePunch,
  playErrorBuzz, playGunshotBlast, playHoverMicroTone,
  setVolume(v), toggleMute(), setMuted(b), getMuteState(), resume()
}
```

- Todo sintetizado con `OscillatorNode` + `BiquadFilter` + `AudioBufferSource` (ruido).
- `begin()` devuelve `null` si está silenciado → respetan el mute.
- Se desbloquea con el primer `pointerdown/keydown/touchstart`.
- Escucha el evento global `playground-mute`.

### 8.3 Tipos y utilidades

```ts
type GamePhase = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY' | 'LEVEL_COMPLETE';
interface GameState {
  status: GamePhase; score; level; health; maxHealth; coins;
  weaponDamage; fireRate; speed; floor; dronesLeft;
  elevatorReady: boolean; isShopOpen: boolean; [key: string]: any;
}
useIsMobile(): boolean
```
> `VICTORY` y `LEVEL_COMPLETE` están declarados pero el juego nunca los emite hoy.
> Los helpers muertos (`Overlay`, `useAutoFocus`, `clamp`, `formatTime`, `MusicTrack`) fueron retirados.

---

## 9. `utils/usePlayground.ts`

```ts
usePlayground(): { sdk, isReady, onGameEventRef, onPresenceEventRef, onLobbyStatusRef }
usePlaygroundGameLifecycle(gameState: {status, score, level?}, sdk?): void
useRpc<Req, Res>(rpcName: string): [(payload: Req) => Promise<Res>, boolean]
```

- `usePlayground()` carga el SDK remoto solo si `isSandboxPreview = false` (hoy está en `true` → usa `FakePlaygroundSDK`).
- `FakePlaygroundSDK`: `init`, `startGame`, `scoreUpdated`, `levelComplete`, `gameOver`, `pauseStateChanged`, `showLeaderboard` (stub) y emite `{type:'PREVIEW_READY'}` a `window.parent`.
- `useRpc` → `window.parent.postMessage({type, payload, messageId}, '*')` con promesa correlacionada.

---

## 10. Almacenamiento (`localStorage`)

| Clave | Tipo | Contenido | Default |
| :--- | :--- | :---: | :---: |
| `echo_protocol_coins_v1` | `string` (int) | saldo de créditos | `100` |
| `echo_protocol_upgrades_v1` | JSON | `{maxHealth, weaponDamage, fireRate, speed}` | `{100,25,3.5,8.5}` |
| `echo_protocol_lang_v1` | `'en'\|'es'` | idioma | `en` |
| `echo_protocol_tutorial_completed_v1` | `'true'` | tutorial visto | ausente = nuevo |
| `echo_protocol_best_floor_v1` | `string` (int) | mejor piso | `1` |
| `echo_protocol_audio_v1` | JSON | `{musicVolume, sfxVolume, isMuted}` | `{0.35, 0.6, false}` |

Todas las lecturas/escrituras van en `try/catch`.

---

## 11. Eventos globales

| Evento / API | Dirección | Descripción |
| :--- | :---: | :--- |
| `playground-mute` (CustomEvent `{muted}`) | window → `GameAudio` | silencia los SFX |
| `echo-protocol:virtual-action` (CustomEvent `{action, pressed}`) | `setVirtualAction` → `useInput` | botones táctiles DASH/ADS |
| `message` (`RpcResponse`) | parent → `useRpc` | responde a RPC pendientes |
| `PREVIEW_READY` | app → parent | sandbox listo |
| `document.pointerlockchange` | doc → `input.ts` | actualiza `pointer.isLocked` |
| `KeyboardEvent` sintéticos | app → window | botones táctiles que simulan teclado (movimiento, salto, disparo) |

---

## 12. Orden de render de `App.tsx`

1. `<BackgroundMusic/>` (siempre)
2. `<header>` HUD — solo `PLAYING`
3. Toast de recompensa
4. `<Game/>` + barra del jefe + retícula + avisos de piso 1 + hint de escritorio
5. Controles táctiles — `PLAYING && isMobile && !isShopOpen`
6. Menú principal — `START`
7. Armería — `isMainMenuShopOpen || gameState.isShopOpen`
8. Ajustes — `isSettingsOpen`
9. Game over — `GAME_OVER`
10. Pausa — `isGameMenuOpen`
11. Cómo jugar — `isHowToPlayOpen`
12. Onboarding — `isOnboardingOpen` (`z` superior a todo)
