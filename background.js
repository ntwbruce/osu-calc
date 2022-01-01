export function fetchBackground() {
  return `/bg/${Math.round(Math.random() * 15)}.jpg`;
}

