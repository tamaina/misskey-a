<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="jqqmcavi">
			<MkButton v-if="pageId && author != null" class="button" inline type="routerLink" :to="`/@${ author.username }/pages/${ currentName }`"><i class="ti ti-external-link"></i> {{ $locale.sfc.pagesViewPage }}</MkButton>
			<MkButton v-if="!readonly" inline primary class="button" @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
			<MkButton v-if="pageId" inline class="button" @click="duplicate"><i class="ti ti-copy"></i> {{ $locale.sfc.duplicate }}</MkButton>
			<MkButton v-if="pageId && !readonly" inline class="button" danger @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
		</div>

		<div v-if="tab === 'settings'">
			<div class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ $locale.sfc.pagesTitle }}</template>
				</MkInput>

				<MkInput v-model="summary">
					<template #label>{{ $locale.sfc.pagesSummary }}</template>
				</MkInput>

				<MkInput v-model="name">
					<template #prefix>{{ url }}/@{{ author?.username ?? '???' }}/pages/</template>
					<template #label>{{ $locale.sfc.pagesUrl }}</template>
				</MkInput>

				<MkSwitch v-model="alignCenter">{{ $locale.sfc.pagesAlignCenter }}</MkSwitch>

				<MkSelect v-model="font" :items="fontDef">
					<template #label>{{ $locale.sfc.pagesFont }}</template>
				</MkSelect>

				<MkSwitch v-model="hideTitleWhenPinned">{{ $locale.sfc.pagesHideTitleWhenPinned }}</MkSwitch>

				<div class="eyeCatch">
					<MkButton v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage"><i class="ti ti-plus"></i> {{ $locale.sfc.pagesEyeCatchingImageSet }}</MkButton>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name" style="max-width: 100%;"/>
						<MkButton v-if="!readonly" @click="removeEyeCatchingImage()"><i class="ti ti-trash"></i> {{ $locale.sfc.pagesEyeCatchingImageRemove }}</MkButton>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="tab === 'contents'">
			<div :class="$style.contents">
				<XBlocks v-model="content" class="content"/>

				<MkButton v-if="!readonly" rounded class="add" @click="add()"><i class="ti ti-plus"></i></MkButton>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, provide, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import XBlocks from '@features/pages/frontend/pages/page-editor/page-editor.blocks.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { getPageBlockList } from '@features/pages/frontend/pages/page-editor/common.js';

const props = defineProps<{
	initPageId?: string;
	initPageName?: string;
	initUser?: string;
}>();

const tab = ref('settings');
const author = ref<Misskey.entities.User | null>($i);
const readonly = ref(false);
const page = ref<Misskey.entities.Page | null>(null);
const pageId = ref<string | null>(null);
const currentName = ref<string | null>(null);
const title = ref('');
const summary = ref<string | null>(null);
const name = ref(Date.now().toString());
const eyeCatchingImage = ref<Misskey.entities.DriveFile | null>(null);
const eyeCatchingImageId = ref<string | null>(null);
const {
	model: font,
	def: fontDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.pagesFontSansSerif, value: 'sans-serif' },
		{ label: $locale.value.sfc.pagesFontSerif, value: 'serif' },
	],
	initialValue: 'sans-serif',
});
const content = ref<Misskey.entities.Page['content']>([]);
const alignCenter = ref(false);
const hideTitleWhenPinned = ref(false);

provide('readonly', readonly.value);

watch(eyeCatchingImageId, async () => {
	if (eyeCatchingImageId.value == null) {
		eyeCatchingImage.value = null;
	} else {
		eyeCatchingImage.value = await misskeyApi('drive/files/show', {
			fileId: eyeCatchingImageId.value,
		});
	}
});

function getSaveOptions(): Misskey.entities.PagesCreateRequest {
	return {
		title: title.value.trim(),
		name: name.value.trim(),
		summary: summary.value,
		font: font.value,
		script: '',
		hideTitleWhenPinned: hideTitleWhenPinned.value,
		alignCenter: alignCenter.value,
		content: content.value,
		variables: [],
		eyeCatchingImageId: eyeCatchingImageId.value,
	};
}

async function save() {
	const options = getSaveOptions();

	if (pageId.value) {
		const updateOptions: Misskey.entities.PagesUpdateRequest = {
			pageId: pageId.value,
			...options,
		};

		await os.apiWithDialog('pages/update', updateOptions, undefined, {
			'2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab': {
				title: $locale.value.sfc.somethingHappened,
				text: $locale.value.sfc.pagesNameAlreadyExists,
			},
		});

		currentName.value = name.value.trim();
	} else {
		const created = await os.apiWithDialog('pages/create', options, undefined, {
			'4650348e-301c-499a-83c9-6aa988c66bc1': {
				title: $locale.value.sfc.somethingHappened,
				text: $locale.value.sfc.pagesNameAlreadyExists,
			},
		});

		pageId.value = created.id;
		currentName.value = name.value.trim();
		mainRouter.replace('/pages/edit/:initPageId', {
			params: {
				initPageId: pageId.value,
			},
		});
	}
}

async function del() {
	if (!pageId.value) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: title.value.trim() }),
	});

	if (canceled) return;

	await os.apiWithDialog('pages/delete', {
		pageId: pageId.value,
	});

	mainRouter.replace('/pages');
}

async function duplicate() {
	title.value = title.value + ' - copy';
	name.value = name.value + '-copy';

	const created = await os.apiWithDialog('pages/create', getSaveOptions(), undefined, {
		'4650348e-301c-499a-83c9-6aa988c66bc1': {
			title: $locale.value.sfc.somethingHappened,
			text: $locale.value.sfc.pagesNameAlreadyExists,
		},
	});

	pageId.value = created.id;
	currentName.value = name.value.trim();

	mainRouter.push('/pages/edit/:initPageId', {
		params: {
			initPageId: pageId.value,
		},
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		title: $locale.value.sfc.pagesChooseBlock,
		items: getPageBlockList(),
	});
	if (canceled || type == null) return;

	const id = genId();

	// TODO: page-editor.el.section.vueのと共通化
	if (type === 'text') {
		content.value.push({
			id,
			type,
			text: '',
		});
	} else if (type === 'section') {
		content.value.push({
			id,
			type,
			title: '',
			children: [],
		});
	} else if (type === 'image') {
		content.value.push({
			id,
			type,
			fileId: null,
		});
	} else if (type === 'note') {
		content.value.push({
			id,
			type,
			detailed: false,
			note: null,
		});
	}
}

function setEyeCatchingImage(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	}).then(file => {
		eyeCatchingImageId.value = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId.value = null;
}

async function init() {
	if (props.initPageId) {
		page.value = await misskeyApi('pages/show', {
			pageId: props.initPageId,
		});
	} else if (props.initPageName && props.initUser) {
		page.value = await misskeyApi('pages/show', {
			name: props.initPageName,
			username: props.initUser,
		});
		readonly.value = true;
	}

	if (page.value) {
		author.value = page.value.user;
		pageId.value = page.value.id;
		title.value = page.value.title;
		name.value = page.value.name;
		currentName.value = page.value.name;
		summary.value = page.value.summary;
		font.value = page.value.font;
		hideTitleWhenPinned.value = page.value.hideTitleWhenPinned;
		alignCenter.value = page.value.alignCenter;
		content.value = page.value.content;
		eyeCatchingImageId.value = page.value.eyeCatchingImageId;
	} else {
		const id = genId();
		content.value = [{
			id,
			type: 'text',
			text: 'Hello World!',
		}];
	}
}

init();

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'settings',
	title: $locale.value.sfc.pagesPageSetting,
	icon: 'ti ti-settings',
}, {
	key: 'contents',
	title: $locale.value.sfc.pagesContents,
	icon: 'ti ti-note',
}]);

definePage(() => ({
	title: props.initPageId ? $locale.value.sfc.pagesEditPage
	: props.initPageName && props.initUser ? $locale.value.sfc.pagesReadPage
	: $locale.value.sfc.pagesNewPage,
	icon: 'ti ti-pencil',
}));
</script>

<style lang="scss" module>
.contents {
	&:global {
		> .add {
			margin: 16px auto 0 auto;
		}
	}
}
</style>

<style lang="scss" scoped>
.jqqmcavi {
	margin-bottom: 16px;

	> .button {
		& + .button {
			margin-left: 8px;
		}
	}
}

.gwbmwxkm {
	position: relative;

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;

			> button {
				padding: 0;
				width: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}
		}
	}

	> section {
		padding: 0 32px 32px 32px;

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		> .view {
			display: inline-block;
			margin: 16px 0 0 0;
			font-size: 14px;
		}

		> .content {
			margin-bottom: 16px;
		}

		> .eyeCatch {
			margin-bottom: 16px;

			> div {
				> img {
					max-width: 100%;
				}
			}
		}
	}
}

.qmuvgica {
	padding: 16px;

	> .variables {
		margin-bottom: 16px;
	}

	> .add {
		margin-bottom: 16px;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pagesViewPage": "اعرض صفحاتك",
	"save": "حفظ",
	"duplicate": "Duplicate",
	"delete": "حذف",
	"pagesTitle": "العنوان",
	"pagesSummary": "ملخص الصفحة",
	"pagesUrl": "رابط الصفحة",
	"pagesAlignCenter": "توسيط العناصر",
	"pagesFont": "الخط",
	"pagesHideTitleWhenPinned": "اخف عنوان الصفحة عند تثبيتها في ملف الشخصي",
	"pagesEyeCatchingImageSet": "عيّن صورة مصغّرة",
	"pagesEyeCatchingImageRemove": "احذف صورة مصغّرة",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "حدث خطأ",
	"pagesNameAlreadyExists": "رابط الصفحة موجود مسبقًا",
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"pagesChooseBlock": "إضافة كتلة",
	"pagesPageSetting": "إعدادات الصفحة",
	"pagesContents": "المحتوى",
	"pagesEditPage": "عدّل الصفحة",
	"pagesReadPage": "نُشّط عرض المصدر",
	"pagesNewPage": "أنشئ صفحة جديدة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pagesViewPage": "Veure les teves pàgines ",
	"save": "Desa",
	"duplicate": "Duplicat",
	"delete": "Elimina",
	"pagesTitle": "Títol ",
	"pagesSummary": "Resum de la pàgina ",
	"pagesUrl": "URL de la pàgina ",
	"pagesAlignCenter": "Centrar elements",
	"pagesFont": "Lletra tipogràfica",
	"pagesHideTitleWhenPinned": "Amagar el títol de la pàgina quan estigui fixada al perfil",
	"pagesEyeCatchingImageSet": "Escull una miniatura",
	"pagesEyeCatchingImageRemove": "Esborrar la miniatura",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "S'ha produït un error",
	"pagesNameAlreadyExists": "L'adreça URL de la pàgina ja existeix",
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"pagesChooseBlock": "Afegeix un bloc",
	"pagesPageSetting": "Configuració de la pàgina",
	"pagesContents": "Contingut",
	"pagesEditPage": "Editar la pàgina",
	"pagesReadPage": "Veure el codi font d'aquesta pàgina",
	"pagesNewPage": "pa"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pagesViewPage": "Zobrazit své stránky",
	"save": "Uložit",
	"duplicate": "Duplikovat",
	"delete": "Smazat",
	"pagesTitle": "Titulek",
	"pagesSummary": "Přehled stránky",
	"pagesUrl": "URL stránky",
	"pagesAlignCenter": "Vycentrovat prvky",
	"pagesFont": "Písmo",
	"pagesHideTitleWhenPinned": "Skrytí názvu stránky při připnutí k profilu",
	"pagesEyeCatchingImageSet": "Nastavení miniatury",
	"pagesEyeCatchingImageRemove": "Smazání miniatury",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"pagesNameAlreadyExists": "Zadaná adresa URL stránky již existuje",
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"pagesChooseBlock": "Přidat blok",
	"pagesPageSetting": "Nastavení stránky",
	"pagesContents": "Obsah",
	"pagesEditPage": "Upravit stránku",
	"pagesReadPage": "Prohlížení zdroje této stránky",
	"pagesNewPage": "Vytvořit novou stránku"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pagesViewPage": "View your Pages",
	"save": "Save",
	"duplicate": "Duplicate",
	"delete": "Delete",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "An error has occurred",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Contents",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pagesViewPage": "Seite anschauen",
	"save": "Speichern",
	"duplicate": "Duplizieren",
	"delete": "Löschen",
	"pagesTitle": "Titel",
	"pagesSummary": "Zusammenfassung",
	"pagesUrl": "Seiten-URL",
	"pagesAlignCenter": "Zentrieren",
	"pagesFont": "Schriftart",
	"pagesHideTitleWhenPinned": "Seitentitel wenn angeheftet ausblenden",
	"pagesEyeCatchingImageSet": "Vorschaubild festlegen",
	"pagesEyeCatchingImageRemove": "Vorschaubild entfernen",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"pagesNameAlreadyExists": "Die angegebene Seiten-URL existiert bereits",
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"pagesChooseBlock": "Block hinzufügen",
	"pagesPageSetting": "Seiteneinstellungen",
	"pagesContents": "Inhalte",
	"pagesEditPage": "Seite bearbeiten",
	"pagesReadPage": "Quelltextansicht",
	"pagesNewPage": "Seite erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pagesViewPage": "View your Pages",
	"save": "Save",
	"duplicate": "Duplicate",
	"delete": "Delete",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "An error has occurred",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Contents",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pagesViewPage": "Ver página",
	"save": "Guardar",
	"duplicate": "Duplicar",
	"delete": "Borrar",
	"pagesTitle": "Título",
	"pagesSummary": "Resumen de la página",
	"pagesUrl": "URL de la página",
	"pagesAlignCenter": "Centrar",
	"pagesFont": "Fuente",
	"pagesHideTitleWhenPinned": "Ocultar el título de la página al fijarse",
	"pagesEyeCatchingImageSet": "Elegir imagen llamativa",
	"pagesEyeCatchingImageRemove": "Borrar imagen llamativa",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Ocurrió un error",
	"pagesNameAlreadyExists": "La URL de la página especificada ya existe",
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"pagesChooseBlock": "Agregar bloque",
	"pagesPageSetting": "Configurar página",
	"pagesContents": "Contenido",
	"pagesEditPage": "Editar página",
	"pagesReadPage": "Viendo la fuente",
	"pagesNewPage": "Crear página"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pagesViewPage": "Afficher la page",
	"save": "Enregistrer",
	"duplicate": "Duliquer",
	"delete": "Supprimer",
	"pagesTitle": "Titre",
	"pagesSummary": "Résumé de page",
	"pagesUrl": "URL de la page",
	"pagesAlignCenter": "Centrée",
	"pagesFont": "Police de caractères",
	"pagesHideTitleWhenPinned": "Masquer le titre de la page lorsque celle-ci est épinglée au profil",
	"pagesEyeCatchingImageSet": "Définir une image attractive",
	"pagesEyeCatchingImageRemove": "Supprimer la miniature",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Une erreur est survenue",
	"pagesNameAlreadyExists": "L'URL de page spécifiée existe déjà",
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"pagesChooseBlock": "Ajouter un bloc",
	"pagesPageSetting": "Paramètres de la Page",
	"pagesContents": "Contenu",
	"pagesEditPage": "Modifier une page",
	"pagesReadPage": "Affichage de la source en cours",
	"pagesNewPage": "Créer une page"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pagesViewPage": "Lihat Halaman",
	"save": "Simpan",
	"duplicate": "Duplikat",
	"delete": "Hapus",
	"pagesTitle": "Judul",
	"pagesSummary": "Ringkasan Halaman",
	"pagesUrl": "URL Halaman",
	"pagesAlignCenter": "Tengah",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Sembunyikan judul halaman saat disematkan ke profil",
	"pagesEyeCatchingImageSet": "Setel gambar yang menarik",
	"pagesEyeCatchingImageRemove": "Hapus gambar yang menarik",
	"pagesFontSansSerif": "Sans-serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Terjadi kesalahan",
	"pagesNameAlreadyExists": "URL Halaman yang ditentukan sudah ada",
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"pagesChooseBlock": "Tambahkan blokir",
	"pagesPageSetting": "Pengaturan Halaman",
	"pagesContents": "Konten",
	"pagesEditPage": "Sunting halaman",
	"pagesReadPage": "Lihat sumber kode aktif",
	"pagesNewPage": "Buat halaman baru"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pagesViewPage": "Visualizza pagina",
	"save": "Salva",
	"duplicate": "Duplica",
	"delete": "Elimina",
	"pagesTitle": "Titolo",
	"pagesSummary": "Riassunto di pagina",
	"pagesUrl": "URL della pagina",
	"pagesAlignCenter": "centrato",
	"pagesFont": "Tipo di carattere",
	"pagesHideTitleWhenPinned": "Nascondere il titolo pagina quando è fissata in cima al profilo.",
	"pagesEyeCatchingImageSet": "Imposta un'immagine attraente",
	"pagesEyeCatchingImageRemove": "Elimina immagine attraente",
	"pagesFontSansSerif": "Sans serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Si è verificato un problema",
	"pagesNameAlreadyExists": "Esiste già una pagina con lo stesso URL.",
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"pagesChooseBlock": "Aggiungi blocco",
	"pagesPageSetting": "Impostazioni pagina",
	"pagesContents": "Contenuto",
	"pagesEditPage": "Modifica pagina",
	"pagesReadPage": "Visualizzando fonte ",
	"pagesNewPage": "Crea pagina"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pagesViewPage": "ページを見る",
	"save": "保存",
	"duplicate": "複製",
	"delete": "削除",
	"pagesTitle": "タイトル",
	"pagesSummary": "ページの要約",
	"pagesUrl": "ページURL",
	"pagesAlignCenter": "中央寄せ",
	"pagesFont": "フォント",
	"pagesHideTitleWhenPinned": "ピン留めされているときにタイトルを非表示",
	"pagesEyeCatchingImageSet": "アイキャッチ画像を設定",
	"pagesEyeCatchingImageRemove": "アイキャッチ画像を削除",
	"pagesFontSansSerif": "サンセリフ",
	"pagesFontSerif": "セリフ",
	"somethingHappened": "問題が発生しました",
	"pagesNameAlreadyExists": "指定されたページURLは既に存在しています",
	"removeAreYouSure": "「{x}」を削除しますか？",
	"pagesChooseBlock": "ブロックを追加",
	"pagesPageSetting": "ページ設定",
	"pagesContents": "コンテンツ",
	"pagesEditPage": "ページの編集",
	"pagesReadPage": "ソースを表示中",
	"pagesNewPage": "ページの作成"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pagesViewPage": "ページを見る",
	"save": "とっとく",
	"duplicate": "複製",
	"delete": "ほかす",
	"pagesTitle": "タイトル",
	"pagesSummary": "ページの要約",
	"pagesUrl": "ページURL",
	"pagesAlignCenter": "中央寄せ",
	"pagesFont": "フォント",
	"pagesHideTitleWhenPinned": "ピン止めされてるときにタイトルを表示",
	"pagesEyeCatchingImageSet": "アイキャッチ画像を設定",
	"pagesEyeCatchingImageRemove": "アイキャッチ画像を削除",
	"pagesFontSansSerif": "サンセリフ",
	"pagesFontSerif": "セリフ",
	"somethingHappened": "なんかあかんわ",
	"pagesNameAlreadyExists": "指定されたページURLはもうあるみたいや",
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"pagesChooseBlock": "ブロックを追加",
	"pagesPageSetting": "ページ設定",
	"pagesContents": "コンテンツ",
	"pagesEditPage": "ページの編集",
	"pagesReadPage": "ソースを表示中",
	"pagesNewPage": "ページを作る"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pagesViewPage": "View your Pages",
	"save": "Sekles",
	"duplicate": "Duplicate",
	"delete": "Kkes",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Tasefsit",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Kkes tugna i d-ijebden",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "An error has occurred",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Agbur",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pagesViewPage": "View your Pages",
	"save": "ಉಳಿಸಿ",
	"duplicate": "Duplicate",
	"delete": "ಅಳಿಸು",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "An error has occurred",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Contents",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pagesViewPage": "페이지 보기",
	"save": "저장",
	"duplicate": "복제",
	"delete": "삭제",
	"pagesTitle": "제목",
	"pagesSummary": "페이지 요약",
	"pagesUrl": "페이지 URL",
	"pagesAlignCenter": "가운데 정렬",
	"pagesFont": "폰트",
	"pagesHideTitleWhenPinned": "프로필에 고정한 경우 타이틀을 표시하지 않음",
	"pagesEyeCatchingImageSet": "아이캐치 이미지를 설정",
	"pagesEyeCatchingImageRemove": "아이캐치 이미지를 삭제",
	"pagesFontSansSerif": "고딕체",
	"pagesFontSerif": "명조체",
	"somethingHappened": "오류가 발생했습니다",
	"pagesNameAlreadyExists": "지정한 페이지 URL이 이미 존재합니다",
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"pagesChooseBlock": "블록 추가",
	"pagesPageSetting": "페이지 설정",
	"pagesContents": "콘텐츠",
	"pagesEditPage": "페이지 수정",
	"pagesReadPage": "소스 표시 중",
	"pagesNewPage": "페이지 만들기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pagesViewPage": "View your Pages",
	"save": "Opslaan",
	"duplicate": "Dupliceren",
	"delete": "Verwijderen",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Er is iets misgegaan.",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Contents",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pagesViewPage": "View your Pages",
	"save": "Lagre",
	"duplicate": "Duplicate",
	"delete": "Slett",
	"pagesTitle": "Tittel",
	"pagesSummary": "Page summary",
	"pagesUrl": "Side URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Skjul sidetittel når festet til profil",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "En feil har oppstått",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Innhold",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pagesViewPage": "Wyświetlanie Twoich stron",
	"save": "Zapisz",
	"duplicate": "Duplikuj",
	"delete": "Usuń",
	"pagesTitle": "Tytuł",
	"pagesSummary": "Podsumowanie strony",
	"pagesUrl": "URL strony",
	"pagesAlignCenter": "Wyśrodkuj elementy",
	"pagesFont": "Czcionka",
	"pagesHideTitleWhenPinned": "Ukryj tytuł strony, gdy przypięta do profilu",
	"pagesEyeCatchingImageSet": "Ustaw przyciągające wzrok zdjęcie",
	"pagesEyeCatchingImageRemove": "Usuń przyciągające wzrok zdjęcie",
	"pagesFontSansSerif": "Bezszeryfowa",
	"pagesFontSerif": "Szeryfowa",
	"somethingHappened": "Coś poszło nie tak",
	"pagesNameAlreadyExists": "Określony adres URL strony już istnieje",
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"pagesChooseBlock": "Dodaj blok",
	"pagesPageSetting": "Ustawienia strony",
	"pagesContents": "Zawartość",
	"pagesEditPage": "Edytuj tę stronę",
	"pagesReadPage": "Aktywowano widok źródła",
	"pagesNewPage": "Utwórz stronę"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pagesViewPage": "Visualizar as suas páginas",
	"save": "Salvar",
	"duplicate": "Duplicar",
	"delete": "Excluir",
	"pagesTitle": "Título",
	"pagesSummary": "Resumo da página",
	"pagesUrl": "URL da Página",
	"pagesAlignCenter": "Centralizar elementos",
	"pagesFont": "Fonte",
	"pagesHideTitleWhenPinned": "Esconder título da Página quando fixado em perfil",
	"pagesEyeCatchingImageSet": "Escolher miniatura",
	"pagesEyeCatchingImageRemove": "Excluir miniatura",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Ocorreu um erro",
	"pagesNameAlreadyExists": "O URL de Página especificado já existe",
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"pagesChooseBlock": "Adicionar bloco",
	"pagesPageSetting": "Configurações da página",
	"pagesContents": "Conteúdo",
	"pagesEditPage": "Editar essa Página",
	"pagesReadPage": "Ver a fonte dessa Página",
	"pagesNewPage": "Criar uma Página"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pagesViewPage": "Смотреть страницы",
	"save": "Сохранить",
	"duplicate": "Дубликат",
	"delete": "Удалить",
	"pagesTitle": "Заголовок",
	"pagesSummary": "Краткое содержание",
	"pagesUrl": "Адрес страницы",
	"pagesAlignCenter": "Выровнять элементы по центру",
	"pagesFont": "Шрифт",
	"pagesHideTitleWhenPinned": "Скрыть заголовок страницы при привязке к профилю",
	"pagesEyeCatchingImageSet": "Добавить картинку для привлечения внимания",
	"pagesEyeCatchingImageRemove": "Убрать картинку для привлечения внимания",
	"pagesFontSansSerif": "Гротеск (без засечек)",
	"pagesFontSerif": "Антиква (с засечками)",
	"somethingHappened": "Что-то пошло не так",
	"pagesNameAlreadyExists": "Указанный адрес страницы уже существует.",
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"pagesChooseBlock": "Добавить блок",
	"pagesPageSetting": "Настройки страницы",
	"pagesContents": "Содержимое",
	"pagesEditPage": "Править страницу",
	"pagesReadPage": "Читать страницу",
	"pagesNewPage": "Создать страницу"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pagesViewPage": "Ukázať vaše stránky",
	"save": "Uložiť",
	"duplicate": "Duplikovať",
	"delete": "Odstrániť",
	"pagesTitle": "Nadpis",
	"pagesSummary": "Zhrnutie stránky",
	"pagesUrl": "URL stránky",
	"pagesAlignCenter": "Vystrediť prvky",
	"pagesFont": "Písmo",
	"pagesHideTitleWhenPinned": "Skryť nadpis stránky keď je pripnutá na profil",
	"pagesEyeCatchingImageSet": "Nastaviť miniatúru",
	"pagesEyeCatchingImageRemove": "Odstrániť miniatúru",
	"pagesFontSansSerif": "Bezpätkové",
	"pagesFontSerif": "Pätkové",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"pagesNameAlreadyExists": "Zadaná URL stránku už existuje",
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"pagesChooseBlock": "Pridať blok",
	"pagesPageSetting": "Nastavenia stránky",
	"pagesContents": "Obsah",
	"pagesEditPage": "Upraviť túto stránku",
	"pagesReadPage": "Zobrazenie zdroja aktívne",
	"pagesNewPage": "Vytvoriť novú stránku"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pagesViewPage": "ดูหน้าเพจ",
	"save": "บันทึก",
	"duplicate": "ทำซ้ำ",
	"delete": "ลบ",
	"pagesTitle": "หัวข้อ",
	"pagesSummary": "สรุปเพจ",
	"pagesUrl": "URL ของหน้า",
	"pagesAlignCenter": "เซ็นเตอร์",
	"pagesFont": "แบบอักษร",
	"pagesHideTitleWhenPinned": "ซ่อนชื่อหน้าเพจเมื่อปักหมุดไว้ที่โปรไฟล์",
	"pagesEyeCatchingImageSet": "ตั้งค่าภาพขนาดย่อ",
	"pagesEyeCatchingImageRemove": "ลบภาพขนาดย่อ",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"pagesNameAlreadyExists": "URL ของหน้าที่ระบุนั้นมีอยู่แล้ว",
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"pagesChooseBlock": "เพิ่มบล็อก",
	"pagesPageSetting": "การตั้งค่าหน้าเพจ",
	"pagesContents": "เนื้อหา",
	"pagesEditPage": "แก้ไขหน้าเพจ",
	"pagesReadPage": "กำลังดูแหล่งที่มาของเพจนี้",
	"pagesNewPage": "สร้างหน้าเพจใหม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pagesViewPage": "Sayfalarını görüntüle",
	"save": "Kaydet",
	"duplicate": "Çoğalt",
	"delete": "Sil",
	"pagesTitle": "Başlık",
	"pagesSummary": "Sayfa özeti",
	"pagesUrl": "Sayfa URL'si",
	"pagesAlignCenter": "Merkez öğeleri",
	"pagesFont": "Yazı tipi",
	"pagesHideTitleWhenPinned": "Profiline sabitlendiğinde sayfa başlığını gizle",
	"pagesEyeCatchingImageSet": "Küçük resmi ayarla",
	"pagesEyeCatchingImageRemove": "Küçük resmi sil",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Bir hata oluştu",
	"pagesNameAlreadyExists": "Belirtilen Sayfa URL'si zaten mevcut.",
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"pagesChooseBlock": "Blok ekle",
	"pagesPageSetting": "Sayfa ayarları",
	"pagesContents": "İçindekiler",
	"pagesEditPage": "Bu sayfayı düzenle",
	"pagesReadPage": "Bu Sayfanın Kaynağını Görüntüleme",
	"pagesNewPage": "Yeni bir Sayfa oluşturun"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pagesViewPage": "View your Pages",
	"save": "Save",
	"duplicate": "Duplicate",
	"delete": "ئۆچۈرۈش",
	"pagesTitle": "Title",
	"pagesSummary": "Page summary",
	"pagesUrl": "Page URL",
	"pagesAlignCenter": "Center elements",
	"pagesFont": "Font",
	"pagesHideTitleWhenPinned": "Hide Page title when pinned to profile",
	"pagesEyeCatchingImageSet": "Set thumbnail",
	"pagesEyeCatchingImageRemove": "Delete thumbnail",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "An error has occurred",
	"pagesNameAlreadyExists": "The specified Page URL already exists",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"pagesChooseBlock": "Add a block",
	"pagesPageSetting": "Page settings",
	"pagesContents": "Contents",
	"pagesEditPage": "Edit this Page",
	"pagesReadPage": "Viewing this Page's source",
	"pagesNewPage": "Create a new Page"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pagesViewPage": "Переглянути свої сторінки",
	"save": "Зберегти",
	"duplicate": "Дублікат",
	"delete": "Видалити",
	"pagesTitle": "Заголовок",
	"pagesSummary": "Короткий зміст",
	"pagesUrl": "URL сторінки",
	"pagesAlignCenter": "Рівняти елементи по центру",
	"pagesFont": "Шрифт",
	"pagesHideTitleWhenPinned": "Приховати заголовок сторінки при закріпленні в профілі",
	"pagesEyeCatchingImageSet": "Встановити привабливе зображення",
	"pagesEyeCatchingImageRemove": "Видалити привабливе зображення",
	"pagesFontSansSerif": "Sans serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Щось пішло не так",
	"pagesNameAlreadyExists": "Вказана адреса сторінки вже існує.",
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"pagesChooseBlock": "Додати блок",
	"pagesPageSetting": "Налаштування сторінки",
	"pagesContents": "Вміст",
	"pagesEditPage": "Редагувати сторінку",
	"pagesReadPage": "Перегляд вихідного коду",
	"pagesNewPage": "Створити сторінку"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pagesViewPage": "Xem trang của tôi",
	"save": "Lưu",
	"duplicate": "Tạo bản sao",
	"delete": "Xóa",
	"pagesTitle": "Tựa đề",
	"pagesSummary": "Mô tả Trang",
	"pagesUrl": "URL Trang",
	"pagesAlignCenter": "Căn giữa",
	"pagesFont": "Phông chữ",
	"pagesHideTitleWhenPinned": "Ẩn tựa đề Trang khi ghim lên hồ sơ",
	"pagesEyeCatchingImageSet": "Đặt ảnh thu nhỏ",
	"pagesEyeCatchingImageRemove": "Xóa ảnh thu nhỏ",
	"pagesFontSansSerif": "Sans Serif",
	"pagesFontSerif": "Serif",
	"somethingHappened": "Xảy ra lỗi",
	"pagesNameAlreadyExists": "URL Trang đã tồn tại",
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"pagesChooseBlock": "Thêm khối",
	"pagesPageSetting": "Cài đặt trang",
	"pagesContents": "Nội dung",
	"pagesEditPage": "Sửa Trang này",
	"pagesReadPage": "Xem mã nguồn Trang này",
	"pagesNewPage": "Tạo Trang mới"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pagesViewPage": "查看页面",
	"save": "保存",
	"duplicate": "复制",
	"delete": "删除",
	"pagesTitle": "标题",
	"pagesSummary": "页面摘要",
	"pagesUrl": "页面 URL",
	"pagesAlignCenter": "居中",
	"pagesFont": "字体",
	"pagesHideTitleWhenPinned": "置顶时隐藏标题",
	"pagesEyeCatchingImageSet": "设置封面图片",
	"pagesEyeCatchingImageRemove": "删除封面图片",
	"pagesFontSansSerif": "无衬线字体",
	"pagesFontSerif": "衬线字体",
	"somethingHappened": "出错了",
	"pagesNameAlreadyExists": "该页面 URL 已存在",
	"removeAreYouSure": "要删掉「{x}」吗？",
	"pagesChooseBlock": "添加内容块",
	"pagesPageSetting": "页面设置",
	"pagesContents": "内容",
	"pagesEditPage": "编辑页面",
	"pagesReadPage": "查看页面",
	"pagesNewPage": "创建页面"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pagesViewPage": "顯示頁面",
	"save": "儲存",
	"duplicate": "複製",
	"delete": "刪除",
	"pagesTitle": "標題",
	"pagesSummary": "頁面摘要",
	"pagesUrl": "頁面網址",
	"pagesAlignCenter": "置中",
	"pagesFont": "字型",
	"pagesHideTitleWhenPinned": "被置頂於個人資料時隱藏頁面標題",
	"pagesEyeCatchingImageSet": "設定封面影像",
	"pagesEyeCatchingImageRemove": "刪除封面影像",
	"pagesFontSansSerif": "無襯線體",
	"pagesFontSerif": "襯線體",
	"somethingHappened": "發生錯誤",
	"pagesNameAlreadyExists": "該頁面 URL 已存在",
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"pagesChooseBlock": "新增方塊",
	"pagesPageSetting": "頁面設定",
	"pagesContents": "內容",
	"pagesEditPage": "編輯頁面",
	"pagesReadPage": "正在檢視原始碼",
	"pagesNewPage": "建立頁面"
}
</locale>
