import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../static/games/vendor/three.module.min.js';

// CPU scene tests use actual Three geometry/materials. They do not claim to test GPU output.
const scope={devicePixelRatio:1};scope.window=scope;vm.createContext(scope);
for(const name of ['ski-world','ski-skier','ski-view'])vm.runInContext(fs.readFileSync(new URL('../static/games/'+name+'.js',import.meta.url),'utf8'),scope);
const meta=JSON.parse(fs.readFileSync(new URL('../static/games/ski-data/provenance.json',import.meta.url))),raw=fs.readFileSync(new URL('../static/games/ski-data/montblanc-dem.bin',import.meta.url));
const world=scope.MontBlancWorld.create(meta,raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
let rendered=0;
class Renderer{shadowMap={};capabilities={getMaxAnisotropy:()=>1};setPixelRatio(){}setSize(){}render(scene,camera){rendered++;assert.ok([...camera.matrixWorld.elements].every(Number.isFinite));}dispose(){}}
class TextureLoader{load(){return new THREE.Texture();}}
const view=scope.MontBlancView({...THREE,WebGLRenderer:Renderer,TextureLoader},{},world);
view.resize(1200,760);view.draw(.016,2);
const patch=view.scene.getObjectByName('deformable-snow'),terrain=view.scene.getObjectByName('real-montblanc-dem');
function triangleHeight(x,z){const N=meta.size,u=(x/meta.width+.5)*(N-1),v=(z/meta.depth+.5)*(N-1),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,h=n=>terrain.geometry.attributes.position.getY(n),k=j*N+i;return a+b<=1?h(k)+(h(k+1)-h(k))*a+(h(k+N)-h(k))*b:h(k+N+1)+(h(k+N)-h(k+N+1))*(1-a)+(h(k+1)-h(k+N+1))*(1-b);}
test('Near snow joins the actual far triangle surface without a height gap',()=>{
 assert.equal(terrain.geometry.attributes.position.count,meta.size**2);
 const p=patch.geometry.attributes.position,n=patch.geometry.attributes.normal;
 for(const id of [0,100,200,200*201,201*201-1]){const x=patch.position.x+p.getX(id),z=patch.position.z+p.getZ(id);assert.ok(Math.abs(p.getY(id)-triangleHeight(x,z)-.014)<.002);}
 assert.ok([...n.array].every(Number.isFinite));
 const center=(p.count-1)/2,before=p.getY(center);scope.MontBlancWorld.carvePoint(world,patch.position.x,patch.position.z);view.updateSnow();assert.ok(p.getY(center)<before-.1);
});
test('Articulated skiing, recovery, avalanche and both cameras keep a finite scene',()=>{
 const skier=view.scene.getObjectByName('articulated-skier');assert.ok(skier);let meshes=0;skier.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes>50);
 for(let i=0;i<480;i++)scope.MontBlancWorld.step(world,1/120,{forward:true,right:i>240});view.draw(.016,0);
 scope.MontBlancWorld.trigger(world);for(let i=0;i<60;i++)scope.MontBlancWorld.step(world,1/120,{});view.draw(.016,1);view.draw(.016,3);
 scope.MontBlancWorld.recover(world);view.draw(.016,0);
 view.scene.updateMatrixWorld(true);view.scene.traverse(o=>assert.ok([...o.matrixWorld.elements].every(Number.isFinite),o.name));assert.ok(rendered>=4);
 view.dispose();
});
