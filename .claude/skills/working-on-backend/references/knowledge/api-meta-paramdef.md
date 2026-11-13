# API の注意点

現在の API は feature 側の contract / implementation と [共通 transport](../../../../../packages/features/api/backend/transport/) を参照する。旧 `meta` / `paramDef` / `Endpoint` の雛形を新規追加の手本にしない。

認証・OAuth scope・管理者権限・rate limit を操作に合わせる。ロールポリシーはクライアント入力を信用せずサーバー側で取得する。
業務エラーと想定外の内部例外を区別し、正常系・権限・エラーのテストで互換性を確認する。
公開 contract / schema を変えたら [misskey-js を再生成](../../../shipping-misskey-change/references/tasks/regenerate-misskey-js.md)する。
具体的な型・middleware の組み合わせは [api-procedure.ts](../../../../../packages/features/api/backend/transport/api-procedure.ts) と近い既存 contract に従う。
