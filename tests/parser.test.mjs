import assert from "node:assert/strict";
import test from "node:test";

import { parseExpression, tokenize } from "../build/src/engine/index.js";

test("tokenize scans operators, decimals, parentheses, and positions", () => {
  const result = tokenize(" 3.5 + (.25)");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(
    result.tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
      start: token.start,
      end: token.end
    })),
    [
      { type: "number", lexeme: "3.5", start: 1, end: 4 },
      { type: "plus", lexeme: "+", start: 5, end: 6 },
      { type: "left_paren", lexeme: "(", start: 7, end: 8 },
      { type: "number", lexeme: ".25", start: 8, end: 11 },
      { type: "right_paren", lexeme: ")", start: 11, end: 12 },
      { type: "eof", lexeme: "", start: 12, end: 12 }
    ]
  );
});

test("parseExpression enforces precedence and associativity", () => {
  const result = parseExpression("1 + 2 * 3 - 4 / 2");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(toShape(result.ast), [
    "-",
    ["+", "1", ["*", "2", "3"]],
    ["/", "4", "2"]
  ]);
});

test("parseExpression treats exponentiation as right associative", () => {
  const result = parseExpression("2 ^ 3 ^ 2");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(toShape(result.ast), ["^", "2", ["^", "3", "2"]]);
});

test("parseExpression supports grouped decimal expressions", () => {
  const result = parseExpression("(1.5 + .5) * 2.");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(toShape(result.ast), ["*", ["+", "1.5", ".5"], "2."]);
});

test("tokenize returns structured invalid-number errors", () => {
  const result = tokenize("1..2");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "tokenizer");
  assert.equal(result.error.code, "invalid_number");
  assert.equal(result.error.position, 2);
  assert.equal(result.error.found, ".");
});

test("tokenize returns structured unexpected-character errors", () => {
  const result = tokenize("1a");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "tokenizer");
  assert.equal(result.error.code, "unexpected_character");
  assert.equal(result.error.position, 1);
  assert.equal(result.error.found, "a");
});

test("parseExpression reports empty input", () => {
  const result = parseExpression("");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "parser");
  assert.equal(result.error.code, "empty_expression");
  assert.equal(result.error.position, 0);
  assert.deepEqual(result.error.expected, ['number', '"("']);
  assert.equal(result.error.found, null);
});

test("parseExpression reports unexpected end of input", () => {
  const result = parseExpression("1 +");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "parser");
  assert.equal(result.error.code, "unexpected_end_of_input");
  assert.equal(result.error.position, 3);
  assert.equal(result.error.found, null);
});

test("parseExpression reports missing closing parenthesis", () => {
  const result = parseExpression("(1 + 2");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "parser");
  assert.equal(result.error.code, "missing_closing_parenthesis");
  assert.equal(result.error.position, 0);
  assert.deepEqual(result.error.expected, ['")"']);
  assert.equal(result.error.found, null);
});

test("parseExpression reports trailing tokens", () => {
  const result = parseExpression("1 2");

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error.stage, "parser");
  assert.equal(result.error.code, "trailing_tokens");
  assert.equal(result.error.position, 2);
  assert.deepEqual(result.error.expected, ["end of input"]);
  assert.equal(result.error.found, "2");
});

function toShape(node) {
  if (node.type === "number") {
    return node.raw;
  }

  return [node.operator, toShape(node.left), toShape(node.right)];
}
