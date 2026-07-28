import assert from "node:assert/strict";
import test from "node:test";

import { getGenerativeBudget } from "../src/lib/generativeBudgets";

test("free plan disables hybrid and export", () => {
  const b = getGenerativeBudget("free");
  assert.equal(b.allowHybrid, false);
  assert.equal(b.allowFileExport, false);
  assert.equal(b.allowAgentic, false);
  assert.equal(b.webCandidates, 3);
});

test("pro plan enables hybrid and export", () => {
  const b = getGenerativeBudget("pro");
  assert.equal(b.allowHybrid, true);
  assert.equal(b.allowFileExport, true);
  assert.equal(b.allowAgentic, true);
});

test("professional plan has largest retrieval budget", () => {
  const pro = getGenerativeBudget("pro");
  const professional = getGenerativeBudget("professional");
  assert.ok(professional.webCandidates > pro.webCandidates);
  assert.ok(professional.maxSections > pro.maxSections);
});
