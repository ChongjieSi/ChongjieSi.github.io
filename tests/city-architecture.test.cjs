const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const realm={window:{}};vm.createContext(realm);for(const name of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+name+'.js'),'utf8'),realm);
const Architecture=realm.window.ArcadeCityArchitecture,City=realm.window.ArcadeCityWorld;
test('Every ordinary building has an individual seeded design, with all fourteen structural families represented',()=>{
  const world=City.create(),designs=world.buildings.map(b=>b.architecture);assert.ok(designs.length>200&&designs.length<400);assert.equal(new Set(designs.map(a=>a.kind)).size,14);
  const appearances=world.buildings.map(b=>JSON.stringify([b.architecture.kind,b.w,b.d,b.h,b.architecture.color,b.architecture.trim,b.architecture.bays,b.architecture.offset,b.architecture.roof,b.architecture.sign]));assert.equal(new Set(appearances).size,world.buildings.length);
  for(let i=1;i<designs.length;i++)assert.notEqual(designs[i].kind,designs[i-1].kind);
  assert.equal(JSON.stringify(world.buildings),JSON.stringify(City.create().buildings));assert.notEqual(JSON.stringify(designs),JSON.stringify(City.create(19).buildings.map(b=>b.architecture)));
});
test('Districts produce distinct skylines and materials instead of reusing one facade on every building',()=>{
  const world=City.create(),business=world.buildings.filter(b=>b.architecture.district==='business'),coast=world.buildings.filter(b=>b.architecture.district==='coast');
  assert.ok(business.some(b=>b.architecture.kind==='twin-tower'));assert.ok(business.some(b=>b.architecture.kind==='glass'));assert.ok(coast.some(b=>b.architecture.kind==='villa'));
  const mean=list=>list.reduce((sum,b)=>sum+b.h,0)/list.length;assert.ok(mean(business)>mean(coast));
  const surfaces=new Set(world.buildings.flatMap(b=>Architecture.parts(b).map(p=>p.surface)));for(const name of ['brickwork','render','cladding','limestone','glass','roof','window-light','signage'])assert.ok(surfaces.has(name));
});
test('Generated volumes, pitched roofs, signs and window panels have finite dimensions and remain within the roof envelope',()=>{
  for(const b of City.create().buildings){const parts=Architecture.parts(b);assert.ok(parts.length>8);for(const p of parts){for(const v of [p.x,p.y,p.z,p.w,p.h,p.d,p.rotation])assert.ok(Number.isFinite(v));assert.ok(p.w>0&&p.h>0&&p.d>0);assert.ok(p.y-p.h/2>=-.01);assert.ok(p.y+p.h/2<=b.h+.21,`${b.architecture.kind} roof envelope`);}}
});
test('Crosswalks span each carriageway and keep their approaches outside the crossing road',()=>{
  const world=City.create(),plan=Architecture.infrastructure(City.roads),near=plan.crossings.filter(p=>Math.abs(p.x)<17&&Math.abs(p.z)<17);assert.equal(near.length,80);
  for(const p of plan.crossings){assert.ok(p.w>0&&p.d>0);assert.ok(p.x+p.w/2<333);if(realm.window.ArcadeCityTerrain.facilityAllowed(world,p.x,p.z))assert.equal(City.blocked(world,p.x,p.z,.05),false);}
});
test('Footpaths and lamps track the actual two, four and six lane road widths',()=>{
  const plan=Architecture.infrastructure(City.roads);assert.ok(plan.lamps.length>=400);assert.ok(plan.signs.length>100);
  assert.deepEqual([...new Set(City.roads.map(n=>Architecture.streetProfile(n).lanes))].sort(),[1,2,3]);
  for(const axis of ['x','z'])for(const road of City.roads){const curb=Architecture.streetProfile(road).width/2+1.35;assert.ok(plan.lamps.some(p=>p.axis===axis&&Math.abs(Math.abs(p[axis==='z'?'x':'z']-road)-curb)<.0001));}
  for(const p of plan.sidewalks){const axis=p.axis==='z'?'z':'x',length=p.axis==='z'?p.d:p.w;for(const road of City.roads)assert.ok(Math.abs(road-p[axis])>=length/2+Architecture.streetProfile(road).width/2+1.99);}
});
test('Traffic occupies the right lane in both directions, matching the approach stop lines',()=>{
  for(const car of City.create().traffic){const fixed=car.lane==='x'?car.z:car.x,road=City.roads.reduce((best,n)=>Math.abs(n-fixed)<Math.abs(best-fixed)?n:best);const offset=(fixed-road)/(car.lane==='x'?car.sign:-car.sign);assert.ok(Architecture.streetProfile(road).laneCenters.some(n=>Math.abs(offset-n)<.0001));}
});
