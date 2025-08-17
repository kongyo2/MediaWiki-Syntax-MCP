# MediaWiki Syntax MCP Server

<a href="https://deepwiki.com/kongyo2/MediaWiki-Syntax-MCP"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>

<a href="https://glama.ai/mcp/servers/@kongyo2/MediaWiki-Syntax-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kongyo2/MediaWiki-Syntax-MCP/badge" alt="MediaWiki Syntax Server MCP server" />
</a>

A comprehensive MediaWiki syntax documentation server built with [FastMCP](https://github.com/punkpeye/fastmcp).

This MCP server provides complete MediaWiki markup syntax documentation by dynamically fetching and consolidating information from official MediaWiki help pages. It enables LLMs to access up-to-date and comprehensive MediaWiki syntax information.

## Features

- **Comprehensive Coverage**: Fetches syntax information from multiple official MediaWiki help pages
- **Dynamic Updates**: Always provides current documentation from MediaWiki.org
- **Clean Content**: Extracts only the essential syntax information, removing navigation and metadata
- **Structured Output**: Organizes syntax information by categories (formatting, links, tables, etc.)

## Development

To get started, clone the repository and install the dependencies.

```bash
git clone https://github.com/kongyo2/mediawiki-syntax-mcp.git
cd mediawiki-syntax-mcp
npm install
npm run dev
```

## Usage

### Start the server

If you simply want to start the server, you can use the `start` script.

```bash
npm run start
```

However, you can also interact with the server using the `dev` script.

```bash
npm run dev
```

This will start the server and allow you to interact with it using CLI.

### Available Tools

The server provides one main tool:

- **get-mediawiki-syntax**: Retrieves comprehensive MediaWiki syntax documentation
  - `format` (optional): "complete" for full documentation (default) or "summary" for condensed version

### Testing

```bash
npm run test
```

The tests verify that the server module can be properly imported and initialized.

### Linting

Having a good linting setup reduces the friction for other developers to contribute to your project.

```bash
npm run lint
```

This boilerplate uses [Prettier](https://prettier.io/), [ESLint](https://eslint.org/) and [TypeScript ESLint](https://typescript-eslint.io/) to lint the code.

### Formatting

Use `npm run format` to format the code.

```bash
npm run format
```

## MediaWiki Syntax Coverage

This server fetches syntax documentation from the following official MediaWiki help pages:

- **Text Formatting**: Basic text formatting, headings, lists, and markup
- **Links**: Internal links, external links, interwiki links, and piped links
- **Tables**: Table creation and formatting syntax
- **Images and Media**: Image embedding, sizing, and media file syntax
- **Templates**: Template usage, parameters, and transclusion
- **Categories**: Category assignment and organization
- **Magic Words**: Variables, parser functions, and behavior switches
- **Citations and References**: Reference and citation syntax

## Configuration

The server is designed to work out of the box with no configuration required. It dynamically fetches content from MediaWiki.org using the MediaWiki API, similar to the approach used in [wikipedia-mcp](https://github.com/Rudra-ravi/wikipedia-mcp).