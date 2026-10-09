<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-user-edit"></i>
	</div>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 32px;">
		<form class="_gaps_m" autocomplete="new-password" @submit.prevent="onSubmit">
			<MkInput v-if="instance.disableRegistration" v-model="invitationCode" type="text" :spellcheck="false" required data-testid="signup-invitation-code">
				<template #label>{{ $locale.sfc.invitationCode }}</template>
				<template #prefix><i class="ti ti-key"></i></template>
			</MkInput>
			<MkInput v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" autocomplete="username" required data-testid="signup-username" @update:modelValue="onChangeUsername">
				<template #label>{{ $locale.sfc.username }} <div v-tooltip:dialog="$locale.sfc.usernameInfo" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
				<template #caption>
					<div><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.cannotBeChangedLater }}</div>
					<span v-if="usernameState === 'wait'" style="color:#999"><MkLoading :em="true"/> {{ $locale.sfc.checking }}</span>
					<span v-else-if="usernameState === 'ok'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ $locale.sfc.available }}</span>
					<span v-else-if="usernameState === 'unavailable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.unavailable }}</span>
					<span v-else-if="usernameState === 'error'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.error }}</span>
					<span v-else-if="usernameState === 'invalid-format'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.usernameInvalidFormat }}</span>
					<span v-else-if="usernameState === 'min-range'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.tooShort }}</span>
					<span v-else-if="usernameState === 'max-range'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.tooLong }}</span>
				</template>
			</MkInput>
			<MkInput v-if="instance.emailRequiredForSignup" v-model="email" :debounce="true" type="email" :spellcheck="false" required data-testid="signup-email" @update:modelValue="onChangeEmail">
				<template #label>{{ $locale.sfc.emailAddress }} <div v-tooltip:dialog="$locale.sfc.signupEmailAddressInfo" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
				<template #prefix><i class="ti ti-mail"></i></template>
				<template #caption>
					<span v-if="emailState === 'wait'" style="color:#999"><MkLoading :em="true"/> {{ $locale.sfc.checking }}</span>
					<span v-else-if="emailState === 'ok'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ $locale.sfc.available }}</span>
					<span v-else-if="emailState === 'unavailable:used'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableUsed }}</span>
					<span v-else-if="emailState === 'unavailable:format'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableFormat }}</span>
					<span v-else-if="emailState === 'unavailable:disposable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableDisposable }}</span>
					<span v-else-if="emailState === 'unavailable:banned'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableBanned }}</span>
					<span v-else-if="emailState === 'unavailable:mx'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableMx }}</span>
					<span v-else-if="emailState === 'unavailable:smtp'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.emailUnavailableSmtp }}</span>
					<span v-else-if="emailState === 'unavailable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.unavailable }}</span>
					<span v-else-if="emailState === 'error'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.error }}</span>
				</template>
			</MkInput>
			<MkInput v-model="password" type="password" autocomplete="new-password" required data-testid="signup-password" @update:modelValue="onChangePassword">
				<template #label>{{ $locale.sfc.password }}</template>
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption>
					<span v-if="passwordStrength == 'low'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.weakPassword }}</span>
					<span v-if="passwordStrength == 'medium'" style="color: var(--MI_THEME-warn)"><i class="ti ti-check ti-fw"></i> {{ $locale.sfc.normalPassword }}</span>
					<span v-if="passwordStrength == 'high'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ $locale.sfc.strongPassword }}</span>
				</template>
			</MkInput>
			<MkInput v-model="retypedPassword" type="password" autocomplete="new-password" required data-testid="signup-password-retype" @update:modelValue="onChangePasswordRetype">
				<template #label>{{ $locale.sfc.password }} ({{ $locale.sfc.retype }})</template>
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption>
					<span v-if="passwordRetypeState == 'match'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ $locale.sfc.passwordMatched }}</span>
					<span v-if="passwordRetypeState == 'not-match'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ $locale.sfc.passwordNotMatched }}</span>
				</template>
			</MkInput>
			<MkCaptcha v-if="instance.enableHcaptcha" ref="hcaptcha" v-model="hCaptchaResponse" :class="$style.captcha" provider="hcaptcha" :sitekey="instance.hcaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableMcaptcha" ref="mcaptcha" v-model="mCaptchaResponse" :class="$style.captcha" provider="mcaptcha" :sitekey="instance.mcaptchaSiteKey" :instanceUrl="instance.mcaptchaInstanceUrl"/>
			<MkCaptcha v-if="instance.enableRecaptcha" ref="recaptcha" v-model="reCaptchaResponse" :class="$style.captcha" provider="recaptcha" :sitekey="instance.recaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableTurnstile" ref="turnstile" v-model="turnstileResponse" :class="$style.captcha" provider="turnstile" :sitekey="instance.turnstileSiteKey"/>
			<MkCaptcha v-if="instance.enableTestcaptcha" ref="testcaptcha" v-model="testcaptchaResponse" :class="$style.captcha" provider="testcaptcha" :sitekey="null"/>
			<MkButton type="submit" :disabled="shouldDisableSubmitting" large gradate rounded data-testid="signup-submit" style="margin: 0 auto;">
				<template v-if="submitting">
					<MkLoading :em="true" :colored="false"/>
				</template>
				<template v-else>{{ $locale.sfc.start }}</template>
			</MkButton>
		</form>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { toUnicode } from 'punycode.js';
import * as Misskey from 'misskey-js';
import * as config from '@features/boot/frontend/shared/config.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import type { Captcha } from '@features/auth/frontend/components/MkCaptcha.vue';
import MkCaptcha from '@features/auth/frontend/components/MkCaptcha.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { instance } from '@features/instance/frontend/instance.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { login } from '@features/auth/frontend/accounts.js';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'signup', user: Misskey.entities.SignupResponse): void;
	(ev: 'signupEmailPending'): void;
}>();

const host = toUnicode(config.host);

const hcaptcha = ref<Captcha | undefined>();
const mcaptcha = ref<Captcha | undefined>();
const recaptcha = ref<Captcha | undefined>();
const turnstile = ref<Captcha | undefined>();
const testcaptcha = ref<Captcha | undefined>();

const username = ref<string>('');
const password = ref<string>('');
const retypedPassword = ref<string>('');
const invitationCode = ref<string>('');
const email = ref('');
const usernameState = ref<null | 'wait' | 'ok' | 'unavailable' | 'error' | 'invalid-format' | 'min-range' | 'max-range'>(null);
const emailState = ref<null | 'wait' | 'ok' | 'unavailable:used' | 'unavailable:format' | 'unavailable:disposable' | 'unavailable:banned' | 'unavailable:mx' | 'unavailable:smtp' | 'unavailable' | 'error'>(null);
const passwordStrength = ref<'' | 'low' | 'medium' | 'high'>('');
const passwordRetypeState = ref<null | 'match' | 'not-match'>(null);
const submitting = ref<boolean>(false);
const hCaptchaResponse = ref<string | null>(null);
const mCaptchaResponse = ref<string | null>(null);
const reCaptchaResponse = ref<string | null>(null);
const turnstileResponse = ref<string | null>(null);
const testcaptchaResponse = ref<string | null>(null);
const usernameAbortController = ref<null | AbortController>(null);
const emailAbortController = ref<null | AbortController>(null);

const shouldDisableSubmitting = computed((): boolean => {
	return submitting.value ||
		instance.enableHcaptcha && !hCaptchaResponse.value ||
		instance.enableMcaptcha && !mCaptchaResponse.value ||
		instance.enableRecaptcha && !reCaptchaResponse.value ||
		instance.enableTurnstile && !turnstileResponse.value ||
		instance.enableTestcaptcha && !testcaptchaResponse.value ||
		instance.emailRequiredForSignup && emailState.value !== 'ok' ||
		instance.disableRegistration && invitationCode.value === '' ||
		usernameState.value !== 'ok' ||
		passwordRetypeState.value !== 'match';
});

function getPasswordStrength(source: string): number {
	let strength = 0;
	let power = 0.018;

	// 英数字
	if (/[a-zA-Z]/.test(source) && /[0-9]/.test(source)) {
		power += 0.020;
	}

	// 大文字と小文字が混ざってたら
	if (/[a-z]/.test(source) && /[A-Z]/.test(source)) {
		power += 0.015;
	}

	// 記号が混ざってたら
	if (/[!\x22\#$%&@'()*+,-./_]/.test(source)) {
		power += 0.02;
	}

	strength = power * source.length;

	return Math.max(0, Math.min(1, strength));
}

function onChangeUsername(): void {
	if (username.value === '') {
		usernameState.value = null;
		return;
	}

	{
		const err =
			!username.value.match(/^[a-zA-Z0-9_]+$/) ? 'invalid-format' :
			username.value.length < 1 ? 'min-range' :
			username.value.length > 20 ? 'max-range' :
			null;

		if (err) {
			usernameState.value = err;
			return;
		}
	}

	if (usernameAbortController.value != null) {
		usernameAbortController.value.abort();
	}
	usernameState.value = 'wait';
	usernameAbortController.value = new AbortController();

	misskeyApi('username/available', {
		username: username.value,
	}, undefined, usernameAbortController.value.signal).then(result => {
		usernameState.value = result.available ? 'ok' : 'unavailable';
	}).catch((err) => {
		if (err.name !== 'AbortError') {
			usernameState.value = 'error';
		}
	});
}

function onChangeEmail(): void {
	if (email.value === '') {
		emailState.value = null;
		return;
	}

	if (emailAbortController.value != null) {
		emailAbortController.value.abort();
	}
	emailState.value = 'wait';
	emailAbortController.value = new AbortController();

	misskeyApi('email-address/available', {
		emailAddress: email.value,
	}, undefined, emailAbortController.value.signal).then(result => {
		emailState.value = result.available ? 'ok' :
			result.reason === 'used' ? 'unavailable:used' :
			result.reason === 'format' ? 'unavailable:format' :
			result.reason === 'disposable' ? 'unavailable:disposable' :
			result.reason === 'banned' ? 'unavailable:banned' :
			result.reason === 'mx' ? 'unavailable:mx' :
			result.reason === 'smtp' ? 'unavailable:smtp' :
			'unavailable';
	}).catch((err) => {
		if (err.name !== 'AbortError') {
			emailState.value = 'error';
		}
	});
}

function onChangePassword(): void {
	if (password.value === '') {
		passwordStrength.value = '';
		return;
	}

	const strength = getPasswordStrength(password.value);
	passwordStrength.value = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
}

function onChangePasswordRetype(): void {
	if (retypedPassword.value === '') {
		passwordRetypeState.value = null;
		return;
	}

	passwordRetypeState.value = password.value === retypedPassword.value ? 'match' : 'not-match';
}

async function onSubmit(): Promise<void> {
	if (submitting.value) return;
	submitting.value = true;

	const signupPayload: Misskey.entities.SignupRequest = {
		username: username.value,
		password: password.value,
		emailAddress: email.value,
		invitationCode: invitationCode.value,
		'hcaptcha-response': hCaptchaResponse.value,
		'm-captcha-response': mCaptchaResponse.value,
		'g-recaptcha-response': reCaptchaResponse.value,
		'turnstile-response': turnstileResponse.value,
		'testcaptcha-response': testcaptchaResponse.value,
	};

	const res = await window.fetch(`${config.apiUrl}/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(signupPayload),
	}).catch(() => {
		onSignupApiError();
		return null;
	});

	if (res && res.ok) {
		if (res.status === 204 || instance.emailRequiredForSignup) {
			os.alert({
				type: 'success',
				title: $locale.value.sfc.signupAlmostThere,
				text: interpolateLocaleParameters($locale.value.sfc.signupEmailSent, { email: email.value }),
			});
			emit('signupEmailPending');
		} else {
			const resJson = (await res.json()) as Misskey.entities.SignupResponse;
			if (_DEV_) console.log(resJson);

			emit('signup', resJson);

			if (props.autoSet) {
				await login(resJson.token);
			}
		}
	} else {
		onSignupApiError();
	}

	submitting.value = false;
}

function onSignupApiError() {
	submitting.value = false;
	hcaptcha.value?.reset?.();
	mcaptcha.value?.reset?.();
	recaptcha.value?.reset?.();
	turnstile.value?.reset?.();
	testcaptcha.value?.reset?.();

	os.alert({
		type: 'error',
		text: $locale.value.sfc.somethingHappened,
	});
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

.captcha {
	margin: 16px 0;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"invitationCode": "رمز الدعوة",
	"username": "اسم المستخدم",
	"usernameInfo": "الاسم الذي يميزك عن بافي مستخدمي هذا الخادم، يمكنك استخدام الحروف اللاتينية (a~z, A~Z) والأرقام (0~9) والشرطة السفلية (_). لا يمكنك تغييره بعد تسجيله.",
	"cannotBeChangedLater": "لا يمكن تغييره لاحقًا.",
	"checking": "التحقق جارٍ",
	"available": "متوفر",
	"unavailable": "غير متوفر",
	"error": "خطأ",
	"usernameInvalidFormat": "يمكنك استخدام A-z، a-z، 0-9، _",
	"tooShort": "قصير جدًا",
	"tooLong": "طويل جدًا",
	"emailAddress": "عنوان البريد الالكتروني",
	"signupEmailAddressInfo": "رجاءً أدخل بريدك الإلكتروني.",
	"emailUnavailableUsed": "هذا البريد الإلكتروني مستخدم",
	"emailUnavailableFormat": "صيغة البريد الإلكتروني غير صالحة",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "خادم البريد الإلكتروني غير صالح",
	"emailUnavailableSmtp": "خادم البريد الإلكتروتي لا يستجيب",
	"password": "الكلمة السرية",
	"weakPassword": "الكلمة السرية ضعيفة",
	"normalPassword": "الكلمة السرية جيدة",
	"strongPassword": "الكلمة السرية قوية",
	"retype": "أعد الكتابة",
	"passwordMatched": "التطابق صحيح!",
	"passwordNotMatched": "غير متطابقتان",
	"start": "البداية",
	"signupAlmostThere": "كدت تنتهي",
	"signupEmailSent": "أرسلت رسالة تأكيد إلى بريدك الإلكتروني ({email})، أنقر على الرابط الموجود فيها لإكمال التسجيل.",
	"somethingHappened": "حدث خطأ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"invitationCode": "Codi d'invitació",
	"username": "Nom d'usuari",
	"usernameInfo": "Un nom que identifiqui el teu compte d'altres en aquest servidor. Pots fer servir lletres (a~z, A~Z), números (0~9) i guions baixos (_). Els noms d'usuari no es poden canviar després.",
	"cannotBeChangedLater": "Això ja no es podrà canviar.",
	"checking": "Comprovació en curs...",
	"available": "Disponible",
	"unavailable": "No és disponible",
	"error": "Error",
	"usernameInvalidFormat": "Pots fer servir lletres (majúscules i minúscules), números i barres baixes (\"_\")",
	"tooShort": "Massa curt",
	"tooLong": "Massa llarg",
	"emailAddress": "Adreça de correu electrònic",
	"signupEmailAddressInfo": "Si us plau, escriu la teva adreça de correu electrònic. No es farà pública.",
	"emailUnavailableUsed": "Aquest correu electrònic ja s'està fent servir",
	"emailUnavailableFormat": "El format del correu electrònic és invàlid ",
	"emailUnavailableDisposable": "No es poden fer servir adreces de correu electrònic d'un sol ús ",
	"emailUnavailableBanned": "No pots registrar-te amb aquesta adreça de correu electrònic ",
	"emailUnavailableMx": "Aquest servidor de correu electrònic no és vàlid ",
	"emailUnavailableSmtp": "Aquest servidor de correu electrònic no respon",
	"password": "Contrasenya",
	"weakPassword": "Contrasenya insegura",
	"normalPassword": "Bona contrasenya",
	"strongPassword": "Contrasenya segura",
	"retype": "Torneu a introduir-la",
	"passwordMatched": "Correcte!",
	"passwordNotMatched": "No coincideix",
	"start": "Comença",
	"signupAlmostThere": "Ja quasi estem",
	"signupEmailSent": "S'ha enviat un correu de confirmació a ({email}). Si us plau, fes clic a l'enllaç per completar el registre.",
	"somethingHappened": "S'ha produït un error"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"invitationCode": "Kód pozvánky",
	"username": "Uživatelské jméno",
	"usernameInfo": "Jméno které identifikuje váš účet od jiných na tomhle serveru. Můžete použít abecedu (a~z, A~Z), čísla (0~9) nebo podtržítka (_). Uživatelské jména nemůžou být změněna později.",
	"cannotBeChangedLater": "Tohle nemůže být změněno později.",
	"checking": "Ověřuji",
	"available": "K dispozici",
	"unavailable": "Není k dispozici",
	"error": "Chyba",
	"usernameInvalidFormat": "Písmena, čísla a _ jsou povolená.",
	"tooShort": "Příliš krátké",
	"tooLong": "Příliš dlouhé",
	"emailAddress": "Emailová adresa",
	"signupEmailAddressInfo": "Zadejte prosím svou emailovou adresu. Nebude zveřejněna.",
	"emailUnavailableUsed": "Tato emailová adresa se již používá",
	"emailUnavailableFormat": "Formát této emailové adresy je neplatný",
	"emailUnavailableDisposable": "Jednorázové emailové adresy se nesmí používat",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Tento e-mailový server je neplatný",
	"emailUnavailableSmtp": "Tento emailový server neodpovídá",
	"password": "Heslo",
	"weakPassword": "Slabé heslo",
	"normalPassword": "Dobré heslo",
	"strongPassword": "Silné heslo",
	"retype": "Zadejte znovu",
	"passwordMatched": "Hesla se schodují",
	"passwordNotMatched": "Hesla se neschodují",
	"start": "Začít",
	"signupAlmostThere": "Už to skoro je",
	"signupEmailSent": "Na vaši e-mailovou adresu ({email}) byl odeslán potvrzovací e-mail. Kliknutím na přiložený odkaz dokončete vytvoření účtu.",
	"somethingHappened": "Jejda. Něco se nepovedlo."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"invitationCode": "Invitation code",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Checking...",
	"available": "Available",
	"unavailable": "Not available",
	"error": "Error",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "Too short",
	"tooLong": "Too long",
	"emailAddress": "Email address",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Password",
	"weakPassword": "Weak password",
	"normalPassword": "Average password",
	"strongPassword": "Strong password",
	"retype": "Enter again",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"invitationCode": "Einladungscode",
	"username": "Benutzername",
	"usernameInfo": "Ein Name, durch den dein Benutzerkonto auf diesem Server identifiziert werden kann. Du kannst das Alphabet (a~z, A~Z), Ziffern (0~9) oder Unterstriche (_) verwenden. Benutzernamen können später nicht geändert werden.",
	"cannotBeChangedLater": "Kann später nicht mehr geändert werden.",
	"checking": "Wird überprüft …",
	"available": "Verfügbar",
	"unavailable": "Unverfügbar",
	"error": "Fehler",
	"usernameInvalidFormat": "Du kannst Klein- und Großbuchstaben, Zahlen sowie Unterstriche verwenden",
	"tooShort": "Zu kurz",
	"tooLong": "Zu lang",
	"emailAddress": "Email-Adresse",
	"signupEmailAddressInfo": "Bitte gib deine Email-Adresse ein. Sie wird nicht öffentlich einsehbar sein.",
	"emailUnavailableUsed": "Diese Email-Adresse wird bereits verwendet",
	"emailUnavailableFormat": "Das Format dieser Email-Adresse ist ungültig",
	"emailUnavailableDisposable": "Wegwerf-Email-Adressen können nicht verwendet werden",
	"emailUnavailableBanned": "Du kannst dich mit dieser E-Mail-Adresse nicht registrieren",
	"emailUnavailableMx": "Dieser Email-Server ist ungültig",
	"emailUnavailableSmtp": "Dieser Email-Server antwortet nicht",
	"password": "Passwort",
	"weakPassword": "Schwaches Passwort",
	"normalPassword": "Durchschnittliches Passwort",
	"strongPassword": "Starkes Passwort",
	"retype": "Erneut eingeben",
	"passwordMatched": "Stimmt überein",
	"passwordNotMatched": "Stimmt nicht überein",
	"start": "Anfangen",
	"signupAlmostThere": "Fast geschafft",
	"signupEmailSent": "An deine Email-Adresse ({email}) wurde soeben eine Bestätigungsmail geschickt. Bitte klicke auf den enthaltenen Link, um die Erstellung deines Benutzerkontos abzuschließen.",
	"somethingHappened": "Ein Fehler ist aufgetreten"
}
</locale>

<locale lang="json" locale="en-US">
{
	"invitationCode": "Invitation code",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Checking...",
	"available": "Available",
	"unavailable": "Not available",
	"error": "Error",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "Too short",
	"tooLong": "Too long",
	"emailAddress": "Email address",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Password",
	"weakPassword": "Weak password",
	"normalPassword": "Average password",
	"strongPassword": "Strong password",
	"retype": "Enter again",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"invitationCode": "Código de invitación",
	"username": "Nombre de usuario",
	"usernameInfo": "Un nombre que identifique su cuenta de otras en este servidor.  Puede utilizar el alfabeto (a~z, A~Z), dígitos (0~9) o guiones bajos (_). Los nombres de usuario no se pueden cambiar posteriormente.",
	"cannotBeChangedLater": "Esto no podrá ser cambiado después.",
	"checking": "Comprobando",
	"available": "Disponible",
	"unavailable": "No disponible",
	"error": "Error",
	"usernameInvalidFormat": "utiliza letras, números y/o -.",
	"tooShort": "Demasiado corto",
	"tooLong": "Demasiado largo",
	"emailAddress": "Correo electrónico",
	"signupEmailAddressInfo": "Ingrese el correo electrónico que usa. Este no se hará público.",
	"emailUnavailableUsed": "Ya fue usado",
	"emailUnavailableFormat": "Formato no válido.",
	"emailUnavailableDisposable": "No es un correo reutilizable",
	"emailUnavailableBanned": "Email no disponible",
	"emailUnavailableMx": "Servidor de correo inválido",
	"emailUnavailableSmtp": "Servidor de correo no disponible",
	"password": "Contraseña",
	"weakPassword": "Contraseña débil",
	"normalPassword": "Buena contraseña",
	"strongPassword": "Muy buena contraseña",
	"retype": "Ingrese de nuevo",
	"passwordMatched": "Correcto",
	"passwordNotMatched": "Las contraseñas no coinciden",
	"start": "Comenzar",
	"signupAlmostThere": "Ya falta poco",
	"signupEmailSent": "Se envió un correo de verificación a la dirección {email}. Acceda al link enviado en el correo para completar el ingreso.",
	"somethingHappened": "Ocurrió un error"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"invitationCode": "Code d’invitation",
	"username": "Nom d’utilisateur·rice",
	"usernameInfo": "C'est un nom qui identifie votre compte sur l'instance de manière unique. Vous pouvez utiliser des lettres de l'alphabet (minuscules et majuscules), des chiffres (de 0 à 9), ou bien le tiret « _ ». Vous ne pourrez pas modifier votre nom d'utilisateur·rice par la suite.",
	"cannotBeChangedLater": "Cela ne peut pas être modifié plus tard.",
	"checking": "Vérification en cours...",
	"available": "Disponible",
	"unavailable": "Non disponible",
	"error": "Erreur",
	"usernameInvalidFormat": "Le nom d'utilisateur peut contenir uniquement des lettres (minuscules et/ou majuscules), des chiffres et des _",
	"tooShort": "Trop court",
	"tooLong": "Trop long",
	"emailAddress": "Adresse e-mail",
	"signupEmailAddressInfo": "Insérez votre adresse e-mail.",
	"emailUnavailableUsed": "Non disponible",
	"emailUnavailableFormat": "Le format de cette adresse de courriel est invalide",
	"emailUnavailableDisposable": "Les adresses e-mail jetables ne peuvent pas être utilisées",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Ce serveur de courriels est invalide",
	"emailUnavailableSmtp": "Ce serveur de courriels ne répond pas",
	"password": "Mot de passe",
	"weakPassword": "Mot de passe faible",
	"normalPassword": "Mot de passe acceptable",
	"strongPassword": "Mot de passe fort",
	"retype": "Confirmation",
	"passwordMatched": "Les mots de passe correspondent",
	"passwordNotMatched": "Les mots de passe ne correspondent pas",
	"start": "Commencer",
	"signupAlmostThere": "Bientôt fini",
	"signupEmailSent": "Un courriel de confirmation vient d'être envoyé à l'adresse que vous avez renseignée ({email}). Cliquez sur le lien contenu dans le message pour terminer la création de votre compte.",
	"somethingHappened": "Une erreur est survenue"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"invitationCode": "Kode undangan",
	"username": "Nama Pengguna",
	"usernameInfo": "Nama yang mengidentifikasikan akun kamu dari yang lain pada peladen ini. Kamu dapat menggunakan alfabet (a~z, A~Z), digit (0~9) atau garis bawah (_). Username tidak dapat diubah setelahnya.",
	"cannotBeChangedLater": "Hal ini nantinya tidak dapat diubah lagi.",
	"checking": "Memeriksa",
	"available": "Tersedia",
	"unavailable": "Tidak tersedia",
	"error": "Galat",
	"usernameInvalidFormat": "Hanya dapat menerima karakter a-z, A-Z dan angka 0-9.",
	"tooShort": "Terlalu pendek",
	"tooLong": "Terlalu panjang",
	"emailAddress": "Alamat surel",
	"signupEmailAddressInfo": "Mohon masukkan alamat surel kamu.",
	"emailUnavailableUsed": "Alamat surel ini telah digunakan",
	"emailUnavailableFormat": "Format tidak valid.",
	"emailUnavailableDisposable": "Alamat surel temporer tidak dapat digunakan",
	"emailUnavailableBanned": "Kamu tidak dapat mendaftar dengan alamat surel ini",
	"emailUnavailableMx": "Peladen alamat surel ini tidak valid",
	"emailUnavailableSmtp": "Peladen alamat surel ini tidak merespon",
	"password": "Kata sandi",
	"weakPassword": "Kata sandi lemah",
	"normalPassword": "Kata sandi baik",
	"strongPassword": "Kata sandi kuat",
	"retype": "Masukkan ulang",
	"passwordMatched": "Kata sandi sama",
	"passwordNotMatched": "Kata sandi tidak sama",
	"start": "Mulai",
	"signupAlmostThere": "Hampir selesai",
	"signupEmailSent": "Konfirmasi surel telah dikirimkan ke alamat surel kamu ({email}). Mohon klik tautan yang tercantum di dalamnya untuk menyelesaikan pembuatan akun.",
	"somethingHappened": "Terjadi kesalahan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"invitationCode": "Codice di invito",
	"username": "Nome utente",
	"usernameInfo": "Un nome per identificare univocamente il tuo profilo sull'istanza. Puoi utilizzare caratteri alfanumerici maiuscoli, minuscoli e il trattino basso (_). Non potrai cambiare nome utente in seguito.",
	"cannotBeChangedLater": "Non sarà più modificabile",
	"checking": "Confermando",
	"available": "Disponibile",
	"unavailable": "Non puoi usarlo",
	"error": "Errore",
	"usernameInvalidFormat": "Il nome utente deve avere solo caratteri alfanumerici e trattino basso '_'",
	"tooShort": "Troppo breve",
	"tooLong": "Troppo lungo",
	"emailAddress": "Indirizzo di posta elettronica",
	"signupEmailAddressInfo": "Inserisci il tuo indirizzo email. Non verrà reso pubblico.",
	"emailUnavailableUsed": "Email già in uso",
	"emailUnavailableFormat": "Formato email non valido",
	"emailUnavailableDisposable": "Indirizzo email non utilizzabile",
	"emailUnavailableBanned": "Non puoi registrarti con questo indirizzo email",
	"emailUnavailableMx": "Server email non corretto",
	"emailUnavailableSmtp": "Il server email non risponde",
	"password": "Password",
	"weakPassword": "Password debole",
	"normalPassword": "Password buona",
	"strongPassword": "Password forte",
	"retype": "Conferma",
	"passwordMatched": "Corretta",
	"passwordNotMatched": "Le password non corrispondono.",
	"start": "Inizia!",
	"signupAlmostThere": "Quasi completo",
	"signupEmailSent": "Abbiamo spedito una e-mail di conferma all'indirizzo indicato ({email}). Per completare la registrazione del profilo, accedere al link contenuto nell'e-mail appena spedita.",
	"somethingHappened": "Si è verificato un problema"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"invitationCode": "招待コード",
	"username": "ユーザー名",
	"usernameInfo": "サーバー上であなたのアカウントを一意に識別するための名前。アルファベット(a~z, A~Z)、数字(0~9)、およびアンダーバー(_)が使用できます。ユーザー名は後から変更することは出来ません。",
	"cannotBeChangedLater": "後から変更できません。",
	"checking": "確認しています",
	"available": "利用できます",
	"unavailable": "利用できません",
	"error": "エラー",
	"usernameInvalidFormat": "a~z、A~Z、0~9、_が使えます",
	"tooShort": "短すぎます",
	"tooLong": "長すぎます",
	"emailAddress": "メールアドレス",
	"signupEmailAddressInfo": "あなたが使っているメールアドレスを入力してください。メールアドレスが公開されることはありません。",
	"emailUnavailableUsed": "既に使用されています",
	"emailUnavailableFormat": "形式が正しくありません",
	"emailUnavailableDisposable": "恒久的に使用可能なアドレスではありません",
	"emailUnavailableBanned": "このメールアドレスでは登録できません",
	"emailUnavailableMx": "正しいメールサーバーではありません",
	"emailUnavailableSmtp": "メールサーバーが応答しません",
	"password": "パスワード",
	"weakPassword": "弱いパスワード",
	"normalPassword": "普通のパスワード",
	"strongPassword": "強いパスワード",
	"retype": "再入力",
	"passwordMatched": "一致しました",
	"passwordNotMatched": "一致していません",
	"start": "始める",
	"signupAlmostThere": "ほとんど完了です",
	"signupEmailSent": "入力されたメールアドレス({email})宛に確認のメールが送信されました。メールに記載されたリンクにアクセスすると、アカウントの作成が完了します。メールに記載されているリンクの有効期限は30分です。",
	"somethingHappened": "問題が発生しました"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"invitationCode": "招待コード",
	"username": "ユーザー名",
	"usernameInfo": "サーバー上であんたのアカウントをあんたやと分かるようにするための名前やで。アルファベット(a~z, A~Z)、数字(0~9)、それとアンダーバー(_)が使って考えてな。この名前は後から変更することはできへんからちゃんと考えるんやで。",
	"cannotBeChangedLater": "後からは変えられへんで。",
	"checking": "確認しとるで",
	"available": "使えるで",
	"unavailable": "利用できん",
	"error": "おかしなったで",
	"usernameInvalidFormat": "a~z、A~Z、0~9、_が使えるで",
	"tooShort": "短すぎやろ！",
	"tooLong": "長すぎやろ！",
	"emailAddress": "メールアドレス",
	"signupEmailAddressInfo": "あんたが使っとるメアドを入力してなー。入れたメアドが公開されることはないで。",
	"emailUnavailableUsed": "もう使われとるわ",
	"emailUnavailableFormat": "形式がおかしいで",
	"emailUnavailableDisposable": "ずーっと使えるアドレスじゃないみたいや",
	"emailUnavailableBanned": "このメールアドレスはあかん",
	"emailUnavailableMx": "正しいメールサーバーじゃないっぽいわ",
	"emailUnavailableSmtp": "メールサーバーがうんともすんとも言わへん",
	"password": "パスワード",
	"weakPassword": "へぼいパスワード",
	"normalPassword": "ぼちぼちのパスワード",
	"strongPassword": "ええ感じのパスワード",
	"retype": "もっかい入力",
	"passwordMatched": "よし！一致や！",
	"passwordNotMatched": "ちゃうで？",
	"start": "始める",
	"signupAlmostThere": "ほぼ終わったようなもんや",
	"signupEmailSent": "さっき入れたメアド({email})宛に確認メールを送ったで。メールに書かれたリンク押してアカウント作るの終わらしてな。\nメールの認証リンクの期限は30分や。",
	"somethingHappened": "なんかあかんわ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"invitationCode": "Invitation code",
	"username": "Isem n umseqdac",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Checking...",
	"available": "Available",
	"unavailable": "Not available",
	"error": "Error",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "Too short",
	"tooLong": "Too long",
	"emailAddress": "Tansa imayl",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Awal uffir",
	"weakPassword": "Weak password",
	"normalPassword": "Average password",
	"strongPassword": "Strong password",
	"retype": "Enter again",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"invitationCode": "Invitation code",
	"username": "ಬಳಕೆಹೆಸರು",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Checking...",
	"available": "Available",
	"unavailable": "Not available",
	"error": "Error",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "Too short",
	"tooLong": "Too long",
	"emailAddress": "Email address",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "ಗುಪ್ತಪದ",
	"weakPassword": "Weak password",
	"normalPassword": "Average password",
	"strongPassword": "Strong password",
	"retype": "Enter again",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"invitationCode": "초대 코드",
	"username": "유저명",
	"usernameInfo": "서버상에서 계정을 식별하기 위한 이름. 알파벳(a~z, A~Z), 숫자(0~9) 및 언더바(_)를 사용할 수 있습니다. 유저명은 나중에 변경할 수 없습니다.",
	"cannotBeChangedLater": "나중에 변경할 수 없습니다.",
	"checking": "확인하는 중입니다",
	"available": "사용 가능합니다",
	"unavailable": "사용할 수 없습니다",
	"error": "오류",
	"usernameInvalidFormat": "a~z, A~Z, 0-9, _를 사용할 수 있습니다",
	"tooShort": "너무 짧습니다",
	"tooLong": "너무 깁니다",
	"emailAddress": "메일 주소",
	"signupEmailAddressInfo": "당신이 사용하고 있는 이메일 주소를 입력해 주세요. 이메일 주소는 다른 유저에게 공개되지 않습니다.",
	"emailUnavailableUsed": "이 메일 주소는 사용중입니다",
	"emailUnavailableFormat": "형식이 올바르지 않습니다",
	"emailUnavailableDisposable": "임시 이메일 주소는 사용할 수 없습니다",
	"emailUnavailableBanned": "이 메일 주소는 사용할 수 없습니다",
	"emailUnavailableMx": "메일 서버가 올바르지 않습니다",
	"emailUnavailableSmtp": "메일 서버가 응답하지 않습니다",
	"password": "비밀번호",
	"weakPassword": "약한 비밀번호",
	"normalPassword": "좋은 비밀번호",
	"strongPassword": "강한 비밀번호",
	"retype": "다시 입력",
	"passwordMatched": "일치합니다",
	"passwordNotMatched": "일치하지 않습니다",
	"start": "시작하기",
	"signupAlmostThere": "거의 다 끝났습니다",
	"signupEmailSent": "입력하신 메일 주소({email})로 확인 메일을 보내드렸습니다. 가입을 완료하시려면 보내드린 메일에 있는 링크로 접속해 주세요.",
	"somethingHappened": "오류가 발생했습니다"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"invitationCode": "Uitnodigingscode",
	"username": "Gebruikersnaam",
	"usernameInfo": "Een naam die kan worden gebruikt om je gebruikersaccount op deze server te identificeren. Je kunt het alfabet (a~z, A~Z), cijfers (0~9) of underscores (_) gebruiken. Gebruikersnamen kunnen later niet worden gewijzigd.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Wordt gecheckt ...",
	"available": "Beschikbaar",
	"unavailable": "Onbeschikbaar",
	"error": "Fout",
	"usernameInvalidFormat": "Je kunt kleine letters, hoofdletters, cijfers en onderstrepingstekens gebruiken.",
	"tooShort": "Te kort",
	"tooLong": "Te lang",
	"emailAddress": "Email adres",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Wachtwoord",
	"weakPassword": "Zwak wachtwoord",
	"normalPassword": "Redelijke wachtwoord",
	"strongPassword": "Sterk wachtwoord",
	"retype": "Opnieuw invoeren",
	"passwordMatched": "Lucifers",
	"passwordNotMatched": "Komt niet overeen",
	"start": "Aan de slag",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "Er is iets misgegaan."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"invitationCode": "Invitation code",
	"username": "Brukernavn",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "Du kan ikke endre senere.",
	"checking": "Checking...",
	"available": "Tilgjengelig",
	"unavailable": "Utilgjengelig",
	"error": "Feil",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "For kort",
	"tooLong": "For langt",
	"emailAddress": "Email address",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "Allerede brukt",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Passord",
	"weakPassword": "Svakt passord",
	"normalPassword": "Gjennomsnittlig passord",
	"strongPassword": "Sterkt passord",
	"retype": "Gjenta",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "En feil har oppstått"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"invitationCode": "Kod zaproszenia",
	"username": "Nazwa użytkownika",
	"usernameInfo": "Nazwa, która identyfikuje Twoje konto spośród innych na tym serwerze.  Możesz użyć alfabetu (a~z, A~Z), cyfr (0~9) lub podkreślników (_). Nazwy użytkownika nie mogą być później zmieniane.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Sprawdzam",
	"available": "Dostępna",
	"unavailable": "Niedostępna",
	"error": "Błąd",
	"usernameInvalidFormat": "może zawierać litery, cyfry i podkreślniki.",
	"tooShort": "Zbyt krótka",
	"tooLong": "Zbyt długa",
	"emailAddress": "Adres e-mail",
	"signupEmailAddressInfo": "Podaj swój adres e-mail. Nie zostanie on upubliczniony.",
	"emailUnavailableUsed": "Ten adres e-mail jest już używany",
	"emailUnavailableFormat": "Format tego adresu e-mail jest nieprawidłowy",
	"emailUnavailableDisposable": "Nie można używać jednorazowych adresów e-mail",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Ten serwer e-mail jest nieprawidłowy",
	"emailUnavailableSmtp": "Ten serwer e-mail nie odpowiada",
	"password": "Hasło",
	"weakPassword": "Słabe hasło",
	"normalPassword": "Dobre hasło",
	"strongPassword": "Silne hasło",
	"retype": "Wprowadź ponownie",
	"passwordMatched": "Pasuje",
	"passwordNotMatched": "Hasła nie pasują do siebie",
	"start": "Rozpocznij",
	"signupAlmostThere": "Prawie na miejscu",
	"signupEmailSent": "E-mail z potwierdzeniem został wysłany na Twój adres e-mail ({email}). Kliknij dołączony link, aby dokończyć tworzenie konta.",
	"somethingHappened": "Coś poszło nie tak"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"invitationCode": "Código de convite",
	"username": "Nome de usuário",
	"usernameInfo": "O nome para identificar exclusivamente a sua conta no servidor. Pode conter letras (az, AZ), números (0~9) e sublinhados (_). O nome de usuário não pode ser alterado posteriormente.",
	"cannotBeChangedLater": "Isso não pode ser alterado.",
	"checking": "Verificando...",
	"available": "Disponível",
	"unavailable": "Não disponível",
	"error": "Erro",
	"usernameInvalidFormat": "Pode utilizar letras maiúsculas e minúsculas, números e sublinhado (_)",
	"tooShort": "Muito curto",
	"tooLong": "Muito longo",
	"emailAddress": "Endereço de e-mail",
	"signupEmailAddressInfo": "Por favor, insira o seu endereço de e-mail. Ele não será divulgado.",
	"emailUnavailableUsed": "O endereço de e-mail informado já está sendo utilizado",
	"emailUnavailableFormat": "Formado de e-mail inválido",
	"emailUnavailableDisposable": "Endereços de e-mail descartáveis não devem ser utilizados",
	"emailUnavailableBanned": "Você não pode se cadastrar com esse endereço de email",
	"emailUnavailableMx": "O servidor de informado é inválido",
	"emailUnavailableSmtp": "O servidor de e-mail não está respondendo",
	"password": "Senha",
	"weakPassword": "Senha fraca",
	"normalPassword": "Senha normal",
	"strongPassword": "Senha forte",
	"retype": "Digite novamente",
	"passwordMatched": "As senhas coincidem",
	"passwordNotMatched": "As senhas não coincidem",
	"start": "começar",
	"signupAlmostThere": "Quase pronto",
	"signupEmailSent": "Um e-mail de confirmação foi enviado para o endereço de e-mail fornecido ({email}). Acesse o link fornecido no e-mail para concluir a criação de sua conta.",
	"somethingHappened": "Ocorreu um erro"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"invitationCode": "Код приглашения",
	"username": "Имя пользователя",
	"usernameInfo": "Имя, которое отличает вашу учетную запись от других на этом сервере. Вы можете использовать алфавит (a~z, A~Z), цифры (0~9) или символы подчеркивания (_). Имена пользователей не могут быть изменены позже.",
	"cannotBeChangedLater": "Это нельзя изменить позже",
	"checking": "Проверка",
	"available": "Доступно",
	"unavailable": "Не доступно",
	"error": "Ошибка",
	"usernameInvalidFormat": "Можно использовать только латинские буквы (A—Z, a—z), цифры (0—9) и знак подчёркивания (_)",
	"tooShort": "Слишком короткий",
	"tooLong": "Слишком длинный",
	"emailAddress": "Адрес электронной почты",
	"signupEmailAddressInfo": "Введите ваш адрес электронной почты.",
	"emailUnavailableUsed": "Уже используется",
	"emailUnavailableFormat": "Неверный формат",
	"emailUnavailableDisposable": "Временный адрес электронной почты не принимается",
	"emailUnavailableBanned": "Этот адрес почты недоступен",
	"emailUnavailableMx": "Неверный почтовый сервер",
	"emailUnavailableSmtp": "Почтовый сервер не отвечает",
	"password": "Пароль",
	"weakPassword": "Слабый пароль",
	"normalPassword": "Хороший пароль",
	"strongPassword": "Надёжный пароль",
	"retype": "Введите ещё раз",
	"passwordMatched": "Совпали",
	"passwordNotMatched": "Не совпадают",
	"start": "Начать",
	"signupAlmostThere": "Почти готово!",
	"signupEmailSent": "На указанный вами адрес электронной почты ({email}) отправлено письмо. Перейдите по ссылке в письме, чтобы завершить регистрацию.",
	"somethingHappened": "Что-то пошло не так"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"invitationCode": "Kód pozvánky",
	"username": "Meno používateľa",
	"usernameInfo": "Meno, ktoré odlišuje váš účet od ostatných na tomto serveri. Môžete použiť abecedu (a~z, A~Z), čísla (0~9) alebo podtržník (_). Používateľské mená sa nedajú neskôr zmeniť.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Overujem...",
	"available": "Dostupné",
	"unavailable": "Nedostupné",
	"error": "Chyba",
	"usernameInvalidFormat": "Povolené sú písmená, čísla a _.",
	"tooShort": "Príliš krátke",
	"tooLong": "Príliš dlhé",
	"emailAddress": "Emailová adresa",
	"signupEmailAddressInfo": "Prosím zadajte svoju emailovú adresu!",
	"emailUnavailableUsed": "Táto emailová adresa sa už používa",
	"emailUnavailableFormat": "Formát emailovej adresy je nesprávny",
	"emailUnavailableDisposable": "Jednorázové emailové adresy sa nemôžu používať.",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Tento emailový server nefunguje.",
	"emailUnavailableSmtp": "Tento emailový server neodpovedá.",
	"password": "Heslo",
	"weakPassword": "Slabé heslo",
	"normalPassword": "Dobré heslo",
	"strongPassword": "Silné heslo",
	"retype": "Zadajte znovu",
	"passwordMatched": "Heslá sú rovnaké",
	"passwordNotMatched": "Heslá nie sú rovnaké",
	"start": "Začať",
	"signupAlmostThere": "Skoro na konci",
	"signupEmailSent": "Na vašu emailovú adresu ({email}) sme odoslali email. Vytvorenie účtu dokončíte kliknutím na odkaz v emaili.",
	"somethingHappened": "Ups. Niečo sa nepodarilo."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"invitationCode": "รหัสเชิญ",
	"username": "ชื่อผู้ใช้",
	"usernameInfo": "ชื่อที่ระบุบัญชีของคุณจากผู้อื่นในเซิร์ฟเวอร์นี้ คุณสามารถใช้ตัวอักษร (a~z, A~Z), ตัวเลข (0~9) หรือขีดล่าง (_) ชื่อผู้ใช้ไม่สามารถเปลี่ยนแปลงได้ในภายหลัง",
	"cannotBeChangedLater": "สิ่งนี้ไม่สามารถเปลี่ยนแปลงได้ในภายหลังนะ",
	"checking": "Checking",
	"available": "พร้อมใช้งาน",
	"unavailable": "ไม่พร้อมใช้",
	"error": "ผิดพลาด!",
	"usernameInvalidFormat": "สามารถใช้ a~z A~Z 0~9 และ _ ได้",
	"tooShort": "สั้นเกินไปนะ",
	"tooLong": "ยาวเกินไปนะ",
	"emailAddress": "ที่อยู่อีเมล",
	"signupEmailAddressInfo": "กรุณากรอกที่อยู่อีเมลที่คุณใช้ ที่อยู่อีเมลของคุณจะไม่ถูกเผยแพร่สู่สาธารณชน",
	"emailUnavailableUsed": "ที่อยู่อีเมลนี้ได้ถูกใช้ไปแล้ว",
	"emailUnavailableFormat": "รูปแบบของที่อยู่อีเมลนี้ไม่ถูกต้อง",
	"emailUnavailableDisposable": "ไม่สามารถใช้อีเมลชั่วคราวได้",
	"emailUnavailableBanned": "คุณไม่สามารถลงทะเบียนด้วยที่อยู่อีเมลนี้ได้",
	"emailUnavailableMx": "เซิร์ฟเวอร์อีเมลนี้ไม่ถูกต้อง",
	"emailUnavailableSmtp": "เซิร์ฟเวอร์อีเมลนี้ไม่มีการตอบสนอง",
	"password": "รหัสผ่าน",
	"weakPassword": "รหัสผ่านแย่มาก",
	"normalPassword": "รหัสผ่านปกติ",
	"strongPassword": "รหัสผ่านรัดกุมมาก",
	"retype": "พิมพ์รหัสอีกครั้ง",
	"passwordMatched": "ถูกต้อง!",
	"passwordNotMatched": "ไม่ถูกต้อง",
	"start": "เริ่ม",
	"signupAlmostThere": "เกือบจะเสร็จแล้ว",
	"signupEmailSent": "อีเมลยืนยันได้ถูกส่งไปยังที่อยู่อีเมลที่คุณป้อน ({email}) แล้ว กรุณาติดตามลิงก์ในอีเมลเพื่อสร้างบัญชีให้เสร็จสมบูรณ์ ลิงก์ที่ให้ไว้จะหมดอายุใน 30 นาที",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"invitationCode": "Davet kodu",
	"username": "Kullanıcı Adı",
	"usernameInfo": "Bu sunucudaki diğer hesaplardan hesabını ayıran bir isim.  Alfabe (a~z, A~Z), rakamlar (0~9) veya alt çizgi (_) kullanabilirsin. Kullanıcı adları daha sonra değiştirilemez.",
	"cannotBeChangedLater": "Bu daha sonra değiştirilemez.",
	"checking": "Kontrol ediliyor...",
	"available": "Kullanılabilir",
	"unavailable": "Kullanılamaz",
	"error": "Hata",
	"usernameInvalidFormat": "Büyük ve küçük harfler, rakamlar ve alt çizgi kullanabilirsin. (a~z、A~Z、0~9)",
	"tooShort": "Çok kısa",
	"tooLong": "Çok uzun",
	"emailAddress": "E-Posta adresi",
	"signupEmailAddressInfo": "Lütfen E-Posta adresini gir. Bu adres kamuya açık hale getirilmeyecek.",
	"emailUnavailableUsed": "Bu E-Posta adresi zaten kullanılıyor.",
	"emailUnavailableFormat": "Bu E-Posta adresinin biçimi geçersizdir.",
	"emailUnavailableDisposable": "Tek kullanımlık E-Posta adresleri kullanılamaz.",
	"emailUnavailableBanned": "Bu E-Posta adresiyle kayıt olamazsınız.",
	"emailUnavailableMx": "Bu E-Posta sunucusu geçersizdir.",
	"emailUnavailableSmtp": "Bu E-Posta sunucusu yanıt vermiyor.",
	"password": "Şifre",
	"weakPassword": "Zayıf şifre",
	"normalPassword": "Ortalama şifre",
	"strongPassword": "Güçlü şifre",
	"retype": "Tekrar girin",
	"passwordMatched": "Eşleşti",
	"passwordNotMatched": "Eşleşmedi",
	"start": "Başla",
	"signupAlmostThere": "Neredeyse vardık",
	"signupEmailSent": "Onay e-postası E-Posta adresine ({email}) gönderilmiştir. Hesap oluşturma işlemini tamamlamak için e-postadaki bağlantıya tıkla.",
	"somethingHappened": "Bir hata oluştu"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"invitationCode": "Invitation code",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"cannotBeChangedLater": "This cannot be changed later.",
	"checking": "Checking...",
	"available": "Available",
	"unavailable": "Not available",
	"error": "Error",
	"usernameInvalidFormat": "You can use upper- and lowercase letters, numbers, and underscores.",
	"tooShort": "Too short",
	"tooLong": "Too long",
	"emailAddress": "Email address",
	"signupEmailAddressInfo": "Please enter your email address. It will not be made public.",
	"emailUnavailableUsed": "This email address is already being used",
	"emailUnavailableFormat": "The format of this email address is invalid",
	"emailUnavailableDisposable": "Disposable email addresses may not be used",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "This email server is invalid",
	"emailUnavailableSmtp": "This email server is not responding",
	"password": "Password",
	"weakPassword": "Weak password",
	"normalPassword": "Average password",
	"strongPassword": "Strong password",
	"retype": "Enter again",
	"passwordMatched": "Matches",
	"passwordNotMatched": "Does not match",
	"start": "Begin",
	"signupAlmostThere": "Almost there",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"invitationCode": "Код запрошення",
	"username": "Ім'я користувача",
	"usernameInfo": "Ім’я, яке відрізняє ваш обліковий запис від інших на цьому сервері. Можна використовувати латинські літери (az, AZ), цифри (0~9) або підкреслення (_). Ім’я користувача не можна буде змінити пізніше.",
	"cannotBeChangedLater": "Це не можна буде змінити пізніше.",
	"checking": "Перевірка…",
	"available": "Доступно",
	"unavailable": "Недоступно",
	"error": "Помилка",
	"usernameInvalidFormat": "літери, цифри та _ є прийнятними",
	"tooShort": "Занадто короткий",
	"tooLong": "Занадто довгий",
	"emailAddress": "E-mail адреса",
	"signupEmailAddressInfo": "Будь ласка, введіть вашу email-адресу. Вона не буде оприлюднена.",
	"emailUnavailableUsed": "Ця email адреса вже використовується",
	"emailUnavailableFormat": "Невірний формат",
	"emailUnavailableDisposable": "Одноразові email-адреси використовувати не можна",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Цей email сервер недійсний",
	"emailUnavailableSmtp": "Цей email-сервер не відповідає",
	"password": "Пароль",
	"weakPassword": "Слабкий пароль",
	"normalPassword": "Достатній пароль",
	"strongPassword": "Міцний пароль",
	"retype": "Введіть ще раз",
	"passwordMatched": "Все вірно",
	"passwordNotMatched": "Паролі не співпадають",
	"start": "Розпочати",
	"signupAlmostThere": "Майже готово",
	"signupEmailSent": "A confirmation email has been sent to your email address ({email}). Please click the included link to complete account creation.",
	"somethingHappened": "Щось пішло не так"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"invitationCode": "Mã mời",
	"username": "Tên người dùng",
	"usernameInfo": "Bạn có thể sử dụng chữ cái (a ~ z, A ~ Z), chữ số (0 ~ 9) hoặc dấu gạch dưới (_). Tên người dùng không thể thay đổi sau này.",
	"cannotBeChangedLater": "Không thể thay đổi sau này.",
	"checking": "Đang kiểm tra...",
	"available": "Khả dụng",
	"unavailable": "Không sử dụng được",
	"error": "Lỗi",
	"usernameInvalidFormat": "Bạn có thể dùng viết hoa/viết thường, chữ số, và dấu gạch dưới.",
	"tooShort": "Quá ngắn",
	"tooLong": "Quá dài",
	"emailAddress": "Địa chỉ email",
	"signupEmailAddressInfo": "Hãy điền địa chỉ email của bạn. Nó sẽ không được công khai.",
	"emailUnavailableUsed": "Địa chỉ email đã được sử dụng",
	"emailUnavailableFormat": "Địa chỉ email không hợp lệ",
	"emailUnavailableDisposable": "Cấm sử dụng địa chỉ email dùng một lần",
	"emailUnavailableBanned": "You cannot register with this email address",
	"emailUnavailableMx": "Máy chủ email không hợp lệ",
	"emailUnavailableSmtp": "Máy chủ email không phản hồi",
	"password": "Mật khẩu",
	"weakPassword": "Mật khẩu yếu",
	"normalPassword": "Mật khẩu tạm được",
	"strongPassword": "Mật khẩu mạnh",
	"retype": "Nhập lại",
	"passwordMatched": "Trùng khớp",
	"passwordNotMatched": "Không trùng khớp",
	"start": "Bắt đầu",
	"signupAlmostThere": "Gần xong rồi",
	"signupEmailSent": "Một email xác minh đã được gửi đến địa chỉ email ({email}) của bạn. Vui lòng nhấn vào liên kết trong đó để hoàn tất việc tạo tài khoản.",
	"somethingHappened": "Xảy ra lỗi"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"invitationCode": "邀请码",
	"username": "用户名",
	"usernameInfo": "在服务器上唯一标识您的帐户的名称。您可以使用字母 (a ~ z, A ~ Z)、数字 (0 ~ 9) 和下划线 (_)。用户名以后不能更改。",
	"cannotBeChangedLater": "之后不能再更改。",
	"checking": "正在确认",
	"available": "可用",
	"unavailable": "不可用",
	"error": "错误",
	"usernameInvalidFormat": "可使用大小写英文字母、数字和下划线。",
	"tooShort": "过短",
	"tooLong": "过长",
	"emailAddress": "电子邮件地址",
	"signupEmailAddressInfo": "请输入您所使用的电子邮件地址",
	"emailUnavailableUsed": "已经被使用过",
	"emailUnavailableFormat": "无效的格式",
	"emailUnavailableDisposable": "不是永久可用的地址",
	"emailUnavailableBanned": "无法使用此邮件地址注册",
	"emailUnavailableMx": "邮件服务器不正确",
	"emailUnavailableSmtp": "邮件服务器没有响应",
	"password": "密码",
	"weakPassword": "密码强度：弱",
	"normalPassword": "密码强度：中等",
	"strongPassword": "密码强度：强",
	"retype": "重新输入",
	"passwordMatched": "密码一致",
	"passwordNotMatched": "密码不一致",
	"start": "开始",
	"signupAlmostThere": "即将完成",
	"signupEmailSent": "已将确认邮件发送至您输入的电子邮件地址 ({email})。请访问电子邮件中的链接以完成帐户创建。",
	"somethingHappened": "出错了"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"invitationCode": "邀請碼",
	"username": "使用者名稱",
	"usernameInfo": "在伺服器上您的帳戶是唯一的識別名稱。您可以使用字母 (a ~ z, A ~ Z)、數字 (0 ~ 9) 和下底線 (_)。之後帳戶名是不能更改的。",
	"cannotBeChangedLater": "之後不能變更。",
	"checking": "確認中",
	"available": "可用的",
	"unavailable": "不可用的",
	"error": "錯誤",
	"usernameInvalidFormat": "可使用大小寫英文字母、數字和底線",
	"tooShort": "過短",
	"tooLong": "過長",
	"emailAddress": "電子郵件位址",
	"signupEmailAddressInfo": "請輸入您所使用的電子郵件地址。電子郵件地址不會被公開。",
	"emailUnavailableUsed": "已被使用",
	"emailUnavailableFormat": "格式無效",
	"emailUnavailableDisposable": "不是永久可用的地址",
	"emailUnavailableBanned": "無法使用此電子郵件地址註冊",
	"emailUnavailableMx": "郵件伺服器不正確",
	"emailUnavailableSmtp": "郵件伺服器沒有應答",
	"password": "密碼",
	"weakPassword": "密碼強度過弱",
	"normalPassword": "密碼強度普通",
	"strongPassword": "密碼強度高",
	"retype": "重新輸入",
	"passwordMatched": "密碼一致",
	"passwordNotMatched": "密碼不一致",
	"start": "開始",
	"signupAlmostThere": "即將完成",
	"signupEmailSent": "已發送確認郵件至您輸入的電子郵件地址（{email}）。請開啟電子郵件中的連結完成註冊。",
	"somethingHappened": "發生錯誤"
}
</locale>
