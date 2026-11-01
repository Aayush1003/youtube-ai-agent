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
  {
    id: "food",
    label: "Food",
    icon: "♨",
    tagline: "Recipes, cooking & ingredients",
    prompt: "Show one easy, flavorful meal a beginner can cook with a few everyday ingredients.",
    colors: ["#2b1d22", "#9b5942", "#f7d287"],
  },
];

const HUMAN_STORY_STARTER = {
  title: "The Note on Dryer Four",
  logline: "One late-night note on a laundromat dryer becomes a quiet conversation between strangers.",
  category: "storytelling",
  format: "short",
  voiceSource: "upload",
  storyStyle: "laundromat-note",
  sources: [],
  scenes: [
    { title: "Dryer Four", caption: "Someone left a note on Dryer Four.", setting: "A laundromat after midnight", visualLabels: ["dryer four", "last cycle"], focusText: "SOMEONE LEFT A NOTE..." },
    { title: "A difficult day", caption: "“If today was hard, you made it here.”", setting: "A tired stranger waiting for laundry", visualLabels: ["paper note", "midnight"], focusText: "IF TODAY WAS HARD,\nYOU STILL MADE IT HERE." },
    { title: "Maya replies", caption: "She turns the paper over. “So did you.”", setting: "One pen. The back of the note.", visualLabels: ["blue ink", "small reply"], focusText: "SO DID YOU." },
    { title: "Someone answers", caption: "By morning: “We made it.”", setting: "The same dryer, a new morning", visualLabels: ["morning light", "new reply"], focusText: "WE MADE IT." },
    { title: "By Friday", caption: "No names. Just proof you aren't alone.", setting: "A paper filled in many handwritings", visualLabels: ["many notes", "Friday"], focusText: "WE MADE IT.\n— SOMEONE ELSE" },
    { title: "Your turn", caption: "The next person is already reaching for the pen.", setting: "A fresh page on Dryer Four", visualLabels: ["fresh page", "your turn"], focusText: "YOUR TURN." },
  ],
  voiceover: "At midnight, someone left a note on Dryer Four: “If today was hard, you still made it here.” Maya found it with wet sleeves, a dead phone, and three minutes left on the cycle. She almost smiled. Then she turned the paper over and wrote, “So did you.” By morning, a stranger had added, “We made it.” On Friday, the scrap was full. No names. No advice. Just little proof that other people were carrying things you couldn’t see. Maya came back for one forgotten sock. The note was gone. A clean sheet sat in its place. She picked up the pen. “Your turn.” The next person was already reaching for it.",
};

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
  HUMAN_STORY_STARTER,
  calculateStreak,
  dateOffset,
  localDateKey,
};
