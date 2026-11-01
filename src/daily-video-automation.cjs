const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const TIME_ZONE = "Asia/Kolkata";
const SCHEDULE_HOUR = 9;
const CHANNEL_HANDLE = "@EngineerAayushGupta";
const ENGINEERING_TOPICS = [
  "explain how an API request and response work using a familiar college canteen example",
  "teach beginners how to read a Java stack trace and find the first useful line",
  "compare SQL databases and spreadsheets with a practical student-project example",
  "explain recursion with a simple everyday analogy and show why the base case matters",
  "show how to break a vague coding problem into small steps before writing code",
  "explain what a Git branch does and how a student can use one safely",
  "teach one practical way to check whether an AI answer about code is actually correct",
  "explain variables, types, and input validation through a small real-world example",
  "compare REST APIs and ordinary function calls without assuming prior backend knowledge",
  "show how to find and fix one common beginner bug using a minimal reproducible example",
  "explain what an SQL index helps with and when adding one may not help",
  "teach a safe, beginner-friendly approach to protecting API keys in a project",
  "explain the difference between authentication and authorization with a campus-app example",
  "show how to write a useful unit test for one small programming function",
  "explain how an AI coding assistant can help while keeping the student responsible for review",
  "teach the difference between a process and a thread with a practical analogy",
  "explain what a cache is and one case where cached data can become stale",
  "show how to make a simple web page more accessible using keyboard navigation",
  "explain how to debug a slow page by measuring before changing code",
  "teach how to use environment variables for local development without committing secrets",
  "explain what a database transaction protects with a familiar payment example",
  "compare synchronous and asynchronous code using a simple everyday analogy",
  "show how to review AI-generated code for edge cases and unsupported claims",
  "explain what an HTTP status code tells a beginner debugging a web app",
  "teach a practical approach to writing clearer prompts for an AI coding tool",
  "explain what responsive design changes when a website is viewed on a phone",
  "show how to use Git commits to make a student project easier to recover",
  "explain the difference between frontend and backend using one small app example",
  "teach how to recognize when a coding problem needs a loop or a data structure",
  "explain one tradeoff beginners should consider before choosing a framework",
];

function isValidDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === dateKey;
}

function dateKeyInTimeZone(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatForDate(dateKey) {
  if (!isValidDateKey(dateKey)) throw new Error("Provide a valid YYYY-MM-DD date.");
  const dayNumber = Math.floor(Date.parse(`${dateKey}T00:00:00.000Z`) / 86_400_000);
  return dayNumber % 2 === 0 ? "short" : "long";
}

function buildEngineeringPrompt(dateKey, previousTitles = []) {
  if (!isValidDateKey(dateKey)) throw new Error("Provide a valid YYYY-MM-DD date.");
  const dayNumber = Math.floor(Date.parse(`${dateKey}T00:00:00.000Z`) / 86_400_000);
  const topic = ENGINEERING_TOPICS[dayNumber % ENGINEERING_TOPICS.length];
  const recentTitles = previousTitles
    .filter((title) => typeof title === "string" && title.trim())
    .slice(0, 10);
  return [
    `Create an original engineering/programming lesson for the ${CHANNEL_HANDLE} channel.`,
    `Topic focus for ${dateKey}: ${topic}.`,
    "Teach Indian engineering students and curious beginners in natural Hinglish, using Roman Hindi mixed with standard English technical terms.",
    "Start from a recognizable learner problem, then use one concrete example to make the idea click. Explain the limits of the example and end with one useful, encouraging next step. Keep technical claims accurate; do not invent benchmark numbers, news, APIs, or code behavior.",
    recentTitles.length
      ? `Make today's idea clearly different from these recent video titles: ${recentTitles.join(" | ")}.`
      : "Choose a specific, beginner-friendly angle rather than a broad overview.",
    "Use original narration and simple animated visual ideas. Do not imitate another creator or promise guaranteed learning, jobs, views, or income.",
  ].join("\n");
}

function createDailyVideoAutomation({
  draftsDirectory,
  generateVideo,
  getApiKey = () => process.env.GEMINI_API_KEY,
  now = () => new Date(),
  logError = (error) => console.error("Daily video automation failed:", error.message),
  intervalMs = 30_000,
}) {
  const settingsPath = path.join(draftsDirectory, "automation.json");
  let enabled = false;
  let lastError = "";
  let failedDate = "";
  let timer = null;
  let initialized = false;
  let initialization = null;
  const runningDrafts = new Map();

  function filePath(dateKey, extension = "json") {
    return path.join(draftsDirectory, `${dateKey}.${extension}`);
  }

  async function writeAtomic(targetPath, contents) {
    const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;
    await fs.writeFile(temporaryPath, contents, { flag: "wx" });
    await fs.rename(temporaryPath, targetPath);
  }

  async function ensureDirectory() {
    await fs.mkdir(draftsDirectory, { recursive: true });
  }

  async function loadSettings() {
    try {
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
      if (!settings || typeof settings.enabled !== "boolean") {
        throw new Error("Daily video automation settings are invalid.");
      }
      return settings;
    } catch (error) {
      if (error.code === "ENOENT") return { enabled: false };
      throw error;
    }
  }

  async function readDraftMetadata(dateKey) {
    try {
      const metadata = JSON.parse(await fs.readFile(filePath(dateKey), "utf8"));
      if (metadata.date !== dateKey || typeof metadata.title !== "string") {
        throw new Error(`Saved daily draft ${dateKey} is invalid.`);
      }
      return metadata;
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function listDrafts(limit = 14) {
    await ensureDirectory();
    const names = await fs.readdir(draftsDirectory);
    const dates = names
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .map((name) => name.slice(0, 10))
      .filter(isValidDateKey)
      .sort((left, right) => right.localeCompare(left))
      .slice(0, limit);
    const metadata = await Promise.all(dates.map(readDraftMetadata));
    return metadata.filter(Boolean);
  }

  async function loadDraft(dateKey) {
    if (!isValidDateKey(dateKey)) throw new Error("Provide a valid YYYY-MM-DD date.");
    const metadata = await readDraftMetadata(dateKey);
    if (!metadata) return null;
    const audio = await fs.readFile(filePath(dateKey, "wav"));
    return { ...metadata.video, ...metadata, audioBase64: audio.toString("base64"), audioMimeType: "audio/wav" };
  }

  async function generateDraft(dateKey) {
    if (!isValidDateKey(dateKey)) throw new Error("Provide a valid YYYY-MM-DD date.");
    if (!getApiKey()) {
      const error = new Error("Set GEMINI_API_KEY on the server before creating daily drafts.");
      error.statusCode = 503;
      throw error;
    }
    if (runningDrafts.has(dateKey)) return runningDrafts.get(dateKey);

    const task = (async () => {
      const existing = await readDraftMetadata(dateKey);
      if (existing) return { draft: await loadDraft(dateKey), created: false };

      const recentDrafts = await listDrafts(30);
      const input = {
        prompt: buildEngineeringPrompt(dateKey, recentDrafts.map((draft) => draft.title)),
        category: "education",
        format: formatForDate(dateKey),
        research: false,
        voiceSource: "ai",
      };
      const video = await generateVideo(input);
      if (typeof video.audioBase64 !== "string" || !video.audioBase64) {
        throw new Error("Gemini did not return narration audio for the daily draft.");
      }
      const audio = Buffer.from(video.audioBase64, "base64");
      if (audio.length === 0 || audio.length > 50 * 1024 * 1024) {
        throw new Error("Daily narration audio was empty or larger than the 50 MB limit.");
      }
      const { audioBase64, ...videoWithoutAudio } = video;
      const metadata = {
        date: dateKey,
        channel: CHANNEL_HANDLE,
        category: "education",
        format: input.format,
        createdAt: now().toISOString(),
        prompt: input.prompt,
        title: video.title,
        video: videoWithoutAudio,
      };
      await ensureDirectory();
      await writeAtomic(filePath(dateKey, "wav"), audio);
      await writeAtomic(filePath(dateKey), JSON.stringify(metadata));
      lastError = "";
      failedDate = "";
      return { draft: { ...videoWithoutAudio, ...metadata, audioBase64, audioMimeType: "audio/wav" }, created: true };
    })();

    runningDrafts.set(dateKey, task);
    try {
      return await task;
    } finally {
      runningDrafts.delete(dateKey);
    }
  }

  async function runIfDue() {
    if (!enabled || !getApiKey()) return;
    const currentTime = now();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(currentTime);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    if (Number(values.hour) < SCHEDULE_HOUR) return;

    const dateKey = dateKeyInTimeZone(currentTime, TIME_ZONE);
    if (failedDate === dateKey) return;
    try {
      await generateDraft(dateKey);
      lastError = "";
      failedDate = "";
    } catch (error) {
      lastError = error.message;
      failedDate = dateKey;
      logError(error);
    }
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
      void runIfDue();
    }, intervalMs);
    timer.unref?.();
    void runIfDue();
  }

  async function initialize() {
    if (initialized) return;
    if (!initialization) {
      initialization = (async () => {
        await ensureDirectory();
        const settings = await loadSettings();
        enabled = settings.enabled;
        initialized = true;
        if (enabled) startTimer();
      })();
    }
    try {
      await initialization;
    } finally {
      initialization = null;
    }
  }

  async function setEnabled(nextEnabled) {
    if (typeof nextEnabled !== "boolean") throw new Error("enabled must be true or false.");
    await initialize();
    await ensureDirectory();
    if (nextEnabled && !getApiKey()) {
      const error = new Error("Set GEMINI_API_KEY on the server before enabling daily drafts.");
      error.statusCode = 503;
      throw error;
    }
    await writeAtomic(settingsPath, JSON.stringify({ enabled: nextEnabled }));
    enabled = nextEnabled;
    initialized = true;
    lastError = "";
    failedDate = "";
    if (enabled) {
      startTimer();
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
    return getStatus();
  }

  async function getStatus() {
    if (!initialized) await initialize();
    const today = dateKeyInTimeZone(now(), TIME_ZONE);
    const latestDrafts = await listDrafts();
    return {
      enabled,
      apiConfigured: Boolean(getApiKey()),
      channel: CHANNEL_HANDLE,
      timezone: TIME_ZONE,
      scheduleTime: "09:00",
      today,
      todayFormat: formatForDate(today),
      todayDraft: latestDrafts.some((draft) => draft.date === today),
      latestDrafts: latestDrafts.map(({ date, channel, category, format, createdAt, title }) => ({
        date,
        channel,
        category,
        format,
        createdAt,
        title,
      })),
      lastError,
    };
  }

  return {
    generateDraft,
    getStatus,
    initialize,
    listDrafts,
    loadDraft,
    setEnabled,
  };
}

module.exports = {
  CHANNEL_HANDLE,
  ENGINEERING_TOPICS,
  TIME_ZONE,
  buildEngineeringPrompt,
  createDailyVideoAutomation,
  dateKeyInTimeZone,
  formatForDate,
  isValidDateKey,
};
