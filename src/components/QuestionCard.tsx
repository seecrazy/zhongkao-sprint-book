import MathText from "./MathText";
import type { Question, QuestionResult } from "../types";

interface QuestionCardProps {
  index: number;
  question: Question;
  value: string;
  result?: QuestionResult;
  hasSubmitted: boolean;
  onChange: (value: string) => void;
  onFirstInteraction?: (questionId: string) => void;
}

export default function QuestionCard({
  index,
  question,
  value,
  result,
  hasSubmitted,
  onChange,
  onFirstInteraction,
}: QuestionCardProps) {
  const status = result?.status;

  function handleAnswer(nextValue: string) {
    if (!value && onFirstInteraction) {
      onFirstInteraction(question.id);
    }
    onChange(nextValue);
  }

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
        {hasSubmitted && typeof result?.timeSpentSeconds === "number" && (
          <span>用时 {result.timeSpentSeconds}s</span>
        )}
      </div>

      <h2>
        <MathText text={question.stem} />
      </h2>

      {question.type === "single-choice" || question.type === "multi-choice" ? (
        <div className="option-list">
          {question.options.map((option) => (
            question.type === "single-choice" ? (
              <label
                key={option.key}
                className={value === option.key ? "selected" : ""}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.key}
                  checked={value === option.key}
                  onChange={() => handleAnswer(option.key)}
                />
                <strong>{option.key}.</strong>
                <span>
                  <MathText text={option.label} />
                </span>
              </label>
            ) : (
              (() => {
                const selectedKeys = value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .split("")
                  .filter(Boolean);
                const checked = selectedKeys.includes(option.key);

                return (
                  <label
                    key={option.key}
                    className={checked ? "selected" : ""}
                  >
                    <input
                      type="checkbox"
                      name={question.id}
                      value={option.key}
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? selectedKeys.filter((key) => key !== option.key)
                          : [...selectedKeys, option.key];
                        handleAnswer(next.sort().join(""));
                      }}
                    />
                    <strong>{option.key}.</strong>
                    <span>
                      <MathText text={option.label} />
                    </span>
                  </label>
                );
              })()
            )
          ))}
        </div>
      ) : (
        <input
          className="answer-input"
          value={value}
          placeholder="输入答案"
          onChange={(event) => handleAnswer(event.target.value)}
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
