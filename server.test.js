const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildLocalPlan,
  buildPrompt,
  buildPublishingSchedule,
  isValidPlan,
  reviewAnalytics,
  validateAnalyticsInput,
  validateInput,
  validateScheduleInput,
} = require("./server");

const input = {
  niche: "Home cooking",
  audience: "Busy beginners",
  stage: "growing",
  format: "long-form",
  goal: "subscribers",
};

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
