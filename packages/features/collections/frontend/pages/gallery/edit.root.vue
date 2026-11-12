<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<MkInput v-model="title">
			<template #label>{{ globalLocale.env.title }}</template>
		</MkInput>

		<MkTextarea v-model="description" :max="500">
			<template #label>{{ globalLocale.env.description }}</template>
		</MkTextarea>

		<div class="_gaps_s">
			<div v-for="file in files" :key="file.id" class="wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : '' }">
				<div class="name">{{ file.name }}</div>
				<button v-tooltip="globalLocale.env.remove" class="remove _button" @click="remove(file)"><i class="ti ti-x"></i></button>
			</div>
			<MkButton primary @click="chooseFile"><i class="ti ti-plus"></i> {{ $locale.sfc.attachFile }}</MkButton>
		</div>

		<MkSwitch v-model="isSensitive">{{ globalLocale.env.markAsSensitive }}</MkSwitch>

		<div class="_buttons">
			<MkButton v-if="props.post != null" primary @click="save"><i class="ti ti-device-floppy"></i> {{ globalLocale.env.save }}</MkButton>
			<MkButton v-else primary @click="save"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.publish }}</MkButton>

			<MkButton v-if="props.post != null" danger @click="del"><i class="ti ti-trash"></i> {{ globalLocale.env.delete }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
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
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	"attachFile": "أرفق ملفات",
	"publish": "علني"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"deleteConfirm": "Segur que vols esborrar?",
	"attachFile": "Afegeix un arxiu",
	"publish": "Publicar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"deleteConfirm": "Opravdu smazat?",
	"attachFile": "Přiložit soubor",
	"publish": "Zveřejnit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"deleteConfirm": "Really delete?",
	"attachFile": "Attach files",
	"publish": "Publish"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"deleteConfirm": "Wirklich löschen?",
	"attachFile": "Datei anhängen",
	"publish": "Veröffentlichen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"deleteConfirm": "Really delete?",
	"attachFile": "Attach files",
	"publish": "Publish"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"deleteConfirm": "¿Desea eliminarlo?",
	"attachFile": "Añadir archivo",
	"publish": "Publicar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"deleteConfirm": "Confirmez-vous la suppression?",
	"attachFile": "Joindre un fichier",
	"publish": "Public"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"deleteConfirm": "Yakin hapus?",
	"attachFile": "Lampirkan berkas",
	"publish": "Terbitkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"deleteConfirm": "Rimuovere?",
	"attachFile": "Allega file",
	"publish": "Pubblicare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"deleteConfirm": "削除しますか？",
	"attachFile": "ファイルを添付",
	"publish": "公開"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"deleteConfirm": "ホンマにほかすで？",
	"attachFile": "ファイルのっける",
	"publish": "公開"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"deleteConfirm": "Really delete?",
	"attachFile": "Attach files",
	"publish": "Publish"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"deleteConfirm": "Really delete?",
	"attachFile": "Attach files",
	"publish": "Publish"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"deleteConfirm": "삭제하시겠습니까?",
	"attachFile": "파일 첨부",
	"publish": "공개"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"deleteConfirm": "Echt verwijderen?",
	"attachFile": "Bestanden toevoegen",
	"publish": "Publiceren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"deleteConfirm": "Vil du slette?",
	"attachFile": "Legg ved filer",
	"publish": "Publish"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"deleteConfirm": "Na pewno usunąć?",
	"attachFile": "Załącz pliki",
	"publish": "Publikuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"deleteConfirm": "Confirma a exclusão?",
	"attachFile": "Anexar arquivo",
	"publish": "Publicar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"deleteConfirm": "Удалить?",
	"attachFile": "Прикрепить файлы",
	"publish": "Опубликовать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"deleteConfirm": "Naozaj odstrániť?",
	"attachFile": "Priložiť súbor",
	"publish": "Zverejniť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"attachFile": "แนบไฟล์",
	"publish": "เผยแพร่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"attachFile": "Dosyaları ekle",
	"publish": "Yayınla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"deleteConfirm": "Really delete?",
	"attachFile": "Attach files",
	"publish": "Publish"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"attachFile": "Прикріпити файл",
	"publish": "Опублікувати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"deleteConfirm": "Bạn có muốn xóa không?",
	"attachFile": "Đính kèm tập tin",
	"publish": "Đăng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"deleteConfirm": "确定删除?",
	"attachFile": "添加附件",
	"publish": "发布"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"deleteConfirm": "你確定要刪除嗎？",
	"attachFile": "上傳附件",
	"publish": "發布"
}
</locale>
