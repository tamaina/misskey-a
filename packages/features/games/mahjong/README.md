# Mahjong — #316

Invite-only four-player mahjong for local authenticated users. Presentation uses upstream
PR #13112; rules/progression use **@kobalab/majiang-core 1.4.1**, pinned as a production dependency.

## Initial product policy

- Same-server invited four humans; no CPU, public matchmaking, federation, stakes, ranking or spectators.
- All four must confirm the displayed rules before dealing. Any invitee can decline and cancel a waiting room.
- `9k-invite-v1` explicitly records **every** core rule in `shared/rules.ts`: East–South,
  25,000 initial / 30,000 return points, 20/10/-10/-20 placement points, one red five per suit,
  open tanyao, no kuikae, double ron (triple ron aborts), tenpai dealer repeat, bankruptcy,
  all-last stop, sudden-death extension, abortive draws and nagashi mangan. The file lists all
  riichi, kan, yakuman and fu options; tests compare the complete pinned upstream profile.
  The 30,000 return threshold is hard-coded in core 1.4.1, not an invented configurable rule.
- Discard 30 seconds, reaction 8 seconds, result acknowledgment 10 seconds. Timeout chooses
  the last **offered legal discard** (normally tsumogiri; after a call, the last legal discard),
  passes reactions and acknowledges results. It never declares riichi, wins or calls a meld
  for an absent player. Declining a win has core's normal furiten consequences.
- Polling every 2 seconds replaces streaming in this first version. The first authenticated
  participant request after a deadline processes that phase once. With everyone disconnected,
  the room is dormant; reconnect expires the pending phase and gives the next phase its full
  deadline. Restart never extends an already persisted deadline.
- Three active rooms per creator, creation rate 5/minute. Waiting rooms can be cancelled;
  started games continue using timeout actions. No automatic public result/paipu endpoint.

## Private engine and persistence

`backend/engine.ts` runs core synchronously with no core timers or network callbacks.
Every hand receives a stored cryptographically shuffled wall; `kaiju` receives a separately
selected crypto-random dealer. The default `Shan` constructor is never called. Its 1.4.1
constructor fields are initialized explicitly with the pinned prototype; updates require
conformance tests. No global Math.random override is used in production.

`mahjong_room.state` stores a private versioned journal (dealer, every original wall, accepted
four-player reply batches), current phase, ready state, private per-player projections and the
last 64 operation receipts. A new engine replays this journal when advancing a phase, preserving
furiten/riichi/kan state through the real core. Polls reuse cached projections. A future engine
upgrade must retain a v1 reader until existing rooms finish; it must not silently reinterpret
old journals. Long-game replay cost and retention require measurement before public matchmaking.

Every access uses a PostgreSQL `FOR UPDATE` transaction. Different workers therefore share a
single writer per room. An action, its receipt and phase transition commit atomically; database
failure rolls back all of them. A matching request ID retries without applying twice; a different
request for an already answered or stale phase is rejected. After the 64-receipt window, old retries
are stale rather than duplicated. Server-generated legal menus are the only accepted actions.
Late/invalid input is never interpreted as the core's fallback. Timeout advances commit even when
the accompanying late action is rejected.

Only named participants may query a room. `projectRoom` is the sole public projection: it sends
only that user's hand and legal actions, copied public rivers/melds/scores, and sanitized result
names/points. The wall, other hands, ura indicators, raw model/messages, journal and `_paipu` are
never returned, including after termination. API credentials determine identity, never request
body seat/user IDs. No stream broadcasts or spectator channels are registered. Unknown rooms and
nonmember requests share the same error. Room creation checks local/live users and pairwise blocks.
The owner's account deletion cascades room deletion; general room-retention policy is future work.

## Routes and UI

`/mahjong` lists a participant's latest 30 rooms and creates invitations; `/mahjong/:roomId`
shows readiness, all rule settings, seats, concealed tile counts, dora, rivers, melds, scores,
legal action buttons and remaining time. Keyboard buttons and a narrow-screen layout are included.
Existing game URLs and DI identities are unchanged. Six authenticated `mahjong/*` POST endpoints
are composed through the games API host; SDK routing is generated from portable contracts.

## Upstream sources and licenses

- Engine: [kobalab/majiang-core 1.4.1](https://github.com/kobalab/majiang-core/tree/7e964296dd8eb5ff5a32f8182acdc6a0c2a81cbb), MIT, Satoshi Kobayashi.
- Display: [Misskey PR #13112](https://github.com/misskey-dev/misskey/pull/13112), pinned
  `03971bf98681c986991e13a8b5c11c5475bbeff3`, AGPL-3.0-only, syuilo and misskey-project.
  `frontend/components/Tile.vue` adapts `hand-tiles.vue`'s layered tile presentation.
  `Table.vue` adapts the felt/seat presentation for the new DTO. The 37 face images are copied
  unchanged from that commit's `packages/frontend/assets/mahjong/tiles`; see their provenance file.
  No upstream game engine, sounds or unrelated artwork is imported.

## Validation

Core conformance tests reproduce delayed callback contamination, four-reply waiting and illegal
input fallback; these are integration constraints, not reports of defects in existing 9k.
Room tests exercise consent, secrecy, expiry, riichi/kan/ron/tsumo/chi/pon menus, idempotency
and deterministic complete multi-hand journal replay. PostgreSQL integration tests use `MAHJONG_TEST_SOCKET` in a dedicated disposable
cluster and cover migration up/down/up, cross-worker concurrency, API authentication and recovery.
Never point that fixture at a shared database. Development verification uses the shared validation
lock and isolated dependencies. Browser harnesses use only synthetic users and a private test DB.
