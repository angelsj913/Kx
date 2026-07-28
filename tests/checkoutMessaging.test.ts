import assert from "node:assert/strict";
import test from "node:test";

import { existingSubscriptionMessage } from "../src/lib/checkoutMessaging";

test("existingSubscriptionMessage names the already-active plan", () => {
  assert.equal(
    existingSubscriptionMessage("pro", "professional"),
    "현재 Pro 구독 중입니다. Professional 결제는 요금제 변경과 해지 후 진행해 주세요.",
  );
});

test("existingSubscriptionMessage handles same-plan retries", () => {
  assert.equal(
    existingSubscriptionMessage("professional", "professional"),
    "이미 Professional 구독 중입니다. 요금제 변경과 해지는 고객센터로 문의해 주세요.",
  );
});

test("existingSubscriptionMessage ignores invalid plan ids", () => {
  assert.equal(existingSubscriptionMessage("free", "professional"), null);
  assert.equal(existingSubscriptionMessage("pro", "unknown"), null);
});
