# misskey-js 再生成

API 追加、公開 contract / schema 変更後は repo root で `pnpm build-misskey-js-with-types` を実行する。
生成された `packages/misskey-js/src/autogen/` の差分を確認し、commit に含める。公開型に影響しない変更なら差分がない場合もある。
生成手順の実体は [package.json](../../../../../package.json) と [generator の文書](../../../../../packages/misskey-js/generator/README.md)。
