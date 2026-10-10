# i18n の注意点

翻訳の編集方針は [locales/README.md](../../../../../locales/README.md)。表示文言は [i18n.ts](../../../../../packages/features/runtime/frontend/i18n.ts) 経由で参照する。
引数なしは `i18n.ts`、`{name}` 等の置換は `i18n.tsx`。ICU MessageFormat は非対応。型生成を通しても置換漏れは画面で確認する。

- 既存キーを再利用し、新規追加は [adding-i18n-key.md](../tasks/adding-i18n-key.md) を参照する。`_lang_` は言語名用の予約キー。
- キーのリネームは翻訳を失うため、新キー追加・参照移行後に Crowdin の翻訳を待ち、旧キーは別 PR で削除する ([crowdin.yml](../../../../../crowdin.yml))。
- HTML を描画する場合、ユーザー入力を未エスケープで v-html に渡さない。
- Storybook は ja-JP の生成 locale を使うため他言語の検証はできない ([preload-locale.ts](../../../../../packages/frontend/.storybook/preload-locale.ts))。

型・実行時の詳細は [frontend-shared/js/i18n.ts](../../../../../packages/features/runtime/frontend/shared/i18n.ts) を参照する。
