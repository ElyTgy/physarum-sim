// DOM element references
export function getDOMReferences() {
  const canvasMap = document.getElementById('map');
  const canvas = document.getElementById('sim');
  const mapCtx = canvasMap.getContext('2d');
  const ctx = canvas.getContext('2d');
  const attr = document.getElementById('attr');

  const hud = {
    brushName: document.getElementById('brushName'),
    depositVal: document.getElementById('depositVal'),
    aLed: document.getElementById('aLed'),
    bLed: document.getElementById('bLed'),
  };
  
  const ui = {
    deposit: document.getElementById('deposit'),
    radius: document.getElementById('radius'),
    agents: document.getElementById('agents'),
    brushFood: document.getElementById('brushFood'),
    brushRepel: document.getElementById('brushRepel'),
    tubeThresh: document.getElementById('tubeThresh'),
    evap: document.getElementById('evap'),
    diff: document.getElementById('diff'),
    wFood: document.getElementById('wFood'),
    wRepel: document.getElementById('wRepel'),

    resetBtn: document.getElementById('resetBtn'),
    togglePauseBtn: document.getElementById('togglePauseBtn'),

    connected: document.getElementById('connected'),
    tubeLen: document.getElementById('tubeLen'),
    timeSec: document.getElementById('timeSec'),
    bestTime: document.getElementById('bestTime'),

    // Map UI (removed from sidebar, but may still exist in DOM)
    drop: document.getElementById('drop'),
    mapUrl: document.getElementById('mapUrl'),
    loadUrlBtn: document.getElementById('loadUrlBtn'),
    fileIn: document.getElementById('fileIn'),
    mapAlpha: document.getElementById('mapAlpha'),
    clearMapBtn: document.getElementById('clearMapBtn'),
    sampleTokyoBtn: document.getElementById('sampleTokyoBtn'),
    corsWarn: document.getElementById('corsWarn'),

    // Baking UI (removed from sidebar, but may still exist in DOM)
    bakeToggle: document.getElementById('bakeToggle'),
    bakeStrength: document.getElementById('bakeStrength'),
    bakeThresh: document.getElementById('bakeThresh'),
    bakeInvert: document.getElementById('bakeInvert'),

    // Masks UI
    startMaskBtn: document.getElementById('startMaskBtn'),
    finishMaskBtn: document.getElementById('finishMaskBtn'),
    maskStrength: document.getElementById('maskStrength'),
    showMasks: document.getElementById('showMasks'),
    maskList: document.getElementById('maskList'),
  };

  return { canvasMap, canvas, mapCtx, ctx, attr, hud, ui };
}

// Bind UI events (those not handled by inputHandler)
export function bindUIEvents(ui, hud, callbacks) {
  // Deposit slider
  ui.deposit.addEventListener('input', () => {
    hud.depositVal.textContent = parseFloat(ui.deposit.value).toFixed(1);
  });

  // Agents slider
  ui.agents.addEventListener('input', () => {
    callbacks.onAgentsChange(parseInt(ui.agents.value, 10));
  });

  // Map alpha slider (optional - may not exist if Map section removed)
  if (ui.mapAlpha) {
    ui.mapAlpha.addEventListener('input', () => {
      callbacks.onMapAlphaChange(parseFloat(ui.mapAlpha.value));
    });
  }

  // Reset button
  ui.resetBtn.addEventListener('click', callbacks.onReset);

  // Pause button
  ui.togglePauseBtn.addEventListener('click', callbacks.onTogglePause);

  // Map URL loading (optional - may not exist if Map section removed)
  if (ui.loadUrlBtn && ui.mapUrl) {
    ui.loadUrlBtn.addEventListener('click', () => {
      const url = ui.mapUrl.value.trim();
      if (url) callbacks.onLoadMapFromUrl(url);
    });
  }

  // File input (optional - may not exist if Map section removed)
  if (ui.fileIn) {
    ui.fileIn.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        callbacks.onLoadMapFromFile(e.target.files[0]);
      }
    });
  }

  // Clear map button (optional - may not exist if Map section removed)
  if (ui.clearMapBtn) {
    ui.clearMapBtn.addEventListener('click', callbacks.onClearMap);
  }

  // Sample map button (optional - may not exist if Map section removed)
  if (ui.sampleTokyoBtn) {
    ui.sampleTokyoBtn.addEventListener('click', callbacks.onLoadSampleMap);
  }

  // Drag & drop (optional - may not exist if Map section removed)
  if (ui.drop) {
    ui.drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      ui.drop.style.borderColor = '#5cf2c888';
    });
    
    ui.drop.addEventListener('dragleave', () => {
      ui.drop.style.borderColor = '#2a384f';
    });
    
    ui.drop.addEventListener('drop', (e) => {
      e.preventDefault();
      ui.drop.style.borderColor = '#2a384f';
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) callbacks.onLoadMapFromFile(f);
    });
  }

  // Back to map selection button
  document.getElementById('backToMapBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Mask strength slider
  ui.maskStrength.addEventListener('input', () => {
    callbacks.onMaskStrengthChange(parseFloat(ui.maskStrength.value));
  });

  // Start mask button
  ui.startMaskBtn.addEventListener('click', callbacks.onToggleMaskDraw);

  // Finish mask button
  ui.finishMaskBtn.addEventListener('click', callbacks.onFinishMask);
}

