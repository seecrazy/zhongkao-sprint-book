import { useMemo, useState } from "react";
import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import { calculateTopicStats } from "../lib/mastery";
import MathText from "../components/MathText";
import type { KnowledgePoint, ProgressState, TopicStats } from "../types";

interface TopicsProps {
  progress: ProgressState;
  onNavigate: (page: "practice", query?: Record<string, string>) => void;
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

export default function Topics({ progress, onNavigate }: TopicsProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const rankedTopics = useMemo(
    () =>
      knowledgePoints.map((point) => ({
        point,
        stats: calculateTopicStats(point.id, sampleQuestions, progress.attempts),
      })),
    [progress.attempts]
  );

  const selected = rankedTopics.find(
    (item) => item.point.id === selectedTopicId
  );

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>考点地图</h1>
          <p>
            每个考点都提供概念讲解、公式、例题、易错点和解题策略；掌握度用于判断当前冲刺优先级。
          </p>
        </div>
      </div>

      {selected?.point.lesson && (
        <article className="lesson-detail">
          <header className="lesson-header">
            <div>
              <span className="eyebrow">考点讲解</span>
              <h2>{selected.point.name}</h2>
              <p>{selected.point.summary}</p>
            </div>
            <button
              className="ghost"
              type="button"
              onClick={() => setSelectedTopicId(null)}
            >
              关闭
            </button>
          </header>

          <LessonBody point={selected.point} stats={selected.stats} />

          <div className="lesson-actions">
            <button
              className="primary"
              type="button"
              onClick={() =>
                onNavigate("practice", { topic: selected.point.id })
              }
            >
              练习本考点
            </button>
          </div>
        </article>
      )}

      <div className="topic-grid">
        {rankedTopics.map(({ point, stats }) => (
          <article key={point.id} className="topic-card">
            <div className="topic-top">
              <h2>{point.name}</h2>
              <span className={`tag ${point.examWeight}`}>
                {weightLabel[point.examWeight]}
              </span>
            </div>
            <p>
              <MathText text={point.summary} />
            </p>

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

            <button
              className={selectedTopicId === point.id ? "primary full-width" : "ghost full-width"}
              type="button"
              onClick={() =>
                setSelectedTopicId((value) =>
                  value === point.id ? null : point.id
                )
              }
            >
              {point.lesson ? "查看讲解" : "暂无讲解"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

interface LessonBodyProps {
  point: KnowledgePoint;
  stats: TopicStats;
}

function LessonBody({ point, stats }: LessonBodyProps) {
  const lesson = point.lesson;

  if (!lesson) {
    return <p>这个考点暂无结构化讲解。</p>;
  }

  return (
    <div className="lesson-body">
      <section>
        <h3>学习目标</h3>
        <ul className="lesson-list">
          {lesson.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>核心思路</h3>
        <p className="lesson-key-idea">
          <MathText text={lesson.keyIdea} />
        </p>
      </section>

      <section>
        <h3>概念讲解</h3>
        <div className="lesson-grid">
          {lesson.concepts.map((concept) => (
            <article key={concept.title} className="lesson-card">
              <h4>{concept.title}</h4>
              <ul className="lesson-list">
                {concept.content.map((content, index) => (
                  <li key={`${concept.title}-${index}`}>
                    <MathText text={content} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>核心公式</h3>
        <div className="lesson-grid">
          {lesson.formulas.map((formula) => (
            <article key={formula.name} className="lesson-card">
              <h4>{formula.name}</h4>
              <p className="formula-line">
                <MathText text={formula.expression} />
              </p>
              {formula.note && (
                <p className="lesson-note">
                  <MathText text={formula.note} />
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>例题讲解</h3>
        <div className="lesson-grid">
          {lesson.workedExamples.map((example) => (
            <article key={example.title} className="lesson-card">
              <h4>{example.title}</h4>
              <p>
                <strong>题目：</strong>
                <MathText text={example.problem} />
              </p>
              <ol className="lesson-list">
                {example.steps.map((step, index) => (
                  <li key={`${example.title}-step-${index}`}>
                    <MathText text={step} />
                  </li>
                ))}
              </ol>
              <p>
                <strong>答案：</strong>
                <MathText text={example.answer} />
              </p>
              {example.takeaway && (
                <p className="lesson-note">
                  <strong>要点：</strong>
                  <MathText text={example.takeaway} />
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>易错警示</h3>
        <div className="lesson-grid">
          {lesson.pitfalls.map((pitfall) => (
            <article key={pitfall.mistake} className="lesson-card warning-card">
              <p>
                <strong>易错：</strong>
                {pitfall.mistake}
              </p>
              <p className="optimal">
                <strong>纠正：</strong>
                <MathText text={pitfall.correction} />
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>解题策略</h3>
        <p className="lesson-key-idea">
          <MathText text={lesson.strategy} />
        </p>
      </section>

      <section>
        <h3>当前掌握状态</h3>
        <div className="meter">
          <span style={{ width: `${stats.mastery}%` }} />
        </div>
        <div className="topic-meta">
          <span>{statusLabel[stats.status]}</span>
          <span>
            {stats.attemptedQuestions}/{stats.totalQuestions} 题已尝试 · 正确率{" "}
            {stats.accuracy}%
          </span>
        </div>
      </section>
    </div>
  );
}
