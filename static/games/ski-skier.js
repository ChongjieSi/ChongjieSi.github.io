/* Articulated, metre-scale skier. Forward is local -Z; boots stay on the ski surface. */
window.MontBlancSkier=T=>{
 const group=new T.Group();group.name='articulated-skier';
 const fabric=new T.MeshStandardMaterial({color:0xc44528,roughness:.88}),panel=new T.MeshStandardMaterial({color:0xe0653c,roughness:.82});
 const navy=new T.MeshStandardMaterial({color:0x192e3c,roughness:.85}),black=new T.MeshStandardMaterial({color:0x101c25,roughness:.58}),cream=new T.MeshStandardMaterial({color:0xdedfd7,roughness:.52});
 const metal=new T.MeshStandardMaterial({color:0x9aa8aa,metalness:.8,roughness:.26}),visor=new T.MeshPhysicalMaterial({color:0xd58c40,metalness:.72,roughness:.12,clearcoat:1});
 const sphere=new T.SphereGeometry(1,24,16),cylinder=new T.CylinderGeometry(1,1,1,14),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 const mesh=(geo,mat,parent=group)=>{const o=new T.Mesh(geo,mat);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 function ellipsoid(parent,mat,x,y,z,sx,sy,sz){const o=mesh(sphere,mat,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
 function box(parent,mat,x,y,z,sx,sy,sz){const o=mesh(cube,mat,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
 function link(parent,mat,r1,r2){const o=mesh(new T.CylinderGeometry(r2,r1,1,14,1),mat,parent);return (a,b)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b);o.position.copy(av).add(bv).multiplyScalar(.5);o.scale.y=av.distanceTo(bv);o.quaternion.setFromUnitVectors(up,bv.sub(av).normalize());};}
 function shell(parent,mat,rings){const pos=[],index=[],segments=32;for(const [y,rx,rz,z] of rings)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;pos.push(Math.cos(a)*rx,y,z+Math.sin(a)*rz);}for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i;index.push(a,a+segments+1,a+1,a+1,a+segments+1,a+segments+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();return mesh(g,mat,parent);}
 const body=new T.Group();group.add(body);
 shell(body,fabric,[[.75,.23,.14,.18],[.84,.27,.18,.15],[1.02,.28,.20,.04],[1.26,.31,.20,-.12],[1.37,.23,.16,-.19],[1.40,.14,.10,-.19]]);
 ellipsoid(body,navy,0,.77,.16,.26,.17,.18);
 // Shoulder panels, collar, cuffs and a compact touring pack read at playing distance.
 for(const s of [-1,1])ellipsoid(body,panel,s*.27,1.27,-.11,.13,.13,.16);
 const collar=mesh(new T.TorusGeometry(.105,.045,10,28),navy,body);collar.rotation.x=Math.PI/2;collar.position.set(0,1.40,-.19);
 ellipsoid(body,black,0,1.16,.25,.22,.27,.12);ellipsoid(body,navy,0,1.15,.31,.19,.22,.085);
 for(const s of [-1,1]){const strap=box(body,cream,s*.16,1.17,.39,.023,.32,.012);strap.rotation.z=s*.09;box(body,black,s*.18,1.15,.395,.04,.055,.012);}
 box(body,panel,0,1.15,.4,.12,.045,.015);box(body,navy,0,.89,.35,.37,.045,.05);
 const head=new T.Group();head.position.set(0,1.54,-.24);body.add(head);
 ellipsoid(head,black,0,0,0,.205,.215,.225);ellipsoid(head,cream,0,.055,.015,.201,.19,.218);
 // Helmet rim, vents, goggle strap, amber wraparound lens and face gaiter.
 const rim=mesh(new T.TorusGeometry(.193,.014,8,40),black,head);rim.rotation.x=Math.PI/2;rim.scale.z=1.12;rim.position.y=-.015;
 for(const s of [-1,1])for(let i=0;i<3;i++)box(head,black,s*.085,.211-i*.009,-.035+i*.06,.035,.008,.035);
 ellipsoid(head,navy,0,-.12,-.08,.16,.11,.14);
 const lens=ellipsoid(head,visor,0,-.025,-.196,.175,.079,.054);lens.rotation.x=-.1;
 for(const s of [-1,1])box(head,black,s*.196,-.027,.015,.015,.045,.22);
 const legs=[],arms=[],poles=[],knees=[],hands=[];
 for(const s of [-1,1]){
  const leg=new T.Group();body.add(leg);legs.push([link(leg,navy,.115,.10),link(leg,navy,.093,.074)]);
  knees.push(ellipsoid(leg,black,s*.22,.48,-.20,.105,.13,.10));
  const boot=new T.Group();group.add(boot);boot.position.set(s*.25,.16,-.02);
  ellipsoid(boot,black,0,0,-.04,.087,.13,.19);box(boot,cream,0,.06,.015,.15,.13,.13);box(boot,panel,0,.11,.01,.155,.025,.14);
  for(const z of [-.12,.0])box(boot,metal,0,.015,z,.17,.025,.025);
  arms.push([link(body,fabric,.095,.083),link(body,fabric,.083,.061)]);hands.push(ellipsoid(body,black,s*.51,.99,-.67,.075,.088,.085));
  poles.push(link(group,metal,.011,.009));
  const basket=mesh(new T.TorusGeometry(.057,.011,8,16),black);basket.rotation.x=Math.PI/2;basket.position.set(s*.67,.12,.65);
  // Swept ski profile: rounded sidecut, raised shovel and tail, layered edge and bindings.
  const outline=new T.Shape();outline.moveTo(-.055,.89);outline.bezierCurveTo(-.09,.99,-.09,1.08,0,1.10);outline.bezierCurveTo(.09,1.08,.09,.99,.055,.89);outline.bezierCurveTo(.044,.3,.044,-.4,.067,-.89);outline.quadraticCurveTo(.074,-1.02,0,-1.02);outline.quadraticCurveTo(-.074,-1.02,-.067,-.89);outline.bezierCurveTo(-.044,-.4,-.044,.3,-.055,.89);
  const geo=new T.ExtrudeGeometry(outline,{depth:.025,bevelEnabled:true,bevelSize:.005,bevelThickness:.003,bevelSegments:2,curveSegments:18});geo.rotateX(-Math.PI/2);
  const a=geo.attributes.position;for(let i=0;i<a.count;i++){const z=a.getZ(i);a.setY(i,a.getY(i)+.05+Math.pow(Math.max(0,Math.abs(z)-.68),2)*1.2);}geo.computeVertexNormals();
  const ski=mesh(geo,cream);ski.position.x=s*.25;
  box(group,navy,s*.25,.085,.15,.1,.035,.27);box(group,metal,s*.25,.10,-.24,.13,.07,.12);box(group,black,s*.25,.11,.22,.13,.08,.1);
  const top=box(group,fabric,s*.25,.079,-.58,.082,.012,.31);top.rotation.x=-.035;box(group,navy,s*.25,.08,.66,.07,.012,.19);
 }
 function pose(speed,lean,air,fall,time){const flex=Math.min(1,speed/22),bounce=air ? .05 :Math.sin(time*9)*Math.min(.015,speed*.0007);body.rotation.z=-lean*.22;body.rotation.x=fall?1.15:0;body.position.y=-flex*.08+bounce;head.rotation.y=-lean*.16;
  for(let i=0;i<2;i++){const s=i?1:-1,x=s*.22,knee=[x-lean*.07,.49-flex*.06,-.22-flex*.07],hip=[x,.77,.17];legs[i][0](knee,hip);legs[i][1]([s*.25,.23,.0],knee);knees[i].position.set(...knee);const hand=[s*(.49+Math.abs(lean)*.06),1.0-flex*.06,-.58-flex*.10],elbow=[s*.44,1.1-flex*.07,-.23];arms[i][0](elbow,[s*.30,1.29,-.12]);arms[i][1](hand,elbow);hands[i].position.set(...hand);poles[i]([hand[0],hand[1]+body.position.y,hand[2]],[s*.67,.06,.78]);}
 }
 pose(0,0,false,false,0);return {group,pose};
};
