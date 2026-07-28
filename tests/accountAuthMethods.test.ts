import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthMethods, googleUnlinkPrecondition } from "../src/lib/accountAuthMethods";

test("buildAuthMethods reports password and linked Google email", () => {
  assert.deepEqual(
    buildAuthMethods({
      email: "user@example.com",
      passwordHash: "hashed",
      accounts: [{ provider: "google" }, { provider: "credentials" }],
    }),
    {
      hasPassword: true,
      google: { linked: true, email: "user@example.com" },
    },
  );
});

test("buildAuthMethods omits Google email when Google is not linked", () => {
  assert.deepEqual(
    buildAuthMethods({
      email: "user@example.com",
      passwordHash: null,
      accounts: [{ provider: "credentials" }],
    }),
    {
      hasPassword: false,
      google: { linked: false },
    },
  );
});

test("googleUnlinkPrecondition requires a password login fallback", () => {
  assert.deepEqual(googleUnlinkPrecondition({ passwordHash: null }), {
    ok: false,
    status: 400,
    error: "password_required",
  });

  assert.deepEqual(googleUnlinkPrecondition({ passwordHash: "hashed" }), { ok: true });
});
