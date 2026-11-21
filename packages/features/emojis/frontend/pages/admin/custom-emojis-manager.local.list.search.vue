<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="uiWindow"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-search" style="margin-right: 0.5em;"></i> {{ globalLocale.env.search }}
	</template>
	<div :class="$style.root">
		<div class="_spacer">
			<div class="_gaps">
				<div class="_gaps_s">
					<MkInput
						v-model="model.name"
						type="search"
						autocapitalize="off"
					>
						<template #label>name</template>
					</MkInput>
					<MkInput
						v-model="model.category"
						type="search"
						autocapitalize="off"
					>
						<template #label>category</template>
					</MkInput>
					<MkInput
						v-model="model.aliases"
						type="search"
						autocapitalize="off"
					>
						<template #label>aliases</template>
					</MkInput>

					<MkInput
						v-model="model.type"
						type="search"
						autocapitalize="off"
					>
						<template #label>type</template>
					</MkInput>
					<MkInput
						v-model="model.license"
						type="search"
						autocapitalize="off"
					>
						<template #label>license</template>
					</MkInput>
					<MkSelect
						v-model="model.sensitive"
						:items="[
							{ label: '-', value: null },
							{ label: 'true', value: 'true' },
							{ label: 'false', value: 'false' },
						]"
					>
						<template #label>sensitive</template>
					</MkSelect>

					<MkSelect
						v-model="model.localOnly"
						:items="[
							{ label: '-', value: null },
							{ label: 'true', value: 'true' },
							{ label: 'false', value: 'false' },
						]"
					>
						<template #label>localOnly</template>
					</MkSelect>
					<MkInput
						v-model="model.updatedAtFrom"
						type="date"
						autocapitalize="off"
					>
						<template #label>updatedAt(from)</template>
					</MkInput>
					<MkInput
						v-model="model.updatedAtTo"
						type="date"
						autocapitalize="off"
					>
						<template #label>updatedAt(to)</template>
					</MkInput>

					<MkInput
						v-model="queryRolesText"
						type="text"
						readonly
						autocapitalize="off"
						@click="onQueryRolesEditClicked"
					>
						<template #label>role</template>
						<template #suffix><i class="ti ti-pencil"></i></template>
					</MkInput>
				</div>
				<MkFolder :spacerMax="8" :spacerMin="8">
					<template #icon><i class="ti ti-arrows-sort"></i></template>
					<template #label>{{ $locale.sfc.sortOrder }}</template>
					<MkSortOrderEditor
						:baseOrderKeyNames="gridSortOrderKeys"
						:currentOrders="sortOrders"
						@update="onSortOrderUpdate"
					/>
				</MkFolder>
			</div>
		</div>
		<div :class="$style.footerActions">
			<MkButton primary @click="onSearchRequest">
				{{ globalLocale.env.search }}
			</MkButton>
			<MkButton @click="onQueryResetButtonClicked">
				{{ globalLocale.env.reset }}
			</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script setup lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, watch } from 'vue';
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSortOrderEditor from '@features/preferences/frontend/components/MkSortOrderEditor.vue';

import {
	gridSortOrderKeys,
} from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';

import * as os from '@features/ui/frontend/os.js';
import type { Locale } from 'i18n';

import type { EmojiSearchQuery } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.vue';
import type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define.js';
import type { GridSortOrderKey } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	query: EmojiSearchQuery;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'queryUpdated', query: EmojiSearchQuery): void;
	(ev: 'sortOrderUpdated', orders: SortOrder<GridSortOrderKey>[]): void;
	(ev: 'search'): void;
}>();

const model = ref<EmojiSearchQuery>(props.query);
const queryRolesText = computed(() => model.value.roles.map(it => it.name).join(','));

watch(model, () => {
	emit('queryUpdated', model.value);
}, { deep: true });

const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);

function onSortOrderUpdate(orders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = orders;
	emit('sortOrderUpdated', orders);
}

function onSearchRequest() {
	emit('search');
}

function onQueryResetButtonClicked() {
	model.value.name = '';
	model.value.category = '';
	model.value.aliases = '';
	model.value.type = '';
	model.value.license = '';
	model.value.sensitive = null;
	model.value.localOnly = null;
	model.value.updatedAtFrom = '';
	model.value.updatedAtTo = '';
	sortOrders.value = [];
}

async function onQueryRolesEditClicked() {
	const result = await os.selectRole({
		initialRoleIds: model.value.roles.map(it => it.id),
		title: $locale.value.sfc.dialogSelectRoleTitle,
		publicOnly: true,
	});
	if (result.canceled) {
		return;
	}

	model.value.roles = result.result;
}
</script>

<style module>
.root {
	position: relative;
}

.footerActions {
	position: sticky;
	bottom: 0;
	padding: var(--MI-margin);
	background-color: var(--MI_THEME-bg);
	display: flex;
	gap: 8px;
	z-index: 1;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"sortOrder": "Ordenar",
	"dialogSelectRoleTitle": "Buscar Emojis per rol"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"sortOrder": "Sortierung",
	"dialogSelectRoleTitle": "Suche nach dem Rollensatz in Emojis"
}
</locale>

<locale locale="en-US" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"sortOrder": "Ordenar",
	"dialogSelectRoleTitle": "Buscar Emojis por rol"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"sortOrder": "Ordine",
	"dialogSelectRoleTitle": "Cerca emoji per ruolo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"sortOrder": "並び順",
	"dialogSelectRoleTitle": "絵文字に設定されたロールで検索"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"sortOrder": "並び順",
	"dialogSelectRoleTitle": "絵文字に設定されたロールで検索"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"sortOrder": "정렬 순서",
	"dialogSelectRoleTitle": "이모지에 설정된 역할을 검색"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"sortOrder": "Ordem de classificação",
	"dialogSelectRoleTitle": "Buscar por cargo que pode usar esse Emoji"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"sortOrder": "Порядок сортировки",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"sortOrder": "ลำดับการเรียง",
	"dialogSelectRoleTitle": "ค้นหาบทบาทที่ตั้งค่าไว้ด้วยเอโมจิ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"sortOrder": "Sıralama düzeni",
	"dialogSelectRoleTitle": "Emojilerde rol setine göre arama yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"sortOrder": "Sort order",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"sortOrder": "排序方式",
	"dialogSelectRoleTitle": "按角色搜索表情符号"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"sortOrder": "排序",
	"dialogSelectRoleTitle": "根據表情符號設定的角色進行搜尋"
}
</locale>
