import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { ppCalc, accCalc } from './scores.js';
import { fetchRankingData, isOnLeaderboard, rankCalc } from './ranking.js';
import { addProfile } from './profile.js';
import { fetchBackground } from './background.js';

const app = express();
const port = process.env.PORT || "8000";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

var currentDate;
var currentBackground;

app.get("/", async (req, res) => {
  var today = new Date();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    await fetchRankingData();
    currentDate = today;
  }
  currentBackground = fetchBackground();
  res.render("index", { title: "Delete Your Scores", date: currentDate, bg: currentBackground });
});

var playerMap = new Map();

app.post("/scores", async (req, res) => {
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
});

app.post("/scores/:id", async (req, res) => {

  var isInit = req.body.init;
  var userIdentifier = req.params.id;
  var isScoreRender = true;

  if (isInit) {

    if (userIdentifier === req.body.osu_id || userIdentifier === req.body.osu_username) {

      var profileAdded;
      if (userIdentifier === req.body.osu_username) {
        profileAdded = await addProfile(userIdentifier, false, playerMap);
      } else if (userIdentifier === req.body.osu_id) {
        profileAdded = await addProfile(userIdentifier, true, playerMap);
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

  } else {
    var changeID = req.body.changeID;
    var change = req.body.change;
    var currentData = playerMap.get(userIdentifier);

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

      playerMap.set(userIdentifier, {
        profile: currentData.profile,
        scores: currentData.scores,
        selection: newSelection,
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
    var dataToRender = playerMap.get(userIdentifier);

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
      bg: currentBackground
    });
  }
});

app.get("/scores/usernotfound", async (req, res) => {
  res.render("usernotfound", { title: "Delete Your Scores", bg: currentBackground });
});
