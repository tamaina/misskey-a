<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" :preferType="'dialog'" @closed="emit('closed')" @click="onBgClick">
	<div ref="rootEl" :class="$style.root">
		<div :class="$style.header">
			<span :class="$style.icon">
				<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
				<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
				<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
				<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
			</span>
			<span :class="$style.title">{{ announcement.title }}</span>
		</div>
		<div :class="$style.text"><Mfm :text="announcement.text"/></div>
		<div ref="bottomEl"></div>
		<div :class="$style.footer">
			<MkButton
				primary
				full
				:disabled="!hasReachedBottom"
				@click="ok"
			>{{ hasReachedBottom ? $locale.sfc.close : $locale.sfc.scrollToClose }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkModal from '@features/ui/frontend/components/MkModal.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { $i } from '@features/auth/frontend/i.js';
import { updateCurrentAccountPartial } from '@features/auth/frontend/accounts.js';

const props = defineProps<{
	announcement: Misskey.entities.Announcement | Misskey.entities.MeDetailed['unreadAnnouncements'][number];
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const rootEl = useTemplateRef('rootEl');
const bottomEl = useTemplateRef('bottomEl');
const modal = useTemplateRef('modal');

async function ok() {
	if (props.announcement.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.readConfirmTitle,
			text: $l.value.sfc.readConfirmText({ title: props.announcement.title }),
		});
		if (confirm.canceled) return;
	}

	modal.value?.close();
	misskeyApi('i/read-announcement', { announcementId: props.announcement.id });
	updateCurrentAccountPartial({
		unreadAnnouncements: $i!.unreadAnnouncements.filter(a => a.id !== props.announcement.id),
	});
}

function onBgClick() {
	rootEl.value?.animate([{
		offset: 0,
		transform: 'scale(1)',
	}, {
		offset: 0.5,
		transform: 'scale(1.1)',
	}, {
		offset: 1,
		transform: 'scale(1)',
	}], {
		duration: 100,
	});
}

const hasReachedBottom = ref(false);

onMounted(() => {
	if (bottomEl.value && rootEl.value) {
		const bottomElRect = bottomEl.value.getBoundingClientRect();
		const rootElRect = rootEl.value.getBoundingClientRect();
		if (
			bottomElRect.top >= rootElRect.top &&
			bottomElRect.top <= (rootElRect.bottom - 66) // 66 ≒ 75 * 0.9 (modalのアニメーション分)
		) {
			hasReachedBottom.value = true;
			return;
		}

		const observer = new IntersectionObserver(entries => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					hasReachedBottom.value = true;
					observer.disconnect();
				}
			}
		}, {
			root: rootEl.value,
			rootMargin: '0px 0px -75px 0px',
		});

		observer.observe(bottomEl.value);
	}
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px 32px 0;
	min-width: 320px;
	max-width: 480px;
	max-height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	font-size: 120%;
}

.icon {
	margin-right: 0.5em;
}

.title {
	font-weight: bold;
}

.text {
	margin: 1em 0;
}

.footer {
	position: sticky;
	bottom: 0;
	left: -32px;
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	margin: 0 -32px;
	padding: 24px 32px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"close": "اغلق",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"close": "Tanca",
	"scrollToClose": "Desplaçar per tancar",
	"readConfirmTitle": "Marcar com llegida?",
	"readConfirmText": "Això marcarà el contingut de \"{title}\" com llegit."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"close": "Zavřít",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"close": "Close",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"close": "Schließen",
	"scrollToClose": "Zum Schließen scrollen",
	"readConfirmTitle": "Als gelesen markieren?",
	"readConfirmText": "Dies markiert den Inhalt von \"{title}\" als gelesen."
}
</locale>

<locale locale="en-US" lang="json">
{
	"close": "Close",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"close": "Cerrar",
	"scrollToClose": "Desliza para cerrar",
	"readConfirmTitle": "¿Marcar como leído?",
	"readConfirmText": "Esto marcará el contenido de \"{title}\" como leído."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"close": "Fermer",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Marquer comme lu ?",
	"readConfirmText": "Cela marquera le contenu de  « {title} » comme lu."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"close": "Tutup",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Tandai telah dibaca?",
	"readConfirmText": "Aksi ini akan menandai konten dari \"{title}\" telah dibaca."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"close": "Chiudi",
	"scrollToClose": "Scorri per chiudere",
	"readConfirmTitle": "Segnare come già letto?",
	"readConfirmText": "Hai già letto \"{title}˝?"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"close": "閉じる",
	"scrollToClose": "スクロールして閉じる",
	"readConfirmTitle": "既読にしますか？",
	"readConfirmText": "「{title}」の内容を読み、既読にします。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"close": "さいなら",
	"scrollToClose": "スクロールして閉じる",
	"readConfirmTitle": "既読にしてええんやな?",
	"readConfirmText": "「{title}」はもう読んだから既読にするで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"close": "Close",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"close": "Close",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"close": "닫기",
	"scrollToClose": "스크롤하여 닫기",
	"readConfirmTitle": "읽음으로 표시합니까?",
	"readConfirmText": "〈{title}〉의 내용을 읽음으로 표시합니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"close": "Sluiten",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"close": "Lukk",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"close": "Zamknij",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"close": "Fechar",
	"scrollToClose": "Role a página para fechar",
	"readConfirmTitle": "Marcar como lido?",
	"readConfirmText": "Isso marcará o conteúdo de \"{title}\" como lido."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"close": "Закрыть",
	"scrollToClose": "Пролистайте для закрытия",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"close": "Zavrieť",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"close": "ปิด",
	"scrollToClose": "เลื่อนเพื่อปิด",
	"readConfirmTitle": "ทำเครื่องหมายว่าอ่านแล้วเลยไหม?",
	"readConfirmText": "จะทำเครื่องหมายใส่ “{title}” ว่าอ่านแล้ว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"close": "Kapat",
	"scrollToClose": "Kaydırarak kapatın",
	"readConfirmTitle": "Okundu olarak işaretle?",
	"readConfirmText": "Bu, “{title}” içeriğini okundu olarak işaretleyecek."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"close": "Close",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"close": "Закрити",
	"scrollToClose": "Прокрутіть, щоб закрити",
	"readConfirmTitle": "Позначити як прочитане?",
	"readConfirmText": "Це позначить зміст \"{title}\" як прочитаний."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"close": "Đóng",
	"scrollToClose": "Scroll to close",
	"readConfirmTitle": "Đánh dấu là đã đọc?",
	"readConfirmText": "Điều này sẽ đánh dấu nội dung của \"{title}\" là đã đọc."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"close": "关闭",
	"scrollToClose": "滑动并关闭",
	"readConfirmTitle": "标记为已读？",
	"readConfirmText": "阅读 “{title}” 的内容，并标记为已读。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"close": "關閉",
	"scrollToClose": "用滾輪關閉",
	"readConfirmTitle": "標記為已讀嗎？",
	"readConfirmText": "閱讀「{title}」的內容並標記為已讀。"
}
</locale>
