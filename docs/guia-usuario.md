# 02 · Guía de Usuario — ECHO PROTOCOL

**Para:** jugadores y usuarios finales · **Idioma:** Español · Índice: [`docs/README.md`](./README.md)

---

## 1. ¿Qué es Echo Protocol?

Un **FPS 3D en primera persona** que corre en tu navegador. Eres un Operativo cibernético que debe pacificar sectores infinitos tomados por enjambres de drones rebeldes: eliminas la oleada, cobras créditos, subes al elevador, compras mejoras permanentes y asciendes al siguiente piso. Cada **5 pisos** aparece un **Titán de Sector**, un jefe masivo con ataques radiales y refuerzos.

No hay final: el objetivo es llegar lo más lejos posible y batir tu récord.

---

## 2. Requisitos y primeros pasos

### 2.1 Requisitos

| Elemento | Mínimo recomendado |
| :--- | :--- |
| Navegador | Chrome / Edge / Firefox / Safari actuales con **WebGL2** |
| Node.js | ≥ 20.19 (solo si lo ejecutas en local; v22/v24 LTS recomendado) |
| Conexión | Necesaria la primera vez para la música de fondo (MP3 remoto) |
| Input | Ratón + teclado **o** pantalla táctil |
| Pantalla | Desde 360 px de ancho (móvil) hasta 4K |

### 2.2 Jugar en local

```bash
npm install
npm run dev       # abre http://localhost:5173
```

Para una versión compilada:

```bash
npm run build
npm run preview
```

### 2.3 Primer arranque

1. **Elige tu idioma** — English o Español.
2. **Slide 1 · Informe de misión** — qué encontrarás en los sectores.
3. **Slide 2 · Controles de combate** — moverse, apuntar, disparar, saltar.
4. **Slide 3 · Economía y Armería** — cómo se ganan y se gastan los créditos.
5. Botón **“¡EMPEZAR! / GOT IT”** → menú principal → **JUGAR / DESPLEGAR**.

Este tutorial solo aparece la primera vez. Puedes repetirlo desde **Ajustes → Repetir introducción/guía** o desde **Cómo jugar**.

---

## 3. Controles

### 3.1 Escritorio

| Acción | Tecla / botón |
| :--- | :--- |
| Moverse | `W` `A` `S` `D` o Flechas |
| Apuntar | Mover el ratón (clic en el juego para fijar el puntero) |
| Disparar | **Clic izquierdo** (mantén para fuego continuo) |
| Apuntar con mira (ADS) | **Clic derecho** (mantén) |
| Saltar | `Espacio` |
| Dash cinético | `Shift` mientras te mueves |
| Pausa / menú | `Escape` |

> 💡 Si pierdes el control del puntero, haz clic sobre el área de juego para volver a bloquearlo. También puedes apuntar arrastrando el ratón sin bloquear.

### 3.2 Móvil y tablet

| Acción | Control |
| :--- | :--- |
| Moverse | D-pad virtual (inferior izquierda) |
| Apuntar | Arrastrar el dedo por la parte derecha de la pantalla |
| Disparar | Botón grande **FIRE** |
| Saltar | Botón **JUMP** |
| Dash cinético | Botón **DASH** |
| Apuntar con mira (ADS) | Botón **ADS** (mantener) |
| Entrar a la Armería | Botón **ARMORY** (aparece al limpiar el piso) |

### 3.3 Trucos de movimiento

- **Dash** durante 0.28 s a ×2.5 de velocidad y te hace **invulnerable** a las balas: úsalo para cruzar líneas de tiro o atravesar Kamikazes.
- Las **plataformas naranjas** del suelo te lanzan ~18 m/s hacia arriba: sálvalas para escapar de un acorralamiento.
- Las **barricadas bajas** y los **pilares** bloquean balas: la mayoría de los proyectiles enemigos se estrellan contra ellos.
- Apuntar con mira reduce tu velocidad al 60%: úsalo para ajustar tiros, no para huir.

---

## 4. La pantalla de juego (HUD)

```
┌──────────────────────────────────────────────────────────┐
│ [ARMOR ▓▓▓▓▓░ 86/100]  FL-03  RÉCORD FL-07  ⚡450 CR  👾5  ★12,300   [☰] │
├──────────────────────────────────────────────────────────┤
│                    ┌ barra del jefe ┐                     │
│                         ◎ retícula                       │
│                                                          │
│                     arena 3D (canvas)                    │
│                                                          │
│        [controles táctiles, solo en móvil]               │
└──────────────────────────────────────────────────────────┘
```

| Elemento | Significado |
| :--- | :--- |
| **Barra de armadura** | Tu vida. Llega a 0 y la misión termina. |
| **FL-xx / RÉCORD** | Piso actual y tu mejor piso histórico. |
| **⚡ CR** | Créditos cibernéticos (saldo permanente). |
| **👾 hostiles** | Drones que quedan en el piso. |
| **★ puntuación** | Puntos de la partida actual. |
| **Retícula** | Se expande/marca en rojo al acertar (hit marker). |
| **Barra roja superior** | Solo aparece con el jefe: nombre + PV del Titán. |
| **Avisos de piso 1** | Fila superior con recordatorios de controles. |
| **Franja inferior** | Atajos de teclado (solo escritorio). |

---

## 5. Flujo de una partida

1. **Despliegue** — empiezas en el piso 1 con una oleada pequeña (3 Exploradores).
2. **Combate** — elimina a todos los drones. Cada baja paga créditos al instante.
3. **Sector asegurado** — fanfarria, bono de piso y el **elevador** se enciende al fondo de la arena (zona norte).
4. **Armería** — acércate al elevador (o toca ARMORY en móvil) y compra mejoras.
5. **Ascenso** — “ASCENDER AL SIGUIENTE PISO”: nueva paleta de color, más drones y más PV.
6. **Piso 5, 10, 15…** — **Titán de Sector**: aparta, esquiva el anillo radial y aprovecha los refuerzos para puntuar.
7. **Derrota** — pantalla con tu récord y opción de reintentar.

---

## 6. Enemigos y cómo vencerlos

| Drone | Se le ve venir así | Cómo derrotarlo |
| :--- | :--- | :--- |
| 🔵 **Explorador** | Flota recto hacia ti y dispara ráfagas | Tiro limpio; usa pilares para recargar calor/frío |
| 🟠 **Kamikaze** | Nariz afilada, **pitidos que se aceleran** | Derríbalo antes de 2 m o dashéalo (invulnerable) |
| 🟣 **Francotirador** | Láser de puntería roja y se esconde tras pilares | Rompe la línea de visión; castígalo cuando asome |
| 🛡️ **Tanque** | Blindaje pesado con escudo frontal brillante | **Flanquéalo**: solo el reactor trasero recibe daño |
| 🔴 **Titán** | Barra roja con nombre, hovering lento | Muévete siempre, usa plataformas de salto, limpia invocaciones |

**Avisos en pantalla:** `⚠ KAMIKAZE INCOMING`, `⚠ SNIPER LOCK-ON` y `🛡 SHIELDED TANK - HIT REAR CORE` te avisan del peligro inmediato.

---

## 7. La Armería (tienda)

Se abre al limpiar un piso (elevador) o desde el menú principal (**ARMORY / SHOP**).

| Mejora | Precio | Efecto | ¿Permanente? |
| :--- | --: | :--- | :--: |
| 🩹 Reparación de armadura | **50** | +50 PV de inmediato | No (solo en partida) |
| 🛡️ Aumento de armadura máxima | **80** | +25 PV máximos | ✅ Sí |
| 🔴 Daño de núcleo plasma | **90** | +15 de daño por disparo | ✅ Sí |
| 🔥 Cadencia de fuego | **85** | +0.9 disparos por segundo | ✅ Sí |
| 🚀 Propulsores cinéticos | **70** | +1.2 de velocidad | ✅ Sí |
| 🧲 Imán de créditos | **60** | +3.5 m de radio de atracción | ✅ Sí ⚠️ *sin efecto efectivo hoy* |

**Consejos de compra:**

- Primeras compras recomendadas: **Cadencia** y **Daño** (matas antes, recibes menos tiros).
- **Armadura máxima** es la mejor inversión a largo plazo para llegar a pisos altos.
- Empiezas con **100 créditos** de bienvenida; limpiar el piso 1 rinde **~190 créditos** en total (45 de bajas + 145 de bono).
- **No malgastes** en Reparación si vas a ascender: el elevador es tu pausa segura.

---

## 8. Puntuación y récords

| Acción | Puntos |
| :--- | :--- |
| Bajar un dron | `150 × piso` |
| Limpiar un piso | `bono de créditos × 5 + 600` (2000 si era jefe) |
| Ascender de piso | `1000 × piso anterior` |

El **mejor piso** se guarda en tu navegador y muestra la estrella **★ NUEVO RÉCORD ★** cuando lo superas. La puntuación de la partida se reinicia en cada despliegue.

---

## 9. Ajustes

**AJUSTES · SYSTEM SETTINGS**

- **IDIOMA** — English / Español (cambio inmediato).
- **VOLUMEN DE MÚSICA** — 0 a 1 (por defecto 0.35).
- **VOLUMEN DE EFECTOS** — 0 a 1 (por defecto 0.6).
- **SILENCIAR TODO EL AUDIO** — mute global.
- **REPETIR INTRODUCCIÓN / GUÍA** — vuelve a ver el onboarding.
- **GUARDAR Y CERRAR** — los cambios ya se aplicaron en vivo.

---

## 10. Preguntas frecuentes (FAQ)

**¿Se guarda mi progreso?**
Sí, en el almacenamiento local del navegador: créditos, mejoras, idioma, mejor piso y si ya viste el tutorial. No se sincroniza entre dispositivos ni sobrevive a “borrar datos del sitio”.

**¿Pierdo las mejoras si muero?**
No. Solo pierdes el avance del piso en curso; los créditos ganados y las mejoras compradas se conservan.

**¿Hay límite de pisos?**
No, es infinito. La dificultad crece hasta un máximo de 14 drones por oleada, pero sus PV y daño siguen escalando.

**¿Por qué no puedo disparar?**
Comprueba que no estés en un menú o en la tienda. En escritorio, haz clic sobre el juego para fijar el puntero. En móvil, usa el botón FIRE.

**¿El sonido no arranca?**
Los navegadores exigen un primer gesto: haz clic/tap una vez. Si está en silencio, revisa **Ajustes → SILENCIAR TODO EL AUDIO**.

**¿Se puede jugar con mando?**
No está implementado. Solo teclado+ratón y controles táctiles.

**¿Funciona en móvil?**
Sí, con controles en pantalla. Recomendado en horizontal. Los botones de dash y ADS no existen todavía en táctil.

**¿Cómo reinicio todo desde cero?**
Borra los datos del sitio del navegador (claves `echo_protocol_*`) y recarga la página.

---

## 11. Solución de problemas

| Síntoma | Causa probable | Solución |
| :--- | :--- | :--- |
| Pantalla negra / no arranca | WebGL deshabilitado o driver antiguo | Actualiza el navegador y habilita aceleración por hardware |
| El ratón no gana el control | Pointer Lock denegado | Haz clic en el área de juego; cierra otras pestañas |
| FPS bajos | GPU integrada + Bloom + sombras | Reduce la resolución de pantalla o cierra otras apps |
| Sin audio | Bloqueo de autoplay | Haz clic una vez en la página |
| La música no suena | Fallo de red al descargar el MP3 | Comprueba tu conexión (el juego funciona igual sin música) |
| Perdí mis créditos | Se limpiaron los datos del sitio | No hay recuperación: se guardan localmente |
| Los textos aparecen en inglés | Idioma guardado | Ajustes → IDIOMA → Español |

---

## 12. Buenas prácticas para llegar lejos

1. **Conserva el dash**: es tu única invulnerabilidad real. No lo gastes para avanzar.
2. **Mata primero a los Kamikazes**: su daño en área ignora tu armadura barata.
3. **Usa los pilares contra Francotiradores**: el láser rojo te avisa, el pilar te salva.
4. **Gira alrededor de los Tanques** en lugar de retroceder: el escudo frontal es absoluto.
5. **Sube de plataforma** cuando te rodeen: en el aire eres difícil de acertar y ganas tiempo.
6. **Compra Cadencia + Daño antes que vida** en los primeros pisos; la vida escala mejor más tarde.
7. **En el jefe**: muévete en círculos, no hacia atrás (te acercas al anillo radial) ni hacia delante (doble disparo pesado).

---

*Buena suerte, Operativo. Asciende por el núcleo y pacifica los enjambres rebeldes.* 🌌
