/* Two complete 3D games rendered from world-space meshes with a perspective camera. */
window.Arcade3D = ({canvas,button,points,finish,active,status}) => {
  const {clamp,camera,cuboid,render,overlap}=ArcadeWorld;
  const background=(ctx,upper,lower)=>{
    const gradient=ctx.createLinearGradient(0,0,0,540);
    gradient.addColorStop(0,upper);gradient.addColorStop(1,lower);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,480,540);
  };

  function stack3d() {
    const {c,ctx}=canvas(480,540,true);
    const tower=[{x:0,y:0,z:0,w:3.4,h:.48,d:3.4,hue:216}];
    let moving,axis='x',velocity=1,level=0,total=0,combo=0,viewHeight=0;
    let cooldown=0,message='找准时机，落下第一块',messageTime=0;
    let scraps=[];
    function spawn(){
      const top=tower[tower.length-1];axis=level%2===0?'x':'z';
      moving={...top,y:top.y+.48,hue:(216+level*13)%360};
      moving[axis]=top[axis]-5;velocity=1;
    }
    const describe=()=>status(`已叠 ${level} 层 · 连续完美 ${combo} 次`);
    function drop(){
      if(!active()||cooldown>0)return;
      cooldown=200;
      const top=tower[tower.length-1],size=axis==='x'?'w':'d';
      const delta=moving[axis]-top[axis];
      const hit=overlap(moving[axis],moving[size],top[axis],top[size]);
      if(hit.size<=.035){finish('高塔倒下了',`成功叠起 ${level} 层，下次再高一点。`);return;}
      const tolerance=Math.min(.11,top[size]*.09);
      if(Math.abs(delta)<=tolerance){
        moving[axis]=top[axis];combo++;total+=100+50*combo;
        message=`完美对齐！连续 ${combo} 次`;messageTime=1300;
      }else{
        combo=0;total+=100;
        const lost=moving[size]-hit.size;
        scraps.push({...moving,[size]:lost,[axis]:delta>0?hit.center+hit.size/2+lost/2:hit.center-hit.size/2-lost/2,vy:0,vx:Math.sign(delta)*2,axis});
        moving[axis]=hit.center;moving[size]=hit.size;
        message='稳稳落下，继续向上';messageTime=1000;
      }
      tower.push({...moving});level++;points(total);describe();spawn();
    }
    function tick(dt){
      const seconds=dt/1000;
      cooldown=Math.max(0,cooldown-dt);messageTime=Math.max(0,messageTime-dt);
      const top=tower[tower.length-1];
      moving[axis]+=velocity*Math.min(4.5,2.15+level*.085)*seconds;
      if(Math.abs(moving[axis]-top[axis])>=5){moving[axis]=top[axis]+Math.sign(moving[axis]-top[axis])*5;velocity*=-1;}
      viewHeight+=(Math.max(0,top.y-1.4)-viewHeight)*Math.min(1,seconds*4);
      scraps.forEach(p=>{p.vy-=12*seconds;p.y+=p.vy*seconds;p[p.axis]+=p.vx*seconds;});
      scraps=scraps.filter(p=>p.y>viewHeight-8);
    }
    function draw(){
      background(ctx,'#101c34','#302d50');
      const project=camera({eye:[8,viewHeight+7,-10],target:[0,viewHeight+.7,0],height:540,focal:540});
      const faces=cuboid({x:0,y:-.5,z:0,w:6.5,h:.3,d:6.5,hue:224});
      for(const block of tower.slice(-32))faces.push(...cuboid(block));
      faces.push(...cuboid(moving));
      for(const block of scraps)faces.push(...cuboid({...block,alpha:.65}));
      render(ctx,faces,project);
      ctx.fillStyle='#dce7ff';ctx.textAlign='center';ctx.font='600 14px system-ui';
      ctx.fillText(messageTime>0||level===0?message:'点击画面或按空格落下',240,33);
      ctx.font='700 64px system-ui';ctx.fillStyle='#ffffff12';ctx.fillText(String(level).padStart(2,'0'),405,105);
    }
    c.addEventListener('pointerdown',drop);button('落下方块',drop);
    spawn();describe();draw();
    return {tick,draw,key:k=>{if(k===' '||k==='Enter'){drop();return true;}return false;}};
  }

  function flight3d() {
    const {c,ctx}=canvas(840,520,true);
    const ship={x:0,y:0};let distance=0,shields=3,combo=0,passed=0,bonus=0,flash=0;
    let objects=[],serial=0,nextZ=32,time=0,ready=false;
    const keys=new Set();
    let target=null,dragging=false,dragOrigin=null;
    const setTarget=e=>{
      if(!active()||!dragOrigin)return;
      const box=c.getBoundingClientRect();
      target={x:clamp(dragOrigin.x+(e.clientX-dragOrigin.px)/box.width*10,-4.3,4.3),y:clamp(dragOrigin.y-(e.clientY-dragOrigin.py)/box.height*6,-2.5,2.5)};
    };
    c.addEventListener('pointerdown',e=>{
      if(!active())return;dragging=true;dragOrigin={px:e.clientX,py:e.clientY,x:ship.x,y:ship.y};target=null;c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove',e=>{if(dragging)setTarget(e);});
    c.addEventListener('pointerup',()=>{dragging=false;dragOrigin=null;});
    c.addEventListener('pointercancel',()=>{dragging=false;dragOrigin=null;target=null;});
    function populate(){
      while(nextZ<distance+160){
        const x=serial===0?0:Math.sin(serial*1.17)*2.6;
        const y=serial===0?0:Math.sin(serial*.83)*1.35;
        objects.push({type:'gate',x,y,z:nextZ,checked:false});
        // One obstacle between gates; it never fills the whole flight corridor.
        if(serial>0)objects.push({type:'rock',x:Math.sin(serial*2.1)*3.5,y:Math.cos(serial*1.7)*1.8,z:nextZ+11,checked:false});
        nextZ+=27;serial++;
      }
      objects=objects.filter(o=>o.z>distance-9);
    }
    function damage(reason){shields--;combo=0;flash=.55;points(Math.floor(distance)*2+bonus);if(shields<=0)finish('本次航行结束',`${reason} · 穿过 ${passed} 道星门，飞行 ${Math.floor(distance)} 米`);}
    function tick(dt){
      const seconds=dt/1000;time+=seconds;flash=Math.max(0,flash-seconds);
      if(!ready){status('准备起航 · 点击「开始飞行」');return;}
      let dx=0,dy=0;
      if(keys.has('ArrowLeft')||keys.has('a'))dx--;
      if(keys.has('ArrowRight')||keys.has('d'))dx++;
      if(keys.has('ArrowUp')||keys.has('w'))dy++;
      if(keys.has('ArrowDown')||keys.has('s'))dy--;
      if(dx||dy){target=null;ship.x+=dx*4.5*seconds;ship.y+=dy*3.5*seconds;}
      else if(target){ship.x+=(target.x-ship.x)*Math.min(1,seconds*8);ship.y+=(target.y-ship.y)*Math.min(1,seconds*8);}
      ship.x=clamp(ship.x,-4.3,4.3);ship.y=clamp(ship.y,-2.5,2.5);
      const previous=distance;
      const speed=Math.min(32,13+distance/140);distance+=seconds*speed;
      populate();
      for(const obj of objects){
        if(obj.checked||obj.z>distance||obj.z<previous)continue;
        obj.checked=true;
        if(obj.type==='gate'){
          if(Math.abs(ship.x-obj.x)<1.42&&Math.abs(ship.y-obj.y)<1.02){passed++;combo++;bonus+=250+Math.min(10,combo-1)*50;}
          else damage('偏离星门中心');
        }else if(Math.abs(ship.x-obj.x)<.93&&Math.abs(ship.y-obj.y)<.93)damage('与陨石相撞');
        // The final score must include the distance reached at this collision.
        if(shields<=0)return;
      }
      points(Math.floor(distance)*2+bonus);
      status(`护盾 ${'◆'.repeat(shields)}${'◇'.repeat(3-shields)} · 星门 ${passed} · ${Math.floor(speed)} 米/秒`);
    }
    function draw(){
      const backdrop=ctx.createLinearGradient(0,0,0,520);backdrop.addColorStop(0,'#080e21');backdrop.addColorStop(1,'#183246');ctx.fillStyle=backdrop;ctx.fillRect(0,0,840,520);
      // A centered chase camera follows the player in both axes. The ship stays
      // below the horizon and steering moves the world rather than tilting it.
      const project=ArcadeWorld.flightCamera(ship,distance);
      // World-space navigation grid and stars make translation and depth visible.
      ctx.strokeStyle='#609fb52b';ctx.lineWidth=1;
      const line=(a,b)=>{const p=project(a),q=project(b);if(!p||!q)return;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();};
      for(let x=-5;x<=5;x+=2)line([x,-3,distance-4],[x,-3,distance+150]);
      for(let z=Math.floor(distance/8)*8;z<distance+150;z+=8){line([-5,-3,z],[5,-3,z]);line([-5,3,z],[5,3,z]);}
      for(let i=0;i<65;i++){
        const z=distance+((i*17.71-distance*.2)%140+140)%140+4;
        const p=project([Math.sin(i*31.3)*17,Math.cos(i*17.1)*10,z]);
        if(p){ctx.fillStyle='#c9e6ff9c';ctx.fillRect(p.x,p.y,1.5,1.5);}
      }
      const faces=[];
      for(const o of objects){
        if(o.z<distance+.6)continue;
        if(o.type==='rock'){faces.push(...cuboid({...o,w:1.3,h:1.3,d:1.3,hue:355}));continue;}
        const hue=o.checked?155:185;
        faces.push(...cuboid({x:o.x-1.85,y:o.y,z:o.z,w:.22,h:2.95,d:.45,hue}),...cuboid({x:o.x+1.85,y:o.y,z:o.z,w:.22,h:2.95,d:.45,hue}),...cuboid({x:o.x,y:o.y+1.48,z:o.z,w:3.92,h:.22,d:.45,hue}),...cuboid({x:o.x,y:o.y-1.48,z:o.z,w:3.92,h:.22,d:.45,hue}));
      }
      const x=ship.x,y=ship.y,z=distance;
      const nose=[x,y,z+1.15],left=[x-.85,y-.12,z-.6],right=[x+.85,y-.12,z-.6],top=[x,y+.33,z-.35];
      faces.push({vertices:[nose,left,top],fill:'#81d7ec',stroke:'#c4f2ff'}, {vertices:[nose,top,right],fill:'#d2f1ff',stroke:'#c4f2ff'}, {vertices:[left,right,top],fill:'#4076ae',stroke:'#77c3ff'}, {vertices:[nose,right,left],fill:'#335c9a',stroke:'#77c3ff'});
      render(ctx,faces,project);
      const exhaust=project([x,y-.03,z-.8]);
      if(exhaust){ctx.fillStyle='#8ae8fa';ctx.shadowBlur=18;ctx.shadowColor='#5ae8ff';ctx.beginPath();ctx.arc(exhaust.x,exhaust.y,3+Math.sin(time*25),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
      const next=objects.find(o=>o.type==='gate'&&!o.checked);
      // Project the flight path at the gate's depth, so the marker is an exact
      // visual guide to the collision test, even above or below the gate.
      if(next&&ready){
        const aim=project([ship.x,ship.y,next.z]);
        if(aim){
          const aligned=Math.abs(ship.x-next.x)<1.42&&Math.abs(ship.y-next.y)<1.02;
          ctx.strokeStyle=aligned?'#91f0c2':'#c7e9fa';ctx.lineWidth=1.4;ctx.beginPath();
          ctx.arc(aim.x,aim.y,5,0,Math.PI*2);ctx.moveTo(aim.x-11,aim.y);ctx.lineTo(aim.x-7,aim.y);ctx.moveTo(aim.x+7,aim.y);ctx.lineTo(aim.x+11,aim.y);ctx.moveTo(aim.x,aim.y-11);ctx.lineTo(aim.x,aim.y-7);ctx.stroke();
        }
      }
      ctx.fillStyle='#a4bdd6';ctx.textAlign='left';ctx.font='12px system-ui';
      ctx.fillText(`${Math.floor(distance)} m`,20,28);
      if(next&&ready){ctx.textAlign='right';ctx.fillText(`星门 ${Math.max(0,Math.ceil(next.z-distance))} m`,820,28);}
      if(flash>0){ctx.fillStyle=`rgba(255,86,113,${flash*.35})`;ctx.fillRect(0,0,840,520);}
    }
    const launch=button('开始飞行',()=>{ready=true;launch.disabled=true;launch.textContent='飞行中';});
    for(const [label,axis,amount] of [['左移','x',-.6],['上升','y',.5],['下降','y',-.5],['右移','x',.6]])button(label,()=>{target=null;ship[axis]+=amount;ship.x=clamp(ship.x,-4.3,4.3);ship.y=clamp(ship.y,-2.5,2.5);});
    const key=k=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)){keys.add(k);return true;}if(k===' '){ready=true;launch.disabled=true;launch.textContent='飞行中';return true;}return false;};
    populate();status('准备起航 · 点击「开始飞行」');draw();
    return {tick,draw,key,keyup:k=>keys.delete(k),release:()=>{keys.clear();dragging=false;dragOrigin=null;target=null;}};
  }
  return {stack3d,flight3d};
};
