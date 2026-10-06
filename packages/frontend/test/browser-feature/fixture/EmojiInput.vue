<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><input :value="modelValue" :placeholder="placeholder" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"></template>
<script setup lang="ts">
defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>();
</script>
