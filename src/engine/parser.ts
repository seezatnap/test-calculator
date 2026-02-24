import type { Token, TokenType, TokenizerError, TokenizerErrorCode } from "./tokenizer";
import { tokenizeExpression } from "./tokenizer";

export type BinaryOperator = "+" | "-" | "*" | "/" | "^";
export type UnaryOperator = "+" | "-";

interface ExpressionNodeBase {
  start: number;
  end: number;
}

export interface NumberLiteralNode extends ExpressionNodeBase {
  kind: "number";
  raw: string;
  value: number;
}

export interface UnaryExpressionNode extends ExpressionNodeBase {
  kind: "unary";
  operator: UnaryOperator;
  operand: ExpressionNode;
}

export interface BinaryExpressionNode extends ExpressionNodeBase {
  kind: "binary";
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

export type ExpressionNode = NumberLiteralNode | UnaryExpressionNode | BinaryExpressionNode;

export type Associativity = "left" | "right";

export interface BinaryOperatorRule {
  precedence: number;
  associativity: Associativity;
}

export const BINARY_OPERATOR_RULES: Readonly<Record<BinaryOperator, BinaryOperatorRule>> =
  Object.freeze({
    "+": { precedence: 1, associativity: "left" },
    "-": { precedence: 1, associativity: "left" },
    "*": { precedence: 2, associativity: "left" },
    "/": { precedence: 2, associativity: "left" },
    "^": { precedence: 3, associativity: "right" }
  });

export type ParserStageErrorCode =
  | "empty_expression"
  | "unexpected_token"
  | "unexpected_end_of_input"
  | "missing_closing_parenthesis";

export interface ParserStageError {
  stage: "parser";
  code: ParserStageErrorCode;
  message: string;
  index: number;
  length: number;
  expected: readonly string[];
  received: string;
}

export type ParserErrorCode = ParserStageErrorCode | TokenizerErrorCode;
export type ParserError = ParserStageError | TokenizerError;

export type ParseExpressionResult =
  | { ok: true; ast: ExpressionNode; tokens: readonly Token[] }
  | { ok: false; error: ParserError };

const MIN_BINARY_PRECEDENCE = 1;

const TOKEN_TO_BINARY_OPERATOR: Readonly<Partial<Record<TokenType, BinaryOperator>>> = Object.freeze({
  plus: "+",
  minus: "-",
  star: "*",
  slash: "/",
  caret: "^"
});

const TOKEN_TO_UNARY_OPERATOR: Readonly<Partial<Record<TokenType, UnaryOperator>>> = Object.freeze({
  plus: "+",
  minus: "-"
});

const TOKEN_LABELS: Readonly<Record<TokenType, string>> = Object.freeze({
  number: "number",
  plus: "+",
  minus: "-",
  star: "*",
  slash: "/",
  caret: "^",
  leftParen: "(",
  rightParen: ")",
  eof: "end of input"
});

const describeExpected = (expected: readonly string[]): string => {
  if (expected.length === 0) {
    return "expression";
  }

  if (expected.length === 1) {
    return expected[0] ?? "expression";
  }

  const last = expected[expected.length - 1];
  if (last === undefined) {
    return expected.join(", ");
  }

  return `${expected.slice(0, -1).join(", ")} or ${last}`;
};

class ParserFailure extends Error {
  constructor(readonly error: ParserStageError) {
    super(error.message);
    this.name = "ParserFailure";
  }
}

class DeterministicParser {
  private position = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): ExpressionNode {
    const current = this.peek();
    if (current.type === "eof") {
      this.fail({
        code: "empty_expression",
        index: current.start,
        length: 0,
        expected: ["number", "(", "unary +/-"],
        received: "end of input",
        message: "Expression is empty."
      });
    }

    const ast = this.parseBinaryExpression(MIN_BINARY_PRECEDENCE);
    const trailing = this.peek();
    if (trailing.type !== "eof") {
      this.failUnexpectedToken(["end of input"], trailing);
    }

    return ast;
  }

  private parseBinaryExpression(minPrecedence: number): ExpressionNode {
    let left = this.parseUnaryExpression();

    while (true) {
      const currentToken = this.peek();
      const operator = TOKEN_TO_BINARY_OPERATOR[currentToken.type];
      if (operator === undefined) {
        break;
      }

      const rule = BINARY_OPERATOR_RULES[operator];
      if (rule.precedence < minPrecedence) {
        break;
      }

      this.consume();
      const nextPrecedence =
        rule.associativity === "left" ? rule.precedence + 1 : rule.precedence;
      const right = this.parseBinaryExpression(nextPrecedence);
      left = {
        kind: "binary",
        operator,
        left,
        right,
        start: left.start,
        end: right.end
      };
    }

    return left;
  }

  private parseUnaryExpression(): ExpressionNode {
    const current = this.peek();
    const operator = TOKEN_TO_UNARY_OPERATOR[current.type];

    if (operator !== undefined) {
      this.consume();
      const operand = this.parseUnaryExpression();
      return {
        kind: "unary",
        operator,
        operand,
        start: current.start,
        end: operand.end
      };
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ExpressionNode {
    const current = this.peek();

    if (current.type === "number") {
      this.consume();
      const value = Number(current.lexeme);
      if (!Number.isFinite(value)) {
        this.fail({
          code: "unexpected_token",
          index: current.start,
          length: Math.max(current.end - current.start, 1),
          expected: ["finite number"],
          received: current.lexeme,
          message: `Number token "${current.lexeme}" is not finite.`
        });
      }

      return {
        kind: "number",
        raw: current.lexeme,
        value,
        start: current.start,
        end: current.end
      };
    }

    if (current.type === "leftParen") {
      const opening = this.consume();
      const innerExpression = this.parseBinaryExpression(MIN_BINARY_PRECEDENCE);
      const closing = this.peek();

      if (closing.type !== "rightParen") {
        this.fail({
          code: "missing_closing_parenthesis",
          index: closing.start,
          length: Math.max(closing.end - closing.start, 1),
          expected: [")"],
          received: TOKEN_LABELS[closing.type],
          message: 'Expected ")" to close parenthesized expression.'
        });
      }

      this.consume();
      return {
        ...innerExpression,
        start: opening.start,
        end: closing.end
      };
    }

    this.failUnexpectedToken(["number", "(", "unary +/-"], current);
  }

  private peek(): Token {
    const token = this.tokens[this.position];
    if (token !== undefined) {
      return token;
    }

    const fallback = this.tokens[this.tokens.length - 1];
    if (fallback === undefined) {
      throw new Error("Parser requires at least one EOF token.");
    }

    return fallback;
  }

  private consume(): Token {
    const token = this.peek();
    if (this.position < this.tokens.length - 1) {
      this.position += 1;
    }
    return token;
  }

  private failUnexpectedToken(expected: readonly string[], token: Token): never {
    const expectedText = describeExpected(expected);
    if (token.type === "eof") {
      this.fail({
        code: "unexpected_end_of_input",
        index: token.start,
        length: 0,
        expected,
        received: "end of input",
        message: `Expected ${expectedText}, but reached end of input.`
      });
    }

    this.fail({
      code: "unexpected_token",
      index: token.start,
      length: Math.max(token.end - token.start, 1),
      expected,
      received: token.lexeme,
      message: `Expected ${expectedText}, found "${token.lexeme}".`
    });
  }

  private fail(error: Omit<ParserStageError, "stage">): never {
    throw new ParserFailure({
      stage: "parser",
      ...error
    });
  }
}

export const parseExpression = (expression: string): ParseExpressionResult => {
  const tokenizeResult = tokenizeExpression(expression);
  if (!tokenizeResult.ok) {
    return {
      ok: false,
      error: tokenizeResult.error
    };
  }

  try {
    const parser = new DeterministicParser(tokenizeResult.tokens);
    const ast = parser.parse();
    return {
      ok: true,
      ast,
      tokens: tokenizeResult.tokens
    };
  } catch (error) {
    if (error instanceof ParserFailure) {
      return {
        ok: false,
        error: error.error
      };
    }

    throw error;
  }
};
