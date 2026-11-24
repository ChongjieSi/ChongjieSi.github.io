const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const r={window:{}};vm.createContext(r);for(const n of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+n+'.js'),'utf8'),r);
const C=r.window.ArcadeCityWorld,R=r.window.ArcadeCityTerrain;
function arrive(w,id){assert.equal(C.teleport(w,id),true);assert.equal(C.interact(w),true);assert.equal(w.dialog?.kind,'field-note');}
test('Three distinct rest stops have supported entrances and connected approach paths',()=>{
 const w=C.create(),stops=w.roadPlan.restStops;assert.equal(stops.length,3);assert.equal(new Set(stops.map(s=>s.kind)).size,3);
 for(const s of stops){assert.equal(C.blocked(w,s.door.x,s.door.z,.45,s.y),false);assert.ok(Math.abs(R.roadAt(w,s.door.x,s.door.z,s.y,false).y-s.y)<.001);C.navigate(w,s.id);const route=C.navigationPath(w);assert.ok(route.length>1);assert.ok(C.distance(route.at(-1),s.door)<.01);}
});
test('The refill point restores stamina without teleporting and cannot be activated remotely',()=>{
 const w=C.create();w.stamina=17;C.choose(w,'field-refill');assert.equal(w.stamina,17);arrive(w,'forest-welcome');const p={...w.player};C.choose(w,'field-refill');assert.equal(w.stamina,100);assert.equal(w.dialog,null);assert.equal(C.distance(p,w.player),0);assert.ok(w.refillUntil>w.time);
});
test('The optic has a real camera pose, bounded zoom and a reversible viewing session',()=>{
 const w=C.create();arrive(w,'ridge-scope');const p={...w.player},yaw=w.cameraYaw;C.choose(w,'field-view');assert.equal(w.scenicView.id,'ridge-scope');const first=C.scenicPose(w);assert.ok(first.eye.y>w.elevation+1);assert.ok(C.distance(first.eye,first.target)>250);w.cameraYaw+=.5;w.scenicView.pitch+=.1;w.scenicView.fov=5;const second=C.scenicPose(w);assert.equal(second.fov,18);assert.notEqual(first.target.x,second.target.x);w.scenicView.fov=100;assert.equal(C.scenicPose(w).fov,58);
 for(let i=0;i<20;i++)C.step(w,1/60,{sprint:true});assert.equal(C.distance(p,w.player),0);assert.equal(C.context(w).kind,'scenic-exit');C.interact(w);assert.equal(w.scenicView,null);assert.equal(w.cameraYaw,yaw);
});
test('The world continues moving during observation and movement safely exits the optic',()=>{
 const w=C.create();arrive(w,'creek-hide');C.choose(w,'field-view');const car=w.traffic[0],before={...car},p={...w.player};for(let i=0;i<10;i++)C.step(w,1/60,{});assert.ok(C.distance(car,before)>0);assert.equal(C.distance(w.player,p),0);C.step(w,1/60,{forward:true});assert.equal(w.scenicView,null);assert.equal(C.distance(w.player,p),0);
});
test('Notes reward visits once, navigation preserves position, and recovery retains the collection',()=>{
 const w=C.create();let score=0;for(const s of w.roadPlan.restStops){score=w.score;arrive(w,s.id);assert.ok(w.score>score);C.choose(w,'job-close');score=w.score;C.interact(w);assert.equal(w.score,score);C.choose(w,'job-close');}assert.equal(w.fieldNotes.size,3);arrive(w,'forest-welcome');const p={...w.player};C.choose(w,'field-next');assert.equal(w.waypoint.name,'溪畔观察台');assert.equal(C.distance(w.player,p),0);C.recover(w);assert.equal(w.fieldNotes.size,3);
});
test('Travel and vehicle summoning leave the viewing session cleanly',()=>{
 for(const action of [w=>C.teleport(w,'central-stop'),w=>C.recover(w),w=>C.summonVehicle(w)]){const w=C.create();arrive(w,'ridge-scope');C.choose(w,'field-view');action(w);assert.equal(w.scenicView,null);assert.equal(w.fieldNotes.size,1);}
});
test('The new decks keep the heightfield below the visible boards at all four corners and the centre',()=>{
 const w=C.create();for(const s of w.roadPlan.restStops.filter(s=>s.kind!=='lookout'))for(const x of [-s.rx,0,s.rx])for(const z of [-s.rz,0,s.rz])assert.ok(R.groundHeight(w,s.x+x,s.z+z)<s.y-.05,s.id+' protruding ground');
});

test('Rest-stop approach slopes and the road junction match the existing walking surface',()=>{
 const w=C.create(),road=w.roadPlan.paths.find(p=>p.id==='forest-road');
 for(const s of w.roadPlan.restStops.filter(s=>s.kind!=='lookout')){const path=w.roadPlan.paths.find(p=>p.id===s.id+'-approach');for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i];assert.ok(Math.abs(a.y-b.y)/C.distance(a,b)<.301);if(s.kind==='refill'){const n=R.nearest(road.points,b.x,b.z);if(n.d<5.3)assert.ok(Math.abs(n.y-b.y)<.001);}}assert.ok(Math.abs(path.points.at(-1).y-s.y)<.001);}
});
