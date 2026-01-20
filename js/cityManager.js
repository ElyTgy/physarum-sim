// City management
export const cities = [];

export function addCity(x, y) { 
  cities.push({x, y}); 
}

export function removeCity(x, y) {
  const radius = 20;
  const i = cities.findIndex(c => (c.x-x)**2 + (c.y-y)**2 <= radius*radius);
  if (i !== -1) { 
    cities.splice(i,1); 
    return true; 
  }
  return false;
}

export function clearCities() { 
  cities.length = 0; 
}

