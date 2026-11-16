# Drive 原本の object storage 接続: 設計上の区切り

関連: [Issue #8](https://github.com/tamaina/misskey-a/issues/8)、[Draft PR #314](https://github.com/tamaina/misskey-a/pull/314)。

2026-11-16 の git fetch で確認した develop は `039982e806c3b4b0c9b1095b390b8ec4c9d43553`、#314 は `8bd98ad12f958b47be0582b5dd5921e1214fe664`。この文書は次の接続案であり、object storage からの配信を実装・検証したという報告ではない。

## 調査結果と今回の境界

`/drive/:fileId` を object storage に安全につなぐには、ファイルと保存先の対応をまず永続化する必要がある。現在の構造にはその対応がなく、単純に現在の S3 設定と既存 accessKey を組み合わせる実装には進めない。依頼の「大きな配信設計変更が必要なら設計まで」に従い、このスライスは設計で止める。#314 の内部ストレージ経路は維持し、変更しない。

確認したコード:

| 既存部分 | 実際の責務 | 再利用できる点 / 足りない点 |
| --- | --- | --- |
| [DriveFile.ts](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/drive/backend/models/DriveFile.ts) | `storedInternal`、`accessKey`、公開 `url` を保存 | owner/key は利用可能。bucket、endpoint、保存先 ID、object version の記録はない |
| [DriveService.ts:173](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/drive/backend/services/DriveService.ts#L173) | 現在の meta から公開 URL を組み立て、key を保存 | 現行 URL 生成規則は参考になるが、保存先の履歴ではない |
| [DriveService.ts:381](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/drive/backend/services/DriveService.ts#L381)、[:861](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/drive/backend/services/DriveService.ts#L861) | upload / delete に現在の `objectStorageBucket` を渡す | 新しい配信のための保存先解決機構は含まない。既存 delete を今回変更する提案ではない |
| [update-meta.ts:253](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/instance/backend/endpoints/admin/update-meta.ts#L253) | bucket 等の設定を更新 | 更新時に既存ファイルの保存先との対応を記録・検証していない |
| [S3Service.ts:26](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/runtime/backend/services/S3Service.ts#L26) | endpoint、資格情報、region、proxy、HTTP agent をまとめて client を作成 | SDK client の構築はここを再利用する。秘密情報を file レコードにコピーしない |
| [FileServerFileResolver.ts:86](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/drive/backend/http/FileServerFileResolver.ts#L86) | 内部ファイル、リンクした遠隔ファイルを解決 | object storage の通常ファイルは `unavailable`。owner-only S3 配信の実装ではない |
| [DownloadService.ts:37](https://github.com/tamaina/misskey-a/blob/039982e806c3b4b0c9b1095b390b8ec4c9d43553/packages/features/runtime/backend/services/DownloadService.ts#L37) | URL からサイズ制限付きで一時ファイルへダウンロード | SSRF 対策と redirect ごとの agent 選択あり。ただし HEAD / 中断可能な直結配信ではなく全量の一時保存が必要 |
| [#314 DriveDownloadHandler.ts](https://github.com/tamaina/misskey-a/blob/8bd98ad12f958b47be0582b5dd5921e1214fe664/packages/features/drive/backend/http/DriveDownloadHandler.ts) | Bearer / `read:drive` / owner 確認と内部ファイル配信 | 認可、添付ヘッダー、no-store、GET/HEAD の境界をそのまま維持 |

公開 URL の一致を使うだけでも解決しない。例えば `objectStorageBaseUrl = https://media.example.test` を維持したまま bucket A を B に変えた場合、元の `file.url` と現在生成した URL は同じでも S3 の読取先は B になる。これは現在の #314 の不具合ではない。#314 は object storage を返さない。ここで問題にしているのは、次の実装に単純な S3 読み取りを追加した場合の設計上の不一致である。

本人向け入口の意義は、fileId と既存の本人認可を使って原本を添付ダウンロードできる安定したサーバー経路を作ることにある。公開 CDN URL の廃止・秘匿化、アクセス制御を公開配信へ後付けする仕組みではない。既存の保存先設定、upload/delete、公開配信の互換性を保ちながら、この入口が保存先を誤って選ばないことを別に保証する。

## 次の最小実装案

第一段階は「既知の保存先に、新たに保存した object だけ読める」対応とする。既存ファイルを現在の保存先に自動で割り当てない。

1. サーバー内部専用の保存先 identity を定義する。endpoint（AWS の暗黙 endpoint は provider / region として明示）、bucket、addressing / TLS 等の到達先設定を識別する。資格情報と公開 CDN URL は identity そのものにしない。key には保存時の prefix が含まれており、読取時に現在の prefix を付け直さない。
2. 新しい nullable 列で、書き込みに使った保存先 identity を file に保存する。upload と file 登録で同一の設定 snapshot を使用し、設定変更との race を防ぐ。秘密の access key / secret key、presigned URL は保存しない。列追加の migration は up / down を用意し、通常の file API / pack には露出させない。
3. 初期段階では記録された identity と現在の到達先が一致する場合だけ、既存 `S3Service.getS3Client` に渡す。同じ到達先の資格情報 rotation は可能にし、別の到達先への変更は fail closed にする。過去の保存先の資格情報を保管する管理画面や複数保存先 registry は今回導入しない。
4. identity がない既存 object、保存先変更後の object は `/drive/:fileId` で未対応として 404。従来の公開 URL は維持する。旧データの有効化は、管理者が保存元を確認する別の migration / backfill 設計で扱う。全件を現在の設定へ割り当てる migration は作らない。
5. 保存先 identity の意味、既存 object を当面対象外とする範囲、設定を元に戻した際の対応、同じ endpoint / bucket の削除・再作成をどう扱うかをレビューする。bucket 名だけでは物理的に同じ保存先の継続を証明できず、再作成も含めた区別が必要なら管理された世代 ID が必要になる。object の version ID を利用するかも独立の判断点で、既存 md5 を version の代用にはしない。

最小の保存証跡スキーマ候補は、`drive_file.storageLocation` の nullable JSONB 一列。例えば以下の形をサーバー内部だけで使う（現時点では未追加）。

```ts
type S3LocationEvidence = {
  version: 1;
  kind: 's3';
  endpoint: string | null; // null は AWS SDK の暗黙 endpoint
  region: string | null;
  bucket: string;
  useSSL: boolean;
  forcePathStyle: boolean;
};
```

`accessKey` は既存列をそのまま使う。公開 CDN URL、secret、HTTP proxy 設定は保存証跡に含めない。AWS の region 未指定は実行環境の default chain に依存するため、この案では upload 前に実際の region を確定して保存する。null のまま同一保存先と見なさない。独自 endpoint / region の正規化は SDK に渡す値と一致させる。上記の証跡だけでは同名 bucket の再作成や同名 key の上書きを区別できないため、完全な版固定を保証する型とは扱わない。

この第一段階でも upload の保存形式と管理設定のライフサイクルを変更するため、現在の HTTP handler だけの変更には収まらない。上記のスコープを確認してからコード化する。

## 接続時の HTTP と資源管理

- 認可と owner を DB 条件で確認してから保存先を解決する。未認証・scope 不足・他人の fileId では S3 呼び出しを行わない。本人確認を公開 URL への redirect で代用しない。
- GET は認可済み key への `GetObject`、HEAD は `HeadObject` を使う。HEAD のために GET 本体を読み捨てない。S3 から返った長さを使い、DB size や上流 `Content-Disposition` を信用して転記しない。
- `Content-Type: application/octet-stream`、既存 filename encoder を使った attachment、`Cache-Control: private, no-store`、`Vary: Authorization`、`nosniff` を維持する。公開 URL / `/files` / `/proxy` は変更しない。この入口は既存公開 URL を非公開化するものではない。
- AWS SDK の streaming body を Fastify に渡し、buffer 化・一時ファイルへの全量コピーをしない。リクエスト中断、応答ソケット close、上流エラーで AbortController と Readable を確実に破棄する。イベント listener を完了時にも除去する。共有 agent 自体を request ごとに破棄しない。
- missing key は 404。資格情報や backend の接続エラーは非公開の診断とし、利用者には資格情報・bucket・endpoint・上流 XML を返さない。送信開始前の失敗は汎用 5xx、開始後の失敗はレスポンスを終了し成功完了と扱わない。公開用 fallback / cache の error handler は流用しない。
- Range は次段階。初期 GET は従来どおり完全な 200 応答。タイムアウトの上限、client の再利用・廃棄の責任を明示して、遅い object storage が無期限に資源を占有しないようにする。

## 実装後に必要な検証

| ケース | 必須の観測 |
| --- | --- |
| 未認証 / Cookie のみ / query token / scope 不足 / 他人の fileId | #314 と同じ応答、S3 呼び出しゼロ |
| 記録済み到達先・通常 GET | 同じ key の原本のみ、添付・no-store、streaming、公開 URL の変更なし |
| bucket / endpoint / TLS / region の変更、CDN URL 据置 | 旧 fileId が新しい到達先を読まない |
| prefix / CDN のみ変更、同じ保存先の credential rotation | 保存時の key を使う。対応する identity 方針どおりに扱う |
| upload 中の meta 更新 | upload 先と記録された identity が一致する |
| 未記録 legacy object | 推測して読まず 404、既存 URL は変更なし |
| HEAD / missing key | HEAD body は空、正しい Content-Length、GetObject を呼ばない。missing は GET/HEAD とも 404 |
| GetObject 前の切断 / 上流 headers 前の切断 | SDK の abort signal 発火、stream を残さない |
| 途中まで送った後の切断 / 上流 Readable エラー | 実際に listen した HTTP client で確認。接続・listener・body が解放され、汎用 JSON や XML を途中へ追記しない |
| SDK エラー / timeout / AccessDenied | 秘密情報を含めない汎用 5xx、no-store、内部ログの限定 |
| migration /保存復元 | nullable legacy、up/down、pack への非露出、同じ identity/key の round trip |

現在はこれらの object storage 回帰テストを実装・実行していない。S3 相当 backend と実ソケットのテスト、型・lint・CI が通るまで接続完了としない。Node の mock だけでは実 HTTP の切断時の資源解放や SDK transport 互換性を保証できない。

