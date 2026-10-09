# note-search

ノートのテキスト検索、SQL LIKE / Meilisearch の検索アダプター、検索条件と結果の公開範囲確認、ノート索引の登録・削除を担当する。

ノート作成・削除は notes、アカウント削除は users が担当し、検索の indexNote / unindexNote を呼び出す。検索タブ共通画面、ユーザー・設定検索、補完、ハッシュタグ検索とその正規化は discovery が担当する。
