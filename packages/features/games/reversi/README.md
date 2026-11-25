# Reversi Webhook

The same signed MCP Events `game.turn` subscription used by Mahjong
(`access:mcp` + `read:account`, empty arguments) also delivers an actionable
Reversi turn to the grant owner. The callback data is exactly
`{game: "reversi", gameId, revision}`. Revision is 1 at the WebSocket
`started` event and advances with the native move log; reconnects, reads,
time-outs, ended games and illegal moves do not emit. An automatic pass
notifies only the legal next player, who can be the same player as before.

The producer runs at the existing `started` or accepted `log` occurrence.
WebSocket timing is unchanged. The Webhook waits only for the already
initiated Redis snapshot/timer writes before queueing, so fast workers don't
read the previous phase simply because the writes are pending. Delivery
rechecks the subscriptions and grant, requires the current playing participant
in PostgreSQL, and verifies the cached revision, native next actor and timer.
No cache-miss fallback is used for delivery. An internal snapshot fingerprint
distinguishes different move histories at the same live revision; neither
the fingerprint, opponent, board, move log nor subscription secret is sent.

This is still a best-effort, live hint; always re-fetch the current game
before acting and deduplicate by event ID. No write ordering, engine, DB
schema, or recovery semantics have been changed. Existing concurrent Redis
writes can supersede a snapshot; a superseded hint is suppressed. The
existing first-turn timer uses the black key even when a custom map starts
with white, and the initial hint uses that legacy timer's lifetime without
changing either player's native turn. Both these legacy behaviors are also in
upstream ReversiService for the
[initial timer](https://github.com/misskey-dev/misskey/blob/46a0a3dede9e52a8e95a407f2ff1c149e8d8fbdc/packages/backend/src/core/ReversiService.ts#L329-L367)
and the [move write sequence](https://github.com/misskey-dev/misskey/blob/46a0a3dede9e52a8e95a407f2ff1c149e8d8fbdc/packages/backend/src/core/ReversiService.ts#L496-L521).
