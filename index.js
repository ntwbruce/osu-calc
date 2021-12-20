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

app.get("/", async (req, res) => {
  rankingData = await getRankingData();
  res.render("index", { title: "dumb osu! calculator and shit" });
});

var __username;
var __acc;
var __rank;
var __photo;
var __banner;

var __factor;
var __data;
var __selected;
var __total;
var __totalnb;
var __bonus;

var originalAcc;
var originalPP;
var originalRank;

app.post("/scores-init", async (req, res) => {
  try {
    var subId = req.body.osu_id;
    var profile = await getProfile(subId);

    __username = profile.username;
    __acc = profile.userAcc;
    __rank = profile.userRank;
    __photo = profile.userPhoto;
    __banner = profile.userBanner;

    __factor = profile.accFactor;
    __data = profile.scores;
    __selected = profile.selected;
    __total = profile.totalPP;
    __totalnb = profile.totalPPNoBonus;
    __bonus = profile.bonusPP;

    originalAcc = __acc;
    originalPP = __total;
    originalRank = __rank;

    res.render("scores", { title: "Delete My Scores",
      userProfile: { 
        username: __username, 
        acc: __acc,
        rank: __rank,
        photo: __photo,
        banner: __banner,
        data: __data,
        selected: __selected,
        total: __total,
        totalnb: __totalnb,
        bonus: __bonus,
        oriacc: originalAcc,
        oriPP: originalPP,
        oriRank: originalRank
      }
    });

  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/scores-updated", async (req, res) => {
  try {
    var changeID = req.body.changeID;
    var change = req.body.change;
    __selected[changeID] = !(change === 'delete');
    __totalnb = ppCalc(__data, __selected);
    __total = __totalnb + __bonus;
    if (__total === originalPP) {
      __acc = originalAcc;
      __rank = originalRank;
    } else {
      __acc = accCalc(__data, __selected, __factor);
      __rank = rankCalc(rankingData, __total);
    }

    res.render("scores", { title: "Delete My Scores",
      userProfile: { 
        username: __username, 
        acc: __acc,
        rank: __rank,
        photo: __photo,
        banner: __banner,
        data: __data,
        selected: __selected,
        total: __total,
        totalnb: __totalnb,
        bonus: __bonus,
        oriacc: originalAcc,
        oriPP: originalPP,
        oriRank: originalRank
      }
    });

  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
});
