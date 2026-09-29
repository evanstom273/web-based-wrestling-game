import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  DoubleSide,
  Matrix4,
  MeshStandardMaterial,
  SkeletonHelper,
  SkinnedMesh,
  Vector3,
} from 'three';
import { generateHuman } from '../game/scene/human/generateHuman';
import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
import { createHumanRig, skinGeometry } from '../game/scene/human/rig';
import { applyPose, type PoseSettings } from '../game/scene/human/poses';
import { generateWardrobe } from '../game/scene/human/wardrobe';

export function HumanPreview({
  definition,
  wireframe,
  gear,
  pose,
}: {
  definition: WrestlerVisualDefinition;
  wireframe: boolean;
  gear: boolean;
  pose: PoseSettings;
}) {
  const { gl, invalidate } = useThree();
  const model = useMemo(
    () =>
      generateHuman(definition.body, { face: definition.face, hairstyle: definition.hairstyle }),
    [definition.body, definition.face, definition.hairstyle],
  );
  const rig = useMemo(() => {
    const r = createHumanRig(definition.body, model);
    skinGeometry(model.skin, r);
    skinGeometry(model.features, r, true);
    skinGeometry(model.hair, r, true);
    // Boot shells have the same leg ownership as their underlying ankle/calf.
    const p = model.boots.getAttribute('position'),
      regions = model.boots.getAttribute('region');
    for (let i = 0; i < p.count; i++) regions.setX(i, p.getX(i) < 0 ? 1 : 2);
    skinGeometry(model.boots, r);
    return r;
  }, [definition.body, model]);
  const wardrobe = useMemo(
    () => generateWardrobe(model, definition.body, definition.wardrobe),
    [model, definition.body, definition.wardrobe],
  );
  const materials = useMemo(() => {
    const make = (color: string, vertexColors = false) =>
      new MeshStandardMaterial({
        color,
        roughness: 0.85,
        side: DoubleSide,
        wireframe,
        vertexColors,
      });
    const accent = make(definition.accent);
    accent.polygonOffset = true;
    accent.polygonOffsetFactor = -1;
    accent.polygonOffsetUnits = -1;
    return {
      skin: make(definition.skin),
      primary: make(definition.gear),
      accent,
      boot: make('#24282b'),
      hair: make(definition.hair),
      features: make('#ffffff', true),
    };
  }, [definition.skin, definition.gear, definition.accent, definition.hair, wireframe]);
  const meshes = useMemo(() => {
    const parts = [
      { name: 'skin', geometry: model.skin, material: materials.skin },
      { name: 'features', geometry: model.features, material: materials.features },
    ];
    if (definition.hairstyle !== 'none' && (!gear || definition.wardrobe.mask === 'none'))
      parts.push({ name: 'hair', geometry: model.hair, material: materials.hair });
    if (gear) {
      if (definition.wardrobe.boots !== 'none')
        parts.push({ name: 'boots', geometry: model.boots, material: materials.boot });
      parts.push(
        ...wardrobe.batches.map((p) => ({
          name: p.name,
          geometry: p.geometry,
          material: materials[p.material],
        })),
      );
    }
    return parts.map((part) => {
      const mesh = new SkinnedMesh(part.geometry, part.material);
      mesh.name = part.name;
      mesh.bind(rig.skeleton, new Matrix4());
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      return mesh;
    });
  }, [model, rig, wardrobe, materials, gear, definition.hairstyle, definition.wardrobe]);
  const helper = useMemo(() => {
    const h = new SkeletonHelper(rig.root);
    (Array.isArray(h.material) ? h.material : [h.material]).forEach((m) => {
      m.depthTest = false;
      m.transparent = true;
    });
    h.renderOrder = 10;
    return h;
  }, [rig]);
  useEffect(() => () => model.dispose(), [model]);
  useEffect(() => () => rig.skeleton.dispose(), [rig]);
  useEffect(() => () => wardrobe.dispose(), [wardrobe]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  useEffect(
    () => () => {
      helper.geometry.dispose();
      (Array.isArray(helper.material) ? helper.material : [helper.material]).forEach((m) =>
        m.dispose(),
      );
    },
    [helper],
  );
  useEffect(() => {
    invalidate();
  }, [invalidate, pose, meshes]);
  const footIds = useMemo(() => {
    const p = model.skin.getAttribute('position');
    return Array.from({ length: p.count }, (_, i) => i).filter(
      (i) => p.getY(i) < 0.07 * model.scale,
    );
  }, [model]);
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ clock }) => {
    applyPose(rig, pose, clock.elapsedTime);
    const skin = meshes[0]!;
    let floor = Infinity;
    for (const id of footIds) {
      point.fromBufferAttribute(model.skin.getAttribute('position'), id);
      skin.applyBoneTransform(id, point);
      floor = Math.min(floor, point.y);
    }
    rig.root.position.setY(rig.root.position.y - floor);
    rig.root.updateMatrixWorld(true);
    rig.skeleton.update();
    gl.domElement.setAttribute('data-rendered-height', definition.body.height.toFixed(2));
    gl.domElement.setAttribute('data-pose', pose.pose);
    gl.domElement.setAttribute('data-outfit', definition.wardrobe.outfit);
    gl.domElement.setAttribute('data-bones', String(rig.bones.length));
    gl.domElement.setAttribute(
      'data-triangles',
      String(meshes.reduce((n, m) => n + m.geometry.index!.count / 3, 0)),
    );
    if (pose.playing) invalidate();
  });
  return (
    <group dispose={null}>
      <primitive object={rig.root} />
      {meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
      {pose.skeleton && <primitive object={helper} />}
    </group>
  );
}
