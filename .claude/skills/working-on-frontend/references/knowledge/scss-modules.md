# スタイル

新規スタイルは SCSS Modules。テーマの色をハードコードせず `--MI_THEME-*`、共通寸法は `--MI-*` を使う。
定義は [theme.ts](../../../../../packages/features/preferences/frontend/theme.ts) と [style.scss](../../../../../packages/frontend/src/style.scss)、開発規約は [CONTRIBUTING.md](../../../../../CONTRIBUTING.md)。
`_button` / `_panel` 等の共通 class は style.scss の実装を確認して使う。共有コンポーネント自身の margin は避け、配置側で設定する。
