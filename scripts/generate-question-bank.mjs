// 题库生成器（v0.15）：确定性生成参数化变式题 + 事实表出题 + 试卷组装
// 用法：node scripts/generate-question-bank.mjs
// 结果稳定：固定种子，重复运行产生相同 ID 与内容。
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = path.resolve("src/data");
let seed = 20260101;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function rint(min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n) { return shuffle(arr).slice(0, n); }

const banks = new Map(); // subject -> question[]
const banksMeta = new Map();
function bank(subject) {
  if (!banks.has(subject)) { banks.set(subject, []); banksMeta.set(subject, new Set()); }
  return banks.get(subject);
}
let seq = 0;
function add(subject, q) {
  const b = bank(subject);
  if (b.some(x => x.id === q.id)) return false;
  b.push({ subject, ...q });
  return true;
}
let gid = 0;
function genId(s) { gid += 1; return `gen-${s}-${String(gid).padStart(4, "0")}`; }

function q(subject, o) {
  return add(subject, {
    estimatedSeconds: 70, source: "题库生成 · 变式训练",
    optimalSolution: undefined, commonMistake: undefined,
    ...o,
  });
}
const JR = (o) => o; // marker

// ============ 手写题库并入题池（模拟卷可覆盖手写 + 生成全池） ============
const handFiles = { math: "math.json", physics: "physics.json", chemistry: "chemistry.json", english: "english.json", chinese: "chinese.json" };
for (const [subject, file] of Object.entries(handFiles)) {
  const data = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
  for (const qz of data.questions) add(subject, qz);
}

// ============ 数学 ============
const M = "math";
const JR_M = null;

// 1. 一元二次方程（因式分解型）(math-equation-quadratic)
{
  const existing = 4, need = Math.max(20 - existing, 12);
  for (let i = 0; i < need; i++) {
    const r1 = rint(-6, 6), r2 = rint(-6, 6);
    if (r1 === r2) { i--; continue; }
    const b = -(r1 + r2), c = r1 * r2;
    const bS = b >= 0 ? `+${b}` : b, cS = c >= 0 ? `+${c}` : c;
    if (i % 5 < 3) {
      q(M, {
        id: genId("m"), knowledgePointIds: ["math-equation-quadratic"],
        displayType: "填空题", type: "expression", difficulty: 2 + (i % 2), estimatedSeconds: 90,
        stem: `解方程：$x^2 ${bS}x ${cS} = 0$。请写出全部解。`,
        acceptedAnswers: [`x=${r1} 或 x=${r2}`, `x=${r2} 或 x=${r1}`, `x1=${r1}，x2=${r2}`, `x1=${r2}，x2=${r1}`, `x=${r1},${r2}`],
        answerKind: "solution-set",
        explanation: `因式分解：$(x${r1 >= 0 ? "-" + r1 : "+" + (-r1)})(x${r2 >= 0 ? "-" + r2 : "+" + (-r2)})=0$，所以 $x=${r1}$ 或 $x=${r2}$。`,
      });
    } else {
      const big = Math.max(r1, r2), small = Math.min(r1, r2);
      q(M, {
        id: genId("m"), knowledgePointIds: ["math-equation-quadratic"],
        displayType: "解答题", type: "numeric", difficulty: 3, estimatedSeconds: 120,
        stem: `解答题：解方程 $x^2 ${bS}x ${cS} = 0$，并求较大的根。`,
        answer: big,
        explanation: `【解答过程】分解因式：$(x${small >= 0 ? "-" + small : "+" + (-small)})(x${big >= 0 ? "-" + big : "+" + (-big)})=0$，得 $x=${small}$ 或 $x=${big}$，较大的根为 $x=${big}$。`,
        commonMistake: "漏解或符号错误。",
      });
    }
  }
}

// 2. 一元一次不等式 (math-inequality)
{
  const need = Math.max(20 - 2, 12);
  for (let i = 0; i < need; i++) {
    const a = rint(2, 5), b = rint(-9, 9), c = rint(-6, 12);
    const rhs = (c - b) / a;
    if (!Number.isInteger(rhs)) { i--; continue; }
    q(M, {
      id: genId("m"), knowledgePointIds: ["math-inequality"],
      displayType: i % 2 === 0 ? "解答题" : "填空题", type: "numeric", difficulty: 2 + (i % 2), estimatedSeconds: 90,
      stem: `解不等式 $${a}x ${b >= 0 ? "+" + b : b} > ${c}$，则 $x$ 的最小整数解是 ______。`,
      answer: rhs + 1,
      explanation: `【解答过程】移项：$${a}x > ${c} ${-b >= 0 ? "+" + (-b) : -b}$，即 $${a}x > ${c - b}$。两边除以 ${a}（正数，不等号方向不变）：$x > ${rhs}$。最小整数解为 $x=${rhs + 1}$。`,
    });
  }
}

// 3. 因式分解 (math-algebra-factor)
{
  const need = Math.max(20 - 3, 12);
  for (let i = 0; i < need; i++) {
    const k = rint(2, 9);
    if (i % 2 === 0) {
      q(M, {
        id: genId("m"), knowledgePointIds: ["math-algebra-factor"],
        displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 70,
        stem: `因式分解：$x^2 - ${k * k} = $ ______。`,
        acceptedAnswers: [`(x+${k})(x-${k})`, `(x-${k})(x+${k})`],
        answerKind: "text",
        explanation: `平方差公式：$x^2-${k * k}=(x+${k})(x-${k})$。`,
      });
    } else {
      const a = rint(2, 6);
      q(M, {
        id: genId("m"), knowledgePointIds: ["math-algebra-factor"],
        displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 70,
        stem: `因式分解：$${a}x + ${a * rint(2, 8)} = $ ______。（提公因式，按 $${a}(x+n)$ 形式作答）`,
        acceptedAnswers: [`${a}(x+n)`],
        answerKind: "text",
        explanation: `提公因式 ${a}。`,
      });
    }
  }
}

// 4. 实数运算 (math-number-real)
{
  const need = 18;
  for (let i = 0; i < need; i++) {
    const s = pick([4, 9, 16, 25, 36, 49, 64, 81]);
    const m = rint(1, 9), p = rint(1, 6);
    const ans = Math.sqrt(s) + m - p * p;
    q(M, {
      id: genId("m"), knowledgePointIds: ["math-number-real"],
      displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `计算：$\\sqrt{${s}} + |-${m}| - ${p}^2 = $ ______。`,
      answer: ans,
      explanation: `【解答过程】$\\sqrt{${s}}=${Math.sqrt(s)}$，$|-${m}|=${m}$，$${p}^2=${p * p}$；所以原式 $=${Math.sqrt(s)}+${m}-${p * p}=${ans}$。`,
    });
  }
}

// 5. 统计 (math-statistics-average)
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const nums = [];
    let sum = 0;
    for (let j = 0; j < 5; j++) { const n = rint(1, 20); nums.push(n); sum += n; }
    const sixth = (6 - (sum % 6)) + 6 * rint(0, 2);
    nums.push(sixth);
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = (sum + sixth) / 6;
    const kind = i % 3;
    if (kind === 0) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-statistics-average"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `数据 $${nums.join("，")}$ 的平均数是 ______。`, answer: mean,
        explanation: `【解答过程】总和 $=${nums.join("+")}=${sum + sixth}$，平均数 $=${sum + sixth}\\div6=${mean}$。` });
    } else if (kind === 1) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-statistics-average"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `数据 $${nums.join("，")}$ 从小到大排列后的中位数是 ______。`, answer: (sorted[2] + sorted[3]) / 2,
        explanation: `【解答过程】排序：$${sorted.join("，")}$；中间两个数是 $${sorted[2]}$ 和 $${sorted[3]}$，中位数 $=\\dfrac{${sorted[2]}+${sorted[3]}}{2}=${(sorted[2] + sorted[3]) / 2}$。` });
    } else {
      const mode = sorted[3];
      q(M, { id: genId("m"), knowledgePointIds: ["math-statistics-average"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `数据 $${nums.join("，")}$ 的众数是 ______。`, answer: mode,
        explanation: `【解答过程】出现次数最多的数据是 $${mode}$，故众数为 $${mode}$。` });
    }
  }
}

// 6. 概率 (math-probability-basic)
{
  const need = 18;
  for (let i = 0; i < need; i++) {
    const r = rint(1, 6), w = rint(1, 6);
    const total = r + w;
    const g = (a, b) => (b === 0 ? a : g(b, a % b));
    const gcd = g(r, total);
    const frac = `${r / gcd}/${total / gcd}`;
    q(M, {
      id: genId("m"), knowledgePointIds: ["math-probability-basic"],
      displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 60,
      stem: `袋中有 $${r}$ 个红球和 $${w}$ 个白球，除颜色外完全相同，随机摸出一个球，摸到红球的概率是 ______。（用最简分数作答）`,
      acceptedAnswers: [frac, `${(r / total).toFixed(2)}`],
      answerKind: "text",
      explanation: `【解答过程】共有 $${total}$ 种等可能结果，红球 $${r}$ 个，$P=\\dfrac{${r}}{${total}}=${frac}$。`,
    });
  }
}

// 7. 一次函数 (math-function-linear)
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const k = rint(-4, 4) || 2, b = rint(-5, 5), x = rint(-4, 6);
    const y = k * x + b;
    q(M, {
      id: genId("m"), knowledgePointIds: ["math-function-linear"],
      displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `一次函数 $y = ${k === 1 ? "" : k === -1 ? "-" : k}x ${b >= 0 ? "+" + b : b}$ 中，当 $x = ${x}$ 时，$y = $ ______。`,
      answer: y,
      explanation: `【解答过程】代入 $x=${x}$：$y=${k}\\times${x}${b >= 0 ? "+" + b : b}=${k * x}${b >= 0 ? "+" + b : b}=${y}$。`,
    });
  }
}

// 8. 二次函数 (math-function-quadratic)
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const a = i % 2 === 0 ? 1 : -1, h = rint(-5, 5), k = rint(-6, 6);
    if (i % 2 === 0) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-function-quadratic"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `抛物线 $y=${a}(x${h >= 0 ? "+" + (-h) : "+" + (-h)})^2 ${k >= 0 ? "+" + k : k}$ 的顶点横坐标是 ______。`, answer: h,
        explanation: `【解答过程】顶点式 $y=a(x-h)^2+k$ 的顶点为 $(h,k)$，这里 $h=${h}$。` });
    } else {
      q(M, { id: genId("m"), knowledgePointIds: ["math-function-quadratic"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `抛物线 $y=${a}(x${h >= 0 ? "+" + (-h) : "+" + (-h)})^2 ${k >= 0 ? "+" + k : k}$ 的最值是 ______（最大值或最小值）。`, answer: k,
        explanation: `【解答过程】顶点纵坐标为 $${k}$；$a=${a}${a > 0 ? ">" : "<"}0$，开口${a > 0 ? "向上，有最小值" : "向下，有最大值"}$${k}$。` });
    }
  }
}

// 9. 三角形角度 (math-geometry-triangle)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const a = rint(20, 80), b = rint(20, 80), c = 180 - a - b;
    if (c <= 0) { i--; continue; }
    q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-triangle"], displayType: "填空题", type: "numeric", difficulty: 1, estimatedSeconds: 45,
      stem: `在 $\\triangle ABC$ 中，$\\angle A = ${a}^\\circ$，$\\angle B = ${b}^\\circ$，则 $\\angle C = $ ______ $^\\circ$。`, answer: c,
      explanation: `【解答过程】三角形内角和为 $180^\\circ$：$\\angle C = 180^\\circ-${a}^\\circ-${b}^\\circ=${c}^\\circ$。` });
  }
}

// 9.5 全等 (math-geometry-congruence)
{
  const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
  for (let i = 0; i < 10; i++) {
    const [a, b, c] = triples[i % triples.length];
    q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-congruence"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `$\triangle ABC \cong \triangle DEF$，其中 $AB = ${a}$，$BC = ${b}$，$CA = ${c}$，则 $\triangle DEF$ 的周长是 ______。`, answer: a + b + c,
      explanation: `【解答过程】全等三角形对应边相等：$DE=${a}$，$EF=${b}$，$DF=${c}$，周长 $=${a}+${b}+${c}=${a + b + c}$。` });
  }
  const facts = [
    ["三边分别相等的两个三角形全等（SSS）", true],
    ["两边及其中一边的对角对应相等的两个三角形一定全等", false],
    ["三个角分别相等的两个三角形全等", false],
    ["全等三角形的对应边相等、对应角相等", true],
    ["全等三角形的面积相等", true],
    ["两边及夹角对应相等的两个三角形全等（SAS）", true],
    ["两角及夹边对应相等的两个三角形全等（ASA）", true],
    ["斜边和一条直角边对应相等的两个直角三角形全等（HL）", true],
  ];
  for (const qz of [...factJudge(M, "math-geometry-congruence", facts, "m"), ...factMulti(M, "math-geometry-congruence", facts, "m")]) {
    q(M, qz);
  }
}

// 10. 相似 (math-geometry-similarity)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const k = rint(2, 4), a = rint(2, 9);
    q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-similarity"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `$\\triangle ABC \\sim \\triangle DEF$，相似比为 $1:${k}$。若 $AB = ${a}$，则 $DE = $ ______。`, answer: a * k,
      explanation: `【解答过程】相似比为 $1:${k}$，对应边 $DE = ${a}\\times${k}=${a * k}$。` });
  }
}

// 11. 相交线与平行线 (math-geometry-lines-angles)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const a = rint(30, 85);
    if (i % 2 === 0) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-lines-angles"], displayType: "填空题", type: "numeric", difficulty: 1, estimatedSeconds: 40,
        stem: `两直线相交，其中一个角为 $${a}^\\circ$，则它的对顶角等于 ______ $^\\circ$。`, answer: a,
        explanation: `【解答过程】对顶角相等，故为 $${a}^\\circ$。` });
    } else {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-lines-angles"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `两直线平行，同旁内角之一为 $${a}^\\circ$，则另一角等于 ______ $^\\circ$。`, answer: 180 - a,
        explanation: `【解答过程】两直线平行，同旁内角互补：$180^\\circ-${a}^\\circ=${180 - a}^\\circ$。` });
    }
  }
}

// 12. 四边形 (math-geometry-quadrilateral)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const d1 = rint(2, 6) * 2, d2 = rint(2, 6) * 2;
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-quadrilateral"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `菱形的两条对角线长分别为 $${d1}$ 和 $${d2}$，则它的面积是 ______。`, answer: (d1 * d2) / 2,
        explanation: `【解答过程】$S=\\dfrac{1}{2}d_1d_2=\\dfrac{1}{2}\\times${d1}\\times${d2}=${(d1 * d2) / 2}$。` });
    } else {
      const a = rint(3, 12), b = rint(3, 12);
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-quadrilateral"], displayType: "填空题", type: "numeric", difficulty: 1, estimatedSeconds: 45,
        stem: `平行四边形的两邻边长分别为 $${a}$ 和 $${b}$，则它的周长是 ______。`, answer: 2 * (a + b),
        explanation: `【解答过程】平行四边形对边相等：$C=2(${a}+${b})=${2 * (a + b)}$。` });
    }
  }
}

// 13. 圆 (math-geometry-circle)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const n = pick([60, 90, 120, 150]), r = pick([3, 6]);
      const l = (n * Math.PI * r) / 180, ans = Math.round(l * 100) / 100;
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-circle"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 70,
        stem: `半径为 $${r}$ 的圆中，$${n}^\\circ$ 的圆心角所对弧长约为 ______。（$\\pi$ 取 $3.14$，保留两位小数）`, answer: ans, tolerance: 0.05,
        explanation: `【解答过程】$l=\\dfrac{n\\pi r}{180}=\\dfrac{${n}\\times3.14\\times${r}}{180}\\approx${ans}$。` });
    } else {
      const n = pick([80, 100, 120, 160]);
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-circle"], displayType: "填空题", type: "numeric", difficulty: 1, estimatedSeconds: 40,
        stem: `$\\odot O$ 中，弧 $AB$ 所对圆心角为 $${n}^\\circ$，则弧 $AB$ 所对的圆周角等于 ______ $^\\circ$。`, answer: n / 2,
        explanation: `【解答过程】圆周角等于同弧圆心角的一半：$${n}\\div2=${n / 2}^\\circ$。` });
    }
  }
}

// 14. 勾股 (math-geometry-right-triangle)
{
  const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]];
  const need = 12;
  for (let i = 0; i < need; i++) {
    const [a, b, c] = triples[i % triples.length];
    if (i % 2 === 0) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-right-triangle"], displayType: "填空题", type: "numeric", difficulty: 1, estimatedSeconds: 45,
        stem: `直角三角形的两直角边分别为 $${a}$ 和 $${b}$，则斜边长为 ______。`, answer: c,
        explanation: `【解答过程】$c=\\sqrt{${a}^2+${b}^2}=\\sqrt{${a * a + b * b}}=${c}$。` });
    } else {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-right-triangle"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `直角三角形斜边为 $${c}$，一条直角边为 $${a}$，则另一条直角边长为 ______。`, answer: b,
        explanation: `【解答过程】$\\sqrt{${c}^2-${a}^2}=\\sqrt{${c * c - a * a}}=${b}$。` });
    }
  }
}

// 15. 图形变换 (math-geometry-transformation)
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const x = rint(-6, 6), y = rint(-6, 6), a = rint(1, 5), b = rint(1, 5);
    if (i % 3 === 0) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-transformation"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `点 $P(${x}, ${y})$ 向右平移 $${a}$ 个单位，得到点的横坐标是 ______。`, answer: x + a,
        explanation: `【解答过程】向右平移横坐标加：$${x}+${a}=${x + a}$。` });
    } else if (i % 3 === 1) {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-transformation"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `点 $P(${x}, ${y})$ 关于 $x$ 轴对称的点的纵坐标是 ______。`, answer: -y,
        explanation: `【解答过程】关于 $x$ 轴对称，纵坐标变号：$-${y}=${-y}$。` });
    } else {
      q(M, { id: genId("m"), knowledgePointIds: ["math-geometry-transformation"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `点 $P(${x}, ${y})$ 关于 $y$ 轴对称的点的横坐标是 ______。`, answer: -x,
        explanation: `【解答过程】关于 $y$ 轴对称，横坐标变号：$-${x}=${-x}$。` });
    }
  }
}

// 16. 反比例函数 (math-function-inverse)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const a = rint(1, 9), b = rint(1, 9);
    q(M, { id: genId("m"), knowledgePointIds: ["math-function-inverse"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
      stem: `点 $(${a}, ${b})$ 在反比例函数 $y=\\dfrac{k}{x}$ 的图象上，则 $k=$ ______。`, answer: a * b,
      explanation: `【解答过程】$k=xy=${a}\\times${b}=${a * b}$。` });
  }
}

// 17. 锐角三角函数 (math-trigonometry)
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const hyp = rint(2, 10) * 2;
      q(M, { id: genId("m"), knowledgePointIds: ["math-trigonometry"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `沿坡角为 $30^\\circ$ 的斜坡前进 $${hyp}\\ \\text{m}$，上升的高度是 ______ $\\text{m}$。`, answer: hyp / 2,
        explanation: `【解答过程】$h=${hyp}\\sin30^\\circ=${hyp}\\times\\dfrac{1}{2}=${hyp / 2}\\ \\text{m}$。` });
    } else {
      const d = rint(4, 15);
      q(M, { id: genId("m"), knowledgePointIds: ["math-trigonometry"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: "从观察点测得目标仰角为 $45^\\circ$，目标与观察点水平距离为 $" + d + "\\ \\text{m}$，则目标高度是 ______ $\\text{m}$。",
        answer: d,
        explanation: `【解答过程】$h=d\\tan45^\\circ=${d}\\times1=${d}\\ \\text{m}$。` });
    }
  }
}

// 18. 反比例以上已含；数学完成

// ============ 物理 ============
const P = "physics";
// 运动
{
  const need = 16;
  for (let i = 0; i < need; i++) {
    const v = pick([5, 10, 15, 20, 25]), t = rint(6, 40);
    const s = v * t;
    if (i % 2 === 0) {
      q(P, { id: genId("p"), knowledgePointIds: ["physics-motion-speed"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `一辆汽车做匀速直线运动，$${t}\\ \\text{s}$ 内通过 $${s}\\ \\text{m}$ 的路程，它的速度是 ______ $\\text{m/s}$。`, answer: v,
        explanation: `【解答过程】$v=\\dfrac{s}{t}=\\dfrac{${s}}{${t}}=${v}\\ \\text{m/s}$。` });
    } else {
      q(P, { id: genId("p"), knowledgePointIds: ["physics-motion-speed"], displayType: "计算题", type: "numeric", difficulty: 3, estimatedSeconds: 100,
        stem: `计算题：一辆汽车以 $${v}\\ \\text{m/s}$ 的速度匀速行驶 $${t}\\ \\text{s}$，它通过的路程是多少米？（填数值）`, answer: s,
        explanation: `【解答过程】由 $v=\\dfrac{s}{t}$ 得 $s=vt=${v}\\times${t}=${s}\\ \\text{m}$。` });
    }
  }
}
// 密度
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const rho = pick([0.8, 1.2, 2.7, 7.9]); // g/cm3
    const V = rint(10, 90);
    const m = Math.round(rho * V * 10) / 10;
    q(P, { id: genId("p"), knowledgePointIds: ["physics-mass-density"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 70,
      stem: `一块金属的密度为 $${rho}\\ \\text{g/cm}^3$，体积为 $${V}\\ \\text{cm}^3$，它的质量是 ______ $\\text{g}$。（保留一位小数）`, answer: m, tolerance: 0.1,
      explanation: `【解答过程】$m=\\rho V=${rho}\\times${V}=${m}\\ \\text{g}$。` });
  }
}
// 压强
{
  const need = 16;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const m = rint(2, 20) * 5, S = pick([100, 200, 250, 400, 500]);
      const p = (m * 10) / (S / 10000);
      q(P, { id: genId("p"), knowledgePointIds: ["physics-pressure"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 80,
        stem: `质量为 $${m}\\ \\text{kg}$ 的物体静止在水平地面上，与地面的接触面积为 $${S}\\ \\text{cm}^2$，它对地面的压强是 ______ $\\text{Pa}$。（$g=10\\ \\text{N/kg}$）`, answer: p,
        explanation: `【解答过程】$F=G=mg=${m}\\times10=${m * 10}\\ \\text{N}$；$S=${S}\\ \\text{cm}^2=${S / 10000}\\ \\text{m}^2$；$p=\\dfrac{F}{S}=\\dfrac{${m * 10}}{${S / 10000}}=${p}\\ \\text{Pa}$。` });
    } else {
      const h = pick([0.2, 0.4, 0.5, 0.8, 1, 1.5, 2]);
      const p = 1000 * 10 * h;
      q(P, { id: genId("p"), knowledgePointIds: ["physics-pressure"], displayType: "计算题", type: "numeric", difficulty: 2, estimatedSeconds: 80,
        stem: `计算题：水池中水深 $${h}\\ \\text{m}$ 处水产生的压强是多少帕？（填数值，$\\rho_{水}=10^3\\ \\text{kg/m}^3$，$g=10\\ \\text{N/kg}$）`, answer: p,
        explanation: `【解答过程】$p=\\rho gh=10^3\\times10\\times${h}=${p}\\ \\text{Pa}$。` });
    }
  }
}
// 欧姆
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const U = pick([3, 6, 9, 12]), R = pick([5, 10, 15, 20, 30]);
    const I = Math.round((U / R) * 100) / 100;
    q(P, { id: genId("p"), knowledgePointIds: ["physics-ohm-law"], displayType: i % 2 === 0 ? "填空题" : "计算题", type: "numeric", difficulty: 2, estimatedSeconds: 70,
      stem: `电阻 $R=${R}\\ \\Omega$ 两端电压为 $${U}\\ \\text{V}$，通过它的电流是 ______ $\\text{A}$。`, answer: I, tolerance: 0.01,
      explanation: `【解答过程】$I=\\dfrac{U}{R}=\\dfrac{${U}}{${R}}=${I}\\ \\text{A}$。` });
  }
}
// 电功率
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const U = 220, I = pick([0.2, 0.3, 0.45, 0.5, 0.8, 1]);
      q(P, { id: genId("p"), knowledgePointIds: ["physics-electric-power"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `一用电器接在 $220\\ \\text{V}$ 电路中，正常工作电流为 $${I}\\ \\text{A}$，它的电功率是 ______ $\\text{W}$。`, answer: Math.round(220 * I * 10) / 10,
        explanation: `【解答过程】$P=UI=220\\times${I}=${Math.round(220 * I * 10) / 10}\\ \\text{W}$。` });
    } else {
      const w = pick([100, 200, 500, 800, 1000, 1500]), t = rint(1, 10);
      const kWh = (w * t) / 1000;
      q(P, { id: genId("p"), knowledgePointIds: ["physics-electric-power"], displayType: "计算题", type: "numeric", difficulty: 3, estimatedSeconds: 90,
        stem: `计算题：功率为 $${w}\\ \\text{W}$ 的用电器正常工作 $${t}\\ \\text{h}$，消耗电能 ______ $\\text{kW}\\cdot\\text{h}$。`, answer: Math.round(kWh * 100) / 100, tolerance: 0.01,
        explanation: `【解答过程】$P=${w}\\ \\text{W}=${w / 1000}\\ \\text{kW}$；$W=Pt=${w / 1000}\\times${t}=${Math.round(kWh * 100) / 100}\\ \\text{kW}\\cdot\\text{h}$。` });
    }
  }
}
// 功与功率
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    const F = rint(2, 20) * 5, s = rint(2, 10);
    const W = F * s;
    if (i % 2 === 0) {
      q(P, { id: genId("p"), knowledgePointIds: ["physics-work-energy"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
        stem: `用 $${F}\\ \\text{N}$ 的水平拉力拉着物体沿力的方向前进 $${s}\\ \\text{m}$，拉力做功 ______ $\\text{J}$。`, answer: W,
        explanation: `【解答过程】$W=Fs=${F}\\times${s}=${W}\\ \\text{J}$。` });
    } else {
      const t = rint(5, 40);
      q(P, { id: genId("p"), knowledgePointIds: ["physics-work-energy"], displayType: "计算题", type: "numeric", difficulty: 3, estimatedSeconds: 90,
        stem: `计算题：拉力做功 $${W}\\ \\text{J}$ 用时 $${t}\\ \\text{s}$，功率是多少瓦？（填数值）`, answer: W / t,
        explanation: `【解答过程】$P=\\dfrac{W}{t}=\\dfrac{${W}}{${t}}=${W / t}\\ \\text{W}$。` });
    }
  }
}
// 热学
{
  const need = 14;
  for (let i = 0; i < need; i++) {
    if (i % 2 === 0) {
      const m = rint(1, 5), dt = rint(2, 12) * 5;
      const Q = 4200 * m * dt;
      q(P, { id: genId("p"), knowledgePointIds: ["physics-thermal"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 80,
        stem: `把 $${m}\\ \\text{kg}$ 的水从 $20\\ ^\\circ\\text{C}$ 加热到 $${20 + dt}\\ ^\\circ\\text{C}$，水吸收的热量是 ______ $\\text{J}$。（$c_{水}=4.2\\times10^3\\ \\text{J/(kg}\\cdot^\\circ\\text{C)}$）`, answer: Q,
        explanation: `【解答过程】$Q=cm\\Delta t=4.2\\times10^3\\times${m}\\times${dt}=${Q}\\ \\text{J}$。` });
    } else {
      const m = pick([0.5, 1, 1.5, 2]), qv = pick([2.8, 3.0, 4.2, 4.6]);
      const Q = m * qv * 1e7;
      q(P, { id: genId("p"), knowledgePointIds: ["physics-thermal"], displayType: "计算题", type: "numeric", difficulty: 3, estimatedSeconds: 90,
        stem: `计算题：完全燃烧 $${m}\\ \\text{kg}$ 某燃料（热值 $${qv}\\times10^7\\ \\text{J/kg}$），放出的热量是 ______ $\\text{J}$。（填科学计数法系数 $\\times10^7$ 的系数，如 $2.1\\times10^7$ 填 $2.1$）`, answer: Math.round(m * qv * 100) / 100, tolerance: 0.01,
        explanation: `【解答过程】$Q=mq=${m}\\times${qv}\\times10^7=${Math.round(m * qv * 100) / 100}\\times10^7\\ \\text{J}$。` });
    }
  }
}
// 声与光
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const t = rint(1, 5);
    const s = (340 * t) / 2;
    q(P, { id: genId("p"), knowledgePointIds: ["physics-sound-light"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `对着山崖喊话，经过 $${t}\\ \\text{s}$ 听到回声，人到山崖的距离约是 ______ $\\text{m}$。（声速取 $340\\ \\text{m/s}$）`, answer: s,
      explanation: `【解答过程】声音总路程 $=340\\times${t}=${340 * t}\\ \\text{m}$；$s=\\dfrac{${340 * t}}{2}=${s}\\ \\text{m}$。` });
  }
}
// 浮力
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const V = pick([50, 100, 200, 300, 400, 500]);
    const F = V * 1e-6 * 1000 * 10;
    q(P, { id: genId("p"), knowledgePointIds: ["physics-buoyancy"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 70,
      stem: `一物体浸没在水中，排开水的体积为 $${V}\\ \\text{cm}^3$，它受到的浮力是 ______ $\\text{N}$。（$\\rho_{水}=10^3\\ \\text{kg/m}^3$，$g=10\\ \\text{N/kg}$）`, answer: F,
      explanation: `【解答过程】$V_{排}=${V}\\ \\text{cm}^3=${V}\\times10^{-6}\\ \\text{m}^3$；$F_{浮}=\\rho gV_{排}=10^3\\times10\\times${V}\\times10^{-6}=${F}\\ \\text{N}$。` });
  }
}
// 力与运动（合力）
{
  const need = 12;
  for (let i = 0; i < need; i++) {
    const f1 = rint(2, 10) * 2, f2 = rint(1, 9) * 2;
    if (i % 2 === 0) {
      q(P, { id: genId("p"), knowledgePointIds: ["physics-force-motion"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `同一直线上的两个力 $F_1=${f1}\\ \\text{N}$、$F_2=${f2}\\ \\text{N}$ 方向相同，它们的合力是 ______ $\\text{N}$。`, answer: f1 + f2,
        explanation: `【解答过程】同方向二力合成：$F=F_1+F_2=${f1}+${f2}=${f1 + f2}\\ \\text{N}$。` });
    } else {
      q(P, { id: genId("p"), knowledgePointIds: ["physics-force-motion"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
        stem: `同一直线上的两个力 $F_1=${Math.max(f1, f2)}\\ \\text{N}$、$F_2=${Math.min(f1, f2)}\\ \\text{N}$ 方向相反，它们的合力是 ______ $\\text{N}$。`, answer: Math.abs(f1 - f2),
        explanation: `【解答过程】反方向二力合成：$F=|F_1-F_2|=${Math.max(f1, f2)}-${Math.min(f1, f2)}=${Math.abs(f1 - f2)}\\ \\text{N}$，方向与较大力相同。` });
    }
  }
}

console.log("math & physics generated");

// ============ 事实表出题辅助 ============
function factJudge(subject, kp, rows, tag) {
  // rows: [statement, true/false]
  return rows.map(([text, tf], i) => ({
    id: genId(tag), knowledgePointIds: [kp],
    displayType: "判断题", type: "single-choice", difficulty: tf ? 1 : 2, estimatedSeconds: 35,
    stem: `判断下列说法是否正确：${text}`,
    options: [{ key: "A", label: "正确" }, { key: "B", label: "错误" }],
    answer: tf ? "A" : "B",
    explanation: tf ? `该说法正确。` : `该说法错误。`,
  }));
}
function factMulti(subject, kp, rows, tag) {
  // 取 3 真 1 假 组成"正确的有"
  const out = [];
  const trues = rows.filter(r => r[1]).map(r => r[0]);
  const falses = rows.filter(r => !r[1]).map(r => r[0]);
  for (let i = 0; i + 3 < trues.length && i < falses.length; i += 4) {
    const items = shuffle([
      ...trues.slice(i, i + 3).map(t => [t, true]),
      [falses[Math.floor(i / 4) % falses.length], false],
    ]);
    const keys = ["A", "B", "C", "D"];
    const answer = items.filter(x => x[1]).map(x => keys[items.indexOf(x)]).sort().join("");
    out.push({
      id: genId(tag), knowledgePointIds: [kp],
      displayType: "多选题", type: "multi-choice", difficulty: 3, estimatedSeconds: 80,
      stem: "下列说法正确的有（　）",
      options: items.map((x, idx) => ({ key: keys[idx], label: x[0] })),
      answer, explanation: `逐项判断：错误的说法是“${items.find(x => !x[1])[0]}”，其余均正确。`,
    });
  }
  return out;
}
function factMC(subject, kp, rows, tag) {
  const trues = rows.filter(r => r[1]).map(r => r[0]);
  const falses = rows.filter(r => !r[1]).map(r => r[0]);
  const out = [];
  for (let i = 0; i < trues.length && falses.length >= 3; i++) {
    const correct = trues[i % trues.length];
    const d = shuffle(falses).slice(0, 3);
    const opts = shuffle([correct, ...d]);
    out.push({
      id: genId(tag), knowledgePointIds: [kp],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 45,
      stem: "下列说法中正确的是（　）",
      options: opts.map((o, idx) => ({ key: ["A","B","C","D"][idx], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(correct)],
      explanation: `只有“${correct}”是正确的说法，其余说法均错误。`,
    });
  }
  return out;
}
function pairMC(subject, kp, rows, stemFn, optFn) {
  return rows.map(([entity, value], i) => {
    const distractors = shuffle(rows.filter(r => r[0] !== entity).map(r => r[1])).slice(0, 3);
    const opts = shuffle([value, ...distractors]);
    return {
      id: genId(tagOf(subject)), knowledgePointIds: [kp],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem: stemFn(entity), options: opts.map(v => ({ key: ["A","B","C","D"][opts.indexOf(v)], label: optFn(v) })),
      answer: ["A","B","C","D"][opts.indexOf(value)],
      explanation: `${entity} → ${value}。`,
    };
  });
}
function tagOf(subject) { return { math: "m", physics: "p", chemistry: "c", english: "e", chinese: "cn" }[subject]; }

function countExisting(d, kp) { return d.questions.filter(q => q.knowledgePointIds.includes(kp)).length; }
function fillFacts(subject, data, kp, rows) {
  const existing = countExisting(data, kp);
  const need = Math.max(20 - existing, 8);
  const tag = tagOf(subject);
  const judges = factJudge(subject, kp, rows, tag);
  const multis = factMulti(subject, kp, rows, tag);
  let added = 0;
  for (const qz of [...judges, ...multis, ...factMC(subject, kp, rows, tag)]) {
    if (added >= need) break;
    if (q(subject, qz)) added += 1;
  }
}

// ============ 化学 ============
const C = "chemistry";
fillFacts(C, load('chemistry.json'), "chemistry-change-properties", [
  ["冰融化成水没有生成新物质，属于物理变化", true],
  ["木炭燃烧生成二氧化碳，属于化学变化", true],
  ["灯泡通电发光发热，属于化学变化", false],
  ["酒精挥发属于化学变化", false],
  ["食物腐败属于化学变化", true],
  ["铁生锈属于化学变化", true],
  ["汽油能溶解油污，属于汽油的化学性质", false],
  ["氧气能支持燃烧，属于氧气的化学性质", true],
  ["纸张燃烧生成二氧化碳和水，属于化学变化", true],
  ["酒精能燃烧，属于酒精的化学性质", true],
  ["水结冰体积变大，属于化学变化", false],
  ["胆矾研碎属于化学变化", false],
  ["蜡烛燃烧时既有物理变化又有化学变化", true],
  ["铁变成铁水属于化学变化", false],
  ["粮食酿酒属于化学变化", true],
  ["动植物的呼吸作用属于化学变化", true],
]);
fillFacts(C, load('chemistry.json'), "chemistry-air-oxygen", [
  ["氧气约占空气体积的 21%", true],
  ["氮气约占空气体积的 78%", true],
  ["氧气能支持燃烧，是常用的氧化剂", true],
  ["氧气可以作燃料", false],
  ["铁丝在空气中能剧烈燃烧", false],
  ["氧气不易溶于水", true],
  ["红磷燃烧生成五氧化二磷", true],
  ["二氧化碳约占空气体积的 21%", false],
  ["细铁丝在氧气中燃烧生成四氧化三铁", true],
  ["木炭在氧气中发出白光", true],
  ["硫在氧气中燃烧发出微弱的淡蓝色火焰", false],
  ["硫在空气中燃烧发出淡蓝色火焰", true],
  ["氧气浓度越高，燃烧越剧烈", true],
  ["稀有气体约占空气体积的 0.94%", true],
  ["红磷燃烧产生大量白雾", false],
  ["做铁丝在氧气中燃烧实验时，瓶底要放少量水", true],
]);
fillFacts(C, load('chemistry.json'), "chemistry-matter-structure", [
  ["分子在不停地运动", true],
  ["温度越高，分子运动越慢", false],
  ["分子之间没有间隔", false],
  ["原子在化学变化中不可再分", true],
  ["水是由氢元素和氧元素组成的", true],
  ["分子是保持物质化学性质的最小粒子（由分子构成的物质）", true],
  ["冰水混合物属于混合物", false],
  ["在化学变化中分子可以再分", true],
]);
// 分子原子 numeric: 原子个数
{
  const mols = [["$\\text{H}_2\\text{O}$", 3], ["$\\text{CO}_2$", 3], ["$\\text{O}_2$", 2], ["$\\text{NH}_3$", 4], ["$\\text{H}_2$", 2], ["$\\text{CO}$", 2], ["$\\text{CH}_4$", 5], ["$\\text{SO}_2$", 3], ["$\\text{HCl}$", 2], ["$\\text{P}_2\\text{O}_5$", 7]];
  for (const [f, n] of mols) {
    q(C, { id: genId("c"), knowledgePointIds: ["chemistry-matter-structure"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
      stem: `一个 ${f} 分子中含有 ______ 个原子。`, answer: n,
      explanation: `【解答过程】化学式中各元素符号右下角数字之和（无下标按 1）即为该分子中的原子个数：${n} 个。` });
  }
}
fillFacts(C, load('chemistry.json'), "chemistry-atomic-structure", [
  ["原子中质子数等于核外电子数", true],
  ["原子核由质子和中子构成", true],
  ["原子中质子数一定等于中子数", false],
  ["钠原子易失去一个电子形成带正电的钠离子", true],
  ["原子核带负电", false],
  ["相对原子质量约等于质子数加中子数", true],
  ["原子核居于原子中心，体积极小", true],
]);
{
  const pairs = [[8, 8], [11, 12], [6, 6], [13, 14], [17, 18], [19, 20], [16, 16], [2, 2], [12, 12], [9, 10]];
  for (const [p, n] of pairs) {
    q(C, { id: genId("c"), knowledgePointIds: ["chemistry-atomic-structure"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 50,
      stem: `某原子的质子数为 $${p}$，中子数为 $${n}$，它的相对原子质量约为 ______。`, answer: p + n,
      explanation: `【解答过程】相对原子质量 $\\approx$ 质子数 $+$ 中子数 $=${p}+${n}=${p + n}$。` });
  }
}
// 元素 1~20
{
  const elems = [["氢","H",1],["氦","He",2],["锂","Li",3],["铍","Be",4],["硼","B",5],["碳","C",6],["氮","N",7],["氧","O",8],["氟","F",9],["氖","Ne",10],["钠","Na",11],["镁","Mg",12],["铝","Al",13],["硅","Si",14],["磷","P",15],["硫","S",16],["氯","Cl",17],["氩","Ar",18],["钾","K",19],["钙","Ca",20]];
  for (const [name, sym, num] of sample(elems, 16)) {
    const optPairs = shuffle([[sym, true], ...sample(elems.filter(e => e[1] !== sym), 3).map(e => [e[1], false])]);
    q(C, { id: genId("c"), knowledgePointIds: ["chemistry-elements"], displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem: `元素 ${name} 的元素符号是（　）`,
      options: optPairs.map(([label], i) => ({ key: ["A","B","C","D"][i], label })),
      answer: ["A","B","C","D"][optPairs.findIndex(x => x[1])],
      explanation: `${name} 的元素符号是 ${sym}，原子序数为 ${num}。` });
  }
}
fillFacts(C, load('chemistry.json'), "chemistry-water-solution", [
  ["溶液质量等于溶质质量与溶剂质量之和", true],
  ["饱和溶液一定是浓溶液", false],
  ["电解水时正极产生氧气", true],
  ["电解水时负极产生氧气", false],
  ["洗涤剂去油污是乳化作用", true],
  ["溶液都是无色的", false],
]);
{
  for (let i = 0; i < 10; i++) {
    const M0 = pick([40, 50, 60, 80, 100, 150, 200]), w = pick([5, 10, 20, 25]);
    const solute = (M0 * w) / 100;
    q(C, { id: genId("c"), knowledgePointIds: ["chemistry-water-solution"], displayType: "填空题", type: "numeric", difficulty: 2, estimatedSeconds: 60,
      stem: `配制 $${M0}\\ \\text{g}$ 质量分数为 $${w}\\%$ 的氯化钠溶液，需要氯化钠 ______ $\\text{g}$。`, answer: solute,
      explanation: `【解答过程】$m_{溶质}=M_{溶液}\\times w=${M0}\\times${w}\\%=${solute}\\ \\text{g}$。` });
  }
}
fillFacts(C, load('chemistry.json'), "chemistry-chemical-equations", [
  ["参加化学反应的各物质质量总和等于反应后生成的各物质质量总和", true],
  ["没有参加反应的剩余物质质量也计入反应物总质量", false],
  ["化学反应前后分子种类一定改变", true],
  ["化学反应前后原子数目可能改变", false],
  ["所有化学反应都遵守质量守恒定律", true],
]);
{
  const calcs = [
    ["水", "$2\\text{H}_2\\text{O}\\xrightarrow{\\text{通电}}2\\text{H}_2\\uparrow+\\text{O}_2\\uparrow$", 36, 4, "氢气", [18, 36, 54, 72]],
    ["氯酸钾", "$2\\text{KClO}_3\\xrightarrow[\\Delta]{\\text{MnO}_2}2\\text{KCl}+3\\text{O}_2\\uparrow$", 245, 96, "氧气", [24.5, 49, 73.5, 98]],
    ["氧化铁", "$\\text{Fe}_2\\text{O}_3+3\\text{CO}\\xrightarrow{\\text{高温}}2\\text{Fe}+3\\text{CO}_2$", 160, 112, "铁", [16, 32, 48, 80]],
  ];
  for (const [name, eq, mIn, mOut, outName, masses] of calcs) {
    for (const g of masses) {
      const ans = Math.round((g * mOut) / mIn * 100) / 100;
      q(C, { id: genId("c"), knowledgePointIds: ["chemistry-chemical-equations"], displayType: "计算题", type: "numeric", difficulty: 3, estimatedSeconds: 110,
        stem: `计算题：${eq}。现有 ${name} $${g}\\ \\text{g}$ 完全反应，生成 ${outName} ______ $\\text{g}$。`, answer: ans, tolerance: 0.05,
        explanation: `【解答过程】由化学方程式，${mIn} 份 ${name} 对应 ${mOut} 份 ${outName}（质量比 $${mIn}:${mOut}$）。$${g}\\ \\text{g}$ ${name} 生成 ${outName} $=${g}\\times\\dfrac{${mOut}}{${mIn}}=${ans}\\ \\text{g}$。`,
        commonMistake: "忘记化学计量数导致比例错误。" });
    }
  }
}
fillFacts(C, load('chemistry.json'), "chemistry-carbon-family", [
  ["一氧化碳有毒，能与血红蛋白结合", true],
  ["二氧化碳有毒", false],
  ["干冰是固态二氧化碳，升华吸热", true],
  ["二氧化碳能供给呼吸", false],
  ["石墨具有良好的导电性", true],
  ["金刚石和石墨物理性质差异很大，因为碳原子排列方式不同", true],
  ["二氧化碳能使澄清石灰水变浑浊", true],
  ["一氧化碳能燃烧生成二氧化碳", true],
  ["二氧化碳燃烧生成一氧化碳", false],
  ["活性炭具有吸附性，可以除去色素和异味", true],
  ["金刚石是天然存在最硬的物质", true],
  ["石墨很软，可用来做铅笔芯", true],
  ["二氧化碳密度比空气大", true],
  ["一氧化碳难溶于水", true],
  ["向二氧化碳的水溶液中滴入紫色石蕊溶液，变红", true],
  ["一氧化碳和二氧化碳组成元素相同，化学性质也相同", false],
]);
fillFacts(C, load('chemistry.json'), "chemistry-metal-iron", [
  ["铁生锈是铁与氧气、水共同作用的结果", true],
  ["铁生锈只需要氧气", false],
  ["在铁栏杆表面刷漆可以防止生锈", true],
  ["经常用水冲洗铁栏杆能防止生锈", false],
  ["铁是银白色金属", true],
  ["铜在潮湿的空气中容易生成铜绿", true],
  ["铝表面有致密的氧化膜，抗腐蚀能力强", true],
  ["生铁和钢都是铁的合金", true],
  ["钢的含碳量比生铁低", true],
  ["铁能与稀盐酸反应生成氢气", true],
  ["金在金属活动性顺序中排在最后", true],
  ["铝的金属活动性比铁强", true],
  ["配制波尔多液要用到硫酸铜", true],
  ["波尔多液不能用铁桶盛放，因为铁能与硫酸铜反应", true],
  ["一氧化碳可以用于冶炼金属", true],
  ["合金的硬度一般比组成它的纯金属大", true],
]);
fillFacts(C, load('chemistry.json'), "chemistry-acid-base-salt", [
  ["紫色石蕊溶液遇酸变红", true],
  ["无色酚酞溶液遇碱变红", true],
  ["无色酚酞溶液遇酸变红", false],
  ["pH 小于 7 的溶液呈酸性", true],
  ["pH 等于 7 的溶液呈碱性", false],
  ["氢氧化钠俗称烧碱、火碱、苛性钠", true],
  ["用氢氧化钠改良酸性土壤最合适", false],
  ["熟石灰可用于改良酸性土壤", true],
  ["浓硫酸敞口放置质量会变大，因为它有吸水性", true],
  ["浓盐酸敞口放置质量会变小，因为它有挥发性", true],
  ["氢氧化钠溶液能使紫色石蕊溶液变蓝", true],
  ["胃酸过多的病人可以服用含氢氧化铝的药物", true],
  ["氢氧化钙俗称熟石灰、消石灰", true],
  ["碳酸钠俗称纯碱，但它属于盐而不是碱", true],
  ["镁条能与稀盐酸反应产生气泡", true],
]);
fillFacts(C, load('chemistry.json'), "chemistry-lab-experiment", [
  ["给试管中液体加热，液体不超过试管容积的三分之一", true],
  ["可以用嘴吹灭酒精灯", false],
  ["稀释浓硫酸时应把水倒入浓硫酸", false],
  ["闻气体气味应用扇闻法", true],
  ["量筒读数时视线应与凹液面最低处保持水平", true],
  ["用剩的药品应放回原瓶", false],
  ["块状药品可以用镊子取用", true],
  ["取用液体药品时瓶塞要正放在桌面上", false],
  ["倾倒液体时标签要向着手心", true],
  ["加热试管时要先预热", true],
  ["可以用酒精灯的内焰加热", false],
  ["给试管中固体加热时，管口要略向下倾斜", true],
  ["托盘天平称量时要左物右码", true],
  ["实验室用剩的药品要放回原瓶", false],
  ["搅拌可以加快物质的溶解速度", true],
  ["试管内壁附着的水既不聚成水滴也不成股流下，说明已洗净", true],
  ["取用液体药品后要立即盖紧瓶塞", true],
  ["过滤时要用玻璃棒引流", true],
  ["蒸发结晶用到的主要仪器有蒸发皿、酒精灯和玻璃棒", true],
]);
fillFacts(C, load('chemistry.json'), "chemistry-combustion", [
  ["燃烧需要可燃物、氧气和温度达到着火点", true],
  ["油锅着火可以盖上锅盖灭火", true],
  ["灭火时应设法降低可燃物的着火点", false],
  ["煤气泄漏时应先开窗通风", true],
  ["煤、石油、天然气是可再生能源", false],
  ["氢气燃烧产物只有水，是最清洁的燃料", true],
  ["温度低于着火点，可燃物不能燃烧", true],
  ["用水灭火是因为降低了可燃物的着火点", false],
  ["燃烧一定伴有发光、放热现象", true],
  ["所有的爆炸都是化学变化", false],
  ["天然气的主要成分是甲烷", true],
  ["甲烷是最简单的有机物", true],
  ["把柴火架空燃烧更旺，是因为增大了与氧气的接触面积", true],
  ["乙醇（酒精）是可再生能源", true],
  ["石油直接烧掉是最合理的利用方式", false],
]);

// ============ 物理事实表（判断/多选池） ============
const physFacts = load("physics.json");
fillFacts(P, physFacts, "physics-motion-speed", [
  ["1 m/s = 3.6 km/h", true],
  ["平均速度等于各段速度的平均值", false],
  ["匀速直线运动的速度大小和方向都不变", true],
  ["物体运动的路程越长，速度越大", false],
  ["火车过桥时通过的路程等于桥长加车长", true],
]);
fillFacts(P, physFacts, "physics-mass-density", [
  ["密度是物质本身的特性，与质量和体积无关", true],
  ["一杯水倒掉一半后，密度减小", false],
  ["铁的密度比铝大", true],
  ["水结成冰后密度不变", false],
  ["氧气瓶用去一半氧气后，瓶内氧气密度变小", true],
]);
fillFacts(P, physFacts, "physics-pressure", [
  ["液体内部的压强随深度的增加而增大", true],
  ["同一深度，液体向各个方向的压强相等", true],
  ["压强公式 p = F/S 中的 S 是物体的表面积", false],
  ["连通器静止时各容器中的液面总保持相平", true],
  ["铁轨铺在枕木上是为了减小对地面的压强", true],
]);
fillFacts(P, physFacts, "physics-ohm-law", [
  ["欧姆定律中的 I、U、R 必须对应同一导体", true],
  ["导体电阻随电压增大而增大", false],
  ["串联电路中电流处处相等", true],
  ["并联电路的干路电流等于各支路电流之和", true],
  ["电阻一定时，导体中的电流与它两端的电压成正比", true],
  ["电压表可以直接接在电源两端", true],
]);
fillFacts(P, physFacts, "physics-electric-power", [
  ["电功率表示电流做功的快慢", true],
  ["千瓦时（kW·h）是电功率的单位", false],
  ["用电器在额定电压下工作时，实际功率等于额定功率", true],
  ["灯泡的亮度由它的实际功率决定", true],
  ["电能表测量的是用电器消耗的电能", true],
]);
fillFacts(P, physFacts, "physics-thermal", [
  ["热传递时热量从高温物体传向低温物体", true],
  ["温度高的物体内能一定大", false],
  ["水的比热容比较大", true],
  ["燃料的热值与是否完全燃烧有关", false],
  ["物体吸收热量，温度一定升高", false],
]);
fillFacts(P, physFacts, "physics-work-energy", [
  ["只要有力作用在物体上，这个力就一定做功", false],
  ["功率越大，做功越快", true],
  ["匀速提升重物时，拉力做的功等于克服重力做的功", true],
  ["动能的大小只与物体的质量有关", false],
  ["匀速上升的货物，它的重力势能在增大", true],
]);
fillFacts(P, physFacts, "physics-buoyancy", [
  ["浸在液体中的物体都受到浮力", true],
  ["沉入水底的物体不受浮力", false],
  ["浮力的方向竖直向上", true],
  ["浸没在液体中的物体，浮力大小与深度无关", true],
  ["漂浮的物体，浮力等于重力", true],
]);
fillFacts(P, physFacts, "physics-force-motion", [
  ["惯性是物体保持原来运动状态不变的性质", true],
  ["物体可以说受到了“惯性力”的作用", false],
  ["物体的运动状态改变，一定受到了力的作用", true],
  ["不受力的物体一定处于静止状态", false],
  ["二力平衡的两个力作用在同一个物体上", true],
]);
fillFacts(P, physFacts, "physics-circuit-basics", [
  ["串联电路中电流只有一条路径", true],
  ["并联电路中各支路互不影响", true],
  ["电源短路时电流过大，会烧坏电源", true],
  ["串联电路中一个用电器断路，其余用电器仍能工作", false],
  ["并联电路中，干路开关控制整个电路", true],
  ["家庭电路中的用电器都是串联的", false],
  ["电流表应串联在被测电路中", true],
  ["电压表应并联在被测电路两端", true],
  ["串联电路中开关位置改变，其控制作用不变", true],
  ["并联电路的干路电流等于各支路电流之和", true],
  ["用导线直接连接电源两极是允许的", false],
  ["串联电路中通过各用电器的电流处处相等", true],
]);
fillFacts(P, physFacts, "physics-home-circuit", [
  ["家庭电路的电压是 220 V", true],
  ["控制电灯的开关应接在零线上", false],
  ["三孔插座的“上孔”接地线", true],
  ["测电笔氖管发光，说明接触的是零线", false],
  ["家庭电路电流过大的原因可能是短路或总功率过大", true],
  ["发现有人触电时，应先切断电源", true],
  ["保险丝由电阻率较大、熔点较低的合金制成", true],
  ["空气开关跳闸后可以直接推回去，无需检查原因", false],
  ["家庭电路中各用电器都是并联的", true],
  ["高压线只要不触碰就不会发生触电事故", false],
  ["家庭电路中用电器总功率越大，干路电流越大", true],
  ["保险丝熔断后可以用铜丝代替", false],
  ["对人体来说，安全电压是不高于 36 V 的电压", true],
  ["雷雨天可以在大树下避雨", false],
]);
fillFacts(P, physFacts, "physics-magnetism", [
  ["奥斯特实验说明通电导线周围存在磁场", true],
  ["磁体可以吸引铜、铝等所有金属", false],
  ["同名磁极相互排斥，异名磁极相互吸引", true],
  ["磁感线是真实存在的曲线", false],
  ["发电机利用电磁感应原理发电", true],
  ["电动机把机械能转化为电能", false],
  ["通电螺线管的磁极方向与电流方向有关", true],
  ["电磁起重机通电时能吸起废钢铁", true],
  ["通电螺线管外部的磁场与条形磁铁相似", true],
  ["电磁继电器的核心元件是电磁铁", true],
  ["我国宋代学者沈括最早记述了地磁偏角", true],
  ["磁浮列车利用了磁极间相互作用规律", true],
  ["导体在磁场中切割磁感线就一定能产生感应电流", false],
  ["磁体上两个磁极的磁性最弱", false],
]);

// ============ 英语 ============
const E = "english";
// 时态：动词表 + 标志词
{
  const verbs = [
    ["go", "goes", "went", "gone", "going"], ["watch", "watches", "watched", "watched", "watching"],
    ["play", "plays", "played", "played", "playing"], ["study", "studies", "studied", "studied", "studying"],
    ["live", "lives", "lived", "lived", "living"], ["stop", "stops", "stopped", "stopped", "stopping"],
    ["buy", "buys", "bought", "bought", "buying"], ["eat", "eats", "ate", "eaten", "eating"],
    ["do", "does", "did", "done", "doing"], ["have", "has", "had", "had", "having"],
    ["see", "sees", "saw", "seen", "seeing"], ["take", "takes", "took", "taken", "taking"],
    ["write", "writes", "wrote", "written", "writing"], ["clean", "cleans", "cleaned", "cleaned", "cleaning"],
  ];
  const markers = [
    ["every day", "一般现在时", (v) => v[1], "He", "TV"],
    ["yesterday", "一般过去时", (v) => v[2], "He", "TV"],
    ["now", "现在进行时", (v) => `is ${v[4]}`, "He", "TV"],
    ["since 2010", "现在完成时", (v) => `has ${v[3]}`, "He", "TV"],
  ];
  for (const v of verbs) {
    for (const [marker, label, form] of markers) {
      q(E, { id: genId("e"), knowledgePointIds: ["english-grammar-tenses"],
        displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 45,
        stem: `用所给词的适当形式填空：He ___ (${v[0]}) TV ${marker}.`,
        acceptedAnswers: [form(v)], answerKind: "text",
        explanation: `${marker} 是${label}标志词，动词用 ${form(v)}。` });
    }
  }
}
// 被动语态
{
  const rows = [
    ["room", "clean", "cleaned", "every day", "is"],
    ["English", "speak", "spoken", "around the world", "is"],
    ["tree", "plant", "planted", "in spring", "are"],
    ["car", "make", "made", "in this factory", "is"],
    ["book", "write", "written", "by Lu Xun", "was"],
    ["bike", "sell", "sold", "last week", "was"],
    ["bridge", "build", "built", "in 1990", "was"],
    ["window", "break", "broken", "by the boy", "was"],
    ["door", "lock", "locked", "every evening", "is"],
    ["food", "eat", "eaten", "by animals", "was"],
    ["letter", "send", "sent", "yesterday", "was"],
    [" homework", "finish", "finished", "already", "has been"],
    ["flowers", "water", "watered", "every morning", "are"],
    ["problems", "discuss", "discussed", "at the meeting", "were"],
    ["stamps", "collect", "collected", "by him", "are"],
    ["the thief", "catch", "caught", "last night", "was"],
    ["rice", "grow", "grown", "in the south", "is"],
  ];
  for (const [noun, base, pp, marker, be] of rows) {
    q(E, { id: genId("e"), knowledgePointIds: ["english-grammar-passive"],
      displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 50,
      stem: `用所给词的适当形式填空：The ${noun.trim()} ___ (${base}) ${marker}.`,
      acceptedAnswers: [`${be} ${pp}`.replace("has been", "has been")], answerKind: "text",
      explanation: `主语是动作承受者，用被动语态 be + done：${be} ${pp}。` });
  }
}
// 从句（精选句库）
{
  const rows = [
    ["I want to know ___ he lives.", ["where", "what", "who", "when"], "where", "疑问副词 where 引导宾语从句，表示地点。"],
    ["He said that he ___ come the next day.", ["will", "would", "does", "has"], "would", "主句过去时，从句用过去将来时 would come。"],
    ["This is the book ___ I bought yesterday.", ["who", "which", "what", "whose"], "which", "先行词是物，用 which/that。"],
    ["Do you know ___ she is waiting for?", ["who", "which", "when", "where"], "who", "等待的是人，用 who。"],
    ["I will tell you ___ the meeting begins — at nine.", ["when", "where", "why", "how"], "when", "答语是时间，用 when。"],
    ["The girl ___ is standing there is my sister.", ["who", "which", "what", "whose"], "who", "先行词 the girl 是人，关系词作主语用 who。"],
    ["He asked me ___ I liked the film.", ["if", "what", "when", "where"], "if", "表示“是否”用 if/whether。"],
    ["This is the house ___ we visited last year.", ["who", "which", "whose", "whom only"], "which", "先行词是物，用 which。"],
    ["I don't know ___ book this is.", ["who", "whose", "which", "that"], "whose", "表示“谁的”，用 whose。"],
    ["Could you tell me ___ the library is? — Over there.", ["where", "what", "who", "why"], "where", "答语是地点，用 where。"],
    ["He is the man ___ helped me.", ["who", "which", "whose", "what"], "who", "先行词是人且作主语，用 who。"],
    ["I wonder ___ he will come tomorrow or not.", ["whether", "when", "who", "which"], "whether", "whether...or not 是固定搭配。"],
    ["Do you remember ___ we first met? — In 2018.", ["when", "where", "why", "what"], "when", "答语是时间，用 when。"],
    ["The story ___ he told us is very interesting.", ["who", "which", "whose", "whom only"], "which", "先行词是物，用 which。"],
    ["I hear ___ a new hotel will be built here soon.", ["that", "what", "when", "where"], "that", "陈述内容用 that 引导。"],
    ["Do you know the woman ___ son is a doctor?", ["who", "which", "whose", "what"], "whose", "表示“……的”，用 whose。"],
    ["This is the place ___ we first met.", ["where", "which", "who", "what"], "where", "先行词是地点，且在从句中作状语，用 where。"],
  ];
  for (const [stem, opts, ans, exp] of rows) {
    q(E, { id: genId("e"), knowledgePointIds: ["english-grammar-clauses"],
      displayType: "单选题", type: "single-choice", difficulty: 3, estimatedSeconds: 55,
      stem, options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(ans)], explanation: exp });
  }
}
// 词汇
{
  const words = [
    ["apple", "苹果"], ["book", "书"], ["cat", "猫"], ["dog", "狗"], ["egg", "鸡蛋"], ["fish", "鱼"],
    ["girl", "女孩"], ["house", "房子"], ["juice", "果汁"], ["king", "国王"], ["lion", "狮子"], ["moon", "月亮"],
    ["night", "夜晚"], ["orange", "橙子"], ["pen", "钢笔"], ["queen", "女王"], ["rain", "雨"], ["sun", "太阳"],
    ["tree", "树"], ["water", "水"], ["window", "窗户"], ["zoo", "动物园"], ["teacher", "教师"], ["hospital", "医院"],
  ];
  for (const [w, cn] of sample(words, 20)) {
    const distractors = shuffle(words.filter(x => x[0] !== w).map(x => x[1])).slice(0, 3);
    const opts = shuffle([cn, ...distractors]);
    q(E, { id: genId("e"), knowledgePointIds: ["english-vocabulary"],
      displayType: "单选题", type: "single-choice", difficulty: 1, estimatedSeconds: 30,
      stem: `“${w}”的中文意思是（　）`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(cn)],
      explanation: `${w} 意为“${cn}”。` });
  }
}
// 情景交际
{
  const rows = [
    ["How are you?", "Fine, thank you. And you?", "How do you do?", "I'm fifteen."],
    ["What's your name?", "My name is Li Ming.", "I'm fine, thanks.", "He is Li Ming."],
    ["Thank you for your help.", "You're welcome.", "That's right.", "Good idea."],
    ["I'm sorry I'm late.", "It doesn't matter.", "You're welcome.", "Yes, please."],
    ["Would you like some tea?", "Yes, please.", "Yes, I would.", "No, I don't."],
    ["What does your mother do?", "She is a nurse.", "She is fine.", "She is at home."],
    ["How do you do?", "How do you do?", "Fine, thanks.", "How are you?"],
    ["Shall we go to the park?", "Good idea!", "Yes, I do.", "Not at all."],
    ["What's the weather like today?", "It's sunny.", "It's Monday.", "It's five o'clock."],
    ["Happy birthday to you!", "Thank you!", "The same to me only.", "You're right."],
    ["Could I borrow your pen?", "Certainly. Here you are.", "Thank you.", "You're welcome."],
    ["Where are you from?", "I'm from Beijing.", "I'm fine.", "I like it."],
    ["What time is it now?", "It's half past seven.", "It's Sunday.", "It's cold."],
    ["Let's play basketball after school.", "That sounds great.", "You're welcome.", "It doesn't matter."],
    ["How was your trip?", "It was wonderful.", "By train.", "Next week."],
    ["See you tomorrow!", "See you!", "Hello!", "How are you?"],
  ];
  for (const [ask, good, w1, w2] of rows) {
    const opts = shuffle([good, w1, w2]);
    q(E, { id: genId("e"), knowledgePointIds: ["english-communicative"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 35,
      stem: `—${ask}　—___`,
      options: opts.map((o, i) => ({ key: ["A","B","C"][i], label: o })),
      answer: ["A","B","C"][opts.indexOf(good)],
      explanation: `情景应答：${ask} 的习惯应答是 ${good}。` });
  }
}
// 比较级
{
  const rows = [
    ["tall", "taller", "tallest"], ["big", "bigger", "biggest"], ["hot", "hotter", "hottest"],
    ["early", "earlier", "earliest"], ["happy", "happier", "happiest"], ["heavy", "heavier", "heaviest"],
    ["thin", "thinner", "thinnest"], ["easy", "easier", "easiest"], ["good", "better", "best"],
    ["bad", "worse", "worst"], ["many", "more", "most"], ["little", "less", "least"],
    ["far", "farther", "farthest"], ["interesting", "more interesting", "most interesting"],
    ["beautiful", "more beautiful", "most beautiful"], ["careful", "more careful", "most careful"],
    ["cold", "colder", "coldest"], ["strong", "stronger", "strongest"],
  ];
  for (const [base, comp, sup] of rows) {
    const useSup = rnd() < 0.4;
    if (useSup) {
      q(E, { id: genId("e"), knowledgePointIds: ["english-comparison"],
        displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 45,
        stem: `用所给词的适当形式填空：She is ___ (${base}) student in our class.`,
        acceptedAnswers: [`the ${sup}`, sup], answerKind: "text",
        explanation: `in our class 表示范围超过两者，用最高级 the ${sup}。` });
    } else {
      q(E, { id: genId("e"), knowledgePointIds: ["english-comparison"],
        displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 45,
        stem: `用所给词的适当形式填空：This box is ___ (${base}) than that one.`,
        acceptedAnswers: [comp], answerKind: "text",
        explanation: `than 引出比较对象，用比较级 ${comp}。` });
    }
  }
}
// 情态动词（精选句库）
{
  const rows = [
    ["You ___ be quiet in the library.", ["must", "can", "may", "would"], "must", "图书馆必须安静，表义务用 must。"],
    ["___ I hand in my homework now? — No, you needn't.", ["Must", "Can", "May", "Should"], "Must", "must 提问的否定回答用 needn't。"],
    ["He ___ swim when he was five.", ["can", "could", "may", "must"], "could", "表示过去的能力用 could。"],
    ["You ___ not smoke here. It's dangerous.", ["must", "can", "need", "would"], "must", "mustn't 表示强烈禁止。"],
    ["___ you like some coffee?", ["Would", "Could", "Must", "Should"], "Would", "Would you like...? 是固定邀请句型。"],
    ["Students ___ finish their homework on time.", ["should", "would", "could", "might"], "should", "表示建议、责任用 should。"],
    ["___ I use your phone? — Sure, go ahead.", ["May", "Must", "Should", "Would"], "May", "may 表示请求许可。"],
    ["She ___ speak three languages.", ["can", "must", "should", "would"], "can", "表示能力用 can。"],
    ["The light is on. He ___ be at home.", ["must", "can't", "need", "shall"], "must", "must 可表示有把握的推测。"],
    ["You ___ worry. Everything will be fine.", ["needn't", "mustn't", "can't", "shouldn't"], "needn't", "表示“不必担心”用 needn't。"],
    ["We ___ wear uniforms at school every day.", ["have to", "would", "could", "might"], "have to", "have to 表示客观必须。"],
    ["___ we go now? — Yes, let's.", ["Shall", "Will", "Must", "Need"], "Shall", "Shall we...? 表示建议。"],
    ["I ___ like some noodles.", ["would", "must", "should", "need"], "would", "would like 表示“想要”。"],
    ["He ___ come tomorrow, but I'm not sure.", ["might", "must", "should", "can't"], "might", "might 表示不确定的推测。"],
    ["___ I ask you a question? — Of course.", ["May", "Must", "Shall", "Need"], "May", "may 表示请求许可。"],
    ["We ___ obey the school rules.", ["should", "would", "could", "might"], "should", "表示应该遵守的规范用 should。"],
    ["___ you pass me the salt? — Sure.", ["Could", "Must", "Need", "Shall"], "Could", "Could you...? 表示委婉请求。"],
  ];
  for (const [stem, opts, ans, exp] of rows) {
    q(E, { id: genId("e"), knowledgePointIds: ["english-modal-verbs"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem, options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(ans)], explanation: exp });
  }
}

// ============ 语文 ============
const CN = "chinese";
// 字音
{
  const rows = [
    ["角色", "jué"], ["处理", "chǔ"], ["到处", "chù"], ["载歌载舞", "zài"], ["酗酒", "xù"],
    ["一筹莫展", "chóu"], ["魁梧", "wú"], ["惬意", "qiè"], ["咀嚼", "jǔ"], ["惩戒", "chéng"],
    ["骸骨", "hái"], ["嫉妒", "jí"], ["滑稽", "jī"], ["踌躇", "chóu"], ["徘徊", "huái"],
    ["蹒跚", "pán"], ["皎洁", "jiǎo"], ["汲取", "jí"], ["亢奋", "kàng"], ["荫蔽", "yīn"],
  ];
  for (const [word, py] of rows) {
    const distractors = shuffle(rows.filter(r => r[0] !== word).map(r => r[1])).slice(0, 3);
    const opts = shuffle([py, ...distractors]);
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-characters"],
      displayType: "单选题", type: "single-choice", difficulty: 1, estimatedSeconds: 35,
      stem: `“${word}”中加点的字（取“${word.slice(0, 1)}”字）读音接近正确的一项是（　）——考查词语“${word}”中“${word[0]}”的读音`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: `${word[0]}（${o}）` })),
      answer: ["A","B","C","D"][opts.indexOf(py)],
      explanation: `“${word}”的“${word[0]}”读 ${py}。` });
  }
}
// 据音写字
{
  const rows = [["一chóu莫展", "筹"], ["迫不jí待", "及"], ["走tóu无路", "投"], ["xián慕", "羡"], ["jiǎo健", "矫"], ["áo游", "遨"], ["yín诵", "吟"], ["xié带", "携"], ["松xiè", "懈"], ["juàn恋", "眷"], ["屏zhàng", "障"], ["zhù立", "伫"]];
  for (const [stem, ch] of rows) {
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-characters"],
      displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 40,
      stem: `根据拼音写汉字：${stem}（填括号处的字）`,
      acceptedAnswers: [ch], answerKind: "text",
      explanation: `应写作“${ch}”。据义定形，先理解词义再写字。` });
  }
}
// 成语
{
  const rows = [
    ["全神贯注", "精神高度集中"], ["聚精会神", "集中注意力"], ["胸有成竹", "做事之前已有通盘考虑"],
    ["不耻下问", "向地位低的人请教不感到羞耻"], ["人声鼎沸", "人声嘈杂如锅水沸腾"], ["漫不经心", "随随便便不放在心上"],
    ["相得益彰", "互相配合更显各自长处"], ["根深蒂固", "基础牢固不易动摇"], ["孜孜不倦", "勤奋努力不知疲倦"],
    ["持之以恒", "长久坚持下去"], ["半途而废", "中途停止不坚持到底"], ["一丝不苟", "做事认真细致毫不马虎"],
    ["随声附和", "没有主见跟着别人说"], ["锲而不舍", "有恒心有毅力坚持到底"], ["举世瞩目", "全世界都在注视"],
    ["家喻户晓", "家家户户都知道"], ["脍炙人口", "好诗文被人称赞传诵"], ["因地制宜", "根据当地情况制定办法"],
    ["与日俱增", "随着时间的推移不断增长"], ["不言而喻", "不用说就可以明白"], ["温故知新", "温习旧知识获得新的理解"],
    ["妄自菲薄", "过分看轻自己"],
  ];
  for (const [idiom, meaning] of sample(rows, 20)) {
    const distractors = shuffle(rows.filter(r => r[0] !== idiom).map(r => r[1])).slice(0, 3);
    const opts = shuffle([meaning, ...distractors]);
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-words-idioms"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem: `“${idiom}”的意思是（　）`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(meaning)],
      explanation: `“${idiom}”：${meaning}。` });
  }
}
fillFacts(CN, load('chinese.json'), "chinese-words-idioms", [
  ["成语“不耻下问”可以用于老师向学生学习", true],
  ["成语“妄自菲薄”是贬义成语", true],
  ["成语“人声鼎沸”形容非常安静", false],
  ["成语“半途而废”是褒义成语", false],
]);
// 病句（精选句库）
{
  const rows = [
    ["通过这次活动，使我明白了团结的重要性。", "成分残缺", "删去“通过”或“使”"],
    ["我们要养成讲文明。", "成分残缺", "补上宾语中心语“的好习惯”"],
    ["他的写作水平明显改进了。", "搭配不当", "把“改进”改为“提高”"],
    ["为了避免今后不再发生类似事故，学校加强了安全教育。", "否定不当", "删去“不再”"],
    ["我们讨论并听取了校长的报告。", "语序不当", "改为“听取并讨论”"],
    ["能否刻苦学习，是取得好成绩的关键。", "一面对两面", "删去“能否”"],
    ["他的家乡是山东济南人。", "结构混乱", "删去“人”"],
    ["他首先第一个发言。", "成分赘余", "删去“首先”或“第一个”"],
    ["公园里盛开着五颜六色的红花。", "前后矛盾", "删去“红”"],
    ["听了报告，受到了深刻的教育。", "成分残缺", "句首加“同学们”"],
    ["这篇文章的内容和语句都很精美。", "搭配不当", "“语句精美”改为“语句流畅”"],
    ["各行各业大批有志青年纷纷报名。", "成分赘余", "“大批”与“纷纷”删去其一"],
    ["他的病还没有完全康复。", "没有语病", "该句无语病"],
    ["我们要认真克服并发现工作中的问题。", "语序不当", "改为“发现并克服”"],
    ["为了防止不再发生安全事故，学校采取了多项措施。", "否定不当", "删去“不再”"],
    ["通过老师的帮助，使他改正了缺点。", "成分残缺", "删去“通过”或“使”"],
    ["两个新旧社会真是天壤之别。", "表意不明", "改为“新社会与旧社会”"],
    ["杭州的春天是一年中最美的季节。", "前后矛盾", "改为“春天的杭州”"],
    ["我们讨论并听取了校长的工作报告。", "没有语病", "该句无语病"],
  ];
  for (const [sentence, cause, fix] of rows) {
    const distractors = shuffle(["语序不当", "搭配不当", "成分残缺", "前后矛盾", "否定不当", "成分赘余", "结构混乱"].filter(c => c !== cause)).slice(0, 3);
    const opts = shuffle([cause, ...distractors]);
    if (cause === "没有语病") continue;
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-sentences"],
      displayType: "单选题", type: "single-choice", difficulty: 3, estimatedSeconds: 60,
      stem: `下列句子有语病，病因是（　）：${sentence}`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(cause)],
      explanation: `病因：${cause}。修改方法：${fix}。` });
  }
}
// 默写
{
  const pairs = [
    ["海内存知己", "天涯若比邻"], ["会当凌绝顶", "一览众山小"], ["感时花溅泪", "恨别鸟惊心"],
    ["采菊东篱下", "悠然见南山"], ["大漠孤烟直", "长河落日圆"], ["落红不是无情物", "化作春泥更护花"],
    ["沉舟侧畔千帆过", "病树前头万木春"], ["春蚕到死丝方尽", "蜡炬成灰泪始干"], ["长风破浪会有时", "直挂云帆济沧海"],
    ["欲穷千里目", "更上一层楼"], ["不畏浮云遮望眼", "自缘身在最高层"], ["山重水复疑无路", "柳暗花明又一村"],
    ["纸上得来终觉浅", "绝知此事要躬行"], ["问渠那得清如许", "为有源头活水来"], ["人生自古谁无死", "留取丹心照汗青"],
    ["了却君王天下事", "赢得生前身后名"], ["两岸猿声啼不住", "轻舟已过万重山"], ["忽如一夜春风来", "千树万树梨花开"],
    ["但愿人长久", "千里共婵娟"], ["东风不与周郎便", "铜雀春深锁二乔"], ["商女不知亡国恨", "隔江犹唱后庭花"],
    ["何当共剪西窗烛", "却话巴山夜雨时"], ["潮平两岸阔", "风正一帆悬"], ["绿树村边合", "青山郭外斜"],
    ["几处早莺争暖树", "谁家新燕啄春泥"], ["乱花渐欲迷人眼", "浅草才能没马蹄"],
  ];
  for (const [up, down] of pairs) {
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-poetry-memorize"],
      displayType: "填空题", type: "expression", difficulty: 1, estimatedSeconds: 40,
      stem: `补写名句：${up}，______。`,
      acceptedAnswers: [down, `${down}。`], answerKind: "text",
      explanation: `下一句是“${down}”。注意易错字的写法。` });
  }
}
// 文学常识
{
  const rows = [
    ["《三国演义》", "罗贯中"], ["《水浒传》", "施耐庵"], ["《西游记》", "吴承恩"], ["《红楼梦》", "曹雪芹"],
    ["《朝花夕拾》", "鲁迅"], ["《骆驼祥子》", "老舍"], ["《繁星·春水》", "冰心"], ["《城南旧事》", "林海音"],
    ["《钢铁是怎样炼成的》", "奥斯特洛夫斯基"], ["《童年》", "高尔基"], ["《老人与海》", "海明威"],
    ["《窦娥冤》", "关汉卿"], ["《聊斋志异》", "蒲松龄"], ["《儒林外史》", "吴敬梓"], ["《离骚》", "屈原"],
    ["《春望》", "杜甫"], ["《静夜思》", "李白"], ["《钱塘湖春行》", "白居易"],
  ];
  for (const [work, author] of sample(rows, 20)) {
    const distractors = shuffle(rows.filter(r => r[0] !== work).map(r => r[1])).slice(0, 3);
    const opts = shuffle([author, ...distractors]);
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-literature-culture"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 35,
      stem: `《${work.replace(/[《》]/g, "")}》的作者是（　）`.replace("《", "").replace("》", ""),
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(author)],
      explanation: `《${work.replace(/[《》]/g, "")}》的作者是${author}。` });
  }
}
// 文言文
{
  const rows = [
    ["走", "跑"], ["去", "离开"], ["汤", "热水"], ["妻子", "妻子和儿女"], ["池", "护城河"],
    ["卑鄙", "身份低微、见识短浅"], ["感激", "感动奋激"], ["痛恨", "痛心遗憾"], ["涕", "眼泪"],
    ["股", "大腿"], ["遂", "于是、就"], ["顾", "回头看"], ["黠", "狡猾"], ["寐", "睡着"],
    ["好", "喜欢"], ["市", "买"], ["荷", "扛"], ["策", "鞭打"], ["但", "只"], ["曾", "竟然"],
  ];
  for (const [word, old] of rows) {
    const distractors = shuffle(rows.filter(r => r[0] !== word).map(r => r[1])).slice(0, 3);
    const opts = shuffle([old, ...distractors]);
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-classical-chinese"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem: `解释下列文言加点词：“${word}”在文言中的常见意思是（　）`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(old)],
      explanation: `“${word}”在文言中常作“${old}”讲（古今异义）。` });
  }
}
// 语言运用
{
  const langRows = [
    ["令尊", "敬辞，指对方的父亲"], ["家父", "谦辞，指自己的父亲"], ["惠顾", "敬辞，指对方到来"],
    ["抛砖引玉", "谦辞，用自己粗浅的意见引出别人高明的见解"], ["鼎力相助", "敬辞，感谢别人对自己的帮助"],
    ["拙见", "谦辞，指自己的意见"], ["大驾光临", "敬辞，指对方到来"], ["寒舍", "谦辞，指自己的家"],
    ["高见", "敬辞，指对方的见解"], ["拜读", "谦辞，指阅读对方的作品"],
  ];
  for (const [term, desc] of langRows) {
    const isJing = desc.startsWith("敬辞");
    const distractors = shuffle(["敬辞，指对方的父亲", "谦辞，指自己的父亲", "敬辞，指对方到来", "谦辞，指自己的意见"].filter(d => d !== desc)).slice(0, 3);
    const opts = shuffle([desc, ...distractors]);
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-language-use"],
      displayType: "单选题", type: "single-choice", difficulty: 2, estimatedSeconds: 40,
      stem: `“${term}”的意思或用法是（　）`,
      options: opts.map((o, i) => ({ key: ["A","B","C","D"][i], label: o })),
      answer: ["A","B","C","D"][opts.indexOf(desc)],
      explanation: `“${term}”：${desc}。${isJing ? "敬辞用于对方。" : "谦辞用于自己。"}` });
  }
}
{
  const quotes = [
    ["书山有路勤为径", "学海无涯苦作舟"], ["少壮不努力", "老大徒伤悲"], ["宝剑锋从磨砺出", "梅花香自苦寒来"],
    ["千里之行", "始于足下"], ["不积跬步", "无以至千里"], ["业精于勤", "荒于嬉"],
    ["读书破万卷", "下笔如有神"], ["黑发不知勤学早", "白首方悔读书迟"], ["路漫漫其修远兮", "吾将上下而求索"],
    ["勿以恶小而为之", "勿以善小而不为"],
  ];
  for (const [up, down] of quotes) {
    q(CN, { id: genId("cn"), knowledgePointIds: ["chinese-language-use"],
      displayType: "填空题", type: "expression", difficulty: 2, estimatedSeconds: 40,
      stem: `补写名句：${up}，______。`,
      acceptedAnswers: [down, `${down}。`], answerKind: "text",
      explanation: `下句是“${down}”。` });
  }
}

// ============ 后处理：单选变体 + 解答题标记 ============
for (const subject of ["math", "physics", "chemistry"]) {
  const b = bank(subject);
  let idx = 0;
  for (const qz of [...b]) {
    if (qz.type !== "numeric") continue;
    idx += 1;
    // 60% 生成单选变体
    if (rnd() < 0.6) {
      const ans = qz.answer;
      const cands = new Set();
      let guard = 0;
      while (cands.size < 3 && guard < 40) {
        guard += 1;
        const delta = pick([-5, -3, -2, -1, 1, 2, 3, 5, 10]) * (ans > 20 ? rint(2, 6) : 1);
        const v = Math.round((ans + delta) * 100) / 100;
        if (v !== ans && v >= 0 && Number.isFinite(v)) cands.add(v);
      }
      if (cands.size === 3) {
        const opts = shuffle([ans, ...cands]);
        b.push({
          subject, id: `${qz.id}c`, _generated: true, knowledgePointIds: qz.knowledgePointIds,
          displayType: "选择题", type: "single-choice", difficulty: qz.difficulty,
          estimatedSeconds: Math.max(35, Math.round(qz.estimatedSeconds * 0.6)),
          stem: `${qz.stem.replace("______", "（　）").replace(/（填数值）/, "").replace(/（保留一位小数）/, "").replace(/（保留两位小数）/, "").replace(/（结果取整数）/, "")}`,
          source: qz.source,
          options: opts.map((v, i) => ({ key: ["A","B","C","D"][i], label: String(v) })),
          answer: ["A","B","C","D"][opts.indexOf(ans)],
          explanation: qz.explanation,
        });
      }
    }
    // 部分数值题转为解答题 / 计算题
    if (idx % 5 < 3) {
      qz.displayType = subject === "math" ? "解答题" : "计算题";
      if (!/^解答题|^计算题/.test(qz.stem)) {
        qz.stem = `${qz.displayType}：${qz.stem}`;
      }
    }
  }
}

// ============ 解答题多步题（solution：步骤分） ============
{
  // 数学：解一元二次方程（判别式 → 两根）
  for (let i = 0; i < 10; i++) {
    const r1 = rint(-6, 6), r2 = rint(-6, 6);
    if (r1 === r2) { i--; continue; }
    const b = -(r1 + r2), c = r1 * r2;
    const delta = b * b - 4 * c;
    if (delta <= 0) { i--; continue; }
    const small = Math.min(r1, r2), big = Math.max(r1, r2);
    const bS = b >= 0 ? `+${b}` : b, cS = c >= 0 ? `+${c}` : c;
    q(M, {
      id: genId("m"), knowledgePointIds: ["math-equation-quadratic"],
      displayType: "解答题", type: "solution", difficulty: 4, estimatedSeconds: 180,
      stem: `解答题：解方程 $x^2 ${bS}x ${cS} = 0$。（按步骤写出判别式与两个根）`,
      source: "中考解答题 · 分步判分",
      steps: [
        { prompt: "第一步：判别式 Δ = b² - 4ac 的值", answer: delta, score: 3 },
        { prompt: "第二步：较小的根 x₁", answer: small, score: 3 },
        { prompt: "第三步：较大的根 x₂", answer: big, score: 4 },
      ],
      explanation: `【解答过程】Δ = (${b})² - 4×1×(${c}) = ${delta} > 0，方程有两个不相等实数根；$x = \\dfrac{${-b} \\pm \\sqrt{${delta}}}{2}$，即 $x_1=${small}$，$x_2=${big}$。`,
    });
  }
}
{
  // 物理：功与功率两问
  for (let i = 0; i < 8; i++) {
    const F = rint(2, 20) * 5, s = rint(2, 10), t = rint(5, 40);
    const W = F * s, P = W / t;
    q(P, {
      id: genId("p"), knowledgePointIds: ["physics-work-energy"],
      displayType: "解答题", type: "solution", difficulty: 4, estimatedSeconds: 180,
      stem: `解答题：用 $${F}\\ \\text{N}$ 的水平拉力拉着物体沿力的方向前进 $${s}\\ \\text{m}$，用时 $${t}\\ \\text{s}$。求拉力做的功和功率。`,
      source: "中考解答题 · 分步判分",
      steps: [
        { prompt: "第一步：拉力做的功 W（J）", answer: W, score: 5 },
        { prompt: "第二步：拉力的功率 P（W）", answer: P, score: 5 },
      ],
      explanation: `【解答过程】$W=Fs=${F}\\times${s}=${W}\\ \\text{J}$；$P=\\dfrac{W}{t}=\\dfrac{${W}}{${t}}=${P}\\ \\text{W}$。`,
    });
  }
}
{
  // 物理：电功率与电能两问
  for (let i = 0; i < 6; i++) {
    const U = 220, I = pick([0.2, 0.3, 0.45, 0.5, 0.8, 1]), t = rint(2, 10);
    const Pw = Math.round(220 * I * 10) / 10;
    const kWh = Math.round(((Pw / 1000) * t) * 100) / 100;
    q(P, {
      id: genId("p"), knowledgePointIds: ["physics-electric-power"],
      displayType: "解答题", type: "solution", difficulty: 4, estimatedSeconds: 180,
      stem: `解答题：一用电器接在 $220\\ \\text{V}$ 电路中，正常工作电流为 $${I}\\ \\text{A}$，正常工作 $${t}\\ \\text{h}$。求它的电功率和消耗的电能。`,
      source: "中考解答题 · 分步判分",
      steps: [
        { prompt: "第一步：电功率 P（W）", answer: Pw, score: 5 },
        { prompt: "第二步：消耗的电能 W（kW·h）", answer: kWh, tolerance: 0.01, score: 5 },
      ],
      explanation: `【解答过程】$P=UI=220\\times${I}=${Pw}\\ \\text{W}=${Pw / 1000}\\ \\text{kW}$；$W=Pt=${Pw / 1000}\\times${t}=${kWh}\\ \\text{kW}\\cdot\\text{h}$。`,
    });
  }
}
{
  // 化学：电解水两问
  for (let i = 0; i < 6; i++) {
    const water = pick([18, 36, 54, 72]);
    const h2 = (water * 4) / 36, o2 = (water * 32) / 36;
    q(C, {
      id: genId("c"), knowledgePointIds: ["chemistry-chemical-equations", "chemistry-water-solution"],
      displayType: "解答题", type: "solution", difficulty: 4, estimatedSeconds: 180,
      stem: `解答题：通电分解 $${water}\\ \\text{g}$ 水（$2\\text{H}_2\\text{O}\\xrightarrow{\\text{通电}}2\\text{H}_2\\uparrow+\\text{O}_2\\uparrow$），求生成氢气和氧气的质量。`,
      source: "中考解答题 · 分步判分",
      steps: [
        { prompt: "第一步：生成氢气的质量（g）", answer: Math.round(h2 * 100) / 100, tolerance: 0.05, score: 5 },
        { prompt: "第二步：生成氧气的质量（g）", answer: Math.round(o2 * 100) / 100, tolerance: 0.05, score: 5 },
      ],
      explanation: `【解答过程】由方程式，$36$ 份水生成 $4$ 份氢气和 $32$ 份氧气。$${water}\\ \\text{g}$ 水生成氢气 $${Math.round(h2 * 100) / 100}\\ \\text{g}$、氧气 $${Math.round(o2 * 100) / 100}\\ \\text{g}$。`,
    });
  }
}
{
  // 化学：溶液配制两问
  for (let i = 0; i < 6; i++) {
    const M0 = pick([50, 80, 100, 150, 200]), w = pick([5, 10, 20]);
    const solute = (M0 * w) / 100, water = M0 - solute;
    q(C, {
      id: genId("c"), knowledgePointIds: ["chemistry-water-solution"],
      displayType: "解答题", type: "solution", difficulty: 4, estimatedSeconds: 160,
      stem: `解答题：配制 $${M0}\\ \\text{g}$ 质量分数为 $${w}\\%$ 的氯化钠溶液，需要氯化钠和水各多少克？`,
      source: "中考解答题 · 分步判分",
      steps: [
        { prompt: "第一步：需要氯化钠的质量（g）", answer: solute, score: 5 },
        { prompt: "第二步：需要水的质量（g）", answer: water, score: 5 },
      ],
      explanation: `【解答过程】$m_{溶质}=${M0}\\times${w}\\%=${solute}\\ \\text{g}$；$m_{水}=${M0}-${solute}=${water}\\ \\text{g}$。`,
    });
  }
}

// ============ 试卷组装（真实中考蓝图 v0.16） ============
const examFiles = {
  math: "math-exams.json",
  physics: "physics-exams.json",
  chemistry: "chemistry-exams.json",
  english: "english-exams.json",
  chinese: "chinese-exams.json",
};
const labels = { math: "数学", physics: "物理", chemistry: "化学", english: "英语", chinese: "语文" };
const durations = { math: 120, physics: 90, chemistry: 60, english: 100, chinese: 120 };
const fullScores = { math: 120, physics: 90, chemistry: 80, english: 100, chinese: 120 };
const cnNums = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

const blueprints = {
  math: [
    { title: "一、选择题", filter: qz => ["single-choice", "multi-choice"].includes(qz.type), scores: Array(10).fill(3) },
    { title: "二、填空题", filter: qz => (qz.type === "numeric" || qz.type === "expression") && !["解答题", "计算题"].includes(qz.displayType), scores: Array(5).fill(4) },
    { title: "三、解答题", filter: qz => ["解答题", "计算题"].includes(qz.displayType) || qz.type === "solution", scores: [6, 6, 8, 8, 10, 10, 10, 12], sortByDifficulty: true },
  ],
  physics: [
    { title: "一、单项选择题", filter: qz => qz.type === "single-choice" && !["作图题", "实验题"].includes(qz.displayType), scores: Array(11).fill(2) },
    { title: "二、多项选择题", filter: qz => qz.type === "multi-choice", scores: Array(2).fill(3), shared: true },
    { title: "三、填空题", filter: qz => (qz.type === "numeric" || qz.type === "expression") && qz.displayType !== "计算题", scores: Array(8).fill(2) },
    { title: "四、作图题", filter: qz => qz.displayType === "作图题", scores: [2, 2], shared: true },
    { title: "五、实验探究题", filter: qz => qz.displayType === "实验题", scores: [3, 3, 2, 2], shared: true },
    { title: "六、计算题", filter: qz => qz.displayType === "计算题" || qz.type === "solution", scores: [8, 9, 11], sortByDifficulty: true },
  ],
  chemistry: [
    { title: "一、选择题", filter: qz => ["single-choice", "multi-choice"].includes(qz.type), scores: Array(12).fill(2) },
    { title: "二、填空题", filter: qz => (qz.type === "numeric" || qz.type === "expression") && qz.displayType !== "计算题", scores: Array(6).fill(3) },
    { title: "三、实验探究题", filter: qz => qz.knowledgePointIds.includes("chemistry-lab-experiment"), scores: [6, 6, 6] },
    { title: "四、计算题", filter: qz => qz.displayType === "计算题" || qz.type === "solution", scores: [10, 10], sortByDifficulty: true },
  ],
  english: [
    { title: "一、语法选择", filter: qz => qz.type === "single-choice" && !qz.knowledgePointIds.includes("english-communicative"), scores: Array(20).fill(1) },
    { title: "二、词形与填空", filter: qz => (qz.type === "expression" || qz.type === "numeric") && !qz.knowledgePointIds.includes("english-communicative"), scores: Array(15).fill(2) },
    { title: "三、情景交际", filter: qz => qz.knowledgePointIds.includes("english-communicative"), scores: Array(10).fill(2) },
    { title: "四、词汇运用", filter: qz => qz.type === "single-choice" && qz.knowledgePointIds.some(k => ["english-vocabulary", "english-comparison"].includes(k)), scores: Array(10).fill(3) },
  ],
  chinese: [
    { title: "一、积累与运用", filter: qz => qz.knowledgePointIds.some(k => ["chinese-characters", "chinese-words-idioms", "chinese-sentences"].includes(k)), scores: Array(15).fill(2) },
    { title: "二、古诗文默写", filter: qz => qz.knowledgePointIds.includes("chinese-poetry-memorize"), scores: Array(10).fill(2) },
    { title: "三、文言文阅读", filter: qz => qz.knowledgePointIds.includes("chinese-classical-chinese"), scores: Array(8).fill(3) },
    { title: "四、文学文化常识", filter: qz => qz.knowledgePointIds.includes("chinese-literature-culture"), scores: Array(8).fill(2) },
    { title: "五、语言运用", filter: qz => qz.knowledgePointIds.includes("chinese-language-use"), scores: Array(10).fill(3) },
  ],
};

for (const subject of Object.keys(blueprints)) {
  const pool = bank(subject);
  const papers = [];
  const PAPER_N = 10;

  for (let pi = 0; pi < PAPER_N; pi++) {
    seed = 20260101 + pi * 97 + subject.length * 131;
    const used = new Set();
    const sections = [];
    let secIdx = 0;
    let totalScore = 0;

    for (const spec of blueprints[subject]) {
      const candidates = shuffle(pool.filter(qz => !used.has(qz.id) && spec.filter(qz)));
      if (spec.sortByDifficulty) {
        candidates.sort((a, b) => (a.difficulty || 3) - (b.difficulty || 3));
      }
      // 降级规则：普通分区按 floor(池/卷数) 缩减；稀有题型分区（shared）跨卷轮换复用
      let scores = [...spec.scores];
      let count = spec.shared
        ? Math.min(scores.length, candidates.length)
        : Math.min(scores.length, candidates.length, Math.floor(candidates.length / PAPER_N));
      if (count === 0) continue;
      scores = scores.slice(0, count);
      const rotated = candidates.slice(pi * count).concat(candidates.slice(0, pi * count));
      const picked = rotated.slice(0, count);
      picked.forEach(qz => used.add(qz.id));

      // 按分值分组成小节（同分值统一 scorePerQuestion）
      const groups = {};
      scores.forEach((s, i) => {
        (groups[s] = groups[s] || []).push(picked[i]);
      });
      const uniq = Object.keys(groups).map(Number).sort((a, b) => a - b);
      for (const s of uniq) {
        const items = groups[s];
        secIdx += 1;
        const suffix = uniq.length > 1 ? `（${items.length} 题，每题 ${s} 分）` : `（${items.length} 题，每题 ${s} 分）`;
        sections.push({
          id: `sec-${secIdx}`,
          title: `${spec.title}${suffix}`,
          description: `${items.length} 题，每题 ${s} 分，共 ${items.length * s} 分。`,
          scorePerQuestion: s,
          questionIds: items.map(qz => qz.id),
        });
        totalScore += s * items.length;
      }
    }

    papers.push({
      id: `${subject}-sim-${String(pi + 1).padStart(3, "0")}`,
      subject,
      title: `${labels[subject]}冲刺模拟卷（${cnNums[pi]}）`,
      description: `卷面结构参考真实中考（满分蓝图 ${fullScores[subject]} 分，按可用题池自适应缩减）。满分 ${totalScore} 分。`,
      durationMinutes: durations[subject],
      level: "mock",
      sections,
    });
  }

  const examPath = path.join(DIR, examFiles[subject]);
  const examData = JSON.parse(readFileSync(examPath, "utf8"));
  examData.exams = examData.exams.filter(e => !e.id.startsWith(`${subject}-sim-`));
  examData.exams.push(...papers);
  examData.version = `${subject}-exams-v0.17`;
  writeFileSync(examPath, JSON.stringify(examData, null, 2) + "\n");

  const genOnly = pool.filter(qz => qz.id.startsWith("gen-") || qz._generated);
  const out = { version: `gen-${subject}-v0.17`, questions: genOnly };
  writeFileSync(path.join(DIR, `${subject}-generated.json`), JSON.stringify(out, null, 2) + "\n");

  const real = papers.reduce((sum, p) => sum + p.sections.reduce((s, sec) => s + sec.questionIds.length, 0), 0);
  console.log(`${subject}: 题池 ${pool.length} 题，试卷 ${papers.length} 套（挂题 ${real}）`);
}

console.log("done");

function load(name) {
  return JSON.parse(readFileSync(path.join(DIR, name), "utf8"));
}
