---
description: Run optional package or repository validation.
argument-hint: "[repo|backend|frontend|<path>]"
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-claude-code contributors

Derived from https://github.com/affaan-m/everything-claude-code (MIT).
See .claude/THIRD_PARTY_LICENSES.md.
-->

# /quality-gate

広域検証が必要な場合に使う。提出時の変更ファイル検査は [shipping-misskey-change](../skills/shipping-misskey-change/SKILL.md)。

- `repo`: `pnpm --no-bail -r lint`、`pnpm check-dts`、backend / frontend の unit test。
- `backend` / `frontend`: `pnpm --filter <package> lint` と `pnpm --filter <package> test`。
- 単一ファイル: package root から `pnpm exec eslint --quiet -- <package-relative-path>`。

各コマンドを独立して実行し、失敗・未実行を含めて結果を報告する。既存失敗とする場合は base でも再現することを確認する。
backend の [テスト前提](../skills/working-on-backend/references/knowledge/backend-testing.md) に従う。
e2e / federation / UI 検証は変更に応じて選ぶ。
