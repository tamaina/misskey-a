<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/navbar" :label="$locale.sfc.navbar" icon="ti ti-list" :keywords="['navbar', 'menu', 'sidebar']">
	<div class="_gaps_m">
		<FormSlot>
			<template #label>{{ $locale.sfc.navbar }}</template>
			<MkContainer :showHeader="false">
				<MkDraggable
					v-model="items"
					direction="vertical"
					manualDragStart
				>
					<template #default="{ item, dragStart }">
						<div
							v-if="item.type === '-' || navbarItemDef[item.type]"
							:class="$style.item"
						>
							<button class="_button" :class="$style.itemHandle" tabindex="-1" :draggable="true" @dragstart.stop="dragStart"><i class="ti ti-menu"></i></button>
							<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item.type]?.icon]"></i><span :class="$style.itemText">{{ navbarItemDef[item.type]?.title ?? $locale.sfc.divider }}</span>
							<button class="_button" :class="$style.itemRemove" @click="removeItem(item.id)"><i class="ti ti-x"></i></button>
						</div>
					</template>
				</MkDraggable>
			</MkContainer>
		</FormSlot>
		<div class="_buttons">
			<MkButton @click="addItem"><i class="ti ti-plus"></i> {{ $locale.sfc.addItem }}</MkButton>
			<MkButton danger @click="reset"><i class="ti ti-reload"></i> {{ $locale.sfc.default }}</MkButton>
			<MkButton primary class="save" @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
		</div>

		<MkRadios
			v-model="menuDisplay"
			:options="[
				{ value: 'sideFull', label: $locale.sfc.sideFull },
				{ value: 'sideIcon', label: $locale.sfc.sideIcon },
			]"
		>
			<template #label>{{ $locale.sfc.display }}</template>
		</MkRadios>

		<SearchMarker :keywords="['navbar', 'sidebar', 'toggle', 'button', 'sub']">
			<MkPreferenceContainer k="showNavbarSubButtons">
				<MkSwitch v-model="showNavbarSubButtons">
					<template #label><SearchLabel>{{ $locale.sfc.showNavbarSubButtons }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import * as os from '@features/ui/frontend/os.js';
import { navbarItemDef } from '@features/navigation/frontend/navbar.js';
import { store } from '@features/preferences/frontend/store.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { getInitialPrefValue } from '@features/preferences/frontend/state/manager.js';
import { genId } from '@features/runtime/frontend/utility/id.js';

const items = ref(prefer.s.menu.map(x => ({
	id: genId(),
	type: x,
})));
const itemTypeValues = computed(() => items.value.map(x => x.type));

const menuDisplay = store.model('menuDisplay');
const showNavbarSubButtons = prefer.model('showNavbarSubButtons');

async function addItem() {
	const menu = Object.keys(navbarItemDef).filter(k => !itemTypeValues.value.includes(k));
	const { canceled, result: item } = await os.select({
		title: $locale.value.sfc.addItem,
		items: [...menu.map(k => ({
			value: k, label: navbarItemDef[k].title,
		})), {
			value: '-', label: $locale.value.sfc.divider,
		}],
	});
	if (canceled || item == null) return;
	items.value = [...items.value, {
		id: genId(),
		type: item,
	}];
}

function removeItem(itemId: string) {
	items.value = items.value.filter(i => i.id !== itemId);
}

function save() {
	prefer.commit('menu', itemTypeValues.value);
	os.success();
}

function reset() {
	items.value = getInitialPrefValue('menu').map(x => ({
		id: genId(),
		type: x,
	}));
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.navbar,
	icon: 'ti ti-list',
}));
</script>

<style lang="scss" module>
.item {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--MI_THEME-navFg);
}

.itemIcon {
	position: relative;
	width: 32px;
	margin-right: 8px;
}

.itemText {
	position: relative;
	font-size: 0.9em;
}

.itemRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.itemHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"addItem": "إضافة عنصر",
	"divider": "فاصل",
	"navbar": "شريط التنقل",
	"default": "افتراضي",
	"save": "حفظ",
	"sideFull": "جانبي",
	"sideIcon": "Side (Icons)",
	"display": "المظهر",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"addItem": "Afegir element",
	"divider": "Divisor",
	"navbar": "Barra de navegació ",
	"default": "Per defecte",
	"save": "Desa",
	"sideFull": "Horitzontal ",
	"sideIcon": "Horitzontal (icones)",
	"display": "Veure",
	"showNavbarSubButtons": "Mostrar sub botons a la barra de navegació "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"addItem": "Přidat položku",
	"divider": "Dělící čára",
	"navbar": "Navigační panel",
	"default": "Výchozí",
	"save": "Uložit",
	"sideFull": "Postranně",
	"sideIcon": "Postranně (Ikony)",
	"display": "Zobrazit",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Default",
	"save": "Save",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"addItem": "Element hinzufügen",
	"divider": "Trenner",
	"navbar": "Navigationsleiste",
	"default": "Standard",
	"save": "Speichern",
	"sideFull": "Seitlich",
	"sideIcon": "Seitlich (Icons)",
	"display": "Anzeigeart",
	"showNavbarSubButtons": "Unterschaltflächen in der Navigationsleiste anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Default",
	"save": "Save",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"addItem": "Agregar elemento",
	"divider": "Divisor",
	"navbar": "Barra de navegación",
	"default": "Predeterminado",
	"save": "Guardar",
	"sideFull": "Horizontal",
	"sideIcon": "Horizontal (ícono)",
	"display": "Apariencia",
	"showNavbarSubButtons": "Mostrar los sub-botones en la barra de navegación."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"addItem": "Ajouter un élément",
	"divider": "Séparateur",
	"navbar": "Barre de navigation",
	"default": "Par défaut",
	"save": "Enregistrer",
	"sideFull": "Latéral",
	"sideIcon": "Latéral (icônes)",
	"display": "Affichage",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"addItem": "Tambahkan item",
	"divider": "Pembagi",
	"navbar": "Bilah navigasi",
	"default": "Bawaan",
	"save": "Simpan",
	"sideFull": "Horisontal",
	"sideIcon": "Horisontal (Ikon)",
	"display": "Tampilkan",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"addItem": "Aggiungi elemento",
	"divider": "Linea di separazione",
	"navbar": "Barra di navigazione",
	"default": "Predefinito",
	"save": "Salva",
	"sideFull": "Laterale",
	"sideIcon": "Laterale (solo icone)",
	"display": "Visualizza",
	"showNavbarSubButtons": "Mostra i pulsanti secondari nella barra di navigazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"addItem": "項目を追加",
	"divider": "分割線",
	"navbar": "ナビゲーションバー",
	"default": "デフォルト",
	"save": "保存",
	"sideFull": "横",
	"sideIcon": "横(アイコン)",
	"display": "表示",
	"showNavbarSubButtons": "ナビゲーションバーに副ボタンを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"addItem": "項目を追加",
	"divider": "分割線",
	"navbar": "ナビゲーションバー",
	"default": "デフォルト",
	"save": "とっとく",
	"sideFull": "横",
	"sideIcon": "横(アイコン)",
	"display": "表示",
	"showNavbarSubButtons": "ナビゲーションバーに副ボタンを表示"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Default",
	"save": "Sekles",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Default",
	"save": "ಉಳಿಸಿ",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"addItem": "항목 추가",
	"divider": "구분선",
	"navbar": "내비게이션 바",
	"default": "기본값",
	"save": "저장",
	"sideFull": "가로",
	"sideIcon": "가로(아이콘)",
	"display": "보기",
	"showNavbarSubButtons": "내비게이션 바에 보조 버튼 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"addItem": "Element toevoegen",
	"divider": "Scheider",
	"navbar": "Navigation bar",
	"default": "Standaard",
	"save": "Opslaan",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Weergave",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Standard",
	"save": "Lagre",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"addItem": "Dodaj element",
	"divider": "Rozdzielacz",
	"navbar": "Pasek nawigacyjny",
	"default": "Domyślne",
	"save": "Zapisz",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Wyświetlanie",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"addItem": "Adicionar item",
	"divider": "Separador",
	"navbar": "Barra de navegação",
	"default": "Predefinição",
	"save": "Salvar",
	"sideFull": "Exibir painel lateral inteiro",
	"sideIcon": "Lateral (Ícones)",
	"display": "Visualizar",
	"showNavbarSubButtons": "Mostrar sub-botões na barra de navegação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"addItem": "Добавить элемент",
	"divider": "Линия-разделитель",
	"navbar": "Панель навигации",
	"default": "По умолчанию",
	"save": "Сохранить",
	"sideFull": "Сбоку",
	"sideIcon": "Сбоку (только значки)",
	"display": "Отображение",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"addItem": "Pridať položku",
	"divider": "Oddeľovač",
	"navbar": "Navigačný panel",
	"default": "Predvolené",
	"save": "Uložiť",
	"sideFull": "Strana",
	"sideIcon": "Strana (Ikony)",
	"display": "Zobraziť",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"addItem": "เพิ่มรายการ",
	"divider": "ตัวแบ่ง",
	"navbar": "แถบนำทาง",
	"default": "ค่าเริ่มต้น",
	"save": "บันทึก",
	"sideFull": "ด้านข้าง",
	"sideIcon": "ด้านข้าง (ไอคอน)",
	"display": "แสดงผล",
	"showNavbarSubButtons": "แสดงปุ่มรองบนแถบนำทาง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"addItem": "Öğe Ekle",
	"divider": "Bölücü",
	"navbar": "Gezinti çubuğu",
	"default": "Varsayılan",
	"save": "Kaydet",
	"sideFull": "Yan",
	"sideIcon": "Yan (Simgeler)",
	"display": "Ekran",
	"showNavbarSubButtons": "Navigasyon çubuğunda alt düğmeleri göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"addItem": "Add Item",
	"divider": "Divider",
	"navbar": "Navigation bar",
	"default": "Default",
	"save": "Save",
	"sideFull": "Side",
	"sideIcon": "Side (Icons)",
	"display": "Display",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"addItem": "Додати елемент",
	"divider": "Розділювач",
	"navbar": "Рядок навігації",
	"default": "За умовчанням",
	"save": "Зберегти",
	"sideFull": "Збоку",
	"sideIcon": "Збоку (значки)",
	"display": "Відображення",
	"showNavbarSubButtons": "Показувати додаткові кнопки на панелі навігації"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"addItem": "Thêm mục",
	"divider": "Phân chia",
	"navbar": "Thanh điều hướng",
	"default": "Mặc định",
	"save": "Lưu",
	"sideFull": "Thanh bên",
	"sideIcon": "Thanh bên (Biểu tượng)",
	"display": "Hiển thị",
	"showNavbarSubButtons": "Show sub-buttons on the navigation bar"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"addItem": "添加项目",
	"divider": "分割线",
	"navbar": "导航栏",
	"default": "默认",
	"save": "保存",
	"sideFull": "横向",
	"sideIcon": "横向（图标）",
	"display": "显示",
	"showNavbarSubButtons": "在导航栏中显示副按钮"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"addItem": "新增項目",
	"divider": "分隔線",
	"navbar": "導覽列",
	"default": "預設",
	"save": "儲存",
	"sideFull": "橫向",
	"sideIcon": "橫向（圖示）",
	"display": "檢視",
	"showNavbarSubButtons": "在導覽列顯示輔助按鈕"
}
</locale>
