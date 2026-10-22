import fs from 'node:fs/promises';
import {buildModel} from '../../models/threejs/geometry.mjs';
const model=buildModel();
await fs.writeFile(new URL('./default-table-v01.json',import.meta.url),JSON.stringify(model.root.toJSON()));
model.dispose();console.log('Exported default-table-v01.json: Three.js ObjectLoader model, millimetres, closed drawers.');
