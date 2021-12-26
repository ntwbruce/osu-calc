import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { getProfile, ppCalc, accCalc } from './scores.js';
import { getRankingData, rankCalc } from './ranking.js';

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

var rankingData;
var currentDate;

app.get("/", async (req, res) => {
  var today = new Date();
  if (!(currentDate instanceof Date) || currentDate.getFullYear() != today.getFullYear() || currentDate.getMonth() != today.getMonth() || currentDate.getDate() != today.getDate()) {
    rankingData = await getRankingData();
    currentDate = today;
  }
  res.render("index", { title: "dumb osu! calculator and shit", date: currentDate });
});

var playerMap = new Map();

app.post("/scores", async (req, res) => {
  try {
    res.redirect(307, "/scores/" + req.body.osu_id);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/scores/:id(\\d+)", async (req, res) => {

  var isInit = req.body.init;
  var currentUserId = req.body.osu_id;

  if (isInit) {

    var profile = await getProfile(currentUserId);

    playerMap.set(currentUserId, {
      profile: {
        username: profile.username,
        acc: profile.userAcc,
        rank: profile.userRank,
        totalPP: profile.totalPP,
        photo: profile.userPhoto,
        banner: profile.userBanner
      },
      scores: profile.scores,
      selection: profile.selection,
      precalculated: {
        factor: profile.accFactor,
        bonusPP: profile.bonusPP
      },
      calculated: {
        acc: profile.userAcc,
        totalPP: profile.totalPP,
        rank: profile.userRank
      }
    });

  } else {

    var changeID = req.body.changeID;
    var change = req.body.change;
    var currentData = playerMap.get(currentUserId);

    var newSelection = currentData.selection;
    newSelection[changeID] = !(change === 'delete');

    var newPP = ppCalc(currentData.scores, newSelection) + currentData.precalculated.bonusPP;

    var newAcc;
    var newRank;
    if (currentData.profile.totalPP === newPP) {
      newAcc = currentData.profile.acc;
      newRank = currentData.profile.rank;
    } else {
      newAcc = accCalc(currentData.scores, newSelection, currentData.precalculated.factor);
      newRank = rankCalc(rankingData, newPP);
    }

    var newSavedData = {
      profile: currentData.profile,
      scores: currentData.scores,
      selection: newSelection,
      precalculated: currentData.precalculated,
      calculated: {
        acc: newAcc,
        totalPP: newPP,
        rank: newRank
      }
    };

    playerMap.set(currentUserId, newSavedData);

  }

  var dataToRender = playerMap.get(currentUserId);

  res.render("scores", { title: "Delete My Scores",
    userProfile: { 
      userid: currentUserId,

      username: dataToRender.profile.username,
      oriacc: dataToRender.profile.acc,
      oriRank: dataToRender.profile.rank,
      oriPP: dataToRender.profile.totalPP,
      photo: dataToRender.profile.photo,
      banner: dataToRender.profile.banner,
      
      data: dataToRender.scores,
      selection: dataToRender.selection,
      
      bonus: dataToRender.precalculated.bonusPP,

      acc: dataToRender.calculated.acc,
      total: dataToRender.calculated.totalPP,
      rank: dataToRender.calculated.rank,
      
    }
  });
});
