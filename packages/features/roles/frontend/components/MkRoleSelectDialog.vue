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
				<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ globalLocale.env.add }}</MkButton>
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
				<MkButton primary @click="onOkClicked">{{ globalLocale.env.ok }}</MkButton>
				<MkButton @click="onCancelClicked">{{ globalLocale.env.cancel }}</MkButton>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkLoading from '@features/ui/frontend/components/global/MkLoading.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
  "notSelected": "Not selected"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "notSelected": "No seleccionat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "notSelected": "Nicht ausgewählt"
}
</locale>

<locale locale="en-US" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "notSelected": "No seleccionado"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "notSelected": "Niente selezioato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "notSelected": "選択されていません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "notSelected": "選択されとらんで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "notSelected": "선택하지 않았습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "notSelected": "Não selecionado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "notSelected": "ยังไม่มีการเลือก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "notSelected": "Seçilmedi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "notSelected": "Not selected"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "notSelected": "未选中"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "notSelected": "未選擇"
}
</locale>
