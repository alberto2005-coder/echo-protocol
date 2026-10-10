/**
 * Guardas de mantenibilidad: sin dependencias que el código no usa (BUG-006)
 * y sin parámetros de configuración que no se conectan al juego (BUG-009).
 */
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {CONFIG} from '../constants';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel: string) => JSON.parse(readFileSync(resolve(root, rel), 'utf8'));

describe('package.json', () => {
  const pkg = readJson('package.json');

  it('solo declara las dependencias de runtime que se importan', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      '@react-three/drei',
      '@react-three/fiber',
      '@react-three/postprocessing',
      '@react-three/rapier',
      'lucide-react',
      'react',
      'react-dom',
      'three',
    ]);
  });

  it('no vuelve a aparecer código muerto retirado (BUG-006)', () => {
    const declared = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)];
    for (const dead of ['phaser', 'framer-motion', 'camera-controls', 'stats-gl']) {
      expect(declared, dead).not.toContain(dead);
    }
  });
});

describe('CONFIG', () => {
  const schema = readJson('playground_config.json');

  it('todos los parámetros del esquema existen en CONFIG (BUG-009)', () => {
    for (const entry of schema.schema) {
      expect(Object.keys(CONFIG), entry.name).toContain(entry.name);
    }
    for (const key of Object.keys(schema.values)) {
      expect(Object.keys(CONFIG), key).toContain(key);
    }
  });

  it('no quedan parámetros muertos en CONFIG (BUG-006)', () => {
    expect(Object.keys(CONFIG).sort()).toEqual([
      'ambientIntensity',
      'backgroundMusicUrl',
      'defaultMusicVolume',
      'floorCompletionBonus',
      'fov',
      'gravity',
      'hemiIntensity',
      'sunIntensity',
    ]);
  });
});
