/**
 * Congela geometría de la arena: dimensiones, cobertura y jump pads.
 */
import {describe, expect, it} from 'vitest';
import {ARENA_DEPTH, ARENA_OBSTACLES, ARENA_WIDTH} from '../arena';

describe('dimensiones', () => {
  it('la arena mide 50 x 60', () => {
    expect(ARENA_WIDTH).toBe(50);
    expect(ARENA_DEPTH).toBe(60);
  });
});

describe('ARENA_OBSTACLES', () => {
  it('hay 10 obstáculos (8 columnas + 2 jump pads)', () => {
    expect(ARENA_OBSTACLES).toHaveLength(10);
  });

  it('los id son únicos', () => {
    const ids = ARENA_OBSTACLES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo queda dentro de los límites de la arena', () => {
    for (const o of ARENA_OBSTACLES) {
      expect(Math.abs(o.x) + o.width / 2, `${o.id}.x`).toBeLessThanOrEqual(ARENA_WIDTH / 2);
      expect(Math.abs(o.z) + o.depth / 2, `${o.id}.z`).toBeLessThanOrEqual(ARENA_DEPTH / 2);
    }
  });

  it('las dimensiones son positivas', () => {
    for (const o of ARENA_OBSTACLES) {
      expect(o.width, `${o.id}.width`).toBeGreaterThan(0);
      expect(o.depth, `${o.id}.depth`).toBeGreaterThan(0);
      expect(o.height, `${o.id}.height`).toBeGreaterThan(0);
    }
  });

  it('hay exactamente 2 jump pads, ambos en el suelo', () => {
    const pads = ARENA_OBSTACLES.filter((o) => o.type === 'jumppad');
    expect(pads).toHaveLength(2);
    for (const p of pads) {
      expect(p.y).toBeLessThan(1);
      expect(Math.abs(p.x)).toBe(14);
    }
    // el resto no está marcado como jump pad
    expect(ARENA_OBSTACLES.filter((o) => o.type !== 'jumppad')).toHaveLength(8);
  });

  it('los stripType son valores válidos del tema', () => {
    const valid = ['primary', 'secondary', 'accent'];
    for (const o of ARENA_OBSTACLES) {
      expect(valid, `${o.id}.stripType`).toContain(o.stripType);
    }
  });

  it('las columnas de cobertura tienen entre 3 y 6 de alto', () => {
    const columns = ARENA_OBSTACLES.filter((o) => o.id.startsWith('col-'));
    expect(columns).toHaveLength(8);
    for (const c of columns) {
      expect(c.height).toBeGreaterThanOrEqual(3);
      expect(c.height).toBeLessThanOrEqual(6);
    }
  });
});
