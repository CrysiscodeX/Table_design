import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildModel} from './geometry.mjs';
import {DEFAULTS} from '../shared/design.mjs';
import {renderSVG} from '../shared/svg.mjs';
const $=id=>document.getElementById(id),container=$('canvas-container');
const scene=new THREE.Scene();scene.background=new THREE.Color('#f1eee4');
const camera=new THREE.PerspectiveCamera(36,1,1,30000);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;container.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.04;controls.maxPolarAngle=Math.PI*.92;
scene.add(new THREE.HemisphereLight('#fff5df','#685342',2.4));
const key=new THREE.DirectionalLight('#fff4dc',3.0);key.position.set(-900,1900,1600);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-1600;key.shadow.camera.right=1600;key.shadow.camera.top=1500;key.shadow.camera.bottom=-1000;key.shadow.camera.far=5000;key.shadow.normalBias=1.5;scene.add(key);
const fill=new THREE.DirectionalLight('#d8e4ee',1.2);fill.position.set(1000,900,800);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(20000,20000),new THREE.ShadowMaterial({opacity:.14}));ground.rotation.x=-Math.PI/2;ground.position.y=-2;ground.receiveShadow=true;scene.add(ground);
const selectionBox=new THREE.Box3Helper(new THREE.Box3(),new THREE.Color('#c49a5a'));selectionBox.visible=false;scene.add(selectionBox);
let model=null,selected='',open=0,explode=0,currentView='perspective',busy=false;
function error(message=''){$('error').hidden=!message;$('error').textContent=message;}
function setPose(){model.pose(open,explode);if(selected){selectionBox.box.copy(model.bounds(selected));selectionBox.visible=!selectionBox.box.isEmpty();}else selectionBox.visible=false;}
function setView(view=currentView){
  currentView=view;const bounds=model.bounds(),centre=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const radius=size.length()*.5;
  const dir={perspective:[-1,.64,1.7],front:[0,.015,1],left:[-1,.015,0],top:[0,1,.0001]}[view];
  const direction=new THREE.Vector3(...dir).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
  const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let fit=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const corner=new THREE.Vector3(x,y,z).sub(centre),near=corner.dot(direction);
    fit=Math.max(fit,Math.abs(corner.dot(right))/(tan*camera.aspect)+near,Math.abs(corner.dot(up))/tan+near);
  }
  fit*=1.10;
  controls.target.copy(centre);camera.position.copy(centre).add(direction.multiplyScalar(fit));
  camera.near=Math.max(.1,fit/2000);camera.far=Math.max(30000,fit*15);camera.updateProjectionMatrix();controls.minDistance=radius*.12;controls.maxDistance=fit*8;controls.update();
}
function resize(){const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(model)setView(currentView);}
new ResizeObserver(()=>{resize();}).observe(container);
function updateSelection(id){
  selected=id;$('component').value=id;
  const c=model.design.componentMap.get(id);
  $('selected').textContent=c?`${c.id} · ${c.label}. ${c.status==='confirmed'?'Visible reference feature; dimensions provisional.':'Inferred construction or carving interpretation.'}`:'Complete desk · nine drawers, two pedestals. All dimensions are provisional.';
  setPose();
}
function selectable(c){return ['assembly','drawer','foot'].includes(c.type)||['T-TOP','T-INSET','C-RAIL'].includes(c.id);}
async function rebuild(config=DEFAULTS){
  if(busy)return;busy=true;error();$('model-status').textContent='Building detailed model…';
  await new Promise(requestAnimationFrame);
  try{
    const next=buildModel(config);
    if(model){scene.remove(model.root);model.dispose();}model=next;scene.add(model.root);
    const previous=selected;$('component').replaceChildren(new Option('Complete desk',''));
    for(const c of model.design.components.filter(selectable))$('component').add(new Option(c.id+' · '+c.label,c.id));
    selected=model.design.componentMap.has(previous)?previous:'';setPose();resize();setView();updateSelection(selected);
    const c=model.design.config;
    $('size-label').textContent=[c.width,c.depth,c.height].map(v=>Number((v*c.scale).toFixed(1))).join(' × ')+' mm';
    const triangles=[...model.meshes.values()].reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
    $('model-status').textContent=`${c.quality==='high'?'High detail':'Preview'} · ${Math.round(triangles).toLocaleString()} triangles`;
    document.body.dataset.modelReady='true';
  }catch(e){error(e.message);$('model-status').textContent='Model could not be built';}finally{busy=false;}
}
$('view').addEventListener('change',e=>setView(e.target.value));
$('drawers').addEventListener('input',e=>{open=Number(e.target.value)/100;$('drawers-value').textContent=e.target.value+'%';setPose();});
$('explode').addEventListener('input',e=>{explode=Number(e.target.value)/100;$('explode-value').textContent=e.target.value+'%';setPose();});
$('component').addEventListener('change',e=>updateSelection(e.target.value));
$('dimensions').addEventListener('submit',e=>{e.preventDefault();rebuild({width:Number($('width').value),depth:Number($('depth').value),height:Number($('height').value),scale:Number($('scale').value),quality:$('quality').value});});
$('reset').addEventListener('click',()=>{for(const k of ['width','depth','height','scale','quality'])$(k).value=DEFAULTS[k];open=0;explode=0;$('drawers').value=0;$('explode').value=0;$('drawers-value').textContent='0%';$('explode-value').textContent='0%';rebuild(DEFAULTS);});
let pointerStart=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;
  const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
  const hit=ray.intersectObjects([...model.meshes.values()],false)[0];
  if(hit){let c=model.design.componentMap.get(hit.object.userData.componentId);while(c&&!selectable(c))c=model.design.componentMap.get(c.parent);updateSelection(c?.id||'');}else updateSelection('');
});
function download(data,type,name){const url=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-svg').addEventListener('click',()=>download(renderSVG(model.design,{view:currentView,open,explode}), 'image/svg+xml','default-table-'+currentView+'.svg'));
$('export-config').addEventListener('click',()=>download(JSON.stringify(model.design.config,null,2)+'\n','application/json','desk-dimensions.json'));
$('export-json').addEventListener('click',()=>download(JSON.stringify(model.root.toJSON()),'application/json','default-table-threejs.json'));
$('export-image').addEventListener('click',()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>download(blob,'image/png','default-table-view.png'));});
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}animate();
// Explicit inspection interface for repeatable validation; no private application state.
window.deskDraft={get model(){return model;},get camera(){return camera;},get target(){return controls.target.toArray();},get state(){return {selected,open,explode,currentView,busy};},select:updateSelection,pose:(o,e)=>{open=o;explode=e;setPose();},rebuild,setView,renderer};
await rebuild();
