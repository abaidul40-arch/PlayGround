import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac4c6);
scene.fog = new THREE.Fog(0x9ac4c6, 90, 260);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .1, 420);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const mat = (color, roughness=.78, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  road: mat(0x424a48), roadLine: mat(0xd7c9a9), sidewalk: mat(0xb8b8a4), curb: mat(0x827f72),
  grass: mat(0x7d9676), water: new THREE.MeshStandardMaterial({color:0x328c98,roughness:.27,metalness:.18}),
  building: [0xc1ad92,0xb5b7a9,0x899e9b,0xc0a28c,0xaab3aa,0x888c85,0xc5c0ae].map(c=>mat(c)),
  window: new THREE.MeshStandardMaterial({color:0x263e42,roughness:.3,metalness:.3}),
  windowLit: new THREE.MeshStandardMaterial({color:0xffd697,emissive:0xd08b41,emissiveIntensity:.3,roughness:.4}),
  trim: mat(0xddd0b6,.65), dark: mat(0x202c2e,.45,.4), tire: mat(0x15191a,.94),
  leaf: [0x638d76,0x79977d,0x577d70,0x98a17b].map(c=>mat(c)), trunk: mat(0x765d46),
  white: mat(0xe4ddca,.32,.18), gold: mat(0xe0b676,.34,.45), red: mat(0xd66d58,.4,.25),
  enemy: new THREE.MeshStandardMaterial({color:0x912f36,emissive:0x651c24,emissiveIntensity:.55,roughness:.4,metalness:.25}),
  enemyGlow: new THREE.MeshBasicMaterial({color:0xff725e}), pulse: new THREE.MeshBasicMaterial({color:0x8fffea}),
};
const boxGeo = new THREE.BoxGeometry(1,1,1), sphereGeo = new THREE.SphereGeometry(1,12,10), cylGeo = new THREE.CylinderGeometry(1,1,1,12);
function box(parent, x,y,z, sx,sy,sz, material, cast=false, receive=false){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=cast;m.receiveShadow=receive;parent.add(m);return m;}
function sphere(parent,x,y,z,sx,sy,sz,material){const m=new THREE.Mesh(sphereGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function cyl(parent,x,y,z,rt,rb,h,material,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);m.position.set(x,y,z);parent.add(m);return m;}
function group(parent=scene){const g=new THREE.Group();parent.add(g);return g;}

const hemi = new THREE.HemisphereLight(0xd9eeea,0x68735e,2.0);scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b9,3.0);sun.position.set(-65,105,44);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-115;sun.shadow.camera.right=115;sun.shadow.camera.top=115;sun.shadow.camera.bottom=-115;sun.shadow.bias=-.00015;scene.add(sun);
const fill = new THREE.DirectionalLight(0x83aeb1,.85);fill.position.set(45,35,-80);scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(360,360),mat(0x879a7f));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);

// A compact coastal grid: broad avenues, quiet blocks, a tidal river and its old stone bridge.
const city = group();
for(let i=-3;i<=3;i++){
  const p=i*48;
  const roadV=box(city,p,.005,0,12,.06,310,mats.road);roadV.receiveShadow=true;
  const roadH=box(city,0,.006,p,310,.06,12,mats.road);roadH.receiveShadow=true;
  for(const s of [-1,1]){
    box(city,p+s*4.85,.04,0,.13,.04,310,mats.roadLine);
    box(city,0,.04,p+s*4.85,310,.04,.13,mats.roadLine);
  }
  for(let n=-3;n<=3;n++){
    const z=n*48;
    if(p===0){for(let q=-1;q<=1;q++)box(city,p+q*2.7,.05,z,1.15,.04,5.4,mats.roadLine);}
    if(z===0){for(let q=-1;q<=1;q++)box(city,p+q*2.7,.05,z,1.15,.04,5.4,mats.roadLine);}
  }
}
// River from east to west; bridges interrupt the banks at the central avenue.
const river=box(city,0,-.55,-88,320,.4,26,mats.water);river.receiveShadow=true;
box(city,0,-.31,-74.7,320,.5,.65,mats.curb);box(city,0,-.31,-101.3,320,.5,.65,mats.curb);
box(city,0,.02,-88,17,.4,18,mat(0x817d6e));
for(let x=-7;x<=7;x+=3.5)box(city,x,.25,-88,.12,.48,18,mats.trim);
for(let z=-2;z<=2;z++)for(let x=-7;x<=7;x+=3.5)box(city,x,.52,-88,.12,.08,.14,mats.gold);
// Sidewalks and planted block courtyards.
for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
 const cx=i*48+24,cz=j*48+24;
 if(Math.abs(cx)>150||Math.abs(cz)>150||Math.abs(cz+88)<18)continue;
 const plaza=box(city,cx,-.005,cz,34,.08,34,mats.sidewalk);plaza.receiveShadow=true;
 box(city,cx,.035,cz,29,.035,29,mats.grass);
}
function addBuilding(x,z,w,d,h,seed){
 const g=group(city);g.position.set(x,0,z);
 const palette=mats.building[(seed*7+Math.floor(x+z+200))%mats.building.length];
 box(g,0,h/2,0,w,h,d,palette,true,true);
 // deep plinth, roof lip and orderly warm window bays
 box(g,0,.75,0,w+.55,1.5,d+.55,mats.trim);
 box(g,0,h+.16,0,w+1,.32,d+1,mats.trim,true);
 const rows=Math.max(2,Math.floor((h-2.8)/3.4)), cols=Math.max(2,Math.floor(w/4.2));
 const winMat=seed%4===0?mats.windowLit:mats.window;
 for(let r=0;r<rows;r++){
  const y=2.2+r*3.35;if(y>h-1.6)continue;
  for(let c=0;c<cols;c++){
   const xx=-w/2+2.1+c*((w-2.1)/cols);
   box(g,xx,y,-d/2-.025,1.12,1.75,.06,winMat);
   box(g,xx,y,d/2+.025,1.12,1.75,.06,winMat);
  }
  const sideCols=Math.max(2,Math.floor(d/5));
  for(let c=0;c<sideCols;c++){
    const zz=-d/2+2.5+c*((d-2.5)/sideCols);
    box(g,-w/2-.025,y,zz,.06,1.75,1.15,winMat);
    box(g,w/2+.025,y,zz,.06,1.75,1.15,winMat);
  }
 }
 // A distinctive rooftop crown and a few HVAC units.
 box(g,0,h+.43,0,w*.35,.52,d*.35,mat(0x697b77));
 for(let k=0;k<2;k++)box(g,-w*.22+k*w*.4,h+.62,d*.21,.9,.45,1.1,mats.dark);
 if(seed%3===0){box(g,0,h*.61,-d/2-.07,w*.6,.38,.16,mats.gold);}
 return g;
}
let bSeed=0;
for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
 const x=i*48+24,z=j*48+24;
 if(Math.abs(x)>145||Math.abs(z)>145||Math.abs(z+88)<20)continue;
 const h=10+((i*17+j*31+88)%5+5)%5*3.7;
 addBuilding(x,z,24+((i+j+14)%3)*2.1,24+((i*2+j+17)%3)*2.2,h,bSeed++);
}
// Street trees, warm lamps, benches and tiny coastal details.
const street=group();
for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
 const x=i*48,z=j*48;
 for(const side of [-1,1])for(const axis of [0,1]){
  const tx=axis===0?x+side*9.5:x+19, tz=axis===0?z+19:z+side*9.5;
  if(Math.abs(tz+88)<20)continue;
  const g=group(street);g.position.set(tx,0,tz);
  cyl(g,0,3.0,0,.12,.18,6.0,mats.dark,8);
  const arm=box(g,.65,5.85,0,1.35,.1,.1,mats.dark);arm.rotation.z=-.12;
  const lamp=sphere(g,1.24,5.7,0,.18,.12,.18,mats.gold);
  const pl=new THREE.PointLight(0xffd29a,.55,13);pl.position.set(1.2,5.2,0);g.add(pl);
 }
}
function addTree(x,z,scale=1){
 const g=group(city);g.position.set(x,0,z);g.scale.setScalar(scale);
 cyl(g,0,1.25,0,.27,.39,2.5,mats.trunk,8);
 for(const [xx,yy,zz,r] of [[0,3,0,1.55],[-.65,2.75,.15,1.02],[.7,2.85,-.12,1.08],[.1,3.8,.1,.9]]){
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mats.leaf[(Math.abs(Math.floor(x+z+xx*3))%4)]);crown.position.set(xx,yy,zz);crown.castShadow=true;g.add(crown);
 }
}
for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
 const x=i*48,z=j*48;
 if(Math.abs(x)>140||Math.abs(z)>140)continue;
 for(const side of [-1,1]){
  addTree(x+side*14,z+14,.8+((i+j+12)%3)*.1);
  addTree(x+14,z-side*14,.8+((i*2+j+12)%3)*.1);
 }
}
// Bridge promenade rails and water reflections.
for(const side of [-1,1]){
 box(city,0,.75,-88+side*8.4,17,.12,.16,mats.dark);
 for(let x=-8;x<=8;x+=2)box(city,x,.48,-88+side*8.4,.11,.58,.11,mats.dark);
}
for(let i=0;i<34;i++){
 const ripple=new THREE.Mesh(new THREE.CircleGeometry(.15+(i%3)*.12,12),new THREE.MeshBasicMaterial({color:0x9de0d1,transparent:true,opacity:.25}));
 ripple.rotation.x=-Math.PI/2;ripple.position.set(-150+i*9.1,-.31,-98+(i%5)*4.7);scene.add(ripple);
}

// Traffic and the hero's compact midnight-blue performance coupe.
const traffic=[];
const carColors=[0xd5b98f,0x718c89,0xe0ddd1,0x6d807e,0xb37c63,0x4e6470];
function makeCar(color=0x203a43,hero=false){
 const g=group();g.userData.hero=hero;
 const body=mat(color,.3,.38),glass=new THREE.MeshStandardMaterial({color:0x29434a,roughness:.18,metalness:.38}),
       rubber=mats.tire;
 box(g,0,.62,0,2.22,.62,4.35,body,true,true);
 box(g,0,1.05,-.28,1.86,.64,2.25,body,true);
 box(g,0,1.16,-.31,1.72,.49,2.08,glass);
 box(g,0,1.4,-1.03,1.65,.08,.09,mats.gold);
 box(g,-.83,.56,-2.16,.35,.2,.08,mats.white);box(g,.83,.56,-2.16,.35,.2,.08,mats.white);
 box(g,-.82,.57,2.18,.38,.22,.07,mats.red);box(g,.82,.57,2.18,.38,.22,.07,mats.red);
 box(g,0,.32,0,1.9,.13,3.85,mats.dark);
 const wheels=[];
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const wh=cyl(g,sx*1.1,.43,sz*1.38,.39,.39,.24,rubber,14);wh.rotation.z=Math.PI/2;wheels.push(wh);
  const hub=cyl(g,sx*1.235,.43,sz*1.38,.2,.2,.025,mats.gold,12);hub.rotation.z=Math.PI/2;
 }
 const head1=new THREE.PointLight(0xe4f6db,.6,13);head1.position.set(-.7,.7,-2.1);g.add(head1);
 const head2=new THREE.PointLight(0xe4f6db,.6,13);head2.position.set(.7,.7,-2.1);g.add(head2);
 g.userData.wheels=wheels;g.userData.body=body;g.userData.lights=[head1,head2];
 return g;
}
const playerCar=makeCar(0x213f49,true);playerCar.position.set(0,0,2);scene.add(playerCar);
for(let n=0;n<18;n++){
 const axis=n%2, lane=n%4<2?-2.5:2.5, road=Math.floor(n/4)*48-96;
 const c=makeCar(carColors[n%carColors.length]);
 if(axis===0){c.position.set(road+lane,0,-130+(n*31)%260);c.rotation.y=n%2?Math.PI:0;}
 else {c.position.set(-130+(n*37)%260,0,road+lane);c.rotation.y=Math.PI/2;}
 scene.add(c);traffic.push(c);
}

// Character on foot: friendly readable silhouette with a small arc sidearm.
const agent=group();
const skin=mat(0xb7805d), suit=mat(0x3e5554), suitLight=mat(0x9aa78f),
      gunMat=mat(0x18272a,.32,.5);
const torso=box(agent,0,1.05,0,.64,.8,.36,suit,true);box(agent,0,1.43,0,.43,.15,.4,suitLight);
sphere(agent,0,1.72,0,.25,.27,.24,skin);box(agent,0,1.8,-.01,.5,.09,.48,mat(0x293d3d));
for(const sx of [-1,1]){
 cyl(agent,sx*.19,.48,0,.14,.12,.55,mat(0x26383a));
 const arm=cyl(agent,sx*.42,1.03,0,.12,.1,.54,suit);arm.rotation.z=sx*.15;
}
box(agent,.34,1.12,-.28,.13,.1,.38,gunMat);
agent.visible=false;scene.add(agent);

const pets=[];
function makePet(x,z,type){
 const g=group();g.position.set(x,0,z);g.userData.phase=Math.random()*6.28;g.userData.type=type;
 const fur=mat(type==='DOG'?0xb98e62:0xd3c5a2), darkFur=mat(type==='DOG'?0x493b32:0x807567);
 box(g,0,.36,0,.72,.4,1.05,fur,true);sphere(g,0,.64,-.42,.3,.27,.31,fur);
 for(const sx of [-1,1]){box(g,sx*.2,.87,-.48,.1,.32,.12,darkFur);cyl(g,sx*.22,.13,-.28,.07,.07,.27,darkFur,8);}
 box(g,0,.64,-.7,.08,.08,.22,mat(0x4c3430));
 if(type==='CAT')box(g,0,.72,-.15,.12,.12,.64,fur);
 scene.add(g);pets.push(g);
}
makePet(-11,-17,'DOG');makePet(16,12,'CAT');makePet(37,34,'DOG');makePet(-44,22,'CAT');makePet(56,-48,'DOG');
