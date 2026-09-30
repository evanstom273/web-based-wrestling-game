import { createFeatureMaterial } from './featureMaterial';
import { Color, DoubleSide, MeshPhysicalMaterial, Vector3 } from 'three';
import type { WrestlerVisualDefinition } from '../definition';
import type { HumanGeometry } from '../generateHuman';
import type { createSurfaceTextures, SurfaceKind } from './textures';
import { fragmentDeclarations, surfaceFragment, reliefFragment } from './shaders';

export function createWrestlerMaterials(
  maps: ReturnType<typeof createSurfaceTextures>['textures'],
) {
  const shared = {
    modelTransform: { value: new Vector3(1, 0, 1.6) },
    bodyMeasures: { value: new Vector3(1.065, 1, 1) },
    bootTop: { value: 0.32 },
  };
  const facial = {
    faceTransform: { value: new Vector3(1, -1.6, 1.065) },
    browColor: { value: new Color('#28211e') },
  };
  function make(color: string, kind: SurfaceKind, garment = false) {
    const material = new MeshPhysicalMaterial({
      color,
      roughness: 0.6,
      side: DoubleSide,
      metalness: 0,
      envMapIntensity: kind === 'skin' ? 0.35 : 0.65,
      sheen: kind === 'fabric' ? 0.22 : kind === 'hair' ? 0.12 : 0,
      sheenColor: color,
      sheenRoughness: 0.65,
      specularIntensity: kind === 'skin' ? 0.45 : kind === 'hair' ? 0.35 : 0.65,
    });
    material.name = `wrestler-${kind}`;
    material.customProgramCacheKey = () => `wrestler-surface-v1-${kind}-${garment}`;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.surfaceMap = { value: maps[kind] };
      shader.uniforms.tapeMap = { value: maps.tape };
      Object.assign(shader.uniforms, shared);
      shader.defines = {
        ...shader.defines,
        [`SURFACE_${kind.toUpperCase()}`]: 1,
        ...(garment ? { GARMENT_SURFACE: 1 } : {}),
      };
      const vertexDeclarations = `varying vec3 vRestPosition; varying vec3 vRestNormal;
        #ifdef GARMENT_SURFACE
        attribute float surfaceTag; attribute float edgeDistance;
        varying float vSurfaceTag; varying float vEdgeDistance;
        #endif\n`;
      shader.vertexShader = vertexDeclarations + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vRestPosition = position; vRestNormal = normal;
        #ifdef GARMENT_SURFACE
        vSurfaceTag = surfaceTag; vEdgeDistance = edgeDistance;
        #endif`,
      );
      shader.fragmentShader = fragmentDeclarations + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <map_fragment>', `#include <map_fragment>\n${surfaceFragment}`)
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = clamp(surfaceSample.g, 0.26, 0.96);',
        )
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\n${reliefFragment}`,
        );
    };
    return material;
  }
  const accent = make('#ffffff', 'fabric', true);
  accent.polygonOffset = true;
  accent.polygonOffsetFactor = -1;
  accent.polygonOffsetUnits = -1;
  const materials = {
    skin: make('#ffffff', 'skin'),
    hair: make('#ffffff', 'hair'),
    primary: make('#ffffff', 'fabric', true),
    accent,
    boot: make('#272b30', 'leather'),
    features: createFeatureMaterial(facial),
  };
  return {
    materials,
    update(
      d: WrestlerVisualDefinition,
      model: Pick<HumanGeometry, 'scale' | 'floor'>,
      wireframe: boolean,
    ) {
      const b = d.body;
      const headBase = 0.91 * b.legs + (1.6 - 0.91) * b.torso + (b.neckLength - 1) * 0.065;
      shared.modelTransform.value.set(model.scale, model.floor, headBase);
      shared.bodyMeasures.value.set(b.head * 1.065, b.hips, b.legs);
      shared.bootTop.value = d.wardrobe.boots === 'tall' ? 0.475 : 0.32;
      facial.faceTransform.value.set(model.scale, model.floor - headBase, b.head * 1.065);
      facial.browColor.value.set(d.hair);
      for (const [key, color] of [
        ['skin', d.skin],
        ['hair', d.hair],
        ['primary', d.gear],
        ['accent', d.accent],
      ] as const) {
        materials[key].color.set(color);
        materials[key].sheenColor.set(color);
      }
      Object.values(materials).forEach((material) => {
        if (material.wireframe !== wireframe) {
          material.wireframe = wireframe;
          material.needsUpdate = true;
        }
      });
    },
  };
}
