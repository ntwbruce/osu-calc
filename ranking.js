import fetch from "node-fetch";
import dotenv from "dotenv";
import { get_token } from "./token.js";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';

export async function getRankingData() {

  // Get OAuth token
  const token = await get_token();

  var countryData = [];
  var globalData = [];

  for (var i = 0; i < 200; i++) {
    countryData[i] = globalData[i] = i;
  }

  // asynchronously pull data from 200 pages of Singapore country ranking (holy shit it took me so long to realise i could just use Promise.all)
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

  return { countryData, globalData };
}

export function rankCalc(country, global, pp) {
  var pageLow = 0;
  var pageHigh = 199;
  var pageMid;
  var indexLow = 0;
  var indexHigh = 49;
  var indexMid;

  var leaderboardUsed = (global[pageHigh][indexHigh].pp < pp) ? global : country;

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

  while (indexLow < indexHigh) {
    indexMid = indexLow + Math.floor((indexHigh - indexLow) / 2);
    if (leaderboardUsed[pageLow][indexMid].pp < pp) {
      indexHigh = indexMid - 1;
    } else {
      indexLow = indexMid + 1;
    }
  }
  const approxRank = leaderboardUsed[pageLow][indexLow].global_rank;
  return approxRank;
}

