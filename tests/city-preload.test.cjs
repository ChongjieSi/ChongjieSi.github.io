const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Worker:Thread}=require('node:worker_threads');

test('Background city jobs transfer complete terrain buffers and reuse them on restart',async()=>{
  const root=path.resolve(__dirname,'../static/games');let starts=0;
  // Run the shipped Web Worker protocol on real threads. Only the browser host
  // APIs and the relative ES module URL need adapting to Node.
  class Worker {
    constructor(){
      starts++;
      this.thread=new Thread(`
        const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{pathToFileURL}=require('node:url');
        global.self=global;self.location={href:pathToFileURL(path.join(workerData,'city-worker.js')).href+'?v=24'};
        global.importScripts=(...urls)=>urls.forEach(url=>vm.runInThisContext(fs.readFileSync(new URL(url),'utf8')));
        self.postMessage=(data,transfer)=>parentPort.postMessage(data,transfer);
        const source=fs.readFileSync(path.join(workerData,'city-worker.js'),'utf8').replace("import('./vendor/three.module.min.js')",'import('+JSON.stringify(pathToFileURL(path.join(workerData,'vendor/three.module.min.js')).href)+')');
        eval(source);parentPort.on('message',data=>self.onmessage({data}));
      `,{eval:true,workerData:root});
      this.thread.on('message',data=>this.onmessage?.({data}));this.thread.on('error',error=>this.onerror?.(error));
    }
    postMessage(data){this.thread.postMessage(data);}
    terminate(){this.thread.terminate();}
  }
  const realm={Worker,setTimeout,clearTimeout};realm.window=realm;vm.createContext(realm);
  for(const name of ['city-architecture','city-terrain','city-interiors','city-world','city-terrain-mesh','city-preload'])vm.runInContext(fs.readFileSync(path.join(root,name+'.js'),'utf8'),realm);
  const world=realm.ArcadeCityWorld.create(),preload=realm.ArcadeCityPreload;
  const terrainJob=preload.terrain(world);assert.equal(preload.terrain(world),terrainJob,'concurrent openings share the same job');
  const [data]=await Promise.all([terrainJob,preload.navigation(world)]);
  assert.ok(data,'the actual worker must return terrain rather than silently use the blocking fallback');
  assert.ok(data.position instanceof Float32Array);assert.ok(data.position.length>243*553*3);
  assert.equal(data.normal.length,data.position.length);assert.equal(data.uv.length/2,data.position.length/3);
  let max=0;for(const i of data.index)max=Math.max(max,i);assert.ok(max<data.position.length/3);
  assert.ok(data.position.every(Number.isFinite));assert.ok(data.normal.every(Number.isFinite));
  assert.ok(world.roadGraph?.nodes.length>500,'the navigation graph survives structured cloning');
  assert.ok(realm.ArcadeCityWorld.navigationPath(world).length>1);
  const T=await import('../static/games/vendor/three.module.min.js'),geometry=realm.ArcadeCityTerrainMesh(T,world,data);
  assert.equal(geometry.attributes.position.count,geometry.attributes.normal.count);assert.ok(geometry.boundingSphere.radius>500);geometry.dispose();
  const restarted=realm.ArcadeCityWorld.create();assert.equal(await preload.terrain(restarted),data);
  await preload.navigation(restarted);assert.equal(restarted.roadGraph.nodes,world.roadGraph.nodes);
  assert.equal(starts,2,'restarting must not launch another terrain or navigation job');
});
