<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true">
	<template #icon><i class="ti ti-palette"></i></template>
	<template #label>{{ palette.name === '' ? '(' + $locale.sfc.noName + ')' : palette.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="rename"><i class="ti ti-pencil"></i> {{ $locale.sfc.rename }}</MkButton>
			<MkButton @click="copy"><i class="ti ti-copy"></i> {{ $locale.sfc.copy }}</MkButton>
			<MkButton danger @click="paste"><i class="ti ti-clipboard"></i> {{ $locale.sfc.paste }}</MkButton>
			<MkButton danger iconOnly style="margin-left: auto;" @click="del"><i class="ti ti-trash"></i></MkButton>
		</div>
	</template>

	<div>
		<div v-panel style="border-radius: 6px;">
			<MkDraggable
				:modelValue="emojis.map(emoji => ({ id: emoji, emoji }))"
				direction="horizontal"
				:class="$style.emojis"
				group="emojiPalettes"
				@update:modelValue="v => emojis = v.map(x => x.emoji)"
			>
				<template #default="{ item }">
					<button class="_button" :class="$style.emojisItem" @click="remove(item.emoji, $event)">
						<!-- pointer-eventsをnoneにしておかないとiOSなどでドラッグしたときに画像の方に判定が持ってかれる -->
						<MkCustomEmoji v-if="item.emoji[0] === ':'" style="pointer-events: none;" :name="item.emoji" :normal="true" :fallbackToImage="true"/>
						<MkEmoji v-else style="pointer-events: none;" :emoji="item.emoji" :normal="true"/>
					</button>
				</template>
				<template #footer>
					<button class="_button" :class="$style.emojisAdd" @click="pick">
						<i class="ti ti-plus"></i>
					</button>
				</template>
			</MkDraggable>
		</div>
		<div :class="$style.editorCaption">{{ $locale.sfc.reactionSettingDescription2 }}</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkCustomEmoji from '@features/emojis/frontend/components/global/MkCustomEmoji.vue';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';

const props = defineProps<{
	palette: {
		id: string;
		name: string;
		emojis: string[];
	};
}>();

const emit = defineEmits<{
	(ev: 'updateEmojis', emojis: string[]): void,
	(ev: 'updateName', name: string): void,
	(ev: 'del'): void,
}>();

const emojis = ref<string[]>(deepClone(props.palette.emojis));

watch(emojis, () => {
	emit('updateEmojis', emojis.value);
}, { deep: true });

function remove(reaction: string, ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.remove,
		action: () => {
			emojis.value = emojis.value.filter(x => x !== reaction);
		},
	}], getHTMLElement(ev));
}

function pick(ev: PointerEvent) {
	os.pickEmoji(getHTMLElement(ev), {
		showPinned: false,
	}).then(it => {
		const emoji = it;
		if (!emojis.value.includes(emoji)) {
			emojis.value.push(emoji);
		}
	});
}

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function rename() {
	os.inputText({
		title: $locale.value.sfc.rename,
		default: props.palette.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		if (name != null) {
			emit('updateName', name);
		}
	});
}

function copy() {
	copyToClipboard(emojis.value.join(' '));
}

function paste() {
	// TODO: validate
	navigator.clipboard.readText().then(text => {
		emojis.value = text.split(' ');
	});
}

function del(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.delete,
		action: () => {
			emit('del');
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.tab {
	margin: calc(var(--MI-margin) / 2) 0;
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.emojis {
	padding: 12px;
	font-size: 1.1em;
}

.emojisItem {
	display: inline-block;
	padding: 8px;
	cursor: move;
}

.emojisAdd {
	display: inline-block;
	padding: 8px;
}

.editorCaption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"noName": "No name",
	"rename": "إعادة التسمية",
	"copy": "نسخ",
	"paste": "Paste",
	"reactionSettingDescription2": "اسحب لترتيب ، انقر للحذف ، استخدم \"+\" للإضافة.",
	"remove": "حذف",
	"delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"noName": "No hi ha un nom disponible ",
	"rename": "Canvia el nom",
	"copy": "Copiar",
	"paste": "Pegar",
	"reactionSettingDescription2": "Arrossega per reordenar, fes clic per suprimir, prem \"+\" per afegir.",
	"remove": "Eliminar",
	"delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"noName": "No name",
	"rename": "Přejmenovat",
	"copy": "Kopírovat",
	"paste": "Paste",
	"reactionSettingDescription2": "Přetažením změníte pořadí, kliknutím smažete, zmáčkněte \"+\" k přidání",
	"remove": "Smazat",
	"delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"noName": "No name",
	"rename": "Rename",
	"copy": "Copy",
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add.",
	"remove": "Delete",
	"delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"noName": "Kein Name",
	"rename": "Umbenennen",
	"copy": "Kopieren",
	"paste": "Einfügen",
	"reactionSettingDescription2": "Ziehe um Anzuordnen, klicke um zu löschen, drücke „+“ um hinzuzufügen",
	"remove": "Löschen",
	"delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"noName": "No name",
	"rename": "Rename",
	"copy": "Copy",
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add.",
	"remove": "Delete",
	"delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"noName": "No hay nombre.",
	"rename": "Renombrar",
	"copy": "Copiar",
	"paste": "Pegar",
	"reactionSettingDescription2": "Arrastra para reordenar, click para borrar, pulsa \"+\" para añadir.",
	"remove": "Borrar",
	"delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"noName": "No name",
	"rename": "Renommer",
	"copy": "Copier",
	"paste": "Paste",
	"reactionSettingDescription2": "Déplacer pour réorganiser, cliquer pour effacer, utiliser « + » pour ajouter.",
	"remove": "Supprimer",
	"delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"noName": "Tidak ada nama",
	"rename": "Ubah nama",
	"copy": "Salin",
	"paste": "Tempel",
	"reactionSettingDescription2": "Geser untuk memindah urutan emoji, klik untuk menghapus, tekan \"+\" untuk menambahkan",
	"remove": "Hapus",
	"delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"noName": "Senza nome",
	"rename": "Modifica nome",
	"copy": "Copia",
	"paste": "Incolla",
	"reactionSettingDescription2": "Trascina per riorganizzare, clicca per cancellare, usa il pulsante \"+\" per aggiungere.",
	"remove": "Elimina",
	"delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"noName": "名前はありません",
	"rename": "名前を変更",
	"copy": "コピー",
	"paste": "ペースト",
	"reactionSettingDescription2": "ドラッグして並び替え、クリックして削除、＋を押して追加します。",
	"remove": "削除",
	"delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"noName": "名前はあらへんで",
	"rename": "名前を変えるで",
	"copy": "コピー",
	"paste": "ペースト",
	"reactionSettingDescription2": "ドラッグで並び替え、クリックで削除、＋を押して追加やで。",
	"remove": "ほかす",
	"delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"noName": "No name",
	"rename": "Rename",
	"copy": "Copy",
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add.",
	"remove": "Kkes",
	"delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"noName": "No name",
	"rename": "Rename",
	"copy": "Copy",
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add.",
	"remove": "ಅಳಿಸು",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"noName": "이름이 없습니다.",
	"rename": "이름 변경",
	"copy": "복사",
	"paste": "붙여넣기",
	"reactionSettingDescription2": "끌어서 순서 변경, 클릭해서 삭제, ＋를 눌러서 추가할 수 있습니다.",
	"remove": "삭제",
	"delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"noName": "No name",
	"rename": "Hernoemen",
	"copy": "Kopiëren",
	"paste": "Paste",
	"reactionSettingDescription2": "Sleep om opnieuw te ordenen, Klik om te verwijderen, Druk op \"+\" om toe te voegen",
	"remove": "Verwijderen",
	"delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"noName": "No name",
	"rename": "Endre navn",
	"copy": "Kopier",
	"paste": "Paste",
	"reactionSettingDescription2": "Dra for å endre rekkefølgen, klikk for å slette, trykk \"+\" for å legge til.",
	"remove": "Slett",
	"delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"noName": "No name",
	"rename": "Zmień nazwę",
	"copy": "Kopiuj",
	"paste": "Paste",
	"reactionSettingDescription2": "Przeciągnij aby zmienić kolejność, naciśnij aby usunąć, naciśnij „+” aby dodać",
	"remove": "Usuń",
	"delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"noName": "Sem nome",
	"rename": "Renomear",
	"copy": "Copiar",
	"paste": "Colar",
	"reactionSettingDescription2": "Arraste para reordenar, clique para excluir, pressione + para adicionar.",
	"remove": "Remover",
	"delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"noName": "Имя не указано",
	"rename": "Переименовать",
	"copy": "Копировать",
	"paste": "Вставить",
	"reactionSettingDescription2": "Расставляйте перетаскиванием, удаляйте нажатием, добавляйте кнопкой «+».",
	"remove": "Удалить",
	"delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"noName": "No name",
	"rename": "Premenovať",
	"copy": "Kopírovať",
	"paste": "Paste",
	"reactionSettingDescription2": "Ťahaním preusporiadate, kliknutím odstránite, Stlačením \"+\" pridáte",
	"remove": "Odstrániť",
	"delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"noName": "ไม่มีชื่อ",
	"rename": "เปลี่ยนชื่อ",
	"copy": "คัดลอก",
	"paste": "วาง",
	"reactionSettingDescription2": "ลากเพื่อจัดลำดับใหม่ คลิกที่เอโมจินั้นเพื่อลบ กด “+” เพื่อเพิ่ม",
	"remove": "ลบ",
	"delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"noName": "İsim yok",
	"rename": "Yeniden adlandır",
	"copy": "Kopyala",
	"paste": "Yapıştır",
	"reactionSettingDescription2": "Sıralamayı değiştirmek için sürükle, silmek için tıkla, eklemek için “+” tuşuna bas.",
	"remove": "Sil",
	"delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"noName": "No name",
	"rename": "Rename",
	"copy": "Copy",
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add.",
	"remove": "ئۆچۈرۈش",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"noName": "Ім'я не вказано",
	"rename": "Перейменувати",
	"copy": "Скопіювати",
	"paste": "Вставити",
	"reactionSettingDescription2": "Перемістити щоб змінити порядок, Клацнути мишою щоб видалити, Натиснути \"+\" щоб додати.",
	"remove": "Видалити",
	"delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"noName": "No name",
	"rename": "Đổi tên",
	"copy": "Sao chép",
	"paste": "dán",
	"reactionSettingDescription2": "Kéo để sắp xếp, nhấn để xóa, nhấn \"+\" để thêm.",
	"remove": "Xóa",
	"delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"noName": "未命名",
	"rename": "重命名",
	"copy": "复制",
	"paste": "粘贴",
	"reactionSettingDescription2": "拖动重新排序，单击删除，点击 + 添加。",
	"remove": "删除",
	"delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"noName": "沒有名稱",
	"rename": "重新命名",
	"copy": "複製",
	"paste": "貼上",
	"reactionSettingDescription2": "拖動以交換，點擊以刪除，按下「+」以新增。",
	"remove": "刪除",
	"delete": "刪除"
}
</locale>
