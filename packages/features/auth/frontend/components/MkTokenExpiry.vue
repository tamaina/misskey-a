<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkInput :modelValue="modelValue ?? ''" type="datetime-local" :disabled="disabled" @update:modelValue="update">
	<template #label>{{ $locale.sfc.expiry }}</template>
	<template #caption>{{ $locale.sfc.help }}</template>
</MkInput>
</template>
<script setup lang="ts">
import MkInput from '@features/ui/frontend/components/MkInput.vue';
defineProps<{ modelValue: string | null; disabled?: boolean }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: string | null): void }>();

function update(value: string | number | null | undefined) { if (typeof value === 'string') emit('update:modelValue', value || null); }
</script>
<locale locale="ja-JP" lang="json">
{ "expiry": "アクセストークンの有効期限（任意）", "help": "空欄は無期限です。期限を指定した場合は、その日時以降 HTTP・ストリーム・MCP で使えなくなります。" }
</locale>
