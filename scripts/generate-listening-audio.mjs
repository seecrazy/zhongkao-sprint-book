// 英语听力真人级语音生成：调用 edge-tts（微软 Edge 神经网络语音）离线合成 MP3。
// 产物：public/audio/listening/{qid}-{nn}-{m|f}.mp3 + src/data/listening-audio.json 清单。
// 依赖：pip3 install --user edge-tts
// 用法：node scripts/generate-listening-audio.mjs [--force]
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const FORCE = process.argv.includes("--force");
const AUDIO_DIR = "public/audio/listening";
const MANIFEST_PATH = "src/data/listening-audio.json";

// 对话音色：微软播音级经典音色（新闻/小说风格，韵律从容，实测最接近真人听感）
// 注意：不要用 *Multilingual 系 Copilot 音色——英语韵律急促生硬，实测被用户否决
const VOICES = {
  male: "en-US-GuyNeural",
  female: "en-US-AriaNeural",
  narrator: "en-US-AriaNeural",
};

const SPEAKER_LABELS = {
  m: "male", man: "male", male: "male", boy: "male",
  w: "female", woman: "female", female: "female", girl: "female",
};

function parseTurns(script) {
  const text = script.replace(/\s+/g, " ").trim();
  const parts = text.split(
    /(?:(?<=^)|(?<=[\s。．.!！?？,，]))(Man|Woman|Male|Female|Boy|Girl|[MW])\s*[:：]\s*/i
  );
  if (parts.length === 1) return [{ speaker: "narrator", text }];

  const turns = [];
  for (let i = 1; i < parts.length; i += 2) {
    const speaker = SPEAKER_LABELS[parts[i].toLowerCase()];
    const body = (parts[i + 1] ?? "").trim();
    if (!speaker || !body) continue;
    const last = turns.at(-1);
    if (last && last.speaker === speaker) last.text += ` ${body}`;
    else turns.push({ speaker, text: body });
  }
  return turns.length > 0 ? turns : [{ speaker: "narrator", text }];
}

function runEdgeTTS(voice, text, outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [
      "-m", "edge_tts",
      "--voice", voice,
      "--text", text,
      "--write-media", outFile,
    ]);
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`))));
  });
}

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const english = JSON.parse(await readFile("src/data/english.json", "utf8"));
  const listening = english.questions.filter((q) => q.listeningScript);
  await mkdir(AUDIO_DIR, { recursive: true });

  const entries = {};
  const jobs = [];

  for (const question of listening) {
    const turns = parseTurns(question.listeningScript);
    const files = [];

    turns.forEach((turn, index) => {
      const number = String(index + 1).padStart(2, "0");
      const gender = turn.speaker === "male" ? "m" : turn.speaker === "female" ? "f" : "n";
      const file = `${question.id}-${number}-${gender}.mp3`;
      files.push(file);
      jobs.push({ file, voice: VOICES[turn.speaker] ?? VOICES.narrator, text: turn.text });
    });

    entries[question.id] = files;
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // 有界并发，避免边缘接口限流
  const queue = [...jobs];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      const outPath = path.join(AUDIO_DIR, job.file);
      if (!FORCE && (await exists(outPath))) {
        skipped += 1;
        continue;
      }
      try {
        await runEdgeTTS(job.voice, job.text, outPath);
        generated += 1;
      } catch (error) {
        // 失败重试一次
        try {
          await runEdgeTTS(job.voice, job.text, outPath);
          generated += 1;
        } catch (retryError) {
          failed += 1;
          console.error(`✗ ${job.file}: ${String(retryError).slice(0, 120)}`);
        }
      }
    }
  });

  await Promise.all(workers);

  const manifest = {
    version: "listening-audio-v1",
    engine: "Microsoft Edge Neural TTS (edge-tts)",
    voices: { male: "Guy", female: "Aria" },
    entries,
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✅ 生成 ${generated} 段，跳过 ${skipped} 段，失败 ${failed} 段`);
  console.log(`清单：${MANIFEST_PATH}（${Object.keys(entries).length} 题）`);
  if (failed > 0) process.exitCode = 1;
}

await main();
