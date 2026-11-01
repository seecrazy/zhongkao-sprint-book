import { useMemo, useState } from "react";
import { getSubjectContent } from "../data/sample-content";
import { gradeQuestions } from "../lib/grading";
import { getDueMistakes, recordAttempt } from "../lib/storage";
import MathText from "../components/MathText";
import QuestionCard from "../components/QuestionCard";
import type {
  ProgressState,
  Question,
  QuestionResult,
  Subject,
} from "../types";

interface PracticeProps {
  subject: Subject;
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  initialTopicId?: string;
  initialReviewOnly?: boolean;
  initialVariant?: boolean;
}

export default function Practice({
  subject,
  progress,
  setProgress,
  initialTopicId = "all",
  initialReviewOnly = false,
  initialVariant = false,
}: PracticeProps) {
  const { knowledgePoints, questions: subjectQuestions } =
    getSubjectContent(subject);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [reviewOnly, setReviewOnly] = useState(initialReviewOnly);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [interactionStartedAt, setInteractionStartedAt] = useState<
    Record<string, number>
  >({});

  const reviewQuestionIds = useMemo(
    () => getDueMistakes(progress).map((mistake) => mistake.questionId),
    // 只在进入复习模式时锁定本次要复习的错题，避免作答后列表立即消失。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialReviewOnly]
  );

  // 变式重练：把每道到期错题替换为同考点、同题型的另一道题（优先生成题）
  const variantMap = useMemo(() => {
    const map = new Map<string, Question>();
    if (!initialVariant || !initialReviewOnly) return map;

    const used = new Set<string>();
    const daySeed = Number(`${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}`);

    reviewQuestionIds.forEach((mistakeId) => {
      const original = subjectQuestions.find((qz) => qz.id === mistakeId);
      if (!original) return;

      const primaryKp = original.knowledgePointIds[0];
      const candidates = subjectQuestions.filter(
        (qz) =>
          qz.id !== mistakeId &&
          qz.type === original.type &&
          !used.has(qz.id) &&
          !reviewQuestionIds.includes(qz.id) &&
          qz.knowledgePointIds.includes(primaryKp)
      );
      if (candidates.length === 0) return;

      let acc = daySeed + mistakeId.length;
      for (const ch of mistakeId) acc = (acc * 31 + ch.charCodeAt(0)) % 100000;
      const picked = candidates[acc % candidates.length];

      map.set(mistakeId, picked);
      used.add(picked.id);
    });

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVariant, initialReviewOnly, reviewQuestionIds, subject]);

  const effectiveReviewIds = useMemo(() => {
    if (!initialVariant) return reviewQuestionIds;
    return reviewQuestionIds.map((id) => variantMap.get(id)?.id ?? id);
  }, [initialVariant, reviewQuestionIds, variantMap]);

  const filteredQuestions = useMemo(() => {
    let questions = subjectQuestions;

    if (topicId !== "all") {
      questions = questions.filter((question) =>
        question.knowledgePointIds.includes(topicId)
      );
    }

    if (reviewOnly) {
      questions = questions.filter((question) =>
        effectiveReviewIds.includes(question.id)
      );
    }

    return questions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, reviewOnly, effectiveReviewIds, subject]);

  function resetSession(nextTopicId = topicId, nextReviewOnly = reviewOnly) {
    setTopicId(nextTopicId);
    setReviewOnly(nextReviewOnly);
    setResponses({});
    setResults({});
    setHasSubmitted(false);
    setInteractionStartedAt({});
  }

  function submit() {
    const submittedAt = Date.now();
    const gradedResults = gradeQuestions(filteredQuestions, responses);
    const questionResults: QuestionResult[] = gradedResults.map((result) => {
      const startedAt = interactionStartedAt[result.questionId];
      const timeSpentSeconds =
        result.status === "skipped" || !startedAt
          ? 0
          : Math.max(1, Math.round((submittedAt - startedAt) / 1000));

      return {
        ...result,
        timeSpentSeconds,
      };
    });

    const nextResults = Object.fromEntries(
      questionResults.map((result) => [result.questionId, result])
    );

    let nextProgress = progress;
    questionResults.forEach((result) => {
      nextProgress = recordAttempt(nextProgress, {
        questionId: result.questionId,
        status: result.status,
        userAnswer: result.userAnswer,
        timeSpentSeconds: result.timeSpentSeconds ?? 0,
      });
    });

    setResults(nextResults);
    setHasSubmitted(true);
    setProgress(nextProgress);
  }

  const correctCount = filteredQuestions.filter(
    (question) => results[question.id]?.status === "correct"
  ).length;
  const wrongCount = filteredQuestions.filter(
    (question) =>
      results[question.id]?.status === "wrong" ||
      results[question.id]?.status === "skipped"
  ).length;

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>{reviewOnly ? "错题复习" : "专题练习"}</h1>
          <p>
            {reviewOnly
              ? initialVariant
                ? "变式重练：用同考点、同题型的其他题目替代原错题，检验是否真正掌握。连续答对可以推进复习阶段。"
                : "本轮只复习进入页面时到期的错题。连续答对可以推进复习阶段。"
              : "选择考点，完成一组题目后点击“一键打分”。"}
          </p>
        </div>
        <span className="count-badge">
          {filteredQuestions.length} 题
        </span>
      </div>

      <div className="toolbar">
        <select
          value={topicId}
          onChange={(event) => resetSession(event.target.value, false)}
        >
          <option value="all">全部考点</option>
          {knowledgePoints.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name}
            </option>
          ))}
        </select>
        <button
          className="primary"
          type="button"
          onClick={submit}
          disabled={filteredQuestions.length === 0}
        >
          一键打分
        </button>
      </div>

      {reviewOnly && (
        <div className="review-banner">
          <strong>{initialVariant ? "变式重练模式" : "复习模式"}</strong>
          <span>
            本次复习队列包含 {reviewQuestionIds.length} 道到期错题
            {initialVariant && variantMap.size > 0
              ? `，其中 ${variantMap.size} 道已替换为同考点同类变式题`
              : ""}
            。
          </span>
          <button
            className="ghost"
            type="button"
            onClick={() => resetSession("all", false)}
          >
            返回普通练习
          </button>
        </div>
      )}

      {hasSubmitted && (
        <div className="result-banner">
          <strong>
            本次完成：{correctCount} 对 / {wrongCount} 错
          </strong>
          <span>
            已记录做题次数和用时；错题会按间隔复习计划安排下一次复习。
          </span>
          <div className="result-actions">
            <button
              className="ghost"
              type="button"
              onClick={() => resetSession()}
            >
              再练一组
            </button>
          </div>
        </div>
      )}

      <div className="question-list">
        {filteredQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index + 1}
            question={question}
            value={responses[question.id] ?? ""}
            result={results[question.id]}
            hasSubmitted={hasSubmitted}
            onChange={(value) =>
              setResponses((previous) => ({
                ...previous,
                [question.id]: value,
              }))
            }
            onFirstInteraction={(questionId) =>
              setInteractionStartedAt((previous) => ({
                ...previous,
                [questionId]: Date.now(),
              }))
            }
          />
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="empty">
          <strong>暂无题目</strong>
          <p>
            {reviewOnly
              ? "当前没有到期错题。你可以在错题本查看复习状态。"
              : "这个考点还没有题目，后续内容更新后会显示在这里。"}
          </p>
        </div>
      )}

      {hasSubmitted && filteredQuestions.length > 0 && (
        <div className="panel">
          <h2>本组解析</h2>
          <p>每道题的解析已显示在题目卡片下方，可逐题复盘。</p>
          <ol className="summary-list">
            {filteredQuestions.map((question) => {
              const result = results[question.id];
              return (
                <li key={question.id}>
                  <span className={`answer-state ${result?.status}`}>
                    {result?.status === "correct"
                      ? "正确"
                      : result?.status === "skipped"
                        ? "未作答"
                        : "错误"}
                  </span>
                  <MathText text={question.stem} />
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
