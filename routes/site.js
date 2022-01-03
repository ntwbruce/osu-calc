import { fetchRankingData } from '../logic/ranking.js';
import { fetchBackground } from '../logic/background.js';
import { getDate, setDate, setBg, getBg } from '../logic/data.js';

export async function main(req, res) {
  const today = new Date();
  const currentDate = getDate();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    await fetchRankingData();
    setDate(today);
  }
  setBg(fetchBackground());
  const updatedCurrentBg = getBg();
  const updatedCurrentDate = getDate();
  res.render("index", { title: "Delete Your Scores", date: updatedCurrentDate, bg: updatedCurrentBg });
};
