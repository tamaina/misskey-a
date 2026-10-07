<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="clip" class="_gaps">
			<div class="_panel">
				<div class="_gaps_s" :class="$style.description">
					<div v-if="clip.description">
						<Mfm :text="clip.description" :isNote="false"/>
					</div>
					<div v-else>({{ $locale.sfc.noDescription }})</div>
					<div>
						<MkButton v-if="favorited" v-tooltip="$locale.sfc.unfavorite" asLike rounded primary @click="unfavorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
						<MkButton v-else v-tooltip="$locale.sfc.favorite" asLike rounded @click="favorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
					</div>
				</div>
				<div :class="$style.user">
					<MkAvatar :user="clip.user" :class="$style.avatar" indicator link preview/> <MkUserName :user="clip.user" :nowrap="false"/>
				</div>
			</div>

			<MkNotesTimeline :paginator="paginator" :detail="true"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, provide, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import { $i } from '@features/auth/frontend/i.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { clipsCache } from '@features/runtime/frontend/cache.js';
import { isSupportShare } from '@features/navigation/frontend/utility/navigator.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { genEmbedCode } from '@features/web/frontend/utility/get-embed-code.js';
import { assertServerContext, serverContext } from '@features/runtime/frontend/server-context.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

// contextは非ログイン状態の情報しかないためログイン時は利用できない
const CTX_CLIP = !$i && assertServerContext(serverContext, 'clip') ? serverContext.clip : null;

const props = defineProps<{
	clipId: string,
}>();

const clip = ref<Misskey.entities.Clip | null>(CTX_CLIP);
const favorited = ref(false);
const paginator = markRaw(new Paginator('clips/notes', {
	limit: 10,
	canSearch: true,
	computedParams: computed(() => ({
		clipId: props.clipId,
	})),
}));

const isOwned = computed<boolean | null>(() => $i && clip.value && ($i.id === clip.value.userId));

watch(() => props.clipId, async () => {
	if (CTX_CLIP && CTX_CLIP.id === props.clipId) {
		clip.value = CTX_CLIP;
		return;
	}

	clip.value = await misskeyApi('clips/show', {
		clipId: props.clipId,
	});

	favorited.value = clip.value!.isFavorited ?? false;
}, {
	immediate: true,
});

provide('currentClip', clip);

function favorite() {
	os.apiWithDialog('clips/favorite', {
		clipId: props.clipId,
	}).then(() => {
		favorited.value = true;
	});
}

async function unfavorite() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('clips/unfavorite', {
		clipId: props.clipId,
	}).then(() => {
		favorited.value = false;
	});
}

const headerActions = computed<PageHeaderItem[] | null>(() => clip.value && isOwned.value ? [{
	icon: 'ti ti-pencil',
	text: $locale.value.sfc.edit,
	handler: async (): Promise<void> => {
		if (clip.value == null) return;

		const { canceled, result } = await os.form(clip.value.name, {
			name: {
				type: 'string',
				label: $locale.value.sfc.name,
				default: clip.value.name,
			},
			description: {
				type: 'string',
				required: false,
				multiline: true,
				treatAsMfm: true,
				label: $locale.value.sfc.description,
				default: clip.value.description,
			},
			isPublic: {
				type: 'boolean',
				label: $locale.value.sfc.public,
				default: clip.value.isPublic,
			},
		});

		if (canceled) return;

		os.apiWithDialog('clips/update', {
			clipId: clip.value.id,
			...result,
		});

		clipsCache.delete();
	},
}, ...(clip.value.isPublic ? [{
	icon: 'ti ti-share',
	text: $locale.value.sfc.share,
	handler: (ev): void => {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			icon: 'ti ti-link',
			text: $locale.value.sfc.copyUrl,
			action: () => {
				copyToClipboard(`${url}/clips/${clip.value!.id}`);
			},
		}, {
			icon: 'ti ti-code',
			text: $locale.value.sfc.embed,
			action: () => {
				genEmbedCode('clips', clip.value!.id);
			},
		});

		if (isSupportShare()) {
			menuItems.push({
				icon: 'ti ti-share',
				text: $locale.value.sfc.share,
				action: async () => {
					navigator.share({
						title: clip.value!.name,
						text: clip.value!.description ?? '',
						url: `${url}/clips/${clip.value!.id}`,
					});
				},
			});
		}

		os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
	},
}] satisfies PageHeaderItem[] : []), {
	icon: 'ti ti-trash',
	text: $locale.value.sfc.delete,
	danger: true,
	handler: async (): Promise<void> => {
		if (clip.value == null) return;

		const { canceled } = await os.confirm({
			type: 'warning',
			text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: clip.value.name }),
		});
		if (canceled) return;

		await os.apiWithDialog('clips/delete', {
			clipId: clip.value.id,
		});

		clipsCache.delete();
	},
}] satisfies PageHeaderItem[] : null);

definePage(() => ({
	title: clip.value ? clip.value.name : $locale.value.sfc.clip,
	icon: 'ti ti-paperclip',
}));
</script>

<style lang="scss" module>
.description {
	padding: 16px;
}

.user {
	--height: 32px;
	padding: 16px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	line-height: var(--height);
}

.avatar {
	width: var(--height);
	height: var(--height);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"noDescription": "There is no explanation",
	"unfavorite": "إزالة من المفضلة",
	"favorite": "أضفها للمفضلة",
	"unfavoriteConfirm": "أتريد إزالتها من المفضلة؟",
	"edit": "التعديل",
	"name": "الإسم",
	"description": "الوصف",
	"public": "علني",
	"share": "شارِك",
	"copyUrl": "انسخ الرابط",
	"embed": "Embed",
	"delete": "حذف",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"clip": "مِشبك"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"noDescription": "No hi ha una descripció ",
	"unfavorite": "Eliminar dels preferits",
	"favorite": "Afegeix als preferits",
	"unfavoriteConfirm": "Esborrar dels favorits?",
	"edit": "Editar",
	"name": "Nom",
	"description": "Descripció",
	"public": "Públic ",
	"share": "Comparteix",
	"copyUrl": "Copia l'URL",
	"embed": "Incrustar",
	"delete": "Elimina",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?",
	"clip": "Retalls"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Odebrat z oblízených",
	"favorite": "Oblíbené",
	"unfavoriteConfirm": "Opravdu chcete odstranit z oblíbených?",
	"edit": "Upravit",
	"name": "Jméno",
	"description": "Popis",
	"public": "Veřejný",
	"share": "Sdílet",
	"copyUrl": "Kopírovat URL",
	"embed": "Embed",
	"delete": "Smazat",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"clip": "Oříznout"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edit",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"share": "Share",
	"copyUrl": "Copy URL",
	"embed": "Embed",
	"delete": "Delete",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"noDescription": "Keine Beschreibung vorhanden",
	"unfavorite": "Aus Favoriten entfernen",
	"favorite": "Zu Favoriten hinzufügen",
	"unfavoriteConfirm": "Wirklich aus Favoriten entfernen?",
	"edit": "Bearbeiten",
	"name": "Name",
	"description": "Beschreibung",
	"public": "Öffentlich",
	"share": "Teilen",
	"copyUrl": "URL kopieren",
	"embed": "Einbetten",
	"delete": "Löschen",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?",
	"clip": "Clip erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edit",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"share": "Share",
	"copyUrl": "Copy URL",
	"embed": "Embed",
	"delete": "Delete",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"noDescription": "No hay descripción",
	"unfavorite": "Quitar de favoritos",
	"favorite": "Añadir a favoritos",
	"unfavoriteConfirm": "¿Desea quitar de favoritos?",
	"edit": "Editar",
	"name": "Nombre",
	"description": "Descripción",
	"public": "Público",
	"share": "Compartir",
	"copyUrl": "Copiar URL",
	"embed": "Insertar",
	"delete": "Borrar",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"noDescription": "Il n'y a pas de description",
	"unfavorite": "Retirer des favoris",
	"favorite": "Ajouter aux favoris",
	"unfavoriteConfirm": "Vraiment supprimer des favoris ?",
	"edit": "Editer",
	"name": "Nom",
	"description": "Description",
	"public": "Public",
	"share": "Partager",
	"copyUrl": "Copier l’URL",
	"embed": "Embed",
	"delete": "Supprimer",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"noDescription": "Tidak ada deskripsi",
	"unfavorite": "Hapus dari favorit",
	"favorite": "Favorit",
	"unfavoriteConfirm": "Yakin ingin menghapusnya dari favorit?",
	"edit": "Sunting",
	"name": "Nama",
	"description": "Deskripsi",
	"public": "Publik",
	"share": "Bagikan",
	"copyUrl": "Salin tautan",
	"embed": "Embed",
	"delete": "Hapus",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"noDescription": "Manca la descrizione",
	"unfavorite": "Rimuovi nota dai preferiti",
	"favorite": "Preferiti",
	"unfavoriteConfirm": "Vuoi davvero rimuovere la preferenza?",
	"edit": "Modifica",
	"name": "Nome",
	"description": "Descrizione",
	"public": "Pubblica",
	"share": "Condividi",
	"copyUrl": "Copia URL",
	"embed": "Incorporare",
	"delete": "Elimina",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"noDescription": "説明文はありません",
	"unfavorite": "お気に入り解除",
	"favorite": "お気に入り",
	"unfavoriteConfirm": "お気に入り解除しますか？",
	"edit": "編集",
	"name": "名前",
	"description": "説明",
	"public": "パブリック",
	"share": "共有",
	"copyUrl": "URLをコピー",
	"embed": "埋め込み",
	"delete": "削除",
	"deleteAreYouSure": "「{x}」を削除しますか？",
	"clip": "クリップ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"noDescription": "説明文はあらへんで",
	"unfavorite": "やっぱ気に入らん",
	"favorite": "お気に入り",
	"unfavoriteConfirm": "ほんまに気に入らんの？",
	"edit": "編集",
	"name": "名前",
	"description": "説明",
	"public": "パブリック",
	"share": "わけわけ",
	"copyUrl": "URLをコピー",
	"embed": "埋め込み",
	"delete": "ほかす",
	"deleteAreYouSure": "「{x}」はほかしてええか？",
	"clip": "クリップ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edit",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"share": "Share",
	"copyUrl": "Copy URL",
	"embed": "Embed",
	"delete": "Kkes",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"noDescription": "There is no explanation",
	"unfavorite": "ಮೆಚ್ಚುಗೆ ಅಳಿಸು",
	"favorite": "ಮೆಚ್ಚಿನ",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edit",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"share": "Share",
	"copyUrl": "Copy URL",
	"embed": "Embed",
	"delete": "ಅಳಿಸು",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"noDescription": "설명문이 없습니다",
	"unfavorite": "즐겨찾기에서 제거",
	"favorite": "즐겨찾기",
	"unfavoriteConfirm": "즐겨찾기를 해제하시겠습니까?",
	"edit": "편집",
	"name": "이름",
	"description": "설명",
	"public": "공개",
	"share": "공유",
	"copyUrl": "URL 복사",
	"embed": "임베드",
	"delete": "삭제",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"clip": "클립"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Verwijderen uit favorieten",
	"favorite": "Favorieten",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Bewerken",
	"name": "Naam",
	"description": "Beschrijving",
	"public": "Openbare",
	"share": "Delen",
	"copyUrl": "URL kopiëren",
	"embed": "Embed",
	"delete": "Verwijderen",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"clip": "Clip aanmaken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Fjern fra favoritter",
	"favorite": "Legg til i favoritter",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Rediger",
	"name": "Navn",
	"description": "Beskrivelse",
	"public": "Public",
	"share": "Del",
	"copyUrl": "Kopier URL",
	"embed": "Embed",
	"delete": "Slett",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Usuń z ulubionych",
	"favorite": "Dodaj do ulubionych",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edytuj",
	"name": "Nazwa",
	"description": "Opis",
	"public": "Publiczny",
	"share": "Udostępnij",
	"copyUrl": "Skopiuj adres URL",
	"embed": "Embed",
	"delete": "Usuń",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"noDescription": "Não há descrição",
	"unfavorite": "Remover dos favoritos",
	"favorite": "Adicionar aos favoritos",
	"unfavoriteConfirm": "Deseja realmente remover dos favoritos?",
	"edit": "Editar",
	"name": "Nome",
	"description": "Descrição",
	"public": "Público",
	"share": "Compartilhar",
	"copyUrl": "Copiar URL",
	"embed": "Embed",
	"delete": "Excluir",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?",
	"clip": "Clipe"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"noDescription": "Нет описания",
	"unfavorite": "Убрать из избранного",
	"favorite": "В избранное",
	"unfavoriteConfirm": "Удалить избранное?",
	"edit": "Изменить",
	"name": "Название",
	"description": "Описание",
	"public": "Общедоступно",
	"share": "Поделиться",
	"copyUrl": "Копировать ссылку",
	"embed": "Вложение",
	"delete": "Удалить",
	"deleteAreYouSure": "Хотите удалить «{x}»?",
	"clip": "Подборка"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Nepáči sa mi",
	"favorite": "Páči sa mi",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Upraviť",
	"name": "Názov",
	"description": "Popis",
	"public": "Verejné",
	"share": "Zdieľať",
	"copyUrl": "Kopírovať URL",
	"embed": "Embed",
	"delete": "Odstrániť",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"noDescription": "ไม่มีข้อความอธิบาย",
	"unfavorite": "ลบออกจากรายการโปรด",
	"favorite": "รายการโปรด",
	"unfavoriteConfirm": "ลบออกจากรายการโปรดแน่ใจหรอ?",
	"edit": "แก้ไข",
	"name": "ชื่อ",
	"description": "คำอธิบาย",
	"public": "สาธารณะ",
	"share": "แบ่งปัน",
	"copyUrl": "คัดลอก URL",
	"embed": "ฝัง",
	"delete": "ลบ",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"clip": "คลิป"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"noDescription": "Açıklama yok",
	"unfavorite": "Favoriden kaldır",
	"favorite": "Favori",
	"unfavoriteConfirm": "Cidden favorilerden kaldırmak istiyor musunuz?",
	"edit": "Düzenle",
	"name": "İsim",
	"description": "Açıklama",
	"public": "Herkese açık",
	"share": "Paylaş",
	"copyUrl": "URL kopyala",
	"embed": "Göm",
	"delete": "Sil",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"unfavoriteConfirm": "Really remove from favorites?",
	"edit": "Edit",
	"name": "Name",
	"description": "Description",
	"public": "Public",
	"share": "Share",
	"copyUrl": "Copy URL",
	"embed": "Embed",
	"delete": "ئۆچۈرۈش",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"noDescription": "Пояснення відсутнє",
	"unfavorite": "Видалити з обраного",
	"favorite": "Обране",
	"unfavoriteConfirm": "Справді видалити з обраного?",
	"edit": "Редагувати",
	"name": "Ім'я",
	"description": "Опис",
	"public": "Публічний",
	"share": "Поділитись",
	"copyUrl": "Копіювати URL",
	"embed": "Вбудувати",
	"delete": "Видалити",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"clip": "Добірка"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"noDescription": "There is no explanation",
	"unfavorite": "Bỏ thích",
	"favorite": "Thêm vào yêu thích",
	"unfavoriteConfirm": "Bạn thực sự muốn xoá khỏi mục yêu thích?",
	"edit": "Sửa",
	"name": "Tên",
	"description": "Mô tả",
	"public": "Công khai",
	"share": "Chia sẻ",
	"copyUrl": "Sao chép URL",
	"embed": "Embed",
	"delete": "Xóa",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?",
	"clip": "Lưu bài viết"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"noDescription": "没有描述",
	"unfavorite": "取消收藏",
	"favorite": "收藏",
	"unfavoriteConfirm": "确定要取消收藏吗？",
	"edit": "编辑",
	"name": "名称",
	"description": "描述",
	"public": "公开",
	"share": "分享",
	"copyUrl": "复制链接",
	"embed": "嵌入",
	"delete": "删除",
	"deleteAreYouSure": "要删掉「{x}」吗？",
	"clip": "便签"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"noDescription": "沒有說明文字",
	"unfavorite": "從我的最愛中移除",
	"favorite": "我的最愛",
	"unfavoriteConfirm": "要取消收錄我的最愛嗎？",
	"edit": "編輯",
	"name": "名稱",
	"description": "描述",
	"public": "公開",
	"share": "分享",
	"copyUrl": "複製URL",
	"embed": "嵌入",
	"delete": "刪除",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？",
	"clip": "摘錄"
}
</locale>
