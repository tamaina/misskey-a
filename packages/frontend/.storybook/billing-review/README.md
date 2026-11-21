# 課金画面のレビュー用 Storybook

#183 / #184 の実コンポーネントで、居住地未登録・登録済み・必須の州未選択と、未登録時のウォレット登録・購入・送金の開始制限を確認する。運営国による購入可否や送受信者の国の一致は未実装で、この story の対象外。

```sh
pnpm --filter frontend build-storybook-pre
pnpm --filter frontend exec storybook dev --config-dir .storybook/billing-review --host 127.0.0.1 -p 6006 --ci
```

通常の Storybook は旧 manager addon と現在の Storybook の互換性問題があるため、この限定設定では addon を読み込まない。既存の MSW、翻訳、Misskey コンポーネント・popup・theme の preview を共用する。backend 設定、DB、実アカウント、認証情報、ウォレットは不要。fixture は合成値で、書込み・署名・送金は例外になる。居住地の登録ボタンが有効な story でも登録処理自体は実行しない。

購入の story は play で「読み込む」を押す。送金は初期表示でウォレット・トークン・履歴・居住地を自動取得し、ボタンで再取得できる。RecipientWithoutWallet は実際の Misskey ユーザー選択ダイアログで合成のローカル受取人を選び、公開ウォレットがない案内を確認する。追加操作は読み取り用 fixture だけを使う。国の選択・登録画面の見た目は実 UI のまま。

別の端末で、既存の Playwright Chromium を使って撮影する（追加インストールはこの手順に含まない）。

```sh
cd packages/frontend
node .storybook/billing-review/capture.mjs
```

`CHROMIUM_EXECUTABLE` で既存 Chromium のパスを指定できる。`STORYBOOK_URL` は loopback のみ許可。出力先は引数で変更でき、既定は repo root の `.codex-local/billing-review-screenshots/`。desktop 1280×900 と mobile 幅390（viewport 390×844、全体撮影のため画像の高さは内容次第） の 14 PNG と `captions.json` を生成する。ブラウザーエラー・翻訳済みボタン・登録制限・横方向のはみ出しを確認し、外部 URL へのリクエストは遮断する。画像は生成物なので commit しない。

国の選択肢は ISO コードと画面言語での国名を併記する（例: ja-JP では JP / 日本、US / アメリカ合衆国）。国名はブラウザー標準の Intl.DisplayNames を使用し、保存・API 値は従来の ISO コードのまま。
