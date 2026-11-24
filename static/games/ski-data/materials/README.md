# Alpine surface art

Generated with the built-in image_gen tool on 2026-11-24. These are AI-created material images, not aerial imagery, photogrammetry or measured surface features. The actual mountain shape still comes from the separately attributed DEM. Wind crust / rock microrelief in the shader is decorative shading; persistent ski grooves and avalanche deposition use the simulation's actual geometry.

Runtime assets (self-contained, no external texture service):

- `alpine-granite.webp` — 1254 × 1254, approximately 575 KiB; encoded with cwebp quality 88.
- `alpine-snow.webp` — 1254 × 1254, approximately 203 KiB; encoded with cwebp quality 90.

Original generation prompts:

## Granite

Use case: photorealistic-natural. Asset type: seamless game material texture, alpine granite albedo. Create a single square orthographic close-up photograph of weathered dark grey Mont Blanc granite rock, with layered striations, fractured mineral plates, subtle warm grey quartz veins and fine granular crystalline surface. Entire frame rock material, consistent scale, realistically irregular fractured rock without large boulders. Neutral diffuse flat light, no directional shadows baked in, no perspective, no snow, no plants, no objects, no text or borders. Seamless tileable edges on all sides. This is a physically based material texture to be wrapped on the real 3D mountain, not a landscape image. Fine natural details, muted grey charcoal stone.

## Snow

Use case: photorealistic-natural. Asset type: seamless tileable snow material texture for a realistic 3D skiing game. Single square top-down orthographic macro photograph covering approximately 3 metres of untouched alpine wind-packed powder snow. Pure fresh ivory white snow with extremely delicate pale cool blue grain, tiny crystalline sparkles, irregular soft wind-scoured shallow ripples and subtle granular crust. High fidelity physically believable snow, no footprints, no ski tracks, no rocks, no horizon, no trees, no text, no objects. Even soft neutral illumination, no strong directional lighting or dramatic cast shadows. Flat continuous snow surface filling frame. Seamless tileable edges, no borders or seams. Fine restrained surface variation, mostly light near-white, not dirty and not grey. This is material albedo for a 3D surface, not a landscape or a render of a mountain.
