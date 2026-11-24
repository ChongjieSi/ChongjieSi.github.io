/* Render interpolation and a horizon-stable camera, independent of frame rate. */
window.ArcadeCityMotion=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),damp=(a,b,rate,dt)=>a+(b-a)*(-Math.expm1(-rate*dt));
  const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
  const space=w=>w.interior?.id||w.onTower||'outside';
  function capture(w){
    const previous=w.renderPrevious||(w.renderPrevious={player:{},cars:new Map(),actors:new Map()});
    Object.assign(previous.player,w.player,{elevation:w.elevation,cameraYaw:w.cameraYaw});previous.space=space(w);previous.vehicle=w.vehicle;
    for(const car of [...w.cars,...w.traffic]){let p=previous.cars.get(car);if(!p){p={};previous.cars.set(car,p);}Object.assign(p,{x:car.x,z:car.z,yaw:car.yaw,elevation:car.elevation||0});}
    previous.actors??=new Map();for(const actor of [...(w.pedestrians||[]),...(w.animals||[])]){let p=previous.actors.get(actor);if(!p){p={};previous.actors.set(actor,p);}Object.assign(p,{x:actor.x,z:actor.z,yaw:actor.yaw||0,elevation:actor.y||0});}
  }
  function pose(w,body,isPlayer=false,out={}){
    const previous=w.renderPrevious,old=isPlayer?previous?.player:previous?.cars.get(body)||previous?.actors?.get(body);
    const t=old&&previous.space===space(w)&&previous.vehicle===w.vehicle&&Math.hypot(body.x-old.x,body.z-old.z)<20?clamp(w.renderAlpha??1,0,1):1;
    const from=old||body;out.x=from.x+(body.x-from.x)*t;out.z=from.z+(body.z-from.z)*t;out.yaw=angle(from.yaw||0,body.yaw||0,t);
    const elevation=isPlayer?w.elevation:(body.elevation??body.y);out.elevation=(from.elevation||0)+((elevation||0)-(from.elevation||0))*t;
    if(isPlayer)out.cameraYaw=angle(from.cameraYaw??w.cameraYaw,w.cameraYaw,t);return out;
  }
  function rig(){return {ready:false,offset:{x:0,y:0,z:0},focus:{x:0,y:0,z:0},ratio:1,hold:0,space:null};}
  function camera(r,config,dt,probe=()=>1){
    dt=clamp(dt,0,.1);
    const reset=!r.ready||r.space!==config.space||Math.hypot(config.x-r.focus.x,config.z-r.focus.z)>24;
    const back=Math.cos(Math.max(0,config.pitch))*config.distance,desired={x:-Math.sin(config.yaw)*back,y:2+Math.sin(Math.max(0,config.pitch))*config.distance,z:Math.cos(config.yaw)*back};
    for(const axis of ['x','y','z'])r.offset[axis]=reset?desired[axis]:damp(r.offset[axis],desired[axis],9,dt);
    Object.assign(r.focus,{x:config.x,y:config.y,z:config.z});r.space=config.space;r.ready=true;
    const raise=Math.max(0,-config.pitch)*config.distance*2.4;r.lookUp=reset?raise:damp(r.lookUp||0,raise,9,dt);
    const target={x:config.x,y:config.y+1.2+r.lookUp,z:config.z},full={x:config.x+r.offset.x,y:config.y+r.offset.y,z:config.z+r.offset.z};
    const allowed=clamp(probe(target,full),.02,1);
    if(reset){r.ratio=allowed;r.hold=0;}
    else if(allowed<r.ratio){if(r.ratio-allowed>.015)r.hold=.28;r.ratio=allowed;}
    else{r.hold=Math.max(0,r.hold-dt);if(!r.hold)r.ratio=damp(r.ratio,allowed,2.4,dt);}
    return {target,eye:{x:target.x+(full.x-target.x)*r.ratio,y:target.y+(full.y-target.y)*r.ratio,z:target.z+(full.z-target.z)*r.ratio},reset};
  }
  return {capture,pose,rig,camera,damp,angle};
})();
