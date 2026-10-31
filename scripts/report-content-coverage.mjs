import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const contentDir = path.resolve("src/data");

function unique(values) {
  return [...new Set(values)];
}

function getDifficultyLabel(difficulty) {
  if (difficulty <= 2) return "基础";
  if (difficulty === 3) return "中等";
  return "较难";
}

async function main() {
  const files = (await readdir(contentDir))
    .filter((file) => file.endsWith(".json"))
    .sort();

  const allKnowledgePoints = [];
  const allQuestions = [];

  for (const file of files) {
    const content = JSON.parse(await readFile(path.join(contentDir, file), "utf8"));
    content.knowledgePoints?.forEach((point) => {
      allKnowledgePoints.push({ ...point, file });
    });
    content.questions?.forEach((question) => {
      allQuestions.push({ ...question, file });
    });
  }

  const coverage = allKnowledgePoints.map((point) => {
    const questions = allQuestions.filter((question) =>
      question.knowledgePointIds?.includes(point.id)
    );
    const types = unique(questions.map((question) => question.type));
    const difficulties = unique(
      questions.map((question) => getDifficultyLabel(question.difficulty))
    );

    return {
      id: point.id,
      name: point.name,
      weight: point.examWeight,
      count: questions.length,
      types,
      difficulties,
      missing: [],
    };
  });

  coverage.forEach((row) => {
    if (row.count === 0) {
      row.missing.push("题目");
    }
    if (row.count > 0 && row.types.length < 2) {
      row.missing.push("题型多样性");
    }
    if (row.weight === "high" && row.difficulties.length < 2) {
      row.missing.push("难度分层");
    }
  });

  const difficultyTotals = {
    基础: allQuestions.filter((question) => question.difficulty <= 2).length,
    中等: allQuestions.filter((question) => question.difficulty === 3).length,
    较难: allQuestions.filter((question) => question.difficulty >= 4).length,
  };
  const typeTotals = allQuestions.reduce((totals, question) => {
    totals[question.type] = (totals[question.type] ?? 0) + 1;
    return totals;
  }, {});

  console.log("=== 中考冲刺书内容覆盖率报告 ===");
  console.log(`学科内容文件：${files.length}`);
  console.log(`知识点：${allKnowledgePoints.length}`);
  console.log(`题目：${allQuestions.length}`);
  console.log(`难度分布：${JSON.stringify(difficultyTotals)}`);
  console.log(`题型分布：${JSON.stringify(typeTotals, null, 2)}`);
  console.log("\n考点明细：");

  coverage.forEach((row) => {
    const status = row.missing.length === 0 ? "✅" : "⚠️";
    console.log(
      `${status} ${row.name} · ${row.count} 题 · 题型 ${row.types.length} · 难度 ${row.difficulties.join("/")}` +
        (row.missing.length ? ` · 待补：${row.missing.join("、")}` : "")
    );
  });

  const covered = coverage.filter((row) => row.count > 0).length;
  const healthy = coverage.filter((row) => row.missing.length === 0).length;
  console.log(`\n题目覆盖：${covered}/${coverage.length}`);
  console.log(`结构健康：${healthy}/${coverage.length}`);

}

await main();
