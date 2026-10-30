import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import workflow from "./daily-video-workflow.cjs";

const { DAILY_VIDEO_CATEGORIES, calculateStreak, localDateKey } = workflow;
const CATEGORY_BY_ID = Object.fromEntries(DAILY_VIDEO_CATEGORIES.map((category) => [category.id, category]));
const PROGRESS_KEY = "channelcraft.daily-video-progress";
const PROMPT_KEY = "channelcraft.daily-video-prompt";
const FORMAT_KEY = "channelcraft.daily-video-format";
const RESEARCH_KEY = "channelcraft.daily-video-research";
const UPLOAD_DURATION_LIMIT = { short: 120, long: 600 };

function drawFrame(canvas, video, time) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser could not create the video canvas.");

  const width = canvas.width;
  const height = canvas.height;
  const minDimension = Math.min(width, height);
  const category = CATEGORY_BY_ID[video.category] || DAILY_VIDEO_CATEGORIES[0];
  const elapsed = Math.max(0, Math.min(time, video.duration));
  const sceneDuration = video.duration / video.scenes.length;
  const sceneIndex = Math.min(Math.floor(elapsed / sceneDuration), video.scenes.length - 1);
  const scene = video.scenes[sceneIndex];
  const progress = video.duration ? elapsed / video.duration : 0;
  const [base, mid, accent] = category.colors;
  const background = context.createLinearGradient(0, 0, width * 0.4, height);
  background.addColorStop(0, base);
  background.addColorStop(0.65, mid);
  background.addColorStop(1, "#101320");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.72, height * 0.34, 3, width * 0.72, height * 0.34, minDimension * 0.45);
  glow.addColorStop(0, `${accent}55`);
  glow.addColorStop(1, `${accent}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  if (video.category === "gaming") {
    const cell = minDimension * 0.045;
    context.globalAlpha = 0.22;
    context.strokeStyle = accent;
    context.lineWidth = Math.max(1, minDimension * 0.0015);
    for (let x = 0; x <= width; x += cell) {
      context.beginPath();
      context.moveTo(x, height * 0.34);
      context.lineTo(x, height * 0.71);
      context.stroke();
    }
    for (let y = height * 0.34; y <= height * 0.71; y += cell) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.globalAlpha = 1;
    for (let index = 0; index < 8; index += 1) {
      const x = width * (0.13 + ((index * 23) % 70) / 100);
      const y = height * (0.38 + ((index * 31) % 28) / 100);
      context.fillStyle = index % 2 ? accent : "#ffffff";
      context.globalAlpha = 0.38 + ((index * 13) % 5) / 10;
      context.fillRect(x, y, minDimension * 0.018, minDimension * 0.018);
    }
    context.globalAlpha = 1;
  } else if (video.category === "technology") {
    context.globalAlpha = 0.3;
    context.strokeStyle = accent;
    context.lineWidth = Math.max(2, minDimension * 0.003);
    for (let index = 0; index < 7; index += 1) {
      const y = height * (0.35 + index * 0.047);
      context.beginPath();
      context.moveTo(width * 0.12, y);
      context.lineTo(width * 0.36, y);
      context.lineTo(width * 0.45, y - height * 0.055);
      context.lineTo(width * 0.82, y - height * 0.055);
      context.stroke();
      context.beginPath();
      context.arc(width * 0.36, y, minDimension * 0.009, 0, Math.PI * 2);
      context.fillStyle = accent;
      context.fill();
    }
    context.globalAlpha = 1;
  } else if (video.category === "education") {
    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const radius = minDimension * 0.16;
    context.strokeStyle = `${accent}aa`;
    context.lineWidth = Math.max(2, minDimension * 0.004);
    for (let ring = 1; ring <= 3; ring += 1) {
      context.beginPath();
      context.arc(centerX, centerY, radius * (ring / 3), 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = `${accent}55`;
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    context.fill();
    for (let index = 0; index < 5; index += 1) {
      const angle = elapsed * 0.25 + (index * Math.PI * 2) / 5;
      context.fillStyle = index % 2 ? "#f8f2e7" : accent;
      context.beginPath();
      context.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, minDimension * 0.012, 0, Math.PI * 2);
      context.fill();
    }
  } else if (video.category === "entertainment") {
    context.globalAlpha = 0.26;
    for (let index = 0; index < 17; index += 1) {
      const angle = -Math.PI * 0.88 + index * (Math.PI * 0.76) / 16;
      context.strokeStyle = index % 2 ? accent : "#f8e6d5";
      context.lineWidth = Math.max(3, minDimension * 0.012);
      context.beginPath();
      context.moveTo(width / 2, height * 0.37);
      context.lineTo(width / 2 + Math.cos(angle) * minDimension * 0.48, height * 0.37 + Math.sin(angle) * minDimension * 0.48);
      context.stroke();
    }
    context.globalAlpha = 1;
  } else {
    for (let index = 0; index < 26; index += 1) {
      const x = ((index * 137 + 41) % 997) / 997 * width;
      const y = ((index * 223 + 17) % 991) / 991 * height * 0.68;
      context.globalAlpha = 0.3 + (Math.sin(elapsed * 1.5 + index) + 1) * 0.25;
      context.fillStyle = "#fff2e5";
      context.beginPath();
      context.arc(x, y, Math.max(1.5, minDimension * 0.002), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.fillStyle = `${accent}38`;
    context.beginPath();
    context.arc(width * 0.77, height * 0.34, minDimension * 0.08, 0, Math.PI * 2);
    context.fill();
  }

  const horizon = height * 0.71;
  context.fillStyle = "rgba(9,11,22,.55)";
  context.beginPath();
  context.moveTo(0, horizon);
  context.lineTo(width * 0.16, horizon - height * 0.13);
  context.lineTo(width * 0.34, horizon + height * 0.02);
  context.lineTo(width * 0.55, horizon - height * 0.12);
  context.lineTo(width * 0.76, horizon + height * 0.01);
  context.lineTo(width, horizon - height * 0.1);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  const labelFont = Math.max(13, minDimension * 0.021);
  const titleFont = Math.max(24, minDimension * (video.format === "short" ? 0.055 : 0.045));
  context.textAlign = "left";
  context.fillStyle = "rgba(255,255,255,.82)";
  context.font = `700 ${labelFont}px Arial, sans-serif`;
  context.fillText(category.label.toUpperCase(), width * 0.065, height * 0.055);
  context.textAlign = "right";
  context.fillStyle = "rgba(255,255,255,.74)";
  context.fillText(`${String(sceneIndex + 1).padStart(2, "0")} / ${String(video.scenes.length).padStart(2, "0")}`, width * 0.935, height * 0.055);

  context.textAlign = "center";
  context.fillStyle = "#fff7eb";
  context.shadowColor = "rgba(5,6,14,.62)";
  context.shadowBlur = minDimension * 0.025;
  context.font = `800 ${titleFont}px Arial, sans-serif`;
  context.fillText(scene.title, width / 2, height * 0.19, width * 0.84);
  context.shadowBlur = 0;
  context.fillStyle = "rgba(255,247,236,.8)";
  context.font = `500 ${Math.max(14, minDimension * 0.022)}px Arial, sans-serif`;
  context.fillText(scene.setting, width / 2, height * 0.245, width * 0.8);

  context.font = `700 ${Math.max(12, minDimension * 0.016)}px Arial, sans-serif`;
  const labels = scene.visualLabels.slice(0, 3);
  const chipGap = minDimension * 0.016;
  const chipWidths = labels.map((label) => Math.min(width * 0.27, context.measureText(label).width + minDimension * 0.045));
  const totalChipWidth = chipWidths.reduce((sum, item) => sum + item, 0) + chipGap * (labels.length - 1);
  let chipX = (width - totalChipWidth) / 2;
  labels.forEach((label, index) => {
    const chipWidth = chipWidths[index];
    context.fillStyle = "rgba(12,14,25,.54)";
    context.fillRect(chipX, height * 0.29, chipWidth, minDimension * 0.04);
    context.strokeStyle = `${accent}bb`;
    context.lineWidth = Math.max(1, minDimension * 0.0018);
    context.strokeRect(chipX, height * 0.29, chipWidth, minDimension * 0.04);
    context.fillStyle = "#fff3e7";
    context.textAlign = "center";
    context.fillText(label, chipX + chipWidth / 2, height * 0.316, chipWidth - minDimension * 0.012);
    chipX += chipWidth + chipGap;
  });

  const captionX = width * 0.075;
  const captionY = height * 0.77;
  const captionWidth = width * 0.85;
  const captionHeight = height * 0.125;
  context.fillStyle = "rgba(9,11,22,.82)";
  context.fillRect(captionX, captionY, captionWidth, captionHeight);
  context.strokeStyle = `${accent}88`;
  context.lineWidth = Math.max(1, minDimension * 0.0018);
  context.strokeRect(captionX, captionY, captionWidth, captionHeight);
  context.fillStyle = "#fff8f1";
  context.font = `600 ${Math.max(17, minDimension * (video.format === "short" ? 0.032 : 0.027))}px Arial, sans-serif`;
  context.textAlign = "center";
  context.fillText(scene.caption, width / 2, captionY + captionHeight * 0.56, captionWidth * 0.89);

  context.fillStyle = "rgba(255,255,255,.22)";
  context.fillRect(width * 0.065, height * 0.94, width * 0.87, Math.max(4, minDimension * 0.005));
  context.fillStyle = accent;
  context.fillRect(width * 0.065, height * 0.94, width * 0.87 * progress, Math.max(4, minDimension * 0.005));
}

function formatDuration(seconds) {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes}:${String(total % 60).padStart(2, "0")}` : `${total} sec`;
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    const dates = Array.isArray(saved.completedDates)
      ? saved.completedDates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
      : [];
    return { completedDates: dates, streak: calculateStreak(dates) };
  } catch (error) {
    console.error("Could not load daily video progress:", error);
    return { completedDates: [], streak: 0 };
  }
}

function DailyVideoStudio() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const [categoryId, setCategoryId] = useState(() => {
    try {
      const stored = localStorage.getItem("channelcraft.daily-video-category");
      return CATEGORY_BY_ID[stored] ? stored : "gaming";
    } catch (error) {
      console.error("Could not load the saved video category:", error);
      return "gaming";
    }
  });
  const [prompt, setPrompt] = useState(() => {
    try {
      return localStorage.getItem(PROMPT_KEY) || "";
    } catch (error) {
      console.error("Could not load the saved video prompt:", error);
      return "";
    }
  });
  const [format, setFormat] = useState(() => {
    try {
      return localStorage.getItem(FORMAT_KEY) === "long" ? "long" : "short";
    } catch (error) {
      console.error("Could not load the saved video format:", error);
      return "short";
    }
  });
  const [research, setResearch] = useState(() => {
    try {
      return localStorage.getItem(RESEARCH_KEY) !== "false";
    } catch (error) {
      console.error("Could not load the saved research preference:", error);
      return true;
    }
  });
  const [progress, setProgress] = useState(readProgress);
  const [video, setVideo] = useState(null);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("idle");
  const [status, setStatus] = useState("One prompt creates your script, AI narration, animated video, and download.");
  const [error, setError] = useState("");

  const category = CATEGORY_BY_ID[categoryId];
  const busy = ["generating", "playing", "exporting"].includes(mode);
  const sceneIndex = video && video.duration
    ? Math.min(Math.floor((time / video.duration) * video.scenes.length), video.scenes.length - 1)
    : 0;

  function drawAt(currentVideo, currentTime) {
    if (canvasRef.current) drawFrame(canvasRef.current, currentVideo, currentTime);
  }

  function stopPreview() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    audioRef.current?.pause();
  }

  function clearAudio() {
    stopPreview();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current = null;
  }

  useEffect(() => {
    if (video) drawAt(video, 0);
  }, [video]);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    audioRef.current?.pause();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
  }, []);

  function saveSetting(key, value, message) {
    try {
      localStorage.setItem(key, value);
    } catch (storageError) {
      console.error(`Could not save ${message}:`, storageError);
      setStatus(`${message} changed, but could not be saved in this browser: ${storageError.message}`);
    }
  }

  function chooseCategory(nextCategory) {
    if (nextCategory === categoryId || busy) return;
    setCategoryId(nextCategory);
    setVideo(null);
    clearAudio();
    setTime(0);
    setError("");
    setStatus(`${CATEGORY_BY_ID[nextCategory].label} selected. Add a prompt and generate today's video.`);
    saveSetting("channelcraft.daily-video-category", nextCategory, "Video category");
  }

  function prepareVideo(generatedVideo, audioData, mimeType) {
    const bytes = Uint8Array.from(atob(audioData), (character) => character.charCodeAt(0));
    const audioUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType || "audio/wav" }));
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
      setError("The generated narration could not be decoded. Try a current Chrome or Edge browser.");
      setMode("idle");
    }, { once: true });
    audio.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError("The generated narration has an invalid duration. Please try again.");
        setMode("idle");
        return;
      }
      if (audio.duration > UPLOAD_DURATION_LIMIT[format]) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError(format === "short"
          ? "Short narration exceeded 2 minutes. Choose Long or generate a tighter script."
          : "Long narration exceeded 10 minutes. Please generate a shorter script.");
        setMode("idle");
        return;
      }
      const readyVideo = { ...generatedVideo, audioUrl, duration: audio.duration };
      if (canvasRef.current) {
        canvasRef.current.width = format === "long" ? 1920 : 1080;
        canvasRef.current.height = format === "long" ? 1080 : 1920;
      }
      setVideo(readyVideo);
      setTime(0);
      setMode("ready");
      setError("");
      setStatus(`Your ${category.label.toLowerCase()} video is ready with AI narration (${formatDuration(audio.duration)}). Preview it or download the WebM.`);
    }, { once: true });
    audio.src = audioUrl;
  }

  async function generateVideo(event) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    clearAudio();
    setVideo(null);
    setError("");
    setMode("generating");
    setStatus(research
      ? "Researching current sources, writing your video, and generating AI narration…"
      : "Writing your video and generating AI narration…");
    try {
      const response = await fetch("/api/daily-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), category: categoryId, format, research }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
      if (typeof result.audioBase64 !== "string" || !result.audioBase64) {
        throw new Error("The video was generated without narration audio. Please try again.");
      }
      const { audioBase64, ...generatedVideo } = result;
      prepareVideo(generatedVideo, audioBase64, result.audioMimeType);
      try {
        localStorage.setItem(PROMPT_KEY, prompt);
      } catch (storageError) {
        console.error("Could not save the video prompt:", storageError);
      }
    } catch (generationError) {
      setError(generationError.message);
      setStatus("The video could not be generated.");
      setMode("idle");
    }
  }

  async function playPreview() {
    if (!video || !audioRef.current || busy) return;
    stopPreview();
    if (audioRef.current.currentTime >= video.duration) audioRef.current.currentTime = 0;
    setMode("playing");
    setStatus("Playing the video with AI narration…");
    let lastUpdate = 0;
    const tick = (now) => {
      const currentTime = audioRef.current?.currentTime || 0;
      drawAt(video, currentTime);
      if (now - lastUpdate > 250) {
        setTime(currentTime);
        lastUpdate = now;
      }
      if (audioRef.current && !audioRef.current.paused) frameRef.current = requestAnimationFrame(tick);
    };
    audioRef.current.onended = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      drawAt(video, video.duration);
      setTime(video.duration);
      setMode("ready");
      setStatus("Preview finished. Your video is ready to download.");
    };
    try {
      await audioRef.current.play();
      frameRef.current = requestAnimationFrame(tick);
    } catch (playError) {
      setMode("ready");
      setStatus(`Could not play the narration: ${playError.message}`);
    }
  }

  function saveDownloadedProgress() {
    const today = localDateKey();
    const completedDates = progress.completedDates.includes(today)
      ? progress.completedDates
      : [...progress.completedDates, today].sort().slice(-90);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completedDates, lastCategory: categoryId }));
      const nextProgress = { completedDates, streak: calculateStreak(completedDates, today) };
      setProgress(nextProgress);
      setStatus(`Your ${category.label.toLowerCase()} video was downloaded. Today's video is complete; your streak is ${nextProgress.streak} day${nextProgress.streak === 1 ? "" : "s"}.`);
    } catch (storageError) {
      console.error("Could not save daily video progress:", storageError);
      setStatus(`Your video was downloaded, but daily progress could not be saved: ${storageError.message}`);
    }
  }

  async function downloadVideo() {
    if (!video || mode !== "ready") return;
    const canvas = canvasRef.current;
    if (!window.MediaRecorder || !canvas || typeof canvas.captureStream !== "function") {
      setError("Video export is not supported in this browser. Try the latest Chrome or Edge desktop browser.");
      return;
    }
    setError("");
    setMode("exporting");
    setStatus("Rendering your narrated WebM locally. Keep this page open until the download starts.");
    let audioContext;
    let mediaStream;
    let recorder;
    try {
      stopPreview();
      const response = await fetch(video.audioUrl);
      if (!response.ok) throw new Error(`Could not load narration audio (HTTP ${response.status}).`);
      const audioBytes = await response.arrayBuffer();
      audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const audioBuffer = await audioContext.decodeAudioData(audioBytes);
      const destination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);
      const videoStream = canvas.captureStream(30);
      mediaStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
      streamRef.current = mediaStream;
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );
      recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
      recorderRef.current = recorder;
      const chunks = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("error", (event) => {
        setError(`Video export failed: ${event.error?.message || "the browser recorder reported an error."}`);
      });
      recorder.addEventListener("stop", () => {
        mediaStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        if (audioContext.state !== "closed") audioContext.close();
        audioContextRef.current = null;
        if (chunks.length) {
          const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "daily-video"}.webm`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          saveDownloadedProgress();
        } else {
          setError("The browser did not produce a video file. Try again in Chrome or Edge.");
        }
        drawAt(video, 0);
        setTime(0);
        setMode("ready");
      }, { once: true });

      drawAt(video, 0);
      setTime(0);
      await audioContext.resume();
      recorder.start(250);
      const startTime = performance.now();
      const render = () => {
        const elapsed = Math.min((performance.now() - startTime) / 1000, video.duration);
        drawAt(video, elapsed);
        if (elapsed < video.duration && recorder.state === "recording") frameRef.current = requestAnimationFrame(render);
      };
      frameRef.current = requestAnimationFrame(render);
      source.addEventListener("ended", () => {
        if (recorder.state === "recording") recorder.stop();
      }, { once: true });
      source.start();
    } catch (exportError) {
      mediaStream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      if (audioContext && audioContext.state !== "closed") await audioContext.close();
      audioContextRef.current = null;
      recorderRef.current = null;
      setError(`Video export failed: ${exportError.message}`);
      setStatus("The video could not be exported.");
      setMode("ready");
    }
  }

  async function copyScript() {
    if (!video) return;
    try {
      await navigator.clipboard.writeText(video.voiceover);
      setStatus("The narration script was copied to your clipboard.");
    } catch (copyError) {
      setStatus(`Could not copy the script: ${copyError.message}`);
    }
  }

  return (
    <>
      <header className="daily-topbar">
        <a className="daily-brand" href="/" aria-label="Channelcraft home">
          <span className="daily-brand-mark" aria-hidden="true">✦</span>
          <span className="daily-brand-name">channel<span>craft</span> · DAILY VIDEO</span>
        </a>
        <a className="daily-back-link" href="/">← Creator home</a>
      </header>

      <main className="daily-shell">
        <section className="daily-hero">
          <div>
            <div className="daily-eyebrow">FIVE CATEGORIES · ONE SIMPLE WORKFLOW</div>
            <h1>One prompt.<br /><span>Your next video.</span></h1>
            <p className="daily-hero-copy">Pick a channel category, type what you want to make, and let AI research sources, write the script, narrate it, and build a video you can download. No editing timeline or extra idea-selection steps.</p>
          </div>
          <div className="daily-streak-card" aria-label={`${progress.streak} day video streak`}>
            <strong>{progress.streak} day{progress.streak === 1 ? "" : "s"} ✦</strong>
            <span>video-making streak</span>
          </div>
        </section>

        <section aria-labelledby="daily-categories-title">
          <div className="daily-category-heading">
            <div>
              <span className="daily-step">01 · CHOOSE YOUR SECTION</span>
              <h2 id="daily-categories-title">What kind of video today?</h2>
            </div>
            <p>Each category tunes the research, script, visuals, and narration to fit its audience.</p>
          </div>
          <div className="daily-category-grid">
            {DAILY_VIDEO_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`daily-category-card${categoryId === item.id ? " is-selected" : ""}`}
                style={{ "--category-light": `${item.colors[1]}36`, "--category-accent": item.colors[2] }}
                onClick={() => chooseCategory(item.id)}
                aria-pressed={categoryId === item.id}
                disabled={busy}
              >
                <span className="daily-category-icon" aria-hidden="true">{item.icon}</span>
                <strong>{item.label}</strong>
                <small>{item.tagline}</small>
              </button>
            ))}
          </div>
          <p className="daily-category-selected">Selected section: <strong>{category.label}</strong></p>
        </section>

        <div className="daily-editor">
          <section className="daily-panel" aria-labelledby="daily-prompt-title">
            <div className="daily-panel-heading">
              <div>
                <span className="daily-step">02 · TYPE ONE PROMPT</span>
                <h2 id="daily-prompt-title">Tell us what to make</h2>
                <p>One clear sentence is enough. AI writes and narrates the finished video.</p>
              </div>
              <button className="daily-sample-button" type="button" onClick={() => {
                setPrompt(category.prompt);
                saveSetting(PROMPT_KEY, category.prompt, "Prompt");
              }} disabled={busy}>Use example prompt</button>
            </div>
            <form onSubmit={generateVideo}>
              <label className="daily-prompt-label" htmlFor="daily-video-prompt">Your video prompt</label>
              <textarea
                id="daily-video-prompt"
                className="daily-prompt-box"
                maxLength={500}
                placeholder={`What would you love to explain, play, or tell in a ${category.label.toLowerCase()} video today?`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={busy}
                required
              />
              <div className="daily-prompt-meta">
                <span>Use your own idea—or tap “Use example prompt”.</span>
                <span>{prompt.length}/500</span>
              </div>
              <div className="daily-options-row">
                <label className="daily-prompt-label" htmlFor="daily-video-format">Format</label>
                <select
                  className="daily-format-select"
                  id="daily-video-format"
                  value={format}
                  onChange={(event) => {
                    setFormat(event.target.value);
                    setVideo(null);
                    clearAudio();
                    setTime(0);
                    saveSetting(FORMAT_KEY, event.target.value, "Video format");
                  }}
                  disabled={busy}
                >
                  <option value="short">Short · ~60 sec · vertical 9:16</option>
                  <option value="long">Long · ~5 min · landscape 16:9</option>
                </select>
                <label className="daily-research-toggle">
                  <input
                    type="checkbox"
                    checked={research}
                    onChange={(event) => {
                      setResearch(event.target.checked);
                      saveSetting(RESEARCH_KEY, String(event.target.checked), "Research preference");
                    }}
                    disabled={busy}
                  />
                  Research web & add source links
                </label>
                <p className="daily-research-help">
                  {research
                    ? "Uses Google Search for fresh facts and shows citations. This can take a little longer."
                    : "Uses the prompt and general knowledge only. No live web search."}
                </p>
              </div>
              <button className="daily-generate-button" type="submit" disabled={busy || !prompt.trim()}>
                {mode === "generating" ? "Writing, narrating & building…" : `Create my ${category.label} video`}
                <span aria-hidden="true">{mode === "generating" ? "…" : "→"}</span>
              </button>
            </form>
            <p className="daily-status" role={error ? "alert" : "status"}>{error || status}</p>
          </section>

          <aside className="daily-panel">
            <div className="daily-panel-heading">
              <div>
                <span className="daily-step">ONE CLICK · READY TO REVIEW</span>
                <h2>What AI handles for you</h2>
              </div>
            </div>
            <ul className="daily-includes-list">
              <li><span>✦</span><span>A category-specific script and scene-by-scene storyboard</span></li>
              <li><span>✦</span><span>Warm AI narration synced into the finished video</span></li>
              <li><span>✦</span><span>Original animated graphics in a vertical or landscape layout</span></li>
              <li><span>✦</span><span>Optional live web research, with citations beside the video</span></li>
              <li><span>✦</span><span>One-click local WebM download—nothing auto-publishes</span></li>
            </ul>
            <p className="daily-process-note">The finished video uses animated graphics rather than generated gameplay or film footage. Review generated facts and rights before publishing. Your prompt and selected research request are sent to Gemini; your video is rendered and downloaded in this browser.</p>
          </aside>
        </div>

        {video && (
          <section className="daily-output" aria-labelledby="daily-output-title">
            <div className="daily-output-header">
              <div>
                <span className="daily-step">{category.label.toUpperCase()} · READY TO WATCH</span>
                <h2 id="daily-output-title">{video.title}</h2>
                <p>{video.logline}</p>
              </div>
              <div className="daily-play-actions">
                <button className="daily-copy-button" type="button" onClick={copyScript} disabled={busy}>Copy script</button>
                <button className="daily-download-button" type="button" onClick={downloadVideo} disabled={busy}>
                  {mode === "exporting" ? "Rendering…" : "Download video ↓"}
                </button>
              </div>
            </div>
            <div className="daily-output-grid">
              <div>
                <div className={`daily-video-frame${format === "long" ? " is-long" : ""}`}>
                  <canvas
                    ref={canvasRef}
                    width={format === "long" ? 1920 : 1080}
                    height={format === "long" ? 1080 : 1920}
                    aria-label={`Animated ${category.label.toLowerCase()} video preview, scene ${sceneIndex + 1} of ${video.scenes.length}`}
                  />
                </div>
                <button className="daily-copy-button" type="button" onClick={playPreview} disabled={busy}>
                  {mode === "playing" ? "Playing narration…" : "Preview with voice ▶"}
                </button>
                <p className="daily-video-meta">
                  {sceneIndex + 1} / {video.scenes.length} scenes · {formatDuration(video.duration)} · {format === "long" ? "16:9 landscape" : "9:16 vertical"}
                </p>
              </div>
              <div className="daily-script-column">
                <h3>Video narration</h3>
                <div className="daily-script-text">{video.voiceover}</div>
                <div className="daily-scenes" aria-label="Video storyboard">
                  {video.scenes.map((scene, index) => (
                    <div className="daily-scene" key={`${scene.title}-${index}`}>
                      <strong>{String(index + 1).padStart(2, "0")} · {scene.title}</strong>
                      <span>{scene.caption}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {video.sources?.length > 0 && (
              <div className="daily-sources" aria-label="Research sources">
                {video.sources.map((source) => (
                  <a className="daily-source-link" href={source.url} key={source.url} target="_blank" rel="noreferrer">
                    Source: {source.title} ↗
                  </a>
                ))}
              </div>
            )}
            <p className="daily-footnote">The download happens only when you choose it. AI-generated facts and the finished video are yours to review before sharing.</p>
          </section>
        )}
      </main>
      <footer className="daily-footer">CHANNELCRAFT · Make something worth watching, one prompt at a time.</footer>
    </>
  );
}

const rootElement = document.querySelector("#daily-video-studio-root");
if (!rootElement) throw new Error("The Daily Video Studio root element was not found.");
createRoot(rootElement).render(<DailyVideoStudio />);
