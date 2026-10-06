<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ entity.name || entity.url }}</template>
	<template v-if="entity.name != null && entity.name != ''" #caption>{{ entity.url }}</template>
	<template #icon>
		<i v-if="!entity.isActive" class="ti ti-player-pause"></i>
		<i v-else-if="entity.latestStatus === null" class="ti ti-circle"></i>
		<i
			v-else-if="[200, 201, 204].includes(entity.latestStatus)"
			class="ti ti-check"
			:style="{ color: 'var(--MI_THEME-success)' }"
		></i>
		<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--MI_THEME-error)' }"></i>
	</template>
	<template #suffix>
		<MkTime v-if="entity.latestSentAt" :time="entity.latestSentAt" style="margin-right: 8px"/>
		<span v-else>-</span>
	</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="onEditClick">
				<i class="ti ti-settings"></i> {{ $locale.sfc.edit }}
			</MkButton>
			<MkButton danger @click="onDeleteClick">
				<i class="ti ti-trash"></i> {{ $locale.sfc.delete }}
			</MkButton>
		</div>
	</template>

	<div class="_gaps">
		<MkKeyValue>
			<template #key>latestStatus</template>
			<template #value>{{ entity.latestStatus ?? '-' }}</template>
		</MkKeyValue>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { entities } from 'misskey-js';
import { toRefs } from 'vue';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';

const emit = defineEmits<{
	(ev: 'edit', value: entities.SystemWebhook): void;
	(ev: 'delete', value: entities.SystemWebhook): void;
}>();

const props = defineProps<{
	entity: entities.SystemWebhook;
}>();

const { entity } = toRefs(props);

function onEditClick() {
	emit('edit', entity.value);
}

function onDeleteClick() {
	emit('delete', entity.value);
}

</script>

<style module lang="scss">
.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "edit": "التعديل",
  "delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "edit": "Editar",
  "delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "edit": "Upravit",
  "delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "edit": "Edit",
  "delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "edit": "Bearbeiten",
  "delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "edit": "Edit",
  "delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "edit": "Editar",
  "delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "edit": "Editer",
  "delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "edit": "Sunting",
  "delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "edit": "Modifica",
  "delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "edit": "編集",
  "delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "edit": "編集",
  "delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "edit": "Edit",
  "delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "edit": "Edit",
  "delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "edit": "편집",
  "delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "edit": "Bewerken",
  "delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "edit": "Rediger",
  "delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "edit": "Edytuj",
  "delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "edit": "Editar",
  "delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "edit": "Изменить",
  "delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "edit": "Upraviť",
  "delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "edit": "แก้ไข",
  "delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "edit": "Düzenle",
  "delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "edit": "Edit",
  "delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "edit": "Редагувати",
  "delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "edit": "Sửa",
  "delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "edit": "编辑",
  "delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "edit": "編輯",
  "delete": "刪除"
}
</locale>
