# Security Audit — Rolling in the Dough

Date: 2026-10-03
Scope: server-side middleware, auth/cookies, client secrets, dependency surface.
Method: read-only inspection of `server/`, `client/`, `package.json`.

## Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Security middleware imported but never applied | **High** | Documented, remediation blocked |
| 2 | Naive enablement would 403 all mutations (CSRF) | **High** | Blocker on #1 |
| 3 | Naive enablement would break design fonts (CSP) | **Medium** | Blocker on #1 |
| 4 | `'unsafe-inline'` in script/style CSP | Low | Accepted (noted) |
| 5 | `sameSite: "none"` cookie without unconditional `secure` | Low–Medium | Noted |
| 6 | No secrets committed; client reads no `process.env` | — | Pass |

## 1. Security middleware is dead code (High)

`server/_core/index.ts:10` imports `applySecurityMiddleware`, but **there is no call
site**. Verified by grepping every `app.use` in `index.ts`: only health check,
request logging, body parsing, tRPC, the global error handler, and the 404
fallback are mounted.

Consequence: all of the following are **not active**:

- **Helmet** security headers (`securityHeadersMiddleware`)
- **Rate limiting** — api (`100/15min`), login (`5/15min`), payment (`10/hr`), spin (`60/min`)
- **Request validation** (`requestValidationMiddleware`)
- **CSRF** protection (`csrfMiddleware`)
- **Audit logging** (`auditLoggingMiddleware`)

The code is well-written; it simply was never wired up.

## 2. CSRF middleware is incompatible with the current client (High — blocker)

`csrfMiddleware` rejects any `POST/PUT/DELETE/PATCH` whose `X-CSRF-Token` does not
validate against `req.sessionToken` (`securityMiddleware.ts:98-120`).

The client **never sends** that header — grep of `client/src/` for
`X-CSRF-Token` / `csrf` returns **zero hits**. So enabling
`applySecurityMiddleware` as-is would **403 every tRPC mutation** (spin, login,
register, purchase, cashout).

Fix before enabling: have the client fetch the token from the `X-CSRF-Token`
response header (set on GET) and echo it on mutations, and ensure
`req.sessionToken` is actually populated outside the dev context stub.

## 3. Helmet CSP would block the design fonts (Medium — blocker)

`securityHeadersMiddleware` sets `fontSrc: ["'self'", "data:"]`, but
`client/src/index.css:8` does:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display...');
```

That pulls from `fonts.googleapis.com` + `fonts.gstatic.com`, which the CSP
does not allow. Enabling Helm as-is would break Playfair Display / Oswald /
Cormorant Garamond — i.e. the entire typographic design.

Fix: add `https://fonts.googleapis.com` to `styleSrc` and
`https://fonts.gstatic.com` to `fontSrc` (or self-host the fonts, which is
better for privacy and performance).

## 4. `'unsafe-inline'` in CSP (Low, accepted)

`scriptSrc` includes `'unsafe-inline'` (plus jsdelivr) and `styleSrc` includes
`'unsafe-inline'`. This weakens CSP's XSS protection. Accepted for now because
the app relies on inline styles heavily (React `style={}` is fine, but the
index.html has an inline `<style>` block and the debug-collector script is
injected). Revisit if inline scripts can be removed.

## 5. Cookie `sameSite: "none"` (Low–Medium, noted)

`server/_core/cookies.ts:43-46` sets `httpOnly: true`, `sameSite: "none"`,
`secure: isSecureRequest(req)`. Browsers **reject** `SameSite=None` cookies
unless `Secure` is also set. On a plain-HTTP request `isSecureRequest` is
false, so the cookie would be dropped. In production behind TLS this is fine,
but the conditional `secure` should be called out for non-TLS deployments.

## 6. Positive checks (Pass)

- No `.env`, secrets, or credential files are tracked by git
  (`git ls-files | grep -iE '\.env$|secret|credential'` → empty).
- The client bundle reads **no** `process.env` values (grep → zero hits), so
  no server secrets can leak through the Vite bundle.
- Auth cookies are `httpOnly` (not readable by JS).
- Rate-limit thresholds are sensible if/when enabled.

## Recommended remediation (in order)

1. **Do not** enable `applySecurityMiddleware` wholesale — it will break the app.
2. Enable the **safe subset**: helmet (with corrected `fontSrc` / `styleSrc`),
   request validation, the four rate limiters, audit logging.
3. Implement the CSRF token round-trip client-side **before** enabling
   `csrfMiddleware`.
4. Self-host the fonts (removes the CSP exception and improves privacy).
5. Make `secure: true` unconditional in production cookie config.

No code changes were made in this audit — findings only, pending decisions on
CSRF strategy and font hosting.
