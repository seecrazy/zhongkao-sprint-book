import { useRef, useState } from "react";
import MathText from "./MathText";
import { isSpeechSupported, speakEnglish } from "../lib/tts";
import { analyzeEssayText, parseEssayAnswer } from "../lib/grading";
import type { EssayQuestion, Question, QuestionResult } from "../types";

interface QuestionCardProps {
  index: number;
  question: Question;
  value: string;
  result?: QuestionResult;
  hasSubmitted: boolean;
  onChange: (value: string) => void;
  onFirstInteraction?: (questionId: string) => void;
}

function EssayEditor({
  question,
  value,
  disabled,
  onChange,
}: {
  question: EssayQuestion;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const payload = parseEssayAnswer(value);
  // React 批处理下同一轮的多次更新（连续点多个自评维度、快速输入）
  // 都会读到同一份过期 payload，用 ref 同步保存最新值避免相互覆盖。
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const metrics = analyzeEssayText(payload.text);
  const maxScore = question.rubric.reduce((total, dim) => total + dim.maxScore, 0);
  const currentSelfScore = question.rubric.reduce(
    (total, dim) => total + (Number(payload.selfScores[dim.id]) || 0),
    0
  );

  function update(next: { text?: string; selfScores?: Record<string, number> }) {
    const current = payloadRef.current;
    const merged = {
      text: next.text ?? current.text,
      selfScores: next.selfScores ?? current.selfScores,
    };
    payloadRef.current = merged;
    onChange(JSON.stringify(merged));
  }

  function updateSelfScore(dimensionId: string, score: number) {
    update({
      selfScores: {
        ...payloadRef.current.selfScores,
        [dimensionId]: score,
      },
    });
  }

  return (
    <div className="essay-editor">
      <div className="essay-requirement">
        <span>文体：{question.genre}</span>
        <span>不少于 {question.minWords} 字{question.maxWords ? `，不超过 ${question.maxWords} 字` : ""}</span>
        <span className={metrics.charCount >= question.minWords ? "ok" : "warn"}>
          已写 {metrics.charCount} 字
        </span>
      </div>

      <textarea
        className="essay-textarea"
        value={payload.text}
        disabled={disabled}
        placeholder="在此写作。段落之间请换行（建议：开头一段、主体两到三段、结尾一段）。"
        rows={12}
        onChange={(event) => update({ text: event.target.value })}
      />

      <div className="essay-rubric">
        <div className="essay-rubric-head">
          <strong>写完自评（{currentSelfScore}/{maxScore} 分）</strong>
          <span>按量表逐维度勾选最符合的一档，提交后与系统分析一起计入得分。</span>
        </div>
        {question.rubric.map((dimension) => {
          const chosen = Number(payload.selfScores[dimension.id]);
          return (
            <div key={dimension.id} className="rubric-dimension">
              <div className="rubric-dimension-head">
                <strong>{dimension.label}</strong>
                <span>{dimension.maxScore} 分</span>
              </div>
              <div className="rubric-levels">
                {dimension.levels.map((level) => (
                  <button
                    key={level.label}
                    type="button"
                    disabled={disabled}
                    className={
                      chosen === level.score ? "rubric-level active" : "rubric-level"
                    }
                    title={dimension.hints?.[dimension.levels.indexOf(level)]}
                    onClick={() => updateSelfScore(dimension.id, level.score)}
                  >
                    {level.label} · {level.score} 分
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [playCount, setPlayCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const speechAvailable = isSpeechSupported();

  function handleAnswer(nextValue: string) {
    if (!value && onFirstInteraction) {
      onFirstInteraction(question.id);
    }
    onChange(nextValue);
  }

  async function playListening() {
    if (!question.listeningScript || playing) return;
    setPlaying(true);
    setPlayCount((count) => count + 1);
    await speakEnglish(question.listeningScript);
    setPlaying(false);
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

      {question.diagram && (
        <pre className="question-diagram">{question.diagram}</pre>
      )}

      {question.listeningScript && (
        <div className="listening-bar">
          <button
            className="primary"
            type="button"
            onClick={playListening}
            disabled={!speechAvailable || playing}
            title={speechAvailable ? "" : "当前浏览器不支持语音朗读"}
          >
            {playing ? "正在播放…" : "▶ 播放听力"}
          </button>
          <span>
            {speechAvailable
              ? `已播放 ${playCount} 次${playCount < 2 ? "（中考每段材料读两遍，建议最多听两遍）" : ""}`
              : "当前浏览器不支持语音朗读，可参考提交后的听力原文。"}
          </span>
        </div>
      )}

      {question.type === "essay" ? (
        <EssayEditor
          question={question}
          value={value}
          disabled={hasSubmitted}
          onChange={handleAnswer}
        />
      ) : question.type === "short-answer" ? (
        <textarea
          className="answer-textarea"
          value={value}
          disabled={hasSubmitted}
          placeholder="写出你的答案（按要点给分，意思对即可，不必逐字对应）"
          rows={3}
          onChange={(event) => handleAnswer(event.target.value)}
        />
      ) : question.type === "solution" ? (        <div className="solution-steps">
          {question.steps.map((step, index) => {
            let stepAnswers: string[] = [];
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) stepAnswers = parsed.map(String);
            } catch {
              stepAnswers = [];
            }
            const stepValue = stepAnswers[index] ?? "";

            return (
              <div className="solution-step" key={index}>
                <span className="solution-step-label">
                  {"①②③④⑤⑥⑦⑧⑨"[index] ?? `第${index + 1}步`}
                </span>
                <span className="solution-step-prompt">
                  <MathText text={step.prompt} />
                </span>
                <input
                  className="answer-input"
                  value={stepValue}
                  disabled={hasSubmitted}
                  placeholder={`第 ${index + 1} 步答案（数值）`}
                  onChange={(event) => {
                    const next = [...stepAnswers];
                    while (next.length < question.steps.length) next.push("");
                    next[index] = event.target.value;
                    handleAnswer(JSON.stringify(next));
                  }}
                />
              </div>
            );
          })}
          <p className="solution-hint">解答题：请按步骤填入每步的数值结果，提交后可对照解析中的完整过程。</p>
        </div>
      ) : question.type === "single-choice" || question.type === "multi-choice" ? (
        <div className="option-list">
          {question.options.map((option) =>
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
          )}
        </div>
      ) : (
        <input
          className="answer-input"
          value={value}
          disabled={hasSubmitted}
          placeholder="输入答案"
          onChange={(event) => handleAnswer(event.target.value)}
        />
      )}

      {hasSubmitted && result && (
        <div className="feedback">
          <div>
            <strong>你的答案：</strong>
            {question.type === "essay" ? (
              <span>
                {parseEssayAnswer(result.userAnswer).text.trim()
                  ? `已提交作文（${analyzeEssayText(parseEssayAnswer(result.userAnswer).text).charCount} 字，自评 ${result.score}/${result.maxScore} 分）`
                  : "未作答"}
              </span>
            ) : result.userAnswer ? (
              <MathText text={result.userAnswer} />
            ) : (
              "未作答"
            )}
          </div>
          <div>
            <strong>{question.type === "essay" ? "评分维度：" : "正确答案："}</strong>
            <MathText text={result.correctAnswer} />
          </div>

          {question.type === "essay" && (
            <EssayEssayFeedback question={question} rawAnswer={result.userAnswer} />
          )}

          {question.type === "short-answer" && result.status !== "correct" && (
            <div className="optimal">
              <strong>得分要点：</strong>
              {question.keyPoints.map((keyPoint) => `${keyPoint.label}（${keyPoint.score} 分）`).join("；")}
            </div>
          )}

          {question.listeningScript && (
            <div className="listening-script">
              <strong>听力原文：</strong>
              <p>{question.listeningScript}</p>
            </div>
          )}

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

function EssayEssayFeedback({
  question,
  rawAnswer,
}: {
  question: EssayQuestion;
  rawAnswer: string;
}) {
  const payload = parseEssayAnswer(rawAnswer);
  const metrics = analyzeEssayText(payload.text);
  const checks = [
    {
      ok: metrics.charCount >= question.minWords,
      label: `字数 ${metrics.charCount}/${question.minWords}`,
    },
    {
      ok: metrics.meetsParagraphExpectation,
      label: `段落 ${metrics.paragraphCount} 段（建议 ≥3 段）`,
    },
    {
      ok: metrics.transitionHits.length > 0,
      label:
        metrics.transitionHits.length > 0
          ? `过渡词：${metrics.transitionHits.join("、")}`
          : "未检测到过渡词（首先 / 然而 / 总之 等）",
    },
  ];

  return (
    <div className="essay-feedback">
      <div className="essay-auto-checks">
        {checks.map((check) => (
          <span key={check.label} className={check.ok ? "ok" : "warn"}>
            {check.ok ? "✓" : "△"} {check.label}
          </span>
        ))}
      </div>
      <div>
        <strong>写作要点：</strong>
        <ul className="lesson-list">
          {question.outlineHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>
      {question.sampleEssay && (
        <div className="optimal">
          <strong>范文：</strong>
          <p className="sample-essay">{question.sampleEssay}</p>
        </div>
      )}
    </div>
  );
}
