<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await paginator.reload() }">
	<template #header>
		<i class="ti ti-paperclip"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || globalLocale.env.clip }}</span>
	</template>

	<MkResult v-if="notFound" type="notFound"/>
	<MkNotesTimeline v-else-if="column.clipId" :paginator="paginator" :withControl="false" :noGap="true"/>
</XColumn>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from '@features/navigation/frontend/ui/deck/column.vue';
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
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
				label: globalLocale.value.env.clips,
				items: myClips.map(x => ({ value: x.id, label: x.name })),
			} : undefined),
			(otherFavoritedClips.length > 0 ? {
				type: 'group' as const,
				label: globalLocale.value.env.favorites,
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
		text: globalLocale.value.env.show,
		action: openClip,
	},
];
</script>

<locale lang="json" locale="ar-SA">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"selectClip": "Seleccioneu un fragment"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="en-US">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"selectClip": "Seleccionar clip"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"selectClip": "Seleziona Clip"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"selectClip": "클립 선택"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"selectClip": "クリップを選択"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"selectClip": "选择便签"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"selectClip": "クリップを選択"
}
</locale>
