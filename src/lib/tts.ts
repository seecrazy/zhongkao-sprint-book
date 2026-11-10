/**
 * 英语听力朗读引擎（浏览器原生 SpeechSynthesis，零依赖、离线可用）。
 *
 * v1.2 音质升级：
 * - 语音质量评分选声：Premium / Enhanced / Natural / Neural / Siri、Google、
 *   Microsoft 现代语音优先，Compact / Desktop 等机械感语音被淘汰，
 *   避免默认挑中 macOS 紧凑版系统语音（"机器人味"的主要来源）；
 * - 对话脚本解析：M:/W:/Man:/Woman: 等说话人标签不再被朗读，
 *   男女对话自动分配不同音色（缺失时用音调区分）并加自然停顿；
 * - 支持连播两遍（考试模式）；
 * - 设置页可选择具体音色并试听（持久化），语速三档独立持久化。
 */

export const TTS_RATES = [0.7, 0.85, 1] as const;
export type TTSRate = (typeof TTS_RATES)[number];

export const DEFAULT_TTS_RATE: TTSRate = 0.85;
export const TTS_RATE_LABELS: Record<TTSRate, string> = {
  0.7: "慢速",
  0.85: "标准",
  1: "常速",
};

const TTS_RATE_KEY = "sprintbook-tts-rate";
const TTS_VOICE_KEY = "sprintbook-tts-voice";

export type VoiceQuality = "premium" | "good" | "basic";
export type VoiceGender = "female" | "male" | "unknown";

export interface VoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  quality: VoiceQuality;
  gender: VoiceGender;
}

// ─── 语音质量评分 ───────────────────────────────────────────────

const PREMIUM_PATTERNS = [
  /premium/i, /enhanced/i, /natural/i, /neural/i, /\bsiri\b/i,
];
// 网络级现代语音（Chrome Google / Edge Microsoft），自然度高于本地紧凑声
const STRONG_PATTERNS = [
  /google\s+(us\s+)?english/i,
  /microsoft\s+(aria|jenny|guy|emma|brian|zira|zoe|ana|michelle)/i,
];
// macOS 具名语音：紧凑版只有基本可听度，装了 Enhanced 版名字相同、评分由 Premium 档接手
const NAMED_PATTERNS = [
  /samantha|ava|allison|susan|karen|serena|tessa|moira|fiona|vicki|victoria/i,
  /alex|daniel|fred\b|tom\b|aaron|oliver|nicky/i,
];
// 机械感明显的语音：紧凑版 / 旧 SAPI5 Desktop 合成器
// （"Microsoft Zira - English (…)" 横杠命名是旧桌面格式；现代语音叫 "… Online (Natural)"）
const BAD_PATTERNS = [
  /compact/i, /eloquence/i, /espeak/i, /pico/i, /festival/i,
  /desktop/i, /novelty|bells|bubbles|zarvox|trinoids|albert/i,
  /microsoft\s+\w+\s+-\s+english/i,
];

const FEMALE_NAMES =
  /samantha|ava|allison|susan|zoe|karen|serena|tessa|moira|fiona|vicki|victoria|zira|jenny|aria|emma|michelle|ana|siri|joanna|salli|kimberly|ivy|kendra|female/i;
const MALE_NAMES =
  /alex|daniel|fred\b|tom\b|aaron|oliver|nicky|guy|brian|david|mark\b|matthew|justin|joey|russell|male/i;

export function scoreVoice(voice: { name: string; lang: string }): number {
  const name = voice.name ?? "";
  const lang = (voice.lang ?? "").toLowerCase();
  let score = 0;

  if (PREMIUM_PATTERNS.some((pattern) => pattern.test(name))) score += 60;
  else if (STRONG_PATTERNS.some((pattern) => pattern.test(name))) score += 30;
  else if (NAMED_PATTERNS.some((pattern) => pattern.test(name))) score += 18;
  if (BAD_PATTERNS.some((pattern) => pattern.test(name))) score -= 50;

  if (lang === "en-us") score += 8;
  else if (lang === "en-gb") score += 4;
  else if (lang.startsWith("en")) score += 2;

  return score;
}

export function getVoiceQuality(score: number): VoiceQuality {
  if (score >= 55) return "premium";
  if (score >= 20) return "good";
  return "basic";
}

export function guessVoiceGender(name: string): VoiceGender {
  if (FEMALE_NAMES.test(name)) return "female";
  if (MALE_NAMES.test(name)) return "male";
  return "unknown";
}

export function toVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
  const score = scoreVoice(voice);
  return {
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    quality: getVoiceQuality(score),
    gender: guessVoiceGender(voice.name),
  };
}

export function rankEnglishVoices(voices: SpeechSynthesisVoice[]): VoiceInfo[] {
  return voices
    .filter((voice) => voice.lang?.toLowerCase().startsWith("en"))
    .map(toVoiceInfo)
    .sort((left, right) => scoreVoice(right) - scoreVoice(left));
}

// ─── 对话脚本解析 ───────────────────────────────────────────────

export type Speaker = "male" | "female" | "narrator";

export interface DialogueTurn {
  speaker: Speaker;
  text: string;
}

const SPEAKER_LABELS: Record<string, Speaker> = {
  m: "male", man: "male", male: "male", boy: "male", 男: "male",
  w: "female", woman: "female", female: "female", girl: "female", 女: "female",
};

/**
 * 把听力脚本解析成说话人回合："M: ... W: ..." 的标签被剥离（不再朗读），
 * 没有标签的文本视为旁白/独白整段朗读。
 */
export function parseDialogue(script: string): DialogueTurn[] {
  const text = (script ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const parts = text.split(
    /(?:(?<=^)|(?<=[\s。．.!！?？,，]))(Man|Woman|Male|Female|Boy|Girl|男|女|[MW])\s*[:：]\s*/i
  );

  if (parts.length === 1) {
    return [{ speaker: "narrator", text }];
  }

  const turns: DialogueTurn[] = [];
  for (let index = 1; index < parts.length; index += 2) {
    const label = parts[index].toLowerCase();
    const body = (parts[index + 1] ?? "").trim();
    const speaker = SPEAKER_LABELS[label];
    if (!speaker || !body) continue;

    const previous = turns.at(-1);
    if (previous && previous.speaker === speaker) {
      previous.text = `${previous.text} ${body}`;
    } else {
      turns.push({ speaker, text: body });
    }
  }

  return turns.length > 0 ? turns : [{ speaker: "narrator", text }];
}

// ─── 播放计划 ───────────────────────────────────────────────────

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

interface SpeakItem {
  text: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  pauseAfterMs: number;
}

function findVoice(
  voices: SpeechSynthesisVoice[],
  predicate: (voice: SpeechSynthesisVoice) => boolean
): SpeechSynthesisVoice | null {
  const sorted = [...voices].sort(
    (left, right) => scoreVoice(right) - scoreVoice(left)
  );
  return sorted.find(predicate) ?? null;
}

export interface DialogueVoicePlan {
  male: SpeechSynthesisVoice | null;
  female: SpeechSynthesisVoice | null;
}

/** 为男女说话人挑不同的音色（按评分），找不到对应性别时回退最佳音色。 */
export function pickDialogueVoices(
  voices: SpeechSynthesisVoice[]
): DialogueVoicePlan {
  const english = voices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith("en")
  );
  const pool = english.length > 0 ? english : voices;

  const male = findVoice(pool, (voice) => guessVoiceGender(voice.name) === "male");
  const female = findVoice(pool, (voice) => guessVoiceGender(voice.name) === "female");
  const best = findVoice(pool, () => true);

  return {
    male: male ?? best,
    female: female ?? (best !== male ? best : findVoice(pool, (v) => v !== male)) ?? best,
  };
}

const PITCH_BY_SPEAKER: Record<Speaker, number> = {
  male: 0.95,
  female: 1.08,
  narrator: 1,
};

export interface SpeakOptions {
  rate?: TTSRate;
  /** 指定音色（设置页选择），null = 自动挑选最佳。 */
  forceVoiceURI?: string | null;
  /** 播放遍数：中考听力每段材料读两遍。 */
  times?: 1 | 2;
}

// ─── 引擎 ───────────────────────────────────────────────────────

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export function loadTTSRate(): TTSRate {
  if (typeof window === "undefined") return DEFAULT_TTS_RATE;
  const raw = window.localStorage.getItem(TTS_RATE_KEY);
  const value = Number(raw);
  return (TTS_RATES as readonly number[]).includes(value)
    ? (value as TTSRate)
    : DEFAULT_TTS_RATE;
}

export function saveTTSRate(rate: TTSRate): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TTS_RATE_KEY, String(rate));
}

export function loadTTSVoiceURI(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TTS_VOICE_KEY);
}

export function saveTTSVoiceURI(voiceURI: string | null): void {
  if (typeof window === "undefined") return;
  if (voiceURI) {
    window.localStorage.setItem(TTS_VOICE_KEY, voiceURI);
  } else {
    window.localStorage.removeItem(TTS_VOICE_KEY);
  }
}

/** 等待语音列表就绪（Chrome 上异步加载），超时后返回当前列表。 */
async function getVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) return synth.getVoices();

  return new Promise((resolve) => {
    const onChange = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", onChange, { once: true });
    window.setTimeout(() => resolve(synth.getVoices()), 600);
  });
}

let activeSession = 0;

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  activeSession += 1;
  window.speechSynthesis.cancel();
}

function speakOnce(item: SpeakItem, session: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (session !== activeSession) {
      resolve(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(item.text);
    if (item.voice) {
      utterance.voice = item.voice;
      utterance.lang = item.voice.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = item.rate;
    utterance.pitch = item.pitch;

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

function waitUnlessCancelled(ms: number, session: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(), session === activeSession ? ms : 0);
  });
}

/**
 * 朗读一段听力脚本：
 * - 自动解析说话人标签，男女分声（不同音色或音调），标签本身不朗读；
 * - 句间 160ms、说话人切换 480ms、两遍之间 900ms 自然停顿；
 * - 读完（或被 stopSpeaking 取消）后 resolve；不支持或没有可用语音 resolve(false)。
 */
export async function speakEnglish(
  text: string,
  options: SpeakOptions = {}
): Promise<boolean> {
  if (!isSpeechSupported()) return false;
  const trimmed = (text ?? "").trim();
  if (!trimmed) return false;

  const session = ++activeSession;
  const voices = await getVoicesReady();
  const forced =
    options.forceVoiceURI !== undefined && options.forceVoiceURI !== null
      ? voices.find((voice) => voice.voiceURI === options.forceVoiceURI) ?? null
      : null;

  const turns = parseDialogue(trimmed);
  const dialoguePlan =
    turns.some((turn) => turn.speaker !== "narrator") && !forced
      ? pickDialogueVoices(voices)
      : null;

  const rate = options.rate ?? loadTTSRate();
  const times = options.times ?? 1;

  const items: SpeakItem[] = [];
  for (let round = 0; round < times; round += 1) {
    if (round > 0 && times > 1) {
      items.push({ text: "", voice: null, rate, pitch: 1, pauseAfterMs: 900 });
    }
    turns.forEach((turn, turnIndex) => {
      const voice = forced
        ? forced
        : dialoguePlan
          ? turn.speaker === "male"
            ? dialoguePlan.male
            : turn.speaker === "female"
              ? dialoguePlan.female
              : findVoice(voices, () => true)
          : findVoice(voices, () => true);

      splitIntoSentences(turn.text).forEach((sentence, sentenceIndex, list) => {
        items.push({
          text: sentence,
          voice,
          rate,
          pitch: forced ? 1 : PITCH_BY_SPEAKER[turn.speaker],
          pauseAfterMs:
            sentenceIndex === list.length - 1
              ? turnIndex === turns.length - 1
                ? 0
                : 480
              : 160,
        });
      });
    });
  }

  for (const item of items) {
    if (session !== activeSession) return false;
    if (item.text) {
      const ok = await speakOnce(item, session);
      if (!ok && session !== activeSession) return false;
    }
    if (item.pauseAfterMs > 0) {
      await waitUnlessCancelled(item.pauseAfterMs, session);
    }
  }

  return session === activeSession;
}
