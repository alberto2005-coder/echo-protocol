import {Html, Line} from '@react-three/drei';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {CuboidCollider, Physics, RigidBody} from '@react-three/rapier';
import type {MutableRefObject} from 'react';
import React, {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {ARENA_DEPTH, ARENA_OBSTACLES, ARENA_WIDTH} from './arena';
import {FPSWeapon} from './components/FPSWeapon';
import {getConfig} from './constants';
import {useInput} from './input';
import type {InputSnapshot} from './input';
import {getThemeForFloor} from './themes';
import {TRANSLATIONS} from './translations';
import type {
  BossHudData,
  BulletEntity,
  DroneEntity,
  FloatingReward,
  Language,
} from './types';
import {gameAudio, randomRange} from './utils';
import type {GameState} from './utils/helper';
import {createFloorWave} from './waves';

interface SceneProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  inputRef: MutableRefObject<InputSnapshot>;
  gameStateRef: MutableRefObject<GameState>;
  onOpenShop: () => void;
  onHitDrone: () => void;
  onEnemyKilled: (coinsEarned: number, x: number, y: number, z: number) => void;
  onFloorCompleted: (bonus: number) => void;
  onBossUpdate: (boss: BossHudData | null) => void;
  language: Language;
}


// Pre-allocated math variables
const forwardVec = new THREE.Vector3();
const sideVec = new THREE.Vector3();
const moveDir = new THREE.Vector3();
const shotDir = new THREE.Vector3();
const camEuler = new THREE.Euler(0, 0, 0, 'YXZ');

// Procedural Cyber Rain Particles Count
const RAIN_COUNT = 160;

// Posiciones de la lluvia generadas una sola vez a nivel de módulo (si se
// generaran dentro del render, Math.random haría el render no determinista).
const RAIN_POSITIONS = (() => {
  const pos = new Float32Array(RAIN_COUNT * 3);
  for (let i = 0; i < RAIN_COUNT; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * ARENA_WIDTH;
    pos[i * 3 + 1] = Math.random() * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * ARENA_DEPTH;
  }
  return pos;
})();

function Scene({
  gameState,
  setGameState,
  inputRef,
  gameStateRef,
  onOpenShop,
  onHitDrone,
  onEnemyKilled,
  onFloorCompleted,
  onBossUpdate,
  language,
}: SceneProps): React.ReactElement {
  const {camera, scene} = useThree();
  const t = TRANSLATIONS[language];

  // Active Floor Theme & Dynamic Smooth Color Interpolation
  const activeTheme = useMemo(() => getThemeForFloor(gameState.floor), [gameState.floor]);

  // Target Three.js Colors
  const targetColors = useMemo(() => ({
    ambient: new THREE.Color(activeTheme.ambientLight),
    sun: new THREE.Color(activeTheme.sunLight),
    hemiSky: new THREE.Color(activeTheme.hemiSky),
    hemiGround: new THREE.Color(activeTheme.hemiGround),
    primaryNeon: new THREE.Color(activeTheme.primaryNeon),
    secondaryNeon: new THREE.Color(activeTheme.secondaryNeon),
    accentGlow: new THREE.Color(activeTheme.accentGlow),
    fog: new THREE.Color(activeTheme.fogColor),
  }), [activeTheme]);

  // Current smoothly interpolated colors
  const currentColors = useRef({
    ambient: new THREE.Color(activeTheme.ambientLight),
    sun: new THREE.Color(activeTheme.sunLight),
    hemiSky: new THREE.Color(activeTheme.hemiSky),
    hemiGround: new THREE.Color(activeTheme.hemiGround),
    primaryNeon: new THREE.Color(activeTheme.primaryNeon),
    secondaryNeon: new THREE.Color(activeTheme.secondaryNeon),
    accentGlow: new THREE.Color(activeTheme.accentGlow),
    fog: new THREE.Color(activeTheme.fogColor),
  });

  // Material and Light References
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);

  const primaryNeonMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const secondaryNeonMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const wallLightMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Initialize Fog on scene
  useEffect(() => {
    // oxlint-disable-next-line react/immutability -- asignación imperativa de three.js (API externa, no estado React)
    scene.fog = new THREE.FogExp2(activeTheme.fogColor, 0.022);
  }, [scene, activeTheme.fogColor]);

  // Cyber Rain / Atmosphere Sparkle Particles (posiciones precalculadas arriba)
  const rainRef = useRef<THREE.Points>(null);
  const rainPositions = RAIN_POSITIONS;

  // Player FPS state
  const player = useRef({
    x: 0,
    y: 1.7,
    z: 18,
    vy: 0,
    yaw: 0,
    pitch: 0,
    dashTimer: 0,
    dashCooldown: 0,
    fireCooldown: 0,
    recoil: 0,
    muzzleFlash: false,
    isGrounded: true,
    shakeTimer: 0,
    shakeIntensity: 0,
  });

  const weaponGroupRef = useRef<THREE.Group>(null);
  const flashTimerRef = useRef(0);

  // Entities state
  const dronesRef = useRef<DroneEntity[]>([]);
  const bulletsRef = useRef<BulletEntity[]>([]);
  const floatingsRef = useRef<FloatingReward[]>([]);

  // State arrays for visual rendering
  const [dronesList, setDronesList] = useState<DroneEntity[]>([]);
  const [bulletsList, setBulletsList] = useState<BulletEntity[]>([]);
  const [floatingList, setFloatingList] = useState<FloatingReward[]>([]);
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [isAimingState, setIsAimingState] = useState(false);
  // Recoil/destello del arma espejados desde el ref del jugador, para poder pasarlos por props
  const [weaponFx, setWeaponFx] = useState({recoil: 0, muzzleFlash: false});

  const waveClearedRef = useRef(false);
  const nextDroneId = useRef(1);

  // `onBossUpdate` llega como prop y se re-crea en cada render: se guarda en un
  // ref (sincronizado en un efecto declarado antes que el de piso) para poder
  // memorizar `initFloor` con useCallback y que sea estable entre renders.
  const onBossUpdateRef = useRef(onBossUpdate);
  useEffect(() => {
    onBossUpdateRef.current = onBossUpdate;
  }, [onBossUpdate]);

  // Initialize/Spawn Floor Waves with Gradual Archetypes and Boss Floors Every 5 Levels
  const initFloor = useCallback((floor: number) => {
    waveClearedRef.current = false;

    const wave = createFloorWave(floor, nextDroneId.current);
    nextDroneId.current = wave.nextId;
    onBossUpdateRef.current(wave.boss);

    dronesRef.current = wave.drones;
    bulletsRef.current = [];
    floatingsRef.current = [];
    setDronesList(wave.drones);
    setBulletsList([]);
    setFloatingList([]);
    setGameState((prev) => ({
      ...prev,
      dronesLeft: wave.drones.length,
      elevatorReady: false,
      isShopOpen: false,
    }));
    // `setGameState` es el setter de useState de App: estable entre renders.
  }, [setGameState]);

  // Reinicio de piso: solo actúa cuando cambia realmente `gameState.floor`
  // (`initFloor` ya es estable gracias a useCallback).
  const lastInitializedFloor = useRef(-1);
  useEffect(() => {
    if (lastInitializedFloor.current === gameState.floor) return;
    lastInitializedFloor.current = gameState.floor;
    initFloor(gameState.floor);
    player.current.x = 0;
    player.current.y = 1.7;
    player.current.z = 20;
    player.current.vy = 0;
  }, [gameState.floor, initFloor]);

  // Main FPS Game Loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // 0. SMOOTH COLOR TRANSITION LERP
    const lerpSpeed = 3.5 * dt;
    const cur = currentColors.current;
    cur.ambient.lerp(targetColors.ambient, lerpSpeed);
    cur.sun.lerp(targetColors.sun, lerpSpeed);
    cur.hemiSky.lerp(targetColors.hemiSky, lerpSpeed);
    cur.hemiGround.lerp(targetColors.hemiGround, lerpSpeed);
    cur.primaryNeon.lerp(targetColors.primaryNeon, lerpSpeed);
    cur.secondaryNeon.lerp(targetColors.secondaryNeon, lerpSpeed);
    cur.accentGlow.lerp(targetColors.accentGlow, lerpSpeed);
    cur.fog.lerp(targetColors.fog, lerpSpeed);

    if (ambientLightRef.current) ambientLightRef.current.color.copy(cur.ambient);
    if (directionalLightRef.current) directionalLightRef.current.color.copy(cur.sun);
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(cur.hemiSky);
      hemiLightRef.current.groundColor.copy(cur.hemiGround);
    }
    if (scene.fog) {
      (scene.fog as THREE.FogExp2).color.copy(cur.fog);
    }

    if (primaryNeonMatRef.current) {
      primaryNeonMatRef.current.color.copy(cur.primaryNeon);
      primaryNeonMatRef.current.emissive.copy(cur.primaryNeon);
    }
    if (secondaryNeonMatRef.current) {
      secondaryNeonMatRef.current.color.copy(cur.secondaryNeon);
      secondaryNeonMatRef.current.emissive.copy(cur.secondaryNeon);
    }
    if (accentGlowMatRef.current) {
      accentGlowMatRef.current.color.copy(cur.accentGlow);
      accentGlowMatRef.current.emissive.copy(cur.accentGlow);
    }
    if (wallLightMatRef.current) {
      wallLightMatRef.current.color.copy(cur.primaryNeon);
      wallLightMatRef.current.emissive.copy(cur.primaryNeon);
    }

    // Rain Particles
    if (rainRef.current) {
      const posAttr = rainRef.current.geometry.attributes.position;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < RAIN_COUNT; i++) {
        array[i * 3 + 1] -= 22 * dt;
        if (array[i * 3 + 1] < 0) {
          array[i * 3 + 1] = 18;
          array[i * 3 + 0] = (Math.random() - 0.5) * ARENA_WIDTH;
          array[i * 3 + 2] = (Math.random() - 0.5) * ARENA_DEPTH;
        }
      }
      posAttr.needsUpdate = true;
    }

    if (gameStateRef.current.status !== 'PLAYING' || gameStateRef.current.isShopOpen) return;

    const p = player.current;
    const gs = gameStateRef.current;
    const input = inputRef.current;
    const actions = input?.actions;
    const pointer = input?.pointer;

    // 1. Mouse / Touch Look
    if (pointer) {
      const lookSensitivity = 0.0022;
      p.yaw -= pointer.movementX * lookSensitivity;
      p.pitch -= pointer.movementY * lookSensitivity;
      p.pitch = THREE.MathUtils.clamp(p.pitch, -1.35, 1.35);
      // oxlint-disable-next-line react/immutability -- consumo del snapshot de entrada del bucle de juego
      pointer.movementX = 0;
      pointer.movementY = 0;
    }

    camEuler.set(p.pitch, p.yaw, 0);
    camera.quaternion.setFromEuler(camEuler);
    
    let shakeX = 0, shakeY = 0, shakeZ = 0;
    if (p.shakeTimer > 0) {
      p.shakeTimer -= dt;
      shakeX = (Math.random() - 0.5) * p.shakeIntensity;
      shakeY = (Math.random() - 0.5) * p.shakeIntensity;
      shakeZ = (Math.random() - 0.5) * p.shakeIntensity;
    }
    camera.position.set(p.x + shakeX, p.y + shakeY, p.z + shakeZ);

    // ADS
    const isAiming = Boolean(actions?.aim || pointer?.rightDown);
    // oxlint-disable-next-line react/immutability -- la cámara de three.js se actualiza imperativamente en el bucle
    if (isAiming !== isAimingState) {
      setIsAimingState(isAiming);
      if (camera instanceof THREE.PerspectiveCamera) {
        // oxlint-disable-next-line react/immutability -- la cámara de three.js es imperativa por diseño
        camera.fov = isAiming ? 45 : (getConfig('fov') as number);
        camera.updateProjectionMatrix();
      }
    }

    // 2. Cooldowns & Recoil
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.dashTimer > 0) p.dashTimer -= dt;
    if (p.fireCooldown > 0) p.fireCooldown -= dt;
    p.recoil = Math.max(0, p.recoil - dt * 6.0);

    if (flashTimerRef.current > 0) {
      flashTimerRef.current -= dt;
      if (flashTimerRef.current <= 0) {
        p.muzzleFlash = false;
      }
    }

    // 3. Movement
    forwardVec.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw)).normalize();
    sideVec.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw)).normalize();
    moveDir.set(0, 0, 0);

    if (actions) {
      if (actions.up) moveDir.add(forwardVec);
      if (actions.down) moveDir.sub(forwardVec);
      if (actions.right) moveDir.add(sideVec);
      if (actions.left) moveDir.sub(sideVec);
    }

    const moving = moveDir.lengthSq() > 0;
    if (moving !== isPlayerMoving) {
      setIsPlayerMoving(moving);
    }

    if (actions?.jump && p.isGrounded) {
      p.vy = 7.5;
      p.isGrounded = false;
      gameAudio.playRetroJump();
    }

    if (actions?.dash && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.28;
      p.dashCooldown = 1.2;
      gameAudio.playRetroJump();
    }

    const currentSpeed = (gs.speed || 8.0) * (p.dashTimer > 0 ? 2.5 : isAiming ? 0.6 : 1.0);

    if (moving) {
      moveDir.normalize();
      p.x += moveDir.x * currentSpeed * dt;
      p.z += moveDir.z * currentSpeed * dt;
    }

    // Gravity
    p.vy += (getConfig('gravity') as number) * dt;
    p.y += p.vy * dt;
    if (p.y <= 1.7) {
      p.y = 1.7;
      p.vy = 0;
      p.isGrounded = true;
    }

    // Solid Cover Obstacle Collisions for Player
    const PLAYER_RADIUS = 0.6;
    for (let iter = 0; iter < 2; iter++) {
      for (const obs of ARENA_OBSTACLES) {
        const halfW = obs.width / 2 + PLAYER_RADIUS;
        const halfD = obs.depth / 2 + PLAYER_RADIUS;
        const dx = p.x - obs.x;
        const dz = p.z - obs.z;

        if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
          if (obs.type === 'jumppad') {
            if (p.y <= obs.height + 1.7 && p.vy <= 0) {
              p.vy = 18.0; // Huge jump boost
              p.isGrounded = false;
              gameAudio.playRetroJump();
            }
          } else {
            const overlapX = halfW - Math.abs(dx);
            const overlapZ = halfD - Math.abs(dz);
            if (overlapX < overlapZ) {
              p.x += Math.sign(dx || 1) * overlapX;
            } else {
              p.z += Math.sign(dz || 1) * overlapZ;
            }
          }
        }
      }
    }

    p.x = THREE.MathUtils.clamp(p.x, -ARENA_WIDTH / 2 + PLAYER_RADIUS + 0.5, ARENA_WIDTH / 2 - PLAYER_RADIUS - 0.5);
    p.z = THREE.MathUtils.clamp(p.z, -ARENA_DEPTH / 2 + PLAYER_RADIUS + 0.5, ARENA_DEPTH / 2 - PLAYER_RADIUS - 0.5);

    // 4. Shooting
    if ((actions?.confirm || pointer?.down) && p.fireCooldown <= 0) {
      const fireInterval = 1.0 / (gs.fireRate || 3.5);
      p.fireCooldown = fireInterval;
      p.recoil = 1.0;
      p.muzzleFlash = true;
      flashTimerRef.current = 0.06;

      camera.getWorldDirection(shotDir);
      const bulletSpeed = 54;

      bulletsRef.current.push({
        id: Math.random() + Date.now(),
        x: p.x + shotDir.x * 0.4,
        y: p.y - 0.08 + shotDir.y * 0.4,
        z: p.z + shotDir.z * 0.4,
        vx: shotDir.x * bulletSpeed,
        vy: shotDir.y * bulletSpeed,
        vz: shotDir.z * bulletSpeed,
        damage: gs.weaponDamage || 25,
        fromPlayer: true,
        life: 2.2,
      });

      gameAudio.playArcadeLaser();
    }

    // 5. UPDATE DRONES AI (ARCHETYPE SPECIFIC BEHAVIORS)
    const drones = dronesRef.current;
    let dronesAlive = 0;
    let activeBoss: DroneEntity | null = null;

    for (let i = 0; i < drones.length; i++) {
      const d = drones[i];
      if (d.health <= 0) continue;
      dronesAlive++;

      const dx = p.x - d.x;
      const dz = p.z - d.z;
      const dist = Math.hypot(dx, dz);

      // Face player
      d.rotY = Math.atan2(dx, dz);
      
      if (d.flashTimer && d.flashTimer > 0) {
        d.flashTimer -= dt;
      }

      let moveDirX = 0;
      let moveDirZ = 0;

      // === ARCHETYPE BEHAVIORS ===
      if (d.type === 'kamikaze') {
        // Fast-moving suicide rusher
        moveDirX = (dx / dist) * d.speed;
        moveDirZ = (dz / dist) * d.speed;

        // Escalating warning beep ticker
        d.kamikazeBeepTick = (d.kamikazeBeepTick || 0) + dt * (dist < 8 ? 8 : 3);
        if (d.kamikazeBeepTick > 1.0) {
          d.kamikazeBeepTick = 0;
          gameAudio.playHoverMicroTone();
        }

        // Proximity Detonation
        if (dist < 2.0 && d.health > 0) {
          d.health = 0;
          gameAudio.playChiptuneExplosion();

          // Area damage to player
          if (dist < 4.0 && p.dashTimer <= 0) {
            p.shakeTimer = 0.4;
            p.shakeIntensity = 0.6;
            setGameState((prev) => {
              const nextHp = Math.max(0, prev.health - 28);
              if (nextHp <= 0) {
                gameAudio.playDefeatMotif();
                return {...prev, health: 0, status: 'GAME_OVER'};
              }
              return {...prev, health: nextHp};
            });
          }

          floatingsRef.current.push({
            id: Math.random() + Date.now(),
            x: d.x,
            y: d.y + 0.8,
            z: d.z,
            text: '💥 DETONATED',
            life: 1.2,
            maxLife: 1.2,
          });
          continue;
        }
      } else if (d.type === 'tank') {
        // Heavy, slow frontal shield drone
        if (dist > 7.0) {
          moveDirX = (dx / dist) * d.speed;
          moveDirZ = (dz / dist) * d.speed;
        } else if (dist < 4.0) {
          moveDirX = -(dx / dist) * d.speed;
          moveDirZ = -(dz / dist) * d.speed;
        } else {
          moveDirX = -(dz / dist) * d.speed * 0.6;
          moveDirZ = (dx / dist) * d.speed * 0.6;
        }

        // Tank periodic twin heavy shot
        d.cooldown -= dt;
        if (d.cooldown <= 0 && dist < 26) {
          d.cooldown = 2.8;
          const bulletSpeed = 16;
          const tdx = p.x - d.x;
          const tdy = (p.y - 0.35) - d.y;
          const tdz = p.z - d.z;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz);

          if (tdist > 0.001) {
            bulletsRef.current.push({
              id: Math.random() + Date.now(),
              x: d.x,
              y: d.y,
              z: d.z,
              vx: (tdx / tdist) * bulletSpeed,
              vy: (tdy / tdist) * bulletSpeed,
              vz: (tdz / tdist) * bulletSpeed,
              damage: 18,
              fromPlayer: false,
              life: 3.5,
              radius: 0.28,
            });
            gameAudio.playGunshotBlast();
          }
        }
      } else if (d.type === 'sniper') {
        // Advanced Sniper AI: Seek cover behind pillars (progressive with floor)
        const usesCover = gs.floor >= 3;
        
        d.isSniperAiming = true;
        d.sniperAimTimer = (d.sniperAimTimer || 0) + dt;
        
        if (usesCover) {
          // Find the best cover (a pillar that is far from player)
          let bestCover = ARENA_OBSTACLES[0];
          let bestScore = -Infinity;
          for (const obs of ARENA_OBSTACLES) {
             const coverDistToPlayer = Math.hypot(p.x - obs.x, p.z - obs.z);
             const distToCover = Math.hypot(d.x - obs.x, d.z - obs.z);
             const score = coverDistToPlayer - distToCover * 1.5;
             if (score > bestScore) {
               bestScore = score;
               bestCover = obs;
             }
          }
          
          // Vector from player to cover
          const pToCoverX = bestCover.x - p.x;
          const pToCoverZ = bestCover.z - p.z;
          const pToCoverLen = Math.hypot(pToCoverX, pToCoverZ) || 1;
          
          // Position behind cover
          const hideX = bestCover.x + (pToCoverX / pToCoverLen) * 3.5;
          const hideZ = bestCover.z + (pToCoverZ / pToCoverLen) * 3.5;
          
          // Position to peek and shoot (offset laterally from cover)
          const peekX = bestCover.x + (pToCoverX / pToCoverLen) * 3.5 - (pToCoverZ / pToCoverLen) * 3.0;
          const peekZ = bestCover.z + (pToCoverZ / pToCoverLen) * 3.5 + (pToCoverX / pToCoverLen) * 3.0;

          // Hides for 1.2s, peeks for 1.3s before shooting
          const isShootingPhase = d.sniperAimTimer > 1.2;
          const targetX = isShootingPhase ? peekX : hideX;
          const targetZ = isShootingPhase ? peekZ : hideZ;

          const toTargetX = targetX - d.x;
          const toTargetZ = targetZ - d.z;
          const toTargetDist = Math.hypot(toTargetX, toTargetZ) || 1;

          if (toTargetDist > 0.5) {
            moveDirX = (toTargetX / toTargetDist) * d.speed;
            moveDirZ = (toTargetZ / toTargetDist) * d.speed;
          }
        } else {
          // Basic behavior: Stays far away in perimeter/corners
          if (dist < 18.0) {
            moveDirX = -(dx / dist) * d.speed * 1.2;
            moveDirZ = -(dz / dist) * d.speed * 1.2;
          } else if (dist > 28.0) {
            moveDirX = (dx / dist) * d.speed;
            moveDirZ = (dz / dist) * d.speed;
          }
        }

        if (d.sniperAimTimer >= 2.5) {
          d.sniperAimTimer = 0;
          const bulletSpeed = 65;
          const tdx = p.x - d.x;
          const tdy = (p.y - 0.35) - d.y;
          const tdz = p.z - d.z;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz);

          if (tdist > 0.001) {
            bulletsRef.current.push({
              id: Math.random() + Date.now(),
              x: d.x,
              y: d.y,
              z: d.z,
              vx: (tdx / tdist) * bulletSpeed,
              vy: (tdy / tdist) * bulletSpeed,
              vz: (tdz / tdist) * bulletSpeed,
              damage: 32,
              fromPlayer: false,
              life: 2.0,
              isRailgun: true,
            });
            gameAudio.playGunshotBlast();
          }
        }
      } else if (d.type === 'boss') {
        // SECTOR OVERLORD TITAN BOSS
        activeBoss = d;

        // Slow majestic arena hovering
        const targetHoverX = Math.sin(Date.now() * 0.0008) * 12;
        const targetHoverZ = -14 + Math.cos(Date.now() * 0.0006) * 4;
        d.x += (targetHoverX - d.x) * 0.8 * dt;
        d.z += (targetHoverZ - d.z) * 0.8 * dt;

        // BOSS THRESHOLD REINFORCEMENTS (66% and 33%)
        const hpPct = d.health / d.maxHealth;
        if (hpPct <= 0.66 && (d.bossPhase || 0) === 0) {
          d.bossPhase = 1;
          gameAudio.playPowerupChime();
          floatingsRef.current.push({
            id: Math.random() + Date.now(),
            x: d.x,
            y: d.y + 2.0,
            z: d.z,
            text: '⚠ REINFORCEMENTS DEPLOYED',
            life: 2.0,
            maxLife: 2.0,
          });
          // Summon 2 Kamikazes
          drones.push(
            {
              id: nextDroneId.current++,
              x: d.x - 4,
              y: 3.0,
              z: d.z + 2,
              rotY: 0,
              vx: 0,
              vz: 0,
              health: 35,
              maxHealth: 35,
              type: 'kamikaze',
              cooldown: 0.5,
              speed: 4.8,
            },
            {
              id: nextDroneId.current++,
              x: d.x + 4,
              y: 3.0,
              z: d.z + 2,
              rotY: 0,
              vx: 0,
              vz: 0,
              health: 35,
              maxHealth: 35,
              type: 'kamikaze',
              cooldown: 0.5,
              speed: 4.8,
            },
          );
        } else if (hpPct <= 0.33 && (d.bossPhase || 0) === 1) {
          d.bossPhase = 2;
          gameAudio.playPowerupChime();
          floatingsRef.current.push({
            id: Math.random() + Date.now(),
            x: d.x,
            y: d.y + 2.0,
            z: d.z,
            text: '⚠ CRITICAL ENRAGE: SUPPORT ESCORT',
            life: 2.0,
            maxLife: 2.0,
          });
          // Summon 1 Tank + 1 Sniper
          drones.push(
            {
              id: nextDroneId.current++,
              x: d.x - 5,
              y: 2.5,
              z: d.z + 3,
              rotY: 0,
              vx: 0,
              vz: 0,
              health: 80,
              maxHealth: 80,
              type: 'tank',
              cooldown: 2.0,
              speed: 1.4,
            },
            {
              id: nextDroneId.current++,
              x: d.x + 5,
              y: 3.8,
              z: d.z + 3,
              rotY: 0,
              vx: 0,
              vz: 0,
              health: 45,
              maxHealth: 45,
              type: 'sniper',
              cooldown: 2.0,
              speed: 1.6,
            },
          );
        }

        // BOSS ATTACK PATTERNS (Radial bullet rings & targeted twin bursts)
        d.bossAttackTimer = (d.bossAttackTimer || 2.5) - dt;
        if (d.bossAttackTimer <= 0) {
          d.bossAttackTimer = 2.4;
          d.bossAttackPattern = ((d.bossAttackPattern || 0) + 1) % 2;

          if (d.bossAttackPattern === 0) {
            // Radial 10-way bullet ring spray
            const bulletCount = 10;
            const radialSpeed = 15;
            for (let bIdx = 0; bIdx < bulletCount; bIdx++) {
              const angle = (bIdx / bulletCount) * Math.PI * 2 + Date.now() * 0.001;
              bulletsRef.current.push({
                id: Math.random() + Date.now() + bIdx,
                x: d.x,
                y: d.y - 0.5,
                z: d.z,
                vx: Math.cos(angle) * radialSpeed,
                vy: -0.5,
                vz: Math.sin(angle) * radialSpeed,
                damage: 12,
                fromPlayer: false,
                life: 3.5,
                isBossRadial: true,
              });
            }
            gameAudio.playGunshotBlast();
          } else {
            // Twin targeted heavy burst
            const tdx = p.x - d.x;
            const tdy = (p.y - 0.35) - d.y;
            const tdz = p.z - d.z;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz);
            if (tdist > 0.001) {
              const heavySpeed = 26;
              bulletsRef.current.push(
                {
                  id: Math.random() + Date.now(),
                  x: d.x - 2.0,
                  y: d.y,
                  z: d.z,
                  vx: (tdx / tdist) * heavySpeed,
                  vy: (tdy / tdist) * heavySpeed,
                  vz: (tdz / tdist) * heavySpeed,
                  damage: 22,
                  fromPlayer: false,
                  life: 3.0,
                  radius: 0.35,
                },
                {
                  id: Math.random() + Date.now() + 1,
                  x: d.x + 2.0,
                  y: d.y,
                  z: d.z,
                  vx: (tdx / tdist) * heavySpeed,
                  vy: (tdy / tdist) * heavySpeed,
                  vz: (tdz / tdist) * heavySpeed,
                  damage: 22,
                  fromPlayer: false,
                  life: 3.0,
                  radius: 0.35,
                },
              );
              gameAudio.playGunshotBlast();
            }
          }
        }
      } else {
        // STANDARD SCOUT DRONE with Progressive Flanking
        const flankIntensity = Math.min(1.0, (gs.floor - 1) / 8); // Max flanking at floor 9+
        const isFlanker = (d.id % 2 === 0);
        
        // Base movement
        let baseDirX = 0;
        let baseDirZ = 0;

        if (dist > 8.5) {
          baseDirX = (dx / dist);
          baseDirZ = (dz / dist);
        } else if (dist < 4.5) {
          baseDirX = -(dx / dist);
          baseDirZ = -(dz / dist);
        } else {
          // Orbiting behavior
          baseDirX = -(dz / dist) * 0.85;
          baseDirZ = (dx / dist) * 0.85;
        }

        // Flank vector (perpendicular to player direction)
        const tangX = isFlanker ? -dz / dist : dz / dist;
        const tangZ = isFlanker ? dx / dist : -dx / dist;

        // Blend base behavior with flanking based on floor progression
        // If distance is far, focus on getting closer first
        const effectiveFlank = dist > 15 ? flankIntensity * 0.3 : flankIntensity;
        
        moveDirX = (baseDirX * (1 - effectiveFlank * 0.7) + tangX * effectiveFlank) * d.speed;
        moveDirZ = (baseDirZ * (1 - effectiveFlank * 0.7) + tangZ * effectiveFlank) * d.speed;

        d.cooldown -= dt;
        if (d.cooldown <= 0 && dist < 28) {
          d.cooldown = randomRange(2.2, 3.8);
          const bulletSpeed = 16;
          const tdx = p.x - d.x;
          const tdy = (p.y - 0.35) - d.y;
          const tdz = p.z - d.z;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz);

          if (tdist > 0.001) {
            bulletsRef.current.push({
              id: Math.random() + Date.now(),
              x: d.x,
              y: d.y,
              z: d.z,
              vx: (tdx / tdist) * bulletSpeed,
              vy: (tdy / tdist) * bulletSpeed,
              vz: (tdz / tdist) * bulletSpeed,
              damage: 8 + gs.floor * 2,
              fromPlayer: false,
              life: 3.2,
            });
          }
        }
      }

      // Obstacle avoidance
      if (d.type !== 'boss') {
        const droneRadius = d.type === 'tank' ? 1.4 : d.type === 'kamikaze' ? 0.6 : 0.9;
        for (const obs of ARENA_OBSTACLES) {
          const obsDx = d.x - obs.x;
          const obsDz = d.z - obs.z;
          const distToObs = Math.hypot(obsDx, obsDz);
          const avoidDist = Math.max(obs.width, obs.depth) / 2 + droneRadius + 2.0;

          if (distToObs < avoidDist && distToObs > 0.001 && d.y < obs.height + 0.5) {
            const pushMagnitude = ((avoidDist - distToObs) / avoidDist) * (d.speed * 1.5);
            moveDirX += (obsDx / distToObs) * pushMagnitude;
            moveDirZ += (obsDz / distToObs) * pushMagnitude;
          }
        }

        d.x += moveDirX * dt;
        d.z += moveDirZ * dt;

        d.x = THREE.MathUtils.clamp(d.x, -ARENA_WIDTH / 2 + 2, ARENA_WIDTH / 2 - 2);
        d.z = THREE.MathUtils.clamp(d.z, -ARENA_DEPTH / 2 + 2, ARENA_DEPTH / 2 - 2);
      }

      d.y += Math.sin(Date.now() * 0.003 + d.id) * 0.01;
    }

    // Sync Boss HUD
    if (activeBoss) {
      onBossUpdate({
        name: activeBoss.bossName || `SECTOR OVERLORD - CORE-${gs.floor}`,
        health: activeBoss.health,
        maxHealth: activeBoss.maxHealth,
        floor: gs.floor,
      });
    } else if (gs.floor % 5 === 0 && waveClearedRef.current) {
      onBossUpdate(null);
    }

    // Floor cleared check
    if (dronesAlive === 0 && drones.length > 0 && !waveClearedRef.current) {
      waveClearedRef.current = true;
      const isBoss = gs.floor % 5 === 0;
      const bonus = isBoss ? 250 : (getConfig('floorCompletionBonus') as number) + gs.floor * 25;
      gameAudio.playVictoryFanfare();
      onFloorCompleted(bonus);
    }

    // 6. Update Bullets & Archetype-Specific Hit Physics (e.g. Tank Front Shield)
    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt;

      let hit = false;

      // Cover pillar collision check
      for (const obs of ARENA_OBSTACLES) {
        const halfW = obs.width / 2 + 0.15;
        const halfD = obs.depth / 2 + 0.15;
        if (
          b.x >= obs.x - halfW &&
          b.x <= obs.x + halfW &&
          b.z >= obs.z - halfD &&
          b.z <= obs.z + halfD &&
          b.y >= 0 &&
          b.y <= obs.height
        ) {
          hit = true;
          gameAudio.playShieldBlock();
          break;
        }
      }

      if (!hit) {
        if (b.fromPlayer) {
          for (let j = 0; j < drones.length; j++) {
            const d = drones[j];
            if (d.health <= 0) continue;

            const dx = b.x - d.x;
            const dy = b.y - d.y;
            const dz = b.z - d.z;
            const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const hitRadius = d.type === 'boss' ? 3.0 : d.type === 'tank' ? 1.5 : d.type === 'kamikaze' ? 0.75 : 0.95;

            if (dist3D <= hitRadius) {
              hit = true;

              // TANK DRONE DIRECTIONAL SHIELD CHECK
              if (d.type === 'tank') {
                // Vector from drone to bullet
                const hitAngle = Math.atan2(dx, dz);
                const angleDiff = Math.abs(THREE.MathUtils.euclideanModulo(hitAngle - d.rotY + Math.PI, Math.PI * 2) - Math.PI);

                // Frontal 140 degree arc is protected by energy shield!
                if (angleDiff < 1.25) {
                  gameAudio.playShieldBlock();
                  floatingsRef.current.push({
                    id: Math.random() + Date.now(),
                    x: d.x,
                    y: d.y + 0.9,
                    z: d.z,
                    text: '🛡 DEFLECTED',
                    life: 0.8,
                    maxLife: 0.8,
                  });
                  break;
                }
              }

              d.health -= b.damage;
              
              // Flash and Knockback Juice
              d.flashTimer = 0.15;
              const kbForce = d.type === 'boss' ? 0 : d.type === 'tank' ? 2 : 12;
              d.x += (dx / dist3D) * kbForce * dt;
              d.z += (dz / dist3D) * kbForce * dt;
              
              onHitDrone();
              gameAudio.playMeleePunch();

              if (d.health <= 0) {
                gameAudio.playChiptuneExplosion();
                gameAudio.playCoinPickup();

                const isBoss = d.type === 'boss';
                const instantCoins = isBoss
                  ? 250
                  : d.type === 'tank'
                  ? 30
                  : d.type === 'sniper'
                  ? 25
                  : d.type === 'kamikaze'
                  ? 12
                  : 15;

                floatingsRef.current.push({
                  id: Math.random() + Date.now(),
                  x: d.x,
                  y: d.y + 1.2,
                  z: d.z,
                  text: `+${instantCoins} ${t.coins}${isBoss ? ' ★ BOSS DEFEATED' : ''}`,
                  life: 1.8,
                  maxLife: 1.8,
                });

                onEnemyKilled(instantCoins, d.x, d.y, d.z);
              }
              break;
            }
          }
        } else {
          // Player hit check
          const hDist = Math.hypot(b.x - p.x, b.z - p.z);
          const playerFeetY = p.y - 1.7;
          const playerHeadY = p.y + 0.25;
          const isWithinVertical = b.y >= playerFeetY && b.y <= playerHeadY;

          if (hDist < 0.75 && isWithinVertical && p.dashTimer <= 0) {
            hit = true;
            gameAudio.playMeleePunch();
            p.shakeTimer = 0.3;
            p.shakeIntensity = 0.4;
            setGameState((prev) => {
              const nextHp = Math.max(0, prev.health - b.damage);
              if (nextHp <= 0) {
                gameAudio.playDefeatMotif();
                return {...prev, health: 0, status: 'GAME_OVER'};
              }
              return {...prev, health: nextHp};
            });
          }
        }
      }

      if (
        Math.abs(b.x) > ARENA_WIDTH / 2 ||
        Math.abs(b.z) > ARENA_DEPTH / 2 ||
        b.y < 0 ||
        b.y > 25 ||
        hit ||
        b.life <= 0
      ) {
        bullets.splice(i, 1);
      }
    }

    // 7. Floating labels
    const floatings = floatingsRef.current;
    for (let i = floatings.length - 1; i >= 0; i--) {
      const fl = floatings[i];
      fl.y += dt * 1.5;
      fl.life -= dt;
      if (fl.life <= 0) {
        floatings.splice(i, 1);
      }
    }

    // 8. Elevator Exit Interaction
    const elevatorPos = {x: 0, z: -ARENA_DEPTH / 2 + 5};
    const distToElevator = Math.hypot(p.x - elevatorPos.x, p.z - elevatorPos.z);
    if (distToElevator < 4.0 && gs.elevatorReady && !gs.isShopOpen) {
      onOpenShop();
    }

    // State sync
    // El recoil/destello viven en el ref del jugador (mutable, por frame); aquí
    // se vuelcan a estado solo cuando cambian, para poder pasarlos por props.
    if (weaponFx.recoil !== p.recoil || weaponFx.muzzleFlash !== p.muzzleFlash) {
      setWeaponFx({recoil: p.recoil, muzzleFlash: p.muzzleFlash});
    }
    setDronesList([...dronesRef.current]);
    setBulletsList([...bulletsRef.current]);
    setFloatingList([...floatingsRef.current]);
  });

  return (
    <group>
      {/* Dynamic Lighting Rig */}
      <ambientLight
        ref={ambientLightRef}
        color={activeTheme.ambientLight}
        intensity={getConfig('ambientIntensity')}
      />
      <directionalLight
        ref={directionalLightRef}
        position={[15, 30, 20]}
        intensity={getConfig('sunIntensity')}
        color={activeTheme.sunLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight
        ref={hemiLightRef}
        color={activeTheme.hemiSky}
        groundColor={activeTheme.hemiGround}
        intensity={getConfig('hemiIntensity')}
      />

      {/* Cyber Rain */}
      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[rainPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color={activeTheme.accentGlow}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3D First-Person Weapon */}
      <group position={[camera.position.x, camera.position.y, camera.position.z]} quaternion={camera.quaternion}>
        <FPSWeapon
          ref={weaponGroupRef}
          isMoving={isPlayerMoving}
          isAiming={isAimingState}
          recoil={weaponFx.recoil}
          muzzleFlash={weaponFx.muzzleFlash}
          activeTheme={activeTheme}
        />
      </group>

      {/* Arena Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[ARENA_WIDTH, ARENA_DEPTH]} />
          <meshStandardMaterial color="#080c18" roughness={0.2} metalness={0.8} />
        </mesh>
        <CuboidCollider args={[ARENA_WIDTH / 2, 0.5, ARENA_DEPTH / 2]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* Dynamic Floor Grid Lines */}
      <gridHelper
        args={[ARENA_WIDTH, 40, activeTheme.gridColor, activeTheme.primaryNeon]}
        position={[0, 0.02, 0]}
      />

      {/* Perimeter Walls */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 5, -ARENA_DEPTH / 2]}>
          <boxGeometry args={[ARENA_WIDTH, 10, 1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 5, ARENA_DEPTH / 2]}>
          <boxGeometry args={[ARENA_WIDTH, 10, 1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-ARENA_WIDTH / 2, 5, 0]}>
          <boxGeometry args={[1, 10, ARENA_DEPTH]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[ARENA_WIDTH / 2, 5, 0]}>
          <boxGeometry args={[1, 10, ARENA_DEPTH]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
      </RigidBody>

      {/* Perimeter Horizon Lines */}
      <mesh position={[0, 8, -ARENA_DEPTH / 2 + 0.6]}>
        <boxGeometry args={[ARENA_WIDTH - 4, 0.4, 0.1]} />
        <meshStandardMaterial
          ref={wallLightMatRef}
          color={activeTheme.primaryNeon}
          emissive={activeTheme.primaryNeon}
          emissiveIntensity={3.5}
        />
      </mesh>
      <mesh position={[0, 1.5, -ARENA_DEPTH / 2 + 0.6]}>
        <boxGeometry args={[ARENA_WIDTH - 8, 0.15, 0.05]} />
        <meshStandardMaterial
          color={activeTheme.secondaryNeon}
          emissive={activeTheme.secondaryNeon}
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* Cover Pillars & Barriers */}
      {ARENA_OBSTACLES.map((obs) => {
        const glowColor =
          obs.stripType === 'primary'
            ? activeTheme.primaryNeon
            : obs.stripType === 'secondary'
            ? activeTheme.secondaryNeon
            : activeTheme.accentGlow;

        if (obs.type === 'jumppad') {
          return (
            <group key={obs.id} position={[obs.x, obs.y, obs.z]}>
              <mesh receiveShadow>
                <boxGeometry args={[obs.width, obs.height, obs.depth]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              <mesh position={[0, obs.height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[obs.width * 0.8, obs.depth * 0.8]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.0} />
              </mesh>
            </group>
          );
        }

        return (
          <RigidBody key={obs.id} type="fixed" colliders="cuboid" position={[obs.x, obs.y, obs.z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[obs.width, obs.height, obs.depth]} />
              <meshStandardMaterial color={obs.color || '#1e293b'} metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, obs.height / 2 - 0.1, 0]}>
              <boxGeometry args={[obs.width + 0.2, 0.2, obs.depth + 0.2]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, -obs.height / 2 + 0.1, 0]}>
              <boxGeometry args={[obs.width + 0.2, 0.2, obs.depth + 0.2]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0, obs.depth / 2 + 0.02]}>
              <boxGeometry args={[obs.width * 0.35, obs.height * 0.88, 0.04]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={glowColor}
                emissiveIntensity={4.5}
              />
            </mesh>
            <mesh position={[0, 0, -obs.depth / 2 - 0.02]}>
              <boxGeometry args={[obs.width * 0.35, obs.height * 0.88, 0.04]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={glowColor}
                emissiveIntensity={4.5}
              />
            </mesh>
          </RigidBody>
        );
      })}

      {/* Elevator Terminal */}
      <group position={[0, 0.1, -ARENA_DEPTH / 2 + 5]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[4.0, 4.0, 0.25, 32]} />
          <meshStandardMaterial
            color={gameState.elevatorReady ? activeTheme.primaryNeon : '#334155'}
            emissive={gameState.elevatorReady ? activeTheme.primaryNeon : '#1e293b'}
            emissiveIntensity={gameState.elevatorReady ? 3.0 : 0.2}
          />
        </mesh>
        {gameState.elevatorReady && (
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[3.8, 3.8, 10, 32, 1, true]} />
            <meshStandardMaterial
              color={activeTheme.primaryNeon}
              emissive={activeTheme.primaryNeon}
              emissiveIntensity={1.5}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        <pointLight
          position={[0, 3, 0]}
          color={gameState.elevatorReady ? activeTheme.primaryNeon : '#ef4444'}
          intensity={gameState.elevatorReady ? 25.0 : 5.0}
          distance={14}
        />
      </group>

      {/* === DISTINCT ENEMY DRONE ARCHETYPES & BOSS 3D MODELS === */}
      {dronesList.map((d) => {
        if (d.health <= 0) return null;

        // 1. TITAN OVERLORD BOSS DRONE
        if (d.type === 'boss') {
          return (
            <group key={d.id} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
              {/* Massive Outer Armor Frame */}
              <mesh castShadow>
                <boxGeometry args={[5.2, 1.8, 3.8]} />
                <meshStandardMaterial color={(d.flashTimer || 0) > 0 ? '#ffffff' : "#0f172a"} emissive={(d.flashTimer || 0) > 0 ? '#ffffff' : '#000000'} metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Central Pulsating Reactor Core */}
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.4, 24, 24]} />
                <meshStandardMaterial
                  color="#ef4444"
                  emissive="#ef4444"
                  emissiveIntensity={5.0}
                />
              </mesh>
              {/* Dual Heavy Shoulder Cannons */}
              <mesh position={[-2.4, 0.4, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.4, 3.2, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[2.4, 0.4, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.4, 3.2, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Command Sensor Horns & Rotating Shields */}
              <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[2.2, 2.6, 0.25, 32]} />
                <meshStandardMaterial
                  color={activeTheme.primaryNeon}
                  emissive={activeTheme.primaryNeon}
                  emissiveIntensity={3.5}
                  transparent
                  opacity={0.7}
                />
              </mesh>
              {/* Heavy Fiery Plasma Thrusters */}
              {[-1.8, 1.8].map((px, idx) => (
                <mesh key={idx} position={[px, -0.6, 2.0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.6, 2.2, 16]} />
                  <meshStandardMaterial
                    color="#ff4400"
                    emissive="#ff4400"
                    emissiveIntensity={6.0}
                  />
                </mesh>
              ))}
            </group>
          );
        }

        // 2. KAMIKAZE DRONE (Fast, Explosive, Needle-nose, Flashing Hazard)
        if (d.type === 'kamikaze') {
          return (
            <group key={d.id} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
              {/* Dagger aerodynamic chassis */}
              <mesh castShadow>
                <coneGeometry args={[0.45, 1.4, 8]} />
                <meshStandardMaterial color={(d.flashTimer || 0) > 0 ? '#ffffff' : "#1c1917"} emissive={(d.flashTimer || 0) > 0 ? '#ffffff' : '#000000'} metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Flashing Hazard Core / Warhead */}
              <mesh position={[0, 0, -0.7]}>
                <sphereGeometry args={[0.26, 12, 12]} />
                <meshStandardMaterial
                  color="#f97316"
                  emissive="#ef4444"
                  emissiveIntensity={6.0}
                />
              </mesh>
              {/* Twin Afterburners */}
              <mesh position={[0.25, 0, 0.6]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.15, 0.6, 8]} />
                <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={5.0} />
              </mesh>
              <mesh position={[-0.25, 0, 0.6]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.15, 0.6, 8]} />
                <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={5.0} />
              </mesh>
              {/* Hazard Icon Indicator */}
              <group position={[0, 1.0, 0]}>
                <Html center distanceFactor={14}>
                  <div className="bg-orange-500 text-zinc-950 font-black px-2 py-0.5 rounded-md text-[10px] animate-pulse border border-yellow-300">
                    ⚠ KAMIKAZE
                  </div>
                </Html>
              </group>
            </group>
          );
        }

        // 3. TANK DRONE (Armored Directional Front Shield + Exposed Rear Reactor)
        if (d.type === 'tank') {
          return (
            <group key={d.id} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
              {/* Heavy Hull */}
              <mesh castShadow>
                <boxGeometry args={[1.8, 1.1, 1.4]} />
                <meshStandardMaterial color={(d.flashTimer || 0) > 0 ? '#ffffff' : "#0f172a"} emissive={(d.flashTimer || 0) > 0 ? '#ffffff' : '#000000'} metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Glowing Curved Frontal Energy Forcefield Shield */}
              <group position={[0, 0, -1.0]}>
                <mesh>
                  <boxGeometry args={[2.2, 1.4, 0.1]} />
                  <meshStandardMaterial
                    color="#00f0ff"
                    emissive="#00f0ff"
                    emissiveIntensity={4.5}
                    transparent
                    opacity={0.65}
                  />
                </mesh>
              </group>
              {/* Exposed Rear Cooling Reactor Core (Weakpoint) */}
              <mesh position={[0, 0, 0.75]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshStandardMaterial
                  color="#22c55e"
                  emissive="#22c55e"
                  emissiveIntensity={5.0}
                />
              </mesh>
              {/* Health bar */}
              <group position={[0, 1.3, 0]}>
                <mesh>
                  <boxGeometry args={[1.6, 0.18, 0.03]} />
                  <meshStandardMaterial color="#020617" />
                </mesh>
                <mesh
                  position={[-0.75 + (d.health / d.maxHealth) * 0.75, 0, 0.02]}
                  scale={[Math.max(0.01, d.health / d.maxHealth), 1, 1]}>
                  <boxGeometry args={[1.5, 0.12, 0.02]} />
                  <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={3.5} />
                </mesh>
              </group>
            </group>
          );
        }

        // 4. SNIPER DRONE (Long Range, Railgun Barrel & Visible Target Laser)
        if (d.type === 'sniper') {
          const aimLaserProgress = Math.min(1.0, (d.sniperAimTimer || 0) / 2.5);
          return (
            <group key={d.id} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
              {/* Angular Stealth Body */}
              <mesh castShadow>
                <boxGeometry args={[0.9, 0.45, 1.8]} />
                <meshStandardMaterial color={(d.flashTimer || 0) > 0 ? '#ffffff' : "#1e1b4b"} emissive={(d.flashTimer || 0) > 0 ? '#ffffff' : '#000000'} metalness={0.92} roughness={0.15} />
              </mesh>
              {/* Long High-Caliber Railgun Barrel */}
              <mesh position={[0, 0, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 1.8, 12]} />
                <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Pulsing Targeting Lens */}
              <mesh position={[0, 0.15, -0.9]}>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={5.5} />
              </mesh>

              {/* Visible Railgun Targeting Beam Line */}
              {d.isSniperAiming && (
                <Line
                  points={[
                    [0, 0, -2.5],
                    [0, 0, -28],
                  ]}
                  color="#d946ef"
                  lineWidth={1.5 + aimLaserProgress * 2.5}
                  transparent
                  opacity={0.3 + aimLaserProgress * 0.7}
                />
              )}

              {/* Health bar */}
              <group position={[0, 1.0, 0]}>
                <mesh>
                  <boxGeometry args={[1.2, 0.15, 0.03]} />
                  <meshStandardMaterial color="#020617" />
                </mesh>
                <mesh
                  position={[-0.55 + (d.health / d.maxHealth) * 0.55, 0, 0.02]}
                  scale={[Math.max(0.01, d.health / d.maxHealth), 1, 1]}>
                  <boxGeometry args={[1.1, 0.1, 0.02]} />
                  <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={3.5} />
                </mesh>
              </group>
            </group>
          );
        }

        // 5. STANDARD SCOUT DRONE
        const opticsColor = activeTheme.droneOptics;
        const jetColor = activeTheme.droneJetColor;
        const healthColor = activeTheme.droneHealthBarColor;

        return (
          <group key={d.id} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.65, 16, 16]} />
              <meshStandardMaterial color={(d.flashTimer || 0) > 0 ? '#ffffff' : "#0b0f19"} emissive={(d.flashTimer || 0) > 0 ? '#ffffff' : '#000000'} metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0, -0.58]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial
                color={opticsColor}
                emissive={opticsColor}
                emissiveIntensity={5.5}
              />
            </mesh>
            {[
              {x: 0.8, z: 0.45},
              {x: -0.8, z: 0.45},
              {x: 0.8, z: -0.45},
              {x: -0.8, z: -0.45},
            ].map((pod, pIdx) => (
              <group key={pIdx} position={[pod.x, 0, pod.z]}>
                <mesh>
                  <cylinderGeometry args={[0.22, 0.18, 0.12, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.18, 0.6, 10]} />
                  <meshStandardMaterial
                    color={jetColor}
                    emissive={jetColor}
                    emissiveIntensity={5.0}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
              </group>
            ))}

            {/* Health Bar */}
            <group position={[0, 1.1, 0]}>
              <mesh>
                <boxGeometry args={[1.3, 0.16, 0.03]} />
                <meshStandardMaterial color="#020617" />
              </mesh>
              <mesh
                position={[-0.6 + (d.health / d.maxHealth) * 0.6, 0, 0.02]}
                scale={[Math.max(0.01, d.health / d.maxHealth), 1, 1]}>
                <boxGeometry args={[1.2, 0.1, 0.02]} />
                <meshStandardMaterial
                  color={healthColor}
                  emissive={healthColor}
                  emissiveIntensity={3.5}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Bullets & Projectiles */}
      {bulletsList.map((b) => (
        <mesh key={b.id} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.fromPlayer ? 0.2 : (b.radius || (b.isRailgun ? 0.32 : 0.18)), 8, 8]} />
          <meshStandardMaterial
            color={
              b.fromPlayer
                ? '#00f0ff'
                : b.isRailgun
                ? '#d946ef'
                : b.isBossRadial
                ? '#ef4444'
                : activeTheme.bulletTrailColor
            }
            emissive={
              b.fromPlayer
                ? '#00f0ff'
                : b.isRailgun
                ? '#d946ef'
                : b.isBossRadial
                ? '#ef4444'
                : activeTheme.bulletTrailColor
            }
            emissiveIntensity={6.0}
          />
        </mesh>
      ))}

      {/* 3D Floating Labels (Only active during live playing state) */}
      {gameState.status === 'PLAYING' && !gameState.isShopOpen && floatingList.map((fl) => (
        <group key={fl.id} position={[fl.x, fl.y, fl.z]}>
          <Html center distanceFactor={14} className="pointer-events-none select-none">
            <div
              className="bg-amber-400 text-zinc-950 font-black px-2.5 py-1 rounded-full text-xs md:text-sm whitespace-nowrap shadow-lg shadow-amber-500/50 border-2 border-amber-200 transform -translate-y-2 transition-opacity"
              style={{
                opacity: Math.max(0, fl.life / fl.maxLife),
              }}>
              {fl.text}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export function Game({
  gameState,
  setGameState,
  gameStateRef,
  onOpenShop,
  onHitDrone,
  onEnemyKilled,
  onFloorCompleted,
  onBossUpdate,
  language,
}: {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  gameStateRef: React.MutableRefObject<GameState>;
  onOpenShop: () => void;
  onHitDrone: () => void;
  onEnemyKilled: (coinsEarned: number, x: number, y: number, z: number) => void;
  onFloorCompleted: (bonus: number) => void;
  onBossUpdate: (boss: BossHudData | null) => void;
  language: Language;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useInput(containerRef as React.RefObject<HTMLDivElement>, {enabled: true});

  const handleClick = () => {
    if (gameState.status === 'PLAYING' && !gameState.isShopOpen && containerRef.current) {
      if (document.pointerLockElement !== containerRef.current) {
        containerRef.current.requestPointerLock?.();
      }
    }
  };

  const activeTheme = getThemeForFloor(gameState.floor);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="w-full h-full canvas-wrapper relative select-none cursor-crosshair">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          fov: getConfig('fov'),
          near: 0.1,
          far: 1000,
          position: [0, 1.7, 18],
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        scene={{
          background: new THREE.Color(activeTheme.fogColor),
        }}>
        <Suspense fallback={null}>
          <Physics gravity={[0, getConfig('gravity') as number, 0]}>
            <Scene
              gameState={gameState}
              setGameState={setGameState}
              inputRef={inputRef}
              gameStateRef={gameStateRef}
              onOpenShop={onOpenShop}
              onHitDrone={onHitDrone}
              onEnemyKilled={onEnemyKilled}
              onFloorCompleted={onFloorCompleted}
              onBossUpdate={onBossUpdate}
              language={language}
            />
          </Physics>

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.8}
              luminanceSmoothing={0.9}
              intensity={0.7}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
