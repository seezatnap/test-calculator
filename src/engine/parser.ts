export type TokenType =
  | "number"
  | "plus"
  | "minus"
  | "star"
  | "slash"
  | "caret"
  | "left_paren"
  | "right_paren"
  | "eof";

export interface Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly start: number;
  readonly end: number;
}

export type TokenizeErrorCode = "unexpected_character" | "invalid_number";

export interface TokenizeError {
  readonly stage: "tokenizer";
  readonly code: TokenizeErrorCode;
  readonly message: string;
  readonly position: number;
  readonly length: number;
  readonly found: string;
}

export type TokenizeResult =
  | {
      readonly ok: true;
      readonly tokens: ReadonlyArray<Token>;
    }
  | {
      readonly ok: false;
      readonly error: TokenizeError;
    };

export type BinaryOperator = "+" | "-" | "*" | "/" | "^";

export interface NumberLiteralNode {
  readonly type: "number";
  readonly raw: string;
  readonly value: number;
  readonly start: number;
  readonly end: number;
}

export interface BinaryExpressionNode {
  readonly type: "binary";
  readonly operator: BinaryOperator;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
  readonly start: number;
  readonly end: number;
}

export type ExpressionNode = NumberLiteralNode | BinaryExpressionNode;

export type ParserErrorCode =
  | "empty_expression"
  | "unexpected_token"
  | "unexpected_end_of_input"
  | "missing_closing_parenthesis"
  | "trailing_tokens";

export interface ParserError {
  readonly stage: "parser";
  readonly code: ParserErrorCode;
  readonly message: string;
  readonly position: number;
  readonly expected: ReadonlyArray<string>;
  readonly found: string | null;
}

export type ExpressionError = TokenizeError | ParserError;

export type ParseExpressionResult =
  | {
      readonly ok: true;
      readonly ast: ExpressionNode;
      readonly tokens: ReadonlyArray<Token>;
    }
  | {
      readonly ok: false;
      readonly error: ExpressionError;
    };

interface ParseNodeSuccess {
  readonly ok: true;
  readonly node: ExpressionNode;
}

interface ParseNodeFailure {
  readonly ok: false;
  readonly error: ParserError;
}

type ParseNodeResult = ParseNodeSuccess | ParseNodeFailure;

const NUMBER_EXPECTATION = ['number', '"("'] as const;

export function tokenize(expression: string): TokenizeResult {
  const tokens: Array<Token> = [];
  let index = 0;

  while (index < expression.length) {
    const current = expression[index];
    if (current === undefined) {
      break;
    }

    if (isWhitespace(current)) {
      index += 1;
      continue;
    }

    if (isDigit(current) || current === ".") {
      const readResult = readNumberToken(expression, index);
      if (!readResult.ok) {
        return {
          ok: false,
          error: readResult.error
        };
      }

      tokens.push(readResult.token);
      index = readResult.nextIndex;
      continue;
    }

    const singleCharToken = toSingleCharToken(current, index);
    if (singleCharToken !== null) {
      tokens.push(singleCharToken);
      index += 1;
      continue;
    }

    return {
      ok: false,
      error: {
        stage: "tokenizer",
        code: "unexpected_character",
        message: `Unexpected character "${current}" at position ${index}.`,
        position: index,
        length: 1,
        found: current
      }
    };
  }

  tokens.push({
    type: "eof",
    lexeme: "",
    start: expression.length,
    end: expression.length
  });

  return {
    ok: true,
    tokens
  };
}

export function parseExpression(expression: string): ParseExpressionResult {
  const tokenized = tokenize(expression);
  if (!tokenized.ok) {
    return {
      ok: false,
      error: tokenized.error
    };
  }

  const parser = new DeterministicParser(tokenized.tokens);
  const parsed = parser.parse();
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error
    };
  }

  return {
    ok: true,
    ast: parsed.node,
    tokens: tokenized.tokens
  };
}

function isWhitespace(value: string): boolean {
  return value === " " || value === "\t" || value === "\n" || value === "\r";
}

function isDigit(value: string): boolean {
  return value >= "0" && value <= "9";
}

function toSingleCharToken(char: string, start: number): Token | null {
  switch (char) {
    case "+":
      return {
        type: "plus",
        lexeme: char,
        start,
        end: start + 1
      };
    case "-":
      return {
        type: "minus",
        lexeme: char,
        start,
        end: start + 1
      };
    case "*":
      return {
        type: "star",
        lexeme: char,
        start,
        end: start + 1
      };
    case "/":
      return {
        type: "slash",
        lexeme: char,
        start,
        end: start + 1
      };
    case "^":
      return {
        type: "caret",
        lexeme: char,
        start,
        end: start + 1
      };
    case "(":
      return {
        type: "left_paren",
        lexeme: char,
        start,
        end: start + 1
      };
    case ")":
      return {
        type: "right_paren",
        lexeme: char,
        start,
        end: start + 1
      };
    default:
      return null;
  }
}

function readNumberToken(
  expression: string,
  start: number
):
  | {
      readonly ok: true;
      readonly token: Token;
      readonly nextIndex: number;
    }
  | {
      readonly ok: false;
      readonly error: TokenizeError;
    } {
  let index = start;
  let hasDigitsBeforeDot = false;
  let hasDigitsAfterDot = false;

  while (index < expression.length && isDigitAt(expression, index)) {
    hasDigitsBeforeDot = true;
    index += 1;
  }

  if (index < expression.length && expression[index] === ".") {
    index += 1;

    while (index < expression.length && isDigitAt(expression, index)) {
      hasDigitsAfterDot = true;
      index += 1;
    }

    if (index < expression.length && expression[index] === ".") {
      return {
        ok: false,
        error: {
          stage: "tokenizer",
          code: "invalid_number",
          message: `Invalid number near position ${start}: multiple decimal points are not allowed.`,
          position: index,
          length: 1,
          found: "."
        }
      };
    }
  }

  if (!hasDigitsBeforeDot && !hasDigitsAfterDot) {
    return {
      ok: false,
      error: {
        stage: "tokenizer",
        code: "invalid_number",
        message: `Invalid number at position ${start}: expected at least one digit.`,
        position: start,
        length: 1,
        found: "."
      }
    };
  }

  const lexeme = expression.slice(start, index);
  const value = Number.parseFloat(lexeme);
  if (Number.isNaN(value)) {
    return {
      ok: false,
      error: {
        stage: "tokenizer",
        code: "invalid_number",
        message: `Invalid number token "${lexeme}" at position ${start}.`,
        position: start,
        length: lexeme.length,
        found: lexeme
      }
    };
  }

  return {
    ok: true,
    token: {
      type: "number",
      lexeme,
      start,
      end: index
    },
    nextIndex: index
  };
}

function isDigitAt(expression: string, index: number): boolean {
  const value = expression[index];
  return value !== undefined && isDigit(value);
}

function createNumberNode(token: Token): NumberLiteralNode {
  return {
    type: "number",
    raw: token.lexeme,
    value: Number.parseFloat(token.lexeme),
    start: token.start,
    end: token.end
  };
}

function createBinaryNode(
  operator: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode
): BinaryExpressionNode {
  return {
    type: "binary",
    operator,
    left,
    right,
    start: left.start,
    end: right.end
  };
}

class DeterministicParser {
  private index = 0;

  constructor(private readonly tokens: ReadonlyArray<Token>) {}

  parse(): ParseNodeResult {
    if (this.current().type === "eof") {
      return {
        ok: false,
        error: {
          stage: "parser",
          code: "empty_expression",
          message: "Expression is empty.",
          position: this.current().start,
          expected: [...NUMBER_EXPECTATION],
          found: null
        }
      };
    }

    const expression = this.parseAdditive();
    if (!expression.ok) {
      return expression;
    }

    const trailing = this.current();
    if (trailing.type !== "eof") {
      return {
        ok: false,
        error: {
          stage: "parser",
          code: "trailing_tokens",
          message: `Unexpected token ${describeToken(trailing)} at position ${trailing.start}; expected end of input.`,
          position: trailing.start,
          expected: ["end of input"],
          found: trailing.lexeme
        }
      };
    }

    return expression;
  }

  private parseAdditive(): ParseNodeResult {
    const left = this.parseMultiplicative();
    if (!left.ok) {
      return left;
    }

    let node = left.node;
    while (true) {
      const operator = this.consumeAny("plus", "minus");
      if (operator === null) {
        return {
          ok: true,
          node
        };
      }

      const right = this.parseMultiplicative();
      if (!right.ok) {
        return right;
      }

      node = createBinaryNode(
        operator.type === "plus" ? "+" : "-",
        node,
        right.node
      );
    }
  }

  private parseMultiplicative(): ParseNodeResult {
    const left = this.parseExponent();
    if (!left.ok) {
      return left;
    }

    let node = left.node;
    while (true) {
      const operator = this.consumeAny("star", "slash");
      if (operator === null) {
        return {
          ok: true,
          node
        };
      }

      const right = this.parseExponent();
      if (!right.ok) {
        return right;
      }

      node = createBinaryNode(
        operator.type === "star" ? "*" : "/",
        node,
        right.node
      );
    }
  }

  private parseExponent(): ParseNodeResult {
    const left = this.parsePrimary();
    if (!left.ok) {
      return left;
    }

    const operator = this.consumeAny("caret");
    if (operator === null) {
      return left;
    }

    const right = this.parseExponent();
    if (!right.ok) {
      return right;
    }

    return {
      ok: true,
      node: createBinaryNode("^", left.node, right.node)
    };
  }

  private parsePrimary(): ParseNodeResult {
    const numberToken = this.consumeAny("number");
    if (numberToken !== null) {
      return {
        ok: true,
        node: createNumberNode(numberToken)
      };
    }

    const leftParen = this.consumeAny("left_paren");
    if (leftParen !== null) {
      const inner = this.parseAdditive();
      if (!inner.ok) {
        return inner;
      }

      const rightParen = this.consumeAny("right_paren");
      if (rightParen === null) {
        return {
          ok: false,
          error: {
            stage: "parser",
            code: "missing_closing_parenthesis",
            message: `Expected ")" to close "(" opened at position ${leftParen.start}.`,
            position: leftParen.start,
            expected: ['")"'],
            found: this.current().type === "eof" ? null : this.current().lexeme
          }
        };
      }

      return {
        ok: true,
        node: {
          ...inner.node,
          start: leftParen.start,
          end: rightParen.end
        }
      };
    }

    const current = this.current();
    if (current.type === "eof") {
      return {
        ok: false,
        error: {
          stage: "parser",
          code: "unexpected_end_of_input",
          message: `Unexpected end of input at position ${current.start}; expected ${NUMBER_EXPECTATION.join(" or ")}.`,
          position: current.start,
          expected: [...NUMBER_EXPECTATION],
          found: null
        }
      };
    }

    return {
      ok: false,
      error: {
        stage: "parser",
        code: "unexpected_token",
        message: `Unexpected token ${describeToken(current)} at position ${current.start}; expected ${NUMBER_EXPECTATION.join(" or ")}.`,
        position: current.start,
        expected: [...NUMBER_EXPECTATION],
        found: current.lexeme
      }
    };
  }

  private current(): Token {
    const token = this.tokens[this.index];
    if (token !== undefined) {
      return token;
    }

    return this.tokens[this.tokens.length - 1]!;
  }

  private consumeAny(...types: ReadonlyArray<TokenType>): Token | null {
    const token = this.current();
    if (!types.includes(token.type)) {
      return null;
    }

    this.index += 1;
    return token;
  }
}

function describeToken(token: Token): string {
  if (token.type === "eof") {
    return "end of input";
  }

  return `"${token.lexeme}"`;
}
