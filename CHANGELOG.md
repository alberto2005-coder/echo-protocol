# 📋 Changelog — ECHO PROTOCOL

Todo notable del proyecto se documenta en este archivo.

El formato sigue a [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado adherido a [SemVer](https://semver.org/lang/es/).

> **Nota sobre el historial:** el repositorio Git arrancó con el estado funcional consolidado el **2026-10-10**; desde entonces cada cambio se registra aquí en `[Unreleased]` y se mueve a una sección fechada al publicar.

**Índice de documentación:** [`docs/README.md`](./docs/README.md)

---

## [Unreleased] — 2026-10-10

### Añadido
- **Documentación completa del proyecto** (entrega 1):
  - [`README.md`](./README.md) (EN) y [`README.es.md`](./README.es.md) (ES): badges, inicio rápido con scripts, tabla de controles, bestiario con contra-estrategias, stack verificado, árbol de estructura, índice de documentación y estado del proyecto.
  - [`docs/README.md`](./docs/README.md) — índice, resumen de producto y estado de verificación.
  - [`docs/requisitos-funcionales.md`](./docs/requisitos-funcionales.md) — 80+ requisitos FR/NFR con prioridad, estado y trazabilidad al código; 10 historias de usuario; reglas de negocio; *Definition of Done*.
  - [`docs/guia-usuario.md`](./docs/guia-usuario.md) — manual del jugador: requisitos, instalación, controles, HUD, flujo de partida, enemigos, Armería, puntuación, ajustes, FAQ y solución de problemas.
  - [`docs/guia-desarrollador.md`](./docs/guia-desarrollador.md) — entorno, estructura, arquitectura, convenciones, 8 recetas de extensión, suite de tests, checklist QA, rendimiento y despliegue.
  - [`docs/api-referencia.md`](./docs/api-referencia.md) — mapa de módulos, props de `Game`, hooks, tipos, claves `CONFIG`, `localStorage`, eventos globales y orden de render.
  - [`docs/sistemas-juego.md`](./docs/sistemas-juego.md) — tablas de balanceo, IA por arquetipo, jefe con fases, economía, puntuación, temas, audio y *cheat sheet* de fórmulas.
- **[`LICENSE`](./LICENSE)** — licencia propietaria de ECHO PROTOCOL, bilingüe (EN/ES), con exención de garantías, limitación de responsabilidad, cláusula de terminación y declaración sobre los componentes de terceros.
- **Suite de tests** (Vitest + jsdom, **67 tests** en 9 ficheros): `app.smoke`, `app.shop`, `app.audio`, `input`, `config`, `translations`, `waves`, `themes` y `arena`. Congelan el comportamiento actual del juego (economía, audio persistente, entradas, balanceo y traducciones).
- **CI** — `.github/workflows/ci.yml`: `lint` → `test` → `build` en cada push a `master`/`main` y en cada PR (Node 24, caché de npm).
- **Botones táctiles `DASH` y `ADS`** para móvil, conectados mediante el nuevo puente `setVirtualAction()` (`input.ts`, evento `echo-protocol:virtual-action`).
- **Code splitting** — el motor 3D se importa con `React.lazy()` + `<Suspense>` y `vite.config.ts` reparte el grafo en `index`, `react-vendor`, `Game`, `three`, `physics` y `postprocessing`.
- **`THIRD_PARTY_NOTICES.md`** regenerado a partir de los sourcemaps del build real: 20 paquetes presentes en el bundle, con licencias Zlib, Apache-2.0, ISC, CC0 y MIT reproducidas íntegramente.
- **Versión de escritorio (Windows) con Tauri 2** — carpeta `src-tauri/`: shell nativo que embebe el build web completo en un binario de **~5 MB** (sin navegador, sin Node, sin archivos sueltos). Scripts nuevos: `dev:tauri` (ventana con HMR), `exe` (binario) e `installer` (instalador).
- **Instalador de un solo `.exe` con Inno Setup 7** — `installer/EchoProtocol.iss` produce `EchoProtocol-Setup-1.0.0.exe` (**6,8 MB**): instala en Program Files, crea accesos en escritorio y menú Inicio, incluye desinstalador y, si el PC no tiene WebView2 Runtime, ejecuta el bootstrapper oficial durante la instalación.
- **Icono de aplicación**: `npx tauri icon public/game-icon.png` genera el set completo de iconos (incluido `src-tauri/icons/icon.ico`, de 16 a 256 px) que usa tanto el `.exe` como el instalador.

### Cambiado
- **TypeScript en modo estricto** (`"strict": true` en `tsconfig.app.json` y `tsconfig.node.json`); el `include` cubre ahora el código real del juego y `tests/`.
- **`playground_config.json` / `CONFIG`** quedan reducidos a los parámetros con efecto real (`floorCompletionBonus`, `sunIntensity`, `defaultMusicVolume`); el nuevo `defaultMusicVolume` controla el volumen inicial de la música en `App`.
- **`Game.tsx`** solo vuelca las listas de entidades a estado de React mientras `status === 'PLAYING'`: en menú, pausa o derrota no hay re-renders por frame (mitigación del re-render constante; el refactor imperativo pendiente se documenta en la guía de desarrollador §7.2).
- **`vite.config.ts`** define `chunkSizeWarningLimit: 2500` justificado: el único chunk grande es `physics` (Rapier), que se descarga bajo demanda.
- **La música pasa a ser local**: `CONFIG.backgroundMusicUrl` apunta ahora a `./music/grid_runner.mp3` (el mp3 viaja en `public/music/`), así que el juego funciona **sin conexión** en web y en el `.exe`; el host sigue pudiendo sobreescribir la URL.
- **Documentación actualizada** tras cada corrección: tablas de controles con DASH/ADS, estructura del proyecto sin `src/` ni componentes muertos, métricas de rendimiento nuevas y `useInput`/`CONFIG` reflejando el estado real.

### Corregido
- El toast de jefe decía «+250 CRÉDITOS DE BONIFICACIÓN» cuando el bono real es `120 + 25×piso`; ahora anuncia «BONO DE PISO».
- La configuración de audio (volumen de música, volumen de SFX y silencio) se descartaba al recargar; ahora se persiste en `echo_protocol_audio_v1` con validación de rangos.
- `index.html` seguía titulándose `vite-project` y no tenía `description` ni iconos para iOS: título, metadatos e iconos corregidos.
- `tsc -b` solo revisaba la plantilla Vite residual de `src/`; ahora type-checkea el juego completo y pasa con `strict`.
- `oxlint` reportaba 17 avisos (imports sin usar, `exhaustive-deps`, tipos duplicados, etc.); ahora 0 errores y 0 avisos.
- El bundle era único (3.6 MB / 1.22 MB gzip): la ruta crítica bajó a **~95 kB gzip** y el motor (~1.13 MB gzip) se carga bajo demanda.
- `BackgroundMusic` ignoraba el evento `error` del `<audio>`: si la pista remota no carga, ahora avisa por consola y el juego sigue en silencio sin reintentos en bucle.

### Eliminado
- **Mejora «Imán de créditos»** (60 CR, +3.5 m): retirada de la tienda porque no tenía efecto (los créditos se acreditan al instante, no hay monedas que recoger). Desaparecen `magnetRange` de `persistentUpgrades`/`GameState` y las claves `creditMagnet`/`creditMagnetDesc` de ambos idiomas.
- **Código y dependencias muertos**: carpeta `src/` (plantilla Vite heredada), `components/HumanoidCharacter.tsx`, `components/AnimalCharacter.tsx`, tipo `CoinEntity`, helpers `Overlay`/`useAutoFocus`/`clamp`/`formatTime`/`MusicTrack`, acciones de entrada sin consumir (`reload`, `interact`, `tap`), la prop `exitChat` de `Game`/`Scene` y las dependencias `phaser` y `framer-motion` (nunca importadas).
- **Parámetros fantasma del esquema de Playground** (salud, velocidad, daño, PV de drones, volumen… ) que no afectaban a nada: `tests/config.test.ts` impide que vuelvan a aparecer.
- `docs/problemas-conocidos.md`: las 17 incidencias (`BUG-001`…`BUG-017`) quedaron corregidas o mitigadas y su seguimiento pasa al `CHANGELOG.md` y a la guía de desarrollador §7.2.

### Deuda pendiente
- Re-render de `Scene` durante el combate (el vuelco por frame sigue activo en `PLAYING`); la solución real es un dibujo imperativo con `instancedMesh` — **pendiente de decidir** por el equipo.
- Sin pools para balas y textos flotantes.
- La música se sirve de la red sin reintente ni caché offline.

---

## [1.0.0] — 2026-10-10

Primera versión consolidada y funcional del juego.

### Añadido
- **Juego completo en navegador**: arranque, onboarding de 4 pasos (idioma + 3 slides), menú principal, partida, pausa, Armería, game over con récord y reinicio.
- **Motor 3D** con React Three Fiber + Rapier: arena de 50×60 m, 6 columnas, 2 barricadas, 2 plataformas de salto, muros perimetrales, lluvia procedural de 160 partículas, niebla exponencial y Bloom.
- **Bucle de juego a 60 FPS** con `dt` acotado a 0.05 s: apuntado con pointer lock, movimiento WASD, salto, **dash con invulnerabilidad**, ADS (FOV 65 → 45), retroceso, fogonazo, screen shake y knockback.
- **5 arquetipos de enemigos con IA diferenciada:**
  - Explorador: persecución con flanqueo progresivo y disparo de pulso.
  - Kamikaze: carga con pitidos acelerados y detonación en área (28 de daño).
  - Francotirador: búsqueda de cobertura (esconde/asoma), láser de puntería y riel de 32 de daño.
  - Tanque: escudo frontal de 140° con deflexión y disparo pesado doble.
  - **Titán de Sector** (jefe cada 5 pisos): PV escalados, anillo radial de 10 balas, doble disparo pesado, invocaciones al 66 % y 33 %, escolta desde piso 10 y barra de vida con nombre.
- **Dificultad procedural:** cantidad de drones (3 → máx. 14), PV (`22 + piso×8`), velocidad, introducción gradual de arquetipos y flanqueo hasta `min(1, (piso−1)/8)`.
- **Economía y Armería permanente:** créditos por baja (12–250 CR), bono de piso (`120 + 25×piso`), 6 mejoras (reparación, armadura, daño, cadencia, velocidad, imán) persistidas en `localStorage`, saldo inicial de 100 CR.
- **Elevador entre pisos:** se enciende al limpiar la oleada y abre la Armería al acercarse a <4 m (o con botón en móvil).
- **7 paletas de tema neón** con interpolación suave de luces, niebla y materiales al cambiar de piso.
- **Localización EN/ES** completa (105 claves por idioma) con persistencia del idioma.
- **Audio 100 % procedural** con Web Audio API (15 SFX sintetizados con variación de tono, mute global y desbloqueo por gesto) más música de fondo en loop con volumen y mute propios.
- **HUD:** barra de armadura, piso y récord, créditos, hostiles, puntuación, retícula con hit marker, barra de jefe, alertas de arquetipo, avisos del piso 1 y toast de recompensa.
- **Entrada doble:** teclado + ratón (con *fallback* de arrastre) y controles táctiles (D-pad, FIRE, JUMP, ARMORY, arrastre para apuntar).
- **Persistencia** de créditos, mejoras, idioma, mejor piso y tutorial visto, con lecturas protegidas.
- **Integración Playground SDK** con lifecycle de score/pausa/final y SDK ficticio en sandbox.
- **Limpieza de configuración**: `.oxlintrc.json` con `react/rules-of-hooks` en error, project references de TypeScript, Tailwind con content scan de la raíz.

### Verificado
- `npm install` ✅ · `npm run build` ✅ (1.52 s) · `npm run lint` ✅ (0 errores, 17 avisos).
- Ciclo manual completo: menú → onboarding (EN/ES) → piso 1 → tienda → ascenso → jefe (piso 5) → derrota → reinicio.

### Conocido (no corregido en esta versión)
- Mejora “Imán de créditos” sin efecto efectivo (`BUG-001`).
- `tsc -b` no verifica el código del juego (`BUG-002`).
- Re-render de React en cada frame (`BUG-003`).
- Sin dash ni ADS en táctil (`BUG-004`).
- Bundle de 3.6 MB / 1.22 MB gzip sin code splitting (`BUG-005`).
- Dependencias y código muerto (`BUG-006`).
- El listado completo está en [`docs/problemas-conocidos.md`](./docs/problemas-conocidos.md).

---

## Guía de mantenimiento del changelog

1. Al empezar una tarea, añade los cambios bajo **`[Unreleased]`** dentro de la sección correspondiente:
   - `### Añadido` — funcionalidad nueva.
   - `### Cambiado` — cambios en comportamiento existente.
   - `### Corregido` — bugs reparados.
   - `### Eliminado` — código o features retirados.
   - `### Seguridad` — vulnerabilidades o prácticas de riesgo.
2. Usa **imperativo en presente** y en español: “Añade…”, “Corrige…”.
3. Referencia el `BUG-###` o el `FR-###` cuando aplique.
4. Al publicar: crea `[X.Y.Z] — AAAA-MM-DD`, vacía `[Unreleased]` y actualiza `package.json → version`.
5. Reglas de versión:
   - **MAJOR** rompe partidas guardadas o cambia el contrato de `localStorage`.
   - **MINOR** añade mecánicas, enemigos, mejoras o idiomas.
   - **PATCH** arreglos, balanceo fino, textos y documentación.
