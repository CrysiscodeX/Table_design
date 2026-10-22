import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createDesign,worldPosition} from '../models/shared/design.mjs';
import {ornament} from '../models/shared/ornaments.mjs';
import {renderSVG} from '../models/shared/svg.mjs';
import {buildModel} from '../models/threejs/geometry.mjs';
test('Nine drawers, two pedestals, eight identified feet, and stable IDs',()=>{
  const d=createDesign();assert.equal(d.drawers.length,9);assert.deepEqual(d.drawers.map(c=>c.id),['D-L1','D-L2','D-L3','D-L4','D-R1','D-R2','D-R3','D-R4','D-C1']);
  assert.equal(d.components.filter(c=>c.type==='foot').length,8);assert.equal(d.components.filter(c=>c.type==='foot'&&c.status==='confirmed').length,4);
  assert.equal(d.components.filter(c=>/^P-[LR]$/.test(c.id)).length,2);
  assert.equal(new Set(d.components.map(c=>c.id)).size,d.components.length);
  for(const c of d.components)assert.ok(!c.parent||d.componentMap.has(c.parent),'Missing parent '+c.id);
});
test('Closed and fully open drawers clear adjacent rows, pedestals, and rear boards',()=>{
  for(const cfg of [{},{width:700,depth:400,height:400},{width:1800,depth:900,height:1000}]) {
    const d=createDesign(cfg),u=d.layout.unit;
    for(const side of ['L','R']) {
      const rows=d.drawers.filter(c=>c.id.startsWith('D-'+side));
      for(let i=1;i<rows.length;i++)assert.ok(rows[i-1].pos[1]-rows[i-1].height/2>rows[i].pos[1]+rows[i].height/2,'Row overlap');
      for(const row of rows){assert.ok(row.width<d.layout.pedestalWidth-38*u);assert.ok(row.travel<row.drawerDepth);assert.ok(row.pos[2]-row.drawerDepth-11*u>d.layout.rear+7*u);}
    }
    assert.ok(d.drawers.at(-1).width<d.layout.kneeWidth);
  }
});
test('Drawer fronts, boxes, ornaments and keyholes move together and uniform scale is exact',()=>{
  const d=createDesign(),s=createDesign({scale:.5});
  for(const c of d.components){
    const base=worldPosition(c,d),scaled=worldPosition(s.componentMap.get(c.id),s);base.forEach((v,i)=>assert.equal(scaled[i],v*.5));
    if(c.parent==='D-L3') {const moved=worldPosition(c,d,{open:1});assert.equal(moved[0],base[0]);assert.equal(moved[1],base[1]);assert.ok(Math.abs(moved[2]-base[2]-d.drawers.find(x=>x.id==='D-L3').travel)<1e-9);}
  }
});
test('Custom width redistributes foliage while masks retain their aspect ratio',()=>{
  const a=ornament('third',300,140),b=ornament('third',550,140);assert.equal(a.faceUnit,b.faceUnit);
  assert.deepEqual(a.layers.find(l=>l.id==='mask-nose').path,b.layers.find(l=>l.id==='mask-nose').path);
  assert.notDeepEqual(a.layers[0].path,b.layers[0].path);
});
test('Invalid dimensions fail; all mesh vertices and bounds are finite; detail survives scaling',()=>{
  assert.throws(()=>createDesign({width:NaN}));assert.throws(()=>createDesign({scale:0}));
  const high=buildModel(),preview=buildModel({quality:'preview'}),scaled=buildModel({scale:.5});
  const count=m=>[...m.meshes.values()].reduce((a,m)=>a+m.geometry.attributes.position.count,0);
  assert.ok(count(high)>count(preview));assert.equal(count(high),count(scaled));
  for(const m of high.meshes.values()) for(const v of m.geometry.attributes.position.array)assert.ok(Number.isFinite(v));
  high.dispose();preview.dispose();scaled.dispose();
});
test('SVGs contain editable curves and shared IDs; exported metadata matches model configuration',()=>{
  const d=createDesign({width:1600,scale:.8}),svg=renderSVG(d);
  assert.ok(svg.includes('data-component="D-L1-FRONT"'));assert.ok(svg.includes('data-component="D-C1-FRONT"'));assert.ok(svg.includes('1280 × 600 × 624 mm'));assert.ok(svg.includes(' C'));
  assert.ok(!svg.includes('<image'));assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('Infinity'));
});
test('Three.js JSON round-trip preserves geometry, ellipsoid shapes, dimensions and component IDs',()=>{
  const model=buildModel(),json=model.root.toJSON(),copy=new THREE.ObjectLoader().parse(json);
  copy.updateMatrixWorld(true);
  const original=new THREE.Box3().setFromObject(model.root),restored=new THREE.Box3().setFromObject(copy);
  assert.ok(original.min.distanceTo(restored.min)<1e-6);assert.ok(original.max.distanceTo(restored.max)<1e-6);
  for(const id of ['D-C1-FRONT','D-L4-ORN-nose-rounded','F-R-right-rear']) {
    const before=model.meshes.get(id),after=copy.getObjectByName(id);assert.ok(after);
    before.geometry.computeBoundingBox();after.geometry.computeBoundingBox();
    assert.ok(before.geometry.boundingBox.min.distanceTo(after.geometry.boundingBox.min)<1e-6);
    assert.ok(before.geometry.boundingBox.max.distanceTo(after.geometry.boundingBox.max)<1e-6);
  }
  assert.deepEqual(copy.userData.config,model.design.config);model.dispose();
});
