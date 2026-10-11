# Billing wallet registration

Small review slice for [Issue #8](https://github.com/tamaina/misskey-a/issues/8).
Wallet registration is composed into Misskey's native feature provider/API and
`/settings/wallets`. The older payment-history and disabled admin-chain prototypes
remain unregistered; this slice performs no payments, balance/credit accounting,
pricing, entitlements, settlement or transfers.

The host binds the current Misskey principal to a PostgreSQL wallet identity.
`billing_wallet` and `billing_wallet_challenge` are the only new tables. The local,
unapplied-to-production migration has `up` and `down`; reverting deletes these
wallet identities and challenges. Normal `read:account`/`write:account` scopes apply,
including scoped application tokens. No grant or admin-role rules are expanded.

The native authentication adapter requires explicit password/TOTP or a fresh
one-use native passkey response on every registration begin. Native browser logins
share the same stored account token, so it cannot safely identify a recent-auth
session. This is stricter than the source five-minute recent-auth window. Unlink remains an owner-only
operation without additional reauthentication. Linking checks a ten-minute SIWE
message and consumes its challenge atomically with a globally unique wallet insert.
The server clock is checked again after acquiring the PostgreSQL challenge lock.

`walletChains` in server configuration defaults to an empty catalog. Its entries
have `chainId`, `name`, `nativeCurrencyName`, `nativeCurrencySymbol`,
`nativeCurrencyDecimals`, `blockExplorerUrl`, `rpcUrl` and `isEnabled`.
RPC URLs remain private. The public catalog includes enabled entries with configured
RPC, matching the source; verification requires configured RPC. A canonical HTTPS
origin is required for linking. An HTTP development host can still boot and list or
unlink wallets, but cannot link them.

The page uses the existing authenticated Misskey client, confirmation dialog and
passkey browser adapter. EIP-6963 and an injected EIP-1193 provider are supported.
Account, chain and disconnect events clear local connection state; page disposal
removes its listeners. WalletConnect, adding unknown chains and revoking browser
wallet permissions remain deferred.

Source provenance, account mapping and necessary behavioral differences are recorded
in Issue #8 / draft PR #64. #64 is the successor containing #57's pilot; their histories
diverge. Do not merge both duplicate pilots.

After the normal backend build, run focused synthetic tests:

```sh
node --test --test-concurrency=1 packages/features/billing/test/native-operations.test.mjs packages/features/billing/test/wallet-registration.test.mjs packages/features/billing/test/wallet-authentication.test.mjs
```

The optional `wallet-store.test.mjs` requires `MISSKEY_BILLING_TEST_DATABASE_URL` for
a disposable loopback PostgreSQL database. It creates and removes its own random
schema, tests migration apply/down/reapply, real uniqueness/locking/rollback,
native account-scoped list and synthetic begin/verify/unlink. CI runs it explicitly
against its existing test service. Never point this test at a production database.

Frontend tests use the real Misskey controls with synthetic providers and clients:

```sh
cd packages/frontend
RAYON_NUM_THREADS=1 pnpm exec vitest run --config vitest.billing.config.js --maxWorkers=1
```

Successful registration tests use a synthetic signature verifier. They do not prove
valid wallet-signature interoperability or any live billing integration. No real
wallet request, signature, key, RPC endpoint or payment is used in these tests.
