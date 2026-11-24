const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const r={window:{}};vm.createContext(r);for(const n of ['city-architecture','city-terrain','city-interiors','city-world','city-motion'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../static/games/'+n+'.js'),'utf8'),r);
const C=r.window.ArcadeCityWorld,M=r.window.ArcadeCityMotion;
function empty(){const w=C.create();w.cars=[];w.traffic=[];w.pedestrians=[];w.animals=[];w.buildings=[];w.obstacles=[];w.collisionIndex=new Map();w.player={x:100,z:100,yaw:0};w.elevation=0;return w;}
function actor(w,x,z,species){const a={x,z,y:0,yaw:0,phase:0,home:{x,z},species};(species?w.animals:w.pedestrians).push(a);C.settleActors(w);return a;}
function frozen(a){a.walkSpeed=0;a.fleeSpeed=0;a.moveSpeed=0;}
test('Swept pedestrian and animal movement cannot tunnel through a thin wall',()=>{
 for(const species of [undefined,'鹿','野兔','狐狸','松鼠','绿头鸭']){const w=empty(),a=actor(w,0,0,species);C.addCollider(w,{x:2,z:0,w:.08,d:12,h:4});C.moveActor(w,a,6,0);assert.ok(a.x+a.radius<=1.96001,species);assert.equal(C.blocked(w,a.x,a.z,a.radius,a.y,a.bodyHeight),false);}
});
test('Walking bodies cannot pass through vehicles or each other',()=>{
 const w=empty(),a=actor(w,0,0),b=actor(w,3,0);for(let i=0;i<40;i++){C.moveActor(w,a,.1,0);C.moveActor(w,b,-.1,0);assert.ok(C.distance(a,b)>=a.radius+b.radius-.00001);}
 w.pedestrians=[a];Object.assign(a,{x:0,z:0,y:0});w.cars=[{x:3,z:0,yaw:0,type:0,elevation:0}];C.moveActor(w,a,8,0);assert.ok(a.x+a.radius<=3-1.06+.0001);
});
test('Player walking and fast driving respect pedestrians and wildlife with no interpenetration',()=>{
 for(const species of [undefined,'鹿','野兔']){
  const w=empty(),a=actor(w,0,5,species);frozen(a);Object.assign(w.player,{x:0,z:10,yaw:0});for(let i=0;i<60;i++)C.step(w,.05,{forward:true});assert.ok(C.distance(w.player,a)>=a.radius+.42-.00001);
  Object.assign(w.player,{x:0,z:10});const car={x:0,z:10,yaw:0,type:0,elevation:0,speed:35,steer:0,health:100};w.cars=[car];w.vehicle=0;
  for(let i=0;i<10;i++){car.speed=35;C.step(w,.05,{});assert.equal(C.vehicleContact(w,car,[],false),null);assert.ok(car.z>=a.z+a.radius+1.9-.001);}
  assert.equal(car.health,100);
 }
});
test('Traffic yields before reaching an NPC, and separate vertical levels do not collide',()=>{
 const w=empty(),a=actor(w,0,0);frozen(a);const car={x:0,z:7,yaw:0,type:0,elevation:0,speed:6,cruiseSpeed:6,lane:'z',health:100,stopTime:0};w.traffic=[car];for(let i=0;i<80;i++)C.step(w,.05,{});assert.ok(car.z>2.3);assert.ok(car.speed<.01);a.y=12;assert.equal(C.actorContact(w,0,0,.42,0),null);assert.equal(C.vehicleContact(w,{...car,x:0,z:0},[],false),null);
});
test('Avoidance AI stays out of obstacles and uses actual, interpolated world positions',()=>{
 const w=empty(),a=actor(w,0,0);C.addCollider(w,{x:0,z:2,w:12,d:.08,h:3});C.settleActors(w);
 for(let i=0;i<180;i++){M.capture(w);C.stepActors(w,1/60);assert.equal(C.blocked(w,a.x,a.z,a.radius,a.y),false);w.renderAlpha=.5;const p=M.pose(w,a),old=w.renderPrevious.actors.get(a);assert.ok(Math.abs(p.x-(old.x+a.x)/2)<1e-9);assert.ok(Math.abs(p.z-(old.z+a.z)/2)<1e-9);assert.ok(Number.isFinite(p.elevation));}
});
test('Birds clear tall obstacles in flight without blocking ground walkers',()=>{
 const w=empty(),bird=actor(w,0,0,'林鸟');C.addCollider(w,{x:2,z:0,w:.2,d:10,h:8});C.moveActor(w,bird,6,0);assert.ok(bird.x+bird.radius<=1.9001);assert.equal(C.actorContact(w,bird.x,bird.z,.42,0),null);
});
