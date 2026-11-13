# i18n の注意点

翻訳の編集方針は [locales/README.md](../../../../../locales/README.md)。現行 SFC の文言は近い既存実装の VVI `$locale.sfc` に合わせる。
legacy [i18n.ts](../../../../../packages/features/runtime/frontend/i18n.ts) を使う箇所では、引数なしは `i18n.ts`、置換は `i18n.tsx` (ICU MessageFormat 非対応)。

- 既存キーを再利用し、新規追加は [adding-i18n-key.md](../tasks/adding-i18n-key.md) を参照する。`_lang_` は言語名用の予約キー。
- キーのリネームは翻訳を失うため、新キー追加・参照移行後に Crowdin の翻訳を待ち、旧キーは別 PR で削除する ([crowdin.yml](../../../../../crowdin.yml))。
- HTML を描画する場合、ユーザー入力を未エスケープで v-html に渡さない。
- Storybook は ja-JP の生成 locale を使うため他言語の検証はできない ([preload-locale.ts](../../../../../packages/frontend/.storybook/preload-locale.ts))。

型・実行時の詳細は [frontend-shared/js/i18n.ts](../../../../../packages/features/runtime/frontend/shared/i18n.ts) を参照する。
