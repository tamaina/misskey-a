<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true">
	<template #icon><i class="ti ti-palette"></i></template>
	<template #label>{{ palette.name === '' ? '(' + globalLocale.env.noName + ')' : palette.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="rename"><i class="ti ti-pencil"></i> {{ globalLocale.env.rename }}</MkButton>
			<MkButton @click="copy"><i class="ti ti-copy"></i> {{ globalLocale.env.copy }}</MkButton>
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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkCustomEmoji from '@features/emojis/frontend/components/global/MkCustomEmoji.vue';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
		text: globalLocale.value.env.remove,
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
		title: globalLocale.value.env.rename,
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
		text: globalLocale.value.env.delete,
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
	"paste": "Paste",
	"reactionSettingDescription2": "اسحب لترتيب ، انقر للحذف ، استخدم \"+\" للإضافة."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"paste": "Pegar",
	"reactionSettingDescription2": "Arrossega per reordenar, fes clic per suprimir, prem \"+\" per afegir."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Přetažením změníte pořadí, kliknutím smažete, zmáčkněte \"+\" k přidání"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"paste": "Einfügen",
	"reactionSettingDescription2": "Ziehe um Anzuordnen, klicke um zu löschen, drücke „+“ um hinzuzufügen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"paste": "Pegar",
	"reactionSettingDescription2": "Arrastra para reordenar, click para borrar, pulsa \"+\" para añadir."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Déplacer pour réorganiser, cliquer pour effacer, utiliser « + » pour ajouter."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"paste": "Tempel",
	"reactionSettingDescription2": "Geser untuk memindah urutan emoji, klik untuk menghapus, tekan \"+\" untuk menambahkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"paste": "Incolla",
	"reactionSettingDescription2": "Trascina per riorganizzare, clicca per cancellare, usa il pulsante \"+\" per aggiungere."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"paste": "ペースト",
	"reactionSettingDescription2": "ドラッグして並び替え、クリックして削除、＋を押して追加します。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"paste": "ペースト",
	"reactionSettingDescription2": "ドラッグで並び替え、クリックで削除、＋を押して追加やで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"paste": "붙여넣기",
	"reactionSettingDescription2": "끌어서 순서 변경, 클릭해서 삭제, ＋를 눌러서 추가할 수 있습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Sleep om opnieuw te ordenen, Klik om te verwijderen, Druk op \"+\" om toe te voegen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Dra for å endre rekkefølgen, klikk for å slette, trykk \"+\" for å legge til."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Przeciągnij aby zmienić kolejność, naciśnij aby usunąć, naciśnij „+” aby dodać"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"paste": "Colar",
	"reactionSettingDescription2": "Arraste para reordenar, clique para excluir, pressione + para adicionar."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"paste": "Вставить",
	"reactionSettingDescription2": "Расставляйте перетаскиванием, удаляйте нажатием, добавляйте кнопкой «+»."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Ťahaním preusporiadate, kliknutím odstránite, Stlačením \"+\" pridáte"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"paste": "วาง",
	"reactionSettingDescription2": "ลากเพื่อจัดลำดับใหม่ คลิกที่เอโมจินั้นเพื่อลบ กด “+” เพื่อเพิ่ม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"paste": "Yapıştır",
	"reactionSettingDescription2": "Sıralamayı değiştirmek için sürükle, silmek için tıkla, eklemek için “+” tuşuna bas."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"paste": "Paste",
	"reactionSettingDescription2": "Drag to reorder, click to delete, press \"+\" to add."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"paste": "Вставити",
	"reactionSettingDescription2": "Перемістити щоб змінити порядок, Клацнути мишою щоб видалити, Натиснути \"+\" щоб додати."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"paste": "dán",
	"reactionSettingDescription2": "Kéo để sắp xếp, nhấn để xóa, nhấn \"+\" để thêm."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"paste": "粘贴",
	"reactionSettingDescription2": "拖动重新排序，单击删除，点击 + 添加。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"paste": "貼上",
	"reactionSettingDescription2": "拖動以交換，點擊以刪除，按下「+」以新增。"
}
</locale>
