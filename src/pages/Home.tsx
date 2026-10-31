import { useMemo } from "react";
import {
  knowledgePoints,
  mathContentVersion,
  sampleQuestions,
} from "../data/sample-content";
import {
  calculateLearningStreak,
  calculateOverallMastery,
  calculateTopicStats,
  getLocalDateString,
  getTodayAttemptCount,
  getTotalPracticeSeconds,
} from "../lib/mastery";
import { buildDailyTasks } from "../lib/planner";
import { getDueMistakes, toggleDailyTask } from "../lib/storage";
import type { DailyTask, ProgressState } from "../types";

interface HomeProps {
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  onNavigate: (
    page: "topics" | "practice" | "exam" | "mistakes",
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
  progress,
  setProgress,
  onNavigate,
}: HomeProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = getLocalDateString(today);

  const overallMastery = calculateOverallMastery(
    knowledgePoints,
    sampleQuestions,
    progress.attempts
  );
  const dueMistakes = getDueMistakes(progress, today);
  const todayAttempts = getTodayAttemptCount(progress.attempts, today);
  const streak = calculateLearningStreak(progress.attempts);
  const totalSeconds = getTotalPracticeSeconds(progress.attempts);
  const topicRanking = [...knowledgePoints]
    .map((topic) => ({
      topic,
      stats: calculateTopicStats(
        topic.id,
        sampleQuestions,
        progress.attempts
      ),
    }))
    .sort((left, right) => left.stats.mastery - right.stats.mastery);

  const dailyTasks = useMemo(
    () =>
      buildDailyTasks({
        date: today,
        topics: knowledgePoints,
        questions: sampleQuestions,
        progress,
      }),
    [progress, today]
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
          <span className="eyebrow">SprintBook v0.4 · {mathContentVersion}</span>
          <h1>考点看得清，错题改得掉。</h1>
          <p>
            今日任务、掌握度、间隔复习和限时模考已经连成闭环，冲刺时先做最有价值的事。
          </p>
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
        <div className="hero-card">
          <strong>综合掌握度</strong>
          <div className="big-number">{overallMastery}%</div>
          <span>
            覆盖 {knowledgePoints.length} 个数学考点 · {sampleQuestions.length} 道题
          </span>
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
            <li>交卷后按分考点报告回看解析。</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
