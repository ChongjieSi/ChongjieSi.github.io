const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const realm={window:{}};vm.createContext(realm);for(const name of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+name+'.js'),'utf8'),realm);
const City=realm.window.ArcadeCityWorld,Terrain=realm.window.ArcadeCityTerrain,Interiors=realm.window.ArcadeCityInteriors;
test('Every address has a clear entrance, unique furnishings and a working enter/exit round trip',()=>{
  const world=City.create(),plans=new Set();world.cars=[];world.traffic=[];
  for(const building of world.buildings){Object.assign(world.player,building.door);world.elevation=building.baseY;assert.equal(City.blocked(world,world.player.x,world.player.z),false,building.id);const context=City.context(world);assert.equal(context.kind,'building',building.id);assert.equal(context.id,building.id);assert.equal(City.interact(world),true);const room=world.interior;assert.equal(room.buildingId,building.id);assert.ok(room.furniture.length>10);plans.add(JSON.stringify([room.width,room.depth,room.variant,room.accent,room.furniture]));assert.equal(City.blocked(world,world.player.x,world.player.z),false);Object.assign(world.player,room.exit);City.interact(world);assert.equal(world.interior,null);assert.equal(world.player.x,building.door.x);assert.equal(world.player.z,building.door.z);}
  assert.equal(world.enteredBuildings.size,world.buildings.length);assert.equal(plans.size,world.buildings.length);
});
test('Every floor has clear entry and lift landings; elevators retain the exterior return location',()=>{
  const world=City.create();for(const building of world.buildings){for(const floor of new Set([0,building.floorCount-1])){const room=Interiors.plan(building,floor);world.interior=room;assert.equal(City.blocked(world,0,room.depth/2-4),false,building.id);if(room.floorCount>1)assert.equal(City.blocked(world,room.lift.x,room.lift.z-.8),false,building.id);}}
  world.interior=null;const b=world.buildings.find(b=>b.floorCount>3);Object.assign(world.player,b.door);City.enterBuilding(world,b.id);const before={...world.returnTo};Object.assign(world.player,world.interior.lift);City.interact(world);assert.equal(world.dialog.kind,'elevator');City.choose(world,'floor-2');assert.equal(world.interior.floor,2);assert.equal(world.returnTo.x,before.x);assert.equal(world.returnTo.z,before.z);assert.equal(City.blocked(world,world.player.x,world.player.z),false);Object.assign(world.player,world.interior.exit);City.interact(world);assert.equal(world.player.x,b.door.x);
});
test('Interior notes and first visits reward once, and cancelled floor choices do not teleport',()=>{
  const world=City.create(),b=world.buildings.find(b=>b.interiorType==='shop');Object.assign(world.player,b.door);City.enterBuilding(world,b.id);const room=world.interior,spot=room.hotspots.find(h=>h.kind==='room-note');Object.assign(world.player,spot);const before=world.score;City.interact(world);assert.ok(world.dialog);City.choose(world,'job-close');City.interact(world);City.choose(world,'job-close');assert.equal(world.score,before+60);const current=world.interior.id;City.choose(world,'floor-999');assert.equal(world.interior.id,current);
});
test('Viaducts, tunnels and curved streets have separate heights and reserve their building corridors',()=>{
  const world=City.create(),paths=world.roadPlan.paths;assert.ok(paths.some(p=>p.type==='elevated'&&p.points.some(n=>n.y>10)));assert.ok(paths.some(p=>p.type==='tunnel'));assert.ok(paths.some(p=>p.type==='boulevard'&&p.points.some((n,i)=>i&&n.x!==p.points[i-1].x&&n.z!==p.points[i-1].z)));
  for(const b of world.buildings)assert.equal(Terrain.reserveBuilding(world,b),false,b.id);
  const bridge=paths.find(p=>p.type==='elevated'),p=bridge.points.find(n=>n.y>11);assert.ok(Terrain.height(world,p.x,p.z,p.y,true)>10);assert.ok(Terrain.height(world,p.x,p.z,0,true)<2);
  const car=world.cars[0],other=world.cars[1];Object.assign(car,{x:p.x,z:p.z,yaw:0,elevation:p.y});Object.assign(other,{x:p.x,z:p.z,yaw:0,elevation:0});world.collisionIndex=new Map();assert.equal(City.vehicleContact(world,car,[other],false),null);other.elevation=p.y;assert.equal(City.vehicleContact(world,car,[other],false).kind,'car');
});
test('The forest has hills, a descending stream and accessible park/forest destinations',()=>{
  const world=City.create(),river=world.roadPlan.river;assert.ok(Terrain.rawHeight(-650,-530)>40);assert.ok(river[0].y>river.at(-1).y+15);assert.ok(world.bounds.minX<-800);const pond=Terrain.park.pond;assert.equal(City.blocked(world,pond.x,pond.z-8,.42,0),true);
  for(const place of world.destinations){City.navigate(world,place.id);assert.equal(world.waypoint.name,place.name);const route=City.navigationPath(world);assert.ok(route.length>1,place.id);assert.ok(City.distance(route.at(-1),place.door)<.01,place.id);}
});
test('Furnishings leave a walkable path from every address to its notes and lift',()=>{
  const world=City.create(),step=.4;
  for(const building of world.buildings)for(const floor of new Set([0,building.floorCount-1])){
    const room=Interiors.plan(building,floor);world.interior=room;
    const origin=room.depth/2-4,queue=[{x:0,z:origin}],seen=new Set(['0,0']),reached=new Set();
    for(let i=0;i<queue.length;i++){
      const p=queue[i];for(const h of room.hotspots)if(City.distance(p,h)<2.4&&City.distance(p,room.exit)>2.65)reached.add(h.kind);
      for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx*step,z=p.z+dz*step,key=Math.round(x/step)+','+Math.round((z-origin)/step);
        if(seen.has(key))continue;seen.add(key);if(!City.blocked(world,x,z))queue.push({x,z});
      }
    }
    for(const h of room.hotspots)assert.ok(reached.has(h.kind),building.id+' floor '+floor+' '+h.kind);
  }
});
test('New art packs remain local, include true transparent foliage and have complete generation records',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../static/games/textures/expansion-generation.json'),'utf8'));assert.equal(manifest.tool,'Built-in image_gen');assert.equal(manifest.assets.length,5);for(const asset of manifest.assets){const b=fs.readFileSync(path.join(__dirname,'../static/games/textures/',asset.file));assert.ok(b.length>100000);assert.ok(asset.prompt.length>200);if(asset.transparent)assert.equal(b[25],6);}
});
