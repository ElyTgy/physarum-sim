import { GRID_W, GRID_H, AGENT_STEP, SENSOR_DIST, SENSOR_ANGLE, TURN_ANGLE, RANDOM_STEER, FOOD_CONSUMPTION, TRAIL_DEPOSIT_AGENT } from './config.js';
import { clamp, idx, sample } from './utils.js';
import { cities } from './cityManager.js';

// Agent arrays
export function createAgents(count) {
  return {
    ax: new Float32Array(count),
    ay: new Float32Array(count),
    aa: new Float32Array(count)
  };
}

export function seedAgents(agents, count, cities) {
  agents.ax = new Float32Array(count);
  agents.ay = new Float32Array(count);
  agents.aa = new Float32Array(count);
  for (let i=0;i<count;i++) {
    if (cities.length) {
      const c = cities[i % cities.length];
      const r = 8 + Math.random()*12;
      const t = Math.random()*Math.PI*2;
      agents.ax[i] = clamp(c.x + Math.cos(t)*r, 1, GRID_W-2);
      agents.ay[i] = clamp(c.y + Math.sin(t)*r, 1, GRID_H-2);
    } else {
      agents.ax[i] = Math.random()*GRID_W;
      agents.ay[i] = Math.random()*GRID_H;
    }
    agents.aa[i] = Math.random()*Math.PI*2;
  }
}

export function updateAgents(agents, count, trail, food, repel, wFood, wRep) {
  for (let i=0;i<count;i++){
    let x=agents.ax[i], y=agents.ay[i], a=agents.aa[i];
    const fx=x+Math.cos(a)*SENSOR_DIST, fy=y+Math.sin(a)*SENSOR_DIST;
    const lx=x+Math.cos(a-SENSOR_ANGLE)*SENSOR_DIST, ly=y+Math.sin(a-SENSOR_ANGLE)*SENSOR_DIST;
    const rx=x+Math.cos(a+SENSOR_ANGLE)*SENSOR_DIST, ry=y+Math.sin(a+SENSOR_ANGLE)*SENSOR_DIST;
    const vF = sample(trail,fx,fy) + wFood*sample(food,fx,fy) - wRep*sample(repel,fx,fy);
    const vL = sample(trail,lx,ly) + wFood*sample(food,lx,ly) - wRep*sample(repel,lx,ly);
    const vR = sample(trail,rx,ry) + wFood*sample(food,rx,ry) - wRep*sample(repel,rx,ry);
    if (vL>vF && vL>vR) a-=TURN_ANGLE; else if (vR>vF && vR>vL) a+=TURN_ANGLE; else a+=(Math.random()-0.5)*RANDOM_STEER;
    x+=Math.cos(a)*AGENT_STEP; y+=Math.sin(a)*AGENT_STEP;
    if (x<1) x=GRID_W-2; else if (x>GRID_W-2) x=1; if (y<1) y=GRID_H-2; else if (y>GRID_H-2) y=1;
    const id=idx(x|0,y|0);
    trail[id] = Math.min(1.5, trail[id] + TRAIL_DEPOSIT_AGENT);
    const f=food[id]; if (f>0.001){ const eat=Math.min(FOOD_CONSUMPTION, f); food[id]=f-eat; trail[id]=Math.min(1.5, trail[id] + eat*0.8); }
    agents.ax[i]=x; agents.ay[i]=y; agents.aa[i]=a;
  }
}

