/* Human-scale station and sports architecture; repeated parts share GPU batches. */
window.ArcadeCityCivic=(T,{detail,material,person},world)=>{
  const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,16,10),owned=new Set([cube,sphere]),textures=[],mats=[],trains=[],balls=[],keepers=[],clocks=[],boards=[],scoreboards=[],lamps=[],roots=[];
  const steel=material(0x526a70,0,'cladding'),ivory=material(0xe2e4df),ink=material(0x253e46),stone=detail.finish(3),timber=detail.finish(1),blue=material(0x497e91),red=material(0xae6559);
  const glass=new T.MeshStandardMaterial({color:0x9ec6cd,roughness:.24,metalness:.35,transparent:true,opacity:.58,side:T.DoubleSide});mats.push(glass);
  const lit=new T.MeshStandardMaterial({color:0xffefd4,emissive:0xffd79d,emissiveIntensity:.35});mats.push(lit);
  function mesh(root,geo,mat,x,y,z,w=1,h=1,d=1){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const box=(r,m,x,y,z,w,h,d)=>mesh(r,cube,m,x,y,z,w,h,d);
  function plane(root,mat,x,y,z,w,h,flat=false){const g=new T.PlaneGeometry(w,h);owned.add(g);const o=mesh(root,g,mat,x,y,z);if(flat)o.rotation.x=-Math.PI/2;return o;}
  function surface(width,height,paint,transparent=false){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(ctx)paint(ctx,width,height);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.push(map);const mat=new T.MeshStandardMaterial({map,transparent,alphaTest:transparent?.25:0,roughness:.82,side:T.DoubleSide});mats.push(mat);return {canvas,mat,map};}
  function sign(root,words,x,y,z,w=5,rotation=0){const label=surface(768,144,(c,W,H)=>{c.fillStyle='#193c46';c.fillRect(0,0,W,H);c.fillStyle='#eacb86';c.fillRect(0,H-5,W,5);c.font='500 52px "PingFang SC",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f4f1e6';c.fillText(words,W/2,H/2,W-35);});const o=mesh(root,ArcadeCityArchitecture.signGeometry(T,w,w*144/768),label.mat,x,y,z);owned.add(o.geometry);o.rotation.y=rotation;o.castShadow=false;o.userData.surface=label;return o;}
  function tube(root,points,radius=.08,mat=steel){const curve=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(curve,Math.max(8,points.length*2),radius,5,false);owned.add(g);return mesh(root,g,mat,0,0,0);}
  function beam(root,a,b,w=.1,mat=steel){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),o=box(root,mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,w,v.length(),w);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
  function batch(root){
    for(const child of [...root.children])if(child.isGroup&&!child.userData.moving)batch(child);
    const groups=new Map();for(const o of root.children){if(!o.isMesh||o.geometry!==cube||o.userData.moving)continue;const key=o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
    for(const list of groups.values()){if(list.length<4)continue;const inst=new T.InstancedMesh(cube,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();inst.setMatrixAt(i,o.matrix);root.remove(o);});inst.castShadow=inst.receiveShadow=true;inst.instanceMatrix.needsUpdate=true;root.add(inst);}
  }
  function rootAt(parent,name,x=0,z=0){const r=new T.Group();r.name=name;r.position.set(x,0,z);parent.add(r);roots.push(r);return r;}
  function vault(root,length,halfDepth,base,rise){
    const vertices=[],indices=[],uv=[];const segments=32;
    for(let side=0;side<2;side++)for(let j=0;j<=segments;j++){const a=j/segments*Math.PI;vertices.push((side-.5)*length,base+Math.sin(a)*rise,Math.cos(a)*halfDepth);uv.push(side*length/3,j/4);}
    const g=new T.BufferGeometry();for(let j=0;j<segments;j++){const a=j,b=j+segments+1;indices.push(a,b,a+1,b,b+1,a+1);g.addGroup(j*6,6,j>=12&&j<20?1:0);}g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();owned.add(g);
    const roofMat=material(0x839a9a,0,'cladding').clone();roofMat.side=T.DoubleSide;mats.push(roofMat);const roof=mesh(root,g,[roofMat,glass],0,0,0);roof.name='station-vault-panels';
    for(let x=-length/2+1;x<length/2;x+=4){const points=[];for(let j=0;j<=24;j++){const a=j/24*Math.PI;points.push(new T.Vector3(x,base-.12+Math.sin(a)*rise,Math.cos(a)*halfDepth));}tube(root,points,.095);for(const side of [-1,1]){box(root,steel,x,base/2,side*(halfDepth-.45),.2,base,.2);beam(root,[x,base-2,side*(halfDepth-.45)],[x,base+.8,side*(halfDepth-2.4)],.09);}}
    for(let j=1;j<16;j++){const a=j/16*Math.PI;box(root,steel,0,base+.025+Math.sin(a)*rise,Math.cos(a)*halfDepth,length,.055,.07);}
    for(const side of [-1,1]){box(root,steel,0,base,side*(halfDepth+.08),length,.24,.25);for(const x of [-length/2+1,length/2-1])box(root,steel,x,base/2,side*(halfDepth+.08),.12,base,.12);}
  }
  function clock(root,x,y,z,scale=1){const face=surface(256,256,(c,W,H)=>{c.fillStyle='#f0eee2';c.beginPath();c.arc(W/2,H/2,W*.48,0,Math.PI*2);c.fill();c.strokeStyle='#3e555b';c.lineWidth=7;c.stroke();for(let i=0;i<60;i++){const a=i*Math.PI/30;c.lineWidth=i%5?2:5;c.beginPath();c.moveTo(128+Math.sin(a)*103,128-Math.cos(a)*103);c.lineTo(128+Math.sin(a)*(i%5?111:116),128-Math.cos(a)*(i%5?111:116));c.stroke();}});
    const group=new T.Group();group.position.set(x,y,z);group.scale.setScalar(scale);root.add(group);plane(group,face.mat,0,0,0,1.6,1.6);const hour=box(group,ink,0,0,.025,.055,.43,.025),minute=box(group,ink,0,0,.045,.035,.63,.025);hour.geometry=cube.clone();hour.geometry.translate(0,.5,0);minute.geometry=cube.clone();minute.geometry.translate(0,.5,0);owned.add(hour.geometry);owned.add(minute.geometry);clocks.push({hour,minute});
  }
  function bench(root,x,z){for(let i=0;i<5;i++)box(root,timber,x,.55,z+(i-2)*.13,4,.08,.11);for(let i=0;i<3;i++)box(root,timber,x,.85+i*.16,z-.37,4,.1,.08);for(const side of [-1,1]){box(root,steel,x+side*1.6,.28,z,.12,.55,.75);box(root,steel,x+side*1.9,.77,z,.08,.08,.8);}}
  function stationExterior(parent,place){
    const r=rootAt(parent,'civic-station',place.x,place.z);box(r,stone,0,.04,0,46,.08,27);box(r,stone,0,.04,15,46,.08,5.6);
    for(const x of [-12,12])bench(r,x,5);
    for(const side of [-1,1]){box(r,stone,side*20.6,3.6,0,.7,7.2,23);for(let x=-19;x<=19;x+=3.8){box(r,stone,x,1,side*11.5,3.5,2,.45);box(r,glass,x,4.8,side*11.45,3.45,5.2,.12);box(r,steel,x,4.8,side*11.6,.085,5.2,.18);box(r,steel,x,4.7,side*11.6,3.7,.085,.18);}}
    vault(r,46,12.8,8.2,4.6);for(const side of [-1,1]){box(r,stone,side*12,7.5,12,17,1.4,.6);box(r,steel,side*13,6.7,13.1,16,.12,2.4);for(const x of [side*5,side*20])box(r,steel,x,3.2,13.8,.13,6.4,.13);}
    box(r,ink,0,3.4,11.9,7.4,6.8,.16);for(const x of [-1.7,1.7]){box(r,glass,x,2.7,12.02,3.2,5.2,.08);box(r,ivory,x+(x<0?1.4:-1.4),2.5,12.1,.05,.65,.12);}
    sign(r,'西城车站',0,7.2,13.25,11);clock(r,0,9.8,12.85,1.2);sign(r,'候车厅 · 站台 01',-12,6.3,13.28,8);sign(r,'车辆检修',12,3.1,12.03,6);
    for(const side of [-1,1]){bench(r,side*13,13.1);box(r,stone,side*21,.4,13.3,1.2,.8,1.2);for(const angle of [0,Math.PI/2]){const p=plane(r,detail.plant(side<0?0:3,true),side*21,1.5,13.3,2,2);p.rotation.y=angle;}}
    batch(r);return r;
  }
  function stationInterior(parent){
    const r=rootAt(parent,'station-concourse');box(r,stone,0,-.15,0,44,.3,44);box(r,ink,0,.01,-16.5,43,.04,10.5);
    const floor=plane(r,stone,0,.025,5.25,44,33,true),uv=floor.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*11,uv.getY(i)*8.25);
    for(const x of [-21.8,21.8]){box(r,stone,x,3.8,5.5,.4,7.6,33);box(r,stone,x,6.2,-16.5,.4,3,11);box(r,stone,x,2,-21.3,.4,4,1);}
    for(const x of [-22.5,22.5]){const portal=plane(r,ink,x,2.25,-16.5,10.4,4.5);portal.rotation.y=Math.PI/2;portal.material=portal.material.clone();portal.material.side=T.DoubleSide;mats.push(portal.material);}
    box(r,stone,0,3.8,21.8,44,7.6,.4);box(r,glass,0,4,-21.8,44,8,.15);
    vault(r,44,21.7,8.1,4.3);for(const x of [-18,-12,-6,6,12,18]){box(r,steel,x,4.7,-5,.1,.5,.1);box(r,lit,x,7.6,1,.2,.08,8);}
    for(const x of [-12,0,12]){const light=new T.PointLight(0xffe6c1,30,24,2);light.position.set(x,6,1);r.add(light);lamps.push({light,inside:'station',night:85,day:30});}
    // Continuous rails and regularly spaced sleepers sit below the safe platform.
    for(let x=-21;x<=21;x+=.6)for(const z of [-14.4,-19.3])box(r,timber,x,.06,z,.18,.12,2.5);
    for(const z of [-15.25,-13.55,-20.15,-18.45])box(r,steel,0,.21,z,43,.14,.08);
    box(r,stone,0,.12,-7.8,43,.24,7.1);box(r,material(0xd8b758),0,.255,-11,43,.025,.44);for(let x=-21;x<=21;x+=.55)box(r,ivory,x,.255,-10.4,.12,.02,.16);
    for(const side of [-1,1])for(const z of [7,-2])bench(r,side*11,z);
    box(r,timber,13,1.05,12,6,2.1,2);box(r,stone,13,2.15,12,6.4,.15,2.3);sign(r,'问询 · 失物招领',13,4,12,7);
    for(let i=0;i<3;i++){box(r,steel,-17+i*1.25,1.05,12,.95,2.1,.75);box(r,glass,-17+i*1.25,1.5,12.4,.7,.55,.06);box(r,ivory,-17+i*1.25,.75,12.4,.5,.07,.06);}sign(r,'自助售票',-15.7,3,12.5,4);
    sign(r,'01 站台 · 黄线内候车',0,5.5,-8.5,10);sign(r,'出口',0,3.4,21.52,4,Math.PI);clock(r,-5,6.1,-4,1.05);
    const board=surface(1024,512,()=>{});plane(r,board.mat,9,6.2,-2,8,4);boards.push(board);
    for(const [x,z,color,v]of [[13,10.1,0x758c80,1],[-14.8,4,0xa98f73,2],[14.8,-4.5,0x859bb1,3]]){const a=person(color,v);a.group.position.set(x,0,z);r.add(a.group);}
    const suitcase=new T.Group();suitcase.name='station-lost-case';suitcase.userData.moving=true;r.add(suitcase);box(suitcase,red,-14,.45,-2.6,.65,.8,.4);box(suitcase,steel,-14,1.02,-2.6,.33,.4,.05);
    const train=new T.Group();train.name='station-local-train';train.userData.moving=true;train.position.set(0,0,-14.4);r.add(train);const doors=[];
    for(const center of [-14,0,14]){
      box(train,ivory,center,1.9,0,13.4,2.6,2.7);box(train,blue,center,1.08,1.37,13.4,.42,.045);box(train,steel,center,3.32,0,13,.2,2.5);box(train,ink,center,.48,0,12,.45,2.2);
      for(const x of [-4.8,-3.2,0,3.2,4.8])box(train,glass,center+x,2.35,1.375,1.25,.94,.035);
      for(const dx of [-1.9,1.9])for(const side of [-1,1]){const door=new T.Group();door.position.set(center+dx+side*.34,0,1.405);door.userData={moving:true,home:door.position.x};train.add(door);doors.push({door,side});box(door,steel,0,1.94,0,.66,2.25,.06);box(door,glass,0,2.35,.04,.5,.85,.035);}
      for(const x of [-4.1,4.1])for(const side of [-1,1]){const g=new T.CylinderGeometry(.36,.36,.16,12);g.rotateX(Math.PI/2);owned.add(g);mesh(train,g,ink,center+x,.4,side*1.1);}
    }
    sign(train,'海岸城 · 区间列车',0,2.9,1.43,5);for(const x of [-20.4,20.4])box(train,lit,x,1.6,1.43,.25,.22,.04);
    batch(train);trains.push({train,doors,suitcase});batch(r);return r;
  }
  const pitch=surface(768,1152,(c,W,H)=>{
    c.fillStyle='#41754c';c.fillRect(0,0,W,H);for(let i=0;i<12;i++){c.fillStyle=i%2?'#518559':'#477c50';c.fillRect(0,i*H/12,W,H/12);}
    const photo=T.Cache?.get('/games/textures/grass-v1.jpg');if(photo){c.globalAlpha=.25;c.drawImage(photo,0,0,W,H);c.globalAlpha=1;}
    let seed=91;for(let i=0;i<35000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%W;seed=(seed*1664525+1013904223)>>>0;c.fillStyle=i%2?'#95ae6914':'#183a2811';c.fillRect(x,seed%H,1,2);}
    c.strokeStyle='#eff1d9';c.lineWidth=4;const x=2,y=2,w=W-4,h=H-4;c.strokeRect(x,y,w,h);c.beginPath();c.moveTo(x,H/2);c.lineTo(W-x,H/2);c.stroke();c.beginPath();c.arc(W/2,H/2,96,0,Math.PI*2);c.stroke();
    for(const side of [0,1]){const top=side?H-y:y,sgn=side?-1:1,spot=H*11/46;c.strokeRect(W/2-210,top,420,sgn*345);c.strokeRect(W/2-95,top,190,sgn*115);c.beginPath();c.arc(W/2,top+sgn*spot,5,0,Math.PI*2);c.fillStyle='#eff1d9';c.fill();c.beginPath();c.arc(W/2,top+sgn*spot,96,side?Math.PI+.85:.85,side?Math.PI*2-.85:Math.PI-.85);c.stroke();}
  });
  const net=surface(256,256,(c,W,H)=>{c.strokeStyle='#f4f3d7bb';c.lineWidth=2;for(let i=0;i<=16;i++){const p=i*16;c.beginPath();c.moveTo(p,0);c.lineTo(p,H);c.moveTo(0,p);c.lineTo(W,p);c.stroke();}},true);
  function stadium(parent,inside=false,place={x:0,z:0}){
    const r=rootAt(parent,inside?'stadium-sports-ground':'civic-stadium',place.x,place.z),sx=inside?1:.78,sz=inside?1:.69;r.scale.set(sx,1,sz);
    box(r,stone,0,-.09,0,54,.16,74);box(r,material(0x657f62),0,.005,0,48,.03,67);
    // A stadium-shaped track has parallel straights and semicircular bends.
    const radius=16.5,straight=11.8,lanes=6,lane=.86;
    function oval(rad,y){const p=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI;p.push(new T.Vector3(Math.cos(a)*rad,y,-straight-Math.sin(a)*rad));}for(let i=0;i<=48;i++){const a=Math.PI+i/48*Math.PI;p.push(new T.Vector3(Math.cos(a)*rad,y,straight-Math.sin(a)*rad));}p.push(p[0]);return p;}
    for(let i=0;i<lanes;i++){const a=oval(radius+i*lane,.04),b=oval(radius+(i+1)*lane,.04),positions=[],indices=[];for(let j=0;j<a.length;j++){positions.push(...a[j].toArray(),...b[j].toArray());if(j<a.length-1){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();owned.add(geo);mesh(r,geo,material(i%2?0xa96353:0xb9705b),0,0,0);}
    const lineMat=new T.LineBasicMaterial({color:0xf0ead7});mats.push(lineMat);for(let i=0;i<=lanes;i++){const g=new T.BufferGeometry().setFromPoints(oval(radius+i*lane,.065));owned.add(g);r.add(new T.Line(g,lineMat));}
    plane(r,pitch.mat,0,.09,0,29,46,true);
    for(let i=0;i<6;i++){box(r,ivory,radius+(i+.5)*lane,.07,9,.72,.025,.1);const number=surface(128,128,c=>{c.fillStyle='#f1eddb';c.font='700 95px sans-serif';c.textAlign='center';c.fillText(String(i+1),64,101);},true);plane(r,number.mat,radius+(i+.5)*lane,.095,11.2,.55,.7,true);}
    for(const end of [-1,1]){const z=end*23;for(const x of [-3.3,3.3]){box(r,ivory,x,1.2,z,.11,2.4,.11);beam(r,[x,2.4,z],[x,.1,z+end*1.7],.07);const side=plane(r,net.mat,x,1.2,z+end*.8,1.6,2.35);side.rotation.y=Math.PI/2;}box(r,ivory,0,2.4,z,6.7,.11,.11);plane(r,net.mat,0,1.2,z+end*1.6,6.6,2.35);const top=plane(r,net.mat,0,2.35,z+end*.8,6.6,1.6,true);top.castShadow=false;}
    // Separate shells leave aisles, stairways and the main entrance visible.
    for(const side of [-1,1])for(let tier=0;tier<5;tier++){
      const x=side*(23+tier*.7),y=.8+tier*.64;box(r,stone,x,y/2,0,.72,y,55);
      for(let i=0;i<54;i++){const z=-26.5+i;if(Math.abs(z)<1.8||Math.abs(z-15)<1.2||Math.abs(z+15)<1.2)continue;const seat=side<0?blue:red;box(r,seat,x,y+.12,z,.55,.13,.64);box(r,seat,x+side*.23,y+.38,z,.1,.56,.64);}
    }
    for(const side of [-1,1]){
      for(let z=-27;z<=27;z+=3)box(r,ivory,side*24.5,7.3,z,7.2,.16,2.93).rotation.z=side*.07;box(r,steel,side*20.9,7.55,0,.12,.2,57);
      for(let z=-27;z<=27;z+=6){box(r,steel,side*27,3.5,z,.16,7,.16);beam(r,[side*27,5,z],[side*22.4,7.3,z],.13);beam(r,[side*27,3.5,z],[side*25,6.9,z],.1);}
      for(const z of [-15,0,15])for(let i=0;i<8;i++)box(r,stone,side*(23+i*.44),.25+i*.33,z,.45,.2,1.6);
      for(const z of [-25,25]){box(r,steel,side*24,10,z,.18,20,.18);for(let i=0;i<4;i++)box(r,lit,side*24+(i-1.5)*.6,20,z,.5,.65,.4);const light=new T.SpotLight(0xeaf0e1,0,85,.72,.55,2);light.position.set(side*24,19.5,z);light.target.position.set(0,0,z*.22);r.add(light,light.target);lamps.push({light,inside:inside?'stadium':null,place,night:1350,day:0});}
      for(let z=-25;z<=25;z+=2.5)box(r,steel,side*22.1,1.3,z,.055,2.5,.055);box(r,steel,side*22.1,2.5,0,.06,.06,51);
    }
    sign(r,'海湾体育场',0,5.7,33.2,15);for(const x of [-9,9])box(r,steel,x,2.6,33,.2,5.2,.2);
    for(const x of [-4.7,4.7])box(r,steel,x,3,-32,.15,6,.15);box(r,ink,0,6,-32,11,3.2,.28);const score=sign(r,'海湾训练 · 00 : 00',0,6,-31.8,10);score.name='stadium-scoreboard';scoreboards.push(score.userData.surface);
    for(const end of [-1,1]){box(r,stone,0,.55,end*36.5,54,1.1,.35);for(let x=-26;x<=26;x+=3.25)box(r,steel,x,1.5,end*36.5,.06,1.9,.06);box(r,steel,0,2.4,end*36.5,54,.06,.06);}
    if(inside){
      const coach=person(0x6e95a4,2);coach.group.position.set(-16,0,28);r.add(coach.group);sign(r,'跑道训练',-16,2.8,28,5);
      box(r,blue,-18,.5,29.3,1.7,1,.8);for(let i=0;i<5;i++)box(r,ivory,-18+(i-2)*.25,1.2,29.3,.12,.35,.12);
      const ball=mesh(r,sphere,ivory,0,.22,-12,.22,.22,.22);ball.name='stadium-football';ball.userData.moving=true;
      for(let i=0;i<6;i++){const patch=mesh(ball,sphere,ink,Math.sin(i*2.4)*.82,Math.cos(i*2.4)*.82,Math.sin(i*1.7)*.6,.3,.3,.3);patch.castShadow=false;}
      const keeper=person(0xd8ac54,3);keeper.group.position.set(0,0,-22);keeper.group.userData.moving=true;r.add(keeper.group);keepers.push(keeper);balls.push(ball);
      const mark=mesh(r,new T.TorusGeometry(.65,.025,5,32),material(0xe4c67d),0,.12,-10);owned.add(mark.geometry);mark.rotation.x=-Math.PI/2;box(r,steel,7,.65,-10,.07,1.3,.07);sign(r,'五球挑战',7,1.4,-10,2.6);
    }
    batch(r);return r;
  }
  let lastBoard=-1,lastScore='';
  function update(state){
    const status=ArcadeCityWorld.trainStatus(state);
    for(const {train,doors,suitcase}of trains){train.position.x=status.x;train.visible=status.phase!=='away';for(const {door,side}of doors)door.position.x=door.userData.home+side*status.doors*.58;suitcase.visible=state.stationQuest!=='return'&&state.stationQuest!=='done';}
    for(const {hour,minute}of clocks){minute.rotation.z=-state.time/3600*Math.PI*2;hour.rotation.z=-Math.PI/2-state.time/43200*Math.PI*2;}
    if(Math.floor(state.time)!==lastBoard&&state.interior?.id==='station'){
      lastBoard=Math.floor(state.time);for(const board of boards){const c=board.canvas.getContext('2d');if(!c)continue;c.fillStyle='#102a32';c.fillRect(0,0,1024,512);c.textAlign='left';c.fillStyle='#f0d497';c.font='500 42px "PingFang SC",sans-serif';c.fillText('西城车站 · 列车动态',40,65);c.fillStyle='#a2c7c5';c.font='25px sans-serif';c.fillText('车次         站台               状态',40,135);c.fillStyle='#f0eee3';c.font='36px "PingFang SC",sans-serif';c.fillText('C 101        01        '+(status.phase==='dwell'?'正在停靠':status.phase==='arrive'?'列车进站':status.phase==='depart'?'正在离站':Math.ceil(status.wait)+' 秒后进站'),40,220);c.fillStyle='#8cb1b3';c.font='29px "PingFang SC",sans-serif';c.fillText('请在黄色安全线内候车',40,340);c.fillText('问询与失物招领位于大厅东侧',40,410);board.map.needsUpdate=true;}
    }
    const shot=state.penalty,scoreKey=shot?shot.round+':'+shot.goals:'idle';if(scoreKey!==lastScore){lastScore=scoreKey;for(const board of scoreboards){const c=board.canvas.getContext('2d');if(!c)continue;c.fillStyle='#193c46';c.fillRect(0,0,768,144);c.fillStyle='#eacb86';c.textAlign='center';c.font='500 26px \"PingFang SC\",sans-serif';c.fillText('海湾体育场',384,40);c.fillStyle='#f4f1e6';c.font='500 47px \"PingFang SC\",sans-serif';c.fillText(shot?'第 '+Math.min(5,shot.round+1)+' 球 · 命中 '+shot.goals+' / 5':'跑道计时 · 五球挑战',384,106);board.map.needsUpdate=true;}}for(const ball of balls){const t=shot?.phase==='flight'?Math.min(1,shot.elapsed/1.05):['result','finished'].includes(shot?.phase)?1:0,power=shot?.power||0,height=power>.88?3.8:Math.max(.22,power*1.7);const saved=shot&&Math.abs(shot.aim-shot.keeper)<.95&&Math.abs(shot.aim)<=3.05&&power>=.28&&power<=.88,bounce=saved?Math.max(0,(t-.9)*10):0;ball.position.set((shot?.aim||0)*t+bounce*Math.sign(shot?.aim||1)*.8,.22+(height-.22)*t+Math.sin(t*Math.PI)*(1+power*2),-12-(power<.28?6.5:11)*t+bounce*3);ball.rotation.x=-t*26;ball.rotation.z=-t*(shot?.aim||0)*2;}
    for(const keeper of keepers){const t=shot?.phase==='flight'?Math.min(1,shot.elapsed/.75):['result','finished'].includes(shot?.phase)?1:0;keeper.group.position.x=shot?.keeper||0;keeper.group.rotation.z=-Math.sign(shot?.keeper||0)*t*.65;keeper.arms[0].rotation.z=-.7-t*.6;keeper.arms[1].rotation.z=.7+t*.6;}
    for(const lamp of lamps){lamp.light.visible=lamp.inside?state.interior?.id===lamp.inside:!state.interior&&ArcadeCityWorld.distance(state.player,lamp.place)<115;lamp.light.intensity=nightMode?lamp.night:lamp.day;}
  }
  let nightMode=false;function lighting(night){nightMode=night;lit.emissiveIntensity=night?2.8:.35;}
  return {stationExterior,stationInterior,stadium,update,lighting,dispose(){for(const geo of owned)geo.dispose();for(const map of textures)map.dispose();for(const mat of mats)mat.dispose();}};
};
