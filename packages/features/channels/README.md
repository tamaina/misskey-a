# channels

チャンネルの一覧・作成・編集・タイムライン、フォロー、お気に入り、ミュート。


## Federation pilot (#128)

The existing channel editor permission controls `isFederated`: the owner and the
instance root/administrator/moderator. Existing channels default to OFF. ON forces
external Renotes to be allowed. It does not publish any old `localOnly` notes.

A local channel has a dedicated Group actor at `/channels/:id`, an independent RSA
key, Follow/Accept/Undo handling, and a small outbox. The key stays in the database;
delivery jobs contain only the channel ID. OFF and archive stop queued publications;
author deletion of an already published note continues to propagate.

Only public, federated notes can be created in an enabled channel. Local-only
input, local-only or nonpublic reply/quote targets, `canPublicNote`, sensitive words,
and effective visibility restrictions cause `CHANNEL_FEDERATION_REQUIRES_PUBLIC`
with a reason. Restrictions are checked before channel defaults can widen them.
Posting into a remote channel, including through an inferred reply channel, is
rejected. Pure Renotes inside a federated channel are deferred in this pilot;
external Renotes remain allowed, with the source note's local-only restriction.

New author Notes and author Deletes are wrapped in Group Announce activities.
The receiver uses the authenticated outer Group, resolves the Group actor and
compares the embedded Create with the author's canonical activity URL. A claimed
`audience` alone does not grant membership. Author Deletes require the known
channel/author relationship and a 404/410 from the author's note URL. Only authors
on the Group's own server are supported initially. Remote submissions and channel
owner deletion of somebody else's note are not added.

The prototype marker `_misskey_channel: true` identifies this implementation's
Group actor, using the existing Misskey namespace. Subscription initially uses the
ordinary remote actor Follow flow (`ap/show` with the Group URL, then
`following/create`). Accept creates the remote channel and its channel-follow
relation. Channel Follow/Undo subsequently use that same relationship. Native pending Accept/cancellation and bridge
writes/deletes each share a per-user lock; receiving a post never recreates
a subscription. Open streams apply follow/unfollow events immediately.

`channelId` is retained for local and received notes. Channel/Home cache and stream
routing use channel followers; author-only followers and GTL do not receive these
posts. Deleted IDs can remain in the existing Redis list cache, and the database
filter removes them from API results. Standalone public quote targets use ordinary
Note resolution; grouped targets require a canonical Group approval resource.

Limits for user review: collections expose a finite window (20 outbox items,
100 remote followers), reply/quote approval recursion is bounded to 16, and
remote posting, pure Renote forwarding, moderation forwarding, full collection
paging, and media/poll mutation compatibility remain follow-up work. The two-server
pilot was verified with small text posts, public replies and author deletion.

Regression cases are in `test/backend/federation.test.ts` and
`packages/backend/test-federation/test/channel.test.ts`. No merge or deployment
is part of this pilot.
