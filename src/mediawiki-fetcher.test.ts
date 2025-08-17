/**
 * Tests for MediaWiki content fetcher module
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPageContent } from "./mediawiki-fetcher.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MediaWiki Fetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPageContent", () => {
    it("should fetch page content successfully", async () => {
      const mockResponse = {
        json: async () => ({
          query: {
            pages: {
              "12345": {
                extract: "This is the page content about formatting.",
                pageid: 12345,
                title: "Help:Formatting",
              },
            },
          },
        }),
        ok: true,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchPageContent(
        "https://www.mediawiki.org/wiki/Help:Formatting",
      );

      expect(result).toBe("This is the page content about formatting.");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("api.php"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringContaining("MediaWiki-Syntax-MCP"),
          }),
        }),
      );
    });

    it("should handle missing pages", async () => {
      const mockResponse = {
        json: async () => ({
          query: {
            pages: {
              "-1": {
                missing: true,
                title: "Help:NonExistent",
              },
            },
          },
        }),
        ok: true,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:NonExistent"),
      ).rejects.toThrow("Page not found");
    });

    it("should handle HTTP errors", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:NotFound"),
      ).rejects.toThrow("HTTP error! status: 404");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:Test"),
      ).rejects.toThrow("Failed to fetch content");
    });

    it("should handle invalid URLs", async () => {
      await expect(fetchPageContent("")).rejects.toThrow(
        "Invalid URL provided",
      );
      await expect(fetchPageContent("not-a-url")).rejects.toThrow(
        "Invalid URL",
      );
    });

    it("should handle empty API response", async () => {
      const mockResponse = {
        json: async () => ({}),
        ok: true,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        fetchPageContent("https://www.mediawiki.org/wiki/Help:Test"),
      ).rejects.toThrow("No pages found in API response");
    });

    it("should handle missing extract in response", async () => {
      const mockResponse = {
        json: async () => ({
          query: {
            pages: {
              "12345": {
                pageid: 12345,
                title: "Help:Test",
                // No extract field
              },
            },
          },
        }),
        ok: true,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchPageContent(
        "https://www.mediawiki.org/wiki/Help:Test",
      );

      expect(result).toBe("");
    });

    it("should construct correct API URL and parameters", async () => {
      const mockResponse = {
        json: async () => ({
          query: {
            pages: {
              "12345": {
                extract: "test content",
              },
            },
          },
        }),
        ok: true,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchPageContent("https://www.mediawiki.org/wiki/Help:Formatting");

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("api.php");
      expect(url).toContain("action=query");
      expect(url).toContain("prop=extracts");
      expect(url).toContain("format=json");
      expect(url).toContain("titles=Help%3AFormatting");
    });
  });
});
