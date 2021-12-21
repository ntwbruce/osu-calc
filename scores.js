import fetch from "node-fetch";
import dotenv from "dotenv";
import { get_token } from "./token.js";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';
const SCORE_LIMIT = 100;

/**
 * Obtains details of profile with specified ID required for subsequent calculations.
 *
 * @param {*} osu_id used to obtain profile details.
 * @returns object containing profile details used in calculations later.
 */
export async function getProfile(osu_id) {

  // Get OAuth token
  const token = await get_token();

  // Get user data
  const getUserUrl = `${API_URL}/users/${osu_id}/osu?key=id`;
  const userResponse = await fetch(getUserUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const userData = await userResponse.json();

  // Get username and profile accuracy from user data
  const username = userData.username;
  const userAcc = userData.statistics.hit_accuracy;
  const userRank = userData.statistics.global_rank;
  const userPhoto = userData.avatar_url;
  const userBanner = userData.cover_url;

  // Get data of user's 100 best scores
  const scoresUrl = `${API_URL}/users/${osu_id}/scores/best?mode=osu&limit=${SCORE_LIMIT}`;
  const scoresResponse = await fetch(scoresUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const scoreData = await scoresResponse.json();

  // Initialise arrays containing score details and which scores are being excluded from calculation
  // For the 'Delete My Scores' calculator, selected array is updated when user 'deletes' or 'undeletes' map
  var scores = [];
  var selected = [];
  for (var i = 0; i < SCORE_LIMIT; i++) {
    scores.push(scoreParser(scoreData[i]));
    selected[i] = true;
  }

  // Calculate pp components and profile accuracy factor
  const accFactor = accFactorCalc(userAcc, scores);
  const totalPPNoBonus = ppCalc(scores, selected);
  const totalPP = userData.statistics.pp;
  const bonusPP = totalPP - totalPPNoBonus;
  
  return {username, userAcc, userRank, userPhoto, userBanner, accFactor, scores, selected, totalPP, totalPPNoBonus, bonusPP};
  
}

/**
 * Returns total pp from a selected set of scores.
 *
 * @param {*} scores with which pp is calculated.
 * @param {*} selected scores to calculate total pp with. If a score is 'deleted' by user, represented as false in selected array, and vice versa.
 * @returns total pp from the selected set of scores.
 */
export function ppCalc(scores, selected) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < SCORE_LIMIT; i++) {
    if (selected[i]) {
      total += scores[i].pp * Math.pow(0.95, index);
      index++;
    }
  }
  return total;
}


/**
 * Returns overall accuracy from a selected set of scores with specified profile accuracy factor.
 *
 * @param {*} scores with which overall accuracy is calculated.
 * @param {*} selected scores to calculate overall accuracy with. If a score is 'deleted' by user, represented as false in selected array, and vice versa.
 * @param {*} factor used to calculate overall accuracy (explained in accFactorCalc below).
 * @returns overall profile accuracy.
 */
export function accCalc(scores, selected, factor) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < SCORE_LIMIT; i++) {
    if (selected[i]) {
      total += scores[i].accuracy * Math.pow(0.95, index);
      index++;
    }
  }
  return total * 100 / (20 * (1 - Math.pow(0.95, factor)));
}

/**
 * Calculates the value of a factor required in the calculation of overall profile accuracy.
 * 
 * @param {*} userAcc 
 * @param {*} scores with which overall accuracy is calculated.
 * @returns factor used in accCalc.
 */
function accFactorCalc(userAcc, scores) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < SCORE_LIMIT; i++) {
    total += scores[i].accuracy * Math.pow(0.95, index);
    index++;
  }
  return Math.log(1 - 5 * (total / userAcc)) / Math.log(0.95);
}

/**
 * Parses a score and returns an object containing a given score's various values.
 * @param {*} score whose values are parsed and returned.
 * @returns an object containing a given score's various values.
 */
function scoreParser(score) {
  const map = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`;
  const difficulty = score.beatmap.difficulty_rating;

  var modsString;
  if (score.mods.length === 0) {
    modsString = "NM";
  } else {
    modsString = score.mods[0];
    for (var i = 1; i < score.mods.length; i++) {
      modsString += `, ${score.mods[i]}`
    }
  }
  const mods = modsString;

  const accuracy = score.accuracy;
  const rank = score.rank;
  const pp = score.pp;

  return {map, difficulty, mods, accuracy, rank, pp};
}