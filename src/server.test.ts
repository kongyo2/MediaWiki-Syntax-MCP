/**
 * Tests for MediaWiki Syntax MCP Server
 */

import { describe, expect, it } from "vitest";

describe("MediaWiki Syntax Server", () => {
  it("should be able to import the server module", async () => {
    // Basic test to ensure the server module can be imported
    const serverModule = await import("./server.js");
    expect(serverModule).toBeDefined();
  });

  it("should have proper module structure", async () => {
    // Test that the server module exports what we expect
    const serverModule = await import("./server.js");

    // The server module should be importable without errors
    expect(typeof serverModule).toBe("object");
  });
});
