import { GRID_W, GRID_H, N } from './config.js';

// Field arrays
export function createFields() {
  return {
    trail: new Float32Array(N),
    food: new Float32Array(N),
    repel: new Float32Array(N),
    trailNext: new Float32Array(N),
    foodNext: new Float32Array(N),
    repelNext: new Float32Array(N)
  };
}

export function diffuseEvaporate(src, dst, diffusion, evap) {
  const a = diffusion/8;
  let i=0;
  for (let y=0;y<GRID_H;y++) {
    for (let x=0;x<GRID_W;x++,i++) {
      const xm = x===0?0:-1, xp=x===GRID_W-1?0:1;
      const ym = y===0?0:-GRID_W, yp=y===GRID_H-1?0:GRID_W;
      const v = src[i]*(1-8*a) + a*(src[i+xm]+src[i+xp]+src[i+ym]+src[i+yp]+src[i+xm+ym]+src[i+xp+ym]+src[i+xm+yp]+src[i+xp+yp]);
      dst[i] = v*evap;
    }
  }
}

export function clearFields(fields) {
  fields.trail.fill(0);
  fields.food.fill(0);
  fields.repel.fill(0);
  fields.trailNext.fill(0);
  fields.foodNext.fill(0);
  fields.repelNext.fill(0);
}

export function swapFields(fields) {
  [fields.trail, fields.trailNext] = [fields.trailNext, fields.trail];
  [fields.food, fields.foodNext] = [fields.foodNext, fields.food];
  [fields.repel, fields.repelNext] = [fields.repelNext, fields.repel];
}

