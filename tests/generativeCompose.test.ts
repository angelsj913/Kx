import assert from "node:assert/strict";
import test from "node:test";

import { formatEvidenceForPrompt } from "../src/lib/generativeResultPayload";

test("formats evidence bundle for prompt injection", () => {
  const text = formatEvidenceForPrompt({
    web: [{ sourceType: "web", title: "A", url: "https://a", snippet: "s", score: 1 }],
    materials: [],
    all: [{ sourceType: "web", title: "A", url: "https://a", snippet: "s", score: 1 }],
  });
  assert.match(text, /\[web-1\]/);
  assert.match(text, /https:\/\/a/);
});
