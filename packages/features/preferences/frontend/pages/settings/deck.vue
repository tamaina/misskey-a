<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/deck" :label="$locale.sfc.deck" :keywords="['deck', 'ui']" icon="ti ti-columns">
	<div class="_gaps_m">
		<SearchMarker :keywords="['sync', 'profiles', 'devices']">
			<MkSwitch :modelValue="profilesSyncEnabled" @update:modelValue="changeProfilesSyncEnabled">
				<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.enableSyncBetweenDevicesForProfiles }}</SearchLabel></template>
			</MkSwitch>
		</SearchMarker>

		<hr>

		<SearchMarker :keywords="['ui', 'root', 'page']">
			<MkPreferenceContainer k="deck.useSimpleUiForNonRootPages">
				<MkSwitch v-model="useSimpleUiForNonRootPages">
					<template #label><SearchLabel>{{ $locale.sfc.useSimpleUiForNonRootPages }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['default', 'navigation', 'behaviour', 'window']">
			<MkPreferenceContainer k="deck.navWindow">
				<MkSwitch v-model="navWindow">
					<template #label><SearchLabel>{{ $locale.sfc.defaultNavigationBehaviour }}</SearchLabel>: {{ $locale.sfc.openInWindow }}</template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['always', 'show', 'main', 'column']">
			<MkPreferenceContainer k="deck.alwaysShowMainColumn">
				<MkSwitch v-model="alwaysShowMainColumn">
					<template #label><SearchLabel>{{ $locale.sfc.alwaysShowMainColumn }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['column', 'align']">
			<MkPreferenceContainer k="deck.columnAlign">
				<MkRadios
					v-model="columnAlign"
					:options="[
						{ value: 'left', label: $locale.sfc.left },
						{ value: 'center', label: $locale.sfc.center },
					]"
				>
					<template #label><SearchLabel>{{ $locale.sfc.columnAlign }}</SearchLabel></template>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['menu', 'position']">
			<MkPreferenceContainer k="deck.menuPosition">
				<MkRadios
					v-model="menuPosition"
					:options="[
						{ value: 'right', label: $locale.sfc.right },
						{ value: 'bottom', label: $locale.sfc.bottom },
					]"
				>
					<template #label><SearchLabel>{{ $locale.sfc.deckMenuPosition }}</SearchLabel></template>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['navbar', 'position']">
			<MkPreferenceContainer k="deck.navbarPosition">
				<MkRadios
					v-model="navbarPosition"
					:options="[
						{ value: 'left', label: $locale.sfc.left },
						{ value: 'top', label: $locale.sfc.top },
						{ value: 'bottom', label: $locale.sfc.bottom },
					]"
				>
					<template #label><SearchLabel>{{ $locale.sfc.navbarPosition }}</SearchLabel></template>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['column', 'gap', 'margin']">
			<MkPreferenceContainer k="deck.columnGap">
				<MkRange v-model="columnGap" :min="3" :max="100" :step="1" :continuousUpdate="true">
					<template #label><SearchLabel>{{ $locale.sfc.columnGap }}</SearchLabel></template>
				</MkRange>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['wallpaper']">
			<MkPreferenceContainer k="deck.wallpaper">
				<MkButton v-if="wallpaper == null" @click="setWallpaper"><SearchLabel>{{ $locale.sfc.setWallpaper }}</SearchLabel></MkButton>
				<MkButton v-else @click="wallpaper = null">{{ $locale.sfc.removeWallpaper }}</MkButton>
			</MkPreferenceContainer>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { suggestReload } from '@features/boot/frontend/utility/reload-suggest.js';

const navWindow = prefer.model('deck.navWindow');
const useSimpleUiForNonRootPages = prefer.model('deck.useSimpleUiForNonRootPages');
const alwaysShowMainColumn = prefer.model('deck.alwaysShowMainColumn');
const columnAlign = prefer.model('deck.columnAlign');
const columnGap = prefer.model('deck.columnGap');
const menuPosition = prefer.model('deck.menuPosition');
const navbarPosition = prefer.model('deck.navbarPosition');
const wallpaper = prefer.model('deck.wallpaper');

watch(wallpaper, () => {
	suggestReload();
});

function setWallpaper(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	}).then(file => {
		wallpaper.value = file.url;
	});
}

const profilesSyncEnabled = ref(prefer.isSyncEnabled('deck.profiles'));

function changeProfilesSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('deck.profiles').then((res) => {
			if (res == null) return;
			if (res.enabled) profilesSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('deck.profiles');
		profilesSyncEnabled.value = false;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.deck,
	icon: 'ti ti-columns',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "سلوك الملاحة الافتراضي",
	"openInWindow": "افتح في نافذة جديدة",
	"alwaysShowMainColumn": "أظهر العمود الأساسي دائمًا",
	"left": "يسار",
	"center": "وسط",
	"columnAlign": "محاذاة الأعمدة",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "عيّن خلفية",
	"removeWallpaper": "أزل الخلفية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"deck": "Escriptori",
	"enableSyncBetweenDevicesForProfiles": "Activar la sincronització de la informació de perfils de dispositiu a dispositiu",
	"useSimpleUiForNonRootPages": "Usa una interfície senzilla per a les pàgines navegades",
	"defaultNavigationBehaviour": "Navegació per defecte",
	"openInWindow": "Obrir en una finestra nova",
	"alwaysShowMainColumn": "Mostrar sempre la columna principal",
	"left": "Esquerra",
	"center": "Centre",
	"columnAlign": "Alinea les columnes",
	"right": "Dreta",
	"bottom": "A baix ",
	"deckMenuPosition": "Posició del menú del tauler",
	"top": "A dalt ",
	"navbarPosition": "Posició de la barra de navegació ",
	"columnGap": "Espai entre columnes",
	"setWallpaper": "Defineix el fons de pantalla",
	"removeWallpaper": "Elimina el fons de pantalla"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Použít zjednodušené uživatelské rozhraní pro navigaci na stránkách",
	"defaultNavigationBehaviour": "Výchozí chování navigace",
	"openInWindow": "Otevřít v novém okně",
	"alwaysShowMainColumn": "Vždy zobrazovat hlavní sloupec",
	"left": "Vlevo",
	"center": "Uprostřed",
	"columnAlign": "Zarovnat sloupce",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Nastavení obrázku na pozadí",
	"removeWallpaper": "Odstranit pozadí"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Open in window",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Left",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Aktivieren der Synchronisierung von Profilinformationen zwischen Geräten",
	"useSimpleUiForNonRootPages": "Simple Benutzeroberfläche für navigierte Seiten verwenden",
	"defaultNavigationBehaviour": "Standardnavigationsverhalten",
	"openInWindow": "In einem Fenster öffnen",
	"alwaysShowMainColumn": "Hauptspalte immer zeigen",
	"left": "Links",
	"center": "Mittig",
	"columnAlign": "Spaltenausrichtung",
	"right": "Rechts",
	"bottom": "Unten",
	"deckMenuPosition": "Position des Deck-Menüs",
	"top": "Oben",
	"navbarPosition": "Position der Navigationsleiste",
	"columnGap": "Spaltenabstand",
	"setWallpaper": "Hintergrund festlegen",
	"removeWallpaper": "Hintergrund entfernen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Open in window",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Left",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Activar la sincronización de la información de perfiles entre dispositivos.",
	"useSimpleUiForNonRootPages": "Mostrar páginas no pertenecientes a la raíz con la interfaz simple",
	"defaultNavigationBehaviour": "Navegación por defecto",
	"openInWindow": "Abrir en una ventana",
	"alwaysShowMainColumn": "Siempre mostrar la columna principal",
	"left": "Izquierda",
	"center": "Centrar",
	"columnAlign": "Alinear columnas",
	"right": "Derecha",
	"bottom": "Abajo",
	"deckMenuPosition": "Posición del menú Deck",
	"top": "Arriba",
	"navbarPosition": "Posición de la barra de navegación",
	"columnGap": "Margen entre columnas",
	"setWallpaper": "Establecer fondo de pantalla",
	"removeWallpaper": "Quitar fondo de pantalla"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Navigation par défaut",
	"openInWindow": "Ouvrir dans une nouvelle fenêtre",
	"alwaysShowMainColumn": "Toujours afficher la colonne principale",
	"left": "Gauche",
	"center": "Centrer",
	"columnAlign": "Aligner les colonnes",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Définir le fond d’écran",
	"removeWallpaper": "Supprimer le fond d’écran"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"deck": "Dek",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Gunakan antarmuka sederhana ke halaman yang dituju",
	"defaultNavigationBehaviour": "Navigasi bawaan",
	"openInWindow": "Buka di jendela",
	"alwaysShowMainColumn": "Selalu tampilkan kolom utama",
	"left": "Kiri",
	"center": "Tengah",
	"columnAlign": "Luruskan kolom",
	"right": "Kanan",
	"bottom": "Bawah",
	"deckMenuPosition": "Deck menu position",
	"top": "Atas",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Atur wallpaper",
	"removeWallpaper": "Hapus wallpaper"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Abilita la sincronizzazione delle informazioni profilo tra dispositivi",
	"useSimpleUiForNonRootPages": "Visualizza sotto pagine con interfaccia web semplice",
	"defaultNavigationBehaviour": "Tipo di navigazione predefinita",
	"openInWindow": "Apri in una finestra",
	"alwaysShowMainColumn": "Mostrare sempre la colonna Principale",
	"left": "Sinistra",
	"center": "Centro",
	"columnAlign": "Allineamento delle colonne",
	"right": "Destra",
	"bottom": "Sotto",
	"deckMenuPosition": "Posizione del menu Deck",
	"top": "Sopra",
	"navbarPosition": "Posizione barra di navigazione",
	"columnGap": "Spessore del margine tra colonne",
	"setWallpaper": "Imposta sfondo",
	"removeWallpaper": "Elimina lo sfondo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"deck": "デッキ",
	"enableSyncBetweenDevicesForProfiles": "プロファイル情報のデバイス間同期を有効にする",
	"useSimpleUiForNonRootPages": "非ルートページは簡易UIで表示",
	"defaultNavigationBehaviour": "デフォルトのナビゲーション",
	"openInWindow": "ウィンドウで開く",
	"alwaysShowMainColumn": "常にメインカラムを表示",
	"left": "左",
	"center": "中央",
	"columnAlign": "カラムの寄せ",
	"right": "右",
	"bottom": "下",
	"deckMenuPosition": "デッキメニューの位置",
	"top": "上",
	"navbarPosition": "ナビゲーションバーの位置",
	"columnGap": "カラム間のマージン",
	"setWallpaper": "壁紙を設定",
	"removeWallpaper": "壁紙を削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"deck": "デッキ",
	"enableSyncBetweenDevicesForProfiles": "プロファイル情報のデバイス間同期を有効にする",
	"useSimpleUiForNonRootPages": "非ルートページは簡易UIで表示",
	"defaultNavigationBehaviour": "デフォルトのナビゲーション",
	"openInWindow": "ウィンドウで開く",
	"alwaysShowMainColumn": "いつもメインカラムを表示",
	"left": "左",
	"center": "真ん中",
	"columnAlign": "カラムの寄せ",
	"right": "右",
	"bottom": "下",
	"deckMenuPosition": "デッキメニューの位置",
	"top": "上",
	"navbarPosition": "ナビゲーションバーの位置",
	"columnGap": "カラム間のマージン",
	"setWallpaper": "壁紙を設定",
	"removeWallpaper": "壁紙ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Open in window",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Left",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Open in window",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Left",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"deck": "덱",
	"enableSyncBetweenDevicesForProfiles": "프로파일 정보의 장치 간 동기화를 활성화",
	"useSimpleUiForNonRootPages": "루트 이외의 페이지로 접속한 경우 UI 간략화하기",
	"defaultNavigationBehaviour": "기본 탐색 동작",
	"openInWindow": "창으로 열기",
	"alwaysShowMainColumn": "메인 칼럼 항상 표시",
	"left": "왼쪽",
	"center": "가운데",
	"columnAlign": "칼럼 정렬",
	"right": "오른쪽",
	"bottom": "아래",
	"deckMenuPosition": "덱 메뉴 위치",
	"top": "위",
	"navbarPosition": "내비게이션 바 위치",
	"columnGap": "칼럼 간 여백",
	"setWallpaper": "배경 설정",
	"removeWallpaper": "배경 제거"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"deck": "Dek",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Standaard navigatie gedrag",
	"openInWindow": "In een venster openen",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Links",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Achtergrond instellen",
	"removeWallpaper": "Achtergrond verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Åpne i vindu",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Venstre",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"deck": "Tablica",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Domyślne zachowanie nawigacji",
	"openInWindow": "Otwórz w oknie",
	"alwaysShowMainColumn": "Zawsze pokazuj główną kolumnę",
	"left": "Lewo",
	"center": "Wyśsrodkuj",
	"columnAlign": "Wyrównaj kolumny",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Ustaw tapetę",
	"removeWallpaper": "Usuń tapetę"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Habilitar sincronização das informações do perfil entre dispositivos",
	"useSimpleUiForNonRootPages": "Usar UI simples para páginas navegadas",
	"defaultNavigationBehaviour": "Navegação padrão",
	"openInWindow": "Abrir em um janela",
	"alwaysShowMainColumn": "Sempre mostrar a coluna principal",
	"left": "Esquerda",
	"center": "Centralizar",
	"columnAlign": "Alinhar colunas",
	"right": "Direita",
	"bottom": "Inferior",
	"deckMenuPosition": "Posição do menu do deck",
	"top": "Superior",
	"navbarPosition": "Posição da barra de navegação",
	"columnGap": "Margem entre colunas",
	"setWallpaper": "Definir papel de parede",
	"removeWallpaper": "Remover papel de parede"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"deck": "Пульт",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Поведение навигации по умолчанию",
	"openInWindow": "Открыть в плавающем окне",
	"alwaysShowMainColumn": "Всегда показывать главную колонку",
	"left": "Слева",
	"center": "По центру",
	"columnAlign": "Выравнивание колонок",
	"right": "Справа",
	"bottom": "Снизу",
	"deckMenuPosition": "Deck menu position",
	"top": "Сверху",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Установить обои",
	"removeWallpaper": "Удалить обои"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Predvolené správanie navigácie",
	"openInWindow": "Otvoriť v novom okne",
	"alwaysShowMainColumn": "Vždy zobraziť v hlavnom stĺpci",
	"left": "Naľavo",
	"center": "Stred",
	"columnAlign": "Zarovnať stĺpce",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Nastaviť tapetu",
	"removeWallpaper": "Odstrániť tapetu"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"deck": "เด็ค",
	"enableSyncBetweenDevicesForProfiles": "เปิดใช้งานการซิงค์ข้อมูลโปรไฟล์ระหว่างอุปกรณ์",
	"useSimpleUiForNonRootPages": "แสดง UI ของ Root Page อย่างง่าย ",
	"defaultNavigationBehaviour": "พฤติกรรมการนำทางที่เป็นค่าเริ่มต้น",
	"openInWindow": "เปิดในหน้าต่าง",
	"alwaysShowMainColumn": "แสดงคอลัมน์หลักเสมอ",
	"left": "ซ้าย",
	"center": "กึ่งกลาง",
	"columnAlign": "จัดแนวคอลัมน์",
	"right": "ขวา",
	"bottom": "ล่าง",
	"deckMenuPosition": "ตำแหน่งเมนูเด็ค",
	"top": "บน",
	"navbarPosition": "ตำแหน่งของแถบนำทาง",
	"columnGap": "ช่องห่างระว่างคอลัมน์",
	"setWallpaper": "ตั้งค่าภาพพื้นหลัง",
	"removeWallpaper": "นำภาพพื้นหลังออก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Cihazlar arasında profil bilgilerinin senkronizasyonunu etkinleştir",
	"useSimpleUiForNonRootPages": "Gezinilen sayfalar için basit kullanıcı arayüzü kullanın",
	"defaultNavigationBehaviour": "Varsayılan gezinme davranışı",
	"openInWindow": "Pencerede aç",
	"alwaysShowMainColumn": "Ana sütunu her zaman göster",
	"left": "Sol",
	"center": "Merkez",
	"columnAlign": "Sütunları hizala",
	"right": "Sağ",
	"bottom": "Alt",
	"deckMenuPosition": "Sütunlar arasındaki kenar boşluğu",
	"top": "Üst",
	"navbarPosition": "Gezinti çubuğu konumu",
	"columnGap": "Sütunlar arasındaki kenar boşluğu",
	"setWallpaper": "Duvar kağıdını ayarla",
	"removeWallpaper": "Duvar kağıdını kaldır"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Default navigation behavior",
	"openInWindow": "Open in window",
	"alwaysShowMainColumn": "Always show main column",
	"left": "Left",
	"center": "Center",
	"columnAlign": "Align columns",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Set wallpaper",
	"removeWallpaper": "Remove wallpaper"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"deck": "Дек",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Поведінка навігації за замовчуванням",
	"openInWindow": "Відкрити у вікні",
	"alwaysShowMainColumn": "Завжди показувати головну колонку",
	"left": "Лівий",
	"center": "Центр",
	"columnAlign": "Вирівняти стовпці",
	"right": "Праворуч",
	"bottom": "Зверху",
	"deckMenuPosition": "Deck menu position",
	"top": "Знизу",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Встановити шпалери",
	"removeWallpaper": "Прибрати шпалери"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "Enable profile information sync between devices",
	"useSimpleUiForNonRootPages": "Use simple UI for navigated pages",
	"defaultNavigationBehaviour": "Thao tác điều hướng mặc định",
	"openInWindow": "Mở trong cửa sổ mới",
	"alwaysShowMainColumn": "Luôn hiện cột chính",
	"left": "Bên trái",
	"center": "Giữa",
	"columnAlign": "Căn cột",
	"right": "Right",
	"bottom": "Bottom",
	"deckMenuPosition": "Deck menu position",
	"top": "Top",
	"navbarPosition": "Navigation bar position",
	"columnGap": "Margin between columns",
	"setWallpaper": "Đặt ảnh bìa",
	"removeWallpaper": "Xóa ảnh bìa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"deck": "Deck",
	"enableSyncBetweenDevicesForProfiles": "启用配置文件跨设备同步",
	"useSimpleUiForNonRootPages": "使用简易UI显示导航页面",
	"defaultNavigationBehaviour": "默认导航",
	"openInWindow": "在新窗口中打开",
	"alwaysShowMainColumn": "总是显示主列",
	"left": "左",
	"center": "居中",
	"columnAlign": "列对齐",
	"right": "右",
	"bottom": "下",
	"deckMenuPosition": "Deck 菜单位置",
	"top": "上",
	"navbarPosition": "导航栏位置",
	"columnGap": "列间距",
	"setWallpaper": "设置壁纸",
	"removeWallpaper": "移除壁纸"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"deck": "多欄模式",
	"enableSyncBetweenDevicesForProfiles": "啟用裝置與裝置之間的設定檔資料同步化",
	"useSimpleUiForNonRootPages": "用簡易介面顯示非根頁面",
	"defaultNavigationBehaviour": "預設導航",
	"openInWindow": "在新視窗開啟",
	"alwaysShowMainColumn": "總是顯示主欄",
	"left": "左",
	"center": "置中",
	"columnAlign": "對齊欄位",
	"right": "右",
	"bottom": "下",
	"deckMenuPosition": "多欄模式的選單位置",
	"top": "上",
	"navbarPosition": "導覽列位置",
	"columnGap": "欄與欄之間的邊距",
	"setWallpaper": "設定桌布",
	"removeWallpaper": "移除桌布"
}
</locale>
