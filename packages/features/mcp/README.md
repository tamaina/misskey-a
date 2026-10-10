# Local MCP pilot

This feature is a draft integration for #10. The normal application server does
not register `/mcp`. `createLocalMcpPilot(service)` creates a standalone Fastify
app with the route disabled by default. Local synthetic tests opt in with
`enabled: true`, an explicit `http://127.0.0.1:<port>/mcp` resource (also localhost
or IPv6 loopback), and an exact Origin allowlist. Absent Origin is accepted for
nonbrowser clients. Nonloopback clients, foreign/duplicate critical headers,
query credentials, non-JSON bodies and bodies over 1 MiB are rejected. Request
logging and proxy trust are disabled. The pilot uses stateless POST JSON replies,
one bearer header per request, a 30-second deadline and at most eight active
requests. GET/DELETE are unsupported. SDK 1.32.1 is pinned.

Only `list_my_notes` is listed. Its descriptive schema comes from the native
contract; native validation remains authoritative. `McpApiService` reuses the
shared API context, original AuthenticateService tuple, assembled router and
existing feature repositories. It retains authentication only within each HTTP
request, never across requests or sessions. No separate DB/query/scope is added.

**Access includes the account's public and nonpublic notes.** `users/notes` is
kindless, so permission=[] tokens retain that native behavior. Tool description
and any future consent UI must state this explicitly. Note content is untrusted
data. Foreign subjects are denied before native invocation. Cancellation
suppresses the transport response and releases transport state; it does not
actively cancel SQL or guarantee that native work stops.

The synthetic unit tests exercise Host/Origin/body/auth boundaries, installed SDK
initialize/list/call, native output/error behavior, revocation and delayed abort.
The opt-in PostgreSQL fixture executes native authentication, QueryService SQL,
NoteEntityService packing/private nested-note hiding and token revocation using
real task-owned repositories. Auxiliary cache, user/media/emoji packing and
role/rate-limit ports remain mocked; Redis is unverified.

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
preview/test database configuration. PostgreSQL17 binaries are the default;
`MISSKEY_PG_BINDIR` can select another installed PostgreSQL binary directory.
The ordinary unit suite skips this opt-in DB fixture.

Before remote activation, reuse the existing OAuth2ProviderService and review
protected-resource discovery/challenges, client metadata interoperability and
resource/audience binding on existing grants/tokens. Choose expiry and optional
refresh separately. This local manual-bearer pilot does not establish standard
MCP OAuth compatibility, issue real grants, or complete #10.
