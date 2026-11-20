const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'static/games/city-materials.js'),'utf8');
function setup(){
  const requests=[];let ready=0;
  class Texture{
    constructor(){this.source={data:null};this.repeat={set:(x,y)=>{this.repeat.x=x;this.repeat.y=y;}};this.offset={set:(x,y)=>{this.offset.x=x;this.offset.y=y;}};}
    get image(){return this.source.data;}set image(value){this.source.data=value;}
    clone(){const next=new Texture();next.source=this.source;next.colorSpace=this.colorSpace;next.anisotropy=this.anisotropy;return next;}
    dispose(){this.disposed=true;}
  }
  class TextureLoader{load(url,done,progress,error){const texture=new Texture();requests.push({url,texture,done,error});return texture;}}
  class DataTexture extends Texture{constructor(data,width,height){super();this.image={data,width,height};}}
  class Material{constructor(options){Object.assign(this,options);}dispose(){this.disposed=true;}}
  const T={Texture,TextureLoader,DataTexture,MeshStandardMaterial:Material,MeshPhysicalMaterial:Material,SRGBColorSpace:'srgb',RepeatWrapping:'repeat',ClampToEdgeWrapping:'clamp',EquirectangularReflectionMapping:'equirectangular',LinearMipmapLinearFilter:'mipmap',DoubleSide:2};
  const realm={window:{},document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}})})}};vm.createContext(realm);vm.runInContext(source,realm);
  const assets=realm.window.ArcadeCityMaterials(T,{capabilities:{getMaxAnisotropy:()=>16}},()=>ready++);
  return {assets,requests,get ready(){return ready;}};
}
test('Every generated photo is local and recorded with its exact prompt',()=>{
  const {requests}=setup();assert.equal(requests.length,5);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'static/games/textures/generation.json'),'utf8'));
  assert.equal(manifest.tool,'Built-in image_gen');assert.equal(manifest.assets.length,5);
  for(const request of requests){assert.ok(request.url.startsWith('/games/textures/'));assert.ok(fs.statSync(path.join(root,'static',request.url)).size>1000);assert.ok(manifest.assets.some(a=>request.url.endsWith(a.file)&&a.prompt.length>100));}
});
test('Facade and road materials use photo maps, bump detail and appropriate repeat factors',()=>{
  const {assets}=setup(),facade=assets.material(0xffffff,0,'facade:3'),road=assets.material(0xffffff,0,'road-v');
  assert.ok(facade.map&&facade.bumpMap);assert.equal(facade.map.repeat.y,3);assert.equal(facade.map.colorSpace,'srgb');assert.ok(road.map.repeat.y>road.map.repeat.x);
  assert.equal(road.map.anisotropy,8);
});
test('Foliage retains actual PNG transparency and uses alpha-tested double-sided material',()=>{
  const {assets}=setup(),mat=assets.material(0xffffff,0,'foliage');assert.ok(mat.map);assert.equal(mat.alphaTest,.5);assert.equal(mat.side,2);assert.equal(mat.transparent,false);
  const png=fs.readFileSync(path.join(root,'static/games/textures/tree-coast-v1.png'));assert.equal(png.toString('ascii',1,4),'PNG');assert.equal(png[25],6);
});
test('The sky becomes available asynchronously and disposed scenes cannot receive late updates',()=>{
  const first=setup(),sky=first.requests.find(r=>r.url.includes('sky-'));sky.done(sky.texture);assert.equal(first.ready,1);
  const second=setup();second.assets.dispose();const late=second.requests.find(r=>r.url.includes('sky-'));late.done(late.texture);assert.equal(second.ready,0);assert.equal(late.texture.disposed,true);
});
test('Missing textures fall back to neutral surfaces, and all owned textures are released',()=>{
  const {assets,requests}=setup(),mat=assets.material(0xffffff,0,'facade:2');requests.find(r=>r.url.includes('facade-')).error();assert.equal(mat.map,null);assert.equal(mat.bumpMap,null);
  assets.dispose();for(const texture of assets.textures)assert.equal(texture.disposed,true);
});
test('Brick, stone, plaster and metal skins use separate detailed surfaces, while lamp and window emission starts off',()=>{
  const {assets}=setup(),surfaces=['brickwork','limestone','render','cladding'].map(name=>assets.material(0xffffff,0,name));
  assert.equal(new Set(surfaces.map(mat=>mat.map)).size,4);for(const mat of surfaces)assert.ok(mat.map&&mat.bumpMap&&mat.map.image.data.length>0);
  const brick=surfaces[0];assert.equal(brick.map.repeat.x,4);assert.equal(brick.map.repeat.y,12);
  for(const name of ['lamp-lens','window-light']){const mat=assets.material(0xffffff,0,name);assert.equal(mat.emissiveIntensity,0);assert.ok(mat.emissive);}
});

test('Sky normalization produces an integral cubemap mip chain and photo variants wait for pixels',()=>{
  const {assets,requests}=setup(),facade=assets.material(0xffffff,0,'facade:3'),photo=requests.find(r=>r.url.includes('facade-'));
  assert.equal(facade.map.needsUpdate,undefined);photo.texture.image={width:1024,height:1024};photo.done(photo.texture);assert.equal(facade.map.image.width,1024);assert.equal(facade.map.needsUpdate,true);
  const sky=requests.find(r=>r.url.includes('sky-'));sky.texture.image={width:1774,height:887};sky.done(sky.texture);assert.equal(assets.sky.image.width,1024);assert.equal(assets.sky.image.height,512);
});
