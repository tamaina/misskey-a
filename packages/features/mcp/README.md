# MCP application integration (inactive)

This is the first application integration seam for #10. `McpApiService` is a Nest
provider; it has no HTTP registration, MCP SDK transport, OAuth grant issuance or
production exposure. `list_my_notes` is the only registered application tool.

`ApiExecutionContextFactory` supplies the same authentication, role, IP logging,
rate-limit and error ports to the HTTP API and this service. The service resolves
`users/notes` with the shared contract route index and the assembled
`ApiRouterProvider` router, then calls the native procedure through public oRPC
APIs. Existing feature providers already hold the normal repositories and
services. There is no separate database, query implementation or MCP scope.

The tool binds `userId` to the authenticated local account. It authenticates once
within each invocation and preserves the original user/token tuple for native
middleware. It does not cache that tuple across invocations. Native validation,
permissions, defaults and packed-note output remain authoritative. In particular,
`users/notes` is kindless: an empty-permission token is accepted by that endpoint.
This own-account tool may return the account's own nonpublic notes.

MCP diagnostics omit arguments and internal exception messages/names/stacks.
HTTP diagnostic behavior remains as before. Any future transport must supply a
trusted credential context; tool arguments are not a credential source.

## Isolated synthetic verification

`test/backend/shared-api.test.ts` uses the actual Nest authentication/context/MCP
services, actual native `users/notes` and `my/apps` procedures, and the actual HTTP
adapter with `Fastify.inject`. Repository/cache/fanout ports contain synthetic
fixtures. Native fanout visibility callbacks and packed-note conversions run;
this does not test PostgreSQL queries, Redis or the full note serializer.

The test is included in the normal backend unit suite. To run only this test
without the unit suite's database setup, create a temporary config beside
`packages/backend/vitest.config.ts`, importing its `baseConfig`, with test
`include: ['../features/mcp/test/backend/shared-api.test.ts']`, `environment:
'node'`, `maxWorkers: 1` and no `globalSetup`. Do not run database-resetting setup
against an existing preview database.

## Next design boundary

A future remote transport needs protocol/handshake and OAuth resource-server
review. Existing Misskey OAuth uses authorization code + S256 PKCE and existing
access-token rows, but those rows currently lack resource/audience binding and
automatic expiry. Protected-resource metadata, client discovery interoperability,
expiry and challenge behavior must be decided before enabling remote `/mcp`.
MiAuth/manual tokens and app/master tokens above are compatibility fixtures, not
a claim that MCP OAuth authorization is complete. This PR does not close #10.
