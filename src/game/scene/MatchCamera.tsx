import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function MatchCamera() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);

    if (aspect < 1.35) {
      camera.position.set(-0.5, 4.15, 8.2);
    } else if (aspect < 1.65) {
      camera.position.set(-0.48, 3.8, 7.3);
    } else {
      camera.position.set(-0.45, 3.55, 6.7);
    }

    camera.lookAt(0.05, 1.1, -0.7);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
}
