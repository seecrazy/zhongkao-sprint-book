import { useEffect, useState } from "react";
import Layout, { type PageKey } from "./components/Layout";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import Mistakes from "./pages/Mistakes";
import Settings from "./pages/Settings";
import { loadProgress, saveProgress } from "./lib/storage";
import { isAvailableSubject } from "./data/sample-content";
import type { ProgressState, Subject } from "./types";

const pageKeys = [
  "home",
  "topics",
  "practice",
  "exam",
  "mistakes",
  "settings",
] as const;

function parseHash(): {
  subject: Subject;
  page: PageKey;
  query: URLSearchParams;
} {
  const rawHash = window.location.hash.replace(/^#\/?/, "");
  const [rawPath, rawQuery = ""] = rawHash.split("?");
  const segments = rawPath.split("/").filter(Boolean);

  let subject: Subject = "math";
  let rawPage = segments[0] ?? "";

  // 新格式 #/math/practice；旧格式 #/practice 兼容为数学。
  if (segments.length >= 2 && isAvailableSubject(segments[0])) {
    subject = segments[0];
    rawPage = segments[1] ?? "";
  }

  const page = pageKeys.includes(rawPage as PageKey)
    ? (rawPage as PageKey)
    : "home";
  return {
    subject,
    page,
    query: new URLSearchParams(rawQuery),
  };
}

export default function App() {
  const initialRoute = parseHash();
  const [subject, setSubject] = useState<Subject>(initialRoute.subject);
  const [page, setPage] = useState<PageKey>(initialRoute.page);
  const [query, setQuery] = useState(() => initialRoute.query);
  const [progress, setProgress] = useState<ProgressState>(() =>
    loadProgress(initialRoute.subject)
  );

  useEffect(() => {
    saveProgress(subject, progress);
  }, [subject, progress]);

  useEffect(() => {
    function handleHashChange() {
      const route = parseHash();
      setSubject(route.subject);
      setPage(route.page);
      setQuery(route.query);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(
    nextSubject: Subject,
    nextPage: PageKey,
    nextQuery?: Record<string, string>
  ) {
    const search = new URLSearchParams(nextQuery ?? {}).toString();
    const nextHash = `/${nextSubject}/${nextPage}${search ? `?${search}` : ""}`;

    if (window.location.hash.replace(/^#/, "") !== nextHash) {
      window.location.hash = nextHash;
    }
    setQuery(new URLSearchParams(nextQuery ?? {}));
    setSubject(nextSubject);
    setPage(nextPage);
  }

  function switchSubject(nextSubject: Subject) {
    if (nextSubject === subject) return;

    setSubject(nextSubject);
    setProgress(loadProgress(nextSubject));

    const nextHash = `/${nextSubject}/${page}`;
    setQuery(new URLSearchParams());
    if (window.location.hash.replace(/^#/, "") !== nextHash) {
      window.location.hash = nextHash;
    }
  }

  return (
    <Layout
      subject={subject}
      page={page}
      onNavigate={(nextPage, nextQuery) => navigate(subject, nextPage, nextQuery)}
      onSwitchSubject={switchSubject}
    >
      {page === "home" && (
        <Home
          key={subject}
          subject={subject}
          progress={progress}
          setProgress={setProgress}
          onNavigate={(nextPage, nextQuery) =>
            navigate(subject, nextPage, nextQuery)
          }
        />
      )}
      {page === "topics" && (
        <Topics
          key={subject}
          subject={subject}
          progress={progress}
          onNavigate={(nextPage, nextQuery) =>
            navigate(subject, nextPage, nextQuery)
          }
        />
      )}
      {page === "practice" && (
        <Practice
          key={subject}
          subject={subject}
          progress={progress}
          setProgress={setProgress}
          initialTopicId={query.get("topic") ?? "all"}
          initialReviewOnly={query.get("review") === "1"}
        />
      )}
      {page === "exam" && (
        <Exam
          key={subject}
          subject={subject}
          progress={progress}
          setProgress={setProgress}
          onNavigate={(nextPage, nextQuery) =>
            navigate(subject, nextPage, nextQuery)
          }
        />
      )}
      {page === "mistakes" && (
        <Mistakes
          key={subject}
          subject={subject}
          progress={progress}
          onNavigate={(nextPage, nextQuery) =>
            navigate(subject, nextPage, nextQuery)
          }
        />
      )}
      {page === "settings" && (
        <Settings
          key={subject}
          subject={subject}
          progress={progress}
          setProgress={setProgress}
        />
      )}
    </Layout>
  );
}
