<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/accounts" :label="$locale.sfc.accounts" :keywords="['accounts']" icon="ti ti-users">
	<div class="_gaps">
		<div class="_buttons">
			<MkButton primary @click="addAccount"><i class="ti ti-plus"></i> {{ $locale.sfc.addAccount }}</MkButton>
			<!--<MkButton @click="refreshAllAccounts"><i class="ti ti-refresh"></i></MkButton>-->
		</div>

		<template v-for="x in accounts" :key="x.host + x.id">
			<MkUserCardMini v-if="x.user" :user="x.user" :class="$style.user" @click.prevent="showMenu(x.host, x.id, $event)"/>
		</template>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { $i } from '@features/auth/frontend/i.js';
import { switchAccount, removeAccount, login, getAccountWithSigninDialog, getAccountWithSignupDialog, getAccounts } from '@features/auth/frontend/accounts.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

const accounts = await getAccounts();

function refreshAllAccounts() {
	// TODO
}

function showMenu(host: string, id: string, ev: PointerEvent) {
	let menu: MenuItem[];

	menu = [{
		text: $locale.value.sfc.switch,
		icon: 'ti ti-switch-horizontal',
		action: () => switchAccount(host, id),
	}, {
		text: $locale.value.sfc.remove,
		icon: 'ti ti-trash',
		action: () => removeAccount(host, id),
	}];

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function addAccount(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.existingAccount,
		action: () => { addExistingAccount(); },
	}, {
		text: $locale.value.sfc.createAccount,
		action: () => { createAccount(); },
	}], ev.currentTarget ?? ev.target);
}

function addExistingAccount() {
	getAccountWithSigninDialog().then((res) => {
		if (res != null) {
			os.success();
		}
	});
}

function createAccount() {
	getAccountWithSignupDialog().then((res) => {
		if (res != null) {
			login(res.token);
		}
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.accounts,
	icon: 'ti ti-users',
}));
</script>

<style lang="scss" module>
.user {
	cursor: pointer;
}

.unknownUser {
	display: flex;
	align-items: center;
	text-align: start;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	font-size: 0.9em;
}

.unknownUserAvatarMock {
	display: block;
	width: 34px;
	height: 34px;
	line-height: 34px;
	text-align: center;
	font-size: 16px;
	margin-right: 12px;
	background-color: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	color: color-mix(in srgb, var(--MI_THEME-fg), transparent 25%);
	border-radius: 50%;
}

.unknownUserTitle {
	display: block;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 18px;
}

.unknownUserSub {
	display: block;
	width: 100%;
	font-size: 95%;
	opacity: 0.7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"accounts": "الحسابات",
	"addAccount": "أضف حساباً",
	"switch": "بدّل",
	"remove": "حذف",
	"existingAccount": "الحسابات الموجودة",
	"createAccount": "أنشئ حسابًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"accounts": "Comptes",
	"addAccount": "Afegeix un compte",
	"switch": "Canvia",
	"remove": "Eliminar",
	"existingAccount": "Compte existent",
	"createAccount": "Crea un compte"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"accounts": "Účty",
	"addAccount": "Přidat účet",
	"switch": "Přepnout",
	"remove": "Smazat",
	"existingAccount": "Existující účet",
	"createAccount": "Vytvořit účet"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"accounts": "Accounts",
	"addAccount": "Add account",
	"switch": "Switch",
	"remove": "Delete",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"accounts": "Benutzerkonten",
	"addAccount": "Benutzerkonto hinzufügen",
	"switch": "Wechseln",
	"remove": "Löschen",
	"existingAccount": "Bestehendes Benutzerkonto",
	"createAccount": "Benutzerkonto erstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"accounts": "Accounts",
	"addAccount": "Add account",
	"switch": "Switch",
	"remove": "Delete",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"accounts": "Cuentas",
	"addAccount": "Agregar cuenta",
	"switch": "Cambiar",
	"remove": "Borrar",
	"existingAccount": "Cuenta existente",
	"createAccount": "Crear cuenta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"accounts": "Comptes",
	"addAccount": "Ajouter un compte",
	"switch": "Remplacer",
	"remove": "Supprimer",
	"existingAccount": "Compte existant",
	"createAccount": "Créer un compte"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"accounts": "Akun",
	"addAccount": "Tambahkan akun",
	"switch": "Beralih",
	"remove": "Hapus",
	"existingAccount": "Akun yang ada",
	"createAccount": "Buat akun"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"accounts": "Profilo",
	"addAccount": "Aggiungi profilo",
	"switch": "Cambia",
	"remove": "Elimina",
	"existingAccount": "Profilo esistente",
	"createAccount": "Crea il tuo profilo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"accounts": "アカウント",
	"addAccount": "アカウントを追加",
	"switch": "切り替え",
	"remove": "削除",
	"existingAccount": "既存のアカウント",
	"createAccount": "アカウントを作成"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"accounts": "アカウント",
	"addAccount": "アカウントを追加",
	"switch": "切り替え",
	"remove": "ほかす",
	"existingAccount": "前に作ったアカウント",
	"createAccount": "アカウントを作るで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"accounts": "Imiḍan",
	"addAccount": "Add account",
	"switch": "Switch",
	"remove": "Kkes",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"accounts": "Accounts",
	"addAccount": "Add account",
	"switch": "Switch",
	"remove": "ಅಳಿಸು",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"accounts": "계정",
	"addAccount": "계정 추가",
	"switch": "전환",
	"remove": "삭제",
	"existingAccount": "기존 계정",
	"createAccount": "계정 만들기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"accounts": "Gebruikersaccounts",
	"addAccount": "Account toevoegen",
	"switch": "Wissel",
	"remove": "Verwijderen",
	"existingAccount": "Bestaand gebruikersaccount",
	"createAccount": "Gebruikersaccount maken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"accounts": "Kontoer",
	"addAccount": "Legg til konto",
	"switch": "Bytt",
	"remove": "Slett",
	"existingAccount": "Existing account",
	"createAccount": "Opprett konto"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"accounts": "Konta",
	"addAccount": "Dodaj konto",
	"switch": "Przełącz",
	"remove": "Usuń",
	"existingAccount": "Istniejące konto",
	"createAccount": "Utwórz konto"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"accounts": "Contas",
	"addAccount": "Adicionar Conta",
	"switch": "Trocar",
	"remove": "Remover",
	"existingAccount": "Contas existentes",
	"createAccount": "Criar conta"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"accounts": "Учётные записи",
	"addAccount": "Добавить учётную запись",
	"switch": "Переключение",
	"remove": "Удалить",
	"existingAccount": "Существующая учётная запись",
	"createAccount": "Новая учётная запись"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"accounts": "Účty",
	"addAccount": "Pridať účet",
	"switch": "Prepnúť",
	"remove": "Odstrániť",
	"existingAccount": "Existujúci účet",
	"createAccount": "Vytvoriť účet"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"accounts": "บัญชีผู้ใช้",
	"addAccount": "เพิ่มบัญชี",
	"switch": "สลับ",
	"remove": "ลบ",
	"existingAccount": "บัญชีที่มีอยู่แล้ว",
	"createAccount": "สร้างบัญชี"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"accounts": "Hesaplar",
	"addAccount": "Hesap ekle",
	"switch": "Anahtar",
	"remove": "Sil",
	"existingAccount": "Mevcut hesap",
	"createAccount": "Hesap oluştur"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"accounts": "Accounts",
	"addAccount": "Add account",
	"switch": "Switch",
	"remove": "ئۆچۈرۈش",
	"existingAccount": "Existing account",
	"createAccount": "Create account"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"accounts": "Акаунти",
	"addAccount": "Додати акаунт",
	"switch": "Перемкнути",
	"remove": "Видалити",
	"existingAccount": "Існуючий акаунт",
	"createAccount": "Створити акаунт"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"accounts": "Tài khoản của bạn",
	"addAccount": "Thêm tài khoản",
	"switch": "Chuyển đổi",
	"remove": "Xóa",
	"existingAccount": "Tài khoản hiện có",
	"createAccount": "Tạo tài khoản"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"accounts": "账户",
	"addAccount": "添加账户",
	"switch": "切换",
	"remove": "删除",
	"existingAccount": "现有的账户",
	"createAccount": "注册账户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"accounts": "帳戶",
	"addAccount": "新增帳戶",
	"switch": "切換",
	"remove": "刪除",
	"existingAccount": "現有帳戶",
	"createAccount": "建立帳戶"
}
</locale>
