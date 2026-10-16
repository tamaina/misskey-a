# データ・DDL の注意点

一般のクエリ規約は [CONTRIBUTING.md](../../../../../CONTRIBUTING.md)、migration 手順は [creating-migration.md](../tasks/creating-migration.md)。

- `migration:generate` は列リネームを DROP + ADD と解釈することがある。データを残すなら RENAME に直し、down も確認する。
- 既存行のあるテーブルに NOT NULL 列を追加する場合、既定値または backfill が必要。大量行の UPDATE / SET NOT NULL は長時間ロックに注意する。
- PostgreSQL enum は値を直接削除できない。型の再作成・列の cast が必要で、down 時に削除対象の値を使う行があると失敗する。DEFAULT と配列の cast も確認する ([実装例](../../../../../packages/backend/migration/1674118260469-achievement.js))。
- 不可逆のデータ変換は down に制約を記し、スキーマの巻き戻しを実装する。
- CREATE INDEX CONCURRENTLY は transaction 内で実行できない。[既存実装](../../../../../packages/backend/migration/1745378064470-composite-note-index.js) と [ormconfig.js](../../../../../packages/backend/ormconfig.js) に合わせる。`MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` のとき transaction mode が `each` になり、個別 migration は transaction を無効化する。未設定時の通常実行と down も対応させる。
- 無条件の IF EXISTS は不整合を隠すため、対象が条件付きで存在する場合に使う。

entity と DDL の整合は `pnpm --filter backend check-migrations` で検証する。
