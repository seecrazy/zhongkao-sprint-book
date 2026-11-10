import { useEffect, useState } from "react";
import type { AppSettings, ProgressState, Subject, ThemeMode } from "../types";
import { resetProgress } from "../lib/storage";
import { clearExamHistory, saveActiveExam } from "../lib/exam-storage";
import {
  DEFAULT_EXAM_DATE,
  SPRINT_PHASE_LABELS,
  daysUntilDate,
  getSprintStatus,
} from "../lib/app-settings";
import {
  DEFAULT_TTS_RATE,
  TTS_RATES,
  TTS_RATE_LABELS,
  isSpeechSupported,
  loadTTSRate,
  loadTTSVoiceURI,
  rankEnglishVoices,
  saveTTSRate,
  saveTTSVoiceURI,
  speakEnglish,
  stopSpeaking,
  type TTSRate,
  type VoiceInfo,
  type VoiceQuality,
} from "../lib/tts";
import { APP_NAME_EN, APP_VERSION } from "../lib/app-info";

const VOICE_QUALITY_LABELS: Record<VoiceQuality, { label: string; className: string }> = {
  premium: { label: "高清", className: "premium" },
  good: { label: "良好", className: "good" },
  basic: { label: "基础", className: "basic" },
};

interface SettingsProps {
  subject: Subject;
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
}

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: "auto", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

export default function Settings({
  subject,
  progress,
  setProgress,
  appSettings,
  onUpdateAppSettings,
}: SettingsProps) {
  const sprint = getSprintStatus(appSettings);
  const [ttsRate, setTtsRate] = useState<TTSRate>(() => loadTTSRate());
  const [voiceURI, setVoiceURI] = useState<string>(() => loadTTSVoiceURI() ?? "auto");
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    if (!speechSupported || typeof window === "undefined") return;
    const refresh = () => setVoices(rankEnglishVoices(window.speechSynthesis.getVoices()));
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      stopSpeaking();
    };
  }, [speechSupported]);

  function updateTTSRate(rate: TTSRate) {
    setTtsRate(rate);
    saveTTSRate(rate);
  }

  function updateVoiceURI(next: string) {
    setVoiceURI(next);
    saveTTSVoiceURI(next === "auto" ? null : next);
  }

  function previewVoice() {
    void speakEnglish(
      "M: Excuse me, how can I get to the library? W: Go straight and turn left. It's next to the post office.",
      {
        rate: ttsRate,
        forceVoiceURI: voiceURI === "auto" ? null : voiceURI,
      }
    );
  }

  function clearProgress() {
    if (
      !window.confirm(
        "确定要清空当前学科的学习进度、错题本和模考记录吗？"
      )
    )
      return;

    clearExamHistory(subject);
    saveActiveExam(subject, null);
    setProgress(resetProgress());
  }

  return (
    <section className="page">
      <div className="section-head">
        <h1>设置</h1>
      </div>

      <div className="panel">
        <h2>中考倒计时</h2>
        <p>
          设置中考日期后，首页会显示倒计时，每日计划也会按阶段自动调整：
          距考试 90 天以上按一轮基础期安排（优先读讲解），31～90 天按二轮专项期，30 天内按三轮冲刺期（整卷 + 错题清零优先）。
        </p>
        <div className="exam-date-form">
          <label>
            <span>考试日期</span>
            <input
              type="date"
              value={appSettings.examDate ?? DEFAULT_EXAM_DATE}
              onChange={(event) =>
                onUpdateAppSettings({
                  ...appSettings,
                  examDate: event.target.value || null,
                })
              }
            />
          </label>
          <div className="exam-date-status">
            <strong>{SPRINT_PHASE_LABELS[sprint.phase].label}</strong>
            <span>
              {sprint.examDate
                ? `距 ${sprint.examDate} 还有 ${daysUntilDate(sprint.examDate)} 天`
                : `默认按 ${DEFAULT_EXAM_DATE} 估算，当前剩 ${sprint.daysLeft} 天；设置后按你的实际考试日计算。`}
            </span>
          </div>
          {appSettings.examDate && (
            <button
              className="ghost"
              type="button"
              onClick={() =>
                onUpdateAppSettings({ ...appSettings, examDate: null })
              }
            >
              恢复默认日期
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>外观</h2>
        <p>深色模式适合晚间刷题，可跟随系统自动切换。设置对所有学科生效并保存在本地。</p>
        <div className="theme-options">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={appSettings.theme === option.value ? "active" : ""}
              onClick={() =>
                onUpdateAppSettings({ ...appSettings, theme: option.value })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>英语听力朗读</h2>
        <p>
          听力题已内置<strong>真人级神经网络语音</strong>（腾讯云大模型英文音色 WeJames/WeWinny 预生成，男女声对话，联网加载一次后离线可用）。下面的语速设置对真人语音同样生效；音色选择只在音频加载失败回退浏览器朗读时使用。系统里安装的浏览器语音质量差别很大：标着<strong>高清</strong>的接近真人，<strong>基础</strong>偏机械。
          {speechSupported
            ? "下面可以按质量挑一个顺耳的音色，先试听再保存。"
            : "当前浏览器不支持语音朗读，听力题仍可作答，提交后可查看听力原文。"}
        </p>

        {speechSupported && (
          <>
            <div className="tts-voice-form">
              <label>
                <span>朗读音色</span>
                <select value={voiceURI} onChange={(event) => updateVoiceURI(event.target.value)}>
                  <option value="auto">自动（按质量挑最佳）</option>
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}（{voice.lang}）· {VOICE_QUALITY_LABELS[voice.quality].label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="ghost" type="button" onClick={previewVoice}>
                ▶ 试听对话
              </button>
              <button className="ghost" type="button" onClick={stopSpeaking}>
                ■ 停止
              </button>
            </div>
            <p className="panel-hint">
              找不到高清音色？可以在系统里安装：macOS 打开 系统设置 → 辅助功能 → 朗读内容 →
              系统声音 →「管理语音」安装 Enhanced/Premium 声音（如 Ava、Samantha）；Windows 在
              设置 → 时间和语言 → 语音 中添加自然语音。安装后回到本页刷新即可选择。
            </p>
          </>
        )}

        <div className="theme-options">
          {TTS_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              className={ttsRate === rate ? "active" : ""}
              onClick={() => updateTTSRate(rate)}
            >
              {TTS_RATE_LABELS[rate]}
              {rate === DEFAULT_TTS_RATE ? "（推荐）" : ""}
            </button>
          ))}
          {speechSupported && (
            <button
              type="button"
              onClick={() =>
                void speakEnglish(
                  "This is a listening test. You will hear each dialogue twice.",
                  { rate: ttsRate, forceVoiceURI: voiceURI === "auto" ? null : voiceURI }
                )
              }
            >
              ▶ 试听语速
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>本地学习记录</h2>
        <p>
          当前进度保存在浏览器 localStorage 中，不会上传到服务器。已完成{" "}
          {progress.completedQuestionIds.length} 题，错题{" "}
          {Object.keys(progress.mistakes).length} 题，作答记录{" "}
          {progress.attempts.length} 条，讲解已读{" "}
          {progress.readLessonIds.length} 篇。
        </p>
        <button className="danger" type="button" onClick={clearProgress}>
          清空当前学科进度和错题本
        </button>
      </div>

      <div className="panel">
        <h2>当前版本</h2>
        <p>
          {APP_NAME_EN} v{APP_VERSION}
          · 五学科（数学 / 物理 / 化学 / 英语 / 语文）：冲刺倒计时与阶段计划、错因治理、分题型掌握度、分题型模考报告、深色模式与打印错题。
        </p>
      </div>
    </section>
  );
}
