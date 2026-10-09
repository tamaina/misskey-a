<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	ref="buttonEl"
	v-ripple="canToggle"
	class="_button"
	:class="[$style.root, { [$style.reacted]: myReaction == reaction, [$style.canToggle]: canToggle, [$style.small]: prefer.s.reactionsDisplaySize === 'small', [$style.large]: prefer.s.reactionsDisplaySize === 'large' }]"
	@click="toggleReaction()"
	@contextmenu.prevent.stop="menu"
>
	<MkReactionIcon style="pointer-events: none;" :class="prefer.s.limitWidthOfReaction ? $style.limitWidth : ''" :reaction="reaction" :emojiUrl="reactionEmojis[emojiName]"/>
	<span :class="$style.count">{{ count }}</span>
</button>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { getUnicodeEmojiOrNull } from '@features/emojis/frontend/shared/emojilist.js';
import { getEmojiNameFromReaction, isLocalCustomEmojiReaction } from '@features/emojis/frontend/shared/emoji-name.js';
import MkCustomEmojiDetailedDialog from '@features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu';
import XDetails from '@features/notes/frontend/components/MkReactionsViewer.details.vue';
import MkReactionIcon from '@features/notes/frontend/components/MkReactionIcon.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi, misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { useTooltip } from '@features/ui/frontend/composables/use-tooltip.js';
import { $i } from '@features/auth/frontend/i.js';
import MkReactionEffect from '@features/notes/frontend/components/MkReactionEffect.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
// import { checkReactionPermissions } from '@/utility/check-reaction-permissions.js';
import { customEmojisMap } from '@features/emojis/frontend/custom-emojis.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { noteEvents } from '@features/notes/frontend/composables/use-note-capture.js';
import { mute as muteEmoji, unmute as unmuteEmoji, checkMuted as isEmojiMuted } from '@features/emojis/frontend/utility/emoji-mute.js';
import { addToEmojiPalette } from '@features/emojis/frontend/utility/emoji-palette.js';
import { haptic } from '@features/ui/frontend/utility/haptic.js';

const props = defineProps<{
	noteId: Misskey.entities.Note['id'];
	reaction: string;
	reactionEmojis: Misskey.entities.Note['reactionEmojis'];
	myReaction: Misskey.entities.Note['myReaction'];
	count: number;
	isInitial: boolean;
}>();

const mock = inject(DI.mock, false);

const emit = defineEmits<{
	(ev: 'reactionToggled', emoji: string, newCount: number): void;
}>();

const buttonEl = useTemplateRef('buttonEl');

const emojiName = computed(() => getEmojiNameFromReaction(props.reaction));

const isLocalCustomEmoji = computed(() => isLocalCustomEmojiReaction(props.reaction));

const canToggle = computed(() => {
	const emoji = isLocalCustomEmoji.value ? customEmojisMap.get(emojiName.value) : getUnicodeEmojiOrNull(props.reaction);

	// TODO
	//return $i != null && emoji != null && checkReactionPermissions($i, props.note, emoji);
	return $i != null && emoji != null;
});

async function toggleReaction() {
	if (!canToggle.value) return;
	if ($i == null) return;

	const me = $i;

	const oldReaction = props.myReaction;
	if (oldReaction) {
		const confirm = await os.confirm({
			type: 'warning',
			text: oldReaction !== props.reaction ? $locale.value.sfc.changeReactionConfirm : $locale.value.sfc.cancelReactionConfirm,
		});
		if (confirm.canceled) return;

		if (oldReaction !== props.reaction) {
			sound.playMisskeySfx('reaction');
			haptic();
		}

		if (mock) {
			emit('reactionToggled', props.reaction, (props.count - 1));
			return;
		}

		misskeyApi('notes/reactions/delete', {
			noteId: props.noteId,
		}).then(() => {
			noteEvents.emit(`unreacted:${props.noteId}`, {
				userId: me.id,
				reaction: oldReaction,
			});
			if (oldReaction !== props.reaction) {
				misskeyApi('notes/reactions/create', {
					noteId: props.noteId,
					reaction: props.reaction,
				}).then(() => {
					const emoji = customEmojisMap.get(emojiName.value);
					if (emoji == null && getUnicodeEmojiOrNull(props.reaction) == null) {
						return;
					}
					noteEvents.emit(`reacted:${props.noteId}`, {
						userId: me.id,
						reaction: props.reaction,
						emoji: emoji,
					});
				});
			}
		});
	} else {
		if (prefer.s.confirmOnReact) {
			const confirm = await os.confirm({
				type: 'question',
				text: interpolateLocaleParameters($locale.value.sfc.reactAreYouSure, { emoji: props.reaction.replace('@.', '') }),
			});

			if (confirm.canceled) return;
		}

		sound.playMisskeySfx('reaction');
		haptic();

		if (mock) {
			emit('reactionToggled', props.reaction, (props.count + 1));
			return;
		}

		misskeyApi('notes/reactions/create', {
			noteId: props.noteId,
			reaction: props.reaction,
		}).then(() => {
			const emoji = customEmojisMap.get(emojiName.value);
			if (emoji == null && getUnicodeEmojiOrNull(props.reaction) == null) {
				return;
			}

			noteEvents.emit(`reacted:${props.noteId}`, {
				userId: me.id,
				reaction: props.reaction,
				emoji: emoji,
			});
		});
		// TODO: 上位コンポーネントでやる
		//if (props.note.text && props.note.text.length > 100 && (Date.now() - new Date(props.note.createdAt).getTime() < 1000 * 3)) {
		//	claimAchievement('reactWithoutRead');
		//}
	}
}

async function menu(ev: PointerEvent) {
	let menuItems: MenuItem[] = [];

	if (isLocalCustomEmoji.value) {
		menuItems.push({
			text: $locale.value.sfc.info,
			icon: 'ti ti-info-circle',
			action: async () => {
				const { dispose } = os.popup(MkCustomEmojiDetailedDialog, {
					emoji: await misskeyApiGet('emoji', {
						name: emojiName.value,
					}),
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	if (isEmojiMuted(props.reaction).value) {
		menuItems.push({
			text: $locale.value.sfc.emojiUnmute,
			icon: 'ti ti-mood-smile',
			action: () => {
				os.confirm({
					type: 'question',
					title: interpolateLocaleParameters($locale.value.sfc.unmuteX, { x: isLocalCustomEmoji.value ? `:${emojiName.value}:` : props.reaction }),
				}).then(({ canceled }) => {
					if (canceled) return;
					unmuteEmoji(props.reaction);
				});
			},
		});
	} else {
		menuItems.push({
			text: $locale.value.sfc.emojiMute,
			icon: 'ti ti-mood-off',
			action: () => {
				os.confirm({
					type: 'question',
					title: interpolateLocaleParameters($locale.value.sfc.muteX, { x: isLocalCustomEmoji.value ? `:${emojiName.value}:` : props.reaction }),
				}).then(({ canceled }) => {
					if (canceled) return;
					muteEmoji(props.reaction);
				});
			},
		});
	}

	if (canToggle.value) {
		menuItems.push({
			text: $locale.value.sfc.addToEmojiPalette,
			icon: 'ti ti-palette',
			action: () => {
				addToEmojiPalette(isLocalCustomEmoji.value ? `:${emojiName.value}:` : props.reaction);
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function anime() {
	if (window.document.hidden || !prefer.s.animation || buttonEl.value == null) return;

	const rect = buttonEl.value.getBoundingClientRect();
	const x = rect.left + 16;
	const y = rect.top + (buttonEl.value.offsetHeight / 2);
	const { dispose } = os.popup(MkReactionEffect, { reaction: props.reaction, x, y }, {
		end: () => dispose(),
	});
}

watch(() => props.count, (newCount, oldCount) => {
	if (oldCount < newCount) anime();
});

onMounted(() => {
	if (!props.isInitial) anime();
});

if (!mock) {
	useTooltip(buttonEl, async (showing) => {
		if (buttonEl.value == null) return;

		const reactions = await misskeyApi('notes/reactions', {
			noteId: props.noteId,
			type: props.reaction,
			limit: 10,
		});

		const users = reactions.map(x => x.user);

		const { dispose } = os.popup(XDetails, {
			showing,
			reaction: props.reaction,
			users,
			count: props.count,
			anchorElement: buttonEl.value,
		}, {
			closed: () => dispose(),
		});
	}, 100);
}
</script>

<style lang="scss" module>
.root {
	display: inline-flex;
	height: 42px;
	padding: 0 6px;
	font-size: 1.5em;
	border-radius: 6px;
	align-items: center;
	justify-content: center;

	&.canToggle {
		background: var(--MI_THEME-buttonBg);

		&:hover {
			background: rgba(0, 0, 0, 0.1);
		}
	}

	&:not(.canToggle) {
		cursor: default;
	}

	&.small {
		height: 32px;
		font-size: 1em;
		border-radius: 4px;

		> .count {
			font-size: 0.9em;
			line-height: 32px;
		}
	}

	&.large {
		height: 52px;
		font-size: 2em;
		border-radius: 8px;

		> .count {
			font-size: 0.6em;
			line-height: 52px;
		}
	}

	&.reacted, &.reacted:hover {
		background: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 1px var(--MI_THEME-accent) inset;

		> .count {
			color: var(--MI_THEME-accent);
		}

		> .icon {
			filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
		}
	}
}

.limitWidth {
	max-width: 70px;
	object-fit: contain;
}

.count {
	font-size: 0.7em;
	line-height: 42px;
	margin: 0 0 0 4px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"changeReactionConfirm": "أتريد تعديل تفاعلك؟",
	"cancelReactionConfirm": "أتريد حذف تفاعلك؟",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "عن",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"changeReactionConfirm": "Vols canviar la teva reacció?",
	"cancelReactionConfirm": "Vols esborrar la teva reacció?",
	"reactAreYouSure": "Vols reaccionar amb \"{emoji}\"?",
	"info": "Informació",
	"emojiUnmute": "Deixar de silenciar emojis",
	"unmuteX": "Deixar de silenciar {x}",
	"emojiMute": "Silenciar emojis",
	"muteX": "Silenciar {x}",
	"addToEmojiPalette": "Afegeix al calaix d'emojis"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"changeReactionConfirm": "Opravdu chcete změnit vaši reakci?",
	"cancelReactionConfirm": "Opravdu chcete odstranit vaší reakci?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Informace",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"changeReactionConfirm": "Möchtest du deine Reaktion wirklich ändern?",
	"cancelReactionConfirm": "Möchtest du deine Reaktion wirklich löschen?",
	"reactAreYouSure": "Willst du eine \"{emoji}\"-Reaktion hinzufügen?",
	"info": "Über",
	"emojiUnmute": "Emoji-Stummschaltung aufheben",
	"unmuteX": "Stummschaltung von {x} aufheben",
	"emojiMute": "Emoji stummschalten",
	"muteX": "{x} stummschalten",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="en-US">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"changeReactionConfirm": "¿Realmente quieres cambiar la reacción?",
	"cancelReactionConfirm": "¿Realmente quieres eliminar la reacción?",
	"reactAreYouSure": "¿Quieres añadir una reacción «{emoji}»?",
	"info": "Información",
	"emojiUnmute": "No silenciar emoji",
	"unmuteX": "Dejar de silenciar {x}",
	"emojiMute": "Silenciar emoji",
	"muteX": "Silenciar {x}",
	"addToEmojiPalette": "Añadir a la paleta de emojis"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"changeReactionConfirm": "Changer la réaction ?",
	"cancelReactionConfirm": "Supprimez la réaction ?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Informations",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"changeReactionConfirm": "Yakin untuk mengganti reaksimu?",
	"cancelReactionConfirm": "Yakin untuk menghapus reaksimu?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Informasi",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"changeReactionConfirm": "Vuoi cambiare la tua reazione?",
	"cancelReactionConfirm": "Vuoi annullare la tua reazione?",
	"reactAreYouSure": "Vuoi davvero reagire con {emoji} ?",
	"info": "Informazioni",
	"emojiUnmute": "De silenzia emoji",
	"unmuteX": "De silenzia {x}",
	"emojiMute": "Silenzia emoji",
	"muteX": "Silenzia {x}",
	"addToEmojiPalette": "Aggiungi alla tavolozza emoji"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"changeReactionConfirm": "リアクションを変更しますか？",
	"cancelReactionConfirm": "リアクションを取り消しますか？",
	"reactAreYouSure": "\" {emoji} \" をリアクションしますか？",
	"info": "情報",
	"emojiUnmute": "絵文字ミュート解除",
	"unmuteX": "{x}のミュートを解除",
	"emojiMute": "絵文字ミュート",
	"muteX": "{x}をミュート",
	"addToEmojiPalette": "絵文字パレットに追加"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"changeReactionConfirm": "ツッコミを別のに変えるか？",
	"cancelReactionConfirm": "ツッコむんをやっぱやめるか？",
	"reactAreYouSure": "\" {emoji} \" でツッコむ？",
	"info": "情報",
	"emojiUnmute": "絵文字ミュートやめたる",
	"unmuteX": "{x}のミュートやめたる",
	"emojiMute": "絵文字ミュート",
	"muteX": "{x}をミュート",
	"addToEmojiPalette": "絵文字パレットに追加"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"changeReactionConfirm": "리액션을 변경하시겠습니까?",
	"cancelReactionConfirm": "리액션을 취소하시겠습니까?",
	"reactAreYouSure": "\" {emoji} \"로 리액션하시겠습니까?",
	"info": "정보",
	"emojiUnmute": "이모티콘 뮤트 해제",
	"unmuteX": "{x}의 뮤트를 해제",
	"emojiMute": "이모티콘 뮤트",
	"muteX": "{x}를 뮤트",
	"addToEmojiPalette": "이모지 팔레트에 추가"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Over",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Infomasjon",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Informacje",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"changeReactionConfirm": "Realmente mudar a sua reação?",
	"cancelReactionConfirm": "Realmente excluir a sua reação?",
	"reactAreYouSure": "Você deseja adicionar uma reação \"{emoji}\"?",
	"info": "Informações",
	"emojiUnmute": "Reativar emoji",
	"unmuteX": "Reativar {x}",
	"emojiMute": "Silenciar emoji",
	"muteX": "Silenciar {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"changeReactionConfirm": "Вы действительно хотите удалить свою реакцию?",
	"cancelReactionConfirm": "Вы действительно хотите удалить свою реакцию?",
	"reactAreYouSure": "Добавить {emoji}?",
	"info": "Описание",
	"emojiUnmute": "Показать эмодзи",
	"unmuteX": "Показать {x}",
	"emojiMute": "Скрыть эмодзи",
	"muteX": "Скрыть {x}",
	"addToEmojiPalette": "Добавить к палитре эмодзи"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "Informácie",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"changeReactionConfirm": "ต้องการเปลี่ยนรีแอคชั่นใช่ไหม?",
	"cancelReactionConfirm": "ต้องการลบรีแอคชั่นใช่ไหม?",
	"reactAreYouSure": "ต้องการใส่รีแอคชั่นด้วย \"{emoji}\" หรือไม่?",
	"info": "เกี่ยวกับ",
	"emojiUnmute": "เลิกปิดเสียงเอโมจิ",
	"unmuteX": "เลิกปิดเสียง {x}",
	"emojiMute": "ปิดเสียงเอโมจิ",
	"muteX": "ปิดเสียง {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"changeReactionConfirm": "Tepkini cidden değiştirmek istiyor musun?",
	"cancelReactionConfirm": "Tepkini cidden silmek istiyor musun?",
	"reactAreYouSure": "“{emoji}” tepkisini eklemek ister misin?",
	"info": "Hakkında",
	"emojiUnmute": "Emoji ses aç",
	"unmuteX": "Sesi aç {x}",
	"emojiMute": "Emoji ses kapat",
	"muteX": "Sessiz {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"changeReactionConfirm": "Really change your reaction?",
	"cancelReactionConfirm": "Really delete your reaction?",
	"reactAreYouSure": "Would you like to add a \"{emoji}\" reaction?",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"changeReactionConfirm": "Справді змінити вашу реакцію?",
	"cancelReactionConfirm": "Справді видалити вашу реакцію?",
	"reactAreYouSure": "Бажали б ви додати реакцію {emoji}?",
	"info": "Інформація",
	"emojiUnmute": "Показувати емодзі",
	"unmuteX": "Показувати {x}",
	"emojiMute": "Приховати емодзі",
	"muteX": "Приховати {x}",
	"addToEmojiPalette": "Додати до палітри емодзі"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"changeReactionConfirm": "Bạn có muốn thay đổi phản ứng của mình không?",
	"cancelReactionConfirm": "Bạn có muốn hủy phản ứng của mình không?",
	"reactAreYouSure": "Bạn có muốn phản hồi với \" {emoji} \" không?",
	"info": "Giới thiệu",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}",
	"emojiMute": "Mute emoji",
	"muteX": "Mute {x}",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"changeReactionConfirm": "要更改回应吗？",
	"cancelReactionConfirm": "要取消回应吗？",
	"reactAreYouSure": "要用 “{emoji}” 进行回应吗？",
	"info": "关于",
	"emojiUnmute": "取消屏蔽表情符号",
	"unmuteX": "取消对{x}的隐藏",
	"emojiMute": "屏蔽表情符号",
	"muteX": "隐藏{x}",
	"addToEmojiPalette": "添加至表情符号选择器"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"changeReactionConfirm": "要更改反應嗎？",
	"cancelReactionConfirm": "要取消此反應嗎？",
	"reactAreYouSure": "用「 {emoji} 」反應嗎？",
	"info": "資訊",
	"emojiUnmute": "表情符號解除靜音",
	"unmuteX": "將 {x} 解除靜音",
	"emojiMute": "表情符號靜音",
	"muteX": "將 {x} 靜音",
	"addToEmojiPalette": "增加表情符號調色盤"
}
</locale>
