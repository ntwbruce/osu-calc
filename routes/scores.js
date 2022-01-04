import { getProfile, setProfile, getBg } from "../logic/data.js";
import { addProfile } from "../logic/profile.js";
import { ppCalc, accCalc, orderDataSets } from '../logic/scores.js';
import { isOnLeaderboard, rankCalc } from '../logic/ranking.js';

export async function redirect(req, res) {
  try {
    if (req.body.osu_id) {
      res.redirect(307, "/scores/" + req.body.osu_id);
    } else {
      res.redirect(307, "/scores/" + req.body.osu_username);
    }
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
};

export async function generatePage(req, res) {

  var command = req.body.command;
  var userIdentifier = req.params.id;
  var isScoreRender = true;

  if (command === 'init') {

    if (userIdentifier === req.body.osu_id || userIdentifier === req.body.osu_username) {

      var profileAdded;
      if (userIdentifier === req.body.osu_username) {
        profileAdded = await addProfile(userIdentifier, false);
      } else if (userIdentifier === req.body.osu_id) {
        profileAdded = await addProfile(userIdentifier, true);
      }

      if (profileAdded.exists) {
        if (userIdentifier === req.body.osu_username) {
          isScoreRender = false;
          res.redirect(307, "/scores/" + profileAdded.userId);
        }
      } else {
        isScoreRender = false;
        res.redirect("/scores/usernotfound");
      }

    }

  } else if (command === 'arrange') {
    var newArrangement = req.body.arrangement;
    var currentData = getProfile(userIdentifier);
    var currentArrangement = currentData.arrangement;
    if (newArrangement === currentArrangement) {
      newArrangement = `${newArrangement}-reverse`;
    } 
    var { newScores, newSelection } = orderDataSets(currentData.scores, currentData.selection, newArrangement);

    setProfile(userIdentifier, {
      profile: currentData.profile,
      scores: newScores,
      selection: newSelection,
      arrangement: newArrangement,
      precalculated: currentData.precalculated,
      calculated: currentData.calculated
    });

  } else {
    var changeID = req.body.changeID;
    var change = req.body.change;
    var currentData = getProfile(userIdentifier);

    var newSelection = currentData.selection;
    newSelection[changeID] = !(change === 'delete');

    if (!currentData.profile.isInactive) {

      var newPP = ppCalc(currentData.scores, newSelection, currentData.profile.numOfScores) + currentData.precalculated.bonusPP;
      var newIsOnLeaderboard = isOnLeaderboard(newPP);
      var newAcc;
      var newRank;
      if (currentData.profile.totalPP === newPP) {
        newAcc = currentData.profile.acc;
        newRank = currentData.profile.rank;
      } else {
        newAcc = accCalc(currentData.scores, newSelection, currentData.precalculated.factor, currentData.profile.numOfScores);
        newRank = newIsOnLeaderboard ? rankCalc(newPP) : currentData.calculated.rank;
      }

      setProfile(userIdentifier, {
        profile: currentData.profile,
        scores: currentData.scores,
        selection: newSelection,
        arrangement: currentData.arrangement,
        precalculated: currentData.precalculated,
        calculated: {
          acc: newAcc,
          totalPP: newPP,
          rank: newRank,
          isOnLeaderboard: newIsOnLeaderboard
        }
      });
    }
  }

  if (isScoreRender) {
    var dataToRender = getProfile(userIdentifier);
    var currentBg = getBg();

    res.render("scores", { title: "Delete Your Scores",
      userProfile: { 
        userid: userIdentifier,

        username: dataToRender.profile.username,
        oriacc: dataToRender.profile.acc,
        oriRank: dataToRender.profile.rank,
        oriPP: dataToRender.profile.totalPP,
        photo: dataToRender.profile.photo,
        banner: dataToRender.profile.banner,
        flag: dataToRender.profile.flag,
        isInactive: dataToRender.profile.isInactive,
        
        data: dataToRender.scores,
        selection: dataToRender.selection,
        
        bonus: dataToRender.precalculated.bonusPP,

        acc: dataToRender.calculated.acc,
        total: dataToRender.calculated.totalPP,
        rank: dataToRender.calculated.rank,
        isOnLeaderboard: dataToRender.calculated.isOnLeaderboard
        
      },
      bg: currentBg
    });
  }
};

export async function notFound(req, res) {
  var currentBg = getBg();
  res.render("usernotfound", { title: "Delete Your Scores", bg: currentBg });
};
