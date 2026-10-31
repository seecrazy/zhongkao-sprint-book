import type { ProgressState } from "../types";

interface SettingsProps {
  progress: ProgressState;
  setProgress: (progress: ProgressState) => void;
}

export default function Settings({ progress, setProgress }: SettingsProps) {
  function resetProgress() {
    if (!window.confirm("确定要清空本地学习进度和错题本吗？")) return;

    setProgress({
      completedQuestionIds: [],
      mistakes: {},
    });
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
          {Object.keys(progress.mistakes).length} 题。
        </p>
        <button className="danger" type="button" onClick={resetProgress}>
          清空进度和错题本
        </button>
      </div>

      <div className="panel">
        <h2>当前版本</h2>
        <p>SprintBook v0.2 · 数学试点，内容外置与公式渲染已接入。</p>
      </div>
    </section>
  );
}
