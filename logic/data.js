var currentDate;
var currentBg;
var profileMap = new Map();
var rankingData;

export function getDate() {
  return currentDate;
}

export function setDate(newDate) {
  currentDate = newDate;
}

export function getBg() {
  return currentBg;
}

export function setBg(newBg) {
  currentBg = newBg;
}

export function getProfile(key) {
  return profileMap.get(key);
}

export function setProfile(key, newData) {
  profileMap.set(key, newData);
}

export function getRankingData() {
  return rankingData;
}

export function setRankingData(newData) {
  rankingData = newData;
}
