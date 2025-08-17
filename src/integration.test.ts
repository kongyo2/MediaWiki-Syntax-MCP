/**
 * Integration tests for MediaWiki Syntax MCP Server
 *
 * These tests verify the integration between different modules
 * and test the complete workflow without mocking dependencies.
 */

import { describe, expect, it, vi } from "vitest";

import {
  cleanMediaWikiContent,
  createContentSummary,
} from "./content-processor.js";
import { fetchPageContent } from "./mediawiki-fetcher.js";
import {
  fetchMediaWikiSyntax,
  getFallbackSyntax,
} from "./syntax-aggregator.js";

// Mock fetch for integration tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MediaWiki Syntax Server Integration", () => {
  describe("Complete workflow", () => {
    it("should process a complete workflow from fetch to summary", async () => {
      // Mock a successful API response
      const mockApiResponse = {
        json: async () => ({
          query: {
            pages: {
              "12345": {
                extract: `MediaWiki Formatting Help

Jump to: navigation, search

== Basic Text Formatting ==
You can format text in several ways:

'''Bold text''' - Use three apostrophes
''Italic text'' - Use two apostrophes

== Lists ==
* Bullet point 1
* Bullet point 2
** Sub-bullet

# Numbered item 1
# Numbered item 2

== Links ==
[[Internal Link]]
[https://example.com External Link]

Retrieved from "https://www.mediawiki.org/wiki/Help:Formatting"
Categories: Help pages
This page was last edited on 1 January 2024.`,
                pageid: 12345,
                title: "Help:Formatting",
              },
            },
          },
        }),
        ok: true,
      };

      mockFetch.mockResolvedValue(mockApiResponse);

      const helpPages = [
        {
          description: "Basic text formatting",
          title: "Text Formatting",
          url: "https://www.mediawiki.org/wiki/Help:Formatting",
        },
      ];

      // Test the complete workflow
      const result = await fetchMediaWikiSyntax(helpPages);

      expect(result).toContain("# Complete MediaWiki Syntax Reference");
      expect(result).toContain("## Text Formatting");
      expect(result).toContain("*Basic text formatting*");
      expect(result).toContain("'''Bold text'''");
      expect(result).toContain("''Italic text''");
      expect(result).not.toContain("Jump to: navigation");
      expect(result).not.toContain("Retrieved from");
      expect(result).not.toContain("Categories:");
    });

    it("should create proper summary from complete content", () => {
      const completeContent = `# Complete MediaWiki Syntax Reference

## Text Formatting
*Basic text formatting*

Regular text without syntax patterns.

'''Bold text''' - Use three apostrophes
''Italic text'' - Use two apostrophes

More regular text.

== Heading Example ==

Another paragraph without syntax.

[[Internal Link]] example
{{Template}} example

Final paragraph.`;

      const summary = createContentSummary(completeContent);

      expect(summary).toContain("# Complete MediaWiki Syntax Reference");
      expect(summary).toContain("## Text Formatting");
      expect(summary).toContain("'''Bold text'''");
      expect(summary).toContain("''Italic text''");
      expect(summary).toContain("== Heading Example ==");
      expect(summary).toContain("[[Internal Link]]");
      expect(summary).toContain("{{Template}}");
      expect(summary).not.toContain("Regular text without syntax");
      expect(summary).not.toContain("Another paragraph without syntax");
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const helpPages = [
        {
          description: "Test description",
          title: "Test Page",
          url: "https://www.mediawiki.org/wiki/Help:Test",
        },
      ];

      const result = await fetchMediaWikiSyntax(helpPages);

      expect(result).toContain("## Test Page");
      expect(result).toContain("Error fetching content");
      expect(result).toContain("Network error");
    });

    it("should provide comprehensive fallback syntax", () => {
      const fallback = getFallbackSyntax();

      expect(fallback).toContain("# MediaWiki Syntax Reference (Fallback)");
      expect(fallback).toContain("## Basic Text Formatting");
      expect(fallback).toContain("'''bold text'''");
      expect(fallback).toContain("''italic text''");
      expect(fallback).toContain("## Headings");
      expect(fallback).toContain("== Level 2 ==");
      expect(fallback).toContain("## Lists");
      expect(fallback).toContain("## Links");
      expect(fallback).toContain("[[Page Name]]");
      expect(fallback).toContain("## Tables");
      expect(fallback).toContain('{| class="wikitable"');
      expect(fallback).toContain("## Templates");
      expect(fallback).toContain("{{Template Name}}");
      expect(fallback).toContain("## Images");
      expect(fallback).toContain("[[File:Example.jpg]]");
      expect(fallback).toContain("Could not fetch complete documentation");
    });
  });

  describe("Error handling integration", () => {
    it("should handle malformed API responses", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({}), // Empty response
        ok: true,
      });

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:Test"),
      ).rejects.toThrow("No pages found in API response");
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:NotFound"),
      ).rejects.toThrow("HTTP error! status: 404");
    });

    it("should clean content with various footer patterns", () => {
      const contentWithFooters = `Good content here
More good content

Retrieved from "https://example.com"
This should not appear
Categories: Help pages
Privacy policy link
Wikimedia Foundation notice`;

      const cleaned = cleanMediaWikiContent(contentWithFooters);

      expect(cleaned).toBe("Good content here\nMore good content");
      expect(cleaned).not.toContain("Retrieved from");
      expect(cleaned).not.toContain("Categories:");
      expect(cleaned).not.toContain("Privacy policy");
    });
  });

  describe("Content processing integration", () => {
    it("should handle complex MediaWiki content", () => {
      const complexContent = `MediaWiki Help Page

Navigation menu
Contents [hide]

== Text Formatting ==

You can format text using:
'''Bold''' - three apostrophes
''Italic'' - two apostrophes
'''''Bold and italic''''' - five apostrophes

== Code Examples ==
\`\`\`
<nowiki>'''This will not be bold'''</nowiki>
\`\`\`

== Tables ==
| You type | Result |
| '''bold''' | bold text |
| ''italic'' | italic text |

== Links ==
[[Internal link]]
[[Page|Display text]]
[https://example.com External link]

Regular paragraph without special syntax.

Retrieved from "https://www.mediawiki.org/wiki/Help:Test"`;

      const cleaned = cleanMediaWikiContent(complexContent);
      const summary = createContentSummary(cleaned);

      // Cleaned content should remove navigation
      expect(cleaned).not.toContain("Navigation menu");
      expect(cleaned).not.toContain("Contents [hide]");
      expect(cleaned).not.toContain("Retrieved from");

      // Summary should include syntax examples
      expect(summary).toContain("== Text Formatting ==");
      expect(summary).toContain("'''Bold'''");
      expect(summary).toContain("''Italic''");
      expect(summary).toContain("```");
      expect(summary).toContain("| You type | Result |");
      expect(summary).toContain("[[Internal link]]");
      expect(summary).not.toContain("Regular paragraph without special syntax");
    });
  });
});
