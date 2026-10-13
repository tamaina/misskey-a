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
