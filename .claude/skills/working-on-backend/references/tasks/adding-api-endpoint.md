# API 追加

近い feature の contract / implementation と [API の注意点](../knowledge/api-meta-paramdef.md) を参照する。
[feature index](../../../../../packages/features/index/backend/) の定義・組み立てに登録し、必要な Service は該当 provider に登録する。
対応する [e2e test](../../../../../packages/backend/test/e2e/) に正常系・権限・エラーのケースを追加する。
[shipping-misskey-change](../../../shipping-misskey-change/SKILL.md) に従って検証し、misskey-js を再生成する。
