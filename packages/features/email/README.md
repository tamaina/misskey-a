# email

アカウント登録・更新・通知に使う既存の `EmailService` と、ユーザーメール機能の基盤を配置する。
既存通知メールの From、テンプレート、SMTP 設定は変更しない。

## 実装状況: opt-in の実行経路を接続

#254–257 のユーザーメールを、migration、非公開原文保存、認証付き API、専用 worker、メール画面・Deck カラムまで接続している。
`userMail.enabled` の既定は無効。明示設定後に通常の server/queue role を起動すると、private HTTP 受理と送信・解析処理が動作する。
これは公開 SMTP/LMTP サーバーや設定済みのメール基盤ではない。管理者の MTA、DNS、非公開 S3、リレーと運用設定が別途必要になる。
**実 MTA・S3・PostgreSQL の競合/障害を含む本番相当の end-to-end 検証は未完了。既定無効を維持し、staging で検証してから有効化する。**

| 部分 | 接続済みの経路 | デプロイ前の主な作業 |
| --- | --- | --- |
| 受信 (#255) | Bearer/HMAC private HTTP、MTA handoff CLI、bounded DATA、耐久受理・parse outbox、専用 worker、所有者 API/UI | MTA の配送 ID 永続化・bridge 組込み、DNS/MX、spam/loop policy、実 DB/S3/Redis 障害・競合試験 |
| 送信 (#256) | text/MFM 作成・preview、TLS relay、所有者/インスタンス送信制限、冪等 API、耐久状態/試行、worker、送信一覧 | relay/SPF/DKIM/DMARC 設定、実配送・部分失敗試験、unknown の管理者照合手順 |
| 転送 (#257) | 期限付き一回限りの転送先確認、revision 付き設定、耐久転送タスク、raw 参照保護、設定 UI | trusted MTA の SRS/loop 対策、必要なら ARC、設定変更/worker 停止を含む実環境試験 |

## 受理と認証の契約

- インターネットからの受信、MX、迷惑メール対策、SMTP の再配送は管理者の MTA が担当する。アプリを公開 open relay にしない。
- 配送先は SMTP envelope の RCPT TO だけから決める。To/Cc/Delivered-To、From、Message-ID、Authentication-Results は権限や配送先の根拠にしない。
- `parseEnvelopeRecipient()` は管理対象ドメインの `username[+suffix]@domain` を分解する。利用可能なローカルユーザー、停止・削除状態、メール opt-in は `MailStore.resolveRecipient()` と受理 transaction で確認する。
- `authenticateMailDelivery()` は raw の SHA-256、MTA が生成した deliveryId、timestamp、MAIL FROM、順序を含む RCPT TO 配列を HMAC で束ねる。署名は DATA のヘッダーではなく、認証済み MTA との side channel から渡す。
- 共有秘密は少なくとも 32 bytes。現在の時刻許容幅は 300 秒。ネットワーク隔離と TLS/接続先認証も必要で、HMAC だけで公開 endpoint の負荷制限を代替しない。
- MTA は配送単位の deliveryId を耐久保存し、同じ配送の再試行には同じ ID を使う。timestamp/署名は再試行時に更新する。ID、raw、envelope の対応を変更しない。
- DB は `(deliveryId, recipient)` を一意に管理し、再利用時の所有者・raw hash・envelope sender の不一致を拒否する。**外部 Message-ID 単独で重複排除しない。** 受理済み宛先を他宛先の一時失敗で取り消さない。
- `stage()` が raw を保存し、`accept()` が受信記録・必要な quota/parse outbox・転送タスクを transaction で確定してから、その宛先に成功を返す。保存・DB 確定前の 250 応答は禁止。確定前の障害は MTA が再送できる一時失敗にする。
- DATA は申告 SIZE ではなく実 byte 数で制限する。現在の既定 raw 上限は 25 MiB。MTA adapter 側でも接続数、宛先数、流量、読み取り期限を制限する。

## 非公開ストレージと quota

`S3PrivateMailStorage` は **メール専用の非公開 bucket** を受け取る。Drive の公開 bucket、公開 media proxy、公開 URL を流用しない。
資格情報はメール用途の最小権限に分離し、bucket/object への一般公開アクセスを許可しない。原文、添付、本文、確認トークン、SMTP 資格情報を通常ログへ出さない。

利用前に `verifyPrivacy()` を呼ぶ。次の S3 API を利用できる権限が必要になる。

- GetPublicAccessBlock: BlockPublicAcls、IgnorePublicAcls、BlockPublicPolicy、RestrictPublicBuckets がすべて true。
- GetBucketPolicyStatus: IsPublic が明示的に false。
- GetBucketAcl: 公開グループ等の URI grant がない。

チェックを未実行、または API が非対応/失敗した状態では、原文の put/get/delete は拒否する。
S3 互換サービスも同じ確認ができるものを使い、チェックを無効化して通さない。
これは確認時点の公開状態の検査であり、IAM や明示的な別アカウント権限すべての監査ではない。管理者は bucket policy、IAM、暗号化、バックアップ、監査、秘密のローテーションを別途管理し、設定変更後にも再確認する。

- raw はランダム object key で保管し、DB に hash・size・staging/ready/deleting 状態を残す。upload 失敗後の孤立 object も追跡可能にする。
- 所有者 quota はローカル保存した受信 raw と送信 raw の byte 数をアカウントに課金する。transaction 内で確認・加算し、所有者の削除で一度だけ減算する。検証済み転送がある場合だけ、ローカル保存をしない配送を許可する。quota 不足時のローカル保存失敗は `localError` に残し、転送用 spool の制限は維持する。
- `readRaw(userId, id)` と `remove(userId, id)` は所有者で絞る。認証付き API はセッションから userId を取得し、利用者が指定した他人の ID を信用しない。
- `dispatch()` は DB outbox を読む。Redis enqueue が成功しただけでは outbox を削除せず、parse 結果を DB に確定した時に取り除く。専用 BullMQ worker がジョブ ID と DB 状態で重複処理を制御し、queue role は DB の未完了処理を定期的に再投入する。
- `collect()` は参照がない原文だけを deleting にして回収する。通常 1 日の猶予と、`mail_delivery.rawId` / `mail_submission.rawId` の両方の参照を確認する。queue role は dispatch 後、プロセスごとに最大 1 時間に 1 回、最大 100 件を回収する。

### 容量・参照管理

所有者 quota とは別に、stage() は raw/spool 全体の予約を DB の advisory lock で直列化する。
既定上限は 1 GiB。staging・ready・deleting を含む全 raw 行の size を数え、upload 前に予約する。
受理失敗・重複再送の staging object も回収完了まで計上する。upload 用 byte はコピーしてから hash を確定し、upload と ready 化の間は raw 行を lock する。
この上限は DB に追跡された raw の予算であり、bucket の過去 version、バックアップ、DB 等を含む総ディスク容量ではない。
ingress の流量・同時受理制限と worker の同時実行制限、spool 不足時の一時失敗を実装している。プロセスを跨ぐ MTA 側の総量制限、容量監視・警報は運用側で用意する。

`completeParse()` は 1 MiB を超える JSON と binary byte 配列を拒否し、表示用の text/metadata projection だけを保存する。
解析結果の添付 byte 配列をそのまま渡さない。現段階では添付 bytes は raw に残し、将来の独立添付保存では非公開参照と quota を管理する。
parsed JSON、検索 index、バックアップ等の全体容量は raw quota とは別に計測・制限する。

collector は受信・送信・転送タスクの raw 参照を確認し、処理中や参照を保持した unknown を回収しない。
転送/確認送信の完了・失敗・取消では raw 参照を解放し、unknown の転送/確認送信は作成から 7 日後に解放する。送信者の保存メールは所有者による削除まで保持する。照合が必要な場合はこの保持期間内に MTA の記録と確認する。
`keepLocalCopy=false` でも処理中の転送原文を保持し、ローカル保存 quota と転送 spool の物理上限を分ける。
転送失敗を理由に受信済みローカルコピーを削除しない。

## 解析と表示

`parseIncomingMail()` は PostalMime を使い、raw size、MIME part 数、header size、ネスト深度を制限する。
実行経路は `parseMailIsolated()` を使い、queue worker の concurrency 1、30 秒の worker-thread 期限、V8 heap 上限を適用する。解析失敗でも原文を失わない。

HTML は保守的にサニタイズし、remote image、CSS、script、iframe、form、CID 読み込みや clickable link を許可しない。
表示時は `iframe.srcdoc` と空の sandbox 属性を使い、allow-scripts/allow-same-origin を付けない。CSP も併用する。
原文・添付の所有者認証付きダウンロード API/UI は接続済み。添付は原文を bounded worker thread で再解析して取得し、DB の JSON に binary を保存しない。添付解析は API プロセスごとに同時 1 件に制限する。CID は metadata のみ保持し、本文へのインライン表示は引き続き許可しない。

## 送信の契約

`buildTextMail()` は認証済みローカルユーザー名と管理対象ドメインから From を決める。
クライアント指定の From、任意 raw header、ファイルパス、取得 URL を渡さない。
ヘッダー制御文字と不正な単一メールアドレスを拒否し、宛先数と生成後 raw サイズを制限する。
To/Cc と SMTP envelope を分け、Bcc は envelope と送信者専用メタデータだけに保存する。

Message-ID と Date はサーバーが一度だけ確定して渡し、生成した raw/envelope を最初の送信前に耐久保存する。
再処理時に MIME を作り直さない。送信 API の冪等キーはユーザー単位で DB 管理し、同じキーで違う内容を送る操作を拒否する。text/MFM preview と送信は共通の生成経路を使い、MFM は独立レンダラーの HTML と plain text を MIME 化する。メールクライアント間の表示互換性は別途確認する。 現在のメール統合は custom emoji の URL 解決・埋め込みを行わず `:name:` の文字表現を使う。受信 CID 画像の表示と同様、外部画像の自動取得は行わない。

`UserMailTransport` は管理者の SMTP リレーにのみ接続する。
implicit TLS または必須 STARTTLS、証明書検証、TLS 1.2 以上を要求し、平文へ fallback しない。
接続・greeting は 15 秒、socket は 60 秒、pool の既定接続数は 2。アプリ終了時は close() を呼ぶ。
既存通知の ignoreTLS 設定は引き継がない。Nodemailer pool の暗黙 requeue は無効化している。

### 状態と再試行

専用 submission worker は DB で queued → sending を原子的に claim し、試行 ID・lease・宛先別結果を保存する。耐久状態を再走査するため Redis 消失から再投入できる。期限付き再試行と部分拒否時の未受理宛先限定再送を実装し、expired sending lease は unknown にする。

- submitted: リレーが受理した状態。最終宛先への配達成功ではない。以降の外向き再配送は MTA が担当する。
- failed: 明確な拒否、または配送未開始と判断できる障害。4xx や確認可能な接続準備失敗だけを期限・回数上限付きで再試行する。5xx は恒久失敗。
- 部分 RCPT 拒否: accepted と rejected を保存し、`retryableRecipients` の宛先だけを別の試行対象にする。受理済み宛先を全体再送に巻き込まない。
- unknown: DATA 後の応答消失等、受理有無が確定できない状態。Nodemailer の一般的な CONN エラーも DATA 後に起きるため、それだけで安全な再送と判断しない。
- リレー受理後、DB 更新前に worker が停止した場合も unknown として回復する。Message-ID が同じでも重複配達は防げない。

**unknown は無条件に自動再送しない。** 所有者へ不明状態を表示し、管理者が試行 ID、限定公開の SMTP 応答/relay queue ID、MTA ログを突き合わせる。
送信一覧には状態を表示するが、管理者の relay 照合・明示再送画面は未実装。unknown の自動再送や最終配送確認はしない。転送/確認送信の raw 保持は上記の 7 日が上限なので、照合・必要な証跡保存と重複リスク確認の運用手順を用意する。

## 転送とメール認証

`buildForwardMail()` は確認済み外部宛先へ、元 raw を再構築せず明示 envelope で転送する。
管理対象ドメインへの転送は拒否する。本文、From、Subject、元 DKIM 署名を helper が編集しない。
元 envelope sender が空の DSN も扱う。任意 raw header を転送済みの証拠にしない。

転送 worker は DB claim 時に設定の revision・宛先・有効状態・確認済み状態を照合する。
無効化・宛先変更で送信未開始の古いタスクを止める。すでに送信開始・受理済みのものを取り消せるとは表示しない。

転送 helper は trustedIngress / loopChecked / forwardingRelay の MTA 契約が満たされた場合だけ動作する。
これらは外部ヘッダーやクライアント入力を見て true にしてよいフラグではない。
`userMail.forwarding.enabled` は outbound relay とすべての MTA 安全契約フラグが揃わない設定を拒否する。フラグは管理者による保証であり、MTA の SRS/ARC や loop 検査をアプリが代行するわけではない。

- 送信リレーはユーザーの管理対象ドメイン From を許可し、SPF、DKIM 署名、DMARC alignment を正しく設定する。通知専用の固定差出人リレーを無条件に流用しない。
- 転送には元の From を保持できる MTA を使う。例は Postfix + PostSRSd。SRS の署名/期限検証、逆変換、空 envelope sender の処理は MTA に任せる。
- SRS だけで DMARC 成功は保証されない。元 DKIM 署名を維持し、改行正規化を含め実送信 byte を検証する。
- ARC を使う場合は信頼できる MTA が検証・封印する。転送先がその ARC chain を信頼することも別の条件になる。
- 入口 MTA が外部由来の偽 Authentication-Results を排除し、自身が検証した結果だけを信頼できる形で伝える。
- MTA が hop 上限と認証可能な自サーバー転送識別子を検査し、外部経由のループを止める。アプリ側の自己宛て禁止だけでは不足する。
- 未検証の差出人へアプリから自動失敗通知を送らない。必要な DSN は MTA の返送経路と整合させ、backscatter を防ぐ。

## 検証と残作業

helper テストには、HMAC/recipient/size 検証、HTML 隔離、テキスト MIME の日本語・emoji と Bcc 分離、localhost TLS SMTP の部分/全宛先拒否、DATA 4xx/5xx、DATA 後切断、raw byte 保持を含む。
実在する第三者には送信しない。localhost SMTP テストは OpenSSL とサポート対象 Node.js を使う。

本番公開前に、少なくとも次を検証・整備する。API/UI/worker が接続済みであることは、これらの運用保証を意味しない。

1. #255: 実 MTA の bridge 組込み、配送 ID 永続化、再起動/応答消失後の宛先別再試行。private HTTP の fixture テストだけでは実 MTA の契約を保証しない。
2. #255: PostgreSQL transaction の quota/重複受理/削除/collector 競合、実 S3 の private bucket 判定・障害、Redis 消失、worker 停止を組み合わせた試験。実 PostgreSQL による競合試験は未実施。
3. #256: 本番相当の relay における部分拒否・TLS/認証・DATA 後切断、unknown の管理者照合手順、インスタンス全体の流量制限・監視。SMTP fixture の結果を実配送保証と扱わない。
4. #256: MFM の preview/送信 HTML を主要メールクライアントで確認する。CID の本文表示、受信 remote image の読み込みはサポートしない。
5. #257: 転送先確認リンク・期限・一回性、設定変更/無効化と worker claim の競合、local copy 無効/quota 超過時の転送、raw 保持/解放の実環境試験。
6. #257: 実 MTA の SRS 往復、署名済み DKIM fixture、ARC を提供する場合の chain 検証、偽認証ヘッダー、外部経由ループと hop 制限。
7. 全体: private bucket の起動時検査・停止処理、容量監視、バックアップ/復元/削除/保持期限、機密情報を含まない運用ログ、API の所有者分離と実ブラウザーの隔離表示・ダウンロードを検証する。

この README は構成上の契約と残作業を示すものであり、そのまま本番公開できる MTA 設定例ではない。

## Live runtime (opt-in)

`userMail` is a separate, disabled-by-default server configuration. No notification SMTP or Drive credentials are reused. Example (secrets are placeholders, provision them securely):

```yaml
userMail:
  enabled: true
  domain: mail.example.org
  mxHost: mx.example.org
  maxBytes: 26214400
  quotaBytes: 104857600
  spoolBytes: 1073741824
  maxRecipients: 20
  sendsPerHour: 20
  s3:
    bucket: dedicated-private-mail
    region: ap-northeast-1
    # endpoint: https://compatible-private-s3.example.org
    # forcePathStyle: true
  ingress:
    host: 127.0.0.1
    port: 8025
    token: REPLACE_WITH_INDEPENDENT_RANDOM_SECRET_AT_LEAST_32_BYTES
    secret: REPLACE_WITH_DIFFERENT_RANDOM_HMAC_SECRET_AT_LEAST_32_BYTES
    maxConcurrent: 2
    perMinute: 60
  outbound:
    host: authenticated-relay.example.org
    port: 465
    tls: implicit
    # auth: { user: ..., pass: ... }
  forwarding:
    enabled: false
    trustedIngress: false
    loopChecked: false
    forwardingRelay: false
```

The dedicated S3 client uses the standard AWS credential provider chain (workload identity/role or environment), not credentials in this YAML. Grant this process only its dedicated private-mail bucket permissions. Endpoint HTTPS and successful bucket privacy verification are mandatory. Deployment still needs DNS MX/SPF/DKIM/DMARC, TLS on the Internet-facing MTA, backups and operational capacity monitoring. The application does not configure DNS or the MTA.

### Authenticated MTA HTTP handoff

This implementation provides **private HTTP**, not an LMTP listener. An MTA adapter must implement the following contract; configuring an ordinary LMTP transport against this port will not work.

1. Internet mail terminates at the operator's MTA. Validate recipients, spam policy, hops and authenticated forwarding-loop markers there. Strip forged authentication results there. Never expose or reverse-proxy the application handoff publicly.
2. Connect to loopback `POST /v1/deliver`, with `Authorization: Bearer <token>` and raw RFC822 octets as the body. Remote MTA connections require an authenticated encrypted tunnel whose application endpoint is loopback. The listener deliberately refuses non-loopback bind addresses.
3. `X-Mail-Envelope` is base64url-encoded UTF-8 JSON containing exactly the `MailDeliveryEnvelope` properties (`deliveryId`, epoch-second `timestamp`, `mailFrom`, ordered `recipients`). `X-Mail-Signature` is lowercase hex HMAC-SHA256 of `mailDeliverySigningPayload(raw, envelope)` with the separate `secret`. Preserve raw bytes, recipient order, envelope sender and durable delivery ID across retries; refresh timestamp and signature. Do not derive envelope metadata from message headers.
4. HTTP 200 means the response contains ordered `results: [{recipient, code}]`; it does **not** mean every recipient succeeded. Translate 250 to durable acceptance, 451 to temporary failure and 550 to permanent refusal, individually. Never retry successful recipients as new deliveries. Non-200 or a lost response means the adapter must retry with the same ID. 413 means the raw is too large; 400 means invalid envelope/signature. Authentication failure is 401. 503 is temporary backpressure. Only return SMTP success after the corresponding 250 result. Do not generate application-originated backscatter.
5. The listener checks bearer authentication before reading body or accessing storage, then HMAC before staging. Actual body bytes, headers, wall-clock receive deadline, per-process concurrent requests/rate and connections are bounded. Raw and receipt/outbox are durable before success. Shared server processes use Node's Linux `reusePort`; budgets are per process and deployments must apply aggregate limits at the MTA.
6. Enabling forwarding's trust flags asserts the operator has implemented and tested ingress loop rejection and a forwarding-aware SRS relay. These flags do not inspect or authenticate message headers and must not be enabled merely to bypass missing MTA configuration. Forwarding remains disabled by default.

The explicit server-role lifecycle starts ingress; the queue-role lifecycle starts separate `user-mail` parse/submission queues. Generic Nest contexts, schema generation and CLI construction do not start these resources. Queue workers reconcile the PostgreSQL outboxes every five seconds; Redis is disposable scheduling state, not the canonical receipt/submission store. Parse concurrency is one per queue process, with a 30-second isolated worker-thread deadline and bounded V8 heap. Parsing stores a truncated display projection plus attachment names/types/sizes/content IDs only, never attachment bytes. A parse failure retains raw for owner-authorized download. Subject/body may be truncated for display; the original remains intact.

Start both normal server and queue roles for this opt-in feature. Verify storage privacy, MTA adapter integration, database migrations, authenticated APIs and the owner UI in staging before enabling users. The integration is not an LMTP implementation or turnkey production mail-server deployment; the staging and operational checks above remain required.

## Trusted MTA handoff CLI

`node packages/features/email/scripts/mta-handoff.mjs` is a single-recipient bridge to the private HTTP ingress, not an SMTP server, queue, or Postfix configuration generator. Invoke it from a trusted MTA delivery adapter with raw RFC822 bytes on stdin. Do not invoke it from untrusted shell command text or derive the envelope from message headers.

Required arguments (pass as distinct process arguments, preserving their exact values):

```text
node packages/features/email/scripts/mta-handoff.mjs \
  --delivery-id <MTA-persisted-delivery-identity> \
  --mail-from <original-envelope-sender-or-empty-string> \
  --recipient <one-original-envelope-recipient>
```

The delivery ID must contain 16–128 ASCII letters, digits, underscores or hyphens. The MTA adapter must persist it before the first invocation, reuse it across retries, and retain the identical raw bytes and envelope. It must not use the external Message-ID, invent a fresh ID per attempt, or depend on an undocumented queue-variable expansion. For a null reverse path, pass an actual empty argument after `--mail-from`, not the literal SMTP brackets `<>`. Configure one recipient per process invocation; do not place a recipient list in one argument.

Supply separate administrator-managed credentials through the process environment, not command-line arguments or committed configuration:

| Environment variable | Meaning |
| --- | --- |
| `MISSKEY_MAIL_INGRESS_SECRET` | HMAC secret matching `userMail.ingress.secret`, 32–4096 UTF-8 bytes |
| `MISSKEY_MAIL_INGRESS_TOKEN` | Separate Bearer token matching `userMail.ingress.token`, 32–4096 printable non-space ASCII characters |
| `MISSKEY_MAIL_INGRESS_URL` | Default `http://127.0.0.1:8025/v1/deliver`; only literal loopback HTTP/HTTPS endpoints and this path are allowed |
| `MISSKEY_MAIL_MAX_BYTES` | Actual stdin byte limit; default and maximum 26214400 (25 MiB); match or lower the ingress limit |
| `MISSKEY_MAIL_TIMEOUT_MS` | Deadline for reading stdin and, separately, for the complete HTTP exchange; default 30000, maximum 120000 |

Use a protected service environment/credential launcher readable only by the MTA account and administrator. Never enable shell tracing around secrets. A remote MTA needs an authenticated encrypted tunnel terminating at loopback; the script does not allow a public HTTP endpoint, use a proxy environment variable, or follow redirects. HTTPS retains certificate verification and requires TLS 1.2 or newer. Credential and TLS failures defer delivery rather than silently relaxing security.

The bridge reads bounded stdin without MIME parsing or newline rewriting. It signs the exact `misskey-mail-v1` payload used by `authenticateMailDelivery()`, refreshes the timestamp on each invocation, and sends raw as the POST body. `x-mail-envelope` carries base64url JSON; `x-mail-signature` carries the hex HMAC. The response body is capped at 16 KiB. It makes exactly one HTTP attempt and never retries internally.

| Process exit | MTA interpretation |
| --- | --- |
| 0 / EX_OK | Only HTTP 200 with exactly one matching recipient result and code 250: durable acceptance |
| 75 / EX_TEMPFAIL | Recipient 451, 503/backpressure, network failure, timeout, lost/truncated/malformed response, redirect, authentication/configuration fault or other uncertain result: retain queue entry and retry with the same identity |
| 67 / EX_NOUSER | The matching recipient returned permanent 550; stop retrying this recipient according to the MTA's failure policy |
| 69 / EX_UNAVAILABLE | Empty/oversized input or HTTP 413; delivery cannot be accepted under the configured size contract |

An HTTP 200 alone is not success. Unknown or mismatched result sets always defer. Losing a response after a DB commit is safe to retry only because the MTA preserves the original delivery identity and bytes. The bridge emits no stdout and only a fixed generic refusal/defer message on stderr; raw, envelope, tokens and server responses are not logged. Any DSN policy remains at the trusted MTA, not this script.

Local tests: `node --test packages/features/email/test/mta-handoff.test.mjs`. These use only loopback HTTP fixtures and subprocesses, checking byte/HMAC identity, repeated invocations, result mapping, malformed/oversized responses, disconnect/deadline handling, stdin bounds and the actual CLI exit. Production MTA queue persistence, authenticated tunnel deployment and end-to-end restart/retry tests remain required.
