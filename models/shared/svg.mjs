import {PALETTE,worldPosition} from './design.mjs';
import {ornament,pathData,EDGE_LEAF,FOOT_PROFILE} from './ornaments.mjs';
export const escapeXML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const n=x=>Number(x.toFixed(2));
const bases={
  front:{x:[1,0,0],y:[0,-1,0],eye:[0,0,1]},
  left:{x:[0,0,1],y:[0,-1,0],eye:[-1,0,0]},
  top:{x:[1,0,0],y:[0,0,1],eye:[0,1,0]},
  perspective:{x:[.848,0,.53],y:[-.17,-.947,.272],eye:[-.502,.321,.802]}
};
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const polygon=points=>'M'+points.map(p=>p.map(n).join(' ')).join(' L')+' Z';
const tint=(hex,f)=>'#'+hex.slice(1).match(/../g).map(x=>Math.min(255,Math.round(parseInt(x,16)*f)).toString(16).padStart(2,'0')).join('');
export function renderSVG(design,{view='front',open=0,explode=0,technical=true,title}={}) {
  const basis=bases[view];if(!basis) throw new Error('Unknown SVG view.');
  const S=design.config.scale;
  const project=p=>[dot(p,basis.x),dot(p,basis.y)];
  const records=[], bounds=[];
  const record=(id,z,svg,pts=[])=>{records.push({id,z,svg});bounds.push(...pts);};
  for(const c of design.components) {
    if(['assembly','drawer'].includes(c.type)) continue;
    const pos=worldPosition(c,design,{open,explode}), depth=dot(pos,basis.eye), color=PALETTE[c.tone]||PALETTE.wood;
    let content='';
    if(c.type==='box') {
      const [w,h,d]=c.size.map(v=>v*S/2), [x,y,z]=pos;
      const corners=[[-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]].map(p=>p.map((v,i)=>v+pos[i]));
      const faces=[{idx:[4,5,6,7],normal:[0,0,1],shade:1.06},{idx:[1,0,3,2],normal:[0,0,-1],shade:.8},{idx:[0,4,7,3],normal:[-1,0,0],shade:.87},{idx:[5,1,2,6],normal:[1,0,0],shade:.86},{idx:[3,7,6,2],normal:[0,1,0],shade:1.18},{idx:[0,1,5,4],normal:[0,-1,0],shade:.75}];
      for(const f of faces) if(dot(f.normal,basis.eye)>.01) {
        const points=f.idx.map(i=>project(corners[i]));
        const faceZ=dot(f.idx.map(i=>corners[i]).reduce((a,p)=>a.map((v,k)=>v+p[k]/4),[0,0,0]),basis.eye);
        record(c.id,faceZ,`<path d="${polygon(points)}" fill="${tint(color,f.shade)}" stroke="#321f15" stroke-width="0.7"/>`,points);
      }
      continue;
    }
    if(c.type==='relief'||c.type==='keyhole') {
      const r=c.rotation||0, normal=[Math.sin(r),0,Math.cos(r)];
      if(dot(normal,basis.eye)<.025) continue;
      const point=(x,y,z=0)=>project([pos[0]+S*(Math.cos(r)*x+Math.sin(r)*z),pos[1]+S*y,pos[2]+S*(-Math.sin(r)*x+Math.cos(r)*z)]);
      const mapPath=(path,z)=>path.map(([op,...v])=>op+v.reduce((a,val,i)=>{if(i%2===0)a.push(...point(val,v[i+1],z));return a;},[]).map(n).join(' ')).join(' ');
      if(c.type==='keyhole') {
        const path=[['M',-c.radius,0],['C',-c.radius,-c.radius*2,c.radius,-c.radius*2,c.radius,0],['L',c.radius*.45,-c.stem],['L',-c.radius*.45,-c.stem],['Z']];
        content=`<path d="${mapPath(path,0)}" fill="${color}"/>`;
        bounds.push(point(0,0));
      } else {
        for(const cmd of c.path) for(let i=1;i<cmd.length;i+=2) bounds.push(point(cmd[i],cmd[i+1],c.depth));
        const projectedWidth=c.stroke*S;
        if(c.stroke) content=`<path d="${mapPath(c.path,c.depth)}" fill="none" stroke="${color}" stroke-width="${n(projectedWidth)}" stroke-linecap="round"/>`;
        else content=`<path d="${mapPath(c.path,0)}" fill="${tint(color,.65)}"/><path d="${mapPath(c.path,c.depth)}" fill="${color}" stroke="${tint(color,.7)}" stroke-width="0.6"/>`;
      }
    } else if(c.type==='ellipsoid') {
      const [rx,ry,rz]=c.radii,point=(x,y)=>project([pos[0]+x*S,pos[1]+y*S,pos[2]+rz*S]);
      const path=[['M',rx,0],['C',rx,ry*.5523,rx*.5523,ry,0,ry],['C',-rx*.5523,ry,-rx,ry*.5523,-rx,0],['C',-rx,-ry*.5523,-rx*.5523,-ry,0,-ry],['C',rx*.5523,-ry,rx,-ry*.5523,rx,0],['Z']];
      const d=path.map(([op,...v])=>op+v.reduce((a,val,i)=>{if(i%2===0)a.push(...point(val,v[i+1]));return a;},[]).map(n).join(' ')).join(' ');
      content=`<path d="${d}" fill="${color}"/>`;bounds.push(point(rx,ry),point(-rx,-ry));
    } else if(c.type==='foot') {
      const profile=c.profile;
      const footPoint=(t,r,f)=>project([pos[0]+f*r*c.radiusScale*S*basis.x[0],pos[1]+t*c.height*S,pos[2]+f*r*c.radiusScale*S*basis.x[2]]);
      const points=[...profile.map(([t,r])=>footPoint(t,r,-1)),...profile.slice().reverse().map(([t,r])=>footPoint(t,r,1))];
      content=`<path d="${polygon(points)}" fill="${color}" stroke="#321f15" stroke-width="1.1"/>`;
      // Ribs stay as independent vector curves.
      for(let j=0;j<7;j++) {
        const a=(-.42+j*.14)*Math.PI;
        const line=profile.map(([t,r])=>footPoint(t,r,Math.sin(a)));
        content+=`<path d="M${line.map(p=>p.map(n).join(' ')).join(' L')}" fill="none" stroke="${j%2?PALETTE.highlight:PALETTE.recess}" stroke-width="1.7"/>`;
      }
      bounds.push(...points);
    }
    if(content) record(c.id,depth+(c.depth||0)*S*dot([Math.sin(c.rotation||0),0,Math.cos(c.rotation||0)],basis.eye),content);
  }
  const xs=bounds.map(p=>p[0]), ys=bounds.map(p=>p[1]), minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const span=Math.max(maxX-minX,maxY-minY), margin=span*.10, font=span*.018;
  const header=font*4, footer=technical?font*7:font*3;
  const vb=[minX-margin,minY-margin-header,maxX-minX+margin*2,maxY-minY+margin*2+header+footer];
  let annotations='';
  if(technical) {
    if(view==='front'||view==='perspective') for(const d of design.drawers) {
      const pos=worldPosition(d,design,{open,explode});
      pos[0]-=(d.width/2-12)*S;pos[1]+=(d.height/2-19)*S;pos[2]+=42*S;
      const [x,y]=project(pos);annotations+=`<text x="${n(x)}" y="${n(y)}" font-size="${n(font*.66)}" fill="#e8c799" paint-order="stroke" stroke="#39251b" stroke-width="2">${d.id}</text>`;
    }
    if(view==='front') {
      const left=-design.config.width*S/2,right=-left,y=maxY+font*1.5;
      annotations+=`<path d="M${left} ${y}H${right} M${left} ${y-10}V${y+10} M${right} ${y-10}V${y+10}" fill="none" stroke="#57655f" stroke-width="1.2"/><text x="0" y="${y-font*.3}" text-anchor="middle" font-size="${font*.72}">${n(design.config.width*S)} mm — provisional overall width</text>`;
      annotations+=`<text x="${minX}" y="${maxY+font*3.0}" font-size="${font*.72}">P-L: left pedestal · P-R: right pedestal · T-TOP: tabletop · H ${n(design.config.height*S)} mm</text>`;
    }
    annotations+=`<text x="${minX}" y="${maxY+font*4.3}" font-size="${font*.68}">Confirmed: nine drawers and visible front features. Inferred: rear feet, backs, drawer internals.</text><text x="${minX}" y="${maxY+font*5.4}" font-size="${font*.68}">All sizes provisional; carving depths interpreted; timber and top covering unverified.</text>`;
  }
  const name=title||`${view==='perspective'?'Front-left axonometric':view[0].toUpperCase()+view.slice(1)+' view'} — ${open?'drawers open':'drawers closed'}`;
  const drawing=records.sort((a,b)=>a.z-b.z).map(r=>`<g data-component="${escapeXML(r.id)}"><title>${escapeXML(r.id)}</title>${r.svg}</g>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(n).join(' ')}" width="1800" height="${Math.round(1800*vb[3]/vb[2])}" role="img" aria-labelledby="drawing-title drawing-desc">\n<title id="drawing-title">${escapeXML(name)}</title><desc id="drawing-desc">Nine-drawer pedestal desk. Editable vector curves. Provisional ${design.config.width*S} by ${design.config.depth*S} by ${design.config.height*S} mm. Hidden construction is inferred.</desc>\n<metadata>${escapeXML(JSON.stringify({version:'0.1',config:design.config,view,open,explode,assumptions:design.assumptions}))}</metadata>\n<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#f3efe5"/>\n<g font-family="Arial, sans-serif" fill="#263c32"><text x="${minX}" y="${minY-margin-font*1.8}" font-size="${font*1.15}">${escapeXML(name)}</text><text x="${minX}" y="${minY-margin-font*.45}" font-size="${font*.72}">DEFAULT TABLE DESIGN / DRAFT 01 · ${n(design.config.width*S)} × ${n(design.config.depth*S)} × ${n(design.config.height*S)} mm</text>${drawing}${annotations}</g></svg>\n`;
}

export function ornamentStudy() {
  const panels=[['upper','D-L1 / D-R1'],['second','D-L2 / D-R2'],['third','D-L3 / D-R3'],['bottom','D-L4 / D-R4'],['centre','D-C1']];
  let body='';
  panels.forEach(([variant,ids],i)=>{
    const x=80+(i%2)*730,y=170+Math.floor(i/2)*350,w=variant==='centre'?620:580,h=230;
    const o=ornament(variant,w-30,h-30);
    body+=`<g id="study-${variant}" transform="translate(${x},${y})"><text x="0" y="-25" font-size="23" fill="#263c32">${ids} · ${o.title}</text><rect width="${w}" height="${h}" fill="${PALETTE.panel}" stroke="${PALETTE.highlight}" stroke-width="8"/><g transform="translate(${w/2},${h/2+8}) scale(1,-1)">`;
    for(const l of o.layers) body+=`<path id="${variant}-${l.id}" d="${pathData(l.path)}" ${l.stroke?`fill="none" stroke="${PALETTE[l.tone]}" stroke-width="${l.stroke}"`:`fill="${PALETTE[l.tone]}" stroke="#39251b" stroke-width=".8"`}/>`;
    for(const v of o.volumes)body+=`<ellipse id="${variant}-${v.id}" cx="${v.pos[0]}" cy="${v.pos[1]}" rx="${v.radii[0]}" ry="${v.radii[1]}" fill="${PALETTE[v.tone]}"/>`;
    body+='</g></g>';
  });
  body+=`<g transform="translate(810,870)"><text y="-25" font-size="23">T-EDGE · repeating edge leaves</text><rect width="530" height="70" fill="${PALETTE.wood}"/>`;
  for(let i=0;i<13;i++)body+=`<path d="${pathData(EDGE_LEAF)}" transform="translate(${22+i*39},35) scale(1.7,-1.7)" fill="${PALETTE.highlight}"/>`;
  const footPoints=[...FOOT_PROFILE.map(([t,r])=>[70-r*1.8,135-t*110]),...FOOT_PROFILE.slice().reverse().map(([t,r])=>[70+r*1.8,135-t*110])];
  body+=`</g><g transform="translate(830,980)"><text x="0" y="0" font-size="23">F-* · fluted foot profile</text><path d="${polygon(footPoints)}" fill="${PALETTE.carve}" stroke="${PALETTE.recess}" stroke-width="3"/>`;
  for(const f of [-.65,-.32,0,.32,.65])body+=`<path d="M${FOOT_PROFILE.map(([t,r])=>[70+r*1.8*f,135-t*110].join(' ')).join(' L')}" fill="none" stroke="${PALETTE.highlight}" stroke-width="2"/>`;
  body+='</g>';
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1540 1230" width="1540" height="1230" role="img"><title>Editable ornament studies — draft 01</title><desc>Five drawer motif variants, repeating top edge leaves, and a fluted foot. Photo interpretations with unverified depths.</desc><rect width="1540" height="1230" fill="#f3efe5"/><g font-family="Arial, sans-serif" fill="#263c32"><text x="80" y="60" font-size="34">Carving studies / editable vector master</text><text x="80" y="100" font-size="20">Interpretations from reference photographs · relief depths unverified · no raster images</text>${body}<text x="80" y="1180" font-size="20">Central masks retain their aspect ratio when desk dimensions change; outer foliage fills the available panel width.</text></g></svg>\n`;
}
