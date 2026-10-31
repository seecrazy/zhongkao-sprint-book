import { useMemo, useState } from "react";
import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import { gradeQuestions } from "../lib/grading";
import { markCompleted, recordMistake } from "../lib/storage";
import MathText from "../components/MathText";
import type { ProgressState, Question, QuestionResult } from "../types";

interface PracticeProps {
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
}

export default function Practice({ progress, setProgress }: PracticeProps) {
  const [topicId, setTopicId] = useState("all");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (topicId === "all") return sampleQuestions;
    return sampleQuestions.filter((question) =>
      question.knowledgePointIds.includes(topicId)
    );
  }, [topicId]);

  function switchTopic(nextTopicId: string) {
    setTopicId(nextTopicId);
    setResponses({});
    setResults({});
    setHasSubmitted(false);
  }

  function submit() {
    const questionResults = gradeQuestions(filteredQuestions, responses);
    const nextResults = Object.fromEntries(
      questionResults.map((result) => [result.questionId, result])
    );

    let nextProgress = progress;
    questionResults.forEach((result) => {
      if (result.status === "correct") {
        nextProgress = markCompleted(nextProgress, result.questionId);
      } else {
        nextProgress = recordMistake(nextProgress, result.questionId);
      }
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
          <h1>专题练习</h1>
          <p>选择考点，完成一组题目后点击“一键打分”。</p>
        </div>
      </div>

      <div className="toolbar">
        <select value={topicId} onChange={(event) => switchTopic(event.target.value)}>
          <option value="all">全部考点</option>
          {knowledgePoints.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name}
            </option>
          ))}
        </select>
        <button className="primary" type="button" onClick={submit} disabled={filteredQuestions.length === 0}>
          一键打分
        </button>
      </div>

      {hasSubmitted && (
        <div className="result-banner">
          <strong>
            本次完成：{correctCount} 对 / {wrongCount} 错
          </strong>
          <span>错题已进入错题本，解析可在题目下方查看。</span>
          <div className="result-actions">
            <button
              className="ghost"
              type="button"
              onClick={() => switchTopic(topicId)}
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
          />
        ))}
      </div>
    </section>
  );
}

interface QuestionCardProps {
  index: number;
  question: Question;
  value: string;
  result?: QuestionResult;
  hasSubmitted: boolean;
  onChange: (value: string) => void;
}

function QuestionCard({
  index,
  question,
  value,
  result,
  hasSubmitted,
  onChange,
}: QuestionCardProps) {
  const status = result?.status;

  return (
    <article className={`question-card ${status ?? ""}`}>
      <div className="question-meta">
        <span>第 {index} 题</span>
        <span>{question.displayType}</span>
        <span>难度 {"★".repeat(question.difficulty)}</span>
        {hasSubmitted && (
          <span className={`answer-state ${status}`}>
            {status === "correct" ? "正确" : status === "skipped" ? "未作答" : "错误"}
          </span>
        )}
      </div>

      <h2>
        <MathText text={question.stem} />
      </h2>

      {question.type === "single-choice" ? (
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.key} className={value === option.key ? "selected" : ""}>
              <input
                type="radio"
                name={question.id}
                value={option.key}
                checked={value === option.key}
                onChange={() => onChange(option.key)}
              />
              <strong>{option.key}.</strong>
              <span>
                <MathText text={option.label} />
              </span>
            </label>
          ))}
        </div>
      ) : (
        <input
          className="answer-input"
          value={value}
          placeholder="输入答案"
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {hasSubmitted && result && (
        <div className="feedback">
          <div>
            <strong>你的答案：</strong>
            {result.userAnswer ? <MathText text={result.userAnswer} /> : "未作答"}
          </div>
          <div>
            <strong>正确答案：</strong>
            <MathText text={result.correctAnswer} />
          </div>
          <div>
            <strong>解析：</strong>
            <MathText text={question.explanation} />
          </div>
          {result.status !== "correct" && question.commonMistake && (
            <div className="warning">
              <strong>常见错误：</strong>
              <MathText text={question.commonMistake} />
            </div>
          )}
          {question.optimalSolution && (
            <div className="optimal">
              <strong>更优方法：</strong>
              <MathText text={question.optimalSolution} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
