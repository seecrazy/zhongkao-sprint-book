import type { ProgressState } from "../types";
import { resetProgress } from "../lib/storage";
import { clearExamHistory, saveActiveExam } from "../lib/exam-storage";
import type { Subject } from "../types";

interface SettingsProps {
  subject: Subject;
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
}

export default function Settings({
  subject,
  progress,
  setProgress,
}: SettingsProps) {
  function clearProgress() {
    if (
      !window.confirm(
        "确定要清空当前学科的学习进度、错题本和模考记录吗？"
      )
    )
      return;

    clearExamHistory(subject);
    saveActiveExam(subject, null);
    setProgress(resetProgress());
  }

  return (
    <section className="page">
      <div className="section-head">
        <h1>设置</h1>
      </div>

      <div className="panel">
        <h2>本地学习记录</h2>
        <p>
          当前进度保存在浏览器 localStorage 中，不会上传到服务器。已完成{" "}
          {progress.completedQuestionIds.length} 题，错题{" "}
          {Object.keys(progress.mistakes).length} 题，作答记录{" "}
          {progress.attempts.length} 条。
        </p>
        <button className="danger" type="button" onClick={clearProgress}>
          清空进度和错题本
        </button>
      </div>

      <div className="panel">
        <h2>当前版本</h2>
        <p>SprintBook v0.9 · 多学科试点，掌握度与错题间隔复习已接入。</p>
      </div>
    </section>
  );
}
