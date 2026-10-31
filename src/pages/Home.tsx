import { knowledgePoints, mathContentVersion, sampleQuestions } from "../data/sample-content";
import {
  calculateLearningStreak,
  calculateOverallMastery,
  calculateTopicStats,
  getTodayAttemptCount,
  getTotalPracticeSeconds,
} from "../lib/mastery";
import { getDueMistakes } from "../lib/storage";
import type { ProgressState } from "../types";

interface HomeProps {
  progress: ProgressState;
  onNavigate: (page: "topics" | "practice" | "mistakes") => void;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;
}

export default function Home({ progress, onNavigate }: HomeProps) {
  const overallMastery = calculateOverallMastery(
    knowledgePoints,
    sampleQuestions,
    progress.attempts
  );
  const dueMistakes = getDueMistakes(progress);
  const todayAttempts = getTodayAttemptCount(progress.attempts);
  const streak = calculateLearningStreak(progress.attempts);
  const totalSeconds = getTotalPracticeSeconds(progress.attempts);
  const topicRanking = [...knowledgePoints]
    .map((topic) => ({
      topic,
      stats: calculateTopicStats(topic.id, sampleQuestions, progress.attempts),
    }))
    .sort((left, right) => left.stats.mastery - right.stats.mastery);
  const weakest = topicRanking[0];

  return (
    <section className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">SprintBook v0.3 · {mathContentVersion}</span>
          <h1>考点看得清，错题改得掉。</h1>
          <p>
            现在已经可以记录做题次数和用时，计算考点掌握度，并按间隔复习计划安排错题。
          </p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => onNavigate("practice")}>
              开始练习
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
            覆盖 {knowledgePoints.length} 个数学考点 · {sampleQuestions.length} 道示例题
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
          <h2>下一步建议</h2>
          {weakest ? (
            <p>
              当前薄弱点是 <strong>{weakest.topic.name}</strong>。建议先完成它的专题练习；如果有到期错题，优先复习错题。
            </p>
          ) : (
            <p>先完成一组练习，系统会根据作答记录生成掌握度。</p>
          )}
          <ol className="roadmap">
            <li>优先复习 {dueMistakes.length} 道到期错题。</li>
            <li>完成薄弱考点的 3～5 道基础题。</li>
            <li>把连续答对错题推进到下一复习阶段。</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
