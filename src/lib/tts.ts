/**
 * 英语听力朗读引擎：基于浏览器原生 speechSynthesis（零依赖、离线可用）。
 *
 * - 自动挑选英语语音（优先 en-US / 本地服务）；
 * - 长文本按句切分排队，规避部分浏览器对超长 utterance 的截断；
 * - 语速设置独立持久化（sprintbook-tts-rate），默认 0.85（稍慢于常速，
 *   适合听力训练；可选 0.7 慢速 / 1.0 常速）。
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

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  if (english.length === 0) return null;

  return (
    english.find((voice) => voice.lang.toLowerCase() === "en-us" && voice.localService) ??
    english.find((voice) => voice.lang.toLowerCase() === "en-us") ??
    english.find((voice) => voice.localService) ??
    english[0]
  );
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?)])\s+/)
    .filter(Boolean);
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * 朗读一段英语文本，读完（或被取消）后 resolve。
 * 不支持 TTS 或没有英语语音时 resolve(false)。
 */
export function speakEnglish(text: string, rate: TTSRate = loadTTSRate()): Promise<boolean> {
  if (!isSpeechSupported()) return Promise.resolve(false);
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve(false);

  // voices 列表在部分浏览器上是异步加载的：先试一次，为空则等待 voiceschanged。
  const speakWhenReady = () =>
    new Promise<boolean>((resolve) => {
      const voice = pickEnglishVoice();
      const chunks = splitIntoSentences(trimmed);
      const synth = window.speechSynthesis;
      synth.cancel();

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? "en-US";
        utterance.rate = rate;
        if (index === chunks.length - 1) {
          utterance.onend = () => resolve(true);
          utterance.onerror = () => resolve(false);
        }
        synth.speak(utterance);
      });
    });

  if (window.speechSynthesis.getVoices().length > 0) {
    return speakWhenReady();
  }

  // voices 列表在部分浏览器上异步加载：先等它就绪（超时后由系统默认语音兜底）。
  return new Promise<void>((resolve) => {
    const onChange = () => resolve();
    window.speechSynthesis.addEventListener("voiceschanged", onChange, { once: true });
    window.setTimeout(resolve, 600);
  }).then(() => speakWhenReady());
}
