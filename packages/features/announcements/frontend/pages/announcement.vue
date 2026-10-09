<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<Transition
			:enterActiveClass="prefer.s.animation ? $style.fadeEnterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.fadeLeaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.fadeEnterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.fadeLeaveTo : ''"
			mode="out-in"
		>
			<div v-if="announcement" :key="announcement.id" class="_panel" :class="$style.announcement">
				<div v-if="announcement.forYou" :class="$style.forYou"><i class="ti ti-pin"></i> {{ $locale.sfc.forYou }}</div>
				<div :class="$style.header">
					<span v-if="$i && !announcement.silence && !announcement.isRead" style="margin-right: 0.5em;">🆕</span>
					<span style="margin-right: 0.5em;">
						<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
						<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
						<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
						<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
					</span>
					<Mfm :text="announcement.title" class="_selectable"/>
				</div>
				<div :class="$style.content">
					<Mfm :text="announcement.text" class="_selectable"/>
					<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
					<div style="margin-top: 8px; opacity: 0.7; font-size: 85%;">
						{{ $locale.sfc.createdAt }}: <MkTime :time="announcement.createdAt" mode="detail"/>
					</div>
					<div v-if="announcement.updatedAt" style="opacity: 0.7; font-size: 85%;">
						{{ $locale.sfc.updatedAt }}: <MkTime :time="announcement.updatedAt" mode="detail"/>
					</div>
				</div>
				<div v-if="$i && !announcement.silence && !announcement.isRead" :class="$style.footer">
					<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ $locale.sfc.gotIt }}</MkButton>
				</div>
			</div>
			<MkError v-else-if="error" @retry="_fetch_()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { updateCurrentAccountPartial } from '@features/auth/frontend/accounts.js';

const props = defineProps<{
	announcementId: string;
}>();

const announcement = ref<Misskey.entities.Announcement | null>(null);
const error = ref<any>(null);
const path = computed(() => props.announcementId);

function _fetch_() {
	announcement.value = null;
	misskeyApi('announcements/show', {
		announcementId: props.announcementId,
	}).then(async _announcement => {
		announcement.value = _announcement;
	}).catch(err => {
		error.value = err;
	});
}

async function read(target: Misskey.entities.Announcement): Promise<void> {
	if (target.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.readConfirmTitle,
			text: $l.value.sfc.readConfirmText({ title: target.title }),
		});
		if (confirm.canceled) return;
	}

	target.isRead = true;
	await misskeyApi('i/read-announcement', { announcementId: target.id });
	if ($i) {
		updateCurrentAccountPartial({
			unreadAnnouncements: $i.unreadAnnouncements.filter((a: { id: string; }) => a.id !== target.id),
		});
	}
}

watch(() => path.value, _fetch_, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: announcement.value ? announcement.value.title : $locale.value.sfc.announcements,
	icon: 'ti ti-speakerphone',
}));
</script>

<style lang="scss" module>
.fadeEnterActive,
.fadeLeaveActive {
	transition: opacity 0.125s ease;
}
.fadeEnterFrom,
.fadeLeaveTo {
	opacity: 0;
}

.announcement {
	padding: 16px;
}

.forYou {
	display: flex;
	align-items: center;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.header {
	margin-bottom: 16px;
	font-weight: bold;
	font-size: 120%;
}

.content {
	> img {
		display: block;
		max-height: 300px;
		max-width: 100%;
	}
}

.footer {
	margin-top: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"forYou": "For you",
	"createdAt": "أُنشئ في",
	"updatedAt": "حُدّث في",
	"gotIt": "فهِمت",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "الإعلانات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"forYou": "Per a tu",
	"createdAt": "Creat el",
	"updatedAt": "Actualitzat el",
	"gotIt": "D'acord ",
	"readConfirmTitle": "Marcar com llegida?",
	"readConfirmText": "Això marcarà el contingut de \"{title}\" com llegit.",
	"announcements": "Avisos"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"forYou": "Pro vás",
	"createdAt": "Vytvořeno",
	"updatedAt": "Upraveno",
	"gotIt": "Rozumím!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Oznámení"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Announcements"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"forYou": "Für dich",
	"createdAt": "Erstellt am",
	"updatedAt": "Zuletzt geändert am",
	"gotIt": "Verstanden!",
	"readConfirmTitle": "Als gelesen markieren?",
	"readConfirmText": "Dies markiert den Inhalt von \"{title}\" als gelesen.",
	"announcements": "Ankündigungen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Announcements"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"forYou": "Para ti",
	"createdAt": "Fecha de creación",
	"updatedAt": "Actualizado",
	"gotIt": "¡Lo tengo!",
	"readConfirmTitle": "¿Marcar como leído?",
	"readConfirmText": "Esto marcará el contenido de \"{title}\" como leído.",
	"announcements": "Avisos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"forYou": "Pour vous",
	"createdAt": "Date de création",
	"updatedAt": "Mis à jour le",
	"gotIt": "J’ai compris !",
	"readConfirmTitle": "Marquer comme lu ?",
	"readConfirmText": "Cela marquera le contenu de  « {title} » comme lu.",
	"announcements": "Annonces"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"forYou": "Untuk Anda",
	"createdAt": "Dibuat pada",
	"updatedAt": "Diperbarui pada",
	"gotIt": "Mengerti",
	"readConfirmTitle": "Tandai telah dibaca?",
	"readConfirmText": "Aksi ini akan menandai konten dari \"{title}\" telah dibaca.",
	"announcements": "Pengumuman"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"forYou": "Per te",
	"createdAt": "Data di creazione",
	"updatedAt": "Aggiornato il",
	"gotIt": "ok!",
	"readConfirmTitle": "Segnare come già letto?",
	"readConfirmText": "Hai già letto \"{title}˝?",
	"announcements": "Annunci"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"forYou": "あなたへ",
	"createdAt": "作成日時",
	"updatedAt": "更新日時",
	"gotIt": "わかった",
	"readConfirmTitle": "既読にしますか？",
	"readConfirmText": "「{title}」の内容を読み、既読にします。",
	"announcements": "お知らせ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"forYou": "あんたへ",
	"createdAt": "作成した日",
	"updatedAt": "更新日時",
	"gotIt": "ほい",
	"readConfirmTitle": "既読にしてええんやな?",
	"readConfirmText": "「{title}」はもう読んだから既読にするで。",
	"announcements": "お知らせ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Announcements"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "ಅರ್ಥವಾಯಿತು!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Announcements"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"forYou": "나에게",
	"createdAt": "생성된 날짜",
	"updatedAt": "수정한 날짜",
	"gotIt": "알겠어요",
	"readConfirmTitle": "읽음으로 표시합니까?",
	"readConfirmText": "〈{title}〉의 내용을 읽음으로 표시합니다.",
	"announcements": "공지사항"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"forYou": "For you",
	"createdAt": "Aangemaakt at",
	"updatedAt": "Laatst gewijzigd at",
	"gotIt": "Begrepen",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Aankondigingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Skjønner",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Kunngjøringer"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"forYou": "For you",
	"createdAt": "Utworzono",
	"updatedAt": "Zaktualizowano",
	"gotIt": "Rozumiem!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Ogłoszenia"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"forYou": "Para você",
	"createdAt": "Data de criação",
	"updatedAt": "Última atualização",
	"gotIt": "Entendi",
	"readConfirmTitle": "Marcar como lido?",
	"readConfirmText": "Isso marcará o conteúdo de \"{title}\" como lido.",
	"announcements": "Avisos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"forYou": "Для вас",
	"createdAt": "Создано",
	"updatedAt": "Обновлено",
	"gotIt": "Ясно!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Оповещения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"forYou": "For you",
	"createdAt": "Vytvorené",
	"updatedAt": "Upravené",
	"gotIt": "Rozumiem!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Oznamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"forYou": "สำหรับคุณ",
	"createdAt": "สร้างเมื่อ",
	"updatedAt": "อัปเดตล่าสุด",
	"gotIt": "เข้าใจแล้ว !",
	"readConfirmTitle": "ทำเครื่องหมายว่าอ่านแล้วเลยไหม?",
	"readConfirmText": "จะทำเครื่องหมายใส่ “{title}” ว่าอ่านแล้ว",
	"announcements": "ประกาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"forYou": "Senin için",
	"createdAt": "Oluşturuldu",
	"updatedAt": "Güncellendi",
	"gotIt": "Anladım!",
	"readConfirmTitle": "Okundu olarak işaretle?",
	"readConfirmText": "Bu, “{title}” içeriğini okundu olarak işaretleyecek.",
	"announcements": "Duyurular"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!",
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"announcements": "Announcements"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"forYou": "Для вас",
	"createdAt": "Створено",
	"updatedAt": "Останнє оновлення",
	"gotIt": "Зрозуміло!",
	"readConfirmTitle": "Позначити як прочитане?",
	"readConfirmText": "Це позначить зміст \"{title}\" як прочитаний.",
	"announcements": "Оголошення"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"forYou": "Dành cho bạn",
	"createdAt": "Ngày tạo",
	"updatedAt": "Cập nhật lúc",
	"gotIt": "Hiểu rồi!",
	"readConfirmTitle": "Đánh dấu là đã đọc?",
	"readConfirmText": "Điều này sẽ đánh dấu nội dung của \"{title}\" là đã đọc.",
	"announcements": "Thông báo máy chủ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"forYou": "您的",
	"createdAt": "创建日期",
	"updatedAt": "更新日期",
	"gotIt": "好",
	"readConfirmTitle": "标记为已读？",
	"readConfirmText": "阅读 “{title}” 的内容，并标记为已读。",
	"announcements": "公告"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"forYou": "給您",
	"createdAt": "建立於",
	"updatedAt": "最後更新",
	"gotIt": "知道了",
	"readConfirmTitle": "標記為已讀嗎？",
	"readConfirmText": "閱讀「{title}」的內容並標記為已讀。",
	"announcements": "公告"
}
</locale>
