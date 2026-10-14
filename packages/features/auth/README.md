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
refuses to discard an enabled policy. Login and sensitive-operation enforcement,
fresh session/purpose-bound password + strict-UV reauthentication, and policy
stamps in authentication progress must be connected before activation is exposed.

Key removal, legacy TOTP removal and admin recovery serialize on the owner profile
row. Existing password/TOTP proofs run before locking so recovery consumption does
not deadlock; the locked credential policy must still match before mutation.
Recovery codes are not remaining factors. Admin all-factor reset requires an
existing password and atomically clears keys, policies and recovery codes.
The legacy management routes reject an enabled independent policy, preserving its
recovery codes until the future fresh-authenticated management flow is available.

This lock protocol currently covers removal/reset. Future activation, key
enrolment and other factor writers must adopt it before the activation writer is
connected. The old TOTP-disabled orphan-key behavior is preserved. This groundwork
does not complete the independent-MFA acceptance criteria in #94 / #144 / #157.

### Fresh passkey reauthentication (unconnected verifier)

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

This verifier has no DI registration, endpoint or UI and never changes an MFA
policy. It is independent of the unmerged login-progress connection in #143.
Activation remains blocked until both sign-in paths, password/email/token/account
deletion, factor management/key display and every factor writer share the final
enforcement and locking protocol.

Legacy uncompressed P-256 keys are normalized to COSE, as in the existing named
WebAuthn flow. Their representation update shares the counter compare-and-update;
the policy stamp binds normalized key material so this conversion alone is not a
policy change.

Remaining runtime connections before activation:

| Surface | Required connection |
| --- | --- |
| `signinFlow.ts`, `signinWithPasskey.ts` | Read the same explicit policy, require its factors, bind progress to current policy and issue a session only after final verification. |
| `i/change-password`, `i/update-email`, `i/regenerate-token`, users `i/delete-account` | Apply current independent MFA policy and operation-specific fresh verification before the sensitive mutation. |
| `i/2fa/*`, admin `unset-mfa` | Join all enrolment/policy writers to the profile lock; require exact operation/target bindings and recheck live session/policy inside the mutation transaction. |
| User self serializer `securityKeysList` and factor display | Represent independent policy consistently and gate sensitive key/recovery display through its dedicated fresh purpose. |

The current verifier supports only `activate-passkey-mfa` and
`show-recovery-codes`. Other actions need their own concrete purpose/target
bindings; neither a generic sudo purpose nor this metadata authorizes them.

Run its real atomic Redis regression with
`MISSKEY_REDIS_FIXTURE_CONFIG=packages/features/auth/test/vitest.fresh-reauthentication.config.mjs node packages/features/auth/test/run-oauth-fixture.mjs`.
