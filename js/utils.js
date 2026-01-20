import { GRID_W, GRID_H } from './config.js';

// Utility functions
export const clamp = (v, lo, hi) => v<lo?lo:(v>hi?hi:v);
export const idx = (x,y)=> (y|0)*GRID_W + (x|0);

export function sample(field, x, y) { 
  x=clamp(x|0,0,GRID_W-1); 
  y=clamp(y|0,0,GRID_H-1); 
  return field[idx(x,y)]; 
}

export function depositCircle(field, cx, cy, radius, amount) {
  const r2 = radius*radius;
  const x0 = Math.max(1, (cx - radius)|0), x1 = Math.min(GRID_W-2, (cx + radius)|0);
  const y0 = Math.max(1, (cy - radius)|0), y1 = Math.min(GRID_H-2, (cy + radius)|0);
  for (let y=y0;y<=y1;y++) {
    const dy=y-cy, dy2=dy*dy;
    for (let x=x0;x<=x1;x++) {
      const dx=x-cx; 
      if (dx*dx+dy2<=r2) {
        const id=idx(x,y); 
        field[id]=Math.min(1.5, field[id]+amount);
      }
    }
  }
}

export function pointInPoly(x,y,pts){ // ray cast
  let inside=false; 
  for (let i=0, j=pts.length-1; i<pts.length; j=i++){
    const xi=pts[i].x, yi=pts[i].y; 
    const xj=pts[j].x, yj=pts[j].y;
    const intersect = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi+1e-9) + xi);
    if (intersect) inside=!inside;
  } 
  return inside;
}

