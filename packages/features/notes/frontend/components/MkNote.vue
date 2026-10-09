<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-if="!hardMuted && !hideByPlugin && muted === false"
	ref="rootEl"
	v-hotkey="keymap"
	:class="[$style.root, { [$style.showActionsOnlyHover]: prefer.s.showNoteActionsOnlyHover, [$style.skipRender]: prefer.s.skipNoteRender }]"
	tabindex="0"
>
	<MkNoteSub v-if="appearNote.replyId && !renoteCollapsed" :note="appearNote?.reply ?? null" :class="$style.replyTo"/>
	<div v-if="pinned" :class="$style.tip"><i class="ti ti-pin"></i> {{ $locale.sfc.pinnedNote }}</div>
	<div v-if="isRenote" :class="$style.renote">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<MkAvatar :class="$style.renoteAvatar" :user="note.user" link preview/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<I18n :src="$locale.sfc.renotedBy" tag="span" :class="$style.renoteText">
			<template #user>
				<MkA v-user-preview="note.userId" :class="$style.renoteUserName" :to="userPage(note.user)">
					<MkUserName :user="note.user"/>
				</MkA>
			</template>
		</I18n>
		<div :class="$style.renoteInfo">
			<button ref="renoteTime" :class="$style.renoteTime" class="_button" @mousedown.prevent="showRenoteMenu()">
				<i class="ti ti-dots" :class="$style.renoteMenu"></i>
				<MkTime :time="note.createdAt"/>
			</button>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
			<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
		</div>
	</div>
	<div v-if="isRenote && note.renote == null" :class="$style.deleted">
		{{ $locale.sfc.deletedNote }}
	</div>
	<div v-else-if="renoteCollapsed" :class="$style.collapsedRenoteTarget">
		<MkAvatar :class="$style.collapsedRenoteTargetAvatar" :user="appearNote.user" link preview/>
		<Mfm :text="getNoteSummary(appearNote)" :plain="true" :nowrap="true" :author="appearNote.user" :nyaize="'respect'" :class="$style.collapsedRenoteTargetText" @click="renoteCollapsed = false"/>
	</div>
	<article v-else :class="$style.article" @contextmenu.stop="onContextmenu">
		<div v-if="appearNote.channel" :class="$style.colorBar" :style="{ background: appearNote.channel.color }"></div>
		<MkAvatar :class="[$style.avatar, prefer.s.useStickyIcons ? $style.useSticky : null]" :user="appearNote.user" :link="!mock" :preview="!mock"/>
		<div :class="$style.main">
			<MkNoteHeader :note="appearNote" :mini="true"/>
			<MkInstanceTicker v-if="showTicker" :host="appearNote.user.host" :instance="appearNote.user.instance"/>
			<div style="container-type: inline-size;">
				<p v-if="appearNote.cw != null" :class="$style.cw">
					<Mfm
						v-if="appearNote.cw != ''"
						:text="appearNote.cw"
						:author="appearNote.user"
						:nyaize="'respect'"
						:enableEmojiMenu="true"
						:enableEmojiMenuReaction="true"
					/>
					<MkCwButton v-model="showContent" :text="appearNote.text" :renote="appearNote.renote" :files="appearNote.files" :poll="appearNote.poll" style="margin: 4px 0;"/>
				</p>
				<div v-show="appearNote.cw == null || showContent" :class="[{ [$style.contentCollapsed]: collapsed }]">
					<div :class="$style.text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $locale.sfc.private }})</span>
						<MkA v-if="appearNote.replyId" :class="$style.replyIcon" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
						<Mfm
							v-if="appearNote.text"
							:parsedNodes="parsed"
							:text="appearNote.text"
							:author="appearNote.user"
							:nyaize="'respect'"
							:emojiUrls="appearNote.emojis"
							:enableEmojiMenu="true"
							:enableEmojiMenuReaction="true"
							class="_selectable"
						/>
						<div v-if="translating || translation" :class="$style.translation">
							<MkLoading v-if="translating" mini/>
							<div v-else-if="translation">
								<b>{{ interpolateLocaleParameters($locale.sfc.translatedFrom, { x: translation.sourceLang }) }}: </b>
								<Mfm :text="translation.text" :author="appearNote.user" :nyaize="'respect'" :emojiUrls="appearNote.emojis" class="_selectable"/>
							</div>
						</div>
					</div>
					<div v-if="appearNote.files && appearNote.files.length > 0" style="margin-top: 8px;">
						<MkMediaList ref="galleryEl" :mediaList="appearNote.files" :user="appearNote.user"/>
					</div>
					<MkPoll
						v-if="appearNote.poll"
						:noteId="appearNote.id"
						:multiple="appearNote.poll.multiple"
						:expiresAt="appearNote.poll.expiresAt"
						:choices="$appearNote.pollChoices"
						:author="appearNote.user"
						:emojiUrls="appearNote.emojis"
						:class="$style.poll"
					/>
					<div v-if="isEnabledUrlPreview">
						<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false" :class="$style.urlPreview"/>
					</div>
					<div v-if="appearNote.renoteId" :class="$style.quote"><MkNoteSimple :note="appearNote?.renote ?? null" :class="$style.quoteNote"/></div>
					<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
						<span :class="$style.collapsedLabel">{{ $locale.sfc.showMore }}</span>
					</button>
					<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
						<span :class="$style.showLessLabel">{{ $locale.sfc.showLess }}</span>
					</button>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
			</div>
			<MkReactionsViewer
				v-if="appearNote.reactionAcceptance !== 'likeOnly'"
				style="margin-top: 6px;"
				:reactions="$appearNote.reactions"
				:reactionEmojis="$appearNote.reactionEmojis"
				:myReaction="$appearNote.myReaction"
				:noteId="appearNote.id"
				:maxNumber="16"
				@mockUpdateMyReaction="emitUpdReaction"
			>
				<template #more>
					<MkA :to="`/notes/${appearNote.id}/reactions`" :class="[$style.reactionOmitted]">{{ $locale.sfc.more }}</MkA>
				</template>
			</MkReactionsViewer>
			<footer :class="$style.footer">
				<button :class="$style.footerButton" class="_button" @click="reply()">
					<i class="ti ti-arrow-back-up"></i>
					<p v-if="appearNote.repliesCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.repliesCount) }}</p>
				</button>
				<button
					v-if="canRenote"
					ref="renoteButton"
					:class="$style.footerButton"
					class="_button"
					@mousedown.prevent="renote()"
				>
					<i class="ti ti-repeat"></i>
					<p v-if="appearNote.renoteCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.renoteCount) }}</p>
				</button>
				<button v-else :class="$style.footerButton" class="_button" disabled>
					<i class="ti ti-ban"></i>
				</button>
				<button ref="reactButton" :class="$style.footerButton" class="_button" @click="handleToggleReact()">
					<i v-if="appearNote.reactionAcceptance === 'likeOnly' && $appearNote.myReaction != null" class="ti ti-heart-filled" style="color: var(--MI_THEME-love);"></i>
					<i v-else-if="$appearNote.myReaction != null" class="ti ti-minus" style="color: var(--MI_THEME-accent);"></i>
					<i v-else-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
					<i v-else class="ti ti-plus"></i>
					<p v-if="(appearNote.reactionAcceptance === 'likeOnly' || prefer.s.showReactionsCount) && $appearNote.reactionCount > 0" :class="$style.footerButtonCount">{{ number($appearNote.reactionCount) }}</p>
				</button>
				<button v-if="prefer.s.showClipButtonInNoteFooter" ref="clipButton" :class="$style.footerButton" class="_button" @mousedown.prevent="clip()">
					<i class="ti ti-paperclip"></i>
				</button>
				<button ref="menuButton" :class="$style.footerButton" class="_button" @mousedown.prevent="showMenu()">
					<i class="ti ti-dots"></i>
				</button>
			</footer>
		</div>
	</article>
</div>
<div v-else-if="!hardMuted && !hideByPlugin" :class="$style.muted" @click="muted = false">
	<I18n v-if="muted === 'sensitiveMute'" :src="$locale.sfc.userSaysSomethingSensitive" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
	<I18n v-else-if="showSoftWordMutedWord !== true" :src="$locale.sfc.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
	<I18n v-else :src="$locale.sfc.userSaysSomethingAbout" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
		<template #word>
			{{ Array.isArray(muted) ? muted.map(words => Array.isArray(words) ? words.join() : words).slice(0, 3).join(' ') : muted }}
		</template>
	</I18n>
</div>
<div v-else>
	<!--
		MkDateSeparatedList uses TransitionGroup which requires single element in the child elements
		so MkNote create empty div instead of no elements
	-->
</div>
</template>

<script lang="ts" setup>
import { inject, ref, useTemplateRef, provide, computed } from 'vue';
import type { Ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useNote } from '@features/notes/frontend/composables/use-note.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import { getNoteSummary } from '@features/notes/frontend/utility/get-note-summary.js';
import { isEnabledUrlPreview } from '@features/markup/frontend/utility/url-preview.js';
import { focusPrev, focusNext } from '@features/ui/frontend/utility/focus.js';
import number from '@features/ui/frontend/filters/number.js';
import { DI } from '@features/ui/frontend/di.js';
import type { Keymap } from '@features/ui/frontend/utility/hotkey.js';

// コンポーネント外部の依存関係
import MkNoteSub from '@features/notes/frontend/components/MkNoteSub.vue';
import MkNoteHeader from '@features/notes/frontend/components/MkNoteHeader.vue';
import MkNoteSimple from '@features/notes/frontend/components/MkNoteSimple.vue';
import MkReactionsViewer from '@features/notes/frontend/components/MkReactionsViewer.vue';
import MkMediaList from '@features/drive/frontend/components/MkMediaList.vue';
import MkCwButton from '@features/notes/frontend/components/MkCwButton.vue';
import MkPoll from '@features/notes/frontend/components/MkPoll.vue';
import MkUrlPreview from '@features/markup/frontend/components/MkUrlPreview.vue';
import MkInstanceTicker from '@features/federation/frontend/components/MkInstanceTicker.vue';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	pinned?: boolean;
	mock?: boolean;
	withHardMute?: boolean;
}>(), {
	mock: false,
});

const emit = defineEmits<{
	(ev: 'reaction', emoji: string): void;
	(ev: 'removeReaction', emoji: string): void;
}>();

provide(DI.mock, props.mock);

// 周辺コンテキストのインジェクト
const inTimeline = inject<boolean>('inTimeline', false);
const tl_withSensitive = inject<Ref<boolean>>('tl_withSensitive', ref(true));
const inChannel = inject(DI.inChannel, null);
const currentClip = inject<Ref<Misskey.entities.Clip> | null>('currentClip', null);
const currentAntenna = inject<Ref<Misskey.entities.Antenna | null> | null>('currentAntenna', null);

// Template Refsの定義
const rootEl = useTemplateRef('rootEl');
const menuButton = useTemplateRef('menuButton');
const renoteButton = useTemplateRef('renoteButton');
const renoteTime = useTemplateRef('renoteTime');
const reactButton = useTemplateRef('reactButton');
const clipButton = useTemplateRef('clipButton');
const galleryEl = useTemplateRef('galleryEl');

// コンポーサブルの呼び出し
const {
	note,
	appearNote,
	$appearNote,
	hideByPlugin,
	isRenote,
	showContent,
	translating,
	translation,
	muted,
	hardMuted,
	collapsed,
	renoteCollapsed,
	parsed,
	urls,
	isLong,
	showTicker,
	canRenote,

	renote,
	reply,
	react,
	reactViaMfmEmoji,
	toggleReact,
	onContextmenu,
	showMenu,
	clip,
	showRenoteMenu,
	blur,
} = useNote(props, {
	rootEl,
	menuButton,
	renoteButton,
	renoteTime,
	reactButton,
	clipButton,
}, {
	inTimeline,
	tl_withSensitive,
	inChannel,
	currentClip,
	currentAntenna,
});

// provide
provide(DI.mfmEmojiReactCallback, reactViaMfmEmoji);

// MkNote固有
const showSoftWordMutedWord = computed(() => prefer.s.showSoftWordMutedWord);

function handleToggleReact() {
	toggleReact((reaction) => {
		if ($appearNote.myReaction === reaction) {
			emit('removeReaction', reaction);
		} else {
			emit('reaction', reaction);
			$appearNote.reactions[reaction] = 1;
			$appearNote.reactionCount++;
			$appearNote.myReaction = reaction;
		}
	});
}

function emitUpdReaction(emoji: string, delta: number) {
	if (delta < 0) {
		emit('removeReaction', emoji);
	} else if (delta > 0) {
		emit('reaction', emoji);
	}
}

// キーボードショートカットマップ
const keymap = {
	'r': () => {
		if (renoteCollapsed.value) return;
		reply();
	},
	'e|a|plus': () => {
		if (renoteCollapsed.value) return;
		react();
	},
	'q': () => {
		if (renoteCollapsed.value) return;
		renote();
	},
	'm': () => {
		if (renoteCollapsed.value) return;
		showMenu();
	},
	'c': () => {
		if (renoteCollapsed.value) return;
		if (!prefer.s.showClipButtonInNoteFooter) return;
		clip();
	},
	'o': () => {
		if (renoteCollapsed.value) return;
		galleryEl.value?.openGallery();
	},
	'v|enter': () => {
		if (renoteCollapsed.value) {
			renoteCollapsed.value = false;
		} else if (appearNote.cw != null) {
			showContent.value = !showContent.value;
		} else if (isLong) {
			collapsed.value = !collapsed.value;
		}
	},
	'esc': {
		allowRepeat: true,
		callback: () => blur(),
	},
	'up|k|shift+tab': {
		allowRepeat: true,
		callback: () => focusPrev(rootEl.value),
	},
	'down|j|tab': {
		allowRepeat: true,
		callback: () => focusNext(rootEl.value),
	},
} as const satisfies Keymap;
</script>

<style lang="scss" module>
.root {
	position: relative;
	font-size: 1.05em;
	overflow: clip;
	contain: content;

	&:focus-visible {
		outline: none;

		&::after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 2px var(--MI_THEME-focus);
			border-radius: var(--MI-radius);
			box-sizing: border-box;
		}
	}

	.footer {
		position: relative;
		z-index: 1;
	}

	&:hover > .article > .main > .footer > .footerButton {
		color: var(--MI_THEME-fg);
	}

	&.showActionsOnlyHover {
		.footer {
			visibility: hidden;
			position: absolute;
			top: 12px;
			right: 12px;
			padding: 0 4px;
			margin-bottom: 0 !important;
			background: var(--MI_THEME-popup);
			border-radius: 8px;
			box-shadow: 0px 4px 32px var(--MI_THEME-shadow);
		}

		.footerButton {
			font-size: 90%;

			&:not(:last-child) {
				margin-right: 0;
			}
		}
	}

	&.showActionsOnlyHover:hover {
		.footer {
			visibility: visible;
		}
	}
}

.skipRender {
	// TODO: これが有効だとTransitionGroupでnoteを追加するときに一瞬がくっとなってしまうのをどうにかしたい
	// Transitionが完了するのを待ってからskipRenderを付与すれば解決しそうだけどパフォーマンス的な影響が不明
	content-visibility: auto;
	contain-intrinsic-size: 0 150px;
}

.tip {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.tip + .article {
	padding-top: 8px;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	position: relative;
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--MI_THEME-renote);

	& + .article {
		padding-top: 8px;
	}

	> .colorBar {
		height: calc(100% - 6px);
	}
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteUserName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renoteMenu {
	margin-right: 4px;
}

.collapsedRenoteTarget {
	display: flex;
	align-items: center;
	line-height: 28px;
	white-space: pre;
	padding: 0 32px 18px;
}

.collapsedRenoteTargetAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
}

.collapsedRenoteTargetText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 90%;
	opacity: 0.7;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}
}

.article {
	position: relative;
	display: flex;
	padding: 28px 32px;
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 16px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block !important;
	margin: 0 14px 0 0;
	width: 58px;
	height: 58px;

	&.useSticky {
		position: sticky !important;
		top: calc(22px + var(--MI-stickyTop, 0px));
		left: 0;
	}
}

.main {
	flex: 1;
	min-width: 0;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--MI-stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--MI_THEME-popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));

	&:hover > .collapsedLabel {
		background: var(--MI_THEME-panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--MI_THEME-panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.text {
	overflow-wrap: break-word;
}

.replyIcon {
	color: var(--MI_THEME-accent);
	margin-right: 0.5em;
}

.translation {
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;
	margin-top: 8px;
}

.urlPreview {
	margin-top: 8px;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--MI_THEME-renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.footer {
	margin-bottom: -14px;
}

.footerButton {
	margin: 0;
	padding: 8px;
	color: color-mix(in srgb, var(--MI_THEME-panel), var(--MI_THEME-fg) 70%); // opacityなど不透明度で表現するとレンダリングパフォーマンスに影響するので通常の色の混合で代用

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--MI_THEME-fgHighlighted);
	}
}

.footerButtonCount {
	display: inline;
	margin: 0 0 0 8px;
}

@container (max-width: 580px) {
	.root {
		font-size: 0.95em;
	}

	.renote {
		padding: 12px 26px 0 26px;
	}

	.article {
		padding: 24px 26px;
	}

	.avatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}

	.renote {
		padding: 10px 22px 0 22px;
	}

	.article {
		padding: 20px 22px;
	}

	.footer {
		margin-bottom: -8px;
	}
}

@container (max-width: 480px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.tip {
		padding: 8px 16px 0 16px;
	}

	.collapsedRenoteTarget {
		padding: 0 16px 9px;
		margin-top: 4px;
	}

	.article {
		padding: 14px 16px;
	}
}

@container (max-width: 450px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 46px;
		height: 46px;

		&.useSticky {
			top: calc(14px + var(--MI-stickyTop, 0px));
		}
	}
}

@container (max-width: 400px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 18px;
			}
		}
	}
}

@container (max-width: 350px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 12px;
			}
		}
	}

	.colorBar {
		top: 6px;
		left: 6px;
		width: 4px;
		height: calc(100% - 12px);
	}
}

@container (max-width: 300px) {
	.avatar {
		width: 44px;
		height: 44px;
	}

	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 8px;
			}
		}
	}
}

@container (max-width: 250px) {
	.quoteNote {
		padding: 12px;
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
}

.deleted {
	text-align: center;
	padding: 32px;
	margin: 6px 32px 28px;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
	border-radius: 8px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pinnedNote": "ملاحظة مثبتة",
	"renotedBy": "أعاد نشرها {user}",
	"visibilityLabels": {
		"public": "علني",
		"publicDescription": "ستكون ملاحظتك مرئية لكل المستخدمين",
		"home": "الرئيسي",
		"homeDescription": "انشر في الخيط الزمني الرئيسي فقط",
		"followers": "المتابِعون",
		"followersDescription": "اجعلها مرئية لمتابِعيك فقط",
		"specified": "مباشرة",
		"specifiedDescription": "اجعلها مرئية لمستخدمين محددين",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "ملاحظة محذوفة",
	"private": "خاص",
	"translatedFrom": "تُرجم من {x}",
	"showMore": "عرض المزيد",
	"showLess": "اغلق",
	"more": "المزيد!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "كتب {name} شيءً",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pinnedNote": "Nota fixada",
	"renotedBy": "Impulsat per {user}",
	"visibilityLabels": {
		"public": "Públic ",
		"publicDescription": "La teva nota la podrà veure tothom ",
		"home": "Inici",
		"homeDescription": "Publicar només a la línia de temps d'Inici ",
		"followers": "Seguidors",
		"followersDescription": "Fes només visible per als teus seguidors",
		"specified": "Directe",
		"specifiedDescription": "Fer visible només per alguns usuaris",
		"disableFederation": "Sense federar",
		"disableFederationDescription": "No enviar a altres servidors"
	},
	"deletedNote": "Publicacions eliminades",
	"private": "Privat",
	"translatedFrom": "Traduït del {x}",
	"showMore": "Veure més",
	"showLess": "Mostrar menys",
	"more": "Més",
	"userSaysSomethingSensitive": "La publicació de {name} conte material sensible",
	"userSaysSomething": "{name} n'ha dit alguna cosa",
	"userSaysSomethingAbout": "{name} està parlant sobre \"{word}\""
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pinnedNote": "Připnutá poznámka",
	"renotedBy": "{user} přeposlal*a",
	"visibilityLabels": {
		"public": "Veřejný",
		"publicDescription": "Vaše poznámka bude viditelná pro všechny uživatele",
		"home": "Domů",
		"homeDescription": "Zveřejnit příspěvek pouze na domovskou časovou osu",
		"followers": "Sledující",
		"followersDescription": "Zviditelnit pouze pro své sledující",
		"specified": "Přímý",
		"specifiedDescription": "Zviditelnit pouze pro určité uživatele",
		"disableFederation": "Defederace",
		"disableFederationDescription": "Nepřenášet do jiných instancí"
	},
	"deletedNote": "Odstraněné příspěvky",
	"private": "Soukromý",
	"translatedFrom": "Přeloženo z {x}",
	"showMore": "Zobrazit více",
	"showLess": "Zavřít",
	"more": "Více!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} řekl/a něco",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pinnedNote": "Pinned note",
	"renotedBy": "Renoted by {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Translated from {x}",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} said something",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pinnedNote": "Angeheftete Notiz",
	"renotedBy": "Renote von {user}",
	"visibilityLabels": {
		"public": "Öffentlich",
		"publicDescription": "Deine Notiz wird global für alle Benutzer sichtbar sein",
		"home": "Startseite",
		"homeDescription": "Notiz nur in die Startseiten-Chronik schicken",
		"followers": "Follower",
		"followersDescription": "Nur für Follower sichtbar",
		"specified": "Direkt",
		"specifiedDescription": "Nur für bestimmte Benutzer sichtbar",
		"disableFederation": "Deföderieren",
		"disableFederationDescription": "Nicht an andere Instanzen übertragen"
	},
	"deletedNote": "Gelöschte Notiz",
	"private": "Privat",
	"translatedFrom": "Aus {x} übersetzt",
	"showMore": "Mehr anzeigen",
	"showLess": "Schließen",
	"more": "Mehr!",
	"userSaysSomethingSensitive": "{name} sagt etwas mit sensiblem Inhalt.",
	"userSaysSomething": "{name} hat etwas gesagt",
	"userSaysSomethingAbout": "{name} sagt etwas über '{word}'"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pinnedNote": "Pinned note",
	"renotedBy": "Renoted by {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Translated from {x}",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} said something",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pinnedNote": "Nota fijada",
	"renotedBy": "Renotado por {user}",
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Visible para todos los usuarios",
		"home": "Inicio",
		"homeDescription": "Visible sólo en la linea de tiempo de inicio",
		"followers": "Seguidores",
		"followersDescription": "Visible sólo para tus seguidores",
		"specified": "Nota directa",
		"specifiedDescription": "Visible sólo para los usuarios elegidos",
		"disableFederation": "No federado",
		"disableFederationDescription": "No enviar a otras instancias"
	},
	"deletedNote": "Nota eliminada",
	"private": "Privado",
	"translatedFrom": "Traducido de {x}",
	"showMore": "Ver más",
	"showLess": "Cerrar",
	"more": "¡Más!",
	"userSaysSomethingSensitive": "La publicación de {name} contiene material sensible",
	"userSaysSomething": "{name} dijo algo",
	"userSaysSomethingAbout": "{name} dijo algo sobre {word}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pinnedNote": "Note épinglée",
	"renotedBy": "Renoté par {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Publier à tou·te·s les utilisateur·rice·s",
		"home": "Principal",
		"homeDescription": "Publier sur le fil principal uniquement",
		"followers": "Abonné·e·s",
		"followersDescription": "Publier à vos abonné·e·s uniquement",
		"specified": "Direct",
		"specifiedDescription": "Publier uniquement aux utilisateur·rice·s mentionné·e·s",
		"disableFederation": "Défédérer",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Note supprimée",
	"private": "Privé",
	"translatedFrom": "Traduit depuis {x}",
	"showMore": "Voir plus",
	"showLess": "Fermer",
	"more": "Plus !",
	"userSaysSomethingSensitive": "Note de {name} contenant des fichiers joints sensibles",
	"userSaysSomething": "{name} a dit quelque chose",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pinnedNote": "Catatan yang disematkan",
	"renotedBy": "Direnote oleh {user}",
	"visibilityLabels": {
		"public": "Publik",
		"publicDescription": "Catat ke lini masa global",
		"home": "Beranda",
		"homeDescription": "Catat ke lini masa beranda saja",
		"followers": "Pengikut",
		"followersDescription": "Catat ke pengikut saja",
		"specified": "Langsung",
		"specifiedDescription": "Catat ke pengguna yang ditentukan saja",
		"disableFederation": "Matikan federasi",
		"disableFederationDescription": "Jangan kirimkan ke instansi lain"
	},
	"deletedNote": "Catatan yang dihapus",
	"private": "Tersembunyi",
	"translatedFrom": "Terjemahkan dari {x}",
	"showMore": "Selebihnya",
	"showLess": "Tutup",
	"more": "Lainnya",
	"userSaysSomethingSensitive": "Postingan oleh {name} mengandung konten sensitif",
	"userSaysSomething": "{name} mengatakan sesuatu",
	"userSaysSomethingAbout": "{name} menyebutkan sesuatu tentang \"{word}\""
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pinnedNote": "Nota in primo piano",
	"renotedBy": "Rinotata da {user}",
	"visibilityLabels": {
		"public": "Pubblica",
		"publicDescription": "Visibilità pubblica",
		"home": "Home",
		"homeDescription": "Visibile solo nella Home",
		"followers": "Follower",
		"followersDescription": "Visibile solo ai tuoi follower",
		"specified": "Nota diretta",
		"specifiedDescription": "Visibile solo ai profili menzionati",
		"disableFederation": "Gestisci la federazione",
		"disableFederationDescription": "Non spedire attività alle altre istanze remote"
	},
	"deletedNote": "Nota eliminata",
	"private": "Privato",
	"translatedFrom": "Traduzione da {x}",
	"showMore": "Espandi",
	"showLess": "Comprimi",
	"more": "Di più!",
	"userSaysSomethingSensitive": "Note da {name} con allegati espliciti",
	"userSaysSomething": "{name} ha scritto qualcosa",
	"userSaysSomethingAbout": "{name} ha anNotato qualcosa su \"{word}\""
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pinnedNote": "ピン留めされたノート",
	"renotedBy": "{user}がリノート",
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "全てのユーザーに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開",
		"specified": "指名",
		"specifiedDescription": "指定したユーザーのみに公開",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへの配信を行いません"
	},
	"deletedNote": "削除されたノート",
	"private": "非公開",
	"translatedFrom": "{x}から翻訳",
	"showMore": "もっと見る",
	"showLess": "閉じる",
	"more": "もっと！",
	"userSaysSomethingSensitive": "{name}のセンシティブなファイルを含む投稿",
	"userSaysSomething": "{name}が何かを言いました",
	"userSaysSomethingAbout": "{name}が「{word}」について何かを言いました"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pinnedNote": "ピン留めされとるノート",
	"renotedBy": "{user}がリノートしたで",
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "みんなに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開するで",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開するで",
		"specified": "ダイレクト",
		"specifiedDescription": "選んだユーザーのみに公開するで",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへは送らんとくわ"
	},
	"deletedNote": "消された投稿",
	"private": "非公開",
	"translatedFrom": "{x}から翻訳するで",
	"showMore": "まだまだあるで！",
	"showLess": "さいなら",
	"more": "他のん",
	"userSaysSomethingSensitive": "{name}のセンシティブなファイルを含む投稿",
	"userSaysSomething": "{name}が何か言うとるわ",
	"userSaysSomethingAbout": "{name}が「{word}」についてなんか言うてたで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pinnedNote": "Pinned note",
	"renotedBy": "Renoted by {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Imeḍfaṛen",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Translated from {x}",
	"showMore": "Wali ugar",
	"showLess": "Close",
	"more": "More!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} said something",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pinnedNote": "Pinned note",
	"renotedBy": "{user} ಪುನರಾವರ್ತಿಸಿದರು",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Translated from {x}",
	"showMore": "ಇನ್ನಷ್ಟು ನೋಡು",
	"showLess": "Close",
	"more": "More!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} said something",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pinnedNote": "고정된 노트",
	"renotedBy": "{user}님이 리노트",
	"visibilityLabels": {
		"public": "공개",
		"publicDescription": "모든 유저에게 공개",
		"home": "홈",
		"homeDescription": "홈 타임라인에만 공개",
		"followers": "팔로워",
		"followersDescription": "팔로워에게만 공개",
		"specified": "다이렉트",
		"specifiedDescription": "지정한 유저에게만 공개",
		"disableFederation": "연합에 보내지 않기",
		"disableFederationDescription": "다른 서버로 보내지 않습니다"
	},
	"deletedNote": "삭제된 노트",
	"private": "비공개",
	"translatedFrom": "{x}에서 번역",
	"showMore": "더 보기",
	"showLess": "닫기",
	"more": "더 보기!",
	"userSaysSomethingSensitive": "{name}의 민감한 파일이 포함된 게시물",
	"userSaysSomething": "{name}님이 무언가를 말했습니다",
	"userSaysSomethingAbout": "{name}님이 \"{word}\"를 언급했습니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pinnedNote": "Vastgemaakte notitie",
	"renotedBy": "Hergedeeld door {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Startpagina",
		"homeDescription": "Post to home timeline only",
		"followers": "Volgers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Directe notities",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Verwijderde notitie",
	"private": "Privé",
	"translatedFrom": "Vertaald uit {x}",
	"showMore": "Toon meer",
	"showLess": "Sluiten",
	"more": "Meer!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} zei iets",
	"userSaysSomethingAbout": "{name} zei iets over '{word}'"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pinnedNote": "Festet Note",
	"renotedBy": "Renotes av {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Hjem",
		"homeDescription": "Post to home timeline only",
		"followers": "Følgere",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Oversatt fra {x}",
	"showMore": "Vis mer",
	"showLess": "Lukk",
	"more": "Mer!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} sa noe",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pinnedNote": "Przypięty wpis",
	"renotedBy": "Udostępniono przez {user}",
	"visibilityLabels": {
		"public": "Publiczny",
		"publicDescription": "Twój wpis pojawi się w publicznych osiach czasu",
		"home": "Strona główna",
		"homeDescription": "Publikuj tylko na głównej osi czasu",
		"followers": "Obserwujący",
		"followersDescription": "Widoczne tylko dla obserwujących",
		"specified": "Bezpośredni",
		"specifiedDescription": "Napisz tylko określonym użytkownikom",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Nie przesyłaj do innych instancji"
	},
	"deletedNote": "Usunięty wpis",
	"private": "Prywatne",
	"translatedFrom": "Przetłumaczone z {x}",
	"showMore": "Załaduj więcej",
	"showLess": "Zamknij",
	"more": "Więcej!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} powiedział(-a) coś",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pinnedNote": "Nota fixada",
	"renotedBy": "Repostado por {user}",
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Sua nota será visível para todos os usuários",
		"home": "Início",
		"homeDescription": "Publicar apenas na linha do tempo Início",
		"followers": "Seguidores",
		"followersDescription": "Tornar visível apenas para os meus seguidores",
		"specified": "Mensagem Direta",
		"specifiedDescription": "Tornar visível apenas para usuários específicos",
		"disableFederation": "Defederar",
		"disableFederationDescription": "Não transmitir às outras instâncias"
	},
	"deletedNote": "Postagem excluída",
	"private": "Privado",
	"translatedFrom": "Traduzido de {x}",
	"showMore": "Ver mais",
	"showLess": "Fechar",
	"more": "Mais!",
	"userSaysSomethingSensitive": "Publicação de {name} contém conteúdo sensível",
	"userSaysSomething": "{name} disse algo",
	"userSaysSomethingAbout": "{name} disse algo sobre \"{word}\""
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pinnedNote": "Закреплённая заметка",
	"renotedBy": "{user} делает репост",
	"visibilityLabels": {
		"public": "Общедоступно",
		"publicDescription": "Открыто для всех",
		"home": "Домашняя",
		"homeDescription": "Не для общих лент",
		"followers": "Для подписчиков",
		"followersDescription": "Только вашим подписчикам",
		"specified": "Личное",
		"specifiedDescription": "Тем, кого укажете",
		"disableFederation": "Отключить федерацию",
		"disableFederationDescription": "Не доставляет в другие экземпляры"
	},
	"deletedNote": "Удалённая заметка",
	"private": "Личное",
	"translatedFrom": "Перевод. Язык оригинала — {x}",
	"showMore": "Показать ещё",
	"showLess": "Закрыть",
	"more": "Ещё!",
	"userSaysSomethingSensitive": "Заметка от {name} содержит NSFW контент",
	"userSaysSomething": "{name} что-то сообщает",
	"userSaysSomethingAbout": "{name} что-то говорил о «{word}»"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pinnedNote": "Pripnuté poznámky",
	"renotedBy": "{user} preposlal/a",
	"visibilityLabels": {
		"public": "Verejné",
		"publicDescription": "Vaša poznámku bude viditeľná všetkým používateľom",
		"home": "Domov",
		"homeDescription": "Pridať iba na domácu časovú os",
		"followers": "Sledujúci",
		"followersDescription": "Viditeľné iba tým, ktorí vás sledujú",
		"specified": "Priame",
		"specifiedDescription": "Viditeľné iba pre konkrétnych používateľov",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Odstránené príspevky",
	"private": "Súkromné",
	"translatedFrom": "Preložené z {x}",
	"showMore": "Zobraziť viac",
	"showLess": "Zavrieť",
	"more": "Viac!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} niečo povedal/a",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pinnedNote": "โน้ตที่ปักหมุดไว้",
	"renotedBy": "รีโน้ตโดย {user}",
	"visibilityLabels": {
		"public": "สาธารณะ",
		"publicDescription": "โน้ตของคุณจะปรากฏแก่ผู้ใช้ทุกคน",
		"home": "หน้าหลัก",
		"homeDescription": "โพสต์ลงไทม์ไลน์หลักเท่านั้น",
		"followers": "ผู้ติดตาม",
		"followersDescription": "เฉพาะผู้ติดตามเท่านั้นที่มองเห็นได้",
		"specified": "ไดเร็ค",
		"specifiedDescription": "ทำให้มองเห็นได้เฉพาะผู้ใช้ที่ระบุเท่านั้น",
		"disableFederation": "การปิดใช้งานสหพันธ์",
		"disableFederationDescription": "อย่าส่งข้อมูลไปยังเซิร์ฟเวอร์อื่น"
	},
	"deletedNote": "โน้ตที่ถูกลบ",
	"private": "ส่วนตัว",
	"translatedFrom": "แปลมาจาก {x}",
	"showMore": "แสดงเพิ่มเติม",
	"showLess": "ปิด",
	"more": "เพิ่มเติม!",
	"userSaysSomethingSensitive": "โพสต์ที่มีไฟล์เนื้อหาละเอียดอ่อนของ {name}",
	"userSaysSomething": "{name} พูดอะไรบางอย่าง",
	"userSaysSomethingAbout": "{name} พูดบางอย่างเกี่ยวกับ “{word}”"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pinnedNote": "Sabit not",
	"renotedBy": "{user} renote etti",
	"visibilityLabels": {
		"public": "Halka açık",
		"publicDescription": "Notunuz tüm kullanıcılar tarafından görülebilir olacaktır.",
		"home": "Pano",
		"homeDescription": "Yalnızca ana panoya gönder",
		"followers": "Takipçiler",
		"followersDescription": "Sadece takipçilerine görünür hale getir",
		"specified": "Doğrudan",
		"specifiedDescription": "Yalnızca belirli kullanıcılar için görünür hale getir",
		"disableFederation": "Federasyon olmadan",
		"disableFederationDescription": "Diğer sunuculara aktarma"
	},
	"deletedNote": "Silinen not",
	"private": "Özel",
	"translatedFrom": "{x}'ten çevrilmiştir.",
	"showMore": "Daha fazlasını göster",
	"showLess": "Kapat",
	"more": "Daha fazlası!",
	"userSaysSomethingSensitive": "{name} tarafından gönderilen mesaj hassas içerik barındırmaktadır.",
	"userSaysSomething": "{name} bir şey söyledi.",
	"userSaysSomethingAbout": "{name} “{word}” hakkında bir şey söyledi."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pinnedNote": "Pinned note",
	"renotedBy": "Renoted by {user}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Deleted note",
	"private": "Private",
	"translatedFrom": "Translated from {x}",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!",
	"userSaysSomethingSensitive": "Post by {name} contains sensitive content",
	"userSaysSomething": "{name} said something",
	"userSaysSomethingAbout": "{name} said something about \"{word}\""
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pinnedNote": "Закріплений запис",
	"renotedBy": "Поширено {user}",
	"visibilityLabels": {
		"public": "Публічний",
		"publicDescription": "Для всіх користувачів",
		"home": "Домівка",
		"homeDescription": "Лише на домашній стрічці",
		"followers": "Підписники",
		"followersDescription": "Тільки для підписників",
		"specified": "Особисто",
		"specifiedDescription": "Лише для певних користувачів",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"deletedNote": "Видалена нотатка",
	"private": "Приватне",
	"translatedFrom": "Переклад з {x}",
	"showMore": "Показати більше",
	"showLess": "Закрити",
	"more": "Бiльше!",
	"userSaysSomethingSensitive": "Нотатка від {name} містить чутливий вміст",
	"userSaysSomething": "{name} щось сказав(ла)",
	"userSaysSomethingAbout": "{name} згадує «{word}»"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pinnedNote": "Bài viết đã ghim",
	"renotedBy": "Chia sẻ bởi {user}",
	"visibilityLabels": {
		"public": "Công khai",
		"publicDescription": "Mọi người đều có thể đọc tút của bạn",
		"home": "Trang chính",
		"homeDescription": "Chỉ đăng lên bảng tin nhà",
		"followers": "Người theo dõi",
		"followersDescription": "Dành riêng cho người theo dõi",
		"specified": "Nhắn riêng",
		"specifiedDescription": "Chỉ người được nhắc đến mới thấy",
		"disableFederation": "Không liên hợp",
		"disableFederationDescription": "Không đưa tin cho chủ máy khác"
	},
	"deletedNote": "Tút đã bị xóa",
	"private": "Riêng tư",
	"translatedFrom": "Dịch từ {x}",
	"showMore": "Xem thêm",
	"showLess": "Đóng",
	"more": "Thêm nữa!",
	"userSaysSomethingSensitive": "Bài đăng có chứa các tập tin nhạy cảm từ {name}",
	"userSaysSomething": "{name} nói gì đó",
	"userSaysSomethingAbout": "{name} đã nói gì đó về \"{word}\""
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pinnedNote": "置顶的帖子",
	"renotedBy": "{user} 转发了",
	"visibilityLabels": {
		"public": "公开",
		"publicDescription": "所有用户均可见",
		"home": "首页",
		"homeDescription": "仅发布至首页",
		"followers": "仅关注者",
		"followersDescription": "仅关注者可见",
		"specified": "指定用户",
		"specifiedDescription": "仅发送至指定用户",
		"disableFederation": "仅限本地",
		"disableFederationDescription": "不发送到其他服务器"
	},
	"deletedNote": "已删除的帖子",
	"private": "私密",
	"translatedFrom": "从 {x} 翻译",
	"showMore": "查看更多",
	"showLess": "关闭",
	"more": "更多！",
	"userSaysSomethingSensitive": "含 {name} 敏感文件的帖子",
	"userSaysSomething": "{name} 说了些什么，但被屏蔽词过滤了",
	"userSaysSomethingAbout": "{name} 说了关于 “{word}” 的什么"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pinnedNote": "已置頂的貼文",
	"renotedBy": "{user} 轉發了",
	"visibilityLabels": {
		"public": "公開",
		"publicDescription": "發佈給所有使用者",
		"home": "首頁",
		"homeDescription": "僅發布至首頁的時間軸",
		"followers": "追隨者",
		"followersDescription": "僅發布至關注者",
		"specified": "指定使用者",
		"specifiedDescription": "僅發布至指定使用者",
		"disableFederation": "停用聯邦",
		"disableFederationDescription": "不發送到其他伺服器"
	},
	"deletedNote": "已刪除的貼文",
	"private": "私密",
	"translatedFrom": "從 {x} 翻譯",
	"showMore": "載入更多",
	"showLess": "關閉",
	"more": "更多！",
	"userSaysSomethingSensitive": "包含 {name} 敏感檔案的貼文",
	"userSaysSomething": "{name}說了什麼",
	"userSaysSomethingAbout": "{name} 說了一些關於「{word}」的話"
}
</locale>
