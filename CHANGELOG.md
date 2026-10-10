# 📋 Changelog — ECHO PROTOCOL

Todo notable del proyecto se documenta en este archivo.

El formato sigue a [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado adherido a [SemVer](https://semver.org/lang/es/).

> **Nota sobre el historial:** el proyecto no disponía de repositorio Git ni de versiones anteriores. La versión **1.0.0** consolida el estado funcional entregado y verificado el **2026-10-10**; a partir de aquí, cada cambio relevante debe registrarse en `[Unreleased]` y moverse a una sección fechada al publicar.

**Índice de documentación:** [`docs/README.md`](./docs/README.md)

---

## [Unreleased] — 2026-10-10

### Añadido
- **README mejorado** ([`README.md`](./README.md)): badges, inicio rápido con scripts, tabla de controles (escritorio y táctil), bestiario con contra-estrategias, stack real verificado, árbol de estructura del proyecto, índice de documentación y estado del proyecto.
- **Versión en español del README** ([`README.es.md`](./README.es.md)) con conmutador de idioma respecto al README en inglés.
- **Carpeta `docs/` con la documentación completa del proyecto:**
  - [`docs/README.md`](./docs/README.md) — índice, resumen de producto y estado de verificación.
  - [`docs/requisitos-funcionales.md`](./docs/requisitos-funcionales.md) — 80+ requisitos FR/NFR con prioridad, estado y trazabilidad al código; 10 historias de usuario con criterios de aceptación; reglas de negocio consolidadas; *Definition of Done*.
  - [`docs/guia-usuario.md`](./docs/guia-usuario.md) — manual del jugador: requisitos, instalación, primer arranque, controles, HUD, flujo de partida, enemigos, Armería, puntuación, ajustes, FAQ y solución de problemas.
  - [`docs/guia-desarrollador.md`](./docs/guia-desarrollador.md) — entorno, estructura, arquitectura (App ↔ Game, contrato de callbacks, bucle `useFrame` paso a paso, modelo de colisiones), convenciones, 8 recetas de extensión, checklist QA, rendimiento y despliegue.
  - [`docs/api-referencia.md`](./docs/api-referencia.md) — mapa de módulos, props de `Game`, hooks, tipos, claves de `CONFIG` (y cuáles no se usan), claves de traducción, `localStorage`, eventos globales y orden de render.
  - [`docs/sistemas-juego.md`](./docs/sistemas-juego.md) — tablas de balanceo (oleadas, PV, velocidad, daño), IA por arquetipo, jefe con fases y refuerzos, economía con ejemplos de ingreso, puntuación, temas visuales, audio y *cheat sheet* de fórmulas.
  - [`docs/problemas-conocidos.md`](./docs/problemas-conocidos.md) — 17 incidencias documentadas (`BUG-001`…`BUG-017`) con severidad, ubicación, impacto y corrección propuesta, más un roadmap de ataque.

### Cambiado
- **Verificación completa del código fuente**: se auditaron `App.tsx`, `Game.tsx`, `input.ts`, `constants.ts`, `translations.ts`, `types.ts`, `utils/*`, `components/*` y toda la configuración de build.
- **Corrección de afirmaciones del README anterior:**
  - Zustand **no** es una capa de estado del proyecto: es una dependencia transitiva de `@react-three/fiber`; el estado vive en `useRef` + estado de React.
  - Los créditos **no** caen como recolectables: se acreditan **al instante** en el momento de la baja.
  - Se documentan los scripts reales (`dev`, `build`, `lint`, `preview`) y la versión de Node verificada.

### Sin cambios de código
- Esta entrega es **solo documentación**: no se modificó ningún archivo fuente del juego (alcance acordado: documentar, no tocar). Las incidencias detectadas quedan registradas en [`docs/problemas-conocidos.md`](./docs/problemas-conocidos.md).

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
