/* Terrain buffers are shared across scene restarts and can be built off-thread. */
window.ArcadeCityTerrainMesh=(()=>{
  let cachedKey=null,cachedData=null;
  const key=state=>JSON.stringify(['forest-clearance-v2',state.roadPlan.paths,state.roadPlan.clearings]);
  function geometry(T,data){
    const g=new T.BufferGeometry();
    for(const [name,size]of [['position',3],['normal',3],['uv',2]])g.setAttribute(name,new T.BufferAttribute(data[name],size));
    g.setIndex(new T.BufferAttribute(data.index,1));g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
  function build(T,state,prepared){
    const signature=key(state);
    if(prepared){cachedKey=signature;cachedData=prepared;return geometry(T,prepared);}
    if(cachedData&&cachedKey===signature)return geometry(T,cachedData);
    const Terrain=ArcadeCityTerrain;
    function offset(points,amount){return points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;return {...p,x:p.x+dz/len*amount,z:p.z-dx/len*amount};});}
  // The worker and main-thread fallback share the exact same terrain builder.
  const nx=242,nz=552,terrain=new T.PlaneGeometry(484,1104,nx,nz);terrain.rotateX(-Math.PI/2);const positions=terrain.attributes.position,uv=terrain.attributes.uv;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i)-594,z=positions.getZ(i)-114;const y=Terrain.groundHeight(state,x,z);positions.setXYZ(i,x,y,z);uv.setXY(i,(x+836)/6,(z+666)/6);}
  // Subtract the clearance prism of each actual road triangle. Dropping a whole
  // terrain triangle by its centroid punched sky holes into the portal shoulders.
  const prisms=new Map();
  for(const path of state.roadPlan.paths.filter(p=>p.type==='tunnel')){
    const right=offset(path.points,path.width/2),left=offset(path.points,-path.width/2);
    for(let i=1;i<path.points.length;i++){
      if(Math.max(Terrain.rawHeight(path.points[i-1].x,path.points[i-1].z)-path.points[i-1].y,Terrain.rawHeight(path.points[i].x,path.points[i].z)-path.points[i].y)<=10)continue;
      const volumes=[];
      for(const vertices of [[right[i-1],left[i-1],right[i]],[left[i-1],left[i],right[i]]]){
        const [a,b,c]=vertices,den=(b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z),sign=Math.sign(den);
        const hx=((b.y-a.y)*(c.z-a.z)-(c.y-a.y)*(b.z-a.z))/den,hz=((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/den,constant=a.y-hx*a.x-hz*a.z;
        const planes=vertices.map((p,j)=>{const q=vertices[(j+1)%3],dx=q.x-p.x,dz=q.z-p.z;return {x:-dz*sign,y:0,z:dx*sign,c:(dz*p.x-dx*p.z)*sign};});
        planes.push({x:-hx,y:1,z:-hz,c:.35-constant},{x:hx,y:-1,z:hz,c:constant+6});
        volumes.push({planes,minX:Math.min(...vertices.map(p=>p.x)),maxX:Math.max(...vertices.map(p=>p.x)),minZ:Math.min(...vertices.map(p=>p.z)),maxZ:Math.max(...vertices.map(p=>p.z)),minY:Math.min(...vertices.map(p=>p.y))-.35,maxY:Math.max(...vertices.map(p=>p.y))+6});
      }
      prisms.set(path.id+':'+i,volumes);
    }
  }
  const originalIndex=terrain.index.array,newPositions=Array.from(positions.array),newUV=Array.from(uv.array),visibleIndices=[];
  const vertex=i=>({x:positions.getX(i),y:positions.getY(i),z:positions.getZ(i),u:uv.getX(i),v:uv.getY(i),index:i});
  for(let i=0;i<originalIndex.length;i+=3){
    const triangle=[vertex(originalIndex[i]),vertex(originalIndex[i+1]),vertex(originalIndex[i+2])],x=triangle.reduce((s,p)=>s+p.x,0)/3,z=triangle.reduce((s,p)=>s+p.z,0)/3,seen=new Set();let polygons=[triangle];
    const bounds={minX:Math.min(...triangle.map(p=>p.x)),maxX:Math.max(...triangle.map(p=>p.x)),minZ:Math.min(...triangle.map(p=>p.z)),maxZ:Math.max(...triangle.map(p=>p.z)),minY:Math.min(...triangle.map(p=>p.y)),maxY:Math.max(...triangle.map(p=>p.y))};
    for(const {path,index}of state.roadPlan.spatial.get(Math.floor(x/32)+','+Math.floor(z/32))||[]){
      if(path.type!=='tunnel')continue;const key=path.id+':'+index;if(seen.has(key))continue;seen.add(key);
      for(const prism of prisms.get(key)||[]){
        if(bounds.maxX<prism.minX||bounds.minX>prism.maxX||bounds.maxZ<prism.minZ||bounds.minZ>prism.maxZ||bounds.maxY<prism.minY||bounds.minY>prism.maxY)continue;
        polygons=polygons.flatMap(polygon=>Terrain.subtractPrism(polygon,prism.planes));
      }
    }
    for(const polygon of polygons){
      const indices=polygon.map(p=>{if(p.index===undefined){p.index=newPositions.length/3;newPositions.push(p.x,p.y,p.z);newUV.push(p.u,p.v);}return p.index;});
      for(let j=1;j<indices.length-1;j++)visibleIndices.push(indices[0],indices[j],indices[j+1]);
    }
  }
  terrain.setAttribute('position',new T.Float32BufferAttribute(newPositions,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(newUV,2));terrain.setIndex(visibleIndices);
  // Portal clipping adds vertices. Three.js reuses an existing normal attribute,
  // so it must be removed before rebuilding normals for the larger vertex set.
  terrain.deleteAttribute('normal');terrain.computeVertexNormals();terrain.computeBoundingBox();terrain.computeBoundingSphere();

    cachedKey=signature;cachedData={position:terrain.attributes.position.array,normal:terrain.attributes.normal.array,uv:terrain.attributes.uv.array,index:terrain.index.array};
    return terrain;
  }
  build.key=key;return build;
})();
