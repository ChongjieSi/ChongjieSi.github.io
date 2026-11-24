/* One cached background job per static world; no gameplay state runs in workers. */
window.ArcadeCityPreload=(()=>{
  const cache=new Map();
  const files=['facade-v1.jpg','asphalt-v1.jpg','grass-v1.jpg','tree-coast-v1.png','sky-coast-v1.jpg','interior-finishes-v1.png','interior-decor-v1.png','nature-surfaces-v1.png','forest-canopies-v1.png','garden-understory-v1.png'];
  function task(kind,payload,key){
    if(!window.Worker)return Promise.resolve(null);
    const existing=cache.get(kind);if(existing?.key===key)return existing.promise;
    const promise=new Promise(resolve=>{
      let worker,timeout;const done=value=>{clearTimeout(timeout);worker?.terminate();resolve(value);};
      try{
        worker=new Worker('/games/city-worker.js?v=37');
        worker.onmessage=e=>done(e.data.error?null:e.data.result);worker.onerror=()=>done(null);
        timeout=setTimeout(()=>done(null),45000);worker.postMessage({kind,payload});
      }catch{done(null);}
    });
    cache.set(kind,{key,promise});
    promise.then(result=>{if(!result&&cache.get(kind)?.promise===promise)cache.delete(kind);});
    return promise;
  }
  function terrain(state){return task('terrain',{roadPlan:state.roadPlan},ArcadeCityTerrainMesh.key(state));}
  async function navigation(state){
    const key=JSON.stringify([ArcadeCityTerrainMesh.key(state),state.buildings,state.obstacles]);
    const world={roadPlan:state.roadPlan,bounds:state.bounds,collisionIndex:state.collisionIndex,colliderRevision:state.colliderRevision,elevation:0,interior:null};
    const graph=await task('navigation',{world},key);
    if(graph)state.roadGraph={...graph,revision:state.colliderRevision||0};
    else ArcadeCityWorld.navigationPath(state);
  }
  async function textures(T,progress=()=>{}){
    T.Cache.enabled=true;let completed=0;
    await Promise.all(files.map(file=>new T.ImageLoader().loadAsync('/games/textures/'+file).catch(()=>null).then(()=>progress(++completed/files.length))));
  }
  return {terrain,navigation,textures};
})();
