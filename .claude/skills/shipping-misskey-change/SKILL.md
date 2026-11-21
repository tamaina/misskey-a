---
name: shipping-misskey-change
description: Use when validating and submitting a change.
---

# 検証と提出

repo root で `node scripts/check-shipping.mjs --base origin/develop` を実行する。
変更ファイルの lint、SPDX、locale safety をまとめて検査する ([実装](../../../scripts/check-shipping.mjs))。
実装変更には最も近い test を実行する。docs-only の lint / 実装 test は対象がなければ省略できる。広域 lint / build / test は変更範囲や依頼に応じて選ぶ。

- API の公開 contract / schema 変更: [misskey-js 再生成](references/tasks/regenerate-misskey-js.md)。生成差分を commit に含める。公開型に影響せず差分がない場合もある。
- entity / migration 変更: `pnpm --filter backend check-migrations` (pending DDL なし)。新規 migration の `up()` / `down()` も検証する。
- backend test の前提: [backend-testing.md](../working-on-backend/references/knowledge/backend-testing.md)。frontend は [frontend-testing.md](../working-on-frontend/references/knowledge/frontend-testing.md)。

実行結果と未実行の理由を報告する。既存失敗を成功扱いせず、今回の変更との関係を示す。
操作の権限と CHANGELOG 方針は [AGENTS.md](../../../AGENTS.md) に従う。
