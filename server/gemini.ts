/**
 * All Gemini/Veo access lives here. Every helper degrades gracefully:
 * when no key is configured, or the models are busy, callers get a clear
 * `null`/throw and fall back to the offline path instead of breaking the run.
 */
import { GoogleGenAI } from "@google/genai";
import { MODELS, VALID_TTS_VOICES, hasGeminiKey } from "./config.ts";

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!hasGeminiKey()) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return cachedClient;
}

/** Strips markdown fences / prose around a JSON payload before parsing. */
export function parseJsonSafely(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

function isTransient(err: any): boolean {
  const msg = String(err?.message || err);
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("Resource has been exhausted")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Text/JSON generation with model fallback and backoff on transient errors. */
export async function callGeminiText(
  ai: GoogleGenAI,
  options: {
    contents: string | any[];
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    preferredModels?: string[];
  }
): Promise<{ text: string; model: string }> {
  const candidates = options.preferredModels || MODELS.text;
  let lastError: any = null;

  for (const model of candidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType || "application/json",
            temperature: options.temperature ?? 0.7,
          },
        });
        const text = response.text?.trim();
        if (text && text.length > 5) return { text, model };
      } catch (err: any) {
        lastError = err;
        if (isTransient(err) && attempt === 1) {
          await sleep(600 * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All candidate Gemini text models failed");
}

/**
 * Generates an image, optionally conditioned on reference images (character
 * sheets, previous keyframe) which is what keeps long-form output consistent.
 * Returns raw bytes + mime type, or null when unavailable.
 */
export async function generateImage(
  ai: GoogleGenAI,
  prompt: string,
  referenceImages: Array<{ data: string; mimeType: string }> = []
): Promise<{ buffer: Buffer; mimeType: string; model: string } | null> {
  const parts: any[] = referenceImages.map((ref) => ({
    inlineData: { data: ref.data, mimeType: ref.mimeType },
  }));
  parts.push({ text: prompt });

  let lastError: any = null;
  for (const model of MODELS.image) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: { responseModalities: ["IMAGE"] as any },
        });

        const candidateParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of candidateParts) {
          const inline = (part as any).inlineData;
          if (inline?.data) {
            return {
              buffer: Buffer.from(inline.data, "base64"),
              mimeType: inline.mimeType || "image/png",
              model,
            };
          }
        }
      } catch (err: any) {
        lastError = err;
        if (isTransient(err) && attempt === 1) {
          await sleep(800);
          continue;
        }
        break;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

/** Text-to-speech. Returns raw PCM bytes (24kHz mono) for WAV wrapping. */
export async function generateSpeech(
  ai: GoogleGenAI,
  text: string,
  voiceId: string
): Promise<{ pcm: Buffer; voiceId: string } | null> {
  const selectedVoice = VALID_TTS_VOICES.includes(voiceId) ? voiceId : "Puck";

  const response = await ai.models.generateContent({
    model: MODELS.tts,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO" as any],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
      },
    },
  });

  const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) return null;
  return { pcm: Buffer.from(audioBase64, "base64"), voiceId: selectedVoice };
}

/**
 * Image-to-video via Veo. Long-running operation: kicks off, polls until done,
 * then downloads the bytes. Returns null when the model yields nothing.
 */
export async function generateVideo(
  ai: GoogleGenAI,
  options: {
    prompt: string;
    startImage?: { data: string; mimeType: string };
    durationS: number;
    aspectRatio: string;
    onPoll?: (elapsedS: number) => void;
    signal?: { cancelled: boolean };
  }
): Promise<{ buffer: Buffer; model: string } | null> {
  let lastError: any = null;

  for (const model of MODELS.video) {
    try {
      let operation: any = await (ai.models as any).generateVideos({
        model,
        prompt: options.prompt,
        ...(options.startImage
          ? { image: { imageBytes: options.startImage.data, mimeType: options.startImage.mimeType } }
          : {}),
        config: {
          aspectRatio: options.aspectRatio === "9:16" ? "9:16" : "16:9",
          durationSeconds: Math.max(4, Math.min(8, Math.round(options.durationS))),
          numberOfVideos: 1,
        },
      });

      const startedAt = Date.now();
      // Veo renders take 1-3 minutes; poll until done or 10 minutes elapse.
      while (!operation?.done) {
        if (options.signal?.cancelled) throw new Error("Cancelled by user");
        if (Date.now() - startedAt > 10 * 60 * 1000) throw new Error("Veo operation timed out after 10 minutes");
        await sleep(10000);
        options.onPoll?.(Math.round((Date.now() - startedAt) / 1000));
        operation = await (ai.operations as any).getVideosOperation({ operation });
      }

      const generated = operation?.response?.generatedVideos?.[0];
      const videoRef = generated?.video;
      if (!videoRef) continue;

      // The SDK returns either inline bytes or a file handle to download.
      if (videoRef.videoBytes) {
        return { buffer: Buffer.from(videoRef.videoBytes, "base64"), model };
      }
      if (videoRef.uri) {
        const url = videoRef.uri.includes("key=")
          ? videoRef.uri
          : `${videoRef.uri}${videoRef.uri.includes("?") ? "&" : "?"}key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Video download failed: HTTP ${res.status}`);
        return { buffer: Buffer.from(await res.arrayBuffer()), model };
      }
    } catch (err: any) {
      lastError = err;
      if (String(err?.message || "").includes("Cancelled by user")) throw err;
      continue;
    }
  }

  if (lastError) throw lastError;
  return null;
}
