# Home antenna browser fixture

This isolated fixture renders the production antenna editor, select menu, switches,
and light theme. API calls are captured locally; it does not contact a Misskey
server or modify real antennas. Saved synthetic data lasts for the tab session.

From `packages/frontend`, run `node --import tsx test/browser-feature/antenna.mjs --serve` and
open the printed loopback URL in Chrome. Omit `--serve` for a build-only check.
Use the repository dependencies and built icon font. Stop the preview with SIGTERM
or Ctrl-C; its temporary output is removed on exit.

Check a new antenna defaults to all notes; select followed users, name it, enter a
keyword and enable replies. Save and verify the captured `src: home` request.
Re-edit and reload, checking that the source and native reply checkbox retain
their values. Update and verify `antennas/update` with the synthetic ID. The
360px button narrows the editor container (it does not emulate a mobile viewport).

The independent Redis worker regression runs from the repository root:

```sh
MISSKEY_REDIS_FIXTURE_CONFIG=packages/features/timelines/test/vitest.home-redis.config.mjs node packages/features/auth/test/run-oauth-fixture.mjs
```

It starts a network-isolated Redis container with a private Unix socket, then two
Vitest fork processes with real CacheService, RedisKVCache and AntennaService.
Repository results are fixture values stored in Redis. Both processes warm their
caches and check follow, unfollow and refollow transitions through real internal
pub/sub events. The fixture runner removes its container and socket on exit.
This is a cache/dispatch regression, not a complete database-backed server E2E.

On a shared development machine, reserve the common validation lock and inspect
running jobs and available memory before building, serving or testing. Run these
checks serially with other builds and integration tests.
