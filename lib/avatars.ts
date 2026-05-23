// Pre-made avatar set. Add more as you go — start with emoji to ship fast,
// swap to SVG icons (lucide-react, heroicons) once the rest of the app works.

export interface Avatar {
  id: string;
  emoji: string;
  label: string;
}

export const AVATARS: Avatar[] = [
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "bear", emoji: "🐻", label: "Bear" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "frog", emoji: "🐸", label: "Frog" },
  { id: "monkey", emoji: "🐵", label: "Monkey" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn" },
  { id: "dragon", emoji: "🐲", label: "Dragon" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "alien", emoji: "👽", label: "Alien" },
  { id: "ghost", emoji: "👻", label: "Ghost" },
  { id: "pizza", emoji: "🍕", label: "Pizza" },
  { id: "taco", emoji: "🌮", label: "Taco" },
  { id: "rocket", emoji: "🚀", label: "Rocket" },
];

export const AVATAR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];
