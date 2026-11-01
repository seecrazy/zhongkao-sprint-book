import { useMemo, useState } from "react";
import { getSubjectContent } from "../data/sample-content";
import MathText from "../components/MathText";
import { getCorrectAnswerText } from "../lib/grading";
import {
  getDueMistakes,
  isMistakeDue,
  isMistakeMastered,
} from "../lib/storage";
import type { MistakeRecord, ProgressState, Subject } from "../types";

interface MistakesProps {
  subject: Subject;
  progress: ProgressState;
  onNavigate: (page: "practice", query?: Record<string, string>) => void;
}

type MistakeFilter = "due" | "all" | "mastered";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMistakeStatus(mistake: MistakeRecord): {
  label: string;
  className: string;
} {
  if (isMistakeMastered(mistake)) {
    return { label: "已掌握", className: "mastered" };
  }

  if (isMistakeDue(mistake)) {
    return { label: "待复习", className: "wrong" };
  }

  return { label: `巩固中 · 阶段 ${mistake.reviewStage}`, className: "skipped" };
}

export default function Mistakes({
  subject,
  progress,
  onNavigate,
}: MistakesProps) {
  const [filter, setFilter] = useState<MistakeFilter>("due");
  const { questions } = getSubjectContent(subject);
  const dueMistakes = getDueMistakes(progress);

  const mistakes = useMemo(() => {
    const all = Object.values(progress.mistakes).sort(
      (left, right) =>
        new Date(right.lastSeenAt).getTime() -
        new Date(left.lastSeenAt).getTime()
    );

    if (filter === "due") return dueMistakes;
    if (filter === "mastered") {
      return all.filter(isMistakeMastered);
    }
    return all;
  }, [progress.mistakes, dueMistakes, filter]);

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>错题本</h1>
          <p>
            错题会进入间隔复习队列：当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。连续答对可升级，再错会重置。
          </p>
        </div>
        <span className="count-badge">{dueMistakes.length} 题到期</span>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          <button
            type="button"
            className={filter === "due" ? "active" : ""}
            onClick={() => setFilter("due")}
          >
            到期复习
          </button>
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            全部错题
          </button>
          <button
            type="button"
            className={filter === "mastered" ? "active" : ""}
            onClick={() => setFilter("mastered")}
          >
            已掌握
          </button>
        </div>

        <button
          className="primary"
          type="button"
          disabled={dueMistakes.length === 0}
          onClick={() => onNavigate("practice", { review: "1" })}
        >
          开始复习到期错题
        </button>
      </div>

      {mistakes.length === 0 ? (
        <div className="empty">
          <strong>
            {filter === "due"
              ? "当前没有到期错题"
              : filter === "mastered"
                ? "还没有已掌握错题"
                : "还没有错题"}
          </strong>
          <p>
            {filter === "due"
              ? "完成练习后，错误或未作答的题目会按复习计划自动到期。"
              : "完成一组练习后，错误或未作答的题目会自动出现在这里。"}
          </p>
        </div>
      ) : (
        <div className="mistake-list">
          {mistakes.map((mistake) => {
            const question = questions.find(
              (item) => item.id === mistake.questionId
            );

            if (!question) return null;

            const status = getMistakeStatus(mistake);

            return (
              <article key={question.id} className="mistake-card">
                <div className="question-meta">
                  <span>{question.displayType}</span>
                  <span>错误 {mistake.wrongCount} 次</span>
                  <span className={`answer-state ${status.className}`}>
                    {status.label}
                  </span>
                  <span>
                    下次复习 {formatDateTime(mistake.nextReviewAt)}
                  </span>
                </div>
                <h2>
                  <MathText text={question.stem} />
                </h2>
                <p>
                  <strong>正确答案：</strong>
                  <MathText text={getCorrectAnswerText(question)} />
                </p>
                <p>
                  <MathText text={question.explanation} />
                </p>
                {question.commonMistake && (
                  <p className="warning">
                    <strong>常见错误：</strong>
                    <MathText text={question.commonMistake} />
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
