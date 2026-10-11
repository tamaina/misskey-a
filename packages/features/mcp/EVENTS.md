# MCP Events

The authenticated `/mcp` endpoint supports `server/discover`, `events/list`,
`events/subscribe` and `events/unsubscribe` using protocol `2026-07-28` when
`enableMcp` is enabled. Requests require per-request protocol metadata and
matching `MCP-Protocol-Version` / `Mcp-Method` headers (`Mcp-Name` for tool calls).
Existing SDK1 tools remain available.

Events `note.mentioned` and `note.replied` accept exactly `{}` as arguments.
The native grant needs both `access:mcp` and `read:notifications`. Payload data
is `{ noteId, url }`; consumers can read the note through existing native tools.
Delivery is webhook-only without replay; cursors are `null`.

Subscriptions bind to the account, grant, canonical callback URL and event name.
The default lifetime is one hour and the maximum is one day; `ttlMs: null`
receives the finite default. Refresh an active subscription before `refreshBefore`.
Unsubscribe uses the same name, arguments and delivery URL. Expired records and
unsubscribe tombstones still count against the native webhook limit.

Callbacks require direct public HTTPS on port 443, without redirects or instance
proxy support. Registration sends a signed random verification challenge; return
2xx with JSON `{ "challenge": "<received challenge>" }`. Supply a `whsec_` key
containing canonical base64 encoding of 24–64 random bytes. Delivery uses
[Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
HMAC-SHA256 signatures; verify the exact body and deduplicate stable event IDs.
Key refresh signs with both keys for 60 seconds. A 410 response disables the
subscription; 413 is not retried. Revocation suppresses queued delivery but cannot
recall a request already sent.
