<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
Seat/felt presentation adapted from upstream PR #13112; see ../../README.md.
-->
<template>
<div :class="$style.table">
	<div v-if="view.snapshot" :class="$style.summary">
		<strong>{{ ['東', '南', '西', '北'][view.snapshot.roundWind] }} {{ view.snapshot.handNumber + 1 }}{{ $locale.sfc.hand }} · {{ view.snapshot.honba }}{{ $locale.sfc.honba }}</strong>
		<span>{{ $locale.sfc.remaining }} {{ view.snapshot.remainingTiles }} · {{ $locale.sfc.riichiSticks }} {{ view.snapshot.riichiSticks }}</span>
		<div>{{ $locale.sfc.dora }} <Tile v-for="(tile, i) in view.snapshot.doraIndicators" :key="i" :tile="tile"/></div>
	</div>
	<div :class="$style.seats">
		<section v-for="entry in seats" :key="entry.seat.userId" :class="[$style.seat, { [$style.turn]: entry.index === view.snapshot?.turnSeat, [$style.mine]: entry.seat.userId === userId }]">
			<header><strong>{{ ['東', '南', '西', '北'][entry.index] }} · {{ names[entry.seat.userId] ?? entry.seat.userId }}</strong><b>{{ entry.seat.score.toLocaleString() }}</b></header>
			<div :class="$style.tiles" :aria-label="$locale.sfc.handTiles">
				<Tile v-for="(tile, i) in entry.seat.concealedHand ? handTiles(entry.seat.concealedHand) : Array(entry.seat.concealedCount).fill('_')" :key="i" :tile="tile"/>
			</div>
			<div v-for="(meld, i) in entry.seat.melds" :key="`meld-${i}`" :class="$style.meld"><Tile v-for="(tile, j) in handTiles(meld)" :key="j" :tile="tile"/></div>
			<div :class="$style.river" :aria-label="$locale.sfc.discards">
				<span v-for="(tile, i) in entry.seat.discards" :key="i" :class="{ [$style.riichi]: tile.includes('*'), [$style.called]: /[+=-]/.test(tile) }"><Tile :tile="tile.slice(0, 2)"/></span>
			</div>
		</section>
	</div>
	<div v-if="view.outcome" :class="$style.notice">{{ view.outcome.winner !== null ? names[view.users[view.outcome.winner]] : view.outcome.name }} {{ view.outcome.points || '' }} {{ view.outcome.yaku.join(' · ') }}</div>
	<div v-if="view.status === 'ended'" :class="$style.notice">{{ $locale.sfc.ended }}</div>
	<div v-else :class="$style.notice" aria-live="polite">
		<span v-if="view.phase?.kind === 'hule'">{{ $locale.sfc.win }}</span><span v-else-if="view.phase?.kind === 'pingju'">{{ $locale.sfc.draw }}</span>
		<span v-else-if="view.phase?.submitted">{{ $locale.sfc.waiting }}</span><span v-else>{{ $locale.sfc.choose }}</span>
		<span v-if="view.phase"> · {{ seconds }}{{ $locale.sfc.seconds }}</span>
	</div>
	<div v-if="view.phase && !view.phase.submitted" :class="$style.actions">
		<button v-for="action in view.phase.actions" :key="action.id" type="button" :disabled="busy || seconds === 0" :class="$style.action" @click="$emit('action', action.id)">
			<span>{{ $locale.sfc[action.kind] }}</span>
			<span v-if="action.tiles"><Tile v-for="(tile, i) in handTiles(action.tiles)" :key="i" :tile="tile"/></span>
		</button>
	</div>
</div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { handTiles } from '../../shared/hand.js';
import Tile from './Tile.vue';
import type { MahjongView } from '../../shared/view.schema.js';
const props = defineProps<{ view: MahjongView; userId: string; names: Record<string, string>; busy: boolean; seconds: number }>();
defineEmits<{ action: [id: string] }>();
const seats = computed(() => props.view.snapshot?.seats.map((seat, index) => ({ seat, index })).sort((a, b) => Number(a.seat.userId === props.userId) - Number(b.seat.userId === props.userId)) ?? []);
</script>
<locale locale="ja-JP" lang="json">
{"hand":"局","honba":"本場","remaining":"残り","riichiSticks":"供託","dora":"ドラ表示牌","handTiles":"手牌","discards":"捨て牌","ended":"対局終了 — 牌譜は公開されません","waiting":"他の参加者の操作を待っています","choose":"操作を選んでください","seconds":"秒","discard":"打牌","riichi":"リーチ","chi":"チー","pon":"ポン","kan":"カン","win":"和了","draw":"流局","pass":"見送る","continue":"次へ"}
</locale>
<style module>
.table { padding: 20px; border-radius: 16px; background: radial-gradient(ellipse at top, #286a61, #143e39); color: #fff; box-shadow: inset 0 0 0 1px #ffffff20; }
.summary { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; padding: 4px 0 20px; }
.summary > strong { font-size: 1.2em; }
.seats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.seat { min-width: 0; padding: 12px; border: 2px solid transparent; border-radius: 10px; background: #0003; }
.seat > header { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 12px; font-size: .85em; overflow-wrap: anywhere; }
.turn { border-color: #f6d78c; }
.mine { background: #ffffff12; }
.tiles { display: flex; flex-wrap: wrap; gap: 1px; }
.meld { display: inline-flex; margin: 8px 8px 0 0; }
.river { display: grid; grid-template-columns: repeat(6, 30px); gap: 2px; min-height: 48px; padding-top: 12px; }
.riichi { rotate: 90deg; }
.called { opacity: .4; }
.notice { text-align: center; padding: 20px 0 12px; font-weight: bold; }
.actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.action { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 8px 12px; border: 1px solid #fff5; border-radius: 8px; color: #fff; background: #0003; cursor: pointer; font: inherit; }
.action:hover:not(:disabled), .action:focus-visible { background: #ffffff25; outline: 2px solid #f6d78c; }
.action:disabled { opacity: .5; cursor: default; }
@media (max-width: 600px) { .table { padding: 10px; } .seats { grid-template-columns: 1fr; } .seat { padding: 10px; } .tiles { flex-wrap: nowrap; } .tiles > * { flex: 0 1 30px; min-width: 0; } .summary { gap: 8px; font-size: .85em; } }
</style>
