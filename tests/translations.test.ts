/**
 * Paridad EN/ES: si alguien añade una clave a un idioma y olvida la otra,
 * el juego saldría con `undefined` en pantalla. Este test lo impide.
 */
import {describe, expect, it} from 'vitest';
import {TRANSLATIONS} from '../translations';

const en = TRANSLATIONS.en;
const es = TRANSLATIONS.es;
const enKeys = Object.keys(en);
const esKeys = Object.keys(es);

describe('TRANSLATIONS · paridad de idiomas', () => {
  it('EN y ES tienen exactamente las mismas claves', () => {
    expect(enKeys.sort()).toEqual(esKeys.sort());
  });

  it('el recuento de claves es el esperado (103 por idioma)', () => {
    expect(enKeys).toHaveLength(103);
    expect(esKeys).toHaveLength(103);
  });

  it('no hay claves vacías ni sin traducir', () => {
    for (const k of enKeys) expect(String(en[k as keyof typeof en]).trim(), `en.${k}`).not.toBe('');
    for (const k of esKeys) expect(String(es[k as keyof typeof es]).trim(), `es.${k}`).not.toBe('');
  });

  it('todos los valores son strings', () => {
    for (const k of enKeys) expect(typeof en[k as keyof typeof en], `en.${k}`).toBe('string');
    for (const k of esKeys) expect(typeof es[k as keyof typeof es], `es.${k}`).toBe('string');
  });

  it('las claves retiradas del imán ya no existen (BUG-001)', () => {
    expect(enKeys).not.toContain('creditMagnet');
    expect(enKeys).not.toContain('creditMagnetDesc');
    expect(esKeys).not.toContain('creditMagnet');
    expect(esKeys).not.toContain('creditMagnetDesc');
  });

  it('las claves esenciales del HUD están en ambos idiomas', () => {
    const required = [
      'gameTitle',
      'play',
      'shop',
      'settings',
      'credits',
      'musicVolume',
      'sfxVolume',
      'settingsTitle',
      'bossDefeated',
      'armorRepair',
      'platingBoost',
      'plasmaCore',
      'overclockSights',
      'kineticThrusters',
    ];
    for (const k of required) {
      expect(enKeys, `falta en EN: ${k}`).toContain(k);
      expect(esKeys, `falta en ES: ${k}`).toContain(k);
    }
  });
});
