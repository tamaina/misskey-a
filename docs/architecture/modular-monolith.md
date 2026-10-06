# Misskey-a: feature-first migration

Status: migration in progress. This is not yet a replacement for the upstream runtime.

## Baseline and scope

Start from `misskey-dev/misskey` develop commit
`17196baaa89ff28ed5868b5a029a2460852df6de` (2026.10.0).
Do not import the p1-3 patch stack, cfw-fileup, commerce or payment features in
this migration. Preserve licenses, attribution and existing migration history.

The goal is to make a change to a product feature readable in one place, reduce
DI registration boilerplate, and derive client types from the same contract
that validates the server implementation. Merely moving files is insufficient.

## Ownership

- `packages/features/<feature>/backend`: implementation, persistence, jobs and
  feature-specific federation projections.
- `packages/features/<feature>/frontend`: views, components and state owned by
  that feature.
- Feature-owned contracts: oRPC contract-first definitions using Valibot,
  importable without database, Node.js, Vue, or server implementation code.
- `boot` is a feature, including backend roles and frontend startup. Executable
  entry points should eventually be thin delegates to this feature.
- Platform resources provide database, queues, storage and transport primitives.
  A resource being used by multiple features does not erase its ownership.

Cross-feature imports use explicit public entry points. No imports of another
feature's private persistence classes. Authorization remains on the server;
shared schemas are not an authorization mechanism.

## Dependency construction and lifecycle

DI constructs dependencies; boot starts and stops side effects explicitly.
Registration and constructors do not listen on ports, subscribe, start timers or
consume jobs. Use narrow dependencies rather than passing a global container to
all services. Pure transformations remain ordinary functions.

Each server/queue role initially owns separate resources, preserving upstream
isolation. WebSocket connections and channels own child lifetimes. True cycles
use explicit lazy dependencies and may not be resolved during construction.

Startup makes infrastructure and listeners ready before accepting HTTP traffic
or queue work. Failure rolls back resources already acquired. Shutdown closes
admission before dependent resources and flushes before disconnecting databases.
The process-level timeout is separate from the lifecycle coordinator; a timed-out
operation cannot safely be assumed canceled.

The first boot primitive runs explicitly ordered acquisitions, retains their
cleanup functions, and closes them in reverse order. Concurrent start/stop calls
are coalesced. An acquisition that fails before returning a disposer is responsible
for cleaning up its own partially acquired resources.

## Contracts and SDK migration

The feature contract is the source of truth for input/output schemas and SDK
types. The backend implements it; misskey-js derives types from contract exports,
not backend implementation imports or a duplicated handwritten model.

Move endpoints in tested slices. Preserve existing HTTP routes, authentication,
permissions, rate limits, body limits, upload behavior and error envelopes until
an explicit change is designed. Do not bypass these policies by mounting a new
RPC router beside the existing authorization middleware. Transitional adapters
must be removed as their feature completes migration.

## Frontend locales

Adopt VVI locale tags at template/component boundaries after confirming the
actual VVI implementation and compiler integration. The provided comparison
notes explicitly do not establish a performance winner. Compare build time,
locale update/switch behavior, CPU, memory and output size with identical tagged
input and cache conditions; do not claim an unmeasured improvement.

The selected implementation is `tamaina/vite-vue-internationalization` (VVI).
The currently published 1.1.3 package comes from commit
`07803e81e02f5af723821fae9d0e9266d196f53f`; its API must be checked against that
artifact, not the newer develop documentation. In particular, that artifact
does not export the newer SSR asset resolver, and its `ready` promise logs an
initial load failure instead of rejecting. Mounting must not treat that promise
alone as proof that translations loaded successfully.

For the first UI slice, use the virtual strategy while the legacy locale inliner
still owns entry URLs. Do not stack two locale-specific chunk rewriters without
verifying the backend manifest and dynamic-import paths. Preserve the existing
selected language and reload-based language switch. Move component-owned text
to locale tags, retaining every existing translation and the current fallback
chain (Japanese, English, language-family primary, selected locale). A VVI-only
Japanese fallback would silently change many existing translations.

Validate a small component in Japanese, English and a partially translated
locale, including direct navigation, reload, missing-key fallback and failed
locale loading. Check Volar types and production assets as well as development
rendering. Only then extend the migration to additional feature-owned views.

## Initial progress

- Upstream snapshot imported; SDK baseline: 14 tests pass.
- Boot resource coordinator: isolated tests cover ordering, rollback, cleanup
  errors, concurrent calls, stop during startup and independent role lifetimes.
- CLI dispatch now uses the boot feature: help, ping and unknown commands do not
  construct the legacy container. The reset-captcha command now uses an explicit,
  typed factory with only PostgreSQL and a Redis publisher. Boot starts/closes
  those resources; no Nest service graph, timers or subscribers are constructed.
  Its database update shares the legacy metadata transaction adapter and awaits
  the existing internal event before shutdown. Isolated database/Redis integration
  verifies existing/absent metadata rows, duplicate-row selection, unrelated fields,
  publication and process exit. Maintenance never synchronizes database schema.
  This is the first removed container path, not a completed server/queue DI rewrite.
- The first migrated endpoint is instance/ping. Its Valibot input/output and
  oRPC contract live under the instance feature. The server implements that
  contract; misskey-js derives ping request/response types from the contract.
  A temporary adapter retains the existing API policy/error pipeline and
  derives legacy JSON Schema documentation from Valibot. Generated SDK models
  are unchanged for this endpoint.
- Instance/server-info uses the same contract-first path. The feature receives
  a current-settings predicate and a machine-information reader, so its privacy
  behavior is testable without probing the host. The legacy adapter retains
  anonymous access, GET support and the 60-second cache policy. Generated
  OpenAPI remains identical; machine statistics are never read by the feature
  while the setting is disabled. The SDK overlays the complete instance contract
  type map, so adding a contract does not require a per-endpoint SDK type copy.
- The SDK builds portable contract declarations from feature-owned source.
  Distribution and license review remains a migration task; do not publish this
  experimental SDK layout as-is.
- The first VVI slice is the not-found view. Its locale blocks preserve the
  resolved text of all 28 existing languages. The existing boot language choice
  is passed to VVI; mounting waits for a successful locale load. Unit tests cover
  every translated body/title and the optional login prompt. Frontend typecheck
  and production build, including the legacy locale inliner, pass. This remains
  an initial adapter in the frontend package; feature ownership migration is
  not complete. Browser end-to-end validation is still pending because this
  cloud environment blocks the browser's local test-server connection.
- Existing server/queue Nest runtime and other endpoint definitions remain
  active. Remaining contracts, DI replacement and VVI migration are unfinished.
- Note-creation renote/quote predicates now live in the notes feature's shared
  public entry. They require only the fields they inspect, without ORM entities
  or a DI container. The existing seven predicate cases run in isolation without
  database setup; feature tests add null/undefined, empty text/CW and empty-file
  cases. This does not replace NoteCreateService's remaining dependencies or
  claim database/federation integration coverage.

## Current integration limits

The cloud can run isolated PostgreSQL 18 and Redis 7 test services. The complete
legacy backend E2E bootstrap currently stops when cacheable-lookup enumerates
network interfaces (uv_interface_addresses is denied by the environment).
Do not report the full server suite as passed or mock that call to disguise this
limit. The maintenance command's narrower dependencies are tested with real
PostgreSQL/Redis without constructing that unrelated HTTP client.

## Build ownership

Features are source directories, not independent workspace packages. They have
no package manifests, tsconfig, ESLint config or generated output directories.
The existing backend package owns backend/shared compilation and feature tests;
frontend owns frontend/shared checks and VVI scanning; misskey-js owns portable
contract declarations. Each consumer selects its source layers with globs.
The root supplies feature-source build dependencies; the SDK also declares the
public dependencies referenced by its generated contract declarations.

The generated contract directory carries the source license. SDK distribution and
licensing review remains required before publishing this experimental fork.
