/**
 * Minimal RFC 4180-style CSV tokenizer.
 *
 * - Fields may be wrapped in double quotes; quoted fields may contain commas,
 *   line breaks and escaped quotes (`""`).
 * - Accepts LF, CRLF and lone CR line endings (mixed is fine).
 * - Strips a leading UTF-8 byte order mark.
 * - Skips blank lines, but keeps line numbers accurate so errors can point at
 *   the exact line in the original file.
 * - Malformed quoting throws a CsvParseError instead of being guessed at.
 */

export interface CsvRecord {
  /** 1-based line number where the record starts in the source text. */
  lineNumber: number;
  fields: string[];
}

export class CsvParseError extends Error {
  constructor(
    message: string,
    public readonly lineNumber: number,
  ) {
    super(`Line ${lineNumber}: ${message}`);
    this.name = "CsvParseError";
  }
}

const BYTE_ORDER_MARK = "﻿";

export function parseCsv(text: string): CsvRecord[] {
  const input = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;

  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterClosingQuote = false;
  let recordHadQuotes = false;
  let line = 1;
  let recordStartLine = 1;

  const endField = () => {
    fields.push(field);
    field = "";
    afterClosingQuote = false;
  };

  const endRecord = () => {
    endField();
    const isBlankLine =
      fields.length === 1 && fields[0].trim() === "" && !recordHadQuotes;
    if (!isBlankLine) {
      records.push({ lineNumber: recordStartLine, fields });
    }
    fields = [];
    recordHadQuotes = false;
  };

  let i = 0;
  while (i < input.length) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          afterClosingQuote = true;
          i += 1;
        }
        continue;
      }
      if (char === "\n" || (char === "\r" && input[i + 1] !== "\n")) {
        line += 1;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === ",") {
      endField();
      i += 1;
      continue;
    }

    if (char === "\r" || char === "\n") {
      endRecord();
      i += char === "\r" && input[i + 1] === "\n" ? 2 : 1;
      line += 1;
      recordStartLine = line;
      continue;
    }

    if (afterClosingQuote) {
      throw new CsvParseError(
        "Unexpected character after closing quote. Quoted fields must end at a comma or line break.",
        line,
      );
    }

    if (char === '"' && field === "") {
      inQuotes = true;
      recordHadQuotes = true;
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (inQuotes) {
    throw new CsvParseError(
      "Unterminated quoted field. Every opening quote needs a closing quote.",
      recordStartLine,
    );
  }

  // Final record when the file does not end with a line break.
  if (field !== "" || fields.length > 0 || recordHadQuotes) {
    endRecord();
  }

  return records;
}
