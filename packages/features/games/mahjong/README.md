# Mahjong integration — #316

This is a server-boundary foundation, not a playable or published game. It has no API,
stream registration, persistence, or game-list entry yet. The game split is tracked in #317.

## Chosen integration direction

- Presentation: reuse the Vue presentation from [upstream PR #13112](https://github.com/misskey-dev/misskey/pull/13112),
  pinned for research to `03971bf98681c986991e13a8b5c11c5475bbeff3`.
- Rules/progression: `@kobalab/majiang-core` 1.4.1 (MIT, Satoshi Kobayashi), researched at
  [`7e964296dd8eb5ff5a32f8182acdc6a0c2a81cbb`](https://github.com/kobalab/majiang-core/tree/7e964296dd8eb5ff5a32f8182acdc6a0c2a81cbb).
  It is currently a backend **test dependency** for conformance tests; production integration is pending.
- Do not import upstream's `misskey-mahjong` engine. `shared/tiles.ts` converts core tile strings
  into the upstream `tile.vue` face/red shape, including honors and red fives. Hidden tiles are `null`.
  Tile faces are presentation values, not client-authorized moves.

## Implemented boundaries

`backend/seat-snapshot.ts` explicitly constructs a DTO from a small server-only model interface.
It maps rotating seats through `player_id`, reveals only the authenticated participant's concealed
hand, and gives spectators only counts. Public arrays are copied. The wall, ura indicators,
raw model, raw messages and `_paipu` cannot be included by object spreading. This projection
is also the intended reconnection projection. It does not grant room access: API/stream adapters
must first enforce invitation/observer permissions and derive identity from authentication.
Unknown identities are masked as spectators; they are not automatically allowed into a room.

`backend/reply-gate.ts` buffers one reply per authenticated player and phase. Clients submit
an offered action ID, never a raw core reply. Server-generated menus must contain only legal
core actions. A stale phase, duplicate response, unoffered action, spectator, or expired input
does not invoke a callback. All four decisions are delivered as one callback batch. The host
must supply a legal timeout action and call `expire(phaseId, now)` from a server-owned timer.
Old timers cannot expire new phases; disconnection does not reset deadlines. Non-acting seats
can be acknowledged by the host. Cancelled/restarted sessions must discard old phase IDs.
Callback failures must abort/pause the host session, not retry an already delivered batch.

`backend/random.ts` generates a 136-tile wall with explicit red counts using Fisher–Yates
and `crypto.randomInt`, and chooses the initial dealer independently with `randomInt(4)`.
There is no global `Math.random` override. The production core adapter must inject the wall
into **every** `qipai` and pass the dealer to `kaiju`, rather than instantiate the core's
default random wall. That adapter is not implemented here; these utilities alone do not
make an unmodified `Game` cryptographically random.

The conformance tests reproduce three properties of pinned core 1.4.1: an old callback can
write into a later `_reply`, `next()` waits for four replies, and an invalid discard falls back
to a legal discard. These are integration constraints, not claims about existing 9k behavior.
The network host must reject invalid actions before core and must not rely on its timer or fallback.

## Product decisions pending confirmation

No core default is an approved product rule. The questions sent for confirmation are:

| Decision | Proposed starting point, not adopted yet |
| --- | --- |
| Participants | Four logged-in users on the same server, invited room; CPU, matchmaking, federation and ranking later |
| Main rules | East–South, 25,000 starting points, one red five per suit, open tanyao, double ron, tenpai dealer repeat, abortive draws and nagashi mangan |
| Disclosure | Conceal every hand from spectators; no automatic full-paipu publication after the game |

Before a playable endpoint, record a complete versioned rule profile (not a partial override of
`core.rule()`), show it before all players ready, and lock it for the game. Remaining rule choices
include return points/uma, double-wind fu, kuikae, noten declaration/penalty, bankruptcy,
all-last stopping/overtime, ippatsu/ura/kan-ura, kan-dora timing, last-draw riichi, post-riichi
ankan, combined/double/counted yakuman, pao, and kiriage mangan.

Timeout length and abandonment behavior also need a product policy: proposed starting point is
30 seconds for a discard and 8 seconds for reactions, with an explicitly chosen legal discard/pass
on timeout. Do not silently reinterpret invalid client input as that timeout action.

## Next implementation sequence

1. Confirm room/rule/disclosure policy; define legal-action menus and a complete rule profile.
2. Connect core behind a private session object, snapshot projection and reply gate. Inject both
   wall and dealer randomness, including later hands. Test phase transitions, furiten, kan,
   multiple claims, riichi, draws and end-of-game fixtures against the fixed profile.
3. Persist private wall/state and accepted actions atomically with a revision and idempotency key.
   Specify single-writer ownership across workers and restart recovery before API/stream exposure.
   A recovery must invalidate old phase IDs while preserving action history. Never pack private
   persistence rows into public DTOs. Database migration and retention policy are not implemented.
4. Add authorized oRPC/stream/reconnect paths. Fan out a separately projected view per recipient;
   do not broadcast an unmasked room event and ask clients to filter it. Add secrecy tests at
   each actual transport boundary, not just this projection's unit tests.
5. Adapt upstream `tile.vue`, `hand-tiles.vue`, meld and room presentation to the DTO and action IDs.
   Preserve AGPL source attribution, record asset provenance separately, and verify desktop/mobile
   gameplay in the development browser. No images/audio have been imported in this change.
