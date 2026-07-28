import assert from "node:assert/strict";
import test from "node:test";

import { decideGenerativeRoute } from "../src/lib/generativeRouter";

test("routes public report request to report + web_first", () => {
  const d = decideGenerativeRoute("2026 AI 규제 동향 리포트 작성해줘", { plan: "pro" });
  assert.equal(d.skill, "report");
  assert.equal(d.route, "web_first");
  assert.equal(d.mode, "standard");
});

test("routes my-notes study request to study + doc_first", () => {
  const d = decideGenerativeRoute("내가 올린 미적분 노트로 시험 대비 정리해줘", {
    plan: "pro",
    hasLibraryContext: true,
  });
  assert.equal(d.skill, "study");
  assert.equal(d.route, "doc_first");
  assert.equal(d.needsPrivateSources, true);
});

test("routes comparison to hybrid study", () => {
  const d = decideGenerativeRoute("내 노트가 최신 수능 경향과 얼마나 맞는지 비교해줘", {
    plan: "professional",
    hasLibraryContext: true,
  });
  assert.equal(d.skill, "study");
  assert.equal(d.route, "hybrid");
  assert.equal(d.answerFormat, "comparison");
});

test("routes short factual question to inline", () => {
  const d = decideGenerativeRoute("광합성이 뭐야?", { plan: "free" });
  assert.equal(d.skill, "inline");
  assert.equal(d.route, "web_first");
});

test("free plan never selects agentic", () => {
  const d = decideGenerativeRoute(
    "아주 상세하고 종합적인 20페이지 리포트 작성해줘",
    { plan: "free" },
  );
  assert.equal(d.mode, "standard");
});

test("routes presentation request to presentation skill", () => {
  const d = decideGenerativeRoute("AI ethics 12-slide presentation 만들어줘", {
    plan: "pro",
  });
  assert.equal(d.skill, "presentation");
  assert.equal(d.toolId, "ppt");
});

test("free plan downgrades hybrid comparison to doc_first when library context exists", () => {
  const d = decideGenerativeRoute("내 노트와 최신 경향 비교해줘", {
    plan: "free",
    hasLibraryContext: true,
  });
  assert.equal(d.route, "doc_first");
});
