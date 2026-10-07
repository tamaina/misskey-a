# operations

ジョブキュー、連合のジョブキュー、データベース、オブジェクトストレージ。管理画面とサーバーの運用操作・状態の確認を担当する。

`backend/jobs/CleanProcessorService.ts` は既存の IP 履歴・アンテナ・期限付き role・Reversi の定期掃除を保持する。`backend/utility/reset-db.ts` は渡された DB のデータを削除する運用 helper で、検証は使い捨てテスト DB に限定する。
