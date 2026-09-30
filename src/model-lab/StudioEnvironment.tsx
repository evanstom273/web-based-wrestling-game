import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Code-built studio bounce/reflections. No HDRI download or per-frame environment capture. */
export function StudioEnvironment() {
  const { gl } = useThree();
  const target = useMemo(() => {
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const result = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    room.dispose();
    generator.dispose();
    return result;
  }, [gl]);
  useEffect(() => () => target.dispose(), [target]);
  return <Environment map={target.texture} environmentIntensity={0.3} />;
}
