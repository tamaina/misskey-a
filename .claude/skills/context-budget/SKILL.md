---
name: context-budget
description: Estimate agent documentation context cost when requested.
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-claude-code contributors

Derived from https://github.com/affaan-m/everything-claude-code (MIT).
See .claude/THIRD_PARTY_LICENSES.md.
-->

# Context budget

依頼された範囲の AGENTS.md / CLAUDE.md / skills / agents / commands を調べ、ファイル別のサイズと重複を報告する。
必要なら文字数から概算 token 数を出すが、実際のモデルやツール schema の消費量と区別する。
古い説明や不要な重複を具体的に示す。ユーザー環境のプラグイン・モデル構成を推測で決めつけない。
