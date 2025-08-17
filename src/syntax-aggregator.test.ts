/**
 * Tests for MediaWiki syntax aggregator module
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMediaWikiSyntax,
  getFallbackSyntax,
  type MediaWikiHelpPage,
} from "./syntax-aggregator.js";

// Mock the dependencies
vi.mock("./mediawiki-fetcher.js", () => ({
  fetchPageContent: vi.fn(),
}));

vi.mock("./content-processor.js", () => ({
  cleanMediaWikiContent: vi.fn(),
}));

import { cleanMediaWikiContent } from "./content-processor.js";
import { fetchPageContent } from "./mediawiki-fetcher.js";

const mockFetchPageContent = vi.mocked(fetchPageContent);
const mockCleanMediaWikiContent = vi.mocked(cleanMediaWikiContent);

describe("Syntax Aggregator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchMediaWikiSyntax", () => {
    const mockHelpPages: MediaWikiHelpPage[] = [
      {
        description: "Test description 1",
        title: "Test Page 1",
        url: "https://example.com/page1",
      },
      {
        description: "Test description 2",
        title: "Test Page 2",
        url: "https://example.com/page2",
      },
    ];

    it("should fetch and consolidate multiple help pages", async () => {
      mockFetchPageContent
        .mockResolvedValueOnce("Raw content 1")
        .mockResolvedValueOnce("Raw content 2");

      mockCleanMediaWikiContent
        .mockReturnValueOnce("Clean content 1")
        .mockReturnValueOnce("Clean content 2");

      const result = await fetchMediaWikiSyntax(mockHelpPages);

      expect(mockFetchPageContent).toHaveBeenCalledTimes(2);
      expect(mockFetchPageContent).toHaveBeenCalledWith(
        "https://example.com/page1",
      );
      expect(mockFetchPageContent).toHaveBeenCalledWith(
        "https://example.com/page2",
      );

      expect(mockCleanMediaWikiContent).toHaveBeenCalledTimes(2);
      expect(mockCleanMediaWikiContent).toHaveBeenCalledWith("Raw content 1");
      expect(mockCleanMediaWikiContent).toHaveBeenCalledWith("Raw content 2");

      expect(result).toContain("# Complete MediaWiki Syntax Reference");
      expect(result).toContain("## Test Page 1");
      expect(result).toContain("*Test description 1*");
      expect(result).toContain("Clean content 1");
      expect(result).toContain("## Test Page 2");
      expect(result).toContain("*Test description 2*");
      expect(result).toContain("Clean content 2");
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetchPageContent
        .mockResolvedValueOnce("Raw content 1")
        .mockRejectedValueOnce(new Error("Network error"));

      mockCleanMediaWikiContent.mockReturnValueOnce("Clean content 1");

      const result = await fetchMediaWikiSyntax(mockHelpPages);

      expect(result).toContain("Clean content 1");
      expect(result).toContain("## Test Page 2");
      expect(result).toContain(
        "Error fetching content from https://example.com/page2: Network error",
      );
    });

    it("should handle unknown errors", async () => {
      mockFetchPageContent
        .mockResolvedValueOnce("Raw content 1")
        .mockRejectedValueOnce("String error");

      mockCleanMediaWikiContent.mockReturnValueOnce("Clean content 1");

      const result = await fetchMediaWikiSyntax(mockHelpPages);

      expect(result).toContain(
        "Error fetching content from https://example.com/page2: Unknown error",
      );
    });

    it("should throw error for empty help pages array", async () => {
      await expect(fetchMediaWikiSyntax([])).rejects.toThrow(
        "No help pages provided",
      );
    });

    it("should throw error for null/undefined help pages", async () => {
      await expect(
        fetchMediaWikiSyntax(null as unknown as readonly MediaWikiHelpPage[]),
      ).rejects.toThrow("No help pages provided");
      await expect(
        fetchMediaWikiSyntax(
          undefined as unknown as readonly MediaWikiHelpPage[],
        ),
      ).rejects.toThrow("No help pages provided");
    });

    it("should include proper section separators", async () => {
      mockFetchPageContent.mockResolvedValueOnce("Raw content");
      mockCleanMediaWikiContent.mockReturnValueOnce("Clean content");

      const singlePage: MediaWikiHelpPage[] = [
        {
          description: "Test description",
          title: "Test Page",
          url: "https://example.com/page",
        },
      ];

      const result = await fetchMediaWikiSyntax(singlePage);

      expect(result).toContain("---");
      expect(result.split("---")).toHaveLength(2); // One separator for one page
    });

    it("should handle pages with empty content", async () => {
      mockFetchPageContent.mockResolvedValueOnce("");
      mockCleanMediaWikiContent.mockReturnValueOnce("");

      const singlePage: MediaWikiHelpPage[] = [
        {
          description: "Empty description",
          title: "Empty Page",
          url: "https://example.com/empty",
        },
      ];

      const result = await fetchMediaWikiSyntax(singlePage);

      expect(result).toContain("## Empty Page");
      expect(result).toContain("*Empty description*");
      // Should still include the page structure even with empty content
    });
  });

  describe("getFallbackSyntax", () => {
    it("should return comprehensive fallback syntax", () => {
      const result = getFallbackSyntax();

      expect(result).toContain("# MediaWiki Syntax Reference (Fallback)");
      expect(result).toContain("## Basic Text Formatting");
      expect(result).toContain("'''bold text'''");
      expect(result).toContain("''italic text''");
      expect(result).toContain("## Headings");
      expect(result).toContain("== Level 2 ==");
      expect(result).toContain("## Lists");
      expect(result).toContain("## Links");
      expect(result).toContain("[[Page Name]]");
      expect(result).toContain("## Tables");
      expect(result).toContain('{| class="wikitable"');
      expect(result).toContain("## Templates");
      expect(result).toContain("{{Template Name}}");
      expect(result).toContain("## Images");
      expect(result).toContain("[[File:Example.jpg]]");
      expect(result).toContain("Error: Could not fetch complete documentation");
    });

    it("should be a valid string", () => {
      const result = getFallbackSyntax();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include error message", () => {
      const result = getFallbackSyntax();
      expect(result).toContain(
        "Could not fetch complete documentation from MediaWiki.org",
      );
    });
  });
});
