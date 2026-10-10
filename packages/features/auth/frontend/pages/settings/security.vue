<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/security" :label="$locale.sfc.security" :keywords="['security']" icon="ti ti-lock" :inlining="['2fa']">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f510.png" color="#ffbf00">
			<SearchText>{{ $locale.sfc.securityBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['password']">
			<FormSection first>
				<template #label><SearchLabel>{{ $locale.sfc.password }}</SearchLabel></template>

				<SearchMarker>
					<MkButton primary @click="change()">
						<SearchLabel>{{ $locale.sfc.changePassword }}</SearchLabel>
					</MkButton>
				</SearchMarker>
			</FormSection>
		</SearchMarker>

		<X2fa/>

		<SearchMarker :keywords="['signin', 'login', 'history', 'log']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.signinHistory }}</SearchLabel></template>
				<MkPagination :paginator="paginator" withControl :forceDisableInfiniteScroll="true">
					<template #default="{items}">
						<div>
							<div v-for="item in items" :key="item.id" v-panel class="timnmucd">
								<header>
									<i v-if="item.success" class="ti ti-check icon succ"></i>
									<i v-else class="ti ti-circle-x icon fail"></i>
									<code class="ip _monospace">{{ item.ip }}</code>
									<MkTime :time="item.createdAt" class="time"/>
								</header>
							</div>
						</div>
					</template>
				</MkPagination>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['regenerate', 'refresh', 'reset', 'token']">
			<FormSection>
				<FormSlot>
					<MkButton danger @click="regenerateToken"><i class="ti ti-refresh"></i> <SearchLabel>{{ $locale.sfc.regenerateLoginToken }}</SearchLabel></MkButton>
					<template #caption>{{ $locale.sfc.regenerateLoginTokenDescription }}</template>
				</FormSlot>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, markRaw } from 'vue';
import X2fa from '@features/auth/frontend/pages/settings/2fa.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const paginator = markRaw(new Paginator('i/signin-history', {
	limit: 5,
}));

async function change() {
	const { canceled: canceled2, result: newPassword } = await os.inputText({
		title: $locale.value.sfc.newPassword,
		type: 'password',
		autocomplete: 'new-password',
	});
	if (canceled2 || newPassword == null) return;

	const { canceled: canceled3, result: newPassword2 } = await os.inputText({
		title: $locale.value.sfc.newPasswordRetype,
		type: 'password',
		autocomplete: 'new-password',
	});
	if (canceled3 || newPassword2 == null) return;

	if (newPassword !== newPassword2) {
		os.alert({
			type: 'error',
			text: $locale.value.sfc.retypedNotMatch,
		});
		return;
	}

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/change-password', {
		currentPassword: auth.result.password,
		token: auth.result.token,
		newPassword,
	});
}

async function regenerateToken() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	misskeyApi('i/regenerate-token', {
		password: auth.result.password,
		token: auth.result.token,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.security,
	icon: 'ti ti-lock',
}));
</script>

<style lang="scss" scoped>
.timnmucd {
	padding: 12px;

	&:first-child {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	&:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	&:not(:last-child) {
		border-bottom: solid 0.5px var(--MI_THEME-divider);
	}

	> header {
		display: flex;
		align-items: center;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.succ {
				color: var(--MI_THEME-success);
			}

			&.fail {
				color: var(--MI_THEME-error);
			}
		}

		> .ip {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-right: 12px;
		}

		> .time {
			margin-left: auto;
			opacity: 0.7;
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"newPassword": "كلمة المرور الجديدة",
	"newPasswordRetype": "كرّر كلمة المرور الجديدة:",
	"retypedNotMatch": "المدخلات لا تتطابق",
	"security": "الأمان",
	"securityBanner": "يمكنك ضبط الإعدادات المتعلقة بأمان الحساب، مثل كلمة المرور وطرق تسجيل الدخول وتطبيقات المصادقة ومفاتيح المرور.",
	"password": "الكلمة السرية",
	"changePassword": "تغيير الكلمة السرية",
	"signinHistory": "تاريخ تسجيل الدخول",
	"regenerateLoginToken": "أعد توليد الرمز",
	"regenerateLoginTokenDescription": "ينشئ رمز استيثاق جديد في العادة هذا ليس ضروريًا ؛ عند إنشاء رمز جديد ستُخرج جميع الأجهزة."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"newPassword": "Contrasenya nova",
	"newPasswordRetype": "Contrasenya nova (repeteix-la)",
	"retypedNotMatch": "Les entrades no coincideix",
	"security": "Seguretat",
	"securityBanner": "Configura les opcions relacionades amb la seguretat del teu compte com ara contrasenyes, mètodes per iniciar sessió, aplicacions d'autentificació i claus d'accés.",
	"password": "Contrasenya",
	"changePassword": "Canvia la contrasenya",
	"signinHistory": "Historial d'autenticacions",
	"regenerateLoginToken": "Regenerar clau de seguretat d'inici de sessió",
	"regenerateLoginTokenDescription": "Regenera la clau de seguretat que es fa servir internament durant l'inici de sessió. Normalment aquesta acció no és necessària. Si es regenera es tancarà la sessió a tots els dispositius amb una sessió activa."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"newPassword": "Nové heslo",
	"newPasswordRetype": "Nové heslo (znovu)",
	"retypedNotMatch": "Zadané údaje se neshodují.",
	"security": "Zabezpečení",
	"securityBanner": "Zde můžete nastavit zabezpečení účtu, například heslo, způsoby přihlašování, ověřovací aplikace a přístupové klíče.",
	"password": "Heslo",
	"changePassword": "Změnit heslo",
	"signinHistory": "Historie přihlášení",
	"regenerateLoginToken": "Přegenerovat přihlašovací token",
	"regenerateLoginTokenDescription": "Přegeneruje token interně používaný během přihlášení. Běžně tahle akce není nutná. Pokud bude token přegenerovaný, tak se všechna přihlášená zařízení odhlásí."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"newPassword": "New password",
	"newPasswordRetype": "Indtast den nye adgangskode igen",
	"retypedNotMatch": "De indtastede værdier stemmer ikke overens.",
	"security": "Security",
	"securityBanner": "Her kan du konfigurere indstillinger for kontosikkerhed, såsom adgangskode, loginmetoder, godkendelsesapps og adgangsnøgler.",
	"password": "Password",
	"changePassword": "Skift adgangskode",
	"signinHistory": "Loginhistorik",
	"regenerateLoginToken": "Generér et nyt login-token",
	"regenerateLoginTokenDescription": "Genererer et nyt token, som bruges internt ved login. Dette er normalt ikke nødvendigt. Hvis tokenet genereres igen, bliver du logget ud på alle enheder."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"newPassword": "Neues Passwort",
	"newPasswordRetype": "Neues Passwort bestätigen",
	"retypedNotMatch": "Die Eingaben stimmen nicht überein.",
	"security": "Sicherheit",
	"securityBanner": "Du kannst Einstellungen für die Kontosicherheit konfigurieren, z. B. Passwörter, Anmeldemethoden, Authentifizierungs-Apps und Passkeys.",
	"password": "Passwort",
	"changePassword": "Passwort ändern",
	"signinHistory": "Anmeldungsverlauf",
	"regenerateLoginToken": "Anmeldetoken regenerieren",
	"regenerateLoginTokenDescription": "Den zur Anmeldung intern verwendeten Token regenerieren. Normalerweise wird dies nicht benötigt. Bei Regeneration werden alle Geräte ausgeloggt."
}
</locale>

<locale locale="en-US" lang="json">
{
	"newPassword": "New password",
	"newPasswordRetype": "Retype new password",
	"retypedNotMatch": "The inputs do not match.",
	"security": "Security",
	"securityBanner": "You can configure settings related to account security, such as password, login methods, authentication apps, and Passkeys.",
	"password": "Password",
	"changePassword": "Change password",
	"signinHistory": "Login history",
	"regenerateLoginToken": "Regenerate login token",
	"regenerateLoginTokenDescription": "Regenerates the token used internally during login. Normally this action is not necessary. If regenerated, all devices will be logged out."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"newPassword": "Contraseña nueva",
	"newPasswordRetype": "Reescribe contraseña nueva",
	"retypedNotMatch": "La información no coincide.",
	"security": "Seguridad",
	"securityBanner": "Puedes configurar opciones relacionadas con la seguridad de la cuenta, como la contraseña, los métodos de inicio de sesión, las aplicaciones de autenticación y Passkeys.",
	"password": "Contraseña",
	"changePassword": "Cambiar contraseña",
	"signinHistory": "Historial de ingresos",
	"regenerateLoginToken": "Regenerar token de login",
	"regenerateLoginTokenDescription": "Regenerar el token usado internamente durante el login. No siempre es necesario hacerlo. Al hacerlo de nuevo, se deslogueará en todos los dispositivos."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"newPassword": "Nouveau mot de passe",
	"newPasswordRetype": "Répéter le nouveau mot de passe",
	"retypedNotMatch": "Les saisies ne correspondent pas.",
	"security": "Sécurité",
	"securityBanner": "Vous pouvez configurer les paramètres de sécurité du compte, comme le mot de passe, les méthodes de connexion, les applications d’authentification et les clés d’accès.",
	"password": "Mot de passe",
	"changePassword": "Modifier votre mot de passe",
	"signinHistory": "Historique de connexion",
	"regenerateLoginToken": "Régénérer le jeton de connexion",
	"regenerateLoginTokenDescription": "Générer un nouveau jeton d'authentification. Cette opération ne devrait pas être nécessaire ; lors de la génération d'un nouveau jeton, tous les appareils seront déconnectés. "
}
</locale>

<locale locale="id-ID" lang="json">
{
	"newPassword": "Kata sandi baru",
	"newPasswordRetype": "Ulangi kata sandi baru",
	"retypedNotMatch": "Input tidak sama",
	"security": "Keamanan",
	"securityBanner": "Kamu dapat mengatur keamanan akun, seperti kata sandi, metode masuk, aplikasi autentikasi, dan kunci akses.",
	"password": "Kata sandi",
	"changePassword": "Ubah kata sandi",
	"signinHistory": "Riwayat masuk",
	"regenerateLoginToken": "Perbarui token login",
	"regenerateLoginTokenDescription": "Perbarui token yang digunakan secara internal saat login. Normalnya aksi ini tidak diperlukan. Jika diperbarui, semua perangkat akan dilogout."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"newPassword": "Nuova Password",
	"newPasswordRetype": "Conferma password",
	"retypedNotMatch": "Le password non corrispondono.",
	"security": "Sicurezza",
	"securityBanner": "Puoi gestire la sicurezza del tuo account, la password, i modi di accesso, la generazione di codici OTP per accesso multi fattore (MFA/2FA) e la passkey.",
	"password": "Password",
	"changePassword": "Aggiorna Password",
	"signinHistory": "Storico degli accessi al profilo",
	"regenerateLoginToken": "Genera di nuovo un token di connessione",
	"regenerateLoginTokenDescription": "Genera un nuovo token di autenticazione. Solitamente questa operazione non è necessaria: quando si genera un nuovo token, tutti i dispositivi vanno disconnessi."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"newPassword": "新しいパスワード",
	"newPasswordRetype": "新しいパスワード(再入力)",
	"retypedNotMatch": "入力が一致しません。",
	"security": "セキュリティ",
	"securityBanner": "パスワード、ログイン方法、認証アプリ、パスキーなどアカウントのセキュリティに関する設定を行えます。",
	"password": "パスワード",
	"changePassword": "パスワードを変更",
	"signinHistory": "ログイン履歴",
	"regenerateLoginToken": "ログイントークンを再生成",
	"regenerateLoginTokenDescription": "ログインに使用される内部トークンを再生成します。通常この操作を行う必要はありません。再生成すると、全てのデバイスでログアウトされます。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"newPassword": "今度のパスワード",
	"newPasswordRetype": "今度のパスワード(もっぺん入れて)",
	"retypedNotMatch": "入れたやつ合うてへんわ。",
	"security": "セキュリティ",
	"securityBanner": "パスワード、ログイン方法、認証アプリ、パスキーとかアカウントのセキュリティに関わる設定ができるで。",
	"password": "パスワード",
	"changePassword": "パスワードをいじる",
	"signinHistory": "ログイン履歴",
	"regenerateLoginToken": "ログイントークンを再生成",
	"regenerateLoginTokenDescription": "ログインに使われる内部トークンをもっかい作るで。いつもならこれをやる必要はないで。もっかい作ると、全部のデバイスでログアウトされるで気ぃつけてなー。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"newPassword": "New password",
	"newPasswordRetype": "Ales asekcem n wawal uffir amaynut",
	"retypedNotMatch": "Isekcam ur mṣadan ara.",
	"security": "Taɣellist",
	"securityBanner": "Tzemreḍ ad tesbaduḍ iɣewwaren n tɣellist n umiḍan, am wawal uffir, tarrayin n unekcum, isnasen n usesteb akked tsura n unekcum.",
	"password": "Awal uffir",
	"changePassword": "Beddel awal uffir",
	"signinHistory": "Amazray n unekcum",
	"regenerateLoginToken": "Sirew tikelt-nniḍen ajuṭun n unekcum",
	"regenerateLoginTokenDescription": "Yessiraw tikelt-nniḍen ajuṭun yettwasqedcen daxel deg unekcum. Tigawt-a ur tlaq ara s umata. Ma yella yettwasirew tikelt-nniḍen, ad teffɣeḍ seg meṛṛa ibenkan."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"newPassword": "New password",
	"newPasswordRetype": "ಹೊಸ ಗುಪ್ತಪದವನ್ನು ಮತ್ತೊಮ್ಮೆ ನಮೂದಿಸಿ",
	"retypedNotMatch": "ನಮೂದಿಸಿದ ಮೌಲ್ಯಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
	"security": "Security",
	"securityBanner": "ಗುಪ್ತಪದ, ಪ್ರವೇಶ ವಿಧಾನಗಳು, ದೃಢೀಕರಣ ಅಪ್ಲಿಕೇಶನ್‌ಗಳು ಮತ್ತು ಪಾಸ್‌ಕೀಗಳಂತಹ ಖಾತೆಯ ಸುರಕ್ಷತೆಗೆ ಸಂಬಂಧಿಸಿದ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಇಲ್ಲಿ ಹೊಂದಿಸಬಹುದು.",
	"password": "ಗುಪ್ತಪದ",
	"changePassword": "ಗುಪ್ತಪದ ಬದಲಾಯಿಸಿ",
	"signinHistory": "ಪ್ರವೇಶದ ಇತಿಹಾಸ",
	"regenerateLoginToken": "ಪ್ರವೇಶ ಟೋಕನ್ ಅನ್ನು ಮರುಸೃಷ್ಟಿಸಿ",
	"regenerateLoginTokenDescription": "ಪ್ರವೇಶದ ವೇಳೆ ಆಂತರಿಕವಾಗಿ ಬಳಸುವ ಟೋಕನ್ ಅನ್ನು ಮರುಸೃಷ್ಟಿಸುತ್ತದೆ. ಸಾಮಾನ್ಯವಾಗಿ ಈ ಕ್ರಿಯೆ ಅಗತ್ಯವಿರುವುದಿಲ್ಲ. ಮರುಸೃಷ್ಟಿಸಿದರೆ, ಎಲ್ಲ ಸಾಧನಗಳಿಂದ ನಿರ್ಗಮಿಸಲಾಗುತ್ತದೆ."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"newPassword": "새 비밀번호",
	"newPasswordRetype": "새 비밀번호(재입력)",
	"retypedNotMatch": "입력이 일치하지 않습니다.",
	"security": "보안",
	"securityBanner": "비밀번호, 로그인 방법, OTP, 패스 키 등의 계정의 보안에 관련된 설정을 합니다.",
	"password": "비밀번호",
	"changePassword": "비밀번호 변경",
	"signinHistory": "로그인 기록",
	"regenerateLoginToken": "로그인 토큰을 재생성",
	"regenerateLoginTokenDescription": "로그인할 때 사용되는 내부 토큰을 재생성합니다. 일반적으로 이 작업을 실행할 필요는 없습니다. 이 기능을 사용하면 이 계정으로 로그인한 모든 기기에서 로그아웃됩니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"newPassword": "Nieuwe wachtwoord",
	"newPasswordRetype": "Nieuw wachtwoord (herhalen)",
	"retypedNotMatch": "Invoer komt niet overeen",
	"security": "Beveiliging",
	"securityBanner": "Je kunt instellingen voor accountbeveiliging configureren, zoals je wachtwoord, aanmeldmethoden, authenticatie-apps en passkeys.",
	"password": "Wachtwoord",
	"changePassword": "Wachtwoord wijzigen",
	"signinHistory": "Inloggeschiedenis",
	"regenerateLoginToken": "Login token opnieuw genereren",
	"regenerateLoginTokenDescription": "Regenereren van het token dat intern wordt gebruikt om in te loggen. Dit is normaal gezien niet nodig. Alle apparaten worden afgemeld tijdens het regenereren."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"newPassword": "Nytt passord",
	"newPasswordRetype": "Nytt passord (gjenta)",
	"retypedNotMatch": "Inngangene stemmer ikke overens.",
	"security": "Sikkerhet",
	"securityBanner": "Du kan konfigurere innstillinger for kontosikkerhet, som passord, innloggingsmetoder, autentiseringsapper og tilgangsnøkler.",
	"password": "Passord",
	"changePassword": "Endre passord",
	"signinHistory": "Innloggingshistorikk",
	"regenerateLoginToken": "Generer innloggingstoken på nytt",
	"regenerateLoginTokenDescription": "Genererer tokenet som brukes internt ved innlogging, på nytt. Dette er vanligvis ikke nødvendig. Hvis tokenet genereres på nytt, blir du logget ut på alle enheter."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"newPassword": "Nowe hasło",
	"newPasswordRetype": "Powtórz nowe hasło",
	"retypedNotMatch": "Wejście nie zgadza się.",
	"security": "Bezpieczeństwo",
	"securityBanner": "Możesz skonfigurować ustawienia zabezpieczeń konta, takie jak hasło, metody logowania, aplikacje uwierzytelniające i klucze dostępu.",
	"password": "Hasło",
	"changePassword": "Zmień hasło",
	"signinHistory": "Historia logowania",
	"regenerateLoginToken": "Generuj token logowania ponownie",
	"regenerateLoginTokenDescription": "Regeneruje token używany wewnętrznie podczas logowania. Zazwyczaj nie jest to konieczne. Po regeneracji wszystkie urządzenia zostaną wylogowane."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"newPassword": "Nova senha",
	"newPasswordRetype": "Nova senha (digite novamente)",
	"retypedNotMatch": "As informações inseridas não coincidem.",
	"security": "Segurança",
	"securityBanner": "Você pode configurar a segurança da conta em ajustes como senha, meios de entrada, aplicativos de autenticação e chaves de acesso.",
	"password": "Senha",
	"changePassword": "Mudar senha",
	"signinHistory": "Histórico de acesso",
	"regenerateLoginToken": "Gerar novo token de login",
	"regenerateLoginTokenDescription": "Gera novamente o token interno usado para o login. Normalmente, isso não é necessário. Ao regenerar, você será desconectado de todos os dispositivos."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"newPassword": "Новый пароль",
	"newPasswordRetype": "Новый пароль (ещё раз)",
	"retypedNotMatch": "Не совпадают",
	"security": "Безопасность",
	"securityBanner": "Здесь можно настроить безопасность аккаунта: пароль, способы входа, приложения для аутентификации и ключи доступа.",
	"password": "Пароль",
	"changePassword": "Изменить пароль",
	"signinHistory": "Журнал посещений",
	"regenerateLoginToken": "Создать новый токен для входа",
	"regenerateLoginTokenDescription": "Создаёт новый токен, используемый внутри программы во время входа. Обычно в этом нет необходимости. При создании все устройства будут отключены."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"newPassword": "Nové heslo",
	"newPasswordRetype": "Nové heslo (znovu)",
	"retypedNotMatch": "Zadané vstupy nesúhlasia",
	"security": "Zabezpečenie",
	"securityBanner": "Tu môžete nastaviť zabezpečenie účtu, napríklad heslo, spôsoby prihlasovania, overovacie aplikácie a prístupové kľúče.",
	"password": "Heslo",
	"changePassword": "Zmeniť heslo",
	"signinHistory": "História prihlásení",
	"regenerateLoginToken": "Pregenerovať prihlasovací token",
	"regenerateLoginTokenDescription": "Pregeneruje token interne používaný počas prihlásenia. Normálne toto netreba robiť. Ak sa pregeneruje, všetky zariadenia sa odhlásia."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"newPassword": "รหัสผ่านใหม่",
	"newPasswordRetype": "ใส่รหัสผ่านใหม่อีกครั้ง",
	"retypedNotMatch": "ทั้งสองป้อนข้อมูลไม่สอดคล้องกัน",
	"security": "ความปลอดภัย",
	"securityBanner": "สามารถตั้งค่าความปลอดภัยของบัญชี เช่น รหัสผ่าน วิธีการเข้าสู่ระบบ แอปยืนยันตัวตน Passkey เป็นต้น",
	"password": "รหัสผ่าน",
	"changePassword": "เปลี่ยนรหัสผ่าน",
	"signinHistory": "ประวัติการเข้าสู่ระบบ",
	"regenerateLoginToken": "สร้างโทเค็นการเข้าสู่ระบบอีกครั้ง",
	"regenerateLoginTokenDescription": "สร้างโทเค็นใหม่ที่ใช้ภายในระหว่างการเข้าสู่ระบบ โดยตามหลักปกติแล้วการดำเนินการนี้ไม่จำเป็น หากสร้างใหม่ อุปกรณ์ทั้งหมดจะถูกออกจากระบบนะ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"newPassword": "Yeni şifre",
	"newPasswordRetype": "Yeni şifreyi tekrar girin",
	"retypedNotMatch": "Girişler eşleşmiyor.",
	"security": "Güvenlik",
	"securityBanner": "Şifre, oturum açma yöntemleri, kimlik doğrulama uygulamaları ve Passkeys gibi hesap güvenliği ile ilgili ayarları yapılandırabilirsin.",
	"password": "Şifre",
	"changePassword": "Şifreyi değiştir",
	"signinHistory": "Giriş geçmişi",
	"regenerateLoginToken": "Giriş jetonunu yeniden oluştur",
	"regenerateLoginTokenDescription": "Giriş sırasında dahili olarak kullanılan jetonu yeniden oluşturur. Normalde bu işlem gerekli değildir. Yeniden oluşturulursa, tüm cihazlar oturumu kapatılır."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"newPassword": "New password",
	"newPasswordRetype": "يېڭى پارولنى قايتا كىرگۈزۈڭ",
	"retypedNotMatch": "كىرگۈزگەن مەزمۇنلار ماس كەلمەيدۇ.",
	"security": "Security",
	"securityBanner": "بۇ يەردە پارول، كىرىش ئۇسۇللىرى، دەلىللەش ئەپلىرى ۋە كىرىش ئاچقۇچلىرى قاتارلىق ھېسابات بىخەتەرلىكىگە مۇناسىۋەتلىك تەڭشەكلەرنى تەڭشىيەلەيسىز.",
	"password": "Password",
	"changePassword": "پارولنى ئۆزگەرتىش",
	"signinHistory": "كىرىش تارىخى",
	"regenerateLoginToken": "كىرىش توكىنىنى قايتا ھاسىل قىلىش",
	"regenerateLoginTokenDescription": "كىرىش جەريانىدا ئىچكى قىسىمدا ئىشلىتىلىدىغان توكىننى قايتا ھاسىل قىلىدۇ. ئادەتتە بۇ مەشغۇلاتنىڭ ھاجىتى يوق. قايتا ھاسىل قىلىنسا، بارلىق ئۈسكۈنىلەردىن چىقىرىلىسىز."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"newPassword": "Новий пароль",
	"newPasswordRetype": "Новий пароль (повторно)",
	"retypedNotMatch": "Введені дані не збігаються.",
	"security": "Безпека",
	"securityBanner": "Ви можете змінювати налаштування, пов'язані з безпекою облікового запису, такі як пароль, методи входження, засоби аутентифікації, й Passkeys.",
	"password": "Пароль",
	"changePassword": "Змінити пароль",
	"signinHistory": "Історія входів",
	"regenerateLoginToken": "Оновити Login Token",
	"regenerateLoginTokenDescription": "Регенерувати внутрішній ключ використовуваний під час входу. Зазвичай цього не потрібно робити. При регенерації всі пристрої вийдуть з системи."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"newPassword": "Mật khẩu mới",
	"newPasswordRetype": "Nhập lại mật khẩu mới",
	"retypedNotMatch": "Mật khẩu không trùng khớp.",
	"security": "Bảo mật",
	"securityBanner": "Bạn có thể cấu hình các thiết lập bảo mật tài khoản, như mật khẩu, phương thức đăng nhập, ứng dụng xác thực và khóa truy cập.",
	"password": "Mật khẩu",
	"changePassword": "Đổi mật khẩu",
	"signinHistory": "Lịch sử đăng nhập",
	"regenerateLoginToken": "Tạo lại mã đăng nhập",
	"regenerateLoginTokenDescription": "Tạo lại mã nội bộ có thể dùng để đăng nhập. Thông thường hành động này là không cần thiết. Nếu được tạo lại, tất cả các thiết bị sẽ bị đăng xuất."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"newPassword": "新密码",
	"newPasswordRetype": "重新输入密码：",
	"retypedNotMatch": "两次输入不一致！",
	"security": "安全",
	"securityBanner": "可在此设置如密码、登入方式、验证器、Passkey 等账户安全性设置。",
	"password": "密码",
	"changePassword": "修改密码",
	"signinHistory": "登录历史",
	"regenerateLoginToken": "重新生成登录令牌",
	"regenerateLoginTokenDescription": "重新生成用于登录的内部令牌。通常您不需要这样做。重新生成后，您将在所有设备上登出。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"newPassword": "新密碼",
	"newPasswordRetype": "確認密碼",
	"retypedNotMatch": "兩次輸入不一致。",
	"security": "安全性",
	"securityBanner": "您可以設定與帳戶安全性相關的設定，例如密碼、登入方式、驗證應用程式和通行金鑰。",
	"password": "密碼",
	"changePassword": "修改密碼",
	"signinHistory": "登入歷史",
	"regenerateLoginToken": "重新產生登入權杖",
	"regenerateLoginTokenDescription": "重新產生用於登入的內部權杖。通常不需要使用此功能。重新產生後，所有裝置都將被登出。"
}
</locale>
