/**
 * 听力真人级音频播放器：优先播放随应用分发的神经网络语音 MP3
 * （Microsoft Edge Neural TTS 预生成，见 scripts/generate-listening-audio.mjs），
 * 无音频或播放失败时回退浏览器 TTS（tts.ts）。
 *
 * - 每题音频按说话人回合切分（-m 男声 / -f 女声 / -n 旁白），顺序播放，
 *   回合间 480ms、两遍之间 900ms 停顿；
 * - 语速档（0.7 / 0.85 / 1）通过 HTMLMediaElement.playbackRate 实现；
 * - 会话制取消：stopListeningAudio() 立即停止；
 * - 音频经 Service Worker cache-first 缓存，首次联网加载后离线可用。
 */
import audioManifest from "../data/listening-audio.json";
import { loadTTSRate, loadTTSVoiceURI, speakEnglish, type TTSRate } from "./tts";

interface ListeningAudioManifest {
  version: string;
  entries: Record<string, string[]>;
}

const entries = (audioManifest as ListeningAudioManifest).entries ?? {};

export function hasListeningAudio(questionId: string): boolean {
  return (entries[questionId]?.length ?? 0) > 0;
}

function audioUrl(file: string): string {
  return `${import.meta.env.BASE_URL}audio/listening/${file}`;
}

let activeSession = 0;
let activeElement: HTMLAudioElement | null = null;

export function stopListeningAudio(): void {
  activeSession += 1;
  if (activeElement) {
    activeElement.pause();
    activeElement.src = "";
    activeElement = null;
  }
}

function playFile(url: string, rate: number, session: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (session !== activeSession) {
      resolve(false);
      return;
    }
    const audio = new Audio(url);
    audio.playbackRate = rate;
    activeElement = audio;

    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

function waitUnlessCancelled(ms: number, session: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(), session === activeSession ? ms : 0);
  });
}

export interface ListeningPlayOptions {
  rate?: TTSRate;
  /** 播放遍数：中考每段材料读两遍。 */
  times?: 1 | 2;
}

/**
 * 播放一题的听力音频；题目没有音频文件时返回 false（调用方回退 TTS）。
 */
export async function playListeningAudio(
  questionId: string,
  options: ListeningPlayOptions = {}
): Promise<boolean> {
  const files = entries[questionId];
  if (!files || files.length === 0) return false;

  const session = ++activeSession;
  const rate = options.rate ?? loadTTSRate();
  const times = options.times ?? 1;

  // 预加载全部文件（失败不阻断，播放阶段自然回退 TTS）
  await Promise.all(
    files.map(
      (file) =>
        new Promise<void>((resolve) => {
          const probe = new Audio(audioUrl(file));
          probe.preload = "auto";
          probe.oncanplaythrough = () => resolve();
          probe.onerror = () => resolve();
          window.setTimeout(resolve, 2000);
        })
    )
  );

  for (let round = 0; round < times; round += 1) {
    if (session !== activeSession) return false;
    if (round > 0) await waitUnlessCancelled(900, session);

    for (let index = 0; index < files.length; index += 1) {
      if (session !== activeSession) return false;
      const ok = await playFile(audioUrl(files[index]), rate, session);
      if (!ok) return false;
      if (index < files.length - 1) {
        await waitUnlessCancelled(480, session);
      }
    }
  }

  return session === activeSession;
}

/**
 * 统一入口：有预生成音频放音频，否则回退浏览器 TTS。
 * 返回实际使用的通道，便于界面提示。
 */
export async function playListeningWithFallback(
  questionId: string,
  script: string,
  options: ListeningPlayOptions = {}
): Promise<"audio" | "tts" | "failed"> {
  const audioPlayed = await playListeningAudio(questionId, options);
  if (audioPlayed) return "audio";
  if (!script.trim()) return "failed";
  const spoken = await speakEnglish(script, {
    rate: options.rate,
    forceVoiceURI: loadTTSVoiceURI(),
    times: options.times,
  });
  return spoken ? "tts" : "failed";
}
