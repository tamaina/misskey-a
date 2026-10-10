# Locale 変更

手動編集は [ja-JP.yml](../../../../../locales/ja-JP.yml) のみ。既存の関連セクションと命名に合わせる。
`pnpm --filter i18n generate` で型を生成し、frontend の変更に近い test / lint で確認する。
パラメータ、リネーム、HTML の注意点は [i18n-usage.md](../knowledge/i18n-usage.md)。生成手順は [i18n/package.json](../../../../../packages/i18n/package.json) を参照する。
