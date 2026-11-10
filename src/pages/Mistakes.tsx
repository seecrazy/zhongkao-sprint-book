import { useMemo, useState } from "react";
import { getSubjectContent } from "../data/sample-content";
import MathText from "../components/MathText";
import { getCorrectAnswerText } from "../lib/grading";
import {
  getDueMistakes,
  isMistakeDue,
  isMistakeMastered,
  setMistakeErrorTag,
  setMistakeManualMastered,
} from "../lib/storage";
import {
  ERROR_TAG_LABELS,
  type ErrorTag,
  type MistakeRecord,
  type ProgressState,
  type Subject,
} from "../types";

interface MistakesProps {
  subject: Subject;
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  onNavigate: (page: "practice", query?: Record<string, string>) => void;
}

type MistakeFilter = "due" | "all" | "mastered";

const ERROR_TAG_ORDER: ErrorTag[] = [
  "concept",
  "calculation",
  "careless",
  "reading",
  "unknown",
];

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
    return {
      label: mistake.manualMastered ? "已掌握（手动）" : "已掌握",
      className: "mastered",
    };
  }

  if (isMistakeDue(mistake)) {
    return { label: "待复习", className: "wrong" };
  }

  return { label: `巩固中 · 阶段 ${mistake.reviewStage}`, className: "skipped" };
}

export default function Mistakes({
  subject,
  progress,
  setProgress,
  onNavigate,
}: MistakesProps) {
  const [filter, setFilter] = useState<MistakeFilter>("due");
  const [errorTagFilter, setErrorTagFilter] = useState<ErrorTag | "all">("all");
  const { questions } = getSubjectContent(subject);
  const dueMistakes = getDueMistakes(progress);

  const mistakes = useMemo(() => {
    const all = Object.values(progress.mistakes).sort(
      (left, right) =>
        new Date(right.lastSeenAt).getTime() -
        new Date(left.lastSeenAt).getTime()
    );

    let list: MistakeRecord[];
    if (filter === "due") list = dueMistakes;
    else if (filter === "mastered") list = all.filter(isMistakeMastered);
    else list = all;

    if (errorTagFilter !== "all") {
      list = list.filter(
        (mistake) => (mistake.errorTag ?? "unknown") === errorTagFilter
      );
    }

    return list;
  }, [progress.mistakes, dueMistakes, filter, errorTagFilter]);

  const tagSummary = useMemo(() => {
    const summary = new Map<ErrorTag, number>();
    Object.values(progress.mistakes).forEach((mistake) => {
      const tag = mistake.errorTag ?? "unknown";
      summary.set(tag, (summary.get(tag) ?? 0) + 1);
    });
    return summary;
  }, [progress.mistakes]);

  function updateTag(questionId: string, tag: ErrorTag) {
    setProgress(setMistakeErrorTag(progress, questionId, tag));
  }

  function toggleMastered(questionId: string, mastered: boolean) {
    setProgress(setMistakeManualMastered(progress, questionId, mastered));
  }

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>错题本</h1>
          <p>
            错题会进入间隔复习队列：当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。连续答对可升级，再错会重置；也可以给每道错题标注错因，按错因集中攻破。
          </p>
        </div>
        <div className="section-head-actions">
          <button
            className="ghost no-print"
            type="button"
            disabled={mistakes.length === 0}
            onClick={() => window.print()}
          >
            打印当前列表
          </button>
          <span className="count-badge">{dueMistakes.length} 题到期</span>
        </div>
      </div>

      <div className="toolbar no-print">
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
        <button
          className="ghost"
          type="button"
          disabled={dueMistakes.length === 0}
          onClick={() => onNavigate("practice", { review: "1", variant: "1" })}
        >
          变式重练（同考点同类题）
        </button>
      </div>

      <div className="error-tag-panel no-print">
        <strong>错因分布</strong>
        <div className="error-tag-filters">
          <button
            type="button"
            className={errorTagFilter === "all" ? "active" : ""}
            onClick={() => setErrorTagFilter("all")}
          >
            全部（{Object.keys(progress.mistakes).length}）
          </button>
          {ERROR_TAG_ORDER.filter((tag) => tagSummary.has(tag)).map((tag) => (
            <button
              key={tag}
              type="button"
              className={errorTagFilter === tag ? "active" : ""}
              onClick={() => setErrorTagFilter(tag)}
            >
              {ERROR_TAG_LABELS[tag]}（{tagSummary.get(tag)}）
            </button>
          ))}
        </div>
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
            const currentTag = mistake.errorTag ?? "unknown";

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

                <div className="mistake-actions no-print">
                  <label className="error-tag-editor">
                    <span>错因</span>
                    <select
                      value={currentTag}
                      onChange={(event) =>
                        updateTag(question.id, event.target.value as ErrorTag)
                      }
                    >
                      {ERROR_TAG_ORDER.map((tag) => (
                        <option key={tag} value={tag}>
                          {ERROR_TAG_LABELS[tag]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() =>
                      toggleMastered(
                        question.id,
                        !mistake.manualMastered
                      )
                    }
                  >
                    {mistake.manualMastered ? "取消已掌握" : "标记已掌握"}
                  </button>
                </div>
                <div className="print-only print-tag">
                  错因：{ERROR_TAG_LABELS[currentTag]}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
