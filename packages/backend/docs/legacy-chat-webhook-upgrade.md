# Legacy chat webhook authorization upgrade

This change affects legacy webhooks that subscribe to `chatMessage`. MCP webhooks
and legacy subscriptions to other events keep their existing behavior.

## Rollout

1. Stop all old API processes and webhook producers/consumers before migrating.
   Do not use a mixed-version rolling deployment: old consumers do not enforce
   the new delivery authorization fields.
2. Run the database migration, then start only the updated application/workers.
3. Existing legacy `chatMessage` subscriptions continue without reconfiguration.
   The migration adds only nullable token-binding metadata and preserves event
   selection, destination, secret and active state. Other events are unchanged.

This beta compatibility policy deliberately grandfathers existing subscriptions,
including ones whose original token did not have chat access. Their original
grant is unknown, so they are not token-bound: revoking that historical token
does not stop them. The new scope and grant-binding rules apply when a webhook
is created or edited after the upgrade. Owners can still disable or delete an
existing hook, and current owner eligibility is checked at delivery time.

## Queued messages and edits

Pre-upgrade queued `chatMessage` jobs keep working without additional metadata.
There is no delivery generation or blanket invalidation on edit. Every attempt
reads the current webhook and checks its owner, legacy mode, active state, chat
subscription, destination, secret and current authorization. It re-reads the
webhook after grant lookups, including checking that the token binding did not
change while those reads were pending.

- Deleting a webhook suppresses its queued jobs. Creating a replacement webhook
  produces a different ID and does not recover the deleted webhook's jobs.
- Disabling it or removing its chat subscription suppresses jobs processed in
  that state. Changing its URL or secret suppresses jobs carrying the old values;
  their payloads are never redirected to the new destination.
- A name-only edit does not cancel queued messages. Other edits, reauthorization
  or disable/re-enable cycles also permit still-pending old messages once the
  current checks pass and the URL/secret match the queued values again.
- Suppressed jobs complete without an HTTP request and are not automatically
  retried. Already pending jobs and retries not yet processed can still deliver
  after settings are restored. There is no durable cancellation marker.

This deliberately preserves old queues instead of promising permanent
invalidation across configuration changes. Payloads remain the original queued
snapshot; editing or deleting the source chat message does not rewrite or
withdraw that snapshot. The webhook checks above do not re-fetch chat contents.

## API compatibility

Creating or editing a chat webhook with an access token requires both
`write:account` and `read:chat`. This includes partial edits to its destination,
secret, name, event selection or active state. Native owner credentials continue
to work. Non-chat webhook management still requires only `write:account`.

Token-authorized chat hooks are bound to the grant used for their latest update.
Each delivery attempt checks its current permissions, including current legacy
app permissions. Revoking/deleting that token deletes its bound hook, including
any non-chat event subscriptions on the same hook. Removing chat from a hook
clears this binding. A native owner update explicitly reauthorizes the hook as
owner-managed instead.

Revocation cannot recall an HTTP request that has already been sent. The
authorization checks apply to each new delivery attempt, including retries.

## Rollback

The down migration preserves event selections and removes the new authorization
metadata. Stop all workers before rollback as well; do not resume pending chat
deliveries with old application code, which cannot enforce the new live-state
and grant checks. Rolling back the code also removes the new registration checks.
