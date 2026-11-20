/* Shared, dependency-free 3D geometry and procedural level layouts. */
window.ArcadeWorld = (() => {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // A pinhole camera: geometry is kept in world coordinates until projection.
  function camera({ eye, target, width = 480, height = 520, focal = 520 }) {
    const normalize = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };
    const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    const forward = normalize(target.map((v, i) => v - eye[i]));
    const right = normalize(cross([0, 1, 0], forward));
    const up = cross(forward, right);
    const dot = (a, b) => a.reduce((sum, v, i) => sum + v*b[i], 0);
    return p => {
      const v = p.map((n, i) => n - eye[i]);
      const depth = dot(v, forward);
      if (depth < 0.15) return null;
      return { x: width/2 + dot(v, right)*focal/depth, y: height/2 - dot(v, up)*focal/depth, depth };
    };
  }

  function cuboid({ x, y, z, w, h, d, hue = 210, alpha = 1 }) {
    const vertices = [
      [x-w/2,y-h/2,z-d/2], [x+w/2,y-h/2,z-d/2],
      [x+w/2,y+h/2,z-d/2], [x-w/2,y+h/2,z-d/2],
      [x-w/2,y-h/2,z+d/2], [x+w/2,y-h/2,z+d/2],
      [x+w/2,y+h/2,z+d/2], [x-w/2,y+h/2,z+d/2]
    ];
    return [[0,1,2,3,49],[4,7,6,5,40],[0,4,5,1,32],[3,2,6,7,72],[1,5,6,2,55],[0,3,7,4,44]].map(face => ({
      vertices: face.slice(0,4).map(i => vertices[i]),
      fill: `hsla(${hue}, 65%, ${face[4]}%, ${alpha})`, stroke: `hsla(${hue}, 80%, 90%, ${alpha*0.18})`
    }));
  }

  function render(ctx, faces, project) {
    const visible = faces.map(face => {
      const pts = face.vertices.map(project);
      if (pts.some(p => !p)) return null;
      return { ...face, pts, depth: pts.reduce((sum,p) => sum+p.depth,0)/pts.length };
    }).filter(Boolean).sort((a,b) => b.depth-a.depth);
    for (const face of visible) {
      ctx.beginPath(); ctx.moveTo(face.pts[0].x,face.pts[0].y);
      for (const p of face.pts.slice(1)) ctx.lineTo(p.x,p.y);
      ctx.closePath(); ctx.fillStyle=face.fill; ctx.fill();
      ctx.strokeStyle=face.stroke; ctx.lineWidth=1; ctx.stroke();
    }
  }

  function overlap(centerA, sizeA, centerB, sizeB) {
    const lo=Math.max(centerA-sizeA/2,centerB-sizeB/2);
    const hi=Math.min(centerA+sizeA/2,centerB+sizeB/2);
    return { size: Math.max(0,hi-lo), center:(lo+hi)/2 };
  }

  const formations = ['星环迷阵', '菱形', '棋盘', '拱门', '双螺旋', '堡垒'];
  function breakoutLayout(wave) {
    const shape=(wave-1)%formations.length, cycle=Math.floor((wave-1)/formations.length);
    const rows=shape===0?9:8, cols=10, bricks=[];
    for(let r=0;r<rows;r++) for(let col=0;col<cols;col++) {
      const dx=Math.abs(col-4.5), dy=Math.abs(r-3.5);
      const ring=Math.hypot(dx/4.8,(r-4)/4.2);
      const occupied = (shape===0&&((ring>.55&&ring<1.13&&!(r===8&&dx<1))||(r===4&&(col===4||col===5))||(cycle>0&&r===1&&dx<1))) || (shape===1 && dx/4.8+dy/4.2<1.2)
        || (shape===2 && (r+col)%2===0)
        || (shape===3 && (r<2 || col<2 || col>7 || (r===4 && col>3 && col<6)))
        || (shape===4 && (Math.abs(col-(2+Math.sin(r*.85)*1.7))<1.25 || Math.abs(col-(7-Math.sin(r*.85)*1.7))<1.25))
        || (shape===5 && (r===0 || r===7 || col===0 || col===9 || (r>2&&r<5&&col>2&&col<7)));
      if(!occupied) continue;
      const hp=wave<3?1:Math.min(3,1+((r+col+cycle)%4===0?1:0)+(cycle>0&&r%3===0?1:0));
      bricks.push({x:16+col*45+(shape===0?r%2*1.5:0),y:42+r*25+(shape===0?col%2*4:0),w:42,h:18,hp,maxHp:hp,alive:true,row:r});
    }
    return {name:formations[shape],bricks};
  }
  // One speed for launch, paddle rebounds and life resets at a given level.
  // Linear progression keeps every later level faster without exponential jumps.
  function breakoutSpeed(wave){return 300+52*(Math.max(1,Math.floor(wave))-1);}
  function flightCamera(ship,distance){
    return camera({eye:[ship.x,ship.y+1.8,distance-8],target:[ship.x,ship.y+.2,distance+42],width:840,height:520,focal:540});
  }
  return {clamp,camera,cuboid,render,overlap,breakoutLayout,breakoutSpeed,flightCamera};
})();
