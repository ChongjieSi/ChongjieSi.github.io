"""Download real Terrarium DEM tiles; build an offline, georeferenced heightfield.
Requires pillow and numpy. No API key. See ski-data/provenance.json.
"""
import math,json,io,hashlib,urllib.request,concurrent.futures
from pathlib import Path
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'static/games/ski-data';OUT.mkdir(exist_ok=True)
WEST,EAST,SOUTH,NORTH=6.79,6.97,45.80,45.94
ZOOM=13;N=769;S=2**ZOOM
fx=lambda lon:(lon+180)/360*S
fy=lambda lat:(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*S
x0,x1=math.floor(fx(WEST)),math.floor(fx(EAST));y0,y1=math.floor(fy(NORTH)),math.floor(fy(SOUTH))
cache=Path('/tmp/montblanc-tiles');cache.mkdir(exist_ok=True)
def tile(pair):
 x,y=pair;url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png';p=cache/f'{ZOOM}-{x}-{y}.png'
 if not p.exists():
  with urllib.request.urlopen(url,timeout=45) as r:p.write_bytes(r.read())
 rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)
 return x,y,rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768,url,hashlib.sha256(p.read_bytes()).hexdigest()
canvas=np.zeros(((y1-y0+1)*256,(x1-x0+1)*256),dtype=np.float32);sources=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for x,y,h,url,digest in pool.map(tile,[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]):
  canvas[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=h;sources.append({'url':url,'sha256':digest});print('tile',x,y,flush=True)
heights=np.empty((N,N),dtype=np.float32)
for j,lat in enumerate(np.linspace(NORTH,SOUTH,N)):
 yy=fy(lat)*256-y0*256-.5;iy=int(yy);ty=yy-iy
 for i,lon in enumerate(np.linspace(WEST,EAST,N)):
  xx=fx(lon)*256-x0*256-.5;ix=int(xx);tx=xx-ix
  heights[j,i]=(canvas[iy,ix]*(1-tx)+canvas[iy,ix+1]*tx)*(1-ty)+(canvas[iy+1,ix]*(1-tx)+canvas[iy+1,ix+1]*tx)*ty
encoded=np.rint(heights*4).astype('<u2');raw=encoded.tobytes();(OUT/'montblanc-dem.bin').write_bytes(raw)
meta={'name':'Mont Blanc massif','west':WEST,'east':EAST,'south':SOUTH,'north':NORTH,'size':N,'heightScale':.25,'width':(EAST-WEST)*111320*math.cos(math.radians((NORTH+SOUTH)/2)),'depth':(NORTH-SOUTH)*111320,'minHeight':float(heights.min()),'maxHeight':float(heights.max()),'sha256':hashlib.sha256(raw).hexdigest(),'downloadDate':'2026-11-24','source':'AWS Terrain Tiles / Mapzen Terrarium','zoom':ZOOM,'attribution':'Terrain Tiles via AWS Open Data / Mapzen; Europe: Copernicus EU-DEM, funded by the European Union; global SRTM / GMTED2010 courtesy USGS.','licenseReference':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md','sources':sources,'note':'Historical DEM, resampled into a local equirectangular grid. Not a current snow-depth survey; source cells are tens of metres, not ski-scale measurements.'}
(OUT/'provenance.json').write_text(json.dumps(meta,indent=2));print('DONE',meta['minHeight'],meta['maxHeight'],len(raw))
