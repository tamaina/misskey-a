# Native API MCP transport

This feature implements a small native-token connection under #10. The normal
application server reserves `/mcp` as HTTP 404 by default. Explicit
`enableMcp: true` registers the shared handler; public activation requires the
operator's separate approval. The trusted configured `url` must use HTTPS.
The canonical `/mcp` service identity represents this instance's native API
through two transports, not a separate MCP-only permission or token class.
Existing opaque token storage and ordinary API permissions/lifetimes are retained;
there are no resource/expiry columns, migrations, new signing keys or grant store.

Use a scoped native API/MiAuth/app credential with `access:mcp` through one bearer
header on every request. The reference SDK 1.32.0 client supports this connection
via explicit headers. OAuth clients can discover the existing authorization server
from `/.well-known/oauth-protected-resource/mcp` and bearer challenges. The
configured issuer is exact, including trailing-slash spelling; success and error
callbacks include the same issuer. The provider advertises public-client `none`
and S256. It accepts CIMD metadata with `none` in the supported-method intersection,
including ChatGPT's plural method list and legacy `private_key_jwt` preference.
Redirect URIs come from fetched metadata and must match exactly.

This compatibility path requires the canonical `/mcp` resource in authorization
and token requests, binding it to five-minute consent/code state in shared Redis.
CIMD discovery also works for ordinary OAuth scopes without a resource. Metadata
formats overlap, so recognition uses request context: resource-bound requests
require CIMD; without a resource, a valid IndieAuth `client_uri` prefix selects
legacy semantics even with optional OAuth authentication fields. Other JSON
documents use CIMD validation. Legacy no-resource clients retain registered
loopback callbacks and empty-secret exchange. This does not widen the MCP path.
Requesting `access:mcp` now requires that resource even for legacy clients; this is an
intentional compatibility restriction. CIMD callbacks currently require
HTTPS; this restriction applies to the strict CIMD path, while overlapping
no-resource legacy documents keep their existing callback rules.
Metadata retrieval uses bounded direct public HTTPS without redirects, instance
proxy settings or private-network exceptions. This stricter retrieval also applies
to legacy HTTPS client IDs with a non-root path; root legacy IDs keep their
existing retrieval path. Code reuse revokes the associated
token row when its replay state remains available. Redis state stores row IDs,
not bearer credentials, and insertion races fail closed with row cleanup.

No DCR, client secrets, signing keys, refresh-token subsystem or token lifetime
changes are introduced. Public-client CIMD provides metadata identity, not signed
proof that a caller is ChatGPT. Real ChatGPT consent and availability of a custom
plugin to dot require separate user-operated checks; synthetic SDK compatibility
does not establish either one.
The transport is stateless POST/JSON with MCP 2025-11-25. GET/DELETE are unsupported.

The reverse proxy must preserve the canonical Host and strip X-Forwarded-Host.
Root server trustProxy settings still determine the IP used by native API policy;
the MCP authority itself is never inferred from forwarding headers. Present Origin
must equal the configured origin; absent Origin is accepted for nonbrowser clients.
Foreign/duplicate critical headers, query credentials, non-JSON and input bodies
larger than 1 MiB are rejected. Inherited access-log hooks omit MCP request/result
bodies even when global body capture is enabled. Native tool results larger than
1 MiB (including both structured and text representations) produce an explicit
bounded error, never a partial result reported as complete.

The handler uses a 30-second native-request deadline and at most eight concurrent
observed native requests per worker. Permits remain held until authentication/tool
promises settle, even after transport cancellation. The existing normal server's
body-reading timeouts remain its responsibility.

`createLocalMcpPilot(service)` remains a standalone loopback test wrapper around
the same handler, disabled by default, with explicit HTTP loopback resource,
request logging/proxy trust disabled and its existing 30-second request timeout.

Only `list_my_notes` is listed. Its descriptive schema comes from the native
contract; native validation remains authoritative. `McpApiService` reuses the
shared API context, original AuthenticateService tuple, assembled router and
existing feature repositories. It retains authentication only within each HTTP
request, never across requests or sessions. No separate DB/query/scope is added.

**MCP requires a scoped token with `access:mcp`.** Master/session credentials and
existing tokens without this permission are denied. The connection gate reads
current shared token/app records on every POST and tool invocation, so revocation
or removal of this permission takes effect without trusting the native app cache.
The original nonnull authentication tuple is passed unchanged to native API checks;
this permission adds no downstream API permissions or visibility. App tokens use
the current app permission list for the connection gate.

**Access can include the account's public and nonpublic notes.** The existing
`users/notes` behavior is preserved. Ordinary API authentication and authorization
are unchanged. The shared permission registry makes this kind selectable in token,
MiAuth, app and OAuth consent flows. Consent labels explain nonpublic-note access.
The six existing permission displays translate this label in all 28 SFC locales.
The legacy global YAML dictionaries retain Japanese fallback until Crowdin updates.
Note content is untrusted data. Foreign subjects are denied before native invocation. Observed disconnect,
deadline and shutdown suppress the transport response and release transport
state; they do not actively cancel SQL or guarantee that native work stops. Disconnect observation
starts before authentication. Detached work inside existing native services is
outside these observed promise permits.

Cross-POST `notifications/cancelled` is explicitly unsupported (HTTP 501 after
authentication, or 503 when the native-work limit is full). Every POST has its own
stateless SDK server. SDK `callTool` AbortSignal rejects the client promise and
sends that notification without aborting the original HTTP fetch; it therefore
does not cancel this handler's native work or suppress its eventual response by
itself. Supported disconnect/deadline/shutdown cancellation suppresses replies
and immediately releases transport state while retaining native-work permits.
No principal/request correlation map or session architecture is introduced.

The synthetic unit tests exercise Host/Origin/body/auth boundaries, installed SDK
initialize/list/call, native output/error behavior, revocation, delayed abort,
repeated cancellation batches, slow-auth disconnect and actual SDK callTool
AbortSignal behavior.
The opt-in PostgreSQL fixture executes native authentication, QueryService SQL,
NoteEntityService packing/private nested-note hiding and token revocation using
real task-owned repositories. Auxiliary cache, user/media/emoji packing and
role/rate-limit ports remain mocked. The separate OAuth fixture uses actual Redis
for cross-provider consent/code consumption, replay and insertion races; database
failure injection uses mocked repositories. A crashed worker or failed row cleanup
can leave an orphan token; durable recovery is outside this change.

Run the synthetic unit suite from the repository root:

```
node packages/backend/node_modules/vitest/vitest.mjs run --config packages/features/mcp/test/vitest.config.mjs
```

Run the isolated PostgreSQL fixture:

```
node packages/features/mcp/test/run-postgres-fixture.mjs
```

It creates a new private temporary cluster with TCP disabled, runs only the
feature fixture, stops the server and retains its directory. It never loads the
preview/test database configuration. The newest installed PostgreSQL binaries are selected;
`MISSKEY_PG_BINDIR` can select another installed PostgreSQL binary directory.
The ordinary unit suite skips this opt-in DB fixture; backend CI explicitly runs
the launcher in both Node matrices. It also runs the disposable OAuth Redis suite:

```
node packages/features/auth/test/run-oauth-fixture.mjs
```

That launcher creates a private Unix socket in a fresh network-disabled container,
runs the OAuth state/flow suites and removes the container, with no instance config.

The normal-server synthetic tests include SDK initialization/list/call using
remote request addresses, native MiAuth/app grants, master denial, current scope
removal, inherited access-log suppression and bounded output. The PostgreSQL
fixture now executes the same normal-server plugin with real native SQL/serializer
and revocation ports. Full application boot, live network/proxy behavior and real
client/account grants remain outside these fixtures. This small transport does
not complete every acceptance criterion of #10.
