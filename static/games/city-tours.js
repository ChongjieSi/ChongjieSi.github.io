/* Untimed driving journeys. Stops use the same authored roads as the simulation. */
window.ArcadeCityTours=(()=>{
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const busy=w=>!!(w.job||w.race||w.trial||w.shopActivity||w.penalty&&w.penalty.phase!=='finished');
  const message=(w,text)=>{w.message=text;w.messageTime=5;};
  function init(w){
    const at=(prefix,x,z,name,story)=>{
      const path=w.roadPlan.paths.find(p=>p.id.startsWith(prefix)),p=ArcadeCityTerrain.nearest(path.points,x,z);
      return {x:p.x,z:p.z,y:p.y,surfaceId:path.id,yaw:Math.atan2(p.dx,-p.dz),name,story};
    };
    w.driveTours=[
      {id:'coastal-drive',name:'海岸风景线',subtitle:'白沙、灯塔与日落',theme:'coast',color:'#527f87',reward:700,stops:[
        at('grid-z-320-',320,224,'码头海风','木栈桥向海面伸展。停一会儿，看看远处的海湾，再沿海岸向北出发。'),
        at('grid-z-320-',320,64,'白沙长岸','城市在左，沙滩在右。连绵的海岸是这座城最开阔的一面。'),
        at('grid-z-320-',320,-128,'冲浪时光','海风吹过冲浪屋。旅程之外，也可以下车去沙滩寻找海螺。'),
        at('grid-z-320-',320,-288,'灯塔守望','白沙灯塔守着北面的海湾。把这一程的海风，收进自己的风景图册。')
      ]},
      {id:'woodland-drive',name:'林海公路',subtitle:'溪谷、山路与远山',theme:'forest',color:'#658469',reward:900,stops:[
        at('forest-road',-320,96,'驶入林间','从街区转入森林公路。道路开始起伏，放慢速度，顺着弯道向林中走。'),
        at('forest-road',-470,128,'溪谷转弯','溪水穿过林地，树影落在弯道旁。沿着道路过桥，不必涉水。'),
        at('forest-road',-552,-268,'深林驿路','这里远离市区。留意林缘的小动物，它们有自己的活动路线。'),
        at('forest-road',-650,-530,'远山观景','终点旁有观景停车区。可以下车，沿短步道走到山间亭，看看林海与远处的城市。')
      ]},
      {id:'skyline-drive',name:'高架天际线',subtitle:'北环高架上的城市剪影',theme:'skyline',color:'#7a789b',reward:1000,stops:[
        at('grid-z-128-',128,-288,'商务区启程','从云际中心附近出发，沿北面的匝道驶上高架。夜景会是另一种风景。'),
        at('north-viaduct',30,-374,'城市抬升','楼宇逐渐落在视线下方。高架与地面的道路各有自己的高度，沿坡道继续前行。'),
        at('north-viaduct',-190,-410,'北环远眺','在城市与林地之间，看看道路如何绕过街区。天黑后，路灯会串起城市的轮廓。'),
        at('grid-z--320-',-320,-304,'回到街头','沿西侧匝道回到地面。这一程的天际线，已经留在你的图册里。')
      ]}
    ];
    w.driveTour=null;w.tourProgress={};w.tourStamps=new Set();w.tourCompleted=new Set();w.tourAlbum=new Set();w.tourRevision=0;
  }
  const key=(tour,index)=>tour.id+':'+index;
  const current=w=>{const active=w.driveTour,tour=w.driveTours?.find(t=>t.id===active?.id);return tour?{...active,tour,stop:tour.stops[active.index]}:null;};
  function goal(w){const c=current(w);return c&&!c.paused&&!busy(w)&&c.stop?{...c.stop,name:c.stop.name}:null;}
  function pause(w){if(w.driveTour){w.driveTour.paused=true;w.navigationCache=null;}}
  function start(w,id){
    const tour=w.driveTours?.find(t=>t.id===id);if(!tour)return false;
    if(busy(w)){message(w,'先完成当前委托或挑战，再开启自驾旅程');return false;}
    w.driveTour={id,index:w.tourProgress[id]||0,paused:false};w.findingCar=false;w.dialog=null;w.navigationCache=null;
    message(w,tour.name+' · '+(w.vehicle<0?'按 V 召唤车辆，再跟随路线出发':'跟随路线，停车后按 E 收集风景印记'));return true;
  }
  function context(w){
    const c=current(w),car=w.cars[w.vehicle];if(!c||c.paused||!car||busy(w)||w.interior||w.onTower||!c.stop)return null;
    if(distance(car,c.stop)>9||Math.abs((car.elevation||0)-c.stop.y)>1.6)return null;
    return {kind:'tour-stop',label:Math.hypot(car.speed||0,car.driftX||0,car.driftZ||0)>1.2?'先停稳 · '+c.stop.name:'停靠 · '+c.stop.name};
  }
  function stamp(w){
    if(!context(w))return false;const car=w.cars[w.vehicle];if(Math.hypot(car.speed||0,car.driftX||0,car.driftZ||0)>1.2){message(w,'先把车停稳，再收集风景印记');return false;}
    const c=current(w),id=key(c.tour,c.index),fresh=!w.tourStamps.has(id);let earned=fresh?120:0;
    w.tourStamps.add(id);w.tourAlbum.add(id);w.tourRevision++;car.speed=0;car.driftX=car.driftZ=0;car.steer=0;
    const next=c.index+1,finished=next===c.tour.stops.length;
    if(finished){if(!w.tourCompleted.has(c.id))earned+=c.tour.reward;w.tourCompleted.add(c.id);w.tourProgress[c.id]=0;w.driveTour=null;}
    else{w.tourProgress[c.id]=next;w.driveTour.index=next;}
    w.score+=earned;w.navigationCache=null;
    w.dialog={kind:'tour-postcard',title:c.stop.name,theme:c.tour.theme,color:c.tour.color,caption:c.tour.name+' · '+next+' / '+c.tour.stops.length,body:c.stop.story,earned,finished,actions:[{id:'job-close',label:finished?'完成旅程':'继续下一站'}]};
    message(w,finished?c.tour.name+' · 旅程完成 +'+earned:'风景印记 · '+c.stop.name+(earned?' +'+earned:''));return true;
  }
  function restore(w,raw){
    if(!Array.isArray(raw))return;const valid=new Set(w.driveTours.flatMap(t=>t.stops.map((_,i)=>key(t,i))));
    for(const id of raw)if(typeof id==='string'&&valid.has(id))w.tourAlbum.add(id);
  }
  function artwork(theme){
    const coast='<circle cx="279" cy="36" r="21" opacity=".28"/><path d="M0 102Q45 82 90 102T180 102T270 102T360 102V160H0Z" opacity=".23"/><path d="m245 91 5-43h15l5 43m-23-43h21m-26 43h32" fill="none" stroke="currentColor" stroke-width="3"/><path d="M0 137Q70 116 130 126T260 135T360 120" fill="none" stroke="currentColor" opacity=".4" stroke-width="2"/>';
    const forest='<path d="M0 104 67 32 128 95 202 15 310 109 360 64V160H0Z" opacity=".15"/><path d="m30 110 17-48 17 48zm54 16 21-64 21 64zm164-20 18-50 18 50zm44 25 20-68 20 68z" opacity=".55"/><path d="M170 160q-45-26 5-46t-4-35" fill="none" stroke="currentColor" stroke-width="7" opacity=".35"/>';
    const skyline='<path d="M15 130V82h32v48m12 0V53h36v77m15 0V29h42v101m17 0V67h33v63m22 0V48h42v82m17 0V77h52v53" opacity=".3"/><path d="M0 136q90-62 180-28t180-11" fill="none" stroke="currentColor" stroke-width="9" opacity=".55"/><path d="M71 110v50m76-59v59m77-42v42m76-43v43" stroke="currentColor" stroke-width="5" opacity=".45"/>';
    return '<svg viewBox="0 0 360 160" fill="currentColor" aria-hidden="true">'+(theme==='forest'?forest:theme==='skyline'?skyline:coast)+'</svg>';
  }
  function journal(w,onChange){
    const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
    const root=el('details','city-drive-journal');root.open=true;const summary=el('summary','',`自驾旅程 · 图册 ${w.tourAlbum.size} / ${w.driveTours.reduce((n,t)=>n+t.stops.length,0)}`);root.append(summary);
    const cards=el('div','city-drive-cards');
    for(const tour of w.driveTours){
      const card=el('article','city-drive-card');card.style.setProperty('--tour-color',tour.color);const art=el('div','city-drive-cover');art.innerHTML=artwork(tour.theme);
      const active=w.driveTour?.id===tour.id,progress=w.tourProgress[tour.id]||0,collected=tour.stops.filter((_,i)=>w.tourAlbum.has(key(tour,i))).length;
      const title=el('h3','',tour.name),copy=el('p','',tour.subtitle),meta=el('small','',`${tour.stops.length} 站 · 收藏 ${collected} / ${tour.stops.length}`),action=el('button','',active?'继续导航':progress?'接着出发':w.tourCompleted.has(tour.id)?'再逛一次':'开始旅程');action.type='button';action.dataset.driveTour=tour.id;action.disabled=busy(w);action.onclick=()=>{start(w,tour.id);onChange();};
      card.append(art,title,copy,meta,action);if(active){const pauseButton=el('button','city-drive-pause',w.driveTour.paused?'路线已收起':'收起路线');pauseButton.type='button';pauseButton.disabled=w.driveTour.paused;pauseButton.onclick=()=>{pause(w);w.dialog=null;onChange();};card.append(pauseButton);}cards.append(card);
    }
    root.append(el('p','city-drive-note','驾车到站 · 停稳按 E 集章 · 每轮首次收集计分'),cards);
    const album=el('details','city-drive-album'),albumTitle=el('summary','','风景图册 · 保存在本机');album.append(albumTitle);
    const prints=el('div','city-drive-prints');for(const tour of w.driveTours)for(let i=0;i<tour.stops.length;i++){const owned=w.tourAlbum.has(key(tour,i)),tile=el('div','city-drive-print'+(owned?' is-collected':''));tile.style.setProperty('--tour-color',tour.color);if(owned){const image=el('div');image.innerHTML=artwork(tour.theme);tile.append(image);}tile.append(el('span','',owned?tour.stops[i].name:'尚未到访'));prints.append(tile);}album.append(prints);root.append(album);return root;
  }
  return {init,current,goal,pause,start,context,stamp,restore,artwork,journal};
})();
