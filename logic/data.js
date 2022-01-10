var currentDate;
var currentBg;
var profileMap = new Map();
var rankingData;

/**
 * Gets current saved date.
 * 
 * @returns current date.
 */
export function getDate() {
  return currentDate;
}

/**
 * Set a new date.
 * 
 * @param {Date} newDate 
 */
export function setDate(newDate) {
  currentDate = newDate;
}

/**
 * Gets current saved background.
 * 
 * @returns current background.
 */
export function getBg() {
  return currentBg;
}

/**
 * Set a new background.
 * 
 * @param {String} newBg Path to the new background.
 */
export function setBg(newBg) {
  currentBg = newBg;
}

/**
 * Obtains profile data from given ID.
 * 
 * @param {String} key Given user ID.
 * @returns profile data corresponding to given ID.
 */
export function getProfile(key) {
  return profileMap.get(key);
}

/**
 * Adds or updates profile data with the given ID.
 * 
 * @param {String} key Given user ID.
 * @param {Object} newData to save with given user ID.
 */
export function setProfile(key, newData) {
  profileMap.set(key, newData);
}

/**
 * Gets ranking data.
 * 
 * @returns ranking data.
 */
export function getRankingData() {
  return rankingData;
}

/**
 * Sets new ranking data obtained from API.
 * 
 * @param {Object} newData obtained from API.
 */
export function setRankingData(newData) {
  rankingData = newData;
}
