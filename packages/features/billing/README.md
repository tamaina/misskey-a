# Billing

Inactive representative application slice for Issue #8. `createBillingRouter`
uses the existing API authentication/admin middleware and finite Valibot contracts.
The host must supply repository ports and its existing `ApiContext`; no provider,
HTTP route, admin navigation entry, production adapter or migration is registered.

- Own history: principal ID selects bounded source payment snapshots. No balance,
  confirmation, expiry, quote or entitlement writes occur. The adapter must return
  descending immutable source order IDs with an exclusive cursor, filtering by
  Misskey user ID. Unexpected owners fail closed; responses project finite fields.
- Admin chain metadata: chain ID, name, confirmations; disabled only. Upserts use
  chain ID as identity and supply the authenticated admin ID for future auditing.
  A production adapter must enforce atomic upsert and a catalog size of at most 100.
- `BillingChainSettings.vue` takes a typed authenticated client for embedding in
  the server admin screen after review. It has no identity, RPC URL, price, key or
  activation input. A moderator is insufficient; app tokens are rejected by the
  existing unscoped credential-required policy. The UI is not an auth boundary.

Synthetic ports in the tests demonstrate account isolation, validation and retry
semantics, not live persistence or settlement. Source provenance, behavioral
boundaries, settings catalog and deferred accounting work are recorded in
[Issue #8](https://github.com/tamaina/misskey-a/issues/8#issuecomment-6106374065).

Validation after a backend build:

```sh
node --test --test-concurrency=1 packages/features/billing/test/native-operations.test.mjs
cd packages/frontend
node node_modules/vitest/vitest.mjs run --config vitest.billing.config.js --configLoader native --maxWorkers=1
```

The focused UI config uses the existing SFC localization plugin. The screenshot
in `test/fixtures` renders this component with synthetic ports and a standalone
preview stylesheet; it is not the running server admin screen.
