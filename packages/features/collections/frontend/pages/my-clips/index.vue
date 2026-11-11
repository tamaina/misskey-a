<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer _gaps" style="--MI_SPACER-w: 700px;">
		<MkTip k="clips">
			{{ $locale.sfc.tip }}
		</MkTip>
		<div v-if="tab === 'my'" class="_gaps">
			<MkButton primary rounded class="add" @click="create"><i class="ti ti-plus"></i> {{ globalLocale.env.add }}</MkButton>

			<MkPagination v-slot="{ items }" :paginator="paginator" class="_gaps" withControl>
				<MkClipPreview v-for="item in items" :key="item.id" :clip="item" :noUserInfo="true"/>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'favorites'">
			<MkPagination v-slot="{ items }" :paginator="favoritesPaginator" class="_gaps" withControl>
				<MkClipPreview v-for="item in items" :key="item.id" :clip="item" :noUserInfo="true"/>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { watch, ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkClipPreview from '@features/collections/frontend/components/MkClipPreview.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { clipsCache } from '@features/runtime/frontend/cache.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const tab = ref('my');

const paginator = markRaw(new Paginator('clips/list', {
}));

const favoritesPaginator = markRaw(new Paginator('clips/my-favorites', {
	// ページネーションに対応していない
	noPaging: true,
}));

async function create() {
	const { canceled, result } = await os.form($locale.value.sfc.createNewClip, {
		name: {
			type: 'string',
			label: globalLocale.value.env.name,
		},
		description: {
			type: 'string',
			required: false,
			multiline: true,
			treatAsMfm: true,
			label: globalLocale.value.env.description,
		},
		isPublic: {
			type: 'boolean',
			label: globalLocale.value.env.public,
			default: false,
		},
	});

	if (canceled) return;

	os.apiWithDialog('clips/create', result);

	clipsCache.delete();

	paginator.reload();
}

function onClipCreated() {
	paginator.reload();
}

function onClipDeleted() {
	paginator.reload();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'my',
	title: $locale.value.sfc.myClips,
	icon: 'ti ti-paperclip',
}, {
	key: 'favorites',
	title: globalLocale.value.env.favorites,
	icon: 'ti ti-heart',
}]);

definePage(() => ({
	title: globalLocale.value.env.clip,
	icon: 'ti ti-paperclip',
}));
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
	"createNewClip": "أنشئ مِشبكَا جديدًا",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createNewClip": "Crear un nou Retall",
	"myClips": "Els meus retalls",
	"tip": "Clip és una funció que permet organitzar les teves notes."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createNewClip": "Vytvořit nový klip",
	"myClips": "Moje klipy",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createNewClip": "Neuen Clip erstellen",
	"myClips": "Meine Clips",
	"tip": "Clips sind eine Funktion, mit der du Notizen gruppieren kannst."
}
</locale>

<locale locale="en-US" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createNewClip": "Crear clip nuevo",
	"myClips": "Mis clips",
	"tip": "Clip es una función que permite organizar varias notas."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createNewClip": "Créer un nouveau clip",
	"myClips": "Mes clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createNewClip": "Buat klip baru",
	"myClips": "Klip saya",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createNewClip": "Crea una Clip",
	"myClips": "Le mie Clip",
	"tip": "Le clip sono una funzionalità che consente di raggruppare le Note."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createNewClip": "新しいクリップを作成",
	"myClips": "自分のクリップ",
	"tip": "クリップは、ノートをまとめることができる機能です。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createNewClip": "新しいクリップを作るで",
	"myClips": "自分のクリップ",
	"tip": "クリップは、ノートをまとめられる機能やで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createNewClip": "새 클립 만들기",
	"myClips": "내 클립",
	"tip": "클립은 노트를 정리할 수 있는 기능입니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createNewClip": "Nieuwe clip aanmaken",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createNewClip": "Utwórz nowy klip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createNewClip": "Criar novo clipe",
	"myClips": "Meus clipes",
	"tip": "Clip é uma função que permite organização das suas notas."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createNewClip": "Новая подборка",
	"myClips": "Мои подборки",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createNewClip": "Vytvoriť nový klip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createNewClip": "สร้างคลิปใหม่",
	"myClips": "คลิปของฉัน",
	"tip": "คลิปเป็นฟังก์ชันที่สามารถรวมโน้ตเข้าด้วยกัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createNewClip": "Klip oluştur",
	"myClips": "Kliplerim",
	"tip": "Klip, notları gruplandırmanıza olanak tanıyan bir özelliktir."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createNewClip": "Create new clip",
	"myClips": "My clips",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createNewClip": "Створити добірку",
	"myClips": "Мої добірки",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createNewClip": "Tạo một ghim mới",
	"myClips": "Các clip của tôi",
	"tip": "Clip is a feature that allows you to organize your notes."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createNewClip": "新建便签",
	"myClips": "我的便签",
	"tip": "便签功能可以将帖子合并在一起。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createNewClip": "建立新摘錄",
	"myClips": "我的摘錄",
	"tip": "摘錄是一項可以用來整理貼文的功能。"
}
</locale>
