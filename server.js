const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_BODY_SIZE = 12 * 1024;
const STATIC_FILES = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
};

const responseSchema = {
  type: "OBJECT",
  properties: {
    videoIdea: { type: "STRING" },
    titleOptions: { type: "ARRAY", items: { type: "STRING" } },
    thumbnailConcept: { type: "STRING" },
    openingHook: { type: "STRING" },
    videoOutline: { type: "ARRAY", items: { type: "STRING" } },
    description: { type: "STRING" },
    keywords: { type: "ARRAY", items: { type: "STRING" } },
    nextAction: { type: "STRING" },
  },
  required: [
    "videoIdea",
    "titleOptions",
    "thumbnailConcept",
    "openingHook",
    "videoOutline",
    "description",
    "keywords",
    "nextAction",
  ],
};

function jsonResponse(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide channel details as a JSON object.";
  }

  const textFields = [
    ["niche", 120],
    ["audience", 120],
  ];

  for (const [field, maxLength] of textFields) {
    if (
      typeof input[field] !== "string" ||
      input[field].trim().length === 0 ||
      input[field].trim().length > maxLength
    ) {
      return `${field} must be between 1 and ${maxLength} characters.`;
    }
  }

  const choices = {
    stage: ["starting", "growing", "established"],
    format: ["any", "long-form", "shorts", "both"],
    goal: ["views", "subscribers", "both"],
  };

  for (const [field, allowedValues] of Object.entries(choices)) {
    if (!allowedValues.includes(input[field])) {
      return `Choose a valid ${field}.`;
    }
  }

  if (
    input.ideaNumber !== undefined &&
    (!Number.isSafeInteger(input.ideaNumber) ||
      input.ideaNumber < 0 ||
      input.ideaNumber > 1_000_000_000)
  ) {
    return "ideaNumber must be a whole number between 0 and 1,000,000,000.";
  }
  if (
    input.previousIdea !== undefined &&
    (typeof input.previousIdea !== "string" || input.previousIdea.length > 500)
  ) {
    return "previousIdea must be text no longer than 500 characters.";
  }

  return null;
}

const IDEA_ANGLES = [
  "a common beginner mistake and how to avoid it",
  "a practical budget-friendly comparison",
  "a simple one-week experiment with honest results",
  "troubleshooting one frustrating problem step by step",
  "a before-and-after demonstration with realistic expectations",
  "a viewer question answered with a clear example",
  "a myth check that separates evidence from opinion",
  "a small improvement viewers can try today",
];

function buildPrompt(input) {
  const ideaNumber = input.ideaNumber || 0;
  const angle = IDEA_ANGLES[ideaNumber % IDEA_ANGLES.length];
  return [
    "Create one practical, original YouTube video plan for this channel.",
    "Prioritize a specific viewer problem or curiosity, an accurate and compelling promise, strong viewer retention, and a natural reason to subscribe.",
    "Do not promise results, invent facts, recommend misleading clickbait, buy views, use engagement bait, or suggest spam.",
    `Use this distinct content angle: ${angle}.`,
    input.previousIdea
      ? `Make this idea meaningfully different from the previous idea: ${input.previousIdea}`
      : "",
    "Make the ideas realistic for the stated channel stage and format. Keep the description useful and natural; keywords should be relevant rather than stuffed.",
    "Return 3 distinct title options, 4 to 6 concise outline beats, and 5 to 8 relevant keywords.",
    "",
    `Channel niche: ${input.niche.trim()}`,
    `Target audience: ${input.audience.trim()}`,
    `Channel stage: ${input.stage}`,
    `Preferred video format: ${input.format}`,
    `Current growth goal: ${input.goal}`,
  ].join("\n");
}

function isValidPlan(plan) {
  const textFields = [
    "videoIdea",
    "thumbnailConcept",
    "openingHook",
    "description",
    "nextAction",
  ];
  const listFields = ["titleOptions", "videoOutline", "keywords"];

  return (
    plan &&
    typeof plan === "object" &&
    textFields.every(
      (field) => typeof plan[field] === "string" && plan[field].trim()
    ) &&
    listFields.every(
      (field) =>
        Array.isArray(plan[field]) &&
        plan[field].length > 0 &&
        plan[field].every((item) => typeof item === "string" && item.trim())
    )
  );
}

function buildLocalPlan(input) {
  const niche = input.niche.trim();
  const audience = input.audience.trim();
  const channelNiche = niche[0].toUpperCase() + niche.slice(1);
  const goalDirection =
    input.goal === "subscribers"
      ? "Give viewers a useful reason to subscribe for the next step."
      : input.goal === "both"
        ? "Make the video easy to discover and give satisfied viewers a natural reason to subscribe."
        : "Answer a specific viewer question clearly so the video earns relevant clicks and watch time.";
  const isShort = input.format === "shorts";
  const ideaNumber = input.ideaNumber || 0;
  const angle = IDEA_ANGLES[ideaNumber % IDEA_ANGLES.length];
  const videoIdea =
    ideaNumber === 0
      ? `Help ${audience} solve one specific beginner question about ${niche}. Demonstrate the process from the first step to a visible, honest result, and explain one common point of confusion.`
      : `Create ${angle} for ${audience} about ${niche}. Demonstrate a clear, honest example and explain what viewers can realistically learn from it.`;

  const plan = {
    videoIdea,
    titleOptions: [
      ideaNumber === 0
        ? `A Practical ${channelNiche} Guide for ${audience}`
        : `${channelNiche}: ${angle}`,
      ideaNumber === 0
        ? `Getting Started with ${channelNiche}: The Steps I’d Take`
        : `How ${audience} Can Try ${channelNiche} Step by Step`,
      ideaNumber === 0
        ? `The ${channelNiche} Basics ${audience} Should Know`
        : `What to Know Before You Try This ${channelNiche} Approach`,
    ],
    thumbnailConcept:
      `Show the real finished result beside the first step or tool. Use a clear close-up, strong contrast, and the short text “START HERE”; only show something the video actually delivers.`,
    openingHook: `“If you’re ${audience} and ${niche} feels hard to start, I’ll walk you through one practical example, show the result, and explain what to do first.” Open with the real result, then get straight into the demonstration.`,
    videoOutline: isShort
      ? [
          "Show the finished result immediately and name who this tip helps.",
          `Demonstrate one useful ${niche} step with a clear before-and-after.`,
          "Explain the small detail that makes the step work; keep the example honest.",
          input.goal === "subscribers" || input.goal === "both"
            ? "Invite viewers who found the walkthrough useful to follow for the next practical step."
            : "Finish with the result on screen and one specific question for viewers.",
        ]
      : [
          "Show the finished result and explain what viewers will learn.",
          `Introduce the specific ${niche} problem this video solves for ${audience}.`,
          "Walk through the steps in order using one real, clear example.",
          "Point out one common mistake or limitation and show what to do instead.",
          "Recap the result, share the next useful step, and invite a relevant comment.",
        ],
    description: `A practical ${niche} walkthrough for ${audience}. Follow along as we work through the key steps, look at a real example, and cover one common point of confusion. Adapt the approach to your own situation and check any details that matter to you.`,
    keywords: [
      niche,
      `${niche} for beginners`,
      `${niche} guide`,
      `${audience} ${niche}`,
      `how to start ${niche}`,
      "step by step guide",
    ],
    nextAction: `${goalDirection} Before filming, write down the one real example you’ll demonstrate and verify each factual claim.`,
    source: "local",
  };

  if (input.format === "both") {
    plan.videoOutline.push(
      `After publishing, make a separate short from the clearest ${niche} tip and point viewers to the full walkthrough.`
    );
  }

  return plan;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function validateScheduleInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide publishing preferences as a JSON object.";
  }
  if (!Number.isInteger(input.postsPerWeek) || input.postsPerWeek < 1 || input.postsPerWeek > 7) {
    return "postsPerWeek must be a whole number between 1 and 7.";
  }
  if (!WEEKDAYS.includes(input.startDay)) {
    return "Choose a valid starting day.";
  }
  if (!["long-form", "shorts", "both"].includes(input.format)) {
    return "Choose a valid publishing format.";
  }
  return null;
}

function buildPublishingSchedule(input) {
  const startIndex = WEEKDAYS.indexOf(input.startDay);
  const schedule = Array.from({ length: input.postsPerWeek }, (_, index) => ({
    day: WEEKDAYS[(startIndex + Math.floor((index * 7) / input.postsPerWeek)) % 7],
    format:
      input.format === "both"
        ? index % 2 === 0
          ? "Long-form video"
          : "Short"
        : input.format === "shorts"
          ? "Short"
          : "Long-form video",
  }));

  return {
    schedule,
    note: "This is a consistent starting rhythm, not a best-time prediction. Adjust it to your capacity and compare results over several uploads.",
  };
}

const ANALYTICS_FIELDS = [
  ["views", "views"],
  ["impressions", "impressions"],
  ["clickThroughRate", "click-through rate"],
  ["averageViewDurationMinutes", "average view duration"],
  ["videoLengthMinutes", "video length"],
  ["subscribersGained", "subscribers gained"],
];

function validateAnalyticsInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide analytics as a JSON object.";
  }
  for (const [field, label] of ANALYTICS_FIELDS) {
    if (typeof input[field] !== "number" || !Number.isFinite(input[field]) || input[field] < 0) {
      return `${label} must be a non-negative number.`;
    }
  }
  if (!Number.isInteger(input.views) || input.views > 1_000_000_000) {
    return "views must be a whole number between 0 and 1,000,000,000.";
  }
  if (!Number.isInteger(input.impressions) || input.impressions > 1_000_000_000) {
    return "impressions must be a whole number between 0 and 1,000,000,000.";
  }
  if (!Number.isInteger(input.subscribersGained) || input.subscribersGained > 1_000_000_000) {
    return "subscribers gained must be a whole number between 0 and 1,000,000,000.";
  }
  if (input.clickThroughRate > 100) {
    return "click-through rate must not exceed 100%.";
  }
  if (input.videoLengthMinutes <= 0 || input.videoLengthMinutes > 600) {
    return "video length must be greater than 0 and no more than 600 minutes.";
  }
  if (input.averageViewDurationMinutes > 600) {
    return "average view duration must not exceed 600 minutes.";
  }
  return null;
}

function reviewAnalytics(input) {
  const averageViewedPercent =
    (input.averageViewDurationMinutes / input.videoLengthMinutes) * 100;
  const subscribersPerThousandViews =
    input.views > 0 ? (input.subscribersGained / input.views) * 1000 : null;
  const observations = [];

  observations.push(
    input.impressions < 100
      ? "There are fewer than 100 impressions, so treat click-through rate as an early, low-sample signal."
      : "Compare click-through rate with your own recent videos and traffic sources; if it is lower than your usual range, test a clearer, accurate title and thumbnail."
  );
  observations.push(
    averageViewedPercent < 30
      ? `Average view duration is about ${averageViewedPercent.toFixed(0)}% of the video. Review the opening and the point where viewers leave; make sure the video delivers its title promise early.`
      : `Average view duration is about ${averageViewedPercent.toFixed(0)}% of the video. Compare the retention curve with your channel baseline and look for sections viewers replay or leave.`
  );
  observations.push(
    subscribersPerThousandViews === null
      ? "No subscriber conversion rate is available because views are zero."
      : `You gained about ${subscribersPerThousandViews.toFixed(1)} subscribers per 1,000 views. Compare this with similar videos and make the next relevant video easy to find.`
  );

  return {
    metrics: {
      averageViewedPercent: Number(averageViewedPercent.toFixed(1)),
      subscribersPerThousandViews:
        subscribersPerThousandViews === null
          ? null
          : Number(subscribersPerThousandViews.toFixed(2)),
    },
    observations,
    note: "These are directional prompts based only on the numbers you entered, not a connection to YouTube Analytics or a guarantee of performance.",
  };
}

async function generatePlan(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildLocalPlan(input);
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
  );
  url.searchParams.set("key", apiKey);

  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "You are a thoughtful YouTube strategy assistant. Help creators earn attention by serving viewers, not by manipulating metrics. Never guarantee growth.",
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8,
      },
    }),
  });

  if (!result.ok) {
    const error = new Error(
      `Google Gemini returned HTTP ${result.status}. Check the API key, model access, and quota, then try again.`
    );
    error.statusCode = 502;
    throw error;
  }

  const data = await result.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!text) {
    throw new Error("Google Gemini returned an empty plan. Please try again.");
  }

  let plan;
  try {
    plan = JSON.parse(text);
  } catch {
    throw new Error("Google Gemini returned an unreadable plan. Please try again.");
  }

  if (!isValidPlan(plan)) {
    throw new Error("Google Gemini returned an incomplete plan. Please try again.");
  }

  plan.source = "gemini";
  return plan;
}

const API_OPERATIONS = {
  "/api/growth-plan": { validate: validateInput, run: generatePlan },
  "/api/publishing-schedule": {
    validate: validateScheduleInput,
    run: buildPublishingSchedule,
  },
  "/api/analytics-review": { validate: validateAnalyticsInput, run: reviewAnalytics },
};

async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const operation = API_OPERATIONS[url.pathname];

  if (operation) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return jsonResponse(response, 405, { error: "Use POST for this endpoint." });
    }

    if (!request.headers["content-type"]?.includes("application/json")) {
      return jsonResponse(response, 415, {
        error: "Send channel details as application/json.",
      });
    }

    try {
      const input = await readJsonBody(request);
      const validationError = operation.validate(input);
      if (validationError) {
        return jsonResponse(response, 400, { error: validationError });
      }

      const result = await operation.run(input);
      return jsonResponse(response, 200, result);
    } catch (error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return jsonResponse(response, 504, {
          error: "The AI request timed out. Please try again.",
        });
      }
      if (error.statusCode) {
        return jsonResponse(response, error.statusCode, { error: error.message });
      }
      console.error("Growth assistant request failed:", error.message);
      return jsonResponse(response, 502, {
        error: error.message || "Unable to generate a plan. Please try again.",
      });
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return jsonResponse(response, 405, { error: "Method not allowed." });
  }

  const staticFile = STATIC_FILES[url.pathname];
  if (!staticFile) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end("Not found");
  }

  const filePath = path.join(__dirname, staticFile[0]);
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      console.error("Unable to read static file:", error.message);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Unable to load the application.");
    }

    response.writeHead(200, {
      "Content-Type": staticFile[1],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  });
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`YouTube Growth Agent running at http://localhost:${PORT}`);
  });
}

module.exports = {
  buildLocalPlan,
  buildPrompt,
  buildPublishingSchedule,
  isValidPlan,
  reviewAnalytics,
  validateAnalyticsInput,
  validateInput,
  validateScheduleInput,
};
