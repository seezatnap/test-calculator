export type TokenType =
  | "number"
  | "plus"
  | "minus"
  | "star"
  | "slash"
  | "caret"
  | "leftParen"
  | "rightParen"
  | "eof";

export interface Token {
  type: TokenType;
  lexeme: string;
  start: number;
  end: number;
}

export type TokenizerErrorCode = "unexpected_character" | "invalid_number";

export interface TokenizerError {
  stage: "tokenizer";
  code: TokenizerErrorCode;
  message: string;
  index: number;
  length: number;
  snippet: string;
}

export type TokenizeResult =
  | { ok: true; tokens: readonly Token[] }
  | { ok: false; error: TokenizerError };

const SINGLE_CHARACTER_TOKENS: Readonly<Record<string, TokenType>> = Object.freeze({
  "+": "plus",
  "-": "minus",
  "*": "star",
  "/": "slash",
  "^": "caret",
  "(": "leftParen",
  ")": "rightParen"
});

const isDigit = (character: string): boolean => character >= "0" && character <= "9";

const isWhitespace = (character: string): boolean =>
  character === " " ||
  character === "\t" ||
  character === "\n" ||
  character === "\r" ||
  character === "\f";

const buildTokenizerError = (
  code: TokenizerErrorCode,
  message: string,
  input: string,
  index: number,
  length: number
): TokenizerError => ({
  stage: "tokenizer",
  code,
  message,
  index,
  length,
  snippet: input.slice(index, Math.min(input.length, index + Math.max(length, 1)))
});

type NumberReadResult =
  | { ok: true; token: Token; nextIndex: number }
  | { ok: false; error: TokenizerError };

const readNumberToken = (input: string, startIndex: number): NumberReadResult => {
  let cursor = startIndex;
  let sawDigit = false;
  let sawDecimalPoint = false;

  while (cursor < input.length) {
    const character = input.charAt(cursor);
    if (character === "") {
      break;
    }

    if (isDigit(character)) {
      sawDigit = true;
      cursor += 1;
      continue;
    }

    if (character === ".") {
      if (sawDecimalPoint) {
        return {
          ok: false,
          error: buildTokenizerError(
            "invalid_number",
            "Number literal contains more than one decimal point.",
            input,
            cursor,
            1
          )
        };
      }

      sawDecimalPoint = true;
      cursor += 1;
      continue;
    }

    break;
  }

  const lexeme = input.slice(startIndex, cursor);
  if (!sawDigit || lexeme === ".") {
    return {
      ok: false,
      error: buildTokenizerError(
        "invalid_number",
        "Number literal must include at least one digit.",
        input,
        startIndex,
        Math.max(lexeme.length, 1)
      )
    };
  }

  return {
    ok: true,
    token: {
      type: "number",
      lexeme,
      start: startIndex,
      end: cursor
    },
    nextIndex: cursor
  };
};

export const tokenizeExpression = (input: string): TokenizeResult => {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const character = input.charAt(index);
    if (character === "") {
      break;
    }

    if (isWhitespace(character)) {
      index += 1;
      continue;
    }

    if (isDigit(character) || character === ".") {
      const numberResult = readNumberToken(input, index);
      if (!numberResult.ok) {
        return numberResult;
      }

      tokens.push(numberResult.token);
      index = numberResult.nextIndex;
      continue;
    }

    const mappedType = SINGLE_CHARACTER_TOKENS[character];
    if (mappedType !== undefined) {
      tokens.push({
        type: mappedType,
        lexeme: character,
        start: index,
        end: index + 1
      });
      index += 1;
      continue;
    }

    return {
      ok: false,
      error: buildTokenizerError(
        "unexpected_character",
        `Unexpected character "${character}" in expression.`,
        input,
        index,
        1
      )
    };
  }

  tokens.push({
    type: "eof",
    lexeme: "",
    start: input.length,
    end: input.length
  });

  return {
    ok: true,
    tokens
  };
};
