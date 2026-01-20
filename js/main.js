// Main entry point
import { GRID_W, GRID_H } from './config.js';
import { createFields, clearFields, diffuseEvaporate, swapFields } from './fieldSystem.js';
import { cities, addCity, removeCity, clearCities } from './cityManager.js';
import { createAgents, seedAgents, updateAgents } from './agentSystem.js';
import { fitCanvas, createRenderImageData, render, drawMap } from './renderer.js';
import { createMapState, loadMapFromUrl, loadMapFromFile, loadCapturedScreenshot, tryBakePrepare, createSampleMap, bakeFromMap } from './mapHandler.js';
import { createMaskState, toggleMaskDraw, addMaskPoint, finishMask, cancelMask, depositMasks, drawMasksOverlay, rebuildMaskList, startMask } from './maskHandler.js';
import { createInputState, setupInputHandlers, paintAtMouseContinuous, updateKeyHUD, toggleBrush, setBrush, updateBrushButtons, flashButton, updateModeButtons } from './inputHandler.js';
import { getDOMReferences, bindUIEvents } from './ui.js';
import { createSimulationState, togglePause, resetSimulation, computeMetrics } from './simulation.js';
import { depositCircle } from './utils.js';
import { FOOD_SOURCE_STRENGTH } from './config.js';

// Get DOM references
const { canvasMap, canvas, mapCtx, ctx, attr, hud, ui } = getDOMReferences();

// Create state
const fields = createFields();
const agents = createAgents(parseInt(ui.agents.value, 10));
const mapState = createMapState();
const maskState = createMaskState();
const inputState = createInputState();
const simState = createSimulationState();

// Setup canvas sizing
fitCanvas(canvasMap, canvas);
window.addEventListener('resize', () => fitCanvas(canvasMap, canvas));

// Setup sidebar resize functionality
function setupSidebarResize() {
  const resizeHandle = document.getElementById('resizeHandle');
  const side = document.getElementById('side');
  const root = document.documentElement;
  
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  const minWidth = 250;
  const maxWidth = 800;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = side.offsetWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const diff = startX - e.clientX; // Inverted because we're resizing from the left
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));
    root.style.setProperty('--sidebar-width', `${newWidth}px`);
    e.preventDefault();
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

setupSidebarResize();

// Create render image data
const img = createRenderImageData(ctx);

// Helper function to create drawMasksOverlay function
function createDrawMasksOverlayFn() {
  return () => {
    drawMasksOverlay(ctx, canvas, maskState, inputState.maskDrawMode, inputState.mouseX, inputState.mouseY, ui.showMasks.checked);
  };
}

// Callbacks for input handler
const inputCallbacks = {
  onAddCity: (x, y) => {
    addCity(x, y);
  },
  onRemoveCity: (x, y) => {
    return removeCity(x, y);
  },
  onUpdateModeButtons: () => {
    updateModeButtons(inputState, ui);
  },
  onFlashButton: flashButton,
  onAddMaskPoint: (x, y) => {
    addMaskPoint(maskState, x, y, createDrawMasksOverlayFn());
  },
  onFinishMask: () => {
    finishMask(maskState, ui, () => updateModeButtons(inputState, ui), rebuildMaskList, createDrawMasksOverlayFn());
    inputState.maskDrawMode = false;
  },
  onCancelMask: () => {
    cancelMask(maskState, () => updateModeButtons(inputState, ui), createDrawMasksOverlayFn());
    inputState.maskDrawMode = false;
  },
  onTogglePause: () => {
    togglePause(simState, ui);
  },
  onReset: () => {
    reset();
  },
  onToggleMaskDraw: () => {
    if (inputState.maskDrawMode) {
      finishMask(maskState, ui, () => updateModeButtons(inputState, ui), rebuildMaskList, createDrawMasksOverlayFn());
      inputState.maskDrawMode = false;
    } else {
      startMask(maskState, inputState.maskDrawMode, ui, () => updateModeButtons(inputState, ui));
      inputState.maskDrawMode = true;
    }
  },
  food: fields.food,
  repel: fields.repel
};

// Setup input handlers
setupInputHandlers(canvas, inputState, ui, hud, inputCallbacks);

// UI callbacks
const uiCallbacks = {
  onAgentsChange: (count) => {
    agents.ax = new Float32Array(count);
    agents.ay = new Float32Array(count);
    agents.aa = new Float32Array(count);
    seedAgents(agents, count, cities);
  },
  onMapAlphaChange: (alpha) => {
    drawMap(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, alpha);
  },
  onReset: () => {
    reset();
  },
  onTogglePause: () => {
    togglePause(simState, ui);
  },
  onLoadMapFromUrl: (url) => {
    loadMapFromUrl(mapState, url, mapCtx, canvasMap, ui, attr, 
      (ctx, canvas, img, loaded, alpha) => drawMap(ctx, canvas, img, loaded, alpha),
      () => tryBakePrepare(mapState, ui));
  },
  onLoadMapFromFile: (file) => {
    loadMapFromFile(mapState, file, mapCtx, canvasMap, ui, () => tryBakePrepare(mapState, ui));
  },
  onClearMap: () => {
    mapState.mapLoaded = false;
    mapState.mapBright = null;
    mapCtx.clearRect(0,0,canvasMap.width,canvasMap.height);
    document.getElementById('cwrap').classList.remove('has-map');
    attr.hidden = true;
  },
  onLoadSampleMap: () => {
    createSampleMap(mapState, mapCtx, canvasMap, ui, attr, () => tryBakePrepare(mapState, ui));
  },
  onMaskStrengthChange: (strength) => {
    if (maskState.curMask) maskState.curMask.strength = strength;
  },
  onToggleMaskDraw: () => {
    if (inputState.maskDrawMode) {
      finishMask(maskState, ui, () => updateModeButtons(inputState, ui), rebuildMaskList, createDrawMasksOverlayFn());
      inputState.maskDrawMode = false;
    } else {
      startMask(maskState, inputState.maskDrawMode, ui, () => updateModeButtons(inputState, ui));
      inputState.maskDrawMode = true;
    }
  },
  onFinishMask: () => {
    finishMask(maskState, ui, () => updateModeButtons(inputState, ui), rebuildMaskList, createDrawMasksOverlayFn());
    inputState.maskDrawMode = false;
  }
};

// Bind UI events
bindUIEvents(ui, hud, uiCallbacks);

// Reset function
function reset() {
  clearFields(fields);
  resetSimulation(simState, fields);
  seedAgents(agents, parseInt(ui.agents.value, 10), cities);
}

// Main step loop
function step() {
  requestAnimationFrame(step);
  
  if (simState.paused) { 
    render(ctx, canvas, img, parseFloat(ui.tubeThresh.value), fields.trail, fields.food, fields.repel, cities, ui.showMasks.checked, createDrawMasksOverlayFn()); 
    return; 
  }

  // Paint at mouse if needed
  paintAtMouseContinuous(inputState, ui, inputCallbacks);

  // Cities feed food
  for (const c of cities) {
    depositCircle(fields.food, c.x, c.y, 5, FOOD_SOURCE_STRENGTH);
  }

  // Masks deposit repellent continuously
  depositMasks(maskState, fields.repel, ui, inputState.maskDrawMode);

  // Bake repellent from map brightness if enabled (optional - may not exist if section removed)
  if (ui.bakeToggle && ui.bakeToggle.checked) {
    bakeFromMap(mapState, fields.repel, parseFloat(ui.bakeStrength.value), parseFloat(ui.bakeThresh.value), ui.bakeInvert.checked);
  }

  // Agents
  const wFood = parseFloat(ui.wFood.value);
  const wRep = parseFloat(ui.wRepel.value);
  updateAgents(agents, parseInt(ui.agents.value, 10), fields.trail, fields.food, fields.repel, wFood, wRep);

  // Fields evolve
  const evap = parseFloat(ui.evap.value);
  const diff = parseFloat(ui.diff.value);
  diffuseEvaporate(fields.trail, fields.trailNext, diff, evap);
  diffuseEvaporate(fields.food, fields.foodNext, diff*0.7, 0.995);
  diffuseEvaporate(fields.repel, fields.repelNext, diff*0.9, 0.985);
  swapFields(fields);

  // Metrics
  const {active, connectedCount, allConnected} = computeMetrics(fields.trail, cities, parseFloat(ui.tubeThresh.value));
  ui.connected.textContent = `${connectedCount} / ${cities.length}`;
  ui.tubeLen.textContent = active.toString();
  const t = (performance.now() - simState.timeStart) / 1000;
  ui.timeSec.textContent = t.toFixed(1) + 's';
  if (allConnected) {
    if (simState.bestConnectSec == null || t < simState.bestConnectSec) {
      simState.bestConnectSec = t;
    }
    ui.bestTime.textContent = simState.bestConnectSec.toFixed(1) + 's';
  }

  // Draw
  const mapAlpha = ui.mapAlpha ? parseFloat(ui.mapAlpha.value) : 0.45;
  drawMap(mapCtx, canvasMap, mapState.mapImg, mapState.mapLoaded, mapAlpha);
  render(ctx, canvas, img, parseFloat(ui.tubeThresh.value), fields.trail, fields.food, fields.repel, cities, ui.showMasks.checked, createDrawMasksOverlayFn());
  updateKeyHUD(inputState, hud, ui);
}

// Boot function
function boot() {
  // Check if we have a captured screenshot to load
  const hasScreenshot = loadCapturedScreenshot(mapState, mapCtx, canvasMap, ui, () => tryBakePrepare(mapState, ui));
  
  if (!hasScreenshot) {
    // Only add initial cities if we don't have a captured screenshot
    // This means user came directly to path.html, not from map.html
    const pad = 14;
    for (let i = 0; i < 6; i++) {
      addCity(pad + Math.random() * (GRID_W - 2 * pad), pad + Math.random() * (GRID_H - 2 * pad));
    }
  }
  // If we have a screenshot (from map.html), don't add any cities - let user place them manually
  
  seedAgents(agents, parseInt(ui.agents.value, 10), cities);
  simState.timeStart = performance.now();
  requestAnimationFrame(step);
}

// Start the application
boot();

