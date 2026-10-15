# Billing wallets and fixed service terms

Small review slice for [Issue #8](https://github.com/tamaina/misskey-a/issues/8).
Wallet registration is composed into Misskey's native feature provider/API and
`/settings/wallets` and `/admin/wallet-chains`. The older payment-history and disabled payment-chain prototypes
remain unregistered. Wallet registration supplies the account identities used by
the fixed service terms below.

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

## Fixed service terms

The independent server slice is [Draft #81](https://github.com/tamaina/misskey-a/pull/81),
based on [receipt core #103](https://github.com/tamaina/misskey-a/pull/103).
`/admin/service-offers` accepts administrator-supplied asset, recipient, price,
duration and confirmation settings. There are no seeded prices or offers.
`/settings/subscriptions` prepares an account-owned immutable quote and checks a
submitted transaction hash; this page does not send transactions.

A confirmed matching transfer atomically stores the paid order and interval.
Only paid orders reserve a unique chain/transaction claim. An account row lock
serializes same-service renewals; request keys preserve retry idempotency.
An optional eligible ordinary manual role takes effect during the paid interval
through the native role service. Existing manual assignments remain intact;
paid roles cannot grant staff privileges through conditional roles. Role reads
query active paid intervals directly. No quota mapping, ranked plan changes,
automatic renewal, balance ledger, usage settlement, refund or notification is wired.

P2P routes, models and UI belong to [Draft #126](https://github.com/tamaina/misskey-a/pull/126);
they are absent from this server slice. Accounting claims are scoped to this slice.
Account deletion removes the participant reference while retaining paid evidence.
The new local migration has reversible schema tests and is unapplied to production.
Reverting it removes its records.

Source provenance and behavioral differences are recorded in Issue #8 and the
PR body. Synthetic tests do not prove live payment interoperability. After building,
run `node --test --test-concurrency=1 packages/features/billing/test/service-store.test.mjs`
with the disposable loopback database variable described above.

## Registered account residence

Before registering a wallet or creating a new service order, the account must
explicitly register its country at `/settings/residence`. In the purchase-policy
admin page, operators select the countries that also require an administrative
subdivision. These settings apply independently of purchase IP-region rules and
whether tax policy is enabled. ISO identifiers are vendored as portable schema
constants; no runtime dataset dependency is installed.

Declarations are private, self-declared account data, not verified tax location.
New orders retain their original declaration. Existing request-key recovery,
transaction hash submission, reconciliation, history and refund obligations stay
available. The residence migration refuses rollback while declarations or order
evidence remain. The sibling P2P pilot needs a separate integration of this guard
at prepare and immediately before browser-wallet sending; this slice does not
claim that connection.
