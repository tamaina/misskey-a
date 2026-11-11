<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@close="windowEl?.close()"
	@closed="emit('closed')"
>
	<template #header>:{{ name }}:</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px; flex-grow: 1;">
			<div class="_gaps_m">
				<div v-if="imgUrl != null" :class="$style.imgs">
					<div style="background: #000;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #222;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #ddd;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #fff;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
				</div>

				<MkKeyValue>
					<template #key>{{ globalLocale.env.name }}</template>
					<template #value>{{ name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.host }}</template>
					<template #value>{{ host }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.license }}</template>
					<template #value>{{ license }}</template>
				</MkKeyValue>
			</div>
		</div>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done">
				<i class="ti ti-plus"></i> {{ $locale.sfc.import }}
			</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, useTemplateRef } from 'vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import * as os from '@features/ui/frontend/os.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	emoji: {
		id: string,
		name: string,
		host: string,
		license: string | null,
		url: string
	},
}>();

const emit = defineEmits<{
	// 必要なら戻り値を増やす
	(ev: 'done'): void,
	(ev: 'closed'): void
}>();

const windowEl = useTemplateRef('windowEl');

const name = computed(() => props.emoji.name);
const host = computed(() => props.emoji.host);
const license = computed(() => props.emoji.license);
const imgUrl = computed(() => props.emoji.url);

async function done() {
	await os.apiWithDialog('admin/emoji/copy', {
		emojiId: props.emoji.id,
	});

	emit('done');
	windowEl.value?.close();
}
</script>

<style lang="scss" module>
.imgs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}

.imgContainer {
	padding: 8px;
	border-radius: 6px;
}

.img {
	display: block;
	height: 64px;
	width: 64px;
	object-fit: contain;
}

.footer {
	position: sticky;
	z-index: 10000;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale locale="ar-SA" lang="json">
{
  "host": "المضيف",
  "license": "الرخصة",
  "import": "استيراد"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "host": "Amfitrió",
  "license": "Llicència",
  "import": "Importar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "host": "Hostitel",
  "license": "Licence",
  "import": "Importovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Import"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "host": "Hostname",
  "license": "Lizenz",
  "import": "Import"
}
</locale>

<locale locale="en-US" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Import"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "host": "Instancia",
  "license": "Licencia",
  "import": "Importar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "host": "Serveur distant",
  "license": "Licence",
  "import": "Importer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "host": "Host",
  "license": "Lisensi",
  "import": "Impor"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "host": "Host",
  "license": "Licenza",
  "import": "Importa"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "host": "ホスト",
  "license": "ライセンス",
  "import": "インポート"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "host": "ホスト",
  "license": "ライセンス",
  "import": "インポート"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Kter"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "ಆಮದು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "host": "호스트",
  "license": "라이선스",
  "import": "가져오기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "host": "Server",
  "license": "License",
  "import": "Import"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "host": "Vert",
  "license": "License",
  "import": "Importer"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Importuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "host": "Host",
  "license": "Licença",
  "import": "Importar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "host": "Хост",
  "license": "Лицензия",
  "import": "Импорт"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Importovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "host": "โฮสต์",
  "license": "ใบอนุญาต",
  "import": "นำเข้า"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "host": "Host",
  "license": "Lisans",
  "import": "İçeri aktar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "host": "Host",
  "license": "License",
  "import": "Import"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "host": "Хост",
  "license": "Ліцензія",
  "import": "Імпорт"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "host": "Host",
  "license": "Giấy phép",
  "import": "Nhập dữ liệu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "host": "主机名",
  "license": "许可信息",
  "import": "导入"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "host": "主機",
  "license": "授權",
  "import": "匯入"
}
</locale>
