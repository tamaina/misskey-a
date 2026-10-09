<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="windowEl"
	:withOkButton="false"
	:okButtonDisabled="false"
	:width="400"
	:height="500"
	@close="onCloseModalWindow"
	@closed="emit('closed')"
>
	<template #header>{{ title }}</template>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<MkLoading v-if="fetching"/>
		<div v-else class="_gaps" :class="$style.root">
			<div :class="$style.header">
				<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
			</div>

			<div v-if="selectedRoles.length > 0" class="_gaps" :class="$style.roleItemArea">
				<div v-for="role in selectedRoles" :key="role.id" :class="$style.roleItem">
					<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
					<button class="_button" :class="$style.roleUnAssign" @click="removeRole(role.id)"><i class="ti ti-x"></i></button>
				</div>
			</div>
			<div v-else :class="$style.roleItemArea" style="text-align: center">
				{{ $locale.sfc.notSelected }}
			</div>

			<MkInfo v-if="infoMessage">{{ infoMessage }}</MkInfo>

			<div :class="$style.buttons">
				<MkButton primary @click="onOkClicked">{{ $locale.sfc.ok }}</MkButton>
				<MkButton @click="onCancelClicked">{{ $locale.sfc.cancel }}</MkButton>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkLoading from '@features/ui/frontend/components/global/MkLoading.vue';

const emit = defineEmits<{
	(ev: 'done', value: Misskey.entities.Role[]): void;
	(ev: 'close'): void;
	(ev: 'closed'): void;
}>();

const props = withDefaults(defineProps<{
	initialRoleIds?: string[],
	infoMessage?: string,
	title?: string,
	publicOnly: boolean,
}>(), {
	initialRoleIds: undefined,
	infoMessage: undefined,
	title: undefined,
	publicOnly: true,
});

const { initialRoleIds, infoMessage, title, publicOnly } = toRefs(props);

const windowEl = useTemplateRef('windowEl');
const roles = ref<Misskey.entities.Role[]>([]);
const selectedRoleIds = ref<string[]>(initialRoleIds.value ?? []);
const fetching = ref(false);

const selectedRoles = computed(() => {
	const r = roles.value.filter(role => selectedRoleIds.value.includes(role.id));
	r.sort((a, b) => {
		if (a.displayOrder !== b.displayOrder) {
			return b.displayOrder - a.displayOrder;
		}

		return a.id.localeCompare(b.id);
	});
	return r;
});

async function fetchRoles() {
	fetching.value = true;
	const result = await misskeyApi('admin/roles/list', {});
	roles.value = result.filter(it => publicOnly.value ? it.isPublic : true);
	fetching.value = false;
}

async function addRole() {
	const items = roles.value
		.filter(r => r.isPublic)
		.filter(r => !selectedRoleIds.value.includes(r.id))
		.map(r => ({ label: r.name, value: r.id }));

	const { canceled, result: roleId } = await os.select({ items });
	if (canceled || roleId == null) return;

	selectedRoleIds.value.push(roleId);
}

async function removeRole(roleId: string) {
	selectedRoleIds.value = selectedRoleIds.value.filter(x => x !== roleId);
}

function onOkClicked() {
	emit('done', selectedRoles.value);
	windowEl.value?.close();
}

function onCancelClicked() {
	emit('close');
	windowEl.value?.close();
}

function onCloseModalWindow() {
	emit('close');
	windowEl.value?.close();
}

fetchRoles();
</script>

<style module lang="scss">
.root {
	max-height: 410px;
	height: 410px;
	display: flex;
	flex-direction: column;
}

.roleItemArea {
	background-color: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-radius: var(--MI-radius);
	padding: 12px;
	overflow-y: auto;
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnAssign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}

.header {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.title {
	flex: 1;
}

.addRoleButton {
	min-width: 32px;
	min-height: 32px;
	max-width: 32px;
	max-height: 32px;
	margin-left: 8px;
	align-self: center;
	padding: 0;
}

.buttons {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	margin-top: auto;
}

.divider {
	border-top: solid 0.5px var(--MI_THEME-divider);
}

</style>

<locale locale="ar-SA" lang="json">
{
  "add": "إضافة",
  "notSelected": "Not selected",
  "ok": " حسناً",
  "cancel": " إلغاء"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "add": "Afegir",
  "notSelected": "No seleccionat",
  "ok": "OK",
  "cancel": "Cancel·lar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "add": "Přidat",
  "notSelected": "Not selected",
  "ok": "Potvrdit",
  "cancel": "Zrušit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "add": "Add",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Cancel"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "add": "Hinzufügen",
  "notSelected": "Nicht ausgewählt",
  "ok": "OK",
  "cancel": "Abbrechen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "add": "Add",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Cancel"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "add": "Agregar",
  "notSelected": "No seleccionado",
  "ok": "OK",
  "cancel": "Cancelar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "add": "Ajouter",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Annuler"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "add": "Tambahkan",
  "notSelected": "Not selected",
  "ok": "Oke",
  "cancel": "Batalkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "add": "Aggiungi",
  "notSelected": "Niente selezioato",
  "ok": "OK",
  "cancel": "Annulla"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "add": "追加",
  "notSelected": "選択されていません",
  "ok": "OK",
  "cancel": "キャンセル"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "add": "増やす",
  "notSelected": "選択されとらんで",
  "ok": "ええで",
  "cancel": "やめる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "add": "Add",
  "notSelected": "Not selected",
  "ok": "IH",
  "cancel": "Cancel"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "add": "Add",
  "notSelected": "Not selected",
  "ok": "ಸರಿ",
  "cancel": "ರದ್ದು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "add": "추가",
  "notSelected": "선택하지 않았습니다.",
  "ok": "확인",
  "cancel": "취소"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "add": "Toevoegen",
  "notSelected": "Not selected",
  "ok": "Ok",
  "cancel": "Annuleren"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "add": "Legg til",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Avbryt"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "add": "Dodaj",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Anuluj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "add": "Adicionar",
  "notSelected": "Não selecionado",
  "ok": "OK",
  "cancel": "Cancelar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "add": "Добавить",
  "notSelected": "Not selected",
  "ok": "Подтвердить",
  "cancel": "Отмена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "add": "Pridať",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Zrušiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "add": "เพิ่ม",
  "notSelected": "ยังไม่มีการเลือก",
  "ok": "ตกลง",
  "cancel": "ยกเลิก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "add": "Ekle",
  "notSelected": "Seçilmedi",
  "ok": "Tamam",
  "cancel": "Vazgeç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "add": "Add",
  "notSelected": "Not selected",
  "ok": "ماقۇل",
  "cancel": "Cancel"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "add": "Додати",
  "notSelected": "Not selected",
  "ok": "OK",
  "cancel": "Скасувати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "add": "Thêm",
  "notSelected": "Not selected",
  "ok": "Đồng ý",
  "cancel": "Hủy"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "add": "添加",
  "notSelected": "未选中",
  "ok": "OK",
  "cancel": "取消"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "add": "新增",
  "notSelected": "未選擇",
  "ok": "OK",
  "cancel": "取消"
}
</locale>
