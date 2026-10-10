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
| `Game.tsx` | `Game`, `Scene`(interno), `SECTOR_THEMES`, `getThemeForFloor`, `ARENA_OBSTACLES`, `ArenaObstacle` | `App.tsx` |
| `input.ts` | `useInput`, `InputAction`, `PointerState`, `InputSnapshot` | `Game.tsx` |
| `constants.ts` | `CONFIG`, `ConfigKey`, `getConfig`, `AVAILABLE_MUSIC_TRACKS` | `App.tsx`, `Game.tsx` |
| `translations.ts` | `TRANSLATIONS` | `App.tsx`, `Game.tsx` |
| `types.ts` | `Vec3`, `Position3D`, `Entity3D`, `Particle`, `DroneType`, `DroneEntity`, `BulletEntity`, `CoinEntity`, `FloatingReward`, `BossHudData`, `SectorTheme`, `Language` | `Game.tsx`, `App.tsx` |
| `utils.ts` | `MenuOverlay`, `Overlay`, `clamp`, `formatTime`, `gameAudio`, `useAutoFocus`, `useIsMobile`, `GamePhase`, `GameState`, `MusicTrack`, `degToRad`, `radToDeg`, `randomRange`, `randomInt`, `toVec3`, `toQuat`, `tempVec3`, `tempVec3B`, `tempQuat`, `tempMatrix`, `tempEuler` | `Game.tsx` |
| `utils/helper.tsx` | `Overlay`, `MenuOverlay`, `useAutoFocus`, `gameAudio`, `clamp`, `formatTime`, `GamePhase`, `GameState`, `MusicTrack`, `useIsMobile`, tipos `InputAction/PointerState/InputSnapshot` | `App.tsx`, `utils.ts` |
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
| `persistentUpgrades` | `{maxHealth, weaponDamage, fireRate, speed, magnetRange}` | `echo_protocol_upgrades_v1` |
| `language` | `'en' \| 'es'` | `echo_protocol_lang_v1` |
| `bestFloor` | `number` (min. 1) | `echo_protocol_best_floor_v1` |
| `isFirstTimeUser` | `boolean` | `echo_protocol_tutorial_completed_v1` |
| `musicVolume` / `sfxVolume` / `isAudioMuted` | `number`/`number`/`boolean` | ❌ no persisten |
| `bossData` | `BossHudData \| null` | no |

**Defaults de mejora:** `maxHealth 100` · `weaponDamage 25` · `fireRate 3.5` · `speed 8.5` · `magnetRange 5.5`.

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
  exitChat: (payload: Record<string, unknown>) => Promise<void>; // ⚠️ sin uso
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

### 3.2 Constantes exportadas

| Export | Descripción |
| :--- | :--- |
| `SECTOR_THEMES: SectorTheme[]` | 7 paletas neón (Outrun, Solar Flare, Abyss, Vapor, Toxic, Matrix, Blood) |
| `getThemeForFloor(floor): SectorTheme` | `(max(1,piso) − 1) % 7` |
| `ARENA_OBSTACLES: ArenaObstacle[]` | 6 columnas (2.8×2.8×6), 2 barricadas (3.6×1.8×3.5) y 2 plataformas de salto (3.5×3.5×0.2) |
| `interface ArenaObstacle` | `{id, x, y, z, width, depth, height, color?, stripType, type?: 'wall'\|'jumppad'}` |

> ⚠️ Exportar constantes junto a componentes rompe React Fast Refresh (`react/only-export-components`, 3 avisos).

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
  containerRef: RefObject<HTMLDivElement>,
  options?: {enabled?: boolean},
): MutableRefObject<InputSnapshot>
```

### 4.1 Acciones

```ts
type InputAction =
  | 'left' | 'right' | 'up' | 'down'
  | 'confirm' | 'cancel' | 'aim' | 'dash'
  | 'jump' | 'reload' | 'interact' | 'tap';
```

| Acción | Tecla(s) | ¿Se consume en el bucle? |
| :--- | :--- | :--- |
| `left/right/up/down` | `A/D/W/S`, Flechas | ✅ movimiento |
| `confirm` | Clic izq., `Enter` | ✅ disparo (también FIRE móvil) |
| `aim` | Clic der. | ✅ ADS |
| `jump` | `Espacio` | ✅ salto |
| `dash` | `Shift` | ✅ dash |
| `cancel` | `Escape` | ✅ (menú, en `App.tsx`) |
| `reload` | `R` | ❌ sin consumir |
| `interact` | `E`, `F` | ❌ sin consumir |
| `tap` | cualquier puntero | ❌ sin consumir |

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

| Grupo | Clave | Default | ¿Se usa? |
| :--- | :--- | :---: | :--: |
| Game | `title` | `'Echo Protocol'` | ❌ |
| Game | `baseCanvasWidth` / `baseCanvasHeight` | 1280 / 720 | ❌ |
| Rules | `playerStartingHealth` | 100 | ❌ (el real es `persistentUpgrades.maxHealth`) |
| Rules | `basePlayerSpeed` | 8.0 | ❌ (el real es 8.5 en `App`) |
| Rules | `baseWeaponDamage` | 25 | ❌ (el real es `persistentUpgrades.weaponDamage`) |
| Rules | `baseDroneHealth` | 40 | ❌ (el real es `22 + piso×8`) |
| Rules | `droneSpeed` | 3.5 | ❌ |
| Rules | `floorCompletionBonus` | 120 | ✅ bono de piso |
| Camera | `fov` | 65 | ✅ |
| Camera | `cameraX/Y/Z` | 0 / 14 / 14 | ❌ |
| Visuals | `backgroundColor`, `primaryColor`, `fontFamily` | — | ❌ |
| Visuals | `ambientColor`, `ambientIntensity` | `#152238`, 1.8 | ✅ solo intensidad |
| Visuals | `sunColor`, `sunIntensity` | `#38bdf8`, 3.5 | ✅ solo intensidad |
| Visuals | `hemiSkyColor`, `hemiGroundColor`, `hemiIntensity` | — , 0.8 | ✅ solo intensidad |
| Physics | `gravity` | −15 | ✅ |
| System | `targetFPS`, `stepMs`, `maxSubSteps` | 60 / 16.6 / 5 | ❌ |
| Audio | `defaultMusicVolume`, `defaultSfxVolume` | 0.35 / 0.6 | ❌ (defaults en `App`) |
| Audio | `backgroundMusicUrl` | grid_runner.mp3 | ✅ |

**Override desde el host:** `globalThis.playgroundConfig = {clave: valor}` al cargar (aplicado a nivel de módulo). El esquema público está en `playground_config.json`.

`AVAILABLE_MUSIC_TRACKS: MusicTrack[]` — pista `grid_runner` (synthwave cyberpunk).

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
| Mejoras | `armorRepair(+Desc)`, `platingBoost(+Desc)`, `plasmaCore(+Desc)`, `overclockSights(+Desc)`, `kineticThrusters(+Desc)`, `creditMagnet(+Desc)` |
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

interface CoinEntity   { id, x, y, z, value, rotY, bobOffset }   // ⚠️ declarado, sin uso
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
<Overlay title description? actionLabel onAction icon? tone? autoFocus? />
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
  weaponDamage; fireRate; speed; magnetRange; floor; dronesLeft;
  elevatorReady: boolean; isShopOpen: boolean; [key: string]: any;
}
clamp(v,min,max) · formatTime(s) → "m:ss" · useIsMobile(): boolean · useAutoFocus<T>()
```
> `VICTORY` y `LEVEL_COMPLETE` están declarados pero el juego nunca los emite hoy.

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
| `echo_protocol_upgrades_v1` | JSON | `{maxHealth, weaponDamage, fireRate, speed, magnetRange}` | `{100,25,3.5,8.5,5.5}` |
| `echo_protocol_lang_v1` | `'en'\|'es'` | idioma | `en` |
| `echo_protocol_tutorial_completed_v1` | `'true'` | tutorial visto | ausente = nuevo |
| `echo_protocol_best_floor_v1` | `string` (int) | mejor piso | `1` |

Todas las lecturas/escrituras van en `try/catch`.

---

## 11. Eventos globales

| Evento / API | Dirección | Descripción |
| :--- | :---: | :--- |
| `playground-mute` (CustomEvent `{muted}`) | window → `GameAudio` | silencia los SFX |
| `message` (`RpcResponse`) | parent → `useRpc` | responde a RPC pendientes |
| `PREVIEW_READY` | app → parent | sandbox listo |
| `document.pointerlockchange` | doc → `input.ts` | actualiza `pointer.isLocked` |
| `KeyboardEvent` sintéticos | app → window | botones táctiles que simulan teclado |

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
