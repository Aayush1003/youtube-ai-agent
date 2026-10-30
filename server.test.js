const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAnimeIdeasPrompt,
  buildAnimeVideoPrompt,
  buildDailyVideoPrompt,
  buildLocalPlan,
  buildJavaShortPrompt,
  buildPrompt,
  buildPublishingSchedule,
  createAnimeVideo,
  createDailyVideo,
  generateJavaShort,
  isValidPlan,
  isValidAnimeIdeas,
  isValidAnimeVideo,
  isValidJavaShort,
  reviewAnalytics,
  searchAnimeIdeas,
  validateAnalyticsInput,
  validateInput,
  validateAnimeIdeaInput,
  validateAnimeVideoInput,
  validateDailyVideoInput,
  validateJavaShortInput,
  validateScheduleInput,
} = require("./server");
const { DAILY_VIDEO_CATEGORIES, calculateStreak: calculateDailyStreak } = require("./src/daily-video-workflow.cjs");
const {
  JAVA_TOPIC_IDEAS,
  calculateStreak,
  topicIndexForDate,
} = require("./src/daily-java-workflow.cjs");

const input = {
  niche: "Home cooking",
  audience: "Busy beginners",
  stage: "growing",
  format: "long-form",
  goal: "subscribers",
};

const javaShort = {
  title: "Java HashMap in 60 Seconds",
  scenes: Array.from({ length: 6 }, (_, index) => ({
    title: `Scene ${index + 1}`,
    caption: "A clear explanation of the Java concept.",
    visualLabels: ["key", "value"],
  })),
  voiceover: Array(80).fill("HashMap").join(" "),
};

const animeVideo = {
  title: "The Last Lantern",
  logline: "A night-shift courier discovers one forgotten light can guide a stranger home.",
  scenes: Array.from({ length: 6 }, (_, index) => ({
    title: `Scene ${index + 1}`,
    caption: "One small light can change the way home feels.",
    setting: "Rainy rooftops above a quiet city",
    visualLabels: ["lantern", "rain"],
  })),
  voiceover: Array(80).fill("Lantern").join(" "),
};

const animeIdeas = {
  ideas: Array.from({ length: 3 }, (_, index) => ({
    title: `Original idea ${index + 1}`,
    logline: `An original character finds a new way to help someone in a changing city, story ${index + 1}.`,
    humanInsight: "Small acts of care can make people feel seen.",
  })),
};

const dailyVideo = {
  title: "The One-Minute Strategy",
  logline: "A new player learns to pause, notice a pattern, and make a smarter move.",
  scenes: Array.from({ length: 6 }, (_, index) => ({
    title: `Level ${index + 1}`,
    caption: "One thoughtful move can change the whole round.",
    setting: "A bright abstract game arena",
    visualLabels: ["strategy", "focus"],
  })),
  voiceover: Array(80).fill("Strategy").join(" "),
};

test("rotates through a fixed daily Java topic list", () => {
  assert.equal(JAVA_TOPIC_IDEAS.length, 30);
  assert.equal(new Set(JAVA_TOPIC_IDEAS).size, JAVA_TOPIC_IDEAS.length);
  assert.equal(topicIndexForDate("2025-04-12"), topicIndexForDate("2025-04-12"));
  assert.notEqual(topicIndexForDate("2025-04-12"), topicIndexForDate("2025-04-13"));
});

test("counts only consecutive video-download days for the streak", () => {
  assert.equal(calculateStreak(["2025-04-10", "2025-04-11", "2025-04-12"], "2025-04-12"), 3);
  assert.equal(calculateStreak(["2025-04-11"], "2025-04-12"), 1);
  assert.equal(calculateStreak(["2025-04-09", "2025-04-11"], "2025-04-12"), 1);
  assert.equal(calculateStreak([], "2025-04-12"), 0);
});

test("validates a Hinglish Java Short concept", () => {
  const validInput = { concept: "HashMap", language: "Hinglish", format: "short", voiceSource: "ai" };
  assert.equal(validateJavaShortInput(validInput), null);
  assert.equal(validateJavaShortInput({ ...validInput, voiceSource: "upload" }), null);
  assert.equal(validateJavaShortInput({ ...validInput, format: "long" }), null);
  assert.match(validateJavaShortInput({ ...validInput, concept: " " }), /concept/);
  assert.match(validateJavaShortInput({ ...validInput, concept: "x".repeat(161) }), /concept/);
  assert.match(validateJavaShortInput({ ...validInput, language: "English" }), /Hinglish/);
  assert.match(validateJavaShortInput({ ...validInput, format: "medium" }), /format/);
  assert.match(validateJavaShortInput({ ...validInput, voiceSource: "record" }), /voice/);
  assert.match(validateJavaShortInput(null), /JSON object/);
});

test("validates anime inspiration and video requests", () => {
  assert.equal(validateAnimeIdeaInput({}), null);
  assert.equal(validateAnimeIdeaInput({ topic: "A changing city" }), null);
  assert.match(validateAnimeIdeaInput({ topic: "x".repeat(181) }), /topic/);
  const validVideoInput = { idea: "A lantern guides a stranger home", format: "short", voiceSource: "ai" };
  assert.equal(validateAnimeVideoInput(validVideoInput), null);
  assert.equal(validateAnimeVideoInput({ ...validVideoInput, format: "long" }), null);
  assert.match(validateAnimeVideoInput({ ...validVideoInput, idea: " " }), /idea/);
  assert.match(validateAnimeVideoInput({ ...validVideoInput, format: "medium" }), /format/);
  assert.match(validateAnimeVideoInput({ ...validVideoInput, voiceSource: "clone" }), /voice/);
  assert.match(validateAnimeVideoInput(null), /JSON object/);
});

test("validates daily video prompts, categories, and research choice", () => {
  const validInput = { prompt: "Explain a clever game strategy", category: "gaming", format: "short", research: true };
  assert.equal(DAILY_VIDEO_CATEGORIES.length, 5);
  assert.equal(validateDailyVideoInput(validInput), null);
  assert.equal(validateDailyVideoInput({ ...validInput, category: "education", format: "long", research: false }), null);
  assert.match(validateDailyVideoInput({ ...validInput, prompt: " " }), /prompt/);
  assert.match(validateDailyVideoInput({ ...validInput, prompt: "x".repeat(501) }), /prompt/);
  assert.match(validateDailyVideoInput({ ...validInput, category: "sports" }), /Choose gaming/);
  assert.match(validateDailyVideoInput({ ...validInput, format: "medium" }), /format/);
  assert.match(validateDailyVideoInput({ ...validInput, research: "yes" }), /research/);
  assert.match(validateDailyVideoInput(null), /JSON object/);
  assert.equal(calculateDailyStreak(["2025-04-11", "2025-04-12"], "2025-04-12"), 2);
});

test("builds category-aware daily video prompts with optional grounded research", () => {
  const researchPrompt = buildDailyVideoPrompt({
    prompt: "Explain one useful strategy",
    category: "gaming",
    format: "short",
    research: true,
  });
  assert.match(researchPrompt, /gaming/);
  assert.match(researchPrompt, /60-second vertical/);
  assert.match(researchPrompt, /Google Search/);
  assert.match(researchPrompt, /Do not reproduce or imitate copyrighted/);
  const longPrompt = buildDailyVideoPrompt({
    prompt: "Explain a science fact",
    category: "education",
    format: "long",
    research: false,
  });
  assert.match(longPrompt, /five-minute, landscape/);
  assert.match(longPrompt, /Do not depend on current web facts/);
});

test("generates a researched daily video with citations and AI narration", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const requests = [];
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(options.body), headers: options.headers });
    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({
          steps: [
            { type: "google_search_call", arguments: { queries: ["beginner gaming strategy"] } },
            {
              type: "model_output",
              content: [{
                type: "text",
                text: JSON.stringify(dailyVideo),
                annotations: [{ type: "url_citation", title: "Gaming guide", url: "https://example.com/gaming" }],
              }],
            },
          ],
        }),
      };
    }
    return { ok: true, json: async () => ({ output_audio: { data: "AQID" } }) };
  };
  try {
    const result = await createDailyVideo({
      prompt: "Explain a clever game strategy",
      category: "gaming",
      format: "short",
      research: true,
    });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].headers["x-goog-api-key"], "test-key");
    assert.equal(requests[0].body.tools[0].type, "google_search");
    assert.equal(requests[1].body.generation_config.speech_config[0].voice, "Kore");
    assert.match(requests[1].body.input[0].content[0].annotations[0].style, /adapt delivery to the video/i);
    assert.equal(result.category, "gaming");
    assert.equal(result.sources[0].url, "https://example.com/gaming");
    assert.equal(result.audioBase64, "AQID");
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("generates daily videos without web search when research is disabled", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const requests = [];
  const longDailyVideo = {
    ...dailyVideo,
    scenes: Array.from({ length: 18 }, (_, index) => ({
      ...dailyVideo.scenes[index % dailyVideo.scenes.length],
      title: `Lesson ${index + 1}`,
    })),
    voiceover: Array(400).fill("Strategy").join(" "),
  };
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    requests.push(JSON.parse(options.body));
    return requests.length === 1
      ? {
          ok: true,
          json: async () => ({
            steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(longDailyVideo) }] }],
          }),
        }
      : { ok: true, json: async () => ({ output_audio: { data: "AQID" } }) };
  };
  try {
    const result = await createDailyVideo({
      prompt: "Explain a clever game strategy",
      category: "gaming",
      format: "long",
      research: false,
    });
    assert.equal(requests[0].tools, undefined);
    assert.equal(result.format, "long");
    assert.equal(result.scenes.length, 18);
    assert.deepEqual(result.sources, []);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("builds original anime story prompts and validates generated ideas and scenes", () => {
  assert.match(buildAnimeIdeasPrompt({ topic: "Digital burnout" }), /Google Search/);
  assert.match(buildAnimeIdeasPrompt({ topic: "Digital burnout" }), /Digital burnout/);
  assert.match(buildAnimeIdeasPrompt({}), /timely/);
  assert.match(buildAnimeVideoPrompt({ idea: "A lantern guides a stranger home", format: "short", voiceSource: "ai" }), /60-second vertical/);
  assert.match(buildAnimeVideoPrompt({ idea: "A lantern guides a stranger home", format: "long", voiceSource: "upload" }), /five-minute landscape/);
  assert.match(buildAnimeVideoPrompt({ idea: "A lantern guides a stranger home", format: "short", voiceSource: "ai" }), /must be original/);
  assert.equal(isValidAnimeIdeas(animeIdeas), true);
  assert.equal(isValidAnimeIdeas({ ideas: animeIdeas.ideas.slice(0, 2) }), false);
  assert.equal(isValidAnimeVideo(animeVideo), true);
  assert.equal(isValidAnimeVideo({ ...animeVideo, scenes: animeVideo.scenes.slice(0, 5) }), false);
  assert.equal(isValidAnimeVideo({ ...animeVideo, voiceover: "Too short." }), false);
});

test("researches anime ideas with Google Search and returns cited sources", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let request;
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    request = { url: String(url), body: JSON.parse(options.body), headers: options.headers };
    return {
      ok: true,
      json: async () => ({
        steps: [
          { type: "google_search_call", arguments: { queries: ["animation creator trends"] } },
          {
            type: "model_output",
            content: [{
              type: "text",
              text: JSON.stringify(animeIdeas),
              annotations: [
                { type: "url_citation", title: "Animation report", url: "https://example.com/report" },
                { type: "url_citation", title: "Animation report duplicate", url: "https://example.com/report" },
              ],
            }],
          },
        ],
      }),
    };
  };
  try {
    const result = await searchAnimeIdeas({ topic: "animation creators" });
    assert.equal(request.url, "https://generativelanguage.googleapis.com/v1beta/interactions");
    assert.equal(request.headers["x-goog-api-key"], "test-key");
    assert.equal(request.body.tools[0].type, "google_search");
    assert.equal(result.ideas.length, 3);
    assert.equal(result.sources.length, 1);
    assert.equal(result.sources[0].url, "https://example.com/report");
    assert.deepEqual(result.searchQueries, ["animation creator trends"]);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("creates uploaded-voice anime storyboards without calling Gemini TTS", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let fetchCount = 0;
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({
        steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(animeVideo) }] }],
      }),
    };
  };
  try {
    const result = await createAnimeVideo({
      idea: "A lantern guides a stranger home",
      format: "short",
      voiceSource: "upload",
    });
    assert.equal(fetchCount, 1);
    assert.equal(result.voiceSource, "upload");
    assert.equal(result.scenes.length, 6);
    assert.equal(result.audioBase64, undefined);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("creates AI anime narration with expressive storyteller delivery", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const requests = [];
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(options.body) });
    return requests.length === 1
      ? {
          ok: true,
          json: async () => ({
            steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(animeVideo) }] }],
          }),
        }
      : { ok: true, json: async () => ({ output_audio: { data: "AQID" } }) };
  };
  try {
    const result = await createAnimeVideo({
      idea: "A lantern guides a stranger home",
      format: "short",
      voiceSource: "ai",
    });
    assert.equal(requests.length, 2);
    assert.equal(result.audioBase64, "AQID");
    assert.equal(requests[1].body.generation_config.speech_config[0].voice, "Kore");
    assert.match(requests[1].body.input[0].content[0].annotations[0].style, /expressive Hinglish storyteller/i);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("builds a concise technical prompt and validates the generated Java Short", () => {
  const shortInput = { concept: "HashMap", format: "short", voiceSource: "ai" };
  const longInput = { concept: "HashMap", format: "long", voiceSource: "upload" };
  assert.match(buildJavaShortPrompt(shortInput), /HashMap/);
  assert.match(buildJavaShortPrompt(shortInput), /Hinglish/);
  assert.match(buildJavaShortPrompt(shortInput), /60-second vertical/);
  assert.match(buildJavaShortPrompt(shortInput), /warm, sincere Hinglish mentor/i);
  assert.match(buildJavaShortPrompt(shortInput), /avoid hype, guilt, grand promises/i);
  assert.match(buildJavaShortPrompt(longInput), /five-minute, landscape/);
  assert.match(buildJavaShortPrompt(longInput), /upload their own narration/);
  assert.equal(isValidJavaShort(javaShort, "short"), true);
  assert.equal(isValidJavaShort({ ...javaShort, scenes: javaShort.scenes.slice(0, 5) }, "short"), false);
  assert.equal(isValidJavaShort({ ...javaShort, voiceover: "Too short." }, "short"), false);
  const longVideo = {
    ...javaShort,
    scenes: Array.from({ length: 18 }, (_, index) => ({
      title: `Lesson ${index + 1}`,
      caption: "A thorough Java lesson scene.",
      visualLabels: ["key", "value"],
    })),
    voiceover: Array(400).fill("HashMap").join(" "),
  };
  assert.equal(isValidJavaShort(longVideo, "long"), true);
  assert.equal(isValidJavaShort({ ...longVideo, scenes: javaShort.scenes }, "long"), false);
});

test("generates AI narration with warm, expressive mentor delivery", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const requests = [];
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(options.body) });
    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(javaShort) }] } }] }),
      };
    }
    return { ok: true, json: async () => ({ output_audio: { data: "AQID" } }) };
  };
  try {
    const video = await generateJavaShort({
      concept: "HashMap",
      language: "Hinglish",
      format: "short",
      voiceSource: "ai",
    });
    const speechInput = requests[1].body.input[0].content[0];
    assert.equal(requests.length, 2);
    assert.equal(video.voiceSource, "ai");
    assert.equal(requests[1].body.generation_config.speech_config[0].voice, "Kore");
    assert.match(speechInput.annotations[0].style, /warm, resonant, grounded Hinglish mentor/i);
    assert.match(speechInput.annotations[0].style, /gentle pauses/i);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("uses uploaded narration without calling Gemini text-to-speech", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let fetchCount = 0;
  process.env.GEMINI_API_KEY = "test-key";
  global.fetch = async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(javaShort) }] } }] }),
    };
  };
  try {
    const video = await generateJavaShort({
      concept: "HashMap",
      language: "Hinglish",
      format: "short",
      voiceSource: "upload",
    });
    assert.equal(fetchCount, 1);
    assert.equal(video.format, "short");
    assert.equal(video.voiceSource, "upload");
    assert.equal(video.audioBase64, undefined);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("accepts a complete channel brief", () => {
  assert.equal(validateInput(input), null);
});

test("rejects missing, oversized, and invalid channel fields", () => {
  assert.match(validateInput({ ...input, niche: "  " }), /niche/);
  assert.match(validateInput({ ...input, audience: "x".repeat(121) }), /audience/);
  assert.match(validateInput({ ...input, format: "livestream" }), /format/);
  assert.match(validateInput(null), /JSON object/);
});

test("builds a prompt with the channel context and organic-growth guardrails", () => {
  const prompt = buildPrompt(input);
  assert.match(prompt, /Home cooking/);
  assert.match(prompt, /Busy beginners/);
  assert.match(prompt, /do not promise results/i);
  assert.match(prompt, /subscribers/);
});

test("accepts a complete generated plan and rejects incomplete output", () => {
  const plan = {
    videoIdea: "A quick meal-prep guide",
    titleOptions: ["Meal prep for beginners", "Five dinners, one hour", "Easy prep that sticks"],
    thumbnailConcept: "A colorful set of labeled containers.",
    openingHook: "Show the finished meals, then promise a simple prep method.",
    videoOutline: ["Choose meals", "Shop smart", "Prep ingredients", "Store safely"],
    description: "A practical meal-prep guide for busy beginners.",
    keywords: ["beginner meal prep", "easy dinners"],
    nextAction: "Film the finished meals before recording the introduction.",
  };
  assert.equal(isValidPlan(plan), true);
  assert.equal(isValidPlan({ ...plan, keywords: [] }), false);
});

test("builds a complete local plan without credentials", () => {
  const plan = buildLocalPlan(input);
  assert.equal(plan.source, "local");
  assert.equal(isValidPlan(plan), true);
  assert.match(plan.videoIdea, /Home cooking/);
  assert.match(plan.videoIdea, /Busy beginners/);
  assert.match(plan.nextAction, /subscribe/i);
});

test("creates a different next idea and validates iteration inputs", () => {
  const nextInput = {
    ...input,
    ideaNumber: 1,
    previousIdea: "A practical beginner's guide",
  };
  assert.equal(validateInput(nextInput), null);
  const prompt = buildPrompt(nextInput);
  assert.match(prompt, /distinct content angle/i);
  assert.match(prompt, /previous idea: A practical beginner's guide/i);
  assert.notEqual(buildLocalPlan(nextInput).videoIdea, buildLocalPlan(input).videoIdea);
  assert.match(
    validateInput({ ...input, ideaNumber: -1 }),
    /ideaNumber must be a whole number/
  );
  assert.match(
    validateInput({ ...input, previousIdea: "x".repeat(501) }),
    /previousIdea must be text/
  );
});

test("adapts local plans to Shorts and both formats", () => {
  const shortPlan = buildLocalPlan({ ...input, format: "shorts", goal: "views" });
  assert.equal(shortPlan.videoOutline.length, 4);
  assert.match(shortPlan.videoOutline[0], /immediately/);
  const combinedPlan = buildLocalPlan({ ...input, format: "both" });
  assert.equal(combinedPlan.videoOutline.length, 6);
  assert.match(combinedPlan.videoOutline[5], /short/i);
});

test("builds a spaced publishing rhythm using the chosen format", () => {
  const scheduleInput = { postsPerWeek: 3, startDay: "Monday", format: "both" };
  assert.equal(validateScheduleInput(scheduleInput), null);
  const result = buildPublishingSchedule(scheduleInput);
  assert.deepEqual(result.schedule, [
    { day: "Monday", format: "Long-form video" },
    { day: "Wednesday", format: "Short" },
    { day: "Friday", format: "Long-form video" },
  ]);
  assert.match(result.note, /not a best-time prediction/i);
});

test("rejects invalid publishing preferences", () => {
  assert.match(validateScheduleInput({ postsPerWeek: 0, startDay: "Monday", format: "both" }), /postsPerWeek/);
  assert.match(validateScheduleInput({ postsPerWeek: 1, startDay: "Funday", format: "both" }), /starting day/);
  assert.match(validateScheduleInput({ postsPerWeek: 1, startDay: "Monday", format: "spam" }), /format/);
});

test("reviews supplied metrics with transparent directional signals", () => {
  const metrics = {
    views: 1000,
    impressions: 10000,
    clickThroughRate: 4,
    averageViewDurationMinutes: 3,
    videoLengthMinutes: 8,
    subscribersGained: 10,
  };
  assert.equal(validateAnalyticsInput(metrics), null);
  const result = reviewAnalytics(metrics);
  assert.equal(result.metrics.averageViewedPercent, 37.5);
  assert.equal(result.metrics.subscribersPerThousandViews, 10);
  assert.equal(result.observations.length, 3);
  assert.match(result.note, /not a connection to YouTube Analytics/i);
});

test("validates analytics ranges and handles zero views", () => {
  const metrics = {
    views: 0,
    impressions: 0,
    clickThroughRate: 0,
    averageViewDurationMinutes: 0,
    videoLengthMinutes: 5,
    subscribersGained: 0,
  };
  assert.equal(validateAnalyticsInput(metrics), null);
  assert.equal(reviewAnalytics(metrics).metrics.subscribersPerThousandViews, null);
  assert.match(reviewAnalytics(metrics).observations[0], /low-sample/i);
  assert.match(
    validateAnalyticsInput({ ...metrics, clickThroughRate: 101 }),
    /must not exceed 100/
  );
  assert.match(
    validateAnalyticsInput({ ...metrics, views: 1.5 }),
    /whole number/
  );
});
