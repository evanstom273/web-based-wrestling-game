# Procedural wrestler materials

The Create a Wrestler renderer uses the same low-poly body and wardrobe meshes with generated surface data and physically based shading. No character textures, image assets, HDRIs or fonts are downloaded. The match renderer is unchanged.

## Data and rendering

`src/game/scene/human/materials/` owns the system independently of React:

- `textures.ts`: deterministic, seamless packed textures. Red modulates colour, green stores roughness, blue stores relief; alpha is reserved. Skin, fabric, tape and leather are 256²; directional hair is 512². The five maps total 2 MiB before mipmaps (about 2.67 MiB with them). Colour choices tint this data, so changing a palette does not regenerate textures.
- `materials.ts`: physical material construction, palette/uniform binding and stable shader cache keys. Skin, fabric, hair and leather have different specular/sheens; they remain non-metallic.
- `shaders.ts`: triplanar sampling from unposed body coordinates. Detail travels with the skin rather than swimming through animated poses. Blended projection avoids UV seams on branching limbs. Hair uses skull-relative cylindrical coordinates for directional locks. Screen derivatives turn small relief values into surface normals without adding vertices.
- `garmentAttributes.ts`: marks tape and knee-pad panels before material batching and estimates boundary distance for seams. Tape stays matte while the adjacent stretch fabric has a restrained sheen. This keeps the existing three garment batches and at most seven visible character meshes.
- `featureMaterial.ts`: round procedural irises, radial variation, a small catchlight and brows tinted by the selected hair colour. The existing projected feature patches carry `featureId`; no additional draw calls are needed.

Skin combines subtle pores, broad tonal variation, restrained cheek/lip warmth and socket shading. Hair combines irregular strands, wider locks, root shading and restrained sheen. Clothing gets a fine weave and edge stitching. Tape gets fibres and wrap lines. Boots get leather grain, sole/tongue shading, seams, eyelets and crossed laces; tall shafts use the same material and coordinate system.

`HumanPreview.tsx` memoizes the five textures, supplies the materials and disposes both on teardown. Material colours and body-dependent landmarks are uniforms; updates reuse the same material instances and compiled programs rather than recompiling on each slider or palette change. New material styles should extend this factory and the packed-data generator; garment identity belongs in `garmentAttributes.ts`, not conditional meshes in React.

## Studio and resolution

`StudioEnvironment.tsx` creates a Three.js `RoomEnvironment` and prefilters it once into a 128-pixel cube reflection map, then disposes the temporary scene and generator. Drei attaches the result declaratively and restores the previous environment when unmounted. Neutral key/rim lights retain readable anatomy; lower fill prevents washed-out skin. The canvas uses antialiasing and a device-pixel-ratio cap of 2. Texture mipmaps and capped anisotropic filtering preserve close detail while reducing distant shimmer. Rendering remains on demand unless a pose/orbit is animating.

## Review and limits

Review passes covered normal distance and face close-ups, dark/light skin, black/brown/blonde/grey hair, tops/tights/singlets, tall boots, tape, front/rear/side/three-quarter views and reach/squat poses. Early passes were corrected for excessive fill light, regular ribbed hair, overly coarse skin grain and studio reflection-map cost.

The textures improve surface response; they do not turn the authored stylized faces or hair silhouettes into scanned models. Hair is still a solid low-poly shell, not strand geometry or alpha cards. Boot laces and stitching are shading details without silhouette thickness. Boundary-based stitches are an approximation, particularly on narrow panels. There is no sweat simulation, subsurface scattering, cloth collision or hair physics. This is not an on-device frame-rate guarantee.

Tests cover deterministic texture generation, directional hair and tile continuity, the memory/filtering budget, disposal, stable material reuse and garment tags surviving batching. A browser test renders all hair styles, a masked female build, tall boots, tape and a pose while rejecting shader/runtime errors. Existing model, storage, responsive and match checks remain intact. Playwright runs one worker locally and in CI: concurrent software-rendered WebGL sessions contend for the same rasterizer and can exhaust the unchanged test timeouts. Assertions and coverage are unchanged.

[Before/after](materials/comparison.png) · [Hair detail](materials/hair.png) · [Gear and skin range](materials/builds.png) · [Posed materials](materials/poses.png) · [Phone](materials/phone.png) · [Foldable](materials/foldable.png)
