import {MusicTrack} from './utils/helper';

/** Game configuration schema. */
export const CONFIG = {
  // --- Game ---
  title: {
    value: 'Echo Protocol',
    type: 'string',
    label: 'Game Title',
    group: 'Game',
  },
  baseCanvasWidth: {
    value: 1280,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'Game',
  },
  baseCanvasHeight: {
    value: 720,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'Game',
  },

  // --- Rules & Gameplay ---
  playerStartingHealth: {
    value: 100,
    type: 'number',
    label: 'Player Health',
    group: 'Rules',
    min: 50,
    max: 200,
    step: 10,
  },
  basePlayerSpeed: {
    value: 8.0,
    type: 'number',
    label: 'Player Movement Speed',
    group: 'Rules',
    min: 4.0,
    max: 14.0,
    step: 0.5,
  },
  baseWeaponDamage: {
    value: 25,
    type: 'number',
    label: 'Base Weapon Damage',
    group: 'Rules',
    min: 10,
    max: 60,
    step: 5,
  },
  baseDroneHealth: {
    value: 40,
    type: 'number',
    label: 'Base Drone Health',
    group: 'Rules',
    min: 20,
    max: 100,
    step: 5,
  },
  droneSpeed: {
    value: 3.5,
    type: 'number',
    label: 'Drone Speed',
    group: 'Rules',
    min: 1.5,
    max: 7.0,
    step: 0.5,
  },
  floorCompletionBonus: {
    value: 120,
    type: 'number',
    label: 'Floor Clear Bonus Coins',
    group: 'Rules',
    min: 50,
    max: 300,
    step: 10,
  },

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
  cameraX: {
    value: 0,
    type: 'number',
    label: 'Camera X',
    group: 'Camera',
  },
  cameraY: {
    value: 14,
    type: 'number',
    label: 'Camera Y',
    group: 'Camera',
  },
  cameraZ: {
    value: 14,
    type: 'number',
    label: 'Camera Z',
    group: 'Camera',
  },

  // --- Visuals & Theme ---
  backgroundColor: {
    value: '#060814',
    type: 'color',
    label: 'Background Color',
    group: 'Visuals',
  },
  primaryColor: {
    value: '#00f0ff',
    type: 'color',
    label: 'Primary Neon Color',
    group: 'Visuals',
  },
  fontFamily: {
    value: 'monospace',
    type: 'string',
    label: 'Font Family',
    group: 'Visuals',
  },
  ambientColor: {
    value: '#152238',
    type: 'color',
    label: 'Ambient Light Color',
    group: 'Visuals',
  },
  ambientIntensity: {
    value: 1.8,
    type: 'number',
    label: 'Ambient Intensity',
    group: 'Visuals',
    min: 0.5,
    max: 4.0,
    step: 0.1,
  },
  sunColor: {
    value: '#38bdf8',
    type: 'color',
    label: 'Sun Color',
    group: 'Visuals',
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
  hemiSkyColor: {
    value: '#00f0ff',
    type: 'color',
    label: 'Hemisphere Sky Color',
    group: 'Visuals',
  },
  hemiGroundColor: {
    value: '#2e1065',
    type: 'color',
    label: 'Hemisphere Ground Color',
    group: 'Visuals',
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

  // --- Physics & System ---
  gravity: {
    value: -15.0,
    type: 'number',
    label: 'Gravity',
    group: 'Physics',
    min: -30,
    max: 0,
    step: 0.5,
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'System',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'System',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'System',
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
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'Audio',
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

export const AVAILABLE_MUSIC_TRACKS: readonly MusicTrack[] = [
  {
    name: 'grid_runner',
    url: 'https://storage.googleapis.com/assets-gen-playground/musiclibrary/grid_runner.mp3',
    description: 'Cyberpunk synthwave battle theme',
  },
];
