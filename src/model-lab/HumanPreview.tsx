import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { generateHuman } from '../game/scene/human/generateHuman';
import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
export function HumanPreview({
  definition,
  wireframe,
  gear,
}: {
  definition: WrestlerVisualDefinition;
  wireframe: boolean;
  gear: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const model = useMemo(() => generateHuman(definition.body), [definition.body]);
  useEffect(() => () => model.dispose(), [model]);
  const parts = [
    { geometry: model.skin, color: definition.skin, visible: true },
    { geometry: model.trunks, color: definition.gear, visible: gear },
    { geometry: model.boots, color: '#24282b', visible: gear },
    { geometry: model.tape, color: definition.accent, visible: gear },
    { geometry: model.pads, color: definition.gear, visible: gear },
    { geometry: model.hair, color: definition.hair, visible: definition.hairstyle === 'crop' },
    { geometry: model.features, color: '#ffffff', visible: true },
  ];
  return (
    <group dispose={null}>
      {parts.map((part, i) => (
        <mesh
          key={i}
          geometry={part.geometry}
          onAfterRender={
            i === 0
              ? () => {
                  gl.domElement.dataset.renderedHeight = definition.body.height.toFixed(2);
                  gl.domElement.dataset.triangles = String(model.triangles);
                }
              : undefined
          }
          visible={part.visible}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={part.color}
            roughness={0.86}
            vertexColors={part.geometry === model.features}
            wireframe={wireframe}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
