import { sampleQuestions } from "../data/sample-content";
import { getCorrectAnswerText } from "../lib/grading";
import type { ProgressState } from "../types";

interface MistakesProps {
  progress: ProgressState;
}

export default function Mistakes({ progress }: MistakesProps) {
  const mistakes = Object.values(progress.mistakes).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>错题本</h1>
          <p>错题会在本地浏览器中保存，后续将加入间隔复习和错因分类。</p>
        </div>
        <span className="count-badge">{mistakes.length} 题</span>
      </div>

      {mistakes.length === 0 ? (
        <div className="empty">
          <strong>还没有错题</strong>
          <p>完成一组练习后，错误或未作答的题目会自动出现在这里。</p>
        </div>
      ) : (
        <div className="mistake-list">
          {mistakes.map((mistake) => {
            const question = sampleQuestions.find(
              (item) => item.id === mistake.questionId
            );

            if (!question) return null;

            return (
              <article key={question.id} className="mistake-card">
                <div className="question-meta">
                  <span>{question.displayType}</span>
                  <span>错误 {mistake.wrongCount} 次</span>
                  <span>待巩固</span>
                </div>
                <h2>{question.stem}</h2>
                <p>
                  <strong>正确答案：</strong>
                  {getCorrectAnswerText(question)}
                </p>
                <p>{question.explanation}</p>
                {question.commonMistake && (
                  <p className="warning">
                    <strong>常见错误：</strong>
                    {question.commonMistake}
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
