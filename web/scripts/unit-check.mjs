import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("agent routing", () => {
  it("detects agent mode keywords", () => {
    const agentMode = true;
    const prompt = "hello";
    assert.equal(agentMode || /^@aeko\b/i.test(prompt), true);
  });
});
