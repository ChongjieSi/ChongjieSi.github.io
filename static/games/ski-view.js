/* The visible surface and snow simulation share the georeferenced DEM and deformation field. */
window.MontBlancView=(T,canvas,w)=>{
 const clamp=T.MathUtils.clamp,renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#9dbbd0');scene.fog=new T.FogExp2('#a5bfda',.000055);
 const camera=new T.PerspectiveCamera(58,1,.12,35000),sunDirection=new T.Vector3(-.68,.64,.35).normalize();
 scene.add(new T.HemisphereLight(0xbedbff,0x34465e,.62));const sun=new T.DirectionalLight(0xffe3bd,3.25);sun.castShadow=true;
 sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:130});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun,sun.target);
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sunDir:{value:sunDirection}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 direction;uniform vec3 sunDir;
 void main(){vec3 n=normalize(direction);float h=pow(max(0.,n.y),.48);vec3 c=mix(vec3(.64,.78,.88),vec3(.035,.13,.28),h);float d=max(0.,dot(n,sunDir));c+=vec3(1.,.75,.42)*pow(d,24.)*.16+vec3(1.,.86,.64)*pow(d,2200.)*1.8;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(';#include',';\n#include')});
 const sky=new T.Mesh(new T.SphereGeometry(27000,40,24),skyMat);scene.add(sky);
 const fallback=new T.DataTexture(new Uint8Array([100,104,107,255]),1,1);fallback.needsUpdate=true;
 const snowFallback=new T.DataTexture(new Uint8Array([245,248,252,255]),1,1);snowFallback.needsUpdate=true;
 const rockUniform={value:fallback},snowUniform={value:snowFallback},textures=new Set([fallback,snowFallback]);let disposed=false;
 for(const [name,uniform] of [['alpine-granite',rockUniform],['alpine-snow',snowUniform]])new T.TextureLoader().load('/games/ski-data/materials/'+name+'.webp',texture=>{if(disposed){texture.dispose();return;}texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);uniform.value=texture;},undefined,()=>{});
 const nearCenter=new T.Vector2(),color=new T.Color(),N=w.meta.size,positions=new Float32Array(N*N*3),colors=new Float32Array(N*N*3),indices=new Uint32Array((N-1)*(N-1)*6);
 // Shadows of real surrounding ridgelines, baked into a vertex attribute once rather than drawn every frame.
 const shadowAt=(x,y,z)=>{let shade=1;for(const d of [45,110,240,500,950,1800]){const q=w.base(x+sunDirection.x*d,z+sunDirection.z*d),ray=y+sunDirection.y*d;shade=Math.min(shade,clamp((ray-q)/70+.45,.22,1));}return shade;};
 function tint(x,y,z){const shadow=shadowAt(x,y,z),low=clamp((2400-y)/550,0,1);color.setRGB(.16+shadow*.84,.26+shadow*.74,.42+shadow*.58).lerp(new T.Color(.15,.22,.19),low*.7);return color;}
 const heights=new Float32Array(N*N);let k=0;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i/(N-1)-.5)*w.meta.width,z=(j/(N-1)-.5)*w.meta.depth,y=w.base(x,z),id=(j*N+i)*3;heights[j*N+i]=y;positions.set([x,y,z],id);const c=tint(x,y,z);colors.set([c.r,c.g,c.b],id);if(i<N-1&&j<N-1){const a=j*N+i;indices.set([a,a+N,a+1,a+1,a+N,a+N+1],k);k+=6;}}
 const noiseGLSL=`
 float hashSnow(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
 float noiseSnow(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashSnow(i),hashSnow(i+vec2(1.,0.)),f.x),mix(hashSnow(i+vec2(0.,1.)),hashSnow(i+1.),f.x),f.y);}
 float fbmSnow(vec2 p){return noiseSnow(p)*.55+noiseSnow(p*2.03)*.27+noiseSnow(p*4.01)*.12+noiseSnow(p*8.13)*.06;}
 vec3 granite(vec3 p,vec3 n){vec3 b=pow(abs(n),vec3(5.));b/=b.x+b.y+b.z;return texture2D(graniteMap,p.zy*.075).rgb*b.x+texture2D(graniteMap,p.xz*.075).rgb*b.y+texture2D(graniteMap,p.xy*.075).rgb*b.z;}
 `;
 function material(far){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.84,metalness:0});m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{snowCenter:{value:nearCenter},graniteMap:rockUniform,snowMap:snowUniform});
  s.vertexShader='varying vec3 snowWorld;varying vec3 snowNormal;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nsnowWorld=(modelMatrix*vec4(transformed,1.)).xyz;snowNormal=normalize(mat3(modelMatrix)*objectNormal);');
  s.fragmentShader='uniform vec2 snowCenter;uniform sampler2D graniteMap;uniform sampler2D snowMap;varying vec3 snowWorld;varying vec3 snowNormal;\n'+noiseGLSL+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${far?'if(max(abs(snowWorld.x-snowCenter.x),abs(snowWorld.z-snowCenter.y))<19.75)discard;':''}
   vec3 wn=normalize(snowNormal);float macro=fbmSnow(snowWorld.xz*.012);float rock=smoothstep(.25,.56,1.-wn.y+(macro-.5)*.23+(noiseSnow(snowWorld.xz*.22)-.5)*.10);
   vec3 stone=vec3(.25);if(rock>.001){stone=granite(snowWorld,wn)*.95;stone*=.75+fbmSnow(snowWorld.xz*.002+snowWorld.y*.01)*.55;}
   float wind=sin(snowWorld.x*.92+sin(snowWorld.z*.43)*.62+noiseSnow(snowWorld.xz*.35)*2.);
   float grain=noiseSnow(snowWorld.xz*32.);vec3 snow=vec3(.88,.94,1.)*(.95+wind*.018+grain*.025);
   snow*=mix(vec3(1.),texture2D(snowMap,snowWorld.xz*.3).rgb,.38);diffuseColor.rgb*=mix(snow,stone,rock);
   roughnessFactor;` .replace('roughnessFactor;',''));
  // Screen derivatives turn wind crust, granular snow and rock fissures into lighting detail.
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float closeDetail=1.-smoothstep(80.,750.,length(vViewPosition));
   float crust=(noiseSnow(snowWorld.xz*11.)*.003+noiseSnow(snowWorld.xz*2.2)*.013+sin(snowWorld.x*2.+sin(snowWorld.z*.9))*.009)*closeDetail;
   float snowGrain=dot(texture2D(snowMap,snowWorld.xz*.3).rgb,vec3(.333));
   float stoneRelief=0.;if(rock>.001){stoneRelief=dot(granite(snowWorld,normalize(snowNormal)),vec3(.333))*.12*closeDetail+(fbmSnow(snowWorld.xz*.14+snowWorld.y*.11)-.5)*2.5+abs(sin(snowWorld.y*.6+noiseSnow(snowWorld.xz*.04)*7.))*.45*closeDetail;}
   float heightDetail=mix(crust+snowGrain*.0006*closeDetail,stoneRelief,rock);
   vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),r1=cross(sy,normal),r2=cross(normal,sx);float determinant=dot(sx,r1);
   normal=normalize(abs(determinant)*normal-sign(determinant)*(dFdx(heightDetail)*r1+dFdy(heightDetail)*r2));`);
 };m.customProgramCacheKey=()=>far?'alpine-terrain-v2':'alpine-snow-v2';return m;}
 const terrainGeo=new T.BufferGeometry();terrainGeo.setAttribute('position',new T.BufferAttribute(positions,3));terrainGeo.setAttribute('color',new T.BufferAttribute(colors,3));terrainGeo.setIndex(new T.BufferAttribute(indices,1));terrainGeo.computeVertexNormals();
 const terrain=new T.Mesh(terrainGeo,material(true));terrain.name='real-montblanc-dem';terrain.receiveShadow=true;scene.add(terrain);
 function farHeight(x,z){const u=clamp((x/w.meta.width+.5)*(N-1),0,N-1.001),v=clamp((z/w.meta.depth+.5)*(N-1),0,N-1.001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*N+i;return a+b<=1?heights[k]+(heights[k+1]-heights[k])*a+(heights[k+N]-heights[k])*b:heights[k+N+1]+(heights[k+N]-heights[k+N+1])*(1-a)+(heights[k+1]-heights[k+N+1])*(1-b);}
 const farNormals=terrainGeo.attributes.normal,farColors=terrainGeo.attributes.color;
 function farNormal(x,z,out,attr=farNormals){const u=clamp((x/w.meta.width+.5)*(N-1),0,N-1.001),v=clamp((z/w.meta.depth+.5)*(N-1),0,N-1.001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*N+i;out.set(0,0,0);const ids=a+b<=1?[[k,1-a-b],[k+1,a],[k+N,b]]:[[k+N+1,a+b-1],[k+N,1-a],[k+1,1-b]];for(const [id,weight]of ids){out.x+=attr.getX(id)*weight;out.y+=attr.getY(id)*weight;out.z+=attr.getZ(id)*weight;}return attr===farNormals?out.normalize():out;}
 const PN=201,patchGeo=new T.PlaneGeometry(40,40,PN-1,PN-1);patchGeo.rotateX(-Math.PI/2);patchGeo.setAttribute('color',new T.BufferAttribute(new Float32Array(PN*PN*3),3));
 const patch=new T.Mesh(patchGeo,material(false));patch.name='deformable-snow';patch.receiveShadow=true;patch.castShadow=true;scene.add(patch);let snowClock=1;
 function updateSnow(){const cx=Math.round(w.p.x*5)/5,cz=Math.round(w.p.z*5)/5;nearCenter.set(cx,cz);patch.position.set(cx,0,cz);const a=patchGeo.attributes.position,b=patchGeo.attributes.color;const shade=new T.Vector3();for(let i=0;i<a.count;i++){const lx=a.getX(i),lz=a.getZ(i),x=cx+lx,z=cz+lz,blend=T.MathUtils.smoothstep(Math.max(Math.abs(lx),Math.abs(lz)),15,19.7),y=T.MathUtils.lerp(w.height(x,z),farHeight(x,z),blend);a.setY(i,y+.014);farNormal(x,z,shade,farColors);b.setXYZ(i,shade.x,shade.y,shade.z);}a.needsUpdate=b.needsUpdate=true;patchGeo.computeVertexNormals();const norms=patchGeo.attributes.normal,n=new T.Vector3(),f=new T.Vector3();for(let i=0;i<a.count;i++){const lx=a.getX(i),lz=a.getZ(i),blend=T.MathUtils.smoothstep(Math.max(Math.abs(lx),Math.abs(lz)),10,19.7);if(blend>0){n.fromBufferAttribute(norms,i).lerp(farNormal(cx+lx,cz+lz,f),blend).normalize();norms.setXYZ(i,n.x,n.y,n.z);}}norms.needsUpdate=true;patchGeo.computeBoundingSphere();}
 const trackGeo=new T.BufferGeometry(),trackBuffer=new Float32Array(18000*36);trackGeo.setAttribute('position',new T.BufferAttribute(trackBuffer,3));trackGeo.setDrawRange(0,0);
 const trackMesh=new T.Mesh(trackGeo,new T.MeshBasicMaterial({color:0x60859c,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide}));trackMesh.frustumCulled=false;scene.add(trackMesh);let lastTrailVersion=-1;
 function updateTracks(){if(lastTrailVersion===w.trailVersion)return;lastTrailVersion=w.trailVersion;let count=0;for(let i=1;i<w.trail.length;i++){const p=w.trail[i-1],q=w.trail[i];if(Math.hypot(p.x-q.x,p.z-q.z)>5)continue;for(const side of [-1,1]){const pts=[];for(const [c,off]of [[p,side*.25-.065],[p,side*.25+.065],[q,side*.25-.065],[q,side*.25+.065]]){const x=c.x+Math.cos(c.yaw)*off,z=c.z+Math.sin(c.yaw)*off;const blend=T.MathUtils.smoothstep(Math.max(Math.abs(x-nearCenter.x),Math.abs(z-nearCenter.y)),15,19.7);pts.push([x,T.MathUtils.lerp(w.height(x,z),farHeight(x,z),blend)+.027,z]);}for(const j of [0,2,1,1,2,3])if(count+3<=trackBuffer.length){trackBuffer.set(pts[j],count);count+=3;}}}trackGeo.attributes.position.needsUpdate=true;trackGeo.setDrawRange(0,count/3);}
 // Low valley cloud banks sit below the alpine starts; procedural optical detail only.
 const cloudMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{},vertexShader:'varying vec2 vUV;void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUV;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}void main(){vec2 q=(vUV-.5)*2.;float edge=max(0.,1.-dot(q,q));float f=n(vUV*5.)*.6+n(vUV*12.)*.3+n(vUV*27.)*.1;float a=pow(edge,1.7)*smoothstep(.18,.7,f)*.26;gl_FragColor=vec4(mix(vec3(.60,.73,.84),vec3(.92,.95,.97),f),a);}' });
 const cloudGeo=new T.PlaneGeometry(1,1);for(let i=0;i<25;i++){const x=Math.sin(i*12.99)*5900,z=Math.cos(i*8.37)*6500;if(w.base(x,z)>2350)continue;const cloud=new T.Mesh(cloudGeo,cloudMat);cloud.rotation.x=-Math.PI/2;cloud.rotation.z=i*2.39;cloud.scale.set(1700+(i%3)*500,900+(i%4)*160,1);cloud.position.set(x,2350+(i%4)*30,z);scene.add(cloud);}
 const hero=MontBlancSkier(T),skier=hero.group;scene.add(skier);
 const gateGroup=new T.Group(),gateMat=new T.MeshStandardMaterial({color:0xc85933,roughness:.8}),gateGeo=new T.CylinderGeometry(.035,.04,2.1,10);scene.add(gateGroup);for(const side of [-1,1]){const m=new T.Mesh(gateGeo,gateMat);m.position.set(side*9,1.05,0);m.castShadow=true;gateGroup.add(m);const flag=new T.Mesh(new T.PlaneGeometry(.8,.45,6,3),new T.MeshStandardMaterial({color:0xd9623c,side:T.DoubleSide,roughness:.94}));flag.position.set(side*8.6,1.7,0);gateGroup.add(flag);}gateGroup.name='ski-route-gate';
 const chunks=new T.InstancedMesh(new T.SphereGeometry(1,10,8),new T.MeshStandardMaterial({color:0xdce7ec,roughness:1}),288);chunks.instanceMatrix.setUsage(T.DynamicDrawUsage);chunks.frustumCulled=false;scene.add(chunks);const dummy=new T.Object3D();
 function softParticles(count,size,opacity){const g=new T.BufferGeometry(),pos=new Float32Array(count*3);g.setAttribute('position',new T.BufferAttribute(pos,3));const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pointScale:{value:size},opacity:{value:opacity}},vertexShader:'uniform float pointScale;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointScale/max(1.,-p.z),1.,180.);}',fragmentShader:'uniform float opacity;void main(){vec2 q=(gl_PointCoord-.5)*2.;float d=dot(q,q);if(d>1.)discard;float wisps=.88+.12*sin(q.x*19.+sin(q.y*12.)*3.);gl_FragColor=vec4(.86,.93,1.,pow(1.-d,3.)*opacity*wisps);}'});const o=new T.Points(g,m);o.frustumCulled=false;scene.add(o);return {o,g,pos,m};}
 const mist=softParticles(1152,6500,.19),powder=softParticles(220,65,.32);
 const peaks=[['勃朗峰',45.8326,6.8652],['南针峰',45.8786,6.8873],['塔库尔峰',45.8567,6.8875]],labels=peaks.map(([name,lat,lon])=>{const p=w.toWorld(lat,lon);return {name,...p,y:w.base(p.x,p.z)+45};});
 let yaw=w.p.yaw,eye=new T.Vector3(),look=new T.Vector3(),first=true,trailClock=0,cinemaTime=0;const target=new T.Vector3(),wanted=new T.Vector3(),up=new T.Vector3(0,1,0),normal=new T.Vector3();
 function draw(dt,mode=0){dt=Math.min(.05,dt);cinemaTime+=dt;const p=w.p,speed=Math.hypot(p.vx,p.vz),g=w.terrainGradient(p.x,p.z);snowClock+=dt;trailClock+=dt;if(snowClock>.12){snowClock=0;updateSnow();}if(trailClock>.2){trailClock=0;updateTracks();}
  skier.position.set(p.x,p.y+.03,p.z);normal.set(-g.x,1,-g.z).normalize();skier.quaternion.setFromUnitVectors(up,normal);skier.rotateY(-p.yaw);hero.pose(speed,p.lean,w.air,w.fall,w.time);skier.visible=mode!==1;
  yaw+=Math.atan2(Math.sin(p.yaw-yaw),Math.cos(p.yaw-yaw))*(1-Math.exp(-3.5*dt));
  if(mode===2){const angle=p.yaw+.65+Math.sin(cinemaTime*.05)*.2;wanted.set(p.x-Math.sin(angle)*14,p.y+5.8,p.z+Math.cos(angle)*14);target.set(p.x+Math.sin(p.yaw)*6,p.y+1.0,p.z-Math.cos(p.yaw)*6);}
  else if(mode===3){wanted.set(p.x+Math.sin(yaw)*7,p.y+2.4,p.z-Math.cos(yaw)*7);target.set(p.x-Math.sin(yaw)*8,w.base(p.x-Math.sin(yaw)*8,p.z+Math.cos(yaw)*8)+1.1,p.z+Math.cos(yaw)*8);}
  else{const back=mode===1?-.2:7.2+Math.min(2.2,speed*.08);wanted.set(p.x-Math.sin(yaw)*back,p.y+(mode===1?1.6:2.8+speed*.018),p.z+Math.cos(yaw)*back);const ahead=mode===1?30:6,x=p.x+Math.sin(yaw)*ahead,z=p.z-Math.cos(yaw)*ahead;target.set(x,mode===1?p.y+1.4:w.base(x,z)+1.0,z);}
  for(let i=0;i<8;i++){const t=i/7,x=p.x+(wanted.x-p.x)*t,z=p.z+(wanted.z-p.z)*t;wanted.y=Math.max(wanted.y,w.base(x,z)+1.15);}
  if(first||eye.distanceTo(wanted)>80){eye.copy(wanted);look.copy(target);yaw=p.yaw;first=false;}else{eye.lerp(wanted,1-Math.exp(-7*dt));look.lerp(target,1-Math.exp(-9*dt));}camera.position.copy(eye);camera.lookAt(look);camera.fov+=(58+Math.min(10,speed*.36)-camera.fov)*(1-Math.exp(-2*dt));camera.updateProjectionMatrix();sky.position.copy(camera.position);
  // Quantized light movement keeps the texel grid steady while following the skier.
  const sx=Math.round(p.x*8)/8,sz=Math.round(p.z*8)/8;sun.target.position.set(sx,p.y,sz);sun.position.copy(sunDirection).multiplyScalar(70).add(sun.target.position);
  const gate=w.gates[w.gate];gateGroup.visible=!!gate;if(gate){gateGroup.position.set(gate.x,gate.y+.05,gate.z);const d=w.terrainGradient(gate.x,gate.z);gateGroup.rotation.y=-Math.atan2(-d.x,d.z);}
  let mc=0,n=0;for(const a of w.parcels){const r=Math.cbrt(a.volume);for(let j=0;j<16&&mc<1152;j++){const phase=j*2.399+a.age*.4,spread=r*(1.3+j*.06),x=a.x+Math.cos(phase)*spread,z=a.z+Math.sin(phase)*spread;mist.pos.set([x,w.height(x,z)+r*(.4+Math.abs(Math.sin(j*1.7+a.age*.6))*2.3),z],mc++*3);}if(n<288){dummy.position.set(a.x,w.height(a.x,a.z)+r*.25,a.z);dummy.scale.set(r*1.15,r*.5,r*1.2);dummy.rotation.set(a.age*.2,a.age,0);dummy.updateMatrix();chunks.setMatrixAt(n++,dummy.matrix);}}mist.g.setDrawRange(0,mc);mist.g.attributes.position.needsUpdate=true;chunks.count=n;chunks.instanceMatrix.needsUpdate=true;
  powder.o.visible=speed>3&&!w.air&&mode!==1;for(let i=0;i<220;i++){const t=((w.time*2+i*.618)%1),side=(i%2?1:-1)*(.2+Math.sin(i*17.13)*.12+t*(.3+Math.abs(p.lean))),x=p.x-Math.sin(p.yaw)*t*3+Math.cos(p.yaw)*side,z=p.z+Math.cos(p.yaw)*t*3+Math.sin(p.yaw)*side;powder.pos.set([x,w.height(x,z)+.1+t*(1-t)*(.8+Math.abs(p.lean)),z],i*3);}powder.g.attributes.position.needsUpdate=true;renderer.render(scene,camera);
 }
 function resize(x,y){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75,Math.sqrt(3200000/(x*y))));renderer.setSize(x,y,false);camera.aspect=x/y;camera.updateProjectionMatrix();}
 function project(p){const v=new T.Vector3(p.x,p.y,p.z).project(camera);let visible=v.z>-1&&v.z<1&&Math.abs(v.x)<.9&&Math.abs(v.y)<.8;if(visible)for(let i=1;i<48;i++){const t=(i/48)**2,x=T.MathUtils.lerp(camera.position.x,p.x,t),z=T.MathUtils.lerp(camera.position.z,p.z,t),y=T.MathUtils.lerp(camera.position.y,p.y,t);if(w.base(x,z)>y+1){visible=false;break;}}return {x:(v.x+1)/2,y:(1-v.y)/2,visible};}

 return {draw,resize,project,labels,scene,camera,updateSnow,dispose(){disposed=true;const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.dispose();renderer.dispose();}};
};
