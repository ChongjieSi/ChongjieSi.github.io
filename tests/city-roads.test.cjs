const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const realm={window:{}};vm.createContext(realm);for(const file of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+file+'.js'),'utf8'),realm);
const City=realm.window.ArcadeCityWorld,Terrain=realm.window.ArcadeCityTerrain,Architecture=realm.window.ArcadeCityArchitecture;
test('Building parcels leave real footpaths and setbacks beside every road width',()=>{
  const world=City.create();assert.ok(world.buildings.length>200&&world.buildings.length<400);
  assert.equal(world.buildings.filter(b=>b.x>32&&b.x<64&&b.z>32&&b.z<64).length,1);
  for(const b of world.buildings)for(const road of City.roads){const profile=Architecture.streetProfile(road),minimum=profile.width/2+profile.sidewalk+profile.setback;assert.ok(Math.abs(b.x-road)-b.w/2>=minimum-.01,b.id+' x frontage');assert.ok(Math.abs(b.z-road)-b.d/2>=minimum-.01,b.id+' z frontage');}
});
test('The stadium has an independent site and no road surface crosses its full footprint',()=>{
  const world=City.create(),stadium=world.places.find(p=>p.id==='stadium'),box={x:stadium.x,z:stadium.z,hw:stadium.w/2,hl:stadium.d/2,right:{x:1,z:0},forward:{x:0,z:1}};
  assert.ok(world.roadPlan.paths.some(p=>p.id==='stadium-avenue'));assert.ok(stadium.z>344);
  for(const road of world.roadPlan.paths)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);assert.equal(City.boxContact(box,{x:(a.x+b.x)/2,z:(a.z+b.z)/2,hw:road.width/2,hl:length/2,right:{x:dz/length,z:-dx/length},forward:{x:dx/length,z:dz/length}}),null,road.id);}
  City.navigate(world,'stadium');const route=City.navigationPath(world);assert.ok(route.length>1);assert.ok(City.distance(route.at(-1),stadium.door)<.01);
});
test('Both highway approaches start flush, have gentle continuous slopes and can be driven end to end',()=>{
  for(const reverse of [false,true]){const world=City.create(),road=world.roadPlan.paths.find(p=>p.id==='bay-viaduct'),points=road.points.slice();if(reverse)points.reverse();assert.equal(points[0].y,0);assert.equal(points.at(-1).y,0);
    for(let i=1;i<points.length;i++)assert.ok(Math.abs(points[i].y-points[i-1].y)/City.distance(points[i],points[i-1])<.125);
    world.traffic=[];world.cars=[world.cars[0]];world.vehicle=0;const car=world.cars[0];Object.assign(car,points[0],{elevation:0,surfaceId:null,health:100});Object.assign(world.player,points[0]);let index=1,highest=0,stalled=0;
    for(let frame=0;frame<16000&&index<points.length;frame++){const target=points[index];if(City.distance(car,target)<.45){index++;continue;}car.yaw=Math.atan2(target.x-car.x,-(target.z-car.z));car.speed=8;const before={x:car.x,z:car.z};City.step(world,.02,{});highest=Math.max(highest,car.elevation||0);stalled=City.distance(car,before)<.01?stalled+1:0;assert.ok(stalled<10,'stalled on ramp '+index);}
    assert.equal(index,points.length);assert.ok(highest>11.5);assert.ok(car.elevation<.1);assert.equal(car.health,100);
  }
});
test('Highway entrance destinations work from the city and preserve the ground route beneath its deck',()=>{
  const world=City.create();for(const entrance of world.roadPlan.entrances){City.navigate(world,entrance.id);assert.equal(world.waypoint.name,entrance.name);const route=City.navigationPath(world);assert.ok(route.length>1,entrance.id);assert.ok(City.distance(route.at(-1),entrance.door)<.01);}
  const road=world.roadPlan.paths.find(p=>p.type==='elevated'),p=road.points.find(p=>p.y>11.9&&Math.abs(p.x)<10);assert.ok(Terrain.roadAt(world,p.x,p.z,0,true).y<1);assert.ok(Terrain.roadAt(world,p.x,p.z,p.y,true,{id:road.id,yaw:0}).y>11);
});
test('Signboards have independently readable front and back faces with outward winding',()=>{
  class BufferGeometry{constructor(){this.attributes={};}setAttribute(n,a){this.attributes[n]=a;}setIndex(a){this.indices=a;}}
  class Attribute{constructor(array,size){this.array=array;this.itemSize=size;}}
  const geometry=Architecture.signGeometry({BufferGeometry,Float32BufferAttribute:Attribute},4,1),p=geometry.attributes.position.array,u=geometry.attributes.uv.array;
  assert.equal(p.length,24);for(const offset of [0,4]){const normal=offset? -1:1;assert.ok((p[(offset+1)*3]-p[offset*3])*normal>0);assert.equal(u[offset*2],0);assert.equal(u[(offset+1)*2],1);const [a,b,c]=geometry.indices.slice(offset?6:0,offset?9:3),dx1=p[b*3]-p[a*3],dy1=p[b*3+1]-p[a*3+1],dx2=p[c*3]-p[a*3],dy2=p[c*3+1]-p[a*3+1];assert.ok((dx1*dy2-dy1*dx2)*normal>0);}
});

test('Forest approaches are graded continuously and additional routes have connected entrances',()=>{
 const world=City.create();assert.equal(world.roadPlan.paths.filter(p=>p.type==='elevated').length,2);assert.equal(world.roadPlan.paths.filter(p=>p.type==='tunnel').length,2);
 for(const id of ['forest-road','forest-connector']){const path=world.roadPlan.paths.find(p=>p.id===id);for(let i=1;i<path.points.length;i++)assert.ok(Math.abs(path.points[i].y-path.points[i-1].y)/City.distance(path.points[i],path.points[i-1])<=.201,id);}
 for(const id of ['forest-access','north-west','north-east','valley-access']){City.navigate(world,id);assert.ok(City.navigationPath(world).length>1,id);}
});
test('Retail uses have real purpose-specific furniture and wildlife observation rewards only once',()=>{
 const world=City.create(),I=realm.window.ArcadeCityInteriors;for(const [type,fixture]of [['convenience','fridge'],['bakery','oven'],['bank','atm'],['cafe','coffee-station']]){const b=world.buildings.find(b=>b.interiorType==='shop'&&b.shopType===type);assert.ok(b,type);assert.ok(I.plan(b).furniture.some(f=>f.kind===fixture),fixture);}
 assert.equal(new Set(world.animals.map(a=>a.species)).size,6);const a=world.animals[0];Object.assign(world.player,a);world.elevation=a.y;world.cars=[];world.traffic=[];const score=world.score;City.interact(world);assert.equal(world.observedWildlife.size,1);assert.equal(world.score,score+80);City.choose(world,'job-close');City.interact(world);assert.equal(world.score,score+80);
});

test('Forest main road stays on one bank and terrain blending is independent of spatial entry order',()=>{
 const w=City.create(),road=w.roadPlan.paths.find(p=>p.id==='forest-road');for(const p of road.points){const stream=Terrain.riverAt(p.x,p.z);assert.ok(stream.d>15,'main road must stay clear of stream banks');}
 const samples=[[-390,122],[-510,80],[-552,-268],[-535,-120],[-456,236]],heights=samples.map(([x,z])=>Terrain.groundHeight(w,x,z));for(const entries of w.roadPlan.spatial.values())entries.reverse();samples.forEach(([x,z],i)=>assert.ok(Math.abs(Terrain.groundHeight(w,x,z)-heights[i])<1e-6));
});
test('Per-address decoration has stable signatures, visible themes and wall details without blocking entry',()=>{
 const w=City.create(),I=realm.window.ArcadeCityInteriors,signatures=new Set(),themes=new Set();for(const b of w.buildings){const room=I.plan(b);signatures.add(room.signature);themes.add(room.style);for(const kind of ['clock','sconce','wall-shelf','gallery-strip'])assert.ok(room.furniture.some(f=>f.kind===kind));w.interior=room;assert.equal(City.blocked(w,0,room.depth/2-4),false);assert.equal(JSON.stringify(room),JSON.stringify(I.plan(b)));}assert.equal(signatures.size,w.buildings.length);assert.equal(themes.size,8);
});
test('Tracking an ascending road uses the nearest segment instead of lagging at the previous height',()=>{
 const w=City.create();for(const road of w.roadPlan.paths.filter(p=>['forest-road','tunnel'].includes(p.type)))for(let i=2;i<road.points.length-2;i+=7){const p=road.points[i],surface=Terrain.roadAt(w,p.x,p.z,p.y-.5,true,{id:road.id});assert.equal(surface.path.id,road.id);assert.ok(Math.abs(surface.y-p.y)<1e-6,road.id+' '+i);}
});

test('Forest footbridges keep their water clearance and meet the road at the actual road height',()=>{
 const w=City.create(),road=w.roadPlan.paths.find(p=>p.id==='forest-road'),walk=w.roadPlan.paths.find(p=>p.id==='woodland-walk');let crossings=0;
 for(let i=0;i<walk.points.length;i++){const p=walk.points[i],stream=Terrain.riverAt(p.x,p.z),junction=Terrain.nearest(road.points,p.x,p.z);
  if(junction.d<6.2)assert.ok(Math.abs(p.y-junction.y)<1e-6,'road/trail junction '+i);
  else if(stream.d<8){assert.ok(Math.abs(p.y-stream.y-1.6)<1e-6,'bridge deck '+i);crossings++;}
  if(i)assert.ok(Math.abs(p.y-walk.points[i-1].y)/City.distance(p,walk.points[i-1])<=.300001,'walkway grade '+i);
  assert.equal(City.blocked(w,p.x,p.z,.42,p.y),false,'walkway '+i);
 }
 assert.ok(crossings>20);
});
test('The lookout pavilion stands beside the carriageway and the parking apron has a real drivable height',()=>{
 const w=City.create(),rest=w.roadPlan.restArea,pavilion={x:rest.pavilion.x,z:rest.pavilion.z,hw:4.2,hl:3.6,right:{x:1,z:0},forward:{x:0,z:1}};
 for(const road of w.roadPlan.paths.filter(p=>!['trail','garden-path'].includes(p.type)))for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],length=City.distance(a,b);if(City.distance(rest,a)>40)continue;
  assert.equal(City.boxContact(pavilion,{x:(a.x+b.x)/2,z:(a.z+b.z)/2,hw:road.width/2+.8,hl:length/2,right:{x:(b.z-a.z)/length,z:-(b.x-a.x)/length},forward:{x:(b.x-a.x)/length,z:(b.z-a.z)/length}}),null,'pavilion must clear '+road.id);
 }
 for(const offset of [-6,0,6]){const surface=Terrain.roadAt(w,rest.x+offset,rest.z,rest.y,true);assert.ok(Math.abs(surface.y-rest.y)<1e-6);assert.equal(Terrain.landscapeBlocked(w,rest.x+offset,rest.z,.1,rest.y,true),false);}
 const road=w.roadPlan.paths.find(p=>p.id==='forest-road');for(let i=road.points.length-4;i<road.points.length;i++)assert.equal(road.points[i].y,rest.y);
});
test('The rendered heightfield has enough grading width to keep stream-bank terrain below the trail',()=>{
 const w=City.create(),walk=w.roadPlan.paths.find(p=>p.id==='woodland-walk');
 // These road-edge raster cells previously rose through the walkway despite a clear centreline.
 for(const [x,z]of [[-560,-138],[-566,-148],[-662,-246]])assert.ok(Terrain.groundHeight(w,x,z)<Terrain.nearest(walk.points,x,z).y-.05,'graded bank '+x+','+z);
 for(const p of w.roadPlan.river)assert.ok(Terrain.groundHeight(w,p.x,p.z)<p.y-.5,'the river bed must remain below the water');
});
test('The western forest road crosses the stream above water on both traffic lanes',()=>{
 const w=City.create(),road=w.roadPlan.paths.find(p=>p.id==='west-neighbourhood');let crossings=0;
 for(let i=1;i<road.points.length;i++){const p=road.points[i],a=road.points[i-1],stream=Terrain.riverAt(p.x,p.z),length=City.distance(a,p);assert.ok(Math.abs(p.y-a.y)/length<=.180001);
  if(stream.d>5)continue;crossings++;assert.ok(p.y>stream.y+1.9);
  for(const offset of [-1.6,1.6]){const x=p.x+(p.z-a.z)/length*offset,z=p.z-(p.x-a.x)/length*offset;assert.equal(Terrain.landscapeBlocked(w,x,z,.1,p.y,true),false,'stream crossing '+i);}
 }
 assert.ok(crossings>=3);
});
test('Driving through the tunnel junction changes surfaces without a phantom road cap or height step',()=>{
 for(const reverse of [false,true]){const w=City.create(),forest=w.roadPlan.paths.find(p=>p.id==='forest-road'),tunnel=w.roadPlan.paths.find(p=>p.id==='ridge-tunnel'),join=forest.points.reduce((best,p,i)=>City.distance(p,tunnel.points.at(-1))<City.distance(forest.points[best],tunnel.points.at(-1))?i:best,0),points=[...forest.points.slice(join,join+18).reverse(),...tunnel.points.slice().reverse().slice(1)];if(reverse)points.reverse();w.traffic=[];w.cars=[w.cars[0]];w.vehicle=0;const car=w.cars[0];Object.assign(car,points[0],{elevation:points[0].y,surfaceId:reverse?tunnel.id:forest.id});Object.assign(w.player,points[0]);let cursor=1;
  for(let n=0;n<10000&&cursor<points.length;n++){const target=points[cursor];if(City.distance(car,target)<.3){cursor++;continue;}car.yaw=Math.atan2(target.x-car.x,-(target.z-car.z));car.speed=8;const y=car.elevation;City.step(w,.04,{});assert.ok(Math.abs(car.elevation-y)<.3,'height step at tunnel junction');assert.equal(car.health,100);}
  assert.equal(cursor,points.length,'must reach the other end without skipping the junction');
 }
});
test('Tunnel mouth clipping removes only the opening and retains both textured shoulders',()=>{
 const planes=[{x:1,y:0,z:0,c:4},{x:-1,y:0,z:0,c:4},{x:0,y:0,z:1,c:0},{x:0,y:0,z:-1,c:4},{x:0,y:1,z:0,c:0},{x:0,y:-1,z:0,c:6}],point=(x,z,y=3)=>({x,y,z,u:(x+8)/16,v:z/4}),a=point(-8,0),b=point(8,0),c=point(8,4),d=point(-8,4),kept=[...Terrain.subtractPrism([a,b,c],planes),...Terrain.subtractPrism([a,c,d],planes)];
 const area=polygon=>Math.abs(polygon.reduce((sum,p,i)=>{const q=polygon[(i+1)%polygon.length];return sum+p.x*q.z-q.x*p.z;},0))/2;
 assert.ok(Math.abs(kept.reduce((sum,p)=>sum+area(p),0)-32)<1e-8,'both 4-metre shoulders remain; the 8-metre opening is removed');
 assert.ok(kept.some(p=>p.some(v=>v.x<-4)));assert.ok(kept.some(p=>p.some(v=>v.x>4)));
 for(const polygon of kept)for(const p of polygon){assert.ok(Math.abs(p.u-(p.x+8)/16)<1e-8);assert.ok(Math.abs(p.v-p.z/4)<1e-8);}
 const roof=Terrain.subtractPrism([point(-8,0,8),point(8,0,8),point(8,4,8)],planes);assert.equal(roof.reduce((sum,p)=>sum+area(p),0),32,'mountain terrain above the tunnel ceiling is preserved');assert.ok(roof.every(p=>p.every(v=>v.y===8)));
});
