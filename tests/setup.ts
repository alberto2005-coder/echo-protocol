/**
 * Entorno jsdom para los tests de ECHO PROTOCOL.
 * jsdom no implementa matchMedia, Audio, ResizeObserver ni Pointer Lock,
 * así que los sustituimos por dobles mínimos y silenciosos.
 */
import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// --- matchMedia (usado por useIsMobile) -------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// --- HTMLMediaElement (BackgroundMusic) -------------------------------------
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

// --- AudioContext: no existe en jsdom; gameAudio lo tolera (ensure() → null)
// Se deja sin definir a propósito: GameAudio.ensure() devuelve null y ningún
// SFX se emite durante los tests.

// --- ResizeObserver / requestAnimationFrame ---------------------------------
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverStub,
});

if (!('requestAnimationFrame' in window)) {
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// --- Pointer Lock (no soportado por jsdom) ----------------------------------
Object.defineProperty(Element.prototype, 'requestPointerLock', {
  writable: true,
  value: vi.fn(),
});

// Silencia el ruido de jsdom (postMessage del SDK, etc.) sin ocultar errores
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const first = String(args[0] ?? '');
  if (first.includes('Not implemented') || first.includes('act(')) return;
  originalError(...args);
};
