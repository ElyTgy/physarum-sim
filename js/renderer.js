import { GRID_W, GRID_H, N } from './config.js';
import { clamp } from './utils.js';
import { cities } from './cityManager.js';

// Canvas sizing
export function fitCanvas(canvasMap, canvas) {
  const {clientWidth: w, clientHeight: h} = document.getElementById('cwrap');
  const scale = Math.max(1, Math.min((w/GRID_W)|0, (h/GRID_H)|0));
  const cw = GRID_W * scale;
  const ch = GRID_H * scale;
  for (const c of [canvasMap, canvas]) {
    c.width = cw; 
    c.height = ch; 
    c.style.width = cw + 'px'; 
    c.style.height = ch + 'px';
  }
}

// Rendering
export function createRenderImageData(ctx) {
  return ctx.createImageData(GRID_W, GRID_H);
}

export function render(ctx, canvas, img, tubeThreshold, trail, food, repel, cities, showMasks, drawMasksOverlayFn) {
  // draw tubes/fields
  const data=img.data;
  for (let i=0;i<N;i++){
    const tr=trail[i]; 
    const isTube = tr>tubeThreshold; 
    const f=food[i]; 
    const r=repel[i];
    let R=0,G=0,B=0,A=0; // transparent background
    if (isTube) { 
      const v = clamp(tr*1.2, 0, 1.2); 
      R = v*240; 
      G = v*245; 
      B = v*250; 
      A = v*255; 
    }
    if (f>0.02){ 
      const v = f*0.8; 
      R = Math.max(R, v*10); 
      G = Math.max(G, v*160); 
      B = Math.max(B, v*140); 
      A = Math.max(A, v*255); 
    }
    if (r>0.02){ 
      const v = r*0.8; 
      R = Math.max(R, v*220); 
      A = Math.max(A, v*255); 
    }
    const o=i*4; 
    data[o]=clamp(R,0,255); 
    data[o+1]=clamp(G,0,255); 
    data[o+2]=clamp(B,0,255); 
    data[o+3]=clamp(A,0,255);
  }
  const tmp=document.createElement('canvas'); 
  tmp.width=GRID_W; 
  tmp.height=GRID_H; 
  tmp.getContext('2d').putImageData(img,0,0);
  ctx.imageSmoothingEnabled=false; 
  ctx.clearRect(0,0,canvas.width,canvas.height); 
  ctx.drawImage(tmp,0,0,canvas.width,canvas.height);

  // cities
  const sx = canvas.width/GRID_W, sy = canvas.height/GRID_H;
  for (const c of cities){ 
    ctx.beginPath(); 
    ctx.arc(c.x*sx, c.y*sy, 6, 0, Math.PI*2); 
    ctx.fillStyle='#82aaff'; 
    ctx.shadowColor='#82aaff'; 
    ctx.shadowBlur=8; 
    ctx.fill(); 
    ctx.shadowBlur=0; 
    ctx.lineWidth=2; 
    ctx.strokeStyle='#2a3e66'; 
    ctx.stroke(); 
  }

  // mask overlay
  if (showMasks && drawMasksOverlayFn) drawMasksOverlayFn();
}

export function drawMap(mapCtx, canvasMap, mapImg, mapLoaded, alpha) {
  mapCtx.clearRect(0,0,canvasMap.width,canvasMap.height);
  mapCtx.globalAlpha = alpha;
  if (mapLoaded){
    // Fit contain
    const cw=canvasMap.width, ch=canvasMap.height; 
    const iw=mapImg.naturalWidth, ih=mapImg.naturalHeight;
    const s = Math.min(cw/iw, ch/ih); 
    const w=iw*s, h=ih*s; 
    const x=(cw-w)/2, y=(ch-h)/2; 
    mapCtx.drawImage(mapImg, x, y, w, h);
  }
  mapCtx.globalAlpha = 1;
}

