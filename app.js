import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

export default function() {
  const app = express();
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  app.use(express.static(path.join(__dirname, "public")));
  app.use(bodyParser.urlencoded({ extended: true }));

  return app;
}
