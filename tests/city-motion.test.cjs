const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const realm={window:{}};vm.createContext(realm);vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/city-motion.js'),'utf8'),realm);const M=realm.window.ArcadeCityMotion;
test('Player and vehicle render at the same interpolated pose across fixed physics ticks',()=>{
 const car={x:0,z:0,yaw:Math.PI-.03,elevation:3},w={player:{...car},cars:[car],traffic:[],vehicle:0,elevation:3,cameraYaw:Math.PI-.03};M.capture(w);car.x=w.player.x=1;car.yaw=w.player.yaw=-Math.PI+.03;car.elevation=w.elevation=3.1;w.cameraYaw=-Math.PI+.03;w.renderAlpha=.5;
 const player=M.pose(w,w.player,true),vehicle=M.pose(w,car);assert.equal(player.x,.5);assert.equal(player.x,vehicle.x);assert.equal(player.elevation,vehicle.elevation);assert.ok(Math.abs(player.yaw-Math.PI)<.001,'yaw takes the short path across the angle seam');
 w.player.x=90;assert.equal(M.pose(w,w.player,true).x,90,'recovery teleports must not interpolate across the city');
});
test('The driving camera stays fixed relative to a car travelling steadily at 30, 60 and 144 Hz',()=>{
 for(const fps of [30,60,144]){const r=M.rig();let first;for(let i=0;i<fps*3;i++){const c={x:i/fps*12,y:4,z:0,yaw:Math.PI/2,pitch:.2,distance:12,space:'car:0'},out=M.camera(r,c,1/fps);const offset=[out.eye.x-c.x,out.eye.y-c.y,out.eye.z-c.z];if(!first)first=offset;offset.forEach((v,j)=>assert.ok(Math.abs(v-first[j])<1e-10,'camera must not lag behind one frame then catch up'));assert.equal(out.target.y,c.y+1.2);}}
});
test('Orbit damping has the same response at different display frame rates',()=>{
 const outcomes=[30,60,144].map(fps=>{const r=M.rig(),c={x:0,y:0,z:0,yaw:0,pitch:.2,distance:12,space:'car:0'};M.camera(r,c,0);c.yaw=1;let out;for(let i=0;i<fps;i++)out=M.camera(r,c,1/fps);return out.eye;});
 for(const p of outcomes)for(const axis of ['x','y','z'])assert.ok(Math.abs(p[axis]-outcomes[0][axis])<1e-9);
});
test('Camera obstruction holds its shorter boom instead of pumping in and out each frame',()=>{
 const r=M.rig(),c={x:0,y:0,z:0,yaw:0,pitch:.2,distance:12,space:'car:0'};M.camera(r,c,0);
 for(let i=0;i<120;i++)M.camera(r,c,1/60,()=>i%2?.6:1);assert.ok(r.ratio<.64);
 const before=r.ratio;M.camera(r,c,1/60,()=>1);assert.ok(r.ratio-before<.02);
 for(let i=0;i<120;i++)M.camera(r,c,1/60,()=>1);assert.ok(r.ratio>.98);
});
test('A slope behind the vehicle shortens the camera without lifting the viewpoint onto the hill',()=>{
 const r=M.rig(),c={x:0,y:0,z:0,yaw:0,pitch:.2,distance:12,space:'car:0'};M.camera(r,c,0);const out=M.camera(r,c,1/60,()=>.4);assert.ok(out.eye.y<3);assert.equal(out.target.y,1.2);
 c.x=100;const recovered=M.camera(r,c,1/60);assert.equal(recovered.reset,true);assert.ok(Math.abs(recovered.eye.x-100)<.001);
});
test('Looking up at tall buildings keeps the camera above the walking surface',()=>{
 const r=M.rig(),out=M.camera(r,{x:0,y:186,z:0,yaw:0,pitch:-.5,distance:12,space:'skyline'},1/60);
 assert.ok(out.target.y>200);assert.ok(out.eye.y>=188);assert.equal(out.eye.z,12);
});
