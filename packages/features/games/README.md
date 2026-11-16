# games

ゲーム、リバーシ、バブルゲーム、クリッカー、対局とゲームの設定。

## Fukushu の採点コア (#310)

`shared/fukushu-grading.ts` は [Fukushu](https://github.com/tamaina/fukushu/tree/0efee271a13f15096beb8cbaaea25092c5927b29) の `packages/app/src/domain/quiz/grading.ts` と、採点に必要な入力型を移植したもの。原著作権・MIT ライセンスは [FUKUSHU-LICENSE.txt](FUKUSHU-LICENSE.txt) に保持する。

単一・複数選択、真偽、短答、数値、組み合わせ問題の得点・正誤・フィードバックを計算する。複数選択の得点は正の配点の合計から計算し、誤った選択肢が含まれる場合は100点でも `correct: false` になる。Essay・Description・Flashcard は元の中立結果を返し、別途自己評価が必要。FSRS の評価や復習日時はこの関数で決定しない。

この段階では画面・公開 API・保存先には接続しない。Node/DOM、IndexedDB、GIFT/Anki ライブラリへの依存はない。既存の feature テスト収集対象である `test/fukushu-grading.test.mjs` は Node の TypeScript 対応でソースを直接読むため、単独で検証できる。

```sh
node --test packages/features/games/test/fukushu-grading.test.mjs
```

次の接続点は、サーバーに保存した問題の所有者を確認してからこの関数に渡す学習処理。問題集インポートは Drive を入口にし、バックアップは Misskey の方式に合わせる。元のアプリの IndexedDB 保存は持ち込まない。ライブラリの取り込み方針、DB スキーマ、API は別の小さな変更で扱う。

この関数は元のアプリと同じく、有効な問題・回答を前提とする。公開 API に接続する前に入力境界で問題・回答を実行時検証する（有限の配点、空でない問題、選択数・ID、`true`/`false`、空欄を数値ゼロとしないこと等）。フィードバックも未加工の内容を返すため、表示側は形式に応じたサニタイズが必要。今回の移植を入力検証や HTML の安全化として扱わない。
