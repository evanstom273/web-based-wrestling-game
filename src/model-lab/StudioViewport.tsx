import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
import type { PoseSettings } from '../game/scene/human/poses';
import { HumanPreview } from './HumanPreview';
import { type View } from './views';
function StudioCamera({
  view,
  revision,
  rotating,
}: {
  view: View;
  revision: number;
  rotating: boolean;
}) {
  const controls = useRef<OrbitControlsType>(null);
  const { camera, size } = useThree();
  useEffect(() => {
    const angles: Record<View, number> = {
      Front: 0,
      Rear: Math.PI,
      Left: -Math.PI / 2,
      Right: Math.PI / 2,
      'Three-quarter': Math.PI / 5,
    };
    const a = angles[view];
    const distance = Math.max(3.9, 2.8 / (size.width / size.height));
    camera.position.set(Math.sin(a) * distance, 1.08, Math.cos(a) * distance);
    camera.lookAt(0, 1.02, 0);
    controls.current?.target.set(0, 1.02, 0);
    controls.current?.update();
  }, [camera, view, revision, size.width, size.height]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      minDistance={2.2}
      maxDistance={6}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI * 0.68}
      autoRotate={rotating}
      autoRotateSpeed={0.65}
    />
  );
}
export function StudioViewport({
  definition,
  view,
  revision,
  rotating,
  wireframe,
  gear,
  pose,
}: {
  definition: WrestlerVisualDefinition;
  view: View;
  revision: number;
  rotating: boolean;
  wireframe: boolean;
  gear: boolean;
  pose: PoseSettings;
}) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [2, 1.08, 3], fov: 37, near: 0.05, far: 40 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#b6b9b9']} />
      <hemisphereLight args={['#ffffff', '#77736c', 1.7]} />
      <directionalLight
        castShadow
        position={[-3, 5, 4]}
        intensity={2.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={3}
        shadow-camera-bottom={-2}
        shadow-normalBias={0.005}
        shadow-bias={-0.0002}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
      />
      <directionalLight position={[3, 2, -3]} intensity={1.4} color="#eef2ff" />
      <HumanPreview definition={definition} wireframe={wireframe} gear={gear} pose={pose} />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#a6aaaa" roughness={1} />
      </mesh>
      <StudioCamera view={view} revision={revision} rotating={rotating} />
    </Canvas>
  );
}
