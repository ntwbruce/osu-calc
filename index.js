import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { getProfile, ppCalc } from './scores.js';

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

app.get("/", (req, res) => {
  res.render("index", { title: "dumb osu! calculator and shit" });
});

var __username;
var __limit;
var __data;
var __selected;
var __total;
var __totalnb;
var __bonus;

app.post("/scores-init", async (req, res) => {
  try {
    var subId = req.body.osu_id;
    var profile = await getProfile(subId);

    __username = profile.username;
    __limit = profile.SCORE_LIMIT; 
    __data = profile.scores;
    __selected = profile.selected;
    __total = profile.totalPP;
    __totalnb = profile.totalPPNoBonus;
    __bonus = profile.bonusPP;

    res.render("scores", { title: "Delete My Scores",
      userProfile: { 
        username: __username, 
        limit: __limit, 
        data: __data,
        selected: __selected,
        total: __total,
        totalnb: __totalnb,
        bonus: __bonus
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

    res.render("scores", { title: "Delete My Scores",
      userProfile: { 
        username: __username, 
        limit: __limit, 
        data: __data,
        selected: __selected,
        total: __total,
        totalnb: __totalnb,
        bonus: __bonus
      }
    });

  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
});

