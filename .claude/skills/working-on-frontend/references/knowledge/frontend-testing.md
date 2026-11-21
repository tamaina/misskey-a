# Frontend tests

- Unit: `pnpm --filter frontend test`。DB は不要。設定・対象指定は [frontend/package.json](../../../../../packages/frontend/package.json) と [vitest.config.ts](../../../../../packages/frontend/vitest.config.unit.ts) を参照する。
- UI / 視覚確認: [Storybook](storybook.md)。
- 主要 UI フロー: `pnpm e2e` (repo root)。[Playwright 設定](../../../../../packages/frontend/playwright.config.ts) と [CI の e2e 手順](../../../../../.github/workflows/test-frontend.yml) に従う。

Playwright はビルド済みアプリとテスト用 DB / Redis、`.config/test.yml` が必要。
[backend のテスト設定](../../../../../.github/misskey/test.yml) と [test/compose.yml](../../../../../packages/backend/test/compose.yml) を使う。開発用 DB と混同しない。
`pnpm e2e` が `start:test` とサーバー待機を行う。変更に近い検証を選び、前提が揃わない場合は未実行理由を報告する。
