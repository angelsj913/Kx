# Task 4 Report: Wave C — Google complete-password path

## Status

Implemented.

## Changes

- Enabled Google same-email account linking in `src/auth.ts` with an explicit verified-email safety comment and `openid email profile` scope.
- Added `POST /api/auth/complete-password` for authenticated Google users with no `passwordHash`.
  - Uses session auth.
  - Verifies a linked Google account.
  - Reuses `checkPasswordStrength` and `BCRYPT_COST`.
  - Hashes with `bcryptjs`.
  - Rate limits by authenticated user id.
- Added `src/lib/authComplete.ts` with `requirePasswordComplete()`.
- Added the `/app` layout gate so authenticated users without `passwordHash` redirect to `/signup?from=google`.
- Updated `/signup?from=google` to:
  - Read email from the active session.
  - Keep email read-only.
  - Hide the OTP flow.
  - Collect password, confirm password, and terms consent.
  - Call `POST /api/auth/complete-password` with `{ password }`.
  - Redirect to `/app` on success.
- Kept existing OTP email signup path intact.
- Added localized login helper copy for Google password setup.

## Verification

- `npx tsc --noEmit && npm run lint` passed.

## Self-review

- `/signup` is outside `src/app/app/layout.tsx`, so the completion redirect cannot loop.
- Existing OTP signup still requires OTP verification before calling `/api/auth/signup`.
- Completion API rejects unauthenticated requests, already-passworded users, and users without a linked Google account.
- Completing the password does not increment `sessionVersion`, so the active Google session remains valid for the redirect back into `/app`.

## Concerns

- No automated test framework or `npm test` script exists in this repo, so verification is limited to the requested typecheck and lint commands.
