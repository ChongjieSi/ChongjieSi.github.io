const GAMES = new Set(['2048','gomoku','memory','tetris','snake','breakout','mines','stack3d','flight3d','city3d','ski3d']);
const MAX_SCORE = {gomoku:5500, memory:6000, mines:10000};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (value,status=200,extra={}) => Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const fail = (message,status) => json({error:message},status);
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');

async function body(request){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw new Error('type');
  if(Number(request.headers.get('Content-Length'))>2048)throw new Error('size');
  const reader=request.body?.getReader();if(!reader)throw new Error('json');
  let size=0,chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw new Error('size');}chunks.push(value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
}
function cors(response,origin){
  const headers=new Headers(response.headers);headers.set('Vary','Origin');
  if(origin)headers.set('Access-Control-Allow-Origin',origin);
  return new Response(response.body,{status:response.status,headers});
}
const cacheKey=(url,game)=>new Request(new URL('/leaderboard?game='+encodeURIComponent(game),url));

async function handle(request,env,ctx){
  const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=new Set((env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean));
  if(origin&&!allowed.has(origin))return fail('此来源不允许访问排行榜',403);
  const respond=response=>cors(response,origin&&allowed.has(origin)?origin:null);
  if(request.method==='OPTIONS')return respond(new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}}));
  if(url.pathname==='/health'&&request.method==='GET')return respond(json({ok:true}));
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  if(url.pathname==='/leaderboard'&&request.method==='GET'){
    const game=url.searchParams.get('game');if(!GAMES.has(game))return respond(fail('游戏不存在',400));
    if(!env.READ_LIMITER||!(await env.READ_LIMITER.limit({key:ip})).success)return respond(json({error:'刷新过于频繁，请稍后再试'},429,{'Retry-After':'60'}));
    const key=cacheKey(url,game),cached=url.searchParams.get('fresh')==='1'?null:await caches.default.match(key);if(cached)return respond(cached);
    const result=await env.DB.prepare('SELECT name, score, created_at AS date, max_tile AS maxTile FROM scores WHERE game = ? ORDER BY score DESC, created_at ASC, player_hash ASC LIMIT 10').bind(game).all();
    const rows=result.results.map(({maxTile,...row})=>maxTile==null?row:{...row,maxTile});
    const response=json({game,rows,updatedAt:Date.now()},200,{'Cache-Control':'public, max-age=5'});
    ctx.waitUntil(caches.default.put(key,response.clone()).catch(()=>{}));return respond(response);
  }
  if(url.pathname==='/scores'&&request.method==='POST'){
    if(!origin)return respond(fail('提交成绩需要网站来源',403));
    let input;try{input=await body(request);}catch(error){return respond(fail(error.message==='size'?'提交内容过长':'请提交 JSON 格式的成绩',error.message==='size'?413:400));}
    if(!input||typeof input!=='object'||Array.isArray(input))return respond(fail('成绩格式不正确',400));
    const {game,score,playerId,submissionId}=input,name=typeof input.name==='string'?input.name.trim().normalize('NFKC'):'';
    const maxTile=input.maxTile??null;
    if(!GAMES.has(game)||!Number.isSafeInteger(score)||score<0||score>(MAX_SCORE[game]||1000000000))return respond(fail('游戏或分数不正确',400));
    if(!name||[...name].length>20||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(name))return respond(fail('昵称需为 1–20 个字符',400));
    if(!UUID.test(playerId)||!UUID.test(submissionId))return respond(fail('提交标识不正确，请刷新后再试',400));
    if(maxTile!==null&&(game!=='2048'||!Number.isInteger(maxTile)||maxTile<2||maxTile>1073741824||(maxTile&(maxTile-1))!==0))return respond(fail('最大方块不正确',400));
    // No IP address is stored in D1. The browser's random identifier stays private.
    const player=await hash(playerId.toLowerCase()),digest=await hash(JSON.stringify(maxTile===null?[player,game,name,score]:[player,game,name,score,maxTile])),id=submissionId.toLowerCase();
    const previous=await env.DB.prepare('SELECT player_hash, digest FROM submissions WHERE id = ?').bind(id).first();
    if(previous&&(previous.player_hash!==player||previous.digest!==digest))return respond(fail('这局成绩已提交，请勿修改后重复提交',409));
    if(!previous){
      if(!env.WRITE_LIMITER||!(await env.WRITE_LIMITER.limit({key:ip})).success)return respond(json({error:'提交过于频繁，请稍后重试'},429,{'Retry-After':'60'}));
      const now=Date.now();
      const results=await env.DB.batch([
        env.DB.prepare('INSERT INTO submissions(id, player_hash, digest, game, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(id,player,digest,game,now),
        env.DB.prepare(`INSERT INTO scores(game, player_hash, name, score, created_at, max_tile)
          SELECT ?, ?, ?, ?, ?, ? FROM submissions WHERE id = ? AND player_hash = ? AND digest = ?
          ON CONFLICT(game, player_hash) DO UPDATE SET name = excluded.name, score = excluded.score, created_at = excluded.created_at, max_tile = excluded.max_tile WHERE excluded.score > scores.score`).bind(game,player,name,score,now,maxTile,id,player,digest),
        env.DB.prepare('SELECT player_hash, digest FROM submissions WHERE id = ?').bind(id)
      ]);
      const accepted=results[2].results[0];if(accepted?.player_hash!==player||accepted?.digest!==digest)return respond(fail('这局成绩已提交，请勿修改后重复提交',409));
    }
    const best=await env.DB.prepare('SELECT name, score, created_at AS date FROM scores WHERE game = ? AND player_hash = ?').bind(game,player).first();
    await caches.default.delete(cacheKey(url,game)).catch(()=>false);
    // Idempotency receipts expire; the best-score table remains bounded per player/game.
    ctx.waitUntil(env.DB.prepare('DELETE FROM submissions WHERE created_at < ?').bind(Date.now()-7*86400000).run().catch(()=>{}));
    return respond(json({saved:true,game,bestScore:best.score,name:best.name,date:best.date}));
  }
  return respond(fail('接口不存在',404));
}
export default {
  async fetch(request,env,ctx){
    try{return await handle(request,env,ctx);}catch{
      const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
      return cors(fail('排行榜暂时不可用，请稍后重试',503),allowed.includes(origin)?origin:null);
    }
  }
};
