# email

アカウント登録・更新・通知に使う既存の `EmailService` と、ユーザーメール機能の基盤を配置する。
既存通知メールの From、テンプレート、SMTP 設定は変更しない。

## 実装状況: stage 1 / draft

**これは #254 の基盤実装であり、利用者がメールを送受信できる完成機能ではない。**
migration、非公開原文保存、受理・解析・送信・転送の helper とテストを追加している。
本番用の SMTP/LMTP listener、認証付き API、worker、画面、転送先確認はまだ接続していない。
この変更だけでポートを公開したり、SMTP リレーへ自動送信したりしない。
独立 MFM レンダラーが存在しても、メール作成画面や HTML 送信への接続が完了したことを意味しない。

| 部分 | 現在あるもの | 本番接続前に必要なもの |
| --- | --- | --- |
| 受信 (#255) | envelope 検証、認証 helper、bounded DATA、原文・受信記録・parse outbox | MTA adapter、LMTP/受理 endpoint、流量制御、専用 worker、所有者 API/UI |
| 送信 (#256) | テキスト MIME、TLS SMTP transport、結果分類 | 利用権限、送信量制限、冪等 API、送信状態/試行/outbox の永続化、worker、UI |
| 転送 (#257) | 確認済み設定の検証、revision 判定、raw 転送 helper | 期限付き一回限り確認、設定 API、転送設定/タスク永続化、MTA ループ対策、spool 管理、UI |

## 受理と認証の契約

- インターネットからの受信、MX、迷惑メール対策、SMTP の再配送は管理者の MTA が担当する。アプリを公開 open relay にしない。
- 配送先は SMTP envelope の RCPT TO だけから決める。To/Cc/Delivered-To、From、Message-ID、Authentication-Results は権限や配送先の根拠にしない。
- `parseEnvelopeRecipient()` は管理対象ドメインの `username[+suffix]@domain` を分解する。利用可能なローカルユーザー、停止・削除状態、メール opt-in は `MailStore.resolveRecipient()` と受理 transaction で確認する。
- `authenticateMailDelivery()` は raw の SHA-256、MTA が生成した deliveryId、timestamp、MAIL FROM、順序を含む RCPT TO 配列を HMAC で束ねる。署名は DATA のヘッダーではなく、認証済み MTA との side channel から渡す。
- 共有秘密は少なくとも 32 bytes。現在の時刻許容幅は 300 秒。ネットワーク隔離と TLS/接続先認証も必要で、HMAC だけで公開 endpoint の負荷制限を代替しない。
- MTA は配送単位の deliveryId を耐久保存し、同じ配送の再試行には同じ ID を使う。timestamp/署名は再試行時に更新する。ID、raw、envelope の対応を変更しない。
- DB は `(deliveryId, recipient)` を一意に管理し、再利用時の所有者・raw hash・envelope sender の不一致を拒否する。**外部 Message-ID 単独で重複排除しない。** 受理済み宛先を他宛先の一時失敗で取り消さない。
- `stage()` が raw を保存し、`accept()` が受信記録・quota・parse outbox を transaction で確定してから、その宛先に成功を返す。保存・DB 確定前の 250 応答は禁止。確定前の障害は MTA が再送できる一時失敗にする。
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
- 現在の所有者 quota は受理した raw の byte 数を宛先のアカウントに課金する。受理 transaction 内で quota を確認・加算し、所有者の削除で一度だけ減算する。
- `readRaw(userId, id)` と `remove(userId, id)` は所有者で絞る。将来の API も認証から userId を取得し、利用者が指定した他人の ID を信用しない。
- `dispatch()` は DB outbox を読む。Redis enqueue が成功しただけでは outbox を削除せず、parse 結果を DB に確定した時に取り除く。ジョブ ID と DB 状態で重複実行を制御する専用 worker が別途必要。
- `collect()` は参照がない原文だけを deleting にして回収する。現在は通常 1 日の猶予と、`mail_delivery.rawId` の参照を確認する。回収のスケジュールはまだ接続していない。

### 本番接続前の容量・参照管理

所有者 quota とは別に、stage() は raw/spool 全体の予約を DB の advisory lock で直列化する。
既定上限は 1 GiB。staging・ready・deleting を含む全 raw 行の size を数え、upload 前に予約する。
受理失敗・重複再送の staging object も回収完了まで計上する。upload 用 byte はコピーしてから hash を確定し、upload と ready 化の間は raw 行を lock する。
この上限は DB に追跡された raw の予算であり、bucket の過去 version、バックアップ、DB 等を含む総ディスク容量ではない。
流量制限、upload/worker 同時実行数、障害時の backpressure と容量監視は別途実装してから公開する。

`completeParse()` は 1 MiB を超える JSON と binary byte 配列を拒否し、表示用の text/metadata projection だけを保存する。
解析結果の添付 byte 配列をそのまま渡さない。現段階では添付 bytes は raw に残し、将来の独立添付保存では非公開参照と quota を管理する。
parsed JSON、検索 index、バックアップ等の全体容量は raw quota とは別に計測・制限する。

現 collector は送信・転送中の参照を管理していない。
送信/転送タスクを接続する前に、処理中・unknown・他宛先からの参照を含む回収条件へ拡張する。
`keepLocalCopy=false` でも処理中の転送原文を保持し、ローカル保存 quota と転送 spool の物理上限を分ける。
転送失敗を理由に受信済みローカルコピーを削除しない。

## 解析と表示

`parseIncomingMail()` は PostalMime を使い、raw size、MIME part 数、header size、ネスト深度を制限する。
解析失敗でも原文を失わない。bounded-concurrency worker と処理期限を別途設ける。

HTML は保守的にサニタイズし、remote image、CSS、script、iframe、form、CID 読み込みや clickable link を許可しない。
表示時は `iframe.srcdoc` と空の sandbox 属性を使い、allow-scripts/allow-same-origin を付けない。CSP も併用する。
この段階で CID 画像・添付ダウンロード UI が実装済みとは扱わない。将来の添付取得にも所有者認証が必要。

## 送信 helper の契約

`buildTextMail()` は認証済みローカルユーザー名と管理対象ドメインから From を決める。
クライアント指定の From、任意 raw header、ファイルパス、取得 URL を渡さない。
ヘッダー制御文字と不正な単一メールアドレスを拒否し、宛先数と生成後 raw サイズを制限する。
To/Cc と SMTP envelope を分け、Bcc は envelope と送信者専用メタデータだけに保存する。

Message-ID と Date はサーバーが一度だけ確定して渡し、生成した raw/envelope を最初の送信前に耐久保存する。
再処理時に MIME を作り直さない。送信 API の冪等キーはユーザー単位で管理し、同じキーで違う内容を送る操作を拒否する永続化が別途必要。

`UserMailTransport` は管理者の SMTP リレーにのみ接続する。
implicit TLS または必須 STARTTLS、証明書検証、TLS 1.2 以上を要求し、平文へ fallback しない。
接続・greeting は 15 秒、socket は 60 秒、pool の既定接続数は 2。アプリ終了時は close() を呼ぶ。
既存通知の ignoreTLS 設定は引き継がない。Nodemailer pool の暗黙 requeue は無効化している。

### 状態と再試行

将来の worker は DB で queued → sending を原子的に claim し、試行 ID と宛先別結果を保存する。
現在は状態型と結果分類 helper があるだけで、送信状態テーブル/worker は未接続。

- submitted: リレーが受理した状態。最終宛先への配達成功ではない。以降の外向き再配送は MTA が担当する。
- failed: 明確な拒否、または配送未開始と判断できる障害。4xx や確認可能な接続準備失敗だけを期限・回数上限付きで再試行する。5xx は恒久失敗。
- 部分 RCPT 拒否: accepted と rejected を保存し、`retryableRecipients` の宛先だけを別の試行対象にする。受理済み宛先を全体再送に巻き込まない。
- unknown: DATA 後の応答消失等、受理有無が確定できない状態。Nodemailer の一般的な CONN エラーも DATA 後に起きるため、それだけで安全な再送と判断しない。
- リレー受理後、DB 更新前に worker が停止した場合も unknown として回復する。Message-ID が同じでも重複配達は防げない。

**unknown は無条件に自動再送しない。** 所有者へ不明状態を表示し、管理者が試行 ID、限定公開の SMTP 応答/relay queue ID、MTA ログを突き合わせる。
照合可能な有限の保持期限と、再送する場合の重複リスク確認手順を実装する。現段階で照合画面や自動回復が完成したと見なさない。

## 転送とメール認証

`buildForwardMail()` は確認済み外部宛先へ、元 raw を再構築せず明示 envelope で転送する。
管理対象ドメインへの転送は拒否する。本文、From、Subject、元 DKIM 署名を helper が編集しない。
元 envelope sender が空の DSN も扱う。任意 raw header を転送済みの証拠にしない。

`canStartForward()` の revision/宛先/有効状態検査は、将来の DB claim と同じ lock 内で行う。
無効化・宛先変更で送信未開始の古いタスクを止める。すでに送信開始・受理済みのものを取り消せるとは表示しない。

転送 helper は trustedIngress / loopChecked / forwardingRelay の MTA 契約が満たされた場合だけ動作する。
これらは外部ヘッダーやクライアント入力を見て true にしてよいフラグではない。
本番 adapter では認証済み MTA の保証と設定に結び付ける必要がある。

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

本番公開前に、少なくとも次を完成・検証する。

1. #255: 認証済み MTA adapter、LMTP/受理 endpoint と宛先別応答、DB/S3/Redis 障害、quota 競合、worker 停止、raw 回収の実環境試験。
2. #255: 認証付き設定・一覧・本文・既読・削除・添付 API、専用 worker、隔離表示 UI、インスタンスの許可・流量制限。
3. #256: 送信 API の冪等性、raw/送信 outbox/試行の永続化、部分拒否再送、unknown 回復と照合 UI、ユーザー/全体送信量制限。
4. #256: MFM preview と HTML 送信の同一生成経路、資源の許可/取得、メールクライアントごとの CSS 確認。
5. #257: 転送設定と revision の永続化、期限付き一回限り確認リンク、確認送信の rate limit、タスク生成/取消、raw 参照と spool 上限。
6. #257: 実 MTA の SRS 往復、署名済み DKIM fixture、ARC を提供する場合の chain 検証、偽認証ヘッダー、外部経由ループと hop 制限。
7. 全体: startup 時の private bucket 確認、readiness/停止処理、容量監視、バックアップ/削除/保持期限、機密情報を含まない運用ログ、所有者間のアクセス拒否試験。

この README は構成上の契約と残作業を示すものであり、そのまま本番公開できる MTA 設定例ではない。
