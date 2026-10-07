<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="$style.root"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textareaEl"
		v-model="text"
		:class="$style.textarea"
		class="_acrylic"
		:placeholder="$locale.sfc.inputMessageHere"
		:readonly="textareaReadOnly"
		@keydown="onKeydown"
		@paste="onPaste"
	></textarea>
	<footer :class="$style.footer">
		<div v-if="file" :class="$style.file" @click="file = null">{{ file.name }}</div>
		<div :class="$style.buttons">
			<button class="_button" :class="$style.button" @click="chooseFile"><i class="ti ti-photo-plus"></i></button>
			<button class="_button" :class="$style.button" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
			<button class="_button" :class="[$style.button, $style.send]" :disabled="!canSend || sending" :title="$locale.sfc.send" @click="send">
				<template v-if="!sending"><i class="ti ti-send"></i></template><template v-if="sending"><MkLoading :em="true"/></template>
			</button>
		</div>
	</footer>
	<input ref="fileEl" style="display: none;" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref, shallowRef, computed, nextTick, readonly, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
//import insertTextAtCursor from 'insert-text-at-cursor';
import { formatTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { Autocomplete } from '@features/discovery/frontend/utility/autocomplete.js';
import { emojiPicker } from '@features/emojis/frontend/utility/emoji-picker.js';
import { checkDragDataType, getDragData } from '@features/ui/frontend/drag-and-drop.js';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	room?: Misskey.entities.ChatRoom | null;
}>();

const textareaEl = shallowRef<HTMLTextAreaElement>();
const fileEl = shallowRef<HTMLInputElement>();

const text = ref<string>('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const sending = ref(false);
const textareaReadOnly = ref(false);
let autocompleteInstance: Autocomplete | null = null;

const canSend = computed(() => (text.value != null && text.value !== '') || file.value != null);

function getDraftKey() {
	return props.user ? 'user:' + props.user.id : 'room:' + props.room?.id;
}

watch([text, file], saveDraft);

async function onPaste(ev: ClipboardEvent) {
	if (!ev.clipboardData) return;

	const pastedFileName = 'yyyy-MM-dd HH-mm-ss [{{number}}]';

	const clipboardData = ev.clipboardData;
	const items = clipboardData.items;

	if (items.length === 1) {
		if (items[0].kind === 'file') {
			const pastedFile = items[0].getAsFile();
			if (!pastedFile) return;
			const lio = pastedFile.name.lastIndexOf('.');
			const ext = lio >= 0 ? pastedFile.name.slice(lio) : '';
			const formattedName = formatTimeString(new Date(pastedFile.lastModified), pastedFileName).replace(/{{number}}/g, '1') + ext;
			const renamedFile = new File([pastedFile], formattedName, { type: pastedFile.type });
			os.launchUploader([renamedFile], { multiple: false }).then(driveFiles => {
				file.value = driveFiles[0];
			});
		}
	} else {
		if (items[0].kind === 'file') {
			os.alert({
				type: 'error',
				text: $locale.value.sfc.onlyOneFileCanBeAttached,
			});
		}
	}
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles'])) {
		ev.preventDefault();
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		ev.preventDefault();
		os.launchUploader([Array.from(ev.dataTransfer.files)[0]], { multiple: false });
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		ev.preventDefault();
		os.alert({
			type: 'error',
			text: $locale.value.sfc.onlyOneFileCanBeAttached,
		});
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			file.value = droppedData[0];
			ev.preventDefault();
		}
	}
	//#endregion
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;
	if (ev.key === 'Enter') {
		if (prefer.s['chat.sendOnEnter']) {
			if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) {
				send();
			}
		} else {
			if ((ev.ctrlKey || ev.metaKey)) {
				send();
			}
		}
	}
}

function chooseFile(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: $locale.value.sfc.selectFile,
	}).then(selectedFile => {
		file.value = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl.value == null || fileEl.value.files == null) return;

	if (fileEl.value.files[0]) {
		os.launchUploader(Array.from(fileEl.value.files), { multiple: false }).then(driveFiles => {
			file.value = driveFiles[0];
		});
	}
}

function send() {
	if (!canSend.value) return;

	sending.value = true;

	if (props.user) {
		misskeyApi('chat/messages/create-to-user', {
			toUserId: props.user.id,
			text: text.value ? text.value : undefined,
			fileId: file.value ? file.value.id : undefined,
		}).then(message => {
			clear();
		}).catch(err => {
			console.error(err);
		}).then(() => {
			sending.value = false;
		});
	} else if (props.room) {
		misskeyApi('chat/messages/create-to-room', {
			toRoomId: props.room.id,
			text: text.value ? text.value : undefined,
			fileId: file.value ? file.value.id : undefined,
		}).then(message => {
			clear();
		}).catch(err => {
			console.error(err);
		}).then(() => {
			sending.value = false;
		});
	}
}

function clear() {
	text.value = '';
	file.value = null;
	deleteDraft();
}

function saveDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	drafts[getDraftKey()] = {
		updatedAt: new Date(),
		data: {
			text: text.value,
			file: file.value,
		},
	};

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

function deleteDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	delete drafts[getDraftKey()];

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

async function insertEmoji(ev: MouseEvent) {
	textareaReadOnly.value = true;
	const target = ev.currentTarget ?? ev.target;
	if (target == null) return;

	// emojiPickerはダイアログが閉じずにtextareaとやりとりするので、
	// focustrapをかけているとinsertTextAtCursorが効かない
	// そのため、投稿フォームのテキストに直接注入する
	// See: https://github.com/misskey-dev/misskey/pull/14282
	//      https://github.com/misskey-dev/misskey/issues/14274

	let pos = textareaEl.value?.selectionStart ?? 0;
	let posEnd = textareaEl.value?.selectionEnd ?? text.value.length;
	emojiPicker.show(
		target as HTMLElement,
		emoji => {
			const textBefore = text.value.substring(0, pos);
			const textAfter = text.value.substring(posEnd);
			text.value = textBefore + emoji + textAfter;
			pos += emoji.length;
			posEnd += emoji.length;
		},
		() => {
			textareaReadOnly.value = false;
			nextTick(() => focus());
		},
	);
}

onMounted(() => {
	if (textareaEl.value != null) {
		autocompleteInstance = new Autocomplete(textareaEl.value, text);
	}

	// 書きかけの投稿を復元
	const draft = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}')[getDraftKey()];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}
});

onBeforeUnmount(() => {
	if (autocompleteInstance) {
		autocompleteInstance.detach();
		autocompleteInstance = null;
	}
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	border-bottom: none;
	border-radius: 14px 14px 0 0;
	overflow: clip;
}

.textarea {
	cursor: auto;
	display: block;
	width: 100%;
	min-width: 100%;
	max-width: 100%;
	min-height: 80px;
	margin: 0;
	padding: 16px 16px 0 16px;
	resize: none;
	font-size: 1em;
	font-family: inherit;
	outline: none;
	border: none;
	border-radius: 0;
	box-shadow: none;
	box-sizing: border-box;
	color: var(--MI_THEME-fg);
	field-sizing: content;
}

.footer {
	position: sticky;
	bottom: 0;
	background: var(--MI_THEME-panel);
}

.file {
	padding: 8px;
	cursor: pointer;
}

.buttons {
	display: flex;
}

.button {
	height: 50px;
	aspect-ratio: 1;

	&:hover {
		color: var(--MI_THEME-accent);
	}
}
.send {
	margin-left: auto;
	color: var(--MI_THEME-accent);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"inputMessageHere": "اكتب رسالتك هنا",
	"send": "أرسل",
	"onlyOneFileCanBeAttached": "يمكنك إرفاق ملف واحد بالرسالة",
	"selectFile": "اختر ملفًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"inputMessageHere": "Escriu aquí el teu missatge ",
	"send": "Envia",
	"onlyOneFileCanBeAttached": "Només pots adjuntar un fitxer a un missatge",
	"selectFile": "Selecciona un fitxer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"inputMessageHere": "Sem zadejte zprávu",
	"send": "Odeslat",
	"onlyOneFileCanBeAttached": "Ke zprávě můžete přiložit jenom jeden soubor",
	"selectFile": "Vybrat soubor"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"inputMessageHere": "Enter message here",
	"send": "Send",
	"onlyOneFileCanBeAttached": "You can only attach one file to a message",
	"selectFile": "Select a file"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"inputMessageHere": "Hier Nachricht eingeben",
	"send": "Senden",
	"onlyOneFileCanBeAttached": "Es kann pro Nachricht nur eine Datei angehängt werden",
	"selectFile": "Datei auswählen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"inputMessageHere": "Enter message here",
	"send": "Send",
	"onlyOneFileCanBeAttached": "You can only attach one file to a message",
	"selectFile": "Select a file"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"inputMessageHere": "Escribe el mensaje aquí",
	"send": "Enviar",
	"onlyOneFileCanBeAttached": "Solo se puede añadir un archivo al mensaje",
	"selectFile": "Elegir archivo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"inputMessageHere": "Écrivez votre message ici",
	"send": "Envoyer",
	"onlyOneFileCanBeAttached": "Vous ne pouvez joindre qu’un seul fichier au message",
	"selectFile": "Choisir le fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"inputMessageHere": "Ketik pesan disini",
	"send": "Kirim",
	"onlyOneFileCanBeAttached": "Kamu hanya dapat melampirkan satu berkas ke dalam pesan",
	"selectFile": "Pilih berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"inputMessageHere": "Scrivi messaggio qui",
	"send": "Inviare",
	"onlyOneFileCanBeAttached": "È possibile allegare al messaggio soltanto uno file",
	"selectFile": "Scelta allegato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"inputMessageHere": "ここにメッセージを入力",
	"send": "送信",
	"onlyOneFileCanBeAttached": "メッセージに添付できるファイルはひとつです",
	"selectFile": "ファイルを選択"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"inputMessageHere": "ここにメッセージ書いてや",
	"send": "送信",
	"onlyOneFileCanBeAttached": "ごめんな、メッセージに添付できるファイルはひとつだけなんよ。",
	"selectFile": "ファイル選んでや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"inputMessageHere": "Enter message here",
	"send": "Send",
	"onlyOneFileCanBeAttached": "You can only attach one file to a message",
	"selectFile": "Select a file"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"inputMessageHere": "Enter message here",
	"send": "Send",
	"onlyOneFileCanBeAttached": "You can only attach one file to a message",
	"selectFile": "Select a file"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"inputMessageHere": "여기에 메시지를 입력하세요",
	"send": "전송",
	"onlyOneFileCanBeAttached": "메시지에 첨부할 수 있는 파일은 하나까지입니다",
	"selectFile": "파일 선택"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"inputMessageHere": "Voer hier je bericht in",
	"send": "Stuur",
	"onlyOneFileCanBeAttached": "Per bericht kan slechts één bestand worden bijgevoegd",
	"selectFile": "Kies een bestand"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"inputMessageHere": "Skriv inn melding her",
	"send": "Send",
	"onlyOneFileCanBeAttached": "Du kan bare legge ved én fil i en melding",
	"selectFile": "Velg en fil"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"inputMessageHere": "Wprowadź wiadomość tutaj",
	"send": "Wyślij",
	"onlyOneFileCanBeAttached": "Możesz załączyć tylko jeden plik do wiadomości",
	"selectFile": "Wybierz plik"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"inputMessageHere": "Escrever mensagem aqui",
	"send": "Enviar",
	"onlyOneFileCanBeAttached": "Apenas um arquivo pode ser anexado a uma mensagem",
	"selectFile": "Selecione os arquivos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"inputMessageHere": "Введите сообщение здесь",
	"send": "Отправить",
	"onlyOneFileCanBeAttached": "К сообщению можно прикрепить только один файл",
	"selectFile": "Выберите файл"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"inputMessageHere": "Sem napíšte správu",
	"send": "Poslať",
	"onlyOneFileCanBeAttached": "Ku správe môžete priložiť len jeden súbor",
	"selectFile": "Vyberte súbor"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"inputMessageHere": "พิมพ์ข้อความที่นี่",
	"send": "ส่ง",
	"onlyOneFileCanBeAttached": "สามารถแนบไฟล์ได้เพียงไฟล์เดียวต่อ 1 ข้อความ",
	"selectFile": "เลือกไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"inputMessageHere": "Mesajınızı buraya girin",
	"send": "Gönder",
	"onlyOneFileCanBeAttached": "Bir mesaja yalnızca bir dosya ekleyebilirsin.",
	"selectFile": "Dosya seçin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"inputMessageHere": "Enter message here",
	"send": "Send",
	"onlyOneFileCanBeAttached": "You can only attach one file to a message",
	"selectFile": "Select a file"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"inputMessageHere": "Введіть повідомлення тут",
	"send": "Відправити",
	"onlyOneFileCanBeAttached": "До повідомлення можна вкласти лише один файл",
	"selectFile": "Вибрати файл"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"inputMessageHere": "Nhập nội dung tin nhắn",
	"send": "Gửi",
	"onlyOneFileCanBeAttached": "Bạn chỉ có thể đính kèm một tập tin",
	"selectFile": "Chọn tập tin"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"inputMessageHere": "在此输入信息",
	"send": "发送",
	"onlyOneFileCanBeAttached": "只能添加一个附件",
	"selectFile": "选择文件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"inputMessageHere": "在此輸入訊息",
	"send": "發送",
	"onlyOneFileCanBeAttached": "只能加入一個附件",
	"selectFile": "選擇檔案"
}
</locale>
