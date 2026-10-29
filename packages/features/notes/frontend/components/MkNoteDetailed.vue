<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-if="!muted && !hideByPlugin && !isDeleted"
	ref="rootEl"
	v-hotkey="keymap"
	:class="$style.root"
	tabindex="0"
>
	<div v-if="appearNote.reply && appearNote.reply.replyId">
		<div v-if="!conversationLoaded" style="padding: 16px">
			<MkButton style="margin: 0 auto;" primary rounded @click="loadConversation">{{ $locale.sfc.loadConversation }}</MkButton>
		</div>
		<MkNoteSub v-for="note in conversation" :key="note.id" :class="$style.replyToMore" :note="note"/>
	</div>
	<MkNoteSub v-if="appearNote.replyId" :note="appearNote?.reply ?? null" :class="$style.replyTo"/>
	<div v-if="isRenote" :class="$style.renote">
		<MkAvatar :class="$style.renoteAvatar" :user="note.user" link preview/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<span :class="$style.renoteText">
			<I18n :src="$locale.sfc.renotedBy" tag="span">
				<template #user>
					<MkA v-user-preview="note.userId" :class="$style.renoteName" :to="userPage(note.user)">
						<MkUserName :user="note.user"/>
					</MkA>
				</template>
			</I18n>
		</span>
		<div :class="$style.renoteInfo">
			<button ref="renoteTime" class="_button" :class="$style.renoteTime" @mousedown.prevent="showRenoteMenu()">
				<i v-if="isMyRenote" class="ti ti-dots" style="margin-right: 4px;"></i>
				<MkTime :time="note.createdAt"/>
			</button>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		</div>
	</div>
	<div v-if="isRenote && note.renote == null" :class="$style.deleted">
		{{ $locale.sfc.deletedNote }}
	</div>
	<template v-else>
		<article :class="$style.note" @contextmenu.stop="onContextmenu">
			<header :class="$style.noteHeader">
				<MkAvatar :class="$style.noteHeaderAvatar" :user="appearNote.user" indicator link preview/>
				<div :class="$style.noteHeaderBody">
					<div>
						<MkA v-user-preview="appearNote.user.id" :class="$style.noteHeaderName" :to="userPage(appearNote.user)">
							<MkUserName :nowrap="false" :user="appearNote.user"/>
						</MkA>
						<span v-if="appearNote.user.isBot" :class="$style.isBot">bot</span>
						<div :class="$style.noteHeaderInfo">
							<span v-if="appearNote.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[appearNote.visibility]">
								<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
								<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
								<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
							</span>
							<span v-if="appearNote.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
						</div>
					</div>
					<div :class="$style.noteHeaderUsernameAndBadgeRoles">
						<div :class="$style.noteHeaderUsername">
							<MkAcct :user="appearNote.user"/>
						</div>
						<div v-if="appearNote.user.badgeRoles" :class="$style.noteHeaderBadgeRoles">
							<img v-for="(role, i) in appearNote.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.noteHeaderBadgeRole" :src="role.iconUrl!"/>
						</div>
					</div>
					<MkInstanceTicker v-if="showTicker" :host="appearNote.user.host" :instance="appearNote.user.instance"/>
				</div>
			</header>
			<div :class="$style.noteContent">
				<p v-if="appearNote.cw != null" :class="$style.cw">
					<Mfm
						v-if="appearNote.cw != ''"
						:text="appearNote.cw"
						:author="appearNote.user"
						:nyaize="'respect'"
						:enableEmojiMenu="true"
						:enableEmojiMenuReaction="true"
					/>
					<MkCwButton v-model="showContent" :text="appearNote.text" :renote="appearNote.renote" :files="appearNote.files" :poll="appearNote.poll"/>
				</p>
				<div v-show="appearNote.cw == null || showContent">
					<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $locale.sfc.private }})</span>
					<MkA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
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
					<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
					<div v-if="translating || translation" :class="$style.translation">
						<MkLoading v-if="translating" mini/>
						<div v-else-if="translation">
							<b>{{ interpolateLocaleParameters($locale.sfc.translatedFrom, { x: translation.sourceLang }) }}: </b>
							<Mfm :text="translation.text" :author="appearNote.user" :nyaize="'respect'" :emojiUrls="appearNote.emojis" class="_selectable"/>
						</div>
					</div>
					<div v-if="appearNote.files && appearNote.files.length > 0">
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
						<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="true" style="margin-top: 6px;"/>
					</div>
					<div v-if="appearNote.renoteId" :class="$style.quote"><MkNoteSimple :note="appearNote?.renote ?? null" :class="$style.quoteNote"/></div>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
			</div>
			<footer>
				<div :class="$style.noteFooterInfo">
					<MkA :to="notePage(appearNote)">
						<MkTime :time="appearNote.createdAt" mode="detail" colored/>
					</MkA>
					<span style="margin-left: 0.5em;">
						<span style="border: 1px solid var(--MI_THEME-divider); margin-right: 0.5em;"></span>
						<i v-if="appearNote.visibility === 'public'" class="ti ti-world"></i>
						<i v-else-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
						<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
						<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
						<span style="margin-left: 0.3em;">{{ copyLocaleDictionary($locale.sfc.visibilityLabels)[appearNote.visibility] }}</span>
					</span>
				</div>
				<MkReactionsViewer
					v-if="appearNote.reactionAcceptance !== 'likeOnly'"
					style="margin-top: 6px;"
					:reactions="$appearNote.reactions"
					:reactionEmojis="$appearNote.reactionEmojis"
					:myReaction="$appearNote.myReaction"
					:noteId="appearNote.id"
				/>
				<button class="_button" :class="$style.noteFooterButton" @click="reply()">
					<i class="ti ti-arrow-back-up"></i>
					<p v-if="appearNote.repliesCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.repliesCount) }}</p>
				</button>
				<button
					v-if="canRenote"
					ref="renoteButton"
					class="_button"
					:class="$style.noteFooterButton"
					@mousedown.prevent="renote()"
				>
					<i class="ti ti-repeat"></i>
					<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.renoteCount) }}</p>
				</button>
				<button v-else class="_button" :class="$style.noteFooterButton" disabled>
					<i class="ti ti-ban"></i>
				</button>
				<button ref="reactButton" :class="$style.noteFooterButton" class="_button" @click="toggleReact()">
					<i v-if="appearNote.reactionAcceptance === 'likeOnly' && $appearNote.myReaction != null" class="ti ti-heart-filled" style="color: var(--MI_THEME-love);"></i>
					<i v-else-if="$appearNote.myReaction != null" class="ti ti-minus" style="color: var(--MI_THEME-accent);"></i>
					<i v-else-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
					<i v-else class="ti ti-plus"></i>
					<p v-if="(appearNote.reactionAcceptance === 'likeOnly' || prefer.s.showReactionsCount) && $appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ number($appearNote.reactionCount) }}</p>
				</button>
				<button v-if="prefer.s.showClipButtonInNoteFooter" ref="clipButton" class="_button" :class="$style.noteFooterButton" @mousedown.prevent="clip()">
					<i class="ti ti-paperclip"></i>
				</button>
				<button ref="menuButton" class="_button" :class="$style.noteFooterButton" @mousedown.prevent="showMenu()">
					<i class="ti ti-dots"></i>
				</button>
			</footer>
		</article>
		<div :class="$style.tabs">
			<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'replies' }]" @click="tab = 'replies'"><i class="ti ti-arrow-back-up"></i> {{ $locale.sfc.replies }}</button>
			<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'renotes' }]" @click="tab = 'renotes'"><i class="ti ti-repeat"></i> {{ $locale.sfc.renotes }}</button>
			<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'reactions' }]" @click="tab = 'reactions'"><i class="ti ti-icons"></i> {{ $locale.sfc.reactions }}</button>
		</div>
		<div>
			<div v-if="tab === 'replies'">
				<div v-if="!repliesLoaded" style="padding: 16px">
					<MkButton style="margin: 0 auto;" primary rounded @click="loadReplies">{{ $locale.sfc.loadReplies }}</MkButton>
				</div>
				<MkNoteSub v-for="note in replies" :key="note.id" :note="note" :class="$style.reply" :detail="true"/>
			</div>
			<div v-else-if="tab === 'renotes'" :class="$style.tab_renotes">
				<MkPagination :paginator="renotesPaginator" :forceDisableInfiniteScroll="true">
					<template #default="{ items }">
						<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); grid-gap: 12px;">
							<MkA v-for="item in items" :key="item.id" :to="userPage(item.user)">
								<MkUserCardMini :user="item.user" :withChart="false"/>
							</MkA>
						</div>
					</template>
				</MkPagination>
			</div>
			<div v-else-if="tab === 'reactions'" :class="$style.tab_reactions">
				<div :class="$style.reactionTabs">
					<button v-for="reaction in Object.keys($appearNote.reactions)" :key="reaction" :class="[$style.reactionTab, { [$style.reactionTabActive]: reactionTabType === reaction }]" class="_button" @click="reactionTabType = reaction">
						<MkReactionIcon :reaction="reaction"/>
						<span style="margin-left: 4px;">{{ $appearNote.reactions[reaction] }}</span>
					</button>
				</div>
				<MkPagination v-if="reactionTabType" :key="reactionTabType" :paginator="reactionsPaginator" :forceDisableInfiniteScroll="true">
					<template #default="{ items }">
						<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); grid-gap: 12px;">
							<MkA v-for="item in items" :key="item.id" :to="userPage(item.user)">
								<MkUserCardMini :user="item.user" :withChart="false"/>
							</MkA>
						</div>
					</template>
				</MkPagination>
			</div>
		</div>
	</template>
</div>
<div v-else-if="muted" class="_panel" :class="$style.muted" @click="muted = false">
	<I18n :src="$locale.sfc.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { inject, provide, ref, useTemplateRef, markRaw, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { useNote } from '@features/notes/frontend/composables/use-note.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import { notePage } from '@features/notes/frontend/shared/note.js';
import { isEnabledUrlPreview } from '@features/markup/frontend/utility/url-preview.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import number from '@features/ui/frontend/filters/number.js';
import { DI } from '@features/ui/frontend/di.js';
import type { Keymap } from '@features/ui/frontend/utility/hotkey.js';

// コンポーネント外部の依存関係
import MkNoteSub from '@features/notes/frontend/components/MkNoteSub.vue';
import MkNoteSimple from '@features/notes/frontend/components/MkNoteSimple.vue';
import MkReactionsViewer from '@features/notes/frontend/components/MkReactionsViewer.vue';
import MkMediaList from '@features/drive/frontend/components/MkMediaList.vue';
import MkCwButton from '@features/notes/frontend/components/MkCwButton.vue';
import MkPoll from '@features/notes/frontend/components/MkPoll.vue';
import MkUrlPreview from '@features/markup/frontend/components/MkUrlPreview.vue';
import MkInstanceTicker from '@features/federation/frontend/components/MkInstanceTicker.vue';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkReactionIcon from '@features/notes/frontend/components/MkReactionIcon.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	initialTab?: 'replies' | 'renotes' | 'reactions';
}>(), {
	initialTab: 'replies',
});

// 周辺コンテキストのインジェクト
const inChannel = inject(DI.inChannel, null);

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
	isDeleted,
	translating,
	translation,
	muted,
	canRenote,
	isMyRenote,
	parsed,
	urls,
	showTicker,

	// 関数群
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
	inChannel,
});

// provide
provide(DI.mfmEmojiReactCallback, reactViaMfmEmoji);

// MkNoteDetailed固有
const tab = ref(props.initialTab);
const reactionTabType = ref<string | null>(null);

const renotesPaginator = markRaw(new Paginator('notes/renotes', {
	limit: 10,
	params: {
		noteId: appearNote.id,
	},
}));

const reactionsPaginator = markRaw(new Paginator('notes/reactions', {
	limit: 10,
	computedParams: computed(() => ({
		noteId: appearNote.id,
		type: reactionTabType.value,
	})),
}));

const replies = ref<Misskey.entities.Note[]>([]);
const repliesLoaded = ref(false);

function loadReplies() {
	repliesLoaded.value = true;
	misskeyApi('notes/children', {
		noteId: appearNote.id,
		limit: 30,
	}).then(res => {
		replies.value = res;
	});
}

const conversation = ref<Misskey.entities.Note[]>([]);
const conversationLoaded = ref(false);

function loadConversation() {
	conversationLoaded.value = true;
	if (appearNote.replyId == null) return;
	misskeyApi('notes/conversation', {
		noteId: appearNote.replyId,
	}).then(res => {
		conversation.value = res.reverse();
	});
}

// キーボードショートカットマップ
const keymap = {
	'r': () => reply(),
	'e|a|plus': () => react(),
	'q': () => renote(),
	'm': () => showMenu(),
	'c': () => {
		if (!prefer.s.showClipButtonInNoteFooter) return;
		clip();
	},
	'o': () => {
		galleryEl.value?.openGallery();
	},
	'v|enter': () => {
		if (appearNote.cw != null) {
			showContent.value = !showContent.value;
		}
	},
	'esc': {
		allowRepeat: true,
		callback: () => blur(),
	},
} as const satisfies Keymap;
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
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
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.replyToMore {
	opacity: 0.7;
}

.renote {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--MI_THEME-renote);
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	border-radius: 6px;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteName {
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

.renote + .note {
	padding-top: 8px;
}

.note {
	padding: 32px;
	font-size: 1.2em;

	&:hover > .main > .footer > .button {
		opacity: 1;
	}
}

.noteHeader {
	display: flex;
	position: relative;
	margin-bottom: 16px;
	align-items: center;
}

.noteHeaderAvatar {
	display: block;
	flex-shrink: 0;
	width: 58px;
	height: 58px;
}

.noteHeaderBody {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-left: 16px;
	font-size: 0.95em;
}

.noteHeaderName {
	font-weight: bold;
	line-height: 1.3;
}

.isBot {
	display: inline-block;
	margin: 0 0.5em;
	padding: 4px 6px;
	font-size: 80%;
	line-height: 1;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 4px;
}

.noteHeaderInfo {
	float: right;
}

.noteHeaderUsernameAndBadgeRoles {
	display: flex;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	margin-right: 0.5em;
	line-height: 1.3;
	word-wrap: anywhere;
}

.noteHeaderBadgeRoles {
	margin: 0 .5em 0 0;
}

.noteHeaderBadgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .noteHeaderBadgeRole {
		margin-left: 0.2em;
	}
}

.noteContent {
	container-type: inline-size;
	overflow-wrap: break-word;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.noteReplyTarget {
	color: var(--MI_THEME-accent);
	margin-right: 0.5em;
}

.rn {
	margin-left: 4px;
	font-style: oblique;
	color: var(--MI_THEME-renote);
}

.translation {
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;
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

.noteFooterInfo {
	margin: 16px 0;
	opacity: 0.7;
	font-size: 0.9em;
}

.noteFooterButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--MI_THEME-fgHighlighted);
	}
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--MI_THEME-accent);
	}
}

.reply:not(:first-child) {
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.tabs {
	border-top: solid 0.5px var(--MI_THEME-divider);
	border-bottom: solid 0.5px var(--MI_THEME-divider);
	display: flex;
}

.tab {
	flex: 1;
	padding: 12px 8px;
	border-top: solid 2px transparent;
	border-bottom: solid 2px transparent;
}

.tabActive {
	border-bottom: solid 2px var(--MI_THEME-accent);
}

.tab_renotes {
	padding: 16px;
}

.tab_reactions {
	padding: 16px;
}

.reactionTabs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 8px;
}

.reactionTab {
	padding: 4px 6px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;
}

.reactionTabActive {
	border-color: var(--MI_THEME-accent);
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}
}

@container (max-width: 450px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.note {
		padding: 16px;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 350px) {
	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 18px;
		}
	}
}

@container (max-width: 300px) {
	.root {
		font-size: 0.825em;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}

	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 12px;
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}

.deleted {
	text-align: center;
	padding: 32px;
	margin: 6px 32px 32px;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
	border-radius: 8px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"loadConversation": "Show conversation",
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
	"replies": "رد",
	"renotes": "أعد النشر",
	"reactions": "التفاعلات",
	"loadReplies": "Show replies",
	"userSaysSomething": "كتب {name} شيءً"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"loadConversation": "Mostrar la conversació ",
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
	"replies": "Respostes",
	"renotes": "Impulsos",
	"reactions": "Reaccions",
	"loadReplies": "Mostrar les respostes",
	"userSaysSomething": "{name} n'ha dit alguna cosa"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"loadConversation": "Show conversation",
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
	"replies": "Odpovědět",
	"renotes": "Přeposlat",
	"reactions": "Reakce",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} řekl/a něco"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"loadConversation": "Show conversation",
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
	"replies": "Reply",
	"renotes": "Renotes",
	"reactions": "Reactions",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"loadConversation": "Unterhaltung anzeigen",
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
	"replies": "Antworten",
	"renotes": "Renotes",
	"reactions": "Reaktionen",
	"loadReplies": "Antworten anzeigen",
	"userSaysSomething": "{name} hat etwas gesagt"
}
</locale>

<locale lang="json" locale="en-US">
{
	"loadConversation": "Show conversation",
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
	"replies": "Reply",
	"renotes": "Renotes",
	"reactions": "Reactions",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"loadConversation": "Ver conversación",
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
	"replies": "Responder",
	"renotes": "Renotar",
	"reactions": "Reacciones",
	"loadReplies": "Ver respuestas",
	"userSaysSomething": "{name} dijo algo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"loadConversation": "Afficher la conversation",
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
	"replies": "Réponses",
	"renotes": "Renotes",
	"reactions": "Réactions",
	"loadReplies": "Inclure les réponses",
	"userSaysSomething": "{name} a dit quelque chose"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"loadConversation": "Tampilkan percakapan",
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
	"replies": "Balas",
	"renotes": "Renote",
	"reactions": "Reaksi",
	"loadReplies": "Tampilkan balasan",
	"userSaysSomething": "{name} mengatakan sesuatu"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"loadConversation": "Leggi la conversazione",
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
	"replies": "Risposte",
	"renotes": "Rinota",
	"reactions": "Reazioni",
	"loadReplies": "Leggi le risposte",
	"userSaysSomething": "{name} ha scritto qualcosa"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"loadConversation": "会話を見る",
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
	"replies": "返信",
	"renotes": "リノート",
	"reactions": "リアクション",
	"loadReplies": "返信を見る",
	"userSaysSomething": "{name}が何かを言いました"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"loadConversation": "会話を見るで",
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
	"replies": "返事",
	"renotes": "リノート",
	"reactions": "ツッコミ",
	"loadReplies": "返信を見るで",
	"userSaysSomething": "{name}が何か言うとるわ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"loadConversation": "Show conversation",
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
	"replies": "Err",
	"renotes": "Renotes",
	"reactions": "Reactions",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"loadConversation": "Show conversation",
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
	"replies": "ಉತ್ತರಿಸು",
	"renotes": "Renotes",
	"reactions": "Reactions",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"loadConversation": "대화 보기",
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
	"replies": "답글",
	"renotes": "리노트",
	"reactions": "리액션",
	"loadReplies": "답글 보기",
	"userSaysSomething": "{name}님이 무언가를 말했습니다"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"loadConversation": "Show conversation",
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
	"replies": "Antwoorden",
	"renotes": "Herdelen",
	"reactions": "Reacties",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} zei iets"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"loadConversation": "Show conversation",
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
	"replies": "Svar",
	"renotes": "Renote",
	"reactions": "Reaksjoner",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} sa noe"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"loadConversation": "Show conversation",
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
	"replies": "Odpowiedz",
	"renotes": "Udostępnij",
	"reactions": "Reakcja",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} powiedział(-a) coś"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"loadConversation": "Mostrar conversa",
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
	"replies": "Responder",
	"renotes": "Repostar",
	"reactions": "Reações",
	"loadReplies": "Mostrar respostas",
	"userSaysSomething": "{name} disse algo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"loadConversation": "Загрузить беседу",
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
	"replies": "Ответы",
	"renotes": "Репост",
	"reactions": "Реакции",
	"loadReplies": "Показать ответы",
	"userSaysSomething": "{name} что-то сообщает"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"loadConversation": "Show conversation",
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
	"replies": "Odpovedať",
	"renotes": "Preposlať",
	"reactions": "Reakcie",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} niečo povedal/a"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"loadConversation": "แสดงบทสนทนา",
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
	"replies": "ตอบกลับ",
	"renotes": "รีโน้ต",
	"reactions": "รีแอคชั่น",
	"loadReplies": "แสดงการตอบกลับ",
	"userSaysSomething": "{name} พูดอะไรบางอย่าง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"loadConversation": "Konuşmayı göster",
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
	"replies": "Yanıtla",
	"renotes": "Renote'lar",
	"reactions": "Tepkiler",
	"loadReplies": "Yanıtları göster",
	"userSaysSomething": "{name} bir şey söyledi."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"loadConversation": "Show conversation",
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
	"replies": "Reply",
	"renotes": "Renotes",
	"reactions": "Reactions",
	"loadReplies": "Show replies",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"loadConversation": "Показати розмову",
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
	"replies": "Відповісти",
	"renotes": "Поширити",
	"reactions": "Реакції",
	"loadReplies": "Показати відповіді",
	"userSaysSomething": "{name} щось сказав(ла)"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"loadConversation": "Xem cuộc trò chuyện",
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
	"replies": "Trả lời",
	"renotes": "Đăng lại",
	"reactions": "Biểu cảm",
	"loadReplies": "Hiển thị các trả lời",
	"userSaysSomething": "{name} nói gì đó"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"loadConversation": "查看对话",
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
	"replies": "回复",
	"renotes": "转贴",
	"reactions": "回应",
	"loadReplies": "查看回复",
	"userSaysSomething": "{name} 说了些什么，但被屏蔽词过滤了"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"loadConversation": "閱覽對話",
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
	"replies": "回覆",
	"renotes": "轉發",
	"reactions": "反應",
	"loadReplies": "閱覽回覆",
	"userSaysSomething": "{name}說了什麼"
}
</locale>
