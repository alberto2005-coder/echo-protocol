/**
 * Punto de re-exportación de utilidades comunes.
 *
 * Solo se mantienen los símbolos que realmente se consumen desde fuera de
 * `utils/` (`gameAudio` en `App.tsx`/`Game.tsx`, `randomRange` en `Game.tsx`
 * y `waves.ts`). El resto de helpers heredados fueron retirados como código
 * muerto.
 */
export {gameAudio, useIsMobile} from './utils/helper';

/** Rango aleatorio continuo en `[min, max)`. */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
