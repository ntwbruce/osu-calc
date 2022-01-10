import { getProfile, setProfile, getBg } from "../logic/data.js";
import { addProfile } from "../logic/profile.js";
import { ppCalc, accCalc, orderDataSets } from '../logic/scores.js';
import { isOnLeaderboard, rankCalc } from '../logic/ranking.js';

/**
 * Redirects POST request based on user ID/username input. 
 * If user submitted a user ID, the osu_id parameter will contain that value.
 * If user submitted a username, the osu_username parameter will contain that value.
 * 
 * @param {*} req is the HTTP request containing user input.
 * @param {*} res is the HTTP response.
 */
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

/**
 * Generates scores page.
 * 
 * @param {*} req is the HTTP request containing user input forwarded by redirect function.
 * @param {*} res is the HTTP response.
 */
export async function generatePage(req, res) {

  var command = req.body.command; // Initialising page, rearranging or deleting scores
  var userIdentifier = req.params.id; // Given user ID or username
  var isScoreRender = true; // Used for when page is to be rendered

  // User scores page is initialised
  if (command === 'init') {
 
    // Skip if redirected from username-based URL (i.e. profile already added)
    if (userIdentifier === req.body.osu_id || userIdentifier === req.body.osu_username) {

      // Save profile data from API in database (if exists), returns boolean based on whether profile exists
      var profileAdded;
      if (userIdentifier === req.body.osu_username) {
        profileAdded = await addProfile(userIdentifier, false);
      } else if (userIdentifier === req.body.osu_id) {
        profileAdded = await addProfile(userIdentifier, true);
      }

      // Redirect to user ID-based URL if userIdentifier is username (i.e. username given by user)
      if (profileAdded.exists) {
        if (userIdentifier === req.body.osu_username) {
          isScoreRender = false;
          res.redirect(307, "/scores/" + profileAdded.userId);
        }

      // Redirect to user not found page if profile does not exist
      } else {
        isScoreRender = false;
        res.redirect("/scores/usernotfound");
      }

    }

  // Score rearrangement based on selected statistic (rank, mods etc.)
  } else if (command === 'arrange') {
    var currentData = getProfile(userIdentifier);
    var newArrangement = req.body.arrangement;
    var currentArrangement = currentData.arrangement;

    // If the new and current arrangements are the same (same stat selected again), reverse the arrangement
    if (newArrangement === currentArrangement) {
      newArrangement = `${newArrangement}-reverse`;
    } 

    // Rearrange the scores by given new arrangement
    var { newScores, newSelection } = orderDataSets(currentData.scores, currentData.selection, newArrangement);

    setProfile(userIdentifier, {
      profile: currentData.profile,
      scores: newScores,
      selection: newSelection,
      arrangement: newArrangement,
      precalculated: currentData.precalculated,
      calculated: currentData.calculated
    });

  // Delete or undelete a score
  } else {
    var changeID = req.body.changeID; // ID of score to delete
    var change = req.body.change; // 'Delete' or 'Undelete'
    var currentData = getProfile(userIdentifier);

    // Obtain updated selection array
    var newSelection = currentData.selection;
    newSelection[changeID] = !(change === 'Delete');

    // Only update main statistics if user is active
    if (!currentData.profile.isInactive) {

      // Obtain updated statistics calculated based on new selection array
      var newPP = ppCalc(currentData.scores, newSelection, currentData.profile.numOfScores) + currentData.precalculated.bonusPP;
      var newAcc;
      var newRank;
      if (currentData.profile.totalPP === newPP) {
        newAcc = currentData.profile.acc;
        newRank = currentData.profile.rank;
      } else {
        newAcc = accCalc(currentData.scores, newSelection, currentData.precalculated.factor, currentData.profile.numOfScores);
        newRank = newIsOnLeaderboard ? rankCalc(newPP) : currentData.calculated.rank;
      }
      
      // Check if rank can be calculated with leaderboards in current ranking data
      var newIsOnLeaderboard = isOnLeaderboard(newPP);

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

  // Render score page with current user details
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
        arrangement: dataToRender.arrangement,
        
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

/**
 * Generates user not found page.
 * 
 * @param {*} req is the HTTP request.
 * @param {*} res is the HTTP response.
 */
export async function notFound(req, res) {
  var currentBg = getBg();
  res.render("usernotfound", { title: "Delete Your Scores", bg: currentBg });
};
