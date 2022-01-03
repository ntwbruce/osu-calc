import { fetchRankingData } from '../ranking.js';
import { fetchBackground } from '../background.js';
import { getDate, setDate, setBg } from '../data.js';

export async function main(req, res) {
  const today = new Date();
  const currentDate = getDate();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    await fetchRankingData();
    setDate(today);
  }
  const currentBg = setBg(fetchBackground());
  const updatedCurrentDate = getDate();
  res.render("index", { title: "Delete Your Scores", date: updatedCurrentDate, bg: currentBg });
};
