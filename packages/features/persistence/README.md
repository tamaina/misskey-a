# persistence

データベース接続、リポジトリ生成、SQL の共通処理とモデルの ID 列定義を担当する。`backend/postgres.ts` は entity の順序と接続設定を、`backend/repositories/` は型付き repository、トークンと実行 context ごとの生成・Nest provider を保持する。

各機能の entity と閲覧・ミュート・ブロックの方針は、それぞれの機能が担当する。migration ファイルと実行用の `ormconfig.js` は backend package が管理し、公開される `built/postgres.js` のエントリは変えない。
