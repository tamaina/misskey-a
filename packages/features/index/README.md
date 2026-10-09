# index

各機能をアプリ全体に組み込むための一覧。APIと公開する型、サーバーのサービス、クライアントのコンポーネント・ウィジェット・操作を登録する。個々の機能の実装はそれぞれのfeatureに置く。

`backend/endpoint-list.ts` と `backend/endpoints.ts` は公開 API の順序・metadata を、`backend/feature-providers.ts` と service provider 一覧は backend の実際の登録を保持する。portable な `backend/index.ts` から Nest の組み立ては読み込まない。
