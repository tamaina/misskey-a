# auth

ログイン・ログアウト、アカウントの作成と切り替え、招待、メール認証、パスワード、二要素認証、アプリの連携、ボット対策。

## OAuth権限カスタマイズ

canonical `/mcp` resourceの認可要求は、scopeの有無にかかわらずカスタマイズを有効にする。
通常OAuthは認可URLに `misskey_customize_permissions=true` がある場合だけ有効にする。
`false`、空値、未指定は通常OAuthで無効。不正値・重複値は `invalid_request`。
このフラグはMCP resourceの一括設定を無効にしない。

通常OAuthでフラグなし・scopeなし（空値も含む）は `invalid_scope`。既定の権限は付与しない。
フラグ有効ならscopeなしは明示選択、scopeありはrequested scopeに加える任意権限を初期OFFで表示する。
requested scopeを任意追加欄に重ねず、`access:mcp`は通常OAuthでは選択できない。

カスタマイズmodeは認可要求のpending transactionに固定する。同意POSTにmodeを指定すると拒否する。
既存のPKCE、resource binding、transaction/code replay防止、管理権限の同意時確認は維持する。
交換応答とnative token rowには、実際に同意されたscopeのみを記録する。
この拡張を利用しない明示scope付き通常OAuthは従来の固定scope同意のまま。
MCP clientsが独自フラグを送る必要はなく、discovery metadataにも変更を加えない。

## OIDC SP foundation (unconnected pilot)

The ID token verifier, discovery adapter, and transaction store do not register
HTTP endpoints or issue sessions. Providers must be explicitly enabled by a
future server-owned configuration. Discovery accepts public HTTPS only, with
pinned DNS/TLS, no redirects, JSON, and same-origin authorization/token/JWKS
endpoints. Internal IdPs and cross-origin provider endpoints are unsupported in
this finite pilot. Identity is issuer + subject, never email matching.

Link transaction context must come from fresh local authentication and a live
individually revocable session. A stored context alone is not authentication;
future completion must recheck session/account state and require local MFA.

Run synthetic network and real atomic Redis tests with
`node packages/features/auth/test/run-oidc-fixture.mjs` from the repository root.
It requires the existing `redis:8` image and task-local installed dependencies,
uses a temporary Unix socket with no network/published ports/persistence, and
removes only its own container and temporary directory. Ordinary unit runs skip
the Redis cases unless this task-owned fixture socket is explicitly supplied.
The current-Node backend unit CI job runs the explicit fixture so actual Lua
atomicity is checked independently of those ordinary unit runs.

The unconnected token exchange adapter accepts a server-owned provider snapshot
and a transaction additionally bound to the exact redirect URI and S256 challenge.
The current transaction store does not produce these extra bindings; there is no
runtime bridge. Callback integration must add them before using the adapter.
It supports client_secret_basic only, form-encodes each credential before Basic
encoding, and shares one five-second monotonic deadline from before DNS through
token POST, JWKS GET, and verification. HTTP is created only after authenticated
TLS and the pinned public peer are checked. Redirects, proxies, compression, and
connection reuse are unsupported. Each JSON response is limited to 64 KiB, and
JWKS has at most 32 keys with bounded public RSA fields. Only configured-origin
JWKS is used; token/key URLs never trigger additional fetches. Errors retain no
provider body or credential cause. Access/refresh tokens are discarded, email
claims are not trusted, and the result cannot create a local session or grant.

### Recovery-code consumption

`TotpService.twoFactorAuthenticate` consumes a matching backup code with one
PostgreSQL compare-and-remove update. It binds the row owner and the loaded
password/TOTP and independent-passkey policy, and authorizes only when exactly one row was changed.
A persistence rejection does not fall back to OTP validation. Other concurrently
consumed codes are not written back from the caller's snapshot. Credential or
session mutation remains a later operation; failures do not restore a used code.
This does not enable independent passkey MFA or change recovery-code storage.

### Independent-MFA policy groundwork

`user_profile.passkeyMfaEnabled` is an internal policy with default `false`.
Registered keys, passwordless convenience settings and recovery-code availability
never activate it. This slice has no true writer, activation API or UI. Rollback
refuses to discard an enabled policy. Both login entry points now enforce it as
described below. Sensitive-operation enforcement, the remaining fresh
session/purpose-bound flows and authentication-progress policy binding must still
be completed before activation is exposed.

Key removal, legacy TOTP removal and admin recovery serialize on the owner profile
row. Existing password/TOTP proofs run before locking so recovery consumption does
not deadlock; the locked credential policy must still match before mutation.
Recovery codes are not remaining factors. Admin all-factor reset requires an
existing password and atomically clears keys, policies and recovery codes.
The legacy management routes reject an enabled independent policy, preserving its
recovery codes until the future fresh-authenticated management flow is available.

This lock protocol covers removal/reset, TOTP setup, key enrolment completion,
key naming and passwordless convenience settings. Pending TOTP secrets are
compared under the lock and consumed on completion; removal/reset also clears
them. Legacy registration/setup routes refuse an active independent policy.
Future activation and sensitive-operation writers must adopt the same protocol
before the activation writer is connected. The old TOTP-disabled orphan-key behavior is preserved. This groundwork
does not complete the independent-MFA acceptance criteria in #94 / #144 / #157.

### Fresh passkey reauthentication

`FreshPasskeyReauthentication` accepts a server-owned, live individual browser
session only. Shared native tokens and delegated tokens cannot establish its
identity. It checks a fresh password before generating a dedicated required-UV
challenge whose deadline starts before password verification and is never extended
beyond 90 seconds. Redis anchors the absolute deadline before the password proof;
queued creation cannot renew it. The challenge binds the exact user,
session, purpose, password/TOTP/independent-passkey policy and registered key
material. Existing per-user WebAuthn challenges are not reused.

Redis atomically consumes the bound challenge before assertion verification, so
only one concurrent verifier can proceed. Failure burns it. Completion verifies
strict UV, RP, origin and key ownership, compares the key counter on update, and
rechecks policy/session and the original deadline. The result is internal
metadata, not a reusable grant, sudo state or activation credential. A future
mutation must recheck session and policy within its own locked transaction.

The verifier is registered in DI and connected to dedicated
start/complete APIs and security-settings buttons for password change, token
regeneration and email change. Activation and recovery-code display purposes still have no runtime caller, and this flow never changes MFA
policy. It is independent of the unmerged login-progress connection in #143.
Both existing sign-in paths now use the current-policy issuance protocol below.
Activation remains blocked until account deletion, recovery and
credential issuance, factor management/key display and every remaining writer
share the final enforcement and locking protocol.

Legacy uncompressed P-256 keys are normalized to COSE, as in the existing named
WebAuthn flow. Their representation update shares the counter compare-and-update;
the policy stamp binds normalized key material so this conversion alone is not a
policy change.

Remaining runtime connections before activation:

| Surface | Required connection |
| --- | --- |
| users `i/delete-account` | Apply current independent MFA policy and operation-specific fresh verification before the sensitive mutation; password change is now connected separately. |
| `i/2fa/*`, admin `unset-mfa` | Join all enrolment/policy writers to the profile lock; require exact operation/target bindings and recheck live session/policy inside the mutation transaction. |
| User self serializer `securityKeysList` and factor display | Represent independent policy consistently and gate sensitive key/recovery display through its dedicated fresh purpose. |

The verifier supports `change-password`, `activate-passkey-mfa`,
`show-recovery-codes`, `regenerate-token` and `update-email`; password change, token regeneration
and email change have runtime callers. Other actions need their own concrete purpose/target
bindings; neither a generic sudo purpose nor this metadata authorizes them.

### Activation readiness inventory

The following inventory records implementation boundaries, not activation
acceptance. There is still no true writer or user-facing activation state.

| Existing path | Current coverage | Still required before activation |
| --- | --- | --- |
| Password-first `signinFlow`, passkey `signinWithPasskey`, `SigninService` | Explicit policy at both entry points; password plus an enabled factor for independent MFA; atomic recovery; server-owned proof and current user/policy/key/deadline checks under user/profile locks with transactional session issuance | Real-device acceptance; #143 remains a separate unmerged login-progress Draft and is not incorporated into this flow. |
| `TotpService` recovery codes | Atomic one-use consume bound to password/TOTP/independent policy; the named login flow uses it only when policy requires MFA | Finish fresh-gated presentation and recovery management; never infer remaining factors from backup stock. |
| `request-reset-password`, `reset-password`, admin `reset-password` | Existing email/admin authorization and reset behavior | Serialize relevant credential changes and preserve independent MFA on reset; define recovery policy and invalidate stale reauthentication/session state. |
| `i/update-email`, dedicated passkey start/complete, `verify-email` | Exact previous/target email binding; locked current policy/session mutation; legacy proof compatibility; atomic owner/code/address verification | Physical-device acceptance; existing reset-request invalidation and recovery policy remain separate. |
| `i/2fa/register`, `done`, `register-key`, `key-done` | Legacy independent-policy refusal; profile-locked DB setup/completion with proof snapshot checks; TOTP pending setup is consumed | Exact session/purpose/target-bound fresh flows and independent enrolment/activation, recovery-code presentation acknowledgement. |
| `i/2fa/remove-key`, `unregister`, `password-less`, `update-key`, admin `unset-mfa` | Common profile lock and owned mutation; active independent policy is refused on legacy user routes; reset clears pending setup | Fresh per-operation flows, preserve last-factor invariant and recovery semantics for the final independent policy. |
| WebAuthn login proof methods and fresh verifier | Strict UV, atomically consumed challenge, bounded deadline, owned key material, counter CAS and legacy key normalization | Keep future callers on the proof-bearing path; compatibility boolean/user-ID methods do not authorize session issuance. |
| `i/change-password` and its passkey start/complete routes | Dedicated UI → fresh password/strict UV → profile/session-locked password write; legacy route refuses active independent policy and rechecks its snapshot | Real-device acceptance and independent-policy display before activation. |
| `i/regenerate-token` and its passkey start/complete routes | Dedicated purpose-bound fresh password/strict UV; user/profile/current-session locks; native rotation and all owned session revocations commit together; legacy independent-policy refusal and snapshot/live-session checks | Real-device acceptance; this is not general sudo. |
| users `i/delete-account` | Existing password/TOTP authorization | Independent policy enforcement and transaction-bound current proof/session checks before mutation. |
| `auth/accept`, OAuth consent, MiAuth token issuance, `auth/session/userkey` | Existing scope/session/owner checks | Audit credential issuance against active policy and fresh assurance; never elevate delegated/shared tokens into fresh auth. |
| User self/moderator security fields and `securityKeysList` | Existing TOTP-based serialization | Consistent independent policy display; dedicated fresh-gated sensitive key/recovery display. |
| Browser-session verify/revoke/signout, HTTP/stream/native MCP | Durable revocation checks; login proof rechecked under account/profile locks; same-transaction session insert; separate guarded new-account issuer | Complete sensitive-operation binding to live individual sessions without expanding old token privileges. |

Automated tests use synthetic users, external-proof mocks and signed synthetic
WebAuthn assertions. Physical authenticators, browsers on real devices,
cross-device passkeys and device-specific UI have not been tested in these
foundation slices. They remain explicit acceptance work before user exposure.

Run its real atomic Redis regression with
`MISSKEY_REDIS_FIXTURE_CONFIG=packages/features/auth/test/vitest.fresh-reauthentication.config.mjs node packages/features/auth/test/run-oauth-fixture.mjs`.

### Password change: first connected fresh-authentication path

Security settings keeps the original password-change action and adds a passkey
variant for individual browser sessions with an existing listed passkey and a
WebAuthn-capable browser. Both collect the current password and confirm the new
password first. The passkey action then calls `i/change-password/passkey/start`,
performs required-UV WebAuthn, and calls `i/change-password/passkey/complete`.
It never automatically retries through the legacy action after cancellation or
failure, and leaving settings prevents a later native result from completing.

Completion consumes its exact `change-password` challenge and returns no grant.
The protected write locks the profile and live browser session, checks current
account state, normalized key material/policy and the original monotonic expiry,
and checks expiry again after the update so failure rolls back. It changes only
the password hash. No activation, sudo state or credential issuance is added.
The legacy action preserves existing password/TOTP behavior while refusing an
active independent policy and checking its authenticated snapshot under the lock.

[Real-device acceptance steps](test/manual/fresh-password-change.md) cover success,
cancellation, failure, expiry and revocation. Automated coverage includes the real
settings component plus HTTP with real disposable PostgreSQL/Redis and synthetic
signed WebAuthn assertions. Physical authenticator/browser results remain pending.


### Login sessions: current-policy issuance

Both existing login entry points read the explicit policy. The named flow checks
password first and offers only enabled TOTP/passkey factors and actual recovery
stock. Independent passkey MFA never permits the convenience passwordless setting
to omit password. TOTP remains an alternative when it is enabled; recovery codes
are consumed atomically and are never treated as remaining factors.

A passkey-only login for independent MFA returns `passwordFlowRequired` after
strict UV, then returns both manual and conditional UI to the named password flow.
It carries no proof into that flow. Existing false-policy passwordless behavior
remains available only with its explicit convenience flag and an owned strict-UV
key. Both UI surfaces discard native/API results from an earlier activation.

Login WebAuthn proof methods atomically claim challenge plus remaining TTL before
verification, require a deadline within 90 seconds, and compare the exact stored
key row when advancing its counter. The server-only, one-use issuance proof binds
the policy and native-token snapshot from before password/factor verification.
`SigninService` locks user then profile, rechecks current local active state,
password/policy/key material and deadline, inserts through the transaction's
session repository, and checks deadline again. Login notifications, history and
email are scheduled only after commit. Signup uses a separate guarded creation
result path; the test-only remote actor factory returns no login credential.

Run real HTTP, signed synthetic WebAuthn, race/rollback and recovery tests with
`MISSKEY_AUTH_SIGNIN_FIXTURE=1 node packages/features/auth/test/run-fresh-password-change-fixture.mjs`.
The runner owns and stops disposable Unix-socket PostgreSQL and network-none Redis.
This connection does not expose activation, sudo, SSO or relaxed UV. Physical
browser/authenticator and cross-device acceptance remains pending.

### Token regeneration: operation-bound fresh authentication

Security settings offers a passkey variant for an individual browser session with
an existing listed key and a WebAuthn-capable browser. It verifies the current
password before required-UV WebAuthn, using the dedicated `regenerate-token`
purpose. Its ticket cannot authorize password change or any other mutation.
Both password change and token regeneration share the UI ceremony owner; leaving
settings, cancellation and native/API failure never trigger a legacy fallback.

Completion locks user, profile and the current live browser session, rechecks the
active local account, normalized keys/policy and the original deadline, rotates
the native token and revokes every owned browser session within one transaction.
Expiry after either write rolls back both. Revocation/cache/stream events are
published only after commit. The response returns neither the new token nor a
grant. The legacy password/TOTP route rejects active independent policy and
rechecks the authenticated policy, presented native token or live browser session
under the same locks. Other users' credentials and delegated grants are unchanged.

Run its real HTTP/SQL/Redis/signed-WebAuthn regression with
`MISSKEY_AUTH_TOKEN_REGENERATION_FIXTURE=1 node packages/features/auth/test/run-fresh-password-change-fixture.mjs`.
Physical browser/authenticator and cross-device acceptance remains pending; see
[manual acceptance](test/manual/fresh-token-regeneration.md). This slice does not
add activation or authorize real-user credential changes during development.

### Fresh email changes

The complete route shares the existing three-per-hour email-change bucket; start
has a separate bounded challenge rate. The dedicated start/complete routes bind the exact nullable target and the
previous email, verification state and code to the one-use strict-UV ceremony.
The target digest is required only for `update-email`; the unchanged v1 records
for all previous purposes carry no target. A different target/session cannot
consume the correct ticket. Under user/profile/session locks, completion rechecks
that digest, policy, keys, live account/session and the original deadline. The
address, unverified flag and new code are written together. Competing ceremonies
based on the same email state have one winner. The old route keeps its contract
and existing TOTP/recovery behavior, refuses independent MFA and checks the
credential/session/policy and previous email snapshot under the same locks.

Verification uses an exact owner/code/address conditional update and publishes
only for one affected row. A stale code cannot verify a later replacement
address. Delivery and notifications occur after commit. SMTP failure does not
roll back a committed address/code or restore a used ticket; a retry needs a new
explicit ceremony. External email validation and delivery are stubbed in the
owned PostgreSQL/Redis/signed-WebAuthn tests; physical browser/authenticator and
cross-device acceptance remain pending.

This does not invalidate existing password-reset requests when email changes.
Reset/recovery policy, account deletion, factor enrolment/removal/activation,
recovery/key display, credential issuance and general five-minute sudo remain
unfinished. No activation writer or real-user configuration change is added.
