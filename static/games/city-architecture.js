/* Seeded architecture and street plans; shared by rendering and structural QA. */
window.ArcadeCityArchitecture=(()=>{
  const kinds=['brick','townhouse','courtyard','villa','mansard','art-deco','glass','terraced','twin-tower','sawtooth','warehouse','hotel','fins','shop'];
  const palettes=[0xd6bda5,0xc99578,0xe7d8c2,0xa9b8b3,0xc7cbc5,0xdfc7b4,0x98aaaf,0xb5bdad,0xcab6a3,0xe5e0d4,0xa0b3bc,0xbca69c,0xc9d2cc,0xd3c29e,0xadb8c8,0xc0a996];
  const trims=[0x6b7775,0xd9d1bd,0x78868d,0x9b826b,0xe8dfcb,0x577b76,0x837b75,0xb5a28a];
  const shopNames=['街角书店','海湾花房','山海面包','旧城唱片','潮汐工坊','海风杂货','晴日洗衣','港湾药房','青禾餐馆','晨光便利','白帆旅舍','岛屿设计','暮色茶屋','松石银行','城市工作室','南风服饰','木与石','海岸邮局','拾光影像','蓝湾旅店','小满食堂','星河文具','水岸画廊','旅行用品'];
  const streetNames=['西环大道','银杏路','体育大道','榕树街','公园西路','桂花街','文昌街','中央大道','海风街','学院路','公园东路','艺术大道','金融大道','白沙路','滨海大道','港口北路','晨曦街','枫林路','书院街','平安街','梧桐街','清和街','人民大道','长宁街','滨河街','华庭路','文化大道','南苑大道','体育南路','海湾南路'];
  function streetProfile(road){
    const lanes=road===0?3:[-320,-128,128,320].includes(road)?2:1;
    return {lanes,width:lanes===3?22:lanes===2?15.2:10,sidewalk:2.4,setback:2.2,laneCenters:lanes===1?[2.8]:Array.from({length:lanes},(_,i)=>2.3+i*3.4)};
  }
  // Two independently wound faces: each side has its own readable left-to-right UVs.
  function signGeometry(T,width=1,height=1){
    const g=new T.BufferGeometry(),positions=[],normals=[],uv=[],indices=[];
    for(const side of [1,-1]){const offset=positions.length/3;for(const [x,y,u,v]of [[-.5,.5,0,1],[.5,.5,1,1],[-.5,-.5,0,0],[.5,-.5,1,0]]){positions.push(x*width*side,y*height,.002*side);normals.push(0,0,side);uv.push(u,v);}indices.push(offset,offset+2,offset+1,offset+2,offset+3,offset+1);}
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
  }
  function design(b,index,seed=17,previous){
    let s=(Math.imul(index+1,2654435761)^seed)>>>0;s=Math.imul(s^(s>>>16),0x7feb352d);s=Math.imul(s^(s>>>15),0x846ca68b);s=(s^(s>>>16))>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
    const district=b.x>100&&b.z<-80?'business':b.x>250?'coast':b.z<-128?'old-town':b.x<-185&&b.z>100?'campus':'residential';
    const pools={business:['glass','terraced','twin-tower','fins','art-deco'],coast:['villa','hotel','courtyard','mansard','shop'], 'old-town':['brick','townhouse','mansard','sawtooth','shop'],campus:['warehouse','courtyard','terraced','brick','shop'],residential:['townhouse','courtyard','art-deco','shop','hotel','villa','brick']};
    const pool=pools[district];let pick=Math.floor(random()*pool.length);if(pool[pick]===previous)pick=(pick+1)%pool.length;const kind=pool[pick];
    const heightRanges={villa:[6,12],shop:[5,11],warehouse:[6,13],sawtooth:[7,15],mansard:[10,20],townhouse:[10,24],brick:[12,29],courtyard:[11,26],hotel:[18,40],'art-deco':[19,49],glass:[30,68],terraced:[20,52],'twin-tower':[32,70],fins:[26,63]};
    const range=heightRanges[kind],height=range[0]+random()*(range[1]-range[0]);
    const fronts=[];for(const road of [-320,-256,-192,-128,-96,-64,-32,0,32,64,96,128,192,256,320])fronts.push({d:Math.abs(b.x-road),r:road<b.x?-Math.PI/2:Math.PI/2},{d:Math.abs(b.z-road),r:road<b.z?0:Math.PI});fronts.sort((a,b)=>a.d-b.d);
    return {id:index,kind,district,height,rotation:fronts[0].r,color:palettes[Math.floor(random()*palettes.length)],trim:trims[Math.floor(random()*trims.length)],glass:[0x587383,0x6e8b91,0x496577,0x7c9199,0x4e726f][Math.floor(random()*5)],accent:[0xa16e59,0x5c8179,0x617d9a,0xb79b61,0x856e83][Math.floor(random()*5)],bays:2+Math.floor(random()*3),offset:(random()-.5)*.28,roof:random(),sign:Math.floor(random()*shopNames.length),windowPattern:Math.floor(random()*4),balconySide:random()>.5?1:-1};
  }
  function parts(b){
    const a=b.architecture,swap=Math.abs(Math.sin(a.rotation))>.5,w=swap?b.d:b.w,d=swap?b.w:b.d,H=b.h,out=[];
    const push=(x,y,z,bw,bh,bd,color=a.color,shape='box',surface='render',rotation=0)=>{const c=Math.cos(a.rotation),s=Math.sin(a.rotation);out.push({x:b.x+x*c-z*s,y,z:b.z+x*s+z*c,w:bw,h:bh,d:bd,color,shape,surface,rotation:a.rotation+rotation});};
    const masonry=a.kind==='brick'||a.kind==='townhouse'?'brickwork':a.kind==='warehouse'||a.kind==='sawtooth'?'cladding':a.kind==='art-deco'?'limestone':'render';
    let body=H-.7,roofHeight=.7;
    if(['villa','mansard','sawtooth','warehouse'].includes(a.kind)){roofHeight=Math.min(H*.25,2.2+a.roof*2);body=H-roofHeight;}
    const volume=(x,y,z,bw,bh,bd,surface=masonry,color=a.color)=>push(x,y,z,bw,bh,bd,color,'box',surface);
    if(['terraced','art-deco'].includes(a.kind)){
      volume(0,H*.29,0,w,H*.58,d);volume(w*a.offset,H*.71,d*.06,w*.8,H*.26,d*.8);volume(-w*a.offset,H*.92,d*.12,w*(a.kind==='art-deco'?.48:.58),H*.16,d*.55);body=H*.58;
      for(const [y,scale]of [[H*.58,1],[H*.84,.8]])push(0,y+.08,0,w*scale,.16,d*scale,a.trim);
    }else if(a.kind==='twin-tower'){
      volume(0,H*.09,0,w,H*.18,d);for(const side of [-1,1]){const top=side===a.balconySide?H:H*.86;volume(side*w*.27,(H*.18+top)/2,d*.03,w*.4,top-H*.18,d*.8,'glass',a.glass);for(let y=H*.18+3;y<top;y+=3.1){push(side*w*.27,y,d*.03,w*.41,.12,d*.81,a.trim);if((Math.round(y)+a.id)%3===0)push(side*w*.27,y-1.3,-d*.375,w*.21,1.4,.025,0xffd79c,'box','window-light');}}body=H*.18;
    }else if(a.kind==='courtyard'){
      volume(0,1.4,0,w,2.8,d);for(const side of [-1,1])volume(side*w*.34,(H+2.8)/2,0,w*.32,H-2.8,d);volume(0,(H+2.8)/2,d*.32,w*.4,H-2.8,d*.36);body=2.8;
    }else if(a.kind==='glass'||a.kind==='fins'){
      volume(0,1.4,0,w,2.8,d,'limestone',a.trim);volume(0,(H+2.8)/2,0,w*.88,H-2.8,d*.88,'glass',a.glass);
      for(let i=0;i<=a.bays+1;i++){const x=-w*.44+i*w*.88/(a.bays+1);push(x,(H+2.8)/2,-d*.45,.12,H-2.8,a.kind==='fins'?.55:.1,a.trim);}
      for(let y=3.1;y<H;y+=3.1)push(0,y,0,w*.9,.12,d*.9,a.trim);body=2.8;
      for(let y=4.5;y<H-1;y+=3.1)for(let col=0;col<a.bays;col++)if((Math.round(y)+col*3+a.id)%5<2)push(-w*.4+(col+.5)*w*.8/a.bays,y,-d*.449,w*.6/a.bays,1.45,.018,0xffd79c,'box','window-light');
    }else{volume(0,body/2,0,w,body,d);}
    if(['villa','warehouse'].includes(a.kind))push(0,body+roofHeight/2,0,w+.15,roofHeight,d+.15,a.accent,'gable','roof');
    else if(a.kind==='mansard'){
      push(0,body+roofHeight*.3,0,w,roofHeight*.6,d,a.accent,'pyramid','roof');push(0,body+roofHeight*.67,0,w*.65,roofHeight*.65,d*.65,a.accent,'gable','roof');
    }else if(a.kind==='sawtooth'){
      for(let i=0;i<3;i++)push(-w/2+w/6+i*w/3,body+roofHeight/2,0,w/3,roofHeight,d,a.accent,'gable','roof');
    }else if(!['terraced','art-deco','twin-tower','courtyard','glass','fins'].includes(a.kind)){
      push(0,body+.1,0,w+.12,.2,d+.12,a.trim,'box','roof');
      if(a.roof>.48)push(w*a.offset,body+.38,d*.15,w*.22,.55,d*.23,a.trim,'box','cladding');else push(w*.25,body+.35,d*.2,.55,.65,.6,a.accent);
    }
    if(a.kind==='terraced'||a.kind==='art-deco')for(const tier of [{bottom:H*.58,top:H*.84,cx:w*a.offset,front:-d*.34,width:w*.8},{bottom:H*.84,top:H,cx:-w*a.offset,front:-d*.155,width:w*(a.kind==='art-deco'?.48:.58)}])for(let y=tier.bottom+1.5;y<tier.top-.85;y+=3.1){push(tier.cx,y,tier.front-.04,tier.width*.8,1.5,.06,a.glass,'box','glass');for(let col=0;col<3;col++)push(tier.cx+(col-1)*tier.width*.26,y,tier.front-.08,.06,1.5,.04,a.trim);if((Math.round(y)+a.id)%3===0)push(tier.cx,y,tier.front-.09,tier.width*.21,1.35,.018,0xffd79c,'box','window-light');}
    if(a.kind==='terraced'){push(0,H*.58+.18,-d*.43,w*.64,.3,d*.1,0x809369,'box','grass-park');for(const side of [-1,1])push(side*w*.3,H*.58+.95,-d*.43,.09,1.8,.09,a.trim);push(0,H*.58+1.88,-d*.43,w*.7,.12,d*.12,a.accent);}
    if(a.kind==='warehouse'||a.kind==='sawtooth'){push(-w*.18,1.35,-d/2-.14,w*.5,2.7,.1,0x788991,'box','cladding');for(let y=.5;y<2.7;y+=.45)push(-w*.18,y,-d/2-.2,w*.5,.04,.035,a.trim);}
    if(a.kind==='courtyard')for(let y=4.3;y<H-.6;y+=3.1){for(const side of [-1,1])push(side*w*.34,y,-d/2-.04,w*.2,1.5,.06,a.glass,'box','glass');push(0,y,d*.14-.04,w*.3,1.5,.06,a.glass,'box','glass');}
    // Individually spaced, recessed-looking windows on the street-facing walls.
    const doorX=w*a.offset,floors=Math.max(1,Math.floor((body-.8)/3.1)),bays=Math.min(a.bays,Math.max(2,Math.floor(w/2)));
    for(let floor=0;floor<floors;floor++)for(let col=0;col<bays;col++){
      const x=-w/2+(col+.5)*w/bays,y=1.65+floor*(body-1.2)/floors,ww=w/bays*(a.windowPattern===1?.42:.61),wh=Math.min(1.6,(body-1.2)/floors*.57);
      const doorGap=floor===0&&Math.abs(x-doorX)<ww/2+.7;
      if(!doorGap){push(x,y,-d/2-.035,ww+.17,wh+.17,.09,a.trim);push(x,y,-d/2-.09,ww,wh,.055,a.glass,'box','glass');}
      push(w/2+.035,y,x*d/w,.09,wh+.17,ww*d/w+.17,a.trim);push(w/2+.09,y,x*d/w,.055,wh,ww*d/w,a.glass,'box','glass');
      if(!doorGap&&a.windowPattern===2)push(x,y,-d/2-.13,.055,wh,.035,a.trim);
      if(!doorGap&&a.windowPattern===3){push(x-ww*.65,y,-d/2-.09,ww*.18,wh+.15,.08,a.accent);push(x+ww*.65,y,-d/2-.09,ww*.18,wh+.15,.08,a.accent);}
      if(['hotel','townhouse','brick'].includes(a.kind)&&floor>0&&(col+floor+a.id)%3===0){push(x,y-wh*.55,-d/2-.45,ww+.35,.13,.9,a.trim);push(x,y-wh*.15,-d/2-.87,ww+.35,.42,.055,a.accent);}
      if(!doorGap&&(a.id+floor*7+col*3)%5<2)push(x,y,-d/2-.125,ww*.83,wh*.85,.012,0xffd79c,'box','window-light');
    }
    for(let floor=0;floor<floors;floor++){
      const y=1.65+floor*(body-1.2)/floors,wh=Math.min(1.6,(body-1.2)/floors*.57);
      push(0,y,d/2+.04,w*.72,wh,.055,a.glass,'box','glass');push(-w/2-.04,y,0,.055,wh,d*.72,a.glass,'box','glass');
      for(const side of [-1,1]){push(side*w*.13,y,d/2+.08,.055,wh,.04,a.trim);push(-w/2-.08,y,side*d*.13,.04,wh,.055,a.trim);}
      if((a.id+floor)%3===0){push(w*a.offset,y,d/2+.08,w*.18,wh*.88,.018,0xffd79c,'box','window-light');push(-w/2-.08,y,d*a.offset,.018,wh*.88,d*.18,0xffd79c,'box','window-light');}
    }
    push(doorX,1.05,-d/2-.12,Math.min(1.3,w*.2),2.1,.12,a.glass,'box','glass');
    if(a.kind==='shop'||a.id%3===0){push(doorX,2.8,-d/2-.6,w*.8,.17,1.2,a.accent);push(0,3.35,-d/2-.15,w*.78,.75,1,0xffffff,'sign-'+a.sign,'signage');}
    else if(a.kind==='art-deco')for(const side of [-1,1])push(side*w*.43,body/2,-d/2-.14,.22,body,.2,a.trim);
    return out;
  }
  function infrastructure(roads){
    const crossings=[],sidewalks=[],lamps=[],signs=[],stopLines=[],segments=[-344,...roads,344];
    for(const road of roads){const profile=streetProfile(road),edge=profile.width/2;
      for(let i=0;i<segments.length-1;i++){
        const lo=segments[i]+(i?streetProfile(segments[i]).width/2+2:0),hi=segments[i+1]-(i<segments.length-2?streetProfile(segments[i+1]).width/2+2:0);if(hi<=lo)continue;const mid=(lo+hi)/2,length=hi-lo;
        for(const side of [-1,1]){const curb=edge+profile.sidewalk/2;sidewalks.push({x:road+side*curb,z:mid,w:profile.sidewalk,d:length,axis:'z'},{x:mid,z:road+side*curb,w:length,d:profile.sidewalk,axis:'x'});}
        if(length>10){const side=(i+roads.indexOf(road))%2?1:-1,curb=edge+1.35,head=edge-1.5;lamps.push({x:road+side*curb,z:mid,headX:road+side*head,headZ:mid,h:6.2,axis:'z',side},{x:mid,z:road-side*curb,headX:mid,headZ:road-side*head,h:6.2,axis:'x',side:-side});}
      }
    }
    for(let ix=0;ix<roads.length;ix++)for(let iz=0;iz<roads.length;iz++){
      const x=roads[ix],z=roads[iz],wx=streetProfile(x).width,wz=streetProfile(z).width,nx=Math.floor((wx-.6)/1.05),nz=Math.floor((wz-.6)/1.05);
      for(const side of [-1,1]){for(let strip=0;strip<nx;strip++)crossings.push({x:x+(strip-(nx-1)/2)*1.05,z:z+side*(wz/2+3),w:.65,d:2});for(let strip=0;strip<nz;strip++)crossings.push({x:x+side*(wx/2+3),z:z+(strip-(nz-1)/2)*1.05,w:2,d:.65});}
      stopLines.push({x:x-wx/4,z:z-wz/2-6.2,w:wx/2-.8,d:.18},{x:x+wx/4,z:z+wz/2+6.2,w:wx/2-.8,d:.18},{x:x-wx/2-6.2,z:z+wz/4,w:.18,d:wz/2-.8},{x:x+wx/2+6.2,z:z-wz/4,w:.18,d:wz/2-.8});
      if((ix+iz)%2===0)signs.push({x:x+wx/2+1.35,z:z+wz/2+1.35,street:ix,crossStreet:roads.length+iz});
    }
    return {crossings,sidewalks,lamps,signs,stopLines};
  }
  return {design,parts,infrastructure,kinds,shopNames,streetNames,streetProfile,signGeometry};
})();
