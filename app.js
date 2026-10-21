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

const shortCanvas = document.querySelector("#short-canvas");
const shortContext = shortCanvas.getContext("2d");
const shortStatus = document.querySelector("#short-status");
const playShortButton = document.querySelector("#play-short");
const exportShortButton = document.querySelector("#export-short");
const SHORT_DURATION = 25;
let shortAnimationFrame = null;
let shortStartedAt = 0;

const shortScenes = [
  { start: 0, end: 4.5, caption: "Find the pair. Skip the nested loop.", title: "TWO SUM", detail: "with two pointers", kind: "hook" },
  { start: 4.5, end: 9.2, caption: "Start at both ends of the sorted array.", title: "Target = 10", detail: "Sorted array", kind: "setup" },
  { start: 9.2, end: 14.3, caption: "1 + 8 = 9. Too small? Move left.", title: "1 + 8 = 9", detail: "Too small → move left", kind: "move" },
  { start: 14.3, end: 18.8, caption: "2 + 8 = 10. Found it!", title: "2 + 8 = 10", detail: "Pair found", kind: "found" },
  { start: 18.8, end: 22.7, caption: "Sorted input lets each pointer move once.", title: "O(n) time", detail: "One pass. No nested loop.", kind: "complexity" },
  { start: 22.7, end: SHORT_DURATION, caption: "Follow for more clear DSA walkthroughs.", title: "Learn it. Build it.", detail: "Aayush Engineering Hub", kind: "outro" },
];

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawShort(time = 0) {
  const context = shortContext;
  const width = shortCanvas.width;
  const height = shortCanvas.height;
  const scene = shortScenes.find((item) => time >= item.start && time < item.end) || shortScenes.at(-1);
  const progress = Math.min(time / SHORT_DURATION, 1);
  const elapsed = time - scene.start;
  const reveal = Math.min((elapsed + 0.3) / 0.45, 1);
  const ease = 1 - (1 - reveal) ** 3;

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#101a38");
  background.addColorStop(0.58, "#171c43");
  background.addColorStop(1, "#291d54");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.22;
  context.fillStyle = "#7c68ff";
  context.beginPath();
  context.arc(890, 370, 260 + Math.sin(time * 1.3) * 12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#19d3c5";
  context.beginPath();
  context.arc(100, 1460, 240, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = "#b9b6d8";
  context.font = "700 27px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText("AAYUSH ENGINEERING HUB", 76, 104);
  context.textAlign = "right";
  context.fillStyle = "#b9b6d8";
  context.fillText("DSA • 01", 1004, 104);
  context.fillStyle = "rgba(255,255,255,.13)";
  roundedRect(context, 76, 132, 928, 2, 2);
  context.fill();

  context.globalAlpha = ease;
  context.textAlign = "center";
  context.fillStyle = "#9d8bff";
  context.font = "700 27px Arial, sans-serif";
  context.fillText(scene.detail.toUpperCase(), 540, 330);
  context.fillStyle = "#ffffff";
  context.font = "800 78px Arial, sans-serif";
  context.fillText(scene.title, 540, 440);

  if (scene.kind === "hook") {
    context.fillStyle = "#c9c7dd";
    context.font = "500 38px Arial, sans-serif";
    context.fillText("A visual guide to the sorted-array trick", 540, 520);
    context.save();
    context.translate(540, 760);
    context.rotate(Math.sin(time * 2) * 0.035);
    context.fillStyle = "rgba(255,255,255,.08)";
    roundedRect(context, -330, -100, 660, 200, 32);
    context.fill();
    context.fillStyle = "#21d4c2";
    context.font = "800 70px Arial, sans-serif";
    context.fillText("O(n²)", -160, 22);
    context.fillStyle = "#fff";
    context.font = "700 56px Arial, sans-serif";
    context.fillText("→", 0, 20);
    context.fillStyle = "#c7b9ff";
    context.font = "800 70px Arial, sans-serif";
    context.fillText("O(n)", 160, 22);
    context.restore();
  } else if (["setup", "move", "found"].includes(scene.kind)) {
    const values = [1, 2, 4, 6, 8];
    const tileWidth = 126;
    const tileGap = 30;
    const totalWidth = values.length * tileWidth + (values.length - 1) * tileGap;
    const firstX = (width - totalWidth) / 2;
    const tileY = 690;
    const activePair = scene.kind === "move" ? [1, 4] : scene.kind === "found" ? [1, 4] : [];

    values.forEach((value, index) => {
      const x = firstX + index * (tileWidth + tileGap);
      const active = activePair.includes(index);
      context.fillStyle = active
        ? scene.kind === "found" ? "#7b63f2" : "#176e7d"
        : "rgba(255,255,255,.11)";
      roundedRect(context, x, tileY, tileWidth, 126, 24);
      context.fill();
      context.strokeStyle = active
        ? scene.kind === "found" ? "#b9aaff" : "#36e1d2"
        : "rgba(255,255,255,.13)";
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = "#fff";
      context.font = "800 57px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText(String(value), x + tileWidth / 2, tileY + 81);
    });

    if (scene.kind !== "setup") {
      const leftIndex = scene.kind === "move" && elapsed < 2.55 ? 0 : 1;
      const rightIndex = 4;
      const pointerY = tileY + 190;
      const pointer = (index, label, color) => {
        const x = firstX + index * (tileWidth + tileGap) + tileWidth / 2;
        context.fillStyle = color;
        context.font = "700 29px Arial, sans-serif";
        context.fillText(label, x, pointerY + 47);
        context.beginPath();
        context.moveTo(x, pointerY + 22);
        context.lineTo(x - 13, pointerY);
        context.lineTo(x + 13, pointerY);
        context.closePath();
        context.fill();
      };
      pointer(leftIndex, "LEFT", "#36e1d2");
      pointer(rightIndex, "RIGHT", "#c7b9ff");
    }

    context.fillStyle = "rgba(255,255,255,.1)";
    roundedRect(context, 210, 1040, 660, 112, 24);
    context.fill();
    context.fillStyle = scene.kind === "found" ? "#7ce5b4" : "#d9d6ed";
    context.font = "700 40px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(scene.kind === "setup" ? "Sorted:  [1, 2, 4, 6, 8]" : scene.kind === "found" ? "2 + 8 matches the target!" : "Compare left + right", 540, 1110);
  } else {
    context.fillStyle = "rgba(255,255,255,.09)";
    roundedRect(context, 190, 680, 700, 300, 34);
    context.fill();
    context.strokeStyle = "rgba(196,185,255,.4)";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#36e1d2";
    context.font = "800 70px Arial, sans-serif";
    context.fillText(scene.kind === "complexity" ? "O(n)" : "✦", 540, 810);
    context.fillStyle = "#c9c7dd";
    context.font = "600 34px Arial, sans-serif";
    context.fillText(scene.kind === "complexity" ? "Each pointer moves at most n times" : "Short lessons. Real understanding.", 540, 890);
  }
  context.globalAlpha = 1;

  context.fillStyle = "#fff";
  context.font = "700 37px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(scene.caption, 540, 1395);
  context.fillStyle = "rgba(255,255,255,.2)";
  roundedRect(context, 76, 1792, 928, 8, 4);
  context.fill();
  context.fillStyle = "#36e1d2";
  roundedRect(context, 76, 1792, 928 * progress, 8, 4);
  context.fill();
  context.fillStyle = "#aaa7c6";
  context.font = "600 24px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText("TWO POINTERS • TWO SUM", 76, 1844);
  context.textAlign = "right";
  context.fillText(`${Math.floor(time).toString().padStart(2, "0")} / 25 SEC`, 1004, 1844);
}

function stopShortPreview() {
  if (shortAnimationFrame !== null) {
    window.cancelAnimationFrame(shortAnimationFrame);
    shortAnimationFrame = null;
  }
  playShortButton.disabled = false;
  playShortButton.innerHTML = 'Play preview <span aria-hidden="true">▶</span>';
}

function playShort() {
  stopShortPreview();
  shortStartedAt = performance.now();
  playShortButton.disabled = true;
  playShortButton.textContent = "Playing preview…";
  shortStatus.textContent = "Preview playing. This short has no audio; use the script below to record narration.";
  const renderFrame = (now) => {
    const elapsed = (now - shortStartedAt) / 1000;
    drawShort(Math.min(elapsed, SHORT_DURATION));
    if (elapsed < SHORT_DURATION) {
      shortAnimationFrame = window.requestAnimationFrame(renderFrame);
    } else {
      stopShortPreview();
      shortStatus.textContent = "Preview finished. Export the video when you’re ready.";
    }
  };
  shortAnimationFrame = window.requestAnimationFrame(renderFrame);
}

playShortButton.addEventListener("click", playShort);

exportShortButton.addEventListener("click", () => {
  if (!window.MediaRecorder || typeof shortCanvas.captureStream !== "function") {
    shortStatus.textContent = "Video export is not supported in this browser. Try the latest Chrome or Edge desktop browser.";
    return;
  }
  stopShortPreview();
  exportShortButton.disabled = true;
  playShortButton.disabled = true;
  exportShortButton.textContent = "Preparing video…";
  shortStatus.textContent = "Recording the 25-second animation. Keep this tab open until the download starts.";

  let recorder;
  try {
    const stream = shortCanvas.captureStream(30);
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("error", (event) => {
      shortStatus.textContent = `Video export failed: ${event.error?.message || "the browser recorder reported an error."}`;
    });
    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      if (chunks.length) {
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "aayush-two-pointers-short.webm";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
        shortStatus.textContent = "Your WebM video is downloaded. It’s silent—record the voiceover script and add it in your editor.";
      } else {
        shortStatus.textContent = "The browser did not produce a video file. Try again in a current Chrome or Edge browser.";
      }
      drawShort(0);
      exportShortButton.disabled = false;
      exportShortButton.innerHTML = 'Export video <span class="button-arrow" aria-hidden="true">↓</span>';
      playShortButton.disabled = false;
    }, { once: true });

    drawShort(0);
    recorder.start(250);
    shortStartedAt = performance.now();
    const renderFrame = (now) => {
      const elapsed = (now - shortStartedAt) / 1000;
      drawShort(Math.min(elapsed, SHORT_DURATION));
      if (elapsed < SHORT_DURATION && recorder.state === "recording") {
        shortAnimationFrame = window.requestAnimationFrame(renderFrame);
      } else if (recorder.state === "recording") {
        recorder.stop();
      }
    };
    shortAnimationFrame = window.requestAnimationFrame(renderFrame);
  } catch (error) {
    exportShortButton.disabled = false;
    exportShortButton.innerHTML = 'Export video <span class="button-arrow" aria-hidden="true">↓</span>';
    playShortButton.disabled = false;
    shortStatus.textContent = `Could not start video export: ${error.message}`;
  }
});

document.querySelector("#copy-voiceover").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(document.querySelector("#voiceover-script").textContent);
    button.textContent = "Copied";
  } catch (error) {
    shortStatus.textContent = `Could not copy the script: ${error.message}`;
  }
});

drawShort(0);
