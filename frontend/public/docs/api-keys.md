# API Keys — how to use them

## 1. Create a key
Dashboard → **Settings → API Keys → Add key** (workspace `admin`/`owner` only).
The full key (e.g. `mf_a1b2c3d4.e5f6...`) is shown **once**. Copy it now — only a hash
is stored, so it can never be shown again. If you lose it, revoke it and create a new one.

## 2. Send it with every request
Use **either** header:

```
x-api-key: mf_a1b2c3d4.e5f6g7h8...
```
or
```
Authorization: Bearer mf_a1b2c3d4.e5f6g7h8...
```

You do **not** need to send `x-workspace-id` when using an API key — the key is already
tied to one workspace on the server side.

## 3. Example

```bash
curl https://<your-api-host>/api/campaigns \
  -H "x-api-key: mf_a1b2c3d4.e5f6g7h8..."
```

```js
const res = await fetch('https://<your-api-host>/api/campaigns', {
  headers: { 'x-api-key': process.env.MAILFLOW_API_KEY },
});
```

## 4. Which endpoints accept an API key
Any controller guarded with `ApiKeyAuthGuard` (instead of the old session-only
`JwtAuthGuard`). Currently that's every day-to-day operational module:

`campaigns`, `contacts`, `lists`, `segments`, `templates`, `senders`, `domains`,
`suppression`, `import`, `mail-connection`, `storage`, `analytics`, `ai`.

**Session login only (no API key access)** — kept login-only on purpose for security:
`api-keys` (managing keys themselves), `billing`, `payments`, `workspaces` (team/admin),
`auth`.

## 5. Errors
| Status | Meaning |
|---|---|
| `401 Invalid or revoked API key` | Typo'd, expired, or the key was revoked in Settings |
| `403` | The key's workspace doesn't have access to that resource |

## 6. Revoking
Settings → API Keys → trash icon. Takes effect immediately; any in-flight request with
that key will start failing on its next call.

## 7. Notes for developers extending this
`ApiKeyAuthGuard` (`backend/src/common/guards/api-key.guard.ts`) checks for the header
first; if absent it falls back to normal JWT session auth, so the same guard works for
both the dashboard and external API calls. It sets `req.workspaceId` directly from the
key, and `WorkspaceGuard` trusts that (skips the membership DB lookup) when it sees
`req.apiKeyAuth === true`. To add API-key support to a new controller, swap
`JwtAuthGuard` → `ApiKeyAuthGuard` in its `@UseGuards(...)` — no extra module wiring is
needed since `ApiKeysModule` is `@Global()`.
