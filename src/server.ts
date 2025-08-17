/**
 * MediaWiki Syntax MCP Server
 * 
 * This server provides comprehensive MediaWiki syntax documentation by dynamically
 * fetching and consolidating information from official MediaWiki help pages.
 * It enables LLMs to access complete and up-to-date MediaWiki markup syntax.
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
  name: "MediaWiki Syntax Server",
  version: "1.0.0",
  instructions: "This server provides comprehensive MediaWiki syntax documentation by dynamically fetching from official MediaWiki help pages. Use the get-mediawiki-syntax tool to retrieve complete markup syntax information.",
});

// MediaWiki help pages to fetch and consolidate
const MEDIAWIKI_HELP_PAGES = [
  {
    url: "https://www.mediawiki.org/wiki/Help:Formatting",
    title: "Text Formatting",
    description: "Basic text formatting, headings, lists, and markup"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Links", 
    title: "Links",
    description: "Internal links, external links, interwiki links, and piped links"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Tables",
    title: "Tables", 
    description: "Table creation and formatting syntax"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Images",
    title: "Images and Media",
    description: "Image embedding, sizing, and media file syntax"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Templates",
    title: "Templates",
    description: "Template usage, parameters, and transclusion"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Categories", 
    title: "Categories",
    description: "Category assignment and organization"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Magic_words",
    title: "Magic Words",
    description: "Variables, parser functions, and behavior switches"
  },
  {
    url: "https://www.mediawiki.org/wiki/Help:Extension:Cite",
    title: "Citations and References",
    description: "Reference and citation syntax"
  }
];

/**
 * Fetch page content using MediaWiki API (similar to wikipedia-mcp approach)
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    // Extract page title from MediaWiki URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const pageTitle = pathParts[pathParts.length - 1];
    
    // Use MediaWiki API to get page content
    const apiUrl = `${urlObj.origin}/w/api.php`;
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts',
      exintro: 'false',
      explaintext: 'true',
      exsectionformat: 'wiki',
      titles: decodeURIComponent(pageTitle),
      origin: '*'
    });

    const response = await fetch(`${apiUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query?.pages;
    
    if (!pages) {
      throw new Error('No pages found in API response');
    }

    // Get the first (and typically only) page
    const pageData = Object.values(pages)[0] as any;
    
    if (pageData.missing) {
      throw new Error('Page not found');
    }

    return pageData.extract || '';
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Clean and extract main content from MediaWiki page text
 */
function cleanMediaWikiContent(text: string, title: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let skipEmptyLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the beginning
    if (!line && cleanedLines.length === 0) {
      continue;
    }

    // Skip very short lines that are likely navigation or metadata
    if (line.length < 3) {
      continue;
    }

    // Skip lines that look like navigation or metadata
    if (line.includes('Retrieved from') ||
        line.includes('Categories:') ||
        line.includes('This page was last edited') ||
        line.includes('Text is available under') ||
        line.includes('Privacy policy') ||
        line.includes('About mediawiki.org') ||
        line.includes('Disclaimers') ||
        line.includes('Code of Conduct') ||
        line.includes('Developers') ||
        line.includes('Statistics') ||
        line.includes('Cookie statement') ||
        line.includes('Mobile view') ||
        line.includes('Wikimedia Foundation') ||
        line.includes('Powered by MediaWiki')) {
      break; // Stop processing when we hit footer content
    }

    // Skip lines that are clearly navigation
    if (line.includes('Jump to:') ||
        line.includes('navigation') ||
        line.includes('search') ||
        line.includes('Contents') ||
        line.includes('hide') ||
        line.includes('Toggle') ||
        line.includes('Edit links')) {
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join('\n');
}

/**
 * Fetch MediaWiki syntax documentation from official help pages
 */
async function fetchMediaWikiSyntax(): Promise<string> {
  const sections: string[] = [];
  
  sections.push('# Complete MediaWiki Syntax Reference');
  sections.push('');
  sections.push('This comprehensive guide covers all MediaWiki markup syntax, dynamically fetched from official MediaWiki documentation.');
  sections.push('');

  for (const page of MEDIAWIKI_HELP_PAGES) {
    try {
      const content = await fetchPageContent(page.url);
      const cleanContent = cleanMediaWikiContent(content, page.title);
      
      sections.push(`## ${page.title}`);
      sections.push('');
      sections.push(`*${page.description}*`);
      sections.push('');
      sections.push(cleanContent);
      sections.push('');
      sections.push('---');
      sections.push('');
    } catch (error) {
      sections.push(`## ${page.title}`);
      sections.push('');
      sections.push(`*${page.description}*`);
      sections.push('');
      sections.push(`Error fetching content from ${page.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sections.push('');
    }
  }

  return sections.join('\n');
}

server.addTool({
  annotations: {
    openWorldHint: true, // This tool fetches from external MediaWiki sites
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get MediaWiki Syntax",
  },
  name: "get-mediawiki-syntax",
  description: "Retrieve comprehensive MediaWiki syntax documentation by dynamically fetching from official MediaWiki help pages. This provides complete and up-to-date markup syntax for all MediaWiki features including formatting, links, tables, images, templates, categories, magic words, and citations.",
  parameters: z.object({
    format: z.enum(["complete", "summary"]).optional().describe("Format of the documentation - 'complete' for full syntax guide (default), 'summary' for condensed version"),
  }),
  execute: async (args, { log }) => {
    try {
      log.info("Fetching MediaWiki syntax documentation from official help pages...");
      
      const syntaxDoc = await fetchMediaWikiSyntax();
      
      if (args.format === "summary") {
        // Return a condensed version focusing on syntax examples
        const lines = syntaxDoc.split('\n');
        const summaryLines: string[] = [];
        let inCodeBlock = false;
        let inTable = false;
        
        for (const line of lines) {
          // Include headers
          if (line.startsWith('#')) {
            summaryLines.push(line);
            continue;
          }
          
          // Include code blocks and syntax examples
          if (line.includes('```') || line.includes('`')) {
            inCodeBlock = !inCodeBlock;
            summaryLines.push(line);
            continue;
          }
          
          if (inCodeBlock) {
            summaryLines.push(line);
            continue;
          }
          
          // Include table syntax
          if (line.includes('|') && (line.includes('You type') || line.includes('Syntax') || line.includes('Result'))) {
            inTable = true;
            summaryLines.push(line);
            continue;
          }
          
          if (inTable && line.includes('|')) {
            summaryLines.push(line);
            continue;
          } else if (inTable && !line.includes('|')) {
            inTable = false;
          }
          
          // Include important syntax patterns
          if (line.includes('[[') || line.includes('{{') || line.includes("''") || 
              line.includes('==') || line.includes('*') || line.includes('#') ||
              line.includes('<') || line.includes('|')) {
            summaryLines.push(line);
          }
        }
        
        return summaryLines.join('\n');
      }
      
      log.info("Successfully retrieved complete MediaWiki syntax documentation");
      return syntaxDoc;
      
    } catch (error) {
      log.error("Failed to fetch MediaWiki syntax documentation", { error: error instanceof Error ? error.message : 'Unknown error' });
      
      // Return fallback basic syntax if fetch fails
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
  },
});

server.start({
  transportType: "stdio",
});
