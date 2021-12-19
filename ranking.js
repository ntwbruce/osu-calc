import fetch from "node-fetch";
import dotenv from "dotenv";
import { get_token } from "./token.js";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';

export async function getRankingData() {

  // Get OAuth token
  const token = await get_token();

  var data = [];

  for (var i = 0; i < 200; i++) {
    data[i] = i;
  }

  // asynchronously pull data from 200 pages of Singapore country ranking (holy shit it took me so long to realise i could just use Promise.all)
  await Promise.all(data.map(async (i) => {
    const getPageUrl = `${API_URL}/rankings/osu/performance?country=SG&page=${i + 1}#scores`;
    const pageResponse = await fetch(getPageUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const pageData = await pageResponse.json();
    data[i] = pageData.ranking;
  }))

  return data;
}

export function rankCalc(data, pp) {
  var pageLow = 0;
  var pageHigh = 199;
  var pageMid;
  var indexLow = 0;
  var indexHigh = 49;
  var indexMid;

  while (pageLow < pageHigh) {
    pageMid = pageLow + Math.floor((pageHigh - pageLow) / 2);
    if (data[pageMid][indexLow].pp < pp) {
      pageHigh = pageMid - 1;
    } else if (data[pageMid][indexHigh].pp > pp) {
      pageLow = pageMid + 1;
    } else {
      pageLow = pageMid;
      pageHigh = pageMid;
    }
  }

  while (indexLow < indexHigh) {
    indexMid = indexLow + Math.floor((indexHigh - indexLow) / 2);
    if (data[pageLow][indexMid].pp < pp) {
      indexHigh = indexMid - 1;
    } else {
      indexLow = indexMid + 1;
    }
  }
  const approxRank = data[pageLow][indexLow].global_rank;
  return approxRank;
}

