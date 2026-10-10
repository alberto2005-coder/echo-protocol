import {forwardRef} from 'react';
import * as THREE from 'three';

export interface ProceduralAnimalProps {
  type?: 'dog' | 'cat' | 'horse' | 't-rex' | 'chicken';
  color?: string;
  state?: 'idle' | 'walk' | 'run';
  size?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
}

export const AnimalCharacter = forwardRef<THREE.Group, ProceduralAnimalProps>(
  function AnimalCharacter({size = 1, position = [0, 0, 0], rotation = [0, 0, 0]}, ref) {
    return (
      <group ref={ref} position={position} rotation={rotation} scale={[size, size, size]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.8]} />
          <meshStandardMaterial color="#00f0ff" />
        </mesh>
      </group>
    );
  },
);
