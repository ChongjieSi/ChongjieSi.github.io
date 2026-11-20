/* Deterministic open city, explorable interiors and renderer-independent simulation. */
window.ArcadeCityWorld = (() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const Terrain=window.ArcadeCityTerrain,Interiors=window.ArcadeCityInteriors;
  const bounds={minX:-826,maxX:413,minZ:-654,maxZ:426};
  const roads=[-320,-256,-192,-128,-96,-64,-32,0,32,64,96,128,192,256,320];
  const vehicleTypes=[{name:'城市轿车',acceleration:13,topSpeed:32,steering:1.65},{name:'越野旅行车',acceleration:10.5,topSpeed:28,steering:1.35},{name:'运动掀背车',acceleration:15,topSpeed:35,steering:1.85}];
  const places=[
    {id:'cafe',name:'海岸咖啡',kind:'cafe',x:80,z:80,w:18,d:16,h:7,door:{x:80,z:91},reward:200,description:'到吧台喝杯咖啡，恢复体力，听听店员的城市推荐。'},
    {id:'museum',name:'潮汐艺术馆',kind:'museum',x:160,z:160,w:42,d:36,h:15,door:{x:160,z:181},reward:300,description:'走进展厅，近距离查看三件城市艺术作品。'},
    {id:'stadium',name:'海湾体育场',kind:'stadium',x:-240,z:380,w:50,d:50,h:14,door:{x:-240,z:410},reward:350,description:'进入运动场，在跑道上完成四个检查点的计时训练。'},
    {id:'tower',name:'海湾之塔',kind:'tower',x:-160,z:-160,w:22,d:22,h:82,elevation:71,door:{x:-160,z:-146},reward:400,description:'搭乘电梯抵达观景台，从高处眺望整座海岸城。'},
    {id:'surf',name:'沙湾冲浪屋',kind:'surf',x:344,z:-160,w:18,d:24,h:7,door:{x:332,z:-160},reward:250,description:'找工作人员接取海滩探访任务，沿海寻找四枚海螺。'},
    {id:'lighthouse',name:'白沙灯塔',kind:'tower',x:360,z:-288,w:13,d:13,h:31,elevation:25,door:{x:349,z:-288},reward:300,description:'登上灯塔，看看海面、沙滩与远处的城市天际线。'},
    {id:'station',name:'西城车站',kind:'station',x:-160,z:224,w:42,d:24,h:14,door:{x:-160,z:239},reward:200,description:'查看城市旅行提示，并为下一处目的地设置导航。'},
    {id:'pier',name:'日落码头',kind:'pier',x:384,z:224,w:64,d:18,h:2,door:{x:330,z:224},reward:250,description:'漫步木栈桥，在海风里完成一次码头打卡。'}
  ];
  const routes=[{x:96,z:32,name:'海岸书店'},{x:-16,z:16,name:'中央公园'},...places.filter(p=>p.id!=='lighthouse').map(p=>({...p.door,name:p.name}))];
  const exhibits=[
    {id:'tide',x:-12,z:-6,label:'潮汐之环',body:'由同心圆环构成的雕塑，记录着海湾潮汐的往复。'},
    {id:'sail',x:0,z:-7,label:'风之帆',body:'白色曲面像被风撑起的帆，向这座城的航海历史致意。'},
    {id:'city',x:12,z:-6,label:'城市切片',body:'层叠的几何体对应旧城、体育园区和滨海新区的不同街区。'}
  ];
  const checkpoints=[{x:-15,z:-23},{x:15,z:-23},{x:15,z:23},{x:-15,z:23}];
  const races=[
    {id:'park-loop',name:'环城短途',limit:120,start:{x:0,z:-16},checkpoints:[{x:0,z:-96},{x:96,z:-96},{x:96,z:96},{x:0,z:96},{x:0,z:-16}]},
    {id:'coast-run',name:'海岸拉力',limit:180,start:{x:320,z:-128},checkpoints:[{x:320,z:-256},{x:192,z:-256},{x:192,z:0},{x:320,z:0},{x:320,z:224}]}
  ];
  const jobTypes=[{id:'taxi',name:'海湾接送',description:'驾车接上乘客，平稳送达目的地。'},{id:'coffee',name:'咖啡急送',description:'进入咖啡馆取餐，在时限内完成配送。'}];
  function jobGoal(world){const job=world.job;if(!job)return null;const place=places.find(p=>p.id===(job.phase==='pickup'?job.pickup:job.destination));return {...place.door,name:place.name};}
  function reputation(world){return world.jobsCompleted>=6?'海湾达人':world.jobsCompleted>=3?'街区熟客':'新城旅人';}
  function startJob(world,id){
    if(!jobTypes.some(j=>j.id===id))return false;
    if(world.job||world.race||world.trial){notify(world,'先完成或结束当前挑战，再接取新委托');return false;}
    const options=id==='taxi'?[['station','museum'],['cafe','pier'],['surf','tower']]:[['cafe','museum'],['cafe','station'],['cafe','surf']];
    const pair=options[(world.jobCounts[id]||0)%options.length],pickup=places.find(p=>p.id===pair[0]),destination=places.find(p=>p.id===pair[1]);
    world.job={id,phase:'pickup',pickup:pair[0],destination:pair[1],elapsed:0,limit:Math.ceil(90+distance(pickup.door,destination.door)/3),quality:100,hits:0};world.dialog=null;
    notify(world,id==='taxi'?'海湾接送 · 驾车到起点停车，按 E 接乘客':'咖啡急送 · 进入海岸咖啡，到吧台按 E 取餐',5);return true;
  }
  function cancelJob(world,message='委托已结束 · 可在地图重新接单'){
    if(!world.job)return;world.jobResult={id:world.job.id,success:false,reason:message};world.job=null;world.jobChain=0;notify(world,message,5);
  }
  function collectJob(world){world.job.phase='deliver';world.job.elapsed=0;world.job.detour=false;notify(world,(world.job.id==='taxi'?'乘客已上车':'取餐完成')+' · 前往'+jobGoal(world).name,5);}
  function completeJob(world){
    const job=world.job,perfect=job.hits===0;world.jobsCompleted++;world.jobCounts[job.id]=(world.jobCounts[job.id]||0)+1;world.jobChain=perfect?world.jobChain+1:0;
    const chainBonus=world.jobChain>0&&world.jobChain%3===0?600:0,timeBonus=Math.min(300,Math.max(0,Math.floor((job.limit-job.elapsed)*3))),award=750+job.quality*5+timeBonus+chainBonus;
    world.score+=award;world.jobResult={id:job.id,success:true,quality:job.quality,elapsed:job.elapsed,earned:award,chainBonus};world.job=null;
    world.dialog={title:perfect?'完美服务':'委托完成',body:`${jobTypes.find(v=>v.id===job.id).name} · 用时 ${job.elapsed.toFixed(1)} 秒 · 评价 ${job.quality}% · +${award} 分${chainBonus?'，含连续三单完美服务奖励 +600':''}。${reputation(world)} · 已完成 ${world.jobsCompleted} 单。`,actions:[{id:'job-'+job.id,label:'再接一单'},{id:'job-close',label:'继续漫游'}]};notify(world,'委托完成 +'+award,5);
  }
  function objective(world){
    if(world.race){const course=races.find(r=>r.id===world.race.id);return {...course.checkpoints[world.race.index],name:course.name};}
    if(world.job)return world.job.detour&&world.waypoint?world.waypoint:jobGoal(world);
    return world.waypoint||world.mission;
  }
  function navigationPath(world){
    if(world.interior||world.onTower)return world.emptyNavigation||(world.emptyNavigation=[]);
    const p={...world.player,y:world.elevation},destination=objective(world),goal={...destination,y:destination.y??Terrain.height(world,destination.x,destination.z,Terrain.rawHeight(destination.x,destination.z),world.vehicle>=0)},revision=world.colliderRevision||0,cache=world.navigationCache,vehicle=world.vehicle>=0;
    if(cache&&cache.x===goal.x&&cache.z===goal.z&&cache.vehicle===vehicle&&cache.revision===revision&&distance(cache.origin,p)<8&&Math.abs((cache.origin.y||0)-p.y)<1.5)return cache.path;
    const clear=(a,b,radius=vehicle?1.16:.5)=>{const n=Math.max(1,Math.ceil(distance(a,b)/2));for(let i=0;i<=n;i++){const t=i/n,elevation=(a.y||0)+((b.y||0)-(a.y||0))*t;if(blocked(world,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,radius,elevation))return false;}return true;};
    let graph=world.roadGraph;
    if(!graph||graph.revision!==revision){
      graph=world.roadGraph=Terrain.navigationGraph(world,(a,b)=>clear(a,b,1.1));
    }
    const {nodes}=graph;
    const connections=point=>nodes.map((n,i)=>({i,d:distance(n,point)})).filter(({i})=>!vehicle||nodes[i].car).sort((a,b)=>a.d-b.d).slice(0,20).flatMap(({i})=>{
      const node=nodes[i],options=[[point,{x:node.x,z:point.z,y:(point.y+node.y)/2},node],[point,{x:point.x,z:node.z,y:(point.y+node.y)/2},node],[point,node,node]];
      const path=options.find(path=>clear(path[0],path[1])&&clear(path[1],path[2]));return path?[{i,path,cost:distance(path[0],path[1])+distance(path[1],path[2])}]:[];
    });
    const starts=connections(p),ends=new Map(connections(goal).map(v=>[v.i,v]));
    const costs=new Map(),parents=new Map(),roots=new Map(),open=new Set();for(const s of starts){costs.set(s.i,s.cost);roots.set(s.i,s);open.add(s.i);}
    let best=Infinity,finish=-1;
    while(open.size){
      let current=-1,priority=Infinity;for(const i of open){const f=costs.get(i)+distance(nodes[i],goal);if(f<priority){priority=f;current=i;}}
      if(priority>=best)break;open.delete(current);
      if(ends.has(current)){const total=costs.get(current)+ends.get(current).cost;if(total<best){best=total;finish=current;}}
      for(const edge of nodes[current].edges){if(vehicle&&!edge.car)continue;const next=edge.to,cost=costs.get(current)+distance(nodes[current],nodes[next]);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);parents.set(next,current);roots.set(next,roots.get(current));open.add(next);}}
    }
    let path=[];
    if(finish>=0){const middle=[];let i=finish;while(parents.has(i)){middle.unshift(nodes[i]);i=parents.get(i);}path=[...roots.get(finish).path,...middle,...ends.get(finish).path.slice().reverse().slice(1)];}
    else if(clear(p,goal))path=[p,goal];
    // Nearby destinations should not send the player out to an intersection and back.
    if(distance(p,goal)<28)for(const corner of [{x:goal.x,z:p.z,y:(p.y+goal.y)/2},{x:p.x,z:goal.z,y:(p.y+goal.y)/2}]){const cost=distance(p,corner)+distance(corner,goal);if(cost<=best&&clear(p,corner)&&clear(corner,goal)){best=cost;path=[p,corner,goal];}}
    path=path.filter((point,i)=>!i||distance(point,path[i-1])>.01).map(({x,z,y=0})=>({x,z,y}));
    world.navigationCache={x:goal.x,z:goal.z,revision,vehicle,origin:{x:p.x,z:p.z,y:p.y},path};return path;
  }
  function room(id){
    if(id==='tower-hall'||id==='lighthouse-hall'){const place=places.find(p=>p.id===id.slice(0,-5)),spec=Interiors.plan({id,interiorType:'hotel',floorCount:1,w:18,d:16,name:place.name+'观景厅',architecture:{id:id==='tower-hall'?902:903,accent:0x69877c}},0);return {...spec,id,buildingId:null,name:place.name+'观景厅'};}
    const place=places.find(p=>p.id===id);if(!place)return null;
    if(id==='surf'||id==='station'){const spec=Interiors.plan({id,interiorType:id==='surf'?'shop':'hotel',floorCount:1,w:id==='surf'?15:20,d:16,name:place.name,architecture:{id:id==='surf'?900:901,accent:0x69877c}},0);return {...spec,id,buildingId:null,name:id==='surf'?'冲浪屋展厅':'西城车站候车厅'};}
    const config=place.kind==='stadium'?{width:54,depth:76,height:14}:place.kind==='museum'?{width:42,depth:32,height:7}:place.kind==='surf'?{width:22,depth:20,height:5}:{width:28,depth:22,height:5.5};
    const obstacles=place.kind==='cafe'?[{x:-7,z:1,w:3,d:3},{x:7,z:1,w:3,d:3},{x:-7,z:-5,w:3,d:3},{x:7,z:-5,w:3,d:3},{x:0,z:-8,w:16,d:2}]:place.kind==='museum'?exhibits.map(e=>({x:e.x,z:e.z,w:2.5,d:2.5})):[];
    return {...config,id,kind:place.kind,name:place.name,exit:{x:0,z:config.depth/2-1.2},obstacles};
  }
  function create(seed=17){
    let randomSeed=seed;const random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
    const buildings=[],roadPlan=Terrain.buildNetwork(roads),Architecture=window.ArcadeCityArchitecture;
    // Parcel limits come from the actual carriageway, footpath and building setback.
    // A narrow block gets one building; only a genuinely large block gets two rows.
    for(let xi=0;xi<roads.length-1;xi++)for(let zi=0;zi<roads.length-1;zi++){
      const x=(roads[xi]+roads[xi+1])/2,z=(roads[zi]+roads[zi+1])/2;
      if(Math.abs(x)<28&&Math.abs(z)<28||Terrain.inPark(x,z,2))continue;
      const extent=n=>{const p=Architecture.streetProfile(n);return p.width/2+p.sidewalk+p.setback;};
      const left=roads[xi]+extent(roads[xi]),right=roads[xi+1]-extent(roads[xi+1]),back=roads[zi]+extent(roads[zi]),front=roads[zi+1]-extent(roads[zi+1]),availableW=right-left,availableD=front-back;
      if(Math.min(availableW,availableD)<6.2)continue;
      const columns=availableW>26?2:1,rows=availableD>26?2:1,cellW=availableW/columns,cellD=availableD/rows;
      for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){
        if((Math.abs(x)>200||Math.abs(z)>200)&&(xi+zi+col+row)%5===0)continue;
        const w=Math.min(17,cellW-(columns>1?5:1))*(.84+random()*.14),d=Math.min(17,cellD-(rows>1?5:1))*(.84+random()*.14),b={x:left+(col+.5)*cellW,z:back+(row+.5)*cellD,w:Math.max(6,w),d:Math.max(6,d),hue:190+random()*35,style:Math.floor(random()*4)};
        if(Terrain.reserveBuilding({roadPlan},b)||places.some(p=>p.kind!=='pier'&&Math.abs(b.x-p.x)<(b.w+p.w)/2+5&&Math.abs(b.z-p.z)<(b.d+p.d)/2+5))continue;
        const i=buildings.length;b.architecture=Architecture.design(b,i,seed,buildings[i-1]?.architecture.kind);b.h=b.architecture.height;b.baseY=0;Interiors.assign(b);buildings.push(b);
      }
    }
    const parked=[{x:3,z:13,yaw:0,color:0xe8ab63},{x:35,z:-18,yaw:0,color:0x6cb4aa},{x:-35,z:42,yaw:Math.PI,color:0xe08782},{x:67,z:72,yaw:Math.PI,color:0x9ba9dd},
      {x:-195,z:170,yaw:0,color:0x71868c},{x:323,z:-170,yaw:0,color:0xc4c1b1},{x:131,z:182,yaw:Math.PI,color:0x5c7289},{x:-131,z:-142,yaw:0,color:0x849b86},
      {x:259,z:-222,yaw:0,color:0xb4a17f},{x:-259,z:-90,yaw:Math.PI,color:0x9d7d78},{x:323,z:236,yaw:0,color:0x879da9},{x:-163,z:242,yaw:Math.PI,color:0xc4b59a}];
    const cars=parked.map((car,i)=>({...car,id:i,type:i%3,speed:0,steer:0,health:100,braking:false}));
    const traffic=Array.from({length:24},(_,i)=>{const lane=i%2?'x':'z',sign=i%3===0?-1:1;return {id:'traffic-'+i,type:i%3,x:i%2?-310+(i*43)%620:roads[2+i%11]-sign*Architecture.streetProfile(roads[2+i%11]).laneCenters[Math.floor(i/11)%Architecture.streetProfile(roads[2+i%11]).lanes],z:i%2?roads[2+i%11]+sign*Architecture.streetProfile(roads[2+i%11]).laneCenters[Math.floor(i/11)%Architecture.streetProfile(roads[2+i%11]).lanes]:-310+(i*67)%620,lane,sign,yaw:lane==='x'?sign*Math.PI/2:sign>0?Math.PI:0,speed:5+i%5,cruiseSpeed:5+i%5,health:100,steer:0,stopTime:0,braking:false,color:[0xb1c4ce,0xe8c68d,0xcc8f8f,0x899cac][i%4]};});
    const pedestrians=Array.from({length:48},(_,i)=>({x:i<16?-90+(i%6)*32:roads[1+i%12]+Architecture.streetProfile(roads[1+i%12]).width/2+1.2,z:i<16?-80+Math.floor(i/6)*52:-290+Math.floor(i/12)*130+i%3*9,phase:random()*6.28,hue:random()*360,variant:i%5}));
    const tokens=Array.from({length:36},(_,i)=>{
      if(i<18)return {x:354,z:-310+i*36,taken:false};
      const a=(i-18)*Math.PI/9;return {x:16+Math.cos(a)*7,z:16+Math.sin(a)*7,taken:false};
    });
    const shells=[{x:366,z:-248},{x:359,z:-100},{x:365,z:54},{x:355,z:178}].map(v=>({...v,taken:false}));
    const obstacles=[{x:19.2,z:19.2,w:5.8,d:5.8},...places.filter(p=>p.kind!=='pier').map(p=>({...p}))];
    const world={bounds:{...bounds},roads:[...roads],roadPlan,destinations:Terrain.destinations.map(p=>({...p})),places:places.map(p=>({...p})),buildings,buildingMap:new Map(buildings.map(b=>[b.id,b])),obstacles,cars,traffic,pedestrians,tokens,shells,player:{x:0,z:13,yaw:0},vehicle:-1,cameraYaw:0,elevation:0,enteredBuildings:new Set(),roomNotes:new Set(),natureVisited:new Set(),
      time:0,score:0,meters:0,deliveries:0,collected:0,route:0,visited:new Set(),discovered:new Set(),inspected:new Set(),mission:routes[0],waypoint:null,interior:null,returnTo:null,onTower:null,dialog:null,
      stamina:100,beachQuest:false,beachComplete:false,cafeReward:false,explorerReward:false,trial:null,stadiumBest:0,race:null,raceBest:{},raceResult:null,job:null,jobResult:null,jobCounts:{},jobsCompleted:0,jobChain:0,message:'M 查看城市地图 · 靠近车辆或建筑按 E 互动',messageTime:8,crashCooldown:0,hornTime:0};
    const index=new Map();for(const b of [...buildings,...obstacles])for(let x=Math.floor((b.x-b.w/2)/32);x<=Math.floor((b.x+b.w/2)/32);x++)for(let z=Math.floor((b.z-b.d/2)/32);z<=Math.floor((b.z+b.d/2)/32);z++){const key=x+','+z;if(!index.has(key))index.set(key,[]);index.get(key).push(b);}world.collisionIndex=index;
    // Keep all generated vehicles clear of each other and of the actual car footprint.
    const placed=[];for(const car of [...cars,...traffic]){if(vehicleContact(world,car,placed,false)){const start={x:car.x,z:car.z};for(let n=1;n<100;n++){const candidate={...car,[car.lane||'z']:(car.lane==='x'?start.x:start.z)+((n%2?1:-1)*Math.ceil(n/2)*5)};if(!vehicleContact(world,candidate,placed,false)){Object.assign(car,{x:candidate.x,z:candidate.z});break;}}}placed.push(car);}
    return world;
  }
  function blocked(world,x,z,radius=.42,elevation=world.elevation||0){
    if(world.interior){const r=world.interior;if(Math.abs(x)>r.width/2-radius||Math.abs(z)>r.depth/2-radius)return true;return r.obstacles.some(b=>pointHits(b,x,z,radius));}
    if(x>374-radius&&Math.abs(z-224)>8-radius)return true;
    const limit=world.bounds;if(x<limit.minX+radius||x>limit.maxX-radius||z<limit.minZ+radius||z>limit.maxZ-radius)return true;
    if(Terrain.landscapeBlocked(world,x,z,radius,elevation,false))return true;
    const seen=new Set();for(let gx=Math.floor((x-radius)/32);gx<=Math.floor((x+radius)/32);gx++)for(let gz=Math.floor((z-radius)/32);gz<=Math.floor((z+radius)/32);gz++)for(const b of world.collisionIndex.get(gx+','+gz)||[]){if(seen.has(b))continue;seen.add(b);if(b.roadDeck){const surface=Terrain.roadAt(world,x,z,elevation);if(surface.path?.id===b.surfaceId&&Math.abs(surface.y-elevation)<.6)continue;}if(verticalOverlap(elevation,1.8,b)&&pointHits(b,x,z,radius))return true;}
    return false;
  }
  function pointHits(b,x,z,radius){const r=b.rotation||0,dx=x-b.x,dz=z-b.z;return Math.abs(dx*Math.cos(r)+dz*Math.sin(r))<b.w/2+radius&&Math.abs(-dx*Math.sin(r)+dz*Math.cos(r))<b.d/2+radius;}
  function verticalOverlap(y,height,b){const min=b.minY??b.baseY??0,max=b.maxY??(min+(b.h||1.5));return y+height>min+.02&&y<max-.02;}
  function carBox(car){const width=car.type===1?1.12:1.06,length=car.type===1?2.05:car.type===2?1.66:1.9,yaw=car.yaw||0;return {x:car.x,z:car.z,hw:width,hl:length,right:{x:Math.cos(yaw),z:Math.sin(yaw)},forward:{x:Math.sin(yaw),z:-Math.cos(yaw)}};}
  function boxContact(a,b){
    const dx=a.x-b.x,dz=a.z-b.z;let depth=Infinity,normal=null;
    for(const axis of [a.right,a.forward,b.right,b.forward]){const dot=(u,v)=>u.x*v.x+u.z*v.z;
      const span=a.hw*Math.abs(dot(a.right,axis))+a.hl*Math.abs(dot(a.forward,axis))+b.hw*Math.abs(dot(b.right,axis))+b.hl*Math.abs(dot(b.forward,axis));
      const separation=dx*axis.x+dz*axis.z,overlap=span-Math.abs(separation);if(overlap<=.00001)return null;if(overlap<depth){depth=overlap;const sign=separation>=0?1:-1;normal={x:axis.x*sign,z:axis.z*sign};}
    }return {...normal,depth};
  }
  function personContact(car,x,z,radius=.42){const b=carBox(car),dx=x-car.x,dz=z-car.z;const rx=dx*b.right.x+dz*b.right.z,fz=dx*b.forward.x+dz*b.forward.z;return Math.hypot(rx-clamp(rx,-b.hw,b.hw),fz-clamp(fz,-b.hl,b.hl))<radius;}
  function vehicleContact(world,car,others=[...world.cars,...world.traffic],includePlayer=true){
    const a=carBox(car),reach=Math.hypot(a.hw,a.hl),limit=world.bounds;
    for(const x of [-1,1])for(const z of [-1,1]){const px=a.x+a.right.x*a.hw*x+a.forward.x*a.hl*z,pz=a.z+a.right.z*a.hw*x+a.forward.z*a.hl*z;
      if(px<limit.minX||px>limit.maxX||pz<limit.minZ||pz>limit.maxZ||(px>374&&Math.abs(pz-224)>8)||Terrain.landscapeBlocked(world,px,pz,.08,car.elevation||0,true))return {kind:'wall',x:0,z:0};}
    const seen=new Set();for(let x=Math.floor((car.x-reach)/32);x<=Math.floor((car.x+reach)/32);x++)for(let z=Math.floor((car.z-reach)/32);z<=Math.floor((car.z+reach)/32);z++)for(const b of world.collisionIndex.get(x+','+z)||[]){if(seen.has(b)||b.roadDeck&&b.surfaceId===car.surfaceId||!verticalOverlap(car.elevation||0,1.65,b))continue;seen.add(b);const r=b.rotation||0,hit=boxContact(a,{x:b.x,z:b.z,hw:b.w/2,hl:b.d/2,right:{x:Math.cos(r),z:Math.sin(r)},forward:{x:Math.sin(r),z:-Math.cos(r)}});if(hit)return {...hit,kind:'wall'};}
    for(const other of others){if(other===car||Math.abs(car.x-other.x)>5||Math.abs(car.z-other.z)>5||Math.abs((car.elevation||0)-(other.elevation||0))>1.8)continue;const hit=boxContact(a,carBox(other));if(hit)return {...hit,kind:'car',other};}
    if(includePlayer&&world.vehicle<0&&!world.interior&&!world.onTower&&Math.abs((car.elevation||0)-world.elevation)<1.8&&personContact(car,world.player.x,world.player.z))return {kind:'person',x:0,z:0};return null;
  }
  function walkBlocked(world,x,z,radius=.42){return blocked(world,x,z,radius)||(!world.interior&&[...world.cars,...world.traffic].some(car=>Math.abs((car.elevation||0)-world.elevation)<1.8&&personContact(car,x,z,radius)));}
  function move(world,entity,dx,dz,radius){let hit=false;const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));for(let n=0;n<count;n++){if(!walkBlocked(world,entity.x+dx/count,entity.z,radius))entity.x+=dx/count;else hit=true;if(!walkBlocked(world,entity.x,entity.z+dz/count,radius))entity.z+=dz/count;else hit=true;}return hit;}
  function velocity(car){return {x:Math.sin(car.yaw)*car.speed+(car.driftX||0),z:-Math.cos(car.yaw)*car.speed+(car.driftZ||0)};}
  function motionSpeed(car){const v=velocity(car);return Math.hypot(v.x,v.z);}
  function addCollider(world,b){world.colliderRevision=(world.colliderRevision||0)+1;world.obstacles.push(b);const r=b.rotation||0,rx=Math.abs(Math.cos(r))*b.w/2+Math.abs(Math.sin(r))*b.d/2,rz=Math.abs(Math.sin(r))*b.w/2+Math.abs(Math.cos(r))*b.d/2;for(let x=Math.floor((b.x-rx)/32);x<=Math.floor((b.x+rx)/32);x++)for(let z=Math.floor((b.z-rz)/32);z<=Math.floor((b.z+rz)/32);z++){const key=x+','+z;if(!world.collisionIndex.has(key))world.collisionIndex.set(key,[]);world.collisionIndex.get(key).push(b);}}
  function setVelocity(car,v){car.speed=v.x*Math.sin(car.yaw)-v.z*Math.cos(car.yaw);car.driftX=v.x-Math.sin(car.yaw)*car.speed;car.driftZ=v.z+Math.cos(car.yaw)*car.speed;}
  function impact(world,car,hit){
    const v=velocity(car);let force=Math.hypot(v.x,v.z);
    if(hit.kind==='car'){const other=hit.other,ov=velocity(other),closing=(v.x-ov.x)*hit.x+(v.z-ov.z)*hit.z;
      force=Math.max(0,-closing);if(closing<0){const mass=car.type===1?1.4:1,otherMass=other.type===1?1.4:1,j=-1.12*closing/(1/mass+1/otherMass);setVelocity(car,{x:v.x+j*hit.x/mass,z:v.z+j*hit.z/mass});setVelocity(other,{x:ov.x-j*hit.x/otherMass,z:ov.z-j*hit.z/otherMass});}
      other.stopTime=Math.max(other.stopTime||0,2);car.stopTime=Math.max(car.stopTime||0,2);
    }else if(hit.kind==='person'){car.speed=0;car.driftX=0;car.driftZ=0;}
    else{car.speed*=force>2?-.12:0;car.driftX=(car.driftX||0)*.15;car.driftZ=(car.driftZ||0)*.15;}
    if(force>3&&hit.kind!=='person'&&world.time>=(car.impactUntil||0)){
      const damage=Math.max(2,Math.min(35,Math.round(force*1.1)));car.health=Math.max(0,car.health-damage);car.impactUntil=world.time+.6;
      if(hit.other){hit.other.health=Math.max(0,hit.other.health-Math.round(damage*.75));hit.other.impactUntil=world.time+.6;}
      if(car===world.cars[world.vehicle]||hit.other===world.cars[world.vehicle]){if(!world.crashCooldown){world.crashCooldown=.7;crash(world);}}
    }
  }
  function driveBodies(world,seconds,turnDelta){
    const bodies=[...world.cars,...world.traffic],active=world.cars[world.vehicle];
    let fastest=0;for(const car of bodies){const v=velocity(car);fastest=Math.max(fastest,Math.hypot(v.x,v.z));}
    const count=Math.max(1,Math.ceil(fastest*seconds/.16),Math.ceil(Math.abs(turnDelta)/.025)),dt=seconds/count;
    for(let n=0;n<count;n++)for(const car of bodies){
      if(motionSpeed(car)<.00001&&(car!==active||!turnDelta))continue;
      const old={x:car.x,z:car.z,yaw:car.yaw,elevation:car.elevation||0,surfaceId:car.surfaceId};if(car===active)car.yaw+=turnDelta/count;
      const forward=velocity(car);car.x+=forward.x*dt;car.z+=forward.z*dt;
      const surface=Terrain.roadAt(world,car.x,car.z,old.elevation,true,{id:car.surfaceId,yaw:car.yaw});car.elevation=surface.y;car.surfaceId=surface.path?.id||null;
      const hit=vehicleContact(world,car,bodies);if(hit){Object.assign(car,old);impact(world,car,hit);}
    }
    for(const car of bodies){car.driftX=(car.driftX||0)*Math.exp(-seconds*4);car.driftZ=(car.driftZ||0)*Math.exp(-seconds*4);}
  }
  function trafficStep(world,seconds){
    const bodies=[...world.cars,...world.traffic];
    for(const car of world.traffic){
      car.stopTime=Math.max(0,(car.stopTime||0)-seconds);const f={x:Math.sin(car.yaw),z:-Math.cos(car.yaw)},r={x:Math.cos(car.yaw),z:Math.sin(car.yaw)},look=9+Math.max(0,car.speed)*.8;
      const ahead=target=>{const dx=target.x-car.x,dz=target.z-car.z;return dx*f.x+dz*f.z>0&&dx*f.x+dz*f.z<look&&Math.abs(dx*r.x+dz*r.z)<2.5;};
      const yielding=bodies.some(other=>other!==car&&ahead(other))||(world.vehicle<0&&!world.onTower&&ahead(world.player));
      const target=car.stopTime>0||yielding||car.health<=0?0:car.cruiseSpeed;car.braking=target<car.speed;car.speed+=clamp(target-car.speed,-18*seconds,3*seconds);
      if(Math.abs(car[car.lane])>337&&distance(world.player,car)>90){const candidate={...car,[car.lane]:car[car.lane]>0?-337:337};if(distance(world.player,candidate)>90&&!vehicleContact(world,candidate,bodies.filter(other=>other!==car))){car[car.lane]=candidate[car.lane];}}
    }
  }
  function notify(world,text,seconds=3){world.message=text;world.messageTime=seconds;}
  function discover(world,place){if(world.discovered.has(place.id))return;world.discovered.add(place.id);world.score+=place.reward;notify(world,'发现 '+place.name+' +'+place.reward,4);if(world.discovered.size>=6&&!world.explorerReward){world.explorerReward=true;world.score+=1000;notify(world,'城市探索者 · 发现六处地标 +1000',5);}}
  function enterRoom(world,spec){world.returnTo={...world.player,elevation:world.elevation};world.interior=spec;world.elevation=0;Object.assign(world.player,{x:0,z:spec.depth/2-4,yaw:0});world.cameraYaw=0;world.walking=false;notify(world,'已进入 '+spec.name+' · E 互动',4);}
  function enterBuilding(world,id,floor=0){const b=world.buildingMap.get(id);if(!b)return false;const spec=Interiors.plan(b,floor);if(!world.interior)enterRoom(world,spec);else{world.interior=spec;world.elevation=0;Object.assign(world.player,{x:spec.lift.x,z:spec.lift.z-.8,yaw:0});world.cameraYaw=0;}
    if(!world.enteredBuildings.has(id)){world.enteredBuildings.add(id);world.score+=100;}return true;}
  function context(world){
    const p=world.player;
    if(world.onTower)return {kind:'leave-tower',label:'返回地面'};
    if(world.job&&!world.interior&&world.elevation<2.5&&distance(p,jobGoal(world))<4&&(!world.cars[world.vehicle]||motionSpeed(world.cars[world.vehicle])<1)){
      if(world.job.id==='taxi'&&world.vehicle>=0)return {kind:world.job.phase==='pickup'?'job-pickup':'job-dropoff',label:world.job.phase==='pickup'?'接乘客上车':'送达乘客'};
      if(world.job.id==='coffee'&&world.job.phase==='deliver')return {kind:'job-dropoff',label:'交付咖啡'};
    }
    if(world.vehicle>=0){
      const car=world.cars[world.vehicle];
      const station=places.find(place=>place.id==='station');if(!world.serviceExit&&!world.race&&motionSpeed(car)<2&&distance(p,station.door)<8)return {kind:'service',label:'车辆检修'};
      const race=!world.race&&!world.job&&races.find(r=>distance(p,r.start)<7);
      if(race&&motionSpeed(car)<2)return {kind:'race',id:race.id,label:'开始「'+race.name+'」'};
      return {kind:'car-exit',label:motionSpeed(car)>2?'先停稳再下车':world.race?'退出计时赛并下车':world.job?.id==='taxi'&&world.job.phase==='deliver'?'结束接送并下车':'下车'};
    }
    if(world.interior){
      const r=world.interior;if(distance(p,r.exit)<2.6)return {kind:'leave',label:'离开'+r.name};
      if(r.kind==='cafe'&&distance(p,{x:0,z:-5})<3)return {kind:'coffee',label:'与店员交谈 / 补给'};
      if(r.kind==='museum'){const e=exhibits.find(e=>distance(p,e)<3.3);if(e)return {kind:'exhibit',id:e.id,label:'欣赏「'+e.label+'」'};}
      if(r.kind==='stadium'&&distance(p,{x:-16,z:28})<4)return {kind:'training',label:world.trial?'重新开始计时训练':'开始计时训练'};
      const spot=r.hotspots?.find(h=>distance(p,h)<2.7);if(spot)return {kind:spot.kind,label:spot.label};
      return null;
    }
    const place=world.places.find(place=>distance(p,place.door)<3.6&&world.elevation<2.5);if(place)return {kind:'place',id:place.id,label:place.kind==='tower'?'登上'+place.name:place.kind==='pier'?'码头打卡':place.kind==='surf'?'与冲浪屋交谈':place.kind==='station'?'查看旅行指南':'进入'+place.name};
    const building=world.buildings.filter(b=>distance(p,b.door)<2.3&&Math.abs(world.elevation-(b.baseY||0))<2.5).sort((a,b)=>distance(p,a.door)-distance(p,b.door))[0];if(building)return {kind:'building',id:building.id,label:'进入'+building.name};
    const nature=world.destinations.find(n=>distance(p,n.door)<7);if(nature)return {kind:'nature',id:nature.id,label:'探索'+nature.name};
    const nearby=world.cars.map((car,i)=>({i,d:distance(p,car)})).filter(v=>v.d<4).sort((a,b)=>a.d-b.d)[0];if(nearby)return {kind:'car-enter',id:nearby.i,label:motionSpeed(world.cars[nearby.i])>.6?'等待车辆停稳':'驾驶车辆'};
    const traffic=world.traffic.map(car=>({car,d:distance(p,car)})).filter(v=>v.d<9).sort((a,b)=>a.d-b.d)[0];
    if(traffic)return motionSpeed(traffic.car)<.6&&traffic.d<4?{kind:'traffic-enter',id:traffic.car.id,label:'换乘这辆车'}:{kind:'traffic-stop',id:traffic.car.id,label:traffic.car.stopTime>0?'车辆已拦停 · 靠近车门换乘':'拦停车辆'};
    return null;
  }
  function interact(world){
    if(world.dialog)return false;const action=context(world),p=world.player;
    if(!action){notify(world,'靠近地图上的建筑入口或车辆，按 E 互动');return false;}
    if(action.kind==='building')return enterBuilding(world,action.id);
    if(action.kind==='nature'){const place=world.destinations.find(n=>n.id===action.id);if(!world.natureVisited.has(place.id)){world.natureVisited.add(place.id);world.score+=300;}world.dialog={title:place.name,body:place.description+' 可沿步道继续自由探索。',actions:[{id:'job-close',label:'继续探索'}]};return true;}
    if(action.kind==='elevator'){world.dialog={kind:'elevator',title:'选择楼层',elevator:world.interior.buildingId,currentFloor:world.interior.floor,floorCount:world.interior.floorCount};return true;}
    if(action.kind==='room-note'){const key=world.interior.id;if(!world.roomNotes.has(key)){world.roomNotes.add(key);world.score+=60;}const notes={residential:'窗边的住户手册写着：周末不妨去海湾公园读一本书，再沿林海步道走到溪边。',courtyard:'住户们共同照料中庭的植物，每一扇窗都面向安静的生活。',office:'工作区留言：忙碌之余，记得去窗边看看城市，也给自己留一杯咖啡的时间。',studio:'创作记录里贴着海岸、林地和街头的照片，它们是这间工作室的灵感来源。',warehouse:'工作记录：货架之间保持通道畅通，窗边的老工具经过细心整理，仍在继续使用。',shop:'店主在手记里留下了街区故事，欢迎慢慢看看陈列和窗边的小收藏。',hotel:'旅行册推荐：沿海湾大道看城市，走过公园木桥，再去森林听溪水。',guestroom:'房间留言册记录着来自不同城市的旅人。放下行李，窗外还有一座城等你探索。'};world.dialog={title:world.interior.name,body:notes[world.interior.kind]||'每一处日常陈设都留下了这座城市的生活痕迹。',actions:[{id:'job-close',label:'继续参观'}]};return true;}
    if(action.kind==='job-pickup'){if(world.cars[world.vehicle].health<=0){notify(world,'先修复车辆，再接乘客');return false;}collectJob(world);return true;}
    if(action.kind==='job-dropoff'){completeJob(world);return true;}
    if(action.kind==='service'){world.dialog={title:'西城车辆服务站',body:'原地修复车身、恢复车况，保留当前车型和探索进度。',vehicle:world.vehicle,actions:[{id:'repair-car',label:'免费检修'},{id:'leave-service',label:'返回驾驶'},{id:'service-exit',label:'下车步行'}]};return true;}
    if(action.kind==='traffic-stop'){const car=world.traffic.find(c=>c.id===action.id);car.stopTime=15;notify(world,'已示意停车 · 等待停稳后靠近车门按 E 换乘',4);return true;}
    if(action.kind==='traffic-enter'){
      const i=world.traffic.findIndex(c=>c.id===action.id),car=world.traffic[i];world.traffic.splice(i,1);car.speed=0;car.driftX=car.driftZ=0;world.cars.push(car);action.kind='car-enter';action.id=world.cars.length-1;
    }
    if(action.kind==='car-enter'){const car=world.cars[action.id];if(motionSpeed(car)>.6){notify(world,'等车辆停稳后再上车');return false;}world.vehicle=action.id;car.speed=0;car.driftX=car.driftZ=0;p.x=car.x;p.z=car.z;p.yaw=car.yaw;world.elevation=car.elevation||0;world.surfaceId=car.surfaceId||null;world.cameraYaw=car.yaw;notify(world,'W 加速 · S 刹车 / 倒车 · A D 转向');return true;}
    if(action.kind==='race'){
      if(world.cars[world.vehicle].health<=0){notify(world,'先按 R 修复车辆，再来挑战');return false;}
      world.race={id:action.id,index:0,elapsed:0,countdown:3,penalty:0,hits:0};world.raceResult=null;notify(world,'按顺序穿过蓝色检查点 · 碰撞罚时 2 秒',4);return true;
    }
    if(action.kind==='car-exit'){
      const car=world.cars[world.vehicle];if(motionSpeed(car)>2){notify(world,'先停稳，再下车');return false;}
      const exits=[[Math.cos(car.yaw)*2,Math.sin(car.yaw)*2],[-Math.cos(car.yaw)*2,-Math.sin(car.yaw)*2],[Math.sin(car.yaw)*3,-Math.cos(car.yaw)*3],[-Math.sin(car.yaw)*3,Math.cos(car.yaw)*3]];const safe=exits.find(([x,z])=>!walkBlocked(world,car.x+x,car.z+z,.45));if(!safe){notify(world,'周围没有安全的下车空间');return false;}
      p.x=car.x+safe[0];p.z=car.z+safe[1];car.speed=0;car.driftX=car.driftZ=0;world.vehicle=-1;world.surfaceId=car.surfaceId||null;world.race=null;if(world.job?.id==='taxi'&&world.job.phase==='deliver')cancelJob(world,'接送已结束，乘客已下车');else notify(world,'自由步行 · 靠近路上车辆按 E 拦停换乘');return true;
    }
    if(action.kind==='leave'||action.kind==='leave-tower'){
      if(action.kind==='leave'&&world.savedTower){const saved=world.savedTower;Object.assign(p,saved.player);world.onTower=saved.id;world.elevation=saved.elevation;world.returnTo=saved.returnTo;world.interior=null;world.savedTower=null;world.cameraYaw=saved.cameraYaw;notify(world,'回到观景台 · E 返回地面');return true;}
      Object.assign(p,world.returnTo);world.cameraYaw=p.yaw;world.interior=null;world.onTower=null;world.elevation=world.returnTo.elevation||0;world.trial=null;world.returnTo=null;notify(world,'回到城市');return true;
    }
    if(action.kind==='place'){
      const place=world.places.find(v=>v.id===action.id);discover(world,place);
      if(place.kind==='surf'){world.dialog={title:place.name,body:world.beachComplete?'海岸印记收集完成，感谢你探索这片海滩。':place.description,actions:[...(world.beachQuest?[{id:'navigate-shell',label:'标记下一枚海螺'}]:[{id:'beach-quest',label:'接取海滩探访'}]),{id:'enter-surf',label:'进入冲浪屋'}]};return true;}
      if(place.kind==='station'){world.dialog={title:'下一站去哪里？',body:'沿海公路通往海滩，西侧山路与隧道通往林海溪谷。你可以在城市地图中选择目的地导航。',actions:[{id:'map',label:'打开城市地图'},{id:'enter-station',label:'进入候车大厅'}]};return true;}
      if(place.kind==='pier'){notify(world,'日落码头已记入探索手册',4);return true;}
      world.returnTo={x:p.x,z:p.z,yaw:p.yaw,elevation:world.elevation};
      if(place.kind==='tower'){world.onTower=place.id;world.elevation=place.elevation;p.x=place.x;p.z=place.z;world.cameraYaw=place.id==='tower'?Math.PI/2:-Math.PI/2;notify(world,'拖动环顾城市 · E 返回地面',5);return true;}
      world.interior=room(place.id);p.x=0;p.z=world.interior.depth/2-4;p.yaw=0;world.cameraYaw=0;world.walking=false;notify(world,'已进入 '+place.name+' · 走近展品或工作人员按 E 互动',5);return true;
    }
    if(action.kind==='coffee'){
      world.stamina=100;if(!world.cafeReward){world.cafeReward=true;world.score+=100;}
      if(world.job?.id==='coffee'&&world.job.phase==='pickup'){collectJob(world);world.dialog={title:'咖啡已打包',body:'请在 '+world.job.limit+' 秒内送到'+jobGoal(world).name+'。碰撞会损伤包装，地图和对话打开时暂停计时。',actions:[{id:'job-close',label:'开始配送'}]};return true;}
      world.dialog={title:'海岸咖啡',body:'热咖啡让你恢复了体力。店员推荐你去潮汐艺术馆看看，再到海湾之塔欣赏全城景色。',actions:[{id:'navigate-museum',label:'标记艺术馆'},{id:'navigate-tower',label:'标记海湾之塔'}]};return true;
    }
    if(action.kind==='exhibit'){
      const e=exhibits.find(v=>v.id===action.id);if(!world.inspected.has(e.id)){world.inspected.add(e.id);world.score+=150;}
      world.dialog={title:e.label,body:e.body+(world.inspected.size===3?' 你已欣赏全部三件展品。':''),actions:[]};return true;
    }
    if(action.kind==='training'){if(world.job){notify(world,'先完成当前委托，再开始训练');return false;}world.trial={index:0,elapsed:0};world.stamina=100;notify(world,'训练开始 · 按顺序跑过四个金色检查点',5);return true;}
    return false;
  }
  function choose(world,id){
    const service=world.dialog?.vehicle,elevator=world.dialog?.elevator,station=places.find(p=>p.id==='station');
    world.dialog=null;
    if(id==='tower-hall'&&world.onTower){const tower=world.onTower;world.savedTower={id:tower,player:{...world.player},elevation:world.elevation,returnTo:world.returnTo,cameraYaw:world.cameraYaw};enterRoom(world,room(tower+'-hall'));world.onTower=null;}
    if(id==='enter-surf'||id==='enter-station')enterRoom(world,room(id.slice(6)));
    if(id.startsWith('floor-')&&elevator&&world.interior?.buildingId===elevator){const b=world.buildingMap.get(elevator),floor=Number(id.slice(6));if(Number.isInteger(floor)&&floor>=0&&floor<b.floorCount)enterBuilding(world,elevator,floor);}
    if(id==='job-taxi'||id==='job-coffee')startJob(world,id.slice(4));
    if(id==='job-cancel')cancelJob(world);
    if(id==='job-resume'&&world.job)world.job.detour=false;
    if(id==='repair-car'&&service===world.vehicle&&world.vehicle>=0&&distance(world.player,station.door)<8){const car=world.cars[world.vehicle];car.health=100;car.speed=0;car.driftX=car.driftZ=0;if(world.job)world.job.detour=false;notify(world,'检修完成 · 车况已恢复，继续出发',4);}
    if(id==='service-exit'&&service===world.vehicle&&world.vehicle>=0){world.serviceExit=true;interact(world);world.serviceExit=false;}
    if(id==='beach-quest'){world.beachQuest=true;notify(world,'海滩探访已开启 · 寻找四枚海螺',5);}
    if(id==='beach-quest'||id==='navigate-shell'){const next=world.shells.find(s=>!s.taken);if(next)world.waypoint={...next,name:'海滩海螺'};}
    if(id.startsWith('navigate-')&&id!=='navigate-shell'){const place=places.find(p=>p.id===id.slice(9));if(place)world.waypoint={...place.door,name:place.name};}
  }
  function navigate(world,id){const place=[...world.places,...world.destinations,...world.roadPlan.entrances].find(p=>p.id===id)||world.buildingMap.get(id),race=races.find(r=>r.id===id);world.waypoint=place?{...place.door,name:place.name}:race?{...race.start,name:race.name+' · 起点'}:null;if(world.job)world.job.detour=true;world.dialog=null;}
  function recover(world){
    if(world.job)cancelJob(world,'返回车站，当前委托已取消');
    world.interior=null;world.onTower=null;world.savedTower=null;world.elevation=0;world.surfaceId=null;world.dialog=null;world.trial=null;world.race=null;world.returnTo=null;
    if(world.vehicle>=0){const car=world.cars[world.vehicle];for(let n=0;n<50;n++){const candidate={...car,x:3,z:13+n*5,yaw:0,elevation:0,surfaceId:null};if(!vehicleContact(world,candidate,[...world.cars,...world.traffic].filter(v=>v!==car),false)){Object.assign(car,{x:3,z:candidate.z,yaw:0,elevation:0,surfaceId:null,speed:0,driftX:0,driftZ:0,health:100,steer:0});break;}}}
    const car=world.cars[world.vehicle];let footZ=13;if(!car)for(let n=0;n<50;n++)if(!walkBlocked(world,0,13+n*2)){footZ=13+n*2;break;}
    Object.assign(world.player,{x:car?car.x:0,z:car?car.z:footZ,yaw:0});world.cameraYaw=0;world.stamina=100;notify(world,'已回到中央公园入口');
  }
  function step(world,dt,input={}){
    const seconds=clamp(dt,0,.05),p=world.player;world.time+=seconds;world.messageTime=Math.max(0,world.messageTime-seconds);world.crashCooldown=Math.max(0,world.crashCooldown-seconds);world.hornTime=Math.max(0,world.hornTime-seconds);
    if(world.dialog){world.walking=false;return;}const oldX=p.x,oldZ=p.z;
    if(world.job?.phase==='deliver'){world.job.elapsed+=seconds;if(world.job.elapsed>=world.job.limit)cancelJob(world,(world.job.id==='taxi'?'接送':'配送')+'超时 · 连单已中断，可重新接取委托');}
    if(world.race?.countdown>0){world.race.countdown=Math.max(0,world.race.countdown-seconds);world.cars[world.vehicle].speed=0;if(!world.race.countdown)notify(world,'出发！穿过蓝色检查点',2);return;}
    if(world.onTower){world.walking=false;world.area=world.places.find(v=>v.id===world.onTower).name;return;}
    let turnDelta=0;
    if(world.vehicle>=0){
      const car=world.cars[world.vehicle],handling=vehicleTypes[car.type]||vehicleTypes[0],accel=car.health>0?(input.forward?handling.acceleration:input.back?-20:0):0;if(car.health===0)car.speed=0;
      car.speed=clamp((car.speed+accel*seconds)*Math.exp(-(input.brake?4.5:(input.forward||input.back) ? .18 : 1.25)*seconds),-9,handling.topSpeed);
      const turn=(input.right?1:0)-(input.left?1:0);car.steer+=(turn-car.steer)*Math.min(1,seconds*9);car.braking=!!(input.brake||input.back);
      turnDelta=car.steer*seconds*handling.steering*clamp(car.speed/6,-1,1);
      if(car.health===0){car.speed=0;car.driftX=car.driftZ=0;notify(world,'车辆需要修复 · 按 R 返回车站');}
    }else{
      let forward=(input.forward?1:0)-(input.back?1:0),side=(input.right?1:0)-(input.left?1:0);const length=Math.hypot(forward,side)||1;forward/=length;side/=length;
      const sprint=!!input.sprint&&world.stamina>4&&(forward||side);world.sprinting=!!sprint;world.stamina=clamp(world.stamina+(sprint?-18:12)*seconds,0,100);const speed=sprint?7.5:4.3;
      const dx=(Math.sin(world.cameraYaw)*forward+Math.cos(world.cameraYaw)*side)*speed*seconds,dz=(-Math.cos(world.cameraYaw)*forward+Math.sin(world.cameraYaw)*side)*speed*seconds;
      if(dx||dz){p.yaw+=angleDelta(p.yaw,Math.atan2(dx,-dz))*Math.min(1,seconds*12);move(world,p,dx,dz,.42);}
    }
    if(!world.interior){
      for(const car of world.cars)if(car!==world.cars[world.vehicle])car.speed*=Math.exp(-seconds*3);
      trafficStep(world,seconds);driveBodies(world,seconds,turnDelta);
      if(world.vehicle>=0){const car=world.cars[world.vehicle];p.x=car.x;p.z=car.z;p.yaw=car.yaw;world.elevation=car.elevation||0;world.surfaceId=car.surfaceId||null;}else{const surface=Terrain.roadAt(world,p.x,p.z,world.elevation,false,{id:world.surfaceId,yaw:p.yaw});world.elevation=surface.y;world.surfaceId=surface.path?.id||null;}
    }
    world.walking=world.vehicle<0&&Math.hypot(p.x-oldX,p.z-oldZ)>.001;world.meters+=Math.hypot(p.x-oldX,p.z-oldZ);
    if(world.interior){
      world.area=world.interior.name;
      if(world.trial){world.trial.elapsed+=seconds;const checkpoint=checkpoints[world.trial.index];if(distance(p,checkpoint)<2.2){world.trial.index++;if(world.trial.index===checkpoints.length){const award=1000+Math.max(0,Math.floor((60-world.trial.elapsed)*10));world.score+=Math.max(0,award-world.stadiumBest);world.stadiumBest=Math.max(award,world.stadiumBest);notify(world,'训练完成！用时 '+world.trial.elapsed.toFixed(1)+' 秒',6);world.trial=null;}}}
      return;
    }
    if(world.race){
      const race=world.race,course=races.find(r=>r.id===race.id);race.elapsed+=seconds;
      if(race.elapsed+race.penalty>course.limit||world.cars[world.vehicle].health===0){world.race=null;notify(world,'本次挑战结束 · 回到起点可再次尝试',5);}
      else if(distance(p,course.checkpoints[race.index])<6){
        race.index++;notify(world,'检查点 '+race.index+' / '+course.checkpoints.length,2);
        if(race.index===course.checkpoints.length){
          const total=race.elapsed+race.penalty,award=1500+Math.max(0,Math.floor((course.limit-total)*15)),before=world.raceBest[course.id]?.score||0;
          world.score+=Math.max(0,award-before);world.raceBest[course.id]={score:Math.max(before,award),time:Math.min(world.raceBest[course.id]?.time??Infinity,total)};
          world.raceResult={id:course.id,name:course.name,time:total,penalty:race.penalty,hits:race.hits,earned:Math.max(0,award-before)};world.race=null;
          if(world.waypoint?.name===course.name+' · 起点')world.waypoint=null;
          notify(world,course.name+'完成 · '+total.toFixed(1)+' 秒 · +'+Math.max(0,award-before),6);
        }
      }
    }
    for(const npc of world.pedestrians)npc.phase+=seconds*.7;
    for(const token of world.tokens)if(!token.taken&&distance(p,token)<1.7){token.taken=true;world.collected++;world.score+=100;notify(world,'城市印记 +100');}
    if(world.beachQuest)for(const shell of world.shells)if(!shell.taken&&distance(p,shell)<2){shell.taken=true;world.score+=150;const count=world.shells.filter(s=>s.taken).length;notify(world,'海滩海螺 '+count+' / 4');const next=world.shells.find(s=>!s.taken);if(next)world.waypoint={...next,name:'海滩海螺'};else if(!world.beachComplete){world.beachComplete=true;world.score+=1200;world.waypoint=null;notify(world,'海滩探访完成 +1200',6);}}
    const speed=world.vehicle>=0?Math.abs(world.cars[world.vehicle].speed):0;
    if(!world.race&&!world.job&&distance(p,world.mission)<3.7&&speed<5){world.deliveries++;world.score+=750;world.route=(world.route+1)%routes.length;world.mission=routes[world.route];notify(world,'送达成功 +750 · 下一站：'+world.mission.name,5);}
    for(const place of world.places)if(distance(p,place.door)<12)discover(world,place);
    world.area=Terrain.inPark(p.x,p.z)?'海湾公园':p.x<-370?'林海溪谷':p.x>320?'白沙海岸':p.x<-185&&p.z>100?'体育园区':p.x>100&&p.z<-80?'滨海商务区':Math.abs(p.x)<28&&Math.abs(p.z)<28?'中央公园':p.z<-128?'旧城街区':p.z>128?'艺术街区':'城市中心';
    if(!world.visited.has(world.area)){world.visited.add(world.area);world.score+=150;}
  }
  function crash(world){if(world.race){world.race.penalty+=2;world.race.hits++;notify(world,'碰撞 · 罚时 +2 秒',2);}else if(world.job?.phase==='deliver'){world.job.hits++;world.job.quality=Math.max(0,world.job.quality-(world.job.id==='taxi'?20:25));if(!world.job.quality)cancelJob(world,'服务评价耗尽 · 本次委托结束');else notify(world,'碰撞 · '+(world.job.id==='taxi'?'乘客舒适度':'包装完整度')+' '+world.job.quality+'%',3);}else notify(world,'碰撞！放慢速度，小心转弯');}
  return {create,step,interact,context,choose,navigate,recover,blocked,distance,angleDelta,routes,places,room,enterBuilding,exhibits,checkpoints,races,objective,navigationPath,vehicleTypes,jobTypes,jobGoal,startJob,cancelJob,reputation,carBox,boxContact,vehicleContact,addCollider,bounds,roads};
})();
