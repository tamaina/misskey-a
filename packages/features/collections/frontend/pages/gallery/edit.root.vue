<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<MkInput v-model="title">
			<template #label>{{ $locale.sfc.title }}</template>
		</MkInput>

		<MkTextarea v-model="description" :max="500">
			<template #label>{{ $locale.sfc.description }}</template>
		</MkTextarea>

		<div class="_gaps_s">
			<div v-for="file in files" :key="file.id" class="wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : '' }">
				<div class="name">{{ file.name }}</div>
				<button v-tooltip="$locale.sfc.remove" class="remove _button" @click="remove(file)"><i class="ti ti-x"></i></button>
			</div>
			<MkButton primary @click="chooseFile"><i class="ti ti-plus"></i> {{ $locale.sfc.attachFile }}</MkButton>
		</div>

		<MkSwitch v-model="isSensitive">{{ $locale.sfc.markAsSensitive }}</MkSwitch>

		<div class="_buttons">
			<MkButton v-if="props.post != null" primary @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
			<MkButton v-else primary @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.publish }}</MkButton>

			<MkButton v-if="props.post != null" danger @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	post: Misskey.entities.GalleryPost | null;
}>();

const files = ref(props.post?.files ?? []);
const description = ref(props.post?.description ?? null);
const title = ref(props.post?.title ?? '');
const isSensitive = ref(props.post?.isSensitive ?? false);

function chooseFile(evt: MouseEvent) {
	selectFile({
		anchorElement: evt.currentTarget ?? evt.target,
		multiple: true,
	}).then(selected => {
		files.value = files.value.concat(selected);
	});
}

function remove(file: NonNullable<Misskey.entities.GalleryPost['files']>[number]) {
	files.value = files.value.filter(f => f.id !== file.id);
}

async function save() {
	if (props.post != null) {
		await os.apiWithDialog('gallery/posts/update', {
			postId: props.post.id,
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push('/gallery/:postId', {
			params: {
				postId: props.post.id,
			},
		});
	} else {
		const created = await os.apiWithDialog('gallery/posts/create', {
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push('/gallery/:postId', {
			params: {
				postId: created.id,
			},
		});
	}
}

async function del() {
	if (props.post == null) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('gallery/posts/delete', {
		postId: props.post.id,
	});
	router.push('/gallery');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);
</script>

<style lang="scss" scoped>
.wqugxsfx {
	height: 200px;
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	position: relative;

	> .name {
		position: absolute;
		top: 8px;
		left: 9px;
		padding: 8px;
		background: var(--MI_THEME-panel);
	}

	> .remove {
		position: absolute;
		top: 8px;
		right: 9px;
		padding: 8px;
		background: var(--MI_THEME-panel);
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"deleteConfirm": "أمتأكد من الحذف؟",
	"title": "العنوان",
	"description": "الوصف",
	"remove": "حذف",
	"attachFile": "أرفق ملفات",
	"markAsSensitive": "علّمه كمحتوى حساس",
	"save": "حفظ",
	"publish": "علني",
	"delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"deleteConfirm": "Segur que vols esborrar?",
	"title": "Títol",
	"description": "Descripció",
	"remove": "Eliminar",
	"attachFile": "Afegeix un arxiu",
	"markAsSensitive": "Marcar com a sensible",
	"save": "Desa",
	"publish": "Publicar",
	"delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"deleteConfirm": "Opravdu smazat?",
	"title": "Titulek",
	"description": "Popis",
	"remove": "Smazat",
	"attachFile": "Přiložit soubor",
	"markAsSensitive": "Označit jako NSFW",
	"save": "Uložit",
	"publish": "Zveřejnit",
	"delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"deleteConfirm": "Really delete?",
	"title": "Title",
	"description": "Description",
	"remove": "Delete",
	"attachFile": "Attach files",
	"markAsSensitive": "Mark as sensitive",
	"save": "Save",
	"publish": "Publish",
	"delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"deleteConfirm": "Wirklich löschen?",
	"title": "Titel",
	"description": "Beschreibung",
	"remove": "Löschen",
	"attachFile": "Datei anhängen",
	"markAsSensitive": "Als sensibel markieren",
	"save": "Speichern",
	"publish": "Veröffentlichen",
	"delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"deleteConfirm": "Really delete?",
	"title": "Title",
	"description": "Description",
	"remove": "Delete",
	"attachFile": "Attach files",
	"markAsSensitive": "Mark as sensitive",
	"save": "Save",
	"publish": "Publish",
	"delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"deleteConfirm": "¿Desea eliminarlo?",
	"title": "Título",
	"description": "Descripción",
	"remove": "Borrar",
	"attachFile": "Añadir archivo",
	"markAsSensitive": "Marcar como sensible",
	"save": "Guardar",
	"publish": "Publicar",
	"delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"deleteConfirm": "Confirmez-vous la suppression?",
	"title": "Titre",
	"description": "Description",
	"remove": "Supprimer",
	"attachFile": "Joindre un fichier",
	"markAsSensitive": "Marquer comme sensible",
	"save": "Enregistrer",
	"publish": "Public",
	"delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"deleteConfirm": "Yakin hapus?",
	"title": "Judul",
	"description": "Deskripsi",
	"remove": "Hapus",
	"attachFile": "Lampirkan berkas",
	"markAsSensitive": "Tandai sebagai konten sensitif",
	"save": "Simpan",
	"publish": "Terbitkan",
	"delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"deleteConfirm": "Rimuovere?",
	"title": "Titolo",
	"description": "Descrizione",
	"remove": "Elimina",
	"attachFile": "Allega file",
	"markAsSensitive": "Segna come esplicito",
	"save": "Salva",
	"publish": "Pubblicare",
	"delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"deleteConfirm": "削除しますか？",
	"title": "タイトル",
	"description": "説明",
	"remove": "削除",
	"attachFile": "ファイルを添付",
	"markAsSensitive": "センシティブとして設定",
	"save": "保存",
	"publish": "公開",
	"delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"deleteConfirm": "ホンマにほかすで？",
	"title": "タイトル",
	"description": "説明",
	"remove": "ほかす",
	"attachFile": "ファイルのっける",
	"markAsSensitive": "ちょっと見せられへんわ",
	"save": "とっとく",
	"publish": "公開",
	"delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"deleteConfirm": "Really delete?",
	"title": "Title",
	"description": "Description",
	"remove": "Kkes",
	"attachFile": "Attach files",
	"markAsSensitive": "Mark as sensitive",
	"save": "Sekles",
	"publish": "Publish",
	"delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"deleteConfirm": "Really delete?",
	"title": "Title",
	"description": "Description",
	"remove": "ಅಳಿಸು",
	"attachFile": "Attach files",
	"markAsSensitive": "Mark as sensitive",
	"save": "ಉಳಿಸಿ",
	"publish": "Publish",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"deleteConfirm": "삭제하시겠습니까?",
	"title": "제목",
	"description": "설명",
	"remove": "삭제",
	"attachFile": "파일 첨부",
	"markAsSensitive": "열람주의로 설정",
	"save": "저장",
	"publish": "공개",
	"delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"deleteConfirm": "Echt verwijderen?",
	"title": "Titel",
	"description": "Beschrijving",
	"remove": "Verwijderen",
	"attachFile": "Bestanden toevoegen",
	"markAsSensitive": "Markeren als NSFW",
	"save": "Opslaan",
	"publish": "Publiceren",
	"delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"deleteConfirm": "Vil du slette?",
	"title": "Tittel",
	"description": "Beskrivelse",
	"remove": "Slett",
	"attachFile": "Legg ved filer",
	"markAsSensitive": "Mark as sensitive",
	"save": "Lagre",
	"publish": "Publish",
	"delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"deleteConfirm": "Na pewno usunąć?",
	"title": "Tytuł",
	"description": "Opis",
	"remove": "Usuń",
	"attachFile": "Załącz pliki",
	"markAsSensitive": "Oznacz jako NSFW",
	"save": "Zapisz",
	"publish": "Publikuj",
	"delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"deleteConfirm": "Confirma a exclusão?",
	"title": "Título",
	"description": "Descrição",
	"remove": "Remover",
	"attachFile": "Anexar arquivo",
	"markAsSensitive": "Marcar como sensível",
	"save": "Salvar",
	"publish": "Publicar",
	"delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"deleteConfirm": "Удалить?",
	"title": "Заголовок",
	"description": "Описание",
	"remove": "Удалить",
	"attachFile": "Прикрепить файлы",
	"markAsSensitive": "Отметить как «не для всех»",
	"save": "Сохранить",
	"publish": "Опубликовать",
	"delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"deleteConfirm": "Naozaj odstrániť?",
	"title": "Nadpis",
	"description": "Popis",
	"remove": "Odstrániť",
	"attachFile": "Priložiť súbor",
	"markAsSensitive": "Označiť ako NSFW",
	"save": "Uložiť",
	"publish": "Zverejniť",
	"delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"title": "หัวข้อ",
	"description": "คำอธิบาย",
	"remove": "ลบ",
	"attachFile": "แนบไฟล์",
	"markAsSensitive": "ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"save": "บันทึก",
	"publish": "เผยแพร่",
	"delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"title": "Başlık",
	"description": "Açıklama",
	"remove": "Sil",
	"attachFile": "Dosyaları ekle",
	"markAsSensitive": "Hassas içerik olarak işaretle",
	"save": "Kaydet",
	"publish": "Yayınla",
	"delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"deleteConfirm": "Really delete?",
	"title": "Title",
	"description": "Description",
	"remove": "ئۆچۈرۈش",
	"attachFile": "Attach files",
	"markAsSensitive": "Mark as sensitive",
	"save": "Save",
	"publish": "Publish",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"title": "Тема",
	"description": "Опис",
	"remove": "Видалити",
	"attachFile": "Прикріпити файл",
	"markAsSensitive": "Позначити як NSFW",
	"save": "Зберегти",
	"publish": "Опублікувати",
	"delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"deleteConfirm": "Bạn có muốn xóa không?",
	"title": "Tựa đề",
	"description": "Mô tả",
	"remove": "Xóa",
	"attachFile": "Đính kèm tập tin",
	"markAsSensitive": "Đánh dấu là nhạy cảm",
	"save": "Lưu",
	"publish": "Đăng",
	"delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"deleteConfirm": "确定删除?",
	"title": "标题",
	"description": "描述",
	"remove": "删除",
	"attachFile": "添加附件",
	"markAsSensitive": "标记为敏感内容",
	"save": "保存",
	"publish": "发布",
	"delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"deleteConfirm": "你確定要刪除嗎？",
	"title": "標題",
	"description": "描述",
	"remove": "刪除",
	"attachFile": "上傳附件",
	"markAsSensitive": "標記為敏感內容",
	"save": "儲存",
	"publish": "發布",
	"delete": "刪除"
}
</locale>
