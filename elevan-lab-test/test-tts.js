// Simple ElevenLabs TTS test
// Usage: node test-tts.js "Some text to speak"

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY (set it in .env or your shell)");
  process.exit(1);
}

// Default voice: "Rachel" — a public ElevenLabs voice id.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

const text =
  process.argv.slice(2).join(" ") ||
  "Hello from Rezzy. This is an ElevenLabs test.";

const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "xi-api-key": API_KEY,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  },
  body: JSON.stringify({
    text,
    model_id: MODEL_ID,
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  }),
});

if (!res.ok) {
  console.error(`Request failed: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
const outPath = path.resolve("output.mp3");
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${buf.length} bytes -> ${outPath}`);
