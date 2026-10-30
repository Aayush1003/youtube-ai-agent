import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const FILE_LIMIT = 100 * 1024 * 1024;
const UPLOAD_DURATION_LIMIT = { short: 120, long: 600 };

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  visible.forEach((value, index) => context.fillText(value, x, y + index * lineHeight, maxWidth));
}

function drawAnimeFrame(canvas, video, time) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser could not create the video canvas.");

  const width = canvas.width;
  const height = canvas.height;
  const unit = Math.min(width, height);
  const elapsed = Math.max(0, Math.min(time, video.duration));
  const sceneDuration = video.duration / video.scenes.length;
  const sceneIndex = Math.min(Math.floor(elapsed / sceneDuration), video.scenes.length - 1);
  const scene = video.scenes[sceneIndex];
  const progress = video.duration ? elapsed / video.duration : 0;
  const palettes = [
    ["#11152e", "#30456c", "#e7a6ba"],
    ["#102332", "#28677a", "#f7ba82"],
    ["#211a3a", "#62518b", "#f0acda"],
    ["#152c32", "#3b766c", "#f0d091"],
    ["#241b32", "#7b4560", "#ffb18e"],
    ["#101a37", "#344c7c", "#f7d29d"],
  ];
  const colors = palettes[sceneIndex % palettes.length];
  const sky = context.createLinearGradient(0, 0, width * 0.3, height);
  sky.addColorStop(0, colors[0]);
  sky.addColorStop(0.65, colors[1]);
  sky.addColorStop(1, "#17182e");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.76, height * 0.33, 2, width * 0.76, height * 0.33, unit * 0.38);
  glow.addColorStop(0, `${colors[2]}55`);
  glow.addColorStop(1, `${colors[2]}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 36; index += 1) {
    const x = ((index * 197 + 31) % 997) / 997 * width;
    const y = ((index * 311 + 77) % 991) / 991 * height * 0.66;
    const pulse = 0.4 + (Math.sin(time * 1.8 + index * 2) + 1) * 0.25;
    context.globalAlpha = pulse;
    context.fillStyle = "#fff4e8";
    context.beginPath();
    context.arc(x, y, Math.max(1.5, unit * 0.002), 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  context.fillStyle = `${colors[2]}85`;
  context.beginPath();
  context.arc(width * 0.78, height * 0.28, unit * 0.075, 0, Math.PI * 2);
  context.fill();

  const horizon = height * 0.67;
  context.fillStyle = "rgba(10,12,29,.46)";
  context.beginPath();
  context.moveTo(0, horizon);
  context.lineTo(width * 0.15, horizon - height * 0.12);
  context.lineTo(width * 0.31, horizon + height * 0.04);
  context.lineTo(width * 0.49, horizon - height * 0.1);
  context.lineTo(width * 0.7, horizon + height * 0.01);
  context.lineTo(width * 0.88, horizon - height * 0.13);
  context.lineTo(width, horizon - height * 0.02);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  for (let index = 0; index < 14; index += 1) {
    const buildingX = (index / 14) * width;
    const buildingWidth = width / 24;
    const buildingHeight = height * (0.04 + ((index * 17) % 9) / 100);
    context.fillStyle = index % 2 ? "rgba(9,12,27,.56)" : "rgba(17,19,39,.62)";
    context.fillRect(buildingX, horizon + height * 0.015 - buildingHeight, buildingWidth, buildingHeight);
    context.fillStyle = `${colors[2]}65`;
    for (let windowIndex = 0; windowIndex < 3; windowIndex += 1) {
      context.fillRect(buildingX + buildingWidth * 0.26, horizon - buildingHeight + windowIndex * buildingHeight * 0.28, buildingWidth * 0.12, Math.max(2, unit * 0.003));
    }
  }

  const characterX = width * (0.5 + Math.sin(time * 0.7) * 0.008);
  const characterY = height * 0.51;
  const headRadius = unit * 0.052;
  context.fillStyle = "rgba(8,10,26,.42)";
  context.beginPath();
  context.ellipse(characterX, characterY + unit * 0.2, unit * 0.13, unit * 0.025, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#182035";
  context.beginPath();
  context.moveTo(characterX - unit * 0.12, characterY + unit * 0.2);
  context.quadraticCurveTo(characterX - unit * 0.11, characterY + unit * 0.06, characterX - unit * 0.06, characterY + unit * 0.04);
  context.lineTo(characterX + unit * 0.05, characterY + unit * 0.04);
  context.quadraticCurveTo(characterX + unit * 0.12, characterY + unit * 0.1, characterX + unit * 0.13, characterY + unit * 0.2);
  context.closePath();
  context.fill();
  context.fillStyle = "#f3c6b3";
  context.beginPath();
  context.arc(characterX, characterY, headRadius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#30243b";
  context.beginPath();
  context.moveTo(characterX - headRadius * 0.95, characterY - headRadius * 0.24);
  context.lineTo(characterX - headRadius * 0.8, characterY - headRadius * 1.05);
  context.lineTo(characterX - headRadius * 0.28, characterY - headRadius * 0.78);
  context.lineTo(characterX + headRadius * 0.04, characterY - headRadius * 1.18);
  context.lineTo(characterX + headRadius * 0.38, characterY - headRadius * 0.76);
  context.lineTo(characterX + headRadius * 0.92, characterY - headRadius * 0.95);
  context.lineTo(characterX + headRadius, characterY - headRadius * 0.12);
  context.closePath();
  context.fill();
  context.fillStyle = "#45304b";
  context.beginPath();
  context.ellipse(characterX - headRadius * 0.32, characterY + headRadius * 0.04, headRadius * 0.09, headRadius * 0.15, 0, 0, Math.PI * 2);
  context.ellipse(characterX + headRadius * 0.31, characterY + headRadius * 0.04, headRadius * 0.09, headRadius * 0.15, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#a85c69";
  context.lineWidth = Math.max(1.5, unit * 0.002);
  context.beginPath();
  context.arc(characterX, characterY + headRadius * 0.27, headRadius * 0.14, 0.15, Math.PI - 0.15);
  context.stroke();

  const smallFont = Math.max(13, unit * 0.021);
  const titleFont = Math.max(25, unit * (video.format === "short" ? 0.052 : 0.046));
  context.textAlign = "left";
  context.fillStyle = "rgba(255,244,234,.78)";
  context.font = `700 ${smallFont}px Arial, sans-serif`;
  context.fillText("ORIGINAL MOTION STORY", width * 0.065, height * 0.055);
  context.textAlign = "right";
  context.fillStyle = "rgba(255,244,234,.7)";
  context.fillText(`${String(sceneIndex + 1).padStart(2, "0")} / ${String(video.scenes.length).padStart(2, "0")}`, width * 0.935, height * 0.055);

  context.textAlign = "center";
  context.fillStyle = "#fff5e8";
  context.shadowColor = "rgba(10,8,22,.55)";
  context.shadowBlur = unit * 0.025;
  context.font = `800 ${titleFont}px Arial, sans-serif`;
  context.fillText(scene.title, width / 2, height * 0.19, width * 0.84);
  context.shadowBlur = 0;
  context.fillStyle = "rgba(255,238,226,.8)";
  context.font = `500 ${Math.max(14, unit * 0.022)}px Arial, sans-serif`;
  context.fillText(scene.setting, width / 2, height * 0.245, width * 0.78);

  const labelY = height * 0.305;
  context.font = `700 ${Math.max(12, unit * 0.016)}px Arial, sans-serif`;
  const labels = scene.visualLabels.slice(0, 3);
  const chipWidths = labels.map((label) => Math.min(width * 0.26, context.measureText(label).width + unit * 0.045));
  const chipGap = unit * 0.018;
  const chipTotal = chipWidths.reduce((sum, item) => sum + item, 0) + chipGap * (labels.length - 1);
  let chipX = (width - chipTotal) / 2;
  labels.forEach((label, index) => {
    const chipWidth = chipWidths[index];
    context.fillStyle = "rgba(14,15,34,.5)";
    roundRect(context, chipX, labelY, chipWidth, unit * 0.035, unit * 0.016);
    context.fill();
    context.strokeStyle = "rgba(255,230,218,.32)";
    context.lineWidth = Math.max(1, unit * 0.0015);
    context.stroke();
    context.fillStyle = "#fff0df";
    context.textAlign = "center";
    context.fillText(label, chipX + chipWidth / 2, labelY + unit * 0.024, chipWidth - unit * 0.016);
    chipX += chipWidth + chipGap;
  });

  const captionX = width * 0.08;
  const captionY = height * 0.755;
  const captionWidth = width * 0.84;
  const captionHeight = height * 0.13;
  context.fillStyle = "rgba(10,12,29,.76)";
  roundRect(context, captionX, captionY, captionWidth, captionHeight, unit * 0.025);
  context.fill();
  context.strokeStyle = "rgba(255,229,203,.22)";
  context.lineWidth = Math.max(1, unit * 0.0015);
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "#fff9f1";
  context.font = `600 ${Math.max(18, unit * (video.format === "short" ? 0.032 : 0.028))}px Arial, sans-serif`;
  wrapText(context, scene.caption, width / 2, captionY + captionHeight * 0.43, captionWidth * 0.88, unit * 0.044, 2);

  const progressY = height * 0.93;
  context.fillStyle = "rgba(255,255,255,.2)";
  roundRect(context, width * 0.065, progressY, width * 0.87, Math.max(4, unit * 0.005), unit * 0.003);
  context.fill();
  context.fillStyle = colors[2];
  roundRect(context, width * 0.065, progressY, width * 0.87 * progress, Math.max(4, unit * 0.005), unit * 0.003);
  context.fill();
}

function formatDuration(seconds) {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes}:${String(total % 60).padStart(2, "0")}` : `${total} sec`;
}

function AnimeStoryStudio() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("short");
  const [voiceSource, setVoiceSource] = useState("ai");
  const [ideas, setIdeas] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [storyDraft, setStoryDraft] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [video, setVideo] = useState(null);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("idle");
  const [status, setStatus] = useState("Research fresh story ideas, choose a premise, and make it your own.");
  const [error, setError] = useState("");

  const busy = ["researching", "writing", "exporting"].includes(mode);
  const sceneIndex = video && video.duration
    ? Math.min(Math.floor((time / video.duration) * video.scenes.length), video.scenes.length - 1)
    : 0;

  function drawAt(currentVideo, currentTime) {
    if (canvasRef.current) drawAnimeFrame(canvasRef.current, currentVideo, currentTime);
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

  function prepareNarration(story, audioBlob, label) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
      setError("The narration could not be decoded. Try a current Chrome or Edge browser.");
      setMode("idle");
    }, { once: true });
    audio.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError("The audio has an invalid duration. Please choose another recording.");
        setMode("idle");
        return;
      }
      if (audio.duration > UPLOAD_DURATION_LIMIT[format]) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError(format === "short"
          ? "Short narration must be 2 minutes or shorter. Choose Long for a longer video."
          : "Long narration must be 10 minutes or shorter.");
        setMode("idle");
        return;
      }
      const readyVideo = { ...story, audioUrl, duration: audio.duration };
      if (canvasRef.current) {
        canvasRef.current.width = format === "long" ? 1920 : 1080;
        canvasRef.current.height = format === "long" ? 1080 : 1920;
      }
      setVideo(readyVideo);
      setStoryDraft(null);
      setTime(0);
      setMode("ready");
      setError("");
      setStatus(`Your original story is ready with ${label} (${formatDuration(audio.duration)}). Preview it or download the WebM.`);
    }, { once: true });
    audio.src = audioUrl;
  }

  function attachVoice(story, file) {
    clearAudio();
    setMode("writing");
    setStatus("Loading your narration locally and building the video…");
    prepareNarration(story, file, "your voice");
  }

  async function researchIdeas(event) {
    event.preventDefault();
    setError("");
    setMode("researching");
    setStatus("Searching the web for current story inspiration…");
    try {
      const response = await fetch("/api/anime-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
      setIdeas(result.ideas);
      setSources(result.sources);
      setSelectedIdea(null);
      setStoryDraft(null);
      setVideo(null);
      setVoiceFile(null);
      clearAudio();
      setStatus("Research complete. Pick an original premise to build into a video.");
      setMode("ready");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("The web-researched ideas could not be generated.");
      setMode("idle");
    }
  }

  function chooseIdea(idea) {
    setSelectedIdea(idea);
    setStoryDraft(null);
    setVideo(null);
    clearAudio();
    setStatus("Premise selected. Choose a format and narration, then build your original video.");
    setError("");
  }

  async function buildVideo() {
    if (!selectedIdea || busy) return;
    clearAudio();
    setVideo(null);
    setStoryDraft(null);
    setError("");
    setMode("writing");
    setStatus(voiceSource === "ai"
      ? "Writing your original story and creating its AI narration…"
      : "Writing your original story and preparing its storyboard…");
    try {
      const response = await fetch("/api/anime-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: `${selectedIdea.title}: ${selectedIdea.logline}`,
          format,
          voiceSource,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);

      const { audioBase64, ...generatedStory } = result;
      const fullStory = { ...generatedStory, sources };
      if (voiceSource === "upload") {
        setStoryDraft(fullStory);
        if (voiceFile) {
          attachVoice(fullStory, voiceFile);
        } else {
          setStatus("Your script and storyboard are ready. Upload a recording to preview and download the narrated video.");
          setMode("ready");
        }
        return;
      }

      if (typeof audioBase64 !== "string" || !audioBase64) {
        throw new Error("Gemini returned the story without its AI narration. Please try again.");
      }
      const audioBytes = Uint8Array.from(atob(audioBase64), (character) => character.charCodeAt(0));
      prepareNarration(fullStory, new Blob([audioBytes], { type: result.audioMimeType || "audio/wav" }), "AI narration");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("The video could not be created.");
      setMode("idle");
    }
  }

  function selectVoiceFile(event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setVoiceFile(null);
      setError("Choose an audio file such as MP3, WAV, M4A, or WebM audio.");
      event.target.value = "";
      return;
    }
    if (file.size > FILE_LIMIT) {
      setVoiceFile(null);
      setError("Audio files must be 100 MB or smaller.");
      event.target.value = "";
      return;
    }
    setVoiceFile(file);
    setError("");
    if (storyDraft) attachVoice(storyDraft, file);
    else setStatus(`${file.name} is selected. It stays on your device and is combined with your video locally.`);
  }

  async function playPreview() {
    if (!video || !audioRef.current || busy) return;
    stopPreview();
    if (audioRef.current.currentTime >= video.duration) audioRef.current.currentTime = 0;
    setMode("playing");
    setStatus("Playing the story with narration…");
    let lastUiUpdate = 0;
    const tick = (now) => {
      const currentTime = audioRef.current?.currentTime || 0;
      drawAt(video, currentTime);
      if (now - lastUiUpdate > 250) {
        setTime(currentTime);
        lastUiUpdate = now;
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
      if (!response.ok) throw new Error(`Could not load the narration (HTTP ${response.status}).`);
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
          link.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anime-story"}.webm`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          setStatus("Your narrated WebM was downloaded locally. Review the story before publishing.");
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
      setStatus("The story narration was copied to your clipboard.");
    } catch (copyError) {
      setStatus(`Could not copy the script: ${copyError.message}`);
    }
  }

  return (
    <>
      <header className="anime-topbar">
        <a className="anime-brand" href="/" aria-label="Channelcraft home">
          <span className="anime-brand-mark" aria-hidden="true">✦</span>
          <span>channel<span>craft</span> · STORY LAB</span>
        </a>
        <a className="anime-home-link" href="/">← Back to creator tools</a>
      </header>

      <main className="anime-shell">
        <section className="anime-hero">
          <div className="anime-eyebrow">ORIGINAL STORIES · WEB-RESEARCHED INSPIRATION</div>
          <h1>Turn a spark into<br /><span>an anime story.</span></h1>
          <p>Find a fresh idea in current conversations, shape it into an original mini-story, then preview and download a narrated motion-manga video. Your characters and world start from scratch.</p>
          <div className="anime-chip-row">
            <span className="anime-chip">Live web research + citations</span>
            <span className="anime-chip">Original story worlds</span>
            <span className="anime-chip">Short or ~5-minute film</span>
            <span className="anime-chip">Local WebM export</span>
          </div>
        </section>

        <div className="anime-workspace">
          <section className="anime-panel" aria-labelledby="anime-ideas-title">
            <span className="anime-step">01 · DISCOVER</span>
            <h2 id="anime-ideas-title">Find a story worth telling</h2>
            <p className="anime-panel-intro">Search current web conversations for a human theme, then turn the research into three original fictional premises. Leave the topic blank for a surprise.</p>
            <form onSubmit={researchIdeas}>
              <label className="anime-field-label" htmlFor="anime-topic">What should the story explore?</label>
              <input
                className="anime-input"
                id="anime-topic"
                maxLength={180}
                placeholder="e.g. feeling invisible in a crowded city"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={busy}
              />
              <p className="anime-hint">A theme or question works best. Search sources inspire the story; they are not copied into it.</p>
              <button className="anime-primary anime-full-button" type="submit" disabled={busy}>
                {mode === "researching" ? "Researching the web…" : "Research & find story ideas"} <span aria-hidden="true">✦</span>
              </button>
            </form>

            {ideas.length > 0 && (
              <div className="anime-idea-list" aria-live="polite">
                {ideas.map((idea, index) => (
                  <article className={`anime-idea-card${selectedIdea?.title === idea.title ? " is-selected" : ""}`} key={`${idea.title}-${index}`}>
                    <div className="anime-idea-top">
                      <h3>{idea.title}</h3>
                      <button
                        type="button"
                        className="anime-choice"
                        onClick={() => chooseIdea(idea)}
                        disabled={busy}
                        aria-pressed={selectedIdea?.title === idea.title}
                      >
                        {selectedIdea?.title === idea.title ? "Selected ✓" : "Choose"}
                      </button>
                    </div>
                    <p>{idea.logline}</p>
                    <p className="anime-insight">{idea.humanInsight}</p>
                  </article>
                ))}
                <div className="anime-research-sources" aria-label="Web research sources">
                  {sources.map((source) => (
                    <a className="anime-source-link" href={source.url} key={source.url} target="_blank" rel="noreferrer">
                      {source.title} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedIdea && (
              <div className="anime-build-options">
                <div className="anime-options">
                  <div className="anime-option-field">
                    <label className="anime-field-label" htmlFor="anime-format">Video format</label>
                    <select className="anime-select" id="anime-format" value={format} onChange={(event) => {
                      setFormat(event.target.value);
                      setStoryDraft(null);
                      setVideo(null);
                      clearAudio();
                      setError("");
                      setStatus("Video format changed. Build the story again for the new layout.");
                    }} disabled={busy}>
                      <option value="short">60-second vertical Short</option>
                      <option value="long">~5-minute landscape film</option>
                    </select>
                  </div>
                  <div className="anime-option-field">
                    <label className="anime-field-label" htmlFor="anime-voice">Narration</label>
                    <select className="anime-select" id="anime-voice" value={voiceSource} onChange={(event) => {
                      setVoiceSource(event.target.value);
                      setVoiceFile(null);
                      setStoryDraft(null);
                      setVideo(null);
                      clearAudio();
                      setError("");
                    }} disabled={busy}>
                      <option value="ai">Expressive AI storyteller</option>
                      <option value="upload">Upload my own voice</option>
                    </select>
                  </div>
                </div>
                {voiceSource === "upload" && (
                  <label className="anime-voice-file">
                    <span className="anime-field-label">Your recording <span aria-hidden="true">· stays on your device</span></span>
                    <input type="file" accept="audio/*" onChange={selectVoiceFile} disabled={busy} />
                    {voiceFile && <p className="anime-voice-name">{voiceFile.name} · {(voiceFile.size / 1024 / 1024).toFixed(1)} MB · used locally, not uploaded</p>}
                    <p className="anime-hint">Upload a recording now or after the script is ready. Up to 100 MB; 2 minutes for Shorts or 10 minutes for Long.</p>
                  </label>
                )}
                <button className="anime-primary anime-full-button" type="button" onClick={buildVideo} disabled={busy}>
                  {mode === "writing" ? "Writing your story…" : "Build this anime video"} <span aria-hidden="true">→</span>
                </button>
              </div>
            )}

            <p className="anime-status" role={error ? "alert" : "status"}>{error || status}</p>
          </section>

          <aside className="anime-panel anime-side-panel">
            <div className="anime-side-icon" aria-hidden="true">✧</div>
            <span className="anime-step">THE CREATIVE NORTH STAR</span>
            <h3>Originality over imitation</h3>
            <p>Good mini-stories are specific, visual, and built around a feeling viewers recognize. The research helps find a timely starting point—not someone else’s plot.</p>
            <ul>
              <li>Three distinct, human-centered premises</li>
              <li>Fresh characters, settings, and story beats</li>
              <li>Sources shown beside the ideas they informed</li>
              <li>Review the script and claims before sharing</li>
            </ul>
            <a className="anime-report-link" href="https://www.youtube.com/trends/report/tr26-animation-trends-report/" target="_blank" rel="noreferrer">
              YouTube Culture & Trends: “Animation’s New Wave” (2026) ↗
            </a>
            <p className="anime-privacy">The topic, selected premise, and script are sent to Gemini for research and generation. Uploaded voice recordings stay in your browser and are combined with the video locally. No video is published automatically.</p>
          </aside>
        </div>

        {video && (
          <section className="anime-output" aria-labelledby="anime-output-title">
            <div className="anime-output-heading">
              <div>
                <span className="anime-step">02 · YOUR ORIGINAL FILM</span>
                <h2 id="anime-output-title">{video.title}</h2>
                <p className="anime-logline">{video.logline}</p>
              </div>
              <button className="anime-secondary" type="button" onClick={copyScript} disabled={busy}>Copy narration ↗</button>
            </div>
            <div className="anime-player-layout">
              <div>
                <div className={`anime-canvas-frame${format === "long" ? " is-long" : ""}`}>
                  <canvas ref={canvasRef} width={format === "long" ? 1920 : 1080} height={format === "long" ? 1080 : 1920} aria-label={`Anime-inspired video preview, scene ${sceneIndex + 1} of ${video.scenes.length}`} />
                </div>
                <div className="anime-play-controls">
                  <button className="anime-secondary" type="button" onClick={playPreview} disabled={busy}>
                    {mode === "playing" ? "Playing story…" : "Preview with voice ▶"}
                  </button>
                  <button className="anime-primary" type="button" onClick={downloadVideo} disabled={busy}>
                    {mode === "exporting" ? "Rendering…" : "Download video ↓"}
                  </button>
                </div>
                <p className="anime-player-status" role="status">{mode === "exporting" ? status : `Scene ${sceneIndex + 1} of ${video.scenes.length} · ${formatDuration(video.duration)} · ${format === "long" ? "16:9 landscape" : "9:16 vertical"}`}</p>
                {video.sources?.length > 0 && (
                  <div className="anime-research-sources" aria-label="Sources used for this story inspiration">
                    {video.sources.map((source) => (
                      <a className="anime-source-link" href={source.url} key={source.url} target="_blank" rel="noreferrer">
                        Research: {source.title} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="anime-script-panel">
                <h3>Story narration</h3>
                <div className="anime-script-copy">{video.voiceover}</div>
                <div className="anime-scene-list" aria-label="Storyboard scenes">
                  {video.scenes.map((scene, index) => (
                    <div className="anime-scene" key={`${scene.title}-${index}`}>
                      <strong>{String(index + 1).padStart(2, "0")} · {scene.title}</strong>
                      <span>{scene.caption}</span>
                    </div>
                  ))}
                </div>
                <p className="anime-hint">This is an original motion-manga style video made from the storyboard and animated graphics; it does not generate full anime footage. Review all generated content before publishing.</p>
              </div>
            </div>
          </section>
        )}

        {storyDraft && !video && (
          <section className="anime-output" aria-labelledby="anime-draft-title">
            <span className="anime-step">02 · SCRIPT READY</span>
            <div className="anime-output-heading">
              <div>
                <h2 id="anime-draft-title">{storyDraft.title}</h2>
                <p className="anime-logline">{storyDraft.logline}</p>
              </div>
              <button className="anime-secondary" type="button" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(storyDraft.voiceover);
                  setStatus("The story narration was copied to your clipboard.");
                } catch (copyError) {
                  setStatus(`Could not copy the script: ${copyError.message}`);
                }
              }}>Copy narration ↗</button>
            </div>
            <div className="anime-script-copy">{storyDraft.voiceover}</div>
            <p className="anime-status" role="status">{status}</p>
          </section>
        )}
      </main>
      <footer className="anime-footer">CHANNELCRAFT · Original stories, made with care. Research informs the idea; the story stays yours.</footer>
    </>
  );
}

const rootElement = document.querySelector("#anime-studio-root");
if (!rootElement) throw new Error("The Anime Story Studio root element was not found.");
createRoot(rootElement).render(<AnimeStoryStudio />);
