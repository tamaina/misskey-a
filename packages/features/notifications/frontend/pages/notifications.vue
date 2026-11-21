<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="tab === 'all'">
			<MkStreamingNotificationsTimeline :class="$style.notifications" :excludeTypes="excludeTypes"/>
		</div>
		<div v-else-if="tab === 'mentions'">
			<MkNotesTimeline :paginator="mentionsPaginator"/>
		</div>
		<div v-else-if="tab === 'directNotes'">
			<MkNotesTimeline :paginator="directNotesPaginator"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, ref } from 'vue';
import { notificationTypes } from 'misskey-js';
import MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const tab = ref('all');
const includeTypes = ref<string[] | null>(null);
const excludeTypes = computed(() => includeTypes.value ? notificationTypes.filter(t => !includeTypes.value!.includes(t)) : null);

const mentionsPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
}));

const directNotesPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
	params: {
		visibility: 'specified',
	},
}));

function setFilter(ev: PointerEvent) {
	const typeItems = notificationTypes.map(t => ({
		text: copyLocaleDictionary(globalLocale.value.env._notification._types)[t],
		active: (includeTypes.value && includeTypes.value.includes(t)) ?? false,
		action: () => {
			includeTypes.value = [t];
		},
	}));
	const items = includeTypes.value != null ? [{
		icon: 'ti ti-x',
		text: $locale.value.sfc.clear,
		action: () => {
			includeTypes.value = null;
		},
	}, { type: 'divider' as const }, ...typeItems] : typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

const headerActions = computed<PageHeaderItem[]>(() => ([tab.value === 'all' ? {
	text: globalLocale.value.env.filter,
	icon: 'ti ti-filter',
	highlighted: includeTypes.value != null,
	handler: setFilter,
} : undefined, tab.value === 'all' ? {
	text: globalLocale.value.env.markAllAsRead,
	icon: 'ti ti-check',
	handler: () => {
		os.apiWithDialog('notifications/mark-all-as-read', {});
	},
} : undefined] as (PageHeaderItem | undefined)[]).filter(x => x !== undefined));

const headerTabs = computed(() => [{
	key: 'all',
	title: globalLocale.value.env.all,
	icon: 'ti ti-point',
}, {
	key: 'mentions',
	title: $locale.value.sfc.mentions,
	icon: 'ti ti-at',
}, {
	key: 'directNotes',
	title: $locale.value.sfc.directNotes,
	icon: 'ti ti-mail',
}]);

definePage(() => ({
	title: globalLocale.value.env.notifications,
	icon: 'ti ti-bell',
}));
</script>

<style module lang="scss">
.notifications {
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"clear": "عودة",
	"mentions": "الإشارات",
	"directNotes": "رسالة خاصة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"clear": "Tornar",
	"mentions": "Mencions",
	"directNotes": "Notes directes"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"clear": "Vrátit",
	"mentions": "Zmínění",
	"directNotes": "Přímé poznámky"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"clear": "Return",
	"mentions": "Mentions",
	"directNotes": "Direct notes"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"clear": "Zurückkehren",
	"mentions": "Erwähnungen",
	"directNotes": "Direktnachrichten"
}
</locale>

<locale lang="json" locale="en-US">
{
	"clear": "Return",
	"mentions": "Mentions",
	"directNotes": "Direct notes"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"clear": "Limpiar",
	"mentions": "Menciones",
	"directNotes": "Notas directas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"clear": "Effacer",
	"mentions": "Mentions",
	"directNotes": "Notes directes"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"clear": "Bersihkan",
	"mentions": "Sebutan",
	"directNotes": "Catatan langsung"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"clear": "Cancella",
	"mentions": "Menzioni",
	"directNotes": "Note dirette"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"clear": "クリア",
	"mentions": "メンション",
	"directNotes": "指名"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"clear": "クリア",
	"mentions": "あんた宛て",
	"directNotes": "ダイレクト投稿"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"clear": "Return",
	"mentions": "Mentions",
	"directNotes": "Direct notes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"clear": "Return",
	"mentions": "ಹೆಸರಿಸಿದ",
	"directNotes": "ನೇರ ಟಿಪ್ಪಣಿಗಳು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"clear": "지우기",
	"mentions": "받은 멘션",
	"directNotes": "다이렉트 노트"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"clear": "Terugkeren",
	"mentions": "Vermeldingen",
	"directNotes": "Directe notities"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"clear": "Tøm",
	"mentions": "Mentions",
	"directNotes": "Direct notes"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"clear": "Wróć",
	"mentions": "Wspomnienia",
	"directNotes": "Bezpośrednie wpisy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"clear": "Limpar",
	"mentions": "Menções",
	"directNotes": "Notas diretas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"clear": "Очистить",
	"mentions": "Упоминания",
	"directNotes": "Личные сообщения"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"clear": "Vrátiť",
	"mentions": "Zmienky",
	"directNotes": "Priame poznámky"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"clear": "ล้าง",
	"mentions": "กล่าวถึงคุณ",
	"directNotes": "โพสต์แบบไดเร็กต์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"clear": "Temizle",
	"mentions": "Bahsetmeler",
	"directNotes": "Doğrudan notlar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"clear": "Return",
	"mentions": "Mentions",
	"directNotes": "Direct notes"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"clear": "Очистити",
	"mentions": "Згадки",
	"directNotes": "Прямі повідомлення"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"clear": "Hoàn lại",
	"mentions": "Lượt nhắc",
	"directNotes": "Nhắn riêng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"clear": "清除",
	"mentions": "提到我的",
	"directNotes": "私信"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"clear": "清除",
	"mentions": "提及",
	"directNotes": "指定使用者"
}
</locale>
