import fetch from "node-fetch";
import dotenv from "dotenv";
import { get_token } from "./token.js";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';

export async function getRankingData() {

  // Get OAuth token
  const token = await get_token();

  var data = [];

  for (var i = 0; i < 50; i++) {
    data[i] = i;
  }

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

