<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div :class="$style.root" class="_gaps">
			<div :class="$style.subMenus" class="_gaps">
				<MkButton type="routerLink" to="/admin/abuse-report-notification-recipient" primary>{{ $locale.sfc.notificationSetting }}</MkButton>
			</div>

			<MkTip k="abuses">
				{{ $locale.sfc.resolveTutorial }}
			</MkTip>

			<div :class="$style.inputs" class="_gaps">
				<MkSelect v-model="state" :items="stateDef" style="margin: 0; flex: 1;">
					<template #label>{{ $locale.sfc.state }}</template>
				</MkSelect>
				<MkSelect v-model="targetUserOrigin" :items="targetUserOriginDef" style="margin: 0; flex: 1;">
					<template #label>{{ $locale.sfc.reporteeOrigin }}</template>
				</MkSelect>
				<MkSelect v-model="reporterOrigin" :items="reporterOriginDef" style="margin: 0; flex: 1;">
					<template #label>{{ $locale.sfc.reporterOrigin }}</template>
				</MkSelect>
			</div>

			<!-- TODO
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="searchUsername" style="margin: 0; flex: 1;" type="text" :spellcheck="false">
					<span>{{ i18n.ts.username }}</span>
				</MkInput>
				<MkInput v-model="searchHost" style="margin: 0; flex: 1;" type="text" :spellcheck="false" :disabled="paginator.computedParams.value.origin === 'local'">
					<span>{{ i18n.ts.host }}</span>
				</MkInput>
			</div>
			-->

			<MkPagination v-slot="{items}" :paginator="paginator">
				<div class="_gaps">
					<XAbuseReport v-for="report in items" :key="report.id" :report="report" @resolved="resolved"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, markRaw } from 'vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import XAbuseReport from '@features/moderation/frontend/components/MkAbuseReport.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { store } from '@features/preferences/frontend/store.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const {
	model: state,
	def: stateDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.unresolved, value: 'unresolved' },
		{ label: $locale.value.sfc.resolved, value: 'resolved' },
	],
	initialValue: 'unresolved',
});
const {
	model: reporterOrigin,
	def: reporterOriginDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'combined' },
		{ label: $locale.value.sfc.local, value: 'local' },
		{ label: $locale.value.sfc.remote, value: 'remote' },
	],
	initialValue: 'combined',
});
const {
	model: targetUserOrigin,
	def: targetUserOriginDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'combined' },
		{ label: $locale.value.sfc.local, value: 'local' },
		{ label: $locale.value.sfc.remote, value: 'remote' },
	],
	initialValue: 'combined',
});
const searchUsername = ref('');
const searchHost = ref('');

const paginator = markRaw(new Paginator('admin/abuse-user-reports', {
	limit: 10,
	computedParams: computed(() => ({
		state: state.value,
		reporterOrigin: reporterOrigin.value,
		targetUserOrigin: targetUserOrigin.value,
	})),
}));

function resolved(reportId: string) {
	paginator.removeItem(reportId);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.abuseReports,
	icon: 'ti ti-exclamation-circle',
}));
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: stretch;
}

.subMenus {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
}

.inputs {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"all": "الكل",
	"unresolved": "لم يعالج",
	"resolved": "عولج",
	"local": "المحلي",
	"remote": "بُعدي",
	"abuseReports": "البلاغات",
	"notificationSetting": "إعدادات التنبيهات",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "الحالة",
	"reporteeOrigin": "أصل البلاغ",
	"reporterOrigin": "أصل المُبلّغ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot",
	"unresolved": "Sense resoldre",
	"resolved": "Resolt",
	"local": "Local",
	"remote": "Remot",
	"abuseReports": "Denúncies ",
	"notificationSetting": "Paràmetres de notificacions",
	"resolveTutorial": "Si l'informe és legítim selecciona \"Acceptar\" per resoldre'l positivament. Però si l'informe no és legítim selecciona \"Rebutjar\" per resoldre'l negativament.",
	"state": "Estat",
	"reporteeOrigin": "Origen de la denúncia ",
	"reporterOrigin": "Origen del denunciant"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Vše",
	"unresolved": "Nevyřešené",
	"resolved": "Vyřešeno",
	"local": "Lokální",
	"remote": "Vzdálené",
	"abuseReports": "Nahlášení",
	"notificationSetting": "Nastavení oznámení",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Stav",
	"reporteeOrigin": "Původ nahlášení",
	"reporterOrigin": "Původ nahlasovače"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "All",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Reports",
	"notificationSetting": "Notification settings",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alle",
	"unresolved": "Ungelöst",
	"resolved": "Gelöst",
	"local": "Lokal",
	"remote": "Fremd",
	"abuseReports": "Meldungen",
	"notificationSetting": "Benachrichtigungseinstellungen",
	"resolveTutorial": "Wenn der Inhalt der Meldung rechtmäßig ist, wähle „Akzeptieren“, um sie als gelöst zu markieren.\nWenn der Inhalt der Meldung unzulässig ist, wähle „Ablehnen“, um sie zu ignorieren.",
	"state": "Status",
	"reporteeOrigin": "Herkunft des Gemeldeten",
	"reporterOrigin": "Herkunft des Meldenden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "All",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Reports",
	"notificationSetting": "Notification settings",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo",
	"unresolved": "Sin resolver",
	"resolved": "Resuelto",
	"local": "Local",
	"remote": "Remoto",
	"abuseReports": "Reportes",
	"notificationSetting": "Ajustes de Notificaciones",
	"resolveTutorial": "Si el contenido del informe es legítimo, selecciona \"Aceptar\" para marcarlo como resuelto.\nSi el contenido del informe es ilegítimo, selecciona \"Rechazar\" para ignorarlo.",
	"state": "Estado",
	"reporteeOrigin": "Reportar a",
	"reporterOrigin": "Origen del reporte"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Tous",
	"unresolved": "En attente",
	"resolved": "Résolu",
	"local": "Local",
	"remote": "Distant",
	"abuseReports": "Signalements",
	"notificationSetting": "Paramètres des notifications ",
	"resolveTutorial": "Si le signalement est légitime dans son contenu, sélectionnez « Accepter » pour marquer le cas comme résolu par l'affirmative.\nSi le contenu du rapport n'est pas légitime, sélectionnez « Rejeter » pour marquer le cas comme résolu par la négative.",
	"state": "État",
	"reporteeOrigin": "Origine du signalement",
	"reporterOrigin": "Signalé par"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Semua",
	"unresolved": "Belum selesai",
	"resolved": "Selesai",
	"local": "Lokal",
	"remote": "Remote",
	"abuseReports": "Laporkan",
	"notificationSetting": "Pengaturan Notifikasi",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Kondisi",
	"reporteeOrigin": "Yang dilaporkan",
	"reporterOrigin": "Pelapor"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutte",
	"unresolved": "Non risolto",
	"resolved": "Risolto",
	"local": "Locale",
	"remote": "Remota",
	"abuseReports": "Segnalazioni",
	"notificationSetting": "Impostazioni notifiche",
	"resolveTutorial": "Se moderi una segnalazione legittima, scegli \"Approva\" per risolvere positivamente.\nSe la segnalazione non è legittima, seleziona \"Rifiuta\" per risolvere negativamente.",
	"state": "Stato",
	"reporteeOrigin": "Segnalazione a",
	"reporterOrigin": "Segnalazione da"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て",
	"unresolved": "未解決",
	"resolved": "解決済み",
	"local": "ローカル",
	"remote": "リモート",
	"abuseReports": "通報",
	"notificationSetting": "通知設定",
	"resolveTutorial": "内容が正当である通報に対応した場合は「是認」を選択し、肯定的にケースが解決されたことをマークします。\n内容が正当でない通報の場合は「否認」を選択し、否定的にケースが解決されたことをマークします。",
	"state": "状態",
	"reporteeOrigin": "通報先",
	"reporterOrigin": "通報元"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "みんな",
	"unresolved": "まだ解決してないで",
	"resolved": "解決したで",
	"local": "ローカル",
	"remote": "リモート",
	"abuseReports": "通報",
	"notificationSetting": "通知設定",
	"resolveTutorial": "内容がええなら「ええよ」を選ぶんや。肯定的に解決されたことにして記録するで。\n逆に、内容がだめなら「あかんよ」を選びいや。否定的に解決されたって記録しとくで。",
	"state": "状態",
	"reporteeOrigin": "通報先",
	"reporterOrigin": "通報元"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "All",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Reports",
	"notificationSetting": "Notification settings",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "All",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Reports",
	"notificationSetting": "Notification settings",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "전체",
	"unresolved": "처리되지 않음",
	"resolved": "처리함",
	"local": "로컬",
	"remote": "리모트",
	"abuseReports": "신고",
	"notificationSetting": "알림 설정",
	"resolveTutorial": "적절한 신고 내용에 대응한 경우, \"인용\"을 선택하여 \"해결됨\"으로 기록합니다.\n적절하지 않은 신고를 받은 경우, \"기각\"을 선택하여 \"기각\"으로 기록합니다.",
	"state": "상태",
	"reporteeOrigin": "피신고자",
	"reporterOrigin": "신고자"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Alle",
	"unresolved": "Onopgelost",
	"resolved": "Opgelost",
	"local": "Lokaal",
	"remote": "Remote",
	"abuseReports": "Meldt",
	"notificationSetting": "Instellingen meldingen",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Status",
	"reporteeOrigin": "Oorsprong van de gemelde persoon",
	"reporterOrigin": "Verslaggever Oorsprong"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Alle",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Rappoter",
	"notificationSetting": "Varslingsinnstillinger",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Wszystkie",
	"unresolved": "Nierozwiązane",
	"resolved": "Rozwiązane",
	"local": "Lokalne",
	"remote": "Zdalny",
	"abuseReports": "Zgłoszenia",
	"notificationSetting": "Ustawienia powiadomień",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Stan",
	"reporteeOrigin": "Pochodzenie zgłoszonego",
	"reporterOrigin": "Pochodzenie zgłaszającego"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Todos",
	"unresolved": "Não resolvido",
	"resolved": "Resolvido",
	"local": "Local",
	"remote": "Remoto",
	"abuseReports": "Denúncias",
	"notificationSetting": "Configurações de notificação",
	"resolveTutorial": "Se a denúncia for legítima em conteúdo, selecione \"Aceitar\" para marcar o caso como resolvido afirmativamente.\nSe a denúncia for ilegítima em conteúdo, selecione \"Rejeitar\" para marcar o caso como resolvido negativamente.",
	"state": "Estado",
	"reporteeOrigin": "Origem da denúncia",
	"reporterOrigin": "Origem do denunciante"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Все",
	"unresolved": "Без решения",
	"resolved": "Решено",
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"abuseReports": "Жалобы",
	"notificationSetting": "Настройки уведомлений",
	"resolveTutorial": "Если жалоба выглядит достоверной, выберите \"Принять\" что пометить её как решённую.\nЕсли жалоба выглядит недостоверной, нажмите \"Отказать\" что бы проигнорировать её.",
	"state": "Состояние",
	"reporteeOrigin": "О ком сообщено",
	"reporterOrigin": "Кто сообщил"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Všetko",
	"unresolved": "Nevyriešené",
	"resolved": "Vyriešené",
	"local": "Lokálne",
	"remote": "Vzdialené",
	"abuseReports": "Nahlásenia",
	"notificationSetting": "Nastavenia oznámení",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Status",
	"reporteeOrigin": "Pôvod nahláseného",
	"reporterOrigin": "Pôvod nahlasovača"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมด",
	"unresolved": "ยังไม่ได้รับการแก้ไข",
	"resolved": "คลี่คลายแล้ว",
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"abuseReports": "รายงาน",
	"notificationSetting": "ตั้งค่าการแจ้งเตือน",
	"resolveTutorial": "ให้เลือก “ยอมรับ” หากรายงานนี้มีเนื้อหาชอบธรรม เพื่อทำเครื่องหมายว่ากรณีนี้ได้รับการแก้ไขในทางบวก\nให้เลือก “ปฏิเสธ” หากรายงานนี้มีเนื้อหาไม่สมเหตุผล เพื่อทำเครื่องหมายว่ากรณีนี้ได้รับการแก้ไขในทางลบ",
	"state": "สถานะ",
	"reporteeOrigin": "ปลายทางรายงาน",
	"reporterOrigin": "แหล่งผู้รายงาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Tümü",
	"unresolved": "Çözülmemiş",
	"resolved": "Çözülmüş",
	"local": "Yerel",
	"remote": "Uzak",
	"abuseReports": "Raporlar",
	"notificationSetting": "Bildirim ayarları",
	"resolveTutorial": "Raporun içeriği meşruysa, “Kabul Et” seçeneğini seçerek sorunu çözülmüş olarak işaretle.\nRaporun içeriği meşru değilse, “Reddet” seçeneğini seçerek raporu yok say.",
	"state": "Durum",
	"reporteeOrigin": "Bildirim Kaynağı",
	"reporterOrigin": "Bildirenin Kaynağı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "All",
	"unresolved": "Unresolved",
	"resolved": "Resolved",
	"local": "Local",
	"remote": "Remote",
	"abuseReports": "Reports",
	"notificationSetting": "Notification settings",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "State",
	"reporteeOrigin": "Reportee Origin",
	"reporterOrigin": "Reporter Origin"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Всі",
	"unresolved": "Не вирішено",
	"resolved": "Вирішено",
	"local": "Локальні",
	"remote": "Віддалені",
	"abuseReports": "Скарги",
	"notificationSetting": "Параметри сповіщень",
	"resolveTutorial": "Якщо зміст скарги правдивий, оберіть \"Прийняти\" щоб вирішити її.\nЯкщо зміст скарги брехливий, оберіть \"Відхилити\" щоб проігнорувати її.",
	"state": "Стан",
	"reporteeOrigin": "Про кого повідомлено",
	"reporterOrigin": "Хто повідомив"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Tất cả",
	"unresolved": "Chờ xử lý",
	"resolved": "Đã xử lý",
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"abuseReports": "Lượt báo cáo",
	"notificationSetting": "Cài đặt thông báo",
	"resolveTutorial": "If the report's content is legitimate, select \"Accept\" to mark it as resolved.\nIf the report's content is illegitimate, select \"Reject\" to ignore it.",
	"state": "Trạng thái",
	"reporteeOrigin": "Bị báo cáo",
	"reporterOrigin": "Máy chủ người báo cáo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部",
	"unresolved": "未解决",
	"resolved": "已解决",
	"local": "本地",
	"remote": "远程",
	"abuseReports": "举报",
	"notificationSetting": "通知设置",
	"resolveTutorial": "若处理的举报内容属实，请选择 “认可”，以标记该案件已得到妥善解决。\n若举报内容不属实，请选择 “驳回”，以标记该案件未得到妥善解决。",
	"state": "状态",
	"reporteeOrigin": "举报来源",
	"reporterOrigin": "举报者来源"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部",
	"unresolved": "未解決",
	"resolved": "已解決",
	"local": "本地",
	"remote": "遠端",
	"abuseReports": "檢舉",
	"notificationSetting": "通知設定",
	"resolveTutorial": "如果您已回覆正當的檢舉，請選擇「接受」以將案件標記為已解決。\n 如果檢舉的內容不正當，請選擇「拒絕」將案件標記為已解決。",
	"state": "狀態",
	"reporteeOrigin": "檢舉來源",
	"reporterOrigin": "檢舉者來源"
}
</locale>
