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
					<template #key>{{ $locale.sfc.name }}</template>
					<template #value>{{ emoji.name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.tags }}</template>
					<template #value>
						<div v-if="emoji.aliases.length === 0">{{ $locale.sfc.none }}</div>
						<div v-else :class="$style.aliases">
							<span v-for="alias in emoji.aliases" :key="alias" :class="$style.alias">
								{{ alias }}
							</span>
						</div>
					</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.category }}</template>
					<template #value>{{ emoji.category ?? $locale.sfc.none }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.sensitive }}</template>
					<template #value>{{ emoji.isSensitive ? $locale.sfc.yes : $locale.sfc.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.localOnly }}</template>
					<template #value>{{ emoji.localOnly ? $locale.sfc.yes : $locale.sfc.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.license }}</template>
					<template #value><Mfm :text="emoji.license ?? $locale.sfc.none"/></template>
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
import * as Misskey from 'misskey-js';
import { useTemplateRef } from 'vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';

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
  "name": "الإسم",
  "tags": "الوسوم",
  "none": "لا شيء",
  "category": "الفئات",
  "sensitive": "محتوى حساس",
  "yes": "نعم",
  "no": "لا",
  "localOnly": "المحلي فقط",
  "license": "الرخصة",
  "emojiUrl": "رابط الإيموجي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "name": "Nom",
  "tags": "Etiquetes",
  "none": "Res",
  "category": "Categoria",
  "sensitive": "Sensible",
  "yes": "Sí ",
  "no": "No",
  "localOnly": "Només local",
  "license": "Llicència",
  "emojiUrl": "URL del emoji"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "name": "Jméno",
  "tags": "Štítky",
  "none": "Žádný",
  "category": "Kategorie",
  "sensitive": "NSFW",
  "yes": "Ano",
  "no": "Ne",
  "localOnly": "Jenom lokální",
  "license": "Licence",
  "emojiUrl": "URL obrázku"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "name": "Name",
  "tags": "Aliases",
  "none": "None",
  "category": "Category",
  "sensitive": "Sensitive",
  "yes": "Yes",
  "no": "No",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "name": "Name",
  "tags": "Aliasse",
  "none": "Nichts",
  "category": "Kategorie",
  "sensitive": "Sensibel",
  "yes": "Ja",
  "no": "Nein",
  "localOnly": "Nur Lokal",
  "license": "Lizenz",
  "emojiUrl": "Emoji-URL"
}
</locale>

<locale locale="en-US" lang="json">
{
  "name": "Name",
  "tags": "Aliases",
  "none": "None",
  "category": "Category",
  "sensitive": "Sensitive",
  "yes": "Yes",
  "no": "No",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "name": "Nombre",
  "tags": "Etiqueta",
  "none": "Ninguna",
  "category": "Categoría",
  "sensitive": "Marcado como sensible (NSFW)",
  "yes": "Si",
  "no": "No",
  "localOnly": "Solo local",
  "license": "Licencia",
  "emojiUrl": "URL del emoji"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "name": "Nom",
  "tags": "Étiquettes",
  "none": "Rien",
  "category": "Catégorie",
  "sensitive": "Contenu sensible",
  "yes": "Oui",
  "no": "Non",
  "localOnly": "Local seulement",
  "license": "Licence",
  "emojiUrl": "URL de l’émoji"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "name": "Nama",
  "tags": "Tandai",
  "none": "Tidak ada",
  "category": "Kategori",
  "sensitive": "Konten sensitif",
  "yes": "Iya",
  "no": "Tidak",
  "localOnly": "Hanya lokal",
  "license": "Lisensi",
  "emojiUrl": "URL Emoji"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "name": "Nome",
  "tags": "Tag",
  "none": "Nessuna",
  "category": "Categoria",
  "sensitive": "Esplicito",
  "yes": "Sì",
  "no": "No",
  "localOnly": "Soltanto locale",
  "license": "Licenza",
  "emojiUrl": "URL dell'emoji"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "name": "名前",
  "tags": "タグ",
  "none": "なし",
  "category": "カテゴリ",
  "sensitive": "センシティブ",
  "yes": "はい",
  "no": "いいえ",
  "localOnly": "ローカルのみ",
  "license": "ライセンス",
  "emojiUrl": "絵文字画像URL"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "name": "名前",
  "tags": "タグ",
  "none": "なし",
  "category": "カテゴリ",
  "sensitive": "気いつけて見いや",
  "yes": "ええで",
  "no": "あかん",
  "localOnly": "ローカルだけ",
  "license": "ライセンス",
  "emojiUrl": "絵文字画像URL"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "name": "Name",
  "tags": "Aliases",
  "none": "None",
  "category": "Category",
  "sensitive": "Sensitive",
  "yes": "Yes",
  "no": "No",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "name": "Name",
  "tags": "Aliases",
  "none": "None",
  "category": "Category",
  "sensitive": "Sensitive",
  "yes": "Yes",
  "no": "No",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "name": "이름",
  "tags": "태그",
  "none": "없음",
  "category": "카테고리",
  "sensitive": "열람 주의",
  "yes": "예",
  "no": "아니오",
  "localOnly": "로컬에만",
  "license": "라이선스",
  "emojiUrl": "이모지 URL"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "name": "Naam",
  "tags": "Aliassen",
  "none": "Niets",
  "category": "Categorie",
  "sensitive": "NSFW",
  "yes": "Ja",
  "no": "Nee",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "URL emoji"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "name": "Navn",
  "tags": "Aliases",
  "none": "Ingen",
  "category": "Kategori",
  "sensitive": "Sensitive",
  "yes": "Ja",
  "no": "Nei",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "name": "Nazwa",
  "tags": "Tagi",
  "none": "Brak",
  "category": "Kategoria",
  "sensitive": "NSFW",
  "yes": "Tak",
  "no": "Nie",
  "localOnly": "Lokalne tylko",
  "license": "License",
  "emojiUrl": "Adres URL emoji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "name": "Nome",
  "tags": "Etiquetas",
  "none": "Nenhum",
  "category": "Categoria",
  "sensitive": "Conteúdo sensível",
  "yes": "Sim",
  "no": "Não",
  "localOnly": "Apenas local",
  "license": "Licença",
  "emojiUrl": "URL do Emoji"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "name": "Название",
  "tags": "Метки",
  "none": "Ничего",
  "category": "Категория",
  "sensitive": "Содержимое не для всех",
  "yes": "Да",
  "no": "Нет",
  "localOnly": "Локально",
  "license": "Лицензия",
  "emojiUrl": "Ссылка на эмодзи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "name": "Názov",
  "tags": "Značky",
  "none": "Žiadne",
  "category": "Kategórie",
  "sensitive": "NSFW",
  "yes": "Áno",
  "no": "Nie",
  "localOnly": "Iba lokálne",
  "license": "License",
  "emojiUrl": "URL obrázku"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "name": "ชื่อ",
  "tags": "นามแฝง",
  "none": "ไม่มี",
  "category": "หมวดหมู่",
  "sensitive": "เนื้อหาที่ละเอียดอ่อน",
  "yes": "ใช่",
  "no": "ไม่",
  "localOnly": "เฉพาะท้องถิ่น",
  "license": "ใบอนุญาต",
  "emojiUrl": "URL ของเอโมจิ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "name": "İsim",
  "tags": "Takma adlar",
  "none": "Hiçbiri",
  "category": "Kategori",
  "sensitive": "Hassas",
  "yes": "Evet",
  "no": "Hayır",
  "localOnly": "Yalnızca yerel",
  "license": "Lisans",
  "emojiUrl": "Emoji URL'si"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "name": "Name",
  "tags": "Aliases",
  "none": "None",
  "category": "Category",
  "sensitive": "Sensitive",
  "yes": "Yes",
  "no": "No",
  "localOnly": "Local only",
  "license": "License",
  "emojiUrl": "Emoji URL"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "name": "Ім'я",
  "tags": "Теги",
  "none": "Відсутній",
  "category": "Категорія",
  "sensitive": "NSFW",
  "yes": "Так",
  "no": "Ні",
  "localOnly": "Локально",
  "license": "Ліцензія",
  "emojiUrl": "URL емодзі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "name": "Tên",
  "tags": "Thẻ",
  "none": "Không",
  "category": "Phân loại",
  "sensitive": "Nhạy cảm",
  "yes": "Đồng ý",
  "no": "Từ chối",
  "localOnly": "Chỉ trên máy chủ",
  "license": "Giấy phép",
  "emojiUrl": "URL Emoji"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "name": "名称",
  "tags": "标签",
  "none": "无",
  "category": "类别",
  "sensitive": "敏感内容",
  "yes": "是",
  "no": "否",
  "localOnly": "仅限本地",
  "license": "许可信息",
  "emojiUrl": "emoji 地址"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "name": "名稱",
  "tags": "標籤",
  "none": "無",
  "category": "類別",
  "sensitive": "敏感內容",
  "yes": "是",
  "no": "否",
  "localOnly": "僅限本地",
  "license": "授權",
  "emojiUrl": "表情符號 URL"
}
</locale>
