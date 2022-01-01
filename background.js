export function fetchBackground() {
  return `/bg/${Math.round(Math.random() * 16)}.jpg`;
}

