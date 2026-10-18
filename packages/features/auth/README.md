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

## OIDC Service Provider integration

The protocol adapters are connected through `oidc-runtime.ts` and the finite
`oidc.contract.ts`/`oidc-api.ts` routes. Provider administration first creates a
disabled draft and exposes its exact server-owned redirect URL. Administrators
then save issuer/client details and explicitly enable it. Changes require local
sudo, recheck current administrator rights and provider version, and rotate that
version. Client secrets are write-only in responses. Provider lists are explicit
DTOs; secrets never become public metadata or UI defaults. An empty secret input
preserves the saved value. Preparing migration rollback requires disabling the
provider, unlinking all identities, then explicitly confirming secret erasure
under sudo/current-version checks; erasure rotates the version and cannot be
combined with enabling or replacement-secret input.

`oidc/start` and `oidc/callback` bind state, nonce, S256 PKCE, exact redirect,
provider/version and a Secure/HttpOnly host cookie. A dedicated frontend transport
uses same-origin credentials only for these endpoints; ordinary API token
requests retain `credentials: omit`. Continuations are opaque, cookie-bound,
short-lived Redis records, never browser sessions or reusable elevation grants.
Callback cancellation/replay cannot issue a session. External access/refresh
tokens and email claims are discarded.

Linked login records the verified issuer/subject and exact local identity row.
Required local TOTP, recovery code or passkey must still succeed. Only the
second-factor passkey assertion can omit UV; passwordless primary remains strict.
The consumed external continuation yields a server-owned external assurance.
`SigninService` locks the current user/profile, checks current credential policy,
provider version and exact still-linked identity, and inserts an individual
browser session in the same transaction. Unlink/relink cannot revive an old
pending proof. External identity is never marked as a verified local password.

An unlinked identity enters onboarding, regardless of email equality. Onboarding
requires an explicit username, local password, rules/terms consent and local
email verification, preserving CAPTCHA and invitation requirements. The original
Redis deadline is not extended by email preparation or retries. Account/profile,
external identity, invitation consumption and browser session commit together;
write failure rolls them back together. Mail delivery and post-signup effects are
outside that transaction. Failed delivery does not create an account.

Existing users link from settings: external authentication first, explicit
agreement to the displayed issuer/subject, then fresh local sudo for the exact
pending identity and individual session. Unlink also uses local sudo and keeps a
remaining usable local or enabled external login method. Email alone never links
accounts. A disabled provider stops new pending flows; it does not silently
remove local accounts or existing sessions.

Discovery/token/JWKS retain pinned DNS/TLS, no redirects, bounded responses and
same-origin provider endpoints. Public HTTPS is the default. Only a server
operator's existing `allowedPrivateNetworks` CIDRs can authorize private peers;
provider administrators cannot broaden network policy, disable TLS verification,
or choose a proxy. The finite adapter supports RS256, S256 and
`client_secret_basic`. Generic OAuth2, arbitrary cross-origin provider endpoints,
provider-enforced username and provider-wide local-auth disabling are not claimed
complete. This intentionally differs from upstream #13865's email auto-link idea
and resolves its open onboarding password choice by requiring a local password.

Validation sources (run only in the coordinated validation slot):
- `test/run-oidc-fixture.mjs`: actual Redis transaction/continuation atomicity.
- `test/run-oidc-runtime-fixture.mjs`: task-owned HTTPS synthetic IdP, PostgreSQL,
  Redis, actual HTTP routes, signatures, PKCE, local MFA, session issuance,
  onboarding, cancellation, replay and owner/identity races.
- `test/frontend/oidc-*.test.ts`: same-origin cookie boundary and UI late results.

The HTTP fixture stubs mail/CAPTCHA/rate services and the shared local-sudo
transaction port. Common sudo has separate tests; the final combined-stack test
must connect its real implementation. Synthetic IdP credentials are generated
inside the disposable fixture. No real external provider or real-user settings
are touched. Physical/cross-device acceptance remains separate. These sources
are not a claim that the current uncommitted implementation has passed tests.

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
policy. The #143 password-first progress source is integrated below; its historical Draft remains independently recorded.
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
| Password-first `signinFlow`, passkey `signinWithPasskey`, `SigninService` | Explicit policy at both entry points; password plus an enabled factor for independent MFA; atomic recovery; server-owned proof and current user/policy/key/deadline checks under user/profile locks with transactional session issuance | Real-device acceptance; #143 source is integrated with the assurance protocol; the historical Draft remains unmerged. |
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

### Authentication progress integration

The password-first progress flow from Draft #143 is composed with the explicit
MFA policy and server-owned login assurance. Its binding includes the independent
policy, native-token generation and registered key material. A single verifier
claims the ticket before consumable factor verification; current policy is checked
before the transaction-owned session issuance. Redis anchors a maximum 90-second
absolute deadline before password verification. The server records the verified
password fact and current credential/native-policy stamp; a continuation sends
only the bound one-use ticket and factor, without repeating the password or
bcrypt. The browser clears its password after receiving progress. Factor choice
changes preserve the ticket and original deadline; final issuance uses its
remaining TTL. Legacy callers retain their existing authentication requirements.


### OIDC, Conditional login and credential issuance checkpoint

OIDC sign-in, explicit local-sudo link/unlink and provider administration are now
connected in source, including local second-factor checks before individual
browser-session issuance. Email equality never links accounts. New-account
onboarding requires a local password and local email verification. Provider-fixed
usernames and provider-wide disabling of local authentication remain separate
specification decisions; this does not claim every request in #13346 is solved.
Private IdPs still require the server's explicit network allowlist and HTTPS/DNS
pinning policy. The normal password path rejects `passwordLoginDisabled`; strict
passkey primary authentication and external primary authentication retain their
own assurance checks. The login dialog and authorization login page explicitly
enable Conditional mediation. Manual/named/TOTP-first interaction, account
switching and closing the dialog cancel its owned pending ceremony.

MiAuth, legacy application approval and OAuth code consent now require the
current individual browser session and shared local sudo. Selecting a different
saved account requires an explicit account switch or login first. Native master
credentials cannot silently substitute for that browser-session proof. Existing
unbounded tokens and omitted expiry stay unbounded; new expiry is an explicit
user choice. HTTP, streaming and MCP output enforce expiry, with owned timers
also closing idle connections. Application approval preserves an existing live
token's expiry; changing it requires revocation first.

OAuth publishes a code only after committing an approval receipt. Exchange
rechecks the exact immutable grant, current account/policy/native-token stamp,
original browser session, sudo grant identifier and original deadline under the
shared transaction locks, then consumes the receipt with token insertion. The
receipt stores no bearer credential or plaintext native token. A committed issued
token remains independent of the authorizing browser session's later logout.

These additions are a source checkpoint: no build, type check, test, synthetic
IdP, PostgreSQL, Redis, browser acceptance or SDK generation has yet run for this
worktree. Fixture sources cover the intended cases but are not passing evidence.
The common SudoService/model changes still need the owner's normal merge, then
formal SDK generation, exact operation-inventory projections, focused unit/UI,
real database races/rollback, full types and shipping checks in allocated serial
stages. Real IdP credentials, grants, email delivery and production changes have
not been used.
