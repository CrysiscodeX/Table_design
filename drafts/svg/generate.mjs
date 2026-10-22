import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDesign} from '../../models/shared/design.mjs';
import {renderSVG,ornamentStudy} from '../../models/shared/svg.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
let input={};
if(process.argv[2]) input=JSON.parse(await fs.readFile(path.resolve(process.argv[2]),'utf8'));
const design=createDesign(input);
const drawings=[['front-elevation.svg',{view:'front'}],['left-elevation.svg',{view:'left'}],['top-view.svg',{view:'top'}],['front-left-closed.svg',{view:'perspective'}],['front-left-open.svg',{view:'perspective',open:.7}],['exploded-assembly.svg',{view:'perspective',open:.5,explode:1}]];
for(const [name,options] of drawings) {
  const svg=renderSVG(design,options);
  for(const folder of ['drafts/svg','exports/svg']) await fs.writeFile(path.join(root,folder,name),svg);
}
for(const folder of ['drafts/svg','exports/svg']) await fs.writeFile(path.join(root,folder,'ornament-studies.svg'),ornamentStudy());
const csv=v=>'"'+String(v).replaceAll('"','""')+'"';
const fields=['id','parent','component','quantity','status','notes'];
await fs.writeFile(path.join(root,'planning','parts-breakdown.csv'),[fields.join(','),...design.inventory.map(row=>fields.map(k=>csv(row[k])).join(','))].join('\n')+'\n');
await fs.writeFile(path.join(root,'planning','dimensions-v01.json'),JSON.stringify(design.config,null,2)+'\n');
console.log(`Generated 7 SVG drawings, ${design.inventory.length} inventory entries; 9 drawers. W/D/H ${design.config.width}/${design.config.depth}/${design.config.height} mm; scale ${design.config.scale}.`);
