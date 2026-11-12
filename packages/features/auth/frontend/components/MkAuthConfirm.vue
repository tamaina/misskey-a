<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<Transition
		mode="out-in"
		:enterActiveClass="$style.transition_enterActive"
		:leaveActiveClass="$style.transition_leaveActive"
		:enterFromClass="$style.transition_enterFrom"
		:leaveToClass="$style.transition_leaveTo"

		:inert="_waiting"
	>
		<div v-if="phase === 'accountSelect'" key="accountSelect" :class="$style.root" class="_gaps">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-user"></i>
				</div>
				<div :class="$style.headerText">{{ $locale.sfc.pleaseSelectAccount }}</div>
			</div>
			<div>
				<div :class="$style.accountSelectorLabel">{{ $locale.sfc.selectAccount }}</div>
				<div :class="$style.accountSelectorList">
					<template v-for="[id, user] in users">
						<input :id="'account-' + id" v-model="selectedUser" type="radio" name="accountSelector" :value="id" :class="$style.accountSelectorRadio"/>
						<label :for="'account-' + id" :class="$style.accountSelectorItem">
							<MkAvatar :user="user" :class="$style.accountSelectorAvatar"/>
							<div :class="$style.accountSelectorBody">
								<MkUserName :user="user" :class="$style.accountSelectorName"/>
								<MkAcct :user="user" :class="$style.accountSelectorAcct"/>
							</div>
						</label>
					</template>
					<button class="_button" :class="[$style.accountSelectorItem, $style.accountSelectorAddAccountRoot]" @click="clickAddAccount">
						<div :class="[$style.accountSelectorAvatar, $style.accountSelectorAddAccountAvatar]">
							<i class="ti ti-user-plus"></i>
						</div>
						<div :class="[$style.accountSelectorBody, $style.accountSelectorName]">{{ $locale.sfc.addAccount }}</div>
					</button>
				</div>
			</div>
			<div class="_buttonsCenter">
				<MkButton rounded gradate :disabled="selectedUser === null" @click="clickChooseAccount">{{ globalLocale.env.continue }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
		<div v-else-if="phase === 'consent'" key="consent" :class="$style.root" class="_gaps">
			<div :class="$style.header" class="_gaps_s">
				<img v-if="icon" :class="$style.icon" :src="getProxiedImageUrl(icon, 'preview')"/>
				<div v-else :class="$style.iconFallback">
					<i class="ti ti-apps"></i>
				</div>
				<div :class="$style.headerText">{{ name ? interpolateLocaleParameters($locale.sfc.authShareAccess, { name }) : $locale.sfc.authShareAccessAsk }}</div>
			</div>
			<div v-if="permissions && permissions.length > 0" class="_gaps_s" :class="$style.permissionRoot">
				<div>{{ name ? interpolateLocaleParameters($locale.sfc.authPermission, { name }) : $locale.sfc.authPermissionAsk }}</div>
				<div :class="$style.permissionListWrapper">
					<ul :class="$style.permissionList">
						<li v-for="p in permissions" :key="p">{{ (copyLocaleDictionary(globalLocale.env._permissions) as Record<string, string>)[p] }}</li>
					</ul>
				</div>
			</div>
			<div v-if="selectablePermissionsLabel && selectablePermissions" :class="$style.accountSelectorLabel">{{ selectablePermissionsLabel }}</div>
			<MkPermissionSelect
				v-if="selectablePermissions" v-model="selectedPermissions" :permissions="selectablePermissions"
				:administrator="selectedAdministrator"
			/>
			<MkTokenExpiry v-model="expiry" :disabled="waiting"/>
			<p v-if="!canAuthorize">{{ $locale.sfc.currentAccountRequired }}</p>
			<slot name="consentAdditionalInfo"></slot>
			<div>
				<div :class="$style.accountSelectorLabel">
					{{ $locale.sfc.authScopeUser }} <button class="_textButton" @click="clickBackToAccountSelect">{{ $locale.sfc.switchAccount }}</button>
				</div>
				<div :class="$style.accountSelectorList">
					<div :class="[$style.accountSelectorItem, $style.static]">
						<MkAvatar :user="users.get(selectedUser!)!" :class="$style.accountSelectorAvatar"/>
						<div :class="$style.accountSelectorBody">
							<MkUserName :user="users.get(selectedUser!)!" :class="$style.accountSelectorName"/>
							<MkAcct :user="users.get(selectedUser!)!" :class="$style.accountSelectorAcct"/>
						</div>
					</div>
				</div>
			</div>
			<div class="_buttonsCenter">
				<MkButton rounded @click="clickCancel">{{ globalLocale.env.reject }}</MkButton>
				<MkButton rounded gradate :disabled="!canAuthorize || (selectablePermissions !== undefined && !permissions?.length && selectedPermissions.length === 0)" @click="clickAccept">{{ globalLocale.env.accept }}</MkButton>
			</div>
		</div>
		<div v-else-if="phase === 'success'" key="success" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-check"></i>
				</div>
				<div :class="$style.headerText">{{ $locale.sfc.authAccepted }}</div>
				<div :class="$style.headerTextSub">{{ $locale.sfc.authPleaseGoBack }}</div>
			</div>
		</div>
		<div v-else-if="phase === 'denied'" key="denied" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-x"></i>
				</div>
				<div :class="$style.headerText">{{ $locale.sfc.authDenied }}</div>
			</div>
		</div>
		<div v-else-if="phase === 'failed'" key="failed" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-x"></i>
				</div>
				<div :class="$style.headerText">{{ globalLocale.env.somethingHappened }}</div>
			</div>
		</div>
	</Transition>
	<div v-if="_waiting" :class="$style.waitingRoot">
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { $i } from '@features/auth/frontend/i.js';
import { getAccounts, getAccountWithSigninDialog, getAccountWithSignupDialog } from '@features/auth/frontend/accounts.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import * as os from '@features/ui/frontend/os.js';
import { getProxiedImageUrl } from '@features/drive/frontend/utility/media-proxy.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSudo } from '../utility/ensure-sudo.js';
import { selectedCredentialExpiry, useCredentialOperation } from '../utility/use-credential-operation.js';
import MkPermissionSelect from './MkPermissionSelect.vue';
import MkTokenExpiry from './MkTokenExpiry.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	name?: string;
	icon?: string;
	permissions?: (typeof Misskey.permissions[number])[];
	selectablePermissions?: string[];
	selectablePermissionsLabel?: string;
	manualWaiting?: boolean;
	waitOnDeny?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'accept', token: string, permissions?: string[], expiresAt?: string): void;
	(ev: 'deny', token: string): void;
}>();

const expiry = ref<string | null>(null);
const operation = useCredentialOperation(() => { expiry.value = null; waiting.value = false; });
const waiting = ref(true);
const _waiting = computed(() => waiting.value || props.manualWaiting);
const phase = ref<'accountSelect' | 'consent' | 'success' | 'denied' | 'failed'>('accountSelect');

const selectedPermissions = ref<string[]>([]);
const selectedAdministrator = computed(() => {
	const user = selectedUser.value ? users.value.get(selectedUser.value) : undefined;
	return user !== undefined && 'isAdmin' in user && user.isAdmin === true;
});

const selectedUser = ref<string | null>(null);

const canAuthorize = computed(() => { const user = selectedUser.value ? users.value.get(selectedUser.value) : undefined; return !!user && $i?.id === user.id && $i.token === user.token && user.token.startsWith('bs_'); });

const users = ref(new Map<string, Misskey.entities.UserDetailed & { token: string; }>());

async function init() {
	waiting.value = true;

	users.value.clear();

	if ($i) {
		users.value.set($i.id, $i);
	}

	const accounts = await getAccounts();

	const accountIdsToFetch = accounts.map(a => a.id).filter(id => !users.value.has(id));

	if (accountIdsToFetch.length > 0) {
		const usersRes = await misskeyApi('users/show', {
			userIds: accountIdsToFetch,
		});

		for (const user of usersRes) {
			if (users.value.has(user.id)) continue;

			const account = accounts.find(a => a.id === user.id);

			if (!account || account.token == null) continue;

			users.value.set(user.id, {
				...user,
				token: account.token,
			});
		}
	}

	waiting.value = false;
}

init();

function clickAddAccount(ev: PointerEvent) {
	selectedUser.value = null;

	os.popupMenu([{
		text: $locale.value.sfc.existingAccount,
		action: () => {
			getAccountWithSigninDialog().then(async (res) => {
				if (res != null) {
					os.success();
					await init();
					if (users.value.has(res.id)) {
						selectedUser.value = res.id;
					}
				}
			});
		},
	}, {
		text: $locale.value.sfc.createAccount,
		action: () => {
			getAccountWithSignupDialog().then(async (res) => {
				if (res != null) {
					os.success();
					await init();
					if (users.value.has(res.id)) {
						selectedUser.value = res.id;
					}
				}
			});
		},
	}], ev.currentTarget ?? ev.target);
}

async function clickChooseAccount() {
	if (selectedUser.value === null) return;
	if (props.selectablePermissions !== undefined) {
		const user = users.value.get(selectedUser.value)!;
		waiting.value = true;
		try {
			const details = await misskeyApi('users/show', { userId: user.id }, user.token);
			users.value.set(user.id, { ...details, token: user.token });
		} catch { showUI('failed'); return; } finally { waiting.value = false; }
	}

	selectedPermissions.value = [];
	phase.value = 'consent';
}

function clickBackToAccountSelect() {
	selectedUser.value = null;
	phase.value = 'accountSelect';
}

function clickCancel() {
	if (selectedUser.value === null) return;

	const user = users.value.get(selectedUser.value)!;

	const token = user.token;

	if (props.waitOnDeny) {
		waiting.value = true;
	}
	emit('deny', token);
}

async function clickAccept() {
	if (selectedUser.value === null || !canAuthorize.value) return;
	const user = users.value.get(selectedUser.value)!; const permissions = props.selectablePermissions === undefined ? undefined : [...selectedPermissions.value]; const targetExpiry = expiry.value;
	await operation.run(async (current, signal) => {
		waiting.value = true;
		try {
			const expiresAt = selectedCredentialExpiry(targetExpiry);
			if (!await ensureSudo(current, signal) || !current() || !canAuthorize.value || selectedUser.value !== user.id) { if (current()) waiting.value = false; return; }
			emit('accept', user.token, permissions, expiresAt);
		} catch { if (current()) showUI('failed'); }
	});
}

function showUI(state: 'success' | 'denied' | 'failed') {
	phase.value = state;
	waiting.value = false;
}

defineExpose({
	showUI,
});
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.wrapper {
	overflow-x: hidden;
	overflow-x: clip;

	position: relative;
	width: 100%;
	height: 100%;
}

.waitingRoot {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: color-mix(in srgb, var(--MI_THEME-panel), transparent 50%);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1;
	cursor: wait;
}

.root {
	position: relative;
	box-sizing: border-box;
	width: 100%;
	padding: 48px 24px;
}

.header {
	margin: 0 auto;
	max-width: 320px;
}

.icon,
.iconFallback {
	display: block;
	margin: 0 auto;
	width: 54px;
	height: 54px;
}

.icon {
	border-radius: 50%;
	border: 1px solid var(--MI_THEME-divider);
	background-color: #fff;
	object-fit: contain;
}

.iconFallback {
	border-radius: 50%;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	line-height: 54px;
	font-size: 18px;
}

.headerText,
.headerTextSub {
	text-align: center;
	word-break: normal;
	word-break: auto-phrase;
}

.headerText {
	font-size: 16px;
	font-weight: 700;
}

.permissionRoot {
	padding: 16px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-bg);
}

.permissionListWrapper {
	max-height: 350px;
	overflow-y: auto;
	padding: 12px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
}

.permissionList {
	margin: 0 0 0 1.5em;
	padding: 0;
	font-size: 90%;
}

.accountSelectorLabel {
	font-size: 0.85em;
	opacity: 0.7;
	margin-bottom: 8px;
}

.accountSelectorList {
	border-radius: var(--MI-radius);
	border: 1px solid var(--MI_THEME-divider);
	overflow: hidden;
	overflow: clip;
}

.accountSelectorRadio {
	position: absolute;
	clip: rect(0, 0, 0, 0);
	pointer-events: none;

	&:focus-visible + .accountSelectorItem {
		outline: 2px solid var(--MI_THEME-accent);
		outline-offset: -4px;
	}

	&:checked:focus-visible + .accountSelectorItem {
		outline-color: #fff;
	}

	&:checked + .accountSelectorItem {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.accountSelectorItem {
	display: flex;
	align-items: center;
	padding: 8px;
	font-size: 14px;
	-webkit-tap-highlight-color: transparent;
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.static {
		cursor: unset;

		&:hover {
			background: none;
		}
	}
}

.accountSelectorAddAccountRoot {
	width: 100%;
}

.accountSelectorBody {
	padding: 0 8px;
	min-width: 0;
}

.accountSelectorAvatar {
	width: 45px;
	height: 45px;
}

.accountSelectorAddAccountAvatar {
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 16px;
	line-height: 45px;
	text-align: center;
	border-radius: 50%;
}

.accountSelectorName {
	display: block;
	font-weight: bold;
}

.accountSelectorAcct {
	opacity: 0.5;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "اختر حسابًا",
	"addAccount": "أضف حساباً",
	"authShareAccess": "أتريد التفويض لـ \"{name}\" بالوصول لحسابك؟",
	"authShareAccessAsk": "هل تخول لهذا التطبيق الوصول لحسابك؟",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "يطلب التطبيق الأذون التالية",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "تغيير الحساب",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "رجاءً عد للتطبيق",
	"authDenied": "رُفض الوصول",
	"existingAccount": "الحسابات الموجودة",
	"createAccount": "أنشئ حسابًا"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pleaseSelectAccount": "Seleccionar un compte",
	"selectAccount": "Seleccionar un compte",
	"addAccount": "Afegeix un compte",
	"authShareAccess": "Vols que {name} pugui accedir al vostre compte?",
	"authShareAccessAsk": "Segur que vols que aquesta aplicació pugui accedir al vostre compte?",
	"authPermission": "{name} demana els següents permisos",
	"authPermissionAsk": "Aquesta aplicació demana els següents permisos",
	"authScopeUser": "Opera com si fossis aquest usuari",
	"switchAccount": "Canviar de compte",
	"authAccepted": "Accés garantit",
	"authPleaseGoBack": "Si us plau, torna a l'aplicació",
	"authDenied": "Accés denegat",
	"existingAccount": "Compte existent",
	"createAccount": "Crea un compte"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Vybrat účet",
	"addAccount": "Přidat účet",
	"authShareAccess": "Chcete autorizovat \"{name}\" pro přístup k tomuto účtu?",
	"authShareAccessAsk": "Opravdu chcete této aplikaci povolit přístup k vašemu účtu?",
	"authPermission": "{name} požaduje tato oprávnění",
	"authPermissionAsk": "Tato aplikace požaduje následující oprávnění",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Přepnout účet",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Vraťte se prosím zpět do aplikace",
	"authDenied": "Přístup odepřen",
	"existingAccount": "Existující účet",
	"createAccount": "Vytvořit účet"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Select account",
	"addAccount": "Add account",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pleaseSelectAccount": "Bitte Konto auswählen",
	"selectAccount": "Benutzerkonto auswählen",
	"addAccount": "Benutzerkonto hinzufügen",
	"authShareAccess": "Möchtest du „{name}“ authorisieren, auf dieses Benutzerkonto zugreifen zu können?",
	"authShareAccessAsk": "Bist du dir sicher, dass du diese Anwendung authorisieren möchtest, auf dein Benutzerkonto zugreifen zu können?",
	"authPermission": "{name} fordert folgende Berechtigungen",
	"authPermissionAsk": "Diese Anwendung fordert folgende Berechtigungen",
	"authScopeUser": "Als folgender Benutzer agieren",
	"switchAccount": "Konto wechseln",
	"authAccepted": "Zugriff gewährt",
	"authPleaseGoBack": "Bitte kehre zur Anwendung zurück",
	"authDenied": "Zugriff verweigert",
	"existingAccount": "Bestehendes Benutzerkonto",
	"createAccount": "Benutzerkonto erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Select account",
	"addAccount": "Add account",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pleaseSelectAccount": "Seleccione una cuenta, por favor.",
	"selectAccount": "Elija una cuenta",
	"addAccount": "Agregar cuenta",
	"authShareAccess": "¿Desea permitir el acceso a la cuenta \"{name}\"?",
	"authShareAccessAsk": "¿Está seguro de que desea autorizar esta aplicación para acceder a su cuenta?",
	"authPermission": "{name} solicita los siguientes permisos",
	"authPermissionAsk": "Esta aplicación requiere los siguientes permisos",
	"authScopeUser": "Operar como el siguiente usuario",
	"switchAccount": "Cambiar de cuenta",
	"authAccepted": "Acceso concedido.",
	"authPleaseGoBack": "Por favor, vuelve a la aplicación",
	"authDenied": "Acceso denegado",
	"existingAccount": "Cuenta existente",
	"createAccount": "Crear cuenta"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pleaseSelectAccount": "Sélectionner un compte",
	"selectAccount": "Sélectionner un compte",
	"addAccount": "Ajouter un compte",
	"authShareAccess": "Autoriser \"{name}\" à accéder à votre compte ?",
	"authShareAccessAsk": "Voulez-vous vraiment autoriser cette application à accéder à votre compte?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "Cette application nécessite les autorisations suivantes :",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Changer de compte",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Veuillez retourner à l’application",
	"authDenied": "Accès refusé",
	"existingAccount": "Compte existant",
	"createAccount": "Créer un compte"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pleaseSelectAccount": "Pilih akun",
	"selectAccount": "Pilih akun",
	"addAccount": "Tambahkan akun",
	"authShareAccess": "Apakah kamu ingin mengijinkan \"{name}\" untuk mengakses akun ini?",
	"authShareAccessAsk": "Apakah kamu ingin mengijinkan aplikasi ini untuk mengakses akun kamu?",
	"authPermission": "{name} meminta ijin berikut",
	"authPermissionAsk": "Aplikasi ini membutuhkan beberapa ijin, yaitu:",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Ganti akun",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Mohon kembali ke aplikasi kamu",
	"authDenied": "Akses ditolak",
	"existingAccount": "Akun yang ada",
	"createAccount": "Buat akun"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pleaseSelectAccount": "Per favore, seleziona un profilo",
	"selectAccount": "Scegli profilo",
	"addAccount": "Aggiungi profilo",
	"authShareAccess": "Vuoi autorizzare {name} ad accedere al tuo profilo?",
	"authShareAccessAsk": "Vuoi autorizzare questa App ad accedere al tuo profilo?",
	"authPermission": "{name} richiede i permessi seguenti",
	"authPermissionAsk": "Questa app richiede le seguenti autorizzazioni:",
	"authScopeUser": "Sto funzionando per il seguente profilo",
	"switchAccount": "Cambia profilo",
	"authAccepted": "Accesso concesso",
	"authPleaseGoBack": "Si prega di ritornare sulla app",
	"authDenied": "Accesso negato",
	"existingAccount": "Profilo esistente",
	"createAccount": "Crea il tuo profilo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pleaseSelectAccount": "アカウントを選択してください",
	"selectAccount": "アカウントを選択",
	"addAccount": "アカウントを追加",
	"authShareAccess": "「{name}」がアカウントにアクセスすることを許可しますか？",
	"authShareAccessAsk": "アカウントへのアクセスを許可しますか？",
	"authPermission": "{name}は次の権限を要求しています",
	"authPermissionAsk": "このアプリは次の権限を要求しています",
	"authScopeUser": "以下のユーザーとして操作しています",
	"switchAccount": "アカウントを切り替え",
	"authAccepted": "アクセスを許可しました",
	"authPleaseGoBack": "アプリケーションに戻ってやっていってください",
	"authDenied": "アクセスを拒否しました",
	"existingAccount": "既存のアカウント",
	"createAccount": "アカウントを作成",
	"currentAccountRequired": "対象アカウントへ切り替え、通常のログインで個別セッションを作成してから承認してください。保存済みの別アカウントや旧トークンでは承認できません。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pleaseSelectAccount": "アカウント選んでや",
	"selectAccount": "アカウントを選んでなー",
	"addAccount": "アカウントを追加",
	"authShareAccess": "「{name}」がアカウントにアクセスすることを許可してええか？",
	"authShareAccessAsk": "アカウントのアクセスを許可してもええか？",
	"authPermission": "{name}に次の権限つけたってやって",
	"authPermissionAsk": "このアプリは次の権限を要求しとるで",
	"authScopeUser": "以下のユーザーとしていじってるで",
	"switchAccount": "アカウントを変えるで",
	"authAccepted": "アクセスを許可したで",
	"authPleaseGoBack": "アプリケーションに戻ってええよ",
	"authDenied": "アクセスを拒否ったで",
	"existingAccount": "前に作ったアカウント",
	"createAccount": "アカウントを作るで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Fren amiḍan",
	"addAccount": "Add account",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Select account",
	"addAccount": "Add account",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pleaseSelectAccount": "계정을 선택해주세요.",
	"selectAccount": "계정 선택",
	"addAccount": "계정 추가",
	"authShareAccess": "‘{name}’에서 계정에 접근하는 것을 허용하시겠습니까?",
	"authShareAccessAsk": "이 애플리케이션이 계정에 접근하는 것을 허용하시겠습니까?",
	"authPermission": "{name}에서 다음 권한을 요청하였습니다",
	"authPermissionAsk": "이 앱은 다음의 권한을 요청합니다",
	"authScopeUser": "다음 유저로 활동하고 있습니다.",
	"switchAccount": "계정 바꾸기",
	"authAccepted": "접근 권한이 부여되었습니다.",
	"authPleaseGoBack": "앱으로 돌아가서 시도해 주세요",
	"authDenied": "접근이 거부되었습니다",
	"existingAccount": "기존 계정",
	"createAccount": "계정 만들기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Gebruikersaccount selecteren",
	"addAccount": "Account toevoegen",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Account wisselen",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Bestaand gebruikersaccount",
	"createAccount": "Gebruikersaccount maken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Velg konto",
	"addAccount": "Legg til konto",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Opprett konto"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Wybierz konto",
	"addAccount": "Dodaj konto",
	"authShareAccess": "Czy chcesz autoryzować „{name}” do dostępu do tego konta?",
	"authShareAccessAsk": "Czy na pewno chcesz zezwolić tej aplikacji na dostęp do Twojego konta?",
	"authPermission": "{name} żąda następujących uprawnień",
	"authPermissionAsk": "Ta aplikacja wymaga następujących uprawnień:",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Przełącz konto",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Proszę, wróć do aplikacji",
	"authDenied": "Odmowa dostępu",
	"existingAccount": "Istniejące konto",
	"createAccount": "Utwórz konto"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pleaseSelectAccount": "Selecione uma conta",
	"selectAccount": "Selecionar conta",
	"addAccount": "Adicionar Conta",
	"authShareAccess": "Você gostaria de autorizar \"{name}\" para acessar essa conta?",
	"authShareAccessAsk": "Você tem certeza de que gostaria de conceder ao aplicativo o acesso à conta?",
	"authPermission": "{name} solicita as seguintes permissões",
	"authPermissionAsk": "O aplicativo solicita as seguintes permissões",
	"authScopeUser": "Operar como o usuário a seguir",
	"switchAccount": "Trocar conta",
	"authAccepted": "Acesso permitido",
	"authPleaseGoBack": "Por favor, volte ao aplicativo",
	"authDenied": "Acesso negado",
	"existingAccount": "Contas existentes",
	"createAccount": "Criar conta"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pleaseSelectAccount": "Выберите свой аккаунт",
	"selectAccount": "Выберите учётную запись",
	"addAccount": "Добавить учётную запись",
	"authShareAccess": "Дать доступ для «{name}» к вашей учётной записи?",
	"authShareAccessAsk": "Уверены, что хотите дать приложению доступ к своей учётной записи?",
	"authPermission": "{name} Запрашивает следующие разрешения:",
	"authPermissionAsk": "Приложение запрашивает следующие разрешения:",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Сменить учётную запись",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Вернитесь, пожалуйста, в приложение",
	"authDenied": "Доступ закрыт",
	"existingAccount": "Существующая учётная запись",
	"createAccount": "Новая учётная запись"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Vyberte účet",
	"addAccount": "Pridať účet",
	"authShareAccess": "Prajete si povoliť \"{name}\", aby mal prístup k tomuto účtu?",
	"authShareAccessAsk": "Naozaj chcete povoliť tejto aplikácii prístup k tomuto účtu?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "Táto aplikácia vyžaduje nasledujúce nastavenia",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Prepnút účet",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Prosím prejdite späť na aplikáciu",
	"authDenied": "Prístup zamietnutý",
	"existingAccount": "Existujúci účet",
	"createAccount": "Vytvoriť účet"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pleaseSelectAccount": "โปรดเลือกบัญชี",
	"selectAccount": "เลือกบัญชี",
	"addAccount": "เพิ่มบัญชี",
	"authShareAccess": "คุณต้องการอนุญาตให้ \"{name}\" เข้าถึงบัญชีนี้เลยมั้ย?",
	"authShareAccessAsk": "ต้องการอนุญาตให้แอปพลิเคชันนี้เข้าถึงบัญชีของคุณใช่ไหม?",
	"authPermission": "{name} ได้ขอสิทธิ์การเข้าถึงดังต่อไปนี้",
	"authPermissionAsk": "แอปพลิเคชันนี้ขอสิทธิ์ดังต่อไปนี้",
	"authScopeUser": "กำลังดำเนินการในฐานะผู้ใช้ต่อไปนี้",
	"switchAccount": "สลับบัญชีผู้ใช้",
	"authAccepted": "การเข้าถึงได้รับอนุญาต",
	"authPleaseGoBack": "กรุณากลับไปที่แอปพลิเคชัน",
	"authDenied": "ปฏิเสธการเข้าใช้",
	"existingAccount": "บัญชีที่มีอยู่แล้ว",
	"createAccount": "สร้างบัญชี"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pleaseSelectAccount": "Hesap seçin",
	"selectAccount": "Hesap seç",
	"addAccount": "Hesap ekle",
	"authShareAccess": "“{name}”nin bu hesaba erişmesine izin vermek ister misiniz?",
	"authShareAccessAsk": "Bu uygulamanın hesabınıza erişmesine izin vermek istediğinden emin misin?",
	"authPermission": "{name} aşağıdaki izinleri talep etmektedir.",
	"authPermissionAsk": "Bu uygulama aşağıdaki izinleri talep etmektedir",
	"authScopeUser": "Aşağıdaki kullanıcı olarak çalıştırın",
	"switchAccount": "Hesap değiştir",
	"authAccepted": "Erişim izni verildi",
	"authPleaseGoBack": "Lütfen uygulamaya geri dönün.",
	"authDenied": "Erişim reddedildi",
	"existingAccount": "Mevcut hesap",
	"createAccount": "Hesap oluştur"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pleaseSelectAccount": "Select an account",
	"selectAccount": "Select account",
	"addAccount": "Add account",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?",
	"authShareAccessAsk": "Are you sure you want to authorize this application to access your account?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Switch account",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "Access denied",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pleaseSelectAccount": "Виберіть акаунт",
	"selectAccount": "Виберіть акаунт",
	"addAccount": "Додати акаунт",
	"authShareAccess": "Ви хочете надати \"{name}\" доступ до цього акаунту?",
	"authShareAccessAsk": "Ви впевнені, що хочете надати цій програмі доступ до вашого акаунту?",
	"authPermission": "{name} requests the following permissions",
	"authPermissionAsk": "This application requests the following permissions",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Змінити акаунт",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Please go back to the application",
	"authDenied": "У доступі відмовлено",
	"existingAccount": "Існуючий акаунт",
	"createAccount": "Створити акаунт"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pleaseSelectAccount": "Chọn tài khoản của bạn",
	"selectAccount": "Chọn một tài khoản",
	"addAccount": "Thêm tài khoản",
	"authShareAccess": "Bạn có muốn cho phép \"{name}\" truy cập vào tài khoản này không?",
	"authShareAccessAsk": "Bạn có chắc muốn cho phép ứng dụng này truy cập vào tài khoản của mình không?",
	"authPermission": "{name} đang yêu cầu quyền hạn dưới đây",
	"authPermissionAsk": "Ứng dụng này yêu cầu các quyền sau",
	"authScopeUser": "Operate as the following user",
	"switchAccount": "Chuyển tài khoản",
	"authAccepted": "Access granted",
	"authPleaseGoBack": "Vui lòng quay lại ứng dụng",
	"authDenied": "Truy cập bị từ chối",
	"existingAccount": "Tài khoản hiện có",
	"createAccount": "Tạo tài khoản"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pleaseSelectAccount": "请选择帐户",
	"selectAccount": "选择账户",
	"addAccount": "添加账户",
	"authShareAccess": "您要授权允许 “{name}” 访问您的帐户吗？",
	"authShareAccessAsk": "您确定要授权此应用程序访问您的帐户吗？",
	"authPermission": "{name} 需要以下权限",
	"authPermissionAsk": "这个应用程序需要以下权限",
	"authScopeUser": "以下面的用户进行操作",
	"switchAccount": "切换账户",
	"authAccepted": "已允许访问",
	"authPleaseGoBack": "请返回到应用程序",
	"authDenied": "拒绝访问",
	"existingAccount": "现有的账户",
	"createAccount": "注册账户"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pleaseSelectAccount": "請選擇帳戶",
	"selectAccount": "選擇帳戶",
	"addAccount": "新增帳戶",
	"authShareAccess": "要授權「“{name}”」存取您的帳戶嗎？",
	"authShareAccessAsk": "您確定要授權這個應用程式存取您的帳戶嗎？",
	"authPermission": "{name}要求以下的權限",
	"authPermissionAsk": "此應用程式需要以下權限",
	"authScopeUser": "以下列使用者身分操作",
	"switchAccount": "切換帳戶",
	"authAccepted": "已授予存取權限",
	"authPleaseGoBack": "請返回至應用程式",
	"authDenied": "拒絕訪問",
	"existingAccount": "現有帳戶",
	"createAccount": "建立帳戶"
}
</locale>
