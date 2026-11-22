const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

test('Clipped forest terrain has complete GPU vertex buffers and valid culling bounds',async()=>{
  // Use the shipped Three.js implementation: computeVertexNormals reuses an
  // existing attribute and does not grow it when clipping adds more vertices.
  const T=await import('../static/games/vendor/three.module.min.js');
  const realm={document:{createElement:()=>({width:0,height:0,getContext:()=>null})}};realm.window=realm;vm.createContext(realm);
  for(const name of ['city-architecture','city-terrain','city-interiors','city-world','city-terrain-mesh','city-landscape'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/games/'+name+'.js'),'utf8'),realm);
  const state=realm.ArcadeCityWorld.create(),exterior=new T.Group(),materials=new Map(),texture=new T.Texture();
  const material=key=>{if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({map:texture}));return materials.get(key);};
  const detail={finish:i=>material('finish-'+i),nature:i=>material('nature-'+i),plant:(i,under)=>material('plant-'+i+'-'+under)};
  const landscape=realm.ArcadeCityLandscape(T,{state,exterior,detail,material,assets:{surfaceTexture:()=>texture,waterNormal:()=>texture},batch:()=>{}});
  const forest=exterior.getObjectByName('forest-terrain'),geometry=forest.geometry,positions=geometry.getAttribute('position');
  assert.ok(positions.count>243*553,'portal clipping must actually add vertices in this regression fixture');
  for(const name of ['normal','uv'])assert.equal(geometry.getAttribute(name).count,positions.count,name+' must cover every clipped vertex');
  let maxIndex=0;for(const index of geometry.index.array)maxIndex=Math.max(maxIndex,index);
  for(const [name,attribute]of Object.entries(geometry.attributes)){
    assert.ok(maxIndex<attribute.count,name+' buffer must be large enough for WebGL drawElements');
    assert.ok(attribute.array.every(Number.isFinite),name+' buffer contains only finite values');
  }
  assert.ok(geometry.boundingBox&&!geometry.boundingBox.isEmpty());assert.ok(geometry.boundingSphere&&Number.isFinite(geometry.boundingSphere.radius));
  const p=new T.Vector3();for(let i=0;i<positions.count;i+=97){p.fromBufferAttribute(positions,i);assert.ok(geometry.boundingBox.containsPoint(p));assert.ok(p.distanceTo(geometry.boundingSphere.center)<=geometry.boundingSphere.radius+.001);}
  assert.ok(forest.material.map,'the forest surface retains its texture');
  const reused=realm.ArcadeCityTerrainMesh(T,state);assert.equal(reused.attributes.position.array,positions.array,'restarting the same city reuses the already clipped terrain buffers');assert.equal(reused.attributes.normal.count,positions.count);reused.dispose();
  landscape.dispose();texture.dispose();for(const m of materials.values())m.dispose();exterior.traverse(o=>o.geometry?.dispose());
});
