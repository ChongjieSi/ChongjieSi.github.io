/* Shared online leaderboard, with an explicitly labelled local fallback. */
window.ArcadeLeaderboard=(()=>{
  const configured=window.ARCADE_LEADERBOARD_CONFIG?.apiBase||'';
  let base='';try{const url=new URL(configured);if(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))base=url.href.replace(/\/$/,'');}catch{}
  const cache=new Map(),pending=new Map(),localSaved=new Set();let player=null,revision=0;
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');}
  function identity(){if(player)return player;try{const saved=localStorage.getItem('chongjie-arcade-player-v1');if(/^[0-9a-f-]{36}$/i.test(saved))player=saved;}catch{}if(!player){player=uuid();try{localStorage.setItem('chongjie-arcade-player-v1',player);}catch{}}return player;}
  async function request(path,options={}){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(base+path,{...options,signal:controller.signal,credentials:'omit',cache:'no-store'});let data;try{data=await response.json();}catch{throw new Error('排行榜响应异常');}if(!response.ok)throw new Error(data.error||'排行榜暂时不可用');return data;}finally{clearTimeout(timeout);}
  }
  async function scores(game,{force=false}={}){
    if(!base)return {mode:'local',rows:Arcade.scores(game)};
    const stored=cache.get(game);if(!force&&stored&&Date.now()-stored.time<10000)return stored.result;
    if(!force&&pending.has(game))return pending.get(game);
    const version=revision,task=(async()=>{
      try{const data=await request('/leaderboard?game='+encodeURIComponent(game)+(force?'&fresh=1':''));if(!Array.isArray(data.rows))throw new Error('排行榜响应异常');const rows=data.rows.filter(r=>typeof r.name==='string'&&Number.isSafeInteger(r.score)&&r.score>=0).slice(0,10),result={mode:'online',rows,updatedAt:data.updatedAt};if(version===revision)cache.set(game,{time:Date.now(),result});return result;}
      catch(error){return stored?{...stored.result,mode:'cached',error:error.message}:{mode:'offline',rows:Arcade.scores(game),error:error.message};}
    })();pending.set(game,task);try{return await task;}finally{if(pending.get(game)===task)pending.delete(game);}
  }
  async function submit(game,name,score,submissionId,details={}){
    let saved=localSaved.has(submissionId);if(!saved)try{Arcade.submit(game,name,score,details);localSaved.add(submissionId);saved=true;}catch{}
    if(!base)return {mode:'local',saved};
    try{const data=await request('/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,name,score,submissionId,playerId:identity(),...(game==='2048'&&Number.isInteger(details.maxTile)?{maxTile:details.maxTile}:{})})});if(data.saved!==true||!Number.isSafeInteger(data.bestScore))throw new Error('排行榜响应异常');revision++;cache.delete(game);return {mode:'online',saved:true,localSaved:saved,bestScore:data.bestScore};}
    catch(error){return {mode:'offline',saved:false,localSaved:saved,error:error.name==='AbortError'?'连接超时，请重试':error.message};}
  }
  if(base)for(const game of Arcade.games)game.controls=game.controls.replace('提交本机排行榜','提交联机排行榜');
  return {online:!!base,scores,submit,newSubmissionId:uuid};
})();
