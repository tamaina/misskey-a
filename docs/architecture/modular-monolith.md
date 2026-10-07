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
- Instance/get-online-users-count now follows the same path. The feature computes
  the per-request cutoff from its clock and threshold; its adapter retains the
  existing strict `lastActiveDate > cutoff` TypeORM query. Anonymous GET/POST,
  caching, required numeric response and generated OpenAPI are unchanged.
- Instance/endpoint and instance/endpoints use a lazy registry projection to avoid
  an import cycle during feature construction. Their contract-derived SDK types
  preserve required inputs, descriptor order and nullable unknown results; the
  legacy bridge retains the HTTP 204 response for unknown names.
- The SDK builds portable contract declarations from feature-owned source.
  Distribution and license review remains a migration task; do not publish this
  experimental SDK layout as-is.
- The first VVI slice is the navigation feature's not-found view. Its locale
  blocks preserve the
  resolved text of all 28 existing languages. The existing boot language choice
  is passed to VVI; mounting waits for a successful locale load. Unit tests cover
  every translated body/title and the optional login prompt. Frontend typecheck
  and production build, including the legacy locale inliner, pass. This remains
  an initial feature-owned view; the wider frontend migration is not complete.
  Browser end-to-end validation is still pending because this
  cloud environment restricts Chromium process socket setup.
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

## Server and queue lifecycle migration

Boot owns role selection, phased role shutdown and process signal handling.
All contexts are acquired before admission starts. Shutdown requests admission
stop/drain across every role, waits at a barrier, flushes domain buffers, then
closes contexts/infrastructure. Primary processes signal and await cluster workers;
workers use the same role lifecycle. Startup failure rolls back acquired contexts
and exits through the shutdown path with a failing code, without declaring ready.
The existing process deadline is a hard bound, not cancellation of pending work.

The transitional backend adapter still constructs the legacy Nest graph. A Nest
constructor failure before the context is returned remains process-fatal; this is
not a claim that arbitrary partially constructed legacy graphs can be recovered.
Untracked legacy fire-and-forget work also remains migration work. The new barriers
cover registered HTTP/queue drains, WebSocket upgrades/close, statistics readers,
chart saves and collapsed-queue writes already running when a flush starts.

Known flush/dispose methods coalesce repeated calls, because temporary Nest
shutdown hooks may run after explicit boot cleanup. Shared process telemetry is
closed by boot after roles/workers, rather than by the first Nest context to close.
The real-process CI covers server-only, queue-only, combined and cluster modes,
including WebSocket closure and the absence of orphaned worker processes.

## Feature-level dependency construction

The instance API is constructed once per role through a typed factory. Its
clock, current-settings predicate and metrics reader are explicit dependencies;
constructing the feature performs no I/O. The transitional Nest composition
boundary registers one feature provider. Migrated endpoint files export small
transport factories instead of injectable classes. Existing endpoint policy
metadata, validation, error handling and routes still pass through the same
API pipeline; unmigrated handlers retain their class providers.

This removes per-handler container construction from the migrated slice without
introducing a global service locator into feature code. It does not select or
complete the replacement container for the remaining service graph.

## VVI component locale expansion

The shared result/error components now own their translated labels, preserving
all 28 resolved legacy locales, custom text (including an empty string), and the
retry event. VVI 1.1.3 needs a narrow integration guard: its transform collects
Vue style/template subrequests as if they were complete SFCs, which erases their
previously scanned dictionaries and renders literal locale key paths. Only the
complete SFC is now passed through that transform; Vue handles its subrequests.
A direct hook regression and mounted component tests cover this guard. Review
and remove the guard when adopting a VVI release that handles subrequests itself.

## Frontend boot phase

Boot also owns the component-locale startup phase through an explicit factory
and installer dependency. Readiness alone is insufficient with VVI 1.1.3;
the selected locale must load successfully before installation and mounting.
Failure is propagated without installing an incomplete runtime. Separate app
starts remain independent. The frontend consumer supplies the concrete VVI
factory and Vue installation callback.

## Feature-owned frontend sources

The not-found view and its locale regression tests live under
`features/navigation/frontend`, exposed by a named lazy loader. Existing router
fallbacks and permission conditions call that public entry without eagerly loading
the view. The frontend package owns test discovery, typed lint, dependency
resolution and compilation for these sources; no feature configuration is added.
VVI scans the common packages directory with explicit frontend/feature patterns,
because its scanner does not traverse `../` include globs outside its own root.
This changes only localization's scan root, not Vite's application root.


## Browser fixture verification

A production-built Chromium fixture exercises the real navigation/result/error
components and frontend locale boot phase with isolated application-service
adapters. It checks multiple locales, reload, retry events, the login callback
and failure to load a locale chunk. This is component/runtime coverage, not a
claim that the complete application browser E2E suite has passed. The dot cloud's
Chromium process socket setup is restricted; the browser execution runs in CI.


## Multiple backend feature bindings

Statistics has its own contract and backend factory. Its chart reads retain their
sequential order, count queries retain their one-hour database cache, and the two
counts still run concurrently. Existing zero-valued drive-usage fields are not
reinterpreted. SDK types combine the instance and statistics contract maps.
A typed endpoint binding ties each transport factory to the correct feature;
backend typecheck rejects mismatched features and non-handler factories.

The packed SDK consumer check uses explicit `{}` parameters for empty-input
routes. Its legacy generated public overloads require that argument, even though
the source implementation has a default; this convention predates the migration.
Source-only SDK tests do not by themselves establish packed-consumer compatibility.

## Request-local feature context

Avatar-decoration reads receive only the transport's authenticated/anonymous
state through per-call oRPC context. It is derived from the API pipeline's
resolved user, never from request parameters. Feature construction has no user
state, and concurrent callers cannot overwrite one another's visibility.
Anonymous callers retain only public role IDs; authenticated callers retain all
existing role IDs, matching the previous endpoint. Missing runtime context is
anonymous. Roles and decorations are read anew through the existing services,
whose cache and lifecycle ownership remain unchanged.

## Packed model contracts

All 69 packed response model schemas now have authoritative static Valibot
contracts in 23 feature-owned `contract/packed.ts` modules, with PageBlock split into a dependency-light contract for frontend consumers. The host composition
registry `features/index/contract/packed.ts` maps the published model names to
those feature definitions; backend `Packed<K>` is inferred with
`v.InferOutput`, and OpenAPI named components are generated from the same registry.
Definitions remain beside their owning features rather than in the registry.

`resultObject` preserves the runtime behavior of `v.looseObject`: extra response
keys continue to pass through. Its schema type exposes only declared entries to
TypeScript, so inferred `Packed<K>` types describe the declared contract fields
without inventing an index signature for every extra runtime key. This change does
not install global output validation on legacy endpoints, strip unknown response
fields, or normalize stored data. Opaque-schema compatibility fixes and
serializer/guard work remain separate API-host and feature responsibilities.

This is not full endpoint-schema retirement. Legacy endpoint input `Schema` and
`SchemaType` remain in the backend compatibility layer for the next input-contract
phase, and inline endpoint `meta.res` schemas still use the legacy converter.
The 69-model registry is a bounded schema migration, not a claim that every
endpoint contract or runtime response path is fully migrated.

EmojiSimple and EmojiDetailed continue to reuse their existing emoji feature
contract schemas rather than duplicating the field lists. Optional wire properties
use exact optional types for `exactOptionalPropertyTypes` consumers. The emoji
response boundary still copies packed objects and omits own `undefined` properties
as JSON serialization would; it does not mutate the packer's object. Decoration
category retains the same absent-property semantics.

## Native endpoint contracts on the existing transport

`defineEndpointContract` keeps feature-owned Valibot input/output schemas together
with the oRPC contract. The API host's `ContractEndpoint` derives callback types
from those schemas without using `SchemaType`. Its projection adapts documentation
requiredness to the legacy OpenAPI writer. Request validation remains in the
existing AJV transport, including defaults, unknown keys and `INVALID_PARAM`
details; authentication, role policies, rate limits and file cleanup keep their
existing owners. Responses are not newly parsed or rewritten by this adapter.

The bridge accepts an audited, JSON-schema-projectable input subset. Runtime
transformations, fallbacks, dynamic defaults, lazy inputs and optional root bodies
are rejected instead of silently pretending AJV executes them. String length
constraints use `jsonString` for JSON Schema Unicode-code-point semantics.
The avatar-decoration create/list routes exercise this path; legacy inference
remains for routes not yet converted. This is distinct from the existing feature
procedures that intentionally run oRPC input/output validation.

## Emoji catalog frontend

The catalog and its row menu now live beside the emoji backend/contract under
`features/emojis/frontend`. The instance-information page loads the feature
through its named lazy entry. Search behavior, menu permissions and detail/edit
flows retain their existing semantics; storage and global emoji state remain
owned by the existing application adapter for now. The two SFCs own seven labels
through VVI locale blocks, preserving all 28 resolved translations.

Unit coverage checks search and menu predicates, including the existing nullish
moderator/admin predicate without silently changing it. The production browser
fixture adds catalog search/clear, translated menus, permission differences and
dialog cleanup using synthetic state and service adapters. It is not a complete
application E2E test. Local Chromium process sockets remain restricted even with
approved execution elevation; CI supplies the actual browser execution.

## Injectable emoji frontend state

Emoji state is constructed by a feature factory with explicit clock, cache and
fetch dependencies. The existing application module still performs its initial
IndexedDB/localStorage cache read and supplies the concrete GET/POST and storage
adapters. It reexports the same application-lifetime singleton API. The feature
owns refs, category/map updates and cache policy without importing application
I/O or credentials. Test instances can stop their own watcher through `dispose`.

This extraction preserves watcher scheduling, stable map identity, mutation and
persistence order, one-hour TTL, force-refresh behavior, concurrent completion
order and the existing first-snapshot tag cache. It does not introduce fetch
coalescing or silently change persistence error handling. Isolated feature tests
and host-adapter tests cover both the state rules and concrete API/storage keys.

## Static component locale migration checkpoint

A further 47 feature-owned SFCs now use component locale tags for 176 static
labels. All 28 loader-resolved translations are preserved per label (4,928
value comparisons). The regression manifest covers these and the preceding
37-component batch, with 84 SFCs and 5,964 exact translation comparisons.
The URL-preview test application now installs the real VVI runtime and explicitly
loads its selected locale before mounting. Full frontend unit tests (404),
changed-file lint, production build and frontend type checking pass locally.
This removes global dictionary references from those templates; embedded locale
strings increase source bytes, and this is not a completed frontend conversion.

The current priority is completing contract-first API definitions, dependency
construction and VVI migration before resuming the separately prepared owner-PR
ports. File placement alone is not counted as completion of those changes.


## Inline native-contract batch

A further 35 endpoints now own native Valibot input/output definitions under
their features, with oRPC-derived SDK types collected by the feature index.
Together with the earlier routes this brings native contracts to 129; 309
class-based endpoints still use legacy schema inference. Of the native routes,
92 use feature procedure factories and 37 retain their existing class adapters.
This does not count those class adapters as completed dependency-injection migration.

The HTTP input validator, handler bodies, authorization metadata and full OpenAPI
document remain unchanged. Optional root responses retain their no-content branch,
and opaque object output declarations retain extra payload fields. The WebAuthn
key-completion route remains outside this batch because its opaque credential
input needs a separate boundary review.

## Packed-reference contract batch

Forty further endpoints now use feature-owned native contracts across
announcements, authentication, channels, chat and collections. The SDK derives
these request/response types from their oRPC definitions. There are now 169
native-contract routes (92 feature factories and 77 class adapters), with 269
legacy schema-inference routes remaining.

`packedReference(name)` preserves the canonical Valibot model type without
expanding recursive response schemas at every endpoint. Only the legacy output
projection maps registered references to named OpenAPI components. The generic
schema converter does not automatically accept these output-only references,
and the legacy input adapter rejects them. Existing handler response objects are
not parsed, cloned or stripped. Missing-type legacy references remain outside
this mechanical batch until their intended public schema is reviewed.


## Expanded Packed contracts and SDK aliases

A further 121 endpoints use native feature contracts, bringing coverage to 290
routes (92 feature factories and 198 class adapters); 148 routes still use legacy
schema inference. The role-creation endpoint stays on its legacy path until its
opaque condition-formula input and typed service boundary can be reconciled
without a cast or an unintended validation change.

Named SDK model aliases now derive from the canonical Packed schema map. Named
operation aliases prefer migrated contracts and fall back to the generated
OpenAPI types for unmigrated routes. Declared request keys remain usable with
Pick/Omit without a broad top-level index signature erasing required fields;
transport validation and preservation of extra input keys are unchanged. Opaque
Page data and queue options are represented as records, retaining arbitrary data.
These changes do not introduce response parsing or alter the HTTP client runtime.

## No-content contracts and source-constant constraints

Another 64 no-content endpoints and twelve endpoints with source-constant regular
expressions or registry defaults use feature contracts. Native coverage is now
366 of 438 routes; 72 retain the legacy path. The no-content routes preserve
missing response metadata and their existing HTTP 204 behavior. Registry scope
keeps its legacy required declaration and static default, while opaque values
and extra input fields remain untouched. Maintained tests exercise the real
Endpoint/AJV bridge for field allowlists, invalid input, defaults, authorization
and response identity. The complete generated OpenAPI document remains equal
to the pre-migration baseline.

## Explicit feature service construction

Announcements, collections, gallery, pages and play now construct 13 services
through typed feature-owned factories. Their dependencies are named ports with
narrow cross-feature capabilities; their existing method implementations and
binding behavior are retained. The temporary Nest host adapter creates each
feature graph once and exposes the previous class and string tokens without
expanding their export visibility. Remaining CoreModule registrations use a
single canonical service index instead of repeated provider/alias/export lists.

The initial slice reduces production code by 373 lines. It does not migrate
resource-owning constructors or lazy ModuleRef lifecycle resolution. Boot will
ultimately own construction and disposal directly, at which point the Nest-only
adapter can be removed. Regression tests preserve all existing provider/export
and alias identities, singleton sharing, and strict local test-module resolution.
