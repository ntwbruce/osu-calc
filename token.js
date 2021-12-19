import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

/**
 * Gets OAuth token from osu.ppy.sh.
 *
 * @returns String representing API access token.
 */
export async function get_token() {
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