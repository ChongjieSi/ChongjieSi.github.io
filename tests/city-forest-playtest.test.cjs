const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let C,R,w,scene,land,details,T;const ready=(async()=>{
 T=await import('../static/games/vendor/three.module.min.js');const realm={document:{createElement:()=>({getContext:()=>null})}};realm.window=realm;vm.createContext(realm);
 for(const n of ['city-architecture','city-terrain','city-interiors','city-world','city-motion','city-terrain-mesh','city-landscape','city-details'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+n+'.js'),'utf8'),realm);
 C=realm.ArcadeCityWorld;R=realm.ArcadeCityTerrain;w=C.create();scene=new T.Group();const texture=new T.Texture(),material=new T.MeshStandardMaterial({map:texture}),detail={finish:()=>material,nature:()=>material,plant:()=>material};
 land=realm.ArcadeCityLandscape(T,{state:w,exterior:scene,detail,material:()=>material,assets:{surfaceTexture:()=>texture,waterNormal:()=>texture},batch:()=>{}});details=realm.ArcadeCityDetails(T,{state:w,exterior:scene,detail,material:()=>material});C.settleActors(w);
})();
test('Both forest lanes and the complete walking route remain clear with the actual rendered scene colliders',async()=>{
 await ready;
 for(const road of w.roadPlan.paths.filter(p=>p.points.some(p=>p.x<-370))){const foot=['trail','garden-path'].includes(road.type);
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],p=road.points[i],length=C.distance(a,p),yaw=Math.atan2(p.x-a.x,-(p.z-a.z));
   for(const offset of foot?[0,-.55,.55]:[0,-1.5,1.5]){const x=p.x+(p.z-a.z)/length*offset,z=p.z-(p.x-a.x)/length*offset;
    assert.equal(foot?C.blocked(w,x,z,.42,p.y):C.vehicleContact(w,{x,z,type:0,yaw,elevation:p.y,surfaceId:road.id},[],false),foot?false:null,road.id+' sample '+i+' lane '+offset);
   }
  }
 }
});
test('Soil trails are clipped at timber decks and the forest road instead of painting over them',async()=>{
 await ready;const road=w.roadPlan.paths.find(p=>p.id==='forest-road');let sampled=0;
 for(const path of w.roadPlan.paths.filter(p=>p.type==='trail')){const root=scene.getObjectByName('road:'+path.id);assert.ok(root);root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,idx=o.geometry.index?.array,count=idx?.length||p.count;
  for(let i=0;i<count;i+=3){const ids=idx?[idx[i],idx[i+1],idx[i+2]]:[i,i+1,i+2],x=ids.reduce((v,n)=>v+p.getX(n),0)/3,y=ids.reduce((v,n)=>v+p.getY(n),0)/3,z=ids.reduce((v,n)=>v+p.getZ(n),0)/3;
   for(const deck of w.roadPlan.walkSurfaces)assert.ok(!(Math.abs(x-deck.x)<deck.rx-.001&&Math.abs(z-deck.z)<deck.rz-.001&&Math.abs(y-deck.y)<.3),'soil covers '+deck.id);
   const n=R.nearest(road.points,x,z);assert.ok(!(!(n.index===road.points.length-1&&n.t===1)&&!(n.index===1&&n.t===0)&&n.d<road.width/2-.03&&Math.abs(y-n.y)<.3),'soil covers the mountain road '+path.id+' '+[x,y,z,n.y,n.d].join(','));sampled++;
  }
 });}assert.ok(sampled>1000);
});
test('Open tunnel approaches retain their textured ground rather than exposing a hole below the road',async()=>{
 await ready;const g=scene.getObjectByName('forest-terrain').geometry,p=g.attributes.position,idx=g.index.array,cells=new Map();
 for(let i=0;i<idx.length;i+=3){const ids=[idx[i],idx[i+1],idx[i+2]],xs=ids.map(n=>p.getX(n)),zs=ids.map(n=>p.getZ(n));for(let x=Math.floor(Math.min(...xs)/4);x<=Math.floor(Math.max(...xs)/4);x++)for(let z=Math.floor(Math.min(...zs)/4);z<=Math.floor(Math.max(...zs)/4);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(ids);}}
 function height(x,z){let best=-Infinity;for(const [a,b,c]of cells.get(Math.floor(x/4)+','+Math.floor(z/4))||[]){const ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-10)continue;const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den;if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)best=Math.max(best,u*p.getY(a)+v*p.getY(b)+(1-u-v)*p.getY(c));}return best;}
 let checked=0;for(const road of w.roadPlan.paths.filter(p=>p.type==='tunnel'))for(const p of road.points){if(p.x>-358||R.rawHeight(p.x,p.z)>p.y+3)continue;const h=height(p.x,p.z);assert.ok(Number.isFinite(h),'no missing terrain beneath '+road.id);assert.ok(h<p.y+.08,'no ground through road');checked++;}assert.ok(checked>10);
});
test('The lookout approach reaches the pavilion floor at its actual visible height',async()=>{
 await ready;const rest=w.roadPlan.restArea;w.cars=[];w.traffic=[];w.vehicle=-1;Object.assign(w.player,{x:rest.pavilion.x,z:rest.pavilion.z+11,yaw:0});w.cameraYaw=0;w.elevation=rest.y;w.dialog=null;
 for(let i=0;i<120;i++)C.step(w,.02,{forward:true});assert.ok(w.player.z<rest.pavilion.z+3.6,'walk from the approach onto the floor');assert.ok(Math.abs(w.elevation-rest.y-.175)<.001,'shoes rest on the top of the slab');assert.equal(C.blocked(w,w.player.x,w.player.z,.42,w.elevation),false);
});
test('Forest animals remain outside trees, rocks, one another and the player during sustained movement',async()=>{
 await ready;Object.assign(w.player,{x:-540,z:80});w.elevation=R.groundHeight(w,-540,80);C.settleActors(w);
 for(let i=0;i<180;i++){C.stepActors(w,1/60);for(const a of w.animals){assert.equal(C.blocked(w,a.x,a.z,a.radius,a.y,a.bodyHeight,false),false,a.id+' enters a scene collider');assert.equal(C.actorContact(w,a.x,a.z,a.radius,a.y,a.bodyHeight,a),null,a.id+' overlaps another body');}}
 details.dispose();land.dispose();
});
