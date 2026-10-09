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
		<i class="ti ti-search" style="margin-right: 0.5em;"></i> {{ $locale.sfc.search }}
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
				{{ $locale.sfc.search }}
			</MkButton>
			<MkButton @click="onQueryResetButtonClicked">
				{{ $locale.sfc.reset }}
			</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script setup lang="ts">
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

import type { EmojiSearchQuery } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.vue';
import type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define.js';
import type { GridSortOrderKey } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';

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
	"search": "البحث",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"search": "Cercar",
	"sortOrder": "Ordenar",
	"reset": "Reiniciar",
	"dialogSelectRoleTitle": "Buscar Emojis per rol"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"search": "Vyhledávání",
	"sortOrder": "Sort order",
	"reset": "Obnovit",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"search": "Search",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"search": "Suchen",
	"sortOrder": "Sortierung",
	"reset": "Zurücksetzen",
	"dialogSelectRoleTitle": "Suche nach dem Rollensatz in Emojis"
}
</locale>

<locale locale="en-US" lang="json">
{
	"search": "Search",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"search": "Buscar",
	"sortOrder": "Ordenar",
	"reset": "Restablecer",
	"dialogSelectRoleTitle": "Buscar Emojis por rol"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"search": "Rechercher",
	"sortOrder": "Sort order",
	"reset": "Réinitialiser",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"search": "Cari",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"search": "Cerca",
	"sortOrder": "Ordine",
	"reset": "Ripristina",
	"dialogSelectRoleTitle": "Cerca emoji per ruolo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"search": "検索",
	"sortOrder": "並び順",
	"reset": "リセット",
	"dialogSelectRoleTitle": "絵文字に設定されたロールで検索"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"search": "探す",
	"sortOrder": "並び順",
	"reset": "リセット",
	"dialogSelectRoleTitle": "絵文字に設定されたロールで検索"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"search": "Nadi",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"search": "ಹುಡುಕು",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"search": "검색",
	"sortOrder": "정렬 순서",
	"reset": "초기화",
	"dialogSelectRoleTitle": "이모지에 설정된 역할을 검색"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"search": "Zoeken",
	"sortOrder": "Sort order",
	"reset": "Herstellen",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"search": "Søk",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"search": "Szukaj",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"search": "Pesquisar",
	"sortOrder": "Ordem de classificação",
	"reset": "Redefinir",
	"dialogSelectRoleTitle": "Buscar por cargo que pode usar esse Emoji"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"search": "Поиск",
	"sortOrder": "Порядок сортировки",
	"reset": "Сброс",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"search": "Hľadať",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"search": "ค้นหา",
	"sortOrder": "ลำดับการเรียง",
	"reset": "รีเซ็ต",
	"dialogSelectRoleTitle": "ค้นหาบทบาทที่ตั้งค่าไว้ด้วยเอโมจิ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"search": "Ara",
	"sortOrder": "Sıralama düzeni",
	"reset": "Sıfırla",
	"dialogSelectRoleTitle": "Emojilerde rol setine göre arama yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"search": "ئىزدەش",
	"sortOrder": "Sort order",
	"reset": "Reset",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"search": "Пошук",
	"sortOrder": "Sort order",
	"reset": "Скинути",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"search": "Tìm kiếm",
	"sortOrder": "Sort order",
	"reset": "cài lại",
	"dialogSelectRoleTitle": "Search by role set in Emojis"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"search": "搜索",
	"sortOrder": "排序方式",
	"reset": "重置",
	"dialogSelectRoleTitle": "按角色搜索表情符号"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"search": "搜尋",
	"sortOrder": "排序",
	"reset": "重設",
	"dialogSelectRoleTitle": "根據表情符號設定的角色進行搜尋"
}
</locale>
