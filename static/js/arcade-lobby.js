(() => {
  const {games,categoryNames,scores}=Arcade;
  const list=document.querySelector('[data-arcade-library]');
  if(!list)return;
  let selected=games[0]; let filter='ALL',rankingRequest=0;
  const leaderboard=window.ArcadeLeaderboard;
  const mobile=window.matchMedia('(max-width:540px), (max-width:900px) and (pointer:coarse)');
  const picker=document.querySelector('[data-ranking-game]');
  if(picker){for(const game of games){const option=document.createElement('option');option.value=game.id;option.textContent=game.name;picker.append(option);}picker.onchange=()=>{const game=games.find(g=>g.id===picker.value);if(game)showDetail(game);};}
  function setView(view){document.querySelector('.arcade-lobby').dataset.mobileView=view;document.querySelectorAll('[data-arcade-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.arcadeView===view)));if(view==='rankings')refreshRankings();}
  function showRankings(game){showDetail(game);setView('rankings');if(mobile.matches)picker?.focus({preventScroll:true});}
  document.querySelectorAll('[data-arcade-view]').forEach(b=>b.onclick=()=>setView(b.dataset.arcadeView));
  function art(host,game){
    host.replaceChildren();const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 160 100');svg.setAttribute('aria-hidden','true');
    const use=document.createElementNS(ns,'use');use.setAttribute('href',`/games/covers.svg#${game.id}`);svg.append(use);host.append(svg);
  }
  const launch=id=>{
    const win=document.getElementById(`window-arcade-${id}`);
    const frame=win.querySelector('iframe');
    if(!frame.src)frame.src=`/games/index.html?game=${id}&v=37`;
    document.querySelector(`[data-open="arcade-${id}"]`).click();
    frame.focus();
  };
  function showDetail(game){
    selected=game;
    if(picker)picker.value=game.id;
    list.querySelectorAll('[data-select-game]').forEach(b=>b.classList.toggle('selected',b.dataset.selectGame===game.id));
    const detail=document.querySelector('[data-arcade-detail]');
    detail.style.setProperty('--game-accent',game.color);
    art(detail.querySelector('[data-detail-symbol]'),game);
    detail.querySelector('[data-detail-tag]').textContent=categoryNames[game.tag];
    detail.querySelector('h3').textContent=game.name;
    detail.querySelector('[data-detail-desc]').textContent=game.description;
    detail.querySelector('[data-detail-rule]').textContent=game.rule;
    detail.querySelector('[data-launch-selected]').onclick=()=>launch(game.id);
    refreshRankings();
  }
  async function refreshRankings(force=false){
    const game=selected,request=++rankingRequest,ranking=document.querySelector('[data-rankings]'),source=document.querySelector('[data-ranking-source]'),status=document.querySelector('[data-ranking-status]');
    if(ranking.dataset.game!==game.id){ranking.replaceChildren();ranking.dataset.game=game.id;}
    ranking.setAttribute('aria-busy','true');
    const result=leaderboard?await leaderboard.scores(game.id,{force}):{mode:'local',rows:scores(game.id)};
    if(request!==rankingRequest||selected.id!==game.id)return;
    ranking.setAttribute('aria-busy','false');ranking.replaceChildren();
    if(source)source.textContent=result.mode==='online'?'联机前十':result.mode==='cached'?'云端缓存':'本机前十';
    if(status){status.hidden=!['offline','cached'].includes(result.mode);status.textContent=result.mode==='cached'?'暂时无法刷新，显示最近的云端记录':result.mode==='offline'?'联机暂不可用，当前显示本机记录':'';}
    if(!result.rows.length){const p=document.createElement('p');p.className='arcade-empty';p.textContent=result.mode==='online'?'暂无联机纪录，来拿下第一名':'暂无纪录';ranking.append(p);}
    result.rows.forEach((row,i)=>{const li=document.createElement('li'),rank=document.createElement('span'),name=document.createElement('b'),points=document.createElement('strong');rank.textContent=String(i+1).padStart(2,'0');name.textContent=row.name;if(game.id==='2048'&&Number.isInteger(row.maxTile)){const tile=document.createElement('small');tile.className='arcade-rank-tile';tile.textContent='最大 '+row.maxTile;name.append(tile);}points.textContent=row.score.toLocaleString();li.append(rank,name,points);ranking.append(li);});
  }
  function render(){
    list.replaceChildren();
    games.filter(g=>filter==='ALL'||g.tag===filter).forEach(game=>{
      const card=document.createElement('article');card.className='arcade-project';card.style.setProperty('--game-accent',game.color);
      card.innerHTML='<button class="arcade-card-main" data-select-game><span class="arcade-project-art"></span><span class="arcade-project-copy"><b></b><small></small></span><span class="arcade-project-play" aria-hidden="true">开始</span></button>';
      const select=card.querySelector('[data-select-game]');select.dataset.selectGame=game.id;
      art(card.querySelector('.arcade-project-art'),game);
      card.querySelector('small').textContent=categoryNames[game.tag];card.querySelector('b').textContent=game.name;
      select.addEventListener('click',()=>{showDetail(game);launch(game.id);});
      select.addEventListener('focus',()=>showDetail(game));
      card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||!mobile.matches)showDetail(game);});
      const rankingButton=document.createElement('button');rankingButton.type='button';rankingButton.className='arcade-card-ranking';rankingButton.textContent='查看排行';rankingButton.setAttribute('aria-label',`查看${game.name}排行榜`);rankingButton.onclick=()=>showRankings(game);card.append(rankingButton);
      select.setAttribute('aria-label',`开始${game.name}`);
      list.append(card);
    });showDetail(selected);
  }
  document.querySelectorAll('[data-arcade-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.arcadeFilter;document.querySelectorAll('[data-arcade-filter]').forEach(b=>b.classList.toggle('selected',b===button));render();});
  window.addEventListener('storage',event=>{if(event.key===Arcade.key)refreshRankings();});
  window.addEventListener('message',event=>{
    const frame=[...document.querySelectorAll('.arcade-frame')].find(f=>f.contentWindow===event.source);
    if(!frame||event.origin!==location.origin)return;
    if(event.data?.type==='arcade-rankings'){const game=games.find(g=>g.id===frame.dataset.gameId);if(game){showRankings(game);document.querySelector('[data-open="games"]').click();}return;}
    if(event.data?.type==='arcade-focus')frame.closest('.window').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    if(event.data?.type==='arcade-score')refreshRankings(true);
    if(event.data?.type==='arcade-maximize'){const win=frame.closest('.window');if(!win.classList.contains('is-maximized'))win.querySelector('[data-window-action="maximize"]').click();}
  });
  // A game only advances while its own OS window is visible and in front.
  setInterval(()=>document.querySelectorAll('.arcade-frame').forEach(frame=>{
    const win=frame.closest('.window');
    frame.contentWindow?.postMessage({type:'arcade-active',active:!document.hidden&&win.classList.contains('active')&&win.classList.contains('is-open')&&!win.classList.contains('is-minimized')&&!win.classList.contains('is-closing')&&!win.classList.contains('is-minimizing')&&document.getElementById('lockScreen')?.classList.contains('is-hidden')},location.origin);
  }),200);
  const lobby=document.getElementById('window-games');
  const visible=()=>!document.hidden&&lobby?.classList.contains('is-open')&&!lobby.classList.contains('is-minimized')&&lobby.classList.contains('active');
  setInterval(()=>{if(leaderboard?.online&&visible())refreshRankings();},20000);
  if(lobby&&window.MutationObserver)new MutationObserver(()=>{if(visible())refreshRankings();}).observe(lobby,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(visible())refreshRankings();});
  render();
})();
