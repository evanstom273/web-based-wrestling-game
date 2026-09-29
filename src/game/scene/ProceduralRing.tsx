import { Line } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

const ringHalf = 4;
const postHeight = 2.8;
const ropeHeights = [1.0, 1.48, 1.96] as const;

const corners = [
  [-ringHalf, -ringHalf],
  [ringHalf, -ringHalf],
  [-ringHalf, ringHalf],
  [ringHalf, ringHalf],
] as const;

export function ProceduralRing() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 0.18, 4]} position={[0, 0.52, 0]} friction={1.0} />
        <mesh receiveShadow position={[0, 0.34, 0]}>
          <boxGeometry args={[8.6, 0.68, 8.6]} />
          <meshStandardMaterial color="#202633" roughness={0.88} />
        </mesh>
        <mesh receiveShadow position={[0, 0.61, 0]}>
          <boxGeometry args={[8, 0.16, 8]} />
          <meshStandardMaterial color="#d9dce1" roughness={0.96} />
        </mesh>
      </RigidBody>

      {corners.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, postHeight / 2 + 0.5, 0]}>
            <cylinderGeometry args={[0.105, 0.105, postHeight, 10]} />
            <meshStandardMaterial color="#13161b" metalness={0.35} roughness={0.52} />
          </mesh>
          {ropeHeights.map((height) => (
            <mesh key={height} castShadow position={[0, height, 0]}>
              <boxGeometry args={[0.35, 0.22, 0.35]} />
              <meshStandardMaterial color="#2d323c" roughness={0.72} />
            </mesh>
          ))}
        </group>
      ))}

      {ropeHeights.flatMap((height) => [
        <Line key={`front-${height}`} points={[[-4, height, -4], [4, height, -4]]} color="#b91c2c" lineWidth={2} />,
        <Line key={`back-${height}`} points={[[-4, height, 4], [4, height, 4]]} color="#b91c2c" lineWidth={2} />,
        <Line key={`left-${height}`} points={[[-4, height, -4], [-4, height, 4]]} color="#b91c2c" lineWidth={2} />,
        <Line key={`right-${height}`} points={[[4, height, -4], [4, height, 4]]} color="#b91c2c" lineWidth={2} />,
      ])}
    </group>
  );
}
