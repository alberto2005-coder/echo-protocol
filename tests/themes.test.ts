/**
 * Congela las 7 paletas de sector y el ciclo de selección por piso.
 */
import {describe, expect, it} from 'vitest';
import {SECTOR_THEMES, getThemeForFloor} from '../themes';

const HEX = /^#[0-9a-fA-F]{6}$/;

const COLOR_FIELDS = [
  'primaryNeon',
  'secondaryNeon',
  'accentGlow',
  'fogColor',
  'ambientLight',
  'sunLight',
  'hemiSky',
  'hemiGround',
  'gridColor',
  'droneOptics',
  'droneJetColor',
  'droneHealthBarColor',
  'bulletTrailColor',
] as const;

describe('SECTOR_THEMES', () => {
  it('hay exactamente 7 paletas', () => {
    expect(SECTOR_THEMES).toHaveLength(7);
  });

  it('los id son únicos y no vacíos', () => {
    const ids = SECTOR_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(SECTOR_THEMES.length);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });

  it('todos los colores son hexadecimales de 6 dígitos', () => {
    for (const theme of SECTOR_THEMES) {
      for (const field of COLOR_FIELDS) {
        expect(theme[field], `${theme.id}.${field}`).toMatch(HEX);
      }
    }
  });

  it('cada paleta tiene nombre propio', () => {
    const names = SECTOR_THEMES.map((t) => t.name);
    expect(new Set(names).size).toBe(SECTOR_THEMES.length);
    for (const n of names) expect(n.trim().length).toBeGreaterThan(0);
  });
});

describe('getThemeForFloor', () => {
  it('el piso 1 usa la primera paleta', () => {
    expect(getThemeForFloor(1).id).toBe(SECTOR_THEMES[0].id);
  });

  it('recorre las 7 paletas en orden', () => {
    const cycle = [1, 2, 3, 4, 5, 6, 7].map((f) => getThemeForFloor(f).id);
    expect(cycle).toEqual(SECTOR_THEMES.map((t) => t.id));
  });

  it('el piso 8 vuelve a la primera (ciclo de 7)', () => {
    expect(getThemeForFloor(8).id).toBe(SECTOR_THEMES[0].id);
    expect(getThemeForFloor(14).id).toBe(SECTOR_THEMES[0].id);
    expect(getThemeForFloor(13).id).toBe(SECTOR_THEMES[6].id);
  });

  it('pisos 0 o negativos caen en la primera paleta', () => {
    expect(getThemeForFloor(0).id).toBe(SECTOR_THEMES[0].id);
    expect(getThemeForFloor(-3).id).toBe(SECTOR_THEMES[0].id);
  });

  it('siempre devuelve una paleta definida', () => {
    for (let floor = -2; floor <= 40; floor++) {
      const theme = getThemeForFloor(floor);
      expect(theme, `piso ${floor}`).toBeDefined();
      expect(SECTOR_THEMES.map((t) => t.id)).toContain(theme.id);
    }
  });
});
