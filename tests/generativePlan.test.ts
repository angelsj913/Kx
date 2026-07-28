import assert from "node:assert/strict";
import test from "node:test";

import { planOutline } from "../src/lib/generativePlan";

test("caps report outline sections to budget", () => {
  const sections = planOutline("report", "AI policy report", 2);
  assert.equal(sections.length, 2);
  assert.equal(sections[0]?.id, "intro");
});
