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

function parseHash(): {
  page: PageKey;
  query: URLSearchParams;
} {
  const rawHash = window.location.hash.replace(/^#\/?/, "");
  const [rawPage, rawQuery = ""] = rawHash.split("?");
  const page = pageKeys.includes(rawPage as PageKey)
    ? (rawPage as PageKey)
    : "home";
  return {
    page,
    query: new URLSearchParams(rawQuery),
  };
}

export default function App() {
  const initialRoute = parseHash();
  const [page, setPage] = useState<PageKey>(initialRoute.page);
  const [query, setQuery] = useState(() => initialRoute.query);
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    function handleHashChange() {
      const route = parseHash();
      setPage(route.page);
      setQuery(route.query);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(
    nextPage: PageKey,
    nextQuery?: Record<string, string>
  ) {
    const search = new URLSearchParams(nextQuery ?? {}).toString();
    const nextHash = `/${nextPage}${search ? `?${search}` : ""}`;

    if (window.location.hash.replace(/^#/, "") !== nextHash) {
      window.location.hash = nextHash;
    }
    setQuery(new URLSearchParams(nextQuery ?? {}));
    setPage(nextPage);
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === "home" && <Home progress={progress} onNavigate={navigate} />}
      {page === "topics" && <Topics progress={progress} />}
      {page === "practice" && (
        <Practice
          progress={progress}
          setProgress={setProgress}
          initialTopicId={query.get("topic") ?? "all"}
          initialReviewOnly={query.get("review") === "1"}
        />
      )}
      {page === "mistakes" && <Mistakes progress={progress} onNavigate={navigate} />}
      {page === "settings" && <Settings progress={progress} setProgress={setProgress} />}
    </Layout>
  );
}
