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
  const riverCells=new Map();for(let i=1;i<river.length;i++){const a=river[i-1],b=river[i];for(let x=Math.floor((Math.min(a.x,b.x)-52)/32);x<=Math.floor((Math.max(a.x,b.x)+52)/32);x++)for(let z=Math.floor((Math.min(a.z,b.z)-52)/32);z<=Math.floor((Math.max(a.z,b.z)+52)/32);z++){const key=x+','+z;if(!riverCells.has(key))riverCells.set(key,[]);riverCells.get(key).push([a,b]);}}
  function riverAt(x,z){let best={d:Infinity,y:0};for(const segment of riverCells.get(Math.floor(x/32)+','+Math.floor(z/32))||[]){const n=nearest(segment,x,z);if(n.d<best.d)best=n;}return best;}
  function inPark(x,z,margin=0){return Math.abs(x-park.x)<park.rx+margin&&Math.abs(z-park.z)<park.rz+margin;}
  // Fixed bridge decks and junctions constrain the whole profile in both directions.
  // Raising valleys alone leaves bridges suspended high above the stream.
  function gradeAnchored(points,grade,anchors){
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));
    for(let i=0;i<points.length;i++){
      let low=-Infinity,high=Infinity;
      for(const [index,y]of anchors){const reach=grade*Math.abs(lengths[i]-lengths[index]);low=Math.max(low,y-reach);high=Math.min(high,y+reach);}
      points[i].y=clamp(points[i].y,low,high);
    }
    for(let i=1;i<points.length;i++){const reach=grade*(lengths[i]-lengths[i-1]);points[i].y=clamp(points[i].y,points[i-1].y-reach,points[i-1].y+reach);}
    for(let i=points.length-2;i>=0;i--){const reach=grade*(lengths[i+1]-lengths[i]);points[i].y=clamp(points[i].y,points[i+1].y-reach,points[i+1].y+reach);}
    return points;
  }
  function rawHeight(x,z){
    if(x>=-352)return 0;const fade=clamp((-x-352)/58,0,1),hill=(cx,cz,h,r)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
    let h=1+hill(-620,-260,40,100)+hill(-490,-198,45,100)+hill(-730,75,44,110)+hill(-480,-435,30,90)+hill(-720,-510,64,140)+Math.sin(x*.019)*Math.cos(z*.017)*2;
    const stream=riverAt(x,z);if(stream.d<46){const t=clamp((46-stream.d)/30,0,1),bed=stream.y-.85+Math.max(0,stream.d-2.1)*.8;h=mix(h,bed,t*t*(3-2*t));}return Math.max(0,h*fade);
  }
  function splitPolygon(polygon,plane){
    const inside=[],outside=[],value=p=>p.x*plane.x+p.y*plane.y+p.z*plane.z+plane.c;
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],da=value(a),db=value(b),inA=da>=-1e-8,inB=db>=-1e-8;
      (inA?inside:outside).push(a);
      if(inA!==inB){const t=da/(da-db),point={};for(const k of ['x','y','z','u','v'])point[k]=a[k]+(b[k]-a[k])*t;inside.push(point);outside.push(point);}
    }
    return {inside,outside};
  }
  function subtractPrism(polygon,planes){
    const kept=[];let remaining=polygon;
    for(const plane of planes){const parts=splitPolygon(remaining,plane);if(parts.outside.length>=3)kept.push(parts.outside);remaining=parts.inside;if(remaining.length<3)break;}
    return kept;
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
    const woodland=curve([[-320,96],[-390,122],[-470,128],[-510,80],[-515,40],[-516,-35],[-526,-112],[-565,-170],[-552,-268],[-552,-310],[-530,-375],[-582,-450],[-650,-530]],3);woodland.forEach(p=>{const stream=nearest(river,p.x,p.z);p.y=Math.max(rawHeight(p.x,p.z)+.13,stream.d<14?stream.y+2:0);});
    // A continuous embankment/road cutting, without a step at river bridges.
    for(let pass=0;pass<3;pass++){for(let i=1;i<woodland.length;i++)woodland[i].y=Math.max(woodland[i].y,woodland[i-1].y-.12*Math.hypot(woodland[i].x-woodland[i-1].x,woodland[i].z-woodland[i-1].z));for(let i=woodland.length-2;i>=0;i--)woodland[i].y=Math.max(woodland[i].y,woodland[i+1].y-.12*Math.hypot(woodland[i].x-woodland[i+1].x,woodland[i].z-woodland[i+1].z));}
    let approach=0;for(let i=0;i<woodland.length;i++){if(i)approach+=Math.hypot(woodland[i].x-woodland[i-1].x,woodland[i].z-woodland[i-1].z);woodland[i].y=Math.min(woodland[i].y,approach*.12);}
    const summitY=woodland.at(-1).y,summitAnchors=[[0,woodland[0].y]];let fromSummit=0;
    for(let i=woodland.length-1;i>=0;i--){if(i<woodland.length-1)fromSummit+=Math.hypot(woodland[i].x-woodland[i+1].x,woodland[i].z-woodland[i+1].z);if(fromSummit>14)break;summitAnchors.push([i,summitY]);}
    gradeAnchored(woodland,.12,summitAnchors);
    add('forest-road','forest-road',8,woodland);
    // Meet the mountain road transversely, rather than overlapping it at two heights.
    const tunnel=curve([[-320,-96],[-376,-118],[-430,-155],[-495,-198],[-582,-254],[-582,-292],[-552,-310]],3),tunnelExit=nearest(woodland,-552,-310).y,tunnelAnchors=[[0,.1],[tunnel.length-1,tunnelExit]];tunnel.forEach((p,i)=>{const t=i/(tunnel.length-1);p.y=mix(.1,tunnelExit,t*t);const join=nearest(woodland,p.x,p.z);if(Math.hypot(p.x+552,p.z+310)<26&&join.d<10)tunnelAnchors.push([i,join.y]);});gradeAnchored(tunnel,.18,tunnelAnchors);add('ridge-tunnel','tunnel',8,tunnel);
    const western=paths.find(p=>p.id==='west-neighbourhood'),westernAnchors=[[0,0],[western.points.length-1,0]];western.points.forEach((p,i)=>{p.y=rawHeight(p.x,p.z)+.13;const stream=nearest(river,p.x,p.z);if(stream.d<13)westernAnchors.push([i,stream.y+2]);});gradeAnchored(western.points,.18,westernAnchors);
    const connector=curve([[-320,320],[-350,280],[-352,200],[-352,148],[-390,122]],3);const end=nearest(woodland,-390,122).y;let length=0;const distances=[0];for(let i=1;i<connector.length;i++){length+=Math.hypot(connector[i].x-connector[i-1].x,connector[i].z-connector[i-1].z);distances.push(length);}const connectorAnchors=[[0,0],[connector.length-1,end]];connector.forEach((p,i)=>{p.y=mix(0,end,distances[i]/length);const join=nearest(western.points,p.x,p.z);if(join.d<11)connectorAnchors.push([i,join.y]);});gradeAnchored(connector,.18,connectorAnchors);add('forest-connector','forest-road',10,connector);entrances.push({id:'forest-access',name:'森林公路连接线',door:{...connector[0]}});
    const north=curve([[-320,-320],[-356,-354],[-285,-402],[-190,-410],[-80,-380],[32,-370],[60,-410],[117,-406],[138,-360],[128,-320]],3);let northLength=0;const nd=[0];for(let i=1;i<north.length;i++){northLength+=Math.hypot(north[i].x-north[i-1].x,north[i].z-north[i-1].z);nd.push(northLength);}north.forEach((p,i)=>{const t=clamp((Math.min(nd[i],northLength-nd[i])-25)/160,0,1);p.y=10*t*t*(3-2*t);});add('north-viaduct','elevated',10,north);entrances.push({id:'north-west',name:'北环高架西入口',door:{...north[0]}},{id:'north-east',name:'北环高架东入口',door:{...north.at(-1)}});
    const valley=curve([[-390,122],[-432,68],[-475,-10],[-515,-90],[-525,-140],[-495,-198]],3),vy0=nearest(woodland,-390,122).y,vy1=nearest(tunnel,-495,-198).y;let vl=0;const vd=[0];for(let i=1;i<valley.length;i++){vl+=Math.hypot(valley[i].x-valley[i-1].x,valley[i].z-valley[i-1].z);vd.push(vl);}valley.forEach((p,i)=>p.y=mix(vy0,vy1,vd[i]/vl));add('valley-tunnel','tunnel',10,valley);entrances.push({id:'valley-access',name:'溪谷隧道入口',door:{...valley[0]}});
    const loop=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;loop.push({x:park.x+Math.cos(a)*53,z:park.z+Math.sin(a)*48,y:.13});}add('garden-loop','garden-path',3.5,loop);
    add('park-entry','garden-path',4,curve([[-192,-231],[-214,-232],[-237,-241],[-254,-260],[-294,-260],[-317,-244]],2).map(p=>({...p,y:Math.abs(p.z+260)<3&&p.x<-246&&p.x>-303?.8:.13})));
    const walking=curve([[-510,80],[-525,135],[-561,153],[-600,100],[-630,10],[-589,-67],[-548,-90],[-581,-166],[-650,-226],[-695,-313],[-710,-403],[-690,-478],[-680,-518],[-650,-530]],2.5).map(p=>({...p,y:rawHeight(p.x,p.z)+.15}));
    const anchors=[[0,nearest(woodland,walking[0].x,walking[0].z).y],[walking.length-1,woodland.at(-1).y]];
    walking.forEach((p,i)=>{const s=nearest(river,p.x,p.z),road=nearest(woodland,p.x,p.z);if(road.d<6.2)anchors.push([i,road.y]);else if(s.d<8)anchors.push([i,s.y+1.6]);});
    gradeAnchored(walking,.3,anchors);add('woodland-walk','trail',3,walking);
    const restArea={id:'lookout-parking',type:'parking',width:22,x:-650,z:-530,y:woodland.at(-1).y,rx:11,rz:10,pavilion:{x:-650,z:-550}};
    add('lookout-walk','trail',3,curve([[-650,-530],[-650,-537],[-650,-544.8]],2).map(p=>({...p,y:restArea.y})));
    const clearings=[restArea,{x:restArea.pavilion.x,z:restArea.pavilion.z,y:restArea.y,rx:5.4,rz:4.8}];
    const spatial=new Map();for(const path of paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],pad=path.width/2+9;for(let x=Math.floor((Math.min(a.x,b.x)-pad)/32);x<=Math.floor((Math.max(a.x,b.x)+pad)/32);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/32);z<=Math.floor((Math.max(a.z,b.z)+pad)/32);z++){const key=x+','+z;if(!spatial.has(key))spatial.set(key,[]);spatial.get(key).push({a,b,path,index:i});}}
    return {paths,river,park,destinations,boulevard,spatial,entrances,restArea,clearings};
  }
  function groundHeight(world,x,z){let ground=rawHeight(x,z);const stream=riverAt(x,z);for(const c of world.roadPlan.clearings||[]){const radius=Math.hypot((x-c.x)/c.rx,(z-c.z)/c.rz),t=clamp((radius-1)/.5,0,1);if(t<1)ground=mix(c.y-.24,ground,t*t*(3-2*t));}let best=null;for(const {a,b,path}of world.roadPlan.spatial.get(Math.floor(x/32)+','+Math.floor(z/32))||[]){if(!['forest-road','tunnel','boulevard','trail'].includes(path.type))continue;const n=nearest([a,b],x,z),dist=n.d-path.width/2;if(dist>7)continue;if(path.type==='tunnel'&&ground>n.y+10)continue;if(stream.d<4.2&&n.y>stream.y+.5)continue;const priority=(dist>(path.type==='trail'?3.2:0)?10:0)+(path.type==='tunnel'?3:path.type==='trail'?2:0);if(!best||priority<best.priority||priority===best.priority&&dist<best.dist-.00001)best={...n,dist,priority,shoulder:3.2};}if(!best)return ground;const t=clamp((best.dist-best.shoulder)/7,0,1);return mix(best.y-.24,ground,t*t*(3-2*t));}
  function roadAt(world,x,z,previous=0,vehicle=false,tracking=null){
    const ground=groundHeight(world,x,z);let best={y:ground,d:Infinity,path:null,delta:Math.abs(ground-previous)},score=Infinity;
    // Choose the actual nearest segment first. Filtering its end cap earlier can
    // incorrectly fall back to the flat end of a previous segment at a junction.
    const candidates=new Map();
    for(const {a,b,path,index}of world.roadPlan.spatial.get(Math.floor(x/32)+','+Math.floor(z/32))||[]){
      if(vehicle&&['garden-path','trail'].includes(path.type))continue;
      const p=nearest([a,b],x,z),old=candidates.get(path.id);
      if(!old||p.d<old.p.d)candidates.set(path.id,{p,path,index});
    }
    for(const {p,path,index}of candidates.values()){
      const len=Math.hypot(p.dx,p.dz)||1,overrun=((x-p.x)*p.dx+(z-p.z)*p.dz)/len,paving=['street','boulevard'].includes(path.type);
      if(index===1&&p.t===0&&overrun<-.12||index===path.points.length-1&&p.t===1&&overrun>.12)continue;
      if(p.d>path.width/2+(paving?2.45:.25))continue;
      if(paving&&p.d>path.width/2+.2)p.y+=.18;
      const delta=Math.abs(p.y-previous);if(delta>=2.5)continue;
      const aligned=tracking?.yaw===undefined||Math.abs(Math.sin(tracking.yaw)*p.dx/len-Math.cos(tracking.yaw)*p.dz/len)>.78,following=tracking?.id===path.id,merge=tracking&&path.type==='elevated'&&p.y<.35&&delta<.45&&aligned&&p.d<path.width/2-1.1,candidate=delta+p.d*.45-(following||merge?5:0);
      if(candidate<score){score=candidate;best={...p,path,delta,index};}
    }
    const rest=world.roadPlan.restArea;
    if(rest){const d=Math.hypot((x-rest.x)/rest.rx,(z-rest.z)/rest.rz)*rest.rx,delta=Math.abs(rest.y-previous);if(d<rest.rx&&delta<2.5&&(!best.path||best.path.type==='trail'||best.d>best.path.width/2))best={y:rest.y,d,path:rest,delta};}
    return best;
  }
  function height(world,x,z,previous=0,vehicle=false){return roadAt(world,x,z,previous,vehicle).y;}
  function landscapeBlocked(world,x,z,radius,elevation=0,vehicle=false){
    const road=roadAt(world,x,z,elevation,vehicle),onRoad=road.path&&road.d<road.path.width/2-radius*.4;
    const pond=park.pond;if(((x-pond.x)/(pond.rx+radius))**2+((z-pond.z)/(pond.rz+radius))**2<1&&!(onRoad&&road.y>.5))return true;
    if(x<-400){const stream=riverAt(x,z);if(stream.d<3.5+radius&&!(onRoad&&road.y>stream.y+.5))return true;}
    if(vehicle&&inPark(x,z,-2)&&!onRoad)return true;
    if(!onRoad&&x<-370){const slope=Math.hypot(groundHeight(world,x+1,z)-groundHeight(world,x-1,z),groundHeight(world,x,z+1)-groundHeight(world,x,z-1))/2;if(slope>(vehicle?.7:1.25))return true;}return false;
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
  return {park,destinations,curve,nearest,riverAt,rawHeight,subtractPrism,groundHeight,inPark,buildNetwork,roadAt,height,landscapeBlocked,reserveBuilding,facilityAllowed,navigationGraph};
})();
