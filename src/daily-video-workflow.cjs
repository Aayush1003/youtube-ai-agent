const DAILY_VIDEO_CATEGORIES = [
  {
    id: "gaming",
    label: "Gaming",
    icon: "⌘",
    tagline: "Tips, challenges & game ideas",
    prompt: "Create a 60-second beginner guide to one clever strategy that helps players think before rushing.",
    colors: ["#15172b", "#714b9d", "#f7ba82"],
  },
  {
    id: "education",
    label: "Education",
    icon: "◇",
    tagline: "Make one big idea click",
    prompt: "Explain one surprising science idea with a simple everyday example for a curious beginner.",
    colors: ["#10232e", "#337a82", "#f0d091"],
  },
  {
    id: "technology",
    label: "Technology",
    icon: "⌁",
    tagline: "Tech, tools & what’s next",
    prompt: "Explain one useful AI feature in plain language and show when it helps—and when it does not.",
    colors: ["#101b38", "#3c5fa0", "#a9c5ff"],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "✧",
    tagline: "Fresh takes & original fun",
    prompt: "Make a playful, original 60-second challenge that viewers can try without special equipment.",
    colors: ["#28162c", "#9d4777", "#ffc589"],
  },
  {
    id: "storytelling",
    label: "Storytelling",
    icon: "✦",
    tagline: "Tiny stories, lasting feelings",
    prompt: "Write a hopeful mini-story about a small act of kindness that changes someone's ordinary day.",
    colors: ["#201933", "#73528d", "#f1b3c2"],
  },
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffset(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function calculateStreak(completedDates, today = localDateKey()) {
  const completed = new Set(completedDates);
  let date = completed.has(today) ? today : dateOffset(today, -1);
  let streak = 0;
  while (completed.has(date)) {
    streak += 1;
    date = dateOffset(date, -1);
  }
  return streak;
}

module.exports = {
  DAILY_VIDEO_CATEGORIES,
  calculateStreak,
  dateOffset,
  localDateKey,
};
