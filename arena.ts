export const ARENA_WIDTH = 50;
export const ARENA_DEPTH = 60;

export interface ArenaObstacle {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color?: string;
  stripType: 'primary' | 'secondary' | 'accent';
  type?: 'wall' | 'jumppad';
}

// Tactical Cover Pillars and Structural Barriers
export const ARENA_OBSTACLES: ArenaObstacle[] = [
  // Forward & Mid Columns
  { id: 'col-0', x: -12, y: 3.0, z: -10, width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'primary' },
  { id: 'col-1', x: -4,  y: 3.0, z: 2,   width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'secondary' },
  { id: 'col-2', x: 4,   y: 3.0, z: -10, width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'accent' },
  { id: 'col-3', x: 12,  y: 3.0, z: 2,   width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'primary' },

  // Rear Flank Columns
  { id: 'col-4', x: -11, y: 3.0, z: 14,  width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'secondary' },
  { id: 'col-5', x: 11,  y: 3.0, z: 14,  width: 2.8, depth: 2.8, height: 6.0, color: '#1e293b', stripType: 'accent' },

  // Midfield Fortified Barricades (Low cover)
  { id: 'col-6', x: -7,  y: 1.75, z: -3, width: 3.6, depth: 1.8, height: 3.5, color: '#0f172a', stripType: 'secondary' },
  { id: 'col-7', x: 7,   y: 1.75, z: -3, width: 3.6, depth: 1.8, height: 3.5, color: '#0f172a', stripType: 'primary' },

  // Jump Pads for vertical escape
  { id: 'jump-1', x: -14, y: 0.1, z: 0, width: 3.5, depth: 3.5, height: 0.2, color: '#f59e0b', stripType: 'accent', type: 'jumppad' },
  { id: 'jump-2', x: 14, y: 0.1, z: 0, width: 3.5, depth: 3.5, height: 0.2, color: '#f59e0b', stripType: 'accent', type: 'jumppad' },
];
