import { useMemo, useState } from "react";
import referenceContent from "../data/reference.json";
import MathText from "../components/MathText";
import type { ReferenceSubject, Subject } from "../types";

const sheets = referenceContent.subjects as ReferenceSubject[];

interface ReferenceProps {
  subject: Subject;
}

export default function Reference({ subject }: ReferenceProps) {
  const [keyword, setKeyword] = useState("");

  const sheet = sheets.find((item) => item.subject === subject);

  const keywordLower = keyword.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!sheet) return [];
    if (!keywordLower) return sheet.groups;

    return sheet.groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(keywordLower) ||
            item.expression.toLowerCase().includes(keywordLower) ||
            (item.note ?? "").toLowerCase().includes(keywordLower)
        ),
      }))
      .filter((group) => group.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordLower, subject]);

  const totalItems = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.items.length, 0),
    [filteredGroups]
  );

  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>速查表</h1>
          <p>数学 / 物理 / 化学核心原理、公式与口诀，支持关键字快速检索。</p>
        </div>
      </div>

      {sheet ? (
        <>
          <div className="ref-toolbar">
            <input
              className="ref-search"
              type="search"
              placeholder="输入关键字快速查找，如：勾股、欧姆、化合价…"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <span className="count-badge">
              {totalItems} 条
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="panel">
              <p>未找到与“{keyword}”相关的条目，换个关键字试试。</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <article className="panel ref-group" key={group.title}>
                <div className="section-head">
                  <h2>{group.title}</h2>
                  <span className="count-badge">{group.items.length}</span>
                </div>
                <ul className="ref-list">
                  {group.items.map((item) => (
                    <li className="ref-item" key={item.name}>
                      <strong>{item.name}</strong>
                      <div className="ref-expression">
                        <MathText text={item.expression} />
                      </div>
                      {item.note && <span className="ref-note">{item.note}</span>}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </>
      ) : (
        <div className="panel">
          <p>速查表目前覆盖数学 / 物理 / 化学三个学科，请切换学科后查看。</p>
        </div>
      )}
    </section>
  );
}
