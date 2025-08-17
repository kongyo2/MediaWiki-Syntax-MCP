/**
 * MediaWiki content fetcher module
 *
 * Handles fetching and processing MediaWiki page content via the MediaWiki API.
 * This module is responsible for retrieving documentation from official MediaWiki help pages.
 */

/**
 * MediaWiki API response structure
 */
export interface MediaWikiApiResponse {
  query?: {
    pages?: Record<
      string,
      {
        extract?: string;
        missing?: boolean;
        pageid?: number;
        title?: string;
      }
    >;
  };
}

/**
 * Fetch page content using MediaWiki API
 *
 * @param url - The MediaWiki page URL to fetch content from
 * @returns Promise resolving to the page content as plain text
 * @throws Error if the page cannot be fetched or doesn't exist
 */
export async function fetchPageContent(url: string): Promise<string> {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  try {
    // Extract page title from MediaWiki URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const pageTitle = pathParts[pathParts.length - 1];

    if (!pageTitle) {
      throw new Error("Could not extract page title from URL");
    }

    // Use MediaWiki API to get page content
    const apiUrl = `${urlObj.origin}/w/api.php`;
    const params = new URLSearchParams({
      action: "query",
      exintro: "false",
      explaintext: "true",
      exsectionformat: "wiki",
      format: "json",
      origin: "*",
      prop: "extracts",
      titles: decodeURIComponent(pageTitle),
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        "User-Agent":
          "MediaWiki-Syntax-MCP/1.0.0 (https://github.com/kongyo2/mediawiki-syntax-mcp)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as MediaWikiApiResponse;

    const pages = data.query?.pages;

    if (!pages) {
      throw new Error("No pages found in API response");
    }

    // Get the first (and typically only) page
    const pageData = Object.values(pages)[0];

    if (!pageData) {
      throw new Error("No page data found");
    }

    if (pageData.missing) {
      throw new Error("Page not found");
    }

    return pageData.extract || "";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch content from ${url}: ${error.message}`);
    }
    throw new Error(`Failed to fetch content from ${url}: Unknown error`);
  }
}
