/* Original coastal-city sandbox. Three.js is bundled locally and loaded on demand. */
window.ArcadeCity = ({canvas,button,points,finish,active,status}) => {
  const Sim=ArcadeCityWorld,Motion=ArcadeCityMotion,Tours=window.ArcadeCityTours;
  function city3d(){
    const state=Sim.create(),{c}=canvas(960,600,true,'webgl');
    const albumKey='chongjie-coast-postcards-v1';let savedAlbumRevision=state.tourRevision;
    try{if(Tours)Tours.restore(state,JSON.parse(localStorage.getItem(albumKey)));}catch{}
    function saveAlbum(){if(Tours&&savedAlbumRevision!==state.tourRevision){try{localStorage.setItem(albumKey,JSON.stringify([...state.tourAlbum]));savedAlbumRevision=state.tourRevision;}catch{}}}
    const wrap=c.parentElement;let surface=c,viewport={width:960,height:600};
    const overlay=document.createElement('div');overlay.className='city-hud';
    overlay.innerHTML='<div class="city-location"><small>COAST CITY</small><b>海岸城</b><span data-city-area>中央公园</span><span class="city-notebook" data-city-notebook></span></div><div class="city-mission"><small data-city-mission-label>城市快递</small><b data-city-target>海岸书店</b><span data-city-distance></span></div><div class="city-toast" data-city-toast></div><button class="city-context" data-city-interact hidden></button><div class="city-map"><canvas width="152" height="152" aria-label="城市小地图"></canvas><span>N</span></div><div class="city-speed"><b data-city-speed>步行</b><span data-city-mode>E 上车</span></div><div class="city-intro"><span>每扇门后，都有生活。</span><small>WASD 移动 · E 互动 · M 地图 · J 任务 · 拖动环顾</small><button data-city-begin>开始漫游</button></div>';
    const countdown=document.createElement('div');countdown.className='city-countdown';countdown.hidden=true;countdown.setAttribute('aria-live','polite');overlay.append(countdown);
    const reward=document.createElement('div');reward.className='city-reward';reward.setAttribute('aria-live','polite');overlay.append(reward);
    const locator=document.createElement('button');locator.className='city-vehicle-locator';locator.hidden=true;locator.type='button';locator.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 10 2-5h10l2 5M4 10h16v8H4zM6 18v2m12-2v2M7 13h2m6 0h2"/></svg><span></span><i aria-hidden="true">↑</i>';locator.onclick=()=>{if(playing&&active()){Sim.locateVehicle(state,!state.findingCar);hud();}};overlay.append(locator);
    const sports=document.createElement('section');sports.className='city-sports';sports.hidden=true;sports.innerHTML='<div class="city-sports-heading"><b>五球挑战</b><span data-shot-score></span><button aria-label="结束点球训练">×</button></div><div class="city-shot-goal" role="img" aria-label="球门、门将和射门方向"><i class="city-shot-keeper"></i><i class="city-shot-target"></i></div><div class="city-shot-meter" role="meter" aria-label="射门力量" aria-valuemin="0" aria-valuemax="100"><span></span><i></i></div><p data-shot-hint></p>';overlay.append(sports);sports.querySelector('button').onclick=()=>Sim.choose(state,'penalty-close');
    const viewfinder=document.createElement('section');viewfinder.className='city-viewfinder';viewfinder.hidden=true;viewfinder.innerHTML='<span data-view-title></span><i aria-hidden="true"></i><div><button type="button" aria-label="缩小观景镜">−</button><button type="button" aria-label="放大观景镜">+</button></div><small>拖动环顾 · E 返回</small>';overlay.append(viewfinder);viewfinder.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{if(state.scenicView)state.scenicView.fov=ArcadeWorld.clamp(state.scenicView.fov+(i?-6:6),18,58);});
    wrap.append(overlay);
    const ui=selector=>overlay.querySelector(selector),map=ui('.city-map canvas').getContext('2d');
    let playing=false,disposed=false,renderer=null,view=null,night=false,orbitTime=0,hudClock=0,physicsClock=0;
    const blockingBoot=!!window.WebGLRenderingContext;let ready=!blockingBoot;
    const begin=ui('[data-city-begin]'),loading=document.createElement('div');loading.className='city-loading';loading.innerHTML='<span>正在准备海岸城</span><progress max="100" value="4" aria-label="城市载入进度"></progress>';loading.hidden=!blockingBoot;ui('.city-intro').insertBefore(loading,begin);begin.disabled=blockingBoot;if(blockingBoot)begin.textContent='正在载入…';
    let bootProgress=4;function boot(value){if(disposed)return;bootProgress=Math.max(bootProgress,value);loading.querySelector('progress').value=bootProgress;}
    function readyToPlay(){if(disposed)return;ready=true;loading.hidden=true;begin.disabled=false;begin.textContent='开始漫游';}
    const held=new Set();let drag=null,camPitch=.2,camDistance=12,renderFallback=null,lastScore=0,rewardTime=0,lastResult=null;
    const recordKey='chongjie-coast-race-records-v1';let records={};
    try{const saved=JSON.parse(localStorage.getItem(recordKey));for(const race of Sim.races){const time=saved?.[race.id];if(Number.isFinite(time)&&time>0&&time<=race.limit)records[race.id]=time;}}catch{}
    const input=()=>({forward:held.has('w')||held.has('ArrowUp'),back:held.has('s')||held.has('ArrowDown'),left:held.has('a')||held.has('ArrowLeft'),right:held.has('d')||held.has('ArrowRight'),sprint:held.has('Shift'),brake:held.has(' ')});
    function interact(){if(playing&&active())Sim.interact(state);}
    ui('[data-city-begin]').onclick=()=>{if(!ready)return;playing=true;ui('.city-intro').hidden=true;};
    const enter=button('互动',interact);
    const mapButton=button('地图',openMap);
    const tasksButton=button('任务',openTasks);
    const summonButton=button('召唤车辆',summonVehicle);summonButton.title='召唤车辆（V）';
    ui('[data-city-interact]').onclick=interact;
    const recover=button('返回',()=>Sim.recover(state));recover.title='返回中央公园车站';
    const day=button('昼夜',()=>{night=!night;view?.lighting(night);});
    const hall=button('观景厅',()=>{Sim.choose(state,state.onTower==='skyline'?'sky-panorama':'tower-hall');hud();});hall.hidden=true;
    const brake=button('手刹',()=>{});brake.classList.add('city-brake');brake.hidden=true;
    brake.addEventListener('pointerdown',e=>{if(active()){held.add(' ');brake.setPointerCapture(e.pointerId);}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>held.delete(' '));
    const end=button('结束漫游',()=>finish('本次漫游完成',`点球最佳 ${state.penaltyBest} 分 · 漫游路线 ${state.completedTrails.size}/3 · 委托 ${state.jobsCompleted} 单 · ${Sim.reputation(state)} · 店铺体验 ${state.shopBadges.size}/4 · 街区集章 ${state.cityStamps.size}/${state.citySpots.length} · 建筑 ${state.enteredBuildings.size}/${state.buildings.length} · 动物 ${state.observedWildlife.size}/${state.animals.length} · 林间手记 ${state.fieldNotes.size}/3 · 自然探索 ${state.natureVisited.size}/3 · 地标 ${state.discovered.size}/${state.places.length} · 展品 ${state.inspected.size}/3 · 海螺 ${state.shells.filter(s=>s.taken).length}/4`));
    for(const [label,key]of [['前进','w'],['左转','a'],['后退','s'],['右转','d']]){
      const b=button(label,()=>{});b.classList.add('direction-control');
      b.addEventListener('pointerdown',e=>{if(active()){held.add(key);b.setPointerCapture(e.pointerId);}});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(key));
    }
    function resize(width,height){
      const next={width:Math.max(1,Math.round(width)),height:Math.max(1,Math.round(height))};
      if(next.width===viewport.width&&next.height===viewport.height)return;
      viewport=next;
      if(renderer){renderer.setSize(viewport.width,viewport.height,false);view?.resize(viewport.width,viewport.height);}
      else{surface.width=viewport.width;surface.height=viewport.height;}
    }
    // Measure the game surface itself; desktop window geometry is unrelated.
    const viewportObserver=window.ResizeObserver?new ResizeObserver(entries=>{
      const box=entries[0]?.contentRect;if(box?.width&&box?.height)resize(box.width,box.height);
    }):null;
    viewportObserver?.observe(wrap);
    function bindOrbit(node){
      node.addEventListener('pointerdown',e=>{if(active()&&playing){drag={x:e.clientX,y:e.clientY,yaw:state.cameraYaw,pitch:state.scenicView?.pitch??camPitch,scenic:!!state.scenicView};node.setPointerCapture(e.pointerId);}});
      node.addEventListener('pointermove',e=>{if(drag&&active()){state.cameraYaw=drag.yaw-(e.clientX-drag.x)*.007;if(drag.scenic&&state.scenicView)state.scenicView.pitch=ArcadeWorld.clamp(drag.pitch+(e.clientY-drag.y)*.004,-.45,.7);else camPitch=ArcadeWorld.clamp(drag.pitch+(e.clientY-drag.y)*.004,-.55,.7);orbitTime=3;}});
      for(const event of ['pointerup','pointercancel'])node.addEventListener(event,()=>drag=null);
      node.addEventListener('wheel',e=>{if(active()){e.preventDefault();if(state.scenicView){state.scenicView.fov=ArcadeWorld.clamp(state.scenicView.fov+e.deltaY*.04,18,58);return;}camDistance=ArcadeWorld.clamp(camDistance+e.deltaY*.008,state.interior?2.8:7,state.interior?10:22);}},{passive:false});
    }
    bindOrbit(c);
    const panel=document.createElement('dialog');panel.className='city-dialog';document.body.append(panel);let shownDialog=null,mapController=null,taskPage='contracts';
    panel.addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,select')||e.metaKey||e.ctrlKey||e.altKey)return;const key=e.key.toLowerCase();if((key==='m'||key==='j'||key==='v')&&!e.repeat){e.preventDefault();e.stopPropagation();if(key==='m')openMap();else if(key==='j')openTasks();else summonVehicle();}});
    panel.addEventListener('close',()=>{if(state.dialog===shownDialog)state.dialog=null;shownDialog=null;mapController?.dispose();mapController=null;held.clear();});
    function openMap(){if(!playing)return;state.dialog=state.dialog?.kind==='map'?null:{kind:'map',title:'地图'};held.clear();updatePanel();}
    function openTasks(){if(!playing)return;state.dialog=state.dialog?.kind==='tasks'?null:{kind:'tasks',title:'任务',tab:taskPage};held.clear();updatePanel();}
    function summonVehicle(){if(!playing||!active())return;const called=Sim.summonVehicle(state);if(called&&(state.dialog?.kind==='map'||state.dialog?.kind==='tasks')){state.dialog=null;held.clear();}hud();}
    const minimapButton=ui('.city-map');minimapButton.setAttribute('role','button');minimapButton.tabIndex=0;minimapButton.setAttribute('aria-label','打开地图');minimapButton.onclick=openMap;minimapButton.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openMap();}};
    function mapDrawing(ctx,width,height,full=false){
      if(!ctx)return;
      const mapPlayer=state.interior?state.returnTo:state.player;
      const extent=full?Math.max(state.bounds.maxX-state.bounds.minX,state.bounds.maxZ-state.bounds.minZ)+35:180;
      const scale=Math.min(width,height)/extent,origin=full?{x:(state.bounds.minX+state.bounds.maxX)/2,z:(state.bounds.minZ+state.bounds.maxZ)/2}:mapPlayer;
      const xy=p=>({x:width/2+(p.x-origin.x)*scale,y:height/2+(p.z-origin.z)*scale});
      ctx.fillStyle=night?'#182938':'#e6e9e2';ctx.fillRect(0,0,width,height);
      const coast=xy({x:384,z:0});ctx.fillStyle=night?'#2f5266':'#78abb7';ctx.fillRect(coast.x,0,width-coast.x,height);
      const sand=xy({x:328,z:0});ctx.fillStyle=night?'#68634e':'#d9cca7';ctx.fillRect(sand.x,0,(384-328)*scale,height);
      ctx.fillStyle=night?'#344451':'#b4c0c0';
      const forest=xy({x:-826,z:state.bounds.minZ});ctx.fillStyle=night?'#263d37':'#a9c0a2';ctx.fillRect(forest.x,forest.y,474*scale,(state.bounds.maxZ-state.bounds.minZ)*scale);
      const park=ArcadeCityTerrain.park,parkPoint=xy({x:park.x-park.rx,z:park.z-park.rz});ctx.fillStyle=night?'#354d3a':'#afc99d';ctx.fillRect(parkPoint.x,parkPoint.y,park.rx*2*scale,park.rz*2*scale);
      for(const path of state.roadPlan.paths){ctx.strokeStyle=path.type==='elevated'?'#6a9aaf':path.type==='trail'||path.type==='garden-path'?'#cbbd94':night?'#697d85':'#bcc5c5';ctx.lineWidth=Math.max(full?.7:1,path.width*scale);ctx.setLineDash(path.type==='tunnel'?[5,4]:[]);ctx.beginPath();path.points.forEach((v,i)=>{const p=xy(v);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}ctx.setLineDash([]);
      ctx.strokeStyle=night?'#477e92':'#6ca1b0';ctx.lineWidth=Math.max(2,6*scale);ctx.beginPath();state.roadPlan.river.forEach((v,i)=>{const p=xy(v);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();const pond=xy(park.pond);ctx.fillStyle='#6ca1b0';ctx.beginPath();ctx.ellipse(pond.x,pond.y,park.pond.rx*scale,park.pond.rz*scale,0,0,Math.PI*2);ctx.fill();
      for(const b of state.buildings){ctx.fillStyle=state.enteredBuildings.has(b.id)?'#6e9c89':night?'#52616a':'#98a4aa';const p=xy({x:b.x-b.w/2,z:b.z-b.d/2});ctx.fillRect(p.x,p.y,b.w*scale,b.d*scale);}
      for(const place of state.places){const p=xy(place.door);ctx.fillStyle=state.discovered.has(place.id)?'#74a38c':'#c49c61';ctx.beginPath();ctx.arc(p.x,p.y,full?5:2.6,0,Math.PI*2);ctx.fill();if(full){ctx.fillStyle=night?'#d7e4e9':'#3c5361';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(place.name,p.x,p.y-10);}}
      for(const course of Sim.races){const start=xy(course.start);ctx.fillStyle='#357c9d';ctx.fillRect(start.x-3,start.y-3,6,6);if(full){ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(course.name,start.x,start.y+16);}}
      if(state.race){const course=Sim.races.find(r=>r.id===state.race.id);ctx.strokeStyle='#3b9eba';ctx.lineWidth=full?2:1.5;ctx.setLineDash([4,4]);ctx.beginPath();[mapPlayer,...course.checkpoints.slice(state.race.index)].forEach((v,i)=>{const q=xy(v);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.setLineDash([]);}
      const destination=Sim.objective(state),goal=xy(destination);ctx.strokeStyle=state.race?'#4fc9ec':'#e9b55c';ctx.lineWidth=full?2:1.5;ctx.beginPath();ctx.arc(goal.x,goal.y,full?9:5,0,Math.PI*2);ctx.stroke();
      const route=view||renderFallback?Sim.navigationPath(state):[];if(route.length){ctx.strokeStyle=state.race?'#318ca8':'#b98a39';ctx.lineWidth=full?2.5:2;ctx.beginPath();route.forEach((v,i)=>{const q=xy(v);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.stroke();}
      for(const place of state.destinations){const p=xy(place.door);ctx.fillStyle='#517c5d';ctx.beginPath();ctx.arc(p.x,p.y,full?4:3,0,Math.PI*2);ctx.fill();if(full){ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(place.name,p.x,p.y-9);}}
      for(const spot of state.citySpots){const p=xy(spot.door);ctx.fillStyle=state.cityStamps.has(spot.id)?'#4b9278':'#c78053';ctx.beginPath();ctx.arc(p.x,p.y,full?3.5:2.5,0,Math.PI*2);ctx.fill();if(full){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(spot.name,p.x,p.y-8);}}
      if(full)for(const entrance of state.roadPlan.entrances){const p=xy(entrance.door);ctx.fillStyle=night?'#9ac7d4':'#39788e';ctx.fillRect(p.x-4,p.y-4,8,8);ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(entrance.name,p.x,p.y+17);}
      if(state.summonedCar&&state.vehicle<0){const car=xy(state.summonedCar);ctx.fillStyle='#d99243';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.fillRect(car.x-3,car.y-4,6,8);ctx.strokeRect(car.x-3,car.y-4,6,8);}
      const p=xy(mapPlayer);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(state.player.yaw);ctx.fillStyle='#fff';ctx.strokeStyle='#223644';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,4);ctx.lineTo(0,2);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    function minimap(){
      if(state.interior){
        const r=state.interior,scale=122/Math.max(r.width,r.depth),xy=p=>({x:76+p.x*scale,y:76+p.z*scale});map.fillStyle=night?'#243b3d':'#e4dfd0';map.fillRect(0,0,152,152);map.fillStyle=night?'#46605c':'#b8c4b3';map.fillRect(76-r.width*scale/2,76-r.depth*scale/2,r.width*scale,r.depth*scale);
        for(const b of r.obstacles){const p=xy(b);map.save();map.translate(p.x,p.y);map.rotate(b.rotation||0);map.fillStyle=night?'#758b7e':'#8d9b89';map.fillRect(-b.w*scale/2,-b.d*scale/2,b.w*scale,b.d*scale);map.restore();}const exit=xy(r.exit);map.fillStyle='#ead2a0';map.fillRect(exit.x-4,exit.y-2,8,4);if(r.floorCount>1){const lift=xy(r.lift);map.fillStyle='#87b7c4';map.fillRect(lift.x-3,lift.y-3,6,6);}const p=xy(state.player);map.save();map.translate(p.x,p.y);map.rotate(state.player.yaw);map.fillStyle='#fff';map.beginPath();map.moveTo(0,-4);map.lineTo(3,3);map.lineTo(-3,3);map.closePath();map.fill();map.restore();
      }else mapDrawing(map,152,152);
    }
    function trailJournal(){
      const journal=document.createElement('details');journal.className='city-trail-journal';journal.open=!!state.activeTrail;
      const heading=document.createElement('summary');heading.textContent=`漫游手册 · 完成 ${state.completedTrails.size} / ${state.trails.length} 条路线`;journal.append(heading);
      const current=Sim.trailStatus(state);
      if(current){
        const active=document.createElement('div');active.className='city-trail-current';
        const caption=document.createElement('p');caption.textContent=`${current.name} · ${current.index+1}/${current.stops.length} · ${current.stop.label}`;
        const resume=document.createElement('button');resume.disabled=!!state.job||!!state.race||!!state.trial||!!state.penalty;resume.textContent=resume.disabled?'挑战中 · 稍后继续':'继续导航';resume.dataset.trailResume='';resume.onclick=()=>{Sim.choose(state,'trail-resume');updatePanel();hud();};
        const pause=document.createElement('button');pause.textContent='暂时收起';pause.dataset.trailPause='';pause.onclick=()=>{Sim.choose(state,'trail-pause');updatePanel();hud();};
        active.append(caption,resume,pause);journal.append(active);
      }
      const cards=document.createElement('div');cards.className='city-trail-cards';
      for(const trail of state.trails){
        const card=document.createElement('article');card.className='city-trail-card';card.style.setProperty('--trail-color',trail.color);
        const completed=state.completedTrails.has(trail.id),progress=state.trailProgress[trail.id];card.classList.toggle('completed',completed);
        const cover=document.createElement('div');cover.className='city-trail-cover';cover.setAttribute('aria-hidden','true');
        const scenery=trail.id==='forest-walk'?'<path d="M0 74 41 28 65 51 99 16 160 78" fill="currentColor" opacity=".18"/><path d="m24 62 8-20 8 20zm87-5 9-26 9 26z" fill="currentColor" opacity=".55"/>':trail.id==='local-day'?'<path d="M16 66V37h42v29m10 0V26h35v40m12 0V40h31v26" fill="currentColor" opacity=".17"/><path d="M12 37h50L55 27H19z" fill="currentColor" opacity=".5"/>':'<circle cx="127" cy="25" r="14" fill="currentColor" opacity=".25"/><path d="M0 65q20-12 40 0t40 0 40 0 40 0v19H0z" fill="currentColor" opacity=".18"/>';
        cover.innerHTML='<svg viewBox="0 0 160 84" fill="none" xmlns="http://www.w3.org/2000/svg">'+scenery+'<path d="M19 64C37 64 29 30 56 30S85 62 105 54 120 35 142 35" stroke="currentColor" stroke-width="2" stroke-dasharray="3 4"/>'+[[19,64],[56,30],[105,54],[142,35]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i<progress?4:3}" fill="${i<progress?'currentColor':'#fafaf5'}" stroke="currentColor" stroke-width="2"/>`).join('')+'</svg>';
        const title=document.createElement('h3');title.textContent=trail.name;
        const subtitle=document.createElement('p');subtitle.className='city-trail-subtitle';subtitle.textContent=trail.subtitle;
        const stops=document.createElement('ol');
        trail.stops.forEach((stop,i)=>{const item=document.createElement('li');item.textContent=stop.label;item.classList.toggle('done',i<progress);if(state.activeTrail===trail.id&&i===progress)item.setAttribute('aria-current','step');stops.append(item);});
        const action=document.createElement('button');action.dataset.trail=trail.id;action.textContent=completed?'路线已完成':state.activeTrail===trail.id?'继续这条路线':progress?'接着逛 · '+progress+'/'+trail.stops.length:'开始漫游 · +'+trail.reward;
        action.disabled=completed||!!state.job||!!state.race||!!state.trial||!!state.penalty;action.onclick=()=>{Sim.choose(state,'trail-start-'+trail.id);updatePanel();hud();};
        card.append(cover,title,subtitle,stops,action);cards.append(card);
      }
      journal.append(cards);
      const note=document.createElement('p');note.className='city-trail-note';note.textContent=state.job||state.race||state.trial||state.penalty?'先完成当前委托或挑战，再开始一条漫游路线。':'没有倒计时 · 本局已完成的体验会计入进度 · 路线奖励仅领取一次';journal.append(note);
      return journal;
    }
    function updatePanel(){
      if(!state.dialog){mapController?.dispose();mapController=null;if(panel.open)panel.close();shownDialog=null;return;}
      if(state.dialog===shownDialog){mapController?.update();return;}mapController?.dispose();mapController=null;shownDialog=state.dialog;held.clear();panel.className='city-dialog'+(state.dialog.kind==='map'?' city-atlas-dialog':state.dialog.kind==='tasks'?' city-tasks-dialog':'');
      panel.replaceChildren();const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.textContent=state.dialog.title;close.textContent='×';close.setAttribute('aria-label','关闭');close.onclick=()=>{state.dialog=null;updatePanel();};header.append(title,close);panel.append(header);
      if(state.dialog.kind==='map'){
        mapController=ArcadeCityMap({state,Sim,container:panel,onNavigate:id=>{Sim.navigate(state,id);updatePanel();hud();},onTeleport:id=>{const moved=Sim.teleport(state,id);if(moved){held.clear();physicsClock=0;updatePanel();hud();}return moved;}});
      }else if(state.dialog.kind==='tasks'){
        const tabs=document.createElement('nav');tabs.className='city-task-tabs';tabs.setAttribute('aria-label','任务分类');tabs.setAttribute('role','tablist');const pages={},tabButtons={};
        for(const [id,label]of [['contracts','委托'],['challenges','挑战'],['explore','漫游']]){const b=document.createElement('button'),page=document.createElement('section');b.textContent=label;b.dataset.taskTab=id;b.setAttribute('role','tab');b.setAttribute('aria-controls','city-tasks-'+id);b.id='city-task-tab-'+id;page.id='city-tasks-'+id;page.className='city-task-page';page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',b.id);pages[id]=page;tabButtons[id]=b;b.onclick=()=>{state.dialog.tab=id;taskPage=id;for(const key of Object.keys(pages)){pages[key].hidden=key!==id;tabButtons[key].setAttribute('aria-selected',String(key===id));tabButtons[key].tabIndex=key===id?0:-1;}};b.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const keys=Object.keys(pages),next=keys[(keys.indexOf(id)+(e.key==='ArrowRight'?1:2))%3];tabButtons[next].click();tabButtons[next].focus();}};tabs.append(b);}
        panel.append(tabs,...Object.values(pages));tabButtons[state.dialog.tab||'contracts'].click();
        if(Tours)pages.explore.append(Tours.journal(state,()=>{updatePanel();hud();}));
        const progress=document.createElement('p');progress.className='city-journal-progress';progress.textContent=`已发现 ${state.discovered.size} / ${state.places.length} 处地标 · 展品 ${state.inspected.size} / 3 · 海螺 ${state.shells.filter(s=>s.taken).length} / 4`;pages.explore.append(progress);
        pages.explore.append(trailJournal());
        const board=document.createElement('section');board.className='city-contracts';const boardTitle=document.createElement('p');boardTitle.className='city-contract-heading';boardTitle.textContent=`城市委托 · ${Sim.reputation(state)} · 完成 ${state.jobsCompleted} 单`;board.append(boardTitle);
        const offers=document.createElement('div');offers.className='city-contract-offers';
        for(const type of Sim.jobTypes){const item=document.createElement('button');item.dataset.job=type.id;item.innerHTML='<b></b><span></span>';item.querySelector('b').textContent=type.name;item.querySelector('span').textContent=state.job?.id===type.id?'进行中 · 继续导航':type.description;item.disabled=!!state.race||!!state.trial||!!state.penalty||!!state.job&&state.job.id!==type.id;item.onclick=()=>{Sim.choose(state,state.job?'job-resume':'job-'+type.id);updatePanel();hud();};offers.append(item);}board.append(offers);
        const summary=document.createElement('p');summary.className='city-contract-summary';summary.textContent=state.job?`${state.job.phase==='pickup'?'前往取单':'前往送达'}：${Sim.jobGoal(state).name} · ${state.job.phase==='deliver'?'剩余 '+Math.ceil(state.job.limit-state.job.elapsed)+' 秒 · 评价 '+state.job.quality+'%':'取单后开始计时'}`:`连续完美 ${state.jobChain} 单 · 每三单额外 +600 分`;board.append(summary);
        if(state.job){const cancel=document.createElement('button');cancel.className='city-contract-cancel';cancel.textContent='放弃当前委托';cancel.onclick=()=>{Sim.choose(state,'job-cancel');updatePanel();hud();};board.append(cancel);}pages.contracts.append(board);
        const activities=document.createElement('div');activities.className='city-activities';
        const tasks=[
          {id:'museum',name:'艺术巡游',detail:`展品 ${state.inspected.size} / 3`,done:state.inspected.size===3},
          {id:'surf',name:'海滩探访',detail:`海螺 ${state.shells.filter(s=>s.taken).length} / 4`,done:state.beachComplete},
          {id:'stadium',name:'海湾体育场',detail:`点球五球挑战 · 跑道计时${state.penaltyBest?' · 最佳 '+state.penaltyBest+' 分':''}`,done:state.penaltyBest>0||state.stadiumBest>0},
          {id:'station',name:'西城车站',detail:'列车观赏 · 行李寻物 · 车辆检修',done:state.stationQuest==='done'&&state.stationStamp},
          {id:'skyline',name:'云际中心',detail:`186 m 全景露台 · 观景 ${state.skyViews.size} / 4`,done:state.skyViews.size===4},
          ...Sim.races.map(r=>({id:r.id,name:r.name,detail:records[r.id]?`最佳 ${records[r.id].toFixed(1)} 秒`:'驾车到起点 · E 开赛',done:!!records[r.id]})),
          ...state.destinations.map(p=>({id:p.id,name:p.name,detail:state.natureVisited.has(p.id)?'已探索 · 导航':'自然景观 · 导航',done:state.natureVisited.has(p.id)}))
        ];
        for(const task of tasks){const item=document.createElement('button');item.innerHTML='<b></b><span></span>';item.querySelector('b').textContent=task.name;item.querySelector('span').textContent=task.detail;item.classList.toggle('completed',task.done);item.onclick=()=>{Sim.navigate(state,task.id);updatePanel();hud();};activities.append(item);}pages.challenges.append(activities);
        const life=document.createElement('details');life.className='city-life-journal';const lifeTitle=document.createElement('summary');lifeTitle.textContent=`街区漫游 · 集章 ${state.cityStamps.size} / ${state.citySpots.length}`;life.append(lifeTitle);const lifeCards=document.createElement('div');lifeCards.className='city-activities';for(const spot of state.citySpots){const b=document.createElement('button');b.dataset.citySpot=spot.id;const name=document.createElement('b'),copy=document.createElement('span');name.textContent=spot.name;copy.textContent=state.cityStamps.has(spot.id)?'已集章 · 再去逛逛':'到访 +120 · 六处集齐 +800';b.append(name,copy);b.onclick=()=>{Sim.navigate(state,spot.id);updatePanel();hud();};lifeCards.append(b);}life.append(lifeCards);pages.explore.append(life);
        const field=document.createElement('details');field.className='city-life-journal';const fieldTitle=document.createElement('summary');fieldTitle.textContent=`林间手记 · 已收录 ${state.fieldNotes.size} / 3`;field.append(fieldTitle);const fieldCards=document.createElement('div');fieldCards.className='city-activities';for(const stop of state.roadPlan.restStops){const b=document.createElement('button');b.dataset.fieldStop=stop.id;const name=document.createElement('b'),copy=document.createElement('span');name.textContent=stop.name;copy.textContent=state.fieldNotes.has(stop.id)?'已收录 · 再去看看':({refill:'饮水与步道导览',creek:'观察溪流和林间动物',lookout:'登高看城市 · 观景镜'}[stop.kind]);b.append(name,copy);b.onclick=()=>{Sim.navigate(state,stop.id);updatePanel();hud();};fieldCards.append(b);}field.append(fieldCards);pages.explore.append(field);
        const shops=document.createElement('details');shops.className='city-shop-journal';const shopTitle=document.createElement('summary');shopTitle.textContent=`店铺体验 · 已集齐 ${state.shopBadges.size} / ${Sim.shopKinds.length} 类`;shops.append(shopTitle);const shopCards=document.createElement('div');shopCards.className='city-activities';for(const item of Sim.shopDestinations(state)){const b=document.createElement('button');b.dataset.shopKind=item.id;b.disabled=!item.building;const name=document.createElement('b'),copy=document.createElement('span');name.textContent=item.name;copy.textContent=item.building?`${item.completed?'已完成 '+item.completed+' 家 · ':'首次 +180 · '}${item.building.name}`:'暂无店铺';b.append(name,copy);b.onclick=()=>{Sim.navigate(state,item.building.id);updatePanel();hud();};shopCards.append(b);}shops.append(shopCards);pages.explore.append(shops);
        if(state.raceResult){const result=document.createElement('p');result.className='city-race-result';const r=state.raceResult;result.textContent=`最近挑战：${r.name} · ${r.time.toFixed(1)} 秒（碰撞罚时 ${r.penalty} 秒）· 本次 +${r.earned}`;pages.challenges.append(result);}
      }else if(state.dialog.kind==='elevator'){
        const current=state.dialog,select=document.createElement('select');select.className='city-floor-select';select.setAttribute('aria-label','目标楼层');for(let floor=0;floor<current.floorCount;floor++){const option=document.createElement('option');option.value=String(floor);option.textContent=(floor+1)+' 楼'+(floor===current.currentFloor?' · 当前':'');select.append(option);}select.value=String(current.currentFloor);const go=document.createElement('button');go.textContent='前往所选楼层';go.onclick=()=>{Sim.choose(state,'floor-'+select.value);updatePanel();hud();};panel.append(select,go);
      }else{
        if(state.dialog.kind==='tour-postcard'){panel.classList.add('city-postcard-dialog');const art=document.createElement('div');art.className='city-tour-postcard';art.style.setProperty('--tour-color',state.dialog.color);art.innerHTML=Tours.artwork(state.dialog.theme);const caption=document.createElement('span');caption.textContent=state.dialog.caption;art.append(caption);panel.append(art);}
        const copy=document.createElement('p');copy.textContent=state.dialog.body;panel.append(copy);
        if(state.dialog.kind==='tour-postcard'){const earned=document.createElement('p');earned.className='city-tour-earned';earned.textContent=(state.dialog.finished?'旅程完成 · ':'风景印记 · ')+(state.dialog.earned?'本次 +'+state.dialog.earned:'已收进图册');panel.append(earned);}
        if(state.dialog.kind==='shop-challenge'&&state.shopActivity?.kind==='bakery'){const widget=document.createElement('div');widget.className='city-bake-widget';const meter=document.createElement('div');meter.className='city-bake-meter';meter.dataset.shopMeter='';meter.setAttribute('role','meter');meter.setAttribute('aria-label','烘焙火候');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow','0');const target=document.createElement('span');target.className='city-bake-target';target.setAttribute('aria-hidden','true');const cursor=document.createElement('i');cursor.className='city-bake-cursor';cursor.setAttribute('aria-hidden','true');meter.append(target,cursor);const legend=document.createElement('p');legend.textContent='偏生 · 金色区间刚刚好 · 偏焦';widget.append(meter,legend);panel.append(widget);}
        const actions=document.createElement('div');actions.className='city-panel-actions';for(const choice of state.dialog.actions||[]){const b=document.createElement('button');b.textContent=choice.label;if(choice.id==='field-view'&&!view){b.disabled=true;b.textContent='此设备暂不支持观景镜';}b.onclick=()=>{if(choice.id==='map')openMap();else{Sim.choose(state,choice.id);updatePanel();}hud();};actions.append(b);}panel.append(actions);
      }
      if(!panel.open)panel.showModal();
    }
    function hud(){
      viewfinder.hidden=!state.scenicView;overlay.classList.toggle('is-scenic',!!state.scenicView);if(state.scenicView)viewfinder.querySelector('[data-view-title]').textContent=state.roadPlan.restStops.find(s=>s.id===state.scenicView.id).name;
      saveAlbum();
      ui('[data-city-area]').textContent=state.interior?'室内漫游':state.area||'中央公园';ui('[data-city-notebook]').textContent=state.jobsCompleted?`${Sim.reputation(state)} · ${state.jobsCompleted} 单`:`探索 ${state.discovered.size}/${state.places.length}`;
      const goal=Sim.objective(state);
      const driveTour=Tours?.current(state),tourGoal=Tours?.goal(state),trail=!tourGoal&&!state.job&&!state.race&&!state.trial&&!state.waypoint?Sim.trailStatus(state):null;
      ui('[data-city-target]').textContent=trail?trail.stop.label:state.job?goal.name:state.interior?state.interior.name:goal.name;
      ui('[data-city-mission-label]').textContent=trail?`${trail.name} · ${trail.index+1}/${trail.stops.length}`:state.race?'街头计时赛':state.job?Sim.jobTypes.find(j=>j.id===state.job.id).name:state.interior?'建筑探索':state.waypoint?'目的地':'城市快递';
      const race=state.race,course=race&&Sim.races.find(r=>r.id===race.id);
      const route=view||renderFallback?Sim.navigationPath(state):[],routeDistance=route.reduce((sum,v,i)=>sum+(i?Sim.distance(route[i-1],v):0),0);
      ui('[data-city-distance]').textContent=race?`${(race.elapsed+race.penalty).toFixed(1)} / ${course.limit} 秒 · ${race.index}/${course.checkpoints.length}`:state.trial?`${state.trial.elapsed.toFixed(1)} s · ${state.trial.index}/4`:state.interior?state.interior.floorCount>1?'E 互动 · 电梯切换楼层':'E 互动 · 门口返回城市':`${Math.round(route.length?routeDistance:Sim.distance(state.player,goal))} m`;
      if(state.job)ui('[data-city-distance]').textContent=state.job.phase==='pickup'?(state.interior?.id==='cafe'&&state.job.id==='coffee'?'到吧台按 E 取餐':(state.job.id==='coffee'?'进店取餐':'驾车接乘客')+' · '+Math.round(routeDistance||Sim.distance(state.player,goal))+' m'):`剩余 ${Math.max(0,Math.ceil(state.job.limit-state.job.elapsed))} 秒 · 评价 ${state.job.quality}%`;
      if(trail){const r=state.interior,matching=r&&(r.buildingId===trail.stop.target||r.id===trail.stop.target);ui('[data-city-distance]').textContent=r?matching?(r.buildingId&&r.floor>0?'乘电梯返回一楼，体验店内活动':trail.stop.hint):'从门口回到街道，继续这条路线':`${Math.round(routeDistance||Sim.distance(state.player,goal))} m · ${state.vehicle>=0?'到站后下车互动':trail.goal.name}`;}
      if(state.interior?.id==='station'&&['search','return'].includes(state.stationQuest)){ui('[data-city-mission-label]').textContent='失物招领';ui('[data-city-target]').textContent=state.stationQuest==='search'?'寻找红色行李箱':'送回问询台';ui('[data-city-distance]').textContent=state.stationQuest==='search'?'西侧候车区 · 靠近后按 E':'大厅东侧 · 靠近后按 E';}
      if(state.onTower==='skyline'){ui('[data-city-mission-label]').textContent=state.skyLift?'观光电梯':'云端漫游';ui('[data-city-target]').textContent=state.skyLift?Math.round(state.elevation)+' m':`186 m 全景露台 · ${state.skyViews.size} / 4`;ui('[data-city-distance]').textContent=state.skyLift?(state.skyLift.to==='deck'?'正在上行':'正在下行'):'WASD 走动 · 拖动环顾 · 东侧电梯下楼';}
      if(state.skyFocus){ui('[data-city-target]').textContent=Sim.skyViews.find(v=>v.id===state.skyFocus).name;ui('[data-city-distance]').textContent='拖动环顾 · E 退出全景眺望';}
      if(state.interior?.id==='skyline'){ui('[data-city-target]').textContent='云际中心 · 观光电梯';ui('[data-city-distance]').textContent='沿中轴走到电梯前，按 E 登楼';}
      if(tourGoal&&!state.interior&&!state.onTower&&!state.findingCar){ui('[data-city-mission-label]').textContent=driveTour.tour.name+' · '+(driveTour.index+1)+' / '+driveTour.tour.stops.length;ui('[data-city-target]').textContent=tourGoal.name;ui('[data-city-distance]').textContent=(state.vehicle<0?'V 召唤车辆 · ':'停车按 E 集章 · ')+Math.round(routeDistance||Sim.distance(state.player,goal))+' m';}
      if(state.findingCar&&!state.interior&&!state.onTower){ui('[data-city-mission-label]').textContent='寻车导航';ui('[data-city-target]').textContent='召唤车辆';ui('[data-city-distance]').textContent=Math.round(routeDistance||Sim.distance(state.player,goal))+' m · 靠近后按 E 驾驶';}
      countdown.hidden=!race||race.countdown<=0;const countLabel=race?.countdown>0?String(Math.ceil(race.countdown)):'';if(countdown.textContent!==countLabel)countdown.textContent=countLabel;
      ui('[data-city-toast]').textContent=playing&&state.messageTime>0?state.message:'';
      const heatMeter=panel.querySelector('[data-shop-meter]');if(heatMeter&&state.shopActivity?.kind==='bakery'){const heat=Sim.shopHeat(state.shopActivity);heatMeter.style.setProperty('--heat-position',String(heat*100)+'%');heatMeter.setAttribute('aria-valuenow',String(Math.round(heat*100)));}
      const car=state.vehicle>=0?state.cars[state.vehicle]:null;
      locator.hidden=!playing||!state.summonedCar||!!car||!!state.dialog;
      if(!locator.hidden){const origin=state.interior?state.returnTo||state.player:state.player,distance=Math.round(Sim.distance(origin,state.summonedCar));locator.querySelector('span').textContent=(state.interior||state.onTower?'入口':state.findingCar?'寻车中':'寻车')+' · '+distance+' m';locator.setAttribute('aria-pressed',String(!!state.findingCar));locator.setAttribute('aria-label',(state.findingCar?'取消寻车导航':'导航到召唤车辆')+'，距离 '+distance+' 米');locator.title=state.findingCar?'点击恢复原来的路线':'导航到车辆，原路线会保留';locator.querySelector('i').style.transform='rotate('+(Math.atan2(state.summonedCar.x-origin.x,-(state.summonedCar.z-origin.z))-state.cameraYaw)+'rad)';}
      hall.hidden=!state.onTower||!!state.skyLift;hall.textContent=state.onTower==='skyline'?'全景眺望':'观景厅';
      brake.hidden=!car;
      ui('[data-city-speed]').textContent=car?`${Math.round(Math.abs(car.speed)*3.6)}`:state.onTower?'观景':state.interior?'探索':'步行';
      ui('[data-city-mode]').textContent=car?`km/h · ${Sim.vehicleTypes[car.type].name} · ${car.health}%`:state.onTower==='skyline'?(state.skyLift?'观光电梯':'云际中心 · 186 m'):state.onTower?'E 返回地面':`体力 ${Math.round(state.stamina)}%`;
      const context=playing?Sim.context(state):null;enter.textContent=context?.kind==='car-exit'?'下车':context?.kind==='traffic-stop'?'拦停':context?.kind==='traffic-enter'?'换车':'互动';
      ui('[data-city-interact]').hidden=!context||!!state.dialog;
      if(context)ui('[data-city-interact]').textContent='E · '+context.label;
      status(state.onTower?'地标观景':state.interior?'室内探索':car?'自由驾驶':'自由漫游');minimap();updatePanel();
    }
    function tick(dt){
      if(!playing)return;const seconds=dt/1000;
      orbitTime=Math.max(0,orbitTime-seconds);
      physicsClock+=Math.min(seconds,.08);
      while(physicsClock>=1/60){Motion.capture(state);Sim.step(state,1/60,input());if(state.vehicle>=0&&!drag&&orbitTime===0)state.cameraYaw+=Sim.angleDelta(state.cameraYaw,state.player.yaw)*(-Math.expm1(-3/60));physicsClock-=1/60;}
      state.renderAlpha=physicsClock*60;
      if(state.score>lastScore){reward.textContent='+'+(state.score-lastScore);rewardTime=1.7;reward.classList.remove('is-visible');void reward.offsetWidth;reward.classList.add('is-visible');}lastScore=state.score;
      rewardTime=Math.max(0,rewardTime-seconds);if(!rewardTime)reward.classList.remove('is-visible');
      if(state.raceResult&&state.raceResult!==lastResult){lastResult=state.raceResult;const r=lastResult;if(!records[r.id]||r.time<records[r.id]){records[r.id]=r.time;try{localStorage.setItem(recordKey,JSON.stringify(records));}catch{}}}
      points(state.score);hudClock+=dt;if(hudClock>=100){hudClock=0;hud();}
    }
    function sportsFrame(){
      const shot=state.penalty;sports.hidden=!shot||shot.phase==='finished'||!!state.dialog;if(sports.hidden)return;
      sports.querySelector('[data-shot-score]').textContent=`${Math.min(5,shot.round+1)} / 5 · 命中 ${shot.goals}`;
      sports.querySelector('.city-shot-target').style.left=(50+shot.aim/3.9*46)+'%';sports.querySelector('.city-shot-keeper').style.left=(50+shot.keeper/3.9*46)+'%';
      const meter=sports.querySelector('.city-shot-meter');meter.hidden=shot.phase==='aim';meter.setAttribute('aria-valuenow',String(Math.round(shot.power*100)));meter.querySelector('i').style.left=(shot.power*100)+'%';
      sports.querySelector('[data-shot-hint]').textContent=shot.phase==='aim'?'E 锁定方向 · 避开门将':shot.phase==='power'?'E 踢球 · 绿色区间力量适中':shot.phase==='flight'?'射门！':`${shot.outcome} · E 准备下一球`;
    }
    function fallback(){
      const replacement=document.createElement('canvas');replacement.width=viewport.width;replacement.height=viewport.height;surface=replacement;replacement.className=c.className;c.replaceWith(replacement);bindOrbit(replacement);
      // Keep movement and missions usable if this device does not provide WebGL.
      const ctx=replacement.getContext('2d');if(!ctx){status('当前设备不支持画面渲染');return;}
      renderFallback=()=>{
        ctx.fillStyle='#d7e1e8';ctx.fillRect(0,0,viewport.width,viewport.height);
        const p=state.player,eye=[p.x-Math.sin(state.cameraYaw)*18,13,p.z+Math.cos(state.cameraYaw)*18];
        const projection=ArcadeWorld.camera({eye,target:[p.x,0,p.z],width:viewport.width,height:viewport.height,focal:viewport.height*1.05});
        const project=v=>{const q=projection(v);if(q)q.x=viewport.width-q.x;return q;};
        let faces=ArcadeWorld.cuboid({x:p.x,y:-.5,z:p.z,w:120,h:1,d:120,hue:145});
        for(let n=-96;n<=96;n+=32){faces.push(...ArcadeWorld.cuboid({x:n,y:.01,z:p.z,w:10,h:.1,d:120,hue:210}),...ArcadeWorld.cuboid({x:p.x,y:.01,z:n,w:120,h:.1,d:10,hue:210}));}
        const goal=Sim.objective(state);faces.push(...ArcadeWorld.cuboid({x:goal.x,y:2,z:goal.z,w:1,h:4,d:1,hue:state.race?190:40}));
        for(const b of [...state.buildings,...state.obstacles])if(Sim.distance(p,b)<75){const h=b.h||.8;faces.push(...ArcadeWorld.cuboid({...b,h,y:h/2,hue:b.hue||190}));}
        for(const car of [...state.cars,...state.traffic])if(Sim.distance(p,car)<80){
          const bounds=Sim.carBox(car),body=ArcadeWorld.cuboid({x:0,y:.65,z:0,w:bounds.hw*2,h:1.3,d:bounds.hl*2,hue:car.cruiseSpeed?205:35});
          for(const face of body)face.vertices=face.vertices.map(([x,y,z])=>[car.x+x*Math.cos(car.yaw)-z*Math.sin(car.yaw),y,car.z+x*Math.sin(car.yaw)+z*Math.cos(car.yaw)]);faces.push(...body);
        }
        if(state.vehicle<0)faces.push(...ArcadeWorld.cuboid({x:p.x,z:p.z,y:.85,w:.6,d:.5,h:1.7,hue:24}));
        ArcadeWorld.render(ctx,faces,project);
      };
      status('兼容画面 · 可继续漫游');
    }
    import('./vendor/three.module.min.js').then(async THREE=>{
      if(disposed)return;
      try{
        boot(12);
        const prep=window.ArcadeCityPreload;
        const [terrainData]=await Promise.all([prep?.terrain(state),prep?.textures(THREE,p=>boot(12+p*42))]);
        if(disposed)return;boot(70);
        renderer=new THREE.WebGLRenderer({canvas:c,antialias:true,powerPreference:'high-performance'});
        renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(viewport.width,viewport.height,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
        renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
        view=await buildSceneAsync(THREE,renderer,state,terrainData,boot,()=>disposed);if(!view)return;
        view.resize(viewport.width,viewport.height);view.lighting(night);boot(92);
        await Promise.all([prep?.navigation(state),view.prepare(()=>disposed)]);
        if(disposed)return;boot(100);hud();view.draw(0,camPitch,camDistance,0);readyToPlay();
      }catch(error){if(disposed)return;view?.dispose();view=null;renderer?.dispose();renderer=null;fallback();readyToPlay();}
    }).catch(()=>{if(!disposed){fallback();readyToPlay();}});
    hud();status('自由漫游 · 海岸城');
    return {
      tick,resize,draw:dt=>{sportsFrame();if(view&&ready)view.draw(state.time,camPitch,camDistance,(dt||0)/1000);else renderFallback?.();},
      key:key=>{
        const k=key.length===1?key.toLowerCase():key;
        if(k==='e'){if(!held.has(k)){interact();hud();}held.add(k);return true;}
        if(k==='m'){if(!held.has(k))openMap();held.add(k);return true;}
        if(k==='j'){if(!held.has(k))openTasks();held.add(k);return true;}
        if(k==='v'){if(!held.has(k))summonVehicle();held.add(k);return true;}
        if(k==='r'){if(!held.has(k))Sim.recover(state);held.add(k);return true;}
        if(k==='h'){state.hornTime=.6;state.message='嘀——';state.messageTime=1;return true;}
        if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift',' '].includes(k)){held.add(k);return true;}
        return false;
      },
      keyup:key=>held.delete(key.length===1?key.toLowerCase():key),
      release:()=>{held.clear();drag=null;},
      dispose:()=>{disposed=true;mapController?.dispose();mapController=null;held.clear();view?.dispose();renderer?.dispose();viewportObserver?.disconnect();overlay.remove();panel.remove();}
    };
  }

  function buildScene(T,renderer,state,preparedTerrain){
    const stages=buildSceneStages(T,renderer,state,preparedTerrain);let step;
    do{step=stages.next();}while(!step.done);return step.value;
  }
  async function buildSceneAsync(T,renderer,state,preparedTerrain,progress,cancelled){
    const stages=buildSceneStages(T,renderer,state,preparedTerrain);let step;
    while(!(step=stages.next()).done){progress(step.value);await new Promise(resolve=>requestAnimationFrame(resolve));if(cancelled()){stages.return();return null;}}
    return step.value;
  }
  function* buildSceneStages(T,renderer,state,preparedTerrain){
    const scene=new T.Scene();const exterior=new T.Group();scene.add(exterior);scene.background=new T.Color('#c7d3df');scene.fog=new T.FogExp2('#c7d3df',.0026);let nightMode=false;
    const camera=new T.PerspectiveCamera(58,960/600,.15,1600);
    const hemi=new T.HemisphereLight(0xd5e4f3,0x776b59,.95);scene.add(hemi);
    const sun=new T.DirectionalLight(0xffe3bf,2.5);sun.position.set(-45,55,30);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-44,right:44,top:44,bottom:-44,near:1,far:180});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
    const assetMaterials=ArcadeCityMaterials(T,renderer,()=>applySky());
    const detail=ArcadeCityDetailAssets(T,renderer);
    yield 73;
    const material=assetMaterials.material,materials=assetMaterials.materials,batches=new Map();
    const boxGeometry=new T.BoxGeometry(1,1,1),trunkGeometry=new T.CylinderGeometry(.5,.6,1,8);
    const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,-.5,.5,-.5,-.5,0,.5,-.5,-.5,-.5,.5,.5,-.5,.5,0,.5,.5],3));gable.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);gable.computeVertexNormals();
    const pyramid=new T.ConeGeometry(Math.SQRT1_2,1,4);pyramid.rotateY(Math.PI/4);
    const geometryTypes=new Map([['box',boxGeometry],['trunk',trunkGeometry],['cylinder',new T.CylinderGeometry(.5,.5,1,10)],['gable',gable],['pyramid',pyramid]]);
    const labels=[...ArcadeCityArchitecture.shopNames,...ArcadeCityArchitecture.streetNames],signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=1024;const signContext=signCanvas.getContext('2d');
    labels.forEach((label,i)=>{const x=i%4*512,y=Math.floor(i/4)*64;if(signContext){signContext.fillStyle=i<24?['#34534e','#68554b','#445f70','#66705b'][i%4]:'#365d58';signContext.fillRect(x,y,512,64);signContext.strokeStyle='#d3d9bd';signContext.lineWidth=2;signContext.strokeRect(x+7,y+5,498,54);signContext.font='600 30px "PingFang SC",sans-serif';signContext.fillStyle='#f4efdf';signContext.textAlign='center';signContext.textBaseline='middle';signContext.fillText(label,x+256,y+33);}
      const geometry=ArcadeCityArchitecture.signGeometry(T),uv=geometry.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,(x+2+uv.getX(j)*508)/2048,1-(y+62-uv.getY(j)*60)/1024);geometryTypes.set('sign-'+i,geometry);
    });
    const signTexture=new T.CanvasTexture(signCanvas);signTexture.colorSpace=T.SRGBColorSpace;signTexture.anisotropy=4;const signMaterial=material(0xffffff,0,'signage');signMaterial.map=signTexture;signMaterial.side=T.FrontSide;
    function box(x,y,z,w,h,d,color,group=exterior,surface='paint'){
      const m=new T.Mesh(boxGeometry,material(color,0,surface));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
    }
    function batch(x,y,z,w,h,d,color,shape='box',surface='paint',rotation=0){
      const key=shape+':'+surface;if(!batches.has(key))batches.set(key,{name:surface,mat:material(0xffffff,0,surface),geo:geometryTypes.get(shape)||boxGeometry,items:[]});
      batches.get(key).items.push([x,y,z,w,h,d,color,rotation]);
    }
    // A shallow basin exposes the pond bed and water rather than covering them with the city lawn.
    const cityGround=new T.PlaneGeometry(736,1104,184,276);cityGround.rotateX(-Math.PI/2);const groundPoints=cityGround.attributes.position,pond=ArcadeCityTerrain.park.pond;
    for(let i=0;i<groundPoints.count;i++){const x=groundPoints.getX(i)+16,z=groundPoints.getZ(i)-114,r=Math.hypot((x-pond.x)/pond.rx,(z-pond.z)/pond.rz),edge=ArcadeWorld.clamp((r-.72)/.3,0,1);groundPoints.setXYZ(i,x,-.7*(1-edge*edge*(3-2*edge)),z);}cityGround.computeVertexNormals();
    const land=new T.Mesh(cityGround,material(0xd0ceb9,0,'grass-land'));land.name='city-ground-with-pond-basin';land.receiveShadow=true;exterior.add(land);
    const seaGeometry=new T.PlaneGeometry(3000,7000,64,96);seaGeometry.rotateX(-Math.PI/2);
    const waveNormal=assetMaterials.waterNormal();
    waveNormal.repeat.set(280,320);
    const seaMaterial=new T.MeshPhysicalMaterial({color:0x4e8494,roughness:.22,metalness:.22,normalMap:waveNormal,normalScale:new T.Vector2(.28,.28),clearcoat:1,clearcoatRoughness:.15});
    const sea=new T.Mesh(seaGeometry,seaMaterial);sea.position.set(1884,-.08,0);exterior.add(sea);
    box(356,.015,-114,56,.08,1104,0xffffff,exterior,'sand').castShadow=false;
    let builtBuildings=0;for(const b of state.buildings){for(const p of ArcadeCityArchitecture.parts(b))batch(p.x,p.y+(b.baseY||0),p.z,p.w,p.h,p.d,p.color,p.shape,p.surface,p.rotation);if(++builtBuildings%24===0)yield 74+8*builtBuildings/state.buildings.length;}
    const landscape=ArcadeCityLandscape(T,{state,exterior,detail,material,assets:assetMaterials,batch,preparedTerrain});
    yield 84;
    const streets=ArcadeCityStreets(T,{state,exterior,batch,material});
    yield 86;
    const treePlacements=[];
    function solid(x,z,w,d,h){Sim.addCollider(state,{x,z,w,d,h});}
    function tree(x,z,height=5){if(state.places.some(p=>Sim.distance(p.door,{x,z})<6)||[...state.cars,...state.traffic].some(v=>Sim.distance(v,{x,z})<2.8))return;treePlacements.push({x,z,height});Sim.addCollider(state,{x,z,w:.6,d:.6,h:height,cameraIgnore:true});}
    for(const x of [-19.2,19.2])for(const z of [-19.2,19.2]){
      batch(x,.12,z,10,.1,10,0xd5d7bd,'box','grass-park');
      batch(x,.18,z,1.6,.05,10,0xf0e8da,'box','path-v');batch(x,.18,z,10,.05,1.6,0xf0e8da,'box','path-h');
      for(const [dx,dz]of [[-3.7,-3.7],[-3.7,3.7],[3.7,-3.7],[3.7,3.7]])tree(x+dx,z+dz,4.5+Math.sin(x+z+dx)*.4);
      for(const side of [-1,1]){batch(x+side*3.2,.65,z+1.8,1.8,.13,.65,0x8b7159);batch(x+side*3.2,.4,z+1.8,1.6,.5,.35,0x626a65);solid(x+side*3.2,z+1.8,1.8,.65,.75);}
    }
    for(let z=-330;z<340;z+=24){if(state.roads.some(n=>Math.abs(n-z)<ArcadeCityArchitecture.streetProfile(n).width/2+3))continue;tree(332,z,6);}
    for(const road of state.roads.filter(n=>Math.abs(n)>120))for(let z=-300;z<320;z+=52){const x=road+ArcadeCityArchitecture.streetProfile(road).width/2+3.3;if(state.roads.some(n=>Math.abs(n-z)<ArcadeCityArchitecture.streetProfile(n).width/2+3))continue;if(!Sim.blocked(state,x,z,1.5)&&ArcadeCityTerrain.facilityAllowed(state,x,z))tree(x,z,5+Math.abs(Math.sin(z+road)));}
    for(let z=-310;z<310;z+=34){
      const umbrella=new T.Mesh(new T.ConeGeometry(2.5,.8,12),material(z%3?0xd9c9a4:0x9caeaa));umbrella.position.set(355,2.5,z);exterior.add(umbrella);
      batch(355,1.1,z,.09,2.2,.09,0x937e60);batch(357,.28,z+1,1.1,.16,2.4,0xc6b28e);batch(357,.55,z,.9,.12,.8,0xe5dcc7);solid(355,z,.12,.12,2.2);solid(357,z+1,1.1,2.4,.6);
    }
    // Three intersecting alpha-tested planes retain the irregular photographed
    // silhouette from any street direction, with shared instanced geometry.
    const foliageGeometry=new T.PlaneGeometry(1,1),foliageMat=material(0xffffff,0,'foliage');
    const foliage=new T.InstancedMesh(foliageGeometry,foliageMat,treePlacements.length*3),treeDummy=new T.Object3D();
    let treeIndex=0;
    for(const tree of treePlacements)for(let plane=0;plane<3;plane++){
      treeDummy.position.set(tree.x,tree.height/2,tree.z);treeDummy.rotation.y=plane*Math.PI/3+(tree.x%7)*.13;
      treeDummy.scale.set(tree.height*1.21,tree.height,1);treeDummy.updateMatrix();foliage.setMatrixAt(treeIndex++,treeDummy.matrix);
    }
    foliage.instanceMatrix.needsUpdate=true;foliage.castShadow=true;foliage.receiveShadow=true;exterior.add(foliage);
    const fountain=new T.Mesh(new T.CylinderGeometry(3,3.4,.6,32),material(0xb6b9ad));fountain.position.set(19.2,.4,19.2);fountain.receiveShadow=true;exterior.add(fountain);
    const water=new T.Mesh(new T.CylinderGeometry(2.6,2.6,.06,32),seaMaterial);water.position.set(19.2,.74,19.2);exterior.add(water);
    box(19.2,1.2,19.2,.7,1.5,.7,0xbac1b5);
    const dummy=new T.Object3D(),instanceColor=new T.Color();
    for(const batchData of batches.values()){
      const mesh=new T.InstancedMesh(batchData.geo,batchData.mat,batchData.items.length);
      batchData.items.forEach(([x,y,z,w,h,d,color,rotation],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,-rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,instanceColor.setHex(color));});
      yield 87;
      mesh.name='city-batch:'+batchData.name;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.castShadow=!['road-marking','lamp-lens','window-light','signage'].includes(batchData.name);mesh.receiveShadow=true;exterior.add(mesh);
    }
    const tireGeometry=new T.CylinderGeometry(.34,.34,.22,20);tireGeometry.rotateZ(Math.PI/2);
    const rimGeometry=new T.CylinderGeometry(.18,.18,.23,16);rimGeometry.rotateZ(Math.PI/2);
    const tireMat=new T.MeshStandardMaterial({color:0x25292b,roughness:.95}),rimMat=new T.MeshStandardMaterial({color:0xa5adb1,roughness:.28,metalness:.85});
    const bodyShape=new T.Shape();bodyShape.moveTo(-.75,-.3);bodyShape.lineTo(.75,-.3);bodyShape.quadraticCurveTo(.9,-.3,.9,-.15);bodyShape.lineTo(.9,.15);bodyShape.quadraticCurveTo(.9,.3,.75,.3);bodyShape.lineTo(-.75,.3);bodyShape.quadraticCurveTo(-.9,.3,-.9,.15);bodyShape.lineTo(-.9,-.15);bodyShape.quadraticCurveTo(-.9,-.3,-.75,-.3);
    const bodyGeometry=new T.ExtrudeGeometry(bodyShape,{depth:3.4,bevelEnabled:true,bevelSize:.065,bevelThickness:.065,bevelSegments:2,steps:1,curveSegments:5});bodyGeometry.translate(0,0,-1.7);
    const cabinGeometry=new T.BufferGeometry();
    cabinGeometry.setAttribute('position',new T.Float32BufferAttribute([-.74,.9,-1.05,.74,.9,-1.05,.74,.9,1.1,-.74,.9,1.1,-.64,1.44,-.63,.64,1.44,-.63,.64,1.44,.72,-.64,1.44,.72],3));
    cabinGeometry.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5]);cabinGeometry.computeVertexNormals();
    function car(color,type=0){
      const group=new T.Group(),body=new T.Mesh(bodyGeometry,material(color,0,'car'));group.rotation.order='YXZ';body.position.y=.6;body.castShadow=true;body.receiveShadow=true;group.add(body);
      const cabin=new T.Mesh(cabinGeometry,material(0x405c70,0,'glass'));cabin.castShadow=true;group.add(cabin);
      box(0,1.46,.045,1.32,.07,1.4,color,group,'car');const headlight=box(0,.69,-1.79,1.35,.13,.05,0xe8e2cf,group);const brake=box(0,.69,1.79,1.3,.12,.05,0xb9473b,group);
      headlight.material=headlight.material.clone();headlight.material.emissive.set(0xffefca);
      brake.material=brake.material.clone();brake.material.emissive.set(0xd43928);group.userData={wheels:[],brake:brake.material,light:headlight.material};
      for(const x of [-.94,.94])for(const z of [-1.15,1.15]){
        const axle=new T.Group();axle.position.set(x,.35,z);group.add(axle);const spin=new T.Group();axle.add(spin);
        const wheel=new T.Mesh(tireGeometry,tireMat);wheel.castShadow=true;spin.add(wheel);spin.add(new T.Mesh(rimGeometry,rimMat));group.userData.wheels.push({axle,spin,front:z<0});
      }
      if(type===1){group.scale.set(1.05,1.18,1.08);box(0,1.55,.1,1.4,.11,2.2,color,group,'car');}
      if(type===2){group.scale.z=.86;group.scale.y=.95;}
      exterior.add(group);return group;
    }
    // Retain the same mesh when a traffic vehicle becomes player-controlled.
    const carMeshes=new Map([...state.cars,...state.traffic].map(v=>{const mesh=car(v.color,v.type);mesh.name='city-vehicle:'+v.id;return [v,mesh];}));
    const headlights=new T.SpotLight(0xe9f0ff,0,44,.5,.65,2),headPosition=new T.Vector3(),headTarget=new T.Vector3();headlights.name='player-headlights';headlights.castShadow=false;exterior.add(headlights,headlights.target);
    const carHighlight=new T.Mesh(new T.TorusGeometry(2.6,.065,6,40),new T.MeshBasicMaterial({color:0xffd48a,transparent:true,opacity:.8,depthWrite:false}));carHighlight.name='vehicle-interaction';carHighlight.rotation.x=-Math.PI/2;exterior.add(carHighlight);
    const torsoGeometry=new T.CapsuleGeometry(.25,.4,4,12),headGeometry=new T.SphereGeometry(.19,16,12);
    const legGeometry=new T.CapsuleGeometry(.095,.48,4,8),armGeometry=new T.CapsuleGeometry(.07,.43,4,8);
    function person(color,variant=0){
      const group=new T.Group(),skin=material([0xd4ad89,0xbe9271,0xdcbba0,0x9f765c,0xcfa98d][variant%5]);
      const add=(geometry,mat,x,y,z,parent=group)=>{const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
      const torso=add(torsoGeometry,material(color),0,1.15,0);torso.scale.z=.72;
      add(headGeometry,skin,0,1.71,0);const hair=add(headGeometry,material(variant%2?0x665346:0x423c35),0,1.79,.025);hair.scale.set(1.02,.55,1.01);
      add(new T.SphereGeometry(.037,8,6),skin,0,1.69,-.19);
      for(const side of [-1,1]){add(new T.SphereGeometry(.012,6,5),material(0x34383b),side*.065,1.74,-.174);add(new T.SphereGeometry(.035,8,6),skin,side*.18,1.7,0);}
      const legs=[];for(const side of [-1,1]){const hip=new T.Group();hip.position.set(side*.125,.79,0);group.add(hip);add(legGeometry,material(variant%2?0x545b59:0x3d5366),0,-.33,0,hip);box(0,-.67,-.055,.2,.14,.34,0x45494b,hip);legs.push(hip);}
      const arms=[];for(const side of [-1,1]){const shoulder=new T.Group();shoulder.position.set(side*.3,1.38,0);group.add(shoulder);add(armGeometry,material(color),0,-.3,0,shoulder);add(new T.SphereGeometry(.07,8,6),skin,0,-.58,0,shoulder);arms.push(shoulder);}
      group.scale.y=1+(variant%3-1)*.035;exterior.add(group);return {group,legs,arms};
    }
    const hero=person(0xb78e69),people=state.pedestrians.map((v,i)=>person([0x96b0ad,0xbfa79e,0x919eb3,0xc0ba8e][i%4],i%5));scene.add(hero.group);
    const passenger=person(0x6c94a2,2);passenger.group.name='job-passenger';passenger.group.visible=false;
    const deliveryBag=new T.Group();deliveryBag.name='delivery-bag';hero.group.add(deliveryBag);box(0,1.1,.35,.42,.48,.24,0xb08d62,deliveryBag);box(0,1.1,.48,.08,.48,.02,0xe1cda6,deliveryBag);deliveryBag.visible=false;
    const stationCarry=new T.Group();stationCarry.name='station-carried-case';hero.group.add(stationCarry);box(.5,.43,.05,.48,.65,.3,0xae6559,stationCarry);box(.5,.87,.05,.25,.25,.04,0x526a70,stationCarry);
    const cityLife=ArcadeCityLife(T,{state,exterior,detail,material,person});
    const streetDetails=ArcadeCityDetails(T,{state,exterior,detail,material});
    const landmarks=ArcadeCityLandmarks(T,{scene,exterior,box,material,person,detail},state);
    const interiorScenes=ArcadeCityInteriorScene(T,{scene,detail,material,sky:assetMaterials.sky});
    Sim.settleActors(state);
    yield 90;
    const tokenGeo=new T.TorusGeometry(.55,.12,6,16),tokenMat=new T.MeshStandardMaterial({color:0xf2cb77,emissive:0xc28d31,emissiveIntensity:.3,metalness:.6,roughness:.35});
    const tokens=state.tokens.map(v=>{const m=new T.Mesh(tokenGeo,tokenMat);m.position.set(v.x,1.5,v.z);exterior.add(m);return m;});
    const shells=state.shells.map(v=>{const m=new T.Mesh(new T.SphereGeometry(.35,12,8,0,Math.PI*1.5,0,Math.PI*.65),material(0xe7c7a3));m.scale.set(1.3,.5,1);m.position.set(v.x,.35,v.z);exterior.add(m);return m;});
    const marker=new T.Group(),markerMat=new T.MeshBasicMaterial({color:0xffd783,transparent:true,opacity:.75,depthWrite:false});
    const ring=new T.Mesh(new T.TorusGeometry(2.7,.13,8,40),markerMat);ring.rotation.x=-Math.PI/2;ring.position.y=.22;marker.add(ring);
    const beam=new T.Mesh(new T.CylinderGeometry(.18,.18,9,8,1,true),new T.MeshBasicMaterial({color:0xffe3a0,transparent:true,opacity:.18,depthWrite:false}));beam.position.y=4.5;marker.add(beam);
    const diamond=new T.Mesh(new T.OctahedronGeometry(.65),markerMat);diamond.position.y=4;marker.add(diamond);marker.name='destination-marker';exterior.add(marker);
    const routeLine=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xf2d18b,dashSize:2,gapSize:1.6,transparent:true,opacity:.65,depthWrite:false}));routeLine.name='street-navigation';exterior.add(routeLine);let lastRoute=null;
    const tourGeometry=new T.RingGeometry(3,3.18,48);tourGeometry.rotateX(-Math.PI/2);const tourRing=new T.Mesh(tourGeometry,new T.MeshBasicMaterial({color:0xc5e1d3,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}));tourRing.name='tour-stop-ring';exterior.add(tourRing);let lastTourStop=null;
    const raceMaterial=new T.MeshBasicMaterial({color:0x62d5ef,transparent:true,opacity:.8,depthWrite:false});
    const raceGate=new T.Group();raceGate.name='race-checkpoint';
    const arch=new T.Mesh(new T.TorusGeometry(5,.14,8,40,Math.PI),raceMaterial);arch.position.y=.2;raceGate.add(arch);exterior.add(raceGate);
    const startMarkers=Sim.races.map(course=>{
      const group=new T.Group();group.name='race-start:'+course.id;group.position.set(course.start.x,0,course.start.z);
      const ring=new T.Mesh(new T.TorusGeometry(3.5,.09,6,32),raceMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.1;group.add(ring);
      for(const side of [-1,1]){box(side*4.2,1.5,0,.12,3,.12,0x548494,group);box(side*4.2,2.6,0,.75,.65,.08,0x9ad8df,group);}
      exterior.add(group);return group;
    });
    const skidGeometry=new T.PlaneGeometry(1,1);skidGeometry.rotateX(-Math.PI/2);
    const skids=new T.InstancedMesh(skidGeometry,new T.MeshBasicMaterial({color:0x293137,transparent:true,opacity:.28,depthWrite:false}),96);skids.name='brake-trails';skids.frustumCulled=false;exterior.add(skids);
    const skidSlots=Array.from({length:96},()=>({life:0,x:0,z:0,yaw:0}));let skidIndex=0,skidClock=0;const skidDummy=new T.Object3D();
    const cameraRig=Motion.rig(),panoramaRig={space:null,yaw:0,pitch:0},playerPose={},carPoses=new Map();let lastTime=0;
    function applySky(){
      if(assetMaterials.sky.image){
        scene.background=assetMaterials.sky;scene.environment=assetMaterials.sky;
        scene.backgroundIntensity=nightMode ? .07 : 1;scene.environmentIntensity=nightMode ? .12 : .65;
        scene.backgroundBlurriness=.018;
      }else scene.background=new T.Color(nightMode?0x172b43:0xc7d3df);
    }
    function lighting(isNight){
      nightMode=isNight;applySky();scene.fog.color.set(isNight?0x172b43:0xc7d3df);scene.fog.density=isNight ? .0028 : .00145;
      hemi.intensity=isNight ? .28 : .95;sun.intensity=isNight ? .22 : 2.5;renderer.toneMappingExposure=isNight?1.05:1;
      streets.lighting(isNight);
      landscape.lighting(isNight);cityLife.lighting(isNight);streetDetails.lighting(isNight);landmarks.lighting(isNight);
    }
    function draw(time,pitch,distance,renderDelta){
      const dt=Math.min(.05,Math.max(0,renderDelta??(time-lastTime)));lastTime=time;const optical=state.scenicView?Sim.scenicPose(state):null,p=Motion.pose(state,state.player,true,playerPose);
      scene.fog.density=(nightMode ? .0028 : .00145)*((state.onTower==='skyline'||state.scenicView?.id==='ridge-scope') ? .42 : 1);
      exterior.visible=!state.interior;landmarks.update(state);interiorScenes.update(state,nightMode);landscape.update(time);cityLife.update(time);streetDetails.update();
      function vehicle(mesh,v){
        const dist=Sim.distance(state.player,v),inLens=!optical||dist<45||((v.x-optical.eye.x)*Math.sin(state.cameraYaw)-(v.z-optical.eye.z)*Math.cos(state.cameraYaw))/(Math.hypot(v.x-optical.eye.x,v.z-optical.eye.z)||1)>.75;mesh.visible=!state.interior&&dist<(optical?1200:150)&&inLens;if(!mesh.visible)return;
        let pose=carPoses.get(v);if(!pose){pose={};carPoses.set(v,pose);}Motion.pose(state,v,false,pose);
        const yaw=pose.yaw,data=mesh.userData,reset=data.lastX===undefined||data.summonRevision!==v.summonRevision||Math.hypot(pose.x-data.lastX,pose.z-data.lastZ)>20;data.summonRevision=v.summonRevision;
        data.slopeClock=(data.slopeClock||0)+dt;
        if(reset||data.slopeClock>=.065){
          data.slopeClock=0;let targetPitch=0;
          if(pose.elevation>.2||pose.x<-340){const sx=Math.sin(yaw)*1.4,sz=-Math.cos(yaw)*1.4,front=ArcadeCityTerrain.roadAt(state,pose.x+sx,pose.z+sz,pose.elevation,true,{id:v.surfaceId,yaw}),back=ArcadeCityTerrain.roadAt(state,pose.x-sx,pose.z-sz,pose.elevation,true,{id:v.surfaceId,yaw});targetPitch=Math.max(-.3,Math.min(.3,Math.atan2(front.y-back.y,2.8)));}
          data.pitch=targetPitch;
        }
        data.visualY=reset?pose.elevation:Motion.damp(data.visualY,pose.elevation,12,dt);
        mesh.position.set(pose.x,data.visualY+.085,pose.z);mesh.rotation.y=-yaw;mesh.rotation.x=reset?(data.pitch||0):Motion.damp(mesh.rotation.x,data.pitch||0,9,dt);
        mesh.rotation.z=Motion.damp(mesh.rotation.z,Math.max(-.025,Math.min(.025,(v.steer||0)*v.speed*.0012)),7,dt);
        data.lastX=pose.x;data.lastZ=pose.z;
        for(const wheel of data.wheels){wheel.spin.rotation.x-=state.dialog?0:v.speed*dt/.34;if(wheel.front)wheel.axle.rotation.y=-(v.steer||0)*.35;}
        data.brake.emissiveIntensity=v.braking?2.2:.15;data.light.emissiveIntensity=nightMode?2.5:.1;
      }
      for(const v of [...state.cars,...state.traffic])vehicle(carMeshes.get(v),v);
      const action=Sim.context(state),target=action?.kind==='traffic-stop'||action?.kind==='traffic-enter'?state.traffic.find(v=>v.id===action.id):state.vehicle<0?state.summonedCar:null;
      carHighlight.visible=!!target&&!state.interior&&!state.onTower;if(target){carHighlight.position.set(target.x,(target.elevation||0)+.08,target.z);const pulse=state.findingCar?1+Math.sin(time*2)*.04:1;carHighlight.scale.setScalar(pulse);}
      hero.group.visible=state.vehicle<0&&!state.skyFocus&&!state.scenicView;hero.group.position.set(p.x,p.elevation||0,p.z);hero.group.rotation.y=-p.yaw;
      const swing=state.walking?Math.sin(time*(state.sprinting?11:8))*.38:0;hero.legs[0].rotation.x=swing;hero.legs[1].rotation.x=-swing;hero.arms[0].rotation.x=-swing*.65;hero.arms[1].rotation.x=swing*.65;if(state.penalty?.phase==='flight')hero.legs[1].rotation.x=-Math.sin(Math.min(1,state.penalty.elapsed/.3)*Math.PI)*1.05;
      deliveryBag.visible=state.job?.id==='coffee'&&state.job.phase==='deliver';stationCarry.visible=state.stationQuest==='return';
      passenger.group.visible=state.job?.id==='taxi'&&!state.interior;
      if(passenger.group.visible){const waiting=state.job.phase==='pickup',spot=waiting?Sim.jobGoal(state):state.player;passenger.group.position.set(spot.x+(waiting?2.5:Math.cos(p.yaw)*.43),waiting?0:.02,spot.z+(waiting?0:Math.sin(p.yaw)*.43));passenger.group.rotation.y=waiting?-Math.atan2(p.x-spot.x,-(p.z-spot.z)):-p.yaw;passenger.group.scale.setScalar(waiting?1:.82);passenger.legs.forEach(leg=>leg.rotation.x=waiting?0:-1.3);passenger.arms[1].rotation.z=waiting?-.8-Math.sin(time*3)*.12:0;passenger.group.visible=Sim.distance(p,spot)<100;}
      people.forEach((person,i)=>{const npc=state.pedestrians[i],pose=Motion.pose(state,npc);person.group.visible=!state.interior&&Sim.distance(p,npc)<90;if(!person.group.visible)return;person.group.position.set(pose.x,pose.elevation,pose.z);person.group.rotation.y=-pose.yaw;const a=npc.walking?Math.sin(npc.motionPhase)*.24:0;person.legs[0].rotation.x=a;person.legs[1].rotation.x=-a;person.arms[0].rotation.x=-a*.6;person.arms[1].rotation.x=a*.6;});
      tokens.forEach((mesh,i)=>{mesh.visible=!state.tokens[i].taken&&Sim.distance(p,state.tokens[i])<100;mesh.rotation.y=time*.9;mesh.position.y=1.5+Math.sin(time*2+i)*.17;});
      shells.forEach((mesh,i)=>{mesh.visible=state.beachQuest&&!state.shells[i].taken;mesh.rotation.y=time*.4;});
      const destination=Sim.objective(state);marker.position.set(destination.x,ArcadeCityTerrain.height(state,destination.x,destination.z,destination.y??ArcadeCityTerrain.rawHeight(destination.x,destination.z),state.vehicle>=0),destination.z);marker.visible=!state.race;diamond.rotation.y=time*.8;diamond.position.y=3.8+Math.sin(time*2)*.2;
      const scenic=window.ArcadeCityTours?.goal(state),scenicKey=scenic&&scenic.surfaceId+':'+scenic.x+':'+scenic.z;
      tourRing.visible=!!scenic&&!state.findingCar&&!state.interior&&!state.onTower&&Sim.distance(p,scenic)<160;
      if(scenic&&scenicKey!==lastTourStop){lastTourStop=scenicKey;tourRing.position.set(scenic.x,0,scenic.z);const vertices=tourGeometry.attributes.position;for(let i=0;i<vertices.count;i++){const surface=ArcadeCityTerrain.roadAt(state,scenic.x+vertices.getX(i),scenic.z+vertices.getZ(i),scenic.y,true,{id:scenic.surfaceId});vertices.setY(i,surface.y+.065);}vertices.needsUpdate=true;tourGeometry.computeBoundingSphere();}
      const route=Sim.navigationPath(state);routeLine.visible=route.length>1;
      if(route!==lastRoute){lastRoute=route;routeLine.geometry.dispose();routeLine.geometry=new T.BufferGeometry().setFromPoints(route.map(p=>new T.Vector3(p.x,(p.y||0)+.12,p.z)));routeLine.computeLineDistances();routeLine.material.color.set(state.race?0x62d5ef:0xf2d18b);}
      raceGate.visible=!!state.race;
      if(state.race){const course=Sim.races.find(r=>r.id===state.race.id),previous=state.race.index?course.checkpoints[state.race.index-1]:course.start;raceGate.position.set(destination.x,0,destination.z);raceGate.rotation.y=Math.atan2(destination.x-previous.x,destination.z-previous.z);}
      startMarkers.forEach((mesh,i)=>mesh.visible=!state.race&&Sim.distance(p,Sim.races[i].start)<130);
      const driving=state.vehicle>=0?state.cars[state.vehicle]:null;
      const activeMesh=driving&&carMeshes.get(driving);
      const headRoad=driving?ArcadeCityTerrain.roadAt(state,p.x,p.z,state.elevation,true):null,headTunnel=headRoad?.path?.type==='tunnel'&&ArcadeCityTerrain.rawHeight(p.x,p.z)>state.elevation+3;
      headlights.visible=!!driving&&(nightMode||headTunnel)&&!state.interior;headlights.intensity=headlights.visible?290:0;
      if(headlights.visible&&activeMesh){activeMesh.updateWorldMatrix(true,false);headlights.position.copy(activeMesh.localToWorld(headPosition.set(0,.7,-1.86)));headlights.target.position.copy(activeMesh.localToWorld(headTarget.set(0,.08,-24)));headlights.target.updateMatrixWorld();}
      skidClock+=state.dialog?0:dt;
      if(driving?.braking&&Math.abs(driving.speed)>7&&skidClock>.06){skidClock=0;for(const side of [-.78,.78]){Object.assign(skidSlots[skidIndex++%96],{life:6,x:driving.x+Math.cos(driving.yaw)*side-Math.sin(driving.yaw),z:driving.z+Math.sin(driving.yaw)*side+Math.cos(driving.yaw),yaw:driving.yaw});}}
      skidSlots.forEach((slot,i)=>{slot.life=Math.max(0,slot.life-(state.dialog?0:dt));skidDummy.position.set(slot.x,.065,slot.z);skidDummy.rotation.y=-slot.yaw;skidDummy.scale.set(slot.life>0?.2*Math.min(1,slot.life):0,1,slot.life>0?.8:0);skidDummy.updateMatrix();skids.setMatrixAt(i,skidDummy.matrix);});skids.instanceMatrix.needsUpdate=true;
      const fieldOfView=optical?optical.fov:driving?62:58;if(Math.abs(camera.fov-fieldOfView)>.02){camera.fov=Motion.damp(camera.fov,fieldOfView,3,dt);camera.updateProjectionMatrix();}
      const indoor=state.interior&&state.interior.kind!=='stadium';if(indoor){distance=Math.min(distance,state.interior.furniture?5.2:7);pitch=Math.max(.08,Math.min(pitch,.24));}
      const road=state.interior?null:ArcadeCityTerrain.roadAt(state,p.x,p.z,state.elevation,state.vehicle>=0);if(road?.path?.type==='tunnel'&&ArcadeCityTerrain.rawHeight(p.x,p.z)>state.elevation+3){distance=Math.min(distance,6);pitch=Math.min(pitch,.12);}
      const elevation=activeMesh?activeMesh.position.y-.085:p.elevation||0;
      const focus=state.skyLift?{x:p.x,y:elevation,z:p.z,yaw:-Math.PI/2,pitch:.14,distance:12,space:'sky-lift'}:state.penalty?{x:0,y:.8,z:-16,yaw:0,pitch:.14,distance:12,space:'penalty'}:{x:p.x,y:elevation,z:p.z,yaw:p.cameraYaw,pitch,distance,space:(state.interior?.id||state.onTower||'outside')+':'+state.vehicle};
      const result=Motion.camera(cameraRig,focus,dt,(target,eye)=>{
        const room=state.interior,tunnel=road?.path?.type==='tunnel';
        if(state.onTower==='skyline'&&!state.skyLift){const tower=state.places.find(p=>p.id==='skyline');for(let t=.04;t<=1.001;t+=.04){const x=target.x+(eye.x-target.x)*t-tower.x,z=target.z+(eye.z-target.z)*t-tower.z,y=target.y+(eye.y-target.y)*t-tower.elevation;if(Sim.skyObstacles.some(b=>b.h>2&&y<b.h+.25&&Math.abs(x-b.x)<b.w/2+.2&&Math.abs(z-b.z)<b.d/2+.2))return Math.max(.02,t-.04);}return 1;}
        for(let t=.12;t<=1.001;t+=.04){const x=target.x+(eye.x-target.x)*t,z=target.z+(eye.z-target.z)*t,y=target.y+(eye.y-target.y)*t;
          if(room){
            if(Math.abs(x)>room.width/2-.35||Math.abs(z)>room.depth/2-.35||y>room.height-.35)return Math.max(.18,t-.055);
            if(room.obstacles.some(b=>{const a=b.rotation||0,dx=x-b.x,dz=z-b.z;return (b.h||1.1)>y-.2&&Math.abs(dx*Math.cos(a)+dz*Math.sin(a))<b.w/2+.25&&Math.abs(-dx*Math.sin(a)+dz*Math.cos(a))<b.d/2+.25;}))return Math.max(.18,t-.055);
          }else if(!state.onTower){
            for(let ix=Math.floor((x-.3)/32);ix<=Math.floor((x+.3)/32);ix++)for(let iz=Math.floor((z-.3)/32);iz<=Math.floor((z+.3)/32);iz++)for(const b of state.collisionIndex.get(ix+','+iz)||[]){
              if(b.cameraIgnore||b.w<.35&&b.d<.35)continue;
              const r=b.rotation||0,dx=x-b.x,dz=z-b.z,min=b.minY??b.baseY??0,max=b.maxY??min+(b.h||0);
              if(y>min-.2&&y<max+.2&&Math.abs(dx*Math.cos(r)+dz*Math.sin(r))<b.w/2+.3&&Math.abs(-dx*Math.sin(r)+dz*Math.cos(r))<b.d/2+.3)return Math.max(.18,t-.055);
            }
            if(x<-352){const inside=tunnel&&ArcadeCityTerrain.roadAt(state,x,z,elevation,true,{id:road.path.id});const inBore=inside?.path?.type==='tunnel'&&y>inside.y+.2&&y<inside.y+5.3;if(!inBore&&y<ArcadeCityTerrain.groundHeight(state,x,z)+.35)return Math.max(.18,t-.055);}
          }
        }
        return 1;
      });
      camera.position.set(result.eye.x,result.eye.y,result.eye.z);camera.lookAt(result.target.x,result.target.y,result.target.z);
      if(state.onTower==='skyline'&&state.skyFocus){const v=Sim.skyViews.find(v=>v.id===state.skyFocus),tower=state.places.find(p=>p.id==='skyline'),reset=panoramaRig.space!==v.id;panoramaRig.yaw=reset?p.cameraYaw:Motion.angle(panoramaRig.yaw,p.cameraYaw,-Math.expm1(-9*dt));panoramaRig.pitch=reset?pitch+.25:Motion.damp(panoramaRig.pitch,pitch+.25,9,dt);panoramaRig.space=v.id;const x=tower.x+(v.x?Math.sign(v.x)*13.1:0),z=tower.z+(v.z?Math.sign(v.z)*15.1:0),y=tower.elevation+1.7,heading=panoramaRig.yaw,tilt=panoramaRig.pitch;camera.position.set(x,y,z);camera.lookAt(x+Math.sin(heading)*Math.cos(tilt)*200,y-Math.sin(tilt)*200,z-Math.cos(heading)*Math.cos(tilt)*200);}else if(optical){const v=optical;camera.position.set(v.eye.x,v.eye.y,v.eye.z);camera.lookAt(v.target.x,v.target.y,v.target.z);panoramaRig.space='field:'+state.scenicView.id;}else panoramaRig.space=null;
      const shadowGrid=88/2048,shadowX=Math.round(p.x/shadowGrid)*shadowGrid,shadowZ=Math.round(p.z/shadowGrid)*shadowGrid;sun.position.set(shadowX-45,elevation+75,shadowZ+30);sun.target.position.set(shadowX,elevation,shadowZ);sun.target.updateMatrixWorld();
      const positions=seaGeometry.attributes.position;
      for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,Math.sin(x*.17+time*.6)*Math.cos(z*.13+time*.4)*.035);}
      positions.needsUpdate=true;waveNormal.offset.set(time*.004,time*.002);
      streets.update(dt,camera);renderer.render(scene,camera);
    }
    function dispose(){interiorScenes.dispose();const geometries=new Set(geometryTypes.values()),mats=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());signTexture.dispose();landscape.dispose();cityLife.dispose();streetDetails.dispose();streets.dispose();landmarks.dispose();detail.dispose();assetMaterials.dispose();}
    function resize(width,height){camera.aspect=width/height;camera.updateProjectionMatrix();}
    async function prepare(cancelled=()=>false){
      landmarks.update(state);
      const textures=new Set();scene.traverse(o=>{for(const mat of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])for(const key of ['map','normalMap','bumpMap','emissiveMap'])if(mat[key])textures.add(mat[key]);});
      if(renderer.initTexture){let count=0;for(const texture of textures){if(cancelled())return;renderer.initTexture(texture);if(++count%4===0)await new Promise(resolve=>requestAnimationFrame(resolve));}}
      if(cancelled())return;if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile?.(scene,camera);
    }
    return {draw,resize,lighting,prepare,dispose};
  }
  return {city3d};
};
