import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import english from "../data/english.json";
import audioManifest from "../data/listening-audio.json";

const AUDIO_DIR = resolve(process.cwd(), "public/audio/listening");

describe("listening audio manifest", () => {
  it("covers every question that has a listening script", () => {
    const listening = english.questions.filter((q) => q.listeningScript);
    expect(listening.length).toBeGreaterThanOrEqual(20);

    listening.forEach((question) => {
      const files = (audioManifest.entries as Record<string, string[]>)[
        question.id
      ];
      expect(files, `${question.id} 应有音频清单`).toBeDefined();
      expect(files.length).toBeGreaterThan(0);
    });
  });

  it("only references questions that actually exist", () => {
    const ids = new Set(english.questions.map((q) => q.id));
    Object.keys(audioManifest.entries).forEach((id) => {
      expect(ids.has(id), `${id} 不在题库中`).toBe(true);
    });
  });

  it("every referenced mp3 exists in public/audio/listening", () => {
    const onDisk = new Set(readdirSync(AUDIO_DIR));
    Object.values(
      audioManifest.entries as Record<string, string[]>
    ).forEach((files) => {
      files.forEach((file) => {
        expect(
          onDisk.has(file),
          `缺少音频文件 ${file}（可运行 node scripts/generate-listening-audio.mjs 重新生成）`
        ).toBe(true);
      });
    });
  });

  it("manifest declares the neural voice engine", () => {
    expect(audioManifest.engine).toContain("Neural");
    expect(audioManifest.voices).toEqual({ male: "Andrew", female: "Ava" });
  });

  it("audio directory is non-empty and files are mp3", () => {
    const files = readdirSync(AUDIO_DIR).filter((name) =>
      name.endsWith(".mp3")
    );
    expect(files.length).toBeGreaterThanOrEqual(40);
  });
});
