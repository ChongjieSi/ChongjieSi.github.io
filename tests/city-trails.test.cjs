const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const realm={window:{}};vm.createContext(realm);
for(const name of ['city-architecture','city-terrain','city-interiors','city-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+name+'.js'),'utf8'),realm);
const C=realm.window.ArcadeCityWorld;
function outside(w){w.dialog=null;w.interior=null;w.returnTo=null;w.vehicle=-1;w.elevation=0;w.onTower=null;w.cars=[];w.traffic=[];}
function shop(w,stop){
  outside(w);const b=w.buildingMap.get(stop.target);Object.assign(w.player,b.door);assert.equal(C.interact(w),true);assert.equal(w.interior.buildingId,b.id);
  Object.assign(w.player,w.interior.hotspots.find(h=>h.kind==='room-note'));C.interact(w);C.choose(w,'shop-start');
  if(w.shopActivity.kind==='bakery'){for(let i=0;i<38;i++)C.step(w,.05);C.choose(w,'shop-bake-stop');}
  else while(w.shopActivity){const a=w.shopActivity,item=a.kind==='cafe'?a.recipe.steps[a.stage]:a.order.find(i=>!a.selected.includes(i));C.choose(w,'shop-pick-'+a.currentOptions.indexOf(item));}
  assert.ok(w.shopVisits.has(b.id));
}
function visit(w,stop){
  if(stop.kind==='shop')return shop(w,stop);
  outside(w);Object.assign(w.player,stop.goal);
  if(stop.kind==='wildlife'){const a=w.animals.find(a=>a.home.x<-370);Object.assign(w.player,{x:a.x+.8,z:a.z});}
  assert.equal(C.interact(w),true,stop.label);
  if(stop.kind==='art'){
    assert.equal(w.interior.id,'museum');for(const e of C.exhibits){w.dialog=null;Object.assign(w.player,{x:e.x,z:e.z+2.2});assert.equal(C.context(w).kind,'exhibit');C.interact(w);}
  }
}
test('Three itineraries resolve to stable, clear destinations across city seeds',()=>{
  for(const seed of [1,17,19,23,91]){const w=C.create(seed);assert.equal(w.trails.length,3);for(const t of w.trails){assert.equal(t.stops.length,4);for(const s of t.stops){assert.ok(Number.isFinite(s.goal.x)&&Number.isFinite(s.goal.z));assert.equal(C.blocked(w,s.goal.x,s.goal.z,.45,s.goal.y||0),false,t.name+' '+s.label);}}}
});
test('Starting and resuming an itinerary set guidance without moving the player',()=>{
  const w=C.create(),p={...w.player};C.choose(w,'trail-start-slow-coast');assert.equal(w.activeTrail,'slow-coast');assert.equal(C.trailStatus(w).index,0);assert.equal(JSON.stringify(w.player),JSON.stringify(p));
  C.navigate(w,'station');assert.equal(C.objective(w).name,'西城车站');C.choose(w,'trail-resume');assert.equal(w.waypoint,null);assert.equal(C.objective(w).name,C.trailStatus(w).goal.name);
  const progress=w.trailProgress['slow-coast'];for(let i=0;i<30;i++)C.step(w,.05);assert.equal(w.trailProgress['slow-coast'],progress);
});
test('A complete coastal itinerary requires coffee, music, all exhibits and an actual pier interaction',()=>{
  const w=C.create();C.startTrail(w,'slow-coast');const t=w.trails.find(t=>t.id===w.activeTrail);
  for(let i=0;i<3;i++){visit(w,t.stops[i]);assert.equal(w.trailProgress[t.id],i+1);assert.ok(w.dialog.actions.some(a=>a.id==='trail-resume'));}
  outside(w);Object.assign(w.player,t.stops[3].goal);C.step(w,.05);assert.ok(w.discovered.has('pier'));assert.equal(w.trailProgress[t.id],3);
  const before=w.score;C.interact(w);assert.equal(w.completedTrails.has(t.id),true);assert.equal(w.score-before,t.reward);assert.equal(w.activeTrail,null);
  C.choose(w,'trail-start-'+t.id);assert.equal(w.score,before+t.reward);assert.equal(w.activeTrail,null);
});
test('Local-day tasks reward successful experiences and retain progress after a route switch',()=>{
  const w=C.create();C.startTrail(w,'local-day');const t=w.trails.find(t=>t.id===w.activeTrail);visit(w,t.stops[0]);assert.equal(w.trailProgress[t.id],1);
  C.choose(w,'trail-pause');assert.equal(w.activeTrail,null);C.startTrail(w,'forest-walk');C.choose(w,'trail-pause');C.startTrail(w,t.id);assert.equal(C.trailStatus(w).index,1);
  visit(w,t.stops[1]);visit(w,t.stops[2]);assert.equal(w.completedTrails.size,0);const before=w.score;visit(w,t.stops[3]);assert.equal(w.score-before,120+t.reward);assert.ok(w.completedTrails.has(t.id));
});
test('Nature itinerary requires forest wildlife; park animals do not complete that stop',()=>{
  const w=C.create();C.startTrail(w,'forest-walk');const t=w.trails.find(t=>t.id===w.activeTrail);visit(w,t.stops[0]);visit(w,t.stops[1]);
  const parkAnimal=w.animals.find(a=>a.home.x>-370);outside(w);Object.assign(w.player,{x:parkAnimal.x+.8,z:parkAnimal.z});assert.equal(C.context(w).kind,'wildlife');C.interact(w);assert.equal(w.trailProgress[t.id],2);
  visit(w,t.stops[2]);assert.equal(w.trailProgress[t.id],3);const before=w.score;visit(w,t.stops[3]);assert.ok(w.completedTrails.has(t.id));assert.equal(w.score-before,300+t.reward);
});
test('Previously completed experiences count in order and recovery retains itinerary progress',()=>{
  const w=C.create(),t=w.trails[1];visit(w,t.stops[0]);visit(w,t.stops[1]);C.startTrail(w,t.id);assert.equal(C.trailStatus(w).index,2);
  const before=w.score;C.recover(w);assert.equal(w.trailProgress[t.id],2);assert.equal(w.activeTrail,t.id);assert.equal(w.score,before);assert.equal(C.trailStatus(w).stop.kind,'shop');
});
test('Invalid or conflicting route requests preserve existing work and awards are isolated between worlds',()=>{
  const w=C.create();assert.equal(C.startTrail(w,'missing'),false);C.startJob(w,'taxi');assert.equal(C.startTrail(w,'slow-coast'),false);assert.ok(w.job);assert.equal(w.activeTrail,null);C.cancelJob(w);
  w.race={id:'park-loop'};assert.equal(C.startTrail(w,'local-day'),false);w.race=null;w.trial={index:0};assert.equal(C.startTrail(w,'forest-walk'),false);
  const fresh=C.create();assert.equal(fresh.completedTrails.size,0);assert.equal(fresh.trailProgress['local-day'],0);
  C.startTrail(fresh,'slow-coast');C.startJob(fresh,'taxi');C.navigate(fresh,'station');const detour=fresh.waypoint;C.choose(fresh,'trail-resume');assert.equal(fresh.job.id,'taxi');assert.equal(fresh.waypoint,detour);assert.equal(fresh.activeTrail,'slow-coast');
});
