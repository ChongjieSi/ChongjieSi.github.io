/* CPU-only geometry and route construction. Buffers move to the rendering thread. */
self.window=self;
const version=new URL(self.location.href).searchParams.get('v')||'33';
const script=name=>new URL(name+'.js?v='+version,self.location.href).href;
importScripts(...['city-architecture','city-terrain','city-interiors','city-world','city-terrain-mesh'].map(script));
self.onmessage=async({data:{kind,payload}})=>{
  try{
    if(kind==='terrain'){
      const T=await import('./vendor/three.module.min.js');
      const geometry=ArcadeCityTerrainMesh(T,payload),result={position:geometry.attributes.position.array,normal:geometry.attributes.normal.array,uv:geometry.attributes.uv.array,index:geometry.index.array};
      self.postMessage({result},Object.values(result).map(a=>a.buffer));
    }else if(kind==='navigation'){
      const world=payload.world;
      const clear=(a,b)=>{
        const length=Math.hypot(a.x-b.x,a.z-b.z),count=Math.max(1,Math.ceil(length/2));
        for(let i=0;i<=count;i++){const t=i/count;if(ArcadeCityWorld.blocked(world,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,1.1,(a.y||0)+((b.y||0)-(a.y||0))*t))return false;}
        return true;
      };
      self.postMessage({result:ArcadeCityTerrain.navigationGraph(world,clear)});
    }
  }catch(error){self.postMessage({error:String(error)});}
};
