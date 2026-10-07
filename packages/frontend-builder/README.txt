This package contains the common scripts that are used to build the frontend and frontend-embed packages.

現在は main / embed の旧翻訳処理を支えるビルド専用パッケージです。
LocaleInliner、unref(i18n) の除去、そのログと検証補助を Node / Vite / Rolldown 上で実行します。
main と embed の VVI 移行、loader の言語別ディレクトリ書き換えの廃止が完了したら削除します。
旧 inliner を使う一致検証には凍結した証拠かテスト専用の参照を残し、通常の Vite build は各アプリの package 側に保持します。
Service Worker 向けの i18n JSON 出力は別の役割として扱います。
