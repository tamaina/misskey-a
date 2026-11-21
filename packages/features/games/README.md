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

## Fukushu の採点コア (#310)

`shared/fukushu-grading.ts` は [Fukushu](https://github.com/tamaina/fukushu/tree/0efee271a13f15096beb8cbaaea25092c5927b29) の `packages/app/src/domain/quiz/grading.ts` と、採点に必要な入力型を移植したもの。原著作権・MIT ライセンスは [FUKUSHU-LICENSE.txt](FUKUSHU-LICENSE.txt) に保持する。

単一・複数選択、真偽、短答、数値、組み合わせ問題の得点・正誤・フィードバックを計算する。複数選択の得点は正の配点の合計から計算し、誤った選択肢が含まれる場合は100点でも `correct: false` になる。Essay・Description・Flashcard は元の中立結果を返し、別途自己評価が必要。FSRS の評価や復習日時はこの関数で決定しない。

この段階では画面・公開 API・保存先には接続しない。Node/DOM、IndexedDB、GIFT/Anki ライブラリへの依存はない。既存の feature テスト収集対象である `test/fukushu-grading.test.mjs` は Node の TypeScript 対応でソースを直接読むため、単独で検証できる。

```sh
node --test packages/features/games/test/fukushu-grading.test.mjs
```

次の接続点は、サーバーに保存した問題の所有者を確認してからこの関数に渡す学習処理。問題集インポートは Drive を入口にし、バックアップは Misskey の方式に合わせる。元のアプリの IndexedDB 保存は持ち込まない。ライブラリの取り込み方針、DB スキーマ、API は別の小さな変更で扱う。

この関数は元のアプリと同じく、有効な問題・回答を前提とする。公開 API に接続する前に入力境界で問題・回答を実行時検証する（有限の配点、空でない問題、選択数・ID、`true`/`false`、空欄を数値ゼロとしないこと等）。フィードバックも未加工の内容を返すため、表示側は形式に応じたサニタイズが必要。今回の移植を入力検証や HTML の安全化として扱わない。
