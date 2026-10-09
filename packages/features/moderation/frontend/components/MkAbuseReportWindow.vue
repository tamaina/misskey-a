<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow ref="uiWindow" :initialWidth="400" :initialHeight="500" :canResize="true" @closed="emit('closed')">
	<template #header>
		<i class="ti ti-exclamation-circle" style="margin-right: 0.5em;"></i>
		<I18n :src="$locale.sfc.reportAbuseOf" tag="span">
			<template #name>
				<b><MkAcct :user="user"/></b>
			</template>
		</I18n>
	</template>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m" :class="$style.root">
			<div class="">
				<MkTextarea v-model="comment">
					<template #label>{{ $locale.sfc.details }}</template>
					<template #caption>{{ $locale.sfc.fillAbuseReportDescription }}</template>
				</MkTextarea>
			</div>
			<div class="">
				<MkButton primary full :disabled="comment.length === 0" @click="send">{{ $locale.sfc.send }}</MkButton>
			</div>
		</div>
	</div>
</MkWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';

const props = defineProps<{
	user: Misskey.entities.UserLite;
	initialComment?: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const uiWindow = useTemplateRef('uiWindow');
const comment = ref(props.initialComment ?? '');

function send() {
	os.apiWithDialog('users/report-abuse', {
		userId: props.user.id,
		comment: comment.value,
	}, undefined).then(res => {
		os.alert({
			type: 'success',
			text: $locale.value.sfc.abuseReported,
		});
		uiWindow.value?.close();
		emit('closed');
	});
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 16px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"reportAbuseOf": "أبلغ عن {name}",
	"details": "التفاصيل",
	"fillAbuseReportDescription": "أكتب بالتفصيل سبب البلاغ، إذا كنت تبلغ عن ملاحظة أرفق رابط لها.",
	"send": "أرسل",
	"abuseReported": "أُرسل البلاغ، شكرًا لك"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"reportAbuseOf": "Denuncia a {name}",
	"details": "Detalls",
	"fillAbuseReportDescription": "Omple els detalls sobre aquesta denúncia. Si la denúncia és sobre una nota en concret inclou l'adreça URL.",
	"send": "Envia",
	"abuseReported": "La teva denúncia s'ha enviat. Moltes gràcies."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"reportAbuseOf": "Nahlásit {name}",
	"details": "Detaily",
	"fillAbuseReportDescription": "Prosíme vyplňte všechny detaily ohledně tohodle nahlášení. Pokud jde o specifickou poznámku, prosíme o přiložení její URL.",
	"send": "Odeslat",
	"abuseReported": "Nahlášení bylo odesláno. Děkujeme převelice."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"reportAbuseOf": "{name} melden",
	"details": "Details",
	"fillAbuseReportDescription": "Bitte gib zusätzliche Informationen zu dieser Meldung an. Falls es sich um eine spezielle Notiz handelt, bitte gib dessen URL an.",
	"send": "Senden",
	"abuseReported": "Deine Meldung wurde versendet. Vielen Dank."
}
</locale>

<locale lang="json" locale="en-US">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"reportAbuseOf": "Reportar a {name}",
	"details": "Detalles",
	"fillAbuseReportDescription": "Ingrese los detalles del reporte. Si hay una nota en particular, ingrese la URL de esta.",
	"send": "Enviar",
	"abuseReported": "Se ha enviado el reporte. Muchas gracias."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"reportAbuseOf": "Signaler {name}",
	"details": "Détails",
	"fillAbuseReportDescription": "Veuillez expliquer les raisons du signalement. S'il s'agit d'une note précise, veuillez en donner le lien.",
	"send": "Envoyer",
	"abuseReported": "Le rapport est envoyé. Merci."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"reportAbuseOf": "Laporkan {name}",
	"details": "Selengkapnya",
	"fillAbuseReportDescription": "Mohon isi rincian laporan. Jika laporan ini mengenai catatan yang spesifik, mohon lampirkan serta URL catatan tersebut.",
	"send": "Kirim",
	"abuseReported": "Laporan kamu telah dikirimkan. Terima kasih."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"reportAbuseOf": "Segnalare {name}",
	"details": "Dettagli",
	"fillAbuseReportDescription": "Per favore, spiegaci il motivo della segnalazione. Se riguarda una Nota precisa, indica anche l'indirizzo URL.",
	"send": "Inviare",
	"abuseReported": "La segnalazione è stata inviata. Grazie."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"reportAbuseOf": "{name}を通報する",
	"details": "詳細",
	"fillAbuseReportDescription": "通報理由の詳細を記入してください。対象のノートやページなどがある場合はそのURLも記入してください。",
	"send": "送信",
	"abuseReported": "内容が送信されました。ご報告ありがとうございました。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"reportAbuseOf": "{name}を通報する",
	"details": "もっと",
	"fillAbuseReportDescription": "細かい通報理由を書いてなー。対象ノートがある時はそのURLも書いといてなー。",
	"send": "送信",
	"abuseReported": "無事内容が送信されたみたいやで。おおきに〜。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"reportAbuseOf": "{name} 신고하기",
	"details": "자세히",
	"fillAbuseReportDescription": "신고 사유를 자세히 기재해 주세요. 대상 노트나 페이지 등이 있는 경우에는 해당 URL도 기재해 주세요.",
	"send": "전송",
	"abuseReported": "신고를 보냈습니다. 신고해 주셔서 감사합니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"reportAbuseOf": "Meld {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Vul s.v.p. de details in over deze melding. Geef, als het over een specifieke notitie gaat, ook de URL op.",
	"send": "Stuur",
	"abuseReported": "Uw rapport is verzonden. Hartelijk dank."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"reportAbuseOf": "Zgłoś {name}",
	"details": "Szczegóły",
	"fillAbuseReportDescription": "Wypełnij szczegóły zgłoszenia. Jeżeli dotyczy ono określonego wpisu, uwzględnij jego adres URL.",
	"send": "Wyślij",
	"abuseReported": "Twoje zgłoszenie zostało wysłane. Dziękujemy."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"reportAbuseOf": "Denunciar {name}",
	"details": "Detalhes",
	"fillAbuseReportDescription": "Por favor, forneça detalhes sobre o motivo da denúncia. Se houver uma nota específica envolvida, inclua também a URL dela.",
	"send": "Enviar",
	"abuseReported": "Denúncia enviada. Obrigado por sua ajuda."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"reportAbuseOf": "Пожаловаться на пользователя {name}",
	"details": "Подробнее",
	"fillAbuseReportDescription": "Опишите, пожалуйста, причину жалобы подробнее. Если речь о конкретной заметке, будьте добры приложить ссылку на неё.",
	"send": "Отправить",
	"abuseReported": "Жалоба отправлена. Большое спасибо за информацию."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"reportAbuseOf": "Nahlásiť {name}",
	"details": "Detaily",
	"fillAbuseReportDescription": "Prosím vyplňte podrobnosti nahlásenia. Ak sa týka konkrétnej poznámky, prosím napíšte jej URL.",
	"send": "Poslať",
	"abuseReported": "Vaše nahlásenie je odoslané. Veľmi pekne ďakujeme."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"reportAbuseOf": "รายงาน {name}",
	"details": "รายละเอียด",
	"fillAbuseReportDescription": "กรุณากรอกรายละเอียดเกี่ยวกับรายงานนี้ หากเป็นเรื่องเกี่ยวกับโน้ตโดยเฉพาะ ได้โปรดระบุ URL",
	"send": "ส่ง",
	"abuseReported": "เราได้ส่งรายงานของคุณไปแล้ว ขอบคุณมากๆนะ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"reportAbuseOf": "{name} raporu",
	"details": "Ayrıntılar",
	"fillAbuseReportDescription": "Bu raporla ilgili ayrıntıları lütfen doldur. Belirli bir notla ilgiliyse, lütfen URL'sini de ekle.",
	"send": "Gönder",
	"abuseReported": "Raporunuz gönderildi. Çok teşekkür ederiz."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"reportAbuseOf": "Report {name}",
	"details": "Details",
	"fillAbuseReportDescription": "Please fill in details regarding this report. If it is about a specific note, please include its URL.",
	"send": "Send",
	"abuseReported": "Your report has been sent. Thank you very much."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"reportAbuseOf": "Поскаржитись на {name}",
	"details": "Детальніше",
	"fillAbuseReportDescription": "Будь ласка, вкажіть подробиці скарги. Якщо скарга стосується запису, вкажіть посилання на нього.",
	"send": "Відправити",
	"abuseReported": "Дякуємо, вашу скаргу було відправлено. "
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"reportAbuseOf": "Báo cáo {name}",
	"details": "Chi tiết",
	"fillAbuseReportDescription": "Vui lòng điền thông tin chi tiết về báo cáo này. Nếu đó là về một tút cụ thể, hãy kèm theo URL của tút.",
	"send": "Gửi",
	"abuseReported": "Báo cáo đã được gửi. Cảm ơn bạn nhiều."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"reportAbuseOf": "举报 {name}",
	"details": "详情",
	"fillAbuseReportDescription": "请填写举报的详细原因。如果有对方发的帖子，请同时填写 URL 地址。",
	"send": "发送",
	"abuseReported": "内容已发送。感谢您提交信息。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"reportAbuseOf": "檢舉{name}",
	"details": "詳細資訊",
	"fillAbuseReportDescription": "請填寫檢舉的詳細理由。如有需要，請附上相關 URL。",
	"send": "發送",
	"abuseReported": "檢舉完成。感謝您的報告。"
}
</locale>
