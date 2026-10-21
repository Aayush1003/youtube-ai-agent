const form = document.querySelector("#growth-form");
const submitButton = form.querySelector('button[type="submit"]');
const buttonLabel = form.querySelector(".button-label");
const formError = document.querySelector("#form-error");
const results = document.querySelector("#results");
const resultGrid = document.querySelector("#result-grid");
const planSource = document.querySelector("#plan-source");
const copyButton = document.querySelector("#copy-plan");
const nextIdeaButton = document.querySelector("#next-idea");
const nextIdeaError = document.querySelector("#next-idea-error");
let latestPlan = null;
let latestBrief = null;
let ideaNumber = 0;

document.querySelector("#channel-quick-start").addEventListener("click", () => {
  form.elements.stage.value = "growing";
  form.elements.format.value = "both";
  form.elements.goal.value = "views";
  form.requestSubmit();
});

function addTextCard(title, content, wide = false) {
  const card = document.createElement("article");
  card.className = `result-card${wide ? " wide" : ""}`;

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.append(heading);

  if (Array.isArray(content)) {
    const isKeywords = title === "SEARCH PHRASES";
    if (isKeywords) {
      const tags = document.createElement("div");
      tags.className = "keywords";
      for (const value of content) {
        const tag = document.createElement("span");
        tag.className = "keyword";
        tag.textContent = value;
        tags.append(tag);
      }
      card.append(tags);
    } else {
      const list = document.createElement(title === "VIDEO BEATS" ? "ol" : "ul");
      for (const value of content) {
        const item = document.createElement("li");
        item.textContent = value;
        list.append(item);
      }
      card.append(list);
    }
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    card.append(paragraph);
  }

  resultGrid.append(card);
}

function renderPlan(plan) {
  resultGrid.replaceChildren();
  planSource.textContent =
    plan.source === "gemini"
      ? "AI-GENERATED WITH GEMINI"
      : "INSTANT STARTER PLAN · NO API KEY NEEDED";
  addTextCard("VIDEO IDEA", plan.videoIdea, true);
  addTextCard("TITLE OPTIONS", plan.titleOptions);
  addTextCard("THUMBNAIL CONCEPT", plan.thumbnailConcept);
  addTextCard("OPENING HOOK", plan.openingHook);
  addTextCard("VIDEO BEATS", plan.videoOutline);
  addTextCard("DESCRIPTION", plan.description, true);
  addTextCard("SEARCH PHRASES", plan.keywords, true);
  addTextCard("YOUR NEXT ACTION", plan.nextAction, true);

  latestPlan = plan;
  nextIdeaButton.hidden = false;
  results.hidden = false;
  results.setAttribute("aria-busy", "false");
}

function planAsText(plan) {
  return [
    `VIDEO IDEA\n${plan.videoIdea}`,
    `TITLE OPTIONS\n${plan.titleOptions.map((title, index) => `${index + 1}. ${title}`).join("\n")}`,
    `THUMBNAIL CONCEPT\n${plan.thumbnailConcept}`,
    `OPENING HOOK\n${plan.openingHook}`,
    `VIDEO BEATS\n${plan.videoOutline.map((beat, index) => `${index + 1}. ${beat}`).join("\n")}`,
    `DESCRIPTION\n${plan.description}`,
    `SEARCH PHRASES\n${plan.keywords.join(", ")}`,
    `YOUR NEXT ACTION\n${plan.nextAction}`,
  ].join("\n\n");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  formError.textContent = "";
  submitButton.disabled = true;
  buttonLabel.textContent = "Finding your next idea…";
  results.setAttribute("aria-busy", "true");

  const formData = new FormData(form);
  const input = {
    niche: formData.get("niche").trim(),
    audience: formData.get("audience").trim(),
    stage: formData.get("stage"),
    format: formData.get("format"),
    goal: formData.get("goal"),
  };
  latestBrief = input;
  ideaNumber = 0;

  try {
    const response = await fetch("/api/growth-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `The request failed (HTTP ${response.status}).`);
    }

    renderPlan(payload);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    results.setAttribute("aria-busy", "false");
    formError.textContent = error.message || "Unable to create a plan. Please try again.";
    formError.hidden = false;
  } finally {
    submitButton.disabled = false;
    buttonLabel.textContent = "Build my video plan";
  }
});

copyButton.addEventListener("click", async () => {
  if (!latestPlan) return;

  try {
    await navigator.clipboard.writeText(planAsText(latestPlan));
    copyButton.innerHTML = 'Copied <span aria-hidden="true">✓</span>';
    window.setTimeout(() => {
      copyButton.innerHTML = 'Copy plan <span aria-hidden="true">↗</span>';
    }, 1800);
  } catch {
    copyButton.textContent = "Could not copy";
  }
});

nextIdeaButton.addEventListener("click", async () => {
  if (!latestBrief || !latestPlan) return;

  nextIdeaError.hidden = true;
  nextIdeaError.textContent = "";
  nextIdeaButton.disabled = true;
  nextIdeaButton.textContent = "Finding another idea…";
  results.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/growth-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...latestBrief,
        ideaNumber: ideaNumber + 1,
        previousIdea: latestPlan.videoIdea,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `The request failed (HTTP ${response.status}).`);
    }
    ideaNumber += 1;
    renderPlan(payload);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    results.setAttribute("aria-busy", "false");
    nextIdeaError.textContent = error.message || "Unable to create another idea. Please try again.";
    nextIdeaError.hidden = false;
  } finally {
    nextIdeaButton.disabled = false;
    nextIdeaButton.innerHTML = 'Another idea <span aria-hidden="true">↻</span>';
  }
});

async function requestToolResult(form, endpoint, errorElement, buttonText, input) {
  const button = form.querySelector('button[type="submit"]');
  const originalButton = button.innerHTML;
  errorElement.hidden = true;
  errorElement.textContent = "";
  button.disabled = true;
  button.textContent = buttonText;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `The request failed (HTTP ${response.status}).`);
    }
    return payload;
  } catch (error) {
    errorElement.textContent = error.message || "Unable to complete the request. Please try again.";
    errorElement.hidden = false;
    return null;
  } finally {
    button.disabled = false;
    button.innerHTML = originalButton;
  }
}

function renderToolOutput(output, title, items, note) {
  output.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = title;
  output.append(heading);

  const list = document.createElement("ul");
  for (const item of items) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  }
  output.append(list);

  const disclaimer = document.createElement("p");
  disclaimer.textContent = note;
  output.append(disclaimer);
  output.hidden = false;
}

const scheduleForm = document.querySelector("#schedule-form");
scheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);
  const result = await requestToolResult(
    scheduleForm,
    "/api/publishing-schedule",
    document.querySelector("#schedule-error"),
    "Building your rhythm…",
    {
      postsPerWeek: Number(formData.get("postsPerWeek")),
      startDay: formData.get("startDay"),
      format: formData.get("format"),
    }
  );
  if (!result) return;

  const output = document.querySelector("#schedule-output");
  const now = new Date();
  const scheduleDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const firstDay = scheduleDays.indexOf(scheduleForm.elements.startDay.value);
  const daysUntilFirst = (firstDay - now.getDay() + 7) % 7;
  const firstDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFirst);
  const items = Array.from({ length: 4 }, (_, week) =>
    result.schedule.map((slot) => {
      const slotDay = scheduleDays.indexOf(slot.day);
      const slotDate = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        firstDate.getDate() + week * 7 + ((slotDay - firstDay + 7) % 7)
      );
      return `${slotDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })} — ${slot.format}`;
    })
  ).flat();
  renderToolOutput(
    output,
    "Your four-week repeating schedule",
    items,
    `${result.note} Repeats the same weekly pattern for four weeks; adjust it whenever your capacity changes.`
  );
});

const analyticsForm = document.querySelector("#analytics-form");
analyticsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(analyticsForm);
  const numericFields = [
    "views",
    "impressions",
    "clickThroughRate",
    "averageViewDurationMinutes",
    "videoLengthMinutes",
    "subscribersGained",
  ];
  const input = Object.fromEntries(
    numericFields.map((field) => [field, Number(formData.get(field))])
  );
  const result = await requestToolResult(
    analyticsForm,
    "/api/analytics-review",
    document.querySelector("#analytics-error"),
    "Reviewing your metrics…",
    input
  );
  if (!result) return;

  renderToolOutput(
    document.querySelector("#analytics-output"),
    "Signals to consider",
    result.observations,
    result.note
  );
});

const reminderStatus = document.querySelector("#reminder-status");
const reminderStorageKey = "channelcraft-weekly-reminder";
let reminderTimer = null;

function nextReminderTime(config) {
  const [hours, minutes] = config.time.split(":").map(Number);
  const now = new Date();
  const daysAhead = (config.day - now.getDay() + 7) % 7;
  let due = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysAhead,
    hours,
    minutes
  );
  if (due <= now) {
    due = new Date(due.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return due;
}

function armReminder(config) {
  if (reminderTimer !== null) {
    window.clearTimeout(reminderTimer);
  }
  const due = nextReminderTime(config);
  const delay = due.getTime() - Date.now();
  reminderStatus.textContent = `Weekly reminder set for ${due.toLocaleString()}. Keep this page open for it to appear.`;
  reminderTimer = window.setTimeout(() => {
    reminderTimer = null;
    if (Notification.permission !== "granted") {
      reminderStatus.textContent = "Browser notification permission is no longer available. Turn reminders on again to resume.";
      return;
    }
    try {
      new Notification("Time to work on your next upload", {
        body: "Your ChannelCraft weekly creator reminder.",
      });
    } catch (error) {
      reminderStatus.textContent = `The reminder could not be shown: ${error.message}`;
    }
    armReminder(config);
  }, Math.min(delay, 2_147_000_000));
}

function restoreReminder() {
  let savedReminder;
  try {
    savedReminder = localStorage.getItem(reminderStorageKey);
  } catch (error) {
    reminderStatus.textContent = `Browser storage is unavailable, so reminders cannot be restored: ${error.message}`;
    return;
  }
  if (!savedReminder) return;

  let config;
  try {
    config = JSON.parse(savedReminder);
  } catch (error) {
    reminderStatus.textContent = `The saved reminder could not be read: ${error.message}`;
    return;
  }
  if (
    !config ||
    !Number.isInteger(config.day) ||
    config.day < 0 ||
    config.day > 6 ||
    typeof config.time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.time)
  ) {
    reminderStatus.textContent = "The saved reminder settings are invalid. Turn it off and set it again.";
    return;
  }
  document.querySelector("#reminder-day").value = String(config.day);
  document.querySelector("#reminder-time").value = config.time;
  if (!("Notification" in window) || Notification.permission !== "granted") {
    reminderStatus.textContent = "A reminder is saved, but browser notifications are unavailable or not allowed.";
    return;
  }
  armReminder(config);
}

document.querySelector("#save-reminder").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    reminderStatus.textContent = "This browser does not support notifications.";
    return;
  }
  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (error) {
    reminderStatus.textContent = `Browser notification permission could not be requested: ${error.message}`;
    return;
  }
  if (permission !== "granted") {
    reminderStatus.textContent = "Notifications were not allowed, so no reminder was set.";
    return;
  }

  const config = {
    day: Number(document.querySelector("#reminder-day").value),
    time: document.querySelector("#reminder-time").value,
  };
  if (!Number.isInteger(config.day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.time)) {
    reminderStatus.textContent = "Choose a valid reminder day and time.";
    return;
  }
  try {
    localStorage.setItem(reminderStorageKey, JSON.stringify(config));
  } catch (error) {
    reminderStatus.textContent = `The reminder could not be saved in this browser: ${error.message}`;
    return;
  }
  armReminder(config);
});

document.querySelector("#clear-reminder").addEventListener("click", () => {
  if (reminderTimer !== null) {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
  }
  try {
    localStorage.removeItem(reminderStorageKey);
  } catch (error) {
    reminderStatus.textContent = `The reminder could not be removed from browser storage: ${error.message}`;
    return;
  }
  reminderStatus.textContent = "Reminders are off.";
});

restoreReminder();
