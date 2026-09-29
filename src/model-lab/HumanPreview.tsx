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
  const model = useMemo(() => generateHuman(definition), [definition]);
  useEffect(() => () => model.dispose(), [model]);
  const parts = [
    { geometry: model.skin, color: definition.skin, visible: true },
    { geometry: model.trunks, color: definition.gear, visible: gear },
    { geometry: model.boots, color: '#24282b', visible: gear },
    { geometry: model.tape, color: definition.accent, visible: gear },
    { geometry: model.pads, color: definition.gear, visible: gear },
    { geometry: model.hair, color: definition.hair, visible: definition.hairstyle === 'crop' },
    { geometry: model.features, color: '#392c29', visible: true },
  ];
  return (
    <group dispose={null}>
      {parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} visible={part.visible} castShadow receiveShadow>
          <meshStandardMaterial
            color={part.color}
            roughness={0.86}
            wireframe={wireframe}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
