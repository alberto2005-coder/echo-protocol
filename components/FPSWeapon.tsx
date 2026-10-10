import {useFrame} from '@react-three/fiber';
import React, {forwardRef, useRef} from 'react';
import * as THREE from 'three';
import {SectorTheme} from '../types';

interface FPSWeaponProps {
  isMoving: boolean;
  isAiming: boolean;
  recoil: number;
  muzzleFlash: boolean;
  activeTheme: SectorTheme;
}

export const FPSWeapon = forwardRef<THREE.Group, FPSWeaponProps>(function FPSWeapon(
  {isMoving, isAiming, recoil, muzzleFlash, activeTheme},
  ref,
) {
  const localGroup = useRef<THREE.Group>(null);
  const bobRef = useRef(0);

  // High contrast hazard/safety amber & tactical orange highlights for optics & UI display
  const ammoLedColor = '#f59e0b'; // Warm safety amber
  const sightReticleColor = '#fbbf24'; // Bright high-contrast tactical gold
  const weaponEmissiveThemeColor = activeTheme.primaryNeon; // Synced with theme
  const rimLightColor = '#ffffff';

  useFrame((_, delta) => {
    if (!localGroup.current) return;
    const dt = Math.min(delta, 0.05);

    // Dynamic weapon bobbing
    if (isMoving) {
      bobRef.current += dt * (isAiming ? 6 : 10);
    } else {
      bobRef.current += dt * 2;
    }

    const bobX = Math.cos(bobRef.current) * (isAiming ? 0.003 : (isMoving ? 0.022 : 0.007));
    const bobY = Math.sin(bobRef.current * 2) * (isAiming ? 0.003 : (isMoving ? 0.026 : 0.009));

    // Smooth transition between Hipfire and ADS (Aim-Down-Sight)
    const targetX = isAiming ? 0.0 : 0.24 + bobX;
    const targetY = isAiming ? -0.15 + bobY : -0.21 + bobY;
    const targetZ = isAiming ? -0.40 - recoil * 0.12 : -0.48 - recoil * 0.22;

    localGroup.current.position.x = THREE.MathUtils.lerp(
      localGroup.current.position.x,
      targetX,
      15 * dt,
    );
    localGroup.current.position.y = THREE.MathUtils.lerp(
      localGroup.current.position.y,
      targetY,
      15 * dt,
    );
    localGroup.current.position.z = THREE.MathUtils.lerp(
      localGroup.current.position.z,
      targetZ,
      22 * dt,
    );

    // Recoil tilt
    const targetRotX = recoil * 0.22;
    localGroup.current.rotation.x = THREE.MathUtils.lerp(
      localGroup.current.rotation.x,
      targetRotX,
      22 * dt,
    );
  });

  return (
    <group ref={ref}>
      {/* 3D Local Weapon Rim & Environment Accent Lighting */}
      <pointLight position={[0.4, 0.3, -0.3]} color={activeTheme.accentGlow} intensity={3.5} distance={1.8} />
      <pointLight position={[-0.3, 0.2, -0.2]} color={rimLightColor} intensity={2.0} distance={1.5} />

      <group ref={localGroup} position={[0.24, -0.21, -0.48]}>
        {/* === MAIN GUN RECEIVER / CHASSIS === */}
        {/* Upper Tactical Housing */}
        <mesh castShadow receiveShadow position={[0, 0.02, -0.02]}>
          <boxGeometry args={[0.088, 0.11, 0.52]} />
          <meshStandardMaterial color="#1a202c" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Lower Receiver & Magazine Well */}
        <mesh castShadow receiveShadow position={[0, -0.05, 0.04]}>
          <boxGeometry args={[0.076, 0.09, 0.26]} />
          <meshStandardMaterial color="#111827" metalness={0.94} roughness={0.15} />
        </mesh>

        {/* Gun Body Top Edge Rim Strip */}
        <mesh position={[0.046, 0.076, -0.02]}>
          <boxGeometry args={[0.004, 0.008, 0.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={1.0} roughness={0.05} />
        </mesh>
        <mesh position={[-0.046, 0.076, -0.02]}>
          <boxGeometry args={[0.004, 0.008, 0.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={1.0} roughness={0.05} />
        </mesh>

        {/* Upper Picatinny Tactical Rail */}
        <mesh position={[0, 0.082, -0.04]}>
          <boxGeometry args={[0.042, 0.025, 0.38]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.2} />
        </mesh>

        {/* === HOLOGRAPHIC RED DOT / EOTECH SIGHT (Matching Reference Style) === */}
        <group position={[0, 0.125, 0.04]}>
          {/* Outer Sight Frame Hood */}
          <mesh>
            <boxGeometry args={[0.066, 0.055, 0.11]} />
            <meshStandardMaterial color="#0b0f19" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Glass Lens (Coated AR Glass) */}
          <mesh position={[0, 0.008, -0.052]}>
            <boxGeometry args={[0.052, 0.042, 0.004]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              transparent
              opacity={0.35}
              roughness={0.05}
              transmission={0.9}
              thickness={0.02}
            />
          </mesh>
          {/* High-Contrast Hazard Reticle Outer Circle */}
          <mesh position={[0, 0.008, -0.055]}>
            <ringGeometry args={[0.009, 0.016, 16]} />
            <meshBasicMaterial color={sightReticleColor} side={THREE.DoubleSide} />
          </mesh>
          {/* High-Contrast Center Aim Dot */}
          <mesh position={[0, 0.008, -0.055]}>
            <sphereGeometry args={[0.0028, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Red Dot Ambient Light */}
          <pointLight position={[0, 0.008, -0.05]} color={sightReticleColor} intensity={0.6} distance={0.5} />
        </group>

        {/* === HIGH-CONTRAST AMMO COUNTER / HEAT RADIATOR LED BARS (Matching Reference Art) === */}
        {/* Right Side Ammo & Charge Display Panel */}
        <group position={[0.048, 0.015, -0.02]}>
          {/* Dark Frame Plate */}
          <mesh>
            <boxGeometry args={[0.004, 0.044, 0.12]} />
            <meshStandardMaterial color="#050811" />
          </mesh>
          {/* Segmented Amber Glow Bars */}
          {[-0.04, -0.02, 0.0, 0.02, 0.04].map((zPos, sIdx) => (
            <mesh key={sIdx} position={[0.0025, 0, zPos]}>
              <boxGeometry args={[0.002, 0.028, 0.012]} />
              <meshStandardMaterial
                color={ammoLedColor}
                emissive={ammoLedColor}
                emissiveIntensity={4.8}
              />
            </mesh>
          ))}
          {/* LED Bar Ambient Light */}
          <pointLight position={[0.02, 0, 0]} color={ammoLedColor} intensity={1.8} distance={0.6} />
        </group>

        {/* Left Side Status Strip */}
        <group position={[-0.048, 0.015, -0.02]}>
          <mesh>
            <boxGeometry args={[0.004, 0.044, 0.12]} />
            <meshStandardMaterial color="#050811" />
          </mesh>
          {[-0.03, 0.0, 0.03].map((zPos, sIdx) => (
            <mesh key={sIdx} position={[-0.0025, 0, zPos]}>
              <boxGeometry args={[0.002, 0.024, 0.016]} />
              <meshStandardMaterial
                color={ammoLedColor}
                emissive={ammoLedColor}
                emissiveIntensity={4.5}
              />
            </mesh>
          ))}
        </group>

        {/* Top Tactical Status Light (Hazard Amber Accent on Top Rail) */}
        <mesh position={[0, 0.096, 0.12]}>
          <boxGeometry args={[0.028, 0.008, 0.05]} />
          <meshStandardMaterial
            color={ammoLedColor}
            emissive={ammoLedColor}
            emissiveIntensity={5.0}
          />
        </mesh>

        {/* === CYBERPUNK BARREL & MUZZLE BRAKE === */}
        <mesh position={[0, 0.015, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.24, 16]} />
          <meshStandardMaterial color="#2d3748" metalness={0.96} roughness={0.08} />
        </mesh>
        {/* Fluted Barrel Vents */}
        <mesh position={[0, 0.015, -0.47]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.03, 0.06, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Glowing Energy Core / Mag Synced with Sector Theme */}
        <mesh position={[0, -0.1, 0.06]}>
          <boxGeometry args={[0.062, 0.14, 0.12]} />
          <meshStandardMaterial
            color={weaponEmissiveThemeColor}
            emissive={weaponEmissiveThemeColor}
            emissiveIntensity={3.8}
            metalness={0.2}
            roughness={0.1}
          />
        </mesh>

        {/* Side Sector Energy Vent Grooves */}
        {[-0.14, 0.1].map((pz, idx) => (
          <mesh key={idx} position={[0.046, -0.02, pz]}>
            <boxGeometry args={[0.005, 0.03, 0.04]} />
            <meshStandardMaterial
              color={weaponEmissiveThemeColor}
              emissive={weaponEmissiveThemeColor}
              emissiveIntensity={3.2}
            />
          </mesh>
        ))}

        {/* === ENHANCED DYNAMIC MUZZLE FLASH VFX === */}
        {muzzleFlash && (
          <group position={[0, 0.015, -0.55]}>
            {/* Core Bright Flash Flare */}
            <mesh>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Outer Plasma Halo Ring */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.22, 0.03, 0.03]} />
              <meshBasicMaterial color={activeTheme.accentGlow} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.22, 0.03, 0.03]} />
              <meshBasicMaterial color={activeTheme.accentGlow} />
            </mesh>
            {/* Powerful Transient Point Light illuminating weapon and room */}
            <pointLight color={activeTheme.accentGlow} intensity={45.0} distance={9} />
          </group>
        )}

        {/* === CYBERNETIC RIGHT ARM & GAUNTLET (with Metallic Rim Highlights) === */}
        <group position={[0.13, -0.15, 0.18]} rotation={[-0.32, 0.18, -0.18]}>
          {/* Forearm Armor Plating */}
          <mesh castShadow receiveShadow position={[0, -0.1, 0.15]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.058, 0.046, 0.44, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.15} />
          </mesh>
          {/* Gauntlet Carbon Fiber Shell */}
          <mesh position={[0, -0.06, 0.16]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.062, 0.052, 0.2, 14]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.1} />
          </mesh>
          {/* Cyber Wrist Armor & Neon Conduit */}
          <mesh position={[0, 0.04, 0.02]}>
            <boxGeometry args={[0.095, 0.04, 0.095]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.045, 0.02]}>
            <boxGeometry args={[0.075, 0.045, 0.02]} />
            <meshStandardMaterial
              color={ammoLedColor}
              emissive={ammoLedColor}
              emissiveIntensity={3.5}
            />
          </mesh>
          {/* Tactical Glove & Fingers */}
          <mesh position={[-0.04, 0.08, -0.06]}>
            <boxGeometry args={[0.065, 0.065, 0.085]} />
            <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>

        {/* === CYBERNETIC LEFT ARM (SUPPORT GRIP) === */}
        <group position={[-0.15, -0.16, -0.12]} rotation={[0.38, -0.38, 0.28]}>
          {/* Support Forearm */}
          <mesh castShadow receiveShadow position={[0, -0.08, 0.12]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.054, 0.042, 0.4, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.15} />
          </mesh>
          {/* Support Hand wrapped around handguard */}
          <mesh position={[0.065, 0.08, 0.02]}>
            <boxGeometry args={[0.055, 0.055, 0.095]} />
            <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
