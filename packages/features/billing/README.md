# Billing review slices

Small review slice for [Issue #8](https://github.com/tamaina/misskey-a/issues/8).
Wallet registration is composed into Misskey's native feature provider/API and
`/settings/wallets` and `/admin/wallet-chains`. The older payment-history and disabled payment-chain prototypes
remain unregistered. The continuation records admin-configured fixed service terms
and detects already-mined transfers between registered accounts. No balance, custody,
wallet signing, transaction sending, automatic renewal, native role/quota changes or
usage settlement is implemented. All development checks use synthetic fixtures.

The host binds the current Misskey principal to a PostgreSQL wallet identity.
`billing_wallet`, `billing_wallet_challenge` and `billing_wallet_chain` are the new tables. The local,
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

Native administrator chain settings persist chain/currency/explorer metadata,
the catalog enabled flag, private HTTPS RPC URL, and last editing admin/time.
The RPC field is write-only: omitted input retains it, null clears it, and a URL
replaces it atomically by chain ID. Native admin scopes and roles are enforced.
DTOs expose only `hasRpc`; SQL parameter and optional access-body logging suppress
RPC secrets. URLs are stored in the private server database, without a new encryption
key or credential service. Administrators must trust database backups/access as with
other native private operational settings. Changes take effect without restart.
RPC verification uses native HttpRequestService proxy/outgoingAddress and destination
policy, including allowedPrivateNetworks. Redirects are rejected; configure the final
RPC URL. Each request has a 10-second timeout, no retries and a 256 KiB streaming
response cap. Upstream URL/header details are never returned in wallet errors.
The public catalog includes enabled entries with configured RPC, matching the source;
begin and verification reread the current enabled flag and configured RPC. Unlike
the source catalog-only flag, disabling a chain stops further registration and
verification on it; existing linked identities remain visible and removable.
A canonical HTTPS
origin is required for linking. An HTTP development host can still boot and list or
unlink wallets, but cannot link them.

Password/TOTP fields appear only after wallet selection and chain switching;
cancellation/unmount clears the pending prompt and retry collects fresh credentials.
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
node --test --test-concurrency=1 packages/features/billing/test/native-operations.test.mjs packages/features/billing/test/wallet-registration.test.mjs packages/features/billing/test/wallet-authentication.test.mjs packages/features/billing/test/wallet-chain-settings.test.mjs
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

## Fixed service terms and transfer observation

Native administration is `/admin/service-offers`, linked from wallet-chain settings.
All prices, recipients, durations and confirmation counts are supplied by the admin;
there are no monetary defaults or seeded offers. Enabled offers require a configured
native wallet-chain RPC. Disabling an offer stops new orders/detection; already
snapshotted orders remain checkable when their chain RPC is available. Catalog size
is limited to 100. The account page is `/settings/subscriptions`, linked from wallets.
It displays exact token/recipient/base units and the hash-submission deadline before
any receipt can be checked. It never requests a wallet signature or sends funds.

Account-owned orders bind an idempotency key to the selected wallet and exact quote.
A submitted hash is an order-local retry hint, verified on demand. Only a matching
confirmed receipt acquires a globally unique paid chain/hash claim, atomically with
the term. Pending or failed checks hold no global claim. RPC chain mismatch,
insufficient confirmation depth and replaced blocks remain pending; a revert is
terminal only after depth and canonical block checks. A confirmed order stores one immutable term interval;
same-service renewals append under a native account row lock. Lists show at most the
latest 100 records. Terms are records only: no native role or quota is granted.
Transfers are recorded per chain/transaction/log index for the two registered
participants. No scan worker, public address-to-account lookup or notifications are
added. Participant links become null on account deletion; evidence claims remain
reserved to prevent replay and historical reassignment. Schema rollback removes all
three new tables, so it must not be used as an accounting reset.

The new local migration is unapplied to production. Test it only with the same
explicit disposable loopback database variable described above:

```sh
node --test --test-concurrency=1 packages/features/billing/test/service-store.test.mjs
cd packages/backend
RAYON_NUM_THREADS=1 pnpm exec vitest run --config vitest.config.unit.ts --maxWorkers=1 ../features/billing/test/backend/service-receipt.test.ts
```

Source provenance and deviations are in Issue #8 and the continuation draft PR.
Neither synthetic receipts nor transport tests prove live payment interoperability.
