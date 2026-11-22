const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const realm={};realm.window=realm;vm.createContext(realm);for(const file of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+file+'.js'),'utf8'),realm);const C=realm.ArcadeCityWorld;
function enter(w,id){w.dialog=null;w.interior=null;w.vehicle=-1;Object.assign(w.player,w.places.find(p=>p.id===id).door);C.interact(w);if(id==='station')C.choose(w,'enter-station');}
function at(w,kind){Object.assign(w.player,w.interior.hotspots.find(h=>h.kind===kind));w.dialog=null;C.interact(w);}
function step(w,seconds){for(let t=0;t<seconds-1e-7;t+=1/60)C.step(w,1/60,{});}
function begin(w){Object.assign(w.player,{x:0,z:-10});w.dialog=null;C.interact(w);C.choose(w,'penalty-start');assert.equal(w.penalty.phase,'aim');}
function shoot(w,success=true){const p=w.penalty;if(success){let n=0;while(!(Math.abs(p.aim)>1.9&&Math.abs(p.aim)<2.8&&Math.abs(p.aim-p.keeper)>1.5)&&n++<1500)C.step(w,1/60);assert.ok(n<1500);}C.interact(w);assert.equal(p.phase,'power');if(success){let n=0;while(!(p.power>.59&&p.power<.66&&Math.abs(p.aim-p.keeper)>1.2)&&n++<1500)C.step(w,1/60);assert.ok(n<1500);}C.interact(w);assert.equal(p.phase,'flight');step(w,1.1);return p;}

test('The station has reachable public facilities and an impassable railway safety edge',()=>{
 const w=C.create();enter(w,'station');assert.equal(w.interior.kind,'station');const r=w.interior,queue=[{x:0,z:18}],seen=new Set(['0,18']),reached=new Set();
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const h of r.hotspots)if(C.distance(p,h)<2)reached.add(h.kind);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,key=x+','+z;if(seen.has(key))continue;seen.add(key);if(!C.blocked(w,x,z))queue.push({x,z});}}
 for(const h of r.hotspots)assert.ok(reached.has(h.kind),h.kind);assert.equal(C.blocked(w,0,-13),true);assert.equal(C.blocked(w,0,-9),false);assert.equal(C.blocked(w,11,7),true);
});
test('Luggage retrieval requires a real search and return, rewards once, and survives leaving the station',()=>{
 const w=C.create();enter(w,'station');const initial=w.score;C.choose(w,'station-return');assert.equal(w.score,initial);
 at(w,'station-desk');C.choose(w,'station-search');assert.equal(w.stationQuest,'search');at(w,'station-case');assert.equal(w.stationQuest,'return');assert.equal(w.score,initial);C.choose(w,'job-close');C.recover(w);enter(w,'station');at(w,'station-desk');C.choose(w,'station-return');assert.equal(w.stationQuest,'done');assert.equal(w.score,initial+250);C.choose(w,'station-return');assert.equal(w.score,initial+250);
});
test('Trains stop smoothly, open doors only while stopped and award a single platform stamp',()=>{
 const w=C.create();for(let i=0;i<1800;i++){w.time=i/10;const s=C.trainStatus(w);assert.ok(Number.isFinite(s.x));assert.ok(s.doors>=0&&s.doors<=1);if(s.doors>0){assert.equal(s.phase,'dwell');assert.equal(s.x,0);}}
 for(const t of [12,49,64]){w.time=t-.001;const a=C.trainStatus(w).x;w.time=t+.001;assert.ok(Math.abs(C.trainStatus(w).x-a)<.00001);}
 enter(w,'station');w.time=70;const score=w.score;at(w,'station-platform');assert.equal(w.stationStamp,false);assert.equal(w.score,score);w.time=20;at(w,'station-platform');assert.equal(w.stationStamp,true);assert.equal(w.score,score+200);at(w,'station-platform');assert.equal(w.score,score+200);
});
test('Five timed shots have visible flight and goalkeeping outcomes; replays only reward a better result',()=>{
 const w=C.create();enter(w,'stadium');begin(w);const score=w.score;
 for(let i=0;i<5;i++){const p=shoot(w);assert.equal(p.history.at(-1),true,p.outcome);if(i<4){assert.equal(p.phase,'result');C.interact(w);}}
 assert.equal(w.penalty.goals,5);assert.equal(w.penaltyBest,1400);assert.equal(w.score,score+1400);assert.match(w.dialog.title,/五球/);
 C.choose(w,'penalty-replay');for(let i=0;i<5;i++){shoot(w);if(i<4)C.interact(w);}assert.equal(w.score,score+1400);
 w.dialog=null;C.step(w,1/60);assert.equal(w.penalty,null,'closing the result via Escape must not leave the player stuck');
});
test('Weak shots miss, dialogs pause the timing meter, and recovery cleanly cancels a round',()=>{
 const w=C.create();enter(w,'stadium');begin(w);const p=w.penalty;C.step(w,.05);const clock=p.clock;w.dialog={kind:'map'};step(w,1);assert.equal(p.clock,clock);w.dialog=null;shoot(w,false);assert.equal(p.outcome,'力量不足');assert.equal(p.goals,0);const score=w.score;C.recover(w);assert.equal(w.penalty,null);assert.equal(w.score,score);C.choose(w,'penalty-start');assert.equal(w.penalty,null);
});

test('The detailed civic scene batches seats, retains movable train doors and has valid roof buffers',async()=>{
 const T=await import('../static/games/vendor/three.module.min.js'),ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),r={...realm,document:{createElement:()=>({width:0,height:0,getContext:()=>ctx})}};r.window=r;vm.createContext(r);vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/city-civic.js'),'utf8'),r);
 const mats=new Map(),material=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color}));return mats.get(color);};const detail={finish:()=>material(0x999999),plant:()=>material(0x447744)},person=()=>({group:new T.Group(),arms:[new T.Group(),new T.Group()],legs:[]}),w=C.create(),scene=new T.Group(),c=r.ArcadeCityCivic(T,{detail,material,person},w);
 const exterior=c.stationExterior(scene,w.places.find(p=>p.id==='station')),station=c.stationInterior(scene),stadium=c.stadium(scene,true);let seatInstances=0;stadium.traverse(o=>{if(o.isInstancedMesh)seatInstances+=o.count;});assert.ok(seatInstances>850,'hundreds of chairs must use shared batches');
 const roof=exterior.getObjectByName('station-vault-panels');assert.equal(roof.material.length,2);assert.equal(roof.geometry.groups.length,32);let max=0;for(const i of roof.geometry.index.array)max=Math.max(max,i);assert.ok(max<roof.geometry.attributes.normal.count);assert.ok(roof.geometry.attributes.normal.array.every(Number.isFinite));
 const train=station.getObjectByName('station-local-train');w.interior=C.room('station');w.time=20;c.update(w);const open=train.children.filter(o=>o.isGroup&&o.userData.home!==undefined);assert.equal(open.length,12);assert.ok(open.every(o=>Math.abs(o.position.x-o.userData.home)>.5));w.time=55;c.update(w);assert.ok(open.every(o=>o.position.x===o.userData.home));assert.ok(train.position.x>0);c.lighting(true);c.update(w);let liveLights=0;station.traverse(o=>{if(o.isLight&&o.visible&&o.intensity>0)liveLights++;});assert.equal(liveLights,3);c.dispose();
});
