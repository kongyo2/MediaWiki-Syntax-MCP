/**
 * Tests for MediaWiki content processor module
 */

import { describe, expect, it } from "vitest";

import {
  cleanMediaWikiContent,
  createContentSummary,
} from "./content-processor.js";

describe("Content Processor", () => {
  describe("cleanMediaWikiContent", () => {
    it("should return empty string for invalid input", () => {
      expect(cleanMediaWikiContent("")).toBe("");
      expect(cleanMediaWikiContent(null as unknown as string)).toBe("");
      expect(cleanMediaWikiContent(undefined as unknown as string)).toBe("");
    });

    it("should remove empty lines at the beginning", () => {
      const input = "\n\n\nActual content\nMore content";
      const result = cleanMediaWikiContent(input);
      expect(result).toBe("Actual content\nMore content");
    });

    it("should remove very short lines", () => {
      const input = "Good content\na\nbb\nMore good content";
      const result = cleanMediaWikiContent(input);
      expect(result).toBe("Good content\nMore good content");
    });

    it("should stop processing at footer content", () => {
      const input = `Good content
More good content
Retrieved from "https://example.com"
This should not appear`;
      const result = cleanMediaWikiContent(input);
      expect(result).toBe("Good content\nMore good content");
    });

    it("should remove navigation patterns", () => {
      const input = `Good content
Jump to: navigation, search
More good content
Contents [hide]
Final content`;
      const result = cleanMediaWikiContent(input);
      expect(result).toBe("Good content\nMore good content\nFinal content");
    });

    it("should handle multiple footer patterns", () => {
      const footerPatterns = [
        "Retrieved from",
        "Categories:",
        "This page was last edited",
        "Privacy policy",
        "Wikimedia Foundation",
      ];

      for (const pattern of footerPatterns) {
        const input = `Good content\n${pattern} something\nShould not appear`;
        const result = cleanMediaWikiContent(input);
        expect(result).toBe("Good content");
      }
    });

    it("should handle case-insensitive navigation patterns", () => {
      const input = `Good content
NAVIGATION menu
More content
Search box
Final content`;
      const result = cleanMediaWikiContent(input);
      expect(result).toBe("Good content\nMore content\nFinal content");
    });

    it("should preserve meaningful content", () => {
      const input = `# MediaWiki Formatting
This is important content about formatting.
== Bold Text ==
Use '''bold''' for emphasis.
More detailed information here.`;

      const result = cleanMediaWikiContent(input);
      expect(result).toContain("MediaWiki Formatting");
      expect(result).toContain("bold");
      expect(result).toContain("emphasis");
    });
  });

  describe("createContentSummary", () => {
    it("should return empty string for invalid input", () => {
      expect(createContentSummary("")).toBe("");
      expect(createContentSummary(null as unknown as string)).toBe("");
      expect(createContentSummary(undefined as unknown as string)).toBe("");
    });

    it("should include headers", () => {
      const input = `# Main Header
Some content
## Sub Header
More content`;
      const result = createContentSummary(input);
      expect(result).toContain("# Main Header");
      expect(result).toContain("## Sub Header");
    });

    it("should include code blocks", () => {
      const input = `Some text
\`\`\`
code example
\`\`\`
More text
\`inline code\`
Final text`;
      const result = createContentSummary(input);
      expect(result).toContain("```");
      expect(result).toContain("code example");
      expect(result).toContain("`inline code`");
    });

    it("should include table syntax", () => {
      const input = `Some text
| You type | Result |
| '''bold''' | bold text |
| ''italic'' | italic text |
More text`;
      const result = createContentSummary(input);
      expect(result).toContain("You type");
      expect(result).toContain("'''bold'''");
      expect(result).toContain("''italic''");
    });

    it("should include syntax patterns", () => {
      const syntaxExamples = [
        "[[Internal Link]]",
        "{{Template}}",
        "'''bold text'''",
        "== Heading ==",
        "* List item",
        "# Numbered item",
        "<nowiki>text</nowiki>",
        "| table cell |",
      ];

      for (const example of syntaxExamples) {
        const input = `Some text\n${example}\nMore text`;
        const result = createContentSummary(input);
        expect(result).toContain(example);
      }
    });

    it("should exclude non-syntax content", () => {
      const input = `# Header (should be included)
This is regular text without syntax patterns.
Another paragraph of regular text.
[[This has syntax]] so it should be included.
More regular text to exclude.`;

      const result = createContentSummary(input);
      expect(result).toContain("# Header");
      expect(result).toContain("[[This has syntax]]");
      expect(result).not.toContain("regular text without syntax");
      expect(result).not.toContain("Another paragraph");
    });

    it("should handle code block state correctly", () => {
      const input = `Regular text
\`\`\`
This is in a code block
Even without syntax patterns
\`\`\`
This regular text should be excluded
'''This syntax should be included'''`;

      const result = createContentSummary(input);
      expect(result).toContain("This is in a code block");
      expect(result).toContain("Even without syntax patterns");
      expect(result).toContain("'''This syntax should be included'''");
      expect(result).not.toContain("This regular text should be excluded");
    });

    it("should handle table state correctly", () => {
      const input = `Regular text
| Syntax | Result |
| '''bold''' | bold |
| ''italic'' | italic |
Regular text after table
[[Link syntax]] should be included`;

      const result = createContentSummary(input);
      expect(result).toContain("Syntax");
      expect(result).toContain("'''bold'''");
      expect(result).toContain("''italic''");
      expect(result).toContain("[[Link syntax]]");
      expect(result).not.toContain("Regular text after table");
    });
  });
});
