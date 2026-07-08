export interface InlineSegment {
  text: string;
  bold: boolean;
}

export function parseInlineMarkdown(text: string): InlineSegment[] {
  return text.split("**").map((segment, index) => ({ text: segment, bold: index % 2 === 1 }));
}
