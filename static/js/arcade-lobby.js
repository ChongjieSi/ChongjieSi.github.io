(() => {
  const {games,categoryNames,scores}=Arcade;
  const list=document.querySelector('[data-arcade-library]');
  if(!list)return;
  let selected=games[0]; let filter='ALL';
  function art(host,game){
    host.replaceChildren();const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 160 100');svg.setAttribute('aria-hidden','true');
    const use=document.createElementNS(ns,'use');use.setAttribute('href',`/games/covers.svg#${game.id}`);svg.append(use);host.append(svg);
  }
  const launch=id=>{
    const win=document.getElementById(`window-arcade-${id}`);
    const frame=win.querySelector('iframe');
    if(!frame.src)frame.src=`/games/index.html?game=${id}&v=16`;
    document.querySelector(`[data-open="arcade-${id}"]`).click();
    frame.focus();
  };
  function showDetail(game){
    selected=game;
    list.querySelectorAll('[data-select-game]').forEach(b=>b.classList.toggle('selected',b.dataset.selectGame===game.id));
    const detail=document.querySelector('[data-arcade-detail]');
    detail.style.setProperty('--game-accent',game.color);
    art(detail.querySelector('[data-detail-symbol]'),game);
    detail.querySelector('[data-detail-tag]').textContent=categoryNames[game.tag];
    detail.querySelector('h3').textContent=game.name;
    detail.querySelector('[data-detail-desc]').textContent=game.description;
    detail.querySelector('[data-detail-rule]').textContent=game.rule;
    detail.querySelector('[data-launch-selected]').onclick=()=>launch(game.id);
    const ranking=detail.querySelector('[data-rankings]'); ranking.replaceChildren();
    const rows=scores(game.id);
    if(!rows.length){const p=document.createElement('p');p.className='arcade-empty';p.textContent='暂无纪录';ranking.append(p);}
    rows.forEach((row,i)=>{const li=document.createElement('li');const rank=document.createElement('span');rank.textContent=String(i+1).padStart(2,'0');const name=document.createElement('b');name.textContent=row.name;const points=document.createElement('strong');points.textContent=row.score.toLocaleString();li.append(rank,name,points);ranking.append(li);});
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
      card.addEventListener('pointerenter',()=>showDetail(game));
      select.setAttribute('aria-label',`开始${game.name}`);
      list.append(card);
    });showDetail(selected);
  }
  document.querySelectorAll('[data-arcade-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.arcadeFilter;document.querySelectorAll('[data-arcade-filter]').forEach(b=>b.classList.toggle('selected',b===button));render();});
  window.addEventListener('storage',event=>{if(event.key===Arcade.key)showDetail(selected);});
  window.addEventListener('message',event=>{
    const frame=[...document.querySelectorAll('.arcade-frame')].find(f=>f.contentWindow===event.source);
    if(!frame||event.origin!==location.origin)return;
    if(event.data?.type==='arcade-focus')frame.closest('.window').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    if(event.data?.type==='arcade-score')showDetail(selected);
    if(event.data?.type==='arcade-maximize'){const win=frame.closest('.window');if(!win.classList.contains('is-maximized'))win.querySelector('[data-window-action="maximize"]').click();}
  });
  // A game only advances while its own OS window is visible and in front.
  setInterval(()=>document.querySelectorAll('.arcade-frame').forEach(frame=>{
    const win=frame.closest('.window');
    frame.contentWindow?.postMessage({type:'arcade-active',active:!document.hidden&&win.classList.contains('active')&&win.classList.contains('is-open')&&!win.classList.contains('is-minimized')&&!win.classList.contains('is-closing')&&!win.classList.contains('is-minimizing')&&document.getElementById('lockScreen')?.classList.contains('is-hidden')},location.origin);
  }),200);
  render();
})();
