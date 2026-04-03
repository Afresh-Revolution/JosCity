export const REEL_CATEGORIES = [
  "Causes",
  "Art",
  "Crafts",
  "Dance",
  "Drinks",
  "Films",
  "Fitness",
  "Food",
  "Game",
  "Party",
  "Health",
  "Sport",
  "Literature",
  "Music",
  "Religion",
  "Others",
] as const;

export type ReelCategory = (typeof REEL_CATEGORIES)[number];
