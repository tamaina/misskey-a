# Storybook

共有 `Mk*` の story は同じ階層の `*.stories.impl.ts` に書く。`*.stories.ts` は生成物なので手編集・commit しない。
例は [MkButton.stories.impl.ts](../../../../../packages/features/ui/frontend/components/MkButton.stories.impl.ts)。
追加だけで表示されない場合は [.storybook/generate.tsx](../../../../../packages/frontend/.storybook/generate.tsx) の対象に含まれているか確認する (全 SFC の自動収集ではない)。
`pnpm --filter frontend storybook-dev` で表示・操作を確認する。視覚回帰には既存の Chromatic 検証がある。
