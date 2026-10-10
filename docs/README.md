# 📚 Documentación de ECHO PROTOCOL

**Idioma de esta documentación:** Español · [README general en inglés](../README.md)

Este directorio contiene la documentación completa del proyecto **ECHO PROTOCOL** (Protocólo Echo), un FPS 3D cyberpunk para navegador construido con React + Three.js.

---

## 🗺️ Mapa de la documentación

| # | Documento | Dirigido a | Contenido |
| :--: | :--- | :--- | :--- |
| 01 | [Requisitos funcionales](./requisitos-funcionales.md) | Producto, QA, negocio | Requisitos FR/NFR con IDs, historias de usuario, criterios de aceptación y trazabilidad al código |
| 02 | [Guía de usuario](./guia-usuario.md) | Jugadores / usuarios finales | Requisitos de sistema, instalación, controles, HUD, tienda, enemigos, consejos, FAQ y solución de problemas |
| 03 | [Guía de desarrollador](./guia-desarrollador.md) | Equipo técnico | Setup, arquitectura, flujo del bucle de juego, convenciones, guía paso a paso para extender el juego |
| 04 | [Referencia de API](./api-referencia.md) | Equipo técnico | Módulos, exports, tipos, hooks, claves de `CONFIG`, `localStorage` y traducciones |
| 05 | [Sistemas de juego](./sistemas-juego.md) | Diseño / desarrollo | Tablas de balanceo, IA por arquetipo, economía, fases del jefe, temas visuales y audio |
| 06 | [Problemas conocidos](./problemas-conocidos.md) | Equipo técnico | Incidencias abiertas y deuda técnica, con severidad y ubicación en el código |

Además, en la raíz del proyecto:

- [`../README.md`](../README.md) — presentación y arranque rápido (EN).
- [`../README.es.md`](../README.es.md) — presentación y arranque rápido (ES).
- [`../CHANGELOG.md`](../CHANGELOG.md) — historial de versiones.
- [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) — licencias de terceros.
- [`../design/game_design_document.json`](../design/game_design_document.json) — documento de diseño original (GDD).

---

## 🎯 Resumen del producto

| Campo | Valor |
| :--- | :--- |
| **Título** | Echo Protocol (`game.json`) |
| **Género** | FPS 3D en primera persona, arena por oleadas, sin fin |
| **Plataforma** | Navegador web (desktop y móvil) |
| **Modo** | Un jugador |
| **Victoria** | Limpiar todos los drones del piso y ascender indefinidamente |
| **Derrota** | La integridad de la armadura llega a 0 |
| **Arte** | Cyberpunk neón |
| **Idiomas** | Inglés y Español (interfaz y textos en juego) |
| **Estado** | `completed` — jugable de extremo a extremo |
| **Persistencia** | `localStorage` (créditos, mejoras, idioma, mejor piso, tutorial) |

---

## ✅ Estado de verificación (2026-10-10)

| Comando | Resultado |
| :--- | :--- |
| `npm install` | ✅ Correcto |
| `npm run build` | ✅ Correcto — `dist/`: HTML 0.46 kB · CSS 27.73 kB · JS 3,618.87 kB (1,219.95 kB gzip) |
| `npm run lint` | ✅ 0 errores · 17 avisos |
| Prueba manual | ✅ Menú → tutorial → combate → jefe (piso 5) → tienda → ascenso |

> Los avisos de lint, las incidencias detectadas y las mejoras pendientes están registrados en [Problemas conocidos](./problemas-conocidos.md).

---

## 📖 Convenciones de esta documentación

- **IDs de requisito**: `FR-###` (funcionales), `NFR-###` (no funcionales), `US-##` (historias de usuario), `BUG-##` (incidencias).
- **Prioridad**: `Must` (imprescindible) · `Should` (importante) · `Could` (deseable).
- Toda afirmación sobre comportamiento incluye el archivo y, cuando es relevante, la línea aproximada donde ocurre.
- Los valores numéricos (daños, precios, PV) son los vigentes en el código fuente en la fecha de verificación; la fuente de verdad es [`sistemas-juego.md`](./sistemas-juego.md).
