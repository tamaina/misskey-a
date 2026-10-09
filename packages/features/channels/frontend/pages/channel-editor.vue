<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="channelId == null || channel != null" class="_gaps_m">
			<MkInput v-model="name">
				<template #label>{{ $locale.sfc.name }}</template>
			</MkInput>

			<MkTextarea v-model="description" mfmAutocomplete :mfmPreview="true">
				<template #label>{{ $locale.sfc.description }}</template>
			</MkTextarea>

			<MkColorInput v-model="color">
				<template #label>{{ $locale.sfc.color }}</template>
			</MkColorInput>

			<MkSwitch v-model="isSensitive">
				<template #label>{{ $locale.sfc.sensitive }}</template>
			</MkSwitch>

			<MkSwitch v-model="allowRenoteToExternal">
				<template #label>{{ $locale.sfc.channelAllowRenoteToExternal }}</template>
			</MkSwitch>

			<div>
				<MkButton v-if="bannerId == null" @click="setBannerImage"><i class="ti ti-plus"></i> {{ $locale.sfc.channelSetBanner }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><i class="ti ti-trash"></i> {{ $locale.sfc.channelRemoveBanner }}</MkButton>
				</div>
			</div>

			<MkFolder :defaultOpen="true">
				<template #label>{{ $locale.sfc.pinnedNotes }}</template>

				<div class="_gaps">
					<MkButton primary rounded @click="addPinnedNote()"><i class="ti ti-plus"></i></MkButton>

					<MkDraggable
						:modelValue="pinnedNoteIds.map(id => ({ id }))"
						direction="vertical"
						manualDragStart
						@update:modelValue="v => pinnedNoteIds = v.map(x => x.id)"
					>
						<template #default="{ item, dragStart }">
							<div :class="$style.pinnedNote">
								<button class="_button" :class="$style.pinnedNoteHandle" tabindex="-1" :draggable="true" @dragstart.stop="dragStart"><i class="ti ti-menu"></i></button>
								{{ item.id }}
								<button class="_button" :class="$style.pinnedNoteRemove" @click="removePinnedNote(item.id)"><i class="ti ti-x"></i></button>
							</div>
						</template>
					</MkDraggable>
				</div>
			</MkFolder>

			<div class="_buttons">
				<MkButton primary @click="save()"><i class="ti ti-device-floppy"></i> {{ channelId ? $locale.sfc.save : $locale.sfc.create }}</MkButton>
				<MkButton v-if="channelId" danger @click="archive()"><i class="ti ti-trash"></i> {{ $locale.sfc.archive }}</MkButton>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkColorInput from '@features/ui/frontend/components/MkColorInput.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	channelId?: string;
}>();

const channel = ref<Misskey.entities.Channel | null>(null);
const name = ref<string>('');
const description = ref<string | null>(null);
const bannerUrl = ref<string | null>(null);
const bannerId = ref<string | null>(null);
const color = ref('#000');
const isSensitive = ref(false);
const allowRenoteToExternal = ref(true);
const pinnedNoteIds = ref<Misskey.entities.Note['id'][]>([]);

watch(() => bannerId.value, async () => {
	if (bannerId.value == null) {
		bannerUrl.value = null;
	} else {
		bannerUrl.value = (await misskeyApi('drive/files/show', {
			fileId: bannerId.value,
		})).url;
	}
});

async function fetchChannel() {
	if (props.channelId == null) return;

	const result = await misskeyApi('channels/show', {
		channelId: props.channelId,
	});

	name.value = result.name;
	description.value = result.description;
	bannerId.value = result.bannerId;
	bannerUrl.value = result.bannerUrl;
	isSensitive.value = result.isSensitive;
	pinnedNoteIds.value = result.pinnedNoteIds;
	color.value = result.color;
	allowRenoteToExternal.value = result.allowRenoteToExternal;

	channel.value = result;
}

fetchChannel();

async function addPinnedNote() {
	const { canceled, result: value } = await os.inputText({
		title: $locale.value.sfc.noteIdOrUrl,
	});
	if (canceled || value == null) return;
	const fromUrl = value.includes('/') ? value.split('/').pop() : null;
	const note = await os.apiWithDialog('notes/show', {
		noteId: fromUrl ?? value,
	});
	pinnedNoteIds.value.unshift(note.id);
}

function removePinnedNote(id: string) {
	pinnedNoteIds.value = pinnedNoteIds.value.filter(x => x !== id);
}

function save() {
	const params = {
		name: name.value,
		description: description.value,
		bannerId: bannerId.value,
		color: color.value,
		isSensitive: isSensitive.value,
		allowRenoteToExternal: allowRenoteToExternal.value,
	} satisfies Misskey.entities.ChannelsCreateRequest;

	if (props.channelId != null) {
		os.apiWithDialog('channels/update', {
			...params,
			channelId: props.channelId,
			pinnedNoteIds: pinnedNoteIds.value,
		});
	} else {
		os.apiWithDialog('channels/create', params).then(created => {
			router.push('/channels/:channelId', {
				params: {
					channelId: created.id,
				},
			});
		});
	}
}

async function archive() {
	if (props.channelId == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: interpolateLocaleParameters($locale.value.sfc.channelArchiveConfirmTitle, { name: name.value }),
		text: $locale.value.sfc.channelArchiveConfirmDescription,
	});
	if (canceled) return;

	misskeyApi('channels/update', {
		channelId: props.channelId,
		isArchived: true,
	}).then(() => {
		os.success();
	});
}

function setBannerImage(evt: PointerEvent) {
	selectFile({
		anchorElement: evt.currentTarget ?? evt.target,
		multiple: false,
	}).then(file => {
		bannerId.value = file.id;
	});
}

function removeBannerImage() {
	bannerId.value = null;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: props.channelId ? $locale.value.sfc.channelEdit : $locale.value.sfc.channelCreate,
	icon: 'ti ti-device-tv',
}));
</script>

<style lang="scss" module>
.pinnedNote {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--MI_THEME-navFg);
}

.pinnedNoteRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.pinnedNoteHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"name": "الإسم",
	"description": "الوصف",
	"color": "اللون",
	"sensitive": "محتوى حساس",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "عيّن اللافتة",
	"channelRemoveBanner": "أزل اللافتة",
	"pinnedNotes": "ملاحظة مثبتة",
	"save": "حفظ",
	"create": "أنشئ",
	"archive": "الأرشيف",
	"noteIdOrUrl": "معرف الملاحظة أو رابطها",
	"channelArchiveConfirmTitle": "أتريد أرشفت {name}؟",
	"channelArchiveConfirmDescription": "لن يمكنك نشر ملاحظات في القناة المأرشفة ولن تظهر في قائمة القنوات ولا في نتائج البحث.",
	"channelEdit": "عدّل قناة",
	"channelCreate": "أنشئ قناة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"name": "Nom",
	"description": "Descripció",
	"color": "Color",
	"sensitive": "Sensible",
	"channelAllowRenoteToExternal": "Permet la citació i l'impuls fora del canal",
	"channelSetBanner": "Estableix el bàner ",
	"channelRemoveBanner": "Eliminar el.bàner",
	"pinnedNotes": "Nota fixada",
	"save": "Desa",
	"create": "Crear",
	"archive": "Arxiu",
	"noteIdOrUrl": "ID o URL de la nota",
	"channelArchiveConfirmTitle": "Vols arxivar {name}?",
	"channelArchiveConfirmDescription": "Un Canal arxivat no apareixerà a la llista de canals o als resultats de cerca. Tampoc es poden afegir noves entrades.",
	"channelEdit": "Editar canal",
	"channelCreate": "Crear un canal"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"name": "Jméno",
	"description": "Popis",
	"color": "Barva",
	"sensitive": "NSFW",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Nastavit banner",
	"channelRemoveBanner": "Odstranit banner",
	"pinnedNotes": "Připnutá poznámka",
	"save": "Uložit",
	"create": "Vytvořit",
	"archive": "Archiv",
	"noteIdOrUrl": "ID nebo URL poznámky",
	"channelArchiveConfirmTitle": "Opravdu chcete archivovat {name}?",
	"channelArchiveConfirmDescription": "Archivovaný kanál se objeví v seznamu kanálů nebo ve výsledcích hledání. Nové poznámky se nedají vložit do seznamu.",
	"channelEdit": "Upravit kanál",
	"channelCreate": "Vytvořit kanál"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"name": "Name",
	"description": "Description",
	"color": "Color",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Pinned notes",
	"save": "Save",
	"create": "Create",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"name": "Name",
	"description": "Beschreibung",
	"color": "Farbe",
	"sensitive": "Sensibel",
	"channelAllowRenoteToExternal": "Renotes und Zitierungen außerhalb des Kanals erlauben",
	"channelSetBanner": "Kanalbanner festlegen",
	"channelRemoveBanner": "Kanalbanner entfernen",
	"pinnedNotes": "Angeheftete Notizen",
	"save": "Speichern",
	"create": "Erstellen",
	"archive": "Archivieren",
	"noteIdOrUrl": "Notiz-ID oder URL",
	"channelArchiveConfirmTitle": "{name} wirklich archivieren?",
	"channelArchiveConfirmDescription": "Ein archivierter Kanal taucht nicht mehr in der Kanalliste oder in Suchergebnissen auf. Zudem können ihm keine Beiträge mehr hinzugefügt werden.",
	"channelEdit": "Kanal bearbeiten",
	"channelCreate": "Kanal erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"name": "Name",
	"description": "Description",
	"color": "Color",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Pinned notes",
	"save": "Save",
	"create": "Create",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"name": "Nombre",
	"description": "Descripción",
	"color": "Color",
	"sensitive": "Marcado como sensible (NSFW)",
	"channelAllowRenoteToExternal": "Permitir renotas y menciones fuera del canal",
	"channelSetBanner": "Elegir banner",
	"channelRemoveBanner": "Borrar banner",
	"pinnedNotes": "Nota fijada",
	"save": "Guardar",
	"create": "Crear",
	"archive": "Archivo",
	"noteIdOrUrl": "ID o URL de la nota",
	"channelArchiveConfirmTitle": "¿Seguro de archivar {name}?",
	"channelArchiveConfirmDescription": "Un canal archivado no aparecerá en la lista de canales ni en los resultados. Las nuevas publicaciones tampoco serán añadidas.",
	"channelEdit": "Editar canal",
	"channelCreate": "Crear canal"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"name": "Nom",
	"description": "Description",
	"color": "Couleur",
	"sensitive": "Contenu sensible",
	"channelAllowRenoteToExternal": "Permettre la renote et la citation hors du canal",
	"channelSetBanner": "Sélectionner la bannière",
	"channelRemoveBanner": "Supprimer la bannière",
	"pinnedNotes": "Note épinglée",
	"save": "Enregistrer",
	"create": "Créer",
	"archive": "Archive",
	"noteIdOrUrl": "Identifiant de la note ou URL",
	"channelArchiveConfirmTitle": "Voulez-vous vraiment archiver {name} ?",
	"channelArchiveConfirmDescription": "Une fois archivé, le canal n'apparaîtra plus dans la liste des canaux ni dans les résultats de recherche, et la publication des nouvelles notes sera impossible.",
	"channelEdit": "Éditer le canal",
	"channelCreate": "Créer un canal"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"name": "Nama",
	"description": "Deskripsi",
	"color": "Warna",
	"sensitive": "Konten sensitif",
	"channelAllowRenoteToExternal": "Perbolehkan catat ulang dan kutipan di luar dari kanal",
	"channelSetBanner": "Setel banner",
	"channelRemoveBanner": "Hapus banner",
	"pinnedNotes": "Catatan yang disematkan",
	"save": "Simpan",
	"create": "Buat",
	"archive": "Arsipkan",
	"noteIdOrUrl": "ID catatan atau URL",
	"channelArchiveConfirmTitle": "Yakin untuk mengarsipkan {name}?",
	"channelArchiveConfirmDescription": "Kanal yang diarsipkan tidak akan muncul pada daftar kanal atau hasil pencarian. Postingan baru juga tidak dapat ditambahkan lagi.",
	"channelEdit": "Sunting Kanal",
	"channelCreate": "Buat Kanal"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"name": "Nome",
	"description": "Descrizione",
	"color": "Colore",
	"sensitive": "Esplicito",
	"channelAllowRenoteToExternal": "Consenti i Rinota e le citazioni all'esterno del canale",
	"channelSetBanner": "Scegli intestazione",
	"channelRemoveBanner": "Rimuovi intestazione",
	"pinnedNotes": "Note in primo piano",
	"save": "Salva",
	"create": "Crea",
	"archive": "Archivio",
	"noteIdOrUrl": "ID della Nota o URL",
	"channelArchiveConfirmTitle": "Vuoi davvero archiviare {name}?",
	"channelArchiveConfirmDescription": "Un canale archiviato non compare nell'elenco canali, nemmeno nei risultati di ricerca. Non può ricevere nemmeno nuove Note.",
	"channelEdit": "Modifica il canale",
	"channelCreate": "Nuovo canale"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"name": "名前",
	"description": "説明",
	"color": "色",
	"sensitive": "センシティブ",
	"channelAllowRenoteToExternal": "チャンネル外へのリノートと引用リノートを許可する",
	"channelSetBanner": "バナーを設定",
	"channelRemoveBanner": "バナーを削除",
	"pinnedNotes": "ピン留めされたノート",
	"save": "保存",
	"create": "作成",
	"archive": "アーカイブ",
	"noteIdOrUrl": "ノートIDまたはURL",
	"channelArchiveConfirmTitle": "{name}をアーカイブしますか？",
	"channelArchiveConfirmDescription": "アーカイブすると、チャンネル一覧や検索結果に表示されなくなり、新たな書き込みもできなくなります。",
	"channelEdit": "チャンネルを編集",
	"channelCreate": "チャンネルを作成"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"name": "名前",
	"description": "説明",
	"color": "色",
	"sensitive": "気いつけて見いや",
	"channelAllowRenoteToExternal": "チャンネルの外にリノートできるようにする",
	"channelSetBanner": "バナーを設定",
	"channelRemoveBanner": "バナーを削除",
	"pinnedNotes": "ピン留めされとるノート",
	"save": "とっとく",
	"create": "作成",
	"archive": "アーカイブ",
	"noteIdOrUrl": "ノートIDかURL",
	"channelArchiveConfirmTitle": "{name}をアーカイブしてええか？",
	"channelArchiveConfirmDescription": "アーカイブしたら、チャンネル一覧とか検索結果からなくなるし、新しく書き込みもできへんなるで。",
	"channelEdit": "チャンネルいじる",
	"channelCreate": "チャンネル作る"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"name": "Name",
	"description": "Description",
	"color": "Color",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Pinned notes",
	"save": "Sekles",
	"create": "Create",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"name": "Name",
	"description": "Description",
	"color": "Color",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Pinned notes",
	"save": "ಉಳಿಸಿ",
	"create": "Create",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"name": "이름",
	"description": "설명",
	"color": "색",
	"sensitive": "열람 주의",
	"channelAllowRenoteToExternal": "채널 외부로의 리노트와 인용 리노트를 허가",
	"channelSetBanner": "배너 설정",
	"channelRemoveBanner": "배너 삭제",
	"pinnedNotes": "고정된 노트",
	"save": "저장",
	"create": "생성",
	"archive": "아카이브",
	"noteIdOrUrl": "노트 ID 및 URL",
	"channelArchiveConfirmTitle": "{name} 채널을 보존하시겠습니까?",
	"channelArchiveConfirmDescription": "보존한 채널은 채널 목록과 검색 결과에 표시되지 않으며 새로운 노트도 작성할 수 없습니다.",
	"channelEdit": "채널 편집",
	"channelCreate": "채널 생성"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"name": "Naam",
	"description": "Beschrijving",
	"color": "Color",
	"sensitive": "NSFW",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Vastgemaakte notitie",
	"save": "Opslaan",
	"create": "Creëer",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"name": "Navn",
	"description": "Beskrivelse",
	"color": "Farge",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Festet Note",
	"save": "Lagre",
	"create": "Opprett",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Rediger kanal",
	"channelCreate": "Opprett kanal"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"name": "Nazwa",
	"description": "Opis",
	"color": "Kolor",
	"sensitive": "NSFW",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Ustaw baner",
	"channelRemoveBanner": "Usuń baner",
	"pinnedNotes": "Przypięty wpis",
	"save": "Zapisz",
	"create": "Utwórz",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edytuj kanał",
	"channelCreate": "Utwórz kanał"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"name": "Nome",
	"description": "Descrição",
	"color": "Cor",
	"sensitive": "Conteúdo sensível",
	"channelAllowRenoteToExternal": "Permitir repostagens e citações de fora do canal",
	"channelSetBanner": "Definir banner",
	"channelRemoveBanner": "Remover banner",
	"pinnedNotes": "Post fixado",
	"save": "Salvar",
	"create": "Criar",
	"archive": "Arquivo",
	"noteIdOrUrl": "ID ou URL de nota",
	"channelArchiveConfirmTitle": "Deseja realmente arquivar {name}?",
	"channelArchiveConfirmDescription": "Um canal arquivado não irá aparecer na lista de canais e nem resultados de pesquisa. Novas publicações não poderão mais ser adicionadas.",
	"channelEdit": "Editar canal",
	"channelCreate": "Criar canal"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"name": "Название",
	"description": "Описание",
	"color": "Цвет",
	"sensitive": "Содержимое не для всех",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Установить баннер",
	"channelRemoveBanner": "Удалить баннер",
	"pinnedNotes": "Закреплённая заметка",
	"save": "Сохранить",
	"create": "Создать",
	"archive": "Архив",
	"noteIdOrUrl": "ID или ссылка на заметку",
	"channelArchiveConfirmTitle": "Переместить {name} в архив?",
	"channelArchiveConfirmDescription": "Архивированные каналы перестанут отображаться в списке каналов или результатах поиска. В них также нельзя будет добавлять новые записи.",
	"channelEdit": "Редактировать канал",
	"channelCreate": "Создать канал"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"name": "Názov",
	"description": "Popis",
	"color": "Farba",
	"sensitive": "NSFW",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Nastaviť banner",
	"channelRemoveBanner": "Odstrániť banner",
	"pinnedNotes": "Pripnuté poznámky",
	"save": "Uložiť",
	"create": "Vytvoriť",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Upraviť kanál",
	"channelCreate": "Vytvoriť kanál"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"name": "ชื่อ",
	"description": "คำอธิบาย",
	"color": "สี",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"channelAllowRenoteToExternal": "อนุญาตให้รีโน้ตและอ้างอิงนอกช่องได้",
	"channelSetBanner": "เซตแบนเนอร์",
	"channelRemoveBanner": "ลบแบนเนอร์",
	"pinnedNotes": "โน้ตที่ปักหมุดไว้",
	"save": "บันทึก",
	"create": "สร้าง",
	"archive": "เก็บถาวร",
	"noteIdOrUrl": "ID ของโน้ต หรือ URL",
	"channelArchiveConfirmTitle": "ต้องการเก็บถาวรเจ้า {name} ใช่ไหม?",
	"channelArchiveConfirmDescription": "เมื่อเก็บถาวรแล้ว จะไม่ปรากฏในรายการช่องหรือผลการค้นหาอีกต่อไป และจะไม่สามารถโพสต์ใหม่ได้อีกต่อไป",
	"channelEdit": "แก้ไขช่อง",
	"channelCreate": "สร้างช่องใหม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"name": "İsim",
	"description": "Açıklama",
	"color": "Renk",
	"sensitive": "Hassas",
	"channelAllowRenoteToExternal": "Kanal dışında yeniden not alma ve alıntı yapmaya izin ver",
	"channelSetBanner": "Afiş ayarla",
	"channelRemoveBanner": "Afişi kaldır",
	"pinnedNotes": "Sabitlenmiş notlar",
	"save": "Kaydet",
	"create": "Oluştur",
	"archive": "Arşiv",
	"noteIdOrUrl": "Not ID veya URL",
	"channelArchiveConfirmTitle": "Cidden {name} arşivlemek mi istiyorsun?",
	"channelArchiveConfirmDescription": "Arşivlenmiş bir kanal artık kanal listesinde veya arama sonuçlarında görünmeyecektir. Ayrıca, bu kanala yeni gönderiler eklenemeyecek.",
	"channelEdit": "Kanalı düzenle",
	"channelCreate": "Kanal oluştur"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"name": "Name",
	"description": "Description",
	"color": "Color",
	"sensitive": "Sensitive",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Set banner",
	"channelRemoveBanner": "Remove banner",
	"pinnedNotes": "Pinned notes",
	"save": "Save",
	"create": "Create",
	"archive": "Archive",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Edit channel",
	"channelCreate": "Create channel"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"name": "Ім'я",
	"description": "Опис",
	"color": "Колір",
	"sensitive": "NSFW",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Встановити банер",
	"channelRemoveBanner": "Видалити банер",
	"pinnedNotes": "Закріплена нотатка",
	"save": "Зберегти",
	"create": "Створити",
	"archive": "Архів",
	"noteIdOrUrl": "ID або URL нотатки",
	"channelArchiveConfirmTitle": "Справді архівувати {name}?",
	"channelArchiveConfirmDescription": "Архівований канал більше не відображатиметься у списку каналів або результатах пошуку. До нього також більше не можна буде додавати нові дописи.",
	"channelEdit": "Редагувати канал",
	"channelCreate": "Створити канал"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"name": "Tên",
	"description": "Mô tả",
	"color": "Màu sắc",
	"sensitive": "Nhạy cảm",
	"channelAllowRenoteToExternal": "Allow renote and quote outside the channel",
	"channelSetBanner": "Đặt ảnh bìa",
	"channelRemoveBanner": "Xóa ảnh bìa",
	"pinnedNotes": "Bài viết đã ghim",
	"save": "Lưu",
	"create": "Tạo",
	"archive": "Lưu trữ",
	"noteIdOrUrl": "Note ID or URL",
	"channelArchiveConfirmTitle": "Really archive {name}?",
	"channelArchiveConfirmDescription": "An archived channel won't appear in the channel list or search results anymore. New posts can also not be added to it anymore.",
	"channelEdit": "Chỉnh sửa kênh",
	"channelCreate": "Tạo kênh"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"name": "名称",
	"description": "描述",
	"color": "颜色",
	"sensitive": "敏感内容",
	"channelAllowRenoteToExternal": "允许转发至频道外及引用",
	"channelSetBanner": "设置横幅",
	"channelRemoveBanner": "删除横幅",
	"pinnedNotes": "置顶的帖子",
	"save": "保存",
	"create": "创建",
	"archive": "归档",
	"noteIdOrUrl": "帖子 ID 或 URL",
	"channelArchiveConfirmTitle": "要将 {name} 归档吗？",
	"channelArchiveConfirmDescription": "归档后，不会在频道列表与搜索结果中显示，也无法发布新的帖文。",
	"channelEdit": "编辑频道",
	"channelCreate": "创建频道"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"name": "名稱",
	"description": "描述",
	"color": "顏色",
	"sensitive": "敏感內容",
	"channelAllowRenoteToExternal": "允許在頻道外轉發和引用",
	"channelSetBanner": "設定橫幅圖像",
	"channelRemoveBanner": "移除橫幅圖像",
	"pinnedNotes": "已置頂的貼文",
	"save": "儲存",
	"create": "新增",
	"archive": "封存",
	"noteIdOrUrl": "貼文 ID 或 URL",
	"channelArchiveConfirmTitle": "要封存{name}嗎？",
	"channelArchiveConfirmDescription": "封存後，將不會在頻道列表與搜尋結果中顯示，也無法發佈新貼文。",
	"channelEdit": "編輯頻道",
	"channelCreate": "建立頻道"
}
</locale>
