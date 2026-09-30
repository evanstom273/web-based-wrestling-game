import { Color, DoubleSide, MeshStandardMaterial, Vector3 } from 'three';
/** Small analytic irises and hair-coloured brows, on the existing fitted feature patches. */
export function createFeatureMaterial(uniforms: {
  faceTransform: { value: Vector3 };
  browColor: { value: Color };
}) {
  const material = new MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.48,
    side: DoubleSide,
  });
  material.customProgramCacheKey = () => 'wrestler-facial-detail-v1';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      'attribute float featureId; varying float vFeatureId; varying vec3 vFeaturePosition;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvFeatureId = featureId; vFeaturePosition = position;',
    );
    shader.fragmentShader =
      'uniform vec3 faceTransform; uniform vec3 browColor; varying float vFeatureId; varying vec3 vFeaturePosition;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec3 facePoint = (vFeaturePosition / faceTransform.x + vec3(0.0,faceTransform.y,0.0))/faceTransform.z;
      if(vFeatureId > 1.5 && vFeatureId < 2.5) {
        vec2 eye = (vec2(abs(facePoint.x),facePoint.y)-vec2(0.0355,0.1235))/0.0035;
        float radius = length(eye);
        if(radius > 1.0) discard;
        float fibers = 0.5+0.5*sin(atan(eye.y,eye.x)*29.0+radius*18.0);
        diffuseColor.rgb = mix(vec3(0.035,0.021,0.009),vec3(0.13,0.085,0.036),fibers)*smoothstep(0.24,0.46,radius);
        diffuseColor.rgb *= 1.0-smoothstep(0.78,1.0,radius)*0.65;
        float catchlight = 1.0-smoothstep(0.08,0.23,length(eye-vec2(-0.28,0.34)));
        diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.8),catchlight);
      }
      if(vFeatureId > 2.5 && vFeatureId < 3.5) {
        float hairs = 0.9+0.1*sin(facePoint.x*8500.0+facePoint.y*2500.0);
        diffuseColor.rgb = browColor*hairs*0.75;
      }
    `,
    );
  };
  return material;
}
