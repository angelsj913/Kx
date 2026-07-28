import assert from "node:assert/strict";
import test from "node:test";

import { chunksToEvidence } from "../src/lib/ragEvidenceItems";

test("maps library chunks to material evidence items", () => {
  const out = chunksToEvidence([
    {
      n: 1,
      libraryItemId: "lib1",
      title: "Calc Notes",
      content: "derivative rules",
      snippet: "derivative",
      score: 0.8,
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.sourceType, "library");
  assert.match(out[0]!.url, /^library:/);
});
