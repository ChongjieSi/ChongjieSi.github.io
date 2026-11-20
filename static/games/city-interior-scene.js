/* Detailed, walkable interiors. Four rooms are retained; all other addresses are lazy. */
window.ArcadeCityInteriorScene=(T,{scene,detail,material,sky})=>{
  const rooms=new Map(),shared=new Set(),unitBox=new T.BoxGeometry(1,1,1),unitSphere=new T.SphereGeometry(1,16,10),unitCylinder=new T.CylinderGeometry(.5,.5,1,16);shared.add(unitBox);shared.add(unitSphere);shared.add(unitCylinder);
  const shape=new T.Shape();shape.moveTo(-.4,-.5);shape.lineTo(.4,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.4);shape.lineTo(.5,.4);shape.quadraticCurveTo(.5,.5,.4,.5);shape.lineTo(-.4,.5);shape.quadraticCurveTo(-.5,.5,-.5,.4);shape.lineTo(-.5,-.4);shape.quadraticCurveTo(-.5,-.5,-.4,-.5);
  const rounded=new T.ExtrudeGeometry(shape,{depth:.9,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:3,steps:1,curveSegments:4});rounded.translate(0,0,-.45);shared.add(rounded);
  const wood=detail.finish(1),oak=detail.finish(0),white=material(0xece7de),metal=detail.finish(10),ceramic=detail.finish(11),dark=material(0x263943),lamp=new T.MeshStandardMaterial({color:0xfff4d6,emissive:0xffe5b7,emissiveIntensity:1.2});
  function mesh(geometry,mat,x,y,z,w,h,d,parent){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const cube=(x,y,z,w,h,d,mat,parent,soft=false)=>mesh(soft?rounded:unitBox,mat,x,y,z,w,h,d,parent);
  const cylinder=(x,y,z,w,h,d,mat,parent)=>mesh(unitCylinder,mat,x,y,z,w,h,d,parent);
  const ball=(x,y,z,w,h,d,mat,parent)=>mesh(unitSphere,mat,x,y,z,w,h,d,parent);
  function plane(x,y,z,w,h,mat,parent,rotation=0,tile=false){const g=new T.PlaneGeometry(w,h);if(tile){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/2,uv.getY(i)*h/2);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.rotation.y=rotation;m.receiveShadow=true;parent.add(m);return m;}
  function label(text,x,y,z,w,parent,rotation=0){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#34554f';ctx.fillRect(0,0,768,128);ctx.font='500 42px "PingFang SC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f3eddb';ctx.fillText(text,384,65);}const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map});parent.userData.ownedTextures.push(map);parent.userData.ownedMaterials.push(mat);return plane(x,y,z,w,w/6,mat,parent,rotation);}
  function plant(parent,x,y,z,size=1,variant=0){cylinder(x,y+.2*size,z,.48*size,.4*size,.48*size,ceramic,parent);for(const angle of [0,Math.PI/2]){const p=plane(x,y+1.02*size,z,1.3*size,1.6*size,detail.plant(variant,true),parent,angle);p.castShadow=true;}}
  function legs(parent,w,d,y=.4){for(const x of [-w*.4,w*.4])for(const z of [-d*.38,d*.38])cube(x,y/2,z,.08,y,.08,metal,parent);}
  function tabletop(parent,w,d,height=.8,mat=wood){cube(0,height,0,w,.12,d,mat,parent,true);legs(parent,w,d,height-.07);}
  function chair(parent,w,d,cloth){cube(0,.47,0,w,.15,d,cloth,parent,true);cube(0,.91,-d*.42,w,.78,.12,cloth,parent,true);legs(parent,w,d,.4);}
  function picture(parent,x,y,z,w,h,index,rotation=0){const frame=new T.Group();frame.position.set(x,y,z);frame.rotation.y=rotation;parent.add(frame);cube(0,0,0,w+.13,h+.13,.08,wood,frame);plane(0,0,.048,w,h,detail.decal(index),frame);}
  function itemScene(item,spec,root){const group=new T.Group();group.position.set(item.x,0,item.z);group.rotation.y=-item.rotation;root.add(group);const w=item.w,d=item.d,cloth=detail.finish(item.finish??8,spec.accent),variant=(spec.variant+Math.round(item.x*3))&3;
    if(item.kind==='sofa'){
      cube(0,.36,0,w,.38,d,wood,group,true);cube(0,.88,-d*.43,w,1.05,.24,cloth,group,true);for(const side of [-1,1])cube(side*(w/2-.1),.72,0,.22,.65,d,cloth,group,true);
      for(let i=0;i<3;i++)cube(-w/3+i*w/3,.6,.06,w/3-.08,.25,d*.77,cloth,group,true);for(const side of [-1,1]){const cushion=cube(side*w*.31,.91,-d*.12,.48,.48,.18,detail.finish(8,side<0?0xc3a78e:0x65868a),group,true);cushion.rotation.z=side*.16;}legs(group,w,d,.22);
    }else if(['table','dining','conference'].includes(item.kind)){
      tabletop(group,w,d,item.kind==='table'?.47:.82,item.kind==='conference'?oak:wood);const y=item.kind==='table'?.57:.94;cylinder(-w*.15,y,0,.18,.13,.18,ceramic,group);cylinder(-w*.15,y+.07,0,.2,.03,.2,white,group);cube(w*.2,y-.01,0,.42,.035,.3,detail.decal(15),group);if(item.kind!=='table')plant(group,w*.22,y-.05,d*.18,.3,1);
    }else if(item.kind==='chair'){chair(group,w,d,cloth);}
    else if(item.kind==='desk'||item.kind==='workbench'){
      tabletop(group,w,d,.83,oak);cube(w*.3,.42,0,w*.28,.75,d*.86,white,group);for(let i=0;i<3;i++){cube(w*.3,.25+i*.22,d*.45,w*.24,.17,.04,oak,group);cube(w*.3,.25+i*.22,d*.48,.2,.025,.025,metal,group);}
      if(item.kind==='desk'){cube(-w*.12,1.2,-d*.18,.95,.6,.06,dark,group,true);plane(-w*.12,1.2,-d*.18+.04,.85,.5,detail.decal(7),group);cube(-w*.12,.99,-d*.18,.1,.27,.12,metal,group);cube(-w*.12,.9,d*.22,.68,.035,.23,metal,group);ball(w*.17,.91,d*.2,.075,.035,.11,dark,group);}else{for(let i=0;i<4;i++)cylinder(-w*.3+i*.23,1,-d*.1,.13,.3,.13,detail.finish(4),group);cube(w*.2,.96,0,.6,.12,.3,metal,group);}
      const stem=cylinder(-w*.37,1.16,0,.035,.65,.035,metal,group);const shade=cylinder(-w*.37,1.45,0,.32,.16,.32,metal,group);cube(-w*.37,1.35,0,.22,.025,.2,lamp,group);
    }else if(item.kind==='bed'){
      cube(0,.26,0,w,.4,d,wood,group,true);cube(0,.62,0,w*.96,.4,d*.96,detail.finish(8),group,true);cube(0,1.07,-d*.46,w,1.55,.18,detail.finish(6),group,true);cube(0,.84,.55,w*.98,.12,d*.62,detail.finish(8,spec.accent),group,true);
      for(const side of [-1,1]){const pillow=cube(side*w*.23,.91,-d*.29,w*.39,.22,.7,white,group,true);pillow.rotation.y=side*.045;}cube(0,.93,d*.32,w,.08,.7,detail.decal(8),group,true);
    }else if(item.kind==='nightstand'){
      cube(0,.35,0,w,.65,d,wood,group,true);cube(0,.4,d*.51,w*.82,.35,.025,oak,group);cube(0,.42,d*.55,.16,.025,.025,metal,group);cylinder(0,.78,0,.18,.28,.18,ceramic,group);cylinder(0,1.04,0,.43,.3,.43,detail.finish(8),group);ball(0,.99,0,.11,.13,.11,lamp,group);
    }else if(item.kind==='wardrobe'){
      cube(0,1.36,0,w,2.7,d,wood,group);for(const side of [-1,1]){cube(-w*.52,1.36,side*d*.24,.05,2.58,d*.46,oak,group);cube(-w*.56,1.35,side*d*.12,.035,.45,.035,metal,group);}
    }else if(item.kind==='kitchen'||item.kind==='coffee-station'){
      cube(0,.48,0,w,.92,d,wood,group);cube(0,.99,0,w+.08,.12,d+.08,ceramic,group);for(let i=0;i<5;i++){const x=(i-2)*w/5;cube(x,.5,d*.51,w/5-.06,.8,.04,detail.finish(4),group);cube(x,.78,d*.55,.24,.025,.035,metal,group);}
      cube(-w*.2,1.06,0,1.05,.035,.7,metal,group);cube(-w*.2,1.085,0,.83,.025,.5,dark,group);const tap=new T.Mesh(new T.TorusGeometry(.16,.025,6,16,Math.PI),metal);tap.position.set(-w*.2,1.29,-.12);group.add(tap);
      cube(w*.24,1.07,0,1,.035,.72,dark,group);for(const side of [-1,1])for(const z of [-.18,.18])cylinder(w*.24+side*.22,1.105,z,.22,.018,.22,metal,group);for(let i=0;i<3;i++)cube(-w*.32+i*w*.32,2.27,-d*.22,w*.3,.85,d*.55,wood,group);plant(group,w*.39,1.08,.1,.32,0);
    }else if(item.kind==='shelf'||item.kind==='stockrack'){
      const rack=item.kind==='stockrack',height=rack?3.6:2.7;for(const side of [-1,1])cube(side*w*.46,height/2,0,.09,height,d,rack?metal:wood,group);for(let row=0;row<4;row++){const y=.25+row*(height-.4)/4;cube(0,y,0,w,.1,d,rack?metal:wood,group);if(rack){for(const side of [-1,1])cube(side*w*.24,y+.35,0,w*.4,.6,d*.72,detail.finish(9,0xbc9f78),group);}else{for(let i=0;i<6;i++){const bw=(w-.3)/6,x=-w/2+.15+(i+.5)*bw;cube(x,y+.25,0,bw*.8,.42+((i+row)%3)*.05,d*.7,material([0x9a735d,0x6b8584,0xb7a98b,0x657488][(i+row+variant)%4]),group);}}}
      if(!rack)plane(0,1.35,d*.51,w*.82,2.05,detail.decal(4),group);
    }else if(item.kind==='reception'||item.kind==='console'){
      cube(0,.58,0,w,1.1,d,detail.finish(6),group);cube(0,1.19,0,w+.1,.12,d+.08,ceramic,group);cube(-w*.15,1.43,-d*.15,.65,.45,.06,dark,group);cylinder(w*.26,1.31,0,.2,.22,.2,white,group);plant(group,w*.4,1.27,0,.3,3);
    }else if(item.kind==='display'){
      cube(0,.48,0,w,.85,d,oak,group);cube(0,.95,0,w+.08,.12,d+.08,white,group);for(let i=0;i<3;i++){if(item.stock===2)plant(group,(i-1)*w*.26,1.02,0,.45,(i+variant)%4);else{cube((i-1)*w*.26,1.13,0,w*.19,.25,d*.4,detail.decal(item.stock===0?4:item.stock===1?5:11),group,true);}}
    }else if(item.kind==='plant'){plant(group,0,0,0,1,item.variant);}
    else if(item.kind==='picture'){picture(root,item.x,item.y,item.z,item.w,item.d,item.art);root.remove(group);}
    else if(item.kind==='rug'){const rug=plane(0,.035,0,w,d,detail.decal(item.art),group);rug.rotation.x=-Math.PI/2;}
    else if(item.kind==='window'){
      cube(0,item.y,0,w+.2,d+.2,.14,wood,group);const windowMaterial=new T.MeshBasicMaterial({map:sky,color:0xc0d4de});root.userData.ownedMaterials.push(windowMaterial);root.userData.windows.push(windowMaterial);plane(0,item.y,.09,w,d,windowMaterial,group);
      for(const side of [-1,1]){cube(side*w*.25,item.y,.13,.06,d,.05,white,group);for(let i=0;i<3;i++)cube(side*(w/2-.1-i*.12),item.y,.24,.15,d+.35,.15,detail.finish(8),group,true);}cube(0,item.y-d/2-.1,.22,w+.3,.12,.45,ceramic,group);
    }else if(item.kind==='pendant'){
      cylinder(0,item.y+.2,0,.035,.7,.035,metal,group);const shade=new T.Mesh(new T.ConeGeometry(.6,.35,24,1,true),metal);shade.position.set(0,item.y,0);group.add(shade);cylinder(0,item.y-.16,0,.82,.04,.82,lamp,group);
    }else if(item.kind==='partition'){cube(0,1.5,0,w,3,d,detail.finish(5),group);}
    else if(item.kind==='bath-floor'){const floor=plane(0,.025,0,w,d,detail.finish(14),group,0,true);floor.rotation.x=-Math.PI/2;}
    else if(item.kind==='shower'){
      cube(0,.09,0,w,.16,d,ceramic,group);const glass=new T.MeshPhysicalMaterial({color:0xa5c5c7,transparent:true,opacity:.24,roughness:.15,depthWrite:false});root.userData.ownedMaterials.push(glass);cube(w/2,1.2,0,.035,2.4,d,glass,group);cube(0,1.2,-d/2,w,2.4,.035,glass,group);cylinder(-w*.2,1.6,-d*.45,.035,1.2,.035,metal,group);cube(-w*.2,2.2,-d*.26,.35,.04,.4,metal,group);
    }else if(item.kind==='sink'){cube(0,.48,0,w,.85,d,wood,group);ball(0,.95,0,w*.55,.12,d*.55,ceramic,group);cylinder(0,1.08,-d*.32,.04,.3,.04,metal,group);}
    else if(item.kind==='toilet'){ball(0,.4,0,w*.45,.35,d*.5,ceramic,group);cube(0,.72,-d*.33,w*.9,.6,.2,white,group,true);ball(0,.65,.08,w*.45,.06,d*.42,white,group);}
    else if(item.kind==='easel'){for(const side of [-1,1]){const leg=cube(side*.5,.9,0,.07,1.8,.07,wood,group);leg.rotation.z=side*.13;}picture(group,0,1.45,.08,1.5,1.3,item.art);cube(0,.85,.15,1.8,.07,.3,wood,group);}
    else if(item.kind==='pallet'||item.kind==='luggage'){for(let i=0;i<3;i++)cube((i-1)*w*.27,.35,0,w*.24,item.kind==='luggage'?.7:.5,d*.8,item.kind==='luggage'?detail.finish(9):oak,group,true);}
    return group;
  }
  function build(spec){
    const root=new T.Group();root.name='interior:'+spec.id;root.userData={ownedTextures:[],ownedMaterials:[],windows:[]};scene.add(root);
    const floor=plane(0,0,0,spec.width,spec.depth,detail.finish(spec.finish),root,0,true);floor.rotation.x=-Math.PI/2;
    const ceiling=plane(0,spec.height,0,spec.width,spec.depth,detail.finish(5),root,0,true);ceiling.rotation.x=Math.PI/2;
    const wall=detail.finish(spec.wall);plane(0,spec.height/2,-spec.depth/2,spec.width,spec.height,wall,root,0,true);plane(-spec.width/2,spec.height/2,0,spec.depth,spec.height,wall,root,Math.PI/2,true);plane(spec.width/2,spec.height/2,0,spec.depth,spec.height,wall,root,-Math.PI/2,true);plane(0,spec.height/2,spec.depth/2,spec.width,spec.height,wall,root,Math.PI,true);
    for(const side of [-1,1]){cube(side*(spec.width/2-.05),.09,0,.09,.18,spec.depth,wood,root);cube(side*(spec.width/2-.06),spec.height-.14,0,.13,.18,spec.depth,white,root);}for(const side of [-1,1]){cube(0,.09,side*(spec.depth/2-.05),spec.width,.18,.09,wood,root);cube(0,spec.height-.14,side*(spec.depth/2-.06),spec.width,.18,.13,white,root);}
    cube(0,1.45,spec.depth/2-.08,2.3,2.9,.1,wood,root);cube(.76,1.35,spec.depth/2-.17,.08,.32,.08,metal,root);label('出口 · E',0,3.3,spec.depth/2-.16,2.5,root,Math.PI);
    if(spec.floorCount>1){const p=spec.lift;cube(p.x,1.5,spec.depth/2-.12,1.7,3,.08,metal,root);cube(p.x,1.5,spec.depth/2-.19,.04,2.8,.03,dark,root);label((spec.floor+1)+' 楼 · E 选择楼层',p.x,3.25,spec.depth/2-.2,2.3,root,Math.PI);}
    for(const item of spec.furniture)itemScene(item,spec,root);
    for(const x of [-spec.width*.26,spec.width*.26])for(const z of [-spec.depth*.22,spec.depth*.22]){const glow=new T.PointLight(0xffe6c2,48,18,2);glow.position.set(x,spec.height-.5,z);root.add(glow);cylinder(x,spec.height-.06,z,.2,.06,.2,lamp,root);}
    root.visible=false;return root;
  }
  function release(root){root.removeFromParent();const geometries=new Set();root.traverse(o=>{if(o.geometry&&!shared.has(o.geometry))geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());root.userData.ownedTextures.forEach(t=>t.dispose());root.userData.ownedMaterials.forEach(m=>m.dispose());}
  function update(state,night){const spec=state.interior?.furniture?state.interior:null;for(const root of rooms.values())root.visible=false;if(!spec)return;
    let root=rooms.get(spec.id);if(!root){root=build(spec);rooms.set(spec.id,root);}else{rooms.delete(spec.id);rooms.set(spec.id,root);}root.visible=true;for(const mat of root.userData.windows)mat.color.set(night?0x263b50:0xc0d4de);
    while(rooms.size>4){const [id,old]=rooms.entries().next().value;rooms.delete(id);release(old);}
  }
  return {update,rooms,dispose(){for(const root of rooms.values())release(root);rooms.clear();for(const g of shared)g.dispose();lamp.dispose();}};
};
