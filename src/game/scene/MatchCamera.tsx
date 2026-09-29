import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function MatchCamera() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(-0.45, 3.55, 6.7);
    camera.lookAt(0.05, 1.1, -0.7);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
