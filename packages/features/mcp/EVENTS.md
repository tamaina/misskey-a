# MCP Events prototype

The authenticated `/mcp` endpoint supports `server/discover`, `events/list`,
`events/subscribe` and `events/unsubscribe` using protocol `2026-07-28`. Tools
remain available on the same endpoint; legacy SDK1 clients still work.
Modern requests require per-request protocol metadata and matching
`MCP-Protocol-Version` / `Mcp-Method` headers (`Mcp-Name` for tool calls).
MCP remains controlled by the existing `enableMcp` setting.

Events `note.mentioned` and `note.replied` accept exactly `{}` as arguments and
are scoped to the authenticated local account and native access-token grant.
Both `access:mcp` and `read:notifications` are required. Payload data is only
`{ noteId, url }`; consumers can read the note through the existing native tools.
No note text, callback URL or signing secret is copied into MCP queue jobs.
There is no replay: subscription responses and events return `cursor: null`.

Subscriptions reuse the `webhook` table, existing mention/reply detection and
BullMQ delivery queue. The deterministic subscription ID includes account,
grant, canonical callback URL and event name. The default lifetime is one hour,
with a maximum of one day. `ttlMs: null` receives the finite default. Refresh
preserves the generation while active; lapse or unsubscribe replaces it on
registration. Old queued events cannot revive after unsubscribe/re-registration.
Expired records and unsubscribe tombstones still count against the native
webhook limit; they can be refreshed or unsubscribed but automatic pruning is
not part of this prototype.

Callbacks require direct HTTPS on port 443, public addresses only, fresh DNS
validation and address pinning with original TLS hostname, no redirects, a
10-second deadline and a bounded response body. Instance proxy/private-network
exceptions are not used; proxy-configured instances reject callback verification.
Verification uses a signed random challenge and constant-time echo comparison.
Successful verification is cached for 60 seconds, keyed to account, grant, URL
and signing key, with a bounded process-local cache. Network/callback errors
returned to callers or queue logs do not include callback URLs or secrets.

Standard Webhooks HMAC-SHA256 signatures cover the stable event ID, fresh Unix
signing time and exact serialized body. Refresh with a new signing key signs
with both keys for 60 seconds. Delivery rechecks current row/generation, expiry,
grant permissions, account state, note ownership relation and native visibility,
including after DNS resolution before opening the connection. Revocation cannot
recall a request already sent. Four attempts use the existing exponential backoff;
410 disables the subscription and 413 is not retried. Queue deduplication is
bounded by job retention; receivers must also deduplicate stable event IDs.

## Migration and rollout

`1791763200000-McpEventsWebhook.js` adds `mode` (default `legacy`),
`mcpTokenId` (indexed FK to `access_token`, delete cascade), `mcpExpiresAt`,
`mcpGeneration`, `mcpPreviousSecret` and `mcpPreviousSecretUntil`. Legacy API
listing, show, edit, delete and test operations select only legacy rows, keeping
MCP signing material out of those DTOs. Legacy delivery format is unchanged.
Apply the migration through the normal release process and upgrade webhook
workers before accepting MCP subscriptions; older workers cannot interpret MCP jobs. Rollback deletes MCP subscriptions and removes the new columns; legacy
rows survive. No production migration or deployment is part of this change.

The first change is deliberately limited to mentions/replies, reference payloads
and non-replayable webhook delivery. It does not implement polling, streaming,
MCP session state, control notifications or live ChatGPT onboarding. Synthetic
fixtures cover lifecycle, native authorization, callback policy, queue conversion,
legacy compatibility and migration/schema parity. Live interoperability and full
CI checks are required before rollout.

## Verification

Run focused tests with one worker:

```sh
node --max-old-space-size=1536 packages/backend/node_modules/vitest/vitest.mjs run --configLoader runner --cache false --config packages/features/mcp/test/vitest.config.mjs --maxWorkers=1
node packages/features/mcp/test/run-postgres-fixture.mjs
```

The PostgreSQL launcher creates a fresh Unix-socket-only fixture with synthetic
records. It never loads the instance database configuration.

Specifications:
- https://developers.openai.com/plugins/build/mcp-events
- https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
- https://modelcontextprotocol.io/specification/2026-07-28/server/discover
- https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
- https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
