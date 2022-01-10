// Values used for rank comparison calculation (for arranging scores by ranks)
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

// Values used for mods comparison calculation (for arranging scores by mods)
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

/**
 * Calculates raw pp value (without bonus) based on current selection of scores.
 * 
 * @param {Object[]} scores from user profile used to calculate total pp.
 * @param {Boolean[]} selection of scores to include in the calculation.
 * @param {Number} limit on the number of scores to use in the calculation.
 * @returns new raw pp value.
 */
export function ppCalc(scores, selection, limit) {
  var total = 0;
  var index = 0;

  // Reorder according to pp value 
  var { newScores, newSelection } = orderDataSets(scores, selection, 'pp');

  for (var i = 0; i < limit; i++) {
    if (newSelection[i]) {
      total += newScores[i].pp * Math.pow(0.95, index);
      index++;
    }
  }
  return total;
}

/**
 * Calculates profile accuracy based on current selection of scores.
 * 
 * @param {Object[]} scores from user profile used to calculate profile accuracy.
 * @param {Boolean[]} selection of scores to include in the calculation.
 * @param {Number} factor precalculated for use in accuracy calculation.
 * @param {Number} limit on the number of scores to use in the calculation.
 * @returns new profile accuracy.
 */
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

/**
 * Calculates profile accuracy factor. 
 * Accuracy calculation uses this profile accuracy factor.
 * For more details why it is necessary and why it is calculated as such, refer to Calculations.md under docs.
 * 
 * @param {Number} userAcc directly from profile.
 * @param {Object[]} scores used in the accuracy factor calculation.
 * @param {Number} limit on the number of scores to use in the calculation.
 * @returns profile accuracy factor.
 */
export function accFactorCalc(userAcc, scores, limit) {
  var total = 0;
  var index = 0;
  for (var i = 0; i < limit; i++) {
    total += scores[i].accuracy * Math.pow(0.95, index);
    index++;
  }
  return Math.log(1 - 5 * (total / userAcc)) / Math.log(0.95);
}

/**
 * Parses score data from API.
 * 
 * @param {Object} score to parse.
 * @returns Object containing values for calculation and display on scores page.
 */
export function scoreParser(score) {
  const map = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`;
  const difficulty = score.beatmap.difficulty_rating;

  var isDifficultyChanged = false;
  var modsString;

  // No mods
  if (score.mods.length === 0) {
    modsString = "NM";

  } else {
    for (var i = 0; i < score.mods.length; i++) {

      // Set boolean if star rating is changed
      if (!isDifficultyChanged && ["EZ", "HR", "DT", "NC", "FL"].includes(score.mods[i])) {
        isDifficultyChanged = true;
      }

      // Create mod string
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

/**
 * Order scores according to given arrangement.
 * 
 * @param {Object[]} scores to be rearranged.
 * @param {Boolean[]} selection array to be rearranged.
 * @param {String} arrangement by which to reorder scores.
 * @returns Object with both updated score and selection arrays.
 */
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

/**
 * Compares two scores based on rank.
 * 
 * @param {Object} firstScore 
 * @param {Object} secondScore 
 * @returns value for use by array sort method.
 */
function compareRanks(firstScore, secondScore) {
  return ranks[firstScore.score.rank] - ranks[secondScore.score.rank];
}

/**
 * Compares two scores based on mods.
 * 
 * @param {Object} firstScore 
 * @param {Object} secondScore 
 * @returns value for use by array sort method.
 */
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
