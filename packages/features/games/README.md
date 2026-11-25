# games

ゲーム、リバーシ、バブルゲーム、クリッカー、対局とゲームの設定。

## ゲーム単位の所有境界

`frontend/pages/games.vue` を `index/frontend/pages/index.vue` に移動した。
`index` はゲーム一覧の入口を所有する。`/games` の lazy loader だけを新しいパスへ向け、
画面本体・ゲームへのリンク・ゲスト閲覧・既存 CSS module の識別子は維持する。

| 移動元 | 移動先 |
| --- | --- |
| `frontend/pages/games.vue` | `index/frontend/pages/index.vue` |
| `backend/{index.ts,api.implementation.ts,endpoints/games.contract.ts}` | `index/backend/`（ゲームの合成入口） |
| `frontend/pages/reversi/*` | `reversi/frontend/pages/*` |
| `backend/endpoints/reversi/*` | `reversi/backend/endpoints/*` |
| Reversi の model/schema/serializer/service/stream/template と `backend/services.ts` | `reversi/backend/`（元の分類を維持） |
| `frontend/pages/drop-and-fusion*.vue` | `bubble-game/frontend/pages/` |
| `backend/endpoints/bubble-game/*` と `backend/models/BubbleGameRecord.ts` | `bubble-game/backend/endpoints/` と `bubble-game/backend/models/` |
| clicker の page/component/widget/utility | `clicker/frontend/`（元の分類を維持） |

`/games`・`/reversi`・`/reversi/g/:gameId`・`/bubble-game`・`/clicker` の URL、
API 名、stream 名、保存する JSON / DB table / column、clicker の registry scope は変えない。
既存クラスを移動し、ホストの import を一つの定義へ向けることで DI token と entity の
constructor identity を維持する。旧場所に複製クラスや再登録は作らない。

## 構成と後続作業

- `reversi/{frontend,backend}`: Reversi の画面・サービス・モデル・serializer・stream・endpoint。
- `bubble-game/{frontend,backend}`: drop-and-fusion 画面とバブルゲーム記録・endpoint。
- `clicker/frontend`: 画面・widget・component・utility。
- `mahjong/{frontend,backend}`: 本家 PR #13112 の表示を参考にし、内部は
  `kobalab/majiang-core` に接続する。牌・副露・イベントを表示用データへ変換し、
  本家の別エンジンをそのまま取り込まない。

各移動では既存ホストの明示的な登録を更新し、URL/API 名・DI token・entity constructor の
同一性を保つ。公開 contract や schema を移す場合は SDK の参照も合わせて検証する。
ゲームごとの package.json、tsconfig、build 設定は作らない。

main frontend の VVI・アイコン・型・lint・unit test、および backend の型・lint・bundle・watch と
Storybook の探索は既存階層と `games/*` の入れ子を扱う。embed の除外は維持する。
ゲームの settings/admin/shared/embed ファイルは今回存在しないため、その探索は広げていない。
ユーザーの確認を受けて一覧から既存3ゲームへ展開した。麻雀は以下の境界と Issue #316 に従う。

追跡: #316。JUICE #304 の盆栽も後続では独立したゲーム所有先を検討する。

麻雀の後続では、core 内部の model / `_paipu` は全手牌を含むため、API・stream・観戦・
再接続へ直接公開しない。席別 DTO と秘匿の回帰検査を設計する。山と `kaiju` の起家選択の
両方で乱数方針を決め、既定ルール（東南戦・赤牌・ダブロン・聴牌連荘等）を未承認のまま
採用済みとは扱わない。参照: [majiang-core の固定版 Game](https://github.com/kobalab/majiang-core/blob/7e964296dd8eb5ff5a32f8182acdc6a0c2a81cbb/lib/game.js)。
