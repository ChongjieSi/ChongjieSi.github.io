/* Authored interior programmes, varied per address and floor. No scene allocation here. */
window.ArcadeCityInteriors=(()=>{
  const types={brick:'residential',townhouse:'residential',courtyard:'courtyard',villa:'residential',mansard:'studio','art-deco':'office',glass:'office',terraced:'office','twin-tower':'office',sawtooth:'studio',warehouse:'warehouse',hotel:'hotel',fins:'office',shop:'shop'};
  const titles={residential:'花园寓所',courtyard:'庭院人家',studio:'城市创意工坊',office:'海湾商务楼',warehouse:'港湾仓储工坊',hotel:'白帆旅店',shop:'街角商铺'};
  function assign(b){
    const a=b.architecture,type=types[a.kind],r=a.rotation,w=Math.abs(Math.sin(r))>.5?b.d:b.w,d=Math.abs(Math.sin(r))>.5?b.w:b.d,offset=w*a.offset;
    b.id='building-'+a.id;b.interiorType=type;b.shopType=['bookshop','florist','bakery','records','workshop','convenience','laundry','pharmacy','cafe','convenience','boutique','studio','cafe','bank','studio','boutique','workshop','postoffice','gallery','boutique','cafe','bookshop','gallery','convenience'][a.sign];b.floorCount=Math.max(1,Math.floor((b.h+.4)/3.25));b.name=(type==='shop'?window.ArcadeCityArchitecture.shopNames[a.sign]:titles[type])+' · '+String(a.id+1).padStart(3,'0');
    b.door={x:b.x+offset*Math.cos(r)+Math.sin(r)*(d/2+1.2),z:b.z+offset*Math.sin(r)-Math.cos(r)*(d/2+1.2)};return b;
  }
  function plan(b,floor=0){
    floor=Math.max(0,Math.min(b.floorCount-1,Math.floor(floor)));const id=b.architecture.id,baseType=b.interiorType,type=baseType==='hotel'&&floor>0?'guestroom':baseType==='shop'&&floor>0?'studio':baseType==='warehouse'&&floor>0?'studio':baseType==='shop'?(b.shopType||'convenience'):baseType;
    const width=Math.max(13,Math.min(23,b.w*1.35+4)),depth=Math.max(17,Math.min(27,b.d*1.45+6)),height=type==='warehouse'?5.8:['residential','guestroom'].includes(type)?3.5:type==='studio'?3.9:4.2,furniture=[],obstacles=[],hotspots=[];
    const add=(kind,x,z,w,d,rotation=0,extra={})=>{const item={kind,x,z,w,d,rotation,...extra};furniture.push(item);if(!['rug','picture','window','pendant','wall-detail'].includes(kind))obstacles.push({x,z,w,d,rotation});return item;};
    const left=-width*.28,right=width*.28,back=-depth*.28,front=depth*.18,flip=(id+floor)%2?1:-1;
    const seating=(x,z,angle=0)=>{add('sofa',x,z,3.1,1.05,angle);add('table',x,z+1.7,1.65,.85);add('rug',x,z+1.4,4.5,3.4,0,{art:(id+floor)%2?3:9});};
    const study=(x,z)=>{add('desk',x,z,2.6,1.15,0,{variant:id%3});add('chair',x,z+1.25,.62,.65);};
    const kitchen=(x,z)=>{add('kitchen',x,z,5.2,1.2);hotspots.push({kind:'room-note',x,z:z+1.8,label:'查看住户手册'});};
    const bed=(x,z)=>{add('bed',x,z,2.1,2.6,0,{finish:8+(id%2)});for(const side of [-1,1])add('nightstand',x+side*1.7,z-.8,.65,.65);add('wardrobe',width/2-.65,depth*.2,1.1,2.8);};
    const bathroom=(x,z)=>{add('bath-floor',x,z,3.1,3.5);add('shower',x+.6,z-.5,1.7,1.7);add('sink',x-.95,z+.2,.75,.7);add('toilet',x-.55,z+1.2,.7,.8);add('partition',x-1.65,z,.12,3.9);add('partition',x+.85,z+1.95,1.7,.12);};
    if(type==='residential'||type==='courtyard'){
      seating(left,-.2);bed(right,-depth*.09);kitchen(left,-depth/2+.8);add('dining',left,back+2.5,2.4,1.4);for(const side of [-1,1])add('chair',left+side*1.65,back+2.5,.65,.65,side*Math.PI/2);
      bathroom(right,-depth/2+2.1);if(b.w>=11)study(right,front+1.4);if(type==='courtyard')add('plant',0,-depth/2+.7,.9,.9,0,{variant:3});
    }else if(type==='guestroom'){
      bed(right,-depth*.05);seating(left,front-1);study(left,back+1);bathroom(left,-depth/2+2);add('console',right,front+2.7,3.4,.65);hotspots.push({kind:'room-note',x:left,z:back+2.5,label:'翻阅旅店留言册'});
    }else if(type==='hotel'){
      add('reception',left,front,4,1.4);hotspots.push({kind:'room-note',x:left,z:front+1.8,label:'查看城市旅行册'});seating(right,-1.5);seating(left,back+2);add('luggage',right,depth/2-1.2,2.5,1);add('shelf',width/2-.55,back,4.2,1,Math.PI/2);
    }else if(type==='office'){
      for(const x of [left,right])for(const z of [back,-.2])study(x,z);add('conference',left,front+1,3.5,1.5);add('chair',left,front+2.4,.65,.65);add('chair',left-2.25,front+1,.65,.65,Math.PI/2);add('sofa',right,front+1,3,1.1);add('shelf',-width/2+.55,-.2,4,1,-Math.PI/2);add('coffee-station',right,-depth/2+.8,3,1);
      hotspots.push({kind:'room-note',x:right,z:-depth/2+2.2,label:'查看工作区留言'});
    }else if(['cafe','bakery'].includes(type)){
      add('coffee-station',left,-depth/2+.85,5,1.3);add('pastry-case',right,-depth/2+1.4,3.5,1.5,0,{stock:id%3});
      for(const x of [left,right]){add('dining',x,-.4,2,1.3);add('chair',x,-1.6,.65,.65);add('chair',x,.9,.65,.65,Math.PI);}add('menu-board',left,-depth/2+.1,3,1.7,0,{art:10,y:2.8});
      if(type==='bakery'){add('oven',-width/2+.7,-1,1.1,2.8);add('bread-rack',width/2-.7,front,3.5,1.1,Math.PI/2);}else{add('sofa',right,front+2.3,3,1);add('rug',right,front,3.8,2.5,0,{art:3});}
      hotspots.push({kind:'room-note',x:0,z:-depth/2+3,label:type==='bakery'?'查看今日烘焙菜单':'翻阅咖啡风味手册'});
    }else if(type==='bank'||type==='postoffice'){
      for(const x of [left,right]){add('teller',x,-depth*.22,3,1.2);add('chair',x,-depth*.22+1.4,.6,.6);}add('atm',width/2-.7,front,1.1,1.3,Math.PI/2);add('sofa',left,front,2.5,1);add('queue-terminal',right,front+2, .6,.6);add('vault',0,-depth/2+.3,3.2,.5);hotspots.push({kind:'room-note',x:0,z:1,label:type==='bank'?'查看便民服务指南':'查看城市邮路图'});
    }else if(type==='florist'){
      for(const x of [left,right])for(const z of [back,0,front]){add('display',x,z,1.8,1.5,0,{stock:2});add('plant',x,z,1,1,0,{variant:(id+Math.round(z))&3});}add('reception',0,-depth/2+1,3.5,1.2);hotspots.push({kind:'room-note',x:0,z:back+1,label:'阅读花木养护卡'});
    }else if(type==='gallery'||type==='studio'||type==='workshop'){
      study(left,front);for(const x of [left,right])add('easel',x,back,1.8,1.6,0,{art:(id+floor+(x>0?1:0))%3});add('workbench',right,front,3,1.3);add('sofa',left,-.5,2.8,1);hotspots.push({kind:'room-note',x:0,z:back,label:'阅读本店创作档案'});
    }else if(['shop','convenience','bookshop','pharmacy','records','boutique','laundry'].includes(type)){
      for(const x of [-width/2+.6,width/2-.6])add('shelf',x,-1.5,depth*.52,1.1,x<0?-Math.PI/2:Math.PI/2,{stock:id%4});for(const x of [left,right])for(const z of [back+1.5,front-.5])add('display',x,z,2.2,2.1,0,{stock:id%4});add('reception',0,-depth/2+1,4.4,1.4);if(type==='convenience'||type==='pharmacy')add('fridge',0,-depth/2+.2,3.6,.7);if(type==='boutique')add('clothes-rail',right,front+2,2.3,.6);if(type==='laundry')for(const f of furniture)if(f.kind==='display')f.kind='washer';hotspots.push({kind:'room-note',x:0,z:-depth/2+2.9,label:'翻阅店主手记'});
    }else if(type==='warehouse'){
      for(const x of [-width/2+1.1,width/2-1.1])for(const z of [back,front-1])add('stockrack',x,z,4.1,1.9,x<0?-Math.PI/2:Math.PI/2,{stock:id%3});add('workbench',0,-depth/2+1.2,4.2,1.6);add('pallet',left,front+3.1,2,1.6);hotspots.push({kind:'room-note',x:0,z:-depth/2+3,label:'查看工坊工作记录'});
    }else{
      study(left,front);add('workbench',left,back,3.8,1.4);add('sofa',right,front,3.1,1.1);add('easel',right,back,1.8,1.6,0,{art:(id+floor)%3});add('easel',0,back-1.5,1.7,1.6,0,{art:12});add('shelf',-width/2+.55,-1,4,1,-Math.PI/2);hotspots.push({kind:'room-note',x:left,z:back+1.8,label:'阅读创作笔记'});
    }
    // A continuous entry-to-back circulation spine is preserved in every programme.
    add('plant',-width/2+1.1,-depth/2+1.1,1,1,0,{variant:(id+1)%4});add('plant',width/2-1.1,depth/2-1.1,1,1,0,{variant:(id+2)%4});
    add('picture',-width*.24,-depth/2+.08,3.3,2.1,0,{art:(id+floor)%3,y:2.4});add('picture',width*.25,-depth/2+.08,2.6,1.8,0,{art:(id+floor)%2?12:13,y:2.5});
    for(const side of [-1,1])add('window',side*(width/2-.035),0,4.8,2.3,side*Math.PI/2,{y:Math.min(2.2,height-1.3)});
    add('pendant',0,front-1,1,1,0,{y:height-.45});add('rug',0,depth/2-3.3,2.2,2.4,0,{art:9});
    const lift={x:-width/2+1.2,z:depth/2-1.35};if(b.floorCount>1)hotspots.push({kind:'elevator',...lift,label:'选择楼层'});
    if(!hotspots.some(h=>h.kind==='room-note'))hotspots.push({kind:'room-note',x:left,z:2,label:'查看生活手册'});
    const actualW=Math.max(8.4,Math.min(23,b.w+1.1)),actualD=Math.max(11.6,Math.min(27,b.d+3)),sx=actualW/width,sz=actualD/depth,size=Math.max(.75,Math.min(sx,sz));
    for(const f of furniture){f.x*=sx;f.z*=sz;f.w*=size;f.d*=size;if(f.kind==='window'){f.w=Math.min(f.w,actualD*.6);f.d=Math.min(f.d,2.2);}}for(const h of hotspots){h.x*=sx;h.z*=sz;}lift.x*=sx;lift.z*=sz;
    if(flip>0){for(const f of furniture){f.x=-f.x;f.rotation=f.kind==='wardrobe'?Math.PI:-f.rotation;}for(const h of hotspots)h.x=-h.x;lift.x=-lift.x;}
    const floors={residential:[0,15,3],courtyard:[3,15],studio:[15,13,0],office:[12,0,2],shop:[2,3,15],hotel:[11,3],guestroom:[12,15],warehouse:[13]},floorFinishes=floors[type]||[2,3,15];
    const themes=[{name:'浅橡木与亚麻',wood:0,wall:5,color:0x839a88,light:0xffe9ce},{name:'胡桃木与黄铜',wood:1,wall:3,color:0xb58a64,light:0xffd5a5},{name:'海盐蓝与白石',wood:0,wall:5,color:0x7b9cae,light:0xe2efff},{name:'红砖与黑钢',wood:1,wall:7,color:0x967e70,light:0xffe1bf},{name:'奶油色与陶土',wood:0,wall:5,color:0xc69a87,light:0xffe5cd},{name:'墨绿与深色木作',wood:6,wall:3,color:0x698578,light:0xffdda8},{name:'暖灰与雾紫',wood:1,wall:5,color:0x9d8fa7,light:0xffe9e0},{name:'沙色与藤木',wood:0,wall:3,color:0xb6a27f,light:0xffe6bd}],signature=(Math.imul(id+1,2654435761)^Math.imul(floor+3,2246822519))>>>0,theme=themes[signature%themes.length];
    for(let i=0;i<furniture.length;i++){const f=furniture[i],seed=(signature+Math.imul(i+1,374761393))>>>0;f.detailSeed=seed;if(['sofa','bed','desk','dining','table','display'].includes(f.kind)){f.w*=.91+(seed%9)/100;f.d*=.94+(seed%6)/100;}if(['picture','menu-board'].includes(f.kind))f.art=[0,1,2,7,12,13][(seed>>>4)%6];if(f.kind==='rug')f.art=seed%2?3:9;if(f.kind==='pendant')f.variant=signature%3;}
    for(let i=furniture.length-1;i>=0;i--)if(furniture[i].kind==='picture'&&furniture[i].x>0)furniture.splice(i,1);
    const decoration=(kind,x,z,w,d,y,rotation=0,extra={})=>furniture.push({kind,x,z,w,d,y,rotation,...extra});
    for(const side of [-1,1]){const z=-actualD*.31;decoration('wall-shelf',side*(actualW/2-.07),z,2,.3,1.85,side*Math.PI/2,{variant:signature%5});decoration('sconce',side*(actualW/2-.1),actualD*.3,.5,.3,2.5,side*Math.PI/2);}
    decoration('clock',0,-actualD/2+.13,.7,.7,Math.min(height-.55,2.9));
    decoration('gallery-strip',actualW*.24,-actualD/2+.15,Math.min(3.2,actualW*.38),1.3,1.95,0,{variant:signature%4,art:[0,1,2,12,13][(signature>>>4)%5]});
    const physical=furniture.filter(f=>!['rug','picture','window','pendant','wall-detail','bath-floor','wall-shelf','sconce','clock','gallery-strip'].includes(f.kind)).map(f=>({x:f.x,z:f.z,w:f.w,d:f.d,rotation:f.rotation,h:f.kind==='partition'?3:['wardrobe','shelf','stockrack'].includes(f.kind)?2.7:1.1}));
    return {id:b.id+':'+floor,buildingId:b.id,floor,floorCount:b.floorCount,name:b.name+' · '+(floor+1)+' 楼',kind:type,width:actualW,depth:actualD,height,exit:{x:0,z:actualD/2-1},furniture,obstacles:physical,hotspots,lift,finish:floorFinishes[(id+floor)%floorFinishes.length],style:theme.name,theme,signature,wood:theme.wood,wall:theme.wall,accent:theme.color,variant:(id*7+floor*13)%16,mirror:flip};
  }
  return {assign,plan,types,titles};
})();
