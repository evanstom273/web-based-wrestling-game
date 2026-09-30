import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
import type { PoseSettings } from '../game/scene/human/poses';
import { HumanPreview } from './HumanPreview';
import { StudioEnvironment } from './StudioEnvironment';
import { type View } from './views';
function StudioCamera({
  view,
  revision,
  rotating,
  focus,
  height,
}: {
  view: View;
  revision: number;
  rotating: boolean;
  focus: 'head' | 'full';
  height: number;
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
    const distance =
      focus === 'head'
        ? Math.max(0.94, 0.75 / (size.width / size.height))
        : Math.max(3.9, 2.8 / (size.width / size.height));
    const targetY = focus === 'head' ? height * 0.88 : 1.02;
    camera.position.set(Math.sin(a) * distance, targetY + 0.06, Math.cos(a) * distance);
    camera.lookAt(0, targetY, 0);
    controls.current?.target.set(0, targetY, 0);
    controls.current?.update();
  }, [camera, view, revision, size.width, size.height, focus, height]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      minDistance={focus === 'head' ? 0.6 : 2.2}
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
  focus,
}: {
  definition: WrestlerVisualDefinition;
  view: View;
  revision: number;
  rotating: boolean;
  wireframe: boolean;
  gear: boolean;
  pose: PoseSettings;
  focus: 'head' | 'full';
}) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2, 1.08, 3], fov: 37, near: 0.05, far: 40 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#b6b9b9']} />
      <fog attach="fog" args={['#b6b9b9', 7, 18]} />
      <StudioEnvironment />
      <hemisphereLight args={['#dce5ed', '#655e55', 0.45]} />
      <directionalLight
        castShadow
        position={[-3, 5, 4]}
        intensity={2.4}
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
      <directionalLight position={[3, 2, -3]} intensity={1.5} color="#eef2ff" />
      <HumanPreview definition={definition} wireframe={wireframe} gear={gear} pose={pose} />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.055}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#a6aaaa" roughness={1} />
      </mesh>
      <mesh receiveShadow position-y={-0.025}>
        <cylinderGeometry args={[0.78, 0.8, 0.05, 64]} />
        <meshStandardMaterial color="#424c49" roughness={0.95} />
      </mesh>
      <StudioCamera
        view={view}
        revision={revision}
        rotating={rotating}
        focus={focus}
        height={definition.body.height}
      />
    </Canvas>
  );
}
