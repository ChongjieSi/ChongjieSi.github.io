const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const realm={window:{}};vm.createContext(realm);vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/city-architecture.js'),'utf8'),realm);for(const extra of ['city-terrain','city-interiors'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+extra+'.js'),'utf8'),realm);vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/city-world.js'),'utf8'),realm);
const City=realm.window.ArcadeCityWorld;
const run=(world,seconds,input)=>{for(let t=0;t<seconds;t+=.05)City.step(world,.05,input);};
test('City has a deterministic, walkable spawn, drivable roads and reachable delivery points',()=>{
  const world=City.create();assert.equal(City.blocked(world,world.player.x,world.player.z),false);
  assert.ok(world.buildings.length>=100);assert.equal(world.cars.length,12);assert.equal(world.tokens.length,36);
  for(const n of [-96,-64,-32,0,32,64,96])for(let p=-100;p<=100;p+=4)assert.equal(City.blocked(world,n,p,1.1),false);
  for(const route of City.routes)assert.equal(City.blocked(world,route.x,route.z,.45),false);
  assert.equal(JSON.stringify(City.create().buildings),JSON.stringify(world.buildings));
});
test('On foot movement follows the camera and sprinting is faster',()=>{
  const walk=City.create(),sprint=City.create();run(walk,.5,{forward:true});run(sprint,.5,{forward:true,sprint:true});
  assert.ok(walk.player.z<13);assert.ok(sprint.player.z<walk.player.z);
  const right=City.create();run(right,.5,{right:true});assert.ok(right.player.x>0);
  const rotated=City.create();rotated.cameraYaw=Math.PI/2;run(rotated,.5,{forward:true});assert.ok(rotated.player.x>0);
});
test('Player cannot walk through building walls or beyond the coastline',()=>{
  const world=City.create(),b=world.buildings[0];world.player.x=b.x-b.w/2-.5;world.player.z=b.z;
  run(world,2,{right:true});assert.equal(City.blocked(world,world.player.x,world.player.z),false);assert.ok(world.player.x<b.x-b.w/2);
  world.player.x=373;world.player.z=0;run(world,4,{right:true,sprint:true});assert.ok(world.player.x<374);
});
test('A nearby parked car can be entered and exited safely',()=>{
  const world=City.create();assert.equal(City.interact(world),true);assert.equal(world.vehicle,0);
  assert.equal(City.interact(world),true);assert.equal(world.vehicle,-1);assert.equal(City.blocked(world,world.player.x,world.player.z),false);
});
test('Driving accelerates, steering turns right, and moving cars cannot be exited',()=>{
  const world=City.create();City.interact(world);run(world,.6,{forward:true,right:true});
  const car=world.cars[0];assert.ok(car.speed>3);assert.ok(car.yaw>0);assert.ok(car.x>3);assert.ok(car.z<13);
  assert.equal(City.interact(world),false);assert.equal(world.vehicle,0);
});
test('Handbrake reduces vehicle speed and reverse is bounded',()=>{
  const world=City.create();City.interact(world);run(world,.5,{forward:true});const before=world.cars[0].speed;
  run(world,.3,{brake:true});assert.ok(world.cars[0].speed<before);
  run(world,1,{back:true});assert.ok(world.cars[0].speed<0);assert.ok(world.cars[0].speed>=-9);
});
test('Building collisions stop the car from clipping and damage its body',()=>{
  const world=City.create(),b=world.buildings[0],car=world.cars[0];world.vehicle=0;car.x=b.x-b.w/2-1.91;car.z=b.z;car.yaw=Math.PI/2;car.speed=15;
  City.step(world,.05,{});assert.ok(car.health<100);assert.equal(City.blocked(world,car.x,car.z,1.1),false);
});
test('A wrecked car does not move under acceleration and recovery restores a safe spawn',()=>{
  const world=City.create();City.interact(world);world.cars[0].health=0;const {x,z}=world.cars[0];run(world,1,{forward:true});
  assert.equal(world.cars[0].x,x);assert.equal(world.cars[0].z,z);City.recover(world);assert.equal(world.cars[0].health,100);assert.equal(City.blocked(world,world.player.x,world.player.z,1.1),false);
});
test('Stopping at a delivery completes it once and advances the route',()=>{
  const world=City.create();world.player.x=world.mission.x;world.player.z=world.mission.z;City.step(world,.05,{});
  assert.equal(world.deliveries,1);assert.ok(world.score>=750);const score=world.score;run(world,1,{});assert.equal(world.deliveries,1);assert.equal(world.score,score);
});
test('Collectibles and first district visits cannot be farmed by standing still',()=>{
  const world=City.create(),token=world.tokens[0];world.player.x=token.x;world.player.z=token.z;City.step(world,.05,{});
  assert.equal(world.collected,1);assert.ok(world.score>=250);const score=world.score;run(world,2,{});assert.equal(world.collected,1);assert.equal(world.score,score);
});
test('Traffic stays inside the map over a long simulation and the world stays finite',()=>{
  const world=City.create();for(let t=0;t<300;t+=5){run(world,5,{});noVehicleOverlaps(world);}for(const v of world.traffic){assert.ok(v.x>=world.bounds.minX&&v.x<=world.bounds.maxX&&v.z>=world.bounds.minZ&&v.z<=world.bounds.maxZ);}
  assert.ok(Number.isFinite(world.player.x)&&Number.isFinite(world.player.z));
});

test('Expanded map has over ten times the original playable area and all nine entrances are reachable',()=>{
  const world=City.create(),b=world.bounds;assert.ok((b.maxX-b.minX)*(b.maxZ-b.minZ)>216*216*10);assert.ok(world.buildings.length>200&&world.buildings.length<400);assert.equal(world.places.length,9);
  for(const p of world.places)assert.equal(City.blocked(world,p.door.x,p.door.z,.45),false,p.id);
});
test('Cafe, museum and stadium enter real bounded interiors and return to the same exterior entrance',()=>{
  for(const id of ['cafe','museum','stadium']){
    const world=City.create(),p=world.places.find(v=>v.id===id);Object.assign(world.player,p.door);const start={...world.player};
    assert.equal(City.interact(world),true);assert.equal(world.interior.id,id);assert.equal(City.blocked(world,world.player.x,world.player.z),false);assert.equal(City.blocked(world,100,100),true);
    Object.assign(world.player,world.interior.exit);assert.equal(City.interact(world),true);assert.equal(world.interior,null);assert.equal(world.player.x,start.x);assert.equal(world.player.z,start.z);assert.equal(City.blocked(world,world.player.x,world.player.z),false);
  }
});
test('Tower and lighthouse viewpoints lock walking at the proper height and safely return to ground',()=>{
  for(const id of ['tower','lighthouse']){const world=City.create(),place=world.places.find(p=>p.id===id);Object.assign(world.player,place.door);City.interact(world);assert.equal(world.onTower,id);assert.equal(world.elevation,place.elevation);const before={...world.player};run(world,1,{forward:true,right:true});assert.equal(world.player.x,before.x);assert.equal(world.player.z,before.z);City.interact(world);assert.equal(world.elevation,0);assert.equal(world.onTower,null);assert.equal(City.blocked(world,world.player.x,world.player.z),false);}
});
test('Coffee restores stamina and the first interaction bonus is awarded once',()=>{
  const world=City.create(),place=world.places.find(p=>p.id==='cafe');Object.assign(world.player,place.door);City.interact(world);Object.assign(world.player,{x:0,z:-5});world.stamina=8;const before=world.score;City.interact(world);assert.equal(world.stamina,100);assert.equal(world.score,before+100);assert.ok(world.dialog);City.choose(world,'close');City.interact(world);assert.equal(world.score,before+100);
});
test('Museum exhibits provide distinct descriptions and cannot award duplicate inspection points',()=>{
  const world=City.create(),place=world.places.find(p=>p.id==='museum');Object.assign(world.player,place.door);City.interact(world);const base=world.score;
  for(const e of City.exhibits){Object.assign(world.player,{x:e.x,z:e.z+2.5});assert.equal(City.context(world).kind,'exhibit');City.interact(world);assert.equal(world.dialog.title,e.label);City.choose(world,'close');City.interact(world);City.choose(world,'close');}
  assert.equal(world.inspected.size,3);assert.equal(world.score,base+450);
});
test('Stadium training requires all four checkpoints and repeated identical runs do not farm points',()=>{
  const world=City.create(),place=world.places.find(p=>p.id==='stadium');Object.assign(world.player,place.door);City.interact(world);
  function lap(){Object.assign(world.player,{x:-16,z:28});City.interact(world);assert.equal(world.trial.index,0);for(const checkpoint of City.checkpoints){Object.assign(world.player,checkpoint);City.step(world,.05,{});}assert.equal(world.trial,null);}
  lap();assert.ok(world.stadiumBest>=1000);const score=world.score;lap();assert.equal(world.score,score);
});
test('Beach quest navigates through four shells and rewards completion exactly once',()=>{
  const world=City.create(),place=world.places.find(p=>p.id==='surf');Object.assign(world.player,place.door);City.interact(world);City.choose(world,'beach-quest');assert.equal(world.beachQuest,true);assert.ok(world.waypoint);
  for(const shell of world.shells){Object.assign(world.player,shell);City.step(world,.05,{});}
  assert.equal(world.shells.filter(s=>s.taken).length,4);assert.equal(world.beachComplete,true);assert.equal(world.waypoint,null);const score=world.score;run(world,1,{});assert.equal(world.score,score);
});
test('Map navigation marks an exterior entrance without teleporting the player',()=>{
  const world=City.create(),before={...world.player};City.navigate(world,'museum');assert.equal(world.waypoint.name,'潮汐艺术馆');assert.equal(world.player.x,before.x);assert.equal(world.player.z,before.z);
});
test('Map and conversation panels freeze driving input instead of allowing unseen crashes',()=>{
  const world=City.create();City.interact(world);run(world,.5,{forward:true});const before={...world.player},speed=world.cars[0].speed;world.dialog={kind:'map'};run(world,2,{forward:true});assert.equal(world.player.x,before.x);assert.equal(world.player.z,before.z);assert.equal(world.cars[0].speed,speed);
});
test('Exploration rewards are unique, and recovery can leave an interior without losing the journal',()=>{
  const world=City.create();for(const place of world.places.slice(0,6)){Object.assign(world.player,place.door);City.step(world,.05,{});}assert.ok(world.discovered.size>=6);assert.equal(world.explorerReward,true);
  const place=world.places.find(p=>p.id==='cafe');Object.assign(world.player,place.door);City.interact(world);const count=world.discovered.size;City.recover(world);assert.equal(world.interior,null);assert.equal(world.discovered.size,count);assert.equal(world.player.z,13);
});
test('Coastline blocks ocean walking while the actual pier remains traversable',()=>{
  const world=City.create();assert.equal(City.blocked(world,395,0),true);assert.equal(City.blocked(world,395,224),false);assert.equal(City.blocked(world,420,224),true);
});
function startRace(world,id='park-loop'){
  const course=City.races.find(r=>r.id===id);world.vehicle=0;Object.assign(world.cars[0],course.start,{speed:0,health:100});Object.assign(world.player,course.start);assert.equal(City.context(world).kind,'race');City.interact(world);return course;
}
test('Driving courses follow continuous clear roads with enough room for a vehicle',()=>{
  const world=City.create();
  for(const race of City.races){let previous=race.start;for(const next of race.checkpoints){const count=Math.ceil(City.distance(previous,next));for(let i=0;i<=count;i++){const t=i/count;assert.equal(City.blocked(world,previous.x+(next.x-previous.x)*t,previous.z+(next.z-previous.z)*t,1.1),false,race.id);}previous=next;}}
});
test('Race start requires a stopped working car and countdown cannot be skipped by driving or opening the map',()=>{
  const world=City.create(),course=City.races[0];Object.assign(world.player,course.start);assert.notEqual(City.context(world)?.kind,'race');
  world.vehicle=0;Object.assign(world.cars[0],course.start,{speed:5});assert.notEqual(City.context(world).kind,'race');world.cars[0].speed=0;world.cars[0].health=0;City.interact(world);assert.equal(world.race,null);
  startRace(world);run(world,1,{forward:true});assert.equal(world.player.z,course.start.z);assert.equal(world.race.elapsed,0);const remaining=world.race.countdown;world.dialog={kind:'map'};run(world,1,{forward:true});assert.equal(world.race.countdown,remaining);world.dialog=null;run(world,2.1,{});assert.equal(world.race.countdown,0);
});
test('Race checks are ordered, modal time is frozen, and only improved runs award more points',()=>{
  const world=City.create(),course=startRace(world);world.traffic=[];run(world,3.1,{});
  Object.assign(world.cars[0],course.checkpoints[2]);City.step(world,.05,{});assert.equal(world.race.index,0);
  world.dialog={kind:'map'};const elapsed=world.race.elapsed;run(world,3,{});assert.equal(world.race.elapsed,elapsed);world.dialog=null;
  function finishLap(time){world.race.elapsed=time;for(const point of course.checkpoints){Object.assign(world.cars[0],point,{speed:0});City.step(world,.05,{});}assert.equal(world.race,null);}
  finishLap(50);const bestScore=world.raceBest[course.id].score;assert.ok(bestScore>1500);assert.equal(world.raceResult.hits,0);assert.ok(world.raceResult.earned>0);
  startRace(world);run(world,3.1,{});finishLap(55);assert.equal(world.raceResult.earned,0);assert.equal(world.raceBest[course.id].score,bestScore);
  startRace(world);run(world,3.1,{});finishLap(40);assert.ok(world.raceResult.earned>0);assert.ok(world.raceBest[course.id].score>bestScore);
});
test('Race collisions apply a single penalty during cooldown, timeout cancels and recovery preserves records',()=>{
  const world=City.create(),course=startRace(world);world.traffic=[];run(world,3.1,{});const car=world.cars[0],building=world.buildings[0];
  Object.assign(car,{x:building.x-building.w/2-1.91,z:building.z,yaw:Math.PI/2,speed:15});City.step(world,.05,{});assert.equal(world.race.hits,1);assert.equal(world.race.penalty,2);City.step(world,.05,{});assert.equal(world.race.penalty,2);
  world.race.elapsed=course.limit;City.step(world,.05,{});assert.equal(world.race,null);assert.equal(world.raceResult,null);
  world.raceBest[course.id]={time:45,score:2000};startRace(world);City.recover(world);assert.equal(world.race,null);assert.equal(world.raceBest[course.id].time,45);
});
test('Stopping and leaving a race cancels it and navigation never replaces the active checkpoint',()=>{
  const world=City.create(),course=startRace(world);City.navigate(world,'museum');assert.equal(City.objective(world).x,course.checkpoints[0].x);assert.equal(City.objective(world).z,course.checkpoints[0].z);
  City.interact(world);assert.equal(world.vehicle,-1);assert.equal(world.race,null);City.navigate(world,'coast-run');assert.match(world.waypoint.name,/起点/);
});
function collisionWorld(){
  const world=City.create();world.traffic=[];world.cars=world.cars.slice(0,2);world.collisionIndex=new Map();world.buildings=[];world.obstacles=[];world.player.x=-30;world.player.z=0;
  Object.assign(world.cars[0],{x:0,z:0,yaw:0,speed:0});Object.assign(world.cars[1],{x:0,z:-10,yaw:0,speed:0});return world;
}
function noVehicleOverlaps(world){for(const car of [...world.cars,...world.traffic])assert.equal(City.vehicleContact(world,car,undefined,false),null);}
test('Generated parked and traffic vehicles start with non-overlapping complete bodies',()=>{
  for(const seed of [1,17,42])noVehicleOverlaps(City.create(seed));
});
test('A high-speed rear impact transfers momentum and damages both cars without passing through',()=>{
  const world=collisionWorld();world.vehicle=0;const a=world.cars[0],b=world.cars[1];a.speed=32;b.z=-6;Object.assign(world.player,a);
  for(let n=0;n<50;n++){City.step(world,.02,{forward:true});noVehicleOverlaps(world);assert.ok(a.z>b.z);}
  assert.ok(a.health<100);assert.ok(b.health<100);assert.ok(b.z<-6);assert.ok(a.speed<32);
});
test('Head-on and perpendicular impacts cannot cross another vehicle even during steering',()=>{
  for(const angle of [0,Math.PI/2,Math.PI/4,Math.PI]){
    const world=collisionWorld();world.vehicle=0;const a=world.cars[0],b=world.cars[1];a.speed=32;Object.assign(b,{z:-7,yaw:angle,speed:angle===Math.PI?14:0});Object.assign(world.player,a);
    for(let n=0;n<50;n++){City.step(world,.02,{forward:true,right:n>10});noVehicleOverlaps(world);}assert.ok(a.health<100);
  }
});
test('A fast vehicle is blocked by a thin wall before the front bumper crosses it',()=>{
  const world=collisionWorld();world.cars.length=1;world.vehicle=0;const car=world.cars[0];Object.assign(car,{x:0,z:-6,yaw:Math.PI/2,speed:32});Object.assign(world.player,car);
  const wall={x:2,z:-6,w:.05,d:15};world.collisionIndex=new Map([['0,-1',[wall]],['0,0',[wall]]]);
  City.step(world,.05,{forward:true});assert.ok(car.x<=.076);assert.ok(car.health<100);assert.equal(City.vehicleContact(world,car,undefined,false),null);
});
test('Traffic brakes for pedestrians, respects other cars and never advances through a stopped vehicle',()=>{
  const world=collisionWorld();world.cars=[];const npc={id:'test-traffic',type:0,x:0,z:10,yaw:0,speed:9,cruiseSpeed:9,lane:'z',health:100,stopTime:0};world.traffic=[npc];Object.assign(world.player,{x:0,z:0});
  run(world,3,{});assert.ok(npc.z>2.3);assert.equal(npc.speed,0);assert.equal(City.vehicleContact(world,npc),null);
  world.player.x=10;run(world,1,{});assert.ok(npc.speed>0);
});
test('On-foot player cannot walk through a parked vehicle and exits never spawn inside a second car',()=>{
  const world=collisionWorld();world.player.x=0;world.player.z=5;run(world,1,{forward:true});assert.ok(world.player.z>=2.3);
  world.vehicle=0;Object.assign(world.player,world.cars[0]);Object.assign(world.cars[1],{x:2.5,z:0});assert.equal(City.interact(world),true);assert.ok(world.player.x<0);assert.equal(world.vehicle,-1);
});
test('Intercepting a moving traffic car brakes it, then transfers that same vehicle into the drivable fleet',()=>{
  const world=collisionWorld();world.cars=[];Object.assign(world.player,{x:3,z:0});
  const npc={id:'transfer',type:1,x:0,z:4,yaw:0,speed:8,cruiseSpeed:8,lane:'z',health:87,stopTime:0,color:123};world.traffic=[npc];
  assert.equal(City.context(world).kind,'traffic-stop');const before={x:npc.x,z:npc.z};City.interact(world);assert.equal(npc.x,before.x);assert.equal(npc.z,before.z);assert.ok(npc.stopTime>0);run(world,.6,{});assert.equal(npc.speed,0);
  Object.assign(world.player,{x:npc.x+2,z:npc.z});assert.equal(City.context(world).kind,'traffic-enter');assert.equal(City.interact(world),true);assert.equal(world.traffic.length,0);assert.equal(world.cars.length,1);assert.equal(world.cars[0],npc);assert.equal(world.vehicle,0);assert.equal(npc.health,87);
  run(world,.4,{forward:true});assert.ok(npc.speed>0);assert.equal(City.interact(world),false);run(world,1,{brake:true});assert.equal(City.interact(world),true);assert.equal(world.vehicle,-1);assert.equal(world.cars[0],npc);
});
test('Recovery after switching vehicles finds free parking instead of overlapping the original car',()=>{
  const world=City.create();const npc=world.traffic[0];world.traffic.splice(0,1);world.cars.push(npc);world.vehicle=world.cars.length-1;City.recover(world);assert.notEqual(npc.z,13);noVehicleOverlaps(world);
});
test('Street navigation reaches every landmark and race start along clear graded paths',()=>{
  const world=City.create();for(const target of [...world.places,...City.races]){
    City.navigate(world,target.id);const goal=world.waypoint,route=City.navigationPath(world);assert.ok(route.length>1,target.id);assert.equal(route.at(-1).x,goal.x);assert.equal(route.at(-1).z,goal.z);
    for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];const steps=Math.max(1,Math.ceil(City.distance(a,b)));for(let j=0;j<=steps;j++){const t=j/steps;assert.equal(City.blocked(world,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,.49,(a.y||0)+((b.y||0)-(a.y||0))*t),false,target.id);}}
  }
});
test('Navigation reuses its graph, reroutes for a new destination or obstacle, and hides indoors',()=>{
  const world=City.create();City.navigate(world,'museum');const first=City.navigationPath(world),graph=world.roadGraph;assert.equal(City.navigationPath(world),first);
  City.navigate(world,'tower');assert.notEqual(City.navigationPath(world),first);assert.equal(world.roadGraph,graph);
  City.addCollider(world,{x:0,z:-48,w:5,d:3,h:2});const route=City.navigationPath(world);assert.notEqual(world.roadGraph,graph);assert.ok(route.length>1);
  Object.assign(world.player,{x:0,z:30});assert.notEqual(City.navigationPath(world),route);world.interior=City.room('cafe');assert.equal(City.navigationPath(world).length,0);assert.equal(City.navigationPath(world),City.navigationPath(world));
});
test('Arrival navigation stays at the entrance instead of routing back out to the road',()=>{
  const world=City.create();City.navigate(world,'station');Object.assign(world.player,world.waypoint);const route=City.navigationPath(world);assert.equal(route.length,1);assert.equal(route[0].x,world.player.x);assert.equal(route[0].z,world.player.z);
});
test('The station repairs a stopped car in place without changing the model, score or exploration',()=>{
  const world=City.create(),place=world.places.find(p=>p.id==='station'),car=world.cars[0];world.vehicle=0;Object.assign(car,place.door,{health:21,speed:0});Object.assign(world.player,place.door);world.discovered.add('tower');const score=world.score;
  assert.equal(City.context(world).kind,'service');City.interact(world);assert.equal(world.dialog.vehicle,0);City.choose(world,'repair-car');assert.equal(car.health,100);assert.equal(car.x,place.door.x);assert.equal(car.z,place.door.z);assert.equal(world.score,score);assert.ok(world.discovered.has('tower'));assert.equal(world.vehicle,0);assert.equal(world.dialog,null);
  car.health=45;City.interact(world);City.choose(world,'leave-service');assert.equal(car.health,45);assert.equal(world.dialog,null);
  City.interact(world);City.choose(world,'service-exit');assert.equal(world.vehicle,-1);assert.equal(world.dialog,null);
});
test('Different vehicle types have distinct acceleration, steering and bounded top speeds',()=>{
  const speeds=[],turns=[];for(let type=0;type<3;type++){const world=collisionWorld();world.cars.length=1;world.vehicle=0;world.cars[0].type=type;Object.assign(world.player,world.cars[0]);run(world,.5,{forward:true});speeds.push(world.cars[0].speed);run(world,.2,{forward:true,right:true});turns.push(world.cars[0].yaw);Object.assign(world.cars[0],{x:0,z:100,yaw:0,steer:0,speed:99});City.step(world,.01,{forward:true});assert.equal(world.cars[0].speed,City.vehicleTypes[type].topSpeed);}
  assert.ok(speeds[1]<speeds[0]&&speeds[0]<speeds[2]);assert.ok(turns[1]<turns[0]&&turns[0]<turns[2]);
});
function jobWorld(){const world=City.create();world.traffic=[];world.cars.length=1;return world;}
function parkAt(world,point){Object.assign(world.cars[0],point,{yaw:0,speed:0,driftX:0,driftZ:0});Object.assign(world.player,point);world.vehicle=0;}
function takePassenger(world){parkAt(world,City.jobGoal(world));assert.equal(City.context(world).kind,'job-pickup');City.interact(world);assert.equal(world.job.phase,'deliver');}
test('Accepting a city job preserves location, marks its pickup and waits to start the delivery clock',()=>{
  const world=jobWorld(),before={...world.player};assert.equal(City.startJob(world,'taxi'),true);assert.equal(world.player.x,before.x);assert.equal(world.player.z,before.z);assert.equal(City.objective(world).name,'西城车站');run(world,2,{});assert.equal(world.job.elapsed,0);assert.equal(world.job.phase,'pickup');assert.equal(City.startJob(world,'coffee'),false);
});
test('Taxi pickup requires a stopped working car and takes precedence over station servicing',()=>{
  const world=jobWorld();City.startJob(world,'taxi');Object.assign(world.player,City.jobGoal(world));assert.notEqual(City.context(world)?.kind,'job-pickup');parkAt(world,City.jobGoal(world));world.cars[0].speed=4;assert.notEqual(City.context(world).kind,'job-pickup');world.cars[0].speed=0;world.cars[0].health=0;assert.equal(City.interact(world),false);assert.equal(world.job.phase,'pickup');world.cars[0].health=100;takePassenger(world);assert.equal(City.jobGoal(world).name,'潮汐艺术馆');
});
test('Coffee delivery requires entering the cafe and collecting at the counter before handoff',()=>{
  const world=jobWorld();City.startJob(world,'coffee');Object.assign(world.player,City.jobGoal(world));City.interact(world);assert.equal(world.interior.id,'cafe');assert.equal(world.job.phase,'pickup');Object.assign(world.player,{x:0,z:-5});City.interact(world);assert.equal(world.job.phase,'deliver');assert.match(world.dialog.title,/咖啡已打包/);City.choose(world,'job-close');Object.assign(world.player,world.interior.exit);City.interact(world);assert.equal(world.interior,null);
  Object.assign(world.player,City.jobGoal(world));const before=world.score;assert.equal(City.context(world).kind,'job-dropoff');City.interact(world);assert.equal(world.job,null);assert.equal(world.jobsCompleted,1);assert.ok(world.score>before);assert.equal(world.jobResult.quality,100);const after=world.score;assert.equal(City.interact(world),false);assert.equal(world.score,after);
});
test('Delivery clocks freeze in dialogs, resume during play and expire without awarding a completion',()=>{
  const world=jobWorld();City.startJob(world,'taxi');takePassenger(world);run(world,1,{});const elapsed=world.job.elapsed;world.dialog={kind:'map'};run(world,3,{});assert.equal(world.job.elapsed,elapsed);world.dialog=null;world.job.elapsed=world.job.limit-.01;const count=world.jobsCompleted;City.step(world,.05,{});assert.equal(world.job,null);assert.equal(world.jobsCompleted,count);assert.equal(world.jobResult.success,false);assert.equal(world.jobChain,0);
});
test('Actual impacts reduce service quality once per contact and can fail a badly damaged order',()=>{
  const world=jobWorld();City.startJob(world,'taxi');takePassenger(world);const car=world.cars[0],wall=world.buildings[0];
  function hit(){Object.assign(car,{x:wall.x-wall.w/2-1.91,z:wall.z,yaw:Math.PI/2,speed:15,driftX:0,driftZ:0,health:100});Object.assign(world.player,{x:car.x,z:car.z});City.step(world,.05,{});}
  hit();assert.equal(world.job.hits,1);assert.equal(world.job.quality,80);City.step(world,.01,{});assert.equal(world.job.hits,1);world.job.quality=20;world.crashCooldown=0;world.time+=1;hit();assert.equal(world.job,null);assert.equal(world.jobResult.success,false);assert.equal(world.jobsCompleted,0);
});
test('Three perfect jobs rotate routes, grant a single chain bonus and advance the city reputation',()=>{
  const world=jobWorld(),pickups=[];for(let i=0;i<3;i++){City.startJob(world,'taxi');pickups.push(world.job.pickup);takePassenger(world);parkAt(world,City.jobGoal(world));City.interact(world);assert.equal(world.jobResult.chainBonus,i===2?600:0);City.choose(world,'job-close');}
  assert.equal(new Set(pickups).size,3);assert.equal(world.jobsCompleted,3);assert.equal(world.jobChain,3);assert.equal(City.reputation(world),'街区熟客');
});
test('Detours and repairs preserve the order quality and resume the delivery route',()=>{
  const world=jobWorld();City.startJob(world,'taxi');City.navigate(world,'lighthouse');assert.equal(City.objective(world).name,'白沙灯塔');City.choose(world,'job-resume');assert.equal(City.objective(world).name,'西城车站');takePassenger(world);world.job.quality=80;world.job.hits=1;world.cars[0].health=45;City.interact(world);assert.equal(world.dialog.vehicle,0);City.choose(world,'repair-car');assert.equal(world.job.quality,80);assert.equal(world.job.hits,1);assert.equal(City.objective(world).name,'潮汐艺术馆');
});
test('Abandoning, recovery and exiting with a passenger cancel the job without losing completed progress',()=>{
  const world=jobWorld();world.jobsCompleted=2;City.startJob(world,'taxi');takePassenger(world);City.interact(world);City.choose(world,'service-exit');assert.equal(world.vehicle,-1);assert.equal(world.job,null);assert.equal(world.jobsCompleted,2);
  City.startJob(world,'coffee');City.recover(world);assert.equal(world.job,null);assert.equal(world.jobsCompleted,2);City.startJob(world,'taxi');City.choose(world,'job-cancel');assert.equal(world.job,null);
  world.race={id:'park-loop'};assert.equal(City.startJob(world,'taxi'),false);
});
