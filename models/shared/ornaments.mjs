// Editable normalized Bezier master curves. +Y is up; relief grows toward +Z.
// Interpreted from photographs, not scans of the original sculpture.
const M = (x,y) => ['M',x,y];
const C = (...v) => ['C',...v];
const L = (x,y) => ['L',x,y];
const Z = ['Z'];
export const mirrorPath = path => path.map(([op,...v]) => [op,...v.map((n,i)=> i%2===0 ? -n : n)]);
export const transformPath = (path,sx,sy,tx=0,ty=0) => path.map(([op,...v]) => [op,...v.map((n,i)=>n*(i%2===0?sx:sy)+(i%2===0?tx:ty))]);
export const pathData = path => path.map(c=>c[0]+c.slice(1).map(n=>Number(n.toFixed(3))).join(' ')).join(' ');

// Outer volute, its folded leaf, and subordinate curls share the same source in 2D and 3D.
export const FOLIAGE = {
  volute: [M(-.26,-.36),C(-.55,-.48,-.92,-.34,-.93,.02),C(-.94,.30,-.76,.44,-.56,.37),C(-.37,.31,-.39,.08,-.53,.06),C(-.65,.03,-.68,.16,-.61,.20),C(-.55,.23,-.51,.16,-.55,.13),C(-.44,.17,-.50,.28,-.61,.27),C(-.78,.24,-.79,.02,-.70,-.11),C(-.62,-.24,-.42,-.18,-.26,-.36),Z],
  upperLeaf: [M(-.25,.22),C(-.35,.38,-.53,.46,-.74,.46),C(-.91,.46,-.96,.35,-.95,.24),C(-.90,.36,-.81,.36,-.68,.32),C(-.58,.29,-.51,.34,-.44,.29),C(-.55,.23,-.66,.20,-.78,.14),C(-.58,.15,-.47,.13,-.38,.03),C(-.35,.14,-.31,.17,-.25,.22),Z],
  lowerLeaf: [M(-.23,-.32),C(-.40,-.30,-.54,-.39,-.70,-.40),C(-.88,-.42,-.94,-.30,-.95,-.19),C(-.87,-.29,-.82,-.30,-.72,-.26),C(-.62,-.22,-.58,-.31,-.48,-.27),C(-.61,-.18,-.70,-.15,-.76,-.02),C(-.62,-.15,-.49,-.15,-.35,-.09),C(-.34,-.21,-.29,-.26,-.23,-.32),Z],
  tendril: [M(-.34,.02),C(-.38,.19,-.51,.18,-.55,.32),C(-.51,.44,-.34,.43,-.34,.32),C(-.35,.23,-.45,.24,-.45,.29),C(-.44,.32,-.40,.30,-.41,.28),C(-.37,.31,-.41,.35,-.45,.34),C(-.49,.28,-.39,.22,-.34,.02),Z],
  vein: [M(-.27,-.33),C(-.47,-.32,-.84,-.32,-.84,.01),C(-.84,.29,-.61,.37,-.53,.24)],
  upperVein: [M(-.28,.22),C(-.49,.36,-.73,.39,-.88,.35)],
  lowerVein: [M(-.28,-.31),C(-.51,-.35,-.78,-.35,-.89,-.27)]
};

const FACE = {
  outline: [M(0,.30),C(-.07,.31,-.15,.25,-.19,.15),C(-.25,.17,-.32,.13,-.33,.04),C(-.30,-.04,-.22,-.06,-.20,-.16),C(-.24,-.27,-.16,-.37,0,-.39),C(.16,-.37,.24,-.27,.20,-.16),C(.22,-.06,.30,-.04,.33,.04),C(.32,.13,.25,.17,.19,.15),C(.15,.25,.07,.31,0,.30),Z],
  brow: [M(-.03,.12),C(-.07,.21,-.19,.27,-.34,.25),C(-.32,.15,-.21,.08,-.06,.045),L(-.03,.12),Z],
  eye: [M(-.07,.015),C(-.13,.071,-.24,.082,-.28,.025),C(-.23,-.03,-.13,-.035,-.07,.015),Z],
  cheek: [M(-.08,-.09),C(-.15,-.03,-.24,-.065,-.27,-.15),C(-.23,-.25,-.16,-.27,-.06,-.21),C(-.11,-.18,-.12,-.14,-.08,-.09),Z],
  nose: [M(-.035,.16),C(-.06,.02,-.095,-.11,-.07,-.19),C(-.025,-.235,.025,-.235,.07,-.19),C(.095,-.11,.06,.02,.035,.16),Z],
  lip: [M(-.13,-.285),C(-.06,-.23,-.025,-.25,0,-.265),C(.025,-.25,.06,-.23,.13,-.285),C(.07,-.34,-.07,-.34,-.13,-.285),Z],
  moustache: [M(-.015,-.24),C(-.12,-.26,-.18,-.22,-.21,-.14),C(-.21,-.30,-.12,-.34,-.02,-.29),Z],
  temple: [M(-.20,.19),C(-.28,.30,-.35,.36,-.43,.36),C(-.46,.28,-.41,.23,-.29,.19),L(-.20,.19),Z]
};

export const VARIANTS = {
  upper: {title:'Upper side drawer — compact crested mask', crown:0, faceScale:.94, foliageTilt:.00},
  centre: {title:'Centre drawer — elongated scrolls and split plume', crown:1, faceScale:1.02, foliageTilt:.03},
  second: {title:'Second drawer — low crest and broad brows', crown:0, faceScale:1.02, foliageTilt:-.025},
  third: {title:'Third drawer — tall divided leaf crown', crown:2, faceScale:1.04, foliageTilt:.035},
  bottom: {title:'Bottom drawer — spreading fan and descending foliage', crown:3, faceScale:1.1, foliageTilt:-.055}
};

function crownPaths(kind) {
  if(kind===0) return [
    [M(-.08,.23),C(-.28,.29,-.24,.42,-.12,.49),C(-.16,.37,-.04,.42,-.08,.23),Z],
    [M(-.04,.27),C(-.10,.38,-.06,.49,0,.52),C(.06,.49,.10,.38,.04,.27),Z]
  ];
  if(kind===1) return [[M(-.025,.22),C(-.08,.42,-.25,.48,-.31,.51),C(-.31,.35,-.14,.23,-.025,.22),Z], [M(-.015,.24),C(-.04,.38,-.03,.48,0,.53),C(.03,.48,.04,.38,.015,.24),Z]];
  if(kind===2) return [[M(-.035,.21),C(-.22,.25,-.27,.40,-.22,.54),C(-.18,.44,-.09,.40,-.035,.21),Z], [M(-.02,.24),C(-.055,.43,-.03,.55,0,.58),C(.03,.55,.055,.43,.02,.24),Z]];
  return [
    [M(-.03,.18),C(-.17,.35,-.38,.29,-.48,.45),C(-.29,.44,-.17,.47,-.03,.18),Z],
    [M(-.025,.22),C(-.13,.44,-.33,.42,-.36,.56),C(-.20,.51,-.075,.54,-.025,.22),Z],
    [M(-.02,.23),C(-.13,.43,-.10,.57,0,.60),C(.10,.57,.13,.43,.02,.23),Z]
  ];
}

export function ornament(variant,width,height) {
  const v=VARIANTS[variant];
  if(!v) throw new Error('Unknown ornament variant: '+variant);
  const layers=[];
  const add=(id,path,depth,tone,base=0,stroke=0) => layers.push({id,path,depth,tone,base,stroke});
  const sy=height*.76;
  // Face scaling is uniform, bounded by the panel dimensions. Foliage stretches into remaining space.
  const faceUnit=Math.min(sy,width*.40)*v.faceScale,faceWidth=faceUnit*2.15;
  for(const [key,path] of Object.entries(FOLIAGE)) {
    for(const side of [-1,1]) {
      const p=side===-1 ? path : mirrorPath(path);
      const vein=key.includes('Vein')||key==='vein';
      add('foliage-'+key+'-'+side,transformPath(p,width*.48,sy,0,v.foliageTilt*height),vein?1.5:4.5,vein?'highlight':'carve',vein?5:0,vein?1.45:0);
    }
  }
  add('mask-outline',transformPath(FACE.outline,faceWidth,faceUnit),6,'carve',1);
  for(const key of ['temple','brow','eye','cheek','moustache']) for(const side of [-1,1]) {
    const path=side===-1?FACE[key]:mirrorPath(FACE[key]);
    const depth={temple:6,brow:10,eye:2,cheek:11,moustache:8}[key];
    add('mask-'+key+'-'+side,transformPath(path,faceWidth,faceUnit),depth,key==='eye'?'recess':'carve',key==='eye'?8:5);
  }
  add('mask-nose',transformPath(FACE.nose,faceWidth,faceUnit),14,'highlight',7);
  add('mask-lip',transformPath(FACE.lip,faceWidth,faceUnit),7,'carve',6);
  crownPaths(v.crown).forEach((p,i)=>{
    add('crown-'+i,transformPath(p,faceWidth,faceUnit),5,'carve',3);
    if(i<crownPaths(v.crown).length-1) add('crown-'+i+'-mirror',transformPath(mirrorPath(p),faceWidth,faceUnit),5,'carve',3);
  });
  // Additional leaf folds are editable curves, not baked textures.
  for(const side of [-1,1]) for(let i=0;i<3;i++) {
    const p=[M(side*(.12+i*.05),.34+i*.026),C(side*(.21+i*.055),.39+i*.045,side*(.26+i*.055),.43+i*.045,side*(.27+i*.065),.49+i*.01)];
    add('crown-fold-'+side+'-'+i,transformPath(p,faceWidth,faceUnit),1.0,'highlight',8,1.0);
  }
  const volumes=[
    {id:'nose-rounded',pos:[0,-.065*faceUnit,17],radii:[.054*faceWidth,.155*faceUnit,.10*faceUnit],tone:'highlight'},
    {id:'cheek-rounded-left',pos:[-.175*faceWidth,-.14*faceUnit,13],radii:[.068*faceWidth,.083*faceUnit,.065*faceUnit],tone:'carve'},
    {id:'cheek-rounded-right',pos:[.175*faceWidth,-.14*faceUnit,13],radii:[.068*faceWidth,.083*faceUnit,.065*faceUnit],tone:'carve'},
    {id:'lip-rounded',pos:[0,-.295*faceUnit,12],radii:[.095*faceWidth,.032*faceUnit,.048*faceUnit],tone:'carve'}
  ];
  return {variant,title:v.title,width,height,faceUnit,layers,volumes};
}

export const EDGE_LEAF=[M(-10,-6),C(-12,3,-6,7,0,7),C(6,7,12,3,10,-6),C(7,-2,4,0,0,4),C(-4,0,-7,-2,-10,-6),Z];
export const APRON=[M(-1,.25),L(1,.25),L(1,-.2),C(.7,-.1,.62,-.42,.43,-.3),C(.18,-.13,.12,-.4,0,-.34),C(-.12,-.4,-.18,-.13,-.43,-.3),C(-.62,-.42,-.7,-.1,-1,-.2),Z];
export const FOOT_PROFILE=[[0,9],[.10,23],[.28,28],[.44,24],[.62,17],[.78,12],[.92,15],[1,16]];
