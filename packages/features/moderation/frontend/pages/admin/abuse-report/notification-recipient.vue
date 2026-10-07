<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div :class="$style.root" class="_gaps_m">
			<div :class="$style.addButton">
				<MkButton primary @click="onAddButtonClicked">
					<span class="ti ti-plus"></span> {{ $locale.sfc.createRecipient }}
				</MkButton>
			</div>
			<div :class="$style.subMenus" class="_gaps_s">
				<MkSelect v-model="filterMethod" :items="filterMethodDef" style="flex: 1">
					<template #label>{{ $locale.sfc.recipientType }}</template>
				</MkSelect>
				<MkInput v-model="filterText" type="search" style="flex: 1">
					<template #label>{{ $locale.sfc.keywords }}</template>
				</MkInput>
			</div>

			<MkDivider/>

			<div :class="$style.recipients" class="_gaps_s">
				<XRecipient
					v-for="r in filteredRecipients"
					:key="r.id"
					:entity="r"
					@edit="onEditButtonClicked"
					@delete="onDeleteButtonClicked"
				/>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script setup lang="ts">
import { entities } from 'misskey-js';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import XRecipient from '@features/moderation/frontend/pages/admin/abuse-report/notification-recipient.item.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import MkDivider from '@features/ui/frontend/components/MkDivider.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

const recipients = ref<entities.AbuseReportNotificationRecipient[]>([]);

const {
	model: filterMethod,
	def: filterMethodDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: null },
		{ label: $locale.value.sfc.mail, value: 'email' },
		{ label: $locale.value.sfc.webhook, value: 'webhook' },
	],
	initialValue: null,
});
const filterText = ref<string>('');

const filteredRecipients = computed(() => {
	const method = filterMethod.value;
	const text = filterText.value.trim().length === 0 ? null : filterText.value;

	return recipients.value.filter(it => {
		if (method ?? text) {
			if (text) {
				const keywords = [it.name, it.systemWebhook?.name, it.user?.name, it.user?.username];
				if (keywords.filter(k => k?.includes(text)).length !== 0) {
					return true;
				}
			}

			if (method) {
				return it.method.includes(method);
			}

			return false;
		}

		return true;
	});
});
const headerActions = computed(() => []);
const headerTabs = computed(() => []);

async function onAddButtonClicked() {
	await showEditor('create');
}

async function onEditButtonClicked(id: string) {
	await showEditor('edit', id);
}

async function onDeleteButtonClicked(id: string) {
	const res = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.deleteConfirm,
	});
	if (!res.canceled) {
		await misskeyApi('admin/abuse-report/notification-recipient/delete', { id: id });
		await fetchRecipients();
	}
}

async function showEditor(mode: 'create' | 'edit', id?: string) {
	const { needLoad } = await new Promise<{ needLoad: boolean }>(async resolve => {
		const { dispose } = os.popup(
			defineAsyncComponent(() => import('@features/moderation/frontend/pages/admin/abuse-report/notification-recipient.editor.vue')),
			{
				mode,
				id,
			},
			{
				submitted: () => {
					resolve({ needLoad: true });
				},
				canceled: () => {
					resolve({ needLoad: false });
				},
				closed: () => {
					dispose();
				},
			},
		);
	});

	if (needLoad) {
		await fetchRecipients();
	}
}

async function fetchRecipients() {
	const result = await misskeyApi('admin/abuse-report/notification-recipient/list', {
		method: ['email', 'webhook'],
	});

	recipients.value = result.sort((a, b) => (a.method + a.id).localeCompare(b.method + b.id));
}

onMounted(async () => {
	await fetchRecipients();
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: stretch;
}

.addButton {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.subMenus {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-end;
}

.recipients {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: stretch;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "الكل",
	"mail": "البريد الإلكتروني ",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createRecipient": "Afegeix un destinatari a l'informe de moderació ",
	"recipientType": "Tipus de notificació ",
	"keywords": "Paraules clau",
	"all": "Tot",
	"mail": "Correu electrònic",
	"webhook": "Webhook",
	"deleteConfirm": "Segur que vols esborrar el destinatari de l'informe de moderació?"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Vše",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "All",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createRecipient": "Meldungsempfänger hinzufügen",
	"recipientType": "Art der Benachrichtigung",
	"keywords": "Schlüsselwort",
	"all": "Alle",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Bist du sicher, dass du den Empfänger der Benachrichtigung entfernen möchtest?"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "All",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createRecipient": "Añadir destinatario a los informes",
	"recipientType": "Tipo de notificación",
	"keywords": "Palabras Clave",
	"all": "Todo",
	"mail": "Correo",
	"webhook": "Webhook",
	"deleteConfirm": "¿Estás seguro de que deseas borrar el destinatario del informe de moderación?"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Mots clés\u00a0",
	"all": "Tous",
	"mail": "E-mail ",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createRecipient": "Tambah penerima laporan",
	"recipientType": "Notification type",
	"keywords": "Kata kunci",
	"all": "Semua",
	"mail": "Surel",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createRecipient": "Aggiungi destinatario della segnalazione",
	"recipientType": "Tipo di notifica",
	"keywords": "Parole chiave",
	"all": "Tutte",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Vuoi davvero rimuovere il destinatario della notifica?"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createRecipient": "通報の通知先を追加",
	"recipientType": "通知先の種類",
	"keywords": "キーワード",
	"all": "全て",
	"mail": "メール",
	"webhook": "Webhook",
	"deleteConfirm": "通知先を削除しますか？"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createRecipient": "通報の通知先を追加",
	"recipientType": "通知先の種類",
	"keywords": "キーワード",
	"all": "みんな",
	"mail": "メール",
	"webhook": "Webhook",
	"deleteConfirm": "通知先を削除してもええか？"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "All",
	"mail": "Imayl",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "All",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createRecipient": "신고 수신자 추가",
	"recipientType": "알림 종류",
	"keywords": "키워드",
	"all": "전체",
	"mail": "이메일",
	"webhook": "Webhook",
	"deleteConfirm": "수신자를 삭제하시겠습니까?"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Alle",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Alle",
	"mail": "E-post",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Wszystkie",
	"mail": "Adres e-mail",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createRecipient": "Adicionar destinatário para relatórios de abuso",
	"recipientType": "TIpo de notificação",
	"keywords": "Palavras-chave",
	"all": "Todos",
	"mail": "E-mail",
	"webhook": "Webhook",
	"deleteConfirm": "Você tem certeza de que quer excluir o destinatário da notificação?"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Все",
	"mail": "Электронная почта",
	"webhook": "Вебхук",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Všetko",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createRecipient": "เพิ่มปลายทางการแจ้งเตือนการรายงาน",
	"recipientType": "ประเภทของปลายทางการแจ้งเตือน\n",
	"keywords": "คีย์เวิร์ด",
	"all": "ทั้งหมด",
	"mail": "อีเมล",
	"webhook": "Webhook",
	"deleteConfirm": "ต้องการลบปลายทางการแจ้งเตือนใช่ไหม?"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createRecipient": "Raporlar için alıcı ekle",
	"recipientType": "Bildirim türü",
	"keywords": "Anahtar kelimeler",
	"all": "Tümü",
	"mail": "E-Posta",
	"webhook": "Webhook",
	"deleteConfirm": "Bildirim alıcısını silmek istediğinden emin misin?"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "All",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Всі",
	"mail": "E-mail",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createRecipient": "Add recipient for reports",
	"recipientType": "Notification type",
	"keywords": "Keywords",
	"all": "Tất cả",
	"mail": "Email",
	"webhook": "Webhook",
	"deleteConfirm": "Are you sure that you want to delete the notification recipient?"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createRecipient": "新建举报通知",
	"recipientType": "通知类型",
	"keywords": "关键字",
	"all": "全部",
	"mail": "邮箱",
	"webhook": "Webhook",
	"deleteConfirm": "要删除通知吗？"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createRecipient": "新增接收檢舉的通知對象",
	"recipientType": "通知對象的種類",
	"keywords": "關鍵字",
	"all": "全部",
	"mail": "電子郵件",
	"webhook": "Webhook",
	"deleteConfirm": "確定要刪除通知對象嗎？"
}
</locale>
