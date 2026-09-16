/**
 * Tool definitions and executors for the Muse agent.
 *
 * Two kinds of tools live here:
 *  - Server tools (web_search, web_fetch) run on Anthropic's infrastructure.
 *    We only declare them; there is nothing to execute locally.
 *  - Custom tools (get_current_datetime, calculator) run right here in the
 *    server route. `executeTool` dispatches those.
 */

// ---------------------------------------------------------------------------
// Tool declarations sent to the Claude API.
// Server tools use Anthropic's version-suffixed `type` literals.
// ---------------------------------------------------------------------------

export const serverTools = [
  { type: "web_search_20260209", name: "web_search", max_uses: 5 },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5 },
] as const;

export const customTools = [
  {
    name: "get_current_datetime",
    description:
      "Get the current date and time. Use this whenever the user asks about " +
      "'now', 'today', 'the current time', or needs date math relative to the present.",
    input_schema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description:
            "Optional IANA timezone name, e.g. 'America/New_York' or 'Europe/Dublin'. " +
            "Defaults to UTC.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "calculator",
    description:
      "Evaluate a mathematical expression and return the numeric result. " +
      "Supports + - * / %, exponentiation (^ or **), parentheses, unary minus, " +
      "and the functions sqrt, abs, round, floor, ceil, sin, cos, tan, log, ln, " +
      "plus the constants pi and e. Use this for any arithmetic instead of doing " +
      "it in your head.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "The expression to evaluate, e.g. '(3 + 4) * 2 ^ 3'.",
        },
      },
      required: ["expression"],
      additionalProperties: false,
    },
  },
] as const;

/** Every tool declaration, in a stable order (server first for cache stability). */
export const allTools = [...serverTools, ...customTools];

/** Names of tools we execute locally (as opposed to Anthropic's server tools). */
export const customToolNames: Set<string> = new Set(
  customTools.map((t) => t.name),
);

// ---------------------------------------------------------------------------
// Executor for custom (locally-run) tools.
// ---------------------------------------------------------------------------

export async function executeTool(
  name: string,
  input: unknown,
): Promise<string> {
  const args = (input ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "get_current_datetime":
        return getCurrentDatetime(args.timezone);
      case "calculator":
        return runCalculator(args.expression);
      default:
        return `Error: unknown tool "${name}".`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error running ${name}: ${message}`;
  }
}

// ---------------------------------------------------------------------------
// get_current_datetime
// ---------------------------------------------------------------------------

function getCurrentDatetime(timezone: unknown): string {
  const now = new Date();
  const tz = typeof timezone === "string" && timezone.trim() ? timezone : "UTC";

  let formatted: string;
  try {
    formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "long",
    }).format(now);
  } catch {
    // Invalid timezone -> fall back to UTC rather than throwing.
    formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "long",
    }).format(now);
    return JSON.stringify({
      warning: `Unknown timezone "${tz}"; showing UTC instead.`,
      iso_utc: now.toISOString(),
      formatted,
      timezone: "UTC",
    });
  }

  return JSON.stringify({
    iso_utc: now.toISOString(),
    formatted,
    timezone: tz,
  });
}

// ---------------------------------------------------------------------------
// calculator - a small, safe expression evaluator (no eval()).
// Tokenizer + shunting-yard to RPN + RPN evaluation.
// ---------------------------------------------------------------------------

type Token =
  | { kind: "num"; value: number }
  | { kind: "op"; value: string }
  | { kind: "func"; value: string }
  | { kind: "paren"; value: "(" | ")" };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log10,
  ln: Math.log,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const OPERATORS: Record<
  string,
  { precedence: number; assoc: "left" | "right"; apply: (a: number, b: number) => number }
> = {
  "+": { precedence: 2, assoc: "left", apply: (a, b) => a + b },
  "-": { precedence: 2, assoc: "left", apply: (a, b) => a - b },
  "*": { precedence: 3, assoc: "left", apply: (a, b) => a * b },
  "/": { precedence: 3, assoc: "left", apply: (a, b) => a / b },
  "%": { precedence: 3, assoc: "left", apply: (a, b) => a % b },
  "^": { precedence: 4, assoc: "right", apply: (a, b) => Math.pow(a, b) },
  // Unary minus, represented internally as "u-".
  "u-": { precedence: 5, assoc: "right", apply: (_a, b) => -b },
};

function runCalculator(expression: unknown): string {
  if (typeof expression !== "string" || !expression.trim()) {
    throw new Error("expression must be a non-empty string");
  }
  const normalized = expression.replace(/\*\*/g, "^");
  const tokens = tokenize(normalized);
  const rpn = toRPN(tokens);
  const result = evalRPN(rpn);
  if (!Number.isFinite(result)) {
    throw new Error("result is not a finite number (division by zero?)");
  }
  return JSON.stringify({ expression, result });
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isAlpha = (c: string) => /[a-zA-Z]/.test(c);

  while (i < input.length) {
    const c = input[i];

    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }

    if (isDigit(c) || (c === "." && isDigit(input[i + 1] ?? ""))) {
      let num = "";
      while (i < input.length && (isDigit(input[i]) || input[i] === ".")) {
        num += input[i++];
      }
      const value = Number(num);
      if (Number.isNaN(value)) throw new Error(`invalid number "${num}"`);
      tokens.push({ kind: "num", value });
      continue;
    }

    if (isAlpha(c)) {
      let word = "";
      while (i < input.length && isAlpha(input[i])) word += input[i++];
      const lower = word.toLowerCase();
      if (lower in FUNCTIONS) {
        tokens.push({ kind: "func", value: lower });
      } else if (lower in CONSTANTS) {
        tokens.push({ kind: "num", value: CONSTANTS[lower] });
      } else {
        throw new Error(`unknown identifier "${word}"`);
      }
      continue;
    }

    if (c === "(" || c === ")") {
      tokens.push({ kind: "paren", value: c });
      i++;
      continue;
    }

    if ("+-*/%^".includes(c)) {
      // Decide if "-" / "+" is unary based on the previous token.
      const prev = tokens[tokens.length - 1];
      const isUnary =
        (c === "-" || c === "+") &&
        (!prev ||
          prev.kind === "op" ||
          (prev.kind === "paren" && prev.value === "("));
      if (isUnary) {
        if (c === "-") tokens.push({ kind: "op", value: "u-" });
        // unary plus is a no-op; drop it
      } else {
        tokens.push({ kind: "op", value: c });
      }
      i++;
      continue;
    }

    throw new Error(`unexpected character "${c}"`);
  }

  return tokens;
}

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    switch (token.kind) {
      case "num":
        output.push(token);
        break;
      case "func":
        stack.push(token);
        break;
      case "op": {
        const o1 = OPERATORS[token.value];
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.kind === "func") {
            output.push(stack.pop()!);
            continue;
          }
          if (top.kind === "op") {
            const o2 = OPERATORS[top.value];
            if (
              o2.precedence > o1.precedence ||
              (o2.precedence === o1.precedence && o1.assoc === "left")
            ) {
              output.push(stack.pop()!);
              continue;
            }
          }
          break;
        }
        stack.push(token);
        break;
      }
      case "paren":
        if (token.value === "(") {
          stack.push(token);
        } else {
          let found = false;
          while (stack.length) {
            const top = stack.pop()!;
            if (top.kind === "paren" && top.value === "(") {
              found = true;
              break;
            }
            output.push(top);
          }
          if (!found) throw new Error("mismatched parentheses");
          // If a function precedes the group, pop it onto the output.
          const maybeFunc = stack[stack.length - 1];
          if (maybeFunc && maybeFunc.kind === "func") output.push(stack.pop()!);
        }
        break;
    }
  }

  while (stack.length) {
    const top = stack.pop()!;
    if (top.kind === "paren") throw new Error("mismatched parentheses");
    output.push(top);
  }

  return output;
}

function evalRPN(rpn: Token[]): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.kind === "num") {
      stack.push(token.value);
    } else if (token.kind === "func") {
      const x = stack.pop();
      if (x === undefined) throw new Error("malformed expression");
      stack.push(FUNCTIONS[token.value](x));
    } else if (token.kind === "op") {
      const op = OPERATORS[token.value];
      if (token.value === "u-") {
        const x = stack.pop();
        if (x === undefined) throw new Error("malformed expression");
        stack.push(op.apply(0, x));
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) {
          throw new Error("malformed expression");
        }
        stack.push(op.apply(a, b));
      }
    }
  }

  if (stack.length !== 1) throw new Error("malformed expression");
  return stack[0];
}
