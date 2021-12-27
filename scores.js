import fetch from "node-fetch";
import dotenv from "dotenv";
import { get_token } from "./token.js";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';

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

  // Get user profile details
  const username = userData.username;
  const userAcc = userData.statistics.hit_accuracy;
  const userRank = userData.statistics.global_rank;
  const userPhoto = userData.avatar_url;
  const userBanner = userData.cover_url;
  const userNumOfScores = userData.scores_best_count;

  // Get data of user's 100 best scores
  const scoresUrl = `${API_URL}/users/${osu_id}/scores/best?mode=osu&limit=${userNumOfScores}`;
  const scoresResponse = await fetch(scoresUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const scoreData = await scoresResponse.json();

  // Initialise arrays containing score details and which scores are being excluded from calculation
  // For the 'Delete My Scores' calculator, selection array is updated when user 'deletes' or 'undeletes' map
  var scores = [];
  var selection = [];
  for (var i = 0; i < userNumOfScores; i++) {
    scores.push(scoreParser(scoreData[i]));
    selection[i] = true;
  }

  // Calculate pp components and profile accuracy factor
  const accFactor = accFactorCalc(userAcc, scores, userNumOfScores);
  var totalPP;
  var totalPPNoBonus;
  var bonusPP;
  var isInactive;
  if (userRank) {
    totalPP = userData.statistics.pp;
    totalPPNoBonus = ppCalc(scores, selection, userNumOfScores);
    bonusPP = totalPP - totalPPNoBonus;
    isInactive = false;
  } else {
    totalPP = totalPPNoBonus = bonusPP = 0;
    isInactive = true;
  }
  
  return {username, userAcc, userRank, userPhoto, userBanner, userNumOfScores, accFactor, scores, selection, totalPP, totalPPNoBonus, bonusPP, isInactive};
  
}

export function ppCalc(scores, selection, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    if (selection[i]) {
      total += scores[i].pp * Math.pow(0.95, index);
      index++;
    }
  }
  return total;
}

export function accCalc(scores, selection, factor, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    if (selection[i]) {
      total += scores[i].accuracy * Math.pow(0.95, index);
      index++;
    }
  }
  return total * 100 / (20 * (1 - Math.pow(0.95, factor)));
}

function accFactorCalc(userAcc, scores, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
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

  var isDifficultyChanged = false;
  var modsString;
  if (score.mods.length === 0) {
    modsString = "NM";
  } else {
    for (var i = 0; i < score.mods.length; i++) {
      if (!isDifficultyChanged && ["EZ", "HR", "DT", "NC", "FL"].includes(score.mods[i])) {
        isDifficultyChanged = true;
      }
      if (i === 0) {
        modsString = `${score.mods[i]}`;
      } else {
        modsString += `, ${score.mods[i]}`;
      }
    }
  }
  const mods = modsString;

  const accuracy = score.accuracy;
  const rank = score.rank;
  const pp = score.pp;

  return {map, difficulty, mods, accuracy, rank, pp, isDifficultyChanged};
}