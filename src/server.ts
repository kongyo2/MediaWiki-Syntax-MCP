/**
 * MediaWiki Syntax MCP Server
 *
 * This server provides comprehensive MediaWiki syntax documentation by dynamically
 * fetching and consolidating information from official MediaWiki help pages.
 * It enables LLMs to access complete and up-to-date MediaWiki markup syntax.
 */

import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
  instructions:
    "This server provides comprehensive MediaWiki syntax documentation by dynamically fetching from official MediaWiki help pages. Use the get-mediawiki-syntax tool to retrieve complete markup syntax information.",
  name: "MediaWiki Syntax Server",
  version: "1.0.0",
});

import { createContentSummary } from "./content-processor.js";
import {
  fetchMediaWikiSyntax,
  getFallbackSyntax,
  type MediaWikiHelpPage,
} from "./syntax-aggregator.js";

// MediaWiki help pages to fetch and consolidate
const MEDIAWIKI_HELP_PAGES: readonly MediaWikiHelpPage[] = [
  {
    description: "Basic text formatting, headings, lists, and markup",
    title: "Text Formatting",
    url: "https://www.mediawiki.org/wiki/Help:Formatting",
  },
  {
    description:
      "Internal links, external links, interwiki links, and piped links",
    title: "Links",
    url: "https://www.mediawiki.org/wiki/Help:Links",
  },
  {
    description: "Table creation and formatting syntax",
    title: "Tables",
    url: "https://www.mediawiki.org/wiki/Help:Tables",
  },
  {
    description: "Image embedding, sizing, and media file syntax",
    title: "Images and Media",
    url: "https://www.mediawiki.org/wiki/Help:Images",
  },
  {
    description: "Template usage, parameters, and transclusion",
    title: "Templates",
    url: "https://www.mediawiki.org/wiki/Help:Templates",
  },
  {
    description: "Category assignment and organization",
    title: "Categories",
    url: "https://www.mediawiki.org/wiki/Help:Categories",
  },
  {
    description: "Variables, parser functions, and behavior switches",
    title: "Magic Words",
    url: "https://www.mediawiki.org/wiki/Help:Magic_words",
  },
  {
    description: "Reference and citation syntax",
    title: "Citations and References",
    url: "https://www.mediawiki.org/wiki/Help:Extension:Cite",
  },
] as const;

server.addTool({
  annotations: {
    openWorldHint: true, // This tool fetches from external MediaWiki sites
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get MediaWiki Syntax",
  },
  description:
    "Retrieve comprehensive MediaWiki syntax documentation by dynamically fetching from official MediaWiki help pages. This provides complete and up-to-date markup syntax for all MediaWiki features including formatting, links, tables, images, templates, categories, magic words, and citations.",
  execute: async (args, { log, reportProgress }) => {
    if (!args.format || !["complete", "summary"].includes(args.format)) {
      throw new UserError(
        "Invalid format specified. Must be 'complete' or 'summary'.",
      );
    }

    try {
      log.info(
        "Fetching MediaWiki syntax documentation from official help pages...",
      );

      await reportProgress({
        progress: 0,
        total: 100,
      });

      const syntaxDoc = await fetchMediaWikiSyntax(MEDIAWIKI_HELP_PAGES);

      await reportProgress({
        progress: 80,
        total: 100,
      });

      if (args.format === "summary") {
        log.info("Creating summary version of documentation...");
        const summary = createContentSummary(syntaxDoc);

        await reportProgress({
          progress: 100,
          total: 100,
        });

        log.info("Successfully created MediaWiki syntax summary");
        return summary;
      }

      await reportProgress({
        progress: 100,
        total: 100,
      });

      log.info(
        "Successfully retrieved complete MediaWiki syntax documentation",
      );
      return syntaxDoc;
    } catch (error) {
      log.error("Failed to fetch MediaWiki syntax documentation", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return fallback basic syntax if fetch fails
      return getFallbackSyntax();
    }
  },
  name: "get-mediawiki-syntax",
  parameters: z.object({
    format: z
      .enum(["complete", "summary"])
      .optional()
      .describe(
        "Format of the documentation - 'complete' for full syntax guide (default), 'summary' for condensed version",
      ),
  }),
});

server.start({
  transportType: "stdio",
});
