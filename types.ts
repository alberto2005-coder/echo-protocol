export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Position3D = [number, number, number];

export interface Entity3D {
  id: string | number;
  type?: string;
  position: Vec3 | Position3D;
  rotation?: Vec3 | Position3D;
  scale?: Vec3 | Position3D;
  velocity?: Vec3;
  active?: boolean;
  health?: number;
  maxHealth?: number;
  [key: string]: any;
}

export interface Particle {
  id: string | number;
  position: Vec3 | Position3D;
  velocity?: Vec3 | Position3D;
  life: number;
  maxLife: number;
  color?: string;
  size?: number;
  [key: string]: any;
}

export type DroneType = 'scout' | 'kamikaze' | 'tank' | 'sniper' | 'boss';

export interface DroneEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  vx: number;
  vz: number;
  health: number;
  maxHealth: number;
  type: DroneType;
  cooldown: number;
  speed: number;
  // Archetype traits:
  sniperAimTimer?: number;
  isSniperAiming?: boolean;
  kamikazeChargeTimer?: number;
  kamikazeBeepTick?: number;
  bossPhase?: number; // 0: 100%, 1: 66% spawned, 2: 33% spawned
  bossAttackPattern?: number;
  bossAttackTimer?: number;
  bossName?: string;
  shieldActive?: boolean;
  flashTimer?: number;
}

export interface BulletEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  fromPlayer: boolean;
  life: number;
  color?: string;
  radius?: number;
  isRailgun?: boolean;
  isBossRadial?: boolean;
}

export interface CoinEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  value: number;
  rotY: number;
  bobOffset: number;
}

export interface FloatingReward {
  id: number;
  x: number;
  y: number;
  z: number;
  text: string;
  life: number;
  maxLife: number;
  color?: string;
}

export interface BossHudData {
  name: string;
  health: number;
  maxHealth: number;
  floor: number;
}

export interface SectorTheme {
  id: string;
  name: string;
  primaryNeon: string;
  secondaryNeon: string;
  accentGlow: string;
  fogColor: string;
  ambientLight: string;
  sunLight: string;
  hemiSky: string;
  hemiGround: string;
  gridColor: string;
  droneOptics: string;
  droneJetColor: string;
  droneHealthBarColor: string;
  bulletTrailColor: string;
}

export type Language = 'en' | 'es';
