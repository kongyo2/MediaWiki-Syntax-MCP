/**
 * MediaWiki syntax documentation aggregator
 *
 * Combines multiple MediaWiki help pages into a comprehensive syntax reference.
 * Handles fetching, processing, and consolidating documentation from various sources.
 */

import { cleanMediaWikiContent } from "./content-processor.js";
import { fetchPageContent } from "./mediawiki-fetcher.js";

/**
 * MediaWiki help page configuration
 */
export interface MediaWikiHelpPage {
  readonly description: string;
  readonly title: string;
  readonly url: string;
}

/**
 * Fetch and consolidate MediaWiki syntax documentation from multiple help pages
 *
 * @param helpPages - Array of MediaWiki help pages to fetch and consolidate
 * @returns Promise resolving to consolidated documentation string
 */
export async function fetchMediaWikiSyntax(
  helpPages: readonly MediaWikiHelpPage[],
): Promise<string> {
  if (!helpPages || helpPages.length === 0) {
    throw new Error("No help pages provided");
  }

  const sections: string[] = [];

  sections.push("# Complete MediaWiki Syntax Reference");
  sections.push("");
  sections.push(
    "This comprehensive guide covers all MediaWiki markup syntax, dynamically fetched from official MediaWiki documentation.",
  );
  sections.push("");

  for (const page of helpPages) {
    try {
      const content = await fetchPageContent(page.url);
      const cleanContent = cleanMediaWikiContent(content);

      sections.push(`## ${page.title}`);
      sections.push("");
      sections.push(`*${page.description}*`);
      sections.push("");
      sections.push(cleanContent);
      sections.push("");
      sections.push("---");
      sections.push("");
    } catch (error) {
      sections.push(`## ${page.title}`);
      sections.push("");
      sections.push(`*${page.description}*`);
      sections.push("");
      sections.push(
        `Error fetching content from ${page.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      sections.push("");
    }
  }

  return sections.join("\n");
}

/**
 * Generate fallback MediaWiki syntax documentation when fetching fails
 *
 * @returns Basic MediaWiki syntax reference as fallback content
 */
export function getFallbackSyntax(): string {
  return `# MediaWiki Syntax Reference (Fallback)

## Basic Text Formatting
- **Bold text**: '''bold text'''
- *Italic text*: ''italic text''
- ***Bold and italic***: '''''bold and italic'''''

## Headings
- == Level 2 ==
- === Level 3 ===
- ==== Level 4 ====

## Lists
### Bullet Lists
* Item 1
* Item 2
** Sub-item

### Numbered Lists
# Item 1
# Item 2
## Sub-item

## Links
- Internal link: [[Page Name]]
- Piped link: [[Page Name|Display Text]]
- External link: [https://example.com Display Text]
- Category: [[Category:Category Name]]

## Tables
{| class="wikitable"
|-
! Header 1 !! Header 2
|-
| Cell 1 || Cell 2
|}

## Templates
- {{Template Name}}
- {{Template Name|parameter=value}}

## Images
- [[File:Example.jpg]]
- [[File:Example.jpg|thumb|Caption]]

Error: Could not fetch complete documentation from MediaWiki.org. This is a basic fallback reference.`;
}
