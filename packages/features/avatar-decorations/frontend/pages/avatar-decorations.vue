<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<MkFoldableSection v-for="category in Object.keys(groupedDecorations)" :key="category" :expanded="true">
				<template #header>{{ category || $locale.sfc.other }}</template>
				<div :class="$style.decorations">
					<div
						v-for="avatarDecoration in groupedDecorations[category]"
						:key="avatarDecoration.id"
						v-panel
						:class="$style.decoration"
						@click="edit(avatarDecoration)"
					>
						<div :class="$style.decorationName"><MkCondensedLine :minScale="0.5">{{ avatarDecoration.name }}</MkCondensedLine></div>
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[{ url: avatarDecoration.url }]" forceShowDecoration/>
					</div>
				</div>
			</MkFoldableSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { groupAvatarDecorations } from '@features/avatar-decorations/frontend/utility/group-avatar-decorations.js';

const $i = ensureSignin();

const avatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);
const groupedDecorations = computed(() => groupAvatarDecorations(avatarDecorations.value));

function load() {
	misskeyApi('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations.value = _avatarDecorations;
	});
}

load();

async function add(ev: PointerEvent) {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/avatar-decorations/frontend/pages/avatar-decoration-edit-dialog.vue').then(x => x.default), {
		categories: Object.keys(groupedDecorations.value),
	}, {
		done: result => {
			if (result.created) {
				avatarDecorations.value.unshift(result.created);
			}
		},
		closed: () => dispose(),
	});
}

async function edit(avatarDecoration: Misskey.entities.AdminAvatarDecorationsListResponse[number]) {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/avatar-decorations/frontend/pages/avatar-decoration-edit-dialog.vue').then(x => x.default), {
		avatarDecoration: avatarDecoration,
		categories: Object.keys(groupedDecorations.value),
	}, {
		done: result => {
			if (result.updated) {
				const index = avatarDecorations.value.findIndex(x => x.id === avatarDecoration.id);
				avatarDecorations.value[index] = {
					...avatarDecorations.value[index],
					...result.updated,
				};
			} else if (result.deleted) {
				avatarDecorations.value = avatarDecorations.value.filter(x => x.id !== avatarDecoration.id);
			}
		},
		closed: () => dispose(),
	});
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.add,
	handler: add,
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.avatarDecorations,
	icon: 'ti ti-sparkles',
}));
</script>

<style lang="scss" module>
.decorations {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	grid-gap: 12px;
}

.decoration {
	cursor: pointer;
	padding: 16px 16px 28px 16px;
	border-radius: 8px;
	text-align: center;
	font-size: 90%;
	overflow: clip;
	contain: content;
}

.decorationName {
	position: relative;
	z-index: 10;
	font-weight: bold;
	margin-bottom: 20px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"other": "منوعات",
	"add": "إضافة",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"other": "Altres",
	"add": "Afegir",
	"avatarDecorations": "Decoracions dels avatars"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"other": "Ostatní",
	"add": "Přidat",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"other": "Other",
	"add": "Add",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"other": "Anderes",
	"add": "Hinzufügen",
	"avatarDecorations": "Profilbilddekoration"
}
</locale>

<locale locale="en-US" lang="json">
{
	"other": "Other",
	"add": "Add",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"other": "Otro",
	"add": "Agregar",
	"avatarDecorations": "Decoraciones de avatar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"other": "Autre",
	"add": "Ajouter",
	"avatarDecorations": "Décorations d'avatar"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"other": "Lainnya",
	"add": "Tambahkan",
	"avatarDecorations": "Dekorasi avatar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"other": "Eccetera",
	"add": "Aggiungi",
	"avatarDecorations": "Decorazioni foto profilo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"other": "その他",
	"add": "追加",
	"avatarDecorations": "アイコンデコレーション"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"other": "その他",
	"add": "増やす",
	"avatarDecorations": "アイコンデコレーション"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"other": "Wiyyaḍ",
	"add": "Add",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"other": "Other",
	"add": "Add",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"other": "기타",
	"add": "추가",
	"avatarDecorations": "아바타 장식"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"other": "Ander",
	"add": "Toevoegen",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"other": "Andre",
	"add": "Legg til",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"other": "Inne",
	"add": "Dodaj",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"other": "Outros",
	"add": "Adicionar",
	"avatarDecorations": "Decorações de avatar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"other": "Другие",
	"add": "Добавить",
	"avatarDecorations": "Украшения для аватара"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"other": "Ostatní",
	"add": "Pridať",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"other": "อื่น ๆ",
	"add": "เพิ่ม",
	"avatarDecorations": "ของตกแต่งไอคอน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"other": "Diğer",
	"add": "Ekle",
	"avatarDecorations": "Avatar süsleri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"other": "Other",
	"add": "Add",
	"avatarDecorations": "Avatar decorations"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"other": "Інше",
	"add": "Додати",
	"avatarDecorations": "Прикраси аватара"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"other": "Khác",
	"add": "Thêm",
	"avatarDecorations": "Trang trí ảnh đại diện"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"other": "其他",
	"add": "添加",
	"avatarDecorations": "头像挂件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"other": "其他",
	"add": "新增",
	"avatarDecorations": "頭像裝飾"
}
</locale>
