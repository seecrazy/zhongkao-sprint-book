import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import { calculateTopicStats } from "../lib/mastery";
import type { ProgressState } from "../types";

interface TopicsProps {
  progress: ProgressState;
}

const weightLabel = {
  high: "高频",
  medium: "中频",
  low: "低频",
};

const statusLabel = {
  "not-started": "未开始",
  learning: "学习中",
  stable: "较稳",
  mastered: "已掌握",
};

export default function Topics({ progress }: TopicsProps) {
  const rankedTopics = knowledgePoints.map((point) => ({
    point,
    stats: calculateTopicStats(point.id, sampleQuestions, progress.attempts),
  }));

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>考点地图</h1>
          <p>
            掌握度由正确率、覆盖率和连续答对稳定性共同计算，用于判断当前冲刺优先级。
          </p>
        </div>
      </div>

      <div className="topic-grid">
        {rankedTopics.map(({ point, stats }) => (
          <article key={point.id} className="topic-card">
            <div className="topic-top">
              <h2>{point.name}</h2>
              <span className={`tag ${point.examWeight}`}>
                {weightLabel[point.examWeight]}
              </span>
            </div>
            <p>{point.summary}</p>

            <div className="meter">
              <span style={{ width: `${stats.mastery}%` }} />
            </div>

            <div className="topic-meta">
              <span>{statusLabel[stats.status]}</span>
              <span>掌握度 {stats.mastery}%</span>
            </div>

            <dl className="topic-stats">
              <div>
                <dt>题目</dt>
                <dd>
                  {stats.attemptedQuestions}/{stats.totalQuestions}
                </dd>
              </div>
              <div>
                <dt>正确率</dt>
                <dd>{stats.accuracy}%</dd>
              </div>
              <div>
                <dt>覆盖率</dt>
                <dd>{stats.coverage}%</dd>
              </div>
              <div>
                <dt>稳定性</dt>
                <dd>{stats.stability}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
