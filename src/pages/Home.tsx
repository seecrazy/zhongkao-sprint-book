import { useMemo } from "react";
import { getSubjectContent } from "../data/sample-content";
import {
  calculateLearningStreak,
  calculateOverallMastery,
  calculateTopicStats,
  getLocalDateString,
  getTodayAttemptCount,
  getTotalPracticeSeconds,
} from "../lib/mastery";
import { buildDailyTasks } from "../lib/planner";
import { buildWeeklyReport, formatTrend } from "../lib/report";
import {
  SPRINT_PHASE_LABELS,
  getSprintStatus,
} from "../lib/app-settings";
import { APP_NAME_EN, APP_VERSION } from "../lib/app-info";
import { getDueMistakes, toggleDailyTask } from "../lib/storage";
import type {
  AppSettings,
  DailyTask,
  ProgressState,
  Subject,
} from "../types";

interface HomeProps {
  subject: Subject;
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  appSettings: AppSettings;
  onNavigate: (
    page: "topics" | "practice" | "exam" | "mistakes" | "settings",
    query?: Record<string, string>
  ) => void;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;
}

const taskTypeLabel: Record<DailyTask["type"], string> = {
  review: "错题",
  topic: "专项",
  exam: "模考",
  summary: "复盘",
};

export default function Home({
  subject,
  progress,
  setProgress,
  appSettings,
  onNavigate,
}: HomeProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = getLocalDateString(today);
  const content = getSubjectContent(subject);
  const sprint = getSprintStatus(appSettings, today);
  const phaseInfo = SPRINT_PHASE_LABELS[sprint.phase];

  const overallMastery = calculateOverallMastery(
    content.knowledgePoints,
    content.questions,
    progress.attempts
  );
  const dueMistakes = getDueMistakes(progress, today);
  const todayAttempts = getTodayAttemptCount(progress.attempts, today);
  const streak = calculateLearningStreak(progress.attempts);
  const totalSeconds = getTotalPracticeSeconds(progress.attempts);
  const weekly = buildWeeklyReport(progress.attempts, today);
  const topicRanking = [...content.knowledgePoints]
    .map((topic) => ({
      topic,
      stats: calculateTopicStats(
        topic.id,
        content.questions,
        progress.attempts
      ),
    }))
    .sort((left, right) => left.stats.mastery - right.stats.mastery);

  const dailyTasks = useMemo(
    () =>
      buildDailyTasks({
        date: today,
        subjectLabel: content.label,
        topics: content.knowledgePoints,
        questions: content.questions,
        progress,
        sprintPhase: sprint.phase,
        daysLeft: sprint.daysLeft,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, today, subject, sprint.phase, sprint.daysLeft]
  );
  const completedTaskIds =
    progress.dailyPlans[todayKey]?.completedTaskIds ?? [];
  const completedTaskCount = dailyTasks.filter((task) =>
    completedTaskIds.includes(task.id)
  ).length;
  const dailyPercent =
    dailyTasks.length === 0
      ? 0
      : Math.round((completedTaskCount / dailyTasks.length) * 100);

  function completeTask(taskId: string) {
    setProgress(toggleDailyTask(progress, todayKey, taskId));
  }

  return (
    <section className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">
            {APP_NAME_EN} v{APP_VERSION} · {content.label}{" "}
            {content.contentVersion}
          </span>
          <h1>考点看得清，错题改得掉。</h1>
          <p>{phaseInfo.hint}</p>
          <div className="hero-actions">
            <button
              className="primary"
              type="button"
              onClick={() => onNavigate("exam")}
            >
              开始限时模考
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => onNavigate("mistakes")}
              disabled={dueMistakes.length === 0}
            >
              复习 {dueMistakes.length} 道到期错题
            </button>
          </div>
        </div>
        <div className="hero-cards">
          <div className="hero-card countdown-card">
            <strong>距中考</strong>
            <div className="big-number">
              {sprint.daysLeft ?? "—"}
              <small>天</small>
            </div>
            <span>{phaseInfo.label}</span>
            <button
              className="countdown-edit"
              type="button"
              onClick={() => onNavigate("settings")}
            >
              {sprint.examDate
                ? `考试日 ${sprint.examDate} · 修改`
                : "设置考试日期"}
            </button>
          </div>
          <div className="hero-card">
            <strong>综合掌握度</strong>
            <div className="big-number">{overallMastery}%</div>
            <span>
              覆盖 {content.knowledgePoints.length} 个{content.label}考点 ·{" "}
              {content.questions.length} 道题
            </span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>今日做题</span>
          <strong>{todayAttempts}</strong>
        </article>
        <article className="stat-card">
          <span>连续学习</span>
          <strong>{streak} 天</strong>
        </article>
        <article className="stat-card">
          <span>到期错题</span>
          <strong>{dueMistakes.length}</strong>
        </article>
        <article className="stat-card">
          <span>累计用时</span>
          <strong>{formatDuration(totalSeconds)}</strong>
        </article>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h2>本周学习报告</h2>
            <p>
              近 7 天完成 {weekly.attemptCount} 次作答（{formatTrend(
                weekly.attemptCount,
                weekly.previousAttemptCount
              )}
              ），活跃 {weekly.activeDays} 天。
            </p>
          </div>
          <span className="count-badge">周正确率 {weekly.accuracy}%</span>
        </div>
        <div className="meter plan-meter">
          <span style={{ width: `${weekly.accuracy}%` }} />
        </div>
        <div className="weekly-summary">
          <div>
            <strong>{weekly.correctCount}</strong>
            <span>答对</span>
          </div>
          <div>
            <strong>{weekly.wrongCount}</strong>
            <span>答错</span>
          </div>
          <div>
            <strong>{formatTrend(weekly.accuracy, weekly.previousAccuracy)}</strong>
            <span>正确率对比上周</span>
          </div>
          <div>
            <strong>{formatDuration(weekly.totalSeconds)}</strong>
            <span>本周用时</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h2>今日冲刺计划</h2>
            <p>
              已完成 {completedTaskCount}/{dailyTasks.length} 项。完成后点击“标记完成”，计划会保存在本地。
            </p>
          </div>
          <span className="count-badge">{dailyPercent}%</span>
        </div>

        <div className="meter plan-meter">
          <span style={{ width: `${dailyPercent}%` }} />
        </div>

        <div className="daily-task-list">
          {dailyTasks.map((task) => {
            const done = completedTaskIds.includes(task.id);

            return (
              <article key={task.id} className={`daily-task ${done ? "done" : ""}`}>
                <div className="daily-task-main">
                  <div className="daily-task-title">
                    <span className={`task-type ${task.type}`}>
                      {taskTypeLabel[task.type]}
                    </span>
                    <strong>{task.title}</strong>
                  </div>
                  <p>{task.description}</p>
                </div>
                <div className="daily-task-actions">
                  {task.route && (
                    <button
                      className="primary"
                      type="button"
                      onClick={() =>
                        onNavigate(task.route!.page, task.route!.query)
                      }
                    >
                      开始
                    </button>
                  )}
                  <button
                    className={done ? "ghost" : "primary"}
                    type="button"
                    onClick={() => completeTask(task.id)}
                  >
                    {done ? "已完成" : "标记完成"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="two-column">
        <div className="panel">
          <h2>薄弱考点优先</h2>
          <div className="ranking-list">
            {topicRanking.slice(0, 5).map(({ topic, stats }) => (
              <div key={topic.id} className="ranking-item">
                <div>
                  <strong>{topic.name}</strong>
                  <span>
                    {stats.attemptedQuestions}/{stats.totalQuestions} 题 · 正确率{" "}
                    {stats.accuracy}%
                  </span>
                </div>
                <span className="mastery-value">{stats.mastery}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>冲刺节奏</h2>
          <ol className="roadmap">
            <li>到期错题优先清零，避免旧错误反复出现。</li>
            <li>每天集中训练 1～2 个薄弱考点。</li>
            <li>用限时模考检查速度、准确率和考点漏洞。</li>
            <li>交卷后按分题型、分考点报告回看解析。</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
