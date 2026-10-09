<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="omfetrab" :class="['s' + size, 'w' + width, 'h' + height, { asDrawer, asWindow }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : undefined }">
	<input
		ref="searchEl"
		:value="q"
		class="search"
		data-prevent-emoji-insert
		:class="{ filled: q != null && q != '' }"
		:placeholder="$locale.sfc.search"
		type="search"
		autocapitalize="off"
		@input="input()"
		@paste.stop="paste"
		@keydown="onKeydown"
	>
	<!-- FirefoxのTabフォーカスが想定外の挙動となるためtabindex="-1"を追加 https://github.com/misskey-dev/misskey/issues/10744 -->
	<div ref="emojisEl" class="emojis" tabindex="-1">
		<section class="result">
			<div v-if="searchResultCustom.length > 0" class="body">
				<button
					v-for="emoji in searchResultCustom"
					:key="emoji.name"
					class="_button item"
					:disabled="!canReact(emoji)"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<MkCustomEmoji class="emoji" :name="emoji.name" :fallbackToImage="true"/>
				</button>
			</div>
			<div v-if="searchResultUnicode.length > 0" class="body">
				<button
					v-for="emoji in searchResultUnicode"
					:key="emoji.name"
					class="_button item"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<MkEmoji class="emoji" :emoji="emoji.char"/>
				</button>
			</div>
		</section>

		<div v-if="tab === 'index'" class="group index">
			<section v-if="showPinned && (pinned && pinned.length > 0)">
				<div class="body">
					<button
						v-for="emoji in pinnedEmojisDef"
						:key="getKey(emoji)"
						:data-emoji="getKey(emoji)"
						class="_button item"
						:disabled="!canReact(emoji)"
						tabindex="0"
						@pointerenter="computeButtonTitle"
						@click="chosen(emoji, $event)"
					>
						<MkCustomEmoji v-if="!emoji.hasOwnProperty('char')" class="emoji" :name="getKey(emoji)" :normal="true"/>
						<MkEmoji v-else class="emoji" :emoji="getKey(emoji)" :normal="true"/>
					</button>
					<button v-tooltip="$locale.sfc.settings" class="_button config" @click="settings"><i class="ti ti-settings"></i></button>
				</div>
			</section>

			<section>
				<header class="_acrylic"><i class="ti ti-clock ti-fw"></i> {{ $locale.sfc.recentUsed }}</header>
				<div class="body">
					<button
						v-for="emoji in recentlyUsedEmojisDef"
						:key="getKey(emoji)"
						class="_button item"
						:disabled="!canReact(emoji)"
						:data-emoji="getKey(emoji)"
						@pointerenter="computeButtonTitle"
						@click="chosen(emoji, $event)"
					>
						<MkCustomEmoji v-if="!emoji.hasOwnProperty('char')" class="emoji" :name="getKey(emoji)" :normal="true"/>
						<MkEmoji v-else class="emoji" :emoji="getKey(emoji)" :normal="true"/>
					</button>
				</div>
			</section>
		</div>
		<div v-once class="group">
			<header class="_acrylic">{{ $locale.sfc.customEmojis }}</header>
			<XSection
				v-for="child in customEmojiFolderRoot.children"
				:key="`custom:${child.value}`"
				:initialShown="false"
				:emojis="computed(() => customEmojis.filter(e => filterCategory(e, child.value)).map(e => `:${e.name}:`))"
				:disabledEmojis="computed(() => customEmojis.filter(e => filterCategory(e, child.value)).filter(e => !canReact(e)).map(e => `:${e.name}:`))"
				:hasChildSection="child.children.length !== 0"
				:customEmojiTree="child.children"
				@chosen="chosen"
			>
				{{ child.value || $locale.sfc.other }}
			</XSection>
		</div>
		<div v-once class="group">
			<header class="_acrylic">{{ $locale.sfc.emoji }}</header>
			<XSection v-for="category in categories" :key="category" :emojis="emojiCharByCategory.get(category) ?? []" :hasChildSection="false" @chosen="chosen">{{ category }}</XSection>
		</div>
	</div>
	<div class="tabs">
		<button class="_button tab" :class="{ active: tab === 'index' }" @click="tab = 'index'"><i class="ti ti-asterisk ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'custom' }" @click="tab = 'custom'"><i class="ti ti-mood-happy ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'unicode' }" @click="tab = 'unicode'"><i class="ti ti-leaf ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'tags' }" @click="tab = 'tags'"><i class="ti ti-hash ti-fw"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import {
	emojilist,
	emojiCharByCategory,
	unicodeEmojiCategories as categories,
	getEmojiName,
	getUnicodeEmoji,
} from '@features/emojis/frontend/shared/emojilist.js';
import type {
	UnicodeEmojiDef,
	CustomEmojiFolderTree,
} from '@features/emojis/frontend/shared/emojilist.js';
import XSection from '@features/emojis/frontend/components/MkEmojiPicker.section.vue';
import MkRippleEffect from '@features/ui/frontend/components/MkRippleEffect.vue';
import * as os from '@features/ui/frontend/os.js';
import { isTouchUsing } from '@features/ui/frontend/utility/touch.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import { store } from '@features/preferences/frontend/store.js';
import { customEmojiCategories, customEmojis, customEmojisMap } from '@features/emojis/frontend/custom-emojis.js';
import { $i } from '@features/auth/frontend/i.js';
import { checkReactionPermissions } from '@features/notes/frontend/utility/check-reaction-permissions.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { haptic } from '@features/ui/frontend/utility/haptic.js';

const router = useRouter();

const props = withDefaults(defineProps<{
	showPinned?: boolean;
	pinnedEmojis?: string[];
	maxHeight?: number;
	asDrawer?: boolean;
	asWindow?: boolean;
	asReactionPicker?: boolean; // 今は使われてないが将来的に使いそう
	targetNote?: Misskey.entities.Note | null;
}>(), {
	showPinned: true,
});

const emit = defineEmits<{
	(ev: 'chosen', v: string): void;
	(ev: 'esc'): void;
}>();

const searchEl = useTemplateRef('searchEl');
const emojisEl = useTemplateRef('emojisEl');

const {
	emojiPickerScale,
	emojiPickerWidth,
	emojiPickerHeight,
} = prefer.r;

const recentlyUsedEmojis = store.r.recentlyUsedEmojis;

const recentlyUsedEmojisDef = computed(() => {
	return recentlyUsedEmojis.value.map(getDef);
});
const pinnedEmojisDef = computed(() => {
	return pinned.value?.map(getDef);
});

const pinned = computed(() => props.pinnedEmojis);
const size = computed(() => emojiPickerScale.value);
const width = computed(() => emojiPickerWidth.value);
const height = computed(() => emojiPickerHeight.value);
const q = ref<string>('');
const searchResultCustom = ref<Misskey.entities.EmojiSimple[]>([]);
const searchResultUnicode = ref<UnicodeEmojiDef[]>([]);
const tab = ref<'index' | 'custom' | 'unicode' | 'tags'>('index');

const customEmojiFolderRoot: CustomEmojiFolderTree = { value: '', category: '', children: [] };

function parseAndMergeCategories(input: string, root: CustomEmojiFolderTree): CustomEmojiFolderTree {
	const parts = input.split('/').map(p => p.trim());
	let currentNode: CustomEmojiFolderTree = root;

	for (const part of parts) {
		let existingNode = currentNode.children.find((node) => node.value === part);

		if (!existingNode) {
			const newNode: CustomEmojiFolderTree = { value: part, category: input, children: [] };
			currentNode.children.push(newNode);
			existingNode = newNode;
		}

		currentNode = existingNode;
	}

	return currentNode;
}

customEmojiCategories.value.forEach(ec => {
	if (ec !== null) {
		parseAndMergeCategories(ec, customEmojiFolderRoot);
	}
});

parseAndMergeCategories('', customEmojiFolderRoot);

watch(q, () => {
	if (emojisEl.value) emojisEl.value.scrollTop = 0;

	if (q.value === '') {
		searchResultCustom.value = [];
		searchResultUnicode.value = [];
		return;
	}

	const newQ = q.value.replace(/:/g, '').toLowerCase();

	const searchCustom = () => {
		const max = 100;
		const emojis = customEmojis.value;
		const matches = new Set<Misskey.entities.EmojiSimple>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			// 名前にキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			// 名前またはエイリアスにキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword) || emoji.aliases.some(alias => alias.includes(keyword)))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		} else {
			if (customEmojisMap.has(newQ)) {
				matches.add(customEmojisMap.get(newQ)!);
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias === newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.startsWith(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.includes(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		}

		return matches;
	};

	const searchUnicode = () => {
		const max = 100;
		const emojis = emojilist;
		const matches = new Set<UnicodeEmojiDef>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(store.s.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (keywords.every(keyword => index[emoji.char]?.some(k => k.includes(keyword)))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}
		} else {
			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(store.s.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (index[emoji.char]?.some(k => k.startsWith(newQ))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(store.s.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (index[emoji.char]?.some(k => k.includes(newQ))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}
		}

		return matches;
	};

	searchResultCustom.value = Array.from(searchCustom());
	searchResultUnicode.value = Array.from(searchUnicode());
});

function canReact(emoji: Misskey.entities.EmojiSimple | UnicodeEmojiDef | string): boolean {
	return !props.targetNote || checkReactionPermissions($i!, props.targetNote, emoji);
}

function filterCategory(emoji: Misskey.entities.EmojiSimple, category: string): boolean {
	return category === '' ? (emoji.category === 'null' || !emoji.category) : emoji.category === category;
}

function focus() {
	if (!['smartphone', 'tablet'].includes(deviceKind) && !isTouchUsing) {
		searchEl.value?.focus({
			preventScroll: true,
		});
	}
}

function reset() {
	if (emojisEl.value) emojisEl.value.scrollTop = 0;
	q.value = '';
}

function getKey(emoji: string | Misskey.entities.EmojiSimple | UnicodeEmojiDef): string {
	return typeof emoji === 'string' ? emoji : 'char' in emoji ? emoji.char : `:${emoji.name}:`;
}

function getDef(emoji: string): string | Misskey.entities.EmojiSimple | UnicodeEmojiDef {
	if (emoji.includes(':')) {
		// カスタム絵文字が存在する場合はその情報を持つオブジェクトを返し、
		// サーバの管理画面から削除された等で情報が見つからない場合は名前の文字列をそのまま返しておく（undefinedを返すとエラーになるため）
		const name = emoji.replaceAll(':', '');
		return customEmojisMap.get(name) ?? emoji;
	} else {
		return getUnicodeEmoji(emoji);
	}
}

/** @see MkEmojiPicker.section.vue */
function computeButtonTitle(ev: PointerEvent): void {
	const elm = ev.target as HTMLElement;
	const emoji = elm.dataset.emoji as string;
	elm.title = getEmojiName(emoji);
}

function chosen(emoji: string | Misskey.entities.EmojiSimple | UnicodeEmojiDef, ev?: PointerEvent) {
	const el = ev && (ev.currentTarget ?? ev.target) as HTMLElement | null | undefined;
	if (el && prefer.s.animation) {
		const rect = el.getBoundingClientRect();
		const x = rect.left + (el.offsetWidth / 2);
		const y = rect.top + (el.offsetHeight / 2);
		const { dispose } = os.popup(MkRippleEffect, { x, y }, {
			end: () => dispose(),
		});
	}

	const key = getKey(emoji);
	emit('chosen', key);

	haptic();

	// 最近使った絵文字更新
	if (!pinned.value?.includes(key)) {
		let recents = store.s.recentlyUsedEmojis;
		recents = recents.filter((emoji) => emoji !== key);
		recents.unshift(key);
		store.set('recentlyUsedEmojis', recents.splice(0, 32));
	}
}

function input(): void {
	// Using custom input event instead of v-model to respond immediately on
	// Android, where composition happens on all languages
	// (v-model does not update during composition)
	q.value = searchEl.value?.value.trim() ?? '';
}

function paste(event: ClipboardEvent): void {
	const pasted = event.clipboardData?.getData('text') ?? '';
	if (done(pasted)) {
		event.preventDefault();
	}
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;
	if (ev.key === 'Enter') {
		ev.preventDefault();
		ev.stopPropagation();
		done();
	}
	if (ev.key === 'Escape') {
		ev.preventDefault();
		ev.stopPropagation();
		emit('esc');
	}
}

function done(query?: string): boolean | void {
	if (query == null) query = q.value;
	if (query == null || typeof query !== 'string') return;

	const q2 = query.replace(/:/g, '');
	const exactMatchCustom = customEmojisMap.get(q2);
	if (exactMatchCustom) {
		chosen(exactMatchCustom);
		return true;
	}
	const exactMatchUnicode = emojilist.find(emoji => emoji.char === q2 || emoji.name === q2);
	if (exactMatchUnicode) {
		chosen(exactMatchUnicode);
		return true;
	}
	if (searchResultCustom.value.length > 0) {
		chosen(searchResultCustom.value[0]);
		return true;
	}
	if (searchResultUnicode.value.length > 0) {
		chosen(searchResultUnicode.value[0]);
		return true;
	}
}

function settings() {
	emit('esc');
	router.push('/settings/emoji-palette');
}

onMounted(() => {
	focus();
});

defineExpose({
	focus,
	reset,
});
</script>

<style lang="scss" scoped>
.omfetrab {
	$pad: 8px;

	display: flex;
	flex-direction: column;

	&.s1 {
		--eachSize: 40px;
	}

	&.s2 {
		--eachSize: 45px;
	}

	&.s3 {
		--eachSize: 50px;
	}

	&.s4 {
		--eachSize: 55px;
	}

	&.s5 {
		--eachSize: 60px;
	}

	&.w1 {
		--columns: 5;
	}

	&.w2 {
		--columns: 6;
	}

	&.w3 {
		--columns: 7;
	}

	&.w4 {
		--columns: 8;
	}

	&.w5 {
		--columns: 9;
	}

	&.h1 {
		--rows: 4;
	}

	&.h2 {
		--rows: 6;
	}

	&.h3 {
		--rows: 8;
	}

	&.h4 {
		--rows: 10;
	}

	width: calc((var(--eachSize) * var(--columns)) + (#{$pad} * 2));
	height: calc((var(--eachSize) * var(--rows)) + (#{$pad} * 2));

	&.asDrawer {
		width: 100% !important;

		> .emojis {
			::v-deep(section) {
				> header {
					height: 32px;
					line-height: 32px;
					padding: 0 12px;
					font-size: 15px;
				}

				> .body {
					display: grid;
					grid-template-columns: repeat(var(--columns), 1fr);
					font-size: 30px;

					> .config {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;
						font-size: 14px;
					}

					> .item {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;

						&:disabled {
							cursor: not-allowed;
							background: linear-gradient(-45deg, transparent 0% 48%, light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.15)) 48% 52%, transparent 52% 100%);
							opacity: 1;

							> .emoji {
								filter: grayscale(1);
								mix-blend-mode: exclusion;
								opacity: 0.8;
							}
						}
					}
				}
			}
		}
	}

	&.asWindow {
		width: 100% !important;
		height: 100% !important;

		> .emojis {
			::v-deep(section) {
				> .body {
					display: grid;
					grid-template-columns: repeat(var(--columns), 1fr);
					font-size: 30px;

					> .item {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;
						padding: 0;

						&:disabled {
							cursor: not-allowed;
							background: linear-gradient(-45deg, transparent 0% 48%, light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.15)) 48% 52%, transparent 52% 100%);
							opacity: 1;

							> .emoji {
								filter: grayscale(1);
								mix-blend-mode: exclusion;
								opacity: 0.8;
							}
						}
					}
				}
			}
		}
	}

	> .search {
		width: 100%;
		padding: 12px;
		box-sizing: border-box;
		font-size: 1em;
		outline: none;
		border: none;
		background: transparent;
		color: var(--MI_THEME-fg);

		&:not(:focus):not(.filled) {
			margin-bottom: env(safe-area-inset-bottom, 0px);
		}

		&:not(.filled) {
			order: 1;
			z-index: 2;
			box-shadow: 0px -1px 0 0px var(--MI_THEME-divider);
		}
	}

	> .tabs {
		display: flex;
		display: none;

		> .tab {
			flex: 1;
			height: 38px;
			border-top: solid 0.5px var(--MI_THEME-divider);

			&.active {
				border-top: solid 1px var(--MI_THEME-accent);
				color: var(--MI_THEME-accent);
			}
		}
	}

	> .emojis {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none;

		> .group {
			&:not(.index) {
				padding: 4px 0 8px 0;
				border-top: solid 0.5px var(--MI_THEME-divider);
			}

			> header {
				/*position: sticky;
				top: 0;
				left: 0;*/
				height: 32px;
				line-height: 32px;
				z-index: 2;
				padding: 0 8px;
				font-size: 12px;
			}
		}

		::v-deep(section) {
			> header {
				position: sticky;
				top: 0;
				left: 0;
				line-height: 28px;
				z-index: 1;
				padding: 0 8px;
				font-size: 12px;
				cursor: pointer;

				&:hover {
					color: var(--MI_THEME-accent);
				}
			}

			> .body {
				position: relative;
				padding: $pad;

				> .config {
					position: relative;
					padding: 0 3px;
					width: var(--eachSize);
					height: var(--eachSize);
					contain: strict;
					opacity: 0.5;
				}

				> .item {
					position: relative;
					padding: 0 3px;
					width: var(--eachSize);
					height: var(--eachSize);
					contain: strict;
					border-radius: 4px;
					font-size: 24px;

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					&:active {
						background: var(--MI_THEME-accent);
						box-shadow: inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15);
					}

					&:disabled {
						cursor: not-allowed;
						background: linear-gradient(-45deg, transparent 0% 48%, light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.15)) 48% 52%, transparent 52% 100%);
						opacity: 1;

						> .emoji {
							filter: grayscale(1);
							mix-blend-mode: exclusion;
							opacity: 0.8;
						}
					}

					> .emoji {
						height: 1.25em;
						vertical-align: -.25em;
						pointer-events: none;
						width: 100%;
						object-fit: contain;
					}
				}
			}

			&.result {
				border-bottom: solid 0.5px var(--MI_THEME-divider);

				&:empty {
					display: none;
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "search": "البحث",
  "settings": "الاعدادات",
  "recentUsed": "المستخدمة مؤخرا",
  "customEmojis": "إيموجي مخصص",
  "other": "منوعات",
  "emoji": "إيموجي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "search": "Cercar",
  "settings": "Preferències",
  "recentUsed": "Utilitzat recentment",
  "customEmojis": "Emojis personalitzats",
  "other": "Altres",
  "emoji": "Emoji"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "search": "Vyhledávání",
  "settings": "Nastavení",
  "recentUsed": "Naposledy použité",
  "customEmojis": "Vlastní emoji",
  "other": "Ostatní",
  "emoji": "Emoji"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "search": "Search",
  "settings": "Settings",
  "recentUsed": "Recently used",
  "customEmojis": "Custom Emoji",
  "other": "Other",
  "emoji": "Emoji"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "search": "Suchen",
  "settings": "Einstellungen",
  "recentUsed": "Vor kurzem verwendet",
  "customEmojis": "Benutzerdefinierte Emojis",
  "other": "Anderes",
  "emoji": "Emoji"
}
</locale>

<locale locale="en-US" lang="json">
{
  "search": "Search",
  "settings": "Settings",
  "recentUsed": "Recently used",
  "customEmojis": "Custom Emoji",
  "other": "Other",
  "emoji": "Emoji"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "search": "Buscar",
  "settings": "Configuración",
  "recentUsed": "Usado recientemente",
  "customEmojis": "Emojis personalizados",
  "other": "Otro",
  "emoji": "Emoji"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "search": "Rechercher",
  "settings": "Paramètres",
  "recentUsed": "Utilisé récemment",
  "customEmojis": "Émojis personnalisés",
  "other": "Autre",
  "emoji": "Émoji"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "search": "Cari",
  "settings": "Pengaturan",
  "recentUsed": "Baru saja digunakan",
  "customEmojis": "Emoji kustom",
  "other": "Lainnya",
  "emoji": "Emoji"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "search": "Cerca",
  "settings": "Impostazioni",
  "recentUsed": "Usato di recente",
  "customEmojis": "Emoji personalizzate",
  "other": "Eccetera",
  "emoji": "Emoji"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "search": "検索",
  "settings": "設定",
  "recentUsed": "最近使用",
  "customEmojis": "カスタム絵文字",
  "other": "その他",
  "emoji": "絵文字"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "search": "探す",
  "settings": "設定",
  "recentUsed": "最近使ったやつ",
  "customEmojis": "カスタム絵文字",
  "other": "その他",
  "emoji": "絵文字"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "search": "Nadi",
  "settings": "Iɣewwaṛen",
  "recentUsed": "Recently used",
  "customEmojis": "Custom Emoji",
  "other": "Wiyyaḍ",
  "emoji": "Emoji"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "search": "ಹುಡುಕು",
  "settings": "ಸಿದ್ಧತೆಗಳು",
  "recentUsed": "Recently used",
  "customEmojis": "Custom Emoji",
  "other": "Other",
  "emoji": "Emoji"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "search": "검색",
  "settings": "설정",
  "recentUsed": "최근 사용",
  "customEmojis": "커스텀 이모지",
  "other": "기타",
  "emoji": "이모지"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "search": "Zoeken",
  "settings": "Instellingen",
  "recentUsed": "Recent gebruikt",
  "customEmojis": "Eigen emoji",
  "other": "Ander",
  "emoji": "Emoji"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "search": "Søk",
  "settings": "Innstillinger",
  "recentUsed": "Sist brukte",
  "customEmojis": "Custom Emoji",
  "other": "Andre",
  "emoji": "Emoji"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "search": "Szukaj",
  "settings": "Ustawienia",
  "recentUsed": "Ostatnio używane",
  "customEmojis": "Niestandardowe emoji",
  "other": "Inne",
  "emoji": "Emoji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "search": "Pesquisar",
  "settings": "Configurações",
  "recentUsed": "Usado recentemente",
  "customEmojis": "Emoji personalizado",
  "other": "Outros",
  "emoji": "Emoji"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "search": "Поиск",
  "settings": "Настройки",
  "recentUsed": "Последние использованные",
  "customEmojis": "Собственные эмодзи",
  "other": "Другие",
  "emoji": "Эмодзи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "search": "Hľadať",
  "settings": "Nastavenia",
  "recentUsed": "Neposledy použité",
  "customEmojis": "Vlastné emoji",
  "other": "Ostatní",
  "emoji": "Emoji"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "search": "ค้นหา",
  "settings": "การตั้งค่า",
  "recentUsed": "ใช้ล่าสุด",
  "customEmojis": "เอโมจิที่กำหนดเอง",
  "other": "อื่น ๆ",
  "emoji": "เอโมจิ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "search": "Ara",
  "settings": "Ayarlar",
  "recentUsed": "Son kullanılan",
  "customEmojis": "Özel Emoji",
  "other": "Diğer",
  "emoji": "Emoji"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "search": "ئىزدەش",
  "settings": "Settings",
  "recentUsed": "Recently used",
  "customEmojis": "Custom Emoji",
  "other": "Other",
  "emoji": "Emoji"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "search": "Пошук",
  "settings": "Налаштування",
  "recentUsed": "Нещодавні",
  "customEmojis": "Кастомні емоджі",
  "other": "Інше",
  "emoji": "Емодзі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "search": "Tìm kiếm",
  "settings": "Cài đặt",
  "recentUsed": "Sử dụng gần đây",
  "customEmojis": "Tùy chỉnh emoji",
  "other": "Khác",
  "emoji": "Emoji"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "search": "搜索",
  "settings": "设置",
  "recentUsed": "最近使用",
  "customEmojis": "自定义表情符号",
  "other": "其他",
  "emoji": "表情符号"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "search": "搜尋",
  "settings": "設定",
  "recentUsed": "最近使用",
  "customEmojis": "自訂表情符號",
  "other": "其他",
  "emoji": "表情符號"
}
</locale>
