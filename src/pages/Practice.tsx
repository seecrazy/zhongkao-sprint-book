import { useMemo, useState } from "react";
import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import { gradeQuestions } from "../lib/grading";
import { getDueMistakes, recordAttempt } from "../lib/storage";
import MathText from "../components/MathText";
import QuestionCard from "../components/QuestionCard";
import type { ProgressState, QuestionResult } from "../types";

interface PracticeProps {
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  initialTopicId?: string;
  initialReviewOnly?: boolean;
}

export default function Practice({
  progress,
  setProgress,
  initialTopicId = "all",
  initialReviewOnly = false,
}: PracticeProps) {
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

  const filteredQuestions = useMemo(() => {
    let questions = sampleQuestions;

    if (topicId !== "all") {
      questions = questions.filter((question) =>
        question.knowledgePointIds.includes(topicId)
      );
    }

    if (reviewOnly) {
      questions = questions.filter((question) =>
        reviewQuestionIds.includes(question.id)
      );
    }

    return questions;
  }, [topicId, reviewOnly, reviewQuestionIds]);

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
              ? "本轮只复习进入页面时到期的错题。连续答对可以推进复习阶段。"
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
          <strong>复习模式</strong>
          <span>本次复习队列包含 {reviewQuestionIds.length} 道到期错题。</span>
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
