/**
 * 代数表达式等价判分引擎（零依赖）。
 *
 * 支持一元代数式（变量 x）的解析与求值：
 * - 数字（小数）、变量 x、+ - * / ^、括号、一元负号；
 * - 隐式乘法：`2x`、`3(x+1)`、`x(x-2)`、`(x+1)(x-1)`；
 * - 全角字符与 ×、÷ 归一。
 *
 * 等价判断采用采样法：在若干采样点上比较两个函数值，
 * 采样点上一致（含相对容差）即视为等价。适合中考范围内的
 * 多项式与分式；无法解析的表达式返回 null，由调用方降级处理。
 */

export type ExpressionNode =
  | { kind: "number"; value: number }
  | { kind: "variable" }
  | { kind: "unary"; operator: "-" | "+"; operand: ExpressionNode }
  | { kind: "binary"; operator: "+" | "-" | "*" | "/"; left: ExpressionNode; right: ExpressionNode }
  | { kind: "power"; base: ExpressionNode; exponent: ExpressionNode };

type Token =
  | { type: "number"; value: number }
  | { type: "variable" }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "lparen" }
  | { type: "rparen" };

function toHalfWidthDigits(value: string): string {
  return value
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, " ")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
}

export function tokenizeExpression(raw: string): Token[] | null {
  const text = toHalfWidthDigits(raw).replace(/\s+/g, "");
  const tokens: Token[] = [];
  let index = 0;

  while (index < text.length) {
    const ch = text[index];

    if (/[0-9.]/.test(ch)) {
      const start = index;
      while (index < text.length && /[0-9.]/.test(text[index])) index += 1;
      const value = Number(text.slice(start, index));
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: "number", value });
      continue;
    }

    if (ch === "x" || ch === "X") {
      tokens.push({ type: "variable" });
      index += 1;
      continue;
    }

    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^") {
      tokens.push({ type: "op", value: ch });
      index += 1;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }

    return null;
  }

  return tokens;
}

class ExpressionParser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): ExpressionNode | null {
    const node = this.parseSum();
    if (!node) return null;
    if (this.position !== this.tokens.length) return null;
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private parseSum(): ExpressionNode | null {
    let left = this.parseTerm();
    if (!left) return null;

    while (true) {
      const token = this.peek();
      if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
        this.position += 1;
        const right = this.parseTerm();
        if (!right) return null;
        left = { kind: "binary", operator: token.value, left, right };
      } else {
        return left;
      }
    }
  }

  private parseTerm(): ExpressionNode | null {
    let left = this.parseUnary();
    if (!left) return null;

    while (true) {
      const token = this.peek();

      if (token?.type === "op" && (token.value === "*" || token.value === "/")) {
        this.position += 1;
        const right = this.parseUnary();
        if (!right) return null;
        left = { kind: "binary", operator: token.value, left, right };
        continue;
      }

      // 隐式乘法：当前已有一个因子，下一个 token 又能开启一个原子
      // （数字、变量、左括号），如 2x、3(x+1)、(x+1)(x-1)、2x^2。
      if (
        token &&
        (token.type === "number" ||
          token.type === "variable" ||
          token.type === "lparen")
      ) {
        const right = this.parseUnary();
        if (!right) return null;
        left = { kind: "binary", operator: "*", left, right };
        continue;
      }

      return left;
    }
  }

  private parseUnary(): ExpressionNode | null {
    const token = this.peek();
    if (token?.type === "op" && (token.value === "-" || token.value === "+")) {
      this.position += 1;
      const operand = this.parseUnary();
      if (!operand) return null;
      return { kind: "unary", operator: token.value, operand };
    }
    return this.parsePower();
  }

  private parsePower(): ExpressionNode | null {
    const base = this.parseAtom();
    if (!base) return null;

    const token = this.peek();
    if (token?.type === "op" && token.value === "^") {
      this.position += 1;
      const exponent = this.parseUnary();
      if (!exponent) return null;
      return { kind: "power", base, exponent };
    }

    return base;
  }

  private parseAtom(): ExpressionNode | null {
    const token = this.peek();

    if (token?.type === "number") {
      this.position += 1;
      return { kind: "number", value: token.value };
    }

    if (token?.type === "variable") {
      this.position += 1;
      return { kind: "variable" };
    }

    if (token?.type === "lparen") {
      this.position += 1;
      const inner = this.parseSum();
      if (!inner) return null;
      const closing = this.peek();
      if (closing?.type !== "rparen") return null;
      this.position += 1;
      return inner;
    }

    return null;
  }
}

export function parseExpression(raw: string): ExpressionNode | null {
  const tokens = tokenizeExpression(raw);
  if (!tokens || tokens.length === 0) return null;
  return new ExpressionParser(tokens).parse();
}

export function evaluateExpression(
  node: ExpressionNode,
  x: number
): number {
  switch (node.kind) {
    case "number":
      return node.value;
    case "variable":
      return x;
    case "unary":
      return node.operator === "-" ? -evaluateExpression(node.operand, x) : evaluateExpression(node.operand, x);
    case "binary": {
      const left = evaluateExpression(node.left, x);
      const right = evaluateExpression(node.right, x);
      if (node.operator === "+") return left + right;
      if (node.operator === "-") return left - right;
      if (node.operator === "*") return left * right;
      return left / right;
    }
    case "power": {
      const base = evaluateExpression(node.base, x);
      const exponent = evaluateExpression(node.exponent, x);
      return base ** exponent;
    }
  }
}

// 采样点取无理数附近，避免撞上整系数表达式的公共零点。
const SAMPLE_POINTS = [
  -3.73, -2.31, -1.41, -0.57, 0.29, 0.91, 1.73, 2.63, 4.13, 5.31,
];

const MIN_VALID_SAMPLES = 5;
const RELATIVE_TOLERANCE = 1e-9;

/** 去掉 "y =" / "y=" 前缀，把等式右边作为表达式处理。 */
export function stripLeadingY(raw: string): string {
  return toHalfWidthDigits(raw).replace(/^\s*[yY]\s*=\s*/, "");
}

/**
 * 判断两个一元代数式在采样点上是否等价。
 * 任一侧无法解析返回 null；等价返回 true，不等价返回 false。
 * 双方在某采样点无定义（如除零）时跳过该点，有效采样点不足 5 个视为无法判定。
 */
export function areExpressionsEquivalent(
  leftRaw: string,
  rightRaw: string
): boolean | null {
  const left = parseExpression(stripLeadingY(leftRaw));
  const right = parseExpression(stripLeadingY(rightRaw));
  if (!left || !right) return null;

  let compared = 0;

  for (const x of SAMPLE_POINTS) {
    const leftValue = evaluateExpression(left, x);
    const rightValue = evaluateExpression(right, x);

    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) continue;

    const scale = Math.max(1, Math.abs(leftValue), Math.abs(rightValue));
    if (Math.abs(leftValue - rightValue) / scale > RELATIVE_TOLERANCE) {
      return false;
    }
    compared += 1;
  }

  return compared >= MIN_VALID_SAMPLES ? true : null;
}
