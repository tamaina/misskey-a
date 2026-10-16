# Misskey-a: agent instructions

開発・PR の対象は `develop`。一般の開発規約は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## 作業範囲と権限

- PR の前に対応する Issue が必要。既存 Issue を確認し、なければ先に起票する。Issue / PR はリポジトリの [テンプレート](.github/) を使い、簡潔に記載する。
- commit / PR / 外部送信はユーザーが依頼した範囲で行う。PR の merge / close / force-push は明示指示が必要。
- 共有ブランチ (`main` / `develop` / `master`) へ force-push しない。プッシュ済み・マージ済みの履歴や他人のブランチを破壊せず、hook をスキップしない。ユーザーの Git 設定を無断変更しない。
- secrets / 認証情報をコミットしない。脆弱性の報告は通常の Issue / PR ではなく [非公開の報告窓口](https://github.com/misskey-dev/misskey/security/policy) を案内する。
- リリースには既存の [Release Manager Action](.github/workflows/release-with-dispatch.yml) を使う。
- `CHANGELOG.md` は明示依頼時だけ編集する。利用者に影響する変更では候補を引き継ぎに一行示す。

## プロジェクト固有の注意

- locale YAML の手動編集は `locales/ja-JP.yml` のみ。他言語は Crowdin 管理 ([locales/README.md](locales/README.md))。
- マージ済 migration は変更せず、新しいタイムスタンプの migration に `up()` / `down()` を実装する。
- 新規コードのライセンスヘッダーは [SPDX 検査](scripts/check-spdx.mjs) に従う。`packages/misskey-js` は MIT なので AGPL ヘッダーを一律に付けない。

## 検証

変更に近い test と変更ファイルの lint を実行し、結果・未実行の理由を短く報告する。
[shipping-misskey-change](.claude/skills/shipping-misskey-change/SKILL.md) に検証コマンドをまとめている。
backend / frontend の補足は [.agents/skills/](.agents/skills/) から必要なものを参照する。
