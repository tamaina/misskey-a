# Legacy chat webhook authorization upgrade

This change affects legacy webhooks that subscribe to `chatMessage`. MCP webhooks
and legacy subscriptions to other events keep their existing behavior.

## Rollout

1. Stop all old API processes and webhook producers/consumers before migrating.
   Do not use a mixed-version rolling deployment: old consumers do not enforce
   the new delivery authorization fields.
2. Run the database migration, then start only the updated application/workers.
3. Tell webhook owners to explicitly reselect `chatMessage` in webhook settings
   if they still want chat delivery. The migration removes only that event from
   existing legacy hooks, preserving their other event subscriptions. The old
   registration does not establish a trustworthy chat authorization grant.

Queued chat deliveries from before this upgrade are discarded, including after
reauthorization. A change to a chat webhook invalidates its previous queued chat
deliveries. Disabling or removing chat subscriptions therefore does not replay
old chat messages when they are later enabled again.

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

The down migration removes `chatMessage` from legacy hooks again rather than
restoring historical subscriptions. Stop all workers before rollback as well;
do not resume old pending chat deliveries with old application code.
