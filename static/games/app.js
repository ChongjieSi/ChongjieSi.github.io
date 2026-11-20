(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const game=Arcade.games.find(g=>g.id===new URLSearchParams(location.search).get('game'))||Arcade.games[0];
  document.title=game.name+' · 游戏大厅';
  document.querySelector('.game-shell').classList.toggle('is-3d',game.tag==='3D');
  document.querySelector('.game-shell').dataset.game=game.id;
  $('#title').textContent=game.name;$('#category').textContent=Arcade.categoryNames[game.tag];$('#instructions').textContent=game.controls;$('#rule').textContent=game.rule;
  const stage=$('#stage'),controls=$('#touch-controls');
  let score=0,ended=false,paused=false,hostActive=window.parent===window,started=false,submitted=false,engine=null;
  let roundTime=0,lastTime=0;
  const active=()=>!ended&&!paused&&hostActive&&!document.hidden;
  const points=n=>{const next=Math.max(0,Math.floor(n));if(next!==score){score=next;$('#score').textContent=score.toLocaleString();if(game.id!=='city3d'&&game.id!=='flight3d')pulse($('#score'));}};
  const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function pulse(element){if(element?.animate&&!reduceMotion())element.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});}
  function finish(title,detail=''){
    if(ended)return;ended=true;$('#status').textContent=title;
    const undoButton=$('#gomoku-undo');if(undoButton)undoButton.disabled=true;
    $('#result-title').textContent=title;$('#result-detail').textContent=detail;$('#final-score').textContent=score.toLocaleString();
    $('#nickname').value=Arcade.nickname();$('#save-score').disabled=false;$('#save-score').textContent='提交成绩';$('#submit-message').textContent='';$('#skip').textContent='暂不提交';
    $('#result').showModal();syncPause();
  }
  function syncPause(){
    const show=!ended&&started&&(paused||!hostActive||document.hidden);
    $('#pause-cover').hidden=!show;$('#pause-message').textContent=!hostActive?'请切回这个游戏窗口继续。':'游戏已暂停。';
    $('#pause').textContent=paused?'继续':'暂停';
  }
  function start(){
    if(started&&!ended&&!confirm('要重新开始吗？本局进度将被清空。'))return;
    ended=false;paused=false;submitted=false;started=true;roundTime=0;points(0);engine?.dispose?.();$('#gomoku-undo')?.remove();$('#gomoku-zoom')?.remove();stage.replaceChildren();controls.replaceChildren();$('#result').close();
    engine=factories[game.id]();fitStage();syncPause();
  }
  let helpWasPaused=false;
  $('#show-help').onclick=()=>{helpWasPaused=paused;paused=true;engine?.release?.();syncPause();$('#help').showModal();};
  $('#close-help').onclick=()=>$('#help').close();
  $('#help').addEventListener('close',()=>{paused=helpWasPaused;syncPause();});
  $('#restart').onclick=start;
  $('#pause').onclick=()=>{if(ended)return;paused=!paused;syncPause();};
  $('#resume').onclick=()=>{paused=false;syncPause();};
  $('#again').onclick=()=>{ended=true;start();};
  $('#skip').onclick=()=>$('#result').close();
  $('#submit-score').onsubmit=e=>{
    e.preventDefault();if(submitted)return;const name=$('#nickname').value.trim();if(!name){$('#nickname').setCustomValidity('请输入昵称。');$('#nickname').reportValidity();return;}
    try{Arcade.submit(game.id,name,score);submitted=true;$('#submit-message').textContent='成绩已保存到本机排行榜。';$('#save-score').disabled=true;$('#save-score').textContent='已提交成绩';$('#skip').textContent='关闭';parent.postMessage({type:'arcade-score'},location.origin);}
    catch{$('#submit-message').textContent='浏览器存储不可用，未能保存本次成绩。';}
  };
  $('#nickname').oninput=()=>$('#nickname').setCustomValidity('');
  window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='arcade-active'){hostActive=!!e.data.active;if(!hostActive)engine?.release?.();syncPause();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)engine?.release?.();syncPause();});
  document.addEventListener('pointerdown',()=>parent.postMessage({type:'arcade-focus'},location.origin));
  window.addEventListener('blur',()=>engine?.release?.());
  document.addEventListener('keydown',e=>{
    if(e.target.closest?.('input,textarea,select,dialog')||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key.toLowerCase()==='p'){e.preventDefault();if(!e.repeat){paused=!paused;engine?.release?.();syncPause();}return;}
    if(!active())return;
    if(engine?.key?.(e.key))e.preventDefault();
  });
  document.addEventListener('keyup',e=>engine?.keyup?.(e.key));
  const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.type='button';if(['◀','▶','▲','▼','左移','右移','上升','下降'].includes(label))b.className='direction-control';b.onclick=()=>{b.blur();if(active())fn();};controls.append(b);return b;};
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const grid=(cls,count,click)=>{const div=document.createElement('div');div.className='grid '+cls;const cells=Array.from({length:count},(_,i)=>{const b=document.createElement('button');b.type='button';b.onclick=()=>{if(active())click(i);};div.append(b);return b;});stage.append(div);return {div,cells};};
  function swipe(element,callback){let origin; element.addEventListener('pointerdown',e=>{origin=[e.clientX,e.clientY];element.setPointerCapture(e.pointerId);});element.addEventListener('pointerup',e=>{if(!origin)return;const dx=e.clientX-origin[0],dy=e.clientY-origin[1];origin=null;if(active()&&Math.max(Math.abs(dx),Math.abs(dy))>20)callback(Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp'));});element.addEventListener('pointercancel',()=>origin=null);}
  function canvas(w,h,wide=false,kind='2d'){const wrap=document.createElement('div');wrap.className='canvas-wrap'+(wide?' wide':'');const c=document.createElement('canvas');c.width=w;c.height=h;c.className='arcade-canvas';c.setAttribute('aria-label',game.name+'游戏区域');wrap.append(c);stage.append(wrap);return {c,ctx:kind==='2d'?c.getContext('2d'):null};}
  // Size the playfield from the space left after the fixed header and controls.
  // Both dimensions are constrained, so tall boards never scroll out of a window.
  function fitStage(){
    const width=stage.clientWidth,height=stage.clientHeight;
    if(!width||!height)return;
    const wrap=stage.querySelector('.canvas-wrap');
    if(wrap&&game.id==='city3d'){
      wrap.style.width=`${width}px`;wrap.style.height=`${height}px`;engine?.resize?.(width,height);return;
    }
    if(wrap){
      const c=wrap.querySelector('canvas'),rail=stage.querySelector('.tetris-rail');
      const available=width-(rail?rail.offsetWidth+18:0);
      const fitted=Math.max(1,Math.min(available,height*c.width/c.height));
      wrap.style.width=`${fitted}px`;wrap.style.height=`${fitted*c.height/c.width}px`;
    }else{
      const board=stage.querySelector('.grid');
      if(board){const size=Math.min(width,height,game.id==='gomoku'?Infinity:560);board.style.width=`${size}px`;board.style.height=`${size}px`;}
    }
  }
  if(window.ResizeObserver)new ResizeObserver(fitStage).observe(stage);
  window.addEventListener('resize',fitStage);
  const direction=k=>({ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]})[k];
  const factories={};
  factories['2048']=()=>{
    let board=Array(16).fill(0);
    const div=document.createElement('div');div.className='grid tiles';div.setAttribute('role','img');div.setAttribute('aria-label','2048 棋盘');stage.append(div);
    const cells=board.map(()=>{const c=document.createElement('div');c.className='tile';div.append(c);return c;});
    const spawn=()=>{const empty=board.flatMap((v,i)=>v?[]:[i]);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;};
    const render=()=>{cells.forEach((c,i)=>{if(c.dataset.value!==String(board[i])&&board[i])pulse(c);c.textContent=board[i]||'';c.dataset.value=board[i];c.classList.toggle('high',board[i]>=128);});$('#status').textContent='最大数字 · '+Math.max(...board);};
    const move=k=>{
      const dir=direction(k);if(!dir)return false;const before=board.join();let earned=0;
      for(let n=0;n<4;n++){
        const ids=Array.from({length:4},(_,i)=>dir[0]?n*4+i:i*4+n);if(dir[0]>0||dir[1]>0)ids.reverse();
        const values=ids.map(i=>board[i]).filter(Boolean),result=[];
        for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){const v=values[i]*2;earned+=v;result.push(v);i++;}else result.push(values[i]);}
        ids.forEach((id,i)=>board[id]=result[i]||0);
      }
      if(board.join()!==before){points(score+earned);spawn();render();}
      if(board.every(Boolean)&&!board.some((v,i)=>(i%4<3&&v===board[i+1])||(i<12&&v===board[i+4])))finish('游戏结束','最大数字：'+Math.max(...board));
      return true;
    };spawn();spawn();render();swipe(div,move);return {key:move};
  };
  factories.gomoku=()=>{
    let board=Array(225).fill(0),turn=1,pending=0,last=-1;const history=[];const dirs=[[1,0],[0,1],[1,1],[1,-1]];
    const {cells}=grid('gomoku',225,play);
    for(const i of [48,56,112,168,176])cells[i].dataset.star='true';
    const line=(id,who,dx,dy)=>{const x=id%15,y=Math.floor(id/15),ids=[id];for(const sign of [-1,1])for(let n=1;n<15;n++){const xx=x+dx*n*sign,yy=y+dy*n*sign;if(xx<0||xx>=15||yy<0||yy>=15||board[yy*15+xx]!==who)break;ids.push(yy*15+xx);}return ids;};
    const winning=(id,who)=>dirs.map(([x,y])=>line(id,who,x,y)).find(ids=>ids.length>=5);
    const undo=button('悔棋',()=>{
      if(!history.length||ended)return;
      // If white has replied, remove the whole human/computer pair.
      const remove=history[history.length-1].who===2?2:1;
      for(let n=0;n<remove&&history.length;n++)board[history.pop().id]=0;
      last=history.length?history[history.length-1].id:-1;
      turn=1;pending=0;$('#status').textContent='轮到你了 · 执黑';render();
    });
    undo.id='gomoku-undo';undo.title='撤回你与电脑的上一轮落子';
    document.querySelector('.game-actions').insertBefore(undo,$('#pause'));
    const zoom=button('⛶',async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
      catch{parent.postMessage({type:'arcade-maximize'},location.origin);}
    });
    zoom.id='gomoku-zoom';zoom.title='全屏棋盘';zoom.setAttribute('aria-label','全屏棋盘');
    document.querySelector('.game-actions').insertBefore(zoom,$('#pause'));
    const render=()=>{
      undo.disabled=!history.length||ended;
      cells.forEach((c,i)=>{c.className=(board[i]===1?'black':board[i]===2?'white':'')+(i===last?' last':'');c.disabled=!!board[i]||turn===2||ended;c.setAttribute('aria-label',`${Math.floor(i/15)+1}, ${i%15+1}: ${board[i]===1?'黑子':board[i]===2?'白子':'空位'}`);});
    };
    function place(id,who){board[id]=who;history.push({id,who});last=id;pulse(cells[id]);const win=winning(id,who);if(win){points(who===1?1000+20*board.filter(v=>!v).length:0);render();win.forEach(i=>cells[i].classList.add('win'));finish(who===1?'你赢了！':'电脑获胜',who===1?'五子连珠，落子精彩。':'试着提前封住电脑的活三和活四。');return true;}if(board.every(Boolean)){points(500);render();finish('和棋','棋盘已满，本局平分秋色。');return true;}return false;}
    function evaluate(id,who){board[id]=who;let value=0;const x=id%15,y=Math.floor(id/15);for(const [dx,dy]of dirs){let count=1,open=0;for(const sign of [-1,1]){let n=1;for(;n<6;n++){const xx=x+dx*n*sign,yy=y+dy*n*sign;if(xx<0||xx>=15||yy<0||yy>=15)break;const v=board[yy*15+xx];if(v===who)count++;else{if(!v)open++;break;}}}value+=count>=5?1e8:count===4?(open===2?1e6:open?100000:0):count===3?(open===2?10000:open?600:0):count===2?(open===2?300:30):open*4;}board[id]=0;return value;}
    function ai(){const candidates=board.flatMap((v,i)=>{if(v)return [];const x=i%15,y=Math.floor(i/15);return board.some((stone,j)=>stone&&Math.abs(j%15-x)<=2&&Math.abs(Math.floor(j/15)-y)<=2)?[i]:[];});let best=-Infinity,choice=candidates[0]??112;
      for(const i of candidates){const attack=evaluate(i,2),defend=evaluate(i,1);const value=attack>=1e8?1e10:defend>=1e8?1e9:attack+defend*1.15+(14-Math.abs(i%15-7)-Math.abs(Math.floor(i/15)-7));if(value>best){best=value;choice=i;}}
      if(place(choice,2))return;turn=1;$('#status').textContent='轮到你了 · 执黑';render();
    }
    function play(i){if(turn!==1||board[i])return;if(place(i,1))return;turn=2;pending=0;$('#status').textContent='电脑思考中…';render();}
    $('#status').textContent='轮到你了 · 执黑';render();return {tick:dt=>{if(turn===2){pending+=dt;if(pending>350)ai();}}};
  };
  factories.memory=()=>{
    const faces=['☀','☾','★','✿','♠','♥','♦','♣','♫','☂','☕','⚑','⚓','✈','⚡','❄','⚙','☯'];
    const deck=shuffle([...faces,...faces]);let open=[],matched=new Set(),moves=0,wait=0;
    const {cells}=grid('memory',36,i=>{if(wait||matched.has(i)||open.includes(i))return;open.push(i);render();if(open.length===2){moves++;const [a,b]=open;if(deck[a]===deck[b]){matched.add(a);matched.add(b);open=[];render();if(matched.size===36){points(Math.max(100,6000-moves*50-Math.floor(roundTime/1000)*5));finish('全部配对成功！',`${moves} 次尝试 · 用时 ${Math.floor(roundTime/1000)} 秒`);}}else wait=650;}status();});
    const status=()=>$('#status').textContent=`${matched.size/2} / 18 对 · ${moves} 次尝试`;
    function render(){cells.forEach((c,i)=>{const visible=open.includes(i)||matched.has(i);c.textContent=visible?deck[i]:'✦';c.classList.toggle('open',visible);if(matched.has(i)&&!c.classList.contains('matched'))pulse(c);c.classList.toggle('matched',matched.has(i));c.disabled=matched.has(i);c.setAttribute('aria-label',visible?deck[i]:`未翻开的第 ${i+1} 张卡片`);});}
    render();status();return {tick:dt=>{if(wait){wait-=dt;if(wait<=0){wait=0;open=[];render();}}}};
  };
  factories.tetris=()=>{
    const {ctx}=canvas(300,540);const unit=27,ox=15;let board=Array.from({length:20},()=>Array(10).fill(0)),bag=[],piece,next,elapsed=0,lines=0;
    const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
    const colors=['','#71d7e7','#f7ce71','#b59af3','#88d5a5','#ef8292','#83a5f0','#f1ab73'];
    const rail=document.createElement('aside');rail.className='tetris-rail';
    rail.innerHTML='<span class="rail-label">下一块</span><canvas class="piece-preview" width="104" height="88" aria-label="下一个方块"></canvas><p class="next-piece"></p><div class="key-guide"><span><kbd>↑</kbd>旋转</span><span><kbd>← →</kbd>移动</span><span><kbd>↓</kbd>加速</span><span><kbd>空格</kbd>落下</span></div>';
    stage.append(rail);const note=rail.querySelector('.next-piece');const preview=rail.querySelector('canvas').getContext('2d');
    const get=()=>{if(!bag.length)bag=shuffle([0,1,2,3,4,5,6]);const id=bag.pop();return {m:shapes[id].map(r=>r.slice()),id:id+1,x:3,y:0};};
    const valid=(p,dx=0,dy=0,m=p.m)=>m.every((r,y)=>r.every((v,x)=>!v||(p.x+x+dx>=0&&p.x+x+dx<10&&p.y+y+dy>=0&&p.y+y+dy<20&&!board[p.y+y+dy][p.x+x+dx])));
    const status=()=>{const symbols=['I','O','T','S','Z','J','L'];$('#status').textContent=`第 ${1+Math.floor(lines/10)} 级 · 已消 ${lines} 行`;note.textContent=`${symbols[next.id-1]} 型`;preview.clearRect(0,0,104,88);const block=20,px=(104-next.m[0].length*block)/2,py=(88-next.m.length*block)/2;next.m.forEach((r,y)=>r.forEach((v,x)=>{if(v){preview.fillStyle=colors[next.id];preview.fillRect(px+x*block+1,py+y*block+1,block-2,block-2);}}));};
    const spawn=()=>{piece=next||get();next=get();status();if(!valid(piece))finish('方块到顶了',`本局消除 ${lines} 行`);};
    function lock(){piece.m.forEach((r,y)=>r.forEach((v,x)=>{if(v)board[piece.y+y][piece.x+x]=piece.id;}));const kept=board.filter(r=>!r.every(Boolean)),count=20-kept.length;if(count){points(score+[0,100,300,500,800][count]*(1+Math.floor(lines/10)));lines+=count;while(kept.length<20)kept.unshift(Array(10).fill(0));board=kept;}spawn();elapsed=0;}
    const drop=()=>{if(valid(piece,0,1)){piece.y++;return true;}lock();return false;};
    const key=k=>{if(k==='ArrowLeft'||k==='a'){if(valid(piece,-1))piece.x--;return true;}if(k==='ArrowRight'||k==='d'){if(valid(piece,1))piece.x++;return true;}if(k==='ArrowDown'||k==='s'){if(drop())points(score+1);return true;}if(k==='ArrowUp'||k==='x'||k==='w'){const m=piece.m[0].map((_,i)=>piece.m.map(r=>r[i]).reverse());for(const shift of [0,-1,1,-2,2])if(valid(piece,shift,0,m)){piece.m=m;piece.x+=shift;break;}return true;}if(k===' '){while(valid(piece,0,1)){piece.y++;points(score+2);}lock();return true;}return false;};
    function draw(){ctx.fillStyle='#111c30';ctx.fillRect(0,0,300,540);ctx.strokeStyle='#ffffff09';for(let y=0;y<20;y++)for(let x=0;x<10;x++)ctx.strokeRect(ox+x*unit,y*unit,unit,unit);const tile=(x,y,id,ghost=false)=>{ctx.globalAlpha=ghost?.18:1;ctx.fillStyle=colors[id];ctx.fillRect(ox+x*unit+1,y*unit+1,unit-2,unit-2);if(!ghost){ctx.fillStyle='#ffffff45';ctx.fillRect(ox+x*unit+2,y*unit+2,unit-4,2);ctx.fillStyle='#00000018';ctx.fillRect(ox+x*unit+2,y*unit+unit-4,unit-4,2);}ctx.globalAlpha=1;};board.forEach((r,y)=>r.forEach((v,x)=>{if(v)tile(x,y,v);}));const ghost={...piece};while(valid(ghost,0,1))ghost.y++;piece.m.forEach((r,y)=>r.forEach((v,x)=>{if(v){tile(piece.x+x,ghost.y+y,piece.id,true);tile(piece.x+x,piece.y+y,piece.id);}}));}
    button('◀',()=>key('ArrowLeft'));button('旋转',()=>key('ArrowUp'));button('▶',()=>key('ArrowRight'));button('▼',()=>key('ArrowDown'));button('落下',()=>key(' '));spawn();draw();return {key,tick:dt=>{elapsed+=dt;if(elapsed>Math.max(100,800-Math.floor(lines/10)*65)){elapsed=0;drop();}},draw};
  };
  factories.snake=()=>{
    const {c,ctx}=canvas(420,420,true);let body=[[9,10],[8,10],[7,10]],dir=[1,0],queued=null,food,elapsed=0;
    const spawn=()=>{const free=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(!body.some(p=>p[0]===x&&p[1]===y))free.push([x,y]);food=free[Math.floor(Math.random()*free.length)];};
    const key=k=>{const d=direction(k);if(!d)return false;if(!queued&&(d[0]!==-dir[0]||d[1]!==-dir[1]))queued=d;return true;};
    function tick(dt){elapsed+=dt;if(elapsed<Math.max(65,170-(body.length-3)*4))return;elapsed=0;if(queued){dir=queued;queued=null;}const head=[body[0][0]+dir[0],body[0][1]+dir[1]],eat=head[0]===food[0]&&head[1]===food[1];const target=eat?body:body.slice(0,-1);if(head.some(v=>v<0||v>=20)||target.some(p=>p[0]===head[0]&&p[1]===head[1])){finish('游戏结束',`本局吃到 ${body.length-3} 个苹果`);return;}body.unshift(head);if(eat){points(score+100);if(body.length===400){finish('填满棋盘！');return;}spawn();}else body.pop();$('#status').textContent=`${body.length-3} 个苹果 · 每秒 ${Math.round(1000/Math.max(65,170-(body.length-3)*4))} 格`;}
    function draw(){
      ctx.fillStyle='#16332f';ctx.fillRect(0,0,420,420);
      for(let y=0;y<20;y++)for(let x=0;x<20;x++)if((x+y)%2===0){ctx.fillStyle='#ffffff03';ctx.fillRect(x*21,y*21,21,21);}
      if(food){
        const fx=food[0]*21+10.5,fy=food[1]*21+10.5;ctx.shadowColor='#e8b695';ctx.shadowBlur=12;
        ctx.fillStyle='#e0ac8a';ctx.beginPath();ctx.arc(fx,fy,6.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.strokeStyle='#9cb583';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx,fy-5);ctx.quadraticCurveTo(fx+2,fy-11,fx+6,fy-8);ctx.stroke();
      }
      body.forEach((p,i)=>{ctx.fillStyle=i===0?'#d5e9bd':i%2?'#83b49a':'#8fbea0';ctx.beginPath();ctx.roundRect(p[0]*21+1.5,p[1]*21+1.5,18,18,i===0?6:4);ctx.fill();});
      const [hx,hy]=body[0];ctx.fillStyle='#23483c';
      for(const side of [-1,1]){ctx.beginPath();ctx.arc(hx*21+10.5+dir[0]*4+dir[1]*side*4,hy*21+10.5+dir[1]*4+dir[0]*side*4,1.7,0,Math.PI*2);ctx.fill();}
    }
    for(const [s,k]of [['◀','ArrowLeft'],['▲','ArrowUp'],['▼','ArrowDown'],['▶','ArrowRight']])button(s,()=>key(k));swipe(c,key);spawn();$('#status').textContent='寻找你的第一个苹果';draw();return {key,tick,draw};
  };
  factories.breakout=()=>{
    const {c,ctx}=canvas(480,500,true);
    let paddle=240,ball,lives=3,wave=1,bricks=[],held=0,formation='',transition=1100;let trail=[];
    const resetBall=()=>{
      const speed=ArcadeWorld.breakoutSpeed(wave);trail=[];
      ball={x:paddle,y:437,vx:Math.sin(.55)*speed,vy:-Math.cos(.55)*speed};
    };
    const create=()=>{const level=ArcadeWorld.breakoutLayout(wave);bricks=level.bricks;formation=level.name;};
    const move=e=>{if(active()){const r=c.getBoundingClientRect();paddle=Math.max(43,Math.min(437,(e.clientX-r.left)*480/r.width));}};
    c.addEventListener('pointermove',move);c.addEventListener('pointerdown',move);
    function tick(dt){
      const step=dt/1000;
      trail.push({x:ball.x,y:ball.y});if(trail.length>10)trail.shift();
      paddle=Math.max(43,Math.min(437,paddle+held*360*step));
      $('#status').textContent=`第 ${wave} 关 · ${formation} · ${lives} 次生命`;
      if(transition>0){transition=Math.max(0,transition-dt);ball.x=paddle;return;}
      for(const b of bricks)b.flash=Math.max(0,(b.flash||0)-dt);
      const sub=Math.max(6,Math.ceil(Math.hypot(ball.vx,ball.vy)*step/4));
      for(let n=0;n<sub;n++){
        const prevX=ball.x,prevY=ball.y;
        ball.x+=ball.vx*step/sub;ball.y+=ball.vy*step/sub;
        if(ball.x<7||ball.x>473){ball.x=Math.max(7,Math.min(473,ball.x));ball.vx*=-1;}
        if(ball.y<7){ball.y=7;ball.vy=Math.abs(ball.vy);}
        if(ball.vy>0&&prevY<=453&&ball.y>=453&&Math.abs(ball.x-paddle)<49){
          ball.y=452;
          const angle=(ball.x-paddle)/49*1.05,speed=ArcadeWorld.breakoutSpeed(wave);
          ball.vx=Math.sin(angle)*speed;ball.vy=-Math.cos(angle)*speed;
        }
        for(const b of bricks){
          if(!b.alive||ball.x+6<b.x||ball.x-6>b.x+b.w||ball.y+6<b.y||ball.y-6>b.y+b.h)continue;
          b.hp--;b.flash=140;
          if(b.hp===0){b.alive=false;points(score+100*wave*b.maxHp);}
          if(prevY+6<=b.y){ball.y=b.y-6.1;ball.vy=-Math.abs(ball.vy);}
          else if(prevY-6>=b.y+b.h){ball.y=b.y+b.h+6.1;ball.vy=Math.abs(ball.vy);}
          else if(prevX+6<=b.x){ball.x=b.x-6.1;ball.vx=-Math.abs(ball.vx);}
          else{ball.x=b.x+b.w+6.1;ball.vx=Math.abs(ball.vx);}
          break;
        }
        if(ball.y>510){
          lives--;if(!lives){finish('光芒暂歇',`抵达第 ${wave} 关 · ${formation}`);return;}
          resetBall();transition=850;break;
        }
        if(bricks.every(b=>!b.alive)){
          points(score+500*wave);wave++;create();resetBall();transition=1600;break;
        }
      }
    }
    function draw(){
      ctx.fillStyle='#111526';ctx.fillRect(0,0,480,500);
      for(let i=0;i<40;i++){ctx.fillStyle=i%3?'#8996c21c':'#b9a6d32b';ctx.fillRect((i*73+17)%478,(i*131+67)%460,1,1);}
      trail.forEach((p,i)=>{ctx.fillStyle=`rgba(200,185,240,${i/trail.length*.25})`;ctx.beginPath();ctx.arc(p.x,p.y,1+i/trail.length*3,0,Math.PI*2);ctx.fill();});
      const colors=['#e99bc4','#b29aef','#7baef3','#6ed0c9','#d9ce8b'];
      for(const b of bricks){
        if(!b.alive)continue;
        ctx.shadowBlur=b.hp>1?14:7;ctx.shadowColor=ctx.fillStyle=b.flash?'#fff':colors[b.row%colors.length];
        ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,3);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffff35';ctx.fillRect(b.x+3,b.y+2,b.w-6,1);
        // Visible armor pips distinguish durable bricks without relying on color.
        if(b.hp>1){ctx.fillStyle='#162037b0';for(let i=0;i<b.hp;i++)ctx.fillRect(b.x+b.w/2-(b.hp*6-2)/2+i*6,b.y+7,4,4);}
      }
      ctx.shadowBlur=14;ctx.shadowColor=ctx.fillStyle='#a2daf1';ctx.fillRect(paddle-43,460,86,9);
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(transition>0){
        ctx.fillStyle='#111526ba';ctx.fillRect(0,270,480,102);
        ctx.textAlign='center';ctx.fillStyle='#f0e9ff';ctx.font='600 24px system-ui';ctx.fillText(`第 ${wave} 关 · ${formation}`,240,312);
        ctx.fillStyle='#a9b6cf';ctx.font='14px system-ui';ctx.fillText(wave>=3?'留意装甲砖，调整击球角度':'寻找缺口，让小球穿入砖阵',240,343);
      }
    }
    button('左移',()=>paddle=Math.max(43,paddle-35));button('右移',()=>paddle=Math.min(437,paddle+35));
    create();resetBall();$('#status').textContent=`第 1 关 · ${formation} · 3 次生命`;draw();
    return {tick,draw,key:k=>{if(k==='ArrowLeft'||k==='a'){held=-1;return true;}if(k==='ArrowRight'||k==='d'){held=1;return true;}return false;},keyup:k=>{if(['ArrowLeft','ArrowRight','a','d'].includes(k))held=0;},release:()=>held=0};
  };
  factories.mines=()=>{
    let mines=new Set(),revealed=new Set(),flags=new Set(),initialized=false,flagMode=false;const around=id=>{const out=[],x=id%12,y=Math.floor(id/12);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if((dx||dy)&&xx>=0&&xx<12&&yy>=0&&yy<12)out.push(yy*12+xx);}return out;};
    const {cells}=grid('mines',144,id=>flagMode?flag(id):reveal(id));
    const count=id=>around(id).filter(i=>mines.has(i)).length;
    function render(){cells.forEach((c,i)=>{const shown=revealed.has(i);c.classList.toggle('revealed',shown);c.textContent=flags.has(i)?'⚑':shown?(count(i)||''):'';c.dataset.count=count(i);c.setAttribute('aria-label',`第 ${i+1} 格：${flags.has(i)?'已插旗':shown?'周围有 '+count(i)+' 颗雷':'未翻开'}`);});$('#status').textContent=`剩余 ${22-flags.size} 面旗 · 已排查 ${revealed.size} / 122 格`;}
    function flag(id){if(revealed.has(id))return;if(flags.has(id))flags.delete(id);else if(flags.size<22)flags.add(id);render();}
    function reveal(id){if(flags.has(id)||revealed.has(id))return;if(!initialized){const safe=new Set([id,...around(id)]);mines=new Set(shuffle(Array.from({length:144},(_,i)=>i).filter(i=>!safe.has(i))).slice(0,22));initialized=true;roundTime=0;}
      if(mines.has(id)){points(0);render();for(const i of mines){cells[i].textContent='✳';cells[i].classList.add('exploded');}finish('踩到地雷了',`已翻开 ${revealed.size} 个安全格`);return;}
      const queue=[id];while(queue.length){const i=queue.pop();if(revealed.has(i)||flags.has(i)||mines.has(i))continue;revealed.add(i);if(!count(i))queue.push(...around(i));}render();if(revealed.size===122){points(Math.max(100,10000-Math.floor(roundTime/1000)*10));finish('排雷成功！',`用时 ${Math.floor(roundTime/1000)} 秒 · 排查全部 122 个安全格`);}
    }
    cells.forEach((c,i)=>c.addEventListener('contextmenu',e=>{e.preventDefault();if(active())flag(i);}));const mode=button('插旗模式：关',()=>{flagMode=!flagMode;mode.textContent='插旗模式：'+(flagMode?'开':'关');mode.classList.toggle('selected-mode',flagMode);mode.setAttribute('aria-pressed',flagMode);});render();return {};
  };
  Object.assign(factories,Arcade3D({canvas,button,points,finish,active,status:text=>$('#status').textContent=text}));
  Object.assign(factories,ArcadeCity({canvas,button,points,finish,active,status:text=>$('#status').textContent=text}));
  function loop(now){const dt=Math.min(50,Math.max(0,now-lastTime));lastTime=now;if(active()){roundTime+=dt;engine?.tick?.(dt);}if(active())engine?.draw?.();requestAnimationFrame(loop);}
  start();requestAnimationFrame(loop);
})();
