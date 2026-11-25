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
								{{ globalLocale.env.createdAt }}: <MkTime :time="announcement.createdAt" mode="detail"/>
							</div>
							<div v-if="announcement.updatedAt" style="opacity: 0.7; font-size: 85%;">
								{{ globalLocale.env.updatedAt }}: <MkTime :time="announcement.updatedAt" mode="detail"/>
							</div>
						</MkA>
					</div>
					<div v-if="tab !== 'past' && $i != null && !announcement.silence && !announcement.isRead" :class="$style.footer">
						<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ globalLocale.env.gotIt }}</MkButton>
					</div>
				</section>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
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
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	title: globalLocale.value.env.announcements,
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
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"readConfirmTitle": "Marcar com llegida?",
	"readConfirmText": "Això marcarà el contingut de \"{title}\" com llegit.",
	"currentAnnouncements": "Avisos actuals",
	"pastAnnouncements": "Avisos passats",
	"youHaveUnreadAnnouncements": "Tens informes per llegir.",
	"forYou": "Per a tu"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "Pro vás"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"readConfirmTitle": "Als gelesen markieren?",
	"readConfirmText": "Dies markiert den Inhalt von \"{title}\" als gelesen.",
	"currentAnnouncements": "Aktuelle Ankündigungen",
	"pastAnnouncements": "Alte Ankündigungen",
	"youHaveUnreadAnnouncements": "Es gibt neue Ankündigungen.",
	"forYou": "Für dich"
}
</locale>

<locale lang="json" locale="en-US">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"readConfirmTitle": "¿Marcar como leído?",
	"readConfirmText": "Esto marcará el contenido de \"{title}\" como leído.",
	"currentAnnouncements": "Avisos actuales",
	"pastAnnouncements": "Avisos anteriores",
	"youHaveUnreadAnnouncements": "Hay anuncios sin leer",
	"forYou": "Para ti"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"readConfirmTitle": "Marquer comme lu ?",
	"readConfirmText": "Cela marquera le contenu de  « {title} » comme lu.",
	"currentAnnouncements": "Annonces actuelles",
	"pastAnnouncements": "Annonces passées",
	"youHaveUnreadAnnouncements": "Il y a des annonces non lues.",
	"forYou": "Pour vous"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"readConfirmTitle": "Tandai telah dibaca?",
	"readConfirmText": "Aksi ini akan menandai konten dari \"{title}\" telah dibaca.",
	"currentAnnouncements": "Pengumuman Saat Ini",
	"pastAnnouncements": "Pengumuman Terdahulu",
	"youHaveUnreadAnnouncements": "Terdapat pengumuman yang belum dibaca",
	"forYou": "Untuk Anda"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"readConfirmTitle": "Segnare come già letto?",
	"readConfirmText": "Hai già letto \"{title}˝?",
	"currentAnnouncements": "Annunci attuali",
	"pastAnnouncements": "Annunci precedenti",
	"youHaveUnreadAnnouncements": "Ci sono Annunci non letti",
	"forYou": "Per te"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"readConfirmTitle": "既読にしますか？",
	"readConfirmText": "「{title}」の内容を読み、既読にします。",
	"currentAnnouncements": "現在のお知らせ",
	"pastAnnouncements": "過去のお知らせ",
	"youHaveUnreadAnnouncements": "未読のお知らせがあります。",
	"forYou": "あなたへ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"readConfirmTitle": "既読にしてええんやな?",
	"readConfirmText": "「{title}」はもう読んだから既読にするで。",
	"currentAnnouncements": "現在のお知らせやで",
	"pastAnnouncements": "過去のお知らせやで",
	"youHaveUnreadAnnouncements": "あんたまだこのお知らせ読んどらんやろ。",
	"forYou": "あんたへ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"readConfirmTitle": "읽음으로 표시합니까?",
	"readConfirmText": "〈{title}〉의 내용을 읽음으로 표시합니다.",
	"currentAnnouncements": "현재 공지사항",
	"pastAnnouncements": "과거 공지사항",
	"youHaveUnreadAnnouncements": "읽지 않은 공지사항이 있습니다.",
	"forYou": "나에게"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"readConfirmTitle": "Marcar como lido?",
	"readConfirmText": "Isso marcará o conteúdo de \"{title}\" como lido.",
	"currentAnnouncements": "Anúncios atuais",
	"pastAnnouncements": "Anúncios passados",
	"youHaveUnreadAnnouncements": "Há anúncios não lidos.",
	"forYou": "Para você"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Текущие новости",
	"pastAnnouncements": "Предыдущие новости",
	"youHaveUnreadAnnouncements": "У вас есть непрочитанные уведомления",
	"forYou": "Для вас"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"readConfirmTitle": "ทำเครื่องหมายว่าอ่านแล้วเลยไหม?",
	"readConfirmText": "จะทำเครื่องหมายใส่ “{title}” ว่าอ่านแล้ว",
	"currentAnnouncements": "ประกาศในปัจจุบัน",
	"pastAnnouncements": "ประกาศที่ผ่านมา",
	"youHaveUnreadAnnouncements": "มีการประกาศที่ยังไม่ได้อ่าน",
	"forYou": "สำหรับคุณ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"readConfirmTitle": "Okundu olarak işaretle?",
	"readConfirmText": "Bu, “{title}” içeriğini okundu olarak işaretleyecek.",
	"currentAnnouncements": "Güncel duyurular",
	"pastAnnouncements": "Geçmiş duyurular",
	"youHaveUnreadAnnouncements": "Okunmamış duyurular var.",
	"forYou": "Senin için"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"readConfirmTitle": "Mark as read?",
	"readConfirmText": "This will mark the contents of \"{title}\" as read.",
	"currentAnnouncements": "Current announcements",
	"pastAnnouncements": "Past announcements",
	"youHaveUnreadAnnouncements": "There are unread announcements.",
	"forYou": "For you"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"readConfirmTitle": "Позначити як прочитане?",
	"readConfirmText": "Це позначить зміст \"{title}\" як прочитаний.",
	"currentAnnouncements": "Поточні оголошення",
	"pastAnnouncements": "Минулі оголошення",
	"youHaveUnreadAnnouncements": "Є непрочитані оголошення.",
	"forYou": "Для вас"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"readConfirmTitle": "Đánh dấu là đã đọc?",
	"readConfirmText": "Điều này sẽ đánh dấu nội dung của \"{title}\" là đã đọc.",
	"currentAnnouncements": "Thông báo hiện tại",
	"pastAnnouncements": "Thông báo trước đó",
	"youHaveUnreadAnnouncements": "Có thông báo chưa đọc.",
	"forYou": "Dành cho bạn"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"readConfirmTitle": "标记为已读？",
	"readConfirmText": "阅读 “{title}” 的内容，并标记为已读。",
	"currentAnnouncements": "现在的公告",
	"pastAnnouncements": "过去的公告",
	"youHaveUnreadAnnouncements": "您有未读的公告",
	"forYou": "您的"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"readConfirmTitle": "標記為已讀嗎？",
	"readConfirmText": "閱讀「{title}」的內容並標記為已讀。",
	"currentAnnouncements": "最新公告",
	"pastAnnouncements": "歷史公告",
	"youHaveUnreadAnnouncements": "有未讀的公告。",
	"forYou": "給您"
}
</locale>
