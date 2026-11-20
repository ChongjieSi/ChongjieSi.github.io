/* Authored landscape, road alignments and layered drivable surfaces. */
window.ArcadeCityTerrain=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const park={x:-264,z:-255,rx:68,rz:65,pond:{x:-274,z:-260,rx:22,rz:15}};
  const destinations=[{id:'city-park',name:'海湾公园',door:{x:-194,z:-231},description:'花园步道、湖畔木桥、阅读亭与花境。'},{id:'forest',name:'林海溪谷',door:{x:-510,z:80},description:'穿过林间公路，沿溪流探索森林。'},{id:'hill-lookout',name:'山脊观景台',door:{x:-650,z:-530},description:'沿山路步道登高，看溪谷与远处的城市。'}];
  function curve(points,step=3){
    const result=[];for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)],count=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));for(let n=0;n<count;n++){const t=n/count,t2=t*t,t3=t2*t;const value=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);result.push({x:value(0),z:value(1)});}}const last=points.at(-1);result.push({x:last[0],z:last[1]});return result;
  }
  const river=curve([[-790,-560],[-720,-470],[-655,-398],[-600,-328],[-635,-210],[-548,-90],[-590,60],[-510,168],[-436,295]],4).map((p,i,list)=>({...p,y:mix(25,2,i/(list.length-1))}));
  function nearest(points,x,z){let best=null;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);if(!best||d<best.d)best={d,x:px,z:pz,y:mix(a.y||0,b.y||0,t),dx,dz,index:i,t};}return best;}
  function inPark(x,z,margin=0){return Math.abs(x-park.x)<park.rx+margin&&Math.abs(z-park.z)<park.rz+margin;}
  function rawHeight(x,z){
    if(x>=-352)return 0;const fade=clamp((-x-352)/58,0,1),hill=(cx,cz,h,r)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
    let h=1+hill(-620,-260,40,100)+hill(-490,-198,45,100)+hill(-730,75,44,110)+hill(-480,-435,30,90)+hill(-720,-510,64,140)+Math.sin(x*.019)*Math.cos(z*.017)*2;
    const stream=nearest(river,x,z);if(stream.d<46){const t=clamp((46-stream.d)/30,0,1),bed=stream.y-1.1+Math.max(0,stream.d-3.2)*.55;h=mix(h,bed,t*t*(3-2*t));}return Math.max(0,h*fade);
  }
  function buildNetwork(roads){
    const paths=[];const add=(id,type,width,points,lanes=1)=>{paths.push({id,type,width,points,lanes});return paths.at(-1);};
    for(const x of roads){const ranges=x>park.x-park.rx-3&&x<park.x+park.rx+3?[[-344,park.z-park.rz-4],[park.z+park.rz+4,344]]:[[-344,344]];for(const [a,b]of ranges)if(b>a)add('grid-z-'+x+'-'+a,'street',window.ArcadeCityArchitecture.streetProfile(x).width,[{x,z:a,y:0},{x,z:b,y:0}],window.ArcadeCityArchitecture.streetProfile(x).lanes);}
    for(const z of roads){const ranges=z>park.z-park.rz-3&&z<park.z+park.rz+3?[[-344,park.x-park.rx-4],[park.x+park.rx+4,328]]:[[-344,328]];for(const [a,b]of ranges)if(b>a)add('grid-x-'+z+'-'+a,'street',window.ArcadeCityArchitecture.streetProfile(z).width,[{x:a,z,y:0},{x:b,z,y:0}],window.ArcadeCityArchitecture.streetProfile(z).lanes);}
    const boulevard=add('harbour-boulevard','boulevard',15.2,curve([[-344,304],[-280,255],[-200,172],[-128,100],[-48,57],[32,32],[112,-24],[190,-77],[262,-132],[326,-202]],3).map(p=>({...p,y:.045})),2);
    add('west-neighbourhood','boulevard',10,curve([[-320,320],[-390,345],[-465,305],[-455,230],[-400,176],[-352,160],[-320,128]],3).map(p=>({...p,y:.045})));
    add('stadium-avenue','boulevard',10,curve([[-192,320],[-192,380],[-203,410],[-236,417],[-275,408],[-287,376],[-288,320]],3).map(p=>({...p,y:.045})));
    const viaduct=curve([[-320,320],[-342,350],[-340,404],[-303,412],[-286,373],[-285,331],[-265,298],[-176,270],[-64,236],[32,208],[128,208],[215,242],[276,296],[250,336],[231,376],[252,412],[300,402],[305,353],[320,320]],2);let total=0;const lengths=[0];for(let i=1;i<viaduct.length;i++){total+=Math.hypot(viaduct[i].x-viaduct[i-1].x,viaduct[i].z-viaduct[i-1].z);lengths.push(total);}viaduct.forEach((p,i)=>{const fromEnd=Math.min(lengths[i],total-lengths[i]),t=clamp((fromEnd-50)/190,0,1);p.y=12*(t*t*(3-2*t));});add('bay-viaduct','elevated',10,viaduct);
    const entrances=[{id:'viaduct-west',name:'高架西入口',door:{...viaduct[0]},heading:Math.atan2(viaduct[1].x-viaduct[0].x,-(viaduct[1].z-viaduct[0].z))},{id:'viaduct-east',name:'高架东入口',door:{...viaduct.at(-1)},heading:Math.atan2(viaduct.at(-2).x-viaduct.at(-1).x,-(viaduct.at(-2).z-viaduct.at(-1).z))}];
    const woodland=curve([[-320,96],[-390,122],[-454,105],[-510,80],[-548,12],[-590,-60],[-650,-170],[-646,-268],[-590,-322],[-570,-376],[-615,-434],[-650,-530]],3);woodland.forEach(p=>p.y=rawHeight(p.x,p.z)+.13);for(let n=0;n<4;n++)for(let i=2;i<woodland.length-2;i++)woodland[i].y=(woodland[i-2].y+woodland[i-1].y+woodland[i].y*2+woodland[i+1].y+woodland[i+2].y)/6;for(const p of woodland){const s=nearest(river,p.x,p.z);if(s.d<10)p.y=Math.max(p.y,s.y+1.8);}add('forest-road','forest-road',8,woodland);
    const tunnel=curve([[-320,-96],[-376,-118],[-430,-155],[-495,-198],[-560,-240],[-646,-268]],3),tunnelExit=nearest(woodland,-646,-268).y;tunnel.forEach((p,i)=>{const t=i/(tunnel.length-1);p.y=mix(.1,tunnelExit,t*t);});add('ridge-tunnel','tunnel',8,tunnel);
    const loop=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;loop.push({x:park.x+Math.cos(a)*53,z:park.z+Math.sin(a)*48,y:.13});}add('garden-loop','garden-path',3.5,loop);
    add('park-entry','garden-path',4,curve([[-192,-231],[-214,-232],[-237,-241],[-254,-260],[-294,-260],[-317,-244]],2).map(p=>({...p,y:Math.abs(p.z+260)<3&&p.x<-246&&p.x>-303?.8:.13})));
    add('woodland-walk','trail',3,curve([[-510,80],[-525,135],[-561,153],[-600,100],[-630,10],[-589,-67],[-548,-90],[-581,-166],[-650,-226],[-695,-313],[-710,-403],[-650,-530]],2.5).map(p=>{const s=nearest(river,p.x,p.z);return {...p,y:s.d<8?s.y+1.2:rawHeight(p.x,p.z)+.15};}));
    const spatial=new Map();for(const path of paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],pad=path.width/2+4;for(let x=Math.floor((Math.min(a.x,b.x)-pad)/32);x<=Math.floor((Math.max(a.x,b.x)+pad)/32);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/32);z<=Math.floor((Math.max(a.z,b.z)+pad)/32);z++){const key=x+','+z;if(!spatial.has(key))spatial.set(key,[]);spatial.get(key).push({a,b,path,index:i});}}
    return {paths,river,park,destinations,boulevard,spatial,entrances};
  }
  function roadAt(world,x,z,previous=0,vehicle=false,tracking=null){
    const ground=rawHeight(x,z);let best={y:ground,d:Infinity,path:null,delta:Math.abs(ground-previous)},score=Infinity;
    for(const {a,b,path,index}of world.roadPlan.spatial.get(Math.floor(x/32)+','+Math.floor(z/32))||[]){if(vehicle&&(path.type==='garden-path'||path.type==='trail'))continue;const p=nearest([a,b],x,z),paving=path.type==='street'||path.type==='boulevard';if(p.d>path.width/2+(paving?2.45:.25))continue;if(paving&&p.d>path.width/2+.2)p.y+=.18;const delta=Math.abs(p.y-previous),len=Math.hypot(p.dx,p.dz)||1,aligned=tracking?.yaw===undefined||Math.abs(Math.sin(tracking.yaw)*p.dx/len-Math.cos(tracking.yaw)*p.dz/len)>.78,following=tracking?.id===path.id,merge=tracking&&path.type==='elevated'&&p.y<.35&&delta<.45&&aligned&&p.d<path.width/2-1.1,preference=path.type==='elevated'&&(following||merge)?5:0,candidate=delta+p.d*.45-preference;if(delta<2.5&&candidate<score){score=candidate;best={...p,path,delta,index};}}
    return best;
  }
  function height(world,x,z,previous=0,vehicle=false){return roadAt(world,x,z,previous,vehicle).y;}
  function landscapeBlocked(world,x,z,radius,elevation=0,vehicle=false){
    const road=roadAt(world,x,z,elevation,vehicle),onRoad=road.path&&road.d<road.path.width/2-radius*.4;
    const pond=park.pond;if(((x-pond.x)/(pond.rx+radius))**2+((z-pond.z)/(pond.rz+radius))**2<1&&!(onRoad&&road.y>.5))return true;
    if(x<-400){const stream=nearest(river,x,z);if(stream.d<3.5+radius&&!(onRoad&&road.y>stream.y+.5))return true;}
    if(vehicle&&inPark(x,z,-2)&&!onRoad)return true;
    if(!onRoad&&x<-370){const slope=Math.hypot(rawHeight(x+1,z)-rawHeight(x-1,z),rawHeight(x,z+1)-rawHeight(x,z-1))/2;if(slope>(vehicle?.7:1.25))return true;}return false;
  }
  function reserveBuilding(world,b){
    if(inPark(b.x,b.z,Math.max(b.w,b.d)/2+3))return true;
    const reach=Math.hypot(b.w,b.d)/2+17;for(let x=Math.floor((b.x-reach)/32);x<=Math.floor((b.x+reach)/32);x++)for(let z=Math.floor((b.z-reach)/32);z<=Math.floor((b.z+reach)/32);z++)for(const {a,path,b:next}of world.roadPlan.spatial.get(x+','+z)||[]){if(!['street','boulevard','elevated'].includes(path.type))continue;const n=nearest([a,next],b.x,b.z),len=Math.hypot(n.dx,n.dz)||1,footprint=(Math.abs(n.dz)*b.w+Math.abs(n.dx)*b.d)/(2*len),paving=path.type==='elevated'?1.5:4.2;if(n.d<path.width/2+footprint+paving)return true;}return false;
  }
  function facilityAllowed(world,x,z){return !inPark(x,z,1)&&!(world.roadPlan.spatial.get(Math.floor(x/32)+','+Math.floor(z/32))||[]).some(({a,b,path})=>(['boulevard','forest-road','tunnel'].includes(path.type)||path.type==='elevated'&&Math.min(a.y,b.y)<7)&&nearest([a,b],x,z).d<path.width/2+1.6);}
  function navigationGraph(world,clear){
    const nodes=[],keys=new Map(),cells=new Map();
    const add=(p,car)=>{const key=[Math.round(p.x*10),Math.round(p.z*10),Math.round((p.y||0)*2)].join(',');let i=keys.get(key);if(i===undefined){i=nodes.length;keys.set(key,i);nodes.push({x:p.x,z:p.z,y:p.y||0,car,edges:[]});const cell=Math.floor(p.x/8)+','+Math.floor(p.z/8);if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(i);}else nodes[i].car||=car;return i;};
    const join=(a,b,car)=>{if(a===b||nodes[a].edges.some(e=>e.to===b&&e.car===car))return;nodes[a].edges.push({to:b,car});nodes[b].edges.push({to:a,car});};
    for(const path of world.roadPlan.paths){const car=!['trail','garden-path'].includes(path.type);let previous=null,walked=8;for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],length=Math.hypot(b.x-a.x,b.z-a.z),count=Math.max(1,Math.ceil(length/8));for(let j=0;j<=count;j++){const t=j/count,p={x:mix(a.x,b.x,t),z:mix(a.z,b.z,t),y:mix(a.y,b.y,t)};walked+=j?length/count:0;if(previous!==null&&walked<7&&!(i===path.points.length-1&&j===count))continue;const next=add(p,car);if(previous!==null&&clear(nodes[previous],nodes[next]))join(previous,next,car);previous=next;walked=0;}}}
    nodes.forEach((node,i)=>{for(let x=Math.floor(node.x/8)-1;x<=Math.floor(node.x/8)+1;x++)for(let z=Math.floor(node.z/8)-1;z<=Math.floor(node.z/8)+1;z++)for(const j of cells.get(x+','+z)||[]){if(j<=i)continue;const n=nodes[j],dist=Math.hypot(node.x-n.x,node.z-n.z);if(dist<7&&Math.abs(node.y-n.y)<Math.max(.4,dist*.3)&&clear(node,n))join(i,j,node.car&&n.car);}});
    return {nodes,revision:world.colliderRevision||0};
  }
  return {park,destinations,curve,nearest,rawHeight,inPark,buildNetwork,roadAt,height,landscapeBlocked,reserveBuilding,facilityAllowed,navigationGraph};
})();
