<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-checklist"></i>
	</div>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m">
			<div v-if="instance.disableRegistration || instance.federation !== 'all'" class="_gaps_s">
				<MkInfo v-if="instance.disableRegistration" warn>{{ $locale.sfc.invitationRequiredToRegister }}</MkInfo>
				<MkInfo v-if="instance.federation === 'specified'" warn>{{ $locale.sfc.federationSpecified }}</MkInfo>
				<MkInfo v-else-if="instance.federation === 'none'" warn>{{ $locale.sfc.federationDisabled }}</MkInfo>
			</div>

			<div style="text-align: center;">
				<div>{{ $locale.sfc.pleaseConfirmBelowBeforeSignup }}</div>
				<div style="font-weight: bold; margin-top: 0.5em;">{{ $locale.sfc.beSureToReadThisAsItIsImportant }}</div>
			</div>

			<MkFolder v-if="availableServerRules" :defaultOpen="true">
				<template #label>{{ $locale.sfc.serverRules }}</template>
				<template #suffix><i v-if="agreeServerRules" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>

				<ol class="_gaps_s" :class="$style.rules">
					<li v-for="item in instance.serverRules" :class="$style.rule"><div :class="$style.ruleText" v-html="item"></div></li>
				</ol>

				<MkSwitch :modelValue="agreeServerRules" style="margin-top: 16px;" @update:modelValue="updateAgreeServerRules">{{ $locale.sfc.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder v-if="availableTos || availablePrivacyPolicy" :defaultOpen="true">
				<template #label>{{ tosPrivacyPolicyLabel }}</template>
				<template #suffix><i v-if="agreeTosAndPrivacyPolicy" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>
				<div class="_gaps_s">
					<div v-if="availableTos"><a :href="instance.tosUrl ?? undefined" class="_link" target="_blank">{{ $locale.sfc.termsOfService }} <i class="ti ti-external-link"></i></a></div>
					<div v-if="availablePrivacyPolicy"><a :href="instance.privacyPolicyUrl ?? undefined" class="_link" target="_blank">{{ $locale.sfc.privacyPolicy }} <i class="ti ti-external-link"></i></a></div>
				</div>

				<MkSwitch :modelValue="agreeTosAndPrivacyPolicy" style="margin-top: 16px;" @update:modelValue="updateAgreeTosAndPrivacyPolicy">{{ $locale.sfc.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ $locale.sfc.basicNotesBeforeCreateAccount }}</template>
				<template #suffix><i v-if="agreeNote" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>

				<a href="https://misskey-hub.net/docs/for-users/onboarding/warning/" class="_link" target="_blank">{{ $locale.sfc.basicNotesBeforeCreateAccount }} <i class="ti ti-external-link"></i></a>

				<MkSwitch :modelValue="agreeNote" style="margin-top: 16px;" data-testid="signup-rules-notes-agree" @update:modelValue="updateAgreeNote">{{ $locale.sfc.agree }}</MkSwitch>
			</MkFolder>

			<div v-if="!agreed" style="text-align: center;">{{ $locale.sfc.pleaseAgreeAllToContinue }}</div>

			<div class="_buttonsCenter">
				<MkButton inline rounded @click="emit('cancel')">{{ $locale.sfc.cancel }}</MkButton>
				<MkButton inline primary rounded gradate :disabled="!agreed" data-testid="signup-rules-continue" @click="emit('done')">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';

const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null && instance.tosUrl !== '';
const availablePrivacyPolicy = instance.privacyPolicyUrl != null && instance.privacyPolicyUrl !== '';

const agreeServerRules = ref(false);
const agreeTosAndPrivacyPolicy = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return (!availableServerRules || agreeServerRules.value) && ((!availableTos && !availablePrivacyPolicy) || agreeTosAndPrivacyPolicy.value) && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'cancel'): void;
	(ev: 'done'): void;
}>();

const tosPrivacyPolicyLabel = computed(() => {
	if (availableTos && availablePrivacyPolicy) {
		return $locale.value.sfc.tosAndPrivacyPolicy;
	} else if (availableTos) {
		return $locale.value.sfc.termsOfService;
	} else if (availablePrivacyPolicy) {
		return $locale.value.sfc.privacyPolicy;
	} else {
		return '';
	}
});

async function updateAgreeServerRules(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.doYouAgree,
			text: interpolateLocaleParameters($locale.value.sfc.iHaveReadXCarefullyAndAgree, { x: $locale.value.sfc.serverRules }),
		});
		if (confirm.canceled) return;
		agreeServerRules.value = true;
	} else {
		agreeServerRules.value = false;
	}
}

async function updateAgreeTosAndPrivacyPolicy(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.doYouAgree,
			text: interpolateLocaleParameters($locale.value.sfc.iHaveReadXCarefullyAndAgree, {
				x: tosPrivacyPolicyLabel.value,
			}),
		});
		if (confirm.canceled) return;
		agreeTosAndPrivacyPolicy.value = true;
	} else {
		agreeTosAndPrivacyPolicy.value = false;
	}
}

async function updateAgreeNote(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.doYouAgree,
			text: interpolateLocaleParameters($locale.value.sfc.iHaveReadXCarefullyAndAgree, { x: $locale.value.sfc.basicNotesBeforeCreateAccount }),
		});
		if (confirm.canceled) return;
		agreeNote.value = true;
	} else {
		agreeNote.value = false;
	}
}
</script>

<style lang="scss" module>
.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--MI-stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"invitationRequiredToRegister": "هذا المثيل للمدعوين فقط. لتسجيل فيه تحتاج رمزًا صالحًا.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "رجاءً وافق على ما يلي قبل التسجيل.",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "قوانين الخادم",
	"agree": "أقبل",
	"termsOfService": "شروط الخدمة",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "ملاحظات مهمة",
	"pleaseAgreeAllToContinue": "للمتابعة وافق على الحقول أعلاه.",
	"cancel": " إلغاء",
	"continue": "متابعة",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"invitationRequiredToRegister": "Aquesta instància només permet el registre per invitació. Per registrar-te has d'introduir el codi d'invitació.",
	"federationSpecified": "Aquest servidor treballa amb una federació de llistes blanques. No pot interactuar amb altres servidors que no siguin els especificats per l'administrador.",
	"federationDisabled": "La unió es troba deshabilitada en aquest servidor. No es pot interactuar amb usuaris d'altres servidors.",
	"pleaseConfirmBelowBeforeSignup": "Per obrir un compte en aquest servidor, has de llegir i acceptar el següent.",
	"beSureToReadThisAsItIsImportant": "Llegeix això perquè és molt important.",
	"serverRules": "Regles del servidor",
	"agree": "Hi estic d'acord",
	"termsOfService": "Condicions d'ús",
	"privacyPolicy": "Política de privacitat",
	"basicNotesBeforeCreateAccount": "Notes importants",
	"pleaseAgreeAllToContinue": "Has d'acceptar tots els camps de dalt per poder continuar.",
	"cancel": "Cancel·lar",
	"continue": "Continuar",
	"tosAndPrivacyPolicy": "Termes d'ús i política de privacitat",
	"doYouAgree": "Estàs d'acord?",
	"iHaveReadXCarefullyAndAgree": "He llegit {x} i estic d'acord."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"invitationRequiredToRegister": "Tahle instance je pouze na pozvánku. Musíte zadat validní kód pozvánky.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "Abyste se mohli přihlásit na server, musíte souhlasit s následujícím.",
	"beSureToReadThisAsItIsImportant": "Přečtěte si prosím tyto důležité informace.",
	"serverRules": "Pravidla serveru",
	"agree": "Souhlasím",
	"termsOfService": "Podmínky užívání",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Důležité poznámky",
	"pleaseAgreeAllToContinue": "Musíte souhlasit se vším abyste mohli pokračovat.",
	"cancel": "Zrušit",
	"continue": "Pokračovat",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Souhlasíte?",
	"iHaveReadXCarefullyAndAgree": "Přečetl jsem si text \"{x}\" a souhlasím s ním."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Important notes",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Cancel",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"invitationRequiredToRegister": "Diese Instanz ist einladungsbasiert. Du musst einen validen Einladungscode eingeben, um dich zu registrieren.",
	"federationSpecified": "Dieser Server arbeitet mit Whitelist-Föderation. Er kann nicht mit anderen als den vom Administrator angegebenen Servern interagieren.",
	"federationDisabled": "Föderation ist auf diesem Server deaktiviert. Es ist nicht möglich, mit Benutzern auf anderen Servern zu interagieren.",
	"pleaseConfirmBelowBeforeSignup": "Lies bitte diese Informationen und stimme ihnen vor der Registration zu.",
	"beSureToReadThisAsItIsImportant": "Lies bitte diese wichtige Informationen.",
	"serverRules": "Serverregeln",
	"agree": "Zustimmen",
	"termsOfService": "Nutzungsbedingungen",
	"privacyPolicy": "Datenschutzerklärung",
	"basicNotesBeforeCreateAccount": "Wichtige Infos",
	"pleaseAgreeAllToContinue": "Zum Fortfahren muss allen obigen Feldern zugestimmt werden.",
	"cancel": "Abbrechen",
	"continue": "Fortfahren",
	"tosAndPrivacyPolicy": "Nutzungsbedingungen und Datenschutzerklärung",
	"doYouAgree": "Zustimmen?",
	"iHaveReadXCarefullyAndAgree": "Ich habe den Text \"{x}\" gelesen und stimme zu."
}
</locale>

<locale lang="json" locale="en-US">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Important notes",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Cancel",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"invitationRequiredToRegister": "Esta instancia está configurada sólo por invitación, tienes que ingresar un código de invitación válido.",
	"federationSpecified": "Este servidor opera en una federación de listas blancas. No puede interactuar con otros servidores que no sean los especificados por el administrador.",
	"federationDisabled": "La federación está desactivada en este servidor. No puede interactuar con usuarios de otros servidores",
	"pleaseConfirmBelowBeforeSignup": "Por favor confirma antes de continuar el registro",
	"beSureToReadThisAsItIsImportant": "Por favor lea esto que es importante",
	"serverRules": "Reglas del servidor",
	"agree": "De acuerdo.",
	"termsOfService": "Términos y condiciones",
	"privacyPolicy": "Política de Privacidad",
	"basicNotesBeforeCreateAccount": "Notas básicas",
	"pleaseAgreeAllToContinue": "Tienes que estar de acuerdo con los campos anteriores para contnuar.",
	"cancel": "Cancelar",
	"continue": "Continuar",
	"tosAndPrivacyPolicy": "Condiciones de Uso y Política de Privacidad",
	"doYouAgree": "¿Está de acuerdo?",
	"iHaveReadXCarefullyAndAgree": "He leído el texto {x} y estoy de acuerdo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"invitationRequiredToRegister": "Actuellement, cette instance est uniquement sur invitation. Seuls ceux qui ont un code d'invitation peuvent s'inscrire.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "Pour vous inscrire sur cette instance, vous devez confirmer et accepter le contenu suivant.",
	"beSureToReadThisAsItIsImportant": "Assurez-vous de le lire\u202f; c'est important.",
	"serverRules": "Règles du serveur",
	"agree": "Accepter",
	"termsOfService": "Conditions d'utilisation",
	"privacyPolicy": "Politique de confidentialité",
	"basicNotesBeforeCreateAccount": "Notes importantes",
	"pleaseAgreeAllToContinue": "Pour continuer, veuillez accepter tous les champs ci-dessus.",
	"cancel": "Annuler",
	"continue": "Continuer",
	"tosAndPrivacyPolicy": "Conditions d'utilisation et politique de confidentialité",
	"doYouAgree": "Êtes-vous d’accord\u00a0?",
	"iHaveReadXCarefullyAndAgree": "J'ai lu le contenu de « {x} » et donne mon accord."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"invitationRequiredToRegister": "Instansi ini dalam mode undangan-saja. Kamu harus memasukkan kode undangan yang valid untuk mendaftar.",
	"federationSpecified": "Peladen ini dioperasikan dalam federasi daftar putih. Interaksi dengan peladen selain yang telah dikelola oleh admin tidak diperbolehkan.",
	"federationDisabled": "Federasi dimatikan di peladen ini. Anda tidak dapat berinteraksi dengan pengguna di peladen lain.",
	"pleaseConfirmBelowBeforeSignup": "Mohon konfirmasi di bawah ini sebelum mendaftar.",
	"beSureToReadThisAsItIsImportant": "Mohon baca informasi penting berikut.",
	"serverRules": "Aturan peladen",
	"agree": "Setuju",
	"termsOfService": "Syarat dan ketentuan",
	"privacyPolicy": "Kebijakan Privasi",
	"basicNotesBeforeCreateAccount": "Catatan penting",
	"pleaseAgreeAllToContinue": "Kamu harus menyetujui semua kolom di atas untuk melanjutkan.",
	"cancel": "Batalkan",
	"continue": "Lanjutkan",
	"tosAndPrivacyPolicy": "Syarat dan Ketentuan serta Kebijakan Privasi",
	"doYouAgree": "Apa kamu setuju?",
	"iHaveReadXCarefullyAndAgree": "Saya telah membaca \"{x}\" dan menyetujui."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"invitationRequiredToRegister": "L'accesso a questa istanza è solo ad invito. Può registrarsi solo chi ha un codice fornito dall'amministrazione.",
	"federationSpecified": "Questo server è federato solo con istanze specifiche del Fediverso. Puoi interagire solo con quelle scelte dall'amministrazione.",
	"federationDisabled": "Questo server ha la federazione disabilitata. Non puoi interagire con profili provenienti da altri server.",
	"pleaseConfirmBelowBeforeSignup": "Per iscriversi, occorre essere d'accordo con le seguenti condizioni.",
	"beSureToReadThisAsItIsImportant": "Si prega di leggere attentamente perché è importante.",
	"serverRules": "Regolamento",
	"agree": "Accetto",
	"termsOfService": "Condizioni d'uso del servizio",
	"privacyPolicy": "Informativa ai sensi del Reg. UE 2016/679 (GDPR)",
	"basicNotesBeforeCreateAccount": "Note importanti",
	"pleaseAgreeAllToContinue": "Occorre accettare tutte le condizioni prima di continuare.",
	"cancel": "Annulla",
	"continue": "Continua",
	"tosAndPrivacyPolicy": "Condizioni d'uso e informativa privacy",
	"doYouAgree": "Accetti le condizioni?",
	"iHaveReadXCarefullyAndAgree": "Dichiaro di aver letto attentamente \"{x}\" e accettarne le condizioni."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"invitationRequiredToRegister": "現在このサーバーは招待制です。招待コードをお持ちの方のみ登録できます。",
	"federationSpecified": "このサーバーはホワイトリスト連合で運用されています。管理者が指定したサーバー以外とやり取りすることはできません。",
	"federationDisabled": "このサーバーは連合が無効化されています。他のサーバーのユーザーとやり取りすることはできません。",
	"pleaseConfirmBelowBeforeSignup": "このサーバーに登録するには、以下の内容を確認し同意する必要があります。",
	"beSureToReadThisAsItIsImportant": "重要ですので必ずお読みください。",
	"serverRules": "サーバールール",
	"agree": "同意する",
	"termsOfService": "利用規約",
	"privacyPolicy": "プライバシーポリシー",
	"basicNotesBeforeCreateAccount": "基本的な注意事項",
	"pleaseAgreeAllToContinue": "続けるには、全ての「同意する」にチェックが入っている必要があります。",
	"cancel": "キャンセル",
	"continue": "続ける",
	"tosAndPrivacyPolicy": "利用規約・プライバシーポリシー",
	"doYouAgree": "同意しますか？",
	"iHaveReadXCarefullyAndAgree": "「{x}」の内容をよく読み、同意します。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"invitationRequiredToRegister": "今このサーバー招待制になってもうてんねん。招待コードを持っとるんやったら登録できるで。",
	"federationSpecified": "このサーバーはホワイトリスト連合で運用されてるで。管理者が指定したサーバー以外とはやり取りできひんで。",
	"federationDisabled": "このサーバーは連合が無効化されてるで。他のサーバーのユーザーとやり取りすることはできひんで。",
	"pleaseConfirmBelowBeforeSignup": "このサーバーに登録する前に、下に書いてること確認してな。",
	"beSureToReadThisAsItIsImportant": "重要やから絶対読んでや。",
	"serverRules": "サーバールール",
	"agree": "せやな",
	"termsOfService": "使うための決め事",
	"privacyPolicy": "プライバシーポリシー",
	"basicNotesBeforeCreateAccount": "よう読んどいてや",
	"pleaseAgreeAllToContinue": "続けるんやったら、全部にチェック入れとかなアカンで。",
	"cancel": "やめる",
	"continue": "続けるで",
	"tosAndPrivacyPolicy": "利用規約・プライバシーポリシー",
	"doYouAgree": "ええんか？",
	"iHaveReadXCarefullyAndAgree": "「{x}」の内容をよう読んで、同意するで。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Important notes",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Cancel",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Important notes",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "ರದ್ದು",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"invitationRequiredToRegister": "현재 이 서버는 비공개입니다. 회원가입을 하시려면 초대 코드가 필요합니다.",
	"federationSpecified": "이 서버는 화이트 리스트 제도로 운영 중 입니다. 정해진 리모트 서버가 아닌 경우 연합되지 않습니다.",
	"federationDisabled": "이 서버는 연합을 하지 않고 있습니다. 리모트 서버 유저와 통신을 할 수 없습니다.",
	"pleaseConfirmBelowBeforeSignup": "이 서버에 가입하기 전에 아래 사항을 확인하여 주십시오.",
	"beSureToReadThisAsItIsImportant": "중요하므로 반드시 읽어주십시오.",
	"serverRules": "서버 규칙",
	"agree": "동의합니다",
	"termsOfService": "이용 약관",
	"privacyPolicy": "개인정보 보호 정책",
	"basicNotesBeforeCreateAccount": "기본적인 주의사항",
	"pleaseAgreeAllToContinue": "계속하시려면 모든 항목에 동의하십시오.",
	"cancel": "취소",
	"continue": "계속",
	"tosAndPrivacyPolicy": "약관 및 개인정보 보호 정책",
	"doYouAgree": "동의하십니까?",
	"iHaveReadXCarefullyAndAgree": "\"{x}\"의 내용을 읽고 동의합니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Akkoord",
	"termsOfService": "Gebruiksvoorwaarden",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Belangrijke informatie",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Annuleren",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Godta",
	"termsOfService": "Vilkår for bruk",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Viktige merknader",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Avbryt",
	"continue": "Fortsett",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"invitationRequiredToRegister": "Ten serwer wymaga zaproszenia. Tylko osoby z zaproszeniem mogą się zarejestrować",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Zatwierdź",
	"termsOfService": "Warunki usługi",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Ważne notatki",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Anuluj",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"invitationRequiredToRegister": "Essa instância é apenas para convidados. Você precisa inserir um código válido para se cadastrar.",
	"federationSpecified": "Esse servidor opera com uma lista branca de federação. Interagir com servidores diferentes daqueles designados pela administração não é permitido.",
	"federationDisabled": "Federação está desabilitada nesse servidor. Você não pode interagir com usuários de outros servidores.",
	"pleaseConfirmBelowBeforeSignup": "Para cadastrar-se no servidor, você precisa ler e concordar como seguinte:",
	"beSureToReadThisAsItIsImportant": "Por favor, leia essa informação importante.",
	"serverRules": "Regras do servidor",
	"agree": "Concordar",
	"termsOfService": "Termos de Uso",
	"privacyPolicy": "Política de Privacidade",
	"basicNotesBeforeCreateAccount": "Observações importantes",
	"pleaseAgreeAllToContinue": "Você precisa concordar com todos os campos acima para continuar.",
	"cancel": "Cancelar",
	"continue": "Continuar",
	"tosAndPrivacyPolicy": "Termos de Serviço e Política de Privacidade",
	"doYouAgree": "Concorda?",
	"iHaveReadXCarefullyAndAgree": "Eu li o texto \"{x}\" e concordo."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"invitationRequiredToRegister": "Этот сервер в настоящее время только по приглашению. Зарегистрироваться могут только те, у кого есть код приглашения.",
	"federationSpecified": "Сервер работает через белый список федерации. Связь с другими серверами ограничена",
	"federationDisabled": "Федерация отключена для этого сервера. Вы не можете взаимодействовать с пользователями на других серверах.",
	"pleaseConfirmBelowBeforeSignup": "Прочитайте и согласитесь с информацией ниже, чтобы продолжить",
	"beSureToReadThisAsItIsImportant": "Это важно, поэтому, пожалуйста, прочтите это.",
	"serverRules": "Правила сервера",
	"agree": "Согласен",
	"termsOfService": "Условия использования",
	"privacyPolicy": "Политика Конфиденциальности",
	"basicNotesBeforeCreateAccount": "Записи, перед созданием аккаунта",
	"pleaseAgreeAllToContinue": "Чтобы продолжить, необходимо поставить отметки во всех полях \"согласен\".",
	"cancel": "Отмена",
	"continue": "Продолжить",
	"tosAndPrivacyPolicy": "Условия использования и политика конфиденциальности",
	"doYouAgree": "Согласны?",
	"iHaveReadXCarefullyAndAgree": "Я прочитал(а) и согласен(сна) с условиями \"{x}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Základné bezpečnostné opatrenia",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Zrušiť",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"invitationRequiredToRegister": "เซิร์ฟเวอร์นี้เป็นแบบรับเชิญ เฉพาะผู้มีรหัสเชิญเท่านั้นถึงสามารถลงทะเบียนได้",
	"federationSpecified": "เซิร์ฟเวอร์นี้ดำเนินงานในระบบกลุ่มไวท์ลิสต์ ไม่สามารถติดต่อกับเซิร์ฟเวอร์อื่นที่ไม่ได้รับอนุญาตจากผู้ดูแลระบบได้",
	"federationDisabled": "เซิร์ฟเวอร์นี้ปิดใช้งานสหพันธ์ ไม่สามารถติดต่อหรือแลกเปลี่ยนข้อมูลกับผู้ใช้จากเซิร์ฟเวอร์อื่นได้",
	"pleaseConfirmBelowBeforeSignup": "หากต้องการลงทะเบียนในเซิร์ฟเวอร์นี้ คุณต้องตรวจสอบและยอมรับสิ่งต่อไปนี้",
	"beSureToReadThisAsItIsImportant": "กรุณาอ่านข้อมูลที่สำคัญอันนี้",
	"serverRules": "กฎของเซิร์ฟเวอร์",
	"agree": "ยอมรับ",
	"termsOfService": "เงื่อนไขการให้บริการ",
	"privacyPolicy": "นโยบายความเป็นส่วนตัว",
	"basicNotesBeforeCreateAccount": "หมายเหตุสำคัญ",
	"pleaseAgreeAllToContinue": "คุณต้องยอมรับทุกช่องตรงด้านบนเพื่อดำเนินการต่อค่ะ",
	"cancel": "ยกเลิก",
	"continue": "ดำเนินการต่อ",
	"tosAndPrivacyPolicy": "เงื่อนไขในการให้บริการและนโยบายความเป็นส่วนตัว",
	"doYouAgree": "ยอมรับไหม?",
	"iHaveReadXCarefullyAndAgree": "ฉันได้อ่านและยินยอมเนื้อหาของ “{x}”"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"invitationRequiredToRegister": "Bu etkinlik davetle katılımlıdır. Geçerli bir davet kodu girerek kaydolmanız gerekir.",
	"federationSpecified": "Bu sunucu, beyaz liste federasyonunda çalıştırılmaktadır. Yönetici tarafından belirlenen sunucular dışında diğer sunucularla etkileşim kurmak yasaktır.",
	"federationDisabled": "Bu sunucuda federasyon devre dışıdır. Diğer sunuculardaki kullanıcılarla etkileşim kuramazsınız.",
	"pleaseConfirmBelowBeforeSignup": "Bu sunucuya kaydolmak için aşağıdakileri gözden geçirip kabul etmelisin:",
	"beSureToReadThisAsItIsImportant": "Lütfen bu önemli bilgileri okuyun.",
	"serverRules": "Sunucu kuralları",
	"agree": "Kabul ediyorum",
	"termsOfService": "Hizmet Şartları",
	"privacyPolicy": "Gizlilik Politikası",
	"basicNotesBeforeCreateAccount": "Önemli notlar",
	"pleaseAgreeAllToContinue": "Devam etmek için yukarıdaki tüm alanları kabul etmelisin.",
	"cancel": "Vazgeç",
	"continue": "Devam et",
	"tosAndPrivacyPolicy": "Hizmet Şartları ve Gizlilik Politikası",
	"doYouAgree": "Katılıyor musunuz?",
	"iHaveReadXCarefullyAndAgree": "“{x}” metnini okudum ve kabul ediyorum."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
	"pleaseConfirmBelowBeforeSignup": "To register on this server, you must review and agree to the following:",
	"beSureToReadThisAsItIsImportant": "Please read this important information.",
	"serverRules": "Server rules",
	"agree": "Agree",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"basicNotesBeforeCreateAccount": "Important notes",
	"pleaseAgreeAllToContinue": "You must agree to all above fields to continue.",
	"cancel": "Cancel",
	"continue": "Continue",
	"tosAndPrivacyPolicy": "Terms of Service and Privacy Policy",
	"doYouAgree": "Agree?",
	"iHaveReadXCarefullyAndAgree": "I have read the text \"{x}\" and agree."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"invitationRequiredToRegister": "Цей інстанс доступний лише за запрошенням. Щоб зареєструватися, потрібно ввести дійсний код запрошення.",
	"federationSpecified": "Сервер працює через білий лист федерації. Зв'язок з іншими серверами обмежена.",
	"federationDisabled": "Федерація вимкнута для цього сервера. Ви не можете взаємодіяти з користувачами на інших серверах.",
	"pleaseConfirmBelowBeforeSignup": "Щоб зареєструватися на цьому сервері, ви повинні переглянути та прийняти наведені нижче умови:",
	"beSureToReadThisAsItIsImportant": "Будь ласка, прочитайте цю важливу інформацію.",
	"serverRules": "Правила сервера",
	"agree": "Гаразд",
	"termsOfService": "Умови використання",
	"privacyPolicy": "Політика конфіденційності",
	"basicNotesBeforeCreateAccount": "Важливі нотатки",
	"pleaseAgreeAllToContinue": "Щоб продовжити, потрібно погодитися з усіма полями вище.\n\n",
	"cancel": "Скасувати",
	"continue": "Продовжити",
	"tosAndPrivacyPolicy": "Умови користування та політика конфіденційності",
	"doYouAgree": "Погоджуєтеся?",
	"iHaveReadXCarefullyAndAgree": "Я прочитав/прочитала текст «{x}» і погоджуюся."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"invitationRequiredToRegister": "Phiên bản này chỉ dành cho người được mời. Bạn phải nhập mã mời hợp lệ để đăng ký.",
	"federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
	"federationDisabled": "Liên kết bị vô hiệu hóa trên máy chủ này. Bạn không thể tương tác với người dùng trên các máy chủ khác.",
	"pleaseConfirmBelowBeforeSignup": "Để đăng ký trên máy chủ này, bạn phải xem xét và đồng ý với những điều sau.",
	"beSureToReadThisAsItIsImportant": "Hãy đọc kỹ vì nó rất quan trọng.",
	"serverRules": "Luật của máy chủ",
	"agree": "Đồng ý",
	"termsOfService": "Điều khoản và Điều kiện",
	"privacyPolicy": "Chính sách bảo mật",
	"basicNotesBeforeCreateAccount": "Những điều cơ bản cần chú ý ",
	"pleaseAgreeAllToContinue": "Bạn phải đồng ý tất cả điều trên để tiếp tục.",
	"cancel": "Hủy",
	"continue": "Tiếp tục",
	"tosAndPrivacyPolicy": "Điều khoản sử dụng và Chính sách bảo mật",
	"doYouAgree": "Đồng ý?",
	"iHaveReadXCarefullyAndAgree": "Tôi đã đọc và đồng ý với \"{x}\"."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"invitationRequiredToRegister": "此服务器目前只允许拥有邀请码的人注册。",
	"federationSpecified": "此服务器已开启联邦白名单模式。只能与管理员指定的服务器通信。",
	"federationDisabled": "此服务器已禁用联邦功能。无法与其它服务器上的用户通信。",
	"pleaseConfirmBelowBeforeSignup": "如果要在此服务器上注册，需要确认并同意以下内容。",
	"beSureToReadThisAsItIsImportant": "请好好阅读，这真的很重要。",
	"serverRules": "服务器规则",
	"agree": "同意",
	"termsOfService": "服务条款",
	"privacyPolicy": "隐私政策",
	"basicNotesBeforeCreateAccount": "基本注意事项",
	"pleaseAgreeAllToContinue": "必须全部勾选 “同意” 才能够继续。",
	"cancel": "取消",
	"continue": "继续",
	"tosAndPrivacyPolicy": "服务条款及隐私政策",
	"doYouAgree": "你同意吗？",
	"iHaveReadXCarefullyAndAgree": "我已经仔细阅读并同意了 “{x}” 的内容。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"invitationRequiredToRegister": "目前這個伺服器為邀請制，必須擁有邀請碼才能註冊。",
	"federationSpecified": "此伺服器以白名單聯邦的方式運作。除了管理員指定的伺服器外，它無法與其他伺服器互動。",
	"federationDisabled": "此伺服器未開啟站台聯邦。無法與其他伺服器上的使用者互動。",
	"pleaseConfirmBelowBeforeSignup": "在本伺服器註冊之前，必須確認並同意以下內容。",
	"beSureToReadThisAsItIsImportant": "重要，請務必閱讀。",
	"serverRules": "伺服器規則",
	"agree": "同意",
	"termsOfService": "服務條款",
	"privacyPolicy": "隱私政策",
	"basicNotesBeforeCreateAccount": "基本注意事項",
	"pleaseAgreeAllToContinue": "必須全部勾選「同意」才能繼續。",
	"cancel": "取消",
	"continue": "繼續",
	"tosAndPrivacyPolicy": "服務條款和隱私政策",
	"doYouAgree": "你同意嗎？",
	"iHaveReadXCarefullyAndAgree": "我已仔細閱讀並同意「{x}」的內容。"
}
</locale>
