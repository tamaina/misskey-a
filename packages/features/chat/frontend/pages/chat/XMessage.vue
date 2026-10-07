<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.isMe]: isMe }]">
	<MkAvatar :class="[$style.avatar, prefer.s.useStickyIcons ? $style.useSticky : null]" :user="message.fromUser!" :link="!isMe" :preview="false"/>
	<div :class="[$style.body, message.file != null ? $style.fullWidth : null]" @contextmenu.stop="onContextmenu">
		<div :class="$style.header"><MkUserName v-if="!isMe && prefer.s['chat.showSenderName'] && message.fromUser != null" :user="message.fromUser"/></div>
		<MkFukidashi :class="$style.fukidashi" :tail="isMe ? 'right' : 'left'" :fullWidth="message.file != null" :accented="isMe">
			<Mfm
				v-if="message.text"
				ref="text"
				class="_selectable"
				:text="message.text"
				:i="$i"
				:nyaize="'respect'"
				:enableEmojiMenu="true"
				:enableEmojiMenuReaction="true"
			/>
			<MkMediaList v-if="message.file" :mediaList="[message.file]" :user="message.fromUser"/>
		</MkFukidashi>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" style="margin: 8px 0;"/>
		<div :class="$style.footer">
			<button class="_textButton" style="color: currentColor;" @click="showMenu"><i class="ti ti-dots-circle-horizontal"></i></button>
			<MkTime :class="$style.time" :time="message.createdAt"/>
			<MkA v-if="isSearchResult && 'toRoom' in message && message.toRoom != null" :to="`/chat/room/${message.toRoomId}`">{{ message.toRoom.name }}</MkA>
			<MkA v-if="isSearchResult && 'toUser' in message && message.toUser != null && isMe" :to="`/chat/user/${message.toUserId}`">@{{ message.toUser.username }}</MkA>
		</div>
		<TransitionGroup
			:enterActiveClass="prefer.s.animation ? $style.transition_reaction_enterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.transition_reaction_leaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.transition_reaction_enterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.transition_reaction_leaveTo : ''"
			:moveClass="prefer.s.animation ? $style.transition_reaction_move : ''"
			tag="div" :class="$style.reactions"
		>
			<div v-for="record in message.reactions" :key="record.reaction + record.user.id" :class="[$style.reaction, record.user.id === $i.id ? $style.reactionMy : null]" @click="onReactionClick(record)">
				<MkAvatar :user="record.user" :link="false" :class="$style.reactionAvatar"/>
				<MkReactionIcon
					:withTooltip="true"
					:reaction="record.reaction.replace(/^:(\w+):$/, ':$1@.:')"
					:noStyle="true"
					:class="$style.reactionIcon"
				/>
			</div>
		</TransitionGroup>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, provide } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import { isLink } from '@features/ui/frontend/shared/is-link.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { NormalizedChatMessage } from '@features/chat/frontend/pages/chat/room.vue';
import { extractUrlFromMfm } from '@features/markup/frontend/utility/extract-url-from-mfm.js';
import MkUrlPreview from '@features/markup/frontend/components/MkUrlPreview.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkFukidashi from '@features/ui/frontend/components/MkFukidashi.vue';
import * as os from '@features/ui/frontend/os.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import MkMediaList from '@features/media/frontend/components/MkMediaList.vue';
import { reactionPicker } from '@features/notes/frontend/utility/reaction-picker.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
import MkReactionIcon from '@features/notes/frontend/components/MkReactionIcon.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { getHTMLElementOrNull } from '@features/ui/frontend/utility/get-dom-node-or-null.js';

const $i = ensureSignin();

const props = defineProps<{
	message: NormalizedChatMessage | Misskey.entities.ChatMessage;
	isSearchResult?: boolean;
}>();

const isMe = computed(() => props.message.fromUserId === $i.id);
const urls = computed(() => props.message.text ? extractUrlFromMfm(mfm.parse(props.message.text)) : []);

provide(DI.mfmEmojiReactCallback, (reaction) => {
	if ($i.policies.chatAvailability !== 'available') return;

	sound.playMisskeySfx('reaction');
	misskeyApi('chat/messages/react', {
		messageId: props.message.id,
		reaction: reaction,
	});
});

function react(ev: PointerEvent) {
	if ($i.policies.chatAvailability !== 'available') return;

	const targetEl = getHTMLElementOrNull(ev.currentTarget ?? ev.target);
	if (!targetEl) return;

	reactionPicker.show(targetEl, null, async (reaction) => {
		sound.playMisskeySfx('reaction');
		misskeyApi('chat/messages/react', {
			messageId: props.message.id,
			reaction: reaction,
		});
	});
}

function onReactionClick(record: Misskey.entities.ChatMessage['reactions'][0]) {
	if ($i.policies.chatAvailability !== 'available') return;

	if (record.user.id === $i.id) {
		misskeyApi('chat/messages/unreact', {
			messageId: props.message.id,
			reaction: record.reaction,
		});
	} else {
		if (!props.message.reactions.some(r => r.user.id === $i.id && r.reaction === record.reaction)) {
			sound.playMisskeySfx('reaction');
			misskeyApi('chat/messages/react', {
				messageId: props.message.id,
				reaction: record.reaction,
			});
		}
	}
}

function onContextmenu(ev: PointerEvent) {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	showMenu(ev, true);
}

function showMenu(ev: PointerEvent, contextmenu = false) {
	const menu: MenuItem[] = [];

	if (!isMe.value && $i.policies.chatAvailability === 'available') {
		menu.push({
			text: $locale.value.sfc.reaction,
			icon: 'ti ti-mood-plus',
			action: (ev) => {
				react(ev);
			},
		});

		menu.push({
			type: 'divider',
		});
	}

	menu.push({
		text: $locale.value.sfc.copyContent,
		icon: 'ti ti-copy',
		action: () => {
			copyToClipboard(props.message.text ?? '');
		},
	});

	menu.push({
		type: 'divider',
	});

	if (isMe.value && $i.policies.chatAvailability === 'available') {
		menu.push({
			text: $locale.value.sfc.delete,
			icon: 'ti ti-trash',
			danger: true,
			action: () => {
				misskeyApi('chat/messages/delete', {
					messageId: props.message.id,
				});
			},
		});
	}

	if (!isMe.value && props.message.fromUser != null) {
		menu.push({
			text: $locale.value.sfc.reportAbuse,
			icon: 'ti ti-exclamation-circle',
			action: async () => {
				const localUrl = `${url}/chat/messages/${props.message.id}`;
				const { dispose } = await os.popupAsyncWithDialog(import('@features/moderation/frontend/components/MkAbuseReportWindow.vue').then(x => x.default), {
					user: props.message.fromUser!,
					initialComment: `${localUrl}\n-----\n`,
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	if (contextmenu) {
		os.contextMenu(menu, ev);
	} else {
		os.popupMenu(menu, ev.currentTarget ?? ev.target);
	}
}
</script>

<style lang="scss" module>
.transition_reaction_move,
.transition_reaction_enterActive,
.transition_reaction_leaveActive {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.transition_reaction_enterFrom,
.transition_reaction_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_reaction_leaveActive {
	position: absolute;
}

.root {
	position: relative;
	display: flex;

	&.isMe {
		flex-direction: row-reverse;
		text-align: right;

		.footer {
			flex-direction: row-reverse;
		}
	}
}

.avatar {
	display: block;
	width: 50px;
	height: 50px;

	&.useSticky {
		position: sticky;
		top: calc(16px + var(--MI-stickyTop, 0px));
	}
}

@container (max-width: 450px) {
	.root {
		&.isMe {
			.avatar {
				display: none;
			}
		}
	}

	.avatar {
		width: 42px;
		height: 42px;
	}

	.fukidashi {
		font-size: 90%;
	}
}

.body {
	margin: 0 12px;

	&.fullWidth {
		width: 100%;
	}
}

.header {
	min-height: 4px; // fukidashiの位置調整も兼ねるため
	font-size: 80%;
}

.fukidashi {
	text-align: left;
}

.content {
	overflow: clip;
	overflow-wrap: break-word;
	word-break: break-word;
}

.footer {
	display: flex;
	flex-direction: row;
	gap: 0.5em;
	margin-top: 4px;
	font-size: 75%;
}

.time {
	opacity: 0.5;
}

.reactions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-top: 8px;

	&:empty {
		display: none;
	}
}

.reaction {
	display: flex;
	align-items: center;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 999px;
	padding: 8px;

	&.reactionMy {
		border-color: var(--MI_THEME-accent);
	}
}

.reactionAvatar {
	width: 24px;
	height: 24px;
	margin-right: 8px;
}

.reactionIcon {
	width: 24px;
	height: 24px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"reaction": "التفاعلات",
	"copyContent": "انسخ المحتوى",
	"delete": "حذف",
	"reportAbuse": "أبلغ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"reaction": "Reacció ",
	"copyContent": "Copia el contingut",
	"delete": "Elimina",
	"reportAbuse": "Denuncia un abús "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"reaction": "Reakce",
	"copyContent": "Zkopírovat obsah",
	"delete": "Smazat",
	"reportAbuse": "Nahlášení"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"reaction": "Reactions",
	"copyContent": "Copy contents",
	"delete": "Delete",
	"reportAbuse": "Report"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"reaction": "Reaktionen",
	"copyContent": "Inhalt kopieren",
	"delete": "Löschen",
	"reportAbuse": "Melden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"reaction": "Reactions",
	"copyContent": "Copy contents",
	"delete": "Delete",
	"reportAbuse": "Report"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"reaction": "Reacción",
	"copyContent": "Copiar contenido",
	"delete": "Borrar",
	"reportAbuse": "Reportar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"reaction": "Réactions",
	"copyContent": "Copier le contenu",
	"delete": "Supprimer",
	"reportAbuse": "Signaler"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"reaction": "Reaksi",
	"copyContent": "Salin isi",
	"delete": "Hapus",
	"reportAbuse": "Laporkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"reaction": "Reazioni",
	"copyContent": "Copia il contenuto",
	"delete": "Elimina",
	"reportAbuse": "Segnalare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"reaction": "リアクション",
	"copyContent": "内容をコピー",
	"delete": "削除",
	"reportAbuse": "通報"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"reaction": "ツッコミ",
	"copyContent": "内容をコピー",
	"delete": "ほかす",
	"reportAbuse": "通報"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"reaction": "Reactions",
	"copyContent": "Copy contents",
	"delete": "Kkes",
	"reportAbuse": "Report"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"reaction": "Reactions",
	"copyContent": "ವಿಷಯವನ್ನು ನಕಲಿಸು",
	"delete": "ಅಳಿಸು",
	"reportAbuse": "Report"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"reaction": "리액션",
	"copyContent": "내용 복사",
	"delete": "삭제",
	"reportAbuse": "신고"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"reaction": "Reacties",
	"copyContent": "Kopiëren inhoud",
	"delete": "Verwijderen",
	"reportAbuse": "Meld"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"reaction": "Reaksjon",
	"copyContent": "Kopier innhold",
	"delete": "Slett",
	"reportAbuse": "Rappoter"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"reaction": "Reakcja",
	"copyContent": "Skopiuj zawartość",
	"delete": "Usuń",
	"reportAbuse": "Zgłoś"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"reaction": "Reações",
	"copyContent": "Copiar conteúdos",
	"delete": "Excluir",
	"reportAbuse": "Denunciar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"reaction": "Реакции",
	"copyContent": "Скопировать содержимое",
	"delete": "Удалить",
	"reportAbuse": "Жалоба"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"reaction": "Reakcie",
	"copyContent": "Kopírovať obsah",
	"delete": "Odstrániť",
	"reportAbuse": "Nahlásiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"reaction": "รีแอคชั่น",
	"copyContent": "คัดลอกเนื้อหา",
	"delete": "ลบ",
	"reportAbuse": "รายงาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"reaction": "Tepki",
	"copyContent": "İçeriği kopyala",
	"delete": "Sil",
	"reportAbuse": "Rapor"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"reaction": "Reactions",
	"copyContent": "Copy contents",
	"delete": "ئۆچۈرۈش",
	"reportAbuse": "Report"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"reaction": "Реакції",
	"copyContent": "Скопіювати контент",
	"delete": "Видалити",
	"reportAbuse": "Поскаржитись"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"reaction": "Biểu cảm",
	"copyContent": "Chép nội dung",
	"delete": "Xóa",
	"reportAbuse": "Báo cáo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"reaction": "回应",
	"copyContent": "复制内容",
	"delete": "删除",
	"reportAbuse": "举报"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"reaction": "反應",
	"copyContent": "複製內容",
	"delete": "刪除",
	"reportAbuse": "檢舉"
}
</locale>
