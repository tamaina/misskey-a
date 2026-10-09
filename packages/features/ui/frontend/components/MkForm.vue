<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="Object.values(form).filter(item => typeof item.hidden !== 'boolean' || item.hidden === true).length > 0" class="_gaps_m">
	<template v-for="v, k in form">
		<template v-if="typeof v.hidden == 'function' ? v.hidden(values) : v.hidden"></template>
		<MkInput v-else-if="v.type === 'number'" v-model="values[k]" type="number" :step="v.step || 1" :manualSave="v.manualSave" @savingStateChange="(changed, invalid) => onSavingStateChange(k, changed, invalid)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkInput>
		<MkInput v-else-if="v.type === 'string' && !v.multiline" v-model="values[k]" type="text" :mfmAutocomplete="v.treatAsMfm" :manualSave="v.manualSave" @savingStateChange="(changed, invalid) => onSavingStateChange(k, changed, invalid)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkInput>
		<MkTextarea v-else-if="v.type === 'string' && v.multiline" v-model="values[k]" :mfmAutocomplete="v.treatAsMfm" :mfmPreview="v.treatAsMfm" :manualSave="v.manualSave" @savingStateChange="(changed, invalid) => onSavingStateChange(k, changed, invalid)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkTextarea>
		<MkSwitch v-else-if="v.type === 'boolean'" v-model="values[k]">
			<span v-text="v.label || k"></span>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkSwitch>
		<MkSelect v-else-if="v.type === 'enum'" v-model="values[k]" :items="getMkSelectDef(v)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
		</MkSelect>
		<MkRadios v-else-if="v.type === 'radio'" v-model="values[k]" :options="getRadioOptionsDef(v)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
		</MkRadios>
		<MkRange v-else-if="v.type === 'range'" v-model="values[k]" :min="v.min" :max="v.max" :step="v.step" :textConverter="v.textConverter">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ $locale.sfc.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkRange>
		<MkButton v-else-if="v.type === 'button'" @click="v.action($event, values)">
			<span v-text="v.content || k"></span>
		</MkButton>
		<XFile
			v-else-if="v.type === 'drive-file'"
			:fileId="v.defaultFileId"
			:validate="async f => !v.validate || await v.validate(f)"
			@update="f => values[k] = f"
		/>
	</template>
</div>
<MkResult v-else type="empty" :text="$locale.sfc.nothingToConfigure"/>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import XFile from '@features/ui/frontend/components/MkForm.file.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios.vue';
import type { Form, EnumFormItem, RadioFormItem } from '@features/ui/frontend/utility/form.js';

const props = defineProps<{
	form: Form;
}>();

const emit = defineEmits<{
	(ev: 'canSaveStateChange', canSave: boolean): void;
}>();

// TODO: ジェネリックにしたい
const values = defineModel<Record<string, any>>({ required: true });

// 保存可能状態の管理
const inputSavingStates = ref<Record<string, { changed: boolean; invalid: boolean }>>({});

function onSavingStateChange(key: string, changed: boolean, invalid: boolean) {
	inputSavingStates.value[key] = { changed, invalid };
}

const canSave = computed(() => {
	for (const key in inputSavingStates.value) {
		const state = inputSavingStates.value[key];
		if (
			('manualSave' in props.form[key] && props.form[key].manualSave && state.changed) ||
			state.invalid
	 	) {
			return false;
		}
		if ('required' in props.form[key] && props.form[key].required) {
			const val = values.value[key];
			if (val === null || val === undefined || val === '') {
				return false;
			}
		}
	}
	return true;
});

watch(canSave, (newCanSave) => {
	emit('canSaveStateChange', newCanSave);
}, { immediate: true });

function getMkSelectDef(def: EnumFormItem): MkSelectItem[] {
	return def.enum.map((v) => {
		if (typeof v === 'string') {
			return { value: v, label: v };
		} else {
			return { value: v.value, label: v.label };
		}
	});
}

function getRadioOptionsDef(def: RadioFormItem): MkRadiosOption[] {
	return def.options.map<MkRadiosOption>((v) => {
		if (typeof v === 'string') {
			return { value: v, label: v };
		} else {
			return { value: v.value, label: v.label };
		}
	});
}
</script>

<locale locale="ar-SA" lang="json">
{
  "optional": "اختياري",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "optional": "Opcional",
  "nothingToConfigure": "No hi ha res a configurar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "optional": "Volitelné",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "Es sind keine Einstellungen verfügbar"
}
</locale>

<locale locale="en-US" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "optional": "Opcional",
  "nothingToConfigure": "No hay nada que configurar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "optional": "Facultatif",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "optional": "Opsional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "optional": "facoltativo",
  "nothingToConfigure": "Niente da configurare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "optional": "任意",
  "nothingToConfigure": "設定項目はありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "optional": "任意",
  "nothingToConfigure": "設定項目はありません"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "optional": "옵션",
  "nothingToConfigure": "설정 항목이 없습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "optional": "Optioneel",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "optional": "Nieobowiązkowe",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "optional": "Opcional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "optional": "Необязательно",
  "nothingToConfigure": "Нечего менять"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "optional": "Voliteľné",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "optional": "ไม่บังคับ",
  "nothingToConfigure": "ไม่มีอะไรให้ต้ังค่า"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "optional": "Opsiyonel",
  "nothingToConfigure": "Ayarlar seçeneği bulunmamaktadır."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "optional": "Optional",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "optional": "Необов'язково",
  "nothingToConfigure": "Немає доступних параметрів для налаштування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "optional": "Không bắt buộc",
  "nothingToConfigure": "No configurable options available"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "optional": "可选",
  "nothingToConfigure": "没有项目"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "optional": "可選",
  "nothingToConfigure": "無可設定的項目"
}
</locale>
