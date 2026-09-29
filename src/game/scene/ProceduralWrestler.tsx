import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

export type ProceduralWrestlerProps = {
  position: [number, number, number];
  primary: string;
  secondary: string;
  skin: string;
  mirrored?: boolean;
};

export function ProceduralWrestler({
  position,
  primary,
  secondary,
  skin,
  mirrored = false,
}: ProceduralWrestlerProps) {
  const visual = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!visual.current) return;
    const phase = mirrored ? Math.PI : 0;
    visual.current.position.y = Math.sin(clock.elapsedTime * 1.7 + phase) * 0.018;
  });

  return (
    <RigidBody
      type="kinematicPosition"
      position={position}
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.72, 0.32]} position={[0, 1.05, 0]} />
      <group ref={visual} rotation-y={mirrored ? Math.PI : 0}>
        <mesh castShadow position={[0, 1.2, 0]}>
          <boxGeometry args={[0.78, 0.9, 0.42]} />
          <meshStandardMaterial color={primary} roughness={0.78} />
        </mesh>

        <mesh castShadow position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.29, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        <mesh castShadow position={[0, 2.08, -0.02]}>
          <boxGeometry args={[0.56, 0.13, 0.48]} />
          <meshStandardMaterial color="#17191e" roughness={0.95} />
        </mesh>

        {[-0.52, 0.52].map((x, index) => (
          <group key={`arm-${x}`} position={[x, 1.2, 0]} rotation-z={index === 0 ? -0.08 : 0.08}>
            <mesh castShadow>
              <cylinderGeometry args={[0.11, 0.12, 0.82, 8]} />
              <meshStandardMaterial color={skin} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, -0.3, 0]}>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
              <meshStandardMaterial color={secondary} roughness={0.8} />
            </mesh>
          </group>
        ))}

        {[-0.22, 0.22].map((x) => (
          <group key={`leg-${x}`} position={[x, 0.45, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.14, 0.16, 0.92, 8]} />
              <meshStandardMaterial color={primary} roughness={0.82} />
            </mesh>
            <mesh castShadow position={[0, -0.37, 0.06]}>
              <boxGeometry args={[0.3, 0.28, 0.46]} />
              <meshStandardMaterial color="#15171c" roughness={0.9} />
            </mesh>
          </group>
        ))}

        <mesh castShadow position={[0, 0.82, 0]}>
          <boxGeometry args={[0.82, 0.18, 0.44]} />
          <meshStandardMaterial color={secondary} metalness={0.15} roughness={0.6} />
        </mesh>
      </group>
    </RigidBody>
  );
}
