import type {SectorTheme} from './types';

// 7 DISTINCT RICH PROCEDURAL MULTI-COLOR PALETTES
export const SECTOR_THEMES: SectorTheme[] = [
  // Palette 1 (Outrun / Synthwave): Neon hot pink pillars, electric cyan floor grid, deep purple sky fog
  {
    id: 'outrun_synthwave',
    name: 'Outrun Synthwave',
    primaryNeon: '#ff007f', // Hot Pink
    secondaryNeon: '#00f0ff', // Electric Cyan
    accentGlow: '#a855f7', // Vivid Purple
    fogColor: '#10031e', // Deep purple sky fog
    ambientLight: '#2b0c3f',
    sunLight: '#ff3399',
    hemiSky: '#ff007f',
    hemiGround: '#0d021a',
    gridColor: '#00f0ff', // Electric Cyan grid
    droneOptics: '#00f0ff',
    droneJetColor: '#ff007f',
    droneHealthBarColor: '#ff007f',
    bulletTrailColor: '#ff007f',
  },
  // Palette 2 (Solar Flare / Molten Amber): Searing neon gold, fiery crimson accents, warm dark fog
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    primaryNeon: '#fbbf24', // Searing neon gold
    secondaryNeon: '#ef4444', // Fiery crimson
    accentGlow: '#f97316', // Molten orange
    fogColor: '#160702', // Warm dark fog
    ambientLight: '#381604',
    sunLight: '#fde047',
    hemiSky: '#f59e0b',
    hemiGround: '#160702',
    gridColor: '#f97316',
    droneOptics: '#38bdf8', // Ice blue contrast optics
    droneJetColor: '#ef4444',
    droneHealthBarColor: '#fbbf24',
    bulletTrailColor: '#f59e0b',
  },
  // Palette 3 (Bioluminescent Abyss): Deep aquamarine, mint green, electric turquoise highlights
  {
    id: 'bioluminescent_abyss',
    name: 'Bioluminescent Abyss',
    primaryNeon: '#06b6d4', // Deep aquamarine
    secondaryNeon: '#10b981', // Mint green
    accentGlow: '#22d3ee', // Electric turquoise
    fogColor: '#021319', // Deep abyss fog
    ambientLight: '#042833',
    sunLight: '#34d399',
    hemiSky: '#22d3ee',
    hemiGround: '#021319',
    gridColor: '#10b981',
    droneOptics: '#f43f5e', // Hot coral contrast
    droneJetColor: '#06b6d4',
    droneHealthBarColor: '#10b981',
    bulletTrailColor: '#22d3ee',
  },
  // Palette 4 (Vapor Sunset): Pastel lavender, peach orange, magenta neon strips
  {
    id: 'vapor_sunset',
    name: 'Vapor Sunset',
    primaryNeon: '#c084fc', // Pastel lavender
    secondaryNeon: '#fb923c', // Peach orange
    accentGlow: '#f472b6', // Magenta glow
    fogColor: '#14061a', // Sunset haze fog
    ambientLight: '#2c1033',
    sunLight: '#fdba74',
    hemiSky: '#e879f9',
    hemiGround: '#14061a',
    gridColor: '#fb923c',
    droneOptics: '#38bdf8',
    droneJetColor: '#f472b6',
    droneHealthBarColor: '#c084fc',
    bulletTrailColor: '#e879f9',
  },
  // Palette 5 (Toxic Hazard): Electric acid lime paired with hazard warning yellow and charcoal fog
  {
    id: 'toxic_hazard',
    name: 'Toxic Hazard',
    primaryNeon: '#84cc16', // Electric acid lime
    secondaryNeon: '#eab308', // Hazard warning yellow
    accentGlow: '#4ade80', // Emerald neon
    fogColor: '#090d08', // Charcoal toxic fog
    ambientLight: '#182410',
    sunLight: '#a3e635',
    hemiSky: '#84cc16',
    hemiGround: '#090d08',
    gridColor: '#eab308',
    droneOptics: '#ec4899', // Hot pink hazard optics
    droneJetColor: '#eab308',
    droneHealthBarColor: '#84cc16',
    bulletTrailColor: '#a3e635',
  },
  // Palette 6 (Deep Matrix / Glitch): Dark jade, pure white neon strobes, emerald scanlines
  {
    id: 'deep_matrix',
    name: 'Deep Matrix',
    primaryNeon: '#059669', // Dark Jade / Emerald
    secondaryNeon: '#ffffff', // Pure white neon strobes
    accentGlow: '#10b981', // Emerald scanlines
    fogColor: '#01120a', // Deep terminal green-black
    ambientLight: '#052b19',
    sunLight: '#ecfdf5',
    hemiSky: '#34d399',
    hemiGround: '#01120a',
    gridColor: '#10b981',
    droneOptics: '#ef4444', // Red glitch eye
    droneJetColor: '#34d399',
    droneHealthBarColor: '#10b981',
    bulletTrailColor: '#34d399',
  },
  // Palette 7 (Blood Syndicate): Deep crimson red with sharp ice-blue contrasting lights
  {
    id: 'blood_syndicate',
    name: 'Blood Syndicate',
    primaryNeon: '#ef4444', // Deep Crimson Red
    secondaryNeon: '#38bdf8', // Sharp Ice-Blue
    accentGlow: '#ff0055', // Blood neon
    fogColor: '#180408', // Dark blood fog
    ambientLight: '#380911',
    sunLight: '#7dd3fc',
    hemiSky: '#ef4444',
    hemiGround: '#180408',
    gridColor: '#38bdf8', // Sharp Ice-Blue grid
    droneOptics: '#38bdf8', // Cold ice optics
    droneJetColor: '#ef4444',
    droneHealthBarColor: '#ef4444',
    bulletTrailColor: '#ff0055',
  },
];

export function getThemeForFloor(floor: number): SectorTheme {
  const index = (Math.max(1, floor) - 1) % SECTOR_THEMES.length;
  return SECTOR_THEMES[index];
}
