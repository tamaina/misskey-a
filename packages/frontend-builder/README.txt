This package contains shared build-time validation helpers for the frontend and frontend-embed packages.

collectModifications は旧 i18n ラベル参照を解析し、facade 検出と logger とともに
main / embed の Vite build で旧ラベルを拒否するガードを支えます。
ファイルの読み書き、翻訳の埋め込み、言語別 JavaScript の生成は行いません。
通常の Vite build と host locale entry map は各アプリの package 側に保持します。
YAML / fallback / 型生成と Service Worker 向けの versioned locale JSON 出力は
packages/i18n が担当し、現在の SW と起動 loader が利用します。
