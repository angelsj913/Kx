import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWebResults } from "../src/lib/ragWeb";
import { splitSourcesByType } from "../src/lib/ragHybrid";

test("normalizes raw web rows into evidence items", () => {
  const out = normalizeWebResults([
    { title: "A", url: "https://example.com/a", snippet: "alpha", score: 0.9 },
  ]);
  assert.deepEqual(out, [
    {
      sourceType: "web",
      title: "A",
      url: "https://example.com/a",
      snippet: "alpha",
      score: 0.9,
    },
  ]);
});

test("splits mixed evidence into web and material groups", () => {
  const result = splitSourcesByType([
    { sourceType: "web", title: "A", url: "https://a", snippet: "alpha", score: 0.9 },
    { sourceType: "library", title: "Doc 1", url: "library:1", snippet: "beta", score: 0.8 },
  ]);
  assert.equal(result.web.length, 1);
  assert.equal(result.materials.length, 1);
});
