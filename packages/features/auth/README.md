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

## Current authentication scope

The completion stack covers individual browser sessions, current-policy login
issuance, authentication progress, independent passkey MFA, strict passwordless
login, recovery codes and operation-bound reauthentication. Security settings
manage keys, parallel TOTP and passkey second factors, recovery codes and session
revocation. Sensitive changes recheck the current owner, policy and session under
transaction locks. Registering a passkey or security key immediately activates MFA,
even without TOTP. Its registration completion displays recovery codes in the same
flow as TOTP setup; no separate MFA activation or second key ceremony is required.
Existing unspent recovery codes are preserved when adding a factor.
Additional keys can be registered repeatedly while passwordless or passkey-only
login is enabled. Registration preserves those login settings and requires UV
and a discoverable credential in passwordless mode. Each new key is immediately
available for the enabled login methods. Passkey MFA applies to password login;
explicit passwordless login continues to require an owned UV key. Registration
preserves other browser sessions and login tokens; key removal and password
changes still revoke sessions. Existing revocation on other security-setting
changes is unchanged.

Password, email and login-token changes use fresh proof for their exact purpose.
A passwordless account can disable password login only with a verified recovery
email and a usable strict-UV passkey. The last required factor cannot be removed
without explicitly changing that policy. Recovery-code consumption is atomic;
parallel consumption does not restore another code from an old snapshot.

Common sudo is bound to the individual browser session, expires after five
minutes without sliding extension, and does not replace operation-specific proof
where the operation requires it. Account deletion records a transaction-owned
intent before queue delivery. Failures do not authorize deletion.

MiAuth, legacy application approval and the local OAuth authorization server
remain in scope. They require explicit consent and current-session authorization.
Token expiry is enforced on HTTP, WebSocket and MCP, including pending work and
replay. Existing tokens without an expiry retain compatibility. OAuth consent
receipts and token expiry are independent of external-provider SSO.

### SSO deferred by user decision

OIDC SSO, generic OAuth2 **login to this server**, provider-managed usernames,
provider-enforced local-authentication prohibition and external registration
prompts are outside this completion scope by explicit user request. They are
not complete features or pending configuration questions. New SSO routes, screens,
provider/identity tables and their unmerged migration have been removed.

Existing protocol verification, discovery, pinned transport, token exchange and
transaction-store adapters remain byte-identical to the stack base. They are not
connected to a login route. Historical frontend source projections retain exact
old source strings only in tests so the original locale oracles stay unchanged;
production code does not import those fixtures. The unmerged SSO implementation
and unpublished username follow-up are preserved on local hold branches.

### Validation

Use the coordinated local validation slot; do not run heavy suites concurrently.
Final commit results belong in the PR body rather than in historical checkpoint
claims here.

- Backend unit: `packages/backend/vitest.config.unit.ts` with the auth test path.
- `test/run-mfa-policy-postgres-fixture.mjs`: production metadata, current MFA
  policy and migration rollback/reapply checks. Completion selects
  `MISSKEY_AUTH_COMPLETION_FIXTURE=1`.
- `test/run-security-settings-fixture.mjs`: actual security HTTP and signed keys.
- `test/run-credential-issuance-fixture.mjs`: owned PostgreSQL/Unix Redis and the
  real MiAuth, legacy approval and OAuth consent/issuance boundaries.
- `test/run-fresh-password-change-fixture.mjs`: password, login-policy, token and
  email operation fixtures selected by their documented environment flags.
- `test/run-oidc-fixture.mjs`: retained protocol adapters only, with owned Redis.
- Frontend auth suites and strict source/locale inverse suites preserve frozen
  historical dictionaries and reject unreviewed source changes.
- Formal API/SDK generation, backend and frontend types, build, changed-file lint,
  SPDX and locale safety are required for the completion stack.

`MkSecuritySettings` and `MkSudoDialog` have real-component Storybook stories with
synthetic accounts and intercepted APIs. No story may contact a real auth server.
Storybook screenshots document rendered states; native PIN/biometric prompts,
physical and cross-device authenticators and Conditional autofill still require
the separate manual acceptance in `test/manual/auth-completion.md`.

The authentication stories (`MkSignin`, `MkSecuritySettings`, `MkBrowserSessions`,
`MkTokenExpiry`, `MkSudoDialog`) are part of the regular Storybook build. The MSW
worker is generated by `msw init` during preparation; do not commit it.

### セッションの IP 履歴

`user_ip` は `(userId, ip, browserSessionId)` ごとに初回確認 `createdAt` と最終確認 `lastSeenAt` を保持します。NULL の session ID は API キー・トークン利用や従来の記録の共通枠です。`enableIpLogging` が有効な場合だけ、同じキーを最長 1 時間に一度 upsert します。最終確認時刻はこの間隔の精度であり、リクエストごとの記録ではありません。90 日の削除期限も最終確認を基準にします。

`i/sessions.lastIp` はそのセッションの最新 `user_ip` から取得し、フォルダーは `i/session-ips` で本人のセッションの IP・初回確認・最終確認を表示します。`enableIpLogging` が無効の間は新しい IP を記録しないため、最新 IP や履歴が空になる場合があります。UA はセッションの `lastUserAgent` のみを表示します。signin とセッションのリンク、従来の紐付けのない signin 履歴表は維持します。

`1794700800000-SessionUserIp.js` は既存の `lastIp` を `lastUsedAt` 時点の観測として移してから保存列を削除します。セッション削除時は履歴を NULL 枠に統合し、初回・最終確認を保持します。down はセッションの最新 IP と従来の一意性を復元しますが、旧形式ではセッション別の履歴と最終確認を保持できません。
