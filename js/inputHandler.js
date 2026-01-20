import { GRID_W, GRID_H } from './config.js';
import { clamp, depositCircle } from './utils.js';

// Input state
export function createInputState() {
  return {
    isDown: false,
    mouseX: 0,
    mouseY: 0,
    keyA: false,
    keyB: false,
    cityMode: false,
    deleteMode: false,
    showHUD: true,
    maskDrawMode: false,
    brush: 'food'
  };
}

export function setupInputHandlers(
  canvas, 
  inputState, 
  ui, 
  hud,
  callbacks
) {
  // Mouse handlers
  canvas.addEventListener('pointerdown', (e) => { 
    inputState.isDown = true; 
    setMouse(e, canvas, inputState, callbacks); 
  });
  
  window.addEventListener('pointerup', () => inputState.isDown = false);
  
  window.addEventListener('pointermove', (e) => setMouse(e, canvas, inputState, callbacks));
  
  function setMouse(e, canvas, inputState, callbacks) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX-rect.left)/rect.width; 
    const sy = (e.clientY-rect.top)/rect.height;
    inputState.mouseX = clamp(Math.round(sx*GRID_W),0,GRID_W-1);
    inputState.mouseY = clamp(Math.round(sy*GRID_H),0,GRID_H-1);
    if (inputState.isDown) {
      if (inputState.cityMode) { 
        callbacks.onAddCity(inputState.mouseX, inputState.mouseY); 
        inputState.cityMode = false; 
        callbacks.onUpdateModeButtons(); 
        callbacks.onFlashButton('startMaskBtn'); 
      } else if (inputState.deleteMode) { 
        const ok = callbacks.onRemoveCity(inputState.mouseX, inputState.mouseY); 
        inputState.deleteMode = !ok; 
        callbacks.onUpdateModeButtons(); 
      } else if (inputState.maskDrawMode) { 
        callbacks.onAddMaskPoint(inputState.mouseX, inputState.mouseY); 
      } else { 
        paintAtMouse(inputState, ui, callbacks); 
      }
    }
  }

  // Keyboard handlers
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'a' || e.key === 'A') inputState.keyA = true;
    if (e.key === 'b' || e.key === 'B') { 
      inputState.keyB = true; 
      toggleBrush(inputState, ui, hud, callbacks); 
    }
    if (e.key === ' ') { 
      callbacks.onTogglePause(); 
    }
    if (e.key === 'r' || e.key === 'R') { 
      callbacks.onReset(); 
    }
    if (e.key === 'c' || e.key === 'C') { 
      inputState.cityMode = !inputState.cityMode; 
      inputState.deleteMode = false; 
      inputState.maskDrawMode = false; 
      callbacks.onUpdateModeButtons(); 
    }
    if (e.key === 'd' || e.key === 'D') { 
      inputState.deleteMode = !inputState.deleteMode; 
      inputState.cityMode = false; 
      inputState.maskDrawMode = false; 
      callbacks.onUpdateModeButtons(); 
    }
    if (e.key === 'm' || e.key === 'M') { 
      callbacks.onToggleMaskDraw(); 
    }
    if (e.key === 'h' || e.key === 'H') { 
      inputState.showHUD = !inputState.showHUD; 
      document.getElementById('hud').style.display = inputState.showHUD?'block':'none'; 
    }
    if (e.key === 'Enter') { 
      if (inputState.maskDrawMode) callbacks.onFinishMask(); 
    }
    if (e.key === 'Escape') { 
      if (inputState.maskDrawMode) callbacks.onCancelMask(); 
    }
  });
  
  window.addEventListener('keyup', (e) => { 
    if (e.key === 'a' || e.key === 'A') inputState.keyA = false; 
    if (e.key === 'b' || e.key === 'B') inputState.keyB = false; 
  });
  
  // Wheel handler - only adjust deposit when hovering over canvas
  // Check if event target is in sidebar - if so, ignore (unless it's the deposit slider itself)
  window.addEventListener('wheel', (e) => {
    const sideEl = document.getElementById('side');
    const isTargetInSidebar = sideEl && e.target && (e.target.closest('#side') === sideEl || e.target === sideEl);
    const isTargetDepositSlider = e.target && e.target.id === 'deposit';
    
    // Also check element under pointer as fallback
    const elemUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
    const isPointerInSidebar = sideEl && elemUnderPointer && (sideEl.contains(elemUnderPointer) || elemUnderPointer === sideEl);
    const isPointerOnCanvas = elemUnderPointer === canvas || elemUnderPointer === document.getElementById('map');
    
    // Only modify deposit if:
    // 1. NOT in sidebar (either target or pointer), OR
    // 2. Target is the deposit slider itself (for direct interaction), OR  
    // 3. Pointer is on canvas
    if ((isTargetInSidebar || isPointerInSidebar) && !isTargetDepositSlider && !isPointerOnCanvas) {
      return; // Don't modify deposit when scrolling sidebar
    }
    
    const v = parseFloat(ui.deposit.value); 
    const nv = clamp(v + (e.deltaY<0?0.1:-0.1), parseFloat(ui.deposit.min), parseFloat(ui.deposit.max));
    ui.deposit.value = nv.toFixed(1); 
    ui.deposit.dispatchEvent(new Event('input'));
  }, {passive:true});

  // Brush button handlers
  ui.brushFood.addEventListener('click', () => setBrush(inputState, 'food', ui, hud, callbacks));
  ui.brushRepel.addEventListener('click', () => setBrush(inputState, 'repel', ui, hud, callbacks));
}

function paintAtMouse(inputState, ui, callbacks) { 
  if (inputState.cityMode || inputState.deleteMode || inputState.maskDrawMode) return; 
  const rad = parseInt(ui.radius.value,10); 
  const amount = parseFloat(ui.deposit.value)*0.08; 
  const mode = (inputState.keyA || inputState.isDown) && inputState.keyB ? 'repel' : inputState.brush; 
  if (mode === 'food') {
    depositCircle(callbacks.food, inputState.mouseX, inputState.mouseY, rad, amount); 
  } else {
    depositCircle(callbacks.repel, inputState.mouseX, inputState.mouseY, rad, amount); 
  }
}

export function toggleBrush(inputState, ui, hud, callbacks) { 
  inputState.brush = (inputState.brush === 'food') ? 'repel' : 'food'; 
  updateBrushButtons(inputState, ui, hud); 
}

export function setBrush(inputState, b, ui, hud, callbacks) { 
  inputState.brush = b; 
  updateBrushButtons(inputState, ui, hud); 
}

export function updateBrushButtons(inputState, ui, hud) { 
  ui.brushFood.classList.toggle('primary', inputState.brush === 'food'); 
  ui.brushRepel.classList.toggle('primary', inputState.brush === 'repel'); 
  hud.brushName.textContent = inputState.brush === 'food' ? 'Food' : 'Repellent'; 
}

export function paintAtMouseContinuous(inputState, ui, callbacks) {
  if ((inputState.isDown || inputState.keyA) && !inputState.cityMode && !inputState.deleteMode && !inputState.maskDrawMode) {
    paintAtMouse(inputState, ui, callbacks);
  }
}

export function updateKeyHUD(inputState, hud, ui) { 
  hud.aLed.textContent = (inputState.keyA || inputState.isDown) ? 'ON' : 'OFF'; 
  hud.aLed.parentElement.classList.toggle('on', inputState.keyA || inputState.isDown); 
  hud.bLed.textContent = inputState.keyB ? 'ON' : 'OFF'; 
  hud.bLed.parentElement.classList.toggle('on', inputState.keyB); 
  hud.depositVal.textContent = parseFloat(ui.deposit.value).toFixed(1); 
}

export function flashButton(id) { 
  const b = document.getElementById(id); 
  const old = b.style.boxShadow; 
  b.style.boxShadow = '0 0 0 3px #5cf2c866'; 
  setTimeout(() => b.style.boxShadow = old, 300); 
}

export function updateModeButtons(inputState, ui) { 
  ui.startMaskBtn.classList.toggle('primary', inputState.maskDrawMode); 
}

