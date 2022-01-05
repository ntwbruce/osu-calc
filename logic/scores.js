const ranks = {
  'SS+': 0,
  'SS': 1,
  'S+': 2,
  'S': 3,
  'A': 4, 
  'B': 5, 
  'C': 6,
  'D': 7
};

const mods = {
  'EZ': 0.51,
  'NF': 0.5,
  'HT': 0.3,
  'HR': 1.09,
  'SD': 1.01, 
  'PF': 1.02, 
  'DT': 1.181,
  'NC': 1.18,
  'HD': 1.06, 
  'FL': 1.13, 
  'SO': 0.9,
  'NM': 1
};

export function ppCalc(scores, selection, limit) {
  var total = 0;
  var index = 0;
  var { newScores, newSelection } = orderDataSets(scores, selection, 'pp');
  for (var i = 0; i < limit; i++) {
    if (newSelection[i]) {
      total += newScores[i].pp * Math.pow(0.95, index);
      index++;
    }
  }
  return total;
}

export function accCalc(scores, selection, factor, limit) {
  var total = 0;
  var index = 0;
  var { newScores, newSelection } = orderDataSets(scores, selection, 'pp');
  for (var i = 0; i < limit; i++) {
    if (newSelection[i]) {
      total += newScores[i].accuracy * Math.pow(0.95, index);
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

export function orderDataSets(scores, selection, arrangement) {
  var newScores = [];
  var newSelection = [];
  var workingArr = [];
  for (var i = 0; i < scores.length; i++) {
    workingArr.push({score: scores[i], isSelected: selection[i]});
  }
  switch(arrangement) {
    case 'mods':
      workingArr.sort((a, b) => compareMods(b, a));
      break;
    case 'mods-reverse':
      workingArr.sort((a, b) => compareMods(a, b));
      break;
    case 'acc':
      workingArr.sort((a, b) => b.score.accuracy - a.score.accuracy);
      break;
    case 'acc-reverse':
      workingArr.sort((a, b) => a.score.accuracy - b.score.accuracy);
      break;
    case 'rank':
      workingArr.sort((a, b) => compareRanks(a, b));
      break;
    case 'rank-reverse':
      workingArr.sort((a, b) => compareRanks(b, a));
      break;
    case 'pp':
      workingArr.sort((a, b) => b.score.pp - a.score.pp);
      break;
    case 'pp-reverse':
      workingArr.sort((a, b) => a.score.pp - b.score.pp);
      break;
  }

  for (var i = 0; i < workingArr.length; i++) {
    newScores[i] = workingArr[i].score;
    newSelection[i] = workingArr[i].isSelected;
  }

  return { newScores, newSelection };

}

function compareRanks(firstScore, secondScore) {
  return ranks[firstScore.score.rank] - ranks[secondScore.score.rank];
}

function compareMods(firstScore, secondScore) {
  var firstScoreMods = firstScore.score.mods.split(', ');
  var secondScoreMods = secondScore.score.mods.split(', ');
  var firstScoreMultiplier = 1;
  var secondScoreMultiplier = 1;
  for (var i = 0; i < firstScoreMods.length; i++) {
    firstScoreMultiplier *= mods[firstScoreMods[i]];
  }
  for (var i = 0; i < secondScoreMods.length; i++) {
    secondScoreMultiplier *= mods[secondScoreMods[i]];
  }
  return firstScoreMultiplier - secondScoreMultiplier;
}
