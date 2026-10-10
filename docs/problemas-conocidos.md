# 06 · Problemas Conocidos y Deuda Técnica — ECHO PROTOCOL

**Política:** este documento **registra** incidencias detectadas durante la revisión del 2026-10-10. Ese mismo día se corrigieron **7 de ellas** (las marcadas ✅); el resto permanece **abierto** y documentado con su ubicación, impacto y corrección propuesta. Los bloques marcados *histórico* conservan la descripción original del problema tal y como se detectó.

**Idioma:** Español · Índice: [`docs/README.md`](./README.md)

---

## Resumen

| ID | Título | Severidad | Área | Estado |
| :-- | :--- | :--: | :--- | :--: |
| [BUG-001](#bug-001) | Mejora “Imán de créditos” sin efecto en el juego | 🔴 Alta | Gameplay | ✅ Corregido |
| [BUG-002](#bug-002) | `tsc -b` no verifica tipos del código real del juego | 🔴 Alta | Build | ✅ Corregido |
| [BUG-003](#bug-003) | Re-render de React en cada frame (60/s) | 🟠 Media | Rendimiento | Abierto |
| [BUG-004](#bug-004) | Controles táctiles incompletos (sin dash ni ADS) | 🟠 Media | Móvil | Abierto |
| [BUG-005](#bug-005) | Bundle único de 3.6 MB sin code splitting | 🟠 Media | Rendimiento | Abierto |
| [BUG-006](#bug-006) | Dependencias y código muerto | 🟠 Media | Mantenibilidad | Abierto |
| [BUG-007](#bug-007) | `index.html` / `package.json` con metadatos de plantilla | 🟡 Baja | Metadata | ✅ Corregido |
| [BUG-008](#bug-008) | GDD (`design/`) no corresponde al juego implementado | 🟡 Baja | Documentación | Abierto |
| [BUG-009](#bug-009) | Sliders de `CONFIG`/`playground_config.json` que no afectan | 🟠 Media | Configuración | Abierto |
| [BUG-010](#bug-010) | 17 avisos de oxlint sin resolver | 🟡 Baja | Calidad | ✅ Corregido |
| [BUG-011](#bug-011) | Ajustes de audio no persistentes | 🟡 Baja | UX | ✅ Corregido |
| [BUG-012](#bug-012) | Texto de recompensa del jefe engañoso (+250 vs 500) | 🟡 Baja | i18n | ✅ Corregido |
| [BUG-013](#bug-013) | `THIRD_PARTY_NOTICES.md` con versiones desactualizadas | 🟡 Baja | Legal/Docs | ✅ Corregido |
| [BUG-014](#bug-014) | Sin pruebas automatizadas ni CI | 🟠 Media | Calidad | 🟡 Parcial |
| [BUG-015](#bug-015) | Metadatos de lint de TypeScript incompletos (`strict` off) | 🟡 Baja | Calidad | Abierto |
| [BUG-016](#bug-016) | Dependencia de red para la música de fondo | 🟡 Baja | Robustez | Abierto |
| [BUG-017](#bug-017) | Carpeta de trabajo sin repositorio Git inicializado | 🟡 Baja | Proceso | 🟡 Parcial |

> Leyenda de severidad: 🔴 alta (afecta funcionalidad o calidad de release) · 🟠 media · 🟡 baja.
>
> Leyenda de estado: ✅ corregido el 2026-10-10 y cubierto por tests · 🟡 parcialmente resuelto · Abierto sin tocar.

---

## BUG-001 · Mejora “Imán de créditos” sin efecto

**Severidad:** 🔴 Alta · **Requisito afectado:** FR-505, FR-506 · **Ficheros:** `App.tsx`, `utils/helper.tsx`, `translations.ts`

> ✅ **Corregido el 2026-10-10** — Se aplicó la **opción 3: retirar la mejora de la tienda** (decisión de producto). Desaparece la tarjeta y toda su estela: `magnetRange` se eliminó de `persistentUpgrades` (`App.tsx`), de `GameState` (`utils/helper.tsx`) y de la clave `echo_protocol_upgrades_v1`; `creditMagnet`/`creditMagnetDesc` se borraron de `translations.ts` en ambos idiomas; el texto de onboarding pasó a anunciar `+Speed Boost`.
> **Sin sistema de drops:** los créditos siguen acreditándose al instante en `onEnemyKilled`.
> Cubierto por `tests/translations.test.ts` (las claves ya no existen) y `tests/app.shop.test.tsx` (la tarjeta no aparece).

**Comportamiento original (histórico)**
- Se puede comprar por **60 CR** (`handleBuyUpgrade('magnet', 60)`), incrementa `magnetRange` +3.5 y se persiste.
- La tarjeta de la tienda muestra el radio actual.
- **No existe ningún sistema de recogida:** `Game.tsx` tiene `coinsRef` declarado (línea ~315) pero solo se vacía en `initFloor` (línea ~487); nunca se llenan entidades de moneda. Los créditos se acreditan **al instante** en `onEnemyKilled`.
- `magnetRange` no aparece en ningún sitio de `Game.tsx`.

**Impacto**
El jugador paga 60 CR por una mejora que no hace nada → sensación de fraude / trampa de economía.

**Corrección propuesta (elegir una)**
1. **Implementar drops físicos:** crear `CoinEntity` al matar, animar bob/rotación y atraer al jugador dentro de `magnetRange`.
2. **Reconversión de la mejora:** que dé un % extra de créditos por baja (p. ej. +8 % por nivel).
3. **Retirarla de la tienda** hasta tener el sistema de drops.

---

## BUG-002 · `tsc -b` no verifica tipos del código real del juego

**Severidad:** 🔴 Alta · **Requisito afectado:** NFR-007 · **Ficheros:** `tsconfig.app.json`, `tsconfig.json`

> ✅ **Corregido el 2026-10-10** — `tsconfig.app.json` incluye ahora todo el código de la raíz (`*.ts`, `*.tsx`, `components/`, `utils/`, `tests/`). Destapó errores de `verbatimModuleSyntax` y `noUnusedLocals`, todos corregidos: **`npx tsc -b` → 0 errores**, y `npm run build` ejecuta ese type-check antes de empaquetar.

**Comportamiento original (histórico)**
```jsonc
// tsconfig.app.json
"include": ["src"]   // ← solo la plantilla Vite residual
```
El código del juego vive en la **raíz** (`App.tsx`, `Game.tsx`, `components/`, `utils/`, …). `npm run build` ejecuta `tsc -b && vite build`, pero `tsc -b` solo revisa `src/` y `vite.config.ts`. Vite compila con su propio transformador **sin comprobar tipos**.

**Impacto**
Un error de tipos en el juego no falla el build; aparece en runtime. El type-check “verde” da falsa confianza.

**Corrección propuesta**
```jsonc
// tsconfig.app.json
"include": [
  "./*.ts", "./*.tsx",
  "components/**/*", "utils/**/*"
]
```
(o migrar todo el código a `src/` y apuntar `index.html` en consecuencia). Después, ejecutar `tsc -b` y corregir lo que salga.

---

## BUG-003 · Re-render de React en cada frame

**Severidad:** 🟠 Media · **Requisito afectado:** NFR-003 · **Fichero:** `Game.tsx` (final del `useFrame`)

**Comportamiento actual**
```ts
setDronesList([...dronesRef.current]);
setBulletsList([...bulletsRef.current]);
setFloatingList([...floatingsRef.current]);
```
Se ejecutan **60 veces por segundo**, provocando el re-render completo de `<Scene/>` (mallas, materiales y JSX) cada frame.

**Impacto**
CPU de React innecesaria; en gama baja se notan picos de frametime. Contradice la premisa de “estado en refs sin re-renders”.

**Corrección propuesta**
- Mantener las listas en refs y renderizarlas con un componente que se suscriba (`useSyncExternalStore`), **o**
- Solo hacer `setState` cuando cambie la longitud/mutación relevante, **o**
- Mover el renderizado de balas/drones a objetos Three imperativos (`InstancedMesh`/objetos en `scene` sin JSX).

---

## BUG-004 · Controles táctiles incompletos (sin dash ni ADS)

**Severidad:** 🟠 Media · **Requisito afectado:** FR-802, NFR-013 · **Fichero:** `App.tsx` (bloque *Persistent Mobile Controls*)

**Comportamiento actual**
Los botones móviles simulan teclas (`w/a/s/d`, `Enter`, ` `). **No hay tecla sintética para `Shift`** (dash) **ni para el clic derecho** (ADS); además `useInput` solo marca `aim` desde `pointerdown` con `button === 2`.

**Impacto**
En móvil no se puede usar la mecánica de supervivencia más importante (dash con invulnerabilidad) ni apuntar con mira. Desventaja competitiva frente a escritorio.

**Corrección propuesta**
Añadir botones `DASH` y `ADS` que despachen `KeyboardEvent('Shift')` y un evento pointer con `button: 2`, o bien una acción `aim`/`dash` directa en `InputAction`.

---

## BUG-005 · Bundle único de 3.6 MB sin code splitting

**Severidad:** 🟠 Media · **Requisito afectado:** NFR-004 · **Ficheros:** `vite.config.ts`, `package.json`

**Comportamiento actual**
```
dist/assets/index-*.js   3,618.87 kB │ gzip: 1,219.95 kB
(!) Some chunks are larger than 500 kB after minification.
```
Vite no configura `manualChunks`; todo (three, drei, rapier, postprocessing, react, UI) entra en un único chunk.

**Impacto**
Primera carga pesada, especialmente en móvil/4G. Advertencia del propio bundler.

**Corrección propuesta**
```ts
build: {
  rollupOptions: { output: { manualChunks: {
    three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei'],
    physics: ['@react-three/rapier'], ui: ['react', 'react-dom', 'lucide-react'],
  }}},
  chunkSizeWarningLimit: 800,
}
```
Y revisar si `@react-three/postprocessing` puede cargarse bajo demanda.

---

## BUG-006 · Dependencias y código muerto

**Severidad:** 🟠 Media · **Requisito afectado:** NFR-008

| Elemento | Situación |
| :--- | :--- |
| `phaser` (^4.2.1) | declarado en `package.json` y en `THIRD_PARTY_NOTICES.md`, **jamás importado** |
| `framer-motion` (^14.0.0) | declarado, **jamás importado** |
| `src/` completo | plantilla Vite (`App.tsx`, `main.tsx`, `App.css`, assets) **no referenciada** por `index.html` |
| `components/HumanoidCharacter.tsx`, `AnimalCharacter.tsx` | no importados por ningún módulo |
| `Overlay` (`utils/helper.tsx`) | exportado pero no usado (`MenuOverlay` sí) |
| `CoinEntity` (`types.ts`) | tipo sin implementación (ver BUG-001) |
| `exitChat` (prop de `Game`/`Scene`) | recibido y **no utilizado** (aviso de lint) |
| Acciones `reload`, `interact`, `tap` | mapeadas en `input.ts`, ninguna se consume |
| `CONFIG` sin usar | `title`, `baseCanvas*`, `playerStartingHealth`, `basePlayerSpeed`, `baseWeaponDamage`, `baseDroneHealth`, `droneSpeed`, `cameraX/Y/Z`, colores, `targetFPS/stepMs/maxSubSteps`, `defaultMusicVolume/defaultSfxVolume` |
| Helpers sin usar | `formatTime`, `clamp` (se usa `THREE.MathUtils.clamp`), `randomInt`, `degToRad`, `radToDeg`, `toVec3`, `toQuat`, `temp*` |

**Impacto:** ruido para nuevos desarrolladores, instalación más pesada y falsas señales sobre qué parámetros son configurables.

**Corrección propuesta:** purge en una tarea dedicada, dejando `package.json`, `CONFIG` y exports solo con lo realmente consumido.

---

## BUG-007 · Metadatos de plantilla

**Severidad:** 🟡 Baja · **Ficheros:** `index.html`, `package.json`

> ✅ **Corregido el 2026-10-10** — `<title>Echo Protocol</title>` más una `meta description`; en `package.json`, `name: echo-protocol`, `version: 1.0.0` y un `description` propio.
> **No modificado a propósito:** `<html lang="en">` (la UI alterna idioma en runtime desde el picker de onboarding).

**Comportamiento original (histórico)**

| Campo | Valor original | Valor actual |
| :--- | :--- | :--- |
| `<title>` | `vite-project` | `Echo Protocol` |
| `<html lang>` | `en` | dinámico o `es` (documentación y UI son ES/EN) |
| `package.json → name` | `vite-project` | `echo-protocol` |
| `package.json → version` | `0.0.0` | `1.0.0` |
| `package.json → description/license/repository` | ausentes | añadir |

**Impacto:** SEO/pestaña del navegador, identificación en herramientas y registro de releases.

---

## BUG-008 · El GDD no corresponde al juego implementado

**Severidad:** 🟡 Baja · **Fichero:** `design/game_design_document.json`

El documento describe un **cover shooter en tercera persona**: crouch, recarga con `R`, cobertura con 70 % de mitigación, cámara *over-the-shoulder*, oleadas de 3, distrito lluvioso, `language: ["en"]`, `low_end_device_support: false`.

El juego real es un **FPS en primera persona** con dash, sin recarga ni crouch, dos idiomas y controles táctiles.

**Impacto:** confusiones si alguien toma el GDD como especificación vigente.

**Corrección propuesta:** marcar el archivo como `legacy` (renombrar a `game_design_document.legacy.json`) o regenerarlo desde `docs/sistemas-juego.md`.

---

## BUG-009 · Sliders que no afectan al juego

**Severidad:** 🟠 Media · **Ficheros:** `constants.ts`, `playground_config.json`

`playground_config.json` expone al host 8 parámetros ajustables. Varias claves de `CONFIG` **no se leen** en ninguna parte del bucle (ver tabla de BUG-006). Un usuario que mueva “Drone Health” o “Player Speed” **no verá ningún cambio**, porque el juego usa sus propias fórmulas (`22 + piso×8`, `speed 8.5` de `App.tsx`).

| Slider | ¿Funciona? |
| :--- | :--: |
| Floor Clear Bonus | ✅ sí (`floorCompletionBonus`) |
| Sun Intensity | ✅ sí (`sunIntensity`) |
| Music Volume | ❌ (el real vive en el estado de `App`) |
| Player Health / Speed / Weapon Damage / Drone Health / Drone Speed | ❌ sin efecto |

**Corrección propuesta:** hacer que `initFloor`/`initGame` lean `getConfig(...)` en lugar de valores literales, o eliminar del esquema los parámetros no conectados.

---

## BUG-010 · 17 avisos de oxlint

**Severidad:** 🟡 Baja · **Comando:** `npm run lint`

> ✅ **Corregido el 2026-10-10** — **`npm run lint` → 0 errores y 0 avisos.** Medidas tomadas:
> - Constantes fuera de render: `SECTOR_THEMES`/`getThemeForFloor` → [`themes.ts`](../themes.ts), `ARENA_OBSTACLES` → [`arena.ts`](../arena.ts), composición de oleadas → [`waves.ts`](../waves.ts) (también las hizo testeables).
> - `Math.random` de la lluvia movido a nivel de módulo; el recoil/muzzle flash a un estado `weaponFx`.
> - `initFloor` a `useCallback([setGameState])` con guard `lastInitializedFloor` y `onBossUpdateRef` sincronizado; parámetros no usados renombrados con `_`.
> - ⚠️ **`oxlint` no admite supresiones para `react-hooks/exhaustive-deps`** (probadas 8 variantes): hay que arreglar el código, no comentarlo. `react/refs` e `react/immutability` sí se pueden suprimir con `// oxlint-disable-next-line`.

**Comportamiento original (histórico)**

| Regla | Apariciones | Comentario |
| :--- | --: | :--- |
| `react/purity` (`Math.random` en render) | 3 | posiciones de la lluvia dentro de `useMemo`; es estable en la práctica |
| `react/only-export-components` | 3 | `SECTOR_THEMES`, `getThemeForFloor`, `ARENA_OBSTACLES` exportados desde `Game.tsx` (rompe Fast Refresh) |
| `react/refs` (acceso a refs en render) | 2 | `camera.position/quaternion` usados en JSX del arma |
| `react/immutability` | 4 | mutaciones de `camera`, `scene.fog`, colores |
| `react/set-state-in-effect` + `exhaustive-deps` | 3 | `initFloor` dentro de `useEffect([gameState.floor])` |
| `no-unused-vars` | 2 | `exitChat`, `useState` en `BackgroundMusic` |
| `react-hooks/exhaustive-deps` | 2 | efectos con dependencias incompletas |

**Corrección propuesta:** mover constantes a un módulo propio, renombrar parámetros no usados con `_`, y revisar deps de efectos. No bloquea release.

---

## BUG-011 · Ajustes de audio no persistentes

**Severidad:** 🟡 Baja · **Fichero:** `App.tsx`

> ✅ **Corregido el 2026-10-10** — Nueva clave **`echo_protocol_audio_v1`** que guarda `{musicVolume, sfxVolume, isMuted}`: `loadAudioPrefs()` lee con `try/catch` y descarta valores corruptos o fuera de rango, y un efecto escribe en cada cambio, siguiendo el patrón del resto de claves.
> Cubierto por `tests/app.audio.test.tsx`.

**Comportamiento original (histórico)**

`musicVolume`, `sfxVolume` e `isAudioMuted` se inicializan en `0.35 / 0.6 / false` en cada carga, mientras que idioma, créditos, mejoras, récord y tutorial sí se guardan.

**Impacto:** cada visita hay que volver a silenciar/ajustar.

**Corrección propuesta:** añadir `echo_protocol_audio_v1` con `try/catch`, siguiendo el patrón existente.

---

## BUG-012 · Texto de recompensa del jefe engañoso

**Severidad:** 🟡 Baja · **Ficheros:** `translations.ts`

> ✅ **Corregido el 2026-10-10** — `bossDefeated` ya no promete una cifra: EN `TITAN BOSS DESTROYED! FLOOR BONUS` · ES `¡JEFE TITÁN DESTRUIDO! BONO DE PISO`.

**Comportamiento original (histórico):** la clave decía *“+250 BONUS CREDITS”*, pero el jugador recibe **250 de baja + 250 de bono de piso = 500 CR** (más 2000 puntos).

**Corrección propuesta:** textos `+500 CR EN TOTAL` o separar los dos mensajes.

---

## BUG-013 · `THIRD_PARTY_NOTICES.md` con versiones desactualizadas

**Severidad:** 🟡 Baja · **Fichero:** `THIRD_PARTY_NOTICES.md`

> ✅ **Corregido el 2026-10-10** — Regenerado con un método verificable:
> 1. `vite build --sourcemap` y lectura del array `sources` del mapa → lista definitiva de los **20 paquetes que entran de verdad en el bundle**.
> 2. Versiones y campos `license` leídos de `node_modules/<pkg>/package.json`.
> 3. Textos de licencia copiados **literalmente** de cada paquete instalado (nada transcrito a mano).
>
> Incluye además: tooling de build/test, dependencias declaradas pero no usadas (BUG-006), y las licencias que faltaban — **Zlib** (`postprocessing`) y **Apache-2.0** (`@dimforge/rapier3d-compat`). Detectado de paso: `n8ao` declara `ISC` en su `package.json` pero su fichero `LICENSE` es **CC0 1.0**.

**Comportamiento original (histórico)**

| Paquete | Versión en el aviso | Versión en `package.json` |
| :--- | :--- | :--- |
| @react-three/fiber | 9.6.1 | ^9.8.1 |
| @react-three/postprocessing | 3.0.2 | ^3.1.3 |
| framer-motion | 12.42.0 | ^14.0.0 |
| lucide-react | 1.21.0 | ^1.54.0 |
| phaser | 4.2.0 | ^4.2.1 |
| react | 19.2.7 | ^19.2.8 |
| three | 0.185.0 | ^0.186.1 |

Además lista `phaser`/`framer-motion`, que no se usan (BUG-006) y omite `@react-three/drei`, `@react-three/rapier`, `tailwindcss`, `vite`, `typescript` y `oxlint`.

**Corrección propuesta:** regenerar la tabla con `npm ls --depth=0` y confirmar licencias reales de `node_modules/*/package.json`.

---

## BUG-014 · Sin pruebas automatizadas ni CI

**Severidad:** 🟠 Media · **Requisito afectado:** NFR-007

> 🟡 **Parcialmente resuelto el 2026-10-10** — Ya existe runner de tests: **Vitest + Testing Library + jsdom** con **55 tests en 7 ficheros** (`npm test` / `npm run test:watch`). Falta lo 2: **workflow de CI**.

**Comportamiento original (histórico)**

No había runner de tests (Vitest/Jest), ni tests unitarios, ni workflow de CI.

**Corrección propuesta (pendiente)**
1. ~~Vitest + `@testing-library/react` para `App.tsx`~~ ✅ hecho.
2. ~~Tests unitarios puros: composición de oleada, economía, `getThemeForFloor`~~ ✅ hecho.
3. GitHub Actions: `npm ci && npm run lint && npm run build && npm test`.

---

## BUG-015 · TypeScript sin `strict`

**Severidad:** 🟡 Baja · **Ficheros:** `tsconfig.app.json`, `tsconfig.node.json`

No se activan `strict`, `noUncheckedIndexedAccess` ni `noImplicitOverride`. (Desde la corrección de BUG-002 el código **sí** se está type-checkeando, pero sin `strict`.)

**Corrección propuesta:** activar `strict: true` progresivamente tras arreglar BUG-002.

---

## BUG-016 · Música dependiente de la red

**Severidad:** 🟡 Baja · **Ficheros:** `constants.ts`, `utils/BackgroundMusic.tsx`

La pista se descarga de `https://storage.googleapis.com/assets-gen-playground/musiclibrary/grid_runner.mp3`. Sin conexión (o si el bucket cambia) no hay música y no existe aviso ni fallback local.

**Corrección propuesta:** servir el MP3 desde `public/` con la URL del `CONFIG` apuntando a `/music/grid_runner.mp3`.

---

## BUG-017 · Sin repositorio Git inicializado

**Severidad:** 🟡 Baja · **Proceso**

> 🟡 **Parcialmente resuelto el 2026-10-10** — El proyecto **ya es un repositorio Git** (rama `master`), pero **nada está committeado todavía**: todo está como “changes not staged”. Falta el commit inicial.

**Comportamiento original (histórico)**

Existía `.gitignore` pero la carpeta no estaba inicializada como repositorio. Sin historial no se puede correlacionar cambios con el `CHANGELOG.md`.

**Corrección propuesta:** `git init`, commit inicial, y reglas de release documentadas en la guía de desarrollador §11.

---

## 🧭 Roadmap sugerido (orden de ataque)

| Fase | Trabajo | Cierra | Estado |
| :---: | :--- | :--- | :--: |
| **1 · Fundamentos** | Type-check real (BUG-002) + `strict` (BUG-015) + purge de dependencias (BUG-006) + metadatos (BUG-007) | bugs 002, 015, 006, 007 | 🟡 002 y 007 ✅ |
| **2 · Honestidad de producto** | Imán de créditos: implementar drops o retirar (BUG-001) + sliders conectados (BUG-009) + textos del jefe (BUG-012) | bugs 001, 009, 012 | 🟡 001 y 012 ✅ |
| **3 · Móvil** | Botones DASH/ADS (BUG-004) | bug 004 | Abierta |
| **4 · Rendimiento** | Re-render por frame (BUG-003) + code splitting (BUG-005) | bugs 003, 005 | Abierta |
| **5 · Calidad** | Vitest + CI (BUG-014) + limpieza de lint (BUG-010) + audio persistente (BUG-011) | bugs 014, 010, 011 | 🟡 014 parcial, 010 y 011 ✅ |
| **6 · Higiene** | GDD legacy (BUG-008), avisos de terceros (BUG-013), música local (BUG-016), Git (BUG-017) | resto | 🟡 013 ✅, 017 parcial |

---

## 📋 Plantilla para reportar nuevos problemas

```markdown
### BUG-0XX · Título
**Severidad:** 🔴/🟠/🟡 · **Requisito:** FR-### · **Ficheros:**

**Comportamiento actual**
**Comportamiento esperado**
**Pasos para reproducir**
**Corrección propuesta**
```
