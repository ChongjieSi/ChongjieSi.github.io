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
