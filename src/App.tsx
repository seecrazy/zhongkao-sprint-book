import { useEffect, useState } from "react";
import Layout, { type PageKey } from "./components/Layout";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import Practice from "./pages/Practice";
import Mistakes from "./pages/Mistakes";
import Settings from "./pages/Settings";
import { loadProgress, saveProgress } from "./lib/storage";
import type { ProgressState } from "./types";

const pageKeys = ["home", "topics", "practice", "mistakes", "settings"] as const;

function readHashPage(): PageKey {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return pageKeys.includes(hash as PageKey) ? (hash as PageKey) : "home";
}

export default function App() {
  const [page, setPage] = useState<PageKey>(() => readHashPage());
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    function handleHashChange() {
      setPage(readHashPage());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(nextPage: PageKey) {
    if (readHashPage() !== nextPage) {
      window.location.hash = `/${nextPage}`;
    }
    setPage(nextPage);
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === "home" && <Home progress={progress} onNavigate={navigate} />}
      {page === "topics" && <Topics progress={progress} />}
      {page === "practice" && <Practice progress={progress} setProgress={setProgress} />}
      {page === "mistakes" && <Mistakes progress={progress} />}
      {page === "settings" && <Settings progress={progress} setProgress={setProgress} />}
    </Layout>
  );
}
