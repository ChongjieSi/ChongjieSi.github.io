const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const test=require('node:test');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const realm={window:{},console};vm.createContext(realm);
vm.runInContext(fs.readFileSync(path.join(root,'static/games/world.js'),'utf8'),realm);
realm.ArcadeWorld=realm.window.ArcadeWorld;
vm.runInContext(fs.readFileSync(path.join(root,'static/games/modes3d.js'),'utf8'),realm);
const world=realm.ArcadeWorld;
const layouts=Array.from({length:12},(_,i)=>world.breakoutLayout(i+1));
test('Six formations have distinct nonempty geometry',()=>{assert.equal(new Set(layouts.slice(0,6).map(l=>JSON.stringify(l.bricks.map(b=>[b.x,b.y])))).size,6);assert.ok(layouts.every(l=>l.bricks.length>0));});
test('The opening formation has a hollow ring, staggered layers and no full rectangular rows',()=>{
  const first=layouts[0],rows=new Map();for(const b of first.bricks){if(!rows.has(b.row))rows.set(b.row,[]);rows.get(b.row).push(b);}
  assert.equal(first.name,'星环迷阵');assert.ok(rows.size>=8);assert.ok([...rows.values()].every(row=>row.length<10));assert.ok(new Set([...rows.values()].map(row=>row.length)).size>=3);
  assert.ok(first.bricks.some(b=>b.row===4&&b.x>190&&b.x<260));assert.ok(!first.bricks.some(b=>b.row===2&&b.x>190&&b.x<260));assert.ok(new Set(first.bricks.filter(b=>b.row===0).map(b=>b.y)).size>1);
});
test('All procedural bricks fit inside the playable field without overlapping',()=>{for(const l of layouts)for(const b of l.bricks){assert.ok(b.x>=7&&b.x+b.w<=473&&b.y>=0&&b.y+b.h<300);for(const c of l.bricks)if(c!==b)assert.ok(b.x+b.w<=c.x||c.x+c.w<=b.x||b.y+b.h<=c.y||c.y+c.h<=b.y);}});
test('Later cycles add two and three-hit armor',()=>{assert.ok(layouts[2].bricks.some(b=>b.hp===2));assert.ok(layouts[6].bricks.some(b=>b.hp===3));});
test('Perspective scales with depth and rejects geometry behind camera',()=>{const p=world.camera({eye:[0,0,-5],target:[0,0,0]});assert.ok(p([1,0,0]).x>p([1,0,10]).x);assert.equal(p([0,0,-6]),null);assert.equal(p([0,0,0]).x,240);});
test('Stack overlap handles alignment, edge cutting, and misses',()=>{assert.equal(world.overlap(0,3,0,3).size,3);assert.equal(world.overlap(1,3,0,3).size,2);assert.equal(world.overlap(4,3,0,3).size,0);});
function game(id){
 let score=0,ended=null,description='',isActive=true;
 const handlers={},buttons={};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{}),set:(t,k,v)=>(t[k]=v,true)});
 const deps={canvas:()=>({ctx,c:{addEventListener:(type,fn)=>handlers[type]=fn,getBoundingClientRect:()=>({left:0,top:0,width:480,height:540}),setPointerCapture(){}}}),button:(text,fn)=>buttons[text]={fn},points:v=>score=v,finish:(title,detail)=>{ended={title,detail};isActive=false;},active:()=>isActive,status:text=>description=text};
 const engine=realm.window.Arcade3D(deps)[id]();
 return {engine,buttons,handlers,get score(){return score;},get ended(){return ended;},get status(){return description;}};
}

test('3D stack perfect landing scores and alternates movement axes',()=>{
  const g=game('stack3d');g.engine.tick(5000/2.15);g.engine.key(' ');
  assert.equal(g.score,150);assert.match(g.status,/已叠 1 层/);assert.equal(g.ended,null);
  g.engine.tick(5000/2.235);g.engine.key(' ');
  assert.equal(g.score,350);assert.match(g.status,/连续完美 2 次/);
});
test('3D stack missing the tower ends the round',()=>{
  const g=game('stack3d');g.engine.key(' ');assert.match(g.ended.title,/高塔倒下/);
});
test('3D flight waits for deliberate launch',()=>{
  const g=game('flight3d');g.engine.tick(5000);assert.equal(g.score,0);assert.match(g.status,/准备起航/);
});
test('3D flight rewards a centered gate and traveled distance',()=>{
  const g=game('flight3d');g.buttons['开始飞行'].fn();
  for(let i=0;i<55;i++)g.engine.tick(50);
  assert.ok(g.score>=314);assert.match(g.status,/星门 1/);assert.equal(g.ended,null);
});
test('3D flight misses exhaust shields and retain the final score',()=>{
  const g=game('flight3d');g.buttons['开始飞行'].fn();g.engine.key('ArrowRight');
  for(let i=0;i<20;i++)g.engine.tick(50);g.engine.keyup('ArrowRight');
  for(let i=0;i<1800&&!g.ended;i++)g.engine.tick(50);
  assert.ok(g.ended);assert.match(g.ended.title,/航行结束/);assert.ok(g.score>0);
});
test('3D games render valid world meshes with the canvas API',()=>{
  for(const id of ['stack3d','flight3d']){
    const g=game(id);g.engine.tick(50);assert.doesNotThrow(()=>g.engine.draw());
  }
});

test('Chase camera keeps the ship centered throughout lateral and vertical travel',()=>{
  for(const x of [-4.3,0,4.3])for(const y of [-2.5,0,2.5]){
    const ship={x,y};const p=world.flightCamera(ship,500)([x,y,500]);
    assert.ok(Math.abs(p.x-420)<.001);
    assert.ok(p.y>300&&p.y<420);
    const centered=world.flightCamera({x:0,y:0},0)([0,0,0]);
    assert.ok(Math.abs(p.y-centered.y)<.001);
  }
});
test('Gate-depth flight marker matches a centered gate at every approach distance',()=>{
  for(const depth of [2,10,30,80]){
    const camera=world.flightCamera({x:2,y:-1},100);
    const aim=camera([2,-1,100+depth]);
    const offCourse=camera([3,-1,100+depth]);
    assert.ok(Math.abs(aim.x-420)<.001);assert.ok(offCourse.x>aim.x);
  }
});

test('Breakout speed rises every level, including beyond the old speed cap',()=>{
  assert.equal(world.breakoutSpeed(1),300);
  for(let level=2;level<=100;level++){
    assert.equal(world.breakoutSpeed(level)-world.breakoutSpeed(level-1),52);
  }
  assert.ok(world.breakoutSpeed(10)>500);
});
