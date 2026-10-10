/**
 * Configuración expuesta al host de Playground.
 *
 * Solo se mantienen los parámetros que el juego lee realmente mediante
 * `getConfig(...)`: así ningún slider del panel de configuración promete un
 * efecto que no existe (BUG-009) y no queda configuración muerta (BUG-006).
 * El esquema público para el host está en `playground_config.json`.
 */
export const CONFIG = {
  // --- Camera ---
  fov: {
    value: 65,
    type: 'number',
    label: 'Field of View',
    group: 'Camera',
    min: 40,
    max: 95,
    step: 5,
  },

  // --- Rules & Gameplay ---
  floorCompletionBonus: {
    value: 120,
    type: 'number',
    label: 'Floor Clear Bonus Coins',
    group: 'Rules',
    min: 50,
    max: 300,
    step: 10,
  },

  // --- Visuals & Theme ---
  ambientIntensity: {
    value: 1.8,
    type: 'number',
    label: 'Ambient Intensity',
    group: 'Visuals',
    min: 0.5,
    max: 4.0,
    step: 0.1,
  },
  sunIntensity: {
    value: 3.5,
    type: 'number',
    label: 'Sun Intensity',
    group: 'Visuals',
    min: 1.0,
    max: 8.0,
    step: 0.2,
  },
  hemiIntensity: {
    value: 0.8,
    type: 'number',
    label: 'Hemisphere Intensity',
    group: 'Visuals',
    min: 0.1,
    max: 2.0,
    step: 0.1,
  },

  // --- Physics ---
  gravity: {
    value: -15.0,
    type: 'number',
    label: 'Gravity',
    group: 'Physics',
    min: -30,
    max: 0,
    step: 0.5,
  },

  // --- Audio ---
  defaultMusicVolume: {
    value: 0.35,
    type: 'number',
    label: 'Default Music Volume',
    group: 'Audio',
    min: 0,
    max: 1,
    step: 0.05,
  },
  backgroundMusicUrl: {
    value:
      'https://storage.googleapis.com/assets-gen-playground/musiclibrary/grid_runner.mp3',
    type: 'string',
    label: 'Background Music URL',
    group: 'Audio',
  },
};

const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

export type ConfigKey = keyof typeof CONFIG;

export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}
