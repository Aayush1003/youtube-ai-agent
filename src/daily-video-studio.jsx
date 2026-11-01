import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import workflow from "./daily-video-workflow.cjs";

const { DAILY_VIDEO_CATEGORIES, HUMAN_STORY_STARTER, calculateStreak, localDateKey } = workflow;
const CATEGORY_BY_ID = Object.fromEntries(DAILY_VIDEO_CATEGORIES.map((category) => [category.id, category]));
const PROGRESS_KEY = "channelcraft.daily-video-progress";
const PROMPT_KEY = "channelcraft.daily-video-prompt";
const FORMAT_KEY = "channelcraft.daily-video-format";
const RESEARCH_KEY = "channelcraft.daily-video-research";
const UPLOAD_DURATION_LIMIT = { short: 120, long: 600 };

function drawLaundromatFrame(context, video, time, sceneIndex, scene, width, height, unit) {
  const progress = video.duration ? Math.max(0, Math.min(time / video.duration, 1)) : 0;
  const dawn = Math.max(0, (progress - 0.42) / 0.58);
  const background = context.createLinearGradient(0, 0, width * 0.82, height);
  background.addColorStop(0, `rgb(${Math.round(15 + dawn * 36)}, ${Math.round(24 + dawn * 26)}, ${Math.round(37 + dawn * 10)})`);
  background.addColorStop(0.58, `rgb(${Math.round(27 + dawn * 52)}, ${Math.round(42 + dawn * 27)}, ${Math.round(55 + dawn * 5)})`);
  background.addColorStop(1, "#171b20");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const windowX = width * 0.075;
  const windowY = height * 0.17;
  const windowWidth = width * 0.85;
  const windowHeight = height * 0.255;
  const windowGlow = context.createLinearGradient(0, windowY, 0, windowY + windowHeight);
  windowGlow.addColorStop(0, `rgba(${Math.round(94 + dawn * 91)},${Math.round(143 + dawn * 48)},${Math.round(180 + dawn * 12)},.43)`);
  windowGlow.addColorStop(1, "rgba(35,47,58,.68)");
  context.fillStyle = windowGlow;
  context.fillRect(windowX, windowY, windowWidth, windowHeight);

  context.save();
  context.beginPath();
  context.rect(windowX, windowY, windowWidth, windowHeight);
  context.clip();
  for (let index = 0; index < 38; index += 1) {
    const x = windowX + (((index * 173 + 29) % 991) / 991) * windowWidth;
    const y = windowY + (((index * 239 + 47 + time * (35 + (index % 4) * 11)) % 997) / 997) * windowHeight;
    context.globalAlpha = 0.2 + ((index * 13) % 5) * 0.07;
    context.strokeStyle = dawn > 0.25 ? "#fff0d3" : "#c8e3f1";
    context.lineWidth = Math.max(1, unit * 0.0014);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - unit * 0.008, y + unit * 0.042);
    context.stroke();
  }
  context.restore();

  const tileSize = unit * 0.085;
  context.globalAlpha = 0.16;
  context.strokeStyle = "#d5d4c6";
  context.lineWidth = Math.max(1, unit * 0.001);
  for (let x = 0; x <= width; x += tileSize) {
    context.beginPath();
    context.moveTo(x, height * 0.43);
    context.lineTo(x, height * 0.78);
    context.stroke();
  }
  for (let y = height * 0.43; y <= height * 0.78; y += tileSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.globalAlpha = 1;

  const floor = context.createLinearGradient(0, height * 0.73, 0, height);
  floor.addColorStop(0, "#363b3d");
  floor.addColorStop(1, "#171b1f");
  context.fillStyle = floor;
  context.beginPath();
  context.moveTo(0, height * 0.73);
  context.lineTo(width, height * 0.73);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();
  for (let index = 0; index < 8; index += 1) {
    const y = height * (0.78 + index * 0.027);
    context.strokeStyle = `rgba(218,218,198,${0.04 + index * 0.006})`;
    context.lineWidth = Math.max(1, unit * 0.001);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const drawWasher = (x, y, washerWidth, washerHeight, doorSize, label) => {
    context.fillStyle = "#343e43";
    context.fillRect(x, y, washerWidth, washerHeight);
    context.fillStyle = "#8b9b9b";
    context.fillRect(x + washerWidth * 0.06, y + washerHeight * 0.04, washerWidth * 0.88, washerHeight * 0.06);
    context.fillStyle = "#b5d1bd";
    context.font = `700 ${Math.max(12, unit * 0.017)}px Arial, sans-serif`;
    context.textAlign = "left";
    context.fillText(label, x + washerWidth * 0.1, y + washerHeight * 0.185);
    const cx = x + washerWidth * 0.5;
    const cy = y + washerHeight * 0.61;
    context.fillStyle = "#20282d";
    context.beginPath();
    context.arc(cx, cy, doorSize * 0.57, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#bac1b8";
    context.lineWidth = Math.max(3, unit * 0.009);
    context.beginPath();
    context.arc(cx, cy, doorSize * 0.52, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = `rgba(166,198,197,${0.24 + Math.sin(time + label.length) * 0.04})`;
    context.lineWidth = Math.max(2, unit * 0.004);
    context.beginPath();
    context.arc(cx, cy, doorSize * 0.39, time * 0.4, time * 0.4 + Math.PI * 1.4);
    context.stroke();
    context.fillStyle = "rgba(197,217,199,.75)";
    context.beginPath();
    context.ellipse(cx + Math.cos(time * 0.5) * doorSize * 0.1, cy + Math.sin(time * 0.5) * doorSize * 0.1, doorSize * 0.09, doorSize * 0.045, time, 0, Math.PI * 2);
    context.fill();
  };

  drawWasher(width * 0.035, height * 0.52, width * 0.25, height * 0.24, unit * 0.1, "02");
  drawWasher(width * 0.72, height * 0.52, width * 0.25, height * 0.24, unit * 0.1, "06");
  const dryerX = width * 0.265;
  const dryerY = height * 0.425;
  const dryerWidth = width * 0.47;
  const dryerHeight = height * 0.315;
  drawWasher(dryerX, dryerY, dryerWidth, dryerHeight, unit * 0.225, "DRYER 04");

  if (sceneIndex === 2 || sceneIndex === 4) {
    const personX = width * (sceneIndex === 2 ? 0.19 : 0.82);
    const personY = height * 0.66;
    const scale = unit * 0.13;
    context.fillStyle = sceneIndex === 2 ? "#242a34" : "#29312d";
    context.beginPath();
    context.ellipse(personX, personY + scale * 0.6, scale * 0.46, scale * 0.7, 0, Math.PI, 0);
    context.fill();
    context.fillStyle = "#d4ab88";
    context.beginPath();
    context.arc(personX, personY, scale * 0.29, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#302a2b";
    context.beginPath();
    context.arc(personX, personY - scale * 0.05, scale * 0.3, Math.PI, Math.PI * 2);
    context.fill();
  }

  const paperWidth = width * 0.58;
  const paperHeight = height * (sceneIndex === 4 ? 0.13 : 0.155);
  const paperX = (width - paperWidth) / 2;
  const paperY = height * (sceneIndex === 5 ? 0.405 : 0.39);
  context.save();
  context.translate(width * 0.5, paperY + paperHeight * 0.5 + Math.sin(time * 0.7) * unit * 0.003);
  context.rotate(Math.sin(time * 0.42) * 0.012);
  context.shadowColor = "rgba(0,0,0,.4)";
  context.shadowBlur = unit * 0.026;
  context.shadowOffsetY = unit * 0.008;
  context.fillStyle = sceneIndex === 5 ? "#f5ecd7" : "#f1e8d2";
  context.fillRect(-paperWidth / 2, -paperHeight / 2, paperWidth, paperHeight);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.fillStyle = "#4a483e";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const focusLines = (scene.focusText || "").split("\n");
  const focusFont = Math.max(19, unit * (sceneIndex === 5 ? 0.052 : 0.039));
  context.font = `italic 600 ${focusFont}px Georgia, serif`;
  focusLines.forEach((line, index) => {
    context.fillText(line, 0, (index - (focusLines.length - 1) / 2) * focusFont * 1.4, paperWidth * 0.88);
  });
  context.textBaseline = "alphabetic";
  context.restore();

  const labelFont = Math.max(13, unit * 0.017);
  context.textAlign = "left";
  context.fillStyle = "rgba(245,238,219,.82)";
  context.font = `700 ${labelFont}px Arial, sans-serif`;
  context.fillText("AN ORIGINAL STORY · FICTION", width * 0.065, height * 0.065);
  context.textAlign = "right";
  context.fillStyle = "rgba(245,238,219,.68)";
  context.fillText(`${String(sceneIndex + 1).padStart(2, "0")} / ${String(video.scenes.length).padStart(2, "0")}`, width * 0.935, height * 0.065);

  const titleFont = Math.max(23, unit * (sceneIndex === 0 ? 0.055 : 0.036));
  context.textAlign = "center";
  context.fillStyle = "#fff6e3";
  context.shadowColor = "rgba(4,8,13,.5)";
  context.shadowBlur = unit * 0.018;
  context.font = `700 ${titleFont}px Georgia, serif`;
  context.fillText(sceneIndex === 0 ? "THE NOTE ON DRYER FOUR" : scene.title.toUpperCase(), width / 2, height * 0.12, width * 0.86);
  context.shadowBlur = 0;

  context.fillStyle = "rgba(10,14,18,.73)";
  context.fillRect(0, height * 0.795, width, height * 0.13);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff8e9";
  context.font = `500 ${Math.max(20, unit * 0.025)}px Georgia, serif`;
  const captionLines = [];
  let captionLine = "";
  for (const word of scene.caption.split(/\s+/)) {
    const candidate = captionLine ? `${captionLine} ${word}` : word;
    if (captionLine && context.measureText(candidate).width > width * 0.84) {
      captionLines.push(captionLine);
      captionLine = word;
    } else {
      captionLine = candidate;
    }
  }
  if (captionLine) captionLines.push(captionLine);
  const captionLineHeight = unit * 0.035;
  captionLines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, width / 2, height * 0.86 + (index - (Math.min(captionLines.length, 3) - 1) / 2) * captionLineHeight, width * 0.88);
  });
  context.textBaseline = "alphabetic";

  context.fillStyle = "rgba(228,225,209,.18)";
  context.fillRect(width * 0.065, height * 0.94, width * 0.87, Math.max(4, unit * 0.005));
  context.fillStyle = "#c8d39c";
  context.fillRect(width * 0.065, height * 0.94, width * 0.87 * progress, Math.max(4, unit * 0.005));
}

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
  if (video.storyStyle === "laundromat-note") {
    drawLaundromatFrame(context, video, elapsed, sceneIndex, scene, width, height, minDimension);
    return;
  }
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
  } else if (video.category === "food") {
    const centerX = width * 0.5;
    const centerY = height * 0.53;
    const radius = minDimension * 0.17;
    context.fillStyle = "rgba(255,244,222,.92)";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = `${accent}cc`;
    context.lineWidth = Math.max(3, minDimension * 0.007);
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.87, 0, Math.PI * 2);
    context.stroke();
    const ingredients = [
      [0, -0.37, 0.07, "#e67c54"],
      [-0.38, -0.07, 0.055, "#78a66d"],
      [0.35, -0.13, 0.06, "#f1bd58"],
      [-0.2, 0.31, 0.055, "#c65f58"],
      [0.27, 0.31, 0.05, "#6e9c63"],
      [0.03, -0.04, 0.055, "#f4d681"],
    ];
    ingredients.forEach(([x, y, size, color]) => {
      context.fillStyle = color;
      context.beginPath();
      context.arc(centerX + x * radius, centerY + y * radius, size * minDimension, 0, Math.PI * 2);
      context.fill();
    });
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

function createStorySoundscape(duration = 58) {
  const sampleRate = 22050;
  const frameCount = Math.ceil(sampleRate * duration);
  const channelCount = 2;
  const dataLength = frameCount * channelCount * 2;
  const wav = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wav);
  const writeText = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * 2, true);
  view.setUint16(32, channelCount * 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataLength, true);

  const chords = [
    [146.83, 174.61, 220],
    [130.81, 164.81, 196],
    [110, 146.83, 174.61],
    [130.81, 164.81, 220],
  ];
  let noiseLeft = 0;
  let noiseRight = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const chordPosition = time / (duration / chords.length);
    const chordIndex = Math.min(Math.floor(chordPosition), chords.length - 1);
    const chordBlend = Math.min(1, (chordPosition - chordIndex) * 2);
    const nextChord = chords[Math.min(chordIndex + 1, chords.length - 1)];
    const fade = Math.min(1, time / 2.2, (duration - time) / 3.5);
    const swell = 0.74 + Math.sin((time / duration) * Math.PI) * 0.26;
    const whiteLeft = Math.random() * 2 - 1;
    const whiteRight = Math.random() * 2 - 1;
    noiseLeft = noiseLeft * 0.89 + whiteLeft * 0.11;
    noiseRight = noiseRight * 0.89 + whiteRight * 0.11;
    let pad = 0;
    for (let note = 0; note < 3; note += 1) {
      const frequency = chords[chordIndex][note] * (1 - chordBlend) + nextChord[note] * chordBlend;
      pad += Math.sin(time * frequency * Math.PI * 2 + note * 0.12) / (note + 1);
    }
    const rain = 0.12 * noiseLeft + 0.055 * (whiteLeft - noiseLeft);
    const warmPad = pad * (0.024 + swell * 0.009);
    let chime = 0;
    for (const bellTime of [10.5, 29, 48]) {
      const bellAge = time - bellTime;
      if (bellAge >= 0 && bellAge < 2.6) {
        chime +=
          (Math.sin(bellAge * 880 * Math.PI * 2) * 0.012 +
            Math.sin(bellAge * 1320 * Math.PI * 2) * 0.006) *
          Math.exp(-bellAge * 2.4);
      }
    }
    const left = Math.max(-0.88, Math.min(0.88, (rain + warmPad + chime) * fade));
    const right = Math.max(-0.88, Math.min(0.88, (0.12 * noiseRight + 0.055 * (whiteRight - noiseRight) + warmPad + chime) * fade));
    const offset = 44 + frame * channelCount * 2;
    view.setInt16(offset, Math.round(left * 32767), true);
    view.setInt16(offset + 2, Math.round(right * 32767), true);
  }
  return new Blob([wav], { type: "audio/wav" });
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
  const voiceInputRef = useRef(null);
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
  const [automation, setAutomation] = useState(null);
  const [automationBusy, setAutomationBusy] = useState(false);
  const [automationMessage, setAutomationMessage] = useState("");
  const [video, setVideo] = useState(null);
  const [storyDraft, setStoryDraft] = useState(null);
  const [voiceSource, setVoiceSource] = useState("ai");
  const [voiceFile, setVoiceFile] = useState(null);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("idle");
  const [status, setStatus] = useState("One prompt creates your script, AI or personal narration, animated video, and download.");
  const [error, setError] = useState("");

  const category = CATEGORY_BY_ID[categoryId];
  const busy = ["generating", "playing", "exporting"].includes(mode);
  const sceneIndex = video && video.duration
    ? Math.min(Math.floor((time / video.duration) * video.scenes.length), video.scenes.length - 1)
    : 0;

  useEffect(() => {
    let active = true;
    async function refreshAutomation() {
      try {
        const response = await fetch("/api/daily-video/automation");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
        if (active) {
          setAutomation(result);
          setAutomationMessage(result.lastError || "");
        }
      } catch (refreshError) {
        console.error("Could not load daily video automation:", refreshError);
        if (active) setAutomationMessage(`Could not load the daily schedule: ${refreshError.message}`);
      }
    }
    void refreshAutomation();
    const timer = window.setInterval(refreshAutomation, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

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
    setStoryDraft(null);
    setVoiceFile(null);
    if (voiceInputRef.current) voiceInputRef.current.value = "";
    clearAudio();
    setTime(0);
    setError("");
    setStatus(`${CATEGORY_BY_ID[nextCategory].label} selected. Add a prompt and generate today's video.`);
    saveSetting("channelcraft.daily-video-category", nextCategory, "Video category");
  }

  async function loadHumanStoryStarter() {
    if (busy) return;
    clearAudio();
    setVideo(null);
    setStoryDraft(HUMAN_STORY_STARTER);
    setCategoryId(HUMAN_STORY_STARTER.category);
    setFormat(HUMAN_STORY_STARTER.format);
    setVoiceSource(HUMAN_STORY_STARTER.voiceSource);
    setResearch(false);
    setVoiceFile(null);
    if (voiceInputRef.current) voiceInputRef.current.value = "";
    setTime(0);
    setError("");
    setMode("generating");
    setStatus("Composing original rain, warm score, and scene-by-scene story art locally…");
    saveSetting("channelcraft.daily-video-category", HUMAN_STORY_STARTER.category, "Video category");
    saveSetting(FORMAT_KEY, HUMAN_STORY_STARTER.format, "Video format");
    saveSetting("channelcraft.daily-video-voice", HUMAN_STORY_STARTER.voiceSource, "Narration preference");
    saveSetting(RESEARCH_KEY, "false", "Research preference");
    const originalPrompt = "An original fictional short about an anonymous note left on a laundromat dryer.";
    setPrompt(originalPrompt);
    saveSetting(PROMPT_KEY, originalPrompt, "Prompt");
    try {
      const soundscape = createStorySoundscape();
      prepareVideo(HUMAN_STORY_STARTER, soundscape, "original ambient score");
    } catch (storyError) {
      setMode("idle");
      setError(`Could not compose the local story soundtrack: ${storyError.message}`);
      setStatus("The story could not be prepared.");
    }
  }

  function prepareVideo(generatedVideo, audioBlob, voiceLabel, videoFormat = format) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
      setError("The video's audio track could not be decoded. Try a current Chrome or Edge browser.");
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
      if (audio.duration > UPLOAD_DURATION_LIMIT[videoFormat]) {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError(videoFormat === "short"
          ? "Short narration exceeded 2 minutes. Choose Long or generate a tighter script."
          : "Long narration exceeded 10 minutes. Please generate a shorter script.");
        setMode("idle");
        return;
      }
      const readyVideo = { ...generatedVideo, audioUrl, duration: audio.duration };
      if (canvasRef.current) {
        canvasRef.current.width = videoFormat === "long" ? 1920 : 1080;
        canvasRef.current.height = videoFormat === "long" ? 1080 : 1920;
      }
      setVideo(readyVideo);
      setStoryDraft(null);
      setTime(0);
      setMode("ready");
      setError("");
      const videoCategory = CATEGORY_BY_ID[generatedVideo.category] || category;
      setStatus(`Your ${videoCategory.label.toLowerCase()} video is ready with ${voiceLabel} (${formatDuration(audio.duration)}). Preview it or download the WebM.`);
    }, { once: true });
    audio.src = audioUrl;
  }

  function attachUploadedVoice(story, file) {
    clearAudio();
    setVideo(null);
    setStoryDraft(story);
    setMode("generating");
    setStatus("Loading your voice locally and building the video…");
    prepareVideo(story, file, "your voice");
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
    if (file.size > 100 * 1024 * 1024) {
      setVoiceFile(null);
      setError("Audio files must be 100 MB or smaller.");
      event.target.value = "";
      return;
    }
    setVoiceFile(file);
    setError("");
    if (storyDraft || video) {
      attachUploadedVoice(storyDraft || video, file);
    } else {
      setStatus(`${file.name} is ready. It stays on this device and will be added to your video locally.`);
    }
  }

  async function generateVideo(event) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    clearAudio();
    setVideo(null);
    setStoryDraft(null);
    setError("");
    setMode("generating");
    setStatus(voiceSource === "ai"
      ? research
        ? "Researching current sources, writing your video, and generating AI narration…"
        : "Writing your video and generating AI narration…"
      : research
        ? "Researching current sources and writing your video script…"
        : "Writing your video script…");
    try {
      const response = await fetch("/api/daily-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), category: categoryId, format, research, voiceSource }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
      const { audioBase64, ...generatedVideo } = result;
      if (voiceSource === "upload") {
        setStoryDraft(generatedVideo);
        if (voiceFile) {
          attachUploadedVoice(generatedVideo, voiceFile);
        } else {
          setMode("ready");
          setStatus("Your script and storyboard are ready. Upload your voice above to preview and download the narrated video.");
        }
        try {
          localStorage.setItem(PROMPT_KEY, prompt);
        } catch (storageError) {
          console.error("Could not save the video prompt:", storageError);
        }
        return;
      }
      if (typeof audioBase64 !== "string" || !audioBase64) {
        throw new Error("The video was generated without narration audio. Please try again.");
      }
      const audioBytes = Uint8Array.from(atob(audioBase64), (character) => character.charCodeAt(0));
      prepareVideo(
        generatedVideo,
        new Blob([audioBytes], { type: result.audioMimeType || "audio/wav" }),
        "AI narration"
      );
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

  async function changeDailyAutomation(enabled) {
    if (automationBusy) return;
    if (enabled && !window.confirm(
      "Enable a daily Gemini-generated engineering draft at 9:00 AM Asia/Kolkata? This uses your Gemini API quota and may incur charges. It will not upload or publish anything."
    )) return;
    setAutomationBusy(true);
    setAutomationMessage(enabled ? "Enabling the daily draft schedule…" : "Pausing the daily draft schedule…");
    try {
      const response = await fetch("/api/daily-video/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
      setAutomation(result);
      setAutomationMessage(enabled
        ? "Daily drafts are enabled. The server will prepare one at 9:00 AM Asia/Kolkata."
        : "Daily drafts are paused.");
    } catch (automationError) {
      setAutomationMessage(automationError.message);
    } finally {
      setAutomationBusy(false);
    }
  }

  function loadDailyDraft(draft) {
    if (typeof draft.audioBase64 !== "string" || !draft.audioBase64) {
      throw new Error("The saved daily draft has no narration audio.");
    }
    clearAudio();
    setVideo(null);
    setStoryDraft(null);
    setCategoryId(draft.category || "education");
    setFormat(draft.format);
    setVoiceSource("ai");
    setTime(0);
    setError("");
    setMode("generating");
    const audioBytes = Uint8Array.from(atob(draft.audioBase64), (character) => character.charCodeAt(0));
    const { audioBase64, ...generatedVideo } = draft;
    prepareVideo(
      generatedVideo,
      new Blob([audioBytes], { type: draft.audioMimeType || "audio/wav" }),
      "AI narration",
      draft.format
    );
  }

  async function createDailyDraftNow() {
    if (automationBusy) return;
    setAutomationBusy(true);
    setAutomationMessage("Creating today's engineering script, storyboard, and narration…");
    try {
      const response = await fetch("/api/daily-video/drafts", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `The request failed (HTTP ${response.status}).`);
      loadDailyDraft(result.draft);
      setAutomationMessage(result.created
        ? "Today's draft is ready to review. Preview and download the video when you’re ready."
        : "Today's saved draft is ready to review.");
      const statusResponse = await fetch("/api/daily-video/automation");
      const statusResult = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(statusResult.error || `The request failed (HTTP ${statusResponse.status}).`);
      setAutomation(statusResult);
    } catch (draftError) {
      setAutomationMessage(draftError.message);
    } finally {
      setAutomationBusy(false);
    }
  }

  async function reviewTodayDraft() {
    if (automationBusy || !automation?.today) return;
    setAutomationBusy(true);
    setAutomationMessage("Loading today's saved engineering draft…");
    try {
      const response = await fetch(`/api/daily-video/drafts/${automation.today}`);
      const draft = await response.json();
      if (!response.ok) throw new Error(draft.error || `The request failed (HTTP ${response.status}).`);
      loadDailyDraft(draft);
      setAutomationMessage("Today's draft is ready to review. Preview and download the video when you’re ready.");
    } catch (draftError) {
      setAutomationMessage(draftError.message);
    } finally {
      setAutomationBusy(false);
    }
  }

  async function playPreview() {
    if (!video || !audioRef.current || busy) return;
    stopPreview();
    if (audioRef.current.currentTime >= video.duration) audioRef.current.currentTime = 0;
    setMode("playing");
    setStatus(video.storyStyle === "laundromat-note"
      ? "Playing the story film with its ambient soundtrack…"
      : "Playing the video with AI narration…");
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
      setStatus(`Could not play the video audio: ${playError.message}`);
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
    setStatus(video.storyStyle === "laundromat-note"
      ? "Rendering your story film and ambient soundtrack locally. Keep this page open until the download starts."
      : "Rendering your narrated WebM locally. Keep this page open until the download starts.");
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
    const currentScript = video || storyDraft;
    if (!currentScript) return;
    try {
      await navigator.clipboard.writeText(currentScript.voiceover);
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
            <div className="daily-eyebrow">SIX CATEGORIES · ONE SIMPLE WORKFLOW</div>
            <h1>One prompt.<br /><span>Your next video.</span></h1>
            <p className="daily-hero-copy">Pick a channel category, type what you want to make, and let AI research sources, write the script, and build a video with an AI narrator or your own voice. No editing timeline or extra idea-selection steps.</p>
          </div>
          <div className="daily-streak-card" aria-label={`${progress.streak} day video streak`}>
            <strong>{progress.streak} day{progress.streak === 1 ? "" : "s"} ✦</strong>
            <span>video-making streak</span>
          </div>
        </section>

        <section className="daily-automation-panel" aria-labelledby="daily-automation-title">
          <div className="daily-automation-copy">
            <span className="daily-step">YOUR DAILY ENGINEERING DRAFT</span>
            <h2 id="daily-automation-title">@EngineerAayushGupta · 9:00 AM IST</h2>
            <p>
              {automation
                ? `Hinglish programming and practical-AI ideas, alternating ${automation.todayFormat === "short" ? "Short today" : "long video today"} with the other format tomorrow.`
                : "Hinglish programming and practical-AI ideas, alternating Shorts and long videos."}
              {" "}AI prepares the script, storyboard, and narration. You review and download the finished WebM; nothing is uploaded.
            </p>
            <p className="daily-automation-requirement">
              {automation?.apiConfigured
                ? "Requires this server to stay running and Gemini API access. Daily generation uses your Gemini quota and may incur charges."
                : "Set GEMINI_API_KEY on the server to enable scheduled drafts. The browser renders the final WebM when you review it."}
            </p>
          </div>
          <div className="daily-automation-actions">
            <span className={`daily-automation-state${automation?.enabled ? " is-enabled" : ""}`}>
              {automation?.enabled ? "Daily schedule on" : "Daily schedule off"}
            </span>
            <button
              className="daily-automation-button"
              type="button"
              onClick={() => changeDailyAutomation(!automation?.enabled)}
              disabled={!automation || automationBusy || (!automation.enabled && !automation.apiConfigured)}
            >
              {automationBusy ? "Working…" : automation?.enabled ? "Pause daily drafts" : "Enable daily drafts"}
            </button>
            <button
              className="daily-copy-button"
              type="button"
              onClick={createDailyDraftNow}
              disabled={!automation?.apiConfigured || automationBusy}
            >
              Create today’s draft now
            </button>
            {automation?.todayDraft && (
              <button className="daily-copy-button" type="button" onClick={reviewTodayDraft} disabled={automationBusy}>
                Review today’s saved draft
              </button>
            )}
          </div>
          <p className="daily-automation-status" role={automationMessage ? "alert" : "status"}>
            {automationMessage || (automation?.enabled
              ? "The schedule runs when the local server is online; after 9:00 AM it creates at most one draft for the day."
              : "Turn on the schedule to create one saved draft per day. You can pause it any time.")}
          </p>
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
                <p>One clear sentence is enough. AI can write the video when configured, or build an original story film without an API key.</p>
              </div>
              <button className="daily-sample-button" type="button" onClick={() => {
                setPrompt(category.prompt);
                saveSetting(PROMPT_KEY, category.prompt, "Prompt");
              }} disabled={busy}>Use example prompt</button>
            </div>
            <div className="daily-offline-starter">
              <div><strong>Want a more cinematic video without an API key?</strong><p>Build an original fictional story with custom scenes and an ambient soundtrack. Its narration script is ready for your real voice.</p></div>
              <button className="daily-sample-button" type="button" onClick={loadHumanStoryStarter} disabled={busy}>Build story film</button>
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
                    setStoryDraft(null);
                    clearAudio();
                    setTime(0);
                    saveSetting(FORMAT_KEY, event.target.value, "Video format");
                  }}
                  disabled={busy}
                >
                  <option value="short">Short · ~60 sec · vertical 9:16</option>
                  <option value="long">Long · ~5 min · landscape 16:9</option>
                </select>
                <label className="daily-prompt-label" htmlFor="daily-video-voice">Narration</label>
                <select
                  className="daily-format-select"
                  id="daily-video-voice"
                  value={voiceSource}
                  onChange={(event) => {
                    setVoiceSource(event.target.value);
                    setVideo(null);
                    setStoryDraft(null);
                    clearAudio();
                    setTime(0);
                    setError("");
                    setMode("idle");
                    setStatus(event.target.value === "ai"
                      ? "AI narration selected. Generate a video to hear its voiceover."
                      : "Your voice selected. Upload a recording or generate a script first.");
                  }}
                  disabled={busy}
                >
                  <option value="ai">AI voice · warm narrator</option>
                  <option value="upload">My voice · upload recording</option>
                </select>
                {voiceSource === "upload" && (
                  <label className="daily-upload-field">
                    <span>Your voice recording <small>(audio stays on this device)</small></span>
                    <input
                      ref={voiceInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={selectVoiceFile}
                      disabled={busy}
                    />
                    {voiceFile && <small className="daily-upload-name">Selected: {voiceFile.name}</small>}
                  </label>
                )}
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
              <li><span>✦</span><span>Your choice of warm AI narration or your own locally uploaded voice</span></li>
              <li><span>✦</span><span>Original animated graphics in a vertical or landscape layout</span></li>
              <li><span>✦</span><span>Optional live web research, with citations beside the video</span></li>
              <li><span>✦</span><span>One-click local WebM download—nothing auto-publishes</span></li>
            </ul>
            <p className="daily-process-note">The finished video uses animated graphics rather than generated gameplay or film footage. Review generated facts and rights before publishing. Your prompt and selected research request are sent to Gemini; your video is rendered and downloaded in this browser.</p>
          </aside>
        </div>

        {storyDraft && !video && (
          <section className="daily-output" aria-labelledby="daily-draft-title">
            <div className="daily-output-header">
              <div>
                <span className="daily-step">{category.label.toUpperCase()} · SCRIPT READY</span>
                <h2 id="daily-draft-title">{storyDraft.title}</h2>
                <p>{storyDraft.logline}</p>
              </div>
              <button className="daily-copy-button" type="button" onClick={copyScript} disabled={busy}>Copy script</button>
            </div>
            <div className="daily-script-column">
              <h3>Your narration script</h3>
              <div className="daily-script-text">{storyDraft.voiceover}</div>
              <div className="daily-scenes" aria-label="Video storyboard">
                {storyDraft.scenes.map((scene, index) => (
                  <div className="daily-scene" key={`${scene.title}-${index}`}>
                    <strong>{String(index + 1).padStart(2, "0")} · {scene.title}</strong>
                    <span>{scene.caption}</span>
                  </div>
                ))}
              </div>
            </div>
            {storyDraft.sources?.length > 0 && (
              <div className="daily-sources" aria-label="Research sources">
                {storyDraft.sources.map((source) => (
                  <a className="daily-source-link" href={source.url} key={source.url} target="_blank" rel="noreferrer">
                    Source: {source.title} ↗
                  </a>
                ))}
              </div>
            )}
            <p className="daily-footnote">Upload your recording in the form above to sync it with the animated scenes. Your recording is not sent to the server.</p>
          </section>
        )}

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
                  {mode === "playing" ? "Playing audio…" : video.storyStyle === "laundromat-note" ? "Preview with soundtrack ▶" : "Preview with voice ▶"}
                </button>
                <p className="daily-video-meta">
                  {sceneIndex + 1} / {video.scenes.length} scenes · {formatDuration(video.duration)} · {format === "long" ? "16:9 landscape" : "9:16 vertical"}
                </p>
              </div>
              <div className="daily-script-column">
                <h3>{video.storyStyle === "laundromat-note" ? "Voiceover script · record this in your own voice" : "Video narration"}</h3>
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
            <p className="daily-footnote">
              {video.storyStyle === "laundromat-note"
                ? "This cut uses an original, locally composed ambient score instead of synthetic narration. The story is fiction; record the script in your own voice and upload it above for a human-narrated version."
                : "The download happens only when you choose it. AI-generated facts and the finished video are yours to review before sharing."}
            </p>
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
