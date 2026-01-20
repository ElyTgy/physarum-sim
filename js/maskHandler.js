import { GRID_W, GRID_H } from './config.js';
import { clamp, idx, pointInPoly } from './utils.js';

// Light Mask system
export function createMaskState() {
  return {
    masks: [], // each { id, name, pts:[{x,y}], indices:Uint32Array, enabled:boolean, strength:number }
    curMask: null,
    maskCounter: 1
  };
}

export function startMask(maskState, maskDrawMode, ui, updateModeButtonsFn) {
  maskState.curMask = { 
    id: maskState.maskCounter++, 
    name: 'Mask ' + maskState.maskCounter, 
    pts: [], 
    indices: null, 
    enabled: true, 
    strength: parseFloat(ui.maskStrength.value) 
  }; 
  updateModeButtonsFn(true);
}

export function addMaskPoint(maskState, x, y, drawMasksOverlayFn) {
  if (!maskState.curMask) return; 
  maskState.curMask.pts.push({x, y}); 
  drawMasksOverlayFn();
}

export function cancelMask(maskState, updateModeButtonsFn, drawMasksOverlayFn) {
  maskState.curMask = null; 
  updateModeButtonsFn(false); 
  drawMasksOverlayFn();
}

export function finishMask(maskState, ui, updateModeButtonsFn, rebuildMaskListFn, drawMasksOverlayFn) {
  if (!maskState.curMask) return; 
  if (maskState.curMask.pts.length < 3) { 
    cancelMask(maskState, updateModeButtonsFn, drawMasksOverlayFn); 
    return; 
  } 
  rasterizeMask(maskState.curMask); 
  maskState.masks.push(maskState.curMask); 
  maskState.curMask = null; 
  updateModeButtonsFn(false); 
  rebuildMaskListFn(maskState.masks, ui);
}

export function toggleMaskDraw(maskState, maskDrawMode, ui, updateModeButtonsFn, rebuildMaskListFn, drawMasksOverlayFn) {
  if (maskDrawMode) finishMask(maskState, ui, updateModeButtonsFn, rebuildMaskListFn, drawMasksOverlayFn);
  else startMask(maskState, maskDrawMode, ui, updateModeButtonsFn);
}

export function drawMasksOverlay(ctx, canvas, maskState, maskDrawMode, mouseX, mouseY, showMasks) {
  // overlay on SIM canvas (on top of tubes)
  const sx = canvas.width/GRID_W, sy = canvas.height/GRID_H;
  ctx.save();
  if (showMasks){
    ctx.lineWidth = 2; 
    ctx.strokeStyle = '#ffd166'; 
    ctx.fillStyle = 'rgba(255,209,102,0.12)';
    for (const m of maskState.masks){ 
      if (!m.enabled) continue; 
      ctx.beginPath(); 
      for (let i=0;i<m.pts.length;i++){ 
        const p=m.pts[i]; 
        const x=p.x*sx, y=p.y*sy; 
        if (i===0) ctx.moveTo(x,y); 
        else ctx.lineTo(x,y); 
      } 
      ctx.closePath(); 
      ctx.fill(); 
      ctx.stroke(); 
    }
    if (maskDrawMode && maskState.curMask && maskState.curMask.pts.length){
      ctx.beginPath(); 
      for (let i=0;i<maskState.curMask.pts.length;i++){ 
        const p=maskState.curMask.pts[i]; 
        const x=p.x*sx, y=p.y*sy; 
        if (i===0) ctx.moveTo(x,y); 
        else ctx.lineTo(x,y); 
      }
      // live vertex indicator
      const last = maskState.curMask.pts[maskState.curMask.pts.length-1]; 
      if (last){ 
        ctx.lineTo(mouseX*sx, mouseY*sy); 
      }
      ctx.strokeStyle='#ffd166'; 
      ctx.setLineDash([6,4]); 
      ctx.stroke(); 
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

export function rasterizeMask(m){
  // Compute bounding box
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  for (const p of m.pts){ 
    if (p.x<minX) minX=p.x; 
    if (p.x>maxX) maxX=p.x; 
    if (p.y<minY) minY=p.y; 
    if (p.y>maxY) maxY=p.y; 
  }
  minX = clamp(minX|0, 0, GRID_W-1); 
  maxX = clamp(maxX|0, 0, GRID_W-1); 
  minY = clamp(minY|0, 0, GRID_H-1); 
  maxY = clamp(maxY|0, 0, GRID_H-1);
  const idxs = [];
  for (let y=minY; y<=maxY; y++){
    for (let x=minX; x<=maxX; x++){
      if (pointInPoly(x+0.5, y+0.5, m.pts)) idxs.push(idx(x,y));
    }
  }
  m.indices = new Uint32Array(idxs);
}

export function rebuildMaskList(masks, ui) {
  ui.maskList.innerHTML='';
  for (const m of masks){
    const div=document.createElement('div'); 
    div.className='maskItem';
    const left=document.createElement('div'); 
    left.className='name'; 
    left.textContent=m.name; 
    div.appendChild(left);
    const right=document.createElement('div'); 
    right.style.display='flex'; 
    right.style.gap='6px';
    const tog=document.createElement('button'); 
    tog.textContent = m.enabled? 'On' : 'Off'; 
    tog.style.background = m.enabled? 'var(--ok)' : '#131b26'; 
    tog.onclick=()=>{ 
      m.enabled=!m.enabled; 
      tog.textContent=m.enabled?'On':'Off'; 
      tog.style.background = m.enabled? 'var(--ok)' : '#131b26'; 
    };
    const del=document.createElement('button'); 
    del.textContent='Delete'; 
    del.style.background='var(--warn)'; 
    del.onclick=()=>{ 
      const k=masks.indexOf(m); 
      if (k>=0) masks.splice(k,1); 
      rebuildMaskList(masks, ui); 
    };
    right.appendChild(tog); 
    right.appendChild(del); 
    div.appendChild(right); 
    ui.maskList.appendChild(div);
  }
}

export function depositMasks(maskState, repel, ui, maskDrawMode) {
  for (const m of maskState.masks){ 
    if (!m.enabled || !m.indices) continue; 
    const s = m.strength; 
    const arr = m.indices; 
    for (let k=0;k<arr.length;k++){ 
      const i=arr[k]; 
      repel[i] = Math.min(1.5, repel[i] + s); 
    } 
  }
  if (maskDrawMode && maskState.curMask) {
    maskState.curMask.strength = parseFloat(ui.maskStrength.value);
  }
}

