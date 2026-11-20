/* Generated photographic assets + shared PBR materials. All URLs are local. */
window.ArcadeCityMaterials = (T,renderer,onSkyReady) => {
  const loader=new T.TextureLoader(),textures=new Set(),materials=new Map(),families=new Map();
  const maxAnisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||1);
  let disposed=false;
  function photo(name,file){
    const family=new Set();families.set(name,family);
    const texture=loader.load(`/games/textures/${file}`,loaded=>{
      if(disposed){loaded.dispose();return;}
      // Keep the cubemap's mip chain integral on ANGLE as well as native GL.
      if(name==='sky'&&loaded.image){const panorama=document.createElement('canvas');panorama.width=1024;panorama.height=512;const ctx=panorama.getContext('2d');if(ctx){ctx.drawImage(loaded.image,0,0,1024,512);loaded.image=panorama;loaded.needsUpdate=true;}}
      for(const item of family)item.needsUpdate=true;
      if(name==='sky')onSkyReady?.(loaded);
    },undefined,()=>{
      if(disposed)return;
      // A missing image keeps the geometry and its neutral material usable.
      for(const mat of materials.values())if(family.has(mat.map)){mat.map=null;mat.bumpMap=null;mat.emissiveMap=null;mat.needsUpdate=true;}
    });
    texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=maxAnisotropy;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    family.add(texture);textures.add(texture);return texture;
  }
  const source={
    facade:photo('facade','facade-v1.jpg'),asphalt:photo('asphalt','asphalt-v1.jpg'),
    grass:photo('grass','grass-v1.jpg'),tree:photo('tree','tree-coast-v1.png'),sky:photo('sky','sky-coast-v1.jpg')
  };
  source.sky.mapping=T.EquirectangularReflectionMapping;
  source.tree.wrapS=source.tree.wrapT=T.ClampToEdgeWrapping;
  const variants=new Map();
  function tile(name,u=1,v=1,offset=0){
    const key=`${name}:${u}:${v}:${offset}`;
    if(variants.has(key))return variants.get(key);
    const texture=T.Texture?new T.Texture():source[name].clone();if(T.Texture){texture.source=source[name].source;texture.colorSpace=source[name].colorSpace;texture.anisotropy=maxAnisotropy;texture.wrapS=texture.wrapT=T.RepeatWrapping;}texture.repeat.set(u,v);texture.offset.set(offset,0);if(texture.image)texture.needsUpdate=true;
    families.get(name).add(texture);textures.add(texture);variants.set(key,texture);return texture;
  }
  // Lightweight procedural secondary surfaces complement the generated photos.
  function grain(seedColor,paving=false){
    const size=128,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const noise=((Math.imul(x+13,374761393)^Math.imul(y+7,668265263))>>>0)%21-10;
      const joint=paving&&(x%64<2||y%64<2)?-.22:0;
      const i=(y*size+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,seedColor[c]*(1+joint)+noise));data[i+3]=255;
    }
    const texture=new T.DataTexture(data,size,size);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.anisotropy=maxAnisotropy;texture.needsUpdate=true;textures.add(texture);return texture;
  }
  const paving=grain([174,171,160],true),sand=grain([203,187,154]);
  function masonry(brick){
    const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const joint=brick?(y%8<1||(x+(Math.floor(y/8)%2)*8)%16<1):x%16===0,noise=((x*17+y*31)%13)-6,i=(y*size+x)*4;
      for(let c=0;c<3;c++)data[i+c]=(joint?143:brick?[208,197,181][c]:[202,207,208][c])+noise;data[i+3]=255;
    }const texture=new T.DataTexture(data,size,size);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(4,brick?12:8);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.anisotropy=maxAnisotropy;texture.needsUpdate=true;textures.add(texture);return texture;
  }
  function secondary(base,u,v){const t=base.clone();t.repeat.set(u,v);t.needsUpdate=true;textures.add(t);return t;}
  const surfaces={
    'road-v':tile('asphalt',5,344),'road-h':tile('asphalt',336,5),'roof':tile('asphalt',2,2),
    'grass-land':tile('grass',294,282),'grass-park':tile('grass',9,9),
    'paving-v':secondary(paving,1,344),'paving-h':secondary(paving,336,1),
    'path-v':secondary(paving,2,12),'path-h':secondary(paving,12,2),'sand':secondary(sand,28,282),
    brickwork:masonry(true),cladding:masonry(false),limestone:grain([220,217,204],true),render:grain([225,223,215])
  };
  function material(color,emissive=0,surface='paint'){
    const key=`${color}:${emissive}:${surface}`;if(materials.has(key))return materials.get(key);
    let mat;
    if(surface==='foliage'){
      mat=new T.MeshStandardMaterial({color:0xffffff,map:source.tree,alphaTest:.5,side:T.DoubleSide,roughness:1,transparent:false,emissiveMap:source.tree,emissive:0xffffff,emissiveIntensity:.13,alphaToCoverage:true});
      mat.shadowSide=T.DoubleSide;
    }else if(surface==='car'){
      mat=new T.MeshPhysicalMaterial({color,roughness:.27,metalness:.55,clearcoat:.9,clearcoatRoughness:.2});
    }else if(surface==='glass'){
      mat=new T.MeshPhysicalMaterial({color,roughness:.12,metalness:.45,clearcoat:1,clearcoatRoughness:.06});
    }else if(surface==='lamp-lens'||surface==='window-light'){
      mat=new T.MeshStandardMaterial({color:surface==='lamp-lens'?0xf3ead8:0x384a54,emissive:0xffd19a,emissiveIntensity:0,roughness:.4});
    }else{
      let map=surfaces[surface];
      if(surface.startsWith('facade:'))map=tile('facade',Number(surface.split(':')[2]||1),Number(surface.split(':')[1]),(color%3)/3);
      mat=new T.MeshStandardMaterial({color,roughness:surface.startsWith('road') ? .94 : .83,metalness:0,emissive,emissiveIntensity:emissive ? .45 : 0,map:map||null});
      if(map){mat.bumpMap=map;mat.bumpScale=surface.startsWith('facade') ? .055 : surface.startsWith('road') ? .024 : .018;}
    }
    mat.name=surface;materials.set(key,mat);return mat;
  }
  function waterNormal(){
    const size=128,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4,dx=Math.sin(x/size*Math.PI*16+y/size*Math.PI*8)*.22+Math.sin(y/size*Math.PI*32)*.09,dy=Math.cos(y/size*Math.PI*16-x/size*Math.PI*12)*.18;
      const n=Math.hypot(dx,dy,1);data[i]=127+dx/n*127;data[i+1]=127+dy/n*127;data[i+2]=127+127/n;data[i+3]=255;
    }
    const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(45,65);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.needsUpdate=true;textures.add(texture);return texture;
  }
  function dispose(){disposed=true;for(const texture of textures)texture.dispose();for(const mat of materials.values())mat.dispose();}
  return {material,textures,materials,sky:source.sky,waterNormal,surfaceTexture:tile,dispose};
};
