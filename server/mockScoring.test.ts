import { describe, expect, it } from "vitest";
import {
  bandFromRawScore, expandOptionalWords, isAnswerCorrect, normalizeAnswer, overallFromCriteria, parseAnswerKey, roundToBand,
} from "@shared/mock";

describe("mock test marking", () => {
  it("normalises answers before comparing", () => {
    expect(normalizeAnswer("  The  Library. ")).toBe("the library");
    expect(isAnswerCorrect("short_answer", ["library", "the library"], "The Library")).toBe(true);
    expect(isAnswerCorrect("short_answer", ["library"], "libary")).toBe(false);
    expect(isAnswerCorrect("tfng", ["NOT GIVEN"], "not given")).toBe(true);
    expect(isAnswerCorrect("mcq", ["B"], "")).toBe(false);
  });

  it("converts listening and reading raw scores to bands", () => {
    expect(bandFromRawScore("listening", "academic", 30, 40)).toBe(7);
    expect(bandFromRawScore("listening", "academic", 39, 40)).toBe(9);
    expect(bandFromRawScore("reading", "academic", 30, 40)).toBe(7);
    expect(bandFromRawScore("reading", "general", 30, 40)).toBe(6);
    expect(bandFromRawScore("reading", "academic", 0, 40)).toBe(0);
  });

  it("scales tests that are not out of 40", () => {
    // 15/20 → 30/40 → band 7 in Listening
    expect(bandFromRawScore("listening", "academic", 15, 20)).toBe(7);
  });

  it("rounds criterion averages the IELTS way", () => {
    expect(roundToBand(6.25)).toBe(6.5);
    expect(roundToBand(6.75)).toBe(7);
    expect(roundToBand(6.125)).toBe(6);
    expect(overallFromCriteria({ a: 6, b: 6.5, c: 7, d: 6.5 })).toBe(6.5);
    expect(overallFromCriteria({})).toBeNull();
  });
});

describe("answer key import", () => {
  it("expands bracketed optional words", () => {
    expect(expandOptionalWords("(a) large house").sort()).toEqual(["a large house", "large house"]);
    expect(expandOptionalWords("library")).toEqual(["library"]);
  });

  it("parses a listening key into the four parts", () => {
    const key = ["1 library", "2 22 / twenty-two", "3. B", "11 (the) museum", "21 FALSE", "35 river OR stream"].join("\n");
    const { sections, errors, count } = parseAnswerKey(key, "listening");
    expect(errors).toEqual([]);
    expect(count).toBe(6);
    expect(sections.map(s => s.title)).toEqual(["Part 1", "Part 2", "Part 3", "Part 4"]);
    expect(sections[0].items[1].answers).toEqual(["22", "twenty-two"]);
    expect(sections[1].items[0].answers.sort()).toEqual(["museum", "the museum"]);
    expect(sections[2].items[0].type).toBe("tfng");
    expect(sections[3].items[0].answers).toEqual(["river", "stream"]);
  });

  it("uses headings when given and reports bad lines", () => {
    const { sections, errors } = parseAnswerKey("Passage 1\n1 YES\n2 not given\nPassage 2\n14 viii\nnonsense line\n14 ix", "reading");
    expect(sections.map(s => s.title)).toEqual(["Passage 1", "Passage 2"]);
    expect(sections[0].items.map(i => i.type)).toEqual(["ynng", "ynng"]);
    expect(sections[0].items[1].answers).toEqual(["NOT GIVEN"]);
    expect(errors.some(e => e.includes("nonsense"))).toBe(true);
    expect(errors.some(e => e.includes("more than once"))).toBe(true);
  });
});
