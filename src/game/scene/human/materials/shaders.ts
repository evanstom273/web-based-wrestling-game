/** Bind-space sampling survives skeletal deformation without texture swimming or UV seams. */
export const fragmentDeclarations = /* glsl */ `
uniform sampler2D surfaceMap;
uniform sampler2D tapeMap;
uniform vec3 modelTransform;
uniform vec3 bodyMeasures;
uniform float bootTop;
varying vec3 vRestPosition;
varying vec3 vRestNormal;
#ifdef GARMENT_SURFACE
varying float vSurfaceTag;
varying float vEdgeDistance;
#endif
vec4 surfaceTriplanar(sampler2D tex, vec3 p, vec3 n, float frequency) {
  vec3 w = pow(abs(n), vec3(4.0)); w /= max(dot(w, vec3(1.0)), 0.0001);
  return texture2D(tex, p.yz * frequency) * w.x + texture2D(tex, p.xz * frequency) * w.y + texture2D(tex, p.xy * frequency) * w.z;
}
float softSpot(vec2 p, vec2 centre, vec2 radius) { vec2 d = (p-centre)/radius; return exp(-dot(d,d)*2.0); }
float fineLine(float distance, float width) { float aa = max(fwidth(distance), 0.00005); return 1.0-smoothstep(width-aa, width+aa, abs(distance)); }
vec3 surfaceNormal(vec3 position, vec3 n, float h) {
  vec3 dx = dFdx(position), dy = dFdy(position);
  vec3 a = cross(dy, n), b = cross(n, dx);
  float determinant = dot(dx, a);
  vec3 gradient = sign(determinant) * (dFdx(h)*a + dFdy(h)*b);
  return normalize(abs(determinant)*n - gradient);
}
`;
export const surfaceFragment = /* glsl */ `
vec3 rest = vRestPosition / modelTransform.x + vec3(0.0, modelTransform.y, 0.0);
vec3 restNormal = normalize(vRestNormal);
vec4 surfaceSample = surfaceTriplanar(surfaceMap, rest, restNormal, 7.0);
float reliefScale = 0.000065;
#ifdef SURFACE_SKIN
  surfaceSample = surfaceTriplanar(surfaceMap, rest, restNormal, 10.0);
  float broadTone = sin(rest.x*31.0 + sin(rest.y*19.0))*sin(rest.z*23.0 + rest.y*11.0);
  diffuseColor.rgb *= surfaceSample.r / 0.86 * (1.0 + broadTone*0.025);
  vec3 head = vec3(rest.x, rest.y-modelTransform.z, rest.z) / bodyMeasures.x;
  float front = smoothstep(0.015, 0.055, head.z);
  float cheek = softSpot(vec2(abs(head.x),head.y),vec2(0.049,0.084),vec2(0.024,0.027))*front;
  float socket = softSpot(vec2(abs(head.x),head.y),vec2(0.035,0.126),vec2(0.026,0.013))*front;
  float lips = softSpot(head.xy, vec2(0.0,0.041),vec2(0.031,0.008))*front;
  diffuseColor.rgb *= mix(vec3(1.0),vec3(1.03,0.87,0.83),cheek*0.4+lips*0.7);
  diffuseColor.rgb *= 1.0-socket*0.16;
  surfaceSample.g = mix(surfaceSample.g,0.48,cheek*0.3);
#endif
#ifdef SURFACE_HAIR
  vec3 h = vec3(rest.x, rest.y-modelTransform.z, rest.z+0.012) / bodyMeasures.x;
  float angle = atan(h.x,h.z)/6.2831853;
  vec2 hairUV = vec2(angle + sin(h.y*10.0)*0.035, h.y*3.0);
  surfaceSample = texture2D(surfaceMap,hairUV);
  diffuseColor.rgb *= surfaceSample.r / 0.7;
  // Soft root darkening, with locks following the skull rather than a separate hair helmet.
  diffuseColor.rgb *= mix(0.69,1.05,smoothstep(0.145,0.215,h.y));
  reliefScale = 0.000055;
#endif
#ifdef SURFACE_FABRIC
  #ifdef GARMENT_SURFACE
    if (vSurfaceTag > 0.5 && vSurfaceTag < 1.5) {
      surfaceSample = surfaceTriplanar(tapeMap,rest,restNormal,9.0);
      float wrap = fineLine(fract((rest.y+abs(rest.x)*0.36)*105.0)-0.5,0.035);
      surfaceSample.r *= 1.0-wrap*0.12;
    }
    if(vSurfaceTag > 1.5) surfaceSample.g = min(0.85,surfaceSample.g+0.17);
    float hem = 1.0-smoothstep(0.0005,0.004,vEdgeDistance);
    float stitch = fineLine(vEdgeDistance-0.003,0.0006);
    float dash = smoothstep(0.35,0.5,sin((rest.x+rest.y+rest.z)*1800.0));
    surfaceSample.r *= 1.0-hem*0.13+stitch*dash*0.12;
  #endif
  diffuseColor.rgb *= surfaceSample.r / 0.88;
  reliefScale = 0.0002;
#endif
#ifdef SURFACE_LEATHER
  surfaceSample = surfaceTriplanar(surfaceMap, rest, restNormal, 10.0);
  float y = rest.y/bodyMeasures.z;
  float x = abs(rest.x)-(0.205-clamp(y-0.13,0.0,0.34)*0.10)*bodyMeasures.y;
  float front = smoothstep(0.025,0.065,rest.z);
  float shaft = smoothstep(0.105,0.14,y)*(1.0-smoothstep(bootTop-0.025,bootTop,y));
  float tongue = (1.0-smoothstep(0.03,0.037,abs(x)))*shaft*front;
  float seam = fineLine(abs(x)-0.039,0.0012)*shaft*front;
  float rows = (y-0.135)*48.0;
  float diagonal = abs(fract(rows)-0.5)*0.095-0.024;
  float lace = fineLine(x-diagonal,0.0018)*tongue;
  lace = max(lace,fineLine(x+diagonal,0.0018)*tongue);
  float eyelet = fineLine(length(vec2((abs(x)-0.025)*1.2,(fract(rows)-0.5)/48.0))-0.0028,0.001)*shaft*front;
  float sole = 1.0-smoothstep(0.025,0.038,y);
  diffuseColor.rgb *= surfaceSample.r/0.82*(1.0-tongue*0.25-seam*0.25-sole*0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.26,0.28,0.29),lace*0.85+eyelet*0.65);
  surfaceSample.b += lace*0.3; surfaceSample.g = mix(surfaceSample.g,0.75,lace);
  reliefScale = 0.0003;
#endif
`;
export const reliefFragment = /* glsl */ `
normal = surfaceNormal(-vViewPosition,normal,surfaceSample.b*reliefScale);
`;
