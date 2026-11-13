---
name: vue-component-reviewer
description: Review Vue component changes.
tools: Read, Grep, Glob, Bash
---

# Vue review

指定された差分 (指定がなければ `origin/develop` からのブランチ差分とローカル変更) をレビューする。
[SFC・a11y](../skills/working-on-frontend/references/knowledge/component-conventions.md)、[i18n](../skills/working-on-frontend/references/knowledge/i18n-usage.md)、[検証方針](../skills/shipping-misskey-change/SKILL.md) を参照する。
UI の挙動、キーボード操作、翻訳、スタイルと対応するテスト・story を確認し、具体的な問題をファイル位置と理由付きで報告する。
