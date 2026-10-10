# 05 · Sistemas de Juego y Balanceo — ECHO PROTOCOL

**Para:** diseño y desarrollo · **Idioma:** Español · Índice: [`docs/README.md`](./README.md)
Todos los valores están verificados contra el código fuente el **2026-10-10**. Fuente de verdad: `Game.tsx` y `App.tsx`.

---

## 1. Bucle central

```
   DESPLIEGUE (piso N)
        │
        ▼
  ┌─────────────┐   elimina a todos    ┌──────────────────┐
  │  COMBATE     │ ───────────────────▶ │  SECTOR ASEGURADO│
  │  oleada      │                      │  bono + elevador │
  └──────┬──────┘                       └────────┬─────────┘
         │                                       │
         │ armadura a 0                          ▼
         │                              ┌──────────────────┐
         ▼                              │  ARMERÍA (compra) │◀─── saldo permanente
  ┌─────────────┐                       └────────┬─────────┘
  │  GAME OVER  │                                │ ascender
  │  + récord   │                       ┌────────▼─────────┐
  └──────┬──────┘                       │  PISO N+1        │
         │ reintentar                   │  más PV + más IA │
         └──────────────────────────────┴──────────────────┘
```

- **Victoria de piso:** mueren todos los drones → fanfarria, bono y `elevatorReady`.
- **Derrota:** `health ≤ 0` → `GAME_OVER` (se conservan créditos y mejoras).
- **Piso de jefe:** `piso % 5 === 0`.

---

## 2. Arena y entorno

| Propiedad | Valor |
| :--- | :--- |
| Dimensiones | 50 m (X) × 60 m (Z) |
| Muros | 10 m de alto, materiales metálicos oscuros con tiras neón |
| Suelo | plano oscuro metálico + `gridHelper` de 40 divisiones |
| Niebla | `FogExp2` densidad `0.022` con color del tema |
| Lluvia | 160 partículas cayendo a 22 m/s, reinicio en y=18 |
| Iluminación | ambient (1.8) + direccional (3.5, sombras 2048²) + hemisférica (0.8) |
| Post-proceso | Bloom `luminanceThreshold 0.8`, `intensity 0.7` |
| Cámara | FOV 65, near 0.1, far 1000, ACES Filmic, exposición 1.15 |

### Coberturas y plataformas (`ARENA_OBSTACLES`)

| ID | Posición | Tamaño | Tipo |
| :--- | :--- | :--- | :--- |
| col-0…col-3 | x ±12/±4 · z −10 / 2 | 2.8 × 2.8 × 6.0 | columna (bloquea balas) |
| col-4, col-5 | x ±11 · z 14 | 2.8 × 2.8 × 6.0 | columna trasera |
| col-6, col-7 | x ±7 · z −3 | 3.6 × 1.8 × 3.5 | barricada baja |
| jump-1, jump-2 | x ±14 · z 0 | 3.5 × 3.5 × 0.2 | **plataforma de salto** (vy 18) |

---

## 3. Jugador

| Atributo | Valor base | Origen |
| :--- | :--- | :--- |
| Armadura (PV) | 100 (mín. 50 / máx. 200 en CONFIG) | `persistentUpgrades.maxHealth` |
| Velocidad | 8.5 m/s | `persistentUpgrades.speed` |
| Daño por disparo | 25 | `persistentUpgrades.weaponDamage` |
| Cadencia | 3.5 disparos/s (intervalo 0.286 s) | `persistentUpgrades.fireRate` |
| Altura de ojos | 1.7 m | `player.current.y` |
| Bala | 54 m/s, vida 2.2 s | `Game.tsx` §4 |
| Salto | impulso 7.5, gravedad −15 | `Game.tsx` §3 |
| Dash | ×2.5 durante 0.28 s, recarga 1.2 s, **invulnerable** | `Game.tsx` §3 |
| ADS | FOV 45, velocidad ×0.6 | `Game.tsx` §1 |
| Colisión | radio 0.6 m, suelo en y=1.7 | `Game.tsx` §3 |

**Retroceso y feedback:** `recoil` decae a 6/s, fogonazo 60 ms, screen shake al recibir daño (0.3–0.4 s), hit marker 120 ms.

---

## 4. Dificultad por piso

### 4.1 Cantidad de drones

| Piso | Drones |
| :--: | --: |
| 1 | 3 |
| 2 | 4 |
| 3 | 5 |
| 4 | 9 |
| 5 (jefe) | 1 (+ refuerzos) |
| 6 | 12 |
| 7+ | `min(14, 5 + piso × 1.2)` |

### 4.2 Composición por arquetipo

| Piso | Composición |
| :--: | :--- |
| 1–2 | 100 % Exploradores |
| 3 | 50 % Kamikazes · 50 % Exploradores |
| 4–5 | 33 % Francotiradores · 33 % Kamikazes · resto Exploradores |
| 6+ | rotativo `i % 4`: Tanque · Francotirador · Kamikaze · Explorador |

### 4.3 PV y velocidad por arquetipo

`baseHp = 22 + piso × 8`

| Arquetipo | PV | Velocidad | Cadencia |
| :--- | :--- | :--- | :--: |
| Explorador | `baseHp` | 2.2 | 2.0–3.5 s |
| Kamikaze | `max(15, baseHp × 0.55)` | `4.8 + 0.15 × piso` | — (detonación) |
| Francotirador | `baseHp × 0.85` | 1.6 | ciclo 2.5 s |
| Tanque | `baseHp × 2.2` | 1.3 | 2.8 s |

Ejemplos: piso 1 → base 30 PV · piso 5 → 62 · piso 10 → 102 · piso 20 → 182.

### 4.4 Agresión progresiva

- Flanqueo: `flankIntensity = min(1, (piso − 1) / 8)` → máximo a partir del piso 9.
- Los Francotiradores usan cobertura desde el piso 3.
- Escudo del Tanque: solo aparece en formaciones desde el piso 6.

---

## 5. IA por arquetipo

### 🔵 Explorador (scout)
- Persecución directa con vector de flanqueo tangencial.
- Dispara a `16 m/s` cuando está a <28 m, cada `2.2–3.8 s`.
- **Daño:** `8 + 2 × piso`.

### 🟠 Kamikaze
- Corre en línea recta hacia el jugador.
- Pitidos (`playHoverMicroTone`) a 3 Hz lejos y **8 Hz a <8 m**.
- **Detona a <2 m**: muere y aplica **28 de daño** si el jugador está a <4 m y no está en dash.
- Efecto visual: `💥 DETONATED`.

### 🟣 Francotirador
- **Fase de cobertura (1.2 s):** busca el pilar con mejor puntuación (`distAlJugador − 1.5 × distAlPilar`) y se sitúa a 3.5 m detrás.
- **Fase de asomo (1.3 s):** se desplaza lateralmente 3 m para disparar.
- Cada 2.5 s: railgun a `65 m/s`, **32 de daño**, con `Line` de puntería visible.
- Sin cobertura (piso <3): mantiene distancia 18–28 m.

### 🛡️ Tanque
- Si está lejos (>7 m) avanza; si está cerca (<4 m) retrocede; en medio, orbita.
- Dispara **parejas** a `16 m/s` cada 2.8 s: **18 de daño**.
- **Escudo frontal de 140°** (`|Δángulo| < 1.25 rad`): impacto bloqueado + `🛡 DEFLECTED`.
- Knockback recibido: ×2 (vs ×12 de los scouts).

### 🔴 Titán de Sector (jefe)
Ver §6.

---

## 6. Jefe: Titán de Sector

| Propiedad | Fórmula / valor |
| :--- | :--- |
| Aparece en | `piso % 5 === 0` |
| PV | `450 + (piso/5 − 1) × 350` → 450 / 800 / 1150 / 1500… |
| Nombre | `SECTOR OVERLORD - CORE-05` (etc.) |
| Velocidad | 1.8 (hover sinusoidal por el centro-norte) |
| Radio de impacto | 3.0 |
| Cadencia de patrón | 2.4 s alternando 2 patrones |
| Escudo / knockback | sin knockback |

**Patrón A — Anillo radial:** 10 balas a 15 m/s en círculo rotatorio, **12 de daño** cada una, vida 3.5 s.
**Patrón B — Doble disparo pesado:** 2 proyectiles (x ±2 m) a 26 m/s, **22 de daño** cada uno, radio 0.35.

**Refuerzos por umbral**

| Umbral | Invocación |
| :--: | :--- |
| 66 % | +2 Kamikazes |
| 33 % | +1 Tanque +1 Francotirador (45 PV) |

**Escolta inicial (piso ≥ 10):** +2 Exploradores (45 PV).

**Recompensa:** 250 CR al matar + 250 CR de bono de piso + 2000 puntos.

---

## 7. Economía

### 7.1 Ingresos

| Concepto | Créditos |
| :--- | --: |
| Baja: Explorador | 15 |
| Baja: Kamikaze | 12 |
| Baja: Francotirador | 25 |
| Baja: Tanque | 30 |
| Baja: Titán | 250 |
| Bono de piso normal | `120 + 25 × piso` |
| Bono de piso de jefe | 250 |
| Saldo inicial (nuevo jugador) | 100 |

**Ejemplos de ingreso por piso**

| Piso | Bajas | Bono | Total aprox. |
| :--: | :--- | --: | --: |
| 1 | 3 × 15 = 45 | 145 | **190 CR** |
| 2 | 4 × 15 = 60 | 170 | **230 CR** |
| 3 | 3 kamikazes + 2 scouts = 66 | 195 | **261 CR** |
| 5 (jefe) | 250 | 250 | **500 CR** |
| 10 (jefe) | 250 | 250 | **500 CR** |

### 7.2 Gastos (Armería)

| Mejora | Precio | Efecto | Acumulable | Permanente |
| :--- | --: | :--- | :--: | :--: |
| Reparación de armadura | 50 | +50 PV (tope = PV máx.) | sí | ❌ solo en partida |
| Aumento de armadura máxima | 80 | +25 PV máx. y +25 PV actuales | sí | ✅ |
| Daño de núcleo plasma | 90 | +15 daño | sí | ✅ |
| Cadencia de fuego | 85 | +0.9 disparos/s | sí | ✅ |
| Propulsores cinéticos | 70 | +1.2 velocidad | sí | ✅ |

> La mejora **Imán de créditos** (+3.5 m, 60 CR) fue **retirada de la tienda**: los créditos se acreditan al instante al morir un dron, no hay monedas que recoger, así que el imán no tenía efecto.

**Curva de progresión (sin contar bajas):** 4 compras cuestan 325 CR ≈ 2 pisos iniciales. Una partida hasta el piso 10 rinde ~3.000 CR en total.

### 7.3 Puntuación

| Acción | Puntos |
| :--- | :--- |
| Baja | `150 × piso` |
| Piso limpio | `bonoCréditos × 5 + 600` (jefe: `+ 2000`) |
| Ascender | `1000 × piso anterior` |

Ejemplo: llegar al piso 5 ⇒ ~12.000+ puntos.

---

## 8. Progresión y guardado

| Dato | Clave | ¿Se pierde al morir? | ¿Se pierde al borrar datos? |
| :--- | :--- | :--: | :--: |
| Créditos | `echo_protocol_coins_v1` | ❌ | ✅ |
| Mejoras | `echo_protocol_upgrades_v1` | ❌ | ✅ |
| Idioma | `echo_protocol_lang_v1` | ❌ | ✅ |
| Mejor piso | `echo_protocol_best_floor_v1` | ❌ | ✅ |
| Tutorial visto | `echo_protocol_tutorial_completed_v1` | ❌ | ✅ |
| Piso/puntuación de la partida | — | ✅ (reinicio total) | ✅ |

**Reinicios:** `initGame()` siempre arranca en piso 1 con stats a 0 pero mantiene el saldo y las mejoras.

---

## 9. Temas visuales de sector

`getThemeForFloor(piso) = SECTOR_THEMES[(piso − 1) % 7]`. Los colores **no saltan**: se interpolan con `lerp` a 3.5 × `dt` sobre luces, neones, tiras de muro y niebla.

| # | Tema | Neón primario | Niebla |
| :-: | :--- | :--- | :--- |
| 1 | Outrun / Synthwave | `#ff007f` rosa neón | `#10031e` |
| 2 | Solar Flare | `#fbbf24` oro | `#160702` |
| 3 | Bioluminescent Abyss | `#06b6d4` aguamarina | `#021319` |
| 4 | Vapor Sunset | `#c084fc` lavanda | `#14061a` |
| 5 | Toxic Hazard | `#84cc16` ácido | `#090d08` |
| 6 | Deep Matrix / Glitch | `#059669` jade | `#01120a` |
| 7 | Blood Syndicate | `#ef4444` carmesí | `#180408` |

Cada tema define además `secondaryNeon`, `accentGlow`, `ambientLight`, `sunLight`, `hemiSky/Ground`, `gridColor`, `droneOptics`, `droneJetColor`, `droneHealthBarColor` y `bulletTrailColor`.

---

## 10. Audio

### 10.1 Música
- Pista: `grid_runner.mp3` (synthwave) desde `storage.googleapis.com`, en loop.
- Suena en `PLAYING` y `PAUSED`; volumen por defecto 0.35, muteable.

### 10.2 SFX (100 % procedurales)

| Método | Cuándo |
| :--- | :--- |
| `playArcadeLaser` | disparo del jugador |
| `playChiptuneExplosion` | dron destruido / detonación kamikaze |
| `playCoinPickup` | recompensa de crédito |
| `playPowerupChime` | compra realizada |
| `playLevelUpStinger` | ascenso / abrir tienda |
| `playVictoryFanfare` | piso limpio |
| `playDefeatMotif` | muerte del jugador |
| `playCrispClick` / `playConfirmSelect` | UI |
| `playRetroJump` | salto y dash |
| `playShieldBlock` | bala bloqueada por cobertura o escudo |
| `playMeleePunch` | impacto en dron / daño recibido |
| `playGunshotBlast` | disparos enemigos |
| `playHoverMicroTone` | alerta de kamikaze cercano |
| `playErrorBuzz` | compra fallida (reserva) |

Cada llamada aplica `vary()` (±5 % de tono) para evitar fatiga auditiva.

---

## 11. Feedback y “juice”

| Tipo | Implementación |
| :--- | :--- |
| Anticipación | pitidos del Kamikaze, láser de puntería del Francotirador, retícula que se contrae en ADS |
| Impacto | hit marker, parpadeo blanco del dron, knockback, retroceso de arma, fogonazo con luz puntual |
| Cambio de estado | screen shake al recibir daño, barra de jefe animada, banner de récord, elevador que pasa de gris a neón |
| Recompensa | textos flotantes `+15 CR`, toast de bono, fanfarria, stinger de ascenso |
| Claridad | alertas `⚠ KAMIKAZE`, `⚠ SNIPER LOCK-ON`, `🛡 HIT REAR CORE` |

---

## 12. Fórmulas rápidas (cheat sheet)

```
PV dron         = (22 + piso × 8) × {scout 1 · kamikaze 0.55 · sniper 0.85 · tank 2.2}
# drones         = piso 1→3, 2→4, 3→5, resto→min(14, 5 + piso×1.2)
Daño scout       = 8 + 2 × piso
Bono de piso     = 120 + 25 × piso        (jefe: 250)
PV jefe          = 450 + (piso/5 − 1) × 350
Intervalo disparo= 1 / fireRate
Puntos por baja  = 150 × piso
Puntos por ascenso = 1000 × piso anterior
Tema             = SECTOR_THEMES[(piso − 1) % 7]
Flanqueo         = min(1, (piso − 1) / 8)
```
