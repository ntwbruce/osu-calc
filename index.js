import getApp from './app.js';
import { main } from './routes/site.js';
import { redirect, generatePage, notFound } from './routes/scores.js';

const port = process.env.PORT || "8000";
const app = getApp();

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

app.get("/", main);

app.post("/scores", redirect);
app.post("/scores/:id", generatePage);
app.get("/scores/usernotfound", notFound);
