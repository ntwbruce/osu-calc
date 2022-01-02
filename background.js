import { readdirSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const files = readdirSync(`${__dirname}/public/bg`);

export function fetchBackground() {
  const newBg = files[Math.round(Math.random() * files.length)];
  return `/bg/${newBg}`;
}
