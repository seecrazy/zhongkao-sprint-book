import { useEffect, useState } from "react";
import Layout, { type PageKey } from "./components/Layout";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import Practice from "./pages/Practice";
import Mistakes from "./pages/Mistakes";
import Settings from "./pages/Settings";
import { loadProgress, saveProgress } from "./lib/storage";
import type { ProgressState } from "./types";

export default function App() {
  const [page, setPage] = useState<PageKey>("home");
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  return (
    <Layout page={page} onNavigate={setPage}>
      {page === "home" && <Home progress={progress} onNavigate={setPage} />}
      {page === "topics" && <Topics progress={progress} />}
      {page === "practice" && <Practice progress={progress} setProgress={setProgress} />}
      {page === "mistakes" && <Mistakes progress={progress} />}
      {page === "settings" && <Settings progress={progress} setProgress={setProgress} />}
    </Layout>
  );
}
