<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="selectedThemeId" :items="selectedThemeIdDef">
		<template #label>{{ $locale.sfc.theme }}</template>
	</MkSelect>
	<template v-if="selectedTheme != null">
		<MkInput readonly :modelValue="selectedTheme.author">
			<template #label>{{ $locale.sfc.author }}</template>
		</MkInput>
		<MkTextarea v-if="selectedTheme.desc" readonly :modelValue="selectedTheme.desc">
			<template #label>{{ globalLocale.env.description }}</template>
		</MkTextarea>
		<MkTextarea readonly tall :modelValue="selectedThemeCode">
			<template #label>{{ $locale.sfc.code }}</template>
			<template #caption><button class="_textButton" @click="copyThemeCode()">{{ globalLocale.env.copy }}</button></template>
		</MkTextarea>
		<MkButton v-if="!builtinThemes.some(t => t.id == selectedTheme!.id)" danger @click="uninstall()"><i class="ti ti-trash"></i> {{ $locale.sfc.uninstall }}</MkButton>
	</template>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';
import { computed, ref } from 'vue';
import JSON5 from 'json5';
import type { Theme } from '@features/preferences/frontend/shared/theme.js';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { removeTheme } from '@features/preferences/frontend/theme.js';
import { getBuiltinThemes } from '@features/preferences/frontend/shared/theme.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import { prefer } from '@features/preferences/frontend/preferences';

const globalLocale = useLocale<GlobalLocale>(import.meta.url);

const installedThemes = prefer.r.themes;
const builtinThemes = ref<Theme[]>([]);
getBuiltinThemes().then(themes => {
	builtinThemes.value = themes;
});

const {
	model: selectedThemeId,
	def: selectedThemeIdDef,
} = useMkSelect({
	items: computed<MkSelectItem<string | null>[]>(() => [{
		type: 'group',
		label: $locale.value.sfc.installedThemes,
		items: installedThemes.value.map(x => ({ label: x.name, value: x.id })),
	}, {
		type: 'group',
		label: $locale.value.sfc.builtinThemes,
		items: builtinThemes.value.map(x => ({ label: x.name, value: x.id })),
	}]),
	initialValue: null,
});

const themes = computed(() => [...installedThemes.value, ...builtinThemes.value]);

const selectedTheme = computed(() => {
	if (selectedThemeId.value == null) return null;
	return themes.value.find(x => x.id === selectedThemeId.value);
});

const selectedThemeCode = computed(() => {
	if (selectedTheme.value == null) return null;
	return JSON5.stringify(selectedTheme.value, null, '\t');
});

function copyThemeCode() {
	copyToClipboard(selectedThemeCode.value);
}

function uninstall() {
	removeTheme(selectedTheme.value as Theme);
	installedThemes.value = installedThemes.value.filter(t => t.id !== selectedThemeId.value);
	selectedThemeId.value = null;
	os.success();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.manage,
	icon: 'ti ti-tool',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"installedThemes": "السمات المثبتة",
	"builtinThemes": "السمات المدمجة",
	"manage": "إدارة القوالب",
	"theme": "المظهر",
	"author": "الكاتب",
	"code": "شيفرة القالب",
	"uninstall": "إلغاء التثبيت"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"installedThemes": "Temes instal·lats ",
	"builtinThemes": "Temes integrats",
	"manage": "Gestionar els temes ",
	"theme": "Tema",
	"author": "Autor",
	"code": "Codi del tema",
	"uninstall": "Desinstal·la"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"installedThemes": "Nainstalované vzhledy",
	"builtinThemes": "Vestavěné temáta",
	"manage": "Správa vzhledů",
	"theme": "Vzhled",
	"author": "Autor",
	"code": "Kód vzhledu",
	"uninstall": "Odinstalovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Themes",
	"author": "Author",
	"code": "Theme code",
	"uninstall": "Uninstall"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"installedThemes": "Installierte Farbschemata",
	"builtinThemes": "Eingebaute Farbschemata",
	"manage": "Farbschemaverwaltung",
	"theme": "Farbschema",
	"author": "Autor",
	"code": "Farbschemencode",
	"uninstall": "Deinstallieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Themes",
	"author": "Author",
	"code": "Theme code",
	"uninstall": "Uninstall"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"installedThemes": "Temas instalados",
	"builtinThemes": "Temas integrados",
	"manage": "Gestor de temas",
	"theme": "Tema",
	"author": "Autor",
	"code": "Código del tema",
	"uninstall": "Desinstalar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"installedThemes": "Thèmes installés",
	"builtinThemes": "Thèmes intégrés",
	"manage": "Gestion des thèmes",
	"theme": "Thème",
	"author": "Auteur·rice",
	"code": "Code du thème",
	"uninstall": "Désinstaller"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"installedThemes": "Tema yang dipasang",
	"builtinThemes": "Tema bawaan",
	"manage": "Manajer tema",
	"theme": "Tema",
	"author": "Pembuat",
	"code": "Kode tema",
	"uninstall": "Copot pemasangan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"installedThemes": "Temi installati",
	"builtinThemes": "Temi integrati",
	"manage": "Gestione dei temi",
	"theme": "Tema",
	"author": "Autore",
	"code": "Codice tema",
	"uninstall": "Disinstalla"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"installedThemes": "インストールされたテーマ",
	"builtinThemes": "標準のテーマ",
	"manage": "テーマの管理",
	"theme": "テーマ",
	"author": "作者",
	"code": "テーマコード",
	"uninstall": "アンインストール"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"installedThemes": "インストールされとるテーマ",
	"builtinThemes": "標準のテーマ",
	"manage": "テーマの管理",
	"theme": "テーマ",
	"author": "作者",
	"code": "テーマコード",
	"uninstall": "アンインストール"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Themes",
	"author": "Author",
	"code": "Theme code",
	"uninstall": "Uninstall"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Themes",
	"author": "Author",
	"code": "Theme code",
	"uninstall": "Uninstall"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"installedThemes": "설치된 테마",
	"builtinThemes": "표준 테마",
	"manage": "테마 관리",
	"theme": "테마",
	"author": "작성자",
	"code": "테마 코드",
	"uninstall": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Thema's",
	"author": "Auteur",
	"code": "Theme code",
	"uninstall": "Deinstalleren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Temaer",
	"author": "Forfatter",
	"code": "Theme code",
	"uninstall": "Avinstaller"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"installedThemes": "Zainstalowane motywy",
	"builtinThemes": "Wbudowane motywy",
	"manage": "Zarządzanie motywami",
	"theme": "Motywy",
	"author": "Autor",
	"code": "Kod motywu",
	"uninstall": "Odinstaluj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"installedThemes": "Temas instalados",
	"builtinThemes": "Temas nativos",
	"manage": "Gerenciar temas",
	"theme": "Tema",
	"author": "Autor",
	"code": "Código do tema",
	"uninstall": "Desinstalar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"installedThemes": "Установленные темы",
	"builtinThemes": "Встроенные темы",
	"manage": "Менеджер тем",
	"theme": "Тема",
	"author": "Автор",
	"code": "Код темы",
	"uninstall": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"installedThemes": "Nainštalované témy",
	"builtinThemes": "Vstavané témy",
	"manage": "Spravovať témy",
	"theme": "Téma",
	"author": "Autor",
	"code": "Kód témy",
	"uninstall": "Odinštalovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"installedThemes": "ธีมที่ติดตั้ง",
	"builtinThemes": "ธีมในตัว",
	"manage": "จัดการธีม",
	"theme": "ธีม",
	"author": "ผู้เขียน",
	"code": "โค้ดธีม",
	"uninstall": "ถอนการติดตั้ง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"installedThemes": "Yüklü temalar",
	"builtinThemes": "Yerleşik temalar",
	"manage": "Temaları yönet",
	"theme": "Tema",
	"author": "Yazar",
	"code": "Tema kodu",
	"uninstall": "Kaldır"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"installedThemes": "Installed themes",
	"builtinThemes": "Built-in themes",
	"manage": "Manage themes",
	"theme": "Themes",
	"author": "Author",
	"code": "Theme code",
	"uninstall": "Uninstall"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"installedThemes": "Встановлені теми",
	"builtinThemes": "Вбудоваі теми",
	"manage": "Керування темами",
	"theme": "Тема",
	"author": "Автор",
	"code": "Код теми",
	"uninstall": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"installedThemes": "Theme đã cài đặt",
	"builtinThemes": "Theme tích hợp sẵn",
	"manage": "Quản lý theme",
	"theme": "Chủ đề",
	"author": "Tác giả",
	"code": "Mã theme",
	"uninstall": "Gỡ bỏ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"installedThemes": "已安装的主题",
	"builtinThemes": "标准主题",
	"manage": "主题管理",
	"theme": "主题",
	"author": "作者",
	"code": "主题代码",
	"uninstall": "卸载"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"installedThemes": "已經安裝的佈景主題",
	"builtinThemes": "標準佈景主題",
	"manage": "管理佈景主題",
	"theme": "佈景主題",
	"author": "作者",
	"code": "佈景主題代碼",
	"uninstall": "解除安裝"
}
</locale>
