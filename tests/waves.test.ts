/**
 * Congela la composición de las oleadas (waves.ts) tal y como funciona hoy.
 * Todas las fórmulas están tomadas del código original de initFloor().
 */
import {describe, expect, it} from 'vitest';
import {ARENA_DEPTH, ARENA_WIDTH} from '../arena';
import {createFloorWave} from '../waves';

describe('createFloorWave · recuento y vida base', () => {
  it('pisa 1: 3 scouts con 30 de vida (22 + 1*8)', () => {
    const {drones, boss, nextId} = createFloorWave(1, 1);
    expect(drones).toHaveLength(3);
    expect(drones.every((d) => d.type === 'scout')).toBe(true);
    expect(drones[0].health).toBe(30);
    expect(drones[0].maxHealth).toBe(30);
    expect(boss).toBeNull();
    expect(nextId).toBe(4);
  });

  it('pisa 2: 4 scouts con 38 de vida (22 + 2*8)', () => {
    const {drones} = createFloorWave(2, 1);
    expect(drones).toHaveLength(4);
    expect(drones.every((d) => d.type === 'scout')).toBe(true);
    expect(drones[0].health).toBe(38);
  });

  it('pisa 3: 5 drones, mitad kamikaze (vida = máx. 15, base*0.55)', () => {
    const {drones} = createFloorWave(3, 1);
    expect(drones).toHaveLength(5);
    const types = drones.map((d) => d.type);
    expect(types.filter((t) => t === 'kamikaze')).toHaveLength(3);
    expect(types.filter((t) => t === 'scout')).toHaveLength(2);

    const base = 22 + 3 * 8; // 46
    const kama = drones.find((d) => d.type === 'kamikaze')!;
    expect(kama.health).toBeCloseTo(Math.max(15, base * 0.55), 6);
    expect(kama.cooldown).toBe(0.5); // sin aleatorio: los kamikazes siempre 0.5
    expect(kama.speed).toBeCloseTo(4.8 + 3 * 0.15, 6);
  });

  it('piso 4: 9 drones con rotación sniper/kamikaze/scout', () => {
    const {drones} = createFloorWave(4, 1);
    // 5 + floor(4 * 1.2) = 9
    expect(drones).toHaveLength(9);
    expect(drones.map((d) => d.type)).toEqual([
      'sniper',
      'kamikaze',
      'scout',
      'sniper',
      'kamikaze',
      'scout',
      'sniper',
      'kamikaze',
      'scout',
    ]);
  });

  it('piso 6: 12 drones con tanques en la rotación de 4', () => {
    const {drones} = createFloorWave(6, 1);
    // 5 + floor(6 * 1.2) = 12
    expect(drones).toHaveLength(12);
    expect(drones.map((d) => d.type)).toEqual([
      'tank',
      'sniper',
      'kamikaze',
      'scout',
      'tank',
      'sniper',
      'kamikaze',
      'scout',
      'tank',
      'sniper',
      'kamikaze',
      'scout',
    ]);

    const base = 22 + 6 * 8; // 70
    const tank = drones.find((d) => d.type === 'tank')!;
    expect(tank.health).toBeCloseTo(base * 2.2, 6);
    expect(tank.speed).toBe(1.3);
    expect(tank.cooldown).toBe(2.8);
  });

  it('el recuento se topa en 14 a partir del piso 8', () => {
    for (const floor of [8, 9, 11, 20, 50]) {
      const {drones} = createFloorWave(floor, 1);
      expect(drones.length, `piso ${floor}`).toBeLessThanOrEqual(14);
      expect(drones.length, `piso ${floor}`).toBeGreaterThanOrEqual(12);
    }
  });

  it('la vida escala lineal: 22 + piso * 8 en scouts', () => {
    for (const floor of [1, 2, 7, 12, 30]) {
      const {drones} = createFloorWave(floor, 1);
      const scout = drones.find((d) => d.type === 'scout');
      if (scout) expect(scout.health, `piso ${floor}`).toBeCloseTo(22 + floor * 8, 6);
    }
  });
});

describe('createFloorWave · posiciones', () => {
  it('los snipers van a las esquinas traseras', () => {
    const {drones} = createFloorWave(4, 1);
    const snipers = drones.filter((d) => d.type === 'sniper');
    expect(snipers.length).toBeGreaterThan(0);
    for (const s of snipers) {
      expect(Math.abs(s.x)).toBeCloseTo(ARENA_WIDTH / 2 - 7, 6); // ±18
      expect(s.z).toBeCloseTo(-ARENA_DEPTH / 2 + 10, 6); // -20
      expect(s.y).toBe(3.8);
    }
  });

  it('los drones normales caen dentro de la arena', () => {
    const {drones} = createFloorWave(7, 1);
    const halfW = ARENA_WIDTH / 2;
    const halfD = ARENA_DEPTH / 2;
    for (const d of drones) {
      expect(Math.abs(d.x)).toBeLessThanOrEqual(halfW);
      expect(d.z).toBeGreaterThanOrEqual(-halfD);
      expect(d.z).toBeLessThanOrEqual(-4);
    }
  });
});

describe('createFloorWave · pisos de jefe (cada 5)', () => {
  it('piso 5: jefe solo, 450 HP y nombre CORE-05', () => {
    const {drones, boss} = createFloorWave(5, 1);
    expect(drones).toHaveLength(1);
    expect(drones[0].type).toBe('boss');
    expect(drones[0].bossName).toBe('SECTOR OVERLORD - CORE-05');
    expect(boss).not.toBeNull();
    expect(boss!.name).toBe('SECTOR OVERLORD - CORE-05');
    expect(boss!.health).toBe(450);
    expect(boss!.maxHealth).toBe(450);
    expect(boss!.floor).toBe(5);
    // aparición fija
    expect(drones[0].x).toBe(0);
    expect(drones[0].y).toBe(4.5);
    expect(drones[0].z).toBe(-16);
    expect(drones[0].speed).toBe(1.8);
    expect(drones[0].cooldown).toBe(2.0);
  });

  it('piso 10: jefe con 800 HP + 2 scouts de apoyo', () => {
    const {drones, boss} = createFloorWave(10, 1);
    expect(drones).toHaveLength(3);
    expect(boss!.health).toBe(800); // 450 + (10/5 - 1) * 350
    expect(boss!.name).toBe('SECTOR OVERLORD - CORE-10');
    const support = drones.filter((d) => d.type === 'scout');
    expect(support).toHaveLength(2);
    for (const s of support) {
      expect(s.health).toBe(45);
      expect(s.x).toBe(Math.abs(s.x));
      expect(s.y).toBe(3.0);
      expect(s.z).toBe(-12);
    }
  });

  it('la vida del jefe crece +350 por cada 5 pisos', () => {
    expect(createFloorWave(15, 1).boss!.health).toBe(1150);
    expect(createFloorWave(20, 1).boss!.health).toBe(1500);
  });

  it('los pisos que no son múltiplo de 5 no tienen jefe', () => {
    for (const floor of [1, 2, 3, 4, 6, 7, 9, 11, 14]) {
      expect(createFloorWave(floor, 1).boss, `piso ${floor}`).toBeNull();
    }
  });
});

describe('createFloorWave · ids', () => {
  it('reparte ids correlativos desde startId y devuelve el siguiente libre', () => {
    const wave = createFloorWave(4, 100);
    expect(wave.drones.map((d) => d.id)).toEqual([100, 101, 102, 103, 104, 105, 106, 107, 108]);
    expect(wave.nextId).toBe(109);
  });

  it('encadenando pisos nunca repite id', () => {
    const seen = new Set<number>();
    let nextId = 1;
    for (let floor = 1; floor <= 21; floor++) {
      const wave = createFloorWave(floor, nextId);
      expect(wave.nextId).toBeGreaterThan(nextId);
      for (const d of wave.drones) {
        expect(seen.has(d.id), `id duplicado ${d.id} en piso ${floor}`).toBe(false);
        seen.add(d.id);
      }
      nextId = wave.nextId;
    }
    expect(seen.size).toBeGreaterThan(50);
  });

  it('es determinista en todo lo aleatorio salvo posiciones/cooldowns', () => {
    const a = createFloorWave(6, 1);
    const b = createFloorWave(6, 1);
    expect(a.drones.map((d) => d.type)).toEqual(b.drones.map((d) => d.type));
    expect(a.drones.map((d) => d.health)).toEqual(b.drones.map((d) => d.health));
    expect(a.drones.map((d) => d.id)).toEqual(b.drones.map((d) => d.id));
  });
});
