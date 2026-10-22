# Draft 01 verification

Verified on 5 October 2026, Asia/Dubai client date.

## Source and assets

- Both copied PNG references have matching SHA256 hashes against the original attachments. See `planning/reference-integrity.json`.
- All requested project directories exist; SVG/Three.js preferences are recorded in `AGENTS.md` and the design document.
- Seven SVG sheets are present in both `drafts/svg/` and `exports/svg/` and parse as XML. They contain vector paths and no embedded raster images.
- The ornament study labels were measured in the browser and fit the 1540 × 1230 sheet.
- Generated component CSV contains 583 modeled assembly, part, and decorative-region entries. This is not a manufacturing piece total.
- Portable Three.js JSON is saved in `exports/threejs/default-table-v01.json`.

## Automated model checks — 7 passed

1. Nine drawers, two pedestals, eight identified feet, unique IDs, and valid parent links.
2. Representative closed/open drawer clearance rules at default, minimum, and larger custom dimensions.
3. Coherent motion of fronts, boxes, relief, and keyholes; exact uniform scaling.
4. Width changes redistribute foliage while preserving portrait aspect ratio.
5. Invalid dimensions rejected; finite mesh vertices; high-detail source retains subdivision counts when scaled.
6. SVG IDs, vector curves, dimension metadata, and no non-finite coordinates.
7. Three.js ObjectLoader round-trip preserves model bounds, representative component IDs, ellipsoid geometry, and configuration.

The export check uncovered two serialization limitations: deformed SphereGeometry lost its deformation when reconstructed from sphere parameters, and CurvePath-based TubeGeometry was not registered for standard loader reconstruction. Rounded facial volumes and swept veins are now exported as BufferGeometry with their actual vertices. Shared editable curves remain the source of truth.

## Browser checks — 1 comprehensive scenario passed

Chrome loads the detailed model without page errors. The scenario verifies:

- Model count and high-detail loading.
- Orbit, wheel zoom, and right-drag pan change the camera/target.
- Drawer opening and coherent front/box/ornament motion.
- Component selection and evidence labels.
- Exploded state.
- Uniform half-scale, custom dimensions, and reset.
- SVG, settings JSON, PNG, and Three.js JSON downloads.
- All seven SVG gallery links.
- Mobile visibility and absence of horizontal page overflow at 375 px.

Machine-readable results: `checks/browser-results.json`. Screenshots: `exports/screenshots/`.

## Visual review and limits

Reviewed front and angled browser views against the reference photographs. The overall tabletop/pedestal form, nine-drawer layout, panelled sides, short fluted feet, shaped aprons, and five interpreted relief families are represented. The first review prompted wider facial outlines, rounded facial volumes, darker related wood tones, and closer camera framing.

The carving is an editable approximation, with clear stylistic differences from the original sculpture. No claim of exact replica geometry is made. The assumed base ratio is wider than the apparent front-photo ratio. Rear surfaces, four rear feet, box construction, supports, and relief depths remain inferred; timber, top covering, joinery, age, and provenance remain unverified.

The high-detail representation contains approximately 1.89 million triangles. Preview reduces tessellation without changing the source curves. Performance depends on the user's GPU/browser; this is a mesh draft, not a tolerance-verified manufacturing model.
