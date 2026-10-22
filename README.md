# Default table design — draft 01

Photo-based design study of a carved, nine-drawer pedestal desk. All project work belongs in this folder. **SVG and Three.js are the default deliverables; detail and accuracy take priority.**

Base dimensions: **1400 W × 750 D × 780 H mm**, provisional and unmeasured. The photos do not establish the exact relief, rear construction, timber species, or top covering.

## Open the draft

From this project folder in PowerShell:

```powershell
npm.cmd ci --cache .\.cache\npm
npm.cmd run start
```

Open **http://127.0.0.1:4173**. Dependencies are already installed in the initial delivery; `npm ci` is for a fresh checkout. The viewer uses locally installed Three.js, not a runtime CDN. Stop the server with Ctrl+C. Opening the HTML directly with `file://` will not load ES modules; use the server.

- Project design document: [drafts/documents/project-design-v01.md](drafts/documents/project-design-v01.md)
- Complete component inventory: [planning/parts-breakdown.csv](planning/parts-breakdown.csv)
- Editable vector views: [drafts/svg/](drafts/svg/)
- Copies ready to share: [exports/svg/](exports/svg/)
- Reference images: [references/originals/](references/originals/)
- Viewer source: [models/threejs/](models/threejs/)
- Shared source: [models/shared/](models/shared/)
- Browser evidence: [exports/screenshots/](exports/screenshots/)
- Portable Three.js model: [exports/threejs/default-table-v01.json](exports/threejs/default-table-v01.json)

## Inspect and export

Drag to orbit, scroll to zoom, and right-drag to pan. Choose a preset view, open the drawers, and separate the assemblies with the exploded slider. Select a component by name or click it. A selection outline and evidence description identify the selected assembly.

Expand **Size and detail** to change dimensions or uniform scale. High detail is the editable master representation; preview changes mesh subdivisions only. Expand **Export this draft** for an SVG of the selected preset, a Three.js JSON model, dimension settings, or a PNG of the current camera. Exported SVG uses the selected preset; arbitrary orbit angles affect PNG and model exports.

SVG exports are axonometric vector illustrations/elevations, not raster screenshots. They have editable paths and `data-component` identifiers. The Three.js JSON uses millimetres and can be loaded with `THREE.ObjectLoader`; it contains model geometry and current pose, without the ground, lights, or selection outline. It is a visual mesh model, not a manufacturing solid.

## Edit and regenerate

- Edit dimensional rules and component placement in `models/shared/design.mjs`.
- Edit master Bezier curves, portrait proportions, row variants, and foot profile in `models/shared/ornaments.mjs`.
- Edit SVG projection and sheet layout in `models/shared/svg.mjs`.
- Edit 3D tessellation and materials in `models/threejs/geometry.mjs`; viewer controls are in `viewer.mjs`.
- Update the design document and assumptions when changing reference interpretations.

```powershell
npm.cmd run drawings
npm.cmd run export:model
npm.cmd run check
npm.cmd run check:browser
```

`drawings` regenerates seven drawings into both SVG folders, the detailed CSV inventory, and the base dimension settings. `export:model` regenerates the portable JSON model at the default base dimensions. Do not make important edits only in generated SVGs: move them into the shared curves or they will be overwritten. Reload the browser after source changes.

## Resize consistently

Use **uniform scale** to make a geometrically identical smaller/larger model. A scale of 0.5 gives 700 × 375 × 390 mm from the base model, with exactly the same detail and subdivision counts.

Use **custom width/depth/height** to change the ratio. This regenerates pedestal spacing, panels, drawer boxes, and foliage. Masks are scaled uniformly to fit rather than stretched independently along X and Y. Very different ratios need renewed visual review even though the model remains editable.

Export **Dimension settings** from the viewer, place the JSON inside `planning/`, then regenerate matching SVGs:

```powershell
node drafts/svg/generate.mjs planning/my-dimensions.json
```

Alternatively, copy `planning/dimensions-v01.json` to a new settings file and edit its numbers. The optional argument is a local JSON settings file. Regeneration writes the chosen settings to `planning/dimensions-v01.json`; retain named copies for revisions.

Supported base dimensions: width 700–4000 mm, depth 400–2000 mm, height 400–1800 mm; uniform scale 0.1–5. These are software guardrails, not structural or ergonomic certifications. Geometry detail is independent of uniform scale. Internal model subdivision is adjustable through `quality: "high"` or `"preview"`.

## Verification

`npm run check` checks component counts, IDs, references, representative drawer clearances, coherent drawer motion, scaling, face aspect preservation, finite mesh vertices, and SVG metadata. `npm run check:browser` runs Chrome or Edge if available and checks the viewer, controls, resize modes, exports, responsive layout, and JavaScript errors. It saves screenshots and a report in `checks/browser-results.json`. A system browser is needed; no global CAD application is required.

The report and screenshots verify draft software behavior. They do not establish exact historical attribution, construction feasibility, manufacturing tolerances, or photo-exact sculpture.
