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
						<MkButton v-if="favorited" v-tooltip="globalLocale.env.unfavorite" asLike rounded primary @click="unfavorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
						<MkButton v-else v-tooltip="globalLocale.env.favorite" asLike rounded @click="favorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, watch, provide, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
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
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	text: globalLocale.value.env.edit,
	handler: async (): Promise<void> => {
		if (clip.value == null) return;

		const { canceled, result } = await os.form(clip.value.name, {
			name: {
				type: 'string',
				label: globalLocale.value.env.name,
				default: clip.value.name,
			},
			description: {
				type: 'string',
				required: false,
				multiline: true,
				treatAsMfm: true,
				label: globalLocale.value.env.description,
				default: clip.value.description,
			},
			isPublic: {
				type: 'boolean',
				label: globalLocale.value.env.public,
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
	text: globalLocale.value.env.share,
	handler: (ev): void => {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			icon: 'ti ti-link',
			text: globalLocale.value.env.copyUrl,
			action: () => {
				copyToClipboard(`${url}/clips/${clip.value!.id}`);
			},
		}, {
			icon: 'ti ti-code',
			text: globalLocale.value.env.embed,
			action: () => {
				genEmbedCode('clips', clip.value!.id);
			},
		});

		if (isSupportShare()) {
			menuItems.push({
				icon: 'ti ti-share',
				text: globalLocale.value.env.share,
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
	text: globalLocale.value.env.delete,
	danger: true,
	handler: async (): Promise<void> => {
		if (clip.value == null) return;

		const { canceled } = await os.confirm({
			type: 'warning',
			text: interpolateLocaleParameters(globalLocale.value.env.deleteAreYouSure, { x: clip.value.name }),
		});
		if (canceled) return;

		await os.apiWithDialog('clips/delete', {
			clipId: clip.value.id,
		});

		clipsCache.delete();
	},
}] satisfies PageHeaderItem[] : null);

definePage(() => ({
	title: clip.value ? clip.value.name : globalLocale.value.env.clip,
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
	"unfavoriteConfirm": "أتريد إزالتها من المفضلة؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"noDescription": "No hi ha una descripció ",
	"unfavoriteConfirm": "Esborrar dels favorits?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Opravdu chcete odstranit z oblíbených?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"noDescription": "Keine Beschreibung vorhanden",
	"unfavoriteConfirm": "Wirklich aus Favoriten entfernen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"noDescription": "No hay descripción",
	"unfavoriteConfirm": "¿Desea quitar de favoritos?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"noDescription": "Il n'y a pas de description",
	"unfavoriteConfirm": "Vraiment supprimer des favoris ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"noDescription": "Tidak ada deskripsi",
	"unfavoriteConfirm": "Yakin ingin menghapusnya dari favorit?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"noDescription": "Manca la descrizione",
	"unfavoriteConfirm": "Vuoi davvero rimuovere la preferenza?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"noDescription": "説明文はありません",
	"unfavoriteConfirm": "お気に入り解除しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"noDescription": "説明文はあらへんで",
	"unfavoriteConfirm": "ほんまに気に入らんの？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"noDescription": "설명문이 없습니다",
	"unfavoriteConfirm": "즐겨찾기를 해제하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"noDescription": "Não há descrição",
	"unfavoriteConfirm": "Deseja realmente remover dos favoritos?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"noDescription": "Нет описания",
	"unfavoriteConfirm": "Удалить избранное?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"noDescription": "ไม่มีข้อความอธิบาย",
	"unfavoriteConfirm": "ลบออกจากรายการโปรดแน่ใจหรอ?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"noDescription": "Açıklama yok",
	"unfavoriteConfirm": "Cidden favorilerden kaldırmak istiyor musunuz?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Really remove from favorites?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"noDescription": "Пояснення відсутнє",
	"unfavoriteConfirm": "Справді видалити з обраного?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"noDescription": "There is no explanation",
	"unfavoriteConfirm": "Bạn thực sự muốn xoá khỏi mục yêu thích?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"noDescription": "没有描述",
	"unfavoriteConfirm": "确定要取消收藏吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"noDescription": "沒有說明文字",
	"unfavoriteConfirm": "要取消收錄我的最愛嗎？"
}
</locale>
