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

Además, en la raíz del proyecto:

- [`../README.md`](../README.md) — presentación y arranque rápido (EN).
- [`../README.es.md`](../README.es.md) — presentación y arranque rápido (ES).
- [`../CHANGELOG.md`](../CHANGELOG.md) — historial de versiones.
- [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) — licencias de terceros verificadas.
- [`../LICENSE`](../LICENSE) — licencia propietaria de ECHO PROTOCOL (EN / ES).
- [`../design/game_design_document.legacy.json`](../design/game_design_document.legacy.json) — documento de diseño histórico (GDD de otra variante).

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
| `npm test` | ✅ **67/67** (Vitest, jsdom) |
| `npm run build` | ✅ Correcto — ruta crítica **~95 kB gzip** (menú/onboarding); el motor 3D (~1.13 MB gzip) se descarga bajo demanda |
| `npm run lint` | ✅ 0 errores · 0 avisos |
| `npx tsc -b` | ✅ 0 errores con `strict: true` |
| CI | ✅ `.github/workflows/ci.yml` (lint → test → build) |
| Prueba manual | ✅ Menú → tutorial → combate → jefe (piso 5) → tienda → ascenso |

> La deuda técnica que queda (re-render por frame durante el combate, pools de entidades, música remota) está descrita en la [guía de desarrollador §7.2](./guia-desarrollador.md) y se registra en [`../CHANGELOG.md`](../CHANGELOG.md).

---

## 📖 Convenciones de esta documentación

- **IDs de requisito**: `FR-###` (funcionales), `NFR-###` (no funcionales), `US-##` (historias de usuario).
- **Prioridad**: `Must` (imprescindible) · `Should` (importante) · `Could` (deseable).
- Toda afirmación sobre comportamiento incluye el archivo y, cuando es relevante, la línea aproximada donde ocurre.
- Los valores numéricos (daños, precios, PV) son los vigentes en el código fuente en la fecha de verificación; la fuente de verdad es [`sistemas-juego.md`](./sistemas-juego.md).
