import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseGenerativeRag } from "../src/lib/generativeRouter";

test("uses generative path for report skill", () => {
  assert.equal(shouldUseGenerativeRag({ skill: "report", forceSkill: undefined }), true);
});

test("skips generative path for inline unless forced", () => {
  assert.equal(shouldUseGenerativeRag({ skill: "inline", forceSkill: undefined }), false);
});

test("forceSkill enables generative path for inline", () => {
  assert.equal(shouldUseGenerativeRag({ skill: "inline", forceSkill: "inline" }), true);
});
