# VVI virtual / inline-chunks 比較（2026-10-08）

現行本番の **virtual を維持する暫定提案**。採用決定ではなく、[Issue #6](https://github.com/tamaina/misskey-a/issues/6) は open のままとする。inline は現行 wrapper 込みの配布物を小さくするが、main のビルド時間と cold 読込の転送に不利があり、誤 preload の MIME エラーが残る。旧 wrapper を除去した後の比較は未実施で、[#7](https://github.com/tamaina/misskey-a/issues/7) の整理後に採用判断を再確認する。

測定元は `4a208034` に canonical entry 修正 `47cb5466` と隔離プロトタイプを重ねたもの。[測定 JSON](vvi-benchmark/measurements.json)、[実験パッチ](vvi-benchmark/prototype.patch) を保存した。本番の方式・VVI 本体・インストール済み依存は変更せず、誤 preload のフィルターも加えていない。プロトタイプの SSR adapter は VVI 1.1.3 で観測した metadata に依存し、保証された汎用 SSR API として扱わない。

## ビルド：各条件6回の新規プロセス、計24回

Node 24.18.0、Vite 8.2.2、VVI 1.1.3、Vue 3.5.42、Rolldown 1.2.6。i7-10510U（8 logical CPUs）、RAM 約15.0 GiB、Node heap 2048 MiB。条件の順を反転・入れ替えて直列実行した。以前の内部名は cold/warm だが、全回の build 後に cacheDir の持続ファイルは0だった。**warm build cache の比較ではない**。全回は新規プロセス・出力再作成で、OS page cache は未制御・未冷却。機械の cold 起動性能とは解釈しない。

| 条件 | Vite 中央値 | wrapper 中央値 | 合計中央値（範囲） | 最大 process RSS 中央値 |
| --- | ---: | ---: | ---: | ---: |
| main virtual | 20.11 s | 5.45 s | 25.70 s（24.68–27.35） | 2959 MiB |
| main inline | 47.33 s | なし | 47.33 s（46.90–47.97） | 2743 MiB |
| embed virtual | 1.96 s | 0.91 s | 2.88 s（2.81–3.30） | 612 MiB |
| embed inline | 2.24 s | なし | 2.24 s（2.23–2.35） | 665 MiB |

合計中央値は各回の Vite＋wrapper を集計した値で、列の中央値同士の和とは限らない。成果物保存・コピーの時間は除外。RSS は `/usr/bin/time` の process 統計で、ホスト全体の同時使用量ではない。

main の検索データ準備は両方式共通で **14.92 s、最大 RSS 1690732 KiB**（別枠1回）だった。毎ビルド再生成する利用者の合計にはこの14.92 sを加える（今回の観測なら main 約40.62 / 62.25 s）。入力不変で再利用するときだけ償却できる。embed にはこの準備は不要。準備を省いた比較値を、そのまま利用者の全ビルド時間とはしない。

## Vite 原出力と現行配布物を区別する

MB は10^6 bytes。全言語・全ファイルの論理サイズ。テキストを gzip level 9 / Brotli quality 5で圧縮し、画像・フォント等は raw のまま。ネットワークの HTTP header は含まない。

| 条件・段階 | raw | gzip | Brotli | ファイル数 |
| --- | ---: | ---: | ---: | ---: |
| main virtual：Vite 原出力 | 17.27 MB | 6.00 MB | 5.52 MB | 825 |
| main virtual：wrapper 後 | 441.28 MB | 124.42 MB | 111.07 MB | 15749 |
| main inline：Vite＝最終出力 | 116.35 MB | 35.69 MB | 33.63 MB | 10272 |
| embed virtual：Vite 原出力 | 1.33 MB | 1.00 MB | 0.99 MB | 48 |
| embed virtual：wrapper 後 | 18.83 MB | 6.68 MB | 6.36 MB | 1084 |
| embed inline：Vite＝最終出力 | 5.86 MB | 2.26 MB | 2.18 MB | 99 |

**441 MB は virtual 固有のコストではない。** 現行 `LocaleInliner` の28言語別生成が main に約424.00 MB、embed に約17.50 MBを追加した。SHA-256で同一内容の追加コピーを数えると、virtual 最終出力には main 13413ファイル／388.97 MB、embed 952ファイル／10.72 MBの完全重複がある（unique 内容を1回だけ残した場合との差。実際の配信を dedup した値ではない）。inline は wrapper を実験的に迂回したため、現行配布物の差にはこの交絡がある。virtual の Vite 原出力の方が小さく、wrapper-free virtual の実ホスト適合性は別途検証が必要。

24回の最終出力は正しさを確認した成果物と全ファイルがバイト一致した。

## ブラウザで確認した範囲

Chrome 151、1280×720、CPU/network throttling なし。実際の HTML service/templates、bootloader、ビルド成果物を使用し、Meta/API/SSR の note/user/clip は合成 fixture。**全 backend／DB の起動試験ではない**。SW/streaming は未提供で、そのエラーを記録した。認証後・管理画面、他ブラウザ、実運用 CSP/SRI の網羅試験ではない。

- 通常系208条件：main home/about/explore/note と embed note/user-timeline/clip/tag の32条件、main home＋embed note の28言語×両方式112条件、gzip/Brotli＋HTTP cache の64条件。表示テキスト・保存翻訳・layout・画像 decode が一致し、embed の icon font も読み込めた。
- 208条件に故障注入・言語変更は含まれない。追加で4 app/mode条件×4シナリオ＝16を確認した（28 document navigations）。entry 取得失敗、virtual の辞書／inline の翻訳を含む application chunk の取得失敗、実際の再読込ボタンによる復帰、保存言語 ja→fr の変更、unsupported 保存言語から browser ja への fallback を確認。最初の2シナリオは失敗＋再試行の組で数える。
- 言語変更は両方式とも保存値の変更＋**全 document reload**。in-place runtime switching を測ったものではない。SPA内遷移は未測定で、各 route は直接 document navigation。初回の翻訳読込失敗で保存済みラベルがない状態の fallback 表示は別途未網羅。
- 検索は元の virtual 抽出と34 SFC／342項目／393式を照合し、生成済みモジュールでも両方式の28言語を比較した。ID・階層・path・keyword・raw文字列が一致。任意式の eval は使っていない。
- virtual の emitted primary 辞書は main 416／embed 17 modules で、他 host の locale module は0。両方式は別 scan・別出力で全28言語の画面を確認したが、inline 全 payload の byte-level 所有権証明ではない。

CLS は recent input を除き、最大5秒・間隔1秒の session-window最大値を、mount 後1600 msまでの shift から計算した。代表条件では main **0–0.000294922**、embed **0.000062579–0.008227049**。28言語の home は0、embed note は0.000062579。追加の再読込式言語変更は main 0、embed 0.000062579（各方式1回）。意味のある方式差は観測しなかったが、少数 fixture の短い観測であり、長い操作セッション／field p75／in-place switch の評価ではない。

## 誤 preload を残した転送結果

VVI 1.1.3 の build 処理 `collectPreloadDependencies` が `importedAssets` を JS/CSS preload 配列へ入れ、標準 Vite helper が CSS以外を module script として要求する。アダプターなしの最小例でも再現し、通常の画像 decode・font読込は成功した。既存 Misskey の Vue subrequest guard と別の欠点で、stock VVI の結果と guard付き host の成功を混同しない。

例は日本語 main home／embed note。最初はブラウザキャッシュなし。後者は同じ context の次の document。Vite text に gzip9 とリポジトリ同様の `max-age=2592000, immutable` を設定。HTML/API/fixture画像は identity、実際の CDP 転送量（header等を含む）である。

| 条件 | cold 全転送 | 次 document 全転送 | 誤 script要求／MIME error |
| --- | ---: | ---: | ---: |
| main virtual | 0.729 MB | 0.063 MB | 0／0 |
| main inline | 1.473 MB | 0.067 MB | 5／5 |
| embed virtual | 0.139 MB | 0.026 MB | 0／0 |
| embed inline | 0.975 MB | 0.027 MB | 3／3 |

Brotli5でも cold main 約0.680／1.437 MB、embed 約0.134／0.971 MB。cache がある次 document では誤要求に帰属する転送は0でも MIME エラーは残った。正しい媒体要求が同じ response を cache再利用することもあり、誤要求の byte全量を常に追加の無駄とは数えない。非圧縮・cache headerなしの最小例で得た843019 bytesは、その fixtureだけの値で一般化しない。初回JS、CSS、通常媒体、誤要求、圧縮、cache hitは JSON で別集計した。

## 再現と残る判断

[準備スクリプト](vvi-benchmark/reproduce.py) と [実行 tools](vvi-benchmark/tools/) は、新しい所有 workspace に隔離ソースを作る。対応 revision の依存と SDK／icons／i18n等の前提 build を用意し、同じ版を確認する。共有 `node_modules` をリンクした snapshot 内で install／package manager を実行しない。実験は本番に適用しない。

```sh
python3 docs/architecture/vvi-benchmark/reproduce.py /tmp/misskey-vvi-run --checkout .
cd /tmp/misskey-vvi-run
python3 adapter/prepare-search-helper.py
NODE_OPTIONS=--max-old-space-size=2048 node source/packages/frontend/node_modules/tsx/dist/cli.mjs adapter/materialize-search.mts
# frontend / frontend-embed × virtual / inline-chunks を各1回、同じfresh phaseへ。
EXPERIMENT_PHASE=runs-corrected python3 run-adapter-smoke.py frontend virtual
# 残る3条件を同じ方法で実行後:
(cd source/packages/backend && node ../../../adapter/bundle-html.mts)
node adapter/browser-benchmark.mjs representative-mime
BROWSER_SCOPE=parity node adapter/browser-benchmark.mjs locales28-mime
node adapter/browser-resilience.mjs resilience
node adapter/measure-assets.mjs
MEASURE_STAGE=vite-output node adapter/measure-assets.mjs
python3 adapter/run-benchmark.py
BROWSER_SCOPE=cache BROWSER_CACHE_HEADERS=production BROWSER_ENCODING=gzip node adapter/browser-benchmark.mjs cache-gzip
BROWSER_SCOPE=cache BROWSER_CACHE_HEADERS=production BROWSER_ENCODING=br node adapter/browser-benchmark.mjs cache-br
```

既存結果を上書きしない新規 workspace が前提。reproduce用コマンドは今回の固定入力・プロトタイプを再構成するもので、通常 `pnpm build` の本番設定切替手順ではない。再測定時には原出力・wrapper後・共通準備を分け、cacheが実在するかを記録する。

次は #7 の責務分離：feature locale／boot labels、言語一覧と fallback、Vueを含まないversion付きSW JSON、旧資産互換性、既存比較テストの検証能力を維持した wrapper退役設計。方式選択やパッケージ削除を先行させない。
