import { GRID_W, GRID_H, N } from './config.js';
import { drawMap } from './renderer.js';

// Map state
export function createMapState() {
  const mapImg = new Image();
  mapImg.crossOrigin = 'anonymous';
  const mapBuf = document.createElement('canvas'); 
  mapBuf.width = GRID_W; 
  mapBuf.height = GRID_H; 
  const mapBufCtx = mapBuf.getContext('2d');
  
  return {
    mapImg,
    mapLoaded: false,
    mapReadable: false,
    mapBuf,
    mapBufCtx,
    mapBright: null
  };
}

export function loadMapFromUrl(mapState, url, mapCtx, canvasMap, ui, attr, drawMapFn, tryBakePrepareFn) {
  mapState.mapReadable = true; // optimistic; may flip if tainted
  mapState.mapImg = new Image(); 
  mapState.mapImg.crossOrigin = 'anonymous'; 
  mapState.mapImg.onload = () => { 
    mapState.mapLoaded = true; 
    drawMapFn(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, parseFloat(ui.mapAlpha.value)); 
    tryBakePrepareFn(); 
    document.getElementById('cwrap').classList.add('has-map'); 
  }; 
  mapState.mapImg.onerror = () => { 
    mapState.mapLoaded = false; 
    ui.corsWarn.hidden = false; 
  }; 
  mapState.mapImg.src = url; 
  attr.hidden = false; // show attribution text; user should ensure rights
}

export function loadMapFromFile(mapState, file, mapCtx, canvasMap, ui, tryBakePrepareFn) {
  const url = URL.createObjectURL(file); 
  mapState.mapReadable = true; 
  mapState.mapImg = new Image(); 
  mapState.mapImg.onload = () => { 
    mapState.mapLoaded = true; 
    drawMap(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, parseFloat(ui.mapAlpha.value)); 
    tryBakePrepareFn(); 
    document.getElementById('cwrap').classList.add('has-map'); 
    URL.revokeObjectURL(url); 
  }; 
  mapState.mapImg.src = url; 
}

// Function to load captured screenshot from sessionStorage
export function loadCapturedScreenshot(mapState, mapCtx, canvasMap, ui, tryBakePrepareFn) {
  const screenshotDataUrl = sessionStorage.getItem('mapScreenshot');
  const locationData = sessionStorage.getItem('locationData');
  
  if (screenshotDataUrl) {
    mapState.mapReadable = true;
    mapState.mapImg = new Image();
    mapState.mapImg.onload = () => {
      mapState.mapLoaded = true;
      drawMap(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, parseFloat(ui.mapAlpha.value));
      tryBakePrepareFn();
      document.getElementById('cwrap').classList.add('has-map');
      
      // Show location info if available
      if (locationData) {
        try {
          const location = JSON.parse(locationData);
          console.log('Loaded location data:', location);
          // You could display this information in the UI if desired
        } catch (e) {
          console.error('Error parsing location data:', e);
        }
      }
    };
    mapState.mapImg.onerror = () => {
      mapState.mapLoaded = false;
      console.error('Failed to load captured screenshot');
    };
    mapState.mapImg.src = screenshotDataUrl;
    
    // Clear the sessionStorage to free up memory
    sessionStorage.removeItem('mapScreenshot');
    sessionStorage.removeItem('locationData');
    
    return true;
  }
  return false;
}

export function tryBakePrepare(mapState, ui) {
  // Draw into GRID-size buffer and compute brightness
  try {
    mapState.mapBufCtx.clearRect(0,0,GRID_W,GRID_H);
    // Letterbox-fit into mapBuf as well
    const iw = mapState.mapImg.naturalWidth, ih = mapState.mapImg.naturalHeight; 
    const s = Math.min(GRID_W/iw, GRID_H/ih); 
    const w = iw*s, h = ih*s; 
    const x = (GRID_W-w)/2, y = (GRID_H-h)/2;
    mapState.mapBufCtx.drawImage(mapState.mapImg, x, y, w, h);
    const imgData = mapState.mapBufCtx.getImageData(0,0,GRID_W,GRID_H); 
    const d = imgData.data; 
    const arr = new Float32Array(N);
    for (let i=0;i<N;i++){ 
      const o=i*4; 
      const r=d[o], g=d[o+1], b=d[o+2]; 
      arr[i]=(0.2126*r + 0.7152*g + 0.0722*b)/255; 
    }
    mapState.mapBright = arr; 
    mapState.mapReadable = true; 
    ui.corsWarn.hidden = true;
  } catch (e) {
    mapState.mapReadable = false; 
    mapState.mapBright = null; 
    ui.corsWarn.hidden = false; 
    console.warn('Map not readable (likely CORS). Baking disabled.');
  }
}

export function createSampleMap(mapState, mapCtx, canvasMap, ui, attr, tryBakePrepareFn) {
  const off = document.createElement('canvas'); 
  off.width = 1024; 
  off.height = 576; 
  const g = off.getContext('2d');
  // background
  g.fillStyle = '#0b0f14'; 
  g.fillRect(0,0,off.width,off.height);
  // draw pseudo-coastline + rivers (light areas => repellent when not inverted)
  g.strokeStyle = '#c8d2dc'; 
  g.lineWidth = 3;
  g.beginPath(); 
  g.moveTo(50,400); 
  g.bezierCurveTo(200,320, 380,380, 520,340); 
  g.bezierCurveTo(680,300, 820,360, 980,300); 
  g.stroke();
  for (let i=0;i<6;i++){ 
    g.beginPath(); 
    g.moveTo(200+ i*120, 0); 
    g.lineTo(150+i*120, 300+Math.random()*60); 
    g.stroke(); 
  }
  // parks/mountains
  g.fillStyle = '#a9b8c6'; 
  for (let i=0;i<12;i++){ 
    const x=60+Math.random()*900, y=100+Math.random()*380, r=10+Math.random()*30; 
    g.beginPath(); 
    g.arc(x,y,r,0,Math.PI*2); 
    g.fill(); 
  }
  // road hints (dark) so they won't repel
  g.strokeStyle = '#2a323b'; 
  g.lineWidth = 10; 
  g.lineCap = 'round';
  g.beginPath(); 
  g.moveTo(120,520); 
  g.lineTo(500,300); 
  g.lineTo(900,260); 
  g.stroke();

  mapState.mapImg = new Image(); 
  mapState.mapImg.onload = () => { 
    mapState.mapLoaded = true; 
    drawMap(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, parseFloat(ui.mapAlpha.value)); 
    tryBakePrepareFn(); 
    document.getElementById('cwrap').classList.add('has-map'); 
  }; 
  mapState.mapImg.src = off.toDataURL('image/png'); 
}

// Baking from map brightness → repellent field
export function bakeFromMap(mapState, repel, strength, threshold, invert) {
  if (!mapState.mapBright || !mapState.mapReadable) return;
  const k = strength; 
  const th = threshold; 
  const inv = invert;
  for (let i=0;i<N;i++){
    const b = mapState.mapBright[i];
    const cond = inv ? (b < th) : (b > th);
    if (cond) repel[i] = Math.min(1.5, repel[i] + k);
  }
}

