/**
 * Media persistence. Generated audio/images/video are written to disk under
 * .data/media and referenced by URL, so the project store stays small
 * (base64 data URLs in JSON made the store unusable past a few scenes).
 */
import fs from "fs";
import path from "path";
import { MEDIA_DIR } from "./config.ts";

export function ensureMediaDir(projectId: string): string {
  const dir = path.join(MEDIA_DIR, sanitize(projectId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitize(name: string): string {
  return String(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/** Writes a buffer and returns the public URL to serve it from. */
export function saveMedia(projectId: string, fileName: string, data: Buffer): string {
  const dir = ensureMediaDir(projectId);
  const safeName = sanitize(fileName);
  fs.writeFileSync(path.join(dir, safeName), data);
  return `/media/${sanitize(projectId)}/${safeName}`;
}

export function saveBase64Media(projectId: string, fileName: string, base64: string): string {
  return saveMedia(projectId, fileName, Buffer.from(base64, "base64"));
}

export function deleteProjectMedia(projectId: string): void {
  const dir = path.join(MEDIA_DIR, sanitize(projectId));
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[media] Could not remove media for ${projectId}:`, err);
  }
}

/**
 * Builds a valid mono 16-bit PCM WAV from raw PCM samples returned by the
 * TTS model (which ships headerless PCM at 24kHz).
 */
export function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Offline stand-in for the TTS model: a playable WAV whose length matches the
 * narration's real reading time, so downstream shot timing stays correct even
 * without an API key.
 */
export function synthesizePlaceholderWav(text: string, voiceId: string): { buffer: Buffer; durationS: number } {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = (text.match(/[.!?،؛]/g) || []).length || 1;
  const durationS = parseFloat(((wordCount / 140) * 60 + sentenceCount * 0.4).toFixed(2));

  const sampleRate = 22050;
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationS));
  const pcm = Buffer.alloc(totalSamples * 2);
  const baseFreq = voiceId.toLowerCase().includes("kore") || voiceId.toLowerCase().includes("zephyr") ? 220 : 130;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(t * 7) * 0.5 + 0.5;
    const tone = (Math.sin(2 * Math.PI * baseFreq * t) + 0.5 * Math.sin(4 * Math.PI * baseFreq * t)) * 0.15;
    const sample = Math.floor(tone * envelope * 32767);
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
  }

  return { buffer: pcmToWav(pcm, sampleRate), durationS };
}

/**
 * Offline stand-in for an image model: a deterministic SVG storyboard card
 * carrying the prompt, so the pipeline produces reviewable frames with no key.
 */
export function placeholderImage(label: string, prompt: string, palette: string[], aspect: string): Buffer {
  const [w, h] = aspectToSize(aspect);
  const colors = palette.length >= 2 ? palette : ["#0f172a", "#38bdf8", "#f59e0b"];
  const wrapped = wrapText(prompt, 62).slice(0, 14);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="60%" stop-color="${colors[1] || colors[0]}"/>
      <stop offset="100%" stop-color="${colors[2] || colors[0]}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
  <text x="48" y="86" font-family="monospace" font-size="34" fill="#ffffff" fill-opacity="0.95">${escapeXml(label)}</text>
  <text x="48" y="120" font-family="monospace" font-size="18" fill="#ffffff" fill-opacity="0.6">STORYBOARD PREVIEW — no image model configured</text>
  ${wrapped
    .map(
      (line, i) =>
        `<text x="48" y="${180 + i * 30}" font-family="sans-serif" font-size="20" fill="#ffffff" fill-opacity="0.82">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
</svg>`;
  return Buffer.from(svg, "utf-8");
}

export function aspectToSize(aspect: string): [number, number] {
  switch (aspect) {
    case "9:16":
      return [1080, 1920];
    case "1:1":
      return [1080, 1080];
    case "21:9":
      return [1920, 823];
    default:
      return [1920, 1080];
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
