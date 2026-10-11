# Billing

Review prototype for [Issue #8](https://github.com/tamaina/misskey-a/issues/8).
The billing and wallet routers use the native authentication/policy middleware and
finite oRPC/Valibot contracts. The host has **not** registered a provider, HTTP
route, admin/user navigation entry, storage adapter or migration. No account can
currently use these forms through a running Misskey instance.

- Own service-payment history projects existing immutable source order snapshots.
  It never writes balances, quotes, confirmations, expirations or entitlements.
  Storage must filter by principal, return descending immutable order IDs with an
  exclusive cursor, and respect the limit. An unexpected owner fails closed.
- Admin chain metadata uses the chain ID as identity, atomic disabled-only upserts
  and authenticated admin attribution. The catalog is bounded to 100 entries.
  `BillingChainSettings.vue` uses Misskey form controls and a typed admin client.
- Wallet registration follows cfw-fileup's SIWE challenge, ten-minute expiry,
  exact message, RPC signature verification and global `(chainId, address)`
  uniqueness. Misskey's native principal selects the account. The public DTO omits
  owner, proof and RPC details. `WalletStore.complete` requires an atomic unique
  insert + challenge consumption; the only implementation here is a synthetic
  transactional fixture. A real DB adapter must enforce this, including rollback.
- `WalletSettings.vue` belongs in user settings; it lists registered identities
  separately from the current provider connection and confirms unlink. It takes
  an authenticated typed client, connector providers and native confirmation
  callback. `wallet-link.ts` requests connect, chain switch and personal-sign of
  the server message, with cooperative cancellation before verify. These are
  reusable view/flow components, not a registered settings page.
- Reads use `read:account`, wallet writes use `write:account`; chain admin reads
  and writes use their existing admin-meta scopes plus the native admin boundary.
  Scoped application tokens are supported; supplying a user ID in input is not.
- The host must supply sensitive-action reauthentication; no permissive adapter
  is provided. Current-password/TOTP fields are contract inputs, not a working
  native authentication adapter. Do not register routes until this is connected.

Synthetic tests prove the application seam's account isolation, challenge/race
checks, permission handling and UI flow. They do not prove production transaction
locking, valid wallet signature interoperability or settlement. The actual viem
verifier is included, but successful registration tests inject a synthetic verifier
and provider; no private key, real signature, wallet account or RPC endpoint is used.

Source provenance and behavioral differences are documented in Issue #8 and the
follow-up PR. Deferred work includes persistent models/adapters, host registration,
native reauth/passkey support, chain catalog/connector discovery, WalletConnect,
unknown-chain addition, provider connection events, browser permission revocation,
SDK generation once routes are public, and every payment/settlement operation.
There is no balance/credit ledger, price, fee, grant, payment activation or transfer.

Validation after a backend build:

```sh
node --test --test-concurrency=1 packages/features/billing/test/*.test.mjs
cd packages/frontend
node node_modules/vitest/vitest.mjs run --config vitest.billing.config.js --configLoader native --maxWorkers=1
```

The focused UI config mounts the actual Misskey controls and isolates unrelated
navigation/autocomplete/popup infrastructure. Screenshots in `test/fixtures` use
synthetic clients and a preview shell; they do not show a deployed settings page.
