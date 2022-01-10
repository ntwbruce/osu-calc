import { fetchRankingData } from '../logic/ranking.js';
import { fetchBackground } from '../logic/background.js';
import { getDate, setDate, setBg, getBg } from '../logic/data.js';

/**
 * Renders main page.
 * 
 * @param {Object} req is the HTTP request.
 * @param {Object} res is the HTTP response.
 */
export async function main(req, res) {
  // Fetch ranking data at 12am daily
  const today = new Date();
  const currentDate = getDate();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    await fetchRankingData();
    setDate(today);
  }

  // Get new background on every visit to the main page
  setBg(fetchBackground());

  const updatedCurrentBg = getBg();
  const updatedCurrentDate = getDate();
  res.render("index", { title: "Delete Your Scores", date: updatedCurrentDate, bg: updatedCurrentBg });
};
