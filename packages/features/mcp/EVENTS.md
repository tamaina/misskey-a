# MCP Events

The authenticated `/mcp` endpoint supports `server/discover`, `events/list`,
`events/subscribe` and `events/unsubscribe` using protocol `2026-07-28` when
`enableMcp` is enabled. Requests require per-request protocol metadata and
matching `MCP-Protocol-Version` / `Mcp-Method` headers (`Mcp-Name` for tool calls).
Existing SDK1 tools remain available.

User Webhooks and MCP Events share one flat event-name list, derived from the
notification types schema (grouped notification types are excluded):

- `mention`, `reply`, `renote`, `reaction`, `followed`: created notifications for
  mentions, replies, renotes, reactions and incoming follows, respectively.
- `subscribedNote`: notification `note`, from a user whose notifications are enabled.
- `quote`, `pollEnded`, `scheduledNotePosted`, `scheduledNotePostFailed`,
  `receiveFollowRequest`, `followRequestAccepted`, `roleAssigned`,
  `chatRoomInvitationReceived`, `achievementEarned`, `exportCompleted`, `login`,
  `createToken`, `app`, `test`: the corresponding notification triggers.
- `chatMessage`: a received 1:1 or room message, excluding its sender and muted
  room memberships. Existing chat creation/access rules apply.
- `note`, `follow`, `unfollow`: the account posts a note, follows someone or
  unfollows someone. These retain their original emission paths.

All of these events accept exactly `{}` as arguments. Notification events are
queued immediately after saving and successfully packing a notification, after
receive settings, user mutes and relationship filters. Existing mention/reply
thread mutes still apply. Filtered notifications and failed packing produce no
event. Chat events are queued alongside the live message publication. Neither
path waits for the Web Push unread delay (2 seconds for notifications, 3 for chat).

`note.mentioned` and `note.replied` remain backward-compatible aliases of `mention`
and `reply`, with their original `{ noteId, url }` data. Existing subscriptions
continue receiving their original names. **Subscribing to both an alias and its
new name may deliver the same occurrence twice**, with separate subscription IDs
and event IDs. Self-authored mentions/replies remain excluded for each recipient.

Every event requires `access:mcp` plus these native permissions. `events/list`
filters against the current grant (including app-derived permissions):

| Events | Required permissions |
| --- | --- |
| Notification-derived events and mention/reply aliases | `read:notifications` |
| `login`, `createToken` | `read:notifications` **and** `read:account` |
| `chatMessage` | `read:chat` |
| `note` | `read:account` (conservative access to the account's own posts) |
| `follow`, `unfollow` | `read:following` |
| `antenna.note` | `read:notifications` and `read:account` |
| `stream.*` | `read:account`, plus existing per-frame native scopes |

MCP webhook bodies use `{ eventId, name, timestamp, data, cursor }`. Canonical
notification-derived events carry `{ notificationId, notificationType }`, with
`noteId` and `userId` when present. Canonical `mention`, `reply`, `renote` and
`reaction` also carry `noteId`; `followed` also carries `userId`. The webhook-only
`note` carries `{ noteId }`, and `follow` / `unfollow` carry `{ userId }`, and `chatMessage` carries `{ messageId }`. Bots can resolve these
references using native tools and their own token's permissions. MCP queues and
callbacks contain no packed private content. Delivery and retries recheck current
credentials, account state, scopes, subscription generation/expiry and note or
chat access immediately before the outbound connection. Deleted messages, former
room members and muted room memberships are suppressed. Already sent requests
cannot be recalled. Delivery is webhook-only without replay; cursors are `null`.

Legacy User Webhook envelopes are unchanged. `mention`, `reply`, `renote` and
`note` retain `{ note }`; `follow`, `unfollow` and `followed` retain `{ user }`.
The previously unimplemented `reaction` now sends `{ note, reaction, user }`.
New notification event bodies are `{ notification: <packed notification> }`, using
the same packed shape as the notifications API; `chatMessage` sends
`{ message: <packed lite chat message> }`. Packed `login` and `createToken` contain
only `id`, `createdAt`, `type`, never IP, User-Agent or token secrets.

Subscriptions bind to the account, grant, canonical callback URL, event name
and canonical arguments.
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

`antenna.note` takes strict `{ antennaId }` arguments and also requires
`read:account`. Its persisted subscription resumes live Pub/Sub observation after
restart; it does not replay downtime events. Queued deliveries reuse the native
antenna filters and grant checks. A dedicated antenna queue isolates its retained BullMQ job IDs from legacy
count cleanup and deduplicates across
processes while retained (at least 24 hours after completion); HTTP retries may
repeat delivery.
