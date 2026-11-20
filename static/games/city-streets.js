/* City-wide street furniture, luminous fixtures and a bounded pool of real lights. */
window.ArcadeCityStreets=(T,{state,exterior,batch,material})=>{
  const plan=ArcadeCityArchitecture.infrastructure(state.roads),Sim=ArcadeCityWorld,Terrain=ArcadeCityTerrain,lamps=[];let night=false,lightClock=0;
  for(const p of plan.sidewalks){const length=p.axis==='z'?p.d:p.w,count=Math.max(1,Math.ceil(length/2));for(let i=0;i<count;i++){const k=(i+.5)/count-.5,x=p.x+(p.axis==='x'?k*length:0),z=p.z+(p.axis==='z'?k*length:0);if(Terrain.facilityAllowed(state,x,z))batch(x,.09,z,p.axis==='x'?length/count:p.w,.18,p.axis==='z'?length/count:p.d,0xd9d8d0,'box',p.axis==='z'?'paving-v':'paving-h');}}
  for(const p of [...plan.crossings,...plan.stopLines])if(Terrain.facilityAllowed(state,p.x,p.z))batch(p.x,.075,p.z,p.w,.018,p.d,0xf2efe5,'box','road-marking');
  const poleColor=0x465b63;
  for(const lamp of plan.lamps){
    if(!Terrain.facilityAllowed(state,lamp.x,lamp.z))continue;
    if(Sim.blocked(state,lamp.x,lamp.z,.22))continue;
    if([...state.cars,...state.traffic].some(v=>Math.hypot(v.x-lamp.x,v.z-lamp.z)<2.5))continue;
    lamps.push(lamp);batch(lamp.x,lamp.h/2,lamp.z,.16,lamp.h,.16,poleColor,'cylinder');
    batch(lamp.x,.25,lamp.z,.32,.5,.32,poleColor,'cylinder');
    batch((lamp.x+lamp.headX)/2,lamp.h-.2,(lamp.z+lamp.headZ)/2,Math.abs(lamp.headX-lamp.x)+.16,.12,Math.abs(lamp.headZ-lamp.z)+.16,poleColor);
    batch(lamp.headX,lamp.h-.2,lamp.headZ,lamp.axis==='z'?.8:.42,.2,lamp.axis==='z'?.42:.8,poleColor);
    batch(lamp.headX,lamp.h-.32,lamp.headZ,lamp.axis==='z'?.65:.3,.06,lamp.axis==='z'?.3:.65,0xffecd2,'box','lamp-lens');
    Sim.addCollider(state,{x:lamp.x,z:lamp.z,w:.34,d:.34,h:lamp.h});
  }
  for(const sign of plan.signs){
    if(!Terrain.facilityAllowed(state,sign.x,sign.z))continue;
    if(Sim.blocked(state,sign.x,sign.z,.2))continue;
    batch(sign.x,1.8,sign.z,.09,3.6,.09,poleColor,'cylinder');
    batch(sign.x,3.35,sign.z,2.7,.55,1,0xffffff,'sign-'+(ArcadeCityArchitecture.shopNames.length+sign.street),'signage');
    batch(sign.x,2.77,sign.z,2.7,.55,1,0xffffff,'sign-'+(ArcadeCityArchitecture.shopNames.length+sign.crossStreet),'signage',Math.PI/2);
    Sim.addCollider(state,{x:sign.x,z:sign.z,w:.12,d:.12,h:3.6});
  }
  // One instanced glow/pool draw each; only nearby fixtures use full dynamic lights.
  const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.pow(Math.max(0,1-radius),2)*255);}
  const glowTexture=new T.DataTexture(data,size,size);glowTexture.needsUpdate=true;
  const pools=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:glowTexture,color:0xffc982,transparent:true,opacity:.3,depthWrite:false,blending:T.AdditiveBlending}),lamps.length);pools.name='street-light-pools';pools.frustumCulled=false;exterior.add(pools);
  const halos=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:glowTexture,color:0xffd8a0,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}),lamps.length);halos.name='street-light-halos';halos.frustumCulled=false;exterior.add(halos);
  const dummy=new T.Object3D();lamps.forEach((p,i)=>{dummy.position.set(p.headX,.096,p.headZ);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(13,13,1);dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix);});pools.instanceMatrix.needsUpdate=true;
  const lights=Array.from({length:8},(_,i)=>{const light=new T.SpotLight(0xffd3a0,0,24,.95,.7,2);light.name='street-spotlight-'+i;light.castShadow=false;exterior.add(light,light.target);return light;});
  const lens=material(0xffffff,0,'lamp-lens'),windows=material(0xffffff,0,'window-light');
  function lighting(value){night=value;lens.emissiveIntensity=night?4:0;windows.emissiveIntensity=night?1.1:0;pools.visible=halos.visible=night;lightClock=Infinity;for(const light of lights){light.intensity=0;light.visible=false;}}
  function update(dt,camera){
    if(!night)return;
    if(!state.interior){
      lamps.forEach((p,i)=>{dummy.position.set(p.headX,p.h-.32,p.headZ);dummy.quaternion.copy(camera.quaternion);dummy.scale.set(1.3,1.3,1);dummy.updateMatrix();halos.setMatrixAt(i,dummy.matrix);});halos.instanceMatrix.needsUpdate=true;
    }
    lightClock+=dt;if(lightClock<.3)return;lightClock=0;
    const nearest=lamps.map(p=>({p,d:Math.hypot(p.headX-state.player.x,p.headZ-state.player.z)})).sort((a,b)=>a.d-b.d).slice(0,lights.length);
    lights.forEach((light,i)=>{const item=nearest[i];light.visible=!!item&&item.d<45&&!state.interior;light.intensity=light.visible?190:0;if(item){const p=item.p;light.position.set(p.headX,p.h-.36,p.headZ);light.target.position.set(p.headX,0,p.headZ);light.target.updateMatrixWorld();}});
  }
  lighting(false);
  return {plan,lamps,lights,lighting,update,dispose:()=>glowTexture.dispose()};
};
