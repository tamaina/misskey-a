# Backend tests

repo root に `.config/test.yml` が必要。未作成なら [.github/misskey/test.yml](../../../../../.github/misskey/test.yml) をコピーする。既存の設定を上書きしない。
DB / Redis は [test/compose.yml](../../../../../packages/backend/test/compose.yml) を使う (テスト用ポート `54312` / `56312`)。開発用 `compose.local-db.yml` とは異なる。

- Unit: `pnpm --filter backend test`
- HTTP / DB e2e: `pnpm --filter backend test:e2e`
- Federation: `pnpm --filter backend test:fed`

変更に近いケースを選ぶ。設定・絞り込みは [package.json](../../../../../packages/backend/package.json) と `vitest.config.*.ts`、ヘルパーは [test/utils.ts](../../../../../packages/backend/test/utils.ts) を参照する。
e2e は既存の機能別ファイルに追加でき、describe 名の固定形式はない。
backend e2e のために `pnpm start:test` を別途起動する必要はない (テスト側がサーバーを管理する)。
