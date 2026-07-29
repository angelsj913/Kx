# Third-party security skills (ZEFF Security Program)

## Source

- Repository: [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills)
- Examples used as **catalog / Finding skillIds** (not executed as-is):
  - `testing-api-authentication-weaknesses`
  - `testing-for-broken-access-control`
  - `testing-api-security-with-owasp-top-10`
  - `testing-for-sensitive-data-exposure`
  - `testing-for-xss-vulnerabilities`
  - (and related defensive skill ids referenced from `src/lib/security/checks.ts`)

## License

**Apache License 2.0** — commercial use, modification, and distribution are permitted, subject to Apache-2.0 conditions (retain notices, include LICENSE when redistributing the Work, no trademark misuse).

Upstream LICENSE: https://github.com/mukul975/Anthropic-Cybersecurity-Skills/blob/main/LICENSE

## How ZEFF uses them

ZEFF does **not** ship or execute upstream skill scripts against external targets.  
Admin Security Program maps skill ids to **our own read-only static checks** in `src/lib/security/checks.ts`.

See also: [PRD_SCAN_LICENSE_PERF_2026-07.md](./PRD_SCAN_LICENSE_PERF_2026-07.md)
