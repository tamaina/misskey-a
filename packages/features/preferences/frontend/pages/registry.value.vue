<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px;">
		<div class="_gaps_m">
			<FormInfo warn>{{ $locale.sfc.editTheseSettingsMayBreakAccount }}</FormInfo>

			<template v-if="value">
				<FormSplit>
					<MkKeyValue>
						<template #key>{{ $locale.sfc.domain }}</template>
						<template #value>{{ props.domain === '@' ? $locale.sfc.system : props.domain.toUpperCase() }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ $locale.sfc.scope }}</template>
						<template #value>{{ scope.join('/') }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ $locale.sfc.key }}</template>
						<template #value>{{ key }}</template>
					</MkKeyValue>
				</FormSplit>

				<MkCodeEditor v-model="valueForEditor" lang="json5">
					<template #label>{{ $locale.sfc.value }} (JSON)</template>
				</MkCodeEditor>

				<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>

				<MkKeyValue>
					<template #key>{{ $locale.sfc.updatedAt }}</template>
					<template #value><MkTime :time="value.updatedAt" mode="detail"/></template>
				</MkKeyValue>

				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import JSON5 from 'json5';
import * as v from 'valibot';
import { packedJsonValueSchema } from '../../../users/backend/json-value.schema.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';

const props = defineProps<{
	path: string;
	domain: string;
}>();

const scope = computed(() => props.path.split('/').slice(0, -1));
const key = computed(() => props.path.split('/').at(-1)!);

const value = ref<any>(null);
const valueForEditor = ref<string>('');

function fetchValue() {
	misskeyApi('i/registry/get-detail', {
		scope: scope.value,
		key: key.value,
		domain: props.domain === '@' ? null : props.domain,
	}).then(res => {
		value.value = res;
		valueForEditor.value = JSON5.stringify(res.value, null, '\t');
	});
}

async function save() {
	try {
		v.parse(packedJsonValueSchema, JSON5.parse(valueForEditor.value));
	} catch (err) {
		os.alert({
			type: 'error',
			text: $locale.value.sfc.invalidValue,
		});
		return;
	}
	os.confirm({
		type: 'warning',
		text: $locale.value.sfc.saveConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/set', {
			scope: scope.value,
			key: key.value,
			value: v.parse(packedJsonValueSchema, JSON5.parse(valueForEditor.value)),
			domain: props.domain === '@' ? null : props.domain,
		});
	});
}

function del() {
	os.confirm({
		type: 'warning',
		text: $locale.value.sfc.deleteConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/remove', {
			scope: scope.value,
			key: key.value,
			domain: props.domain === '@' ? null : props.domain,
		});
	});
}

watch(() => props.path, fetchValue, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.registry,
	icon: 'ti ti-adjustments',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"invalidValue": "قيمة غير صالحة.",
	"saveConfirm": "أتريد خفظ التغييرات؟",
	"deleteConfirm": "أمتأكد من الحذف؟",
	"registry": "السجل",
	"editTheseSettingsMayBreakAccount": "تعديل هذه الإعدادات قد يسبب عطبًا لحسابك",
	"domain": "النّطاق",
	"system": "النظام",
	"scope": "الحيّز",
	"key": "مفتاح",
	"value": "القيمة",
	"save": "حفظ",
	"updatedAt": "حُدّث في",
	"delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"invalidValue": "Valor invàlid.",
	"saveConfirm": "Desar canvis?",
	"deleteConfirm": "Segur que vols esborrar?",
	"registry": "Registre ",
	"editTheseSettingsMayBreakAccount": "Editar aquestes opcions pot deixar inoperatiu el teu compte",
	"domain": "Domini",
	"system": "Sistema",
	"scope": "Àmbit ",
	"key": "Clau",
	"value": "Valor",
	"save": "Desa",
	"updatedAt": "Actualitzat el",
	"delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"invalidValue": "Neplatná hodnota.",
	"saveConfirm": "Uložit změny?",
	"deleteConfirm": "Opravdu smazat?",
	"registry": "Registr",
	"editTheseSettingsMayBreakAccount": "Uprávou těchto nastavení si můžete poškodit účet.",
	"domain": "Doména",
	"system": "Systém",
	"scope": "Rozsah",
	"key": "Klíč",
	"value": "Hodnota",
	"save": "Uložit",
	"updatedAt": "Upraveno",
	"delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"invalidValue": "Invalid value.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Really delete?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Key",
	"value": "Value",
	"save": "Save",
	"updatedAt": "Updated at",
	"delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"invalidValue": "Dieser Wert ist ungültig.",
	"saveConfirm": "Änderungen speichern?",
	"deleteConfirm": "Wirklich löschen?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Bei Bearbeitung dieser Einstellungen besteht die Gefahr, dein Benutzerkonto zu beschädigen.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Schlüssel",
	"value": "Wert",
	"save": "Speichern",
	"updatedAt": "Zuletzt geändert am",
	"delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"invalidValue": "Invalid value.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Really delete?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Key",
	"value": "Value",
	"save": "Save",
	"updatedAt": "Updated at",
	"delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"invalidValue": "Este no es un valor válido.",
	"saveConfirm": "¿Guardar cambios?",
	"deleteConfirm": "¿Desea eliminarlo?",
	"registry": "Registro",
	"editTheseSettingsMayBreakAccount": "Editar estas configuraciones puede dañar su cuenta.",
	"domain": "Dominio",
	"system": "Sistema",
	"scope": "Alcance",
	"key": "Clave",
	"value": "Valores",
	"save": "Guardar",
	"updatedAt": "Actualizado",
	"delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"invalidValue": "Cette valeur est invalide.",
	"saveConfirm": "Voulez-vous sauvegarder les modifications?",
	"deleteConfirm": "Confirmez-vous la suppression?",
	"registry": "Registre",
	"editTheseSettingsMayBreakAccount": "La modification de ces paramètres peut endommager votre compte.",
	"domain": "Domaine",
	"system": "Système",
	"scope": "Portée",
	"key": "Clé ",
	"value": "Valeur",
	"save": "Enregistrer",
	"updatedAt": "Mis à jour le",
	"delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"invalidValue": "Nilai tidak valid.",
	"saveConfirm": "Simpan perubahan?",
	"deleteConfirm": "Yakin hapus?",
	"registry": "Registri",
	"editTheseSettingsMayBreakAccount": "Menyunting pengaturan ini memiliki kemungkinan untuk merusak akun kamu.",
	"domain": "Domain",
	"system": "Sistem",
	"scope": "Lingkup",
	"key": "Kunci",
	"value": "Nilai",
	"save": "Simpan",
	"updatedAt": "Diperbarui pada",
	"delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"invalidValue": "Questo non è un valore valido.",
	"saveConfirm": "Vuoi salvare le modifiche?",
	"deleteConfirm": "Rimuovere?",
	"registry": "Registro",
	"editTheseSettingsMayBreakAccount": "Modificare queste impostazioni può danneggiare il profilo",
	"domain": "Dominio",
	"system": "Sistema",
	"scope": "Ambito di applicazione.",
	"key": "Dati",
	"value": "Valore",
	"save": "Salva",
	"updatedAt": "Aggiornato il",
	"delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"invalidValue": "有効な値ではありません。",
	"saveConfirm": "保存しますか？",
	"deleteConfirm": "削除しますか？",
	"registry": "レジストリ",
	"editTheseSettingsMayBreakAccount": "これらの設定を編集するとアカウントが破損する可能性があります。",
	"domain": "ドメイン",
	"system": "システム",
	"scope": "スコープ",
	"key": "キー",
	"value": "値",
	"save": "保存",
	"updatedAt": "更新日時",
	"delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"invalidValue": "有効な値じゃないみたいやで。",
	"saveConfirm": "保存するで？",
	"deleteConfirm": "ホンマにほかすで？",
	"registry": "レジストリ",
	"editTheseSettingsMayBreakAccount": "このへんの設定をようわからんままイジるとアカウントが壊れて使えんくなるかも知れへんで？",
	"domain": "ドメイン",
	"system": "システム",
	"scope": "スコープ",
	"key": "キー",
	"value": "値",
	"save": "とっとく",
	"updatedAt": "更新日時",
	"delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"invalidValue": "Invalid value.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Really delete?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Key",
	"value": "Value",
	"save": "Sekles",
	"updatedAt": "Updated at",
	"delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"invalidValue": "Invalid value.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Really delete?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Key",
	"value": "Value",
	"save": "ಉಳಿಸಿ",
	"updatedAt": "Updated at",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"invalidValue": "올바른 값이 아닙니다.",
	"saveConfirm": "저장하시겠습니까?",
	"deleteConfirm": "삭제하시겠습니까?",
	"registry": "레지스트리",
	"editTheseSettingsMayBreakAccount": "이 설정을 변경하면 계정이 손상될 수 있습니다.",
	"domain": "도메인",
	"system": "시스템",
	"scope": "범위",
	"key": "키",
	"value": "값",
	"save": "저장",
	"updatedAt": "수정한 날짜",
	"delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"invalidValue": "Ongeldige waarde.",
	"saveConfirm": "Wijzigingen opslaan?",
	"deleteConfirm": "Echt verwijderen?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Het wijzigen van deze instellingen kan je account beschadigen.",
	"domain": "Domain",
	"system": "Systeem",
	"scope": "Scope",
	"key": "Key",
	"value": "Waarde",
	"save": "Opslaan",
	"updatedAt": "Laatst gewijzigd at",
	"delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"invalidValue": "Verdien er ugyldig.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Vil du slette?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Nøkkel",
	"value": "Verdi",
	"save": "Lagre",
	"updatedAt": "Updated at",
	"delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"invalidValue": "Nieprawidłowa wartość.",
	"saveConfirm": "Zapisać zmiany?",
	"deleteConfirm": "Na pewno usunąć?",
	"registry": "Rejestr",
	"editTheseSettingsMayBreakAccount": "Edycja tych ustawień może uszkodzić Twoje konto.",
	"domain": "Domena",
	"system": "System",
	"scope": "Zakres",
	"key": "Klucz",
	"value": "Wartość",
	"save": "Zapisz",
	"updatedAt": "Zaktualizowano",
	"delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"invalidValue": "Valor inválido",
	"saveConfirm": "Deseja salvá-lo?",
	"deleteConfirm": "Confirma a exclusão?",
	"registry": "Registo",
	"editTheseSettingsMayBreakAccount": "Editar essas configurações pode resultar em danos à conta.\"",
	"domain": "Domínio",
	"system": "Sistema",
	"scope": "Escopo",
	"key": "Chave",
	"value": "Valor",
	"save": "Salvar",
	"updatedAt": "Última atualização",
	"delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"invalidValue": "Недопустимое значение.",
	"saveConfirm": "Сохранить изменения?",
	"deleteConfirm": "Удалить?",
	"registry": "Реестр",
	"editTheseSettingsMayBreakAccount": "От изменений в этих настройках ваша учётная запись может поломаться.",
	"domain": "Домен",
	"system": "Система",
	"scope": "Область",
	"key": "Ключ",
	"value": "Значения",
	"save": "Сохранить",
	"updatedAt": "Обновлено",
	"delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"invalidValue": "Nesprávna hodnota.",
	"saveConfirm": "Uložiť zmeny?",
	"deleteConfirm": "Naozaj odstrániť?",
	"registry": "Register",
	"editTheseSettingsMayBreakAccount": "Úpravou týchto nastavení si môžete pokaziť účet.",
	"domain": "Doména",
	"system": "Systém",
	"scope": "Oblasť",
	"key": "Kľúč",
	"value": "Hodnoty",
	"save": "Uložiť",
	"updatedAt": "Upravené",
	"delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"invalidValue": "ค่านี้ไม่ถูกต้อง",
	"saveConfirm": "บันทึกเปลี่ยนแปลงมั้ย?",
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"registry": "ทะเบียน",
	"editTheseSettingsMayBreakAccount": "การแก้ไขการตั้งค่าเหล่านี้อาจทำให้บัญชีของคุณเสียหายนะ",
	"domain": "โดเมน",
	"system": "ระบบ",
	"scope": "สโคป",
	"key": "คีย์",
	"value": "ค่า",
	"save": "บันทึก",
	"updatedAt": "อัปเดตล่าสุด",
	"delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"invalidValue": "Geçersiz değer.",
	"saveConfirm": "Değişiklikleri kaydetmek ister misin?",
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"registry": "Kayıt Defteri",
	"editTheseSettingsMayBreakAccount": "Bu ayarları düzenlemek hesabınıza zarar verebilir.",
	"domain": "Alan adı",
	"system": "Sistem",
	"scope": "Kapsam",
	"key": "Anahtar",
	"value": "Değer",
	"save": "Kaydet",
	"updatedAt": "Güncellendi",
	"delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"invalidValue": "Invalid value.",
	"saveConfirm": "Save changes?",
	"deleteConfirm": "Really delete?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Editing these settings may damage your account.",
	"domain": "Domain",
	"system": "System",
	"scope": "Scope",
	"key": "Key",
	"value": "Value",
	"save": "Save",
	"updatedAt": "Updated at",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"invalidValue": "Некоректне значення.",
	"saveConfirm": "Зберегти зміни?",
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"registry": "Реєстр",
	"editTheseSettingsMayBreakAccount": "Зміна цих параметрів може призвести до пошкодження вашого акаунта.",
	"domain": "Домен",
	"system": "Система",
	"scope": "Область дії",
	"key": "Ключ",
	"value": "Значення",
	"save": "Зберегти",
	"updatedAt": "Останнє оновлення",
	"delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"invalidValue": "Giá trị không hợp lệ.",
	"saveConfirm": "Lưu thay đổi?",
	"deleteConfirm": "Bạn có muốn xóa không?",
	"registry": "Registry",
	"editTheseSettingsMayBreakAccount": "Việc chỉnh sửa các cài đặt này có thể làm hỏng tài khoản của bạn.",
	"domain": "Tên miền",
	"system": "Hệ thống",
	"scope": "Phạm vi",
	"key": "Mã",
	"value": "Giá trị",
	"save": "Lưu",
	"updatedAt": "Cập nhật lúc",
	"delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"invalidValue": "无效值。",
	"saveConfirm": "确定保存？",
	"deleteConfirm": "确定删除?",
	"registry": "注册表",
	"editTheseSettingsMayBreakAccount": "编辑这些设置可以会损坏您的账号",
	"domain": "域",
	"system": "系统",
	"scope": "范围",
	"key": "键",
	"value": "值",
	"save": "保存",
	"updatedAt": "更新日期",
	"delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"invalidValue": "輸入值無效。",
	"saveConfirm": "您要儲存變更嗎？",
	"deleteConfirm": "你確定要刪除嗎？",
	"registry": "登錄表",
	"editTheseSettingsMayBreakAccount": "修改這些設定可能會毀損您的帳戶",
	"domain": "域",
	"system": "系統",
	"scope": "範圍",
	"key": "機碼",
	"value": "數值",
	"save": "儲存",
	"updatedAt": "最後更新",
	"delete": "刪除"
}
</locale>
