<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<SearchMarker path="/admin/system-webhook" label="SystemWebhook" :keywords="['webhook']" icon="ti ti-webhook">
			<div class="_gaps_m">
				<SearchMarker>
					<MkButton primary @click="onCreateWebhookClicked">
						<i class="ti ti-plus"></i> <SearchLabel>{{ $locale.sfc.createWebhook }}</SearchLabel>
					</MkButton>
				</SearchMarker>

				<FormSection>
					<div class="_gaps">
						<XItem v-for="item in webhooks" :key="item.id" :entity="item" @edit="onEditButtonClicked" @delete="onDeleteButtonClicked"/>
					</div>
				</FormSection>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { entities } from 'misskey-js';
import XItem from '@features/integrations/frontend/pages/admin/system-webhook.item.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { showSystemWebhookEditorDialog } from '@features/integrations/frontend/components/MkSystemWebhookEditor.impl.js';
import * as os from '@features/ui/frontend/os.js';

const webhooks = ref<entities.SystemWebhook[]>([]);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

async function onCreateWebhookClicked() {
	await showSystemWebhookEditorDialog({
		mode: 'create',
	});

	await fetchWebhooks();
}

async function onEditButtonClicked(webhook: entities.SystemWebhook) {
	await showSystemWebhookEditorDialog({
		mode: 'edit',
		id: webhook.id,
	});

	await fetchWebhooks();
}

async function onDeleteButtonClicked(webhook: entities.SystemWebhook) {
	const result = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.deleteConfirm,
	});
	if (!result.canceled) {
		await misskeyApi('admin/system-webhook/delete', {
			id: webhook.id,
		});
		await fetchWebhooks();
	}
}

async function fetchWebhooks() {
	const result = await misskeyApi('admin/system-webhook/list', {});
	webhooks.value = result.sort((a, b) => a.id.localeCompare(b.id));
}

onMounted(async () => {
	await fetchWebhooks();
});

definePage(() => ({
	title: 'SystemWebhook',
	icon: 'ti ti-webhook',
}));
</script>

<style module lang="scss">

</style>

<locale locale="ar-SA" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createWebhook": "Crear un Webhook",
	"deleteConfirm": "Segur que vols esborrar el webhook?"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createWebhook": "Vytvořit Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createWebhook": "Webhook erstellen",
	"deleteConfirm": "Bist du sicher, dass du den Webhook löschen willst?"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createWebhook": "Crear Webhook",
	"deleteConfirm": "¿Estás seguro de querer eliminar el Webhook?"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createWebhook": "Buat Webhook",
	"deleteConfirm": "Apakah kamu yakin ingin menghapus Webhook?"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createWebhook": "Creazione Webhook",
	"deleteConfirm": "Vuoi davvero eliminare il Webhook?"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createWebhook": "Webhookを作成",
	"deleteConfirm": "Webhookを削除しますか？"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createWebhook": "Webhookをつくる",
	"deleteConfirm": "ほんまにWebhookをほかしてもええんか？"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createWebhook": "Webhook 생성",
	"deleteConfirm": "Webhook을 삭제할까요?"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createWebhook": "Stwórz Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createWebhook": "Criar Webhook",
	"deleteConfirm": "Você tem certeza de que deseja excluir o Webhook?"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createWebhook": "Создать вебхук",
	"deleteConfirm": "Вы уверены, что хотите удалить этот Вебхук?"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createWebhook": "สร้าง Webhook",
	"deleteConfirm": "ต้องการลบ Webhook ใช่ไหม?"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createWebhook": "Webhook oluştur",
	"deleteConfirm": "Webhook'u silmek istediğinden emin misin?"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createWebhook": "Create Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createWebhook": "Tạo Webhook",
	"deleteConfirm": "Are you sure you want to delete the Webhook?"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createWebhook": "创建 Webhook",
	"deleteConfirm": "要删除 webhook 吗？"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createWebhook": "建立 Webhook",
	"deleteConfirm": "請問是否要刪除 Webhook？"
}
</locale>
