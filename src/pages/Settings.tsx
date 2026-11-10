import { useState } from "react";
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
  saveTTSRate,
  speakEnglish,
  type TTSRate,
} from "../lib/tts";
import { APP_NAME_EN, APP_VERSION } from "../lib/app-info";

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
  const speechSupported = isSpeechSupported();

  function updateTTSRate(rate: TTSRate) {
    setTtsRate(rate);
    saveTTSRate(rate);
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
          听力题由浏览器内置语音合成朗读（SpeechSynthesis，离线可用，无需联网下载音频）。
          {speechSupported
            ? "当前浏览器支持朗读，可先试听再选择语速。"
            : "当前浏览器不支持语音朗读，听力题仍可作答，提交后可查看听力原文。"}
        </p>
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
                  ttsRate
                )
              }
            >
              ▶ 试听
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
