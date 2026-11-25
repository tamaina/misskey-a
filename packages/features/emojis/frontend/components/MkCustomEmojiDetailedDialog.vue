<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow ref="dialogEl" @close="cancel()" @closed="emit('closed')">
	<template #header>:{{ emoji.name }}:</template>
	<template #default>
		<div class="_spacer">
			<div style="display: flex; flex-direction: column; gap: 1em;">
				<div :class="$style.emojiImgWrapper">
					<MkCustomEmoji :name="emoji.name" :normal="true" :useOriginalSize="true" style="height: 100%;"></MkCustomEmoji>
				</div>
				<MkKeyValue :copy="`:${emoji.name}:`">
					<template #key>{{ globalLocale.env.name }}</template>
					<template #value>{{ emoji.name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.tags }}</template>
					<template #value>
						<div v-if="emoji.aliases.length === 0">{{ globalLocale.env.none }}</div>
						<div v-else :class="$style.aliases">
							<span v-for="alias in emoji.aliases" :key="alias" :class="$style.alias">
								{{ alias }}
							</span>
						</div>
					</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.category }}</template>
					<template #value>{{ emoji.category ?? globalLocale.env.none }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.sensitive }}</template>
					<template #value>{{ emoji.isSensitive ? globalLocale.env.yes : globalLocale.env.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.localOnly }}</template>
					<template #value>{{ emoji.localOnly ? globalLocale.env.yes : globalLocale.env.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.license }}</template>
					<template #value><Mfm :text="emoji.license ?? globalLocale.env.none"/></template>
				</MkKeyValue>
				<MkKeyValue :copy="emoji.url">
					<template #key>{{ $locale.sfc.emojiUrl }}</template>
					<template #value>
						<MkLink :url="emoji.url" target="_blank">{{ emoji.url }}</MkLink>
					</template>
				</MkKeyValue>
			</div>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import * as Misskey from 'misskey-js';
import { useTemplateRef } from 'vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	emoji: Misskey.entities.EmojiDetailed,
}>();

const emit = defineEmits<{
	(ev: 'ok', cropped: Misskey.entities.DriveFile): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = useTemplateRef('dialogEl');

function cancel() {
	emit('cancel');
	dialogEl.value!.close();
}
</script>

<style lang="scss" module>
.emojiImgWrapper {
  max-width: 100%;
  height: 40cqh;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05)) 8px, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05)) 14px);
  border-radius: var(--MI-radius);
  margin: auto;
  overflow-y: hidden;
}

.aliases {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.alias {
  display: inline-block;
  word-break: break-all;
  padding: 3px 10px;
  background-color: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
  border: solid 1px var(--MI_THEME-divider);
  border-radius: var(--MI-radius);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "tags": "الوسوم",
  "category": "الفئات",
  "license": "الرخصة",
  "emojiUrl": "رابط الإيموجي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "tags": "Etiquetes",
  "category": "Categoria",
  "license": "Llicència",
  "emojiUrl": "URL del emoji"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "tags": "Štítky",
  "category": "Kategorie",
  "license": "Licence",
  "emojiUrl": "URL obrázku"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "tags": "Aliases",
  "category": "Category",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "tags": "Aliasse",
  "category": "Kategorie",
  "license": "Lizenz",
  "emojiUrl": "Emoji-URL"
}
</locale>

<locale locale="en-US" lang="json">
{
  "tags": "Aliases",
  "category": "Category",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "tags": "Etiqueta",
  "category": "Categoría",
  "license": "Licencia",
  "emojiUrl": "URL del emoji"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "tags": "Étiquettes",
  "category": "Catégorie",
  "license": "Licence",
  "emojiUrl": "URL de l’émoji"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "tags": "Tandai",
  "category": "Kategori",
  "license": "Lisensi",
  "emojiUrl": "URL Emoji"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "tags": "Tag",
  "category": "Categoria",
  "license": "Licenza",
  "emojiUrl": "URL dell'emoji"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "tags": "タグ",
  "category": "カテゴリ",
  "license": "ライセンス",
  "emojiUrl": "絵文字画像URL"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "tags": "タグ",
  "category": "カテゴリ",
  "license": "ライセンス",
  "emojiUrl": "絵文字画像URL"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "tags": "Aliases",
  "category": "Category",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "tags": "Aliases",
  "category": "Category",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "tags": "태그",
  "category": "카테고리",
  "license": "라이선스",
  "emojiUrl": "이모지 URL"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "tags": "Aliassen",
  "category": "Categorie",
  "license": "License",
  "emojiUrl": "URL emoji"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "tags": "Aliases",
  "category": "Kategori",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "tags": "Tagi",
  "category": "Kategoria",
  "license": "License",
  "emojiUrl": "Adres URL emoji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "tags": "Etiquetas",
  "category": "Categoria",
  "license": "Licença",
  "emojiUrl": "URL do Emoji"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "tags": "Метки",
  "category": "Категория",
  "license": "Лицензия",
  "emojiUrl": "Ссылка на эмодзи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "tags": "Značky",
  "category": "Kategórie",
  "license": "License",
  "emojiUrl": "URL obrázku"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "tags": "นามแฝง",
  "category": "หมวดหมู่",
  "license": "ใบอนุญาต",
  "emojiUrl": "URL ของเอโมจิ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "tags": "Takma adlar",
  "category": "Kategori",
  "license": "Lisans",
  "emojiUrl": "Emoji URL'si"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "tags": "Aliases",
  "category": "Category",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "tags": "Теги",
  "category": "Категорія",
  "license": "Ліцензія",
  "emojiUrl": "URL емодзі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "tags": "Thẻ",
  "category": "Phân loại",
  "license": "Giấy phép",
  "emojiUrl": "URL Emoji"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "tags": "标签",
  "category": "类别",
  "license": "许可信息",
  "emojiUrl": "emoji 地址"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "tags": "標籤",
  "category": "類別",
  "license": "授權",
  "emojiUrl": "表情符號 URL"
}
</locale>
