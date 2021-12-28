import fetch from 'node-fetch';
import { get_token } from './token.js';
import { ppCalc, accFactorCalc, scoreParser } from './scores.js';

const API_URL = 'https://osu.ppy.sh/api/v2';

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

  if (userData.error === null) {
    return {exists: false};
  }

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
  
  return {exists: true, username, userAcc, userRank, userPhoto, userBanner, userNumOfScores, accFactor, scores, selection, totalPP, totalPPNoBonus, bonusPP, isInactive};
  
}