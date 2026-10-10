# 01 · Requisitos Funcionales — ECHO PROTOCOL

**Proyecto:** Echo Protocol · **Fecha de verificación:** 2026-10-10 · **Estado:** aprobado contra el código fuente
**Idioma:** Español · Índice: [`docs/README.md`](./README.md)

---

## 1. Alcance y objetivos

### 1.1 Objetivo del producto

Un FPS 3D de arena por oleadas, jugable en navegador, con:

1. Combate continuo contra drones en sectores infinitos.
2. Economía de Créditos Cibernéticos con mejoras **permanentes**.
3. Un jefe Titán cada 5 pisos como picos de dificultad.
4. Experiencia completa en escritorio y móvil, en inglés y español.

### 1.2 Fuera de alcance (v1.0)

- Multijugador en tiempo real (el SDK de Playground solo reporta puntuación).
- Servidor propio, cuentas de usuario o base de datos.
- Guardado en la nube (todo es local, `localStorage`).
- Modo espectador, mapas editoriales o creación de contenido por usuarios.

### 1.3 Atributos de prioridad

| Prioridad  | Significado                                             |
| :--------- | :------------------------------------------------------ |
| **Must**   | Sin esto el producto no se considera jugable/publicable |
| **Should** | Importante para la experiencia, admite workaround       |
| **Could**  | Deseable, puede postergarse                             |

---

## 2. Requisitos funcionales

### 2.1 Arranque, navegación y onboarding — `FR-1xx`

| ID     | Requisito                                                                                                                                     | Prioridad | Estado | Ubicación                        |
| :----- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :------------------------------- |
| FR-101 | Al cargar la aplicación se muestra el menú principal con créditos guardados, mejor piso y las acciones: Jugar, Armería, Ajustes y Cómo jugar. |   Must    |   ✅    | `App.tsx` (bloque `START`)       |
| FR-102 | En el primer acceso se lanza un onboarding de 4 pasos: selección de idioma + 3 slides (briefing, controles, economía).                        |   Must    |   ✅    | `App.tsx` (onboarding)           |
| FR-103 | El onboarding puede saltarse en cualquier paso y re-ejecutarse desde Ajustes o desde Cómo jugar.                                              |  Should   |   ✅    | `replayOnboarding()`             |
| FR-104 | Completar el onboarding marca la preferencia para no volver a mostrarlo (`echo_protocol_tutorial_completed_v1`).                              |   Must    |   ✅    | `App.tsx`                        |
| FR-105 | El juego puede iniciarse/reiniciarse desde el piso 1 en cualquier momento (menú pausa, game over, menú principal).                            |   Must    |   ✅    | `initGame()`                     |
| FR-106 | `Escape` alterna la pausa durante la partida y libera el puntero.                                                                             |   Must    |   ✅    | `App.tsx` (keydown)              |
| FR-107 | El estado del juego expone las fases `START`, `PLAYING`, `PAUSED` y `GAME_OVER`, y cada pantalla se renderiza a partir de esa fase.           |   Must    |   ✅    | `utils/helper.tsx` (`GamePhase`) |

### 2.2 Combate y movimiento — `FR-2xx`

| ID     | Requisito                                                                                                                          | Prioridad | Estado | Ubicación                                       |
| :----- | :--------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :---------------------------------------------- |
| FR-201 | El jugador se mueve en el plano XZ con WASD/flechas, con velocidad base configurable (8.5 por defecto).                            |   Must    |   ✅    | `Game.tsx` §3 Movimiento                        |
| FR-202 | La cámara permite apuntado completo (yaw/pitch) con sensibilidad 0.0022 y bloqueo de pitch en ±1.35 rad.                           |   Must    |   ✅    | `Game.tsx` §1                                   |
| FR-203 | Se puede bloquear el puntero (Pointer Lock) al hacer clic sobre el lienzo; si no hay bloqueo, funciona arrastrar como alternativa. |   Must    |   ✅    | `Game.tsx` `handleClick`, `input.ts`            |
| FR-204 | Disparo con clic izquierdo mantenido, cadencia = `1/fireRate` (3.5 disparos/s base), retroceso, fogonazo y sonido por disparo.     |   Must    |   ✅    | `Game.tsx` §4 Shooting                          |
| FR-205 | ADS con clic derecho: FOV 65 → 45 y velocidad de movimiento ×0.6.                                                                  |  Should   |   ✅    | `Game.tsx` §1 ADS                               |
| FR-206 | Salto con `Espacio` (impulso 7.5) sujeto a gravedad (−15) y detección de suelo.                                                    |   Must    |   ✅    | `Game.tsx` §3                                   |
| FR-207 | Dash cinético con `Shift`: 0.28 s a ×2.5 de velocidad, recarga de 1.2 s e **invulnerabilidad** a balas durante la ráfaga.          |   Must    |   ✅    | `Game.tsx` §3 + comprobación `p.dashTimer <= 0` |
| FR-208 | Las plataformas de salto naranjas impulsan al jugador verticalmente (vy = 18).                                                     |  Should   |   ✅    | `ARENA_OBSTACLES` (`type: 'jumppad'`)           |
| FR-209 | El jugador colisiona con pilares, barricadas y muros perimetrales (AABB + radio de 0.6 m) y no puede salir de la arena.            |   Must    |   ✅    | `Game.tsx` §3 colisiones                        |
| FR-210 | Recibir daño provoca screen shake; llegar a 0 PV cambia la fase a `GAME_OVER` con música de derrota.                               |   Must    |   ✅    | `Game.tsx` impacto de balas enemigas            |
| FR-211 | Un impacto exitoso muestra hit marker en la retícula (120 ms) y feedback visual de parpadeo/knockback en el dron.                  |  Should   |   ✅    | `onHitDrone`, `flashTimer`                      |

### 2.3 Enemigos e IA — `FR-3xx`

| ID     | Requisito                                                                                                                                                 | Prioridad | Estado | Ubicación                             |
| :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :------------------------------------ |
| FR-301 | Existen 5 arquetipos: `scout`, `kamikaze`, `sniper`, `tank` y `boss`, cada uno con comportamiento distinto.                                               |   Must    |   ✅    | `types.ts`, `Game.tsx` §5             |
| FR-302 | Los enemigos aparecen por oleada al iniciar cada piso; la cantidad escala (3, 4, 5 y luego `min(14, 5 + piso×1.2)`).                                      |   Must    |   ✅    | `initFloor()`                         |
| FR-303 | Introducción gradual de arquetipos: pisos 1–2 solo Exploradores; piso 3 + Kamikazes; pisos 4–5 + Francotiradores; piso 6+ + Tanques y formaciones mixtas. |   Must    |   ✅    | `initFloor()`                         |
| FR-304 | Los PV base escalan con el piso (`22 + piso×8`) con multiplicadores por arquetipo (Kamikaze ×0.55, Francotirador ×0.85, Tanque ×2.2).                     |   Must    |   ✅    | `initFloor()`                         |
| FR-305 | El Kamikaze carga, acelera pitidos al acercarse y **detona** a <2 m infligiendo 28 de daño en área (ignorado si el jugador está en dash).                 |   Must    |   ✅    | `Game.tsx` (kamikaze)                 |
| FR-306 | El Francotirador busca cobertura tras un pilar (esconde 1.2 s / asoma 1.3 s), emite láser de puntería y dispara riel de 32 de daño cada 2.5 s.            |   Must    |   ✅    | `Game.tsx` (sniper)                   |
| FR-307 | El Tanque es inmune frontalmente dentro de un arco de 140° (muestra “🛡 DEFLECTED”) y solo recibe daño por la retaguardia.                                 |   Must    |   ✅    | chequeo de ángulo en colisión de bala |
| FR-308 | La IA flanquea al jugador con intensidad progresiva `min(1, (piso−1)/8)`.                                                                                 |  Should   |   ✅    | `Game.tsx` (flank)                    |
| FR-309 | Toda IA evita obstáculos y permanece dentro del perímetro de la arena.                                                                                    |  Should   |   ✅    | `Game.tsx` (obstacle avoidance)       |
| FR-310 | Cada tipo de enemigo tiene modelo, color, barra de vida y FX diferenciados.                                                                               |  Should   |   ✅    | render en `Game.tsx`                  |

### 2.4 Jefes (Titán de Sector) — `FR-4xx`

| ID     | Requisito                                                                                                                        | Prioridad | Estado | Ubicación                                   |
| :----- | :------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :------------------------------------------ |
| FR-401 | Todo piso múltiplo de 5 genera un jefe con PV `450 + (piso/5 − 1) × 350`.                                                        |   Must    |   ✅    | `initFloor()`                               |
| FR-402 | El jefe alterna dos patrones de ataque cada 2.4 s: anillo radial de 10 balas (12 de daño) y doble disparo dirigido (22 de daño). |   Must    |   ✅    | `Game.tsx` (boss attack)                    |
| FR-403 | Al 66% y 33% de PV el jefe invoca refuerzos (2 Kamikazes / 1 Tanque + 1 Francotirador).                                          |   Must    |   ✅    | `Game.tsx` (thresholds)                     |
| FR-404 | Desde el piso 10 el jefe inicia con 2 Exploradores de escolta.                                                                   |  Should   |   ✅    | `initFloor()`                               |
| FR-405 | Se muestra una barra de vida del jefe con nombre y PV actuales mientras está vivo.                                               |   Must    |   ✅    | HUD `bossData` en `App.tsx`                 |
| FR-406 | Matar al jefe otorga 250 CR de baja + 250 CR de bono de piso y 2000 puntos extra.                                                |   Must    |   ✅    | `handleEnemyKilled`, `handleFloorCompleted` |

### 2.5 Economía y progresión — `FR-5xx`

| ID     | Requisito                                                                                                                      | Prioridad | Estado | Ubicación                                                                    |
| :----- | :----------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :--------------------------------------------------------------------------- |
| FR-501 | Cada baja acredita créditos al instante: Explorador 15, Kamikaze 12, Francotirador 25, Tanque 30, Jefe 250.                    |   Must    |   ✅    | `Game.tsx` (`instantCoins`)                                                  |
| FR-502 | Limpiar un piso otorga bono `120 + 25×piso` (o 250 si es piso de jefe).                                                        |   Must    |   ✅    | `Game.tsx` floor cleared                                                     |
| FR-503 | La puntuación crece: +150×piso por baja, +(bono×5 + 600/2000) por piso limpio, +1000×piso por ascender.                        |  Should   |   ✅    | `App.tsx` (`handleEnemyKilled`, `handleFloorCompleted`, `handleAscendFloor`) |
| FR-504 | Al limpiar el piso se habilita el elevador (posición 0, −25); acercarse a <4 m abre la Armería automáticamente.                |   Must    |   ✅    | `Game.tsx` §8 + umbral `elevatorReady`                                       |
| FR-505 | La Armería ofrece 5 mejoras con precio fijo: Reparación 50, Armadura +25 80, Daño +15 90, Cadencia +0.9 85, Velocidad +1.2 70. |   Must    |   ✅    | `App.tsx` (`handleBuyUpgrade`)                                               |
| FR-506 | Todas las mejoras salvo la reparación son **permanentes** y sobreviven a la muerte y al reinicio del navegador.                |   Must    |   ✅    | `echo_protocol_upgrades_v1`                                                  |
| FR-507 | La reparación de armadura (+50 HP) solo está disponible durante la partida y se deshabilita al tener la vida completa.         |  Should   |   ✅    | `App.tsx` (condición `PLAYING`)                                              |
| FR-508 | La compra se bloquea si el saldo es insuficiente y reproduce un sonido de error.                                               |   Must    |   ✅    | `handleBuyUpgrade`                                                           |
| FR-509 | Tras comprar, la pantalla de Armería permite ascender al siguiente piso (`ASCEND TO NEXT FLOOR`).                              |   Must    |   ✅    | `handleAscendFloor`                                                          |
| FR-510 | El jugador nuevo empieza con **100 créditos** de bienvenida (solo la primera vez).                                             |  Should   |   ✅    | `App.tsx` (default 100)                                                      |
| FR-511 | El mejor piso alcanzado se persiste y, al superarlo, se muestra un banner de nuevo récord.                                     |  Should   |   ✅    | `echo_protocol_best_floor_v1`                                                |

### 2.6 Interfaz y HUD — `FR-6xx`

| ID     | Requisito                                                                                                                                                                     | Prioridad | Estado | Ubicación                    |
| :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :--------------------------- |
| FR-601 | Durante la partida se muestra una barra superior con: integridad de armadura (barra + número), piso actual, récord, créditos, hostiles restantes, puntuación y botón de menú. |   Must    |   ✅    | `App.tsx` (header)           |
| FR-602 | Retícula dinámica con anillo, punto central e hit marker.                                                                                                                     |   Must    |   ✅    | `App.tsx` (crosshair)        |
| FR-603 | En el piso 1 se muestran avisos tutoriales de movimiento/apuntado/disparo/salto.                                                                                              |  Should   |   ✅    | `App.tsx` (tutorial overlay) |
| FR-604 | En escritorio se muestra la franja inferior de controles; en móvil, D-pad y botones de acción.                                                                                |  Should   |   ✅    | `App.tsx`                    |
| FR-605 | Las recompensas grandes aparecen como toast flotante de 2.5 s.                                                                                                                |   Could   |   ✅    | `rewardToast`                |
| FR-606 | La pantalla de derrota muestra piso alcanzado, mejor piso, puntuación total, créditos y los botones “Reintentar” y “Menú principal”.                                          |   Must    |   ✅    | `App.tsx` (`GAME_OVER`)      |
| FR-607 | El menú de pausa ofrece Reanudar, Ajustes, Cómo jugar, Reiniciar desde piso 1 y Salir al menú.                                                                                |   Must    |   ✅    | `App.tsx` (pause)            |
| FR-608 | La pantalla “Cómo jugar” expone la guía táctica y permite relanzar el tutorial.                                                                                               |  Should   |   ✅    | `App.tsx`                    |

### 2.7 Localización, audio y accesibilidad — `FR-7xx`

| ID     | Requisito                                                                                                                              | Prioridad | Estado | Ubicación                        |
| :----- | :------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :------------------------------- |
| FR-701 | Toda la interfaz y los textos en juego están disponibles en **inglés** y **español** (105 claves por idioma, en paridad exacta).       |   Must    |   ✅    | `translations.ts`                |
| FR-702 | El idioma puede cambiarse en Ajustes y queda guardado.                                                                                 |   Must    |   ✅    | `echo_protocol_lang_v1`          |
| FR-703 | Todos los SFX se sintetizan por Web Audio API (sin archivos) y responden a volumen y mute.                                             |   Must    |   ✅    | `utils/helper.tsx` (`GameAudio`) |
| FR-704 | Música de fondo en loop que suena solo en `PLAYING`/`PAUSED`, con volumen y mute propios.                                              |  Should   |   ✅    | `BackgroundMusic.tsx`            |
| FR-705 | Ajustes de audio: volumen de música (0.35), volumen de SFX (0.6) y silenciado global.                                                  |   Must    |   ✅    | `App.tsx` (settings)             |
| FR-706 | Los SFX se desbloquean con el primer gesto del usuario (política de autoplay).                                                         |   Must    |   ✅    | `attachUnlock()`                 |
| FR-707 | El HUD usa tipografía monoespaciada y alto contraste sobre fondo oscuro; la info crítica nunca depende solo del color (texto + icono). |  Should   |   ✅    | clases Tailwind                  |

### 2.8 Plataforma, entrada y SDK — `FR-8xx`

| ID     | Requisito                                                                                                                                | Prioridad | Estado | Ubicación                      |
| :----- | :--------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----: | :----------------------------- |
| FR-801 | El juego funciona en desktop (teclado+ratón) y en móvil/tablet (controles táctiles).                                                     |   Must    |   ✅    | `useIsMobile()`                |
| FR-802 | En móvil hay D-pad virtual, botones FIRE, JUMP, **DASH** y **ADS**, arrastre para apuntar y botón de Armería al estar el elevador listo. |   Must    |   ✅    | `App.tsx` (controles táctiles) |
| FR-803 | La detección táctil considera user agent, `pointer: coarse`, `ontouchstart`, `maxTouchPoints` y ancho < 768 px, reactiva al `resize`.    |  Should   |   ✅    | `useIsMobile()`                |
| FR-804 | El contexto del clic derecho está deshabilitado sobre el lienzo (menú nativo).                                                           |   Must    |   ✅    | `input.ts`                     |
| FR-805 | La ventana pierde el foco → se limpian todas las entradas para evitar movimiento fantasma.                                               |  Should   |   ✅    | `input.ts` (`handleBlur`)      |
| FR-806 | Se integra el Playground SDK: `startGame`, `scoreUpdated`, `gameOver`, `levelComplete` y `pauseStateChanged`.                            |  Should   |   ✅    | `utils/usePlayground.ts`       |
| FR-807 | En modo sandbox se usa un SDK ficticio local (sin red) que emite `PREVIEW_READY`.                                                        |  Should   |   ✅    | `utils/playground-fake.ts`     |
| FR-808 | El canvas usa `dpr [1,2]`, sombras 2048² y Bloom con umbral 0.8.                                                                         |   Could   |   ✅    | `Game.tsx` (`Game`)            |

---

## 3. Requisitos no funcionales — `NFR-###`

| ID      | Categoría         | Requisito                                                                                    | Prioridad |                                   Estado                                   |
| :------ | :---------------- | :------------------------------------------------------------------------------------------- | :-------: | :------------------------------------------------------------------------: |
| NFR-001 | Rendimiento       | Mantener 60 FPS durante el combate con hasta 14 drones + balas simultáneas.                  |   Must    |                                     ✅                                      |
| NFR-002 | Rendimiento       | Clamp de `delta` a 0.05 s para que una caída de FPS no "teletransporte" a las entidades.     |   Must    |                                     ✅                                      |
| NFR-003 | Rendimiento       | Evitar re-render de React por frame para el estado del jugador (refs).                       |  Should   | ⚠️ Parcial: listas de drones/balas sí se copian por frame (`setDronesList`) |
| NFR-004 | Rendimiento       | Bundle inicial < 1 MB gzip.                                                                  |  Should   |                               ❌ 1.22 MB gzip                               |
| NFR-005 | Compatibilidad    | Chrome/Edge/Firefox/Safari actuales con WebGL2 y `pointer lock`.                             |   Must    |                                     ✅                                      |
| NFR-006 | Compatibilidad    | Resoluciones desde 360 px de ancho hasta 4K, con `touch-none` para evitar scroll accidental. |  Should   |                                     ✅                                      |
| NFR-007 | Calidad de código | Type-check limpio (`tsc -b`) y linter sin errores.                                           |   Must    |     ⚠️ `tsc` no cubre el código del juego; oxlint 0 errores / 17 avisos     |
| NFR-008 | Calidad de código | Sin dependencias no utilizadas en el bundle de producción.                                   |  Should   |  ✅ `package.json` solo declara lo que se importa (`tests/config.test.ts`)  |
| NFR-009 | Confiabilidad     | Ningún error en consola durante un ciclo completo (menú → partida → derrota → reinicio).     |   Must    |                                     ✅                                      |
| NFR-010 | Confiabilidad     | Toda escritura/lectura de `localStorage` protegida con `try/catch` (modo privado).           |   Must    |                                     ✅                                      |
| NFR-011 | Seguridad         | Sin eval, sin `innerHTML` dinámico, sin datos personales.                                    |   Must    |                                     ✅                                      |
| NFR-012 | Accesibilidad     | Todos los controles interactivos son `<button>` con foco visible y `autoFocus` en diálogos.  |  Should   |                                     ✅                                      |
| NFR-013 | Accesibilidad     | Alternativa táctil a todos los controles esenciales de escritorio.                           |  Should   |                  ✅ D-pad, FIRE, JUMP, DASH y ADS táctiles                  |
| NFR-014 | Legal             | Licencias de terceros publicadas en `THIRD_PARTY_NOTICES.md`.                                |   Must    |                                     ✅                                      |
| NFR-015 | Documentación     | README + documentación de producto, usuario y desarrollo actualizados.                       |  Should   |                              ✅ (esta entrega)                              |

---

## 4. Historias de usuario

### US-01 · Primer arranque
**Como** jugador nuevo, **quiero** elegir mi idioma y ver una introducción corta, **para** entender el juego antes de morir la primera vez.
**Criterios de aceptación:**
- [ ] Aparece el selector de idioma (EN/ES) en el primer acceso.
- [ ] Siguen 3 slides con objetivos, controles y economía; se puede saltar.
- [ ] Al terminar, no vuelve a aparecer salvo que se pida desde Ajustes.

### US-02 · Jugar una partida
**Como** jugador, **quiero** moverme, apuntar y disparar con fluidez, **para** sentirme en control del combate.
**Criterios de aceptación:**
- [ ] WASD + ratón responden sin perceptible latencia.
- [ ] El dash evita daño y tiene recarga visible/audible.
- [ ] Los controles táctiles permiten jugar en móvil.

### US-03 · Enfrentar a los drones
**Como** jugador, **quiero** enemigos con tácticas distintas, **para** que cada encuentro requiera estrategia.
**Criterios de aceptación:**
- [ ] Cada arquetipo se distingue visualmente y por su comportamiento.
- [ ] El Tanque exige flanquear; el Kamikaze exige esquivar; el Francotirador exige romper línea de visión.

### US-04 · Limpiar un piso y ascender
**Como** jugador, **quiero** una señal clara de victoria de piso y un ascenso sencillo, **para** sentir progreso.
**Criterios de aceptación:**
- [ ] Al morir el último dron: fanfarria + bono + `elevatorReady`.
- [ ] El elevador se enciende y, al acercarse (o pulsar el botón en móvil), abre la Armería.
- [ ] “Ascender al siguiente piso” reinicia la oleada con dificultad superior.

### US-05 · Comprar mejoras
**Como** jugador, **quiero** gastar créditos en mejoras permanentes, **para** sentir que la partida muerta no fue en vano.
**Criterios de aceptación:**
- [ ] Precios y efectos visibles en la tarjeta de cada mejora.
- [ ] Botón deshabilitado si no hay saldo.
- [ ] Los valores persisten tras recargar la página.

### US-06 · Enfrentar al Titán
**Como** jugador, **quiero** un jefe memorable cada 5 pisos, **para** tener metas intermedias y picos de emoción.
**Criterios de aceptación:**
- [ ] Barra de vida del jefe con nombre.
- [ ] Refuerzos al 66% y 33%.
- [ ] Recompensa claramente superior a un piso normal.

### US-07 · Configurar audio e idioma
**Como** jugador, **quiero** ajustar música/SFX y cambiar de idioma, **para** jugar cómodo y en mi idioma.
**Criterios de aceptación:**
- [ ] Sliders de volumen y mute global con efecto inmediato.
- [ ] El cambio de idioma actualiza todo el HUD y menús al instante.

### US-08 · Reanudar o abandonar
**Como** jugador, **quiero** pausar y salir sin perder mis créditos, **para** interrumpir sin castigo.
**Criterios de aceptación:**
- [ ] `Escape` pausa/reanuda.
- [ ] Los créditos y mejoras sobreviven a “Abortar a menú principal”.

### US-09 · Ver mi progreso
**Como** jugador, **quiero** ver mi mejor piso y puntuación, **para** intentar superar mi récord.
**Criterios de aceptación:**
- [ ] Mejor piso en el menú y en la pantalla de derrota.
- [ ] Banner de “★ NUEVO RÉCORD ★” al superarlo.

### US-10 · Jugar de nuevo rápidamente
**Como** jugador, **quiero** un botón claro de reintento, **para** volver al combate en menos de 3 segundos.
**Criterios de aceptación:**
- [ ] “Reintentar” en game over reinicia desde el piso 1 con stats a 0.
- [ ] Los créditos y mejoras se conservan.

---

## 5. Reglas de negocio consolidadas

| Regla               | Fórmula / valor                                                     | Origen        |
| :------------------ | :------------------------------------------------------------------ | :------------ |
| Enemigos por piso   | `1→3, 2→4, 3→5, resto→min(14, 5 + piso×1.2)`                        | `initFloor()` |
| PV de dron          | `22 + piso×8` × multiplicador de arquetipo                          | `initFloor()` |
| Recompensa por baja | 15 / 12 / 25 / 30 / 250 (scout / kamikaze / sniper / tank / boss)   | `Game.tsx`    |
| Bono de piso        | `120 + 25×piso` · jefe: `250`                                       | `Game.tsx`    |
| Puntos por baja     | `150 × piso`                                                        | `App.tsx`     |
| Puntos por ascenso  | `1000 × piso anterior`                                              | `App.tsx`     |
| PV del jefe         | `450 + (piso/5 − 1) × 350`                                          | `initFloor()` |
| Daño al jugador     | scout `8 + 2×piso` · tank 18 · sniper 32 · kamikaze 28 · jefe 12/22 | `Game.tsx`    |
| Cadencia            | `intervalo = 1 / fireRate` (base 3.5/s)                             | `Game.tsx`    |
| Persistencia        | 5 claves `localStorage` con prefijo `echo_protocol_`                | `App.tsx`     |

---

## 6. Criterios de aceptación globales (Definition of Done)

1. ✅ `npm run build` finaliza sin errores.
2. ✅ `npm run lint` sin errores (avisos admitidos y documentados).
3. ✅ Ciclo completo jugable: menú → onboarding → combate → piso limpio → tienda → ascenso → jefe → derrota → reinicio.
4. ✅ Los textos EN y ES cubren todas las claves de `translations.ts` (sin claves huérfanas).
5. ✅ La persistencia sobrevive a un refresco de página.
6. ✅ Documentación actualizada (`docs/`, `CHANGELOG.md`, `README`).
7. ✅ Incidencias nuevas registradas en [`problemas-conocidos.md`](./problemas-conocidos.md).

---

## 7. Trazabilidad requisito → código

| Área                         | Archivos responsables                                                |
| :--------------------------- | :------------------------------------------------------------------- |
| FR-1xx Arranque y navegación | `App.tsx`, `utils/helper.tsx`                                        |
| FR-2xx Combate y movimiento  | `Game.tsx`, `input.ts`, `components/FPSWeapon.tsx`                   |
| FR-3xx Enemigos e IA         | `Game.tsx`, `types.ts`                                               |
| FR-4xx Jefes                 | `Game.tsx`, `App.tsx` (HUD)                                          |
| FR-5xx Economía              | `App.tsx`, `Game.tsx`, `constants.ts`                                |
| FR-6xx Interfaz y HUD        | `App.tsx`, `translations.ts`                                         |
| FR-7xx Localización y audio  | `translations.ts`, `utils/helper.tsx`, `utils/BackgroundMusic.tsx`   |
| FR-8xx Plataforma y SDK      | `input.ts`, `utils/usePlayground.ts`, `utils/playground-fake.ts`     |
| NFR                          | `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `package.json` |

> Requisitos marcados ⚠️ o ❌ tienen un incidente asociado en la [sección de problemas conocidos](./problemas-conocidos.md) (`BUG-###`).
