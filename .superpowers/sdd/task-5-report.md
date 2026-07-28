# Task 5 Report: Wave D — Settings Security Google link/unlink

## Status
- Implemented `GET /api/account/auth-methods`.
- Implemented Google unlink guard and deletion in `POST /api/account/oauth/google/unlink`.
- Added Google link entrypoint at `GET /api/account/oauth/google/link`.
- Updated Settings > Security with connected account status, Google link/unlink actions, password-required unlink messaging, and `/signup?from=google` password setup link.
- Added `/app?settings=security` app-shell handling so the Google callback opens the Security settings tab.

## SHAs
- Base: `f860917ef65416564792b303c97c87330d3d8e2c`
- Implementation: commit containing this report.

## Verification
- RED: `npx tsx --test "tests/accountAuthMethods.test.ts"` failed on the intended `hasPassword`/Google linked shape and `password_required` assertions with the helper stub.
- GREEN: `npx tsx --test "tests/accountAuthMethods.test.ts"` passed 3/3 tests.
- Final: `npx tsx --test "tests/accountAuthMethods.test.ts" && npx tsc --noEmit && npm run lint` passed.

## Concerns
- Google OAuth link was not exercised against a live Google provider in this cloud environment; validation is via typecheck/lint and route/UI wiring.
