/* A tapered curtain-wall landmark with a real-world rooftop and moving lift. */
window.ArcadeCitySkyscraper=(T,{scene,exterior,detail,material,person},state)=>{
  const place=state.places.find(p=>p.id==='skyline'),owned=new Set(),maps=[],mats=[],cube=new T.BoxGeometry(1,1,1);owned.add(cube);
  const stone=detail.finish(3),wood=detail.finish(0),dark=material(0x243c49),silver=material(0xc4d2d3,0,'cladding'),brass=material(0xbd9c65);
  const clear=new T.MeshPhysicalMaterial({color:0xbedde0,transparent:true,opacity:.25,roughness:.13,metalness:.15,side:T.DoubleSide,depthWrite:false});mats.push(clear);
  const light=new T.MeshStandardMaterial({color:0xffefd2,emissive:0xffd399,emissiveIntensity:.25});mats.push(light);
  function mesh(root,g,m,x,y,z,w=1,h=1,d=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const box=(r,m,x,y,z,w,h,d)=>mesh(r,cube,m,x,y,z,w,h,d);
  function surface(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(ctx)paint(ctx,w,h);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;maps.push(map);return map;}
  function sign(root,text,x,y,z,w=5,angle=0){const map=surface(768,160,(c,W,H)=>{c.fillStyle='#183a47';c.fillRect(0,0,W,H);c.fillStyle='#dec28b';c.fillRect(10,H-9,W-20,2);c.fillStyle='#f4efdf';c.font='500 53px "PingFang SC",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2,W-30);});const mat=new T.MeshBasicMaterial({map});mats.push(mat);const geo=ArcadeCityArchitecture.signGeometry(T,w,w*160/768);owned.add(geo);const o=mesh(root,geo,mat,x,y,z);o.rotation.y=angle;o.castShadow=false;return o;}
  function batch(root){const groups=new Map();for(const o of root.children){if(!o.isMesh||o.geometry!==cube||o.userData.moving)continue;const key=o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}for(const list of groups.values()){if(list.length<4)continue;const inst=new T.InstancedMesh(cube,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();inst.setMatrixAt(i,o.matrix);root.remove(o);});inst.instanceMatrix.needsUpdate=true;inst.castShadow=inst.receiveShadow=true;root.add(inst);}}
  const root=new T.Group();root.name='cloudline-skyscraper';root.position.set(place.x,0,place.z);exterior.add(root);
  // Continue only beyond the existing terrain's edges; no new surface is
  // inserted beneath the playable forest, stream, pond or tunnel portals.
  for(const [x,z,w,d]of [[-226,1969,1220,3062],[-226,-2083,1220,2834],[-2126,0,2580,7000]]){const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);owned.add(g);const horizon=mesh(exterior,g,material(0x9aa88e,0,'grass-land'),x,-1.4,z);horizon.name='distant-coastal-plain';horizon.castShadow=horizon.receiveShadow=false;}
  const facadeMap=surface(1024,512,(c,W,H)=>{
    c.fillStyle='#698e9c';c.fillRect(0,0,W,H);const photo=T.Cache?.get('/games/textures/facade-v1.jpg');if(photo){c.globalAlpha=.24;c.drawImage(photo,0,0,W,H);c.globalAlpha=1;}
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){const n=(x*17+y*29)%11;c.fillStyle=['#a0c0c842','#284b6540','#d7e0dc33'][n%3];c.fillRect(x*128+3,y*64+3,122,54);c.fillStyle='#284854';c.fillRect(x*128,y*64,2,64);c.fillRect(x*128,y*64+58,128,6);c.fillStyle='#c5d2cd88';c.fillRect(x*128+3,y*64+3,121,1);}
  });
  const officeMap=surface(1024,512,c=>{c.fillStyle='#000';c.fillRect(0,0,1024,512);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x*17+y*29)%7<2){c.fillStyle=(x+y)%3?'#d8bb79':'#b7d3d3';c.fillRect(x*128+9,y*64+12,110,41);}});
  for(const map of [facadeMap,officeMap])map.wrapS=map.wrapT=T.RepeatWrapping;
  const curtain=new T.MeshStandardMaterial({map:facadeMap,metalness:.48,roughness:.29,emissive:0xffdfaf,emissiveMap:officeMap,emissiveIntensity:0});curtain.name='cloudline-curtain-wall';mats.push(curtain);
  function outline(w,d){const c=2.6;return [[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];}
  function shaft(bottom,top,w0,d0,w1,d1){const a=outline(w0,d0),b=outline(w1,d1),pos=[],uv=[],index=[];for(let i=0;i<8;i++){const j=(i+1)%8,k=pos.length/3,len=Math.hypot(a[j][0]-a[i][0],a[j][1]-a[i][1]);for(const [p,y]of [[a[i],bottom],[a[j],bottom],[b[i],top],[b[j],top]])pos.push(p[0],y,p[1]);uv.push(0,0,len/12.8,0,0,(top-bottom)/28.8,len/12.8,(top-bottom)/28.8);index.push(k,k+2,k+1,k+1,k+2,k+3);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();geo.computeBoundingSphere();owned.add(geo);const o=mesh(root,geo,curtain,0,0,0);o.name='cloudline-tapered-shaft';}
  // The podium remains inside its reserved parcel, with a clear southern entry.
  box(root,stone,0,.04,1,44,.08,46);box(root,stone,0,1,0,31,2,33);box(root,curtain,0,5.2,0,30,6.4,32);box(root,silver,0,9,0,32,.65,34);
  for(const x of [-13,-8,-3,3,8,13])box(root,silver,x,4.7,16.1,.15,7.4,.2);
  box(root,dark,0,3.3,16.25,6.6,6.6,.18);for(const x of [-1.5,1.5])box(root,clear,x,2.8,16.4,2.8,5.4,.08);
  box(root,silver,0,6.6,18.2,11,.18,4.2);sign(root,'云际中心',0,8,17.25,11);sign(root,'186 m · 全景观景台',0,5.5,18.4,6);
  shaft(9.4,123,28,30,25,27);box(root,silver,0,123.2,0,25.6,.6,27.6);shaft(123.5,165,23.6,25.6,21.8,23.8);box(root,silver,0,165.3,0,22.4,.6,24.4);shaft(165.6,185.5,21.5,23.5,20.8,22.8);
  for(const [x,z]of outline(28,30)){const top=new T.Vector3(x*.745,185.6,z*.76),start=new T.Vector3(x,9.4,z),v=top.clone().sub(start),fin=box(root,silver,(start.x+top.x)/2,(start.y+top.y)/2,(start.z+top.z)/2,.18,v.length(),.18);fin.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
  for(let y=13;y<184;y+=3.6){const scale=y<123?1-(y-9)*.0009:y<165?.83:.76;for(const side of [-1,1]){box(root,silver,0,y,side*15*scale,27.8*scale,.055,.09);box(root,silver,side*14*scale,y,0,.09,.055,29.8*scale);}}
  // A full-size public deck at its actual world elevation, not a duplicate room.
  const deck=new T.Group();deck.name='cloudline-observation-deck';deck.position.y=place.elevation;root.add(deck);box(deck,stone,0,-.25,0,26,.5,30);
  const floorGeo=new T.PlaneGeometry(25.5,29.5);floorGeo.rotateX(-Math.PI/2);const uv=floorGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*8,uv.getY(i)*9);owned.add(floorGeo);mesh(deck,floorGeo,stone,0,.015,0);
  for(const side of [-1,1]){
    box(deck,clear,side*12.6,.75,0,.08,1.5,29.6).castShadow=false;box(deck,silver,side*12.6,1.5,0,.07,.06,29.6);
    box(deck,clear,0,.75,side*14.6,25.2,1.5,.08).castShadow=false;box(deck,silver,0,1.5,side*14.6,25.2,.06,.07);
    for(let x=-12;x<=12;x+=3)box(deck,silver,x,.75,side*14.6,.06,1.5,.06);for(let z=-12;z<=12;z+=3)box(deck,silver,side*12.6,.75,z,.06,1.5,.06);
    box(deck,light,0,.08,side*14.4,25,.035,.04);box(deck,light,side*12.4,.08,0,.04,.035,29);
  }
  box(deck,dark,-6.5,3.2,-4,6,6.4,9);for(let i=0;i<8;i++)box(deck,silver,-9.5+i*.85,7+i*.8,-4,.1,5+i*1.6,9.5);box(deck,silver,-6.5,14,-4,.18,28,.18);
  for(const [x,z]of [[4.5,-5],[-3,8]]){for(let i=0;i<5;i++)box(deck,wood,x,.52,z+(i-2)*.17,3.4,.07,.13);box(deck,wood,x,.9,z-.5,3.4,.7,.1);for(const side of [-1,1])box(deck,dark,x+side*1.3,.26,z,.12,.52,.9);}
  for(const v of ArcadeCityWorld.skyViews){const g=new T.Group();g.name='cloudline-view:'+v.id;g.position.set(v.x,0,v.z);g.rotation.y=-v.yaw;deck.add(g);box(g,dark,0,.65,0,.12,1.3,.12);box(g,brass,0,1.4,-.12,.55,.25,.65).rotation.x=-.25;sign(g,v.name,0,.78,.17,1.75);batch(g);}
  sign(deck,'观光电梯 · 一层大堂',10,2.4,5.7,3.8);box(deck,silver,12.7,-.07,3,7.4,.16,3);
  // Transparent exterior shaft and a genuinely moving glazed cabin.
  for(const z of [1.4,4.6])box(root,silver,18.1,93,z,.1,186,.1);box(root,clear,18.15,93,3,.04,186,3.2).castShadow=false;
  const cabin=new T.Group();cabin.name='cloudline-glass-elevator';cabin.position.set(16.5,0,3);root.add(cabin);box(cabin,silver,0,-.12,0,3,.24,3);box(cabin,silver,0,2.8,0,3,.16,3);
  for(const side of [-1,1]){box(cabin,clear,side*1.45,1.35,0,.05,2.7,2.9).castShadow=false;box(cabin,clear,0,1.35,side*1.45,2.9,2.7,.05).castShadow=false;for(const z of [-1.4,1.4])box(cabin,silver,side*1.4,1.35,z,.05,2.7,.05);box(cabin,silver,side*1.4,1,0,.04,.05,2.8);}
  box(cabin,light,0,2.68,0,2.4,.04,.15);batch(cabin);batch(deck);batch(root);
  let night=false;
  function lobby(parent){
    const r=new T.Group();r.name='cloudline-lobby';parent.add(r);
    box(r,stone,0,-.15,0,28,.3,28);for(const side of [-1,1]){box(r,stone,side*14,4.2,0,.25,8.4,28);box(r,stone,0,4.2,side*14,28,8.4,.25);}
    box(r,dark,0,4.2,-11.2,8,8.4,2);for(const x of [-1.2,1.2]){box(r,silver,x,2.7,-10.1,2.3,5.4,.08);box(r,brass,x+(x<0?-1.25:1.25),2.5,-10,.1,.6,.08);}
    sign(r,'186 m · 全景观景台',0,6.6,-9.95,7);sign(r,'云际中心',-8,4.8,-10,8);sign(r,'出口',0,3.5,13.8,3.5,Math.PI);
    box(r,wood,-8,.6,1,7,1.2,2);box(r,stone,-8,1.25,1,7.3,.12,2.2);
    for(const z of [-3,3]){box(r,wood,7,.5,z,3.6,.25,1.1);box(r,dark,7,.85,z-.5,3.6,.8,.15);}
    for(const x of [-11,11])for(const z of [-10,10]){box(r,stone,x,.35,z,.9,.7,.9);const g=new T.PlaneGeometry(2.2,2.8);owned.add(g);for(const angle of [0,Math.PI/2]){const plant=mesh(r,g,detail.plant(x<0?0:3,true),x,2,z);plant.rotation.y=angle;}}
    box(r,stone,0,8.4,0,28,.2,28);for(const x of [-8,0,8]){box(r,light,x,8.2,0,.12,.05,18);const lamp=new T.PointLight(0xffe1b6,60,22,2);lamp.position.set(x,6,0);r.add(lamp);}
    const staff=person(0x718c98,2);staff.group.position.set(-8,0,-.7);r.add(staff.group);batch(r);return r;
  }
  function update(w){cabin.position.y=w.onTower==='skyline'?w.elevation:0;curtain.emissiveIntensity=night?.65:0;light.emissiveIntensity=night?2.3:.25;deck.visible=!w.interior;}
  return {lobby,update,lighting(value){night=value;},dispose(){for(const g of owned)g.dispose();for(const t of maps)t.dispose();for(const m of mats)m.dispose();}};
};
