export function ppCalc(scores, selection, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    if (selection[i]) {
      total += scores[i].pp * Math.pow(0.95, index);
      index++;
    }
  }
  return total;
}

export function accCalc(scores, selection, factor, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    if (selection[i]) {
      total += scores[i].accuracy * Math.pow(0.95, index);
      index++;
    }
  }
  return total * 100 / (20 * (1 - Math.pow(0.95, factor)));
}

export function accFactorCalc(userAcc, scores, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    total += scores[i].accuracy * Math.pow(0.95, index);
    index++;
  }
  return Math.log(1 - 5 * (total / userAcc)) / Math.log(0.95);
}

export function scoreParser(score) {
  const map = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`;
  const difficulty = score.beatmap.difficulty_rating;

  var isDifficultyChanged = false;
  var modsString;
  if (score.mods.length === 0) {
    modsString = "NM";
  } else {
    for (var i = 0; i < score.mods.length; i++) {
      if (!isDifficultyChanged && ["EZ", "HR", "DT", "NC", "FL"].includes(score.mods[i])) {
        isDifficultyChanged = true;
      }
      if (i === 0) {
        modsString = `${score.mods[i]}`;
      } else {
        modsString += `, ${score.mods[i]}`;
      }
    }
  }
  const mods = modsString;

  const accuracy = score.accuracy;
  const rank = (score.rank === 'SH') ? 'S+' 
             : (score.rank === 'X') ? 'SS' 
             : (score.rank === 'XH') ? 'SS+' 
             : score.rank;
  const pp = score.pp;
  const bg = score.beatmapset.covers.cover;

  return {map, difficulty, mods, accuracy, rank, pp, isDifficultyChanged, bg};
}