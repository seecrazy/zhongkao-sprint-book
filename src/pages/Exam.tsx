import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { examPapers, sampleQuestions } from "../data/sample-content";
import { knowledgePoints } from "../data/sample-content";
import {
  formatExamClock,
  getExamQuestions,
  getExamRemainingSeconds,
  getExamSuggestions,
  gradeExamPaper,
} from "../lib/exam";
import {
  clearExamHistory,
  loadActiveExam,
  loadExamHistory,
  saveActiveExam,
  saveExamResult,
} from "../lib/exam-storage";
import { recordAttempt } from "../lib/storage";
import QuestionCard from "../components/QuestionCard";
import type {
  ExamResult,
  ExamSession,
  ProgressState,
  Question,
} from "../types";

interface ExamProps {
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
  onNavigate: (page: "practice" | "mistakes" | "topics") => void;
}

type ExamStage = "list" | "active" | "report";

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;
}

export default function Exam({
  progress,
  setProgress,
  onNavigate,
}: ExamProps) {
  const [stage, setStage] = useState<ExamStage>("list");
  const [session, setSession] = useState<ExamSession | null>(() =>
    loadActiveExam()
  );
  const [responses, setResponses] = useState<Record<string, string>>(
    () => loadActiveExam()?.responses ?? {}
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [history, setHistory] = useState<ExamResult[]>(() =>
    loadExamHistory()
  );
  const submittedRef = useRef(false);

  const activePaper = useMemo(
    () => examPapers.find((paper) => paper.id === session?.paperId) ?? null,
    [session]
  );
  const examQuestions = useMemo(
    () => (activePaper ? getExamQuestions(activePaper, sampleQuestions) : []),
    [activePaper]
  );

  const submitExam = useCallback(
    (examSession: ExamSession, autoSubmitted = false) => {
      if (submittedRef.current || !activePaper) return;
      submittedRef.current = true;

      const paperQuestions = getExamQuestions(activePaper, sampleQuestions);
      const submittedAt = new Date().toISOString();
      const examResult = gradeExamPaper({
        paper: activePaper,
        topics: knowledgePoints,
        questions: sampleQuestions,
        responses: examSession.responses,
        startedAt: examSession.startedAt,
        submittedAt,
      });

      let nextProgress = progress;
      const averageTime = Math.round(
        examResult.timeSpentSeconds / Math.max(1, paperQuestions.length)
      );

      examResult.results.forEach((questionResult) => {
        nextProgress = recordAttempt(nextProgress, {
          questionId: questionResult.questionId,
          status: questionResult.status,
          userAnswer: questionResult.userAnswer,
          timeSpentSeconds: averageTime,
        });
      });

      const nextHistory = saveExamResult(examResult);
      setProgress(nextProgress);
      setResult(autoSubmitted ? { ...examResult, paperTitle: `${examResult.paperTitle} · 自动交卷` } : examResult);
      setHistory(nextHistory);
      saveActiveExam(null);
      setSession(null);
      setStage("report");
    },
    [activePaper, progress, setProgress]
  );

  useEffect(() => {
    if (stage !== "active" || !session || !activePaper) return;

    const remaining = getExamRemainingSeconds(activePaper, session.startedAt);
    setRemainingSeconds(remaining);

    if (remaining <= 0) {
      submitExam(session, true);
      return;
    }

    const timer = window.setInterval(() => {
      const nextRemaining = getExamRemainingSeconds(
        activePaper,
        session.startedAt
      );
      setRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0) {
        submitExam(session, true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage, session, activePaper, submitExam]);

  function startExam(paperId: string) {
    submittedRef.current = false;
    const now = new Date();
    const endsAt = new Date(now.getTime() + (examPapers.find((paper) => paper.id === paperId)?.durationMinutes ?? 25) * 60 * 1000);
    const nextSession: ExamSession = {
      paperId,
      startedAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      responses: {},
    };

    setSession(nextSession);
    setResponses({});
    setCurrentIndex(0);
    setResult(null);
    setStage("active");
    saveActiveExam(nextSession);
  }

  function updateResponse(questionId: string, value: string) {
    if (!session) return;

    const nextSession: ExamSession = {
      ...session,
      responses: {
        ...session.responses,
        [questionId]: value,
      },
    };

    setSession(nextSession);
    setResponses(nextSession.responses);
    saveActiveExam(nextSession);
  }

  const currentQuestion: Question | undefined = examQuestions[currentIndex];
  const answeredCount = examQuestions.filter(
    (question) => Boolean(responses[question.id]?.trim())
  ).length;

  if (stage === "active" && session && activePaper && currentQuestion) {
    const lowTime = remainingSeconds <= 60;

    return (
      <section className="page">
        <div className="exam-header">
          <div>
            <span className="eyebrow">限时模考</span>
            <h1>{activePaper.title}</h1>
            <p>{activePaper.description}</p>
          </div>
          <div className={`exam-clock ${lowTime ? "low" : ""}`}>
            <span>剩余时间</span>
            <strong>{formatExamClock(remainingSeconds)}</strong>
          </div>
        </div>

        <div className="exam-layout">
          <div>
            <div className="exam-question-head">
              <span>第 {currentIndex + 1} / {examQuestions.length} 题</span>
              <span>{currentQuestion.displayType}</span>
              <span>难度 {"★".repeat(currentQuestion.difficulty)}</span>
            </div>

            <QuestionCard
              index={currentIndex + 1}
              question={currentQuestion}
              value={responses[currentQuestion.id] ?? ""}
              hasSubmitted={false}
              onChange={(value) => updateResponse(currentQuestion.id, value)}
            />

            <div className="exam-navigation">
              <button
                className="ghost"
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              >
                上一题
              </button>
              {currentIndex === examQuestions.length - 1 ? (
                <button
                  className="primary"
                  type="button"
                  onClick={() => submitExam(session)}
                >
                  交卷
                </button>
              ) : (
                <button
                  className="primary"
                  type="button"
                  onClick={() =>
                    setCurrentIndex((value) =>
                      Math.min(examQuestions.length - 1, value + 1)
                    )
                  }
                >
                  下一题
                </button>
              )}
            </div>
          </div>

          <aside className="exam-sidebar">
            <div className="panel">
              <h2>答题卡</h2>
              <p>
                已答 {answeredCount} / {examQuestions.length}
              </p>
              <div className="answer-grid">
                {examQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    className={`answer-chip ${
                      index === currentIndex ? "current" : ""
                    } ${responses[question.id]?.trim() ? "answered" : ""}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                className="primary full-width"
                type="button"
                onClick={() => submitExam(session)}
              >
                立即交卷
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (stage === "report" && result) {
    const scorePercent = Math.round((result.score / result.maxScore) * 100);
    const suggestions = getExamSuggestions(result);

    return (
      <section className="page">
        <div className="section-head">
          <div>
            <span className="eyebrow">模考报告</span>
            <h1>{result.paperTitle}</h1>
            <p>交卷时间：{new Date(result.submittedAt).toLocaleString("zh-CN")}</p>
          </div>
        </div>

        <div className="hero">
          <div>
            <h2 className="report-score-title">本次得分</h2>
            <p>{scorePercent}% 得分率 · 用时 {formatDuration(result.timeSpentSeconds)}</p>
            <div className="hero-actions">
              <button className="primary" type="button" onClick={() => setStage("list")}>
                返回模考列表
              </button>
              {result.wrongCount + result.skippedCount > 0 && (
                <button
                  className="ghost"
                  type="button"
                  onClick={() => onNavigate("practice")}
                >
                  继续专题练习
                </button>
              )}
            </div>
          </div>
          <div className="hero-card">
            <strong>总分</strong>
            <div className="big-number">
              {result.score}/{result.maxScore}
            </div>
            <span>
              对 {result.correctCount} · 错 {result.wrongCount} · 未答{" "}
              {result.skippedCount}
            </span>
          </div>
        </div>

        <div className="two-column">
          <div className="panel">
            <h2>分考点报告</h2>
            <div className="exam-report-table">
              {result.topicReports.map((report) => {
                const percent = Math.round(
                  (report.score / report.maxScore) * 100
                );
                return (
                  <div key={report.topicId} className="ranking-item">
                    <div>
                      <strong>{report.topicName}</strong>
                      <span>
                        {report.correctCount}/{report.questionCount} 对 · 错{" "}
                        {report.wrongCount} · 未答 {report.skippedCount}
                      </span>
                    </div>
                    <span className="mastery-value">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h2>冲刺建议</h2>
            <ul className="roadmap">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel">
          <h2>逐题结果</h2>
          <div className="question-list">
            {result.results.map((questionResult, index) => {
              const question = sampleQuestions.find(
                (item) => item.id === questionResult.questionId
              );
              if (!question) return null;

              return (
                <QuestionCard
                  key={question.id}
                  index={index + 1}
                  question={question}
                  value={questionResult.userAnswer}
                  result={questionResult}
                  hasSubmitted
                  onChange={() => undefined}
                />
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>限时模考</h1>
          <p>整卷作答、倒计时、答题卡、自动交卷和分考点报告。</p>
        </div>
      </div>

      <div className="exam-list">
        {examPapers.map((paper) => {
          const questionCount = paper.questionIds.length;
          const hasSession = session?.paperId === paper.id;

          return (
            <article key={paper.id} className="topic-card">
              <div className="topic-top">
                <h2>{paper.title}</h2>
                <span className="tag high">{paper.durationMinutes} 分钟</span>
              </div>
              <p>{paper.description}</p>
              <div className="topic-meta">
                <span>{questionCount} 题</span>
                <span>总分 {questionCount * paper.scorePerQuestion}</span>
              </div>
              <button
                className="primary"
                type="button"
                onClick={() => startExam(paper.id)}
              >
                {hasSession ? "继续作答" : "开始考试"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="panel">
        <div className="section-head">
          <h2>最近成绩</h2>
          {history.length > 0 && (
            <button
              className="ghost"
              type="button"
              onClick={() => setHistory(clearExamHistory())}
            >
              清空成绩
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p>还没有模考记录。完成整卷后，这里会保留最近 20 次成绩。</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="ranking-item">
                <div>
                  <strong>{item.paperTitle}</strong>
                  <span>
                    {new Date(item.submittedAt).toLocaleString("zh-CN")} · 用时{" "}
                    {formatDuration(item.timeSpentSeconds)}
                  </span>
                </div>
                <span className="mastery-value">
                  {item.score}/{item.maxScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>本卷考点</h2>
        <div className="topic-preview">
          {knowledgePoints.map((point) => {
            const count = examPapers[0].questionIds.filter((questionId) =>
              sampleQuestions.find(
                (question) =>
                  question.id === questionId &&
                  question.knowledgePointIds.includes(point.id)
              )
            ).length;

            if (count === 0) return null;

            return (
              <span key={point.id} className="tag medium">
                {point.name} · {count}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
