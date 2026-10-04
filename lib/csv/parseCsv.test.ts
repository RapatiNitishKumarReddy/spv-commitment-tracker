import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsv } from "./parseCsv";

describe("parseCsv", () => {
  it("parses simple unquoted rows", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      { lineNumber: 1, fields: ["a", "b", "c"] },
      { lineNumber: 2, fields: ["1", "2", "3"] },
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    const [record] = parseCsv('Alpha,"$50,000"');
    expect(record.fields).toEqual(["Alpha", "$50,000"]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    const [record] = parseCsv('"He said ""hi""",x');
    expect(record.fields).toEqual(['He said "hi"', "x"]);
  });

  it("keeps line breaks inside quoted fields and reports the starting line", () => {
    const records = parseCsv('h1,h2\n"multi\nline",x\nnext,row');
    expect(records[1]).toEqual({ lineNumber: 2, fields: ["multi\nline", "x"] });
    expect(records[2]).toEqual({ lineNumber: 4, fields: ["next", "row"] });
  });

  it("handles LF, CRLF and mixed line endings identically", () => {
    const expected = [["a", "b"], ["1", "2"], ["3", "4"]];
    expect(parseCsv("a,b\n1,2\n3,4\n").map((r) => r.fields)).toEqual(expected);
    expect(parseCsv("a,b\r\n1,2\r\n3,4\r\n").map((r) => r.fields)).toEqual(expected);
    expect(parseCsv("a,b\r\n1,2\n3,4").map((r) => r.fields)).toEqual(expected);
  });

  it("strips a leading byte order mark", () => {
    const [header] = parseCsv("﻿spv_name,commitment\n");
    expect(header.fields[0]).toBe("spv_name");
  });

  it("skips blank lines but keeps line numbers accurate", () => {
    const records = parseCsv("a,b\n\n   \n1,2\r\n\r\n3,4\n\n");
    expect(records).toEqual([
      { lineNumber: 1, fields: ["a", "b"] },
      { lineNumber: 4, fields: ["1", "2"] },
      { lineNumber: 6, fields: ["3", "4"] },
    ]);
  });

  it("keeps a trailing empty field", () => {
    const [record] = parseCsv("Beta,250000,Tom Lee,tom@example.com,");
    expect(record.fields).toHaveLength(5);
    expect(record.fields[4]).toBe("");
  });

  it("returns no records for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("﻿\n\n")).toEqual([]);
  });

  it("rejects an unterminated quoted field", () => {
    expect(() => parseCsv('a,b\n1,"oops\n')).toThrow(CsvParseError);
    expect(() => parseCsv('a,b\n1,"oops\n')).toThrow(/Line 2: Unterminated/);
  });

  it("rejects characters after a closing quote", () => {
    expect(() => parseCsv('"abc"x,1')).toThrow(/after closing quote/);
  });
});
