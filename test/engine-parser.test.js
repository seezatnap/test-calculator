const assert = require("node:assert/strict");
const test = require("node:test");

const { parseExpression } = require("../dist/src/engine/parser.js");
const { tokenizeExpression } = require("../dist/src/engine/tokenizer.js");

const expectParseSuccess = (expression) => {
  const result = parseExpression(expression);
  assert.equal(result.ok, true, `Expected parse success for "${expression}"`);
  return result;
};

const expectParseFailure = (expression) => {
  const result = parseExpression(expression);
  assert.equal(result.ok, false, `Expected parse failure for "${expression}"`);
  return result.error;
};

test("tokenizeExpression tokenizes decimals, operators, and parentheses deterministically", () => {
  const result = tokenizeExpression(" 12.5 + (.75 - 2.) / 3 ^ 2 ");
  assert.equal(result.ok, true);

  const tokenTypes = result.tokens.map((token) => token.type);
  assert.deepEqual(tokenTypes, [
    "number",
    "plus",
    "leftParen",
    "number",
    "minus",
    "number",
    "rightParen",
    "slash",
    "number",
    "caret",
    "number",
    "eof"
  ]);

  const lexemes = result.tokens.map((token) => token.lexeme);
  assert.deepEqual(lexemes, [
    "12.5",
    "+",
    "(",
    ".75",
    "-",
    "2.",
    ")",
    "/",
    "3",
    "^",
    "2",
    ""
  ]);
});

test("tokenizeExpression returns structured invalid-number errors for malformed decimals", () => {
  const result = tokenizeExpression("1..2");
  assert.equal(result.ok, false);
  assert.equal(result.error.stage, "tokenizer");
  assert.equal(result.error.code, "invalid_number");
  assert.equal(result.error.index, 2);
});

test("tokenizeExpression returns structured unexpected-character errors", () => {
  const result = tokenizeExpression("2 + a");
  assert.equal(result.ok, false);
  assert.equal(result.error.stage, "tokenizer");
  assert.equal(result.error.code, "unexpected_character");
  assert.equal(result.error.index, 4);
});

test("parseExpression enforces multiplication before addition", () => {
  const result = expectParseSuccess("1 + 2 * 3");
  assert.equal(result.ast.kind, "binary");
  assert.equal(result.ast.operator, "+");
  assert.equal(result.ast.left.kind, "number");
  assert.equal(result.ast.left.raw, "1");
  assert.equal(result.ast.right.kind, "binary");
  assert.equal(result.ast.right.operator, "*");
});

test("parseExpression enforces exponentiation as right-associative", () => {
  const result = expectParseSuccess("2 ^ 3 ^ 2");
  assert.equal(result.ast.kind, "binary");
  assert.equal(result.ast.operator, "^");
  assert.equal(result.ast.left.kind, "number");
  assert.equal(result.ast.left.raw, "2");
  assert.equal(result.ast.right.kind, "binary");
  assert.equal(result.ast.right.operator, "^");
  assert.equal(result.ast.right.left.raw, "3");
  assert.equal(result.ast.right.right.raw, "2");
});

test("parseExpression honors parentheses over default precedence", () => {
  const result = expectParseSuccess("(1 + 2) * 3");
  assert.equal(result.ast.kind, "binary");
  assert.equal(result.ast.operator, "*");
  assert.equal(result.ast.left.kind, "binary");
  assert.equal(result.ast.left.operator, "+");
  assert.equal(result.ast.right.kind, "number");
  assert.equal(result.ast.right.raw, "3");
});

test("parseExpression handles unary operators deterministically", () => {
  const result = expectParseSuccess("-(2^2)");
  assert.equal(result.ast.kind, "unary");
  assert.equal(result.ast.operator, "-");
  assert.equal(result.ast.operand.kind, "binary");
  assert.equal(result.ast.operand.operator, "^");
});

test("parseExpression returns structured error for empty expression", () => {
  const error = expectParseFailure("   ");
  assert.equal(error.stage, "parser");
  assert.equal(error.code, "empty_expression");
  assert.deepEqual(error.expected, ["number", "(", "unary +/-"]);
});

test("parseExpression returns structured error for missing closing parenthesis", () => {
  const error = expectParseFailure("(1 + 2");
  assert.equal(error.stage, "parser");
  assert.equal(error.code, "missing_closing_parenthesis");
  assert.deepEqual(error.expected, [")"]);
  assert.equal(error.received, "end of input");
});

test("parseExpression returns structured error for invalid token sequence", () => {
  const error = expectParseFailure("1 + * 2");
  assert.equal(error.stage, "parser");
  assert.equal(error.code, "unexpected_token");
  assert.deepEqual(error.expected, ["number", "(", "unary +/-"]);
  assert.equal(error.received, "*");
});

test("parseExpression returns structured error for trailing tokens", () => {
  const error = expectParseFailure("1 2");
  assert.equal(error.stage, "parser");
  assert.equal(error.code, "unexpected_token");
  assert.deepEqual(error.expected, ["end of input"]);
  assert.equal(error.received, "2");
});
