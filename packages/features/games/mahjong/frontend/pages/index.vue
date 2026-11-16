<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<div class="_gaps">
			<header><h1>{{ $locale.sfc.title }}</h1><p>{{ $locale.sfc.description }}</p></header>
			<p v-if="error" role="alert" :class="$style.error">{{ error }} <button type="button" class="_textButton" @click="refresh">{{ $locale.sfc.retry }}</button></p>
			<details class="_panel" :class="$style.rules">
				<summary>{{ $locale.sfc.rulesTitle }} · {{ ruleVersion }}</summary>
				<p>{{ $locale.sfc.timeouts }}</p><p>{{ $locale.sfc.points }}</p><p>{{ $locale.sfc.abortPolicy }}</p>
				<dl><template v-for="(value, key) in rules" :key="key"><dt>{{ key }}</dt><dd>{{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}</dd></template></dl>
			</details>
			<template v-if="!roomId">
				<section class="_panel _gaps" :class="$style.lobby">
					<h2>{{ $locale.sfc.invite }}</h2>
					<div class="_buttons"><MkButton v-for="slot in [0, 1, 2]" :key="slot" :disabled="busy" @click="pick(slot)">{{ invitees[slot]?.username ?? $locale.sfc.select }}</MkButton></div>
					<MkButton primary :disabled="busy || invitees.filter(Boolean).length !== 3" @click="create">{{ $locale.sfc.create }}</MkButton>
				</section>
				<section class="_panel _gaps" :class="$style.lobby">
					<h2>{{ $locale.sfc.rooms }}</h2>
					<p v-if="rooms.length === 0">{{ $locale.sfc.noRooms }}</p>
					<MkA v-for="room in rooms" :key="room.id" :to="`/mahjong/${room.id}`" :class="$style.roomLink">{{ $locale.sfc[room.status] }} · {{ room.users.map(id => names[id] ?? id).join(' / ') }}</MkA>
				</section>
			</template>
			<template v-else-if="view">
				<MkA to="/mahjong">← {{ $locale.sfc.rooms }}</MkA>
				<section v-if="view.status === 'waiting'" class="_panel _gaps" :class="$style.lobby">
					<h2>{{ $locale.sfc.waiting }}</h2><p>{{ $locale.sfc.consent }}</p>
					<ul><li v-for="(id, i) in view.users" :key="id">{{ names[id] ?? id }} · {{ view.ready[i] ? $locale.sfc.ready : $locale.sfc.notReady }}</li></ul>
					<div class="_buttons"><MkButton primary :disabled="busy || view.ready[view.users.indexOf($i!.id)]" @click="ready">{{ $locale.sfc.agree }}</MkButton><MkButton :disabled="busy" @click="cancel">{{ $locale.sfc.decline }}</MkButton></div>
				</section>
				<p v-else-if="view.status === 'cancelled'">{{ $locale.sfc.cancelledNotice }}</p>
				<Table v-else :view="view" :userId="$i!.id" :names="names" :busy="busy" :seconds="seconds" @action="submit"/>
				<MkButton v-if="view.status === 'playing'" danger :disabled="busy" @click="abort">{{ $locale.sfc.abort }}</MkButton>
			</template>
			<p v-else>{{ $locale.sfc.loading }}</p>
		</div>
	</div>
</PageWithHeader>
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { $i } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { definePage } from '@features/navigation/frontend/page.js';
import * as os from '@features/ui/frontend/os.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { rules, ruleVersion } from '../../shared/rules.js';
import Table from '../components/Table.vue';
import type { MahjongView } from '../../shared/view.schema.js';
import type { entities } from 'misskey-js';

const props = defineProps<{ roomId?: string }>();
const router = useRouter();
const view = ref<MahjongView | null>(null);
const rooms = ref<{ id: string; users: string[]; status: MahjongView['status']; createdAt: string }[]>([]);
const names = ref<Record<string, string>>({});
const invitees = ref<(entities.UserLite | null)[]>([null, null, null]);
const busy = ref(false);
const error = ref('');
const clock = ref(Date.now());
const offset = ref(0);
const seconds = computed(() => Math.max(0, Math.ceil(((view.value?.phase?.deadline ?? 0) - clock.value - offset.value) / 1000)));
let loading = false;
let generation = 0;
let disposed = false;

function accept(next: MahjongView) {
	if (next.id !== props.roomId || (view.value && next.revision < view.value.revision)) return;
	view.value = next;
	offset.value = next.serverTime - Date.now();
}

async function resolveNames(ids: string[]) {
	for (const id of ids) {
		if (names.value[id]) continue;
		names.value[id] = id;
		void misskeyApi('users/show', { userId: id }).then(user => { names.value[id] = `@${user.username}`; }).catch(() => {});
	}
}

async function refresh() {
	if (loading || busy.value || disposed) return;
	loading = true;
	const current = generation;
	try {
		if (props.roomId) {
			const next = await misskeyApi('mahjong/show', { roomId: props.roomId });
			if (current === generation) { accept(next); void resolveNames(next.users); }
		} else {
			const next = await misskeyApi('mahjong/rooms');
			if (current === generation) { rooms.value = next; void resolveNames(next.flatMap(room => room.users)); }
		}
		if (current === generation) error.value = '';
	} catch { if (current === generation) error.value = $locale.value.sfc.connectionError; } finally { loading = false; }
}

async function perform(fn: () => Promise<void>) {
	if (busy.value) return;
	busy.value = true;
	try { await fn(); error.value = ''; } catch { error.value = $locale.value.sfc.actionError; } finally { busy.value = false; void refresh(); }
}

async function pick(slot: number) {
	const user = await os.selectUser({ includeSelf: false, localOnly: true });
	if (user && !invitees.value.some((candidate, index) => index !== slot && candidate?.id === user.id)) invitees.value[slot] = user;
}

function create() { void perform(async () => { const room = await misskeyApi('mahjong/create', { invitees: invitees.value.filter((user): user is entities.UserLite => user !== null).map(user => user.id) }); router.push('/mahjong/:roomId', { params: { roomId: room.id } }); }); }

function ready() { void perform(async () => accept(await misskeyApi('mahjong/ready', { roomId: props.roomId! }))); }

function cancel() { void perform(async () => accept(await misskeyApi('mahjong/cancel', { roomId: props.roomId! }))); }

function abort() {
	const roomId = props.roomId;
	const current = generation;
	void perform(async () => {
		const { canceled } = await os.confirm({ type: 'warning', title: $locale.value.sfc.abort, text: $locale.value.sfc.abortConfirm });
		if (!canceled && !disposed && current === generation && roomId) accept(await misskeyApi('mahjong/cancel', { roomId }));
	});
}

function submit(actionId: string) {
	const phaseId = view.value?.phase?.id;
	if (!phaseId) return;
	const requestId = crypto.randomUUID();
	void perform(async () => accept(await misskeyApi('mahjong/submit', { roomId: props.roomId!, phaseId, actionId, requestId })));
}

watch(() => props.roomId, () => { generation++; view.value = null; void refresh(); }, { immediate: true });
onBeforeUnmount(() => { disposed = true; generation++; });
useInterval(() => { void refresh(); }, 2000, { immediate: false, afterMounted: true });
useInterval(() => { clock.value = Date.now(); }, 250, { immediate: true, afterMounted: true });
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-cards' }));
</script>
<locale locale="ja-JP" lang="json">
{"title":"麻雀","description":"同じサーバーの4人で遊ぶ招待制の東南戦。観戦・牌譜の公開はありません。","rulesTitle":"対局ルールを確認","timeouts":"打牌30秒・反応8秒・局結果10秒。時間切れはツモ切り（不可なら最後の合法牌）、反応は見送り。全員切断時は次の接続で処理します。","points":"25,000点持ち・30,000点返し、ウマ20/10/-10/-20。同点は起家に近い順。ランキングへの反映はありません。","invite":"3人を招待","select":"参加者を選ぶ","create":"部屋を作る","rooms":"参加中・招待された部屋","noRooms":"招待された部屋はまだありません。","waiting":"準備中","playing":"対局中","ended":"終了","cancelled":"取り消し・中断","consent":"上のルールと時間切れ方針を確認して、全員が準備完了すると開始します。","ready":"準備完了","notReady":"確認待ち","agree":"確認して準備完了","decline":"辞退して部屋を閉じる","loading":"読み込み中…","retry":"再接続","connectionError":"部屋を取得できません。招待と接続状態を確認してください。","actionError":"操作を送信できませんでした。最新の状態を取得します。","abort":"対局を中断する","abortPolicy":"参加者は誰でも対局全体を中断できます。中断すると全員の操作が終了し、再開や勝敗の確定は行いません。","abortConfirm":"他の3人も含めてこの対局を終了します。元の対局は再開できません。勝敗は付かず、新しい部屋を作れます。中断しますか？","cancelledNotice":"この部屋は参加者により取り消し・中断されました。再開はできません。新しい部屋で対局してください。"}
</locale>
<style module>
.rules, .lobby { padding: 20px; }
.rules > summary { cursor: pointer; font-weight: bold; }
.rules dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: .85em; }
.rules dd { margin: 0; overflow-wrap: anywhere; }
.lobby h2 { font-size: 1.1em; margin: 0; }
.roomLink { display: block; padding: 12px; border-radius: 8px; background: var(--MI_THEME-buttonBg); overflow-wrap: anywhere; }
.error { color: var(--MI_THEME-error); }
</style>
