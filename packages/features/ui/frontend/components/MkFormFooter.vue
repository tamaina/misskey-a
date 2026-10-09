<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="form.modified.value" :class="$style.root">
	<div :class="$style.text">{{ $l.sfc.thereAreNChanges({ n: form.modifiedCount.value }) }}</div>
	<div style="margin-left: auto;" class="_buttons">
		<MkButton danger rounded @click="form.discard"><i class="ti ti-x"></i> {{ $locale.sfc.discard }}</MkButton>
		<MkButton primary rounded :disabled="!canSaving" @click="form.save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { useForm } from '@features/ui/frontend/composables/use-form.js';

const props = withDefaults(defineProps<{
	form: ReturnType<typeof useForm>;
	canSaving?: boolean;
}>(), {
	canSaving: true,
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
}

.text {
	color: var(--MI_THEME-warn);
	font-size: 90%;
	animation: modified-blink 2s infinite;
}

@keyframes modified-blink {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
}
</style>

<locale locale="ar-SA" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"thereAreNChanges": "Hi ha(n) {n} canvi(s)",
	"discard": "Descarta",
	"save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"thereAreNChanges": "Es gibt {n} Änderung(en)",
	"discard": "Verwerfen",
	"save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"thereAreNChanges": "Hay {n} cambio(s)",
	"discard": "Descartar",
	"save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"thereAreNChanges": "Il y a {n}\u00a0modification(s)",
	"discard": "Annuler",
	"save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"thereAreNChanges": "Ada {n} perubahan",
	"discard": "Buang",
	"save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"thereAreNChanges": "Ci sono {n} cambiamenti",
	"discard": "Scarta",
	"save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"thereAreNChanges": "{n}件の変更があります",
	"discard": "破棄",
	"save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"thereAreNChanges": "{n}個の変更があるみたいや",
	"discard": "やめる",
	"save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"thereAreNChanges": "{n}건 변경이 있습니다.",
	"discard": "파기",
	"save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"thereAreNChanges": "Há {n} mudança(s)",
	"discard": "Descartar",
	"save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"thereAreNChanges": "Изменено: {n}",
	"discard": "Отменить",
	"save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"thereAreNChanges": "มีการเปลี่ยนแปลง {n} รายการ",
	"discard": "ละทิ้ง",
	"save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"thereAreNChanges": "{n} değişiklik var.",
	"discard": "At",
	"save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"thereAreNChanges": "Змінено: {n}",
	"discard": "Відхилити",
	"save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"thereAreNChanges": "There are {n} change(s)",
	"discard": "Discard",
	"save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"thereAreNChanges": "有 {n} 处更改",
	"discard": "取消",
	"save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"thereAreNChanges": "有 {n} 處的變更",
	"discard": "取消",
	"save": "儲存"
}
</locale>
