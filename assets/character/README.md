# Hazmat worker game character (blockout + textures)

Build: `python build_character.py` (headless, needs the `bpy` module, tested with bpy 5.2.3 on Python 3.13).

Units: metres, Z up, faces -Y, height 1.0 m.

Outputs in `output/`:
- `character.blend`, `character.glb`, `character.fbx`
- `textures/char_basecolor.png`, `char_roughness.png`, `char_normal.png` (2048 px, one shared atlas)
- `qa_report.json`, `silhouette_front_side_back.png`

Limits of this pass: geometry is parametric (loft/ellipsoid) rather than hand-sculpted, the
normal map is derived from a height field in UV space, and the wounds are painted on the
suit rather than cut into the mesh. Retopology and detail sculpting still need a manual pass in Blender.
