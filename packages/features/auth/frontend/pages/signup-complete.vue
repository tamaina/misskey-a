<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div :class="$style.formContainer">
		<form :class="$style.form" class="_panel" @submit.prevent="submit()">
			<div :class="$style.banner">
				<i class="ti ti-user-check"></i>
			</div>
			<div class="_gaps_m" style="padding: 32px;">
				<div>{{ interpolateLocaleParameters($locale.sfc.clickToFinishEmailVerification, { ok: $locale.sfc.gotIt }) }}</div>
				<div>
					<MkButton gradate large rounded type="submit" :disabled="submitting" data-testid="admin-ok" style="margin: 0 auto;">
						{{ submitting ? $locale.sfc.processing : $locale.sfc.gotIt }}<MkEllipsis v-if="submitting"/>
					</MkButton>
				</div>
			</div>
		</form>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '@features/auth/frontend/accounts.js';

const submitting = ref(false);

const props = defineProps<{
	code: string;
}>();

function submit() {
	if (submitting.value) return;
	submitting.value = true;

	misskeyApi('signup-pending', {
		code: props.code,
	}).then(res => {
		return login(res.i, '/');
	}).catch(() => {
		submitting.value = false;

		os.alert({
			type: 'error',
			title: $locale.value.sfc.somethingHappened,
			text: $locale.value.sfc.emailVerificationFailedError,
		});
	});
}
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
	display: grid;
	place-content: center;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--MI-radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
}

.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"somethingHappened": "حدث خطأ",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "انقر [{ok}] لاستيثاق بريدك الإلكتروني.",
	"gotIt": "فهِمت",
	"processing": "المعالجة جارية"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"somethingHappened": "S'ha produït un error",
	"emailVerificationFailedError": "Hem tingut un problema en verificar la teva adreça de correu electrònic. És probable que l'enllaç estigui caducat.",
	"clickToFinishEmailVerification": "Si us plau, fes clic a [{ok}] per completar la verificació per correu electrònic ",
	"gotIt": "D'acord ",
	"processing": "S'està processant..."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Prosíme klikněte na [{ok}] pro dokončení ověření emailu.",
	"gotIt": "Rozumím!",
	"processing": "Zpracovávám"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"somethingHappened": "An error has occurred",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "Got it!",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"emailVerificationFailedError": "Es gab ein Problem bei der Überprüfung Ihrer E-Mail-Adresse. Der Link ist möglicherweise abgelaufen.",
	"clickToFinishEmailVerification": "Drücke bitte auf [{ok}], um die Email-Bestätigung abzuschließen.",
	"gotIt": "Verstanden!",
	"processing": "In Bearbeitung …"
}
</locale>

<locale lang="json" locale="en-US">
{
	"somethingHappened": "An error has occurred",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "Got it!",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"somethingHappened": "Ocurrió un error",
	"emailVerificationFailedError": "Se ha producido un error al confirmar tu dirección de correo electrónico. Es posible que el enlace haya caducado.",
	"clickToFinishEmailVerification": "Cliquée {ok} y verifique su correo",
	"gotIt": "¡Lo tengo!",
	"processing": "Procesando..."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"somethingHappened": "Une erreur est survenue",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Veuillez cliquer sur [{ok}] afin de compléter la vérification par courriel.",
	"gotIt": "J’ai compris !",
	"processing": "Traitement en cours"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"somethingHappened": "Terjadi kesalahan",
	"emailVerificationFailedError": "Ada masalah saat memverifikasi alamat surel anda. Tautannya mungkin sudah kadaluarsa.",
	"clickToFinishEmailVerification": "Mohon klik [{ok}] untuk menyelesaikan verifikasi email.",
	"gotIt": "Mengerti",
	"processing": "Memproses"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"somethingHappened": "Si è verificato un problema",
	"emailVerificationFailedError": "La verifica dell'indirizzo e-mail non è andata a buon fine. Il link potrebbe essere scaduto.",
	"clickToFinishEmailVerification": "Premi il bottone \"{ok}\" per completare la verifica dell'indirizzo email.",
	"gotIt": "ok!",
	"processing": "In elaborazione"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"somethingHappened": "問題が発生しました",
	"emailVerificationFailedError": "メールアドレスの確認中に問題が発生しました。リンクの有効期限が切れている可能性があります。",
	"clickToFinishEmailVerification": "[{ok}]を押して、メールアドレスの確認を完了してください。",
	"gotIt": "わかった",
	"processing": "処理中"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"somethingHappened": "なんかあかんわ",
	"emailVerificationFailedError": "メアド確認してたらなんか変なことなったわ。リンクの期限切れてるかもしれん。",
	"clickToFinishEmailVerification": "[{ok}]を押してメアドの確認を終わらせてなー",
	"gotIt": "ほい",
	"processing": "処理しとる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"somethingHappened": "An error has occurred",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "Got it!",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"somethingHappened": "An error has occurred",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "ಅರ್ಥವಾಯಿತು!",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"somethingHappened": "오류가 발생했습니다",
	"emailVerificationFailedError": "메일 주소 확인에 실패했습니다. 확인에 필요한 URL의 유효기간이 지났을 가능성이 있습니다.",
	"clickToFinishEmailVerification": "[{ok}]를 눌러 이메일 인증을 완료하세요.",
	"gotIt": "알겠어요",
	"processing": "처리중"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"somethingHappened": "Er is iets misgegaan.",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Druk op [{ok}] om de e-mailbevestiging af te ronden.",
	"gotIt": "Begrepen",
	"processing": "Bezig met verwerken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"somethingHappened": "En feil har oppstått",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "Skjønner",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"somethingHappened": "Coś poszło nie tak",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Kliknij [{ok}], aby zakończyć weryfikację e-mail.",
	"gotIt": "Rozumiem!",
	"processing": "Przetwarzanie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"somethingHappened": "Ocorreu um erro",
	"emailVerificationFailedError": "Houve um problema ao verificar seu endereço de email. O link pode ter expirado.",
	"clickToFinishEmailVerification": "Clique em [{ok}] para completar a validação do endereço de e-mail.",
	"gotIt": "Entendi",
	"processing": "Em Progresso"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"somethingHappened": "Что-то пошло не так",
	"emailVerificationFailedError": "Не смогли подтвердить почту. Вероятно, истек срок письма",
	"clickToFinishEmailVerification": "Пожалуйста, нажмите [{ok}], чтобы завершить подтверждение адреса электронной почты.",
	"gotIt": "Ясно!",
	"processing": "Обработка"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Kliknutím na [{ok}] dokončíte overeniu emailu.",
	"gotIt": "Rozumiem!",
	"processing": "Pracujem..."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"emailVerificationFailedError": "เกิดปัญหาในขณะตรวจสอบอีเมล อาจเป็นไปได้ว่าลิงก์หมดอายุแล้ว",
	"clickToFinishEmailVerification": "กรุณาคลิก [{ok}] เพื่อดำเนินการยืนยันอีเมลให้เสร็จสมบูรณ์",
	"gotIt": "เข้าใจแล้ว !",
	"processing": "กำลังประมวลผล..."
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"somethingHappened": "Bir hata oluştu",
	"emailVerificationFailedError": "E-posta adresi doğrulanırken bir sorun oluştu. Bağlantının geçerlilik süresi dolmuş olabilir.",
	"clickToFinishEmailVerification": "E-posta doğrulamasını tamamlamak için lütfen [{ok}] düğmesine tıklayın.",
	"gotIt": "Anladım!",
	"processing": "İşleniyor..."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"somethingHappened": "An error has occurred",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Please click [{ok}] to complete email verification.",
	"gotIt": "Got it!",
	"processing": "Processing..."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"somethingHappened": "Щось пішло не так",
	"emailVerificationFailedError": "Під час підтвердження адреси електронної пошти сталася помилка. Можливо, посилання застаріло.",
	"clickToFinishEmailVerification": "Натисніть [{ok}], щоб завершити перевірку email.",
	"gotIt": "Зрозуміло!",
	"processing": "Обробка"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"somethingHappened": "Xảy ra lỗi",
	"emailVerificationFailedError": "A problem occurred while verifying your email address. The link may have expired.",
	"clickToFinishEmailVerification": "Vui lòng nhấn [{ok}] để hoàn tất việc đăng ký.",
	"gotIt": "Hiểu rồi!",
	"processing": "Đang xử lý"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"somethingHappened": "出错了",
	"emailVerificationFailedError": "确认电子邮件时出现错误。链接可能已过期。",
	"clickToFinishEmailVerification": "点击 [{ok}] 完成电子邮件地址认证。",
	"gotIt": "好",
	"processing": "正在处理"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"somethingHappened": "發生錯誤",
	"emailVerificationFailedError": "驗證您的電子郵件地址時出現問題。連結可能已過期。",
	"clickToFinishEmailVerification": "點擊 [{ok}] 完成電子郵件地址認證。",
	"gotIt": "知道了",
	"processing": "處理中"
}
</locale>
