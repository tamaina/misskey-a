# games

ゲーム、リバーシ、バブルゲーム、クリッカー、対局とゲームの設定。

## ゲーム単位の分離: 最初の確認用変更

`frontend/pages/games.vue` を `index/frontend/pages/index.vue` に移動した。
`index` はゲーム一覧の入口を所有する。`/games` の lazy loader だけを新しいパスへ向け、
画面本体・ゲームへのリンク・ゲスト閲覧・既存 CSS module の識別子は維持する。

| 今回の移動元 | 移動先 |
| --- | --- |
| `frontend/pages/games.vue` | `index/frontend/pages/index.vue` |

Reversi、bubble-game、clicker のファイルはまだ移動していない。
既存 `backend/index.ts`、`backend/services.ts`、API contract/implementation、モデル、
serializer、stream、DI の登録と公開 URL はそのまま使う。

## 確認後の候補（未実装）

- `reversi/{frontend,backend}`: Reversi の画面・サービス・モデル・serializer・stream・endpoint。
- `bubble-game/{frontend,backend}`: drop-and-fusion 画面とバブルゲーム記録・endpoint。
- `clicker/frontend`: 画面・widget・component・utility。
- `mahjong/{frontend,backend}`: 本家 PR #13112 の表示を参考にし、内部は
  `kobalab/majiang-core` に接続する。牌・副露・イベントを表示用データへ変換し、
  本家の別エンジンをそのまま取り込まない。

各移動では既存ホストの明示的な登録を更新し、URL/API 名・DI token・entity constructor の
同一性を保つ。公開 contract や schema を移す場合は SDK の参照も合わせて検証する。
ゲームごとの package.json、tsconfig、build 設定は作らない。

今回、main frontend の VVI・アイコン・型・lint・unit test の探索は既存階層と `games/*` の入れ子を扱えるようにした。
embed の除外は維持する。Storybook、settings/admin 検索、backend/shared/embed の探索は、
該当ファイルを移す段階で別途対応する。全ゲームの展開と麻雀本実装は今回の小変更への確認後。

追跡: #316。JUICE #304 の盆栽も後続では独立したゲーム所有先を検討する。

麻雀の後続では、core 内部の model / `_paipu` は全手牌を含むため、API・stream・観戦・
再接続へ直接公開しない。席別 DTO と秘匿の回帰検査を設計する。山と `kaiju` の起家選択の
両方で乱数方針を決め、既定ルール（東南戦・赤牌・ダブロン・聴牌連荘等）を未承認のまま
採用済みとは扱わない。参照: [majiang-core の固定版 Game](https://github.com/kobalab/majiang-core/blob/7e964296dd8eb5ff5a32f8182acdc6a0c2a81cbb/lib/game.js)。
