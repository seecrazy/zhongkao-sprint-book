import katex from "katex";
import type { ReactNode } from "react";

interface MathTextProps {
  text: string;
  className?: string;
}

const MATH_PATTERN = /\$([^$]+)\$/g;

export default function MathText({ text, className }: MathTextProps) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  MATH_PATTERN.lastIndex = 0;

  while ((match = MATH_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`text-${key}`}>{text.slice(lastIndex, match.index)}</span>);
      key += 1;
    }

    const latex = match[1].trim();
    const html = katex.renderToString(latex, {
      throwOnError: false,
      output: "html",
      strict: false,
    });

    nodes.push(
      <span
        key={`math-${key}`}
        className="math-expression"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
    key += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${key}`}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{nodes}</span>;
}
