# Default table design project

- Keep all references, planning, drafts, models, checks, and exports inside this directory.
- Always deliver both editable SVG drawings and an editable Three.js version for visual design work, unless the user explicitly changes that preference.
- Detail and reference accuracy take priority. Maintain high-detail vector curves and geometry independently of overall model scale; do not replace the master with simplified preview assets.
- Use millimetres. The initial 1400 × 750 × 780 mm dimensions are provisional assumptions, never measured dimensions.
- Treat the two supplied photos as views of one nine-drawer pedestal desk. Distinguish confirmed observations, inferred construction, and unknowns.
- Keep dimensions, layout, component IDs, and ornament source shared between SVG and Three.js. Put shared editable definitions in models/shared/.
- Preserve individual drawer-row carving interpretations; do not substitute one generic motif for every front.
- Keep original references intact. Hidden construction, exact relief depths, timber species, and top covering remain unverified.
- Update the project design document and checks when changing geometry or assumptions. Run npm run check and npm run drawings; run npm run check:browser for viewer changes.
- User preferences recorded here apply to this project. Do not silently alter global agent settings.
