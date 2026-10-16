<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await paginator.reload() }">
	<template #header>
		<i class="ti ti-paperclip"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || $locale.sfc.clip }}</span>
	</template>

	<MkResult v-if="notFound" type="notFound"/>
	<MkNotesTimeline v-else-if="column.clipId" :paginator="paginator" :withControl="false" :noGap="true"/>
</XColumn>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from '@features/navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';
import { clipsCache, favoritedClipsCache } from '@features/runtime/frontend/cache.js';
import { useStream } from '@features/api/frontend/stream.js';
import { $i } from '@features/auth/frontend/i.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import { getClipColumnReloadDelayMs } from './clip-column.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const clip = shallowRef<Misskey.entities.Clip | null>(null);
const notFound = ref(false);

provide('currentClip', clip);

const paginator = markRaw(new Paginator('clips/notes', {
	limit: 10,
	canSearch: true,
	computedParams: computed(() => props.column.clipId ? { clipId: props.column.clipId } : null),
}));

let requestGeneration = 0;
let disposed = false;

let connection: Misskey.IChannelConnection<Misskey.Channels['clip']> | null = null;

// 同じクリップを大勢が購読していると、更新の度に全員が同時にreloadしリクエストがスパイクしうるため、
// 受信直後ではなくランダムな遅延を挟んでからreloadし、着火タイミングを分散させる
let reloadTimer: number | null = null;

function scheduleReload() {
	if (reloadTimer != null) return;
	const delay = getClipColumnReloadDelayMs(clip.value?.userId, $i?.id);
	if (delay === 0) {
		paginator.reload();
		return;
	}

	reloadTimer = window.setTimeout(() => {
		reloadTimer = null;
		paginator.reload();
	}, delay);
}

function cancelScheduledReload() {
	if (reloadTimer != null) {
		window.clearTimeout(reloadTimer);
		reloadTimer = null;
	}
}

function disconnectChannel() {
	cancelScheduledReload();
	if (connection) {
		connection.dispose();
		connection = null;
	}
}

function connectChannel() {
	disconnectChannel();
	if (props.column.clipId == null) return;
	connection = useStream().useChannel('clip', {
		clipId: props.column.clipId,
	});
	connection.on('updated', () => {
		scheduleReload();
	});
	connection.on('deleted', () => {
		requestGeneration++;
		disconnectChannel();
		clip.value = null;
		notFound.value = true;
	});
}

watch(() => props.column.clipId, async (clipId, _previous, onCleanup) => {
	const generation = ++requestGeneration;
	let active = true;
	onCleanup(() => { active = false; });
	clip.value = null;
	notFound.value = false;
	connectChannel();

	if (clipId == null) {
		clip.value = null;
		notFound.value = false;
		return;
	}

	try {
		const fetchedClip = await misskeyApi('clips/show', { clipId });
		if (!active || disposed || generation !== requestGeneration) return;
		clip.value = fetchedClip;
		notFound.value = false;
		if (props.column.timelineNameCache == null) {
			updateColumn(props.column.id, { timelineNameCache: fetchedClip.name });
		}
	} catch {
		if (!active || disposed || generation !== requestGeneration) return;
		clip.value = null;
		notFound.value = true;
	}
}, { immediate: true });

onMounted(() => {
	if (props.column.clipId == null) {
		setClip();
	}
});

onUnmounted(() => {
	disposed = true;
	requestGeneration++;
	disconnectChannel();
});

async function setClip() {
	const initialClipId = props.column.clipId;
	const [myClips, favoritedClips] = await Promise.all([
		clipsCache.fetch(),
		favoritedClipsCache.fetch(),
	]);
	if (disposed || initialClipId !== props.column.clipId) return;
	const otherFavoritedClips = favoritedClips.filter(x => !myClips.some(y => y.id === x.id));

	const { canceled, result: chosenClipId } = await os.select({
		title: $locale.value.sfc.selectClip,
		items: [
			(myClips.length > 0 ? {
				type: 'group' as const,
				label: $locale.value.sfc.clips,
				items: myClips.map(x => ({ value: x.id, label: x.name })),
			} : undefined),
			(otherFavoritedClips.length > 0 ? {
				type: 'group' as const,
				label: $locale.value.sfc.favorites,
				items: otherFavoritedClips.map(x => ({ value: x.id, label: x.name })),
			} : undefined),
		],
		default: props.column.clipId,
	});
	if (disposed || initialClipId !== props.column.clipId || canceled || chosenClipId == null) return;

	const chosenClip = [...myClips, ...favoritedClips].find(x => x.id === chosenClipId);
	if (!chosenClip) return;
	clip.value = chosenClip;
	notFound.value = false;
	updateColumn(props.column.id, {
		clipId: chosenClip.id,
		timelineNameCache: chosenClip.name,
	});
}

function openClip() {
	if (props.column.clipId == null) return;
	os.pageWindow('/clips/' + props.column.clipId);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: $locale.value.sfc.selectClip,
		action: setClip,
	},
	{
		icon: 'ti ti-paperclip',
		text: $locale.value.sfc.show,
		action: openClip,
	},
];
</script>

<locale lang="json" locale="ar-SA">
{
	"clip": "مِشبك",
	"selectClip": "クリップを選択",
	"clips": "مشابك",
	"favorites": "المفضلات",
	"show": "المظهر"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"clip": "Retalls",
	"selectClip": "Seleccioneu un fragment",
	"clips": "Retalls",
	"favorites": "Favorits",
	"show": "Veure"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"clip": "Oříznout",
	"selectClip": "クリップを選択",
	"clips": "Oříznout",
	"favorites": "Oblíbené",
	"show": "Zobrazit"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favorites",
	"show": "Show"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"clip": "Clip erstellen",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favoriten",
	"show": "Anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favorites",
	"show": "Show"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clip",
	"favorites": "Favoritos",
	"show": "Apariencia"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favoris",
	"show": "Affichage"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"clip": "Klip",
	"selectClip": "クリップを選択",
	"clips": "Klip",
	"favorites": "Favorit",
	"show": "Tampilkan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clip",
	"favorites": "Preferiti",
	"show": "Visualizza"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"clip": "クリップ",
	"selectClip": "クリップを選択",
	"clips": "クリップ",
	"favorites": "お気に入り",
	"show": "表示"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"clip": "クリップ",
	"selectClip": "クリップを選択",
	"clips": "クリップ",
	"favorites": "お気に入り",
	"show": "表示"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favorites",
	"show": "Show"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "ಮೆಚ್ಚಿನವುಗಳು",
	"show": "Show"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"clip": "클립",
	"selectClip": "クリップを選択",
	"clips": "클립",
	"favorites": "즐겨찾기",
	"show": "표시"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"clip": "Clip aanmaken",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Toevoegen aan favorieten",
	"show": "Weergave"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favoritter",
	"show": "Vis"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"clip": "Klip",
	"selectClip": "クリップを選択",
	"clips": "Klipy",
	"favorites": "Ulubione",
	"show": "Wyświetlanie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"clip": "Clipe",
	"selectClip": "クリップを選択",
	"clips": "Clipe",
	"favorites": "Favoritos",
	"show": "Visualizar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"clip": "Подборка",
	"selectClip": "クリップを選択",
	"clips": "Подборки",
	"favorites": "Избранное",
	"show": "Показать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"clip": "Klip",
	"selectClip": "クリップを選択",
	"clips": "Klip",
	"favorites": "Obľúbené",
	"show": "Zobraziť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"clip": "คลิป",
	"selectClip": "クリップを選択",
	"clips": "คลิป",
	"favorites": "รายการโปรด",
	"show": "แสดงผล"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"clip": "Klip",
	"selectClip": "クリップを選択",
	"clips": "Klipler",
	"favorites": "Favoriler",
	"show": "Göster"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"clip": "Clip",
	"selectClip": "クリップを選択",
	"clips": "Clips",
	"favorites": "Favorites",
	"show": "Show"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"clip": "Добірка",
	"selectClip": "クリップを選択",
	"clips": "Добірки",
	"favorites": "Обране",
	"show": "Відображення"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"clip": "Lưu bài viết",
	"selectClip": "クリップを選択",
	"clips": "Lưu bài viết",
	"favorites": "Lượt thích",
	"show": "Hiển thị"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"clip": "便签",
	"selectClip": "选择便签",
	"clips": "便签",
	"favorites": "收藏",
	"show": "显示"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"clip": "摘錄",
	"selectClip": "クリップを選択",
	"clips": "摘錄",
	"favorites": "我的最愛",
	"show": "檢視"
}
</locale>
