import { describe, expect, it } from "vitest";
import {
  DEFAULT_TTS_RATE,
  TTS_RATES,
  isSpeechSupported,
  loadTTSRate,
} from "./tts";

describe("tts settings", () => {
  it("falls back to the default rate when nothing is stored", () => {
    expect(loadTTSRate()).toBe(DEFAULT_TTS_RATE);
    expect(TTS_RATES).toContain(DEFAULT_TTS_RATE);
  });

  it("reports speech availability without throwing in node", () => {
    // jsdom/node 环境下没有 speechSynthesis，应安全返回 false 而不是抛错。
    expect(typeof isSpeechSupported()).toBe("boolean");
  });
});
