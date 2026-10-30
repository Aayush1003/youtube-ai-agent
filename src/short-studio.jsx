import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dailyJavaWorkflow from "./daily-java-workflow.cjs";

const { JAVA_TOPIC_IDEAS, calculateStreak, dateOffset, formatShortDate, localDateKey, topicIndexForDate } =
  dailyJavaWorkflow;

const SHORT_DURATION = 60;
const VOICEOVER =
  "Java interview mein HashMap ka internal working poocha hai? Chaliye, 60 seconds mein samajhte hain. HashMap key-value pairs store karta hai. put() call par, key ka hashCode() spread hota hai aur bucket index milta hai. Default capacity 16 hoti hai; array zaroorat par allocate hota hai. Capacity n ho, toh index: (n - 1) & hash. Do different keys ka bucket index same ho, toh collision. Java 8 mein entries linked list mein hoti hain; large bucket aur sufficient capacity par red-black tree ban sakta hai. get() hash aur bucket se search karke equals() se key match karta hai. Equal key dobara put karoge toh value update hoti hai. Achhe hash distribution ke saath get() aur put() average O(1) hote hain. HashMap internals: Java interviews ke liye must-know. Follow for more!";

const SCENES = [
  {
    start: 0,
    end: 6,
    kind: "hook",
    detail: "JAVA INTERVIEW · 60-SECOND EXPLAINER",
    title: "HashMap",
    caption: "Key se value tak. Fast.",
  },
  {
    start: 6,
    end: 16,
    kind: "hash",
    detail: "1 · HASHING",
    title: "put(key, value)",
    caption: "hashCode() gets spread before the bucket is found.",
  },
  {
    start: 16,
    end: 26,
    kind: "buckets",
    detail: "2 · BUCKETS",
    title: "16 buckets by default",
    caption: "Capacity n: (n - 1) & hash",
  },
  {
    start: 26,
    end: 39,
    kind: "collision",
    detail: "3 · COLLISIONS",
    title: "Same bucket?",
    caption: "Linked list first. Large buckets can become trees.",
  },
  {
    start: 39,
    end: 50,
    kind: "lookup",
    detail: "4 · get() AND put()",
    title: "Hash, then equals()",
    caption: "An equal key updates its existing value.",
  },
  {
    start: 50,
    end: SHORT_DURATION,
    kind: "complexity",
    detail: "5 · THE TAKEAWAY",
    title: "Average O(1)",
    caption: "With a good hash spread. Follow for more Java interview tips.",
  },
];

function getScene(time) {
  return SCENES.find((scene) => time >= scene.start && time < scene.end) || SCENES.at(-1);
}

function SceneVisual({ kind, reduceMotion }) {
  if (kind === "hook") {
    return (
      <div className="short-flow">
        <motion.span className="short-flow-item" animate={reduceMotion ? {} : { y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          KEY
        </motion.span>
        <span className="short-flow-arrow">→</span>
        <motion.span className="short-flow-item" animate={reduceMotion ? {} : { y: [0, 5, 0] }} transition={{ duration: 2, delay: 0.2, repeat: Infinity }}>
          HASH
        </motion.span>
        <span className="short-flow-arrow">→</span>
        <motion.span className="short-flow-item">VALUE</motion.span>
      </div>
    );
  }

  if (kind === "hash") {
    return (
      <div className="short-flow">
        <span className="short-flow-item">key</span>
        <span className="short-flow-arrow">→</span>
        <motion.span
          className="short-flow-item"
          animate={reduceMotion ? {} : { borderColor: ["rgba(255,255,255,.18)", "#36e1d2", "rgba(255,255,255,.18)"] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          hashCode()
        </motion.span>
        <span className="short-flow-arrow">→</span>
        <span className="short-flow-item">index</span>
      </div>
    );
  }

  if (kind === "buckets") {
    return (
      <div className="short-bucket-grid" aria-label="Sixteen HashMap buckets">
        {Array.from({ length: 16 }, (_, index) => (
          <motion.span
            className={`short-bucket${index === 5 ? " is-active" : ""}`}
            key={index}
            animate={index === 5 && !reduceMotion ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            {index}
          </motion.span>
        ))}
      </div>
    );
  }

  if (kind === "collision") {
    return (
      <div className="short-stage-visual">
        <div className="short-node-row">
          <motion.span className="short-node" animate={reduceMotion ? {} : { x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            key A
          </motion.span>
          <span className="short-node-link">→</span>
          <span className="short-node is-purple">key B</span>
        </div>
        <motion.span
          className="short-node"
          animate={reduceMotion ? {} : { borderRadius: ["8px", "18px", "8px"] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          list → red-black tree
        </motion.span>
      </div>
    );
  }

  if (kind === "lookup") {
    return (
      <div className="short-stage-visual">
        <div className="short-flow">
          <span className="short-flow-item">hash</span>
          <span className="short-flow-arrow">→</span>
          <span className="short-flow-item">bucket</span>
          <span className="short-flow-arrow">→</span>
          <span className="short-flow-item">equals()</span>
        </div>
        <motion.span
          className="short-node"
          animate={reduceMotion ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          same key → update value
        </motion.span>
      </div>
    );
  }

  return (
    <div className="short-stage-visual">
      <motion.span
        className="short-complexity"
        initial={reduceMotion ? false : { scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 16 }}
      >
        O(1)
      </motion.span>
      <span className="short-node is-purple">average · good hash spread</span>
    </div>
  );
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawFrame(canvas, time) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser could not create a video canvas.");

  const width = canvas.width;
  const height = canvas.height;
  const scene = getScene(time);
  const progress = Math.min(time / SHORT_DURATION, 1);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#101a38");
  gradient.addColorStop(0.58, "#171c43");
  gradient.addColorStop(1, "#291d54");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.2;
  context.fillStyle = "#7c68ff";
  context.beginPath();
  context.arc(900, 330, 260 + Math.sin(time * 1.2) * 10, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#19d3c5";
  context.beginPath();
  context.arc(100, 1460, 240, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.textAlign = "left";
  context.fillStyle = "#b9b6d8";
  context.font = "700 27px Arial, sans-serif";
  context.fillText("AAYUSH ENGINEERING HUB", 76, 104);
  context.textAlign = "right";
  context.fillText("JAVA • 01", 1004, 104);
  context.fillStyle = "rgba(255,255,255,.14)";
  roundedRect(context, 76, 132, 928, 2, 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#a995ff";
  context.font = "700 27px Arial, sans-serif";
  context.fillText(scene.detail, width / 2, 330, 900);
  context.fillStyle = "#fff";
  context.font = "800 78px Arial, sans-serif";
  context.fillText(scene.title, width / 2, 450, 920);

  if (scene.kind === "hook") {
    drawFlow(context, ["KEY", "HASH", "VALUE"], 690);
    drawCenteredText(context, "A visual guide to Java's key-value map", 970, "#d4d1e8", "500 36px Arial, sans-serif");
  } else if (scene.kind === "hash") {
    drawFlow(context, ["key", "hashCode()", "index"], 770);
    drawCenteredText(context, "The hash is spread before indexing.", 990, "#d4d1e8", "600 34px Arial, sans-serif");
  } else if (scene.kind === "buckets") {
    const cell = 124;
    const gap = 18;
    const startX = (width - (cell * 4 + gap * 3)) / 2;
    const startY = 650;
    context.textAlign = "center";
    for (let index = 0; index < 16; index += 1) {
      const x = startX + (index % 4) * (cell + gap);
      const y = startY + Math.floor(index / 4) * (cell + gap);
      context.fillStyle = index === 5 ? "rgba(54,225,210,.24)" : "rgba(255,255,255,.09)";
      roundedRect(context, x, y, cell, cell, 20);
      context.fill();
      context.strokeStyle = index === 5 ? "#36e1d2" : "rgba(255,255,255,.16)";
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = "#fff";
      context.font = "700 38px Arial, sans-serif";
      context.fillText(String(index), x + cell / 2, y + 74);
    }
    drawCenteredText(context, "(n - 1) & hash", 1360, "#36e1d2", "700 48px Arial, sans-serif");
  } else if (scene.kind === "collision") {
    drawFlow(context, ["key A", "bucket 5", "key B"], 740);
    drawCenteredText(context, "One bucket. More than one key.", 950, "#fff", "700 38px Arial, sans-serif");
    drawCenteredText(context, "Linked list  →  red-black tree", 1060, "#36e1d2", "700 34px Arial, sans-serif");
  } else if (scene.kind === "lookup") {
    drawFlow(context, ["hash", "bucket", "equals()"], 750);
    roundedRect(context, 190, 1010, 700, 120, 25);
    context.fillStyle = "rgba(255,255,255,.1)";
    context.fill();
    drawCenteredText(context, "Equal key? Update its value.", 1087, "#b9b6ff", "700 36px Arial, sans-serif");
  } else {
    roundedRect(context, 215, 650, 650, 350, 34);
    context.fillStyle = "rgba(255,255,255,.09)";
    context.fill();
    context.strokeStyle = "rgba(196,185,255,.4)";
    context.lineWidth = 2;
    context.stroke();
    drawCenteredText(context, "O(1)", 835, "#36e1d2", "800 110px Arial, sans-serif");
    drawCenteredText(context, "AVERAGE · WITH GOOD HASH DISTRIBUTION", 920, "#d4d1e8", "700 25px Arial, sans-serif");
  }

  drawCenteredText(context, scene.caption, 1450, "#fff", "700 37px Arial, sans-serif");
  context.fillStyle = "rgba(255,255,255,.2)";
  roundedRect(context, 76, 1792, 928, 8, 4);
  context.fill();
  context.fillStyle = "#36e1d2";
  roundedRect(context, 76, 1792, 928 * progress, 8, 4);
  context.fill();
  context.textAlign = "left";
  context.fillStyle = "#aaa7c6";
  context.font = "600 24px Arial, sans-serif";
  context.fillText("HASHMAP INTERNALS", 76, 1844);
  context.textAlign = "right";
  context.fillText(`${Math.floor(time).toString().padStart(2, "0")} / 60 SEC`, 1004, 1844);
}

function drawCenteredText(context, text, y, color, font) {
  context.fillStyle = color;
  context.font = font;
  context.textAlign = "center";
  context.fillText(text, 540, y, 920);
}

function drawFlow(context, labels, y) {
  const boxWidth = 245;
  const boxHeight = 120;
  const gap = 55;
  const totalWidth = labels.length * boxWidth + (labels.length - 1) * gap;
  const startX = (1080 - totalWidth) / 2;
  context.textAlign = "center";
  labels.forEach((label, index) => {
    const x = startX + index * (boxWidth + gap);
    context.fillStyle = "rgba(255,255,255,.1)";
    roundedRect(context, x, y, boxWidth, boxHeight, 22);
    context.fill();
    context.strokeStyle = index === 1 ? "#36e1d2" : "rgba(255,255,255,.22)";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#fff";
    context.font = "700 32px Arial, sans-serif";
    context.fillText(label, x + boxWidth / 2, y + 73, boxWidth - 20);
    if (index < labels.length - 1) {
      context.fillStyle = "#36e1d2";
      context.font = "700 38px Arial, sans-serif";
      context.fillText("→", x + boxWidth + gap / 2, y + 74);
    }
  });
}

function ShortStudio() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recorderRef = useRef(null);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("ready");
  const [status, setStatus] = useState("Ready. The WebM export is silent—record the voiceover below and add it in your editor.");
  const reduceMotion = useReducedMotion();
  const scene = getScene(time);

  useEffect(() => {
    if (canvasRef.current) drawFrame(canvasRef.current, 0);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, []);

  function stopAnimation() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function playPreview() {
    if (mode === "exporting") return;
    stopAnimation();
    setMode("playing");
    setStatus("Preview playing. This short has no audio; use the script below to record narration.");
    const startedAt = performance.now();
    const renderFrame = (now) => {
      const elapsed = Math.min((now - startedAt) / 1000, SHORT_DURATION);
      setTime(elapsed);
      if (canvasRef.current) drawFrame(canvasRef.current, elapsed);
      if (elapsed < SHORT_DURATION) {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
      } else {
        animationFrameRef.current = null;
        setMode("ready");
        setStatus("Preview finished. Export the video when you’re ready.");
      }
    };
    animationFrameRef.current = window.requestAnimationFrame(renderFrame);
  }

  function exportVideo() {
    const canvas = canvasRef.current;
    if (!window.MediaRecorder || !canvas || typeof canvas.captureStream !== "function") {
      setStatus("Video export is not supported in this browser. Try the latest Chrome or Edge desktop browser.");
      return;
    }

    stopAnimation();
    const stream = canvas.captureStream(30);
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) =>
      MediaRecorder.isTypeSupported(type)
    );
    let recorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
      recorderRef.current = recorder;
      const chunks = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("error", (event) => {
        setStatus(`Video export failed: ${event.error?.message || "the browser recorder reported an error."}`);
      });
      recorder.addEventListener(
        "stop",
        () => {
          stream.getTracks().forEach((track) => track.stop());
          recorderRef.current = null;
          if (chunks.length) {
            const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = "aayush-java-hashmap-short.webm";
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
            setStatus("Your 60-second WebM video is downloaded. It’s silent—record the voiceover script and add it in your editor.");
          } else {
            setStatus("The browser did not produce a video file. Try again in a current Chrome or Edge browser.");
          }
          if (canvasRef.current) drawFrame(canvasRef.current, 0);
          setTime(0);
          setMode("ready");
        },
        { once: true }
      );

      drawFrame(canvas, 0);
      setTime(0);
      setMode("exporting");
      setStatus("Recording the 60-second animation. Keep this tab open until the download starts.");
      recorder.start(250);
      const startedAt = performance.now();
      const renderFrame = (now) => {
        const elapsed = Math.min((now - startedAt) / 1000, SHORT_DURATION);
        drawFrame(canvas, elapsed);
        setTime(elapsed);
        if (elapsed < SHORT_DURATION && recorder.state === "recording") {
          animationFrameRef.current = window.requestAnimationFrame(renderFrame);
        } else if (recorder.state === "recording") {
          animationFrameRef.current = null;
          recorder.stop();
        }
      };
      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setMode("ready");
      setStatus(`Could not start video export: ${error.message}`);
    }
  }

  async function copyVoiceover(event) {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(VOICEOVER);
      button.textContent = "Copied";
    } catch (error) {
      setStatus(`Could not copy the script: ${error.message}`);
    }
  }

  return (
    <section className="short-studio" aria-labelledby="short-studio-title">
      <div className="tools-heading">
        <span className="step-label">MADE FOR AAYUSH ENGINEERING HUB</span>
        <h2 id="short-studio-title">
          Your animated Java Short<span className="heading-period">.</span>
        </h2>
        <p>A ready-to-record, vertical HashMap explainer. Preview it, copy the Hinglish voiceover, or export the silent video.</p>
      </div>
      <div className="short-studio-card">
        <div className="short-preview">
          <div className="short-preview-stage" aria-label="Animated preview of a HashMap tutorial YouTube Short">
            <div className="short-stage-header">
              <span>AAYUSH ENGINEERING HUB</span>
              <span>JAVA · 01</span>
            </div>
            <div className="short-stage-rule" />
            <div className="short-stage-content" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  className="short-stage-scene"
                  key={scene.kind}
                  initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <p className="short-stage-detail">{scene.detail}</p>
                  <h3 className="short-stage-title">{scene.title}</h3>
                  <div className="short-stage-visual">
                    <SceneVisual kind={scene.kind} reduceMotion={reduceMotion} />
                  </div>
                  <p className="short-stage-caption">{scene.caption}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              className="short-stage-progress"
              role="progressbar"
              aria-label="Video preview progress"
              aria-valuemin="0"
              aria-valuemax={SHORT_DURATION}
              aria-valuenow={Math.floor(time)}
            >
              <motion.span animate={{ width: `${(time / SHORT_DURATION) * 100}%` }} transition={{ duration: 0.15 }} />
            </div>
            <div className="short-stage-footer">
              <span>HASHMAP INTERNALS</span>
              <span>{`${Math.floor(time).toString().padStart(2, "0")} / 60 SEC`}</span>
            </div>
          </div>
          <div className="short-preview-badge">
            <span className="status-dot" />9:16 SHORT PREVIEW
          </div>
        </div>
        <div className="short-details">
          <span className="step-label">A COMPLETE 60-SECOND VIDEO</span>
          <h3>Java HashMap Internals in 60 Seconds</h3>
          <p>Animated walkthrough of hashing, buckets, collisions, get()/put(), and average time complexity.</p>
          <div className="short-actions">
            <button className="copy-button" type="button" onClick={playPreview} disabled={mode !== "ready"}>
              {mode === "playing" ? "Playing preview…" : "Play preview"} <span aria-hidden="true">▶</span>
            </button>
            <button className="submit-button short-export" type="button" onClick={exportVideo} disabled={mode !== "ready"}>
              {mode === "exporting" ? "Recording video…" : "Export video"} <span className="button-arrow" aria-hidden="true">↓</span>
            </button>
          </div>
          <p className="short-status" role="status" aria-live="polite">{status}</p>
          <div className="voiceover">
            <div className="voiceover-heading">
              <h4>Hinglish voiceover script</h4>
              <button className="copy-button" type="button" onClick={copyVoiceover}>Copy script</button>
            </div>
            <p>{VOICEOVER}</p>
          </div>
          <p className="short-note">Exports a silent 9:16 WebM. Record the voiceover separately and add it in your video editor. The app never publishes to your channel.</p>
        </div>
      </div>
      <canvas ref={canvasRef} width="1080" height="1920" className="short-export-canvas" aria-hidden="true" />
    </section>
  );
}

const rootElement = document.querySelector("#short-studio-root");
if (!rootElement) throw new Error("The HashMap Short studio root element was not found.");
createRoot(rootElement).render(<ShortStudio />);

function drawGeneratedFrame(canvas, video, time) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser could not create a video canvas.");
  const width = canvas.width;
  const height = canvas.height;
  const isLong = video.format === "long";
  const sceneDuration = video.duration / video.scenes.length;
  const sceneIndex = Math.min(Math.floor(time / sceneDuration), video.scenes.length - 1);
  const scene = video.scenes[sceneIndex];
  const progress = Math.min(time / video.duration, 1);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#101a38");
  gradient.addColorStop(0.58, "#171c43");
  gradient.addColorStop(1, "#291d54");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.19;
  context.fillStyle = "#7c68ff";
  context.beginPath();
  context.arc(900, 350, 260 + Math.sin(time * 1.4) * 12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#19d3c5";
  context.beginPath();
  context.arc(100, 1470, 235, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.textAlign = "left";
  context.fillStyle = "#b9b6d8";
  context.font = `700 ${isLong ? 23 : 27}px Arial, sans-serif`;
  context.fillText("AAYUSH ENGINEERING HUB", 76, isLong ? 54 : 104);
  context.textAlign = "right";
  context.fillText("DAILY JAVA · 01", width - 76, isLong ? 54 : 104);
  context.fillStyle = "rgba(255,255,255,.14)";
  roundedRect(context, 76, isLong ? 78 : 132, width - 152, 2, 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#a995ff";
  context.font = `700 ${isLong ? 25 : 27}px Arial, sans-serif`;
  context.fillText(`CONCEPT ${sceneIndex + 1} / ${video.scenes.length}`, width / 2, isLong ? 170 : 330);
  context.fillStyle = "#fff";
  context.font = `800 ${isLong ? 66 : 70}px Arial, sans-serif`;
  context.fillText(scene.title, width / 2, isLong ? 300 : 465, width - 160);

  const labels = scene.visualLabels;
  const gap = isLong ? 54 : 28;
  const boxWidth = Math.min(isLong ? 480 : 290, (width - 280 - gap * (labels.length - 1)) / labels.length);
  const totalWidth = boxWidth * labels.length + gap * (labels.length - 1);
  const startX = (width - totalWidth) / 2;
  labels.forEach((label, index) => {
    const x = startX + index * (boxWidth + gap);
    const boxY = isLong ? 400 : 735;
    const y = boxY + Math.sin(time * 2 + index) * 9;
    const boxHeight = isLong ? 118 : 142;
    context.fillStyle = index === 1 ? "rgba(54,225,210,.2)" : "rgba(255,255,255,.1)";
    roundedRect(context, x, y, boxWidth, boxHeight, 25);
    context.fill();
    context.strokeStyle = index === 1 ? "rgba(54,225,210,.8)" : "rgba(255,255,255,.2)";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#fff";
    context.font = `700 ${isLong ? 32 : 29}px Arial, sans-serif`;
    context.textAlign = "center";
    context.fillText(label, x + boxWidth / 2, y + boxHeight / 2 + 11, boxWidth - 20);
    if (index < labels.length - 1) {
      context.fillStyle = "#36e1d2";
      context.font = "700 40px Arial, sans-serif";
      context.fillText("→", x + boxWidth + gap / 2, y + boxHeight / 2 + 11);
    }
  });

  context.fillStyle = "rgba(255,255,255,.1)";
  const captionY = isLong ? 620 : 1085;
  const captionBoxX = isLong ? 190 : 140;
  const captionBoxWidth = isLong ? width - 380 : 800;
  roundedRect(context, captionBoxX, captionY, captionBoxWidth, isLong ? 190 : 220, 28);
  context.fill();
  context.fillStyle = "#e5e3f2";
  context.font = `600 ${isLong ? 36 : 38}px Arial, sans-serif`;
  wrapCanvasText(
    context,
    scene.caption,
    width / 2,
    isLong ? 685 : 1165,
    4,
    isLong ? 46 : 50,
    captionBoxWidth - 60
  );

  const progressY = height - (isLong ? 74 : 128);
  context.fillStyle = "rgba(255,255,255,.2)";
  roundedRect(context, 76, progressY, width - 152, 8, 4);
  context.fill();
  context.fillStyle = "#36e1d2";
  roundedRect(context, 76, progressY, (width - 152) * progress, 8, 4);
  context.fill();
  context.textAlign = "left";
  context.fillStyle = "#aaa7c6";
  context.font = `600 ${isLong ? 20 : 24}px Arial, sans-serif`;
  context.fillText(isLong ? "DAILY JAVA LESSON" : "DAILY JAVA SHORT", 76, height - (isLong ? 34 : 76));
  context.textAlign = "right";
  context.fillText(
    `${Math.floor(time / 60).toString().padStart(2, "0")}:${Math.floor(time % 60).toString().padStart(2, "0")} / ${formatDuration(video.duration)}`,
    width - 76,
    height - (isLong ? 34 : 76)
  );
}

function formatDuration(seconds) {
  const totalSeconds = Math.ceil(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return minutes
    ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
    : `${remainingSeconds} SEC`;
}

function wrapCanvasText(context, text, centerX, startY, maxLines, lineHeight, maxWidth) {
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
  const visibleLines = lines.slice(0, maxLines);
  const firstY = startY - ((visibleLines.length - 1) * lineHeight) / 2;
  context.textAlign = "center";
  visibleLines.forEach((value, index) => context.fillText(value, centerX, firstY + index * lineHeight, maxWidth));
}

const DAILY_DRAFT_KEY = "youtube-growth-agent.java-short-draft";
const DAILY_PROGRESS_KEY = "youtube-growth-agent.java-short-progress";

function DailyJavaShortStudio() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const today = localDateKey();
  const [format, setFormat] = useState(() => {
    try {
      return localStorage.getItem("youtube-growth-agent.java-short-format") === "long" ? "long" : "short";
    } catch (error) {
      console.error("Could not load the saved video format:", error);
      return "short";
    }
  });
  const [voiceSource, setVoiceSource] = useState(() => {
    try {
      return localStorage.getItem("youtube-growth-agent.java-short-voice") === "upload" ? "upload" : "ai";
    } catch (error) {
      console.error("Could not load the saved narration choice:", error);
      return "ai";
    }
  });
  const [voiceFile, setVoiceFile] = useState(null);
  const [concept, setConcept] = useState(() => {
    try {
      return localStorage.getItem(DAILY_DRAFT_KEY) || "";
    } catch (error) {
      console.error("Could not load the saved Java concept:", error);
      return "";
    }
  });
  const [dailyTopicIndex, setDailyTopicIndex] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || "{}");
      return saved.date === localDateKey() && Number.isInteger(saved.topicIndex)
        ? ((saved.topicIndex % JAVA_TOPIC_IDEAS.length) + JAVA_TOPIC_IDEAS.length) % JAVA_TOPIC_IDEAS.length
        : topicIndexForDate();
    } catch (error) {
      console.error("Could not load the Java topic rotation:", error);
      return topicIndexForDate();
    }
  });
  const [completedDates, setCompletedDates] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || "{}");
      return Array.isArray(saved.completedDates)
        ? saved.completedDates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
        : [];
    } catch (error) {
      console.error("Could not load the Java video history:", error);
      return [];
    }
  });
  const [video, setVideo] = useState(null);
  const [scriptDraft, setScriptDraft] = useState(null);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("ready");
  const [status, setStatus] = useState("Write a Java concept to generate your own narrated Short.");
  const reducedMotion = useReducedMotion();
  const sceneIndex =
    video && video.duration
      ? Math.min(Math.floor((time / video.duration) * video.scenes.length), video.scenes.length - 1)
      : 0;
  const activeScene = video?.scenes[sceneIndex];
  const streak = calculateStreak(completedDates, today);
  const recentDates = Array.from({ length: 7 }, (_, index) => dateOffset(today, index - 6));
  const weeklyCount = recentDates.filter((date) => completedDates.includes(date)).length;
  const todayComplete = completedDates.includes(today);

  function persistProgress(nextCompletedDates, nextTopicIndex = dailyTopicIndex) {
    const progress = {
      date: today,
      topicIndex: nextTopicIndex,
      completedDates: nextCompletedDates.slice(-90),
    };
    try {
      localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
      setCompletedDates(progress.completedDates);
      setDailyTopicIndex(nextTopicIndex);
      return true;
    } catch (error) {
      console.error("Could not save your daily Java progress:", error);
      setStatus(`Your video was downloaded, but daily progress could not be saved in this browser: ${error.message}`);
      return false;
    }
  }

  function chooseTopic(index, useInForm = false) {
    const nextIndex = ((index % JAVA_TOPIC_IDEAS.length) + JAVA_TOPIC_IDEAS.length) % JAVA_TOPIC_IDEAS.length;
    const nextConcept = JAVA_TOPIC_IDEAS[nextIndex];
    if (!persistProgress(completedDates, nextIndex)) return;
    if (useInForm) {
      setConcept(nextConcept);
      try {
        localStorage.setItem(DAILY_DRAFT_KEY, nextConcept);
      } catch (error) {
        console.error("Could not save your Java concept draft:", error);
        setStatus(`Concept selected, but the draft could not be saved in this browser: ${error.message}`);
        return;
      }
      setStatus("Today's Java concept is ready. Generate the script and voice when you’re ready.");
    } else {
      setStatus("Daily concept updated. Use it now or save your own concept.");
    }
  }

  function saveDraft(value) {
    setConcept(value);
    try {
      localStorage.setItem(DAILY_DRAFT_KEY, value);
    } catch (error) {
      console.error("Could not save your Java concept draft:", error);
      setStatus(`Your concept is in the form, but could not be saved in this browser: ${error.message}`);
    }
  }

  function chooseFormat(value) {
    setFormat(value);
    setVideo(null);
    setScriptDraft(null);
    stopPreview();
    audioRef.current?.pause();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current = null;
    setTime(0);
    try {
      localStorage.setItem("youtube-growth-agent.java-short-format", value);
    } catch (error) {
      console.error("Could not save your video format:", error);
      setStatus(`Format changed, but could not be saved in this browser: ${error.message}`);
    }
  }

  function chooseVoiceSource(value) {
    setVoiceSource(value);
    setVoiceFile(null);
    setVideo(null);
    setScriptDraft(null);
    stopPreview();
    audioRef.current?.pause();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current = null;
    setTime(0);
    try {
      localStorage.setItem("youtube-growth-agent.java-short-voice", value);
    } catch (error) {
      console.error("Could not save your narration choice:", error);
      setStatus(`Narration choice changed, but could not be saved in this browser: ${error.message}`);
    }
  }

  function selectVoiceFile(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setVoiceFile(null);
      return;
    }
    if (!file.type.startsWith("audio/")) {
      setVoiceFile(null);
      setStatus("Choose an audio file such as MP3, WAV, M4A, or WebM audio.");
      event.target.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setVoiceFile(null);
      setStatus("Audio files must be 100 MB or smaller.");
      event.target.value = "";
      return;
    }
    setVoiceFile(file);
    setVideo(null);
    stopPreview();
    audioRef.current?.pause();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current = null;
    setStatus(`Voice file selected: ${file.name}. Generate the scenes to preview and download.`);
    if (scriptDraft) {
      attachVoiceToScript(scriptDraft, file);
    }
  }

  async function attachVoiceToScript(script, file) {
    setMode("generating");
    setStatus("Loading your voice recording locally and building the video…");
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
      setMode("ready");
      setStatus("This recording could not be opened. Try an MP3, WAV, M4A, or WebM audio file.");
    }, { once: true });
    audio.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setMode("ready");
        setStatus("The recording has no valid audio duration. Choose another audio file.");
        return;
      }
      const durationLimit = script.format === "long" ? 600 : 120;
      if (audio.duration > durationLimit) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setMode("ready");
        setStatus(
          script.format === "long"
            ? "Narration must be 10 minutes or shorter for this video."
            : "Short narration must be 2 minutes or shorter. Choose Long for a longer video."
        );
        return;
      }
      const readyVideo = { ...script, audioUrl, duration: audio.duration };
      if (canvasRef.current) {
        canvasRef.current.width = script.format === "long" ? 1920 : 1080;
        canvasRef.current.height = script.format === "long" ? 1080 : 1920;
      }
      setVideo(readyVideo);
      setTime(0);
      drawAt(readyVideo, 0);
      setMode("ready");
      setStatus(`Your video is ready with your voice (${formatDuration(audio.duration)}). Preview it or download the WebM.`);
    }, { once: true });
    audio.src = audioUrl;
  }

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      audioRef.current?.pause();
      if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  function drawAt(currentVideo, currentTime) {
    if (canvasRef.current) drawGeneratedFrame(canvasRef.current, currentVideo, currentTime);
  }

  useEffect(() => {
    if (video) drawAt(video, 0);
  }, [video]);

  async function generate(event) {
    event.preventDefault();
    audioRef.current?.pause();
    if (audioRef.current?.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current = null;
    setVideo(null);
    setScriptDraft(null);
    setTime(0);
    setMode("generating");
    setStatus(
      voiceSource === "ai"
        ? "Writing the Hinglish script and generating AI narration…"
        : "Writing the Hinglish script and preparing your narration…"
    );
    try {
      const response = await fetch("/api/java-short", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, language: "Hinglish", format, voiceSource }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);

      const { audioBase64, ...generatedVideo } = result;
      if (voiceSource === "upload") {
        setScriptDraft(generatedVideo);
        if (voiceFile) {
          await attachVoiceToScript(generatedVideo, voiceFile);
        } else {
          setStatus("Your Hinglish script is ready. Read it below, record your narration, then upload it above.");
          setMode("ready");
        }
        return;
      }
      const audioUrl =
        URL.createObjectURL(
          new Blob(
            [Uint8Array.from(atob(audioBase64), (character) => character.charCodeAt(0))],
            { type: result.audioMimeType }
          )
        );
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setStatus("The narration could not be decoded by this browser. Try a current Chrome or Edge browser.");
        setMode("ready");
      }, { once: true });
      audio.addEventListener("loadedmetadata", () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          setStatus("Generated voice narration had an invalid duration. Please try again.");
          setMode("ready");
          return;
        }
        const durationLimit = format === "long" ? 600 : 120;
        if (audio.duration > durationLimit) {
          URL.revokeObjectURL(audioUrl);
          setStatus(
            format === "long"
              ? "Narration must be 10 minutes or shorter for this video."
              : "Short narration must be 2 minutes or shorter. Choose Long for a longer video."
          );
          setMode("ready");
          return;
        }
        const readyVideo = { ...generatedVideo, audioUrl, duration: audio.duration };
        if (canvasRef.current) {
          canvasRef.current.width = result.format === "long" ? 1920 : 1080;
          canvasRef.current.height = result.format === "long" ? 1080 : 1920;
        }
        setVideo(readyVideo);
        setTime(0);
        drawAt(readyVideo, 0);
        setMode("ready");
        setStatus(
          `Your video is ready with AI narration (${formatDuration(audio.duration)}). Preview it or download the WebM.`
        );
      }, { once: true });
      audio.src = audioUrl;
    } catch (error) {
      setMode("ready");
      setStatus(error.message || "Unable to generate this Short. Please try again.");
    }
  }

  function stopPreview() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    audioRef.current?.pause();
  }

  async function playPreview() {
    if (!video || mode !== "ready") return;
    stopPreview();
    const audio = audioRef.current;
    if (!audio) {
      setStatus("Generate a Short before previewing.");
      return;
    }
    setMode("playing");
    setStatus(
      video.voiceSource === "upload"
        ? "Playing the animated preview with your narration."
        : "Playing the animated preview with generated Hinglish narration."
    );
    audio.currentTime = 0;
    try {
      await audio.play();
      let lastSecond = -1;
      const update = () => {
        const currentTime = Math.min(audio.currentTime, video.duration);
        drawAt(video, currentTime);
        const currentSecond = Math.floor(currentTime);
        if (currentSecond !== lastSecond) {
          lastSecond = currentSecond;
          setTime(currentTime);
        }
        if (!audio.paused && currentTime < video.duration) {
          frameRef.current = window.requestAnimationFrame(update);
        } else {
          frameRef.current = null;
          setTime(video.duration);
          setMode("ready");
          setStatus("Preview finished. Your narrated video is ready to download.");
        }
      };
      frameRef.current = window.requestAnimationFrame(update);
    } catch (error) {
      setMode("ready");
      setStatus(`Could not play the voice preview: ${error.message}`);
    }
  }

  async function downloadVideo() {
    if (!video || mode !== "ready") return;
    const canvas = canvasRef.current;
    if (!window.MediaRecorder || !canvas || typeof canvas.captureStream !== "function") {
      setStatus("Video export is not supported in this browser. Try the latest Chrome or Edge desktop browser.");
      return;
    }

    setMode("exporting");
    setStatus("Preparing the narrated video. Keep this tab open until the download starts.");
    let audioContext;
    let mediaStream;
    try {
      stopPreview();
      const response = await fetch(video.audioUrl);
      if (!response.ok) throw new Error(`Could not load generated audio (HTTP ${response.status}).`);
      const audioBytes = await response.arrayBuffer();
      audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const audioBuffer = await audioContext.decodeAudioData(audioBytes);
      const audioDestination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioDestination);

      const videoStream = canvas.captureStream(30);
      mediaStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);
      streamRef.current = mediaStream;
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
      recorderRef.current = recorder;
      const chunks = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("error", (event) => {
        setStatus(`Video export failed: ${event.error?.message || "the browser recorder reported an error."}`);
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
          link.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "daily-java-short"}.webm`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          const recordedDates = completedDates.includes(today)
            ? completedDates
            : [...completedDates, today].sort();
          if (persistProgress(recordedDates)) {
            setStatus("Your narrated WebM was downloaded locally. Today's video is done—your streak is updated.");
          }
        } else {
          setStatus("The browser did not produce a video file. Try again in a current Chrome or Edge browser.");
        }
        drawAt(video, 0);
        setTime(0);
        setMode("ready");
      }, { once: true });

      drawAt(video, 0);
      setTime(0);
      await audioContext.resume();
      recorder.start(250);
      source.start();
      const startedAt = audioContext.currentTime;
      let lastSecond = -1;
      const render = () => {
        const elapsed = Math.min(audioContext.currentTime - startedAt, audioBuffer.duration);
        drawAt(video, elapsed);
        const currentSecond = Math.floor(elapsed);
        if (currentSecond !== lastSecond) {
          lastSecond = currentSecond;
          setTime(elapsed);
        }
        if (elapsed < audioBuffer.duration && recorder.state === "recording") {
          frameRef.current = window.requestAnimationFrame(render);
        } else if (recorder.state === "recording") {
          frameRef.current = null;
          recorder.stop();
        }
      };
      frameRef.current = window.requestAnimationFrame(render);
      setStatus("Recording the narrated video. Keep this tab open until the download starts.");
    } catch (error) {
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      if (audioContext && audioContext.state !== "closed") await audioContext.close();
      audioContextRef.current = null;
      setMode("ready");
      setStatus(`Could not create the narrated video: ${error.message}`);
    }
  }

  async function copyScript() {
    const script = video || scriptDraft;
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.voiceover);
      setStatus("Voiceover script copied.");
    } catch (error) {
      setStatus(`Could not copy the script: ${error.message}`);
    }
  }

  const busy = mode !== "ready";

  return (
    <section className="daily-java-studio" aria-labelledby="daily-java-title">
      <div className="tools-heading">
        <span className="step-label">YOUR DAILY JAVA VIDEO WORKFLOW</span>
        <h2 id="daily-java-title">
          Make a Java Short from any concept<span className="heading-period">.</span>
        </h2>
        <p>Enter one concept. Generate a Hinglish script, animated scenes, and a spoken voice track—then download the finished vertical video.</p>
      </div>
      <div className="form-card daily-java-card">
        <div className="daily-routine">
          <div className="daily-routine-top">
            <div>
              <span className="step-label">TODAY’S JAVA CONCEPT</span>
              <h3>{JAVA_TOPIC_IDEAS[dailyTopicIndex]}</h3>
              <p>{todayComplete ? "Today’s video is downloaded. Come back tomorrow for a fresh concept." : "One focused concept a day. Choose the suggested topic or swap in another."}</p>
            </div>
            <div className="daily-streak" aria-label={`${streak}-day video streak`}>
              <span aria-hidden="true">🔥</span>
              <strong>{streak}</strong>
              <span>{streak === 1 ? "day streak" : "day streak"}</span>
            </div>
          </div>
          <div className="daily-routine-actions">
            <button type="button" className="copy-button daily-use-topic" onClick={() => chooseTopic(dailyTopicIndex, true)} disabled={busy || todayComplete}>
              {todayComplete ? "Today's video complete ✓" : "Use today’s concept"}
            </button>
            <button type="button" className="copy-button" onClick={() => chooseTopic(dailyTopicIndex + 1)} disabled={busy}>
              Try another topic <span aria-hidden="true">↻</span>
            </button>
            {concept && concept !== JAVA_TOPIC_IDEAS[dailyTopicIndex] && (
              <button type="button" className="copy-button" onClick={() => chooseTopic(dailyTopicIndex, true)} disabled={busy}>
                Back to today’s topic
              </button>
            )}
          </div>
          <div className="daily-week" aria-label={`${weeklyCount} of 7 videos downloaded this week`}>
            <div className="daily-week-heading">
              <span>Last 7 days</span>
              <strong>{weeklyCount}/7 videos</strong>
            </div>
            <div className="daily-week-days">
              {recentDates.map((date) => {
                const isComplete = completedDates.includes(date);
                const isToday = date === today;
                return (
                  <div className="daily-week-day" key={date} aria-label={`${formatShortDate(date)}${isToday ? ", today" : ""}${isComplete ? ", video downloaded" : ", no video downloaded"}`}>
                    <span>{formatShortDate(date)}</span>
                    <span className={`daily-week-dot${isComplete ? " is-complete" : ""}${isToday ? " is-today" : ""}`} aria-hidden="true">
                      {isComplete ? "✓" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <p>Your progress stays in this browser. A day counts only after its video downloads.</p>
          </div>
        </div>
        <form className="daily-java-form" onSubmit={generate}>
          <label className="field-label" htmlFor="daily-java-concept">What Java concept should today’s video explain?</label>
          <input
            id="daily-java-concept"
            value={concept}
            onChange={(event) => saveDraft(event.target.value)}
            maxLength={160}
            placeholder="e.g. Garbage collection, HashMap, Java streams"
            required
          />
          <div className="daily-video-options">
            <fieldset className="daily-option-group">
              <legend className="field-label">Video format</legend>
              <div className="daily-option-cards">
                <label className={`daily-option-card${format === "short" ? " is-selected" : ""}`}>
                  <input type="radio" name="daily-video-format" value="short" checked={format === "short"} onChange={() => chooseFormat("short")} />
                  <span><strong>Short</strong><small>~1 min · Vertical 9:16</small></span>
                </label>
                <label className={`daily-option-card${format === "long" ? " is-selected" : ""}`}>
                  <input type="radio" name="daily-video-format" value="long" checked={format === "long"} onChange={() => chooseFormat("long")} />
                  <span><strong>Long video</strong><small>~5 min · Landscape 16:9</small></span>
                </label>
              </div>
            </fieldset>
            <fieldset className="daily-option-group">
              <legend className="field-label">Narration</legend>
              <div className="daily-option-cards">
                <label className={`daily-option-card${voiceSource === "ai" ? " is-selected" : ""}`}>
                  <input type="radio" name="daily-voice-source" value="ai" checked={voiceSource === "ai"} onChange={() => chooseVoiceSource("ai")} />
                  <span><strong>AI voice</strong><small>Hinglish narration generated for you</small></span>
                </label>
                <label className={`daily-option-card${voiceSource === "upload" ? " is-selected" : ""}`}>
                  <input type="radio" name="daily-voice-source" value="upload" checked={voiceSource === "upload"} onChange={() => chooseVoiceSource("upload")} />
                  <span><strong>My voice</strong><small>Upload a recording of your narration</small></span>
                </label>
              </div>
            </fieldset>
            {voiceSource === "upload" && (
              <div className="daily-voice-upload">
                <label className="field-label" htmlFor="daily-java-audio">Your narration file</label>
                <input id="daily-java-audio" type="file" accept="audio/*" onChange={selectVoiceFile} />
                <p className="field-hint">
                  {voiceFile
                    ? `${voiceFile.name} · ${(voiceFile.size / (1024 * 1024)).toFixed(1)} MB · used locally, not uploaded to the server`
                    : `${scriptDraft ? "Record the generated script below, then choose your file." : "You can generate the script first, then record and upload your voice."} Choose MP3, WAV, M4A, or other audio up to 100 MB. ${format === "short" ? "Up to 2 minutes." : "Up to 10 minutes."}`}
                </p>
              </div>
            )}
          </div>
          <div className="daily-java-form-footer">
            <p className="field-hint">
              {voiceSource === "upload"
                ? `Your recording is combined with animated ${format === "short" ? "vertical" : "landscape"} scenes in your browser. The concept is sent to Gemini for the Hinglish script.`
                : `Creates a Hinglish narrated ${format === "short" ? "~1-minute vertical Short" : "~5-minute landscape video"}.`}
            </p>
            <button className="submit-button daily-java-generate" type="submit" disabled={busy || !concept.trim()}>
              {mode === "generating" ? "Generating…" : voiceSource === "upload" && !scriptDraft ? "Generate script" : "Make today’s video"}
              <span className="button-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </form>
        <p className="daily-java-key-note">
          Needs <code>GEMINI_API_KEY</code> on the server for the Hinglish script{voiceSource === "ai" ? " and AI voice" : ""}.{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini API key</a>.
          Your draft stays in this browser. The Java concept goes to Gemini; your selected audio file stays on your device.
        </p>
        <div className="daily-java-output">
          <div className="daily-java-preview">
            <div className={`short-preview-stage${format === "long" ? " is-long" : ""}`} aria-label={`Animated preview of the generated Java ${format} video`}>
              <div className="short-stage-header">
                <span>AAYUSH ENGINEERING HUB</span>
                <span>{format === "long" ? "JAVA LESSON · 16:9" : "JAVA SHORT · 9:16"}</span>
              </div>
              <div className="short-stage-rule" />
              {video ? (
                <div className="short-stage-content" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      className="short-stage-scene"
                      key={sceneIndex}
                      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reducedMotion ? {} : { opacity: 0, y: -16 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="short-stage-detail">SCENE {sceneIndex + 1} / {video.scenes.length}</p>
                      <h3 className="short-stage-title">{activeScene.title}</h3>
                      <div className="short-flow">
                        {activeScene.visualLabels.map((label, index) => (
                          <React.Fragment key={`${sceneIndex}-${label}`}>
                            <motion.span
                              className="short-flow-item"
                              animate={reducedMotion ? {} : { y: [0, -4, 0] }}
                              transition={{ duration: 1.8, delay: index * 0.12, repeat: Infinity }}
                            >
                              {label}
                            </motion.span>
                            {index < activeScene.visualLabels.length - 1 && <span className="short-flow-arrow">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="short-stage-caption">{activeScene.caption}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="short-stage-content daily-java-placeholder">
                  <motion.span
                    className="short-complexity"
                    animate={reducedMotion ? {} : { opacity: [0.6, 1, 0.6], scale: [0.97, 1, 0.97] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {concept.trim() ? "JAVA" : "IDEA"}
                  </motion.span>
                  <p className="short-stage-caption">Your concept becomes a video here.</p>
                </div>
              )}
              <div
                className="short-stage-progress"
                role="progressbar"
                aria-label="Generated video progress"
                aria-valuemin="0"
                aria-valuemax={video ? Math.ceil(video.duration) : 1}
                aria-valuenow={video ? Math.floor(time) : 0}
              >
                <motion.span animate={{ width: `${video ? (time / video.duration) * 100 : 0}%` }} transition={{ duration: 0.15 }} />
              </div>
              <div className="short-stage-footer">
                <span>{video ? video.title.toUpperCase().slice(0, 22) : "DAILY JAVA SHORT"}</span>
                <span>{video ? `${formatDuration(time)} / ${formatDuration(video.duration)}` : format === "long" ? "16:9" : "9:16"}</span>
              </div>
            </div>
            <div className="short-preview-badge"><span className="status-dot" />{format === "long" ? "16:9" : "9:16"}{video ? " · WITH VOICE" : " · PREVIEW"}</div>
          </div>
          <div className="daily-java-result">
            <span className="step-label">{video ? `YOUR NEW JAVA ${video.format === "long" ? "LESSON" : "SHORT"}` : "GENERATE A NEW JAVA VIDEO EACH DAY"}</span>
            <h3>{video?.title || "Your video will appear here"}</h3>
            <p className="daily-java-status" role="status" aria-live="polite">{status}</p>
            {video && (
              <>
                <div className="short-actions">
                  <button className="copy-button" type="button" onClick={playPreview} disabled={busy}>
                    {mode === "playing" ? "Playing with voice…" : `Preview ${video.voiceSource === "upload" ? "my voice" : "AI voice"}`} <span aria-hidden="true">▶</span>
                  </button>
                  <button className="submit-button short-export" type="button" onClick={downloadVideo} disabled={busy}>
                    {mode === "exporting" ? "Rendering…" : "Download video"} <span className="button-arrow" aria-hidden="true">↓</span>
                  </button>
                </div>
                <div className="voiceover">
                  <div className="voiceover-heading">
                    <h4>{video.voiceSource === "upload" ? "Hinglish narration script" : "Generated Hinglish voiceover"}</h4>
                    <button className="copy-button" type="button" onClick={copyScript}>Copy script</button>
                  </div>
                  <p>{video.voiceover}</p>
                </div>
              </>
            )}
            {!video && scriptDraft && (
              <div className="voiceover">
                <div className="voiceover-heading">
                  <h4>Hinglish narration script · record this in your voice</h4>
                  <button className="copy-button" type="button" onClick={copyScript}>Copy script</button>
                </div>
                <p>{scriptDraft.voiceover}</p>
                <p className="daily-upload-next-step">After recording, select your audio file above. The animated {scriptDraft.format === "long" ? "landscape" : "vertical"} video will be assembled on this device.</p>
              </div>
            )}
            <p className="short-note">The finished WebM includes {video?.voiceSource === "upload" ? "your uploaded voice" : "AI voice narration"} and downloads locally. Review technical details and the final video before uploading. Nothing is published automatically.</p>
          </div>
        </div>
        <canvas ref={canvasRef} width={video?.format === "long" ? "1920" : "1080"} height={video?.format === "long" ? "1080" : "1920"} className="short-export-canvas" aria-hidden="true" />
      </div>
    </section>
  );
}

const dailyShortRoot = document.querySelector("#daily-java-short-root");
if (!dailyShortRoot) throw new Error("The Daily Java Short module root element was not found.");
createRoot(dailyShortRoot).render(<DailyJavaShortStudio />);
