import { GRID_W, GRID_H, N, FOOD_SOURCE_STRENGTH } from './config.js';
import { idx, depositCircle } from './utils.js';
import { cities } from './cityManager.js';

// Connectivity & metrics
const comp = new Int32Array(N);

export function computeMetrics(trail, cities, threshold) {
  comp.fill(-1); 
  let compId = 0; 
  const stack = new Int32Array(N);
  for (let i=0;i<N;i++){
    if (comp[i]!==-1) continue; 
    if (trail[i]<=threshold){ 
      comp[i]=-2; 
      continue; 
    }
    let top=0; 
    stack[top++]=i; 
    comp[i]=compId;
    while (top){ 
      const p=stack[--top]; 
      const x=p%GRID_W, y=(p/GRID_W)|0; 
      for (let dy=-1;dy<=1;dy++) {
        for (let dx=-1;dx<=1;dx++){ 
          if (!dx && !dy) continue; 
          const nx=x+dx, ny=y+dy; 
          if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue; 
          const q=ny*GRID_W+nx; 
          if (comp[q]===-1 && trail[q]>threshold){ 
            comp[q]=compId; 
            stack[top++]=q; 
          } 
        } 
      }
    }
    compId++;
  }
  let active=0; 
  for (let i=0;i<N;i++) if (trail[i]>threshold) active++;
  let connectedCount=0; 
  const cityComps=new Set();
  for (const c of cities){ 
    const id=comp[idx(c.x|0,c.y|0)]; 
    if (id>=0){ 
      cityComps.add(id); 
      connectedCount++; 
    } 
  }
  const allConnected = (connectedCount===cities.length && cityComps.size===1 && cities.length>0);
  return {active, connectedCount, allConnected};
}

// Simulation state
export function createSimulationState() {
  return {
    paused: false,
    timeStart: performance.now(),
    bestConnectSec: null
  };
}

export function togglePause(simState, ui) { 
  simState.paused = !simState.paused; 
  ui.togglePauseBtn.textContent = simState.paused ? 'Resume' : 'Pause'; 
}

export function resetSimulation(simState, fields) {
  simState.timeStart = performance.now();
  simState.bestConnectSec = null;
  // Fields will be cleared by caller
}

