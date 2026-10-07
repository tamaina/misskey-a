# boot

クライアントとサーバーの起動、初期設定、更新のお知らせ、再読み込み、Service Workerの登録。起動時の設定とエラーの記録、サーバーの起動方法・終了処理をまとめる。

`backend/node/` は Node の entry・CLI・master/worker の実行と readiness・エラー処理を保持する。公開 bundle の entry/cli 名と起動時の設定・引数は backend package が管理する。
