# Third-Party Licenses (`.claude/`)

`.claude/` 配下に取り込まれているサードパーティ由来コンポーネントのライセンス・出典情報をまとめる。Misskey 本体は AGPL-3.0-only だが、本ディレクトリ内には MIT ライセンスのファイルが含まれている。各ファイル冒頭にも `SPDX-License-Identifier` と出典コメントを併記している。

---

## 1. everything-claude-code (ECC)

- 上流リポジトリ: <https://github.com/affaan-m/everything-claude-code>
- 取り込んだバージョン: v2.0.0-rc.1
- ライセンス: **MIT**
- Copyright: Copyright (c) 2026 Affaan Mustafa

### 取り込んだファイル

| `.claude/` 内のパス | 上流パス | 上流由来 | Misskey での改変 |
|---|---|---|---|
| `skills/context-budget/SKILL.md` | `skills/context-budget/SKILL.md` | ECC | 文書量の概算と重複確認に簡素化 |
| `commands/harness-audit.md` | `commands/harness-audit.md` | ECC | 重複・古いリンク・過剰な指示の確認に簡素化 |
| `commands/quality-gate.md` | `commands/quality-gate.md` | ECC | Misskey の任意の広域検証に簡素化 |

### MIT License (full text)

```
MIT License

Copyright (c) 2026 Affaan Mustafa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 上流 LICENSE ファイル

<https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE>
