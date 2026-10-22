import * as THREE from 'three';
import {createDesign,PALETTE,worldPosition} from '../shared/design.mjs';

function curvePath(commands,z=0) {
  const path=new THREE.CurvePath();let current=new THREE.Vector3(),start=null;
  for(const [op,...v] of commands) {
    if(op==='M') {current=new THREE.Vector3(v[0],v[1],z);start=current.clone();}
    else if(op==='L') {const next=new THREE.Vector3(v[0],v[1],z);path.add(new THREE.LineCurve3(current,next));current=next;}
    else if(op==='C') {const next=new THREE.Vector3(v[4],v[5],z);path.add(new THREE.CubicBezierCurve3(current,new THREE.Vector3(v[0],v[1],z),new THREE.Vector3(v[2],v[3],z),next));current=next;}
    else if(op==='Z'&&start) {path.add(new THREE.LineCurve3(current,start));current=start.clone();}
  }
  return path;
}
function shapePath(commands) {
  const shape=new THREE.Shape();
  for(const [op,...v] of commands) {
    if(op==='M')shape.moveTo(...v); else if(op==='L')shape.lineTo(...v);else if(op==='C')shape.bezierCurveTo(...v);else if(op==='Z')shape.closePath();
  }
  return shape;
}
function footGeometry(c,quality) {
  const columns=quality==='high'?96:32, rows=quality==='high'?40:14, vertices=[],indices=[];
  function radius(t) {
    for(let i=1;i<c.profile.length;i++)if(t<=c.profile[i][0]){
      const [a,r0]=c.profile[i-1],[b,r1]=c.profile[i],f=(t-a)/(b-a);
      return (r0+(r1-r0)*(f*f*(3-2*f)))*c.radiusScale;
    }
    return c.profile.at(-1)[1]*c.radiusScale;
  }
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    const t=row/rows,theta=col/columns*Math.PI*2,r=radius(t)*(1+.13*Math.cos(theta*8)*Math.sin(Math.PI*t));
    vertices.push(Math.cos(theta)*r,t*c.height,Math.sin(theta)*r);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  // End caps keep the foot a closed solid, including in exploded views.
  const bottom=vertices.length/3;vertices.push(0,0,0);const top=vertices.length/3;vertices.push(0,c.height,0);
  for(let col=0;col<columns;col++){indices.push(bottom,col+1,col);const a=rows*(columns+1)+col;indices.push(top,a,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildModel(input={}) {
  const design=createDesign(input), root=new THREE.Group();root.name='default-table-design-v01';
  root.userData={units:'mm',config:design.config,assumptions:design.assumptions};
  const materials=Object.fromEntries(Object.entries(PALETTE).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='inset'?.92:.61,metalness:0})]));
  const cache=new Map(), meshes=new Map();
  for(const c of design.components) {
    if(['assembly','drawer'].includes(c.type))continue;
    const key=JSON.stringify([c.type,c.size,c.path,c.depth,c.stroke,c.height,c.radiusScale,c.radius,c.stem,c.radii,design.config.quality]);
    let geometry=cache.get(key);
    if(!geometry) {
      if(c.type==='box') geometry=new THREE.BoxGeometry(...c.size);
      else if(c.type==='foot')geometry=footGeometry(c,design.config.quality);
      else if(c.type==='ellipsoid'){
        const sphere=new THREE.SphereGeometry(1,design.config.quality==='high'?48:16,design.config.quality==='high'?24:8);sphere.scale(...c.radii);
        // Store deformed vertices as BufferGeometry so ObjectLoader restores the ellipsoid, not a unit sphere.
        geometry=new THREE.BufferGeometry().copy(sphere);sphere.dispose();
      }
      else if(c.type==='relief') {
        if(c.stroke){
          const tube=new THREE.TubeGeometry(curvePath(c.path,c.depth),design.config.quality==='high'?96:28,c.stroke/2,design.config.quality==='high'?8:5,false);
          // Store vertices because ObjectLoader does not reconstruct CurvePath-based tubes.
          geometry=new THREE.BufferGeometry().copy(tube);tube.dispose();
        }
        else geometry=new THREE.ExtrudeGeometry(shapePath(c.path),{depth:c.depth,curveSegments:design.config.quality==='high'?48:12,steps:1,bevelEnabled:true,bevelSize:Math.min(.65,c.depth*.18),bevelThickness:Math.min(.65,c.depth*.18),bevelSegments:design.config.quality==='high'?4:1});
      } else if(c.type==='keyhole') {
        const p=[['M',-c.radius,0],['C',-c.radius,-c.radius*2,c.radius,-c.radius*2,c.radius,0],['L',c.radius*.45,-c.stem],['L',-c.radius*.45,-c.stem],['Z']];
        geometry=new THREE.ShapeGeometry(shapePath(p),24);
      }
      geometry.computeBoundingBox();cache.set(key,geometry);
    }
    const mesh=new THREE.Mesh(geometry,materials[c.tone]||materials.wood);
    mesh.name=c.id;mesh.userData={componentId:c.id,parent:c.parent,label:c.label,status:c.status};
    mesh.rotation.y=c.rotation||0;mesh.castShadow=c.type!=='relief'||!c.stroke;mesh.receiveShadow=true;
    meshes.set(c.id,mesh);root.add(mesh);
  }
  function pose(open=0,explode=0) {
    for(const [id,mesh] of meshes) {
      mesh.position.fromArray(worldPosition(design.componentMap.get(id),design,{open,explode}));
      mesh.scale.setScalar(design.config.scale);
    }
    root.updateMatrixWorld(true);
  }
  function contains(componentId,parentId) {
    let c=design.componentMap.get(componentId);
    while(c){if(c.id===parentId)return true;c=design.componentMap.get(c.parent);}return false;
  }
  function bounds(id=null) {
    const box=new THREE.Box3();
    for(const [componentId,mesh] of meshes)if(!id||contains(componentId,id))box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    return box;
  }
  function dispose(){for(const g of cache.values())g.dispose();for(const m of Object.values(materials))m.dispose();}
  pose();return {root,design,meshes,pose,bounds,contains,dispose};
}
