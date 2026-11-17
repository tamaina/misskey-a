# Full-application HTTP check

`full-app-http.test.mjs` is an opt-in integration check against a **new, disposable,
owned application**. It creates accounts, uploads a synthetic UTF-8 TSV, imports a
material, edits its name/description, then archives and restores it. It never
physically deletes a material or changes its cards, source text or grading.

Do not run it against an existing development or production instance. The test
requires `FUKUSHU_E2E_RUN_DIR` pointing to an absolute, private directory owned by
the current user, without symlinks. This directory must be prepared by the
isolated application launcher and contain:

- `.owner`: a UUID identifying this one run;
- private `config.json` and `credentials.json` files (mode 0600);
- `ready.json`: the launcher's readiness record, with the configured URL;
- a PostgreSQL Unix socket directory `p` for a freshly migrated `fukushu_e2e` DB;
- a Redis Unix socket `r/r.sock`, using prefix `fukushu-e2e-<owner UUID>`;
- the application Unix socket `a.sock` and a loopback-only HTTP proxy at
  `http://127.0.0.1:3220`.

`credentials.json` initially contains only the launcher's `setupPassword`.
The test stores the generated local test users and tokens there for subsequent
browser verification. Never commit or print this file. A completed or partially
completed run is not reusable: stop its owned processes and create a fresh run.
The launcher should use `NODE_ENV=production`, a single server process, and no
background daemons, with the existing authentication and upload policies enabled.
The Unix-socket proxy must replace the forwarded client IP, and the private
application must trust that proxy. Password signins are spaced to respect the
real IP rate limiter; API limits are not disabled.

After building the current backend and frontend, applying migrations to that
owned DB, and waiting for readiness, run under the same validation lock as the
application:

```sh
FUKUSHU_E2E_RUN_DIR=/absolute/private/run-directory \
  node --test packages/features/games/fukushu/test/full-app-http.test.mjs
```

Without the environment variable, the test is skipped. Every HTTP request has a
10-second timeout, redirects are rejected, and later steps stop after an earlier
failure. Response bodies and credentials are omitted from transport failures.
The scenario uses the actual initial-account endpoint, password signin, browser
sessions, sudo and scoped-token issuance, multipart Drive upload and persistence,
and Fukushu HTTP handlers; those paths are not mocked. The data and services are
disposable test fixtures. The UI login, native file chooser and Drive picker need
a separate browser check against this same application.

The small maintenance slice has no FSRS/review-history tables yet. Its retention
assertions prove unchanged card/source records and identity; they do not claim
that upstream study history was imported or replayed. PostgreSQL tests separately
cover concurrent mutations, total quota (including archived materials), source
deduplication and migration round trips.
