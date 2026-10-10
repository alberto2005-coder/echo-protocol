import {useFrame} from '@react-three/fiber';
import {forwardRef, useRef} from 'react';
import * as THREE from 'three';

const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];
const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0];

export interface HumanoidCharacterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  state?: 'idle' | 'walk' | 'run' | 'action';
  toolType?: 'none' | 'pickaxe' | 'sword';
  skinColor?: string;
  clothesColor?: string;
  pantsColor?: string;
  castShadow?: boolean;
}

export const HumanoidCharacter = forwardRef<
  THREE.Group,
  HumanoidCharacterProps
>(function HumanoidCharacter(
  {
    position = DEFAULT_POSITION,
    rotation = DEFAULT_ROTATION,
    state = 'idle',
    skinColor = '#00f0ff',
    clothesColor = '#0f172a',
    pantsColor = '#1e293b',
    castShadow = true,
  }: HumanoidCharacterProps,
  ref,
) {
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame(({clock}) => {
    const t = clock.getElapsedTime();
    const speed = state === 'run' ? 16 : 9;
    const intensity = state === 'idle' ? 0 : 0.45;

    if (
      leftLeg.current &&
      rightLeg.current &&
      leftArm.current &&
      rightArm.current
    ) {
      leftLeg.current.rotation.x = Math.sin(t * speed) * intensity;
      rightLeg.current.rotation.x = Math.sin(t * speed + Math.PI) * intensity;
      leftArm.current.rotation.x = Math.sin(t * speed + Math.PI) * intensity;
      rightArm.current.rotation.x = -0.3;
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Cyber Visor & Head */}
      <mesh position={[0, 1.8, 0]} castShadow={castShadow}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={clothesColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing Neon Visor */}
      <mesh position={[0, 1.83, -0.15]}>
        <boxGeometry args={[0.26, 0.08, 0.12]} />
        <meshStandardMaterial color={skinColor} emissive={skinColor} emissiveIntensity={3.0} />
      </mesh>

      {/* Cyber Tactical Armor Torso */}
      <mesh position={[0, 1.1, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.45, 0.7, 0.3]} />
        <meshStandardMaterial color={clothesColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Torso Neon Circuit Strip */}
      <mesh position={[0, 1.15, -0.16]}>
        <boxGeometry args={[0.1, 0.4, 0.02]} />
        <meshStandardMaterial color={skinColor} emissive={skinColor} emissiveIntensity={2.5} />
      </mesh>

      {/* Plasma Rifle attached to right hand */}
      <group position={[0.35, 1.1, -0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.12, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Glowing Rifle Barrel */}
        <mesh position={[0, 0, -0.32]}>
          <cylinderGeometry args={[0.03, 0.03, 0.2]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4.0} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={leftArm} position={[-0.32, 1.35, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.06, 0.05, 0.6]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.32, 1.35, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.06, 0.05, 0.6]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={leftLeg} position={[-0.14, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.07, 0.06, 0.7]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.14, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.07, 0.06, 0.7]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>
    </group>
  );
});
