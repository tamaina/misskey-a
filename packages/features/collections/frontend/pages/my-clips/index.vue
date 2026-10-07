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
			<MkButton primary rounded class="add" @click="create"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>

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
import { watch, ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkClipPreview from '@features/collections/frontend/components/MkClipPreview.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { clipsCache } from '@features/runtime/frontend/cache.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

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
			label: $locale.value.sfc.name,
		},
		description: {
			type: 'string',
			required: false,
			multiline: true,
			treatAsMfm: true,
			label: $locale.value.sfc.description,
		},
		isPublic: {
			type: 'boolean',
			label: $locale.value.sfc.public,
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
	title: $locale.value.sfc.favorites,
	icon: 'ti ti-heart',
}]);

definePage(() => ({
	title: $locale.value.sfc.clip,
	icon: 'ti ti-paperclip',
}));
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
	"createNewClip": "أنشئ مِشبكَا جديدًا",
	"name": "الإسم",
	"description": "الوصف",
	"public": "علني",
	"myClips": "My clips",
	"favorites": "المفضلات",
	"clip": "مِشبك",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "إضافة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createNewClip": "Crear un nou Retall",
	"name": "Nom",
	"description": "Descripció",
	"public": "Públic ",
	"myClips": "Els meus retalls",
	"favorites": "Favorits",
	"clip": "Retalls",
	"tip": "Clip és una funció que permet organitzar les teves notes.",
	"add": "Afegir"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createNewClip": "Vytvořit nový klip",
	"name": "Jméno",
	"description": "Popis",
	"public": "Veřejný",
	"myClips": "Moje klipy",
	"favorites": "Oblíbené",
	"clip": "Oříznout",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Přidat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "Favorites",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Add"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createNewClip": "Neuen Clip erstellen",
	"name": "Name",
	"description": "Beschreibung",
	"public": "Öffentlich",
	"myClips": "Meine Clips",
	"favorites": "Favoriten",
	"clip": "Clip erstellen",
	"tip": "Clips sind eine Funktion, mit der du Notizen gruppieren kannst.",
	"add": "Hinzufügen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "Favorites",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Add"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createNewClip": "Crear clip nuevo",
	"name": "Nombre",
	"description": "Descripción",
	"public": "Público",
	"myClips": "Mis clips",
	"favorites": "Favoritos",
	"clip": "Clip",
	"tip": "Clip es una función que permite organizar varias notas.",
	"add": "Agregar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createNewClip": "Créer un nouveau clip",
	"name": "Nom",
	"description": "Description",
	"public": "Public",
	"myClips": "Mes clips",
	"favorites": "Favoris",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Ajouter"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createNewClip": "Buat klip baru",
	"name": "Nama",
	"description": "Deskripsi",
	"public": "Publik",
	"myClips": "Klip saya",
	"favorites": "Favorit",
	"clip": "Klip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Tambahkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createNewClip": "Crea una Clip",
	"name": "Nome",
	"description": "Descrizione",
	"public": "Pubblica",
	"myClips": "Le mie Clip",
	"favorites": "Preferiti",
	"clip": "Clip",
	"tip": "Le clip sono una funzionalità che consente di raggruppare le Note.",
	"add": "Aggiungi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createNewClip": "新しいクリップを作成",
	"name": "名前",
	"description": "説明",
	"public": "パブリック",
	"myClips": "自分のクリップ",
	"favorites": "お気に入り",
	"clip": "クリップ",
	"tip": "クリップは、ノートをまとめることができる機能です。",
	"add": "追加"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createNewClip": "新しいクリップを作るで",
	"name": "名前",
	"description": "説明",
	"public": "パブリック",
	"myClips": "自分のクリップ",
	"favorites": "お気に入り",
	"clip": "クリップ",
	"tip": "クリップは、ノートをまとめられる機能やで。",
	"add": "増やす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "Favorites",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Add"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "ಮೆಚ್ಚಿನವುಗಳು",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Add"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createNewClip": "새 클립 만들기",
	"name": "이름",
	"description": "설명",
	"public": "공개",
	"myClips": "내 클립",
	"favorites": "즐겨찾기",
	"clip": "클립",
	"tip": "클립은 노트를 정리할 수 있는 기능입니다.",
	"add": "추가"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createNewClip": "Nieuwe clip aanmaken",
	"name": "Naam",
	"description": "Beschrijving",
	"public": "Openbare",
	"myClips": "My clips",
	"favorites": "Toevoegen aan favorieten",
	"clip": "Clip aanmaken",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Toevoegen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Navn",
	"description": "Beskrivelse",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "Favoritter",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Legg til"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createNewClip": "Utwórz nowy klip",
	"name": "Nazwa",
	"description": "Opis",
	"public": "Publiczny",
	"myClips": "My clips",
	"favorites": "Ulubione",
	"clip": "Klip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Dodaj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createNewClip": "Criar novo clipe",
	"name": "Nome",
	"description": "Descrição",
	"public": "Público",
	"myClips": "Meus clipes",
	"favorites": "Favoritos",
	"clip": "Clipe",
	"tip": "Clip é uma função que permite organização das suas notas.",
	"add": "Adicionar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createNewClip": "Новая подборка",
	"name": "Название",
	"description": "Описание",
	"public": "Общедоступно",
	"myClips": "Мои подборки",
	"favorites": "Избранное",
	"clip": "Подборка",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Добавить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createNewClip": "Vytvoriť nový klip",
	"name": "Názov",
	"description": "Popis",
	"public": "Verejné",
	"myClips": "My clips",
	"favorites": "Obľúbené",
	"clip": "Klip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Pridať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createNewClip": "สร้างคลิปใหม่",
	"name": "ชื่อ",
	"description": "คำอธิบาย",
	"public": "สาธารณะ",
	"myClips": "คลิปของฉัน",
	"favorites": "รายการโปรด",
	"clip": "คลิป",
	"tip": "คลิปเป็นฟังก์ชันที่สามารถรวมโน้ตเข้าด้วยกัน",
	"add": "เพิ่ม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createNewClip": "Klip oluştur",
	"name": "İsim",
	"description": "Açıklama",
	"public": "Herkese açık",
	"myClips": "Kliplerim",
	"favorites": "Favoriler",
	"clip": "Klip",
	"tip": "Klip, notları gruplandırmanıza olanak tanıyan bir özelliktir.",
	"add": "Ekle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createNewClip": "Create new clip",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"myClips": "My clips",
	"favorites": "Favorites",
	"clip": "Clip",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Add"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createNewClip": "Створити добірку",
	"name": "Ім'я",
	"description": "Опис",
	"public": "Публічний",
	"myClips": "Мої добірки",
	"favorites": "Обране",
	"clip": "Добірка",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Додати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createNewClip": "Tạo một ghim mới",
	"name": "Tên",
	"description": "Mô tả",
	"public": "Công khai",
	"myClips": "Các clip của tôi",
	"favorites": "Lượt thích",
	"clip": "Lưu bài viết",
	"tip": "Clip is a feature that allows you to organize your notes.",
	"add": "Thêm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createNewClip": "新建便签",
	"name": "名称",
	"description": "描述",
	"public": "公开",
	"myClips": "我的便签",
	"favorites": "收藏",
	"clip": "便签",
	"tip": "便签功能可以将帖子合并在一起。",
	"add": "添加"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createNewClip": "建立新摘錄",
	"name": "名稱",
	"description": "描述",
	"public": "公開",
	"myClips": "我的摘錄",
	"favorites": "我的最愛",
	"clip": "摘錄",
	"tip": "摘錄是一項可以用來整理貼文的功能。",
	"add": "新增"
}
</locale>
