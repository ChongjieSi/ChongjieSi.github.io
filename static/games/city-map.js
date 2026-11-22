/* A quiet geographic atlas. Activities and progress belong to the task panel. */
window.ArcadeCityMap=({state,Sim,container,onNavigate,onTeleport})=>{
  const entries=Sim.mapEntries(state),categories=[['landmark','地标'],['nature','自然'],['life','街区'],['transport','交通'],['building','建筑']];let category='landmark',selected=null,results=[],width=720,height=620,disposed=false;
  const node=(tag,className,text)=>{const o=document.createElement(tag);if(className)o.className=className;if(text!==undefined)o.textContent=text;return o;};
  const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 21V5h12v16M3 21h18M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>';
  const root=node('div','city-atlas'),board=node('div','city-atlas-board'),canvas=node('canvas','city-atlas-canvas'),pins=node('div','city-atlas-pins'),you=node('div','city-atlas-you');canvas.setAttribute('aria-label','城市道路、海岸与森林地图');you.innerHTML='<i></i><span>你在这里</span>';board.append(canvas,pins,you);
  const compass=node('div','city-atlas-compass');compass.innerHTML='<i></i><span>N</span>';board.append(compass);const scale=node('div','city-atlas-scale');board.append(scale);
  const sidebar=node('aside','city-atlas-sidebar'),search=node('input','city-atlas-search');search.type='search';search.placeholder='搜索地点或建筑';search.setAttribute('aria-label','搜索地图地点');
  const filters=node('nav','city-atlas-filters');filters.setAttribute('aria-label','地点类别');const filterButtons=new Map();for(const [key,name]of categories){const b=node('button','',name);b.type='button';b.dataset.mapCategory=key;b.setAttribute('aria-pressed',String(key===category));b.onclick=()=>{category=key;search.value='';selected=null;refresh();};filters.append(b);filterButtons.set(key,b);}
  const list=node('div','city-atlas-list'),detail=node('section','city-atlas-detail'),caption=node('p','city-atlas-caption','选择地点，查看路线或传送');sidebar.append(search,filters,list,detail,caption);root.append(board,sidebar);container.append(root);
  const ctx=canvas.getContext('2d');let project=p=>({x:p.x,z:p.z,y:p.z}),scaleFactor=1;
  const origin=()=>state.interior?state.returnTo||state.player:state.player;
  function drawBase(){
    if(disposed)return;const measured=board.getBoundingClientRect();width=measured.width||720;height=measured.height||620;const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';
    const b=state.bounds,pad=32;scaleFactor=Math.min((width-pad*2)/(b.maxX-b.minX),(height-pad*2)/(b.maxZ-b.minZ));const ox=(width-(b.maxX-b.minX)*scaleFactor)/2,oy=(height-(b.maxZ-b.minZ)*scaleFactor)/2;project=p=>({x:ox+(p.x-b.minX)*scaleFactor,y:oy+(p.z-b.minZ)*scaleFactor});
    if(ctx){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#e7eae1';ctx.fillRect(0,0,width,height);
      const rect=(x,z,w,d,color)=>{const p=project({x,z});ctx.fillStyle=color;ctx.fillRect(p.x,p.y,w*scaleFactor,d*scaleFactor);};
      rect(328,b.minZ-200,2000,b.maxZ-b.minZ+400,'#e9dcc2');rect(384,b.minZ-200,2000,b.maxZ-b.minZ+400,'#b2cbd0');rect(b.minX-200,b.minZ-200,-352-b.minX+200,b.maxZ-b.minZ+400,'#c8d6c2');
      // Tonal relief follows the same authored heightfield as the 3D forest.
      for(let x=b.minX;x<-352;x+=24)for(let z=b.minZ;z<b.maxZ;z+=24){const y=ArcadeCityTerrain.rawHeight(x,z);rect(x,z,24,24,`rgba(92,126,94,${Math.min(.22,y/310)})`);}
      const park=ArcadeCityTerrain.park;rect(park.x-park.rx,park.z-park.rz,park.rx*2,park.rz*2,'#c4d7bd');
      function path(points,color,lineWidth,dashed=false){ctx.beginPath();points.forEach((p,i)=>{const q=project(p);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dashed?[4,4]:[]);ctx.stroke();}
      path(state.roadPlan.river,'#99bac1',Math.max(2,6*scaleFactor));const pond=project(park.pond);ctx.fillStyle='#99bac1';ctx.beginPath();ctx.ellipse(pond.x,pond.y,park.pond.rx*scaleFactor,park.pond.rz*scaleFactor,0,0,Math.PI*2);ctx.fill();
      for(const p of state.roadPlan.paths){const trail=['trail','garden-path'].includes(p.type);path(p.points,p.type==='elevated'?'#9bafb3':trail?'#d9d1ba':'#f9faf4',Math.max(trail?1:1.2,p.width*scaleFactor),p.type==='tunnel');}
      ctx.setLineDash([]);for(const p of state.buildings)rect(p.x-p.w/2,p.z-p.d/2,p.w,p.d,'#b7c0b753');for(const p of state.places)if(p.kind!=='pier')rect(p.x-p.w/2,p.z-p.d/2,p.w,p.d,'#8daba655');
      ctx.fillStyle='#65816e';ctx.textAlign='center';ctx.font='500 13px "PingFang SC",sans-serif';for(const [text,x,z]of [['林海溪谷',-625,340],['中央城区',80,-355],['白沙海岸',355,340]]){const p=project({x,z});ctx.fillText(text,p.x,p.y);}
    }
    scale.style.width=(100*scaleFactor)+'px';scale.textContent='100 m';positionPins();
  }
  function positionPins(){for(const pin of pins.children){const item=entries.find(p=>p.id===pin.dataset.mapPin),p=project(item.door);pin.style.left=p.x+'px';pin.style.top=p.y+'px';}const p=project(origin());you.style.left=p.x+'px';you.style.top=p.y+'px';}
  function select(item){selected=item;for(const el of [...list.children,...pins.children])el.setAttribute('aria-pressed',String((el.dataset.mapPlace||el.dataset.mapPin)===item.id));renderDetail();}
  let go=null,reason=null;
  function renderDetail(){
    detail.replaceChildren();if(!selected){detail.append(node('p','city-atlas-empty','在地图或列表中选择地点'));go=reason=null;return;}
    const name=node('h3','',selected.name),meta=node('p','city-atlas-meta',selected.label+' · '+Math.round(Sim.distance(origin(),selected.door))+' m'),actions=node('div','city-atlas-actions');
    const nav=node('button','city-atlas-navigate','设为导航');nav.dataset.mapNavigate=selected.id;nav.onclick=()=>onNavigate(selected.id);
    go=node('button','city-atlas-teleport','传送到这里');go.dataset.mapTeleport=selected.id;go.onclick=()=>{if(onTeleport(selected.id)===false){update();reason.textContent=Sim.teleportReason(state)||state.message;}};reason=node('p','city-atlas-reason');reason.setAttribute('role','status');actions.append(nav,go);detail.append(name,meta,actions,reason);update();
  }
  function refresh(){
    const query=search.value.trim().toLowerCase();results=entries.filter(p=>query?p.name.toLowerCase().includes(query):p.category===category);if(!query&&category==='building')results.sort((a,b)=>Sim.distance(origin(),a.door)-Sim.distance(origin(),b.door));results=results.slice(0,query||category==='building'?12:24);
    for(const [key,b]of filterButtons)b.setAttribute('aria-pressed',String(!query&&key===category));list.replaceChildren();pins.replaceChildren();
    for(const p of results){const row=node('button','city-atlas-place');row.dataset.mapPlace=p.id;row.setAttribute('aria-pressed',String(selected?.id===p.id));const title=node('span','',p.name),type=node('small','',p.label);row.append(title,type);row.onclick=()=>select(p);list.append(row);
      const pin=node('button','city-atlas-pin');pin.dataset.mapPin=p.id;pin.title=p.name;pin.setAttribute('aria-label',p.name);pin.setAttribute('aria-pressed',String(selected?.id===p.id));pin.innerHTML=icon;pin.append(node('span','',p.name));pin.onclick=()=>{select(p);row.scrollIntoView?.({block:'nearest'});};pins.append(pin);
    }
    if(!results.length)list.append(node('p','city-atlas-empty','没有找到地点'));caption.textContent=!query&&category==='building'?'显示附近建筑，搜索可查找全部地址':'';renderDetail();positionPins();
  }
  function update(){if(disposed)return;if(go){const message=Sim.teleportReason(state);go.disabled=!!message;reason.textContent=message;}positionPins();}
  search.oninput=()=>{selected=null;refresh();};refresh();drawBase();
  const observer=window.ResizeObserver?new ResizeObserver(()=>drawBase()):null;observer?.observe(board);return {update,dispose(){disposed=true;observer?.disconnect();root.remove();}};
};
