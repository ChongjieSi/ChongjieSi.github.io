/* Metre-based simulation over a georeferenced DEM. Snow deformation and avalanche mass are shared by physics and rendering. */
window.MontBlancWorld=(()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),CELL=.2,AREA=CELL*CELL;
 function create(meta,buffer){
  const data=new Uint16Array(buffer),w={meta,data,snow:new Map(),time:0,score:0,distance:0,vertical:0,turns:0,carved:0,parcels:[],released:0,deposited:0,escaped:0,releaseCount:0,trail:[],trailVersion:0,gates:[],gate:0,fall:0,exposure:0,risk:0,air:false,notice:'',noticeTime:0,runTime:0,lastRelease:-100};
  w.toWorld=(lat,lon)=>({x:(lon-meta.west)/(meta.east-meta.west)*meta.width-meta.width/2,z:(meta.north-lat)/(meta.north-meta.south)*meta.depth-meta.depth/2});
  w.geo=(x,z)=>({lat:meta.north-(z+meta.depth/2)/meta.depth*(meta.north-meta.south),lon:meta.west+(x+meta.width/2)/meta.width*(meta.east-meta.west)});
  w.base=(x,z)=>{const u=clamp((x/meta.width+.5)*(meta.size-1),0,meta.size-1.001),v=clamp((z/meta.depth+.5)*(meta.size-1),0,meta.size-1.001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*meta.size+i;return ((data[k]*(1-a)+data[k+1]*a)*(1-b)+(data[k+meta.size]*(1-a)+data[k+meta.size+1]*a)*b)*meta.heightScale;};
  w.delta=(x,z)=>{const u=x/CELL,v=z/CELL,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,get=(i,j)=>w.snow.get(i+','+j)||0;return (get(i,j)*(1-a)+get(i+1,j)*a)*(1-b)+(get(i,j+1)*(1-a)+get(i+1,j+1)*a)*b;};
  w.height=(x,z)=>w.base(x,z)+w.delta(x,z);
  w.terrainGradient=(x,z)=>({x:(w.base(x+2,z)-w.base(x-2,z))/4,z:(w.base(x,z+2)-w.base(x,z-2))/4});
  w.gradient=(x,z)=>({x:(w.height(x+1,z)-w.height(x-1,z))/2,z:(w.height(x,z+1)-w.height(x,z-1))/2});
  w.starts=[{id:'blanche',name:'白色山谷',subtitle:'宽阔雪坡 · 熟悉转弯',lat:45.865,lon:6.902},{id:'tacul',name:'塔库尔山肩',subtitle:'高山长降 · 连续刻滑',lat:45.858,lon:6.887},{id:'geant',name:'巨人冰川',subtitle:'陡坡探索 · 活动雪层',lat:45.865,lon:6.932}];
  reset(w,0);return w;
 }
 function reset(w,index=w.startIndex){w.startIndex=index;const s=w.starts[index],p=w.toWorld(s.lat,s.lon),g=w.gradient(p.x,p.z);w.p={...p,y:w.height(p.x,p.z),vx:0,vz:0,vy:0,yaw:Math.atan2(-g.x,g.z),lean:0};w.checkpoint={...w.p};w.fall=0;w.exposure=0;w.air=false;w.gate=0;w.runTime=0;w.risk=0;w.lastSki=null;w.gates=[];
  let q={...p};for(let n=0;n<400;n++){const a=w.gradient(q.x,q.z),l=Math.hypot(a.x,a.z)||1;q={x:q.x-a.x/l*5,z:q.z-a.z/l*5};if(n%28===27)w.gates.push({...q,y:w.base(q.x,q.z)});if(w.base(q.x,q.z)<1800)break;}w.notice=s.name+' · 向坡下出发';w.noticeTime=4;
 }
 function recover(w){const c=w.checkpoint;Object.assign(w.p,c,{vx:0,vz:0,vy:0,y:w.height(c.x,c.z)});w.fall=0;w.exposure=0;w.air=false;w.lastSki=null;w.notice='已回到最近的安全停靠点 · 雪迹保留';w.noticeTime=4;}
 function add(w,x,z,value){const key=x+','+z;w.snow.set(key,(w.snow.get(key)||0)+value);}
 function carvePoint(w,x,z){const ix=Math.round(x/CELL),iz=Math.round(z/CELL);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const d=Math.hypot((ix+i)*CELL-x,(iz+j)*CELL-z);if(d>.65)continue;const key=(ix+i)+','+(iz+j),old=w.snow.get(key)||0;w.snow.set(key,Math.min(old,-.14*Math.exp(-d*d/.055)));}}
 function tracks(w,old){const p=w.p,d=Math.hypot(p.x-old.x,p.z-old.z),n=Math.ceil(d/.22);if(d>6)return;for(let j=1;j<=n;j++){const t=j/n,x=old.x+(p.x-old.x)*t,z=old.z+(p.z-old.z)*t;for(const side of [-1,1])carvePoint(w,x+Math.cos(p.yaw)*.25*side,z+Math.sin(p.yaw)*.25*side);}
  if(d>.025){w.trail.push({x:p.x,z:p.z,yaw:p.yaw});w.trailVersion++;if(w.trail.length>18000)w.trail.shift();}
 }
 function release(w,x,z){if(w.time-w.lastRelease<8)return false;w.lastRelease=w.time;let volume=0;const radius=11,ix=Math.round(x/CELL),iz=Math.round(z/CELL),reach=Math.ceil(radius/CELL);for(let j=-reach;j<=reach;j++)for(let i=-reach;i<=reach;i++)if(i*i+j*j<=reach*reach){add(w,ix+i,iz+j,-.24);volume+=.24*AREA;}
  for(let i=0;i<72;i++){const angle=i*2.399963,r=radius*Math.sqrt((i+.5)/72);w.parcels.push({x:x+Math.cos(angle)*r,z:z+Math.sin(angle)*r,vx:0,vz:0,volume:volume/72,age:0});}w.released+=volume;w.releaseCount++;w.notice='雪层断裂 · 横切离开流动雪体';w.noticeTime=5;return true;
 }
 function trigger(w){const p=w.p,g=w.gradient(p.x,p.z),l=Math.hypot(g.x,g.z)||1;return release(w,p.x+g.x/l*65,p.z+g.z/l*65);}
 function deposit(w,p,amount){const cells=[],ix=Math.round(p.x/CELL),iz=Math.round(p.z/CELL);let sum=0;const reach=Math.ceil(2/CELL);for(let j=-reach;j<=reach;j++)for(let i=-reach;i<=reach;i++){const weight=Math.max(0,1-Math.hypot(i,j)/(reach+.5));if(weight){cells.push([ix+i,iz+j,weight]);sum+=weight;}}for(const [x,z,a]of cells)add(w,x,z,amount*a/(sum*AREA));w.deposited+=amount;p.volume-=amount;}
 function avalanche(w,dt){const p=w.p;let contact=0;for(const a of w.parcels){if(a.volume<.00001)continue;a.age+=dt;const g=w.gradient(a.x,a.z),l=Math.hypot(g.x,g.z),speed=Math.hypot(a.vx,a.vz),slope=l/Math.sqrt(1+l*l),drive=Math.max(0,9.81*(slope-.15/Math.sqrt(1+l*l)));
   if(l){a.vx-=g.x/l*drive*dt;a.vz-=g.z/l*drive*dt;}const drag=Math.exp(-(.035+speed*.002)*dt);a.vx*=drag;a.vz*=drag;a.x+=a.vx*dt;a.z+=a.vz*dt;
   if(Math.abs(a.x)>w.meta.width/2-10||Math.abs(a.z)>w.meta.depth/2-10){w.escaped+=a.volume;a.volume=0;continue;}
   const stopped=a.age>2&&speed<2||a.age>70;a.depositClock=(a.depositClock||0)+dt;if(a.depositClock>=.08){deposit(w,a,Math.min(a.volume,a.volume*(stopped?1.8:.012)*a.depositClock));a.depositClock=0;}
   const d=Math.hypot(a.x-p.x,a.z-p.z);if(!w.air&&d<3.8&&a.volume>.05){contact+=a.volume/(1+d);p.vx+=a.vx*dt*.5;p.vz+=a.vz*dt*.5;}
  }w.parcels=w.parcels.filter(a=>a.volume>.00001);w.exposure=clamp(w.exposure+(contact>0?contact*dt*.14:-dt*.3),0,3);if(w.exposure>1.3&&!w.fall){w.fall=3;w.notice='被雪体卷入 · 按 R 回到安全点';w.noticeTime=5;}}
 function step(w,dt,input={}){dt=Math.min(dt,1/30);w.time+=dt;w.noticeTime=Math.max(0,w.noticeTime-dt);avalanche(w,dt);if(w.fall){w.fall=Math.max(.01,w.fall-dt);return;}w.runTime+=dt;const p=w.p,old={x:p.x,z:p.z},speed=Math.hypot(p.vx,p.vz),g=w.gradient(p.x,p.z),slope=Math.hypot(g.x,g.z),turn=(input.right?1:0)-(input.left?1:0);
  p.lean+=(turn-p.lean)*Math.min(1,dt*7);p.yaw+=turn*dt*(.5+Math.min(speed,25)*.045);const fx=Math.sin(p.yaw),fz=-Math.cos(p.yaw),sideX=Math.cos(p.yaw),sideZ=Math.sin(p.yaw);
  if(w.air){p.vy-=9.81*dt;p.y+=p.vy*dt;}else{const divisor=1+slope*slope;p.vx-=9.81*g.x/divisor*dt;p.vz-=9.81*g.z/divisor*dt;const push=input.forward?2.3:0;p.vx+=fx*push*dt;p.vz+=fz*push*dt;const side=p.vx*sideX+p.vz*sideZ,edge=1-Math.exp(-(input.brake?12:7)*dt);p.vx-=side*sideX*edge;p.vz-=side*sideZ*edge;const drag=Math.exp(-(.055+speed*.003+(input.brake?3.6:0))*dt);p.vx*=drag;p.vz*=drag;if(input.jump&&speed>2){w.air=true;p.vy=4.2;p.y+=.1;}}
  p.x+=p.vx*dt;p.z+=p.vz*dt;const ground=w.height(p.x,p.z),oldHeight=w.base(old.x,old.z);if(!w.air)p.y=ground;else if(p.y<=ground){if(p.vy<-14){w.fall=2;w.notice='落地冲击过大 · R 返回安全点';w.noticeTime=4;}p.y=ground;p.vy=0;w.air=false;}
  const moved=Math.hypot(p.x-old.x,p.z-old.z);w.distance+=moved;if(!w.air){tracks(w,old);w.vertical+=Math.max(0,oldHeight-w.base(p.x,p.z));if(turn&&speed>4)w.carved+=moved;}
  if(Math.abs(p.x)>w.meta.width/2-60||Math.abs(p.z)>w.meta.depth/2-60){recover(w);return;}
  const gate=w.gates[w.gate];if(gate&&Math.hypot(p.x-gate.x,p.z-gate.z)<20){w.gate++;w.score+=150;w.checkpoint={...p,vx:0,vz:0};w.notice='路线标记 '+w.gate+' / '+w.gates.length+' · +150';w.noticeTime=2;if(w.gate===w.gates.length){w.score+=1500;w.notice='本段滑降完成 · 可继续自由滑行或结算';w.noticeTime=8;}}
  if(!w.air&&slope>.67&&speed>5)w.risk+=dt;else w.risk=Math.max(0,w.risk-dt*.4);if(w.risk>7&&w.time-w.lastRelease>40){trigger(w);w.risk=0;}
 }
 return {create,step,reset,recover,release,trigger,CELL,carvePoint,deposit};
})();
