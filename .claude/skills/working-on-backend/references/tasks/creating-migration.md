# Migration

マージ済みの migration は変更しない。新しいタイムスタンプの ESM JS を [migration/](../../../../../packages/backend/migration/) に追加し、`up()` / `down()` を実装する。
生成 SQL の余分な変更やデータ損失を確認する。[CONTRIBUTING.md](../../../../../CONTRIBUTING.md) と [DDL の注意点](../knowledge/typeorm-patterns.md) を参照する。

```bash
pnpm --filter backend exec typeorm migration:generate -d ormconfig.js -o --esm migration/<Name>
# 空雛形だけなら (DB / build 不要)
pnpm --filter backend exec typeorm migration:create -o --esm migration/<Name>
```

`generate` は現在の entity のビルドとローカル DB が必要。補助 [prepare-generate.mjs](../../scripts/prepare-generate.mjs) はビルドと開発用 DB の起動を行うので、内容と対象設定を確認して使う。
`create` の雛形には `name` がないため、既存 migration に合わせてクラス名と同じ値を追加する。

`pnpm --filter backend check-migrations` で pending DDL がないことを確認する。
ローカルの検証用 DB で適用 → 巻き戻し → 再適用を確認する (`pnpm migrate` / `pnpm revert`)。不可逆のデータ変換はその制約を明記する。
