import { describe, expect, it } from "vitest";
import { parseInlineMarkdown } from "./inline-markdown";

describe("parseInlineMarkdown", () => {
  it("splits plain text with no bold markers into a single non-bold segment", () => {
    expect(parseInlineMarkdown("just plain text")).toEqual([
      { text: "just plain text", bold: false },
    ]);
  });

  it("marks text between ** pairs as bold", () => {
    expect(parseInlineMarkdown('**"Agreement"** means this contract.')).toEqual([
      { text: "", bold: false },
      { text: '"Agreement"', bold: true },
      { text: " means this contract.", bold: false },
    ]);
  });
});
