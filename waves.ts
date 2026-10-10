import {ARENA_DEPTH, ARENA_WIDTH} from './arena';
import type {BossHudData, DroneEntity, DroneType} from './types';
import {randomRange} from './utils';

export interface FloorWave {
  /** Lista completa de drones del piso (incluye al jefe cuando corresponde). */
  drones: DroneEntity[];
  /** Datos del HUD del jefe, o null si el piso no tiene jefe. */
  boss: BossHudData | null;
  /** Siguiente id libre tras consumir los ids del piso. */
  nextId: number;
}

/**
 * Composición de la oleada de un piso. Función pura: con el mismo piso y el
 * mismo id inicial de salida, devuelve siempre la misma oleada (los cooldowns
 * y posiciones de entrada salen de randomRange, como antes).
 *
 * Reglas del diseño:
 * - Pisos 1-2: solo scouts | 3: scouts + kamikaze | 4-5: + snipers
 * - Piso 6 en adelante: escuadra mixta con tanques
 * - Cada 5 pisos: jefe "SECTOR OVERLORD", con 2 scouts de apoyo desde el piso 10
 */
export function createFloorWave(floor: number, startId: number): FloorWave {
  let id = startId;
  let boss: BossHudData | null = null;
  const isBossFloor = floor % 5 === 0;

  const newDrones: DroneEntity[] = [];

  if (isBossFloor) {
    // DEDICATED BOSS ENCOUNTER (Titan Drone / Overlord Core)
    const bossHp = 450 + (floor / 5 - 1) * 350;
    const bossTitle = `SECTOR OVERLORD - CORE-${floor < 10 ? '0' + floor : floor}`;

    newDrones.push({
      id: id++,
      x: 0,
      y: 4.5,
      z: -16,
      rotY: 0,
      vx: 0,
      vz: 0,
      health: bossHp,
      maxHealth: bossHp,
      type: 'boss',
      cooldown: 2.0,
      speed: 1.8,
      bossPhase: 0,
      bossAttackPattern: 0,
      bossAttackTimer: 2.5,
      bossName: bossTitle,
    });

    // Spawn initial support squad for boss on higher floors
    if (floor >= 10) {
      newDrones.push({
        id: id++,
        x: -10,
        y: 3.0,
        z: -12,
        rotY: 0,
        vx: 0,
        vz: 0,
        health: 45,
        maxHealth: 45,
        type: 'scout',
        cooldown: 3.0,
        speed: 2.2,
      });
      newDrones.push({
        id: id++,
        x: 10,
        y: 3.0,
        z: -12,
        rotY: 0,
        vx: 0,
        vz: 0,
        health: 45,
        maxHealth: 45,
        type: 'scout',
        cooldown: 3.0,
        speed: 2.2,
      });
    }

    boss = {
      name: bossTitle,
      health: bossHp,
      maxHealth: bossHp,
      floor,
    };
  } else {
    // REGULAR FLOORS WITH GRADUAL ARCHETYPE SPAWNING
    // Floors 1-2: Scout Drones only
    // Floor 3+: Introduce Kamikaze Drones
    // Floor 4+: Introduce Sniper Drones
    // Floor 6+: Introduce Tank Drones and mixed formations
    let count = floor === 1 ? 3 : floor === 2 ? 4 : floor === 3 ? 5 : Math.min(14, 5 + Math.floor(floor * 1.2));
    const baseHp = 22 + floor * 8;

    for (let i = 0; i < count; i++) {
      let type: DroneType = 'scout';

      if (floor >= 6) {
        // Mixed Squad: Scout, Kamikaze, Sniper, Tank
        const r = i % 4;
        if (r === 0) type = 'tank';
        else if (r === 1) type = 'sniper';
        else if (r === 2) type = 'kamikaze';
        else type = 'scout';
      } else if (floor >= 4) {
        // Floors 4-5: Scout, Kamikaze, Sniper
        const r = i % 3;
        if (r === 0) type = 'sniper';
        else if (r === 1) type = 'kamikaze';
        else type = 'scout';
      } else if (floor >= 3) {
        // Floor 3: Scout & Kamikaze
        type = i % 2 === 0 ? 'kamikaze' : 'scout';
      } else {
        // Floors 1-2: Scouts only
        type = 'scout';
      }

      let hp = baseHp;
      let speed = 2.0;
      let cd = randomRange(2.5, 4.5);

      if (type === 'kamikaze') {
        hp = Math.max(15, baseHp * 0.55); // Fast & low health
        speed = 4.8 + floor * 0.15;
        cd = 0.5;
      } else if (type === 'tank') {
        hp = baseHp * 2.2; // Heavy armored front
        speed = 1.3;
        cd = 2.8;
      } else if (type === 'sniper') {
        hp = baseHp * 0.85; // Long range in corners
        speed = 1.6;
        cd = 2.5;
      } else {
        // Scout
        hp = baseHp;
        speed = 2.2;
        cd = randomRange(2.0, 3.5);
      }

      let spawnX = randomRange(-ARENA_WIDTH / 2 + 6, ARENA_WIDTH / 2 - 6);
      let spawnZ = randomRange(-ARENA_DEPTH / 2 + 8, -4);

      if (type === 'sniper') {
        // Place snipers near back corners of the room
        spawnX = i % 2 === 0 ? -ARENA_WIDTH / 2 + 7 : ARENA_WIDTH / 2 - 7;
        spawnZ = -ARENA_DEPTH / 2 + 10;
      }

      newDrones.push({
        id: id++,
        x: spawnX,
        y: type === 'sniper' ? 3.8 : type === 'tank' ? 2.4 : type === 'kamikaze' ? 2.2 : 3.0,
        z: spawnZ,
        rotY: 0,
        vx: 0,
        vz: 0,
        health: hp,
        maxHealth: hp,
        type,
        cooldown: cd,
        speed,
        sniperAimTimer: 0,
        isSniperAiming: false,
        kamikazeChargeTimer: 0,
        kamikazeBeepTick: 0,
      });
    }
  }

  return {drones: newDrones, boss, nextId: id};
}
