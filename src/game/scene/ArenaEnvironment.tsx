import { Grid } from '@react-three/drei';

export function ArenaEnvironment() {
  return (
    <>
      <color attach="background" args={['#090b10']} />
      <fog attach="fog" args={['#090b10', 11, 26]} />

      <hemisphereLight args={['#b9d8ff', '#29160f', 1.05]} />
      <directionalLight
        castShadow
        position={[-4, 9, 5]}
        intensity={2.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 4, -4]} intensity={18} distance={10} color="#e11d48" />
      <pointLight position={[5, 4, 4]} intensity={18} distance={10} color="#2563eb" />

      <Grid
        position={[0, -0.03, 0]}
        args={[26, 26]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1f2937"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={18}
        fadeStrength={1.2}
        infiniteGrid={false}
      />
    </>
  );
}
