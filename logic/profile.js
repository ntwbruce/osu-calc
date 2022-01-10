import fetch from 'node-fetch';
import { get_token } from './token.js';
import { ppCalc, accFactorCalc, scoreParser } from './scores.js';
import { isOnLeaderboard } from './ranking.js';
import { setProfile } from './data.js'

const API_URL = 'https://osu.ppy.sh/api/v2';

/**
 * Adds a profile to the database.
 * 
 * @param {String} userIdentifier User ID or username.
 * @param {Boolean} isById identifies if userIdentifier is a user ID or username.
 * @returns an Object with parameter for profile existence, and if it does, another parameter for user ID.
 */
export async function addProfile(userIdentifier, isById) {

  // Get OAuth token
  const token = await get_token();

  // Get user data
  const getUserUrl = isById ? `${API_URL}/users/${userIdentifier}/osu?key=id` : `${API_URL}/users/${userIdentifier}/osu?key=username`;
  const userResponse = await fetch(getUserUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const userData = await userResponse.json();

  // Returns object with false exists parameter if profile does not exist
  if (userData.error === null) {
    return {exists: false};
  }

  // Get user profile details
  const userId = isById ? userIdentifier : userData.id;
  const username = userData.username;
  const userAcc = userData.statistics.hit_accuracy;
  const userRank = userData.statistics.global_rank;
  const userPhoto = userData.avatar_url;
  const userBanner = userData.cover_url;
  const userNumOfScores = userData.scores_best_count;
  const userFlag = `https://okfn.org/assets/img/flags/svg/flag-${userData.country_code.toLowerCase()}.svg`;

  // Get data of user's top scores
  const scoresUrl = `${API_URL}/users/${userId}/scores/best?mode=osu&limit=${userNumOfScores}`;
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

  // Obtain required values for further calculation (when deleting, undeleting)
  const accFactor = accFactorCalc(userAcc, scores, userNumOfScores);
  var totalPP;
  var totalPPNoBonus;
  var bonusPP;
  
  // if userRank is null, profile is inactive
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

  // Check if rank calculations are possible
  const onLeaderboard = isOnLeaderboard(totalPP);
  
  setProfile(userId.toString(), {
    profile: {
      username: username,
      acc: userAcc,
      rank: userRank,
      totalPP: totalPP,
      photo: userPhoto,
      banner: userBanner,
      numOfScores: userNumOfScores,
      flag: userFlag,
      isInactive: isInactive
    },
    scores: scores,
    selection: selection,
    arrangement: 'pp',
    precalculated: {
      factor: accFactor,
      bonusPP: bonusPP
    },
    calculated: {
      acc: userAcc,
      totalPP: totalPP,
      rank: userRank,
      isOnLeaderboard: onLeaderboard
    }
  });

  return {exists: true, userId: userId};
}
