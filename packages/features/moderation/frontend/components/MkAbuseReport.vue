<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #icon>
		<i v-if="report.resolved && report.resolvedAs === 'accept'" class="ti ti-check" style="color: var(--MI_THEME-success)"></i>
		<i v-else-if="report.resolved && report.resolvedAs === 'reject'" class="ti ti-x" style="color: var(--MI_THEME-error)"></i>
		<i v-else-if="report.resolved" class="ti ti-slash"></i>
		<i v-else class="ti ti-exclamation-circle" style="color: var(--MI_THEME-warn)"></i>
	</template>
	<template #label><MkAcct :user="report.targetUser"/> (by <MkAcct :user="report.reporter"/>)</template>
	<template #caption>{{ report.comment }}</template>
	<template #suffix><MkTime :time="report.createdAt"/></template>
	<template #footer>
		<div class="_buttons">
			<template v-if="!report.resolved">
				<MkButton @click="resolve('accept')"><i class="ti ti-check" style="color: var(--MI_THEME-success)"></i> {{ $locale.sfc.resolve }} ({{ $locale.sfc.accept }})</MkButton>
				<MkButton @click="resolve('reject')"><i class="ti ti-x" style="color: var(--MI_THEME-error)"></i> {{ $locale.sfc.resolve }} ({{ $locale.sfc.reject }})</MkButton>
				<MkButton @click="resolve(null)"><i class="ti ti-slash"></i> {{ $locale.sfc.resolve }} ({{ $locale.sfc.other }})</MkButton>
			</template>
			<template v-if="report.targetUser.host != null">
				<MkButton :disabled="report.forwarded" primary @click="forward"><i class="ti ti-corner-up-right"></i> {{ $locale.sfc.forward }}</MkButton>
				<div v-tooltip:dialog="$locale.sfc.forwardDescription" class="_button _help"><i class="ti ti-help-circle"></i></div>
			</template>
			<button class="_button" style="margin-left: auto; width: 34px;" @click="showMenu"><i class="ti ti-dots"></i></button>
		</div>
	</template>

	<div class="_gaps_s">
		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.targetUser" style="width: 18px; height: 18px;"/></template>
			<template #label>{{ $locale.sfc.target }}: <MkAcct :user="report.targetUser"/></template>
			<template #suffix>#{{ report.targetUserId.toUpperCase() }}</template>

			<div style="height: 300px; --MI-stickyTop: 0; --MI-stickyBottom: 0;">
				<RouterView :router="targetRouter"/>
			</div>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ $locale.sfc.details }}</template>
			<div class="_gaps_s">
				<Mfm :text="report.comment" :linkNavigationBehavior="'window'"/>
			</div>
		</MkFolder>

		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.reporter" style="width: 18px; height: 18px;"/></template>
			<template #label>{{ $locale.sfc.reporter }}: <MkAcct :user="report.reporter"/></template>
			<template #suffix>#{{ report.reporterId.toUpperCase() }}</template>

			<div style="height: 300px; --MI-stickyTop: 0; --MI-stickyBottom: 0;">
				<RouterView :router="reporterRouter"/>
			</div>
		</MkFolder>

		<MkFolder :defaultOpen="false">
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ $locale.sfc.moderationNote }}</template>
			<template #suffix>{{ moderationNote.length > 0 ? '...' : $locale.sfc.none }}</template>
			<div class="_gaps_s">
				<MkTextarea v-model="moderationNote" manualSave>
					<template #caption>{{ $locale.sfc.moderationNoteDescription }}</template>
				</MkTextarea>
			</div>
		</MkFolder>

		<div v-if="report.assignee">
			{{ $locale.sfc.moderator }}:
			<MkAcct :user="report.assignee"/>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { provide, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import * as os from '@features/ui/frontend/os.js';
import { dateString } from '@features/ui/frontend/filters/date.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import RouterView from '@features/navigation/frontend/components/global/RouterView.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { createRouter } from '@features/navigation/frontend/router.js';

const props = defineProps<{
	report: Misskey.entities.AdminAbuseUserReportsResponse[number];
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const targetRouter = createRouter(`/admin/user/${props.report.targetUserId}`);
targetRouter.init();
const reporterRouter = createRouter(`/admin/user/${props.report.reporterId}`);
reporterRouter.init();

const moderationNote = ref(props.report.moderationNote ?? '');

watch(moderationNote, async () => {
	os.apiWithDialog('admin/update-abuse-user-report', {
		reportId: props.report.id,
		moderationNote: moderationNote.value,
	}).then(() => {
	});
});

function resolve(resolvedAs: 'accept' | 'reject' | null) {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		reportId: props.report.id,
		resolvedAs,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}

function forward() {
	os.apiWithDialog('admin/forward-abuse-user-report', {
		reportId: props.report.id,
	}).then(() => {

	});
}

function showMenu(ev: PointerEvent) {
	os.popupMenu([{
		icon: 'ti ti-hash',
		text: 'Copy ID',
		action: () => {
			copyToClipboard(props.report.id);
		},
	}, {
		icon: 'ti ti-json',
		text: 'Copy JSON',
		action: () => {
			copyToClipboard(JSON.stringify(props.report, null, '\t'));
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
</style>

<locale locale="ar-SA" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "منوعات",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "التفاصيل",
  "reporter": "المُبلّغ",
  "moderationNote": "Moderation note",
  "none": "لا شيء",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "مشرِف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "resolve": "Solució ",
  "accept": "Acceptar ",
  "reject": "Rebutjar",
  "other": "Altres",
  "forward": "Reenviar ",
  "forwardDescription": "Reenvia l'informe a una altra instància com un compte del sistema anònima.",
  "target": "Assumpte ",
  "details": "Detalls",
  "reporter": "Denunciant ",
  "moderationNote": "Nota de moderació ",
  "none": "Res",
  "moderationNoteDescription": "Pots escriure notes que es compartiran entre els moderadors.",
  "moderator": "Moderador/a"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Ostatní",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Detaily",
  "reporter": "Nahlásil",
  "moderationNote": "Poznámka moderátora",
  "none": "Žádný",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderátor"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Other",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "None",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "resolve": "lösen",
  "accept": "Akzeptieren",
  "reject": "Ablehnen",
  "other": "Anderes",
  "forward": "Weiterleiten",
  "forwardDescription": "Leite die Meldung an einen entfernten Server als anonymes Systemkonto weiter.",
  "target": "Speicherort",
  "details": "Details",
  "reporter": "Melder",
  "moderationNote": "Moderationsnotiz",
  "none": "Nichts",
  "moderationNoteDescription": "Trage hier Notizen ein. Diese sind nur für die Moderatoren sichtbar.",
  "moderator": "Moderator"
}
</locale>

<locale locale="en-US" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Other",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "None",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "resolve": "Resuelto",
  "accept": "Acepte",
  "reject": "repudio",
  "other": "Otro",
  "forward": "Reenviar",
  "forwardDescription": "Reenvía el informe a un servidor/instancia remoto como cuenta anónima del sistema.",
  "target": "Para",
  "details": "Detalles",
  "reporter": "Reportador",
  "moderationNote": "Nota de moderación",
  "none": "Ninguna",
  "moderationNoteDescription": "Puedes rellenar notas que solo se comparten entre moderadores.",
  "moderator": "Moderador"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "resolve": "Résoudre",
  "accept": "Accepter",
  "reject": "Rejeter",
  "other": "Autre",
  "forward": "Transférer",
  "forwardDescription": "Transférer le signalement vers une instance distante en tant qu'anonyme.",
  "target": "Destinataire",
  "details": "Détails",
  "reporter": "Signalé par",
  "moderationNote": "Note de modération",
  "none": "Rien",
  "moderationNoteDescription": "Vous pouvez remplir des notes qui seront partagés seulement entre modérateurs.",
  "moderator": "Modérateur·rice·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "resolve": "Resolve",
  "accept": "Setuju",
  "reject": "Tolak",
  "other": "Lainnya",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Selengkapnya",
  "reporter": "Pelapor",
  "moderationNote": "Catatan moderasi",
  "none": "Tidak ada",
  "moderationNoteDescription": "Anda dapat mengisi note yang hanya akan dibagikan diantara moderator.",
  "moderator": "Moderator"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "resolve": "Risolvi",
  "accept": "Approva",
  "reject": "Rifiuta",
  "other": "Eccetera",
  "forward": "Inoltra",
  "forwardDescription": "Inoltra il report al server remoto, per mezzo di account di sistema, anonimo.",
  "target": "Riferimento",
  "details": "Dettagli",
  "reporter": "il corrispondente",
  "moderationNote": "Promemoria di moderazione",
  "none": "Nessuna",
  "moderationNoteDescription": "Puoi scrivere promemoria condivisi solo tra moderatori.",
  "moderator": "Moderatore"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "resolve": "解決",
  "accept": "是認",
  "reject": "否認",
  "other": "その他",
  "forward": "転送",
  "forwardDescription": "匿名のシステムアカウントとして、リモートサーバーに通報を転送します。",
  "target": "対象",
  "details": "詳細",
  "reporter": "通報者",
  "moderationNote": "モデレーションノート",
  "none": "なし",
  "moderationNoteDescription": "モデレーター間でだけ共有されるメモを記入することができます。",
  "moderator": "モデレーター"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "resolve": "解決",
  "accept": "ええよ",
  "reject": "あかんよ",
  "other": "その他",
  "forward": "転送",
  "forwardDescription": "匿名のシステムアカウントってことにして、リモートサーバーに通報を転送するで。",
  "target": "対象",
  "details": "もっと",
  "reporter": "通報者",
  "moderationNote": "モデレーションノート",
  "none": "なし",
  "moderationNoteDescription": "モデレーターの中だけで共有するメモを入れれるで。",
  "moderator": "モデレーター"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Wiyyaḍ",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "None",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Other",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "None",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "resolve": "해결됨",
  "accept": "인용",
  "reject": "기각",
  "other": "기타",
  "forward": "전달",
  "forwardDescription": "익명 시스템 계정을 사용하여 리모트 서버에 신고 내용을 전달할 수 있습니다.",
  "target": "대상",
  "details": "자세히",
  "reporter": "신고자",
  "moderationNote": "조정 기록",
  "none": "없음",
  "moderationNoteDescription": "모더레이터 역할을 가진 유저만 보이는 메모를 적을 수 있습니다.",
  "moderator": "모더레이터"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Ander",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Verslaggever",
  "moderationNote": "Moderatienotitie",
  "none": "Niets",
  "moderationNoteDescription": "Voer hier notities in. Deze zijn alleen zichtbaar voor de moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Andre",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "Ingen",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Inne",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Szczegóły",
  "reporter": "Zgłaszający",
  "moderationNote": "Notka moderacyjna",
  "none": "Brak",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "resolve": "Resolver",
  "accept": "Aceitar",
  "reject": "Rejeitar",
  "other": "Outros",
  "forward": "Encaminhar",
  "forwardDescription": "Encaminhar a denúncia ao servidor remoto como uma conta anônima do sistema.",
  "target": "Alvo",
  "details": "Detalhes",
  "reporter": "Denunciante",
  "moderationNote": "Nota de moderação",
  "none": "Nenhum",
  "moderationNoteDescription": "Você pode preencher notas que serão compartilhadas apenas com moderadores.",
  "moderator": "Moderador"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "resolve": "Решить",
  "accept": "Принять",
  "reject": "Отказать",
  "other": "Другие",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Цель",
  "details": "Подробнее",
  "reporter": "Сообщивший",
  "moderationNote": "Примечания модератора",
  "none": "Ничего",
  "moderationNoteDescription": "Вы можете заполнять заметки, которые будут доступны только модераторам.",
  "moderator": "Модератор"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Ostatní",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Detaily",
  "reporter": "Nahlásil",
  "moderationNote": "Moderation note",
  "none": "Žiadne",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderátor"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "resolve": "แก้ไข",
  "accept": "ยอมรับ",
  "reject": "ปฏิเสธ",
  "other": "อื่น ๆ",
  "forward": "ส่ง\u200bต่อ",
  "forwardDescription": "ส่งรายงานไปยังเซิร์ฟเวอร์ระยะไกลโดยใช้บัญชีระบบที่ไม่ระบุตัวตน",
  "target": "เป้า",
  "details": "รายละเอียด",
  "reporter": "ผู้รายงาน",
  "moderationNote": "โน้ตการกลั่นกรอง",
  "none": "ไม่มี",
  "moderationNoteDescription": "สามารถจดเมโมที่จะแบ่งปันเฉพาะระหว่างผู้ควบคุมได้",
  "moderator": "ผู้ควบคุม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "resolve": "Çözüm",
  "accept": "Kabul et",
  "reject": "Reddet",
  "other": "Diğer",
  "forward": "İleri",
  "forwardDescription": "Raporu, anonim bir sistem hesabı olarak uzak bir sunucuya iletin.",
  "target": "Hedef",
  "details": "Ayrıntılar",
  "reporter": "Raporlayan",
  "moderationNote": "Moderasyon notu",
  "none": "Hiçbiri",
  "moderationNoteDescription": "Moderatörler arasında paylaşılacak notları girebilirsin.",
  "moderator": "Moderatör"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Other",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Details",
  "reporter": "Reporter",
  "moderationNote": "Moderation note",
  "none": "None",
  "moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
  "moderator": "Moderator"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "resolve": "Вирішити",
  "accept": "Прийняти",
  "reject": "Відхилити",
  "other": "Інше",
  "forward": "Переслати",
  "forwardDescription": "Переслати скаргу до видаленого сервера як анонімний системний обліковий запис.",
  "target": "Ціль",
  "details": "Детальніше",
  "reporter": "Репортер",
  "moderationNote": "Модераторська нотатка",
  "none": "Відсутній",
  "moderationNoteDescription": "Ви можете додати нотатки, які будуть доступні лише модераторам.\n",
  "moderator": "Модератор"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "resolve": "Resolve",
  "accept": "Accept",
  "reject": "Reject",
  "other": "Khác",
  "forward": "Forward",
  "forwardDescription": "Forward the report to a remote server as an anonymous system account.",
  "target": "Target",
  "details": "Chi tiết",
  "reporter": "Người báo cáo",
  "moderationNote": "Ghi chú kiểm duyệt",
  "none": "Không",
  "moderationNoteDescription": "Bạn có thể điền vào những ghi chú chỉ được chia sẻ giữa những người kiểm duyệt.",
  "moderator": "Kiểm duyệt viên"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "resolve": "解决",
  "accept": "认可",
  "reject": "驳回",
  "other": "其他",
  "forward": "转发",
  "forwardDescription": "以匿名系统账户的身份，将举报转发至远程服务器。",
  "target": "对象",
  "details": "详情",
  "reporter": "举报者",
  "moderationNote": "管理笔记",
  "none": "无",
  "moderationNoteDescription": "可以用来记录仅在管理员之间共享的笔记。",
  "moderator": "监察员"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "resolve": "解決",
  "accept": "接受",
  "reject": "拒絕",
  "other": "其他",
  "forward": "轉發",
  "forwardDescription": "以匿名系統帳戶將檢舉轉發至遠端伺服器。",
  "target": "目標 ",
  "details": "詳細資訊",
  "reporter": "檢舉者",
  "moderationNote": "管理筆記",
  "none": "無",
  "moderationNoteDescription": "您可以編寫僅在審查員之間共用的註解。",
  "moderator": "審查員"
}
</locale>
