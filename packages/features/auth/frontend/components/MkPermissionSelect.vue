<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_s">
	<div class="_buttons">
		<MkButton inline @click="setPermissions(ordinaryPermissions, false)">{{ globalLocale.env.disableAll }}</MkButton>
		<MkButton inline @click="setPermissions(ordinaryPermissions, true)">{{ globalLocale.env.enableAll }}</MkButton>
	</div>
	<MkSwitch v-for="kind in ordinaryPermissions" :key="kind" :modelValue="selected.includes(kind)" @update:modelValue="value => toggle(kind, value)">{{ globalLocale.env._permissions[kind as keyof Locale['_permissions']] }}</MkSwitch>
	<div v-if="adminPermissions.length > 0" :class="$style.adminPermissions">
		<div :class="$style.adminPermissionsHeader"><b>{{ globalLocale.env.adminPermission }}</b></div>
		<div class="_gaps_s">
			<div class="_buttons">
				<MkButton inline @click="setPermissions(adminPermissions, false)">{{ globalLocale.env.disableAllAdmin }}</MkButton>
				<MkButton inline @click="setPermissions(adminPermissions, true)">{{ globalLocale.env.enableAllAdmin }}</MkButton>
			</div>
			<MkSwitch v-for="kind in adminPermissions" :key="kind" :modelValue="selected.includes(kind)" @update:modelValue="value => toggle(kind, value)">{{ globalLocale.env._permissions[kind as keyof Locale['_permissions']] }}</MkSwitch>
		</div>
	</div>
</div>
</template>
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useLocale } from 'virtual:vite-vue-internationalization';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	permissions: readonly string[];
	administrator: boolean;
}>();
const selected = defineModel<string[]>({ required: true });
const eligible = computed(() => props.permissions.filter(p => props.administrator || (!p.startsWith('read:admin') && !p.startsWith('write:admin'))));
const ordinaryPermissions = computed(() => eligible.value.filter(p => !p.startsWith('read:admin') && !p.startsWith('write:admin')));
const adminPermissions = computed(() => eligible.value.filter(p => p.startsWith('read:admin') || p.startsWith('write:admin')));

watch(eligible, permissions => { selected.value = selected.value.filter(p => permissions.includes(p)); }, { immediate: true });

function setPermissions(permissions: readonly string[], enabled: boolean) {
	selected.value = enabled ? [...new Set([...selected.value, ...permissions])] : selected.value.filter(p => !permissions.includes(p));
}

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
