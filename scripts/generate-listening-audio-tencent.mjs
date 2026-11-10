// 腾讯云 TTS 听力音频生成（现役引擎，2026-11-10 用户 A/B 试听选定）。
// 音色：WeJames 501008（男）/ WeWinny 501009（女），腾讯大模型英文音色。
// 写入正式目录与正式清单（public/audio/listening + src/data/listening-audio.json），
// 跑本脚本即把听力切换为腾讯音色；Edge 版见 generate-listening-audio.mjs（跑它即切回）。
// 依赖：pip3 install --user --upgrade tencentcloud-sdk-python-tts；.env.local 配置密钥
// 用法：node scripts/generate-listening-audio-tencent.mjs [--force]
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const FORCE = process.argv.includes("--force");
const AUDIO_DIR = "public/audio/listening";
const MANIFEST_PATH = "src/data/listening-audio.json";

const VOICES = {
  male: 501008,   // WeJames
  female: 501009, // WeWinny
  narrator: 501009,
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

function synthOne(voiceType, text, outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [
      path.join("scripts", "tencent_tts_one.py"),
      String(voiceType),
      text,
      outFile,
    ]);
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`))
    );
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

  let generated = 0, skipped = 0, failed = 0;
  // 引擎防混：现役清单若声明别的引擎（如 Edge），同名文件必须重新生成，避免混血
  let force = FORCE;
  try {
    const existing = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    if (!existing.engine?.includes("Tencent")) {
      force = true;
      console.log("检测到现役清单为其他引擎，自动全量重新生成");
    }
  } catch {}
  const queue = [...jobs];
  // 免费试用期并发限制 3 次/秒，保守串行 + 间隔
  const workers = Array.from({ length: 2 }, async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      const outPath = path.join(AUDIO_DIR, job.file);
      if (!force && (await exists(outPath))) {
        skipped += 1;
        continue;
      }
      try {
        await synthOne(job.voice, job.text, outPath);
        generated += 1;
      } catch (error) {
        try {
          await new Promise((r) => setTimeout(r, 1500));
          await synthOne(job.voice, job.text, outPath);
          generated += 1;
        } catch (retryError) {
          failed += 1;
          console.error(`✗ ${job.file}: ${String(retryError).slice(0, 140)}`);
        }
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  });

  await Promise.all(workers);

  const manifest = {
    version: "listening-audio-tencent-v1",
    engine: "Tencent Cloud TTS 大模型音色（WeJames/WeWinny）",
    voices: { male: "WeJames", female: "WeWinny" },
    entries,
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✅ 生成 ${generated} 段，跳过 ${skipped} 段，失败 ${failed} 段`);
  console.log(`清单：${MANIFEST_PATH}（${Object.keys(entries).length} 题）`);
  if (failed > 0) process.exitCode = 1;
}

await main();
