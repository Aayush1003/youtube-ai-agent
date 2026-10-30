const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = "gemini-2.5-flash";
const JAVA_AI_VOICE_STYLE =
  "Warm, resonant, grounded Hinglish mentor with a natural Indian-English accent. Sound sincere, compassionate, confident, and hopeful. Use conversational pacing, gentle pauses, and expressive emphasis: make the opening inviting, explain patiently, and end with a memorable, encouraging takeaway. Pronounce Java terms clearly. Avoid announcer hype, forced emotion, or exaggerated urgency.";
const MAX_BODY_SIZE = 12 * 1024;
const STATIC_FILES = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/anime-studio": ["anime.html", "text/html; charset=utf-8"],
  "/anime-studio.css": ["anime-studio.css", "text/css; charset=utf-8"],
  "/anime-studio.bundle.js": ["anime-studio.bundle.js", "text/javascript; charset=utf-8"],
  "/daily-video-studio": ["daily-video.html", "text/html; charset=utf-8"],
  "/daily-video-studio.css": ["daily-video-studio.css", "text/css; charset=utf-8"],
  "/daily-video-studio.bundle.js": ["daily-video-studio.bundle.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/short-studio.bundle.js": ["short-studio.bundle.js", "text/javascript; charset=utf-8"],
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

const javaShortResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    scenes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          caption: { type: "STRING" },
          visualLabels: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["title", "caption", "visualLabels"],
      },
    },
    voiceover: { type: "STRING" },
  },
  required: ["title", "scenes", "voiceover"],
};

const ANIME_AI_VOICE_STYLE =
  "Warm, expressive Hinglish storyteller with a clear Indian-English accent. Use cinematic but natural pacing, sincere emotion, gentle pauses, and distinct character moments without caricature. Build wonder and tension patiently, then land the ending with warmth and hope. Pronounce names clearly. Avoid announcer hype or exaggerated melodrama.";

const DAILY_VIDEO_CATEGORIES = {
  gaming: {
    label: "Gaming",
    direction: "Make a useful gaming video: a strategy, challenge, mechanics explainer, beginner tip, or thoughtful commentary. Do not invent player statistics or claim game facts without research.",
  },
  education: {
    label: "Education",
    direction: "Teach one useful idea with an accurate, beginner-friendly explanation and a concrete example.",
  },
  technology: {
    label: "Technology",
    direction: "Explain a technology, tool, or trend with practical context, clear distinctions, and no unsupported performance or future claims.",
  },
  entertainment: {
    label: "Entertainment",
    direction: "Create an entertaining, original comedy, challenge, reaction-style commentary, or pop-culture explainer without copying protected characters or scripts.",
  },
  storytelling: {
    label: "Storytelling",
    direction: "Create an emotionally specific, original mini-story with a character goal, visual turning point, and satisfying ending.",
  },
};

const DAILY_VIDEO_VOICE_STYLE =
  "Warm, clear, confident Indian-English storyteller with natural conversational pacing. Adapt delivery to the video: playful for gaming or entertainment, patient for education or technology, and expressive for storytelling. Keep it engaging and sincere, with clear pronunciation and no exaggerated hype.";

function validateDailyVideoInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide a prompt as a JSON object.";
  }
  if (
    typeof input.prompt !== "string" ||
    input.prompt.trim().length === 0 ||
    input.prompt.trim().length > 500
  ) {
    return "prompt must be between 1 and 500 characters.";
  }
  if (!Object.hasOwn(DAILY_VIDEO_CATEGORIES, input.category)) {
    return "Choose gaming, education, technology, entertainment, or storytelling.";
  }
  if (!["short", "long"].includes(input.format)) {
    return "Choose either short or long video format.";
  }
  if (typeof input.research !== "boolean") {
    return "Choose whether web research should be enabled.";
  }
  return null;
}

function buildDailyVideoPrompt(input) {
  const isLong = input.format === "long";
  const sceneCount = isLong ? 18 : 6;
  const wordRange = isLong ? "550 to 650 words" : "105 to 125 words";
  const category = DAILY_VIDEO_CATEGORIES[input.category];
  return [
    `Create an engaging ${isLong ? "approximately five-minute, landscape YouTube video" : "60-second vertical YouTube Short"} for the ${category.label} category from this creator's prompt: "${input.prompt.trim()}".`,
    category.direction,
    "Write in clear, natural English unless the creator explicitly asks for another language. Begin with a concise hook, deliver the promised value or story, and end with a useful or memorable takeaway. Avoid filler, fake urgency, engagement bait, and promises of guaranteed results.",
    `Return exactly ${sceneCount} sequential scenes. Every scene must have title (max 42 characters), caption (max 100 characters), setting (max 100 characters), and 2 or 3 visualLabels (each max 18 characters) suitable for clean animated graphics.`,
    `The complete voiceover should be about ${wordRange}. Write naturally for speech, and keep scene captions aligned with the narration.`,
    input.research
      ? "Use Google Search for relevant current context and factual claims; distinguish verified facts from ideas. Avoid making up evidence. Return only useful citations that informed the script."
      : "Do not depend on current web facts. Keep factual claims to reliable general knowledge and identify uncertainty rather than inventing details.",
    "Create original narration and visual ideas. Do not reproduce or imitate copyrighted scripts, lyrics, characters, game art, or footage. Do not impersonate real people. Keep the content suitable for a broad audience.",
    "Return only valid JSON with title, logline, scenes, and voiceover fields. Do not include markdown fences or extra commentary.",
  ].join("\n");
}

async function createDailyVideo(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "Daily video creation needs Gemini AI. Set GEMINI_API_KEY on the server, restart npm start, and try again."
    );
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(input.research ? 120_000 : 90_000),
    body: JSON.stringify({
      model: "gemini-3.8-flash",
      input: buildDailyVideoPrompt(input),
      ...(input.research ? { tools: [{ type: "google_search" }] } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Gemini could not generate the ${DAILY_VIDEO_CATEGORIES[input.category].label.toLowerCase()} video (HTTP ${response.status}). Check the API key, search grounding access, and quota.`
    );
  }

  const interaction = await response.json();
  const video = parseInteractionJson(interaction, "Gemini returned an unreadable video script. Please try again.");
  if (!isValidAnimeVideo(video, input.format)) {
    throw new Error("Gemini returned an incomplete video storyboard. Please try again.");
  }
  const sources = extractInteractionCitations(interaction);
  if (input.research && sources.length === 0) {
    throw new Error("No verifiable web citations were returned. Try again or turn off web research.");
  }

  const speechResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: "gemini-3.8-flash-tts",
      input: [
        {
          type: "user_input",
          content: [
            {
              type: "text",
              text: video.voiceover,
              annotations: [{ type: "speech_metadata", style: DAILY_VIDEO_VOICE_STYLE }],
            },
          ],
        },
      ],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: "Kore" }] },
    }),
  });
  if (!speechResponse.ok) {
    throw new Error(
      `Gemini could not generate the video narration (HTTP ${speechResponse.status}). Check TTS model access and quota.`
    );
  }
  const speechData = await speechResponse.json();
  const audioData =
    speechData.output_audio?.data ||
    speechData.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === "audio")
      .at(-1)?.data;
  if (typeof audioData !== "string" || !audioData) {
    throw new Error("Gemini returned no video narration audio. Please try again.");
  }
  return {
    ...video,
    category: input.category,
    format: input.format,
    voiceSource: "ai",
    sources,
    audioBase64: audioData,
    audioMimeType: "audio/wav",
  };
}

function validateJavaShortInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide the Java concept as a JSON object.";
  }
  if (
    typeof input.concept !== "string" ||
    input.concept.trim().length === 0 ||
    input.concept.trim().length > 160
  ) {
    return "concept must be between 1 and 160 characters.";
  }
  if (input.language !== "Hinglish") {
    return "Choose Hinglish for the daily Java Short.";
  }
  if (!["short", "long"].includes(input.format)) {
    return "Choose either short or long video format.";
  }
  if (!["ai", "upload"].includes(input.voiceSource)) {
    return "Choose an AI voice or upload your own narration.";
  }
  return null;
}

function validateAnimeIdeaInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide an idea topic as a JSON object.";
  }
  if (
    input.topic !== undefined &&
    (typeof input.topic !== "string" || input.topic.trim().length > 180)
  ) {
    return "topic must be text no longer than 180 characters.";
  }
  return null;
}

function validateAnimeVideoInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Provide a story idea as a JSON object.";
  }
  if (
    typeof input.idea !== "string" ||
    input.idea.trim().length === 0 ||
    input.idea.trim().length > 500
  ) {
    return "idea must be between 1 and 500 characters.";
  }
  if (!["short", "long"].includes(input.format)) {
    return "Choose either short or long video format.";
  }
  if (!["ai", "upload"].includes(input.voiceSource)) {
    return "Choose an AI voice or upload your own narration.";
  }
  return null;
}

function buildAnimeIdeasPrompt(input) {
  const topic = input.topic?.trim();
  return [
    "Use Google Search to research current, human-centered topics and creative conversations that could inspire an original anime-inspired YouTube mini-story.",
    topic
      ? `The creator is interested in this theme: "${topic}". Search for useful, recent context and fresh angles related to it.`
      : "The creator has no fixed topic. Search for timely, broadly relatable human stories and choose a surprising, hopeful angle.",
    "Treat search results as inspiration and factual context only. Invent entirely new characters, settings, and plotlines; never copy existing anime, manga, films, games, creators, characters, dialogue, or story worlds.",
    "Return only valid JSON with an ideas array of exactly 3 distinct objects. Each object must have title (max 70 characters), logline (one vivid original story premise, max 320 characters), and humanInsight (a short reason the emotional theme may resonate, max 220 characters). Do not include markdown fences or extra commentary.",
    "Make the premises emotionally specific, visual, understandable in one sentence, and suitable for a short animated film. Avoid tragedy-as-clickbait, graphic violence, stereotypes, and unsupported factual claims.",
  ].join("\n");
}

function parseInteractionJson(response, message) {
  const text = response.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("")
    .trim();
  if (!text) throw new Error(message);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(message);
  }
}

function extractInteractionCitations(response) {
  const citations = response.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .flatMap((part) => part.annotations || [])
    .filter(
      (annotation) =>
        annotation.type === "url_citation" &&
        typeof annotation.url === "string" &&
        /^https?:\/\//i.test(annotation.url)
    )
    .map((annotation) => ({
      title: typeof annotation.title === "string" && annotation.title ? annotation.title : new URL(annotation.url).hostname,
      url: annotation.url,
    }));
  return [...new Map((citations || []).map((citation) => [citation.url, citation])).values()];
}

function isValidAnimeIdeas(result) {
  return Boolean(
    result &&
      Array.isArray(result.ideas) &&
      result.ideas.length === 3 &&
      result.ideas.every(
        (idea) =>
          idea &&
          typeof idea.title === "string" &&
          idea.title.trim().length > 0 &&
          idea.title.length <= 70 &&
          typeof idea.logline === "string" &&
          idea.logline.trim().length > 0 &&
          idea.logline.length <= 320 &&
          typeof idea.humanInsight === "string" &&
          idea.humanInsight.trim().length > 0 &&
          idea.humanInsight.length <= 220
      )
  );
}

async function searchAnimeIdeas(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "Anime story ideas need Gemini web research. Set GEMINI_API_KEY on the server, restart npm start, and try again."
    );
    error.statusCode = 503;
    throw error;
  }

  const result = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: "gemini-3.8-flash",
      input: buildAnimeIdeasPrompt(input),
      tools: [{ type: "google_search" }],
    }),
  });
  if (!result.ok) {
    throw new Error(
      `Gemini could not research anime story ideas (HTTP ${result.status}). Check the API key, search grounding access, and quota.`
    );
  }

  const response = await result.json();
  const ideas = parseInteractionJson(response, "Gemini returned unreadable story ideas. Please try again.");
  if (!isValidAnimeIdeas(ideas)) {
    throw new Error("Gemini returned incomplete story ideas. Please try again.");
  }
  const sources = extractInteractionCitations(response);
  if (sources.length === 0) {
    throw new Error("Gemini returned no verifiable web sources. Please try the research step again.");
  }
  return {
    ideas: ideas.ideas,
    sources,
    searchQueries: response.steps
      ?.filter((step) => step.type === "google_search_call")
      .flatMap((step) => step.arguments?.queries || []),
  };
}

function buildAnimeVideoPrompt(input) {
  const isLong = input.format === "long";
  const sceneCount = isLong ? 18 : 6;
  const wordRange = isLong ? "550 to 650 words" : "105 to 125 words";
  return [
    `Create an original anime-inspired, approximately ${isLong ? "five-minute landscape" : "60-second vertical"} animated short film from this creator-selected premise: "${input.idea.trim()}".`,
    "Write the narration in natural Hinglish using Roman Hindi and familiar English terms. Make it cinematic, emotionally honest, accessible, and memorable, with a clear character desire, a visual turning point, and a resonant ending.",
    `Return exactly ${sceneCount} sequential scenes. Every scene must have title (max 42 characters), caption (max 100 characters), setting (max 100 characters), and 2 or 3 visualLabels (each max 18 characters) describing simple visual motifs.`,
    `The complete voiceover should be about ${wordRange}. Use natural spoken phrasing and clear pauses; make the narration and scene captions tell the same story.`,
    input.voiceSource === "upload"
      ? "The creator will record and upload their own narration, so write it clearly with natural pauses."
      : "Write for an expressive, warm Hinglish story narrator. Let curiosity and emotion build naturally and end with grounded hope; avoid clickbait and exaggerated melodrama.",
    "The story, characters, and setting must be original. Do not imitate or reference existing anime/manga series, named studios, artists, characters, dialogue, or copyrighted story worlds. Keep it suitable for a broad audience, non-graphic, respectful, and culturally specific without stereotypes.",
    "Return only valid JSON with title, logline, scenes, and voiceover fields. Do not include markdown fences or extra commentary.",
  ].join("\n");
}

function isValidAnimeVideo(video, format = "short") {
  const expectedScenes = format === "long" ? 18 : 6;
  const minimumWords = format === "long" ? 400 : 70;
  const maximumCharacters = format === "long" ? 14000 : 2500;
  return Boolean(
    video &&
      typeof video.title === "string" &&
      video.title.trim().length > 0 &&
      video.title.length <= 70 &&
      typeof video.logline === "string" &&
      video.logline.trim().length > 0 &&
      video.logline.length <= 320 &&
      Array.isArray(video.scenes) &&
      video.scenes.length === expectedScenes &&
      video.scenes.every(
        (scene) =>
          scene &&
          typeof scene.title === "string" &&
          scene.title.trim().length > 0 &&
          scene.title.length <= 42 &&
          typeof scene.caption === "string" &&
          scene.caption.trim().length > 0 &&
          scene.caption.length <= 100 &&
          typeof scene.setting === "string" &&
          scene.setting.trim().length > 0 &&
          scene.setting.length <= 100 &&
          Array.isArray(scene.visualLabels) &&
          scene.visualLabels.length >= 2 &&
          scene.visualLabels.length <= 3 &&
          scene.visualLabels.every(
            (label) => typeof label === "string" && label.trim().length > 0 && label.length <= 18
          )
      ) &&
      typeof video.voiceover === "string" &&
      video.voiceover.trim().split(/\s+/).length >= minimumWords &&
      video.voiceover.length <= maximumCharacters
  );
}

async function createAnimeVideo(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "Anime story videos need Gemini AI. Set GEMINI_API_KEY on the server, restart npm start, and try again."
    );
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: "gemini-3.8-flash",
      input: buildAnimeVideoPrompt(input),
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Gemini could not write the anime story (HTTP ${response.status}). Check the API key and quota.`
    );
  }

  const video = parseInteractionJson(await response.json(), "Gemini returned an unreadable anime story. Please try again.");
  if (!isValidAnimeVideo(video, input.format)) {
    throw new Error("Gemini returned an incomplete anime storyboard. Please try again.");
  }
  if (input.voiceSource === "upload") {
    return { ...video, format: input.format, voiceSource: input.voiceSource, audioMimeType: null };
  }

  const speechResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: "gemini-3.8-flash-tts",
      input: [
        {
          type: "user_input",
          content: [
            {
              type: "text",
              text: video.voiceover,
              annotations: [{ type: "speech_metadata", style: ANIME_AI_VOICE_STYLE }],
            },
          ],
        },
      ],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: "Kore" }] },
    }),
  });
  if (!speechResponse.ok) {
    throw new Error(
      `Gemini could not generate the anime narration (HTTP ${speechResponse.status}). Check TTS model access and quota.`
    );
  }
  const speechData = await speechResponse.json();
  const audioData =
    speechData.output_audio?.data ||
    speechData.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === "audio")
      .at(-1)?.data;
  if (typeof audioData !== "string" || !audioData) {
    throw new Error("Gemini returned no anime narration audio. Please try again.");
  }
  return {
    ...video,
    format: input.format,
    voiceSource: input.voiceSource,
    audioBase64: audioData,
    audioMimeType: "audio/wav",
  };
}

function buildJavaShortPrompt(input) {
  const isLong = input.format === "long";
  const sceneCount = isLong ? 18 : 6;
  const wordRange = isLong ? "550 to 650 words" : "105 to 125 words";
  return [
    `Create an accurate, engaging ${isLong ? "approximately five-minute, landscape YouTube lesson" : "60-second vertical YouTube Short"} about this Java concept: "${input.concept.trim()}".`,
    "Write the voiceover in natural Hinglish using Roman Hindi mixed with the standard English Java terms.",
    `Return exactly ${sceneCount} scenes in a clear teaching sequence. Start with a hook, explain the core idea, include a worked Java example and important edge cases, and finish with a concise takeaway. Spread the explanation naturally across all scenes.`,
    "Each scene needs a concise on-screen title (max 42 characters), caption (max 90 characters), and 2 or 3 short visualLabels (max 16 characters each).",
    `The complete voiceover should be about ${wordRange}, sound natural when spoken, and explain the same facts as the scenes.`,
    input.voiceSource === "upload"
      ? "The creator will record and upload their own narration, so write the voiceover script clearly and include natural pauses."
      : "Write for a warm, sincere Hinglish mentor speaking to one curious learner. Make the opening inviting, explain patiently why the idea matters in real code, and finish with an encouraging, memorable takeaway. Keep the emotion genuine and grounded; avoid hype, guilt, grand promises, or engagement bait. Write words and numbers so the AI voice can pronounce them clearly.",
    "Be technically precise, distinguish average from worst-case behavior where relevant, and do not invent Java APIs or guarantee outcomes.",
  ].join("\n");
}

function isValidJavaShort(short, format = "short") {
  const expectedScenes = format === "long" ? 18 : 6;
  const minimumWords = format === "long" ? 400 : 70;
  const maximumCharacters = format === "long" ? 10000 : 1800;
  return Boolean(
    short &&
      typeof short.title === "string" &&
      short.title.length > 0 &&
      short.title.length <= 70 &&
      Array.isArray(short.scenes) &&
      short.scenes.length === expectedScenes &&
      short.scenes.every(
        (scene) =>
          scene &&
          typeof scene.title === "string" &&
          scene.title.length > 0 &&
          scene.title.length <= 42 &&
          typeof scene.caption === "string" &&
          scene.caption.length > 0 &&
          scene.caption.length <= 90 &&
          Array.isArray(scene.visualLabels) &&
          scene.visualLabels.length >= 2 &&
          scene.visualLabels.length <= 3 &&
          scene.visualLabels.every(
            (label) => typeof label === "string" && label.length > 0 && label.length <= 16
          )
      ) &&
      typeof short.voiceover === "string" &&
      short.voiceover.trim().split(/\s+/).length >= minimumWords &&
      short.voiceover.length <= maximumCharacters
  );
}

async function generateJavaShort(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "Daily Java videos need Gemini AI to generate a script. Set GEMINI_API_KEY on the server, restart npm start, and try again."
    );
    error.statusCode = 503;
    throw error;
  }

  const promptUrl = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
  );
  promptUrl.searchParams.set("key", apiKey);
  const promptResult = await fetch(promptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildJavaShortPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: javaShortResponseSchema,
        temperature: 0.6,
      },
    }),
  });
  if (!promptResult.ok) {
    throw new Error(`Gemini could not write the Java Short (HTTP ${promptResult.status}). Check the API key and quota.`);
  }
  const promptData = await promptResult.json();
  const generatedText = promptData.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");
  let short;
  try {
    short = JSON.parse(generatedText);
  } catch {
    throw new Error("Gemini returned an unreadable Java Short. Please try again.");
  }
  if (!isValidJavaShort(short, input.format)) {
    throw new Error("Gemini returned an incomplete video script. Please try again.");
  }

  if (input.voiceSource === "upload") {
    return { ...short, format: input.format, voiceSource: input.voiceSource, audioMimeType: null };
  }

  const speechResult = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model: "gemini-3.8-flash-tts",
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: short.voiceover,
                annotations: [
                  {
                    type: "speech_metadata",
                    style: JAVA_AI_VOICE_STYLE,
                  },
                ],
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: "Kore" }] },
      }),
    }
  );
  if (!speechResult.ok) {
    throw new Error(
      `Gemini could not generate voice narration (HTTP ${speechResult.status}). Check TTS model access and quota.`
    );
  }
  const speechData = await speechResult.json();
  const audioData =
    speechData.output_audio?.data ||
    speechData.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === "audio")
      .at(-1)?.data;
  if (typeof audioData !== "string" || !audioData) {
    throw new Error("Gemini returned no voice audio. Please try again.");
  }

  return {
    ...short,
    format: input.format,
    voiceSource: input.voiceSource,
    audioBase64: audioData,
    audioMimeType: "audio/wav",
  };
}

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
  "/api/daily-video": { validate: validateDailyVideoInput, run: createDailyVideo },
  "/api/java-short": { validate: validateJavaShortInput, run: generateJavaShort },
  "/api/anime-ideas": { validate: validateAnimeIdeaInput, run: searchAnimeIdeas },
  "/api/anime-video": { validate: validateAnimeVideoInput, run: createAnimeVideo },
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
  buildDailyVideoPrompt,
  buildAnimeIdeasPrompt,
  buildAnimeVideoPrompt,
  buildJavaShortPrompt,
  buildLocalPlan,
  buildPrompt,
  buildPublishingSchedule,
  isValidAnimeIdeas,
  isValidAnimeVideo,
  isValidPlan,
  isValidJavaShort,
  generateJavaShort,
  searchAnimeIdeas,
  createAnimeVideo,
  createDailyVideo,
  reviewAnalytics,
  validateAnalyticsInput,
  validateInput,
  validateJavaShortInput,
  validateAnimeIdeaInput,
  validateAnimeVideoInput,
  validateDailyVideoInput,
  validateScheduleInput,
};
