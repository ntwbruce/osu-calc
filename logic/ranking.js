import fetch from 'node-fetch';
import { get_token } from './token.js';
import { setRankingData, getRankingData } from './data.js';

const API_URL = 'https://osu.ppy.sh/api/v2';

/**
 * Obtains fresh ranking data from API.
 */
export async function fetchRankingData() {

  // Get OAuth token
  const token = await get_token();

  var countryData = [];
  var globalData = [];

  for (var i = 0; i < 200; i++) {
    countryData[i] = globalData[i] = i;
  }

  // Obtain rank and performance data from SG country leaderboard and global leaderboard
  await Promise.all(
  countryData.map(async (i) => {
    const getPageUrl = `${API_URL}/rankings/osu/performance?country=SG&page=${i + 1}#scores`;
    const pageResponse = await fetch(getPageUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const pageData = await pageResponse.json();
    countryData[i] = pageData.ranking;
  }),
  globalData.map(async (i) => {
    const getPageUrl = `${API_URL}/rankings/osu/performance?page=${i + 1}#scores`;
    const pageResponse = await fetch(getPageUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const pageData = await pageResponse.json();
    globalData[i] = pageData.ranking;
  }));

  setRankingData({ countryData, globalData });
}

/**
 * Estimates a global rank from the given pp value.
 * 
 * @param {Number} pp used to calculate rank.
 * @returns approximate global rank.
 */
export function rankCalc(pp) {
  const rankingData = getRankingData();

  var pageLow = 0;
  var pageHigh = 199;
  var pageMid;
  var indexLow = 0;
  var indexHigh = 49;
  var indexMid;

  // If pp value can be found on global leaderboard, use global leaderboard for more precise rank calculation. Else, use SG leaderboard.
  var leaderboardUsed = (rankingData.globalData[pageHigh][indexHigh].pp < pp) ? rankingData.globalData : rankingData.countryData;

  // Find correct page
  while (pageLow < pageHigh) {
    pageMid = pageLow + Math.floor((pageHigh - pageLow) / 2);
    if (leaderboardUsed[pageMid][indexLow].pp < pp) {
      pageHigh = pageMid - 1;
    } else if (leaderboardUsed[pageMid][indexHigh].pp > pp) {
      pageLow = pageMid + 1;
    } else {
      pageLow = pageMid;
      pageHigh = pageMid;
    }
  }

  // Find user with closest pp, get their rank
  while (indexLow < indexHigh) {
    indexMid = indexLow + Math.floor((indexHigh - indexLow) / 2);
    if (leaderboardUsed[pageLow][indexMid].pp < pp) {
      indexHigh = indexMid;
    } else {
      indexLow = indexMid + 1;
    }
  }

  // Minus one rank (that being the user's original position on the leaderboard)
  const approxRank = leaderboardUsed[pageLow][indexLow].global_rank - 1;
  return approxRank;
}

/**
 * Checks if pp value can be found on leaderboards.
 * 
 * @param {Number} pp to calculate rank with.
 * @returns true if pp value is on leaderboards.
 */
export function isOnLeaderboard(pp) {
  const rankingData = getRankingData();
  return rankingData.countryData[199][49].pp <= pp;
}

