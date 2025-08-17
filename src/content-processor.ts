/**
 * MediaWiki content processing module
 *
 * Handles cleaning and processing of MediaWiki page content to extract
 * relevant documentation while filtering out navigation and metadata.
 */

/**
 * Clean and extract main content from MediaWiki page text
 *
 * @param text - Raw MediaWiki page text to clean
 * @returns Cleaned text with navigation and metadata removed
 */
export function cleanMediaWikiContent(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const lines = text.split("\n");
  const cleanedLines: string[] = [];

  // Patterns to skip (footer/navigation content)
  const skipPatterns = [
    "Retrieved from",
    "Categories:",
    "This page was last edited",
    "Text is available under",
    "Privacy policy",
    "About mediawiki.org",
    "Disclaimers",
    "Code of Conduct",
    "Developers",
    "Statistics",
    "Cookie statement",
    "Mobile view",
    "Wikimedia Foundation",
    "Powered by MediaWiki",
  ];

  // Navigation patterns to skip
  const navigationPatterns = [
    "Jump to:",
    "navigation",
    "search",
    "Contents",
    "hide",
    "Toggle",
    "Edit links",
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines at the beginning
    if (!trimmedLine && cleanedLines.length === 0) {
      continue;
    }

    // Skip very short lines that are likely navigation or metadata
    if (trimmedLine.length < 3) {
      continue;
    }

    // Check for footer content patterns
    const hasSkipPattern = skipPatterns.some((pattern) =>
      trimmedLine.includes(pattern),
    );

    if (hasSkipPattern) {
      break; // Stop processing when we hit footer content
    }

    // Check for navigation patterns
    const hasNavigationPattern = navigationPatterns.some((pattern) =>
      trimmedLine.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (hasNavigationPattern) {
      continue;
    }

    cleanedLines.push(trimmedLine);
  }

  return cleanedLines.join("\n");
}

/**
 * Create a summary version of MediaWiki content focusing on syntax examples
 *
 * @param content - Full MediaWiki documentation content
 * @returns Condensed version with syntax examples and key patterns
 */
export function createContentSummary(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  const lines = content.split("\n");
  const summaryLines: string[] = [];
  let inCodeBlock = false;
  let inTable = false;

  for (const line of lines) {
    // Include headers
    if (line.startsWith("#")) {
      summaryLines.push(line);
      continue;
    }

    // Include code blocks and syntax examples
    if (line.includes("```") || line.includes("`")) {
      inCodeBlock = !inCodeBlock;
      summaryLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      summaryLines.push(line);
      continue;
    }

    // Include table syntax
    if (
      line.includes("|") &&
      (line.includes("You type") ||
        line.includes("Syntax") ||
        line.includes("Result"))
    ) {
      inTable = true;
      summaryLines.push(line);
      continue;
    }

    if (inTable && line.includes("|")) {
      summaryLines.push(line);
      continue;
    } else if (inTable && !line.includes("|")) {
      inTable = false;
    }

    // Include important syntax patterns
    const syntaxPatterns = ["[[", "{{", "''", "==", "*", "#", "<", "|"];
    const hasSyntaxPattern = syntaxPatterns.some((pattern) =>
      line.includes(pattern),
    );

    if (hasSyntaxPattern) {
      summaryLines.push(line);
    }
  }

  return summaryLines.join("\n");
}
