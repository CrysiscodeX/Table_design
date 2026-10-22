import {ornament,EDGE_LEAF,APRON,transformPath,FOOT_PROFILE} from './ornaments.mjs';
export const DEFAULTS=Object.freeze({width:1400,depth:750,height:780,scale:1,quality:'high'});
export const PALETTE={wood:'#583524',carve:'#704831',highlight:'#916443',recess:'#30231c',panel:'#482d22',inset:'#30352f',box:'#886045'};
export const ASSUMPTIONS=['All dimensions are provisional, not measurements.','Carving outlines and relief depths are photo interpretations.','Rear construction, drawer joinery, runners, and four rear feet are inferred.','Timber species, top covering, age, and origin are unverified.'];
export function validateConfig(input={}) {
  const c={...DEFAULTS,...input};
  for(const key of ['width','depth','height','scale']) if(typeof c[key]!=='number'||!Number.isFinite(c[key])) throw new Error(key+' must be a finite number.');
  if(c.width<700||c.width>4000||c.depth<400||c.depth>2000||c.height<400||c.height>1800||c.scale<.1||c.scale>5) throw new Error('Supported base sizes: W 700–4000, D 400–2000, H 400–1800 mm; scale 0.1–5.');
  if(!['high','preview'].includes(c.quality)) throw new Error('quality must be high or preview.');
  return c;
}
export function createDesign(input={}) {
  const config=validateConfig(input), {width:W,depth:D,height:H}=config;
  const u=H/780, pW=W*(405/1400), gap=W*(490/1400), front=D/2-40*(D/750), rear=-D/2+25*(D/750), bodyDepth=front-rear;
  const components=[], drawers=[];
  const add=(id,label,status,type,data,parent=null,explode=[0,0,0])=>{const c={id,label,status,type,parent,explode,...data};components.push(c);return c;};
  const box=(id,label,status,pos,size,tone='wood',parent=null,explode=[0,0,0])=>add(id,label,status,'box',{pos,size,tone},parent,explode);
  box('T-TOP','Tabletop wooden surround','confirmed',[0,H-17.5*u,0],[W,35*u,D],'wood',null,[0,140*u,0]);
  box('T-INSET','Dark inset top; material unknown','confirmed',[0,H+.5*u,0],[W-110*(W/1400),2*u,D-110*(D/750)],'inset','T-TOP');
  for(const [side,z] of [['front',D/2],['rear',-D/2]]) {
    const id='T-EDGE-'+side;
    box(id,'Carved top edge '+side,side==='front'?'confirmed':'inferred',[0,H-24*u,z],[W-8,17*u,6*u],'carve','T-TOP');
    const count=Math.floor(W/(26*u));
    for(let i=0;i<count;i++) add(id+'-leaf-'+String(i+1).padStart(2,'0'),'Top edge leaf','inferred','relief',{pos:[(i-(count-1)/2)*26*u,H-24*u,z+(side==='front'?3:-3)*u],path:transformPath(EDGE_LEAF,u,u),depth:2.2*u,tone:'highlight',rotation:side==='rear'?Math.PI:0},id);
  }
  for(const side of [-1,1]) {
    const id='T-EDGE-'+(side<0?'left':'right');
    box(id,'Carved top edge '+(side<0?'left':'right'),side<0?'confirmed':'inferred',[side*W/2,H-24*u,0],[6*u,17*u,D],'carve','T-TOP');
    const count=Math.floor(D/(26*u));
    for(let i=0;i<count;i++) add(id+'-leaf-'+(i+1),'Top end edge leaf','inferred','relief',{pos:[side*(W/2+3*u),H-24*u,(i-(count-1)/2)*26*u],path:transformPath(EDGE_LEAF,u,u),depth:2.2*u,tone:'highlight',rotation:side*Math.PI/2},id);
  }
  box('T-UNDER','Upper perimeter support moulding','confirmed',[0,H-44*u,(front+rear)/2],[W-68*(W/1400),15*u,bodyDepth+12*(D/750)],'wood','T-TOP');
  const rowData=[{n:1,y:667,h:94,variant:'upper'},{n:2,y:534,h:126,variant:'second'},{n:3,y:381,h:152,variant:'third'},{n:4,y:199,h:178,variant:'bottom'}];
  for(const side of [-1,1]) {
    const tag=side<0?'L':'R', cx=side*(gap/2+pW/2), pedId='P-'+tag;
    add(pedId,(tag==='L'?'Left':'Right')+' pedestal','confirmed','assembly',{pos:[cx,0,0]},null,[side*100*u,0,0]);
    const xEdge=pW/2-19*u;
    for(const xSide of [-1,1]) for(const [end,z] of [['front',front],['rear',rear]]) {
      const post='P-'+tag+'-POST-'+(xSide<0?'left':'right')+'-'+end;
      box(post,'Pedestal corner post '+end,end==='front'?'confirmed':'inferred',[cx+xSide*xEdge,393*u,z],[38*u,666*u,38*u],'wood',pedId);
      if(end==='front') {
        for(let k=0;k<10;k++) {
          const path=[['M',-10*u,18*u],['C',-13*u,-18*u,13*u,-18*u,10*u,18*u],['C',5*u,13*u,-5*u,13*u,-10*u,18*u],['Z']];
          add(post+'-scallop-'+(k+1),'Carved upright scallop','confirmed','relief',{pos:[cx+xSide*xEdge,(126+k*47)*u,front+20*u],path,depth:.8*u,tone:'panel'},post);
        }
        add(post+'-upper','Upper upright recessed decoration','confirmed','relief',{pos:[cx+xSide*xEdge,668*u,front+20*u],path:[['M',-10*u,37*u],['C',-14*u,-40*u,14*u,-40*u,10*u,37*u],['C',5*u,30*u,-5*u,30*u,-10*u,37*u],['Z']],depth:.8*u,tone:'panel'},post);
      }
      add('F-'+tag+'-'+(xSide<0?'left':'right')+'-'+end,'Fluted foot '+tag+' '+end,end==='front'?'confirmed':'inferred','foot',{pos:[cx+xSide*xEdge,0,z],height:60*u,radiusScale:u,profile:FOOT_PROFILE,tone:'carve'},pedId,[0,-15*u,0]);
    }
    for(const xSide of [-1,1]) {
      const x=cx+xSide*(pW/2-7*u), sid='P-'+tag+'-SIDE-'+(xSide<0?'left':'right');
      const external=xSide===side;
      add(sid,'Framed '+(external?'outer':'inner')+' side','confirmed','assembly',{pos:[x,0,0]},pedId,[xSide*35*u,0,0]);
      for(const y of [105,602]) box(sid+'-rail-'+y,'Side horizontal rail','inferred',[x,y*u,(front+rear)/2],[22*u,32*u,bodyDepth],'wood',sid);
      box(sid+'-divider','Side panel divider','inferred',[x,354*u,(front+rear)/2],[24*u,477*u,30*u],'wood',sid);
      for(const half of [-1,1]) box(sid+'-panel-'+(half<0?'rear':'front'),'Plain side panel','inferred',[x,354*u,(front+rear)/2+half*bodyDepth/4],[12*u,461*u,bodyDepth/2-48*u],'panel',sid);
      box(sid+'-fascia','Plain upper end fascia','confirmed',[x,668*u,(front+rear)/2],[18*u,90*u,bodyDepth-30*u],'wood',sid);
      add(sid+'-apron','Shaped side lower rail','inferred','relief',{pos:[x,85*u,(front+rear)/2],path:transformPath(APRON,bodyDepth/2,48*u),depth:18*u,tone:'wood',rotation:xSide*Math.PI/2},sid);
    }
    for(const y of [101,299,463,611,726]) box(pedId+'-front-rail-'+y,'Front horizontal framing','inferred',[cx,y*u,front-3*u],[pW-22*u,(y===611?18:12)*u,26*u],'wood',pedId);
    box(pedId+'-belt','Projecting intermediate moulding','confirmed',[cx,612*u,(front+rear)/2],[pW+18*u,15*u,bodyDepth+28*u],'carve',pedId);
    add(pedId+'-apron','Shaped lower front apron','confirmed','relief',{pos:[cx,86*u,front+12*u],path:transformPath(APRON,pW/2-12*u,52*u),depth:22*u,tone:'wood'},pedId);
    box(pedId+'-back','Assumed plain rear panel','inferred',[cx,367*u,rear],[pW-50*u,530*u,14*u],'panel',pedId);
    for(const row of rowData) makeDrawer('D-'+tag+row.n,cx,row.y*u,pW-82*u,row.h*u,row.variant,pedId);
  }
  makeDrawer('D-C1',0,667*u,gap-18*u,94*u,'centre',null);
  box('C-RAIL','Centre drawer lower support rail','inferred',[0,615*u,front-8*u],[gap+8*u,13*u,28*u]);
  // Back/side supports are explicit inferred parts, not presented as observed joinery.
  for(const side of [-1,1]) box('C-RUNNER-'+(side<0?'L':'R'),'Centre drawer support','inferred',[side*(gap/2-8*u),640*u,(front+rear)/2],[12*u,15*u,bodyDepth-30*u]);
  function makeDrawer(id,cx,y,w,h,variant,parent) {
    const drawerDepth=bodyDepth-90*(D/750), thick=Math.min(18*u,w*.035), frontThick=22*u;
    const c=add(id,id==='D-C1'?'Wide centre drawer':(id.startsWith('D-L')?'Left':'Right')+' drawer '+id.at(-1),'confirmed','drawer',{pos:[cx,y,front+3*u],width:w,height:h,drawerDepth,travel:Math.min(drawerDepth*.55,330*(D/750)),variant},parent,[0,0,55*u]);
    drawers.push(c);
    box(id+'-FRONT','Carved drawer front','confirmed',[0,0,0],[w,h,frontThick],'panel',id);
    // Box is deliberately behind the ornamental front and has an open top.
    for(const sign of [-1,1]) box(id+'-SIDE-'+(sign<0?'L':'R'),'Drawer side board','inferred',[sign*(w/2-thick/2-5*u),-2*u,-frontThick/2-drawerDepth/2],[thick,h-18*u,drawerDepth],'box',id);
    box(id+'-BACK','Drawer back board','inferred',[0,-2*u,-frontThick/2-drawerDepth+thick/2],[w-10*u,h-18*u,thick],'box',id);
    box(id+'-BOTTOM','Drawer bottom','inferred',[0,-h/2+12*u,-frontThick/2-drawerDepth/2],[w-10*u,8*u,drawerDepth],'box',id);
    for(const yy of [-1,1]) box(id+'-BORDER-H'+yy,'Drawer border horizontal','confirmed',[0,yy*(h/2-6*u),13*u],[w-6*u,6*u,4*u],'carve',id);
    for(const xx of [-1,1]) box(id+'-BORDER-V'+xx,'Drawer border vertical','confirmed',[xx*(w/2-6*u),0,13*u],[6*u,h-6*u,4*u],'carve',id);
    const o=ornament(variant,w-24*u,h-18*u);
    // Relief depths follow physical height, but subdivision/detail does not follow scale.
    for(const layer of o.layers) add(id+'-ORN-'+layer.id,'Ornament '+layer.id,'inferred','relief',{pos:[0,0,frontThick/2+layer.base*u+1*u],path:layer.path,depth:layer.depth*u,tone:layer.tone,stroke:layer.stroke*u},id);
    for(const volume of o.volumes) add(id+'-ORN-'+volume.id,'Rounded mask volume '+volume.id,'inferred','ellipsoid',{pos:[volume.pos[0],volume.pos[1],frontThick/2+volume.pos[2]*u],radii:volume.radii,tone:volume.tone},id);
    add(id+'-KEY','Keyhole; lock mechanism unverified','confirmed','keyhole',{pos:[0,h*.22,frontThick/2+14*u],radius:2*u,stem:5*u,tone:'recess'},id);
    c.faceUnit=o.faceUnit;
  }
  const inventory=components.filter(c=>c.type!=='relief'||!c.id.includes('-leaf-')).map(c=>({id:c.id,parent:c.parent||'',component:c.label,quantity:1,status:c.status,notes:c.status==='inferred'?'Photo-based approximation; not measured or construction-verified.':'Visible feature; dimensions still provisional.'}));
  return {config,components,componentMap:new Map(components.map(c=>[c.id,c])),drawers,inventory,layout:{pedestalWidth:pW,kneeWidth:gap,front,rear,bodyDepth,unit:u},assumptions:ASSUMPTIONS};
}
export function worldPosition(component,design,{open=0,explode=0}={}) {
  const out=[...component.pos], map=design.componentMap;
  // Only drawer groups carry relative coordinates; pedestal framing is stored in world mm.
  let parent=component.parent;
  while(parent) {const p=map.get(parent); if(p?.type==='drawer') {out[0]+=p.pos[0];out[1]+=p.pos[1];out[2]+=p.pos[2]+open*p.travel;} if(p?.explode) p.explode.forEach((v,i)=>out[i]+=v*explode); parent=p?.parent;}
  if(component.type==='drawer') out[2]+=open*component.travel;
  component.explode?.forEach((v,i)=>out[i]+=v*explode);
  return out.map(n=>n*design.config.scale);
}
