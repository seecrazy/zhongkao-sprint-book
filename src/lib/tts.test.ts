import { describe, expect, it } from "vitest";
import {
  DEFAULT_TTS_RATE,
  TTS_RATES,
  guessVoiceGender,
  isSpeechSupported,
  loadTTSRate,
  parseDialogue,
  pickDialogueVoices,
  rankEnglishVoices,
  scoreVoice,
  type DialogueTurn,
} from "./tts";

function fakeVoice(name: string, lang = "en-US", voiceURI = name) {
  return { name, lang, voiceURI, localService: true, default: false };
}

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

describe("voice quality scoring", () => {
  it("ranks premium/enhanced voices above compact robotic ones", () => {
    const premium = scoreVoice({ name: "Ava (Premium)", lang: "en-US" });
    const google = scoreVoice({ name: "Google US English", lang: "en-US" });
    const macCompact = scoreVoice({ name: "Samantha", lang: "en-US" });
    const desktop = scoreVoice({ name: "Microsoft Zira - English (United States)", lang: "en-US" });
    const compact = scoreVoice({ name: "Compact Voice", lang: "en-US" });

    expect(premium).toBeGreaterThan(google);
    expect(google).toBeGreaterThan(macCompact);
    expect(macCompact).toBeGreaterThan(desktop);
    expect(desktop).toBeGreaterThan(compact);
  });

  it("prefers en-US over other English locales", () => {
    expect(scoreVoice({ name: "Ava", lang: "en-US" })).toBeGreaterThan(
      scoreVoice({ name: "Ava", lang: "en-GB" })
    );
  });

  it("ranks english voices by score and labels quality", () => {
    const ranked = rankEnglishVoices([
      fakeVoice("Microsoft David Desktop"),
      fakeVoice("Google US English"),
      fakeVoice("Ava (Enhanced)"),
      fakeVoice("Daniel", "en-GB"),
    ]);

    expect(ranked.map((voice) => voice.name)).toEqual([
      "Ava (Enhanced)",
      "Google US English",
      "Daniel",
      "Microsoft David Desktop",
    ]);
    expect(ranked[0].quality).toBe("premium");
    expect(ranked[2].quality).toBe("good");
    expect(ranked[3].quality).toBe("basic");
  });

  it("guesses voice gender from known names", () => {
    expect(guessVoiceGender("Samantha")).toBe("female");
    expect(guessVoiceGender("Google UK English Female")).toBe("female");
    expect(guessVoiceGender("Daniel")).toBe("male");
    expect(guessVoiceGender("Microsoft Guy")).toBe("male");
    expect(guessVoiceGender("Unknown Voice")).toBe("unknown");
  });
});

describe("dialogue parsing", () => {
  it("strips M:/W: labels and maps them to speakers", () => {
    const turns = parseDialogue(
      "M: What's the weather like today? W: It's sunny now, but it will rain this afternoon."
    ) as DialogueTurn[];

    expect(turns).toEqual([
      { speaker: "male", text: "What's the weather like today?" },
      {
        speaker: "female",
        text: "It's sunny now, but it will rain this afternoon.",
      },
    ]);
    // 标签本身不进入朗读文本
    expect(turns[0].text).not.toContain("M:");
  });

  it("merges consecutive turns of the same speaker", () => {
    const turns = parseDialogue("W: Hello! W: How are you? M: Fine, thanks.");
    expect(turns).toEqual([
      { speaker: "female", text: "Hello! How are you?" },
      { speaker: "male", text: "Fine, thanks." },
    ]);
  });

  it("supports Man/Woman and Chinese labels", () => {
    expect(parseDialogue("Man: Hi. Woman: Hello.")[0].speaker).toBe("male");
    expect(parseDialogue("男：你好。女：你好。")[1].speaker).toBe("female");
  });

  it("treats unlabeled scripts as narrator monologue", () => {
    const turns = parseDialogue("Please turn off the lights when you leave.");
    expect(turns).toEqual([
      { speaker: "narrator", text: "Please turn off the lights when you leave." },
    ]);
  });

  it("does not misread ordinary words followed by colons", () => {
    // "time:" 不在说话人标签表里，应整体作为旁白
    const turns = parseDialogue("The meeting time: 9 a.m. Don't be late.");
    expect(turns).toHaveLength(1);
    expect(turns[0].speaker).toBe("narrator");
    expect(turns[0].text).toContain("time:");
  });
});

describe("dialogue voice assignment", () => {
  it("picks distinct male and female voices when available", () => {
    const plan = pickDialogueVoices([
      fakeVoice("Google US English"), // female-ish? unknown → 由 findVoice 兜底
      fakeVoice("Samantha"),
      fakeVoice("Daniel"),
    ]);

    expect(plan.female?.name).toBe("Samantha");
    expect(plan.male?.name).toBe("Daniel");
    expect(plan.male).not.toBe(plan.female);
  });

  it("falls back to best voice when only one gender exists", () => {
    const plan = pickDialogueVoices([fakeVoice("Samantha"), fakeVoice("Ava")]);
    // 没有男声：男声回退最佳音色（但尽量与女声不同）
    expect(plan.female?.name).toBe("Samantha");
    expect(plan.male).not.toBeNull();
  });
});
