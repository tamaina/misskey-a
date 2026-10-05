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

## Initial progress

- Upstream snapshot imported; SDK baseline: 14 tests pass.
- Boot resource coordinator: isolated tests cover ordering, rollback, cleanup
  errors, concurrent calls, stop during startup and independent role lifetimes.
- CLI dispatch now uses the boot feature: help, ping and unknown commands do not
  construct the legacy container. The reset-captcha adapter still uses Nest and
  closes its context in a finally block; database execution is not yet verified.
- Existing server/queue Nest runtime is still active. Wiring and replacing it, endpoint
  contracts, SDK integration and VVI migration remain work to do.
