/**
 * Background thread that runs the Kokoro neural text-to-speech model, so the
 * game stays responsive while speech is generated. The model (~90 MB) is
 * downloaded once from Hugging Face and then cached by the browser.
 */
// Resolved to the library's self-contained browser build (see vite.config.ts).
import { KokoroTTS } from "kokoro-js";

type Msg = { type: "load" } | { type: "speak"; id: number; text: string; voice: string; speed: number };

let tts: Promise<KokoroTTS> | null = null;
const files = new Map<string, { loaded: number; total: number }>();

function load(): Promise<KokoroTTS> {
  tts ??= KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q8",
    device: "wasm",
    progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (p.status === "progress" && p.file && p.total) {
        files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
        let loaded = 0, total = 0;
        for (const f of files.values()) { loaded += f.loaded; total += f.total; }
        postMessage({ type: "progress", progress: total ? loaded / total : 0 });
      }
    },
  });
  return tts;
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const msg = e.data;
  try {
    if (msg.type === "load") {
      await load();
      postMessage({ type: "ready" });
    } else if (msg.type === "speak") {
      const model = await load();
      const audio = await model.generate(msg.text, { voice: msg.voice as never, speed: msg.speed });
      // Copy into a fresh buffer: the model's output may live in WebAssembly memory, which can't be transferred.
      const samples = new Float32Array(audio.audio as Float32Array);
      postMessage({ type: "audio", id: msg.id, samples, rate: audio.sampling_rate }, { transfer: [samples.buffer] });
    }
  } catch (err) {
    tts = null;
    postMessage({ type: "error", id: "id" in msg ? msg.id : undefined, message: (err as Error).message || String(err) });
  }
};
