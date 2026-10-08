<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<SearchMarker path="/admin/relays" :label="$locale.sfc.relays" :keywords="['relays']" icon="ti ti-planet">
			<div class="_gaps">
				<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel" style="padding: 16px;">
					<div>{{ relay.inbox }}</div>
					<div style="margin: 8px 0;">
						<i v-if="relay.status === 'accepted'" class="ti ti-check" :class="$style.icon" style="color: var(--MI_THEME-success);"></i>
						<i v-else-if="relay.status === 'rejected'" class="ti ti-ban" :class="$style.icon" style="color: var(--MI_THEME-error);"></i>
						<i v-else class="ti ti-clock" :class="$style.icon"></i>
						<span>{{ copyLocaleDictionary($locale.sfc.relayStatusLabels)[relay.status] }}</span>
					</div>
					<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="ti ti-trash"></i> {{ $locale.sfc.remove }}</MkButton>
				</div>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';

const relays = ref<Misskey.entities.AdminRelaysListResponse>([]);

async function addRelay() {
	const { canceled, result: inbox } = await os.inputText({
		title: $locale.value.sfc.addRelay,
		type: 'url',
		placeholder: $locale.value.sfc.inboxUrl,
	});
	if (canceled || inbox == null) return;
	misskeyApi('admin/relays/add', {
		inbox,
	}).then(() => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function remove(inbox: string) {
	misskeyApi('admin/relays/remove', {
		inbox,
	}).then(() => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function refresh() {
	misskeyApi('admin/relays/list').then(relayList => {
		relays.value = relayList;
	});
}

refresh();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.addRelay,
	handler: addRelay,
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.relays,
	icon: 'ti ti-planet',
}));
</script>

<style lang="scss" module>
.icon {
	width: 1em;
	margin-right: 0.75em;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"relays": "المُرَحلات",
	"relayStatusLabels": {
		"requesting": "مُعلّق",
		"accepted": "مقبول",
		"rejected": "مرفوض"
	},
	"remove": "حذف",
	"addRelay": "إضافة مُرحّل",
	"inboxUrl": "رابط صندوق الوارد"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"relays": "Relés",
	"relayStatusLabels": {
		"requesting": "Pendent",
		"accepted": "Acceptat",
		"rejected": "Rebutjat"
	},
	"remove": "Eliminar",
	"addRelay": "Afegeix relés",
	"inboxUrl": "Enllaç de la safata d'entrada"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"relays": "Relay",
	"relayStatusLabels": {
		"requesting": "Čeká se",
		"accepted": "Schváleno",
		"rejected": "Odmítnuto"
	},
	"remove": "Smazat",
	"addRelay": "Přidat Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "Delete",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Ausstehend",
		"accepted": "Akzeptiert",
		"rejected": "Abgelehnt"
	},
	"remove": "Löschen",
	"addRelay": "Relay hinzufügen",
	"inboxUrl": "inbox-URL"
}
</locale>

<locale lang="json" locale="en-US">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "Delete",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"relays": "Relés",
	"relayStatusLabels": {
		"requesting": "Pendiente",
		"accepted": "Aceptar",
		"rejected": "Rechazada"
	},
	"remove": "Borrar",
	"addRelay": "Agregar relé",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"relays": "Relais",
	"relayStatusLabels": {
		"requesting": "En attente",
		"accepted": "Accepté",
		"rejected": "Refusée"
	},
	"remove": "Supprimer",
	"addRelay": "Ajouter un relais",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"relays": "Relay",
	"relayStatusLabels": {
		"requesting": "Menunggu",
		"accepted": "Disetujui",
		"rejected": "Ditolak"
	},
	"remove": "Hapus",
	"addRelay": "Tambahkan relay",
	"inboxUrl": "URL Kotak masuk"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"relays": "Ripetitori",
	"relayStatusLabels": {
		"requesting": "In attesa di approvazione",
		"accepted": "Approvato",
		"rejected": "Respinto"
	},
	"remove": "Elimina",
	"addRelay": "Aggiungi ripetitore",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"relays": "リレー",
	"relayStatusLabels": {
		"requesting": "承認待ち",
		"accepted": "承認済み",
		"rejected": "拒否済み"
	},
	"remove": "削除",
	"addRelay": "リレーの追加",
	"inboxUrl": "inboxのURL"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"relays": "リレー",
	"relayStatusLabels": {
		"requesting": "承認待ち",
		"accepted": "承認済み",
		"rejected": "拒否済み"
	},
	"remove": "ほかす",
	"addRelay": "リレーの追加",
	"inboxUrl": "inboxのURL"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "Kkes",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "ಅಳಿಸು",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"relays": "릴레이",
	"relayStatusLabels": {
		"requesting": "대기 중",
		"accepted": "승인됨",
		"rejected": "거절됨"
	},
	"remove": "삭제",
	"addRelay": "릴레이 추가",
	"inboxUrl": "Inbox 주소"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "Verwijderen",
	"addRelay": "Relay toevoegen",
	"inboxUrl": "Inbox-URL"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "Slett",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"relays": "Przekaźniki",
	"relayStatusLabels": {
		"requesting": "Oczekujące",
		"accepted": "Zaakceptowano",
		"rejected": "Odrzucono"
	},
	"remove": "Usuń",
	"addRelay": "Dodaj przekaźnik",
	"inboxUrl": "Adres URL skrzynki nadawczej"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pendente",
		"accepted": "Aprovado",
		"rejected": "Recusado"
	},
	"remove": "Remover",
	"addRelay": "Adicionar relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"relays": "Ретрансляторы",
	"relayStatusLabels": {
		"requesting": "В ожидании одобрения",
		"accepted": "Одобрено.",
		"rejected": "Отказано."
	},
	"remove": "Удалить",
	"addRelay": "Добавить ретранслятор",
	"inboxUrl": "URL ящика входящих сообщений"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"relays": "Prenos",
	"relayStatusLabels": {
		"requesting": "Čaká sa",
		"accepted": "Akceptované",
		"rejected": "Odmietnuté"
	},
	"remove": "Odstrániť",
	"addRelay": "Pridať prenos",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"relays": "รีเลย์",
	"relayStatusLabels": {
		"requesting": "กำลังรอการยืนยัน",
		"accepted": "ได้รับการอนุมัติ",
		"rejected": "ถูกปฏิเสธ"
	},
	"remove": "ลบ",
	"addRelay": "เพิ่มรีเลย์",
	"inboxUrl": "URL ของอินบ็อกซ์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"relays": "Röleler",
	"relayStatusLabels": {
		"requesting": "Beklemede",
		"accepted": "Accepted",
		"rejected": "Reddedildi"
	},
	"remove": "Sil",
	"addRelay": "Röle ekle",
	"inboxUrl": "Gelen Kutusu URL"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"relays": "Relays",
	"relayStatusLabels": {
		"requesting": "Pending",
		"accepted": "Accepted",
		"rejected": "Rejected"
	},
	"remove": "ئۆچۈرۈش",
	"addRelay": "Add Relay",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"relays": "Ретранслятори",
	"relayStatusLabels": {
		"requesting": "Очікує затвердження",
		"accepted": "Затверджено",
		"rejected": "Відхилено"
	},
	"remove": "Видалити",
	"addRelay": "Додати ретранслятор",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"relays": "Chuyển tiếp",
	"relayStatusLabels": {
		"requesting": "Đang chờ",
		"accepted": "Đã duyệt",
		"rejected": "Đã từ chối"
	},
	"remove": "Xóa",
	"addRelay": "Thêm chuyển tiếp",
	"inboxUrl": "URL Hộp thư đến"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"relays": "中继",
	"relayStatusLabels": {
		"requesting": "待批准",
		"accepted": "已批准",
		"rejected": "已拒绝"
	},
	"remove": "删除",
	"addRelay": "添加中继",
	"inboxUrl": "Inbox URL"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"relays": "中繼器",
	"relayStatusLabels": {
		"requesting": "等待核准",
		"accepted": "已通過核准",
		"rejected": "已拒絕"
	},
	"remove": "刪除",
	"addRelay": "新增中繼器",
	"inboxUrl": "收件夾 URL"
}
</locale>
