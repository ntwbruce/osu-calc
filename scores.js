import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_URL = 'https://osu.ppy.sh/api/v2';
const TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const SCORE_LIMIT = 100;

async function get_token() {
  const body = {
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'grant_type': 'client_credentials',
    'scope': 'public'
  };

  const response = await fetch(TOKEN_URL, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  const data = await response.json();
  return data.access_token;
}

export async function getProfile(osu_id) {

  const token = await get_token();
  const getUserUrl = `${API_URL}/users/${osu_id}/osu?key=id`;
  const userResponse = await fetch(getUserUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const userData = await userResponse.json();
  const username = userData.username;

  const scoresUrl = `${API_URL}/users/${osu_id}/scores/best?mode=osu&limit=${SCORE_LIMIT}`;
  const scoresResponse = await fetch(scoresUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const scoreData = await scoresResponse.json();

  var scores = [];
  var selected = [];
  for (var i = 0; i < SCORE_LIMIT; i++) {
    scores.push([`${scoreData[i].beatmapset.artist} - ${scoreData[i].beatmapset.title} [${scoreData[i].beatmap.version}]`, (Math.round(100 * (scoreData[i].pp + Number.EPSILON)) / 100).toFixed(2)]);
    selected[i] = true;
  }

  var total = ppCalc(scores, selected);

  const totalPP = userData.statistics.pp;
  const totalPPNoBonus = total;
  const bonusPP = Math.round(100 * (userData.statistics.pp - total + Number.EPSILON)) / 100;
  
  return {SCORE_LIMIT, username, scores, selected, totalPP, totalPPNoBonus, bonusPP};
  
}

export function ppCalc(scores, selected) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < SCORE_LIMIT; i++) {
    if (selected[i]) {
      total += scores[i][1] * Math.pow(0.95, index);
      index++;
    }
  }
  return (Math.round(100 * (total + Number.EPSILON)) / 100);
}