import { describe, expect, it } from "vitest";

describe("MediaWiki Syntax Server", () => {
  it("should be able to import the server module", async () => {
    // Basic test to ensure the server module can be imported
    const serverModule = await import("./server.js");
    expect(serverModule).toBeDefined();
  });
});
