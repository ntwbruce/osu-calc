export var currentDate;
export var currentBg;
export var playerMap = new Map();

export function updateDate(newDate) {
  currentDate = newDate;
}

export function updateBg(newBg) {
  currentBg = newBg;
}

export function updateMap(key, newData) {
  playerMap.set(key, newData);
}
