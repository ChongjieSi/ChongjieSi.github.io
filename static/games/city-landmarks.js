/* Distinct urban destinations and walkable interior sets. */
window.ArcadeCityLandmarks = (T,{scene,exterior,box,material,person,detail},world) => {
  const Sim=ArcadeCityWorld,interiors=new Map(),animated=[],signTextures=[];let parcel=null;
  function add(geo,mat,x,y,z,parent=exterior){const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function text(label,x,y,z,width=8,parent=exterior,rotation=0){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');
    if(ctx){ctx.fillStyle='#253d49';ctx.fillRect(0,0,512,96);ctx.font='600 44px "PingFang SC",sans-serif';ctx.fillStyle='#f0e8d7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,49);}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;signTextures.push(texture);
    const mesh=add(ArcadeCityArchitecture.signGeometry(T,width,width*96/512),new T.MeshBasicMaterial({map:texture,side:T.FrontSide}),x,y,z,parent);mesh.rotation.y=rotation;return mesh;
  }
  const stone=material(0xd6d2c6),white=material(0xe5e5dc),metal=material(0x637982),glass=material(0x405b6b,0,'glass');
  const doorBeacons=[];
  for(const place of world.places){
    const {x,z}=place;
    if(place.kind==='stadium'){
      const plaza=box(x,.005,z,66,.03,66,0xd2d4ca,exterior,'limestone');plaza.castShadow=false;
      const field=box(x,.08,z,29,.16,39,0x7c9a6c,exterior,'grass-park');field.castShadow=false;
      for(let level=0;level<5;level++){
        const ring=add(new T.RingGeometry(16.6+level*1.1,18+level*1.1,72),material(level%2?0xb9b8ad:0xd3d0c2),x,1.2+level*.85,z);ring.rotation.x=-Math.PI/2;ring.scale.set(1.06,1,1);
      }
      const canopy=add(new T.TorusGeometry(21.7,1.4,10,72),white,x,11.5,z);canopy.rotation.x=Math.PI/2;canopy.scale.set(1.06,1,1);
      for(let i=0;i<24;i++){const a=i*Math.PI/12;box(x+Math.cos(a)*23,6,z+Math.sin(a)*22,.28,11,.28,0x7b8c8e,exterior);}
      for(const dx of [-21,21])for(const dz of [-21,21]){box(x+dx,9,z+dz,.45,18,.45,0x78878b,exterior);box(x+dx,18,z+dz,4,1,.5,0xe5dfbd,exterior);}
      text(place.name,x,6,z+25.15,13);
    }else if(place.kind==='museum'){
      box(x,4,z,42,8,36,0xe3dfd0,exterior);box(x,4,z+18.1,30,6,.16,0x738e9b,exterior,'glass');
      const roof=add(new T.SphereGeometry(1,32,14,0,Math.PI*2,0,Math.PI/2),white,x,8,z);roof.scale.set(24,7,20);
      for(let dx=-16;dx<=16;dx+=8)box(x+dx,4,z+20,.65,8,.65,0xe7e3d8,exterior);
      box(x,.2,z+20,38,.4,4,0xc2bbaa,exterior);text(place.name,x,7,z+20.4,16);
    }else if(place.id==='tower'){
      box(x,31,z,17,62,17,0xdce5e7,exterior,'facade:7:2');
      for(const dx of [-9,9])for(const dz of [-9,9])box(x+dx,34,z+dz,.7,68,.7,0x8b9b9e,exterior);
      const deck=add(new T.CylinderGeometry(15,12,2.2,32),white,x,70,z);deck.receiveShadow=true;
      const rail=add(new T.TorusGeometry(14.4,.12,6,48),metal,x,72.3,z);rail.rotation.x=Math.PI/2;
      for(let i=0;i<32;i++){const a=i*Math.PI/16;box(x+Math.cos(a)*14.4,71.8,z+Math.sin(a)*14.4,.06,1.2,.06,0x6c858b,exterior);}
      box(x+8,74,z+7,4,6,4,0x69848e,exterior,'glass');
      for(const dx of [-10,10])for(const dz of [-10,10])box(x+dx,76,z+dz,.4,12,.4,0x81999f,exterior);
      const top=add(new T.ConeGeometry(15.5,8,32),metal,x,85,z);box(x,93,z,.22,10,.22,0x829aa4,exterior);text(place.name,x,8,z+8.6,11);
    }else if(place.id==='lighthouse'){
      add(new T.CylinderGeometry(4.1,6.4,23,32),white,x,11.5,z);
      for(const y of [7.5,15])add(new T.CylinderGeometry(5.7-y*.055,5.7-y*.055+.1,1.5,32),material(0xb76652),x,y,z);
      add(new T.CylinderGeometry(7,7,1,32),white,x,24.5,z);add(new T.CylinderGeometry(3.2,3.2,4.5,16),glass,x,27,z);
      add(new T.ConeGeometry(5.3,3.5,24),material(0x9b6b51),x,31,z);
      const rail=add(new T.TorusGeometry(6.3,.09,6,40),metal,x,26,z);rail.rotation.x=Math.PI/2;
      const glow=add(new T.SphereGeometry(.65,12,10),new T.MeshBasicMaterial({color:0xffebba}),x,27,z);animated.push({type:'lamp',mesh:glow});
    }else if(place.kind==='surf'){
      box(x,2.6,z,18,5.2,24,0x9b8262,exterior);box(x,5.4,z,20,.35,26,0x607d77,exterior);box(x-9.1,2.2,z,0.1,3.4,8,0x527683,exterior,'glass');
      for(let i=0;i<4;i++){const board=add(new T.CapsuleGeometry(.35,2.7,4,12),material([0xc9b68c,0x8eada6,0xb98a74,0xd5cfb0][i]),x-9.5,2.2,z-8+i*1.05);board.scale.set(1,1,.17);board.rotation.z=.12;}
      text(place.name,x-9.3,4.2,z,9,exterior,-Math.PI/2);
    }else if(place.kind==='station'){
      box(x,4.5,z,42,9,24,0xd5c6ad,exterior,'facade:1:4');
      const roof=add(new T.CylinderGeometry(8,8,46,24,1,false,0,Math.PI),material(0x728b8f),x,10,z);roof.rotation.z=Math.PI/2;
      for(let dx=-16;dx<=16;dx+=8)box(x+dx,3.2,z+12.1,4.5,6,.12,0x547483,exterior,'glass');text(place.name,x,8.2,z+12.3,15);
      text('车辆检修',x+12,2.8,z+12.25,6);
      const padZ=place.door.z+2;for(const side of [-1,1]){box(x+side*4.5,.08,padZ,.12,.025,6,0x87b5bd,exterior).castShadow=false;box(x,.08,padZ+side*3,9,.025,.12,0x87b5bd,exterior).castShadow=false;}
    }else if(place.kind==='pier'){
      for(let px=330;px<414;px+=2)box(px,.02,z,1.9,.12,16,0x9a896d,exterior);
      for(let px=332;px<=412;px+=8)for(const dz of [-7.5,7.5]){box(px,.6,z+dz,.13,1.3,.13,0xc1b195,exterior);box(px,-1.4,z+dz,.4,3,.4,0x6d7064,exterior);}
      for(const dz of [-7.5,7.5])box(372,1.1,z+dz,84,.11,.11,0xc1b195,exterior);
      text(place.name,331,3,z,8,exterior,-Math.PI/2);
    }else{
      box(x,3.2,z,18,6.4,16,0xf0e6d5,exterior,'facade:1:2');box(x,3,z+8.08,14,4,.16,0x536e78,exterior,'glass');box(x,4.8,z+9,17,.16,2.4,0x627b6a,exterior);text(place.name,x,5.8,z+8.2,10);
      for(const dx of [-6,6]){box(x+dx,.6,z+10,1.5,.15,1.5,0x8c7458,exterior);}
    }
    const ring=add(new T.TorusGeometry(1.1,.055,6,32),new T.MeshBasicMaterial({color:0xa8d3c4,transparent:true,opacity:.75}),place.door.x,.2,place.door.z);ring.rotation.x=-Math.PI/2;doorBeacons.push(ring);
  }
  function interior(place){
    const spec=Sim.room(place.id),root=new T.Group();root.name='interior:'+place.id;root.visible=false;scene.add(root);
    const floorColor=spec.kind==='stadium'?0x849b76:spec.kind==='museum'?0xd7d0bf:0xb6a58d;
    const roomFloor=box(0,-.15,0,spec.width,.3,spec.depth,floorColor,root,spec.kind==='stadium'?'grass-park':'paint');if(detail&&spec.kind!=='stadium')roomFloor.material=detail.finish(spec.kind==='cafe'?15:3);
    if(spec.kind!=='stadium'){
      box(0,spec.height/2,-spec.depth/2,spec.width,spec.height,.25,0xe7e2d6,root);
      box(-spec.width/2,spec.height/2,0,.25,spec.height,spec.depth,0xd9d5c8,root);box(spec.width/2,spec.height/2,0,.25,spec.height,spec.depth,0xd9d5c8,root);
      box(-spec.width/4-1,spec.height/2,spec.depth/2,spec.width/2-2,spec.height,.25,0xe7e2d6,root);box(spec.width/4+1,spec.height/2,spec.depth/2,spec.width/2-2,spec.height,.25,0xe7e2d6,root);
      box(0,spec.height+.1,0,spec.width,.2,spec.depth,0xe8e3d7,root);
      for(const x of [-spec.width*.25,spec.width*.25]){const light=new T.PointLight(0xffe3b6,70,24,2);light.position.set(x,spec.height-.4,0);root.add(light);}
      box(0,1.5,spec.depth/2-.05,3.8,3,.13,0x637e88,root,'glass');
      text('出口',0,3.3,spec.depth/2-.2,3,root,Math.PI);
    }
    if(spec.kind==='cafe'){
      for(const [x,z]of [[-7,1],[7,1],[-7,-5],[7,-5]]){
        add(new T.CylinderGeometry(1.4,1.4,.15,20),material(0x9e8060),x,1,z,root);box(x,.5,z,.3,1,.3,0x6e7468,root);
        for(const dx of [-2,2]){box(x+dx,.5,z,.8,.14,.8,0x7d927e,root);box(x+dx,.25,z,.2,.5,.2,0x6d7469,root);}
        add(new T.CylinderGeometry(.13,.1,.22,10),white,x,1.2,z,root);
      }
      box(0,1,-8,16,2,2,0x8f7459,root);box(0,2.1,-8,16,.16,2.2,0xc7bba5,root);
      parcel=new T.Group();parcel.name='coffee-pickup';root.add(parcel);box(0,2.45,-7.5,.8,.6,.55,0xb08d62,parcel);box(0,2.45,-7.21,.13,.6,.02,0xe1cda6,parcel);parcel.visible=false;
      const staff=person(0x6c8c7b,1);root.add(staff.group);staff.group.position.set(0,0,-6.8);staff.group.rotation.y=0;
      text('COAST COFFEE',0,3.4,-10.8,11,root);
    }else if(spec.kind==='museum'){
      for(const e of Sim.exhibits){box(e.x,.55,e.z,2.5,1.1,2.5,0xe4e1d7,root);text(e.label,e.x,1,e.z+1.3,2.7,root);}
      const tide=add(new T.TorusGeometry(1.3,.13,10,36),metal,-12,2.6,-6,root);animated.push({type:'sculpture',mesh:tide});
      const sail=add(new T.ConeGeometry(1.5,3.5,3),white,0,2.9,-7,root);sail.rotation.z=.2;
      for(let i=0;i<4;i++)box(12+(i%2-.5)*.8,1.5+i*.35,-6,(4-i)*.6,.5,(4-i)*.6,[0x829ea6,0xbd9c78,0xa8b3a1,0xd5c9b4][i],root);
      text('潮汐 · 风 · 城市',0,4.5,-15.7,16,root);
    }else if(spec.kind==='stadium'){
      box(0,.015,0,31,.03,48,0xcbd5b4,root);box(0,.035,0,29.7,.035,46.7,0x7e9e70,root,'grass-park');
      box(0,.06,0,30,.025,.1,0xf1f0df,root);
      const circle=add(new T.TorusGeometry(4,.045,4,48),white,0,.065,0,root);circle.rotation.x=-Math.PI/2;
      for(const z of [-24,24]){box(0,.075,z,30,.03,.12,0xf1f0df,root);box(0,1,z,.12,2,.12,0xf0efde,root);for(const x of [-3,3])box(x,1,z,.12,2,.12,0xf0efde,root);box(0,2,z,6,.12,.12,0xf0efde,root);}
      for(const side of [-1,1])for(let tier=0;tier<4;tier++)box(side*(19+tier*1.5),tier*.7+.5,0,1.4,1.1,64,tier%2?0xaab9bd:0xd0d3c5,root);
      const coach=person(0x6e95a4,2);root.add(coach.group);coach.group.position.set(-16,0,28);
      text('E 开始训练',-16,2.8,28,5,root);
    }
    if(detail&&spec.kind!=='stadium'){
      root.traverse(o=>{const color=o.material?.color?.getHex?.();if([0xe7e2d6,0xd9d5c8,0xe8e3d7].includes(color))o.material=detail.finish(5);else if([0x9e8060,0x8f7459,0x8c7458].includes(color))o.material=detail.finish(1);else if(color===0x7d927e)o.material=detail.finish(8,0x92a591);else if(color===0xc7bba5)o.material=detail.finish(11);});
      for(const side of [-1,1]){box(side*spec.width*.29,2.9,-spec.depth/2+.11,3.1,2.2,.08,0x665442,root);const painting=add(new T.PlaneGeometry(2.95,2.05),detail.decal(side<0?1:2),side*spec.width*.29,2.9,-spec.depth/2+.16,root);const x=side*(spec.width/2-1.4),z=-spec.depth/2+1.5;add(new T.CylinderGeometry(.33,.25,.55,16),detail.finish(11),x,.28,z,root);for(const angle of [0,Math.PI/2]){const p=add(new T.PlaneGeometry(1.6,2),detail.plant(side<0?0:3,true),x,1.5,z,root);p.rotation.y=angle;}}
    }
    const exitRing=add(new T.TorusGeometry(.8,.06,6,24),new T.MeshBasicMaterial({color:0x92c5b0}),spec.exit.x,.1,spec.exit.z,root);exitRing.rotation.x=-Math.PI/2;
    interiors.set(place.id,root);return root;
  }
  for(const place of world.places.filter(p=>['cafe','museum','stadium'].includes(p.kind)))interior(place);
  const checks=Sim.checkpoints.map((point,i)=>{const group=new T.Group();interiors.get('stadium').add(group);group.position.set(point.x,0,point.z);const ring=add(new T.TorusGeometry(1.5,.1,8,32),new T.MeshBasicMaterial({color:0xf1c873}),0,.2,0,group);ring.rotation.x=-Math.PI/2;add(new T.ConeGeometry(.3,1,10),material(0xd5a65d),0,.5,0,group);return group;});
  function update(state){
    if(parcel)parcel.visible=state.job?.id==='coffee'&&state.job.phase==='pickup';
    for(const [id,group]of interiors)group.visible=state.interior?.id===id;
    for(let i=0;i<checks.length;i++)checks[i].visible=!!state.trial&&state.trial.index===i;
    for(const value of animated)if(value.type==='sculpture')value.mesh.rotation.y=state.time*.12;
    doorBeacons.forEach((ring,i)=>{ring.visible=Sim.distance(state.player,world.places[i].door)<65;ring.material.opacity=.4+Math.sin(state.time*1.8+i)*.12;});
  }
  function dispose(){signTextures.forEach(t=>t.dispose());}
  return {update,dispose,interiors};
};
