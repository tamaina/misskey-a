<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<MkInfo v-if="$i && $i.hasUnreadAnnouncement && tab === 'current'" warn>{{ $locale.sfc.youHaveUnreadAnnouncements }}</MkInfo>
			<MkPagination v-slot="{items}" :paginator="paginator" class="_gaps">
				<section v-for="announcement in items" :key="announcement.id" class="_panel" :class="$style.announcement">
					<div v-if="announcement.forYou" :class="$style.forYou"><i class="ti ti-pin"></i> {{ $locale.sfc.forYou }}</div>
					<div :class="$style.header">
						<span v-if="$i && !announcement.silence && !announcement.isRead" style="margin-right: 0.5em;">🆕</span>
						<span style="margin-right: 0.5em;">
							<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
							<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
							<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
							<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
						</span>
						<MkA :to="`/announcements/${announcement.id}`"><span>{{ announcement.title }}</span></MkA>
					</div>
					<div :class="$style.content">
						<Mfm :text="announcement.text" class="_selectable"/>
						<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
						<MkA :to="`/announcements/${announcement.id}`">
							<div style="margin-top: 8px; opacity: 0.7; font-size: 85%;">
								{{ $locale.sfc.createdAt }}: <MkTime :time="announcement.createdAt" mode="detail"/>
							</div>
							<div v-if="announcement.updatedAt" style="opacity: 0.7; font-size: 85%;">
								{{ $locale.sfc.updatedAt }}: <MkTime :time="announcement.updatedAt" mode="detail"/>
							</div>
						</MkA>
					</div>
					<div v-if="tab !== 'past' && $i != null && !announcement.silence && !announcement.isRead" :class="$style.footer">
						<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ $locale.sfc.gotIt }}</MkButton>
					</div>
				</section>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { updateCurrentAccountPartial } from '@features/auth/frontend/accounts.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const paginator = markRaw(new Paginator('announcements', {
	limit: 10,
	computedParams: computed(() => ({
		isActive: tab.value === 'current',
	})),
}));

const tab = ref('current');

async function read(target: Misskey.entities.Announcement) {
	if ($i == null) return;

	if (target.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.readConfirmTitle,
			text: interpolateLocaleParameters($locale.value.sfc.readConfirmText, { title: target.title }),
		});
		if (confirm.canceled) return;
	}

	paginator.updateItem(target.id, a => ({
		...a,
		isRead: true,
	}));
	misskeyApi('i/read-announcement', { announcementId: target.id });
	updateCurrentAccountPartial({
		unreadAnnouncements: $i.unreadAnnouncements.filter(a => a.id !== target.id),
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'current',
	title: $locale.value.sfc.currentAnnouncements,
	icon: 'ti ti-flare',
}, {
	key: 'past',
	title: $locale.value.sfc.pastAnnouncements,
	icon: 'ti ti-point',
}]);

definePage(() => ({
	title: $locale.value.sfc.announcements,
	icon: 'ti ti-speakerphone',
}));
</script>

<style lang="scss" module>
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

<locale lang="json" locale="ar-SA">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "الإعلانات",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "أُنشئ في",
	"updatedAt": "حُدّث في",
	"gotIt": "فهِمت"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"readConfirmTitle": "Marcar com llegida?",
	"readConfirmText": "Això marcarà el contingut de \"{title}\" com llegit.",
	"currentAnnouncements": "Avisos actuals",
	"pastAnnouncements": "Avisos passats",
	"announcements": "Avisos",
	"youHaveUnreadAnnouncements": "Tens informes per llegir.",
	"forYou": "Per a tu",
	"createdAt": "Creat el",
	"updatedAt": "Actualitzat el",
	"gotIt": "D'acord "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Oznámení",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "Pro vás",
	"createdAt": "Vytvořeno",
	"updatedAt": "Upraveno",
	"gotIt": "Rozumím!"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"readConfirmTitle": "Als gelesen markieren?",
	"readConfirmText": "Dies markiert den Inhalt von \"{title}\" als gelesen.",
	"currentAnnouncements": "Aktuelle Ankündigungen",
	"pastAnnouncements": "Alte Ankündigungen",
	"announcements": "Ankündigungen",
	"youHaveUnreadAnnouncements": "Es gibt neue Ankündigungen.",
	"forYou": "Für dich",
	"createdAt": "Erstellt am",
	"updatedAt": "Zuletzt geändert am",
	"gotIt": "Verstanden!"
}
</locale>

<locale lang="json" locale="en-US">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"readConfirmTitle": "¿Marcar como leído?",
	"readConfirmText": "Esto marcará el contenido de \"{title}\" como leído.",
	"currentAnnouncements": "Avisos actuales",
	"pastAnnouncements": "Avisos anteriores",
	"announcements": "Avisos",
	"youHaveUnreadAnnouncements": "Hay anuncios sin leer",
	"forYou": "Para ti",
	"createdAt": "Fecha de creación",
	"updatedAt": "Actualizado",
	"gotIt": "¡Lo tengo!"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"readConfirmTitle": "Marquer comme lu ?",
	"readConfirmText": "Cela marquera le contenu de  « {title} » comme lu.",
	"currentAnnouncements": "Annonces actuelles",
	"pastAnnouncements": "Annonces passées",
	"announcements": "Annonces",
	"youHaveUnreadAnnouncements": "Il y a des annonces non lues.",
	"forYou": "Pour vous",
	"createdAt": "Date de création",
	"updatedAt": "Mis à jour le",
	"gotIt": "J’ai compris !"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"readConfirmTitle": "Tandai telah dibaca?",
	"readConfirmText": "Aksi ini akan menandai konten dari \"{title}\" telah dibaca.",
	"currentAnnouncements": "Pengumuman Saat Ini",
	"pastAnnouncements": "Pengumuman Terdahulu",
	"announcements": "Pengumuman",
	"youHaveUnreadAnnouncements": "Terdapat pengumuman yang belum dibaca",
	"forYou": "Untuk Anda",
	"createdAt": "Dibuat pada",
	"updatedAt": "Diperbarui pada",
	"gotIt": "Mengerti"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"readConfirmTitle": "Segnare come già letto?",
	"readConfirmText": "Hai già letto \"{title}˝?",
	"currentAnnouncements": "Annunci attuali",
	"pastAnnouncements": "Annunci precedenti",
	"announcements": "Annunci",
	"youHaveUnreadAnnouncements": "Ci sono Annunci non letti",
	"forYou": "Per te",
	"createdAt": "Data di creazione",
	"updatedAt": "Aggiornato il",
	"gotIt": "ok!"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"readConfirmTitle": "既読にしますか？",
	"readConfirmText": "「{title}」の内容を読み、既読にします。",
	"currentAnnouncements": "現在のお知らせ",
	"pastAnnouncements": "過去のお知らせ",
	"announcements": "お知らせ",
	"youHaveUnreadAnnouncements": "未読のお知らせがあります。",
	"forYou": "あなたへ",
	"createdAt": "作成日時",
	"updatedAt": "更新日時",
	"gotIt": "わかった"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"readConfirmTitle": "既読にしてええんやな?",
	"readConfirmText": "「{title}」はもう読んだから既読にするで。",
	"currentAnnouncements": "現在のお知らせやで",
	"pastAnnouncements": "過去のお知らせやで",
	"announcements": "お知らせ",
	"youHaveUnreadAnnouncements": "あんたまだこのお知らせ読んどらんやろ。",
	"forYou": "あんたへ",
	"createdAt": "作成した日",
	"updatedAt": "更新日時",
	"gotIt": "ほい"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "ಅರ್ಥವಾಯಿತು!"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"readConfirmTitle": "읽음으로 표시합니까?",
	"readConfirmText": "〈{title}〉의 내용을 읽음으로 표시합니다.",
	"currentAnnouncements": "현재 공지사항",
	"pastAnnouncements": "과거 공지사항",
	"announcements": "공지사항",
	"youHaveUnreadAnnouncements": "읽지 않은 공지사항이 있습니다.",
	"forYou": "나에게",
	"createdAt": "생성된 날짜",
	"updatedAt": "수정한 날짜",
	"gotIt": "알겠어요"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Aankondigingen",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Aangemaakt at",
	"updatedAt": "Laatst gewijzigd at",
	"gotIt": "Begrepen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Kunngjøringer",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Skjønner"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Ogłoszenia",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Utworzono",
	"updatedAt": "Zaktualizowano",
	"gotIt": "Rozumiem!"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"readConfirmTitle": "Marcar como lido?",
	"readConfirmText": "Isso marcará o conteúdo de \"{title}\" como lido.",
	"currentAnnouncements": "Anúncios atuais",
	"pastAnnouncements": "Anúncios passados",
	"announcements": "Avisos",
	"youHaveUnreadAnnouncements": "Há anúncios não lidos.",
	"forYou": "Para você",
	"createdAt": "Data de criação",
	"updatedAt": "Última atualização",
	"gotIt": "Entendi"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Текущие новости",
	"pastAnnouncements": "Предыдущие новости",
	"announcements": "Оповещения",
	"youHaveUnreadAnnouncements": "У вас есть непрочитанные уведомления",
	"forYou": "Для вас",
	"createdAt": "Создано",
	"updatedAt": "Обновлено",
	"gotIt": "Ясно!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Oznamy",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Vytvorené",
	"updatedAt": "Upravené",
	"gotIt": "Rozumiem!"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"readConfirmTitle": "ทำเครื่องหมายว่าอ่านแล้วเลยไหม?",
	"readConfirmText": "จะทำเครื่องหมายใส่ “{title}” ว่าอ่านแล้ว",
	"currentAnnouncements": "ประกาศในปัจจุบัน",
	"pastAnnouncements": "ประกาศที่ผ่านมา",
	"announcements": "ประกาศ",
	"youHaveUnreadAnnouncements": "มีการประกาศที่ยังไม่ได้อ่าน",
	"forYou": "สำหรับคุณ",
	"createdAt": "สร้างเมื่อ",
	"updatedAt": "อัปเดตล่าสุด",
	"gotIt": "เข้าใจแล้ว !"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"readConfirmTitle": "Okundu olarak işaretle?",
	"readConfirmText": "Bu, “{title}” içeriğini okundu olarak işaretleyecek.",
	"currentAnnouncements": "Güncel duyurular",
	"pastAnnouncements": "Geçmiş duyurular",
	"announcements": "Duyurular",
	"youHaveUnreadAnnouncements": "Okunmamış duyurular var.",
	"forYou": "Senin için",
	"createdAt": "Oluşturuldu",
	"updatedAt": "Güncellendi",
	"gotIt": "Anladım!"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"announcements": "Announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"readConfirmTitle": "Позначити як прочитане?",
	"readConfirmText": "Це позначить зміст \"{title}\" як прочитаний.",
	"currentAnnouncements": "Поточні оголошення",
	"pastAnnouncements": "Минулі оголошення",
	"announcements": "Оголошення",
	"youHaveUnreadAnnouncements": "Є непрочитані оголошення.",
	"forYou": "Для вас",
	"createdAt": "Створено",
	"updatedAt": "Останнє оновлення",
	"gotIt": "Зрозуміло!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"readConfirmTitle": "Đánh dấu là đã đọc?",
	"readConfirmText": "Điều này sẽ đánh dấu nội dung của \"{title}\" là đã đọc.",
	"currentAnnouncements": "Thông báo hiện tại",
	"pastAnnouncements": "Thông báo trước đó",
	"announcements": "Thông báo máy chủ",
	"youHaveUnreadAnnouncements": "Có thông báo chưa đọc.",
	"forYou": "Dành cho bạn",
	"createdAt": "Ngày tạo",
	"updatedAt": "Cập nhật lúc",
	"gotIt": "Hiểu rồi!"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"readConfirmTitle": "标记为已读？",
	"readConfirmText": "阅读 “{title}” 的内容，并标记为已读。",
	"currentAnnouncements": "现在的公告",
	"pastAnnouncements": "过去的公告",
	"announcements": "公告",
	"youHaveUnreadAnnouncements": "您有未读的公告",
	"forYou": "您的",
	"createdAt": "创建日期",
	"updatedAt": "更新日期",
	"gotIt": "好"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"readConfirmTitle": "標記為已讀嗎？",
	"readConfirmText": "閱讀「{title}」的內容並標記為已讀。",
	"currentAnnouncements": "最新公告",
	"pastAnnouncements": "歷史公告",
	"announcements": "公告",
	"youHaveUnreadAnnouncements": "有未讀的公告。",
	"forYou": "給您",
	"createdAt": "建立於",
	"updatedAt": "最後更新",
	"gotIt": "知道了"
}
</locale>
