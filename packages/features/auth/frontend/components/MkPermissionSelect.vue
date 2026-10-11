<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_s">
	<div class="_buttons">
		<MkButton inline @click="selected = []">{{ disableAllText }}</MkButton>
		<MkButton inline @click="selected = [...eligible]">{{ enableAllText }}</MkButton>
	</div>
	<MkSwitch v-for="kind in ordinaryPermissions" :key="kind" :modelValue="selected.includes(kind)" @update:modelValue="value => toggle(kind, value)">{{ labels[kind] }}</MkSwitch>
	<div v-if="adminPermissions.length > 0" :class="$style.adminPermissions">
		<div :class="$style.adminPermissionsHeader"><b>{{ adminPermissionText }}</b></div>
		<MkSwitch v-for="kind in adminPermissions" :key="kind" :modelValue="selected.includes(kind)" @update:modelValue="value => toggle(kind, value)">{{ labels[kind] }}</MkSwitch>
	</div>
</div>
</template>
<script setup lang="ts">
import { computed, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';

const props = defineProps<{
	permissions: readonly string[];
	administrator: boolean;
	labels: Record<string, string>;
	disableAllText: string;
	enableAllText: string;
	adminPermissionText: string;
}>();
const selected = defineModel<string[]>({ required: true });
const eligible = computed(() => props.permissions.filter(p => props.administrator || (!p.startsWith('read:admin') && !p.startsWith('write:admin'))));
const ordinaryPermissions = computed(() => eligible.value.filter(p => !p.startsWith('read:admin') && !p.startsWith('write:admin')));
const adminPermissions = computed(() => eligible.value.filter(p => p.startsWith('read:admin') || p.startsWith('write:admin')));

watch(eligible, permissions => { selected.value = selected.value.filter(p => permissions.includes(p)); }, { immediate: true });

function toggle(kind: string, enabled: boolean) {
	selected.value = enabled ? [...new Set([...selected.value, kind])] : selected.value.filter(p => p !== kind);
}
</script>

<style module lang="scss">
.adminPermissions {
	margin: 8px -6px 0;
	padding: 24px 6px 6px;
	border: 2px solid var(--MI_THEME-error);
	border-radius: calc(var(--MI-radius) / 2);
}

.adminPermissionsHeader {
	margin: -34px 0 6px 12px;
	padding: 0 4px;
	width: fit-content;
	color: var(--MI_THEME-error);
	background: var(--MI_THEME-panel);
}
</style>
