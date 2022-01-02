import { fetchRankingData } from '../ranking.js';
import { fetchBackground } from '../background.js';
import { currentBg, currentDate, updateBg, updateDate } from '../data.js';

export async function main(req, res) {
  var today = new Date();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    await fetchRankingData();
    updateDate(today);
  }
  updateBg(fetchBackground());
  res.render("index", { title: "Delete Your Scores", date: currentDate, bg: currentBg });
};
