<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root]"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<header :class="$style.header">
		<div :class="$style.headerLeft">
			<button v-if="!fixed" :class="$style.cancel" class="_button" @click="cancel"><i class="ti ti-x"></i></button>
			<button ref="accountMenuEl" v-click-anime v-tooltip="$locale.sfc.account" class="_button" @click="openAccountMenu">
				<img :class="$style.avatar" :src="(postAccount ?? $i).avatarUrl" style="border-radius: 100%;"/>
			</button>
		</div>
		<div :class="$style.headerRight">
			<template v-if="!(targetChannel != null && fixed)">
				<button v-if="targetChannel == null" ref="visibilityButton" v-tooltip="$locale.sfc.visibility" :class="['_button', $style.headerRightItem, $style.visibility]" @click="setVisibility">
					<span v-if="visibility === 'public'"><i class="ti ti-world"></i></span>
					<span v-if="visibility === 'home'"><i class="ti ti-home"></i></span>
					<span v-if="visibility === 'followers'"><i class="ti ti-lock"></i></span>
					<span v-if="visibility === 'specified'"><i class="ti ti-mail"></i></span>
					<span :class="$style.headerRightButtonText">{{ copyLocaleDictionary($locale.sfc.visibilityLabels)[visibility] }}</span>
				</button>
				<button v-else class="_button" :class="[$style.headerRightItem, $style.visibility]" disabled>
					<span><i class="ti ti-device-tv"></i></span>
					<span :class="$style.headerRightButtonText">{{ targetChannel.name }}</span>
				</button>
			</template>
			<button v-if="visibility !== 'specified'" v-tooltip="$locale.sfc.visibilityDisableFederation" class="_button" :class="[$style.headerRightItem, { [$style.danger]: localOnly }]" :disabled="targetChannel != null" @click="toggleLocalOnly">
				<span v-if="!localOnly"><i class="ti ti-rocket"></i></span>
				<span v-else><i class="ti ti-rocket-off"></i></span>
			</button>
			<button ref="otherSettingsButton" v-tooltip="$locale.sfc.other" class="_button" :class="$style.headerRightItem" @click="showOtherSettings"><i class="ti ti-dots"></i></button>
			<button ref="submitButtonEl" v-click-anime class="_button" :class="$style.submit" :disabled="!canPost" data-testid="post-form-submit" @click="post">
				<div :class="$style.submitInner">
					<template v-if="posted"></template>
					<template v-else-if="posting"><MkEllipsis/></template>
					<template v-else>{{ submitText }}</template>
					<i style="margin-left: 6px;" :class="submitIcon"></i>
				</div>
			</button>
		</div>
	</header>
	<MkNoteSimple v-if="replyTargetNote" :class="$style.targetNote" :note="replyTargetNote"/>
	<MkNoteSimple v-if="renoteTargetNote" :class="$style.targetNote" :note="renoteTargetNote"/>
	<div v-if="quoteId" :class="$style.withQuote"><i class="ti ti-quote"></i> {{ $locale.sfc.quoteAttached }}<button @click="quoteId = null; renoteTargetNote = null;"><i class="ti ti-x"></i></button></div>
	<div v-if="visibility === 'specified'" :class="$style.toSpecified">
		<span style="margin-right: 8px;">{{ $locale.sfc.recipient }}</span>
		<div :class="$style.visibleUsers">
			<span v-for="u in visibleUsers" :key="u.id" :class="$style.visibleUser">
				<MkAcct :user="u"/>
				<button class="_button" style="padding: 4px 8px;" @click="removeVisibleUser(u.id)"><i class="ti ti-x"></i></button>
			</span>
			<button class="_buttonPrimary" style="padding: 4px; border-radius: 8px;" @click="addVisibleUser"><i class="ti ti-plus ti-fw"></i></button>
		</div>
	</div>
	<MkInfo v-if="!store.r.tips.value.postForm" :class="$style.showHowToUse" closable @close="closeTip('postForm')">
		<button class="_textButton" @click="showTour">{{ $locale.sfc.postFormShowHowToUse }}</button>
	</MkInfo>
	<MkInfo v-if="scheduledAt != null" :class="$style.scheduledAt">
		<I18n :src="$locale.sfc.scheduleToPostOnX" tag="span">
			<template #x>
				<MkTime :time="scheduledAt" :mode="'detail'" style="font-weight: bold;"/>
			</template>
		</I18n> - <button class="_textButton" @click="cancelSchedule()">{{ $locale.sfc.cancel }}</button>
	</MkInfo>
	<MkInfo v-if="hasNotSpecifiedMentions" warn :class="$style.hasNotSpecifiedMentions">{{ $locale.sfc.notSpecifiedMentionWarning }} - <button class="_textButton" @click="addMissingMention()">{{ $locale.sfc.add }}</button></MkInfo>
	<div v-show="useCw" :class="$style.cwOuter">
		<input ref="cwInputEl" v-model="cw" :class="$style.cw" :placeholder="$locale.sfc.annotation" @keydown="onKeydown" @keyup="onKeyup" @compositionend="onCompositionEnd">
		<div v-if="maxCwTextLength - cwTextLength < 20" :class="['_acrylic', $style.cwTextCount, { [$style.cwTextOver]: cwTextLength > maxCwTextLength }]">{{ maxCwTextLength - cwTextLength }}</div>
	</div>
	<div :class="[$style.textOuter, { [$style.withCw]: useCw }]">
		<div v-if="targetChannel" :class="$style.colorBar" :style="{ background: targetChannel.color }"></div>
		<textarea ref="textareaEl" v-model="text" :class="[$style.text]" :disabled="posting || posted" :readonly="textAreaReadOnly" :placeholder="placeholder" data-testid="post-form-text" @keydown="onKeydown" @keyup="onKeyup" @paste="onPaste" @compositionupdate="onCompositionUpdate" @compositionend="onCompositionEnd"></textarea>
		<div v-if="maxTextLength - textLength < 100" :class="['_acrylic', $style.textCount, { [$style.textOver]: textLength > maxTextLength }]">{{ maxTextLength - textLength }}</div>
	</div>
	<input v-show="withHashtags" ref="hashtagsInputEl" v-model="hashtags" :class="$style.hashtags" :placeholder="$locale.sfc.hashtags" list="hashtags">
	<XPostFormAttaches v-model="files" @detach="detachFile" @changeSensitive="updateFileSensitive" @changeName="updateFileName"/>
	<div v-if="uploader.items.value.length > 0" style="padding: 12px;">
		<MkTip k="postFormUploader">
			{{ $locale.sfc.postFormUploaderTip }}
		</MkTip>
		<MkUploaderItems :items="uploader.items.value" @showMenu="(item, ev) => showPerUploadItemMenu(item, ev)" @showMenuViaContextmenu="(item, ev) => showPerUploadItemMenuViaContextmenu(item, ev)"/>
	</div>
	<MkPollEditor v-if="poll" v-model="poll" @destroyed="poll = null"/>
	<MkNotePreview v-if="showPreview" :class="$style.preview" :text="text" :files="files" :poll="poll ?? undefined" :useCw="useCw" :cw="cw" :user="postAccount ?? $i"/>
	<div v-if="showingOptions" style="padding: 8px 16px;">
	</div>
	<footer ref="footerEl" :class="$style.footer">
		<div :class="$style.footerLeft">
			<button v-tooltip="$locale.sfc.attachFile + ' (' + $locale.sfc.upload + ')'" class="_button" :class="$style.footerButton" @click="chooseFileFromPc"><i class="ti ti-photo-plus"></i></button>
			<button v-tooltip="$locale.sfc.attachFile + ' (' + $locale.sfc.fromDrive + ')'" class="_button" :class="$style.footerButton" @click="chooseFileFromDrive"><i class="ti ti-cloud-download"></i></button>
			<button v-tooltip="$locale.sfc.poll" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: poll }]" @click="togglePoll"><i class="ti ti-chart-arrows"></i></button>
			<button v-tooltip="$locale.sfc.useCw" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: useCw }]" @click="useCw = !useCw"><i class="ti ti-eye-off"></i></button>
			<button v-tooltip="$locale.sfc.hashtags" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: withHashtags }]" @click="withHashtags = !withHashtags"><i class="ti ti-hash"></i></button>
			<button v-tooltip="$locale.sfc.mention" class="_button" :class="$style.footerButton" @click="insertMention"><i class="ti ti-at"></i></button>
			<button v-if="showAddMfmFunction" v-tooltip="$locale.sfc.addMfmFunction" :class="['_button', $style.footerButton]" @click="insertMfmFunction"><i class="ti ti-palette"></i></button>
			<button v-if="postFormActions.length > 0" v-tooltip="$locale.sfc.plugins" class="_button" :class="$style.footerButton" @click="showActions"><i class="ti ti-plug"></i></button>
		</div>
		<div :class="$style.footerRight">
			<button v-tooltip="$locale.sfc.emoji" :class="['_button', $style.footerButton]" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
		</div>
	</footer>
	<datalist id="hashtags">
		<option v-for="hashtag in recentHashtags" :key="hashtag" :value="hashtag"></option>
	</datalist>
</div>
</template>

<script lang="ts" setup>
import { watch, nextTick, onMounted, defineAsyncComponent, provide, shallowRef, ref, computed, useTemplateRef, onUnmounted, onBeforeUnmount } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import insertTextAtCursor from 'insert-text-at-cursor';
import { toASCII } from 'punycode.js';
import { host, url } from '@features/boot/frontend/shared/config.js';
import MkUploaderItems from '@features/drive/frontend/components/MkUploaderItems.vue';
import type { ShallowRef } from 'vue';
import type { PostFormProps } from '../types/post-form.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';
import type { UploaderItem } from '@features/drive/frontend/composables/use-uploader.js';
import MkNotePreview from '@features/notes/frontend/components/MkNotePreview.vue';
import XPostFormAttaches from '@features/notes/frontend/components/MkPostFormAttaches.vue';
import XTextCounter from '@features/notes/frontend/components/MkPostForm.TextCounter.vue';
import MkPollEditor from '@features/notes/frontend/components/MkPollEditor.vue';
import MkNoteSimple from '@features/notes/frontend/components/MkNoteSimple.vue';
import { erase, unique } from '@features/runtime/frontend/utility/array.js';
import { extractMentions } from '@features/markup/frontend/utility/extract-mentions.js';
import { formatTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { Autocomplete } from '@features/discovery/frontend/utility/autocomplete.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import { store } from '@features/preferences/frontend/store.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { instance } from '@features/instance/frontend/instance.js';
import { ensureSignin, notesCount, incNotesCount } from '@features/auth/frontend/i.js';
import { getAccounts, getAccountMenu } from '@features/auth/frontend/accounts.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkRippleEffect from '@features/ui/frontend/components/MkRippleEffect.vue';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { emojiPicker } from '@features/emojis/frontend/utility/emoji-picker.js';
import { mfmFunctionPicker } from '@features/markup/frontend/utility/mfm-function-picker.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { getPluginHandlers } from '@features/integrations/frontend/plugin.js';
import { DI } from '@features/ui/frontend/di.js';
import { globalEvents } from '@features/runtime/frontend/events.js';
import { checkDragDataType, getDragData } from '@features/ui/frontend/drag-and-drop.js';
import { useUploader } from '@features/drive/frontend/composables/use-uploader.js';
import { startTour } from '@features/navigation/frontend/utility/tour.js';
import { closeTip } from '@features/web/frontend/tips.js';

const $i = ensureSignin();

const props = withDefaults(defineProps<PostFormProps & {
	fixed?: boolean;
	autofocus?: boolean;
	freezeAfterPosted?: boolean;
	mock?: boolean;
}>(), {
	initialVisibleUsers: () => [],
	autofocus: true,
	mock: false,
	initialLocalOnly: undefined,
});

provide(DI.mock, props.mock);

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'cancel'): void;
	(ev: 'esc'): void;

	// Mock用
	(ev: 'fileChangeSensitive', fileId: string, to: boolean): void;
}>();

const textareaEl = useTemplateRef('textareaEl');
const cwInputEl = useTemplateRef('cwInputEl');
const hashtagsInputEl = useTemplateRef('hashtagsInputEl');
const visibilityButton = useTemplateRef('visibilityButton');
const otherSettingsButton = useTemplateRef('otherSettingsButton');
const accountMenuEl = useTemplateRef('accountMenuEl');
const footerEl = useTemplateRef('footerEl');
const submitButtonEl = useTemplateRef('submitButtonEl');

const posting = ref(false);
const posted = ref(false);
const text = ref(props.initialText ?? '');
const files = ref(props.initialFiles ?? []);
const poll = ref<PollEditorModelValue | null>(null);
const useCw = ref<boolean>(!!props.initialCw);
const showPreview = ref(store.s.showPreview);
watch(showPreview, () => store.set('showPreview', showPreview.value));
const showAddMfmFunction = ref(prefer.s.enableQuickAddMfmFunction);
watch(showAddMfmFunction, () => prefer.commit('enableQuickAddMfmFunction', showAddMfmFunction.value));
const cw = ref<string | null>(props.initialCw ?? null);
const localOnly = ref(props.initialLocalOnly ?? (prefer.s.rememberNoteVisibility ? store.s.localOnly : prefer.s.defaultNoteLocalOnly));
const visibility = ref(props.initialVisibility ?? (prefer.s.rememberNoteVisibility ? store.s.visibility : prefer.s.defaultNoteVisibility));
const visibleUsers = ref<Misskey.entities.UserDetailed[]>([]);
if (props.initialVisibleUsers) {
	props.initialVisibleUsers.forEach(u => pushVisibleUser(u));
}
const reactionAcceptance = ref(store.s.reactionAcceptance);
const scheduledAt = ref<number | null>(null);
const draghover = ref(false);
const quoteId = ref<string | null>(null);
const hasNotSpecifiedMentions = ref(false);
const recentHashtags = ref(JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]'));
const imeText = ref('');
const showingOptions = ref(false);
const textAreaReadOnly = ref(false);
const justEndedComposition = ref(false);
const renoteTargetNote: ShallowRef<PostFormProps['renote'] | null> = shallowRef(props.renote);
const replyTargetNote: ShallowRef<PostFormProps['reply'] | null> = shallowRef(props.reply);
const targetChannel = shallowRef(props.channel);

const serverDraftId = ref<string | null>(null);
const postFormActions = getPluginHandlers('post_form_action');

let textAutocomplete: Autocomplete | null = null;
let cwAutocomplete: Autocomplete | null = null;
let hashtagAutocomplete: Autocomplete | null = null;

const uploader = useUploader({
	multiple: true,
});

onUnmounted(() => {
	uploader.dispose();
});

uploader.events.on('itemUploaded', ctx => {
	files.value.push(ctx.item.uploaded!);
	uploader.removeItem(ctx.item);
});

if (props.initialLocalFiles) {
	uploader.addFiles(props.initialLocalFiles);
}

const draftKey = computed((): string => {
	let key = targetChannel.value ? `channel:${targetChannel.value.id}` : '';

	if (renoteTargetNote.value) {
		key += `renote:${renoteTargetNote.value.id}`;
	} else if (replyTargetNote.value) {
		key += `reply:${replyTargetNote.value.id}`;
	} else {
		key += `note:${$i.id}`;
	}

	return key;
});

const placeholder = computed((): string => {
	if (renoteTargetNote.value) {
		return $locale.value.sfc.postFormQuotePlaceholder;
	} else if (replyTargetNote.value) {
		return $locale.value.sfc.postFormReplyPlaceholder;
	} else if (targetChannel.value) {
		return $locale.value.sfc.postFormChannelPlaceholder;
	} else {
		const xs = [
			$locale.value.sfc.postFormPlaceholdersA,
			$locale.value.sfc.postFormPlaceholdersB,
			$locale.value.sfc.postFormPlaceholdersC,
			$locale.value.sfc.postFormPlaceholdersD,
			$locale.value.sfc.postFormPlaceholdersE,
			$locale.value.sfc.postFormPlaceholdersF,
		];
		return xs[Math.floor(Math.random() * xs.length)];
	}
});

const submitText = computed((): string => {
	return scheduledAt.value != null
		? $locale.value.sfc.schedule
		: renoteTargetNote.value
			? $locale.value.sfc.quote
			: replyTargetNote.value
				? $locale.value.sfc.reply
				: $locale.value.sfc.note;
});

const submitIcon = computed((): string => {
	return posted.value ? 'ti ti-check' : scheduledAt.value != null ? 'ti ti-calendar-time' : replyTargetNote.value ? 'ti ti-arrow-back-up' : renoteTargetNote.value ? 'ti ti-quote' : 'ti ti-send';
});

const textLength = computed((): number => {
	return (text.value + imeText.value).length;
});

const maxTextLength = computed((): number => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const cwTextLength = computed((): number => {
	return cw.value?.length ?? 0;
});

const maxCwTextLength = 100;

const canPost = computed((): boolean => {
	return !props.mock && !posting.value && !posted.value && !uploader.uploading.value && (uploader.items.value.length === 0 || uploader.readyForUpload.value) &&
		(
			1 <= textLength.value ||
			1 <= files.value.length ||
			1 <= uploader.items.value.length ||
			poll.value != null ||
			renoteTargetNote.value != null ||
			quoteId.value != null
		) &&
		(textLength.value <= maxTextLength.value) &&
		(
			useCw.value ?
				(
					cw.value != null && cw.value.trim() !== '' &&
					cwTextLength.value <= maxCwTextLength
				) : true
		) &&
		(files.value.length <= 16) &&
		(!poll.value || poll.value.choices.length >= 2);
});

// cannot save pure renote as draft
const canSaveAsServerDraft = computed((): boolean => {
	return canPost.value && (textLength.value > 0 || files.value.length > 0 || poll.value != null);
});

const withHashtags = store.model('postFormWithHashtags');
const hashtags = store.model('postFormHashtags');

watch(text, () => {
	checkMissingMention();
}, { immediate: true });

watch(visibility, () => {
	checkMissingMention();
}, { immediate: true });

watch(visibleUsers, () => {
	checkMissingMention();
}, {
	deep: true,
});

if (props.mention) {
	text.value = props.mention.host ? `@${props.mention.username}@${toASCII(props.mention.host)}` : `@${props.mention.username}`;
	text.value += ' ';
}

if (replyTargetNote.value && (replyTargetNote.value.user.username !== $i.username || (replyTargetNote.value.user.host != null && replyTargetNote.value.user.host !== host))) {
	text.value = `@${replyTargetNote.value.user.username}${replyTargetNote.value.user.host != null ? '@' + toASCII(replyTargetNote.value.user.host) : ''} `;
}

if (replyTargetNote.value && replyTargetNote.value.text != null) {
	const ast = mfm.parse(replyTargetNote.value.text);
	const otherHost = replyTargetNote.value.user.host;

	for (const x of extractMentions(ast)) {
		const mention = x.host ?
			`@${x.username}@${toASCII(x.host)}` :
			(otherHost == null || otherHost === host) ?
				`@${x.username}` :
				`@${x.username}@${toASCII(otherHost)}`;

		// 自分は除外
		if ($i.username === x.username && (x.host == null || x.host === host)) continue;

		// 重複は除外
		if (text.value.includes(`${mention} `)) continue;

		text.value += `${mention} `;
	}
}

if ($i.isSilenced && visibility.value === 'public') {
	visibility.value = 'home';
}

if (targetChannel.value) {
	visibility.value = 'public';
	localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
}

// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
if (replyTargetNote.value && ['home', 'followers', 'specified'].includes(replyTargetNote.value.visibility)) {
	if (replyTargetNote.value.visibility === 'home' && visibility.value === 'followers') {
		visibility.value = 'followers';
	} else if (['home', 'followers'].includes(replyTargetNote.value.visibility) && visibility.value === 'specified') {
		visibility.value = 'specified';
	} else {
		visibility.value = replyTargetNote.value.visibility;
	}

	if (visibility.value === 'specified') {
		if (replyTargetNote.value.visibleUserIds) {
			misskeyApi('users/show', {
				userIds: replyTargetNote.value.visibleUserIds.filter(uid => uid !== $i.id && uid !== replyTargetNote.value?.userId),
			}).then(users => {
				users.forEach(u => pushVisibleUser(u));
			});
		}

		if (replyTargetNote.value.userId !== $i.id) {
			misskeyApi('users/show', { userId: replyTargetNote.value.userId }).then(user => {
				pushVisibleUser(user);
			});
		}
	}
}

if (props.specified) {
	visibility.value = 'specified';
	pushVisibleUser(props.specified);
}

// keep cw when reply
if (prefer.s.keepCw && replyTargetNote.value && replyTargetNote.value.cw) {
	useCw.value = true;
	cw.value = replyTargetNote.value.cw;
}

function watchForDraft() {
	watch(text, () => saveDraft());
	watch(useCw, () => saveDraft());
	watch(cw, () => saveDraft());
	watch(poll, () => saveDraft());
	watch(files, () => saveDraft(), { deep: true });
	watch(visibility, () => saveDraft());
	watch(localOnly, () => saveDraft());
	watch(quoteId, () => saveDraft());
	watch(reactionAcceptance, () => saveDraft());
	watch(scheduledAt, () => saveDraft());
}

function checkMissingMention() {
	if (visibility.value === 'specified') {
		const ast = mfm.parse(text.value);

		for (const x of extractMentions(ast)) {
			if (!visibleUsers.value.some(u => (u.username === x.username) && ((u.host === x.host) || (x.host === host && u.host == null)))) {
				hasNotSpecifiedMentions.value = true;
				return;
			}
		}
	}
	hasNotSpecifiedMentions.value = false;
}

function addMissingMention() {
	const ast = mfm.parse(text.value);

	for (const x of extractMentions(ast)) {
		if (!visibleUsers.value.some(u => (u.username === x.username) && (u.host === x.host))) {
			misskeyApi('users/show', { username: x.username, host: x.host }).then(user => {
				pushVisibleUser(user);
			});
		}
	}
}

function togglePoll() {
	if (poll.value) {
		poll.value = null;
	} else {
		poll.value = {
			choices: ['', ''],
			multiple: false,
			expiresAt: null,
			expiredAfter: null,
		};
	}
}

function addTag(tag: string) {
	if (textareaEl.value == null) return;
	insertTextAtCursor(textareaEl.value, ` #${tag} `);
}

function focus() {
	if (textareaEl.value) {
		textareaEl.value.focus();
		textareaEl.value.setSelectionRange(textareaEl.value.value.length, textareaEl.value.value.length);
	}
}

function chooseFileFromPc(ev: PointerEvent) {
	if (props.mock) return;

	os.chooseFileFromPc({ multiple: true }).then(files => {
		if (files.length === 0) return;
		uploader.addFiles(files);
	});
}

function chooseFileFromDrive(ev: PointerEvent) {
	if (props.mock) return;

	chooseDriveFile({ multiple: true }).then(driveFiles => {
		files.value.push(...driveFiles);
	});
}

function detachFile(id: Misskey.entities.DriveFile['id']) {
	files.value = files.value.filter(x => x.id !== id);
}

function updateFileSensitive(file: Misskey.entities.DriveFile, isSensitive: boolean) {
	if (props.mock) {
		emit('fileChangeSensitive', file.id, isSensitive);
	}
	files.value[files.value.findIndex(x => x.id === file.id)].isSensitive = isSensitive;
}

function updateFileName(file: Misskey.entities.DriveFile, name: Misskey.entities.DriveFile['name']) {
	files.value[files.value.findIndex(x => x.id === file.id)].name = name;
}

function setVisibility() {
	if (targetChannel.value) {
		visibility.value = 'public';
		localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	const { dispose } = os.popup(defineAsyncComponent(() => import('@features/notes/frontend/components/MkVisibilityPicker.vue')), {
		currentVisibility: visibility.value,
		isSilenced: $i.isSilenced,
		anchorElement: visibilityButton.value,
		...(replyTargetNote.value ? { isReplyVisibilitySpecified: replyTargetNote.value.visibility === 'specified' } : {}),
	}, {
		changeVisibility: v => {
			visibility.value = v;
			if (prefer.s.rememberNoteVisibility) {
				store.set('visibility', visibility.value);
			}
		},
		closed: () => dispose(),
	});
}

async function toggleLocalOnly() {
	if (targetChannel.value) {
		visibility.value = 'public';
		localOnly.value = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	const neverShowInfo = miLocalStorage.getItem('neverShowLocalOnlyInfo');

	if (!localOnly.value && neverShowInfo !== 'true') {
		const confirm = await os.actions({
			type: 'question',
			title: $locale.value.sfc.disableFederationConfirm,
			text: $locale.value.sfc.disableFederationConfirmWarn,
			actions: [
				{
					value: 'yes' as const,
					text: $locale.value.sfc.disableFederationOk,
					primary: true,
				},
				{
					value: 'neverShow' as const,
					text: `${$locale.value.sfc.disableFederationOk} (${$locale.value.sfc.neverShow})`,
					danger: true,
				},
				{
					value: 'no' as const,
					text: $locale.value.sfc.cancel,
				},
			],
		});
		if (confirm.canceled) return;
		if (confirm.result === 'no') return;

		if (confirm.result === 'neverShow') {
			miLocalStorage.setItem('neverShowLocalOnlyInfo', 'true');
		}
	}

	localOnly.value = !localOnly.value;
	if (prefer.s.rememberNoteVisibility) {
		store.set('localOnly', localOnly.value);
	}
}

async function toggleReactionAcceptance() {
	const select = await os.select({
		title: $locale.value.sfc.reactionAcceptance,
		items: [
			{ value: null, label: $locale.value.sfc.all },
			{ value: 'likeOnlyForRemote' as const, label: $locale.value.sfc.likeOnlyForRemote },
			{ value: 'nonSensitiveOnly' as const, label: $locale.value.sfc.nonSensitiveOnly },
			{ value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' as const, label: $locale.value.sfc.nonSensitiveOnlyForLocalLikeOnlyForRemote },
			{ value: 'likeOnly' as const, label: $locale.value.sfc.likeOnly },
		],
		default: reactionAcceptance.value,
	});
	if (select.canceled) return;
	reactionAcceptance.value = select.result;
}

//#region その他の設定メニューpopup
function showOtherSettings() {
	let reactionAcceptanceIcon = 'ti ti-icons';
	let reactionAcceptanceCaption = '';

	switch (reactionAcceptance.value) {
		case 'likeOnly':
			reactionAcceptanceIcon = 'ti ti-heart _love';
			reactionAcceptanceCaption = $locale.value.sfc.likeOnly;
			break;

		case 'likeOnlyForRemote':
			reactionAcceptanceIcon = 'ti ti-heart-plus';
			reactionAcceptanceCaption = $locale.value.sfc.likeOnlyForRemote;
			break;

		case 'nonSensitiveOnly':
			reactionAcceptanceCaption = $locale.value.sfc.nonSensitiveOnly;
			break;

		case 'nonSensitiveOnlyForLocalLikeOnlyForRemote':
			reactionAcceptanceCaption = $locale.value.sfc.nonSensitiveOnlyForLocalLikeOnlyForRemote;
			break;

		default:
			reactionAcceptanceCaption = $locale.value.sfc.all;
			break;
	}

	const menuItems = [{
		type: 'component',
		component: XTextCounter,
		props: {
			textLength: textLength,
		},
	}, { type: 'divider' }, {
		icon: reactionAcceptanceIcon,
		text: $locale.value.sfc.reactionAcceptance,
		caption: reactionAcceptanceCaption,
		action: () => {
			toggleReactionAcceptance();
		},
	}, { type: 'divider' }, {
		type: 'button',
		text: $locale.value.sfc.draftsSaveToDraft,
		icon: 'ti ti-cloud-upload',
		action: async () => {
			if (!canSaveAsServerDraft.value) {
				return os.alert({
					type: 'error',
					text: $locale.value.sfc.draftsCannotCreateDraft,
				});
			}
			saveServerDraft();
		},
	}, ...($i.policies.scheduledNoteLimit > 0 ? [{
		icon: 'ti ti-calendar-time',
		text: $locale.value.sfc.schedulePost + '...',
		action: () => {
			schedule();
		},
	}] : []), { type: 'divider' }, {
		type: 'switch',
		icon: 'ti ti-eye',
		text: $locale.value.sfc.preview,
		ref: showPreview,
	}, {
		icon: 'ti ti-trash',
		text: $locale.value.sfc.reset,
		danger: true,
		action: async () => {
			if (props.mock) return;
			const { canceled } = await os.confirm({
				type: 'question',
				text: $locale.value.sfc.resetAreYouSure,
			});
			if (canceled) return;
			clear();
		},
	}] satisfies MenuItem[];

	os.popupMenu(menuItems, otherSettingsButton.value);
}
//#endregion

function pushVisibleUser(user: Misskey.entities.UserDetailed) {
	if (!visibleUsers.value.some(u => u.username === user.username && u.host === user.host)) {
		visibleUsers.value.push(user);
	}
}

function addVisibleUser() {
	os.selectUser().then(user => {
		pushVisibleUser(user);

		if (!text.value.toLowerCase().includes(`@${user.username.toLowerCase()}`)) {
			text.value = `@${Misskey.acct.toString(user)} ${text.value}`;
		}
	});
}

function removeVisibleUser(id: string) {
	visibleUsers.value = visibleUsers.value.filter(u => u.id !== id);
}

function clear() {
	text.value = '';
	cw.value = null;
	files.value = [];
	poll.value = null;
	quoteId.value = null;
	scheduledAt.value = null;
	uploader.reset();
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && canPost.value) post();

	// justEndedComposition.value is for Safari, which keyDown occurs after compositionend.
	// ev.isComposing is for another browsers.
	if (ev.key === 'Escape' && !justEndedComposition.value && !ev.isComposing) emit('esc');
}

function onKeyup(ev: KeyboardEvent) {
	justEndedComposition.value = false;
}

function onCompositionUpdate(ev: CompositionEvent) {
	imeText.value = ev.data;
}

function onCompositionEnd(ev: CompositionEvent) {
	imeText.value = '';
	justEndedComposition.value = true;
}

const pastedFileName = 'yyyy-MM-dd HH-mm-ss [{{number}}]';

async function onPaste(ev: ClipboardEvent) {
	if (props.mock) return;
	if (ev.clipboardData == null) return;
	if (textareaEl.value == null) return;

	let pastedFiles: File[] = [];
	for (const { item, i } of Array.from(ev.clipboardData.items, (data, x) => ({ item: data, i: x }))) {
		if (item.kind === 'file') {
			const file = item.getAsFile();
			if (!file) continue;
			const lio = file.name.lastIndexOf('.');
			const ext = lio >= 0 ? file.name.slice(lio) : '';
			const formattedName = `${formatTimeString(new Date(file.lastModified), pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
			const renamedFile = new File([file], formattedName, { type: file.type });
			pastedFiles.push(renamedFile);
		}
	}
	if (pastedFiles.length > 0) {
		ev.preventDefault();
		uploader.addFiles(pastedFiles);
		return;
	}

	const paste = ev.clipboardData.getData('text');

	if (!renoteTargetNote.value && !quoteId.value && paste.startsWith(url + '/notes/')) {
		ev.preventDefault();

		const { canceled } = await os.confirm({
			type: 'info',
			text: $locale.value.sfc.quoteQuestion,
		});

		if (canceled) {
			insertTextAtCursor(textareaEl.value, paste);
			return;
		}

		quoteId.value = paste.substring(url.length).match(/^\/notes\/(.+?)\/?$/)?.[1] ?? null;
	}

	if (paste.length > 1000) {
		ev.preventDefault();

		const { canceled } = await os.confirm({
			type: 'info',
			text: $locale.value.sfc.attachAsFileQuestion,
		});

		if (canceled) {
			insertTextAtCursor(textareaEl.value, paste);
			return;
		}

		const fileName = formatTimeString(new Date(), pastedFileName).replace(/{{number}}/g, '0');
		const file = new File([paste], `${fileName}.txt`, { type: 'text/plain' });
		uploader.addFiles([file]);
	}
}

function onDragover(ev: DragEvent) {
	if (ev.dataTransfer == null) return;
	if (ev.dataTransfer.items[0] == null) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles'])) {
		ev.preventDefault();
		draghover.value = true;
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

function onDragenter() {
	draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent): void {
	draghover.value = false;

	// ファイルだったら
	if (ev.dataTransfer && ev.dataTransfer.files.length > 0) {
		ev.preventDefault();
		uploader.addFiles(Array.from(ev.dataTransfer.files));
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			files.value.push(...droppedData);
			ev.preventDefault();
		}
	}
	//#endregion
}

type StoredDrafts = {
	[key: string]: {
		updatedAt: string;
		data: {
			text: string;
			useCw: boolean;
			cw: string | null;
			visibility: 'public' | 'home' | 'followers' | 'specified';
			localOnly: boolean;
			files: Misskey.entities.DriveFile[];
			poll: PollEditorModelValue | null;
			visibleUserIds?: string[];
			quoteId: string | null;
			reactionAcceptance: 'likeOnly' | 'likeOnlyForRemote' | 'nonSensitiveOnly' | 'nonSensitiveOnlyForLocalLikeOnlyForRemote' | null;
			scheduledAt: number | null;
		};
	};
};

function saveDraft() {
	if (props.instant || props.mock) return;

	const draftsData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as StoredDrafts;

	draftsData[draftKey.value] = {
		updatedAt: new Date().toISOString(),
		data: {
			text: text.value,
			useCw: useCw.value,
			cw: cw.value,
			visibility: visibility.value,
			localOnly: localOnly.value,
			files: files.value,
			poll: poll.value,
			...( visibleUsers.value.length > 0 ? { visibleUserIds: visibleUsers.value.map(x => x.id) } : {}),
			quoteId: quoteId.value,
			reactionAcceptance: reactionAcceptance.value,
			scheduledAt: scheduledAt.value,
		},
	};

	miLocalStorage.setItem('drafts', JSON.stringify(draftsData));
}

function deleteDraft() {
	const draftsData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}') as StoredDrafts;

	delete draftsData[draftKey.value];

	miLocalStorage.setItem('drafts', JSON.stringify(draftsData));
}

async function saveServerDraft(options: {
	isActuallyScheduled?: boolean;
} = {}) {
	return await os.apiWithDialog(serverDraftId.value == null ? 'notes/drafts/create' : 'notes/drafts/update', {
		...(serverDraftId.value == null ? {} : { draftId: serverDraftId.value }),
		text: text.value,
		cw: useCw.value ? cw.value || null : null,
		visibility: visibility.value,
		localOnly: localOnly.value,
		hashtag: hashtags.value,
		fileIds: files.value.map(f => f.id),
		poll: poll.value,
		visibleUserIds: visibleUsers.value.map(x => x.id),
		renoteId: renoteTargetNote.value ? renoteTargetNote.value.id : quoteId.value ? quoteId.value : null,
		replyId: replyTargetNote.value ? replyTargetNote.value.id : null,
		channelId: targetChannel.value ? targetChannel.value.id : null,
		reactionAcceptance: reactionAcceptance.value,
		scheduledAt: scheduledAt.value,
		isActuallyScheduled: options.isActuallyScheduled ?? false,
	});
}

function isAnnoying(text: string): boolean {
	return text.includes('$[x2') ||
		text.includes('$[x3') ||
		text.includes('$[x4') ||
		text.includes('$[scale') ||
		text.includes('$[position');
}

async function uploadFiles() {
	await uploader.upload();

	for (const uploadedItem of uploader.items.value.filter(x => x.uploaded != null)) {
		files.value.push(uploadedItem.uploaded!);
		uploader.removeItem(uploadedItem);
	}
}

async function post(ev?: PointerEvent) {
	if (ev != null) {
		const el = (ev.currentTarget ?? ev.target) as HTMLElement | null;

		if (el && prefer.s.animation) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);
			const { dispose } = os.popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		}
	}

	if (scheduledAt.value != null) {
		if (uploader.items.value.some(x => x.uploaded == null)) {
			await uploadFiles();

			// アップロード失敗したものがあったら中止
			if (uploader.items.value.some(x => x.uploaded == null)) {
				return;
			}
		}

		await postAsScheduled();
		clear();
		return;
	}

	if (props.mock) return;

	if (visibility.value === 'public' && (
		(useCw.value && cw.value != null && cw.value.trim() !== '' && isAnnoying(cw.value)) || // CWが迷惑になる場合
		((!useCw.value || cw.value == null || cw.value.trim() === '') && text.value != null && text.value.trim() !== '' && isAnnoying(text.value)) // CWが無い かつ 本文が迷惑になる場合
	)) {
		const { canceled, result } = await os.actions({
			type: 'warning',
			text: $locale.value.sfc.thisPostMayBeAnnoying,
			actions: [{
				value: 'home',
				text: $locale.value.sfc.thisPostMayBeAnnoyingHome,
				primary: true,
			}, {
				value: 'cancel',
				text: $locale.value.sfc.thisPostMayBeAnnoyingCancel,
			}, {
				value: 'ignore',
				text: $locale.value.sfc.thisPostMayBeAnnoyingIgnore,
			}],
		});

		if (canceled) return;
		if (result === 'cancel') return;
		if (result === 'home') {
			visibility.value = 'home';
		}
	}

	if (uploader.items.value.some(x => x.uploaded == null)) {
		await uploadFiles();

		// アップロード失敗したものがあったら中止
		if (uploader.items.value.some(x => x.uploaded == null)) {
			return;
		}
	}

	let postData = {
		text: text.value === '' ? null : text.value,
		fileIds: files.value.length > 0 ? files.value.map(f => f.id) : undefined,
		replyId: replyTargetNote.value ? replyTargetNote.value.id : undefined,
		renoteId: renoteTargetNote.value ? renoteTargetNote.value.id : quoteId.value ? quoteId.value : undefined,
		channelId: targetChannel.value ? targetChannel.value.id : undefined,
		poll: poll.value,
		cw: useCw.value ? cw.value ?? '' : null,
		localOnly: visibility.value === 'specified' ? false : localOnly.value,
		visibility: visibility.value,
		visibleUserIds: visibility.value === 'specified' ? visibleUsers.value.map(u => u.id) : undefined,
		reactionAcceptance: reactionAcceptance.value,
	};

	if (withHashtags.value && hashtags.value && hashtags.value.trim() !== '') {
		const hashtags_ = hashtags.value.trim().split(' ').map(x => x.startsWith('#') ? x : '#' + x).join(' ');
		if (!postData.text) {
			postData.text = hashtags_;
		} else {
			const postTextLines = postData.text.split('\n');
			if (postTextLines[postTextLines.length - 1].trim() === '') {
				postTextLines[postTextLines.length - 1] += hashtags_;
			} else {
				postTextLines[postTextLines.length - 1] += ' ' + hashtags_;
			}
			postData.text = postTextLines.join('\n');
		}
	}

	// plugin
	const notePostInterruptors = getPluginHandlers('note_post_interruptor');
	if (notePostInterruptors.length > 0) {
		for (const interruptor of notePostInterruptors) {
			try {
				postData = await interruptor.handler(deepClone(postData)) as typeof postData;
			} catch (err) {
				console.error(err);
			}
		}
	}

	let token: string | undefined = undefined;

	if (postAccount.value) {
		const storedAccounts = await getAccounts();
		const storedAccount = storedAccounts.find(x => x.id === postAccount.value?.id);
		if (storedAccount && storedAccount.token != null) {
			token = storedAccount.token;
		} else {
			await os.alert({
				type: 'error',
				text: 'cannot find the token of the selected account.',
			});
			return;
		}
	}

	posting.value = true;
	misskeyApi('notes/create', postData, token).then((res) => {
		if (props.freezeAfterPosted) {
			posted.value = true;
		} else {
			clear();
		}

		globalEvents.emit('notePosted', res.createdNote);

		nextTick(() => {
			deleteDraft();
			emit('posted');
			if (postData.text && postData.text !== '') {
				const hashtags_ = mfm.parse(postData.text).map(x => x.type === 'hashtag' && x.props.hashtag).filter(x => x) as string[];
				const history = JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]') as string[];
				miLocalStorage.setItem('hashtags', JSON.stringify(unique(hashtags_.concat(history))));
			}
			posting.value = false;
			postAccount.value = null;

			incNotesCount();
			if (notesCount === 1) {
				claimAchievement('notes1');
			}

			const text = postData.text ?? '';
			const lowerCase = text.toLowerCase();
			if ((lowerCase.includes('love') || lowerCase.includes('❤')) && lowerCase.includes('misskey')) {
				claimAchievement('iLoveMisskey');
			}
			if ([
				'https://youtu.be/Efrlqw8ytg4',
				'https://www.youtube.com/watch?v=Efrlqw8ytg4',
				'https://m.youtube.com/watch?v=Efrlqw8ytg4',

				'https://youtu.be/XVCwzwxdHuA',
				'https://www.youtube.com/watch?v=XVCwzwxdHuA',
				'https://m.youtube.com/watch?v=XVCwzwxdHuA',

				'https://open.spotify.com/track/3Cuj0mZrlLoXx9nydNi7RB',
				'https://open.spotify.com/track/7anfcaNPQWlWCwyCHmZqNy',
				'https://open.spotify.com/track/5Odr16TvEN4my22K9nbH7l',
				'https://open.spotify.com/album/5bOlxyl4igOrp2DwVQxBco',
			].some(url => text.includes(url))) {
				claimAchievement('brainDiver');
			}

			if (renoteTargetNote.value && (renoteTargetNote.value.userId === $i.id) && text.length > 0) {
				claimAchievement('selfQuote');
			}

			const date = new Date();
			const h = date.getHours();
			const m = date.getMinutes();
			const s = date.getSeconds();
			if (h >= 0 && h <= 3) {
				claimAchievement('postedAtLateNight');
			}
			if (m === 0 && s === 0) {
				claimAchievement('postedAt0min0sec');
			}

			if (serverDraftId.value != null) {
				misskeyApi('notes/drafts/delete', { draftId: serverDraftId.value });
			}
		});
	}).catch(err => {
		posting.value = false;
		os.alert({
			type: 'error',
			text: err.message + '\n' + (err as any).id,
		});
	});
}

async function postAsScheduled() {
	if (props.mock) return;

	await saveServerDraft({
		isActuallyScheduled: true,
	});
}

function cancel() {
	emit('cancel');
}

function insertMention() {
	os.selectUser({ localOnly: localOnly.value, includeSelf: true }).then(user => {
		if (textareaEl.value == null) return;
		insertTextAtCursor(textareaEl.value, '@' + Misskey.acct.toString(user) + ' ');
	});
}

async function insertEmoji(ev: PointerEvent) {
	textAreaReadOnly.value = true;
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
			textAreaReadOnly.value = false;
			nextTick(() => {
				if (textareaEl.value) {
					textareaEl.value.focus();
					textareaEl.value.setSelectionRange(pos, posEnd);
				}
			});
		},
	);
}

async function insertMfmFunction(ev: PointerEvent) {
	if (textareaEl.value == null) return;
	let pos = textareaEl.value.selectionStart ?? 0;
	let posEnd = textareaEl.value.selectionEnd ?? text.value.length;
	mfmFunctionPicker(
		ev.currentTarget ?? ev.target,
		(tag) => {
			if (pos === posEnd) {
				text.value = `${text.value.substring(0, pos)}$[${tag} ]${text.value.substring(pos)}`;
				pos += tag.length + 3;
				posEnd = pos;
			} else {
				text.value = `${text.value.substring(0, pos)}$[${tag} ${text.value.substring(pos, posEnd)}]${text.value.substring(posEnd)}`;
				pos += tag.length + 3;
				posEnd = pos;
			}
		},
		() => {
			nextTick(() => {
				if (textareaEl.value) {
					textareaEl.value.focus();
					textareaEl.value.setSelectionRange(pos, posEnd);
				}
			});
		},
	);
}

function showActions(ev: PointerEvent) {
	os.popupMenu(postFormActions.map(action => ({
		text: action.title,
		action: () => {
			action.handler({
				text: text.value,
				cw: cw.value,
			}, (key, value) => {
				if (typeof key !== 'string' || typeof value !== 'string') return;
				if (key === 'text') { text.value = value; }
				if (key === 'cw') { useCw.value = value !== null; cw.value = value; }
			});
		},
	})), ev.currentTarget ?? ev.target);
}

const postAccount = ref<Misskey.entities.UserDetailed | null>(null);

async function openAccountMenu(ev: PointerEvent) {
	if (props.mock) return;

	function showDraftsDialog(scheduled: boolean) {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@features/notes/frontend/components/MkNoteDraftsDialog.vue')), {
			scheduled,
		}, {
			restore: async (draft: Misskey.entities.NoteDraft) => {
				text.value = draft.text ?? '';
				useCw.value = draft.cw != null;
				cw.value = draft.cw ?? null;
				visibility.value = draft.visibility;
				localOnly.value = draft.localOnly ?? false;
				files.value = draft.files ?? [];
				hashtags.value = draft.hashtag ?? '';
				if (draft.hashtag) withHashtags.value = true;
				if (draft.poll) {
					// 投票を一時的に空にしないと反映されないため
					poll.value = null;
					nextTick(() => {
						poll.value = {
							choices: draft.poll!.choices,
							multiple: draft.poll!.multiple,
							expiresAt: draft.poll!.expiresAt ? (new Date(draft.poll!.expiresAt)).getTime() : null,
							expiredAfter: null,
						};
					});
				}
				if (draft.visibleUserIds) {
					misskeyApi('users/show', { userIds: draft.visibleUserIds }).then(users => {
						users.forEach(u => pushVisibleUser(u));
					});
				}
				quoteId.value = draft.renoteId ?? null;
				renoteTargetNote.value = draft.renote;
				replyTargetNote.value = draft.reply;
				reactionAcceptance.value = draft.reactionAcceptance;
				scheduledAt.value = draft.scheduledAt ?? null;
				if (draft.channel) targetChannel.value = draft.channel as unknown as Misskey.entities.Channel;

				visibleUsers.value = [];
				draft.visibleUserIds?.forEach(uid => {
					if (!visibleUsers.value.some(u => u.id === uid)) {
						misskeyApi('users/show', { userId: uid }).then(user => {
							pushVisibleUser(user);
						});
					}
				});

				serverDraftId.value = draft.id;
			},
			cancel: () => {

			},
			closed: () => {
				dispose();
			},
		});
	}

	const items = await getAccountMenu({
		withExtraOperation: false,
		includeCurrentAccount: true,
		active: postAccount.value != null ? postAccount.value.id : $i.id,
		onChoose: (account) => {
			if (account.id === $i.id) {
				postAccount.value = null;
			} else {
				postAccount.value = account;
			}
		},
	});

	os.popupMenu([{
		type: 'button',
		text: $locale.value.sfc.draftsListDrafts,
		icon: 'ti ti-cloud-download',
		action: () => {
			showDraftsDialog(false);
		},
	}, {
		type: 'button',
		text: $locale.value.sfc.draftsListScheduledNotes,
		icon: 'ti ti-clock-down',
		action: () => {
			showDraftsDialog(true);
		},
	}, { type: 'divider' }, ...items], (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function showPerUploadItemMenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function showPerUploadItemMenuViaContextmenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.contextMenu(menu, ev);
}

async function schedule() {
	const { canceled, result } = await os.inputDatetime({
		title: $locale.value.sfc.schedulePost,
	});
	if (canceled) return;
	if (result.getTime() <= Date.now()) return;

	scheduledAt.value = result.getTime();
}

function cancelSchedule() {
	scheduledAt.value = null;
}

function showTour() {
	if (textareaEl.value == null ||
		footerEl.value == null ||
		accountMenuEl.value == null ||
		visibilityButton.value == null ||
		otherSettingsButton.value == null ||
		submitButtonEl.value == null) {
		return;
	}

	startTour([{
		element: textareaEl.value,
		title: $locale.value.sfc.postFormHowToUseContent_title,
		description: $locale.value.sfc.postFormHowToUseContent_description,
	}, {
		element: footerEl.value,
		title: $locale.value.sfc.postFormHowToUseToolbar_title,
		description: $locale.value.sfc.postFormHowToUseToolbar_description,
	}, {
		element: accountMenuEl.value,
		title: $locale.value.sfc.postFormHowToUseAccount_title,
		description: $locale.value.sfc.postFormHowToUseAccount_description,
	}, {
		element: visibilityButton.value,
		title: $locale.value.sfc.postFormHowToUseVisibility_title,
		description: $locale.value.sfc.postFormHowToUseVisibility_description,
	}, {
		element: otherSettingsButton.value,
		title: $locale.value.sfc.postFormHowToUseMenu_title,
		description: $locale.value.sfc.postFormHowToUseMenu_description,
	}, {
		element: submitButtonEl.value,
		title: $locale.value.sfc.postFormHowToUseSubmit_title,
		description: $locale.value.sfc.postFormHowToUseSubmit_description,
	}]).then(() => {
		closeTip('postForm');
	});
}

onMounted(() => {
	if (props.autofocus) {
		focus();

		nextTick(() => {
			focus();
		});
	}

	if (textareaEl.value) textAutocomplete = new Autocomplete(textareaEl.value, text);
	if (cwInputEl.value) cwAutocomplete = new Autocomplete(cwInputEl.value, cw);
	if (hashtagsInputEl.value) hashtagAutocomplete = new Autocomplete(hashtagsInputEl.value, hashtags);

	nextTick(() => {
		// 書きかけの投稿を復元
		if (!props.instant && !props.mention && !props.specified && !props.mock) {
			const draft = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}')[draftKey.value] as StoredDrafts[string] | undefined;
			if (draft != null) {
				text.value = draft.data.text;
				useCw.value = draft.data.useCw;
				cw.value = draft.data.cw;
				visibility.value = draft.data.visibility;
				localOnly.value = draft.data.localOnly;
				files.value = (draft.data.files || []).filter(draftFile => draftFile);
				if (draft.data.poll) {
					poll.value = draft.data.poll;
				}
				if (draft.data.visibleUserIds) {
					misskeyApi('users/show', { userIds: draft.data.visibleUserIds }).then(users => {
						users.forEach(u => pushVisibleUser(u));
					});
				}
				quoteId.value = draft.data.quoteId;
				reactionAcceptance.value = draft.data.reactionAcceptance;
				scheduledAt.value = draft.data.scheduledAt ?? null;
			}
		}

		// 削除して編集
		if (props.initialNote) {
			const init = props.initialNote;
			text.value = init.text ? init.text : '';
			useCw.value = init.cw != null;
			cw.value = init.cw ?? null;
			visibility.value = init.visibility;
			localOnly.value = init.localOnly ?? false;
			files.value = init.files ?? [];
			if (init.poll) {
				poll.value = {
					choices: init.poll.choices.map(x => x.text),
					multiple: init.poll.multiple,
					expiresAt: init.poll.expiresAt ? (new Date(init.poll.expiresAt)).getTime() : null,
					expiredAfter: null,
				};
			}
			if (init.visibleUserIds) {
				misskeyApi('users/show', { userIds: init.visibleUserIds }).then(users => {
					users.forEach(u => pushVisibleUser(u));
				});
			}
			quoteId.value = renoteTargetNote.value ? renoteTargetNote.value.id : null;
			reactionAcceptance.value = init.reactionAcceptance;
		}

		nextTick(() => watchForDraft());
	});
});

onBeforeUnmount(() => {
	uploader.abortAll();
	if (textAutocomplete) {
		textAutocomplete.detach();
	}
	if (cwAutocomplete) {
		cwAutocomplete.detach();
	}
	if (hashtagAutocomplete) {
		hashtagAutocomplete.detach();
	}
});

async function canClose() {
	if (!uploader.allItemsUploaded.value) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: $locale.value.sfc.postFormQuitInspiteOfThereAreUnuploadedFilesConfirm,
			okText: $locale.value.sfc.yes,
			cancelText: $locale.value.sfc.no,
		});
		if (canceled) return false;
	}

	return true;
}

defineExpose({
	clear,
	abortUploader: () => uploader.abortAll(),
	canClose,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	container-type: inline-size;
}

//#region header
.header {
	z-index: 1000;
	min-height: 50px;
	display: flex;
	flex-wrap: nowrap;
	gap: 4px;
}

.headerLeft {
	display: flex;
	flex: 1;
	flex-wrap: nowrap;
	align-items: center;
	gap: 6px;
	padding-left: 12px;
}

.cancel {
	padding: 8px;
}

.avatar {
	display: block;
	width: 28px;
	height: 28px;
	margin: auto;
	object-fit: cover;
}

.headerRight {
	display: flex;
	min-height: 48px;
	font-size: 0.9em;
	flex-wrap: nowrap;
	align-items: center;
	margin-left: auto;
	gap: 4px;
	overflow: clip;
	padding-left: 4px;
}

.submit {
	margin: 12px 12px 12px 6px;
	vertical-align: bottom;

	&:focus-visible {
		outline: none;

		> .submitInner {
			outline: 2px solid var(--MI_THEME-fgOnAccent);
			outline-offset: -4px;
		}
	}

	&:disabled {
		opacity: 0.7;
	}

	&.posting {
		cursor: wait;
	}

	&:not(:disabled):hover {
		> .submitInner {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
		}
	}

	&:not(:disabled):active {
		> .submitInner {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
		}
	}
}

.colorBar {
	position: absolute;
	top: 0px;
	left: 12px;
	width: 5px;
	height: 100% ;
	border-radius: 999px;
	pointer-events: none;
}

.submitInner {
	padding: 0 12px;
	line-height: 34px;
	font-weight: bold;
	border-radius: 6px;
	min-width: 90px;
	box-sizing: border-box;
	color: var(--MI_THEME-fgOnAccent);
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
}

.headerRightItem {
	margin: 0;
	padding: 8px;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}

	&:disabled {
		background: none;
	}

	&.danger {
		color: #ff2a2a;
	}
}

.headerRightButtonText {
	padding-left: 6px;
}

.visibility {
	overflow: clip;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 210px;

	&:enabled {
		> .headerRightButtonText {
			opacity: 0.8;
		}
	}
}
//#endregion

.preview {
	padding: 16px 20px 0 20px;
	min-height: 75px;
	max-height: 150px;
	overflow: auto;
	background-size: auto auto;
}

html[data-color-scheme=dark] .preview {
	background-image: repeating-linear-gradient(135deg, transparent, transparent 5px, #0004 5px, #0004 10px);
}

html[data-color-scheme=light] .preview {
	background-image: repeating-linear-gradient(135deg, transparent, transparent 5px, #00000005 5px, #00000005 10px);
}

.targetNote {
	padding: 0 20px 16px 20px;
}

.withQuote {
	margin: 0 0 8px 0;
	color: var(--MI_THEME-accent);
}

.toSpecified {
	padding: 6px 24px;
	margin-bottom: 8px;
	overflow: auto;
	white-space: nowrap;
}

.visibleUsers {
	display: inline;
	top: -1px;
	font-size: 14px;
}

.visibleUser {
	margin-right: 14px;
	padding: 8px 0 8px 8px;
	border-radius: 8px;
	background: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
}

.hasNotSpecifiedMentions {
	margin: 0 20px 16px 20px;
}

.scheduledAt {
	margin: 0 20px 16px 20px;
}

.showHowToUse {
	margin: 0 20px 16px 20px;
}

.cw,
.hashtags,
.text {
	display: block;
	box-sizing: border-box;
	padding: 0 24px;
	margin: 0;
	width: 100%;
	font-size: 110%;
	border: none;
	border-radius: 0;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-family: inherit;

	&:focus {
		outline: none;
	}

	&:disabled {
		opacity: 0.5;
	}
}

.cwOuter {
	width: 100%;
	position: relative;
}

.cw {
	z-index: 1;
	padding-bottom: 8px;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.cwTextCount {
	position: absolute;
	top: 0;
	right: 2px;
	padding: 2px 6px;
	font-size: .9em;
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	max-width: 100%;
	min-width: 1.6em;
	text-align: center;

	&.cwTextOver {
		color: #ff2a2a;
	}
}

.hashtags {
	z-index: 1;
	padding-top: 8px;
	padding-bottom: 8px;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.textOuter {
	width: 100%;
	position: relative;

	&.withCw {
		padding-top: 8px;
	}
}

.text {
	max-width: 100%;
	min-width: 100%;
	width: 100%;
	min-height: 90px;
	max-height: 500px;
	field-sizing: content;
}

.textCount {
	position: absolute;
	top: 0;
	right: 2px;
	padding: 4px 6px;
	font-size: .9em;
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	min-width: 1.6em;
	text-align: center;

	&.textOver {
		color: #ff2a2a;
	}
}

.footer {
	display: flex;
	padding: 0 16px 16px 16px;
	font-size: 1em;
}

.footerLeft {
	flex: 1;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
}

.footerRight {
	flex: 0;
	margin-left: auto;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
	direction: rtl;
}

.footerButton {
	display: inline-block;
	padding: 0;
	margin: 0;
	font-size: 1em;
	width: auto;
	height: 100%;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}

	&.footerButtonActive {
		color: var(--MI_THEME-accent);
	}
}

.previewButtonActive {
	color: var(--MI_THEME-accent);
}

@container (max-width: 500px) {
	.headerRight {
		font-size: .9em;
	}

	.headerRightButtonText {
		display: none;
	}

	.visibility {
		overflow: initial;
	}

	.submit {
		margin: 8px 8px 8px 4px;
	}

	.toSpecified {
		padding: 6px 16px;
	}

	.preview {
		padding: 16px 14px 0 14px;
	}
	.cw,
	.hashtags,
	.text {
		padding: 0 16px;
	}

	.text {
		min-height: 80px;
	}

	.footer {
		padding: 0 8px 8px 8px;
	}
}

@container (max-width: 350px) {
	.footer {
		font-size: 0.9em;
	}

	.footerLeft {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.footerRight {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.headerRight {
		gap: 0;
	}

}
</style>

<locale lang="json" locale="ar-SA">
{
	"account": "الحسابات",
	"visibility": "الظهور",
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
	"visibilityDisableFederation": "Defederate",
	"other": "منوعات",
	"quoteAttached": "اِقتُبسَ",
	"recipient": "المرسَل إليه·ها",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": " إلغاء",
	"notSpecifiedMentionWarning": "في الملاحظة ذكر لمستخدمين لن يستلموها.",
	"add": "إضافة",
	"annotation": "التعليقات",
	"hashtags": "الوسوم",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "أرفق ملفات",
	"upload": "ارفع",
	"fromDrive": "من المخزن",
	"poll": "استطلاع رأي",
	"useCw": "إخفاء المحتوى",
	"mention": "أشر الى",
	"addMfmFunction": "Add MFM",
	"plugins": "الإضافات",
	"emoji": "إيموجي",
	"postFormQuotePlaceholder": "اقتبس هذه الملاحظة…",
	"postFormReplyPlaceholder": "رد على هذه الملاحظة…",
	"postFormChannelPlaceholder": "انشر في قناة...",
	"postFormPlaceholdersA": "ما الذي تنوي فعله؟",
	"postFormPlaceholdersB": "ماذا يحدث حولك ؟",
	"postFormPlaceholdersC": "ما الذي تفكر فيه؟",
	"postFormPlaceholdersD": "ما الذي تريد قوله؟",
	"postFormPlaceholdersE": "أكتب...",
	"postFormPlaceholdersF": "بانتظارك لتكتب...",
	"schedule": "Schedule",
	"quote": "اقتبس",
	"reply": "رد",
	"note": "ملاحظة",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "عطّل",
	"neverShow": "لا تظهره مجددًا",
	"reactionAcceptance": "قبول التفاعلات",
	"all": "الكل",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "معاينة",
	"reset": "Reset",
	"resetAreYouSure": "هل تريد إعادة التعيين؟",
	"quoteQuestion": "أتريد تضمينها كاقتباس",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "هذا قد يزعج الآخرين.",
	"thisPostMayBeAnnoyingHome": "أنشر في الخط الزمني الرئيس",
	"thisPostMayBeAnnoyingCancel": "ألغِ",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "الظهور",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "القائمة",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "نعم",
	"no": "لا"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"account": "Compte",
	"visibility": "Visibilitat",
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
	"visibilityDisableFederation": "Sense federar",
	"other": "Altres",
	"quoteAttached": "Frase adjunta",
	"recipient": "Destinatari",
	"postFormShowHowToUse": "Mostrar les instruccions",
	"scheduleToPostOnX": "Programar una nota per {x}",
	"cancel": "Cancel·lar",
	"notSpecifiedMentionWarning": "Aquesta nota esmenta usuaris que no es troben com a destinataris",
	"add": "Afegir",
	"annotation": "Comentaris",
	"hashtags": "Etiquetes",
	"postFormUploaderTip": "L'arxiu encara no s'ha carregat. Des del menú arxiu pots canviar el nom, retallar imatges, posar marques d'aigua i comprimir o no l'arxiu. Els arxius es carreguen automàticament quan públiques una nota.",
	"attachFile": "Afegeix un arxiu",
	"upload": "Puja",
	"fromDrive": "Des del Disc",
	"poll": "Enquesta",
	"useCw": "Amaga el contingut",
	"mention": "Menció",
	"addMfmFunction": "Afegeix funcions MFM",
	"plugins": "Extensions",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Citar...",
	"postFormReplyPlaceholder": "Contestar...",
	"postFormChannelPlaceholder": "Publicar a un canal...",
	"postFormPlaceholdersA": "Que vols dir?...",
	"postFormPlaceholdersB": "Alguna cosa interessant al teu voltant?...",
	"postFormPlaceholdersC": "Què et passa pel cap?...",
	"postFormPlaceholdersD": "Què vols dir?...",
	"postFormPlaceholdersE": "Escriu alguna cosa...",
	"postFormPlaceholdersF": "Esperant que escriguis qualsevol cosa...",
	"schedule": "Programa",
	"quote": "Cita",
	"reply": "Respostes",
	"note": "Nota",
	"disableFederationConfirm": "Vols treure la federació?",
	"disableFederationConfirmWarn": "Fins i tot traient la federació, les publicacions continuaren sent públiques, a no ser que es digui el contrari. Normalment no has de tocar això.",
	"disableFederationOk": "Desactivar",
	"neverShow": "No mostrar més ",
	"reactionAcceptance": "Acceptació de reaccions ",
	"all": "Tot",
	"likeOnlyForRemote": "Tot (només m'agraden d'instàncies remotes)",
	"nonSensitiveOnly": "Només sense contingut sensible",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Només contingut no sensible (Només m'agraden d'instàncies remotes)",
	"likeOnly": "Només m'agraden ",
	"draftsSaveToDraft": "Desar com a esborrany",
	"draftsCannotCreateDraft": "Amb aquest contingut no es poden crear esborranys.",
	"schedulePost": "Programar una nota",
	"preview": "Vista prèvia",
	"reset": "Reiniciar",
	"resetAreYouSure": "Segur que vols restablir-ho?",
	"quoteQuestion": "Vols annexar-la com a cita?",
	"attachAsFileQuestion": "El text copiat és massa llarg. Vols adjuntar-lo com un fitxer de text?",
	"thisPostMayBeAnnoying": "Aquesta nota pot ser molesta per algú.",
	"thisPostMayBeAnnoyingHome": "Publicar a la línia de temps d'Inici",
	"thisPostMayBeAnnoyingCancel": "Cancel·lar ",
	"thisPostMayBeAnnoyingIgnore": "Publicar de totes maneres",
	"draftsListDrafts": "Llistat d'esborranys",
	"draftsListScheduledNotes": "Llista de notes programades",
	"postFormHowToUseContent_title": "Cos principal",
	"postFormHowToUseContent_description": "Introdueix el contingut que vols publicar.",
	"postFormHowToUseToolbar_title": "Barra d'eines ",
	"postFormHowToUseToolbar_description": "Pots adjuntar arxius o enquestes, afegir anotacions o etiquetes i inserir emojis o mencions.",
	"postFormHowToUseAccount_title": "Menú del compte",
	"postFormHowToUseAccount_description": "Pots anar canviant de comptes per publicar o veure una llista d'esborranys i les publicacions programades del teu compte.",
	"postFormHowToUseVisibility_title": "Visibilitat",
	"postFormHowToUseVisibility_description": "Pots configurar la visibilitat de les teves notes.",
	"postFormHowToUseMenu_title": "Menú",
	"postFormHowToUseMenu_description": "Pots fer altres accions com desar esborranys, programar publicacions i configurar reaccions.",
	"postFormHowToUseSubmit_title": "Botó per publicar",
	"postFormHowToUseSubmit_description": "Publica les teves notes. També pots fer servir Ctrl + Enter / Cmd + Enter",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Hi ha arxius que no s'han carregat, vols descartar-los i tancar el formulari?",
	"yes": "Sí ",
	"no": "No"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"account": "Účty",
	"visibility": "Viditelnost",
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
	"visibilityDisableFederation": "Defederace",
	"other": "Ostatní",
	"quoteAttached": "Citace",
	"recipient": "Pro",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Zrušit",
	"notSpecifiedMentionWarning": "Tahle poznámka zmiňuje uživatele, které nejsou mezi adresáty",
	"add": "Přidat",
	"annotation": "Komentáře",
	"hashtags": "Hashtagy",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Přiložit soubor",
	"upload": "Nahrát soubory",
	"fromDrive": "Z disku",
	"poll": "Anketa",
	"useCw": "Schovat obsah",
	"mention": "Zmínění",
	"addMfmFunction": "Add MFM",
	"plugins": "Pluginy",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Citovat tuto poznámku...",
	"postFormReplyPlaceholder": "Odpovědět na tuto poznámku...",
	"postFormChannelPlaceholder": "Zveřejnit příspěvek do kanálu...",
	"postFormPlaceholdersA": "Co máte v plánu?",
	"postFormPlaceholdersB": "Co se děje kolem vás?",
	"postFormPlaceholdersC": "Co máte na mysli?",
	"postFormPlaceholdersD": "Co chcete říct?",
	"postFormPlaceholdersE": "Začít psát...",
	"postFormPlaceholdersF": "Čekám, až něco napíšete...",
	"schedule": "Schedule",
	"quote": "Citovat",
	"reply": "Odpovědět",
	"note": "Poznámka",
	"disableFederationConfirm": "Chcete opravdu vypnout federace?",
	"disableFederationConfirmWarn": "I v případě defederace budou příspěvky nadále veřejné, pokud nebude nastaveno jinak. Obvykle to není nutné.",
	"disableFederationOk": "Vypnout",
	"neverShow": "Znovu nezobrazovat",
	"reactionAcceptance": "Přijímání reakcí",
	"all": "Vše",
	"likeOnlyForRemote": "Všechny (Pouze \"oblíbené\" pro vzdálenou instanci)",
	"nonSensitiveOnly": "Pouze bez citlivých medií",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Pouze bez citlivých medií (Pouze vzdálený \"oblíbený\")",
	"likeOnly": "Jenom \"oblíbené\"",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Náhled",
	"reset": "Obnovit",
	"resetAreYouSure": "Opravdu resetovat?",
	"quoteQuestion": "Přiložit jako citaci?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "Tato poznámka může ostatní obtěžovat.",
	"thisPostMayBeAnnoyingHome": "Zveřejnit na domovskou časovou osu",
	"thisPostMayBeAnnoyingCancel": "Zrušit",
	"thisPostMayBeAnnoyingIgnore": "I přesto zveřejnit",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Viditelnost",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Ano",
	"no": "Ne"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"account": "Account",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Other",
	"quoteAttached": "Quote",
	"recipient": "Recipient",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Cancel",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Add",
	"annotation": "Comments",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Attach files",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"poll": "Poll",
	"useCw": "Hide content",
	"mention": "Mention",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "Reply",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Yes",
	"no": "No"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"account": "Benutzerkonto",
	"visibility": "Sichtbarkeit",
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
	"visibilityDisableFederation": "Deföderieren",
	"other": "Anderes",
	"quoteAttached": "Zitat",
	"recipient": "Empfänger",
	"postFormShowHowToUse": "Formularbeschreibung anzeigen",
	"scheduleToPostOnX": "Der Beitrag wird für {x} geplant.x",
	"cancel": "Abbrechen",
	"notSpecifiedMentionWarning": "Diese Notiz enthält Erwähnungen von Nutzern, die nicht als Empfänger ausgewählt sind",
	"add": "Hinzufügen",
	"annotation": "Anmerkung",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "Die Datei wurde noch nicht hochgeladen. Über das Dateimenü kannst du sie umbenennen, das Bild zuschneiden, ein Wasserzeichen hinzufügen, komprimieren usw. Die Datei wird automatisch hochgeladen, wenn du eine Notiz veröffentlichst.",
	"attachFile": "Datei anhängen",
	"upload": "Hochladen",
	"fromDrive": "Aus Drive",
	"poll": "Umfrage",
	"useCw": "Inhaltswarnung verwenden",
	"mention": "Erwähnung",
	"addMfmFunction": "MFM hinzufügen",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Diese Notiz zitieren …",
	"postFormReplyPlaceholder": "Dieser Notiz antworten …",
	"postFormChannelPlaceholder": "In einen Kanal senden",
	"postFormPlaceholdersA": "Was machst du momentan?",
	"postFormPlaceholdersB": "Was ist um dich herum los?",
	"postFormPlaceholdersC": "Was geht dir durch den Kopf?",
	"postFormPlaceholdersD": "Was möchtest du sagen?",
	"postFormPlaceholdersE": "Fang an zu schreiben …",
	"postFormPlaceholdersF": "Ich warte darauf, dass du schreibst …",
	"schedule": "Planen",
	"quote": "Zitieren",
	"reply": "Antworten",
	"note": "Notiz",
	"disableFederationConfirm": "Föderation wirklich deaktivieren?",
	"disableFederationConfirmWarn": "Auch mit deaktivierter Föderation bleiben Notizen, sofern nicht umgestellt, öffentlich. In den meisten Fällen wird dies nicht benötigt.",
	"disableFederationOk": "Deaktivieren",
	"neverShow": "Nicht wieder anzeigen",
	"reactionAcceptance": "Reaktionsannahme",
	"all": "Alle",
	"likeOnlyForRemote": "Alle (Nur \"Gefällt mir\" für fremde Instanzen)",
	"nonSensitiveOnly": "Keine Sensitiven",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Keine Sensitiven (Nur \"Gefällt mir\" von fremden Instanzen)",
	"likeOnly": "Nur \"Gefällt mir\"",
	"draftsSaveToDraft": "Als Entwurf speichern",
	"draftsCannotCreateDraft": "Mit diesem Inhalt kann kein Entwurf erstellt werden.",
	"schedulePost": "Beitrag planen",
	"preview": "Vorschau",
	"reset": "Zurücksetzen",
	"resetAreYouSure": "Wirklich zurücksetzen?",
	"quoteQuestion": "Als Zitat anhängen?",
	"attachAsFileQuestion": "Der Text in der Zwischenablage ist lang. Möchtest du ihn als Textdatei anhängen?",
	"thisPostMayBeAnnoying": "Dieser Beitrag stört eventuell andere Benutzer.",
	"thisPostMayBeAnnoyingHome": "Zur Startseite schicken",
	"thisPostMayBeAnnoyingCancel": "Abbrechen",
	"thisPostMayBeAnnoyingIgnore": "Trotzdem schicken",
	"draftsListDrafts": "Liste der Entwürfe",
	"draftsListScheduledNotes": "Liste der geplanten Beiträge",
	"postFormHowToUseContent_title": "Dieser Text",
	"postFormHowToUseContent_description": "Bitte geben Sie den Inhalt ein, den Sie veröffentlichen möchten.",
	"postFormHowToUseToolbar_title": "Symbolleiste",
	"postFormHowToUseToolbar_description": "Sie können Dateien oder Umfragen anhängen, Anmerkungen und Hashtags festlegen sowie Emojis und Erwähnungen einfügen.",
	"postFormHowToUseAccount_title": "Profilmenü",
	"postFormHowToUseAccount_description": "Du kannst das Konto wechseln, von dem du postest, und dir eine Liste der im Konto gespeicherten Entwürfe und geplanten Beiträge anzeigen lassen.",
	"postFormHowToUseVisibility_title": "Sichtbarkeit",
	"postFormHowToUseVisibility_description": "Sie können den Umfang festlegen, in dem die Notizen veröffentlicht werden.",
	"postFormHowToUseMenu_title": "Menü",
	"postFormHowToUseMenu_description": "Sie können außerdem weitere Aktionen durchführen, z.\u202fB. als Entwurf speichern, das Posten planen oder Reaktionen einstellen.",
	"postFormHowToUseSubmit_title": "Senden-Button",
	"postFormHowToUseSubmit_description": "Du kannst die Notiz posten. Du kannst sie auch mit Strg + Enter / Cmd + Enter posten.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Es gibt Dateien, die nicht hochgeladen wurden. Möchtest du diese verwerfen und das Formular schließen?",
	"yes": "Ja",
	"no": "Nein"
}
</locale>

<locale lang="json" locale="en-US">
{
	"account": "Account",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Other",
	"quoteAttached": "Quote",
	"recipient": "Recipient",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Cancel",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Add",
	"annotation": "Comments",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Attach files",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"poll": "Poll",
	"useCw": "Hide content",
	"mention": "Mention",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "Reply",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Yes",
	"no": "No"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"account": "Cuentas",
	"visibility": "Visibilidad",
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
	"visibilityDisableFederation": "No federado",
	"other": "Otro",
	"quoteAttached": "Cita añadida",
	"recipient": "Receptor",
	"postFormShowHowToUse": "Mostrar el tutorial  de este formulario",
	"scheduleToPostOnX": "Programar una nota para {x}",
	"cancel": "Cancelar",
	"notSpecifiedMentionWarning": "Algunas menciones no están incluidas en el destino",
	"add": "Agregar",
	"annotation": "Anotación",
	"hashtags": "Hashtag",
	"postFormUploaderTip": "El archivo aún no se ha cargado. Desde el menú de archivos, puedes cambiar el nombre, recortar la imagen, añadir una marca de agua y configurar la compresión, entre otras opciones. Los archivos se suben automáticamente al publicar una nota.",
	"attachFile": "Añadir archivo",
	"upload": "Subir",
	"fromDrive": "Desde el drive",
	"poll": "Encuesta",
	"useCw": "Esconder contenidos",
	"mention": "Menciones",
	"addMfmFunction": "Añadir función MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Citar esta nota",
	"postFormReplyPlaceholder": "Responder a esta nota",
	"postFormChannelPlaceholder": "Publicar en el canal",
	"postFormPlaceholdersA": "¿Qué está pasando?",
	"postFormPlaceholdersB": "¿Te pasó algo?",
	"postFormPlaceholdersC": "¿Qué estás pensando?",
	"postFormPlaceholdersD": "¿Algo que quieras decir?",
	"postFormPlaceholdersE": "Escribe aquí",
	"postFormPlaceholdersF": "Esperando a que escribas algo...",
	"schedule": "Programar",
	"quote": "Citar",
	"reply": "Responder",
	"note": "Nota",
	"disableFederationConfirm": "¿Estas seguro que quieres desactivar la federación?",
	"disableFederationConfirmWarn": "Aunque no exista federación los posts no serán marcados como privados. En la mayoría de los casos, no es necesario hacer los posts no federar.",
	"disableFederationOk": "Desactivar.",
	"neverShow": "No mostrar de nuevo",
	"reactionAcceptance": "Aceptación de reacciones",
	"all": "Todo",
	"likeOnlyForRemote": "Sólo reacciones de instancias remotas",
	"nonSensitiveOnly": "Solo no sensible",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Sólo no contenido sensible (sólo me gusta en remoto)",
	"likeOnly": "Sólo 'me gusta'",
	"draftsSaveToDraft": "Guardar como borrador",
	"draftsCannotCreateDraft": "No se pueden crear borradores con este contenido.",
	"schedulePost": "Programar una nota",
	"preview": "Vista previa",
	"reset": "Restablecer",
	"resetAreYouSure": "¿Desea reestablecer?",
	"quoteQuestion": "¿Quiere añadir una cita?",
	"attachAsFileQuestion": "El texto del portapapeles es demasiado grande ¿Desea adjuntarlo como archivo de texto?",
	"thisPostMayBeAnnoying": "Ésta publicación puede resultar molesta.",
	"thisPostMayBeAnnoyingHome": "Publicar en línea de tiempo 'Inicio'",
	"thisPostMayBeAnnoyingCancel": "detener",
	"thisPostMayBeAnnoyingIgnore": "Publicar de todos modos",
	"draftsListDrafts": "Listar los borradores",
	"draftsListScheduledNotes": "Lista de notas programadas",
	"postFormHowToUseContent_title": "Cuerpo",
	"postFormHowToUseContent_description": "Introduce aquí el contenido que deseas publicar.",
	"postFormHowToUseToolbar_title": "Barras de herramientas",
	"postFormHowToUseToolbar_description": "Puedes adjuntar archivos o realizar encuestas, añadir anotaciones o hashtags e insertar emojis o menciones.",
	"postFormHowToUseAccount_title": "Menú de la cuenta",
	"postFormHowToUseAccount_description": "Puedes cambiar entre cuentas para publicar o ver una lista de borradores y publicaciones programadas guardadas en tu cuenta.",
	"postFormHowToUseVisibility_title": "Visibilidad",
	"postFormHowToUseVisibility_description": "Puedes configurar la visibilidad de tus notas.",
	"postFormHowToUseMenu_title": "Menú",
	"postFormHowToUseMenu_description": "Puedes realizar otras acciones, como guardar borradores, programar publicaciones y configurar reacciones.",
	"postFormHowToUseSubmit_title": "Botón de publicar",
	"postFormHowToUseSubmit_description": "Publica tus notas pulsando este botón. También puedes publicar utilizando Ctrl + Intro / Cmd + Intro.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Hay archivos que no se han cargado, ¿deseas descartarlos y cerrar el formulario?",
	"yes": "Si",
	"no": "No"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"account": "Comptes",
	"visibility": "Visibilité",
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
	"visibilityDisableFederation": "Défédérer",
	"other": "Autre",
	"quoteAttached": "Avec citation",
	"recipient": "Destinataire",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Annuler",
	"notSpecifiedMentionWarning": "Vous avez mentionné des utilisateur·rice·s qui ne font pas partie de la liste des destinataires",
	"add": "Ajouter",
	"annotation": "Commentaires",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Joindre un fichier",
	"upload": "Téléverser",
	"fromDrive": "Depuis le Disque",
	"poll": "Sondage",
	"useCw": "Masquer le contenu",
	"mention": "Mentionner",
	"addMfmFunction": "Insérer MFM",
	"plugins": "Extensions",
	"emoji": "Émoji",
	"postFormQuotePlaceholder": "Citez cette note ...",
	"postFormReplyPlaceholder": "Répondre à cette note ...",
	"postFormChannelPlaceholder": "Publier au canal…",
	"postFormPlaceholdersA": "Quoi de neuf ?",
	"postFormPlaceholdersB": "Il s'est passé quelque chose ?",
	"postFormPlaceholdersC": "Qu’avez-vous en tête ?",
	"postFormPlaceholdersD": "Désirez-vous publier quelques mots ?",
	"postFormPlaceholdersE": "Écrivez ici",
	"postFormPlaceholdersF": "En attente de vos écrits ...",
	"schedule": "Schedule",
	"quote": "Citer",
	"reply": "Répondre",
	"note": "Note",
	"disableFederationConfirm": "Voulez-vous vraiment désactiver la fédération ?",
	"disableFederationConfirmWarn": "Même sans fédération, la note ne sera pas privée. Dans la plupart des cas, ce n'est pas nécessaire de désactiver la fédération.",
	"disableFederationOk": "Désactiver",
	"neverShow": "Ne plus afficher",
	"reactionAcceptance": "Acceptation des réactions",
	"all": "Tous",
	"likeOnlyForRemote": "Toutes (mentions j'aime seulement pour les instances distantes)",
	"nonSensitiveOnly": "Non sensibles seulement",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non sensibles seulement (mentions j'aime seulement pour les instances distantes)",
	"likeOnly": "Les favoris uniquement",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Aperçu",
	"reset": "Réinitialiser",
	"resetAreYouSure": "Voulez-vous réinitialiser ?",
	"quoteQuestion": "Souhaitez-vous ajouter une citation ?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "Cette note peut gêner d'autres personnes.",
	"thisPostMayBeAnnoyingHome": "Publier vers le fil principal",
	"thisPostMayBeAnnoyingCancel": "Annuler",
	"thisPostMayBeAnnoyingIgnore": "Publier quand-même",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibilité",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Oui",
	"no": "Non"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"account": "Akun",
	"visibility": "Visibilitas",
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
	"visibilityDisableFederation": "Matikan federasi",
	"other": "Lainnya",
	"quoteAttached": "Dikutip",
	"recipient": "Penerima",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Batalkan",
	"notSpecifiedMentionWarning": "Catatan ini mengandung sebutan dari pengguna yang tidak dimuat sebagai penerima",
	"add": "Tambahkan",
	"annotation": "Keterangan konten",
	"hashtags": "Tagar",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Lampirkan berkas",
	"upload": "Unggah",
	"fromDrive": "Dari Drive",
	"poll": "Angket",
	"useCw": "Sembunyikan konten",
	"mention": "Sebut",
	"addMfmFunction": "Tambahkan dekorasi",
	"plugins": "Plugin",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Kutip catatan ini...",
	"postFormReplyPlaceholder": "Balas ke catatan ini...",
	"postFormChannelPlaceholder": "Posting ke kanal",
	"postFormPlaceholdersA": "Sedang apa kamu saat ini?",
	"postFormPlaceholdersB": "Apa yang terjadi di sekitarmu?",
	"postFormPlaceholdersC": "Apa yang sedang kamu pikirkan?",
	"postFormPlaceholdersD": "Yang ingin kamu sampaikan?",
	"postFormPlaceholdersE": "Tuliskan yang kamu ingin sampaikan...",
	"postFormPlaceholdersF": "Menunggu kamu untuk menulis....",
	"schedule": "Schedule",
	"quote": "Kutip",
	"reply": "Balas",
	"note": "Catatan",
	"disableFederationConfirm": "Matikan federasi?",
	"disableFederationConfirmWarn": "Mematikan federasi tidak membuat kiriman menjadi privat. Umumnya, mematikan federasi tidak diperlukan.",
	"disableFederationOk": "Matikan federasi",
	"neverShow": "Jangan tampilkan lagi",
	"reactionAcceptance": "Penerimaan reaksi",
	"all": "Semua",
	"likeOnlyForRemote": "Semua (Hanya suka dari instansi luar)",
	"nonSensitiveOnly": "Hanya non-sensitif",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Hanya non-sensitif (Hanya suka dari instansi luar)",
	"likeOnly": "Hanya suka",
	"draftsSaveToDraft": "Simpan ke Draf",
	"draftsCannotCreateDraft": "Anda tidak dapat membuat draf dengan konten ini.",
	"schedulePost": "Schedule note",
	"preview": "Pratinjau",
	"reset": "Reset",
	"resetAreYouSure": "Yakin mau atur ulang?",
	"quoteQuestion": "Apakah kamu ingin menambahkan kutipan?",
	"attachAsFileQuestion": "Teks dalam papan klip terlalu panjang. Apakah kamu ingin melampirkannya sebagai berkas teks?",
	"thisPostMayBeAnnoying": "Catatan ini mungkin dapat mengganggu orang lain.",
	"thisPostMayBeAnnoyingHome": "Catat ke lini masa beranda",
	"thisPostMayBeAnnoyingCancel": "Batalkan",
	"thisPostMayBeAnnoyingIgnore": "Tetap catat",
	"draftsListDrafts": "Daftar Draf",
	"draftsListScheduledNotes": "Daftar note terjadwal",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "Anda dapat berpindah antar akun untuk mengunggah note, melihat daftar draf dan note terjadwal yang tersimpan di akun anda.",
	"postFormHowToUseVisibility_title": "Visibilitas",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "Anda dapat menyimpan konten saat ini ke dalam draf, menjadwalkan note, mengatur reaksi, dan melakukan aksi lainnya.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Iya",
	"no": "Tidak"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"account": "Account",
	"visibility": "Visibilità",
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
	"visibilityDisableFederation": "Gestisci la federazione",
	"other": "Eccetera",
	"quoteAttached": "Citazione allegata",
	"recipient": "Destinatario",
	"postFormShowHowToUse": "Mostra il tutorial",
	"scheduleToPostOnX": "Pianificare la pubblicazione {x}",
	"cancel": "Annulla",
	"notSpecifiedMentionWarning": "Sono stati menzionati profili non inclusi fra i destinatari",
	"add": "Aggiungi",
	"annotation": "Annotazione preventiva",
	"hashtags": "Hashtag",
	"postFormUploaderTip": "Il file non è ancora stato caricato. Nel menu file (tre puntini), puoi ritagliare l'immagine, mettere la filigrana, decidere la presenza o l'assenza di compressione... Il file verrà caricato automaticamente quando pubblichi la Nota.",
	"attachFile": "Allega file",
	"upload": "Carica",
	"fromDrive": "Dal Drive",
	"poll": "Sondaggio",
	"useCw": "Contenuto esplicito",
	"mention": "Menzioni",
	"addMfmFunction": "Aggiungi decorazioni",
	"plugins": "Estensioni",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Cita questa nota...",
	"postFormReplyPlaceholder": "Rispondi a questa nota...",
	"postFormChannelPlaceholder": "Pubblica sul canale...",
	"postFormPlaceholdersA": "Come va?",
	"postFormPlaceholdersB": "Hai qualcosa da raccontare? Inizia pure...",
	"postFormPlaceholdersC": "Stai pensando a qualcosa?",
	"postFormPlaceholdersD": "Vuoi dire qualcosa?",
	"postFormPlaceholdersE": "Puoi scrivere qui...",
	"postFormPlaceholdersF": "Inizia pure a scrivere...",
	"schedule": "Pianificare",
	"quote": "Citazione",
	"reply": "Rispondi",
	"note": "Nota",
	"disableFederationConfirm": "Vuoi davvero disattivare la federazione?",
	"disableFederationConfirmWarn": "Anche se defederate, le Note continueranno ad essere pubbliche, se non diversamente specificato. Di solito, non è necessario far questo.",
	"disableFederationOk": "Disabilita federazione",
	"neverShow": "Non mostrare più",
	"reactionAcceptance": "Reazioni consentite",
	"all": "Tutte",
	"likeOnlyForRemote": "Solo Like remoti",
	"nonSensitiveOnly": "Soltanto non espliciti",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Soltanto non espliciti (reazioni remote)",
	"likeOnly": "Solo i Like",
	"draftsSaveToDraft": "Salva come bozza",
	"draftsCannotCreateDraft": "Impossibile creare una bozza di questo contenuto.",
	"schedulePost": "Pianificare la pubblicazione",
	"preview": "Anteprima",
	"reset": "Ripristina",
	"resetAreYouSure": "Ripristinare?",
	"quoteQuestion": "Vuoi aggiungere una citazione?",
	"attachAsFileQuestion": "Il testo copiato eccede le dimensioni, vuoi allegarlo?",
	"thisPostMayBeAnnoying": "Questa nota potrebbe essere offensiva",
	"thisPostMayBeAnnoyingHome": "Pubblica sulla timeline principale",
	"thisPostMayBeAnnoyingCancel": "Annulla",
	"thisPostMayBeAnnoyingIgnore": "Pubblica lo stesso",
	"draftsListDrafts": "Elenco bozze",
	"draftsListScheduledNotes": "Elenca Note pianificate",
	"postFormHowToUseContent_title": "Testo",
	"postFormHowToUseContent_description": "Inserisci il contenuto che desideri pubblicare.",
	"postFormHowToUseToolbar_title": "Barra degli Strumenti",
	"postFormHowToUseToolbar_description": "Puoi allegare file e sondaggi, aggiungere Note, hashtag, inserire emoji e menzioni.",
	"postFormHowToUseAccount_title": "Menu profilo",
	"postFormHowToUseAccount_description": "Puoi cambiare il profilo col quale vuoi pubblicare, elencare bozze e pianificare le Note.",
	"postFormHowToUseVisibility_title": "Visibilità",
	"postFormHowToUseVisibility_description": "Puoi impostare il grado di visibilità delle Note.",
	"postFormHowToUseMenu_title": "Menù",
	"postFormHowToUseMenu_description": "Puoi svolgere varie azioni, come salvare in bozza, pianificare le annotazioni, regolare le reazioni ricevute e altro.",
	"postFormHowToUseSubmit_title": "Bottone invia",
	"postFormHowToUseSubmit_description": "Pubblica la Nota. Funziona anche con \"Ctrl + Invio\", oppure \"Cmd + Invio\".",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Alcuni file non sono stati caricati. Vuoi annullare l'operazione?",
	"yes": "Sì",
	"no": "No"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"account": "アカウント",
	"visibility": "公開範囲",
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
	"visibilityDisableFederation": "連合なし",
	"other": "その他",
	"quoteAttached": "引用付き",
	"recipient": "宛先",
	"postFormShowHowToUse": "フォームの説明を表示",
	"scheduleToPostOnX": "{x}に投稿を予約します",
	"cancel": "キャンセル",
	"notSpecifiedMentionWarning": "宛先に含まれていないメンションがあります",
	"add": "追加",
	"annotation": "注釈",
	"hashtags": "ハッシュタグ",
	"postFormUploaderTip": "ファイルはまだアップロードされていません。ファイルのメニューから、リネームや画像のクロップ、ウォーターマークの付与、圧縮の有無などを設定できます。ファイルはノート投稿時に自動でアップロードされます。",
	"attachFile": "ファイルを添付",
	"upload": "アップロード",
	"fromDrive": "ドライブから",
	"poll": "アンケート",
	"useCw": "内容を隠す",
	"mention": "メンション",
	"addMfmFunction": "装飾を追加",
	"plugins": "プラグイン",
	"emoji": "絵文字",
	"postFormQuotePlaceholder": "このノートを引用...",
	"postFormReplyPlaceholder": "このノートに返信...",
	"postFormChannelPlaceholder": "チャンネルに投稿...",
	"postFormPlaceholdersA": "いまどうしてる？",
	"postFormPlaceholdersB": "何かありましたか？",
	"postFormPlaceholdersC": "何をお考えですか？",
	"postFormPlaceholdersD": "言いたいことは？",
	"postFormPlaceholdersE": "ここに書いてください",
	"postFormPlaceholdersF": "あなたが書くのを待っています...",
	"schedule": "予約",
	"quote": "引用",
	"reply": "返信",
	"note": "ノート",
	"disableFederationConfirm": "連合なしにしますか？",
	"disableFederationConfirmWarn": "連合なしにしても投稿は非公開になりません。ほとんどの場合、連合なしにする必要はありません。",
	"disableFederationOk": "連合なしにする",
	"neverShow": "今後表示しない",
	"reactionAcceptance": "リアクションの受け入れ",
	"all": "全て",
	"likeOnlyForRemote": "全て (リモートはいいねのみ)",
	"nonSensitiveOnly": "非センシティブのみ",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "非センシティブのみ (リモートはいいねのみ)",
	"likeOnly": "いいねのみ",
	"draftsSaveToDraft": "下書きへ保存",
	"draftsCannotCreateDraft": "この内容では下書きを作成できません。",
	"schedulePost": "投稿を予約",
	"preview": "プレビュー",
	"reset": "リセット",
	"resetAreYouSure": "リセットしますか？",
	"quoteQuestion": "引用として添付しますか？",
	"attachAsFileQuestion": "クリップボードのテキストが長いです。テキストファイルとして添付しますか？",
	"thisPostMayBeAnnoying": "この投稿は迷惑になる可能性があります。",
	"thisPostMayBeAnnoyingHome": "ホームに投稿",
	"thisPostMayBeAnnoyingCancel": "やめる",
	"thisPostMayBeAnnoyingIgnore": "このまま投稿",
	"draftsListDrafts": "下書き一覧",
	"draftsListScheduledNotes": "予約投稿一覧",
	"postFormHowToUseContent_title": "本文",
	"postFormHowToUseContent_description": "投稿する内容を入力します。",
	"postFormHowToUseToolbar_title": "ツールバー",
	"postFormHowToUseToolbar_description": "ファイルやアンケートの添付、注釈やハッシュタグの設定、絵文字やメンションの挿入などが行えます。",
	"postFormHowToUseAccount_title": "アカウントメニュー",
	"postFormHowToUseAccount_description": "投稿するアカウントを切り替えたり、アカウントに保存した下書き・予約投稿を一覧できます。",
	"postFormHowToUseVisibility_title": "公開範囲",
	"postFormHowToUseVisibility_description": "ノートを公開する範囲の設定が行えます。",
	"postFormHowToUseMenu_title": "メニュー",
	"postFormHowToUseMenu_description": "下書きへの保存、投稿の予約、リアクションの設定など、その他のアクションが行えます。",
	"postFormHowToUseSubmit_title": "投稿ボタン",
	"postFormHowToUseSubmit_description": "ノートを投稿します。Ctrl + Enter / Cmd + Enter でも投稿できます。",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "アップロードされていないファイルがありますが、破棄してフォームを閉じますか？",
	"yes": "はい",
	"no": "いいえ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"account": "アカウント",
	"visibility": "公開範囲",
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
	"visibilityDisableFederation": "連合なし",
	"other": "その他",
	"quoteAttached": "引用付いとるで",
	"recipient": "宛先",
	"postFormShowHowToUse": "フォームの説明を表示",
	"scheduleToPostOnX": "{x}に投稿を予約します",
	"cancel": "やめる",
	"notSpecifiedMentionWarning": "宛先にないメンションがあるで",
	"add": "増やす",
	"annotation": "注釈",
	"hashtags": "ハッシュタグ",
	"postFormUploaderTip": "ファイルはまだアップロードされてへんで。ファイルのメニューから、リネームとか画像のクロップ、ウォーターマークをのっける、圧縮するかどうかなんかを設定できるで。ファイルはノートを投稿するときに自動でアップロードされるで。",
	"attachFile": "ファイルのっける",
	"upload": "アップロード",
	"fromDrive": "ドライブから",
	"poll": "アンケート",
	"useCw": "内容を隠す",
	"mention": "メンション",
	"addMfmFunction": "装飾つける",
	"plugins": "プラグイン",
	"emoji": "絵文字",
	"postFormQuotePlaceholder": "このノートを引用...",
	"postFormReplyPlaceholder": "このノートに返信...",
	"postFormChannelPlaceholder": "チャンネルに投稿...",
	"postFormPlaceholdersA": "いまどないしとるん？",
	"postFormPlaceholdersB": "何かあったん？",
	"postFormPlaceholdersC": "何か考えとるん？",
	"postFormPlaceholdersD": "何か言いたいことあるん？",
	"postFormPlaceholdersE": "ここに書いてーなー",
	"postFormPlaceholdersF": "あんたが書くの待っとるで",
	"schedule": "予約",
	"quote": "引用",
	"reply": "返事",
	"note": "ノート",
	"disableFederationConfirm": "連合なしにしとくか？",
	"disableFederationConfirmWarn": "連合なしにしても投稿が非公開になるわけちゃうで。大体の場合は連合なしにする必要はないで。",
	"disableFederationOk": "連合なしにしとく",
	"neverShow": "今後表示しない",
	"reactionAcceptance": "ツッコミの受け入れ",
	"all": "みんな",
	"likeOnlyForRemote": "リモートからはいいねだけな",
	"nonSensitiveOnly": "いつ見ても大丈夫なやつだけ",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "いつ見ても大丈夫なやつだけ (リモートはいいねだけ)",
	"likeOnly": "いいねだけ",
	"draftsSaveToDraft": "下書きへ保存",
	"draftsCannotCreateDraft": "この内容で下書きは作れへんな。",
	"schedulePost": "投稿を予約",
	"preview": "プレビュー",
	"reset": "リセット",
	"resetAreYouSure": "リセットしてええん？",
	"quoteQuestion": "引用として添付してもええか？",
	"attachAsFileQuestion": "クリップボードのテキストが長すぎるからテキストファイルとして添付してもええか？",
	"thisPostMayBeAnnoying": "この投稿は迷惑かもしらんで。",
	"thisPostMayBeAnnoyingHome": "ホームに投稿",
	"thisPostMayBeAnnoyingCancel": "やめとく",
	"thisPostMayBeAnnoyingIgnore": "このまま投稿",
	"draftsListDrafts": "下書き一覧",
	"draftsListScheduledNotes": "予約投稿一覧",
	"postFormHowToUseContent_title": "本文",
	"postFormHowToUseContent_description": "投稿する内容を入力します。",
	"postFormHowToUseToolbar_title": "ツールバー",
	"postFormHowToUseToolbar_description": "ファイルとかアンケートを付けたり、注釈とかハッシュタグを書いたり、絵文字とかメンションとかを付け足したりできるで。",
	"postFormHowToUseAccount_title": "アカウントメニュー",
	"postFormHowToUseAccount_description": "投稿するアカウントを変えたり、アカウントに保存した下書きとか予約投稿とかを見れるで。",
	"postFormHowToUseVisibility_title": "公開範囲",
	"postFormHowToUseVisibility_description": "ノートを誰に見せたいかはここで切り替えてな。",
	"postFormHowToUseMenu_title": "メニュー",
	"postFormHowToUseMenu_description": "下書きに保存したり、投稿の予約したり、リアクションの受け入れ設定とか…なんか色々できるで。",
	"postFormHowToUseSubmit_title": "投稿ボタン",
	"postFormHowToUseSubmit_description": "ノートを投稿するときはここ押してな。Ctrl + Enter / Cmd + Enter でも投稿できるで。",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "アップロードされてへんファイルがあるんやけど、ほかしてフォームを閉じてもええんか？",
	"yes": "ええで",
	"no": "あかん"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"account": "Imiḍan",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Wiyyaḍ",
	"quoteAttached": "Quote",
	"recipient": "Recipient",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Cancel",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Add",
	"annotation": "Comments",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Attach files",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"poll": "Poll",
	"useCw": "Hide content",
	"mention": "Bder",
	"addMfmFunction": "Add MFM",
	"plugins": "Izegrar",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "Err",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Yes",
	"no": "No"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"account": "Account",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Other",
	"quoteAttached": "Quote",
	"recipient": "Recipient",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "ರದ್ದು",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Add",
	"annotation": "Comments",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Attach files",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"poll": "Poll",
	"useCw": "Hide content",
	"mention": "ಹೆಸರಿಸಿದ",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "ಉತ್ತರಿಸು",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Yes",
	"no": "No"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"account": "계정",
	"visibility": "공개 범위",
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
	"visibilityDisableFederation": "연합에 보내지 않기",
	"other": "기타",
	"quoteAttached": "인용함",
	"recipient": "수신인",
	"postFormShowHowToUse": "입력란의 설명 표시",
	"scheduleToPostOnX": "{x}에 게시를 예약합니다.",
	"cancel": "취소",
	"notSpecifiedMentionWarning": "수신자가 선택되지 않은 멘션이 있어요",
	"add": "추가",
	"annotation": "내용에 대한 주석",
	"hashtags": "해시태그",
	"postFormUploaderTip": "파일이 아직 업로드돼있지 않습니다. 파일 메뉴에서 이름 바꾸기나 이미지의 자르기, 워터마크 넣기, 압축의 유무 등을 설정할 수 있습니다. 파일은 노트 게시 시 자동으로 업로드됩니다.",
	"attachFile": "파일 첨부",
	"upload": "업로드",
	"fromDrive": "드라이브에서",
	"poll": "투표",
	"useCw": "내용 숨기기",
	"mention": "멘션",
	"addMfmFunction": "장식 추가하기",
	"plugins": "플러그인",
	"emoji": "이모지",
	"postFormQuotePlaceholder": "이 노트를 인용...",
	"postFormReplyPlaceholder": "이 노트에 답글...",
	"postFormChannelPlaceholder": "채널에 게시하기...",
	"postFormPlaceholdersA": "지금 무엇을 하고 있나요?",
	"postFormPlaceholdersB": "무슨 일이 일어나고 있나요?",
	"postFormPlaceholdersC": "무엇을 생각하고 있나요?",
	"postFormPlaceholdersD": "말하고 싶은 게 있나요?",
	"postFormPlaceholdersE": "여기에 적어 주세요",
	"postFormPlaceholdersF": "작성해주시길 기다리고 있어요...",
	"schedule": "예약",
	"quote": "인용",
	"reply": "답글",
	"note": "노트",
	"disableFederationConfirm": "정말로 연합을 끄시겠습니까?",
	"disableFederationConfirmWarn": "연합을 끄더라도 게시물이 비공개로 전환되는 것은 아닙니다. 대부분의 경우 연합을 비활성화할 필요가 없습니다.",
	"disableFederationOk": "연합을 끄기",
	"neverShow": "다시 보지 않기",
	"reactionAcceptance": "리액션 수신",
	"all": "전체",
	"likeOnlyForRemote": "리모트에서는 좋아요만 받기",
	"nonSensitiveOnly": "민감한 이모지를 제외하고 받기",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "민감한 이모지를 제외하고 받기(리모트에서는 좋아요만 받기)",
	"likeOnly": "좋아요만 받기",
	"draftsSaveToDraft": "초안에 저장",
	"draftsCannotCreateDraft": "이 내용으로는 초안을 작성할 수 없습니다. ",
	"schedulePost": "게시 예약",
	"preview": "미리보기",
	"reset": "초기화",
	"resetAreYouSure": "초기화 하시겠습니까?",
	"quoteQuestion": "인용해서 첨부하시겠습니까?",
	"attachAsFileQuestion": "붙여넣으려는 글이 너무 깁니다. 텍스트 파일로 첨부하시겠습니까?",
	"thisPostMayBeAnnoying": "이 게시물은 다른 유저에게 피해를 줄 가능성이 있습니다.",
	"thisPostMayBeAnnoyingHome": "홈에 게시",
	"thisPostMayBeAnnoyingCancel": "그만두기",
	"thisPostMayBeAnnoyingIgnore": "이대로 게시",
	"draftsListDrafts": "초안 목록",
	"draftsListScheduledNotes": "예약 게시물 목록",
	"postFormHowToUseContent_title": "본문",
	"postFormHowToUseContent_description": "게시할 내용을 입력합니다.",
	"postFormHowToUseToolbar_title": "도구 모음",
	"postFormHowToUseToolbar_description": "파일이나 설문의 첨부, 주석이나 해시태그 설정, 이모티콘이나 멘션의 삽입 등을 할 수 있습니다.",
	"postFormHowToUseAccount_title": "계정 메뉴",
	"postFormHowToUseAccount_description": "게시할 계정을 교체하거나, 계정에 보존한 초안 및 예약 게시물을 목록으로 볼 수 있습니다.",
	"postFormHowToUseVisibility_title": "공개 범위",
	"postFormHowToUseVisibility_description": "노트 공개 범위의 설정을 할 수 있습니다.",
	"postFormHowToUseMenu_title": "메뉴",
	"postFormHowToUseMenu_description": "초안의 보존, 게시 예약, 리액션의 설정 등 그 외의 액션을 할 수 있습니다.",
	"postFormHowToUseSubmit_title": "게시 버튼",
	"postFormHowToUseSubmit_description": "노트를 게시합니다. Ctrl + Enter / Cmd + Enter로도 게시할 수 있습니다.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "업로드되지 않은 파일이 있습니다만, 없애고 폼을 닫겠습니까?",
	"yes": "예",
	"no": "아니오"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"account": "Gebruikersaccounts",
	"visibility": "Zichtbaarheid",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Ander",
	"quoteAttached": "Citaat",
	"recipient": "Ontvanger",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Annuleren",
	"notSpecifiedMentionWarning": "Deze notitie bevat verwijzingen naar gebruikers die niet zijn geselecteerd als ontvangers",
	"add": "Toevoegen",
	"annotation": "Reacties",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Bestanden toevoegen",
	"upload": "Uploaden",
	"fromDrive": "Van schijf",
	"poll": "Peiling",
	"useCw": "Inhoudswaarschuwing gebruiken",
	"mention": "Vermelding",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "Antwoord",
	"note": "Notitie",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "Alle",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Voorbeeld",
	"reset": "Herstellen",
	"resetAreYouSure": "Resetten?",
	"quoteQuestion": "Toevoegen als citaat?",
	"attachAsFileQuestion": "De tekst op het klembord is te lang. Wilt u het als een tekstbestand bijvoegen?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Zichtbaarheid",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Ja",
	"no": "Nee"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"account": "Konto",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Andre",
	"quoteAttached": "Sitat",
	"recipient": "Mottaker",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Avbryt",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Legg til",
	"annotation": "Kommentarer",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Legg ved filer",
	"upload": "Laste opp",
	"fromDrive": "From Drive",
	"poll": "Avstemning",
	"useCw": "Hide content",
	"mention": "Mention",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "Hva skjer?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Sitat",
	"reply": "Svar",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Ikke vis igjen",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "Alle",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Bare liker",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Avbryt",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Meny",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Ja",
	"no": "Nei"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"account": "Konta",
	"visibility": "Widoczność",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Inne",
	"quoteAttached": "Zacytowano",
	"recipient": "Odbiorca",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Anuluj",
	"notSpecifiedMentionWarning": "Ten wpis zawiera wzmianki o użytkownikach niezawartych jako odbiorcy",
	"add": "Dodaj",
	"annotation": "Komentarze",
	"hashtags": "Hashtag",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Załącz pliki",
	"upload": "Wyślij",
	"fromDrive": "Z dysku",
	"poll": "Ankieta",
	"useCw": "Ukryj zawartość",
	"mention": "Wspomnij",
	"addMfmFunction": "Add MFM",
	"plugins": "Wtyczki",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Zacytuj ten wpis…",
	"postFormReplyPlaceholder": "Odpowiedz na ten wpis...",
	"postFormChannelPlaceholder": "Publikuj na kanale...",
	"postFormPlaceholdersA": "Co się dzieje?",
	"postFormPlaceholdersB": "Co się wydarzyło?",
	"postFormPlaceholdersC": "Co Ci chodzi po głowie?",
	"postFormPlaceholdersD": "Czy masz coś do powiedzenia?",
	"postFormPlaceholdersE": "Zacznij coś pisać…",
	"postFormPlaceholdersF": "Czekamy, aż coś napiszesz.",
	"schedule": "Schedule",
	"quote": "Cytuj",
	"reply": "Odpowiedz",
	"note": "Utwórz wpis",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Wyłącz federacje",
	"neverShow": "Nie pokazuj ponownie",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "Wszystkie",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Podgląd",
	"reset": "Reset",
	"resetAreYouSure": "Czy na pewno chcesz zresetować?",
	"quoteQuestion": "Czy na pewno chcesz umieścić cytat?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "Ten wpis może obrażać pozostałych użytkowników",
	"thisPostMayBeAnnoyingHome": "Opublikuj na domowej osi czasu",
	"thisPostMayBeAnnoyingCancel": "Odrzuć",
	"thisPostMayBeAnnoyingIgnore": "Zignoruj i wyślij",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Widoczność",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Tak",
	"no": "Nie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"account": "Contas",
	"visibility": "Visibilidade",
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
	"visibilityDisableFederation": "Defederar",
	"other": "Outros",
	"quoteAttached": "Com citação",
	"recipient": "Destinatário",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Agendar nota para {x}",
	"cancel": "Cancelar",
	"notSpecifiedMentionWarning": "Esta nota menciona usuários que não foram incluídos como recipientes.",
	"add": "Adicionar",
	"annotation": "Anotação",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "O arquivo ainda não foi enviado. No menu do arquivo, você pode renomear, cortar, adicionar uma marca d'água, comprimir ou descomprimir um arquivo. Arquivos serão enviados automaticamente ao publicar a nota.",
	"attachFile": "Anexar arquivo",
	"upload": "Fazer upload",
	"fromDrive": "Do drive",
	"poll": "Enquetes",
	"useCw": "Ocultar conteúdo",
	"mention": "Menção",
	"addMfmFunction": "Adicionar MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Citar essa nota...",
	"postFormReplyPlaceholder": "Responder a essa nota...",
	"postFormChannelPlaceholder": "Postar em canal...",
	"postFormPlaceholdersA": "Como vão as coisas?",
	"postFormPlaceholdersB": "O que está rolando por aí?",
	"postFormPlaceholdersC": "No que está pensando?",
	"postFormPlaceholdersD": "Do que você quer falar?",
	"postFormPlaceholdersE": "Comece a digitar...",
	"postFormPlaceholdersF": "Esperando você digitar...",
	"schedule": "Agendar",
	"quote": "Citar",
	"reply": "Responder",
	"note": "Publicar",
	"disableFederationConfirm": "Realmente desabilitar a federação?",
	"disableFederationConfirmWarn": "Mesmo se defederado, publicações continuarão sendo públicas, a menos que seja definido o contrário. Você geralmente não precisa disso.",
	"disableFederationOk": "Desabilitar",
	"neverShow": "Não exibir novamente",
	"reactionAcceptance": "Aceitação de Reações",
	"all": "Todos",
	"likeOnlyForRemote": "Tudo (somente curtidas remotas)",
	"nonSensitiveOnly": "Apenas não-sensível",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Apenas não sensíveis (somente curtidas remotas)",
	"likeOnly": "Apenas curtidas",
	"draftsSaveToDraft": "Salvar como Rascunho",
	"draftsCannotCreateDraft": "Você não pode criar um rascunho com esse conteúdo.",
	"schedulePost": "Agendar publicação",
	"preview": "Pré-visualizar",
	"reset": "Redefinir",
	"resetAreYouSure": "Deseja reiniciar?",
	"quoteQuestion": "Anexar como citação?",
	"attachAsFileQuestion": "O texto na área de transferência é muito longo. Você gostaria de anexá-lo como um arquivo de texto?",
	"thisPostMayBeAnnoying": "Esta nota pode incomodar outras pessoas.",
	"thisPostMayBeAnnoyingHome": "Postar na linha do tempo inicial",
	"thisPostMayBeAnnoyingCancel": "Cancelar",
	"thisPostMayBeAnnoyingIgnore": "Postar mesmo assim",
	"draftsListDrafts": "Lista de Rascunhos",
	"draftsListScheduledNotes": "Lista de notas agendadas",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibilidade",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu\n",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Há arquivos que não foram enviados, gostaria de descartá-los e fechar o editor?",
	"yes": "Sim",
	"no": "Não"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"account": "Учётные записи",
	"visibility": "Видимость",
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
	"visibilityDisableFederation": "Отключить федерацию",
	"other": "Другие",
	"quoteAttached": "Цитата",
	"recipient": "Кому",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Запланировать заметку на {x}",
	"cancel": "Отмена",
	"notSpecifiedMentionWarning": "В этой заметке есть упоминание тех, кто не включён в адресаты",
	"add": "Добавить",
	"annotation": "Примечание",
	"hashtags": "Хештеги",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Прикрепить файлы",
	"upload": "Загрузить",
	"fromDrive": "С Диска",
	"poll": "Опрос",
	"useCw": "Скрывать содержимое под предупреждением",
	"mention": "Упоминание",
	"addMfmFunction": "Добавить MFM",
	"plugins": "Расширения",
	"emoji": "Эмодзи",
	"postFormQuotePlaceholder": "Пояснение к цитате...",
	"postFormReplyPlaceholder": "Ответ на заметку...",
	"postFormChannelPlaceholder": "Отправить в канал",
	"postFormPlaceholdersA": "Как дела?",
	"postFormPlaceholdersB": "Что интересного вокруг?",
	"postFormPlaceholdersC": "Что грызёт тебя, дружище?",
	"postFormPlaceholdersD": "Есть что сказать?..",
	"postFormPlaceholdersE": "Напишите что-нибудь…",
	"postFormPlaceholdersF": "В ожидании, когда вы напишете…",
	"schedule": "Отложить",
	"quote": "Цитата",
	"reply": "Ответ",
	"note": "Заметка",
	"disableFederationConfirm": "Отключить федерацию?",
	"disableFederationConfirmWarn": "Дефедерация не делает заметку приватной. В большинстве случаев без федерации не обойтись.",
	"disableFederationOk": "Не федерируется",
	"neverShow": "Больше не показывать",
	"reactionAcceptance": "Допустимые реакции",
	"all": "Все",
	"likeOnlyForRemote": "Всё (с других серверов только «нравится!»)",
	"nonSensitiveOnly": "Только безопасные",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Только безопасные (с других серверов только «нравится!»)",
	"likeOnly": "Только «нравится!»",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Запланировать заметку",
	"preview": "Предпросмотр",
	"reset": "Сброс",
	"resetAreYouSure": "На самом деле сбросить?",
	"quoteQuestion": "Хотите добавить цитату?",
	"attachAsFileQuestion": "Текста в буфере обмена слишком много. Прикрепить как текстовый файл?",
	"thisPostMayBeAnnoying": "Эта заметка может быть сочтена неприятной.",
	"thisPostMayBeAnnoyingHome": "Отправить на главную ленту",
	"thisPostMayBeAnnoyingCancel": "Отменить",
	"thisPostMayBeAnnoyingIgnore": "Всё равно опубликовать",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "Вы можете прикрепить файл или голосование, добавить примечание или хэштег, и вставить эмодзи или упоминание",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Видимость",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Меню",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Да",
	"no": "Нет"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"account": "Účty",
	"visibility": "Viditeľnosť",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Ostatní",
	"quoteAttached": "Citované",
	"recipient": "Prijímateľ",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Zrušiť",
	"notSpecifiedMentionWarning": "Táto poznámka obsahuje spomenutých používateľov, ktorí nie sú medzi adresátmi.",
	"add": "Pridať",
	"annotation": "Komentáre",
	"hashtags": "Hashtagy",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Priložiť súbor",
	"upload": "Nahrať súbor",
	"fromDrive": "Z disku",
	"poll": "Hlasovanie",
	"useCw": "Skryť obsah",
	"mention": "Zmienka",
	"addMfmFunction": "Add MFM",
	"plugins": "Pluginy",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Citovanie tejto poznámky...",
	"postFormReplyPlaceholder": "Odpoveď na túto poznámku...",
	"postFormChannelPlaceholder": "Poslať do kanála...",
	"postFormPlaceholdersA": "Čo máte v pláne?",
	"postFormPlaceholdersB": "Čo sa deje?",
	"postFormPlaceholdersC": "O čom rozmýšľaš?",
	"postFormPlaceholdersD": "Čo chcete povedať?",
	"postFormPlaceholdersE": "Začnite písať...",
	"postFormPlaceholdersF": "Čaká sa na písanie...",
	"schedule": "Schedule",
	"quote": "Citovať",
	"reply": "Odpovedať",
	"note": "Poznámka",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Nabudúce nezobrazovať",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "Všetko",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Náhľad",
	"reset": "Reset",
	"resetAreYouSure": "Naozaj resetovať?",
	"quoteQuestion": "Pripojiť ako citát?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Viditeľnosť",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Áno",
	"no": "Nie"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"account": "บัญชีผู้ใช้",
	"visibility": "การมองเห็น",
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
	"visibilityDisableFederation": "การปิดใช้งานสหพันธ์",
	"other": "อื่น ๆ",
	"quoteAttached": "อ้างอิง",
	"recipient": "ผู้รับ",
	"postFormShowHowToUse": "แสดงวิธีใช้ฟอร์ม",
	"scheduleToPostOnX": "กำหนดเวลาให้โพสต์ไว้ที่ {x}",
	"cancel": "ยกเลิก",
	"notSpecifiedMentionWarning": "โน้ตนี้มีการกล่าวถึงผู้ใช้งานที่ไม่รวมอยู่ในผู้รับ",
	"add": "เพิ่ม",
	"annotation": "ข้อความเกริ่น",
	"hashtags": "แฮชแท็ก",
	"postFormUploaderTip": "ไฟล์ยังไม่ได้อัปโหลด สามารถตั้งค่าต่างๆ ได้จากเมนูของไฟล์ เช่น การเปลี่ยนชื่อ การครอปรูป การใส่ลายน้ำ และการบีบอัด ไฟล์จะถูกอัปโหลดโดยอัตโนมัติเมื่อโพสต์โน้ต",
	"attachFile": "แนบไฟล์",
	"upload": "อัปโหลด",
	"fromDrive": "จากไดรฟ์",
	"poll": "โพล",
	"useCw": "ซ่อนเนื้อหา",
	"mention": "กล่าวถึง",
	"addMfmFunction": "เพิ่มการตกแต่ง",
	"plugins": "ปลั๊กอิน",
	"emoji": "เอโมจิ",
	"postFormQuotePlaceholder": "อ้างโน้ตนี้...",
	"postFormReplyPlaceholder": "ตอบกลับโน้ตนี้...",
	"postFormChannelPlaceholder": "โพสต์ลงช่อง...",
	"postFormPlaceholdersA": "ตอนนี้เป็นยังไงบ้าง?",
	"postFormPlaceholdersB": "มีอะไรเกิดขึ้นหรือเปล่า?",
	"postFormPlaceholdersC": "กำลังคิดอะไรอยู่?",
	"postFormPlaceholdersD": "ต้องการจะพูดอะไรไหม?",
	"postFormPlaceholdersE": "มาเขียนกันเถอะ",
	"postFormPlaceholdersF": "กำลังรอให้คุณเขียน...",
	"schedule": "กำหนดเวลา",
	"quote": "อ้างอิง",
	"reply": "ตอบกลับ",
	"note": " โน้ต",
	"disableFederationConfirm": "ปิดใช้งานสหพันธ์เลยใช่ไหม?",
	"disableFederationConfirmWarn": "โพสต์จะยังคงเป็นสาธารณะต่อไป เว้นแต่จะตั้งค่าเป็นอย่างอื่น",
	"disableFederationOk": "ปิดการใช้งานสหพันธ์",
	"neverShow": "ไม่ต้องแสดงข้อความนี้อีก",
	"reactionAcceptance": "การยอมรับรีแอคชั่น",
	"all": "ทั้งหมด",
	"likeOnlyForRemote": "ทั้งหมด (เฉพาะการถูกใจจากเซิร์ฟเวอร์ระยะไกล)",
	"nonSensitiveOnly": "เฉพาะไม่มีเนื้อหาละเอียดอ่อน",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "เฉพาะไม่มีเนื้อหาละเอียดอ่อน (เฉพาะการถูกใจจากระยะไกลเท่านั้น)",
	"likeOnly": "ที่ถูกใจเท่านั้น",
	"draftsSaveToDraft": "บันทึกเป็นฉบับร่าง",
	"draftsCannotCreateDraft": "ไม่สามารถสร้างฉบับร่างด้วยเนื้อหานี้ได้",
	"schedulePost": "กำหนดเวลาให้โพสต์",
	"preview": "แสดงตัวอย่าง",
	"reset": "รีเซ็ต",
	"resetAreYouSure": "รีเซ็ตเลยไหม?",
	"quoteQuestion": "ต้องการที่จะแนบมันเพื่ออ้างอิงใช่ไหม?",
	"attachAsFileQuestion": "ข้อความในคลิปบอร์ดยาวเกินไป คุณต้องการแนบเป็นไฟล์ข้อความหรือไม่?",
	"thisPostMayBeAnnoying": "โน้ตนี้อาจจะเป็นการรบกวนผู้อื่นนะคะ",
	"thisPostMayBeAnnoyingHome": "โพสต์ลงไทม์ไลน์หลักเท่านั้น",
	"thisPostMayBeAnnoyingCancel": "ยกเลิก",
	"thisPostMayBeAnnoyingIgnore": "โพสต์ไปเลย ไม่ต้องปรับการมองเห็น",
	"draftsListDrafts": "รายการฉบับร่าง",
	"draftsListScheduledNotes": "รายการโน้ตที่กำหนดเวลาไว้",
	"postFormHowToUseContent_title": "เนื้อความ",
	"postFormHowToUseContent_description": "ป้อนเนื้อหาที่จะโพสต์",
	"postFormHowToUseToolbar_title": "แถบเครื่องมือ",
	"postFormHowToUseToolbar_description": "สามารถแนบไฟล์หรือแบบสอบถาม ตั้งข้อความเกริ่นหรือแฮชแท็ก แทรกเอโมจิหรือการกล่าวถึง เป็นต้น",
	"postFormHowToUseAccount_title": "เมนูบัญชี",
	"postFormHowToUseAccount_description": "สามารถสลับบัญชีที่ใช้โพสต์ หรือดูรายการฉบับร่างและโพสต์กำหนดเวลาไว้ซึ่งบันทึกไว้ในบัญชีได้",
	"postFormHowToUseVisibility_title": "การมองเห็น",
	"postFormHowToUseVisibility_description": "สามารถตั้งค่าขอบเขตการเผยแพร่โน้ตได้",
	"postFormHowToUseMenu_title": "เมนู",
	"postFormHowToUseMenu_description": "สามารถบันทึกเป็นฉบับร่าง ตั้งเวลาการโพสต์ ตั้งค่ารีแอคชั่น และดำเนินการอื่นๆ ได้",
	"postFormHowToUseSubmit_title": "ปุ่มโพสต์",
	"postFormHowToUseSubmit_description": "กดปุ่มนั้นเพื่อโพสต์โน้ต หรือกด Ctrl + Enter / Cmd + Return เพื่อโพสต์ก็ได้เช่นกัน",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "มีไฟล์ที่ยังไม่ได้อัปโหลด ต้องการละทิ้งและปิดฟอร์มหรือไม่?",
	"yes": "ใช่",
	"no": "ไม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"account": "Hesap",
	"visibility": "Görünürlük",
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
	"visibilityDisableFederation": "Federasyon olmadan",
	"other": "Diğer",
	"quoteAttached": "Alıntı",
	"recipient": "Alıcı",
	"postFormShowHowToUse": "Form açıklamasını göster",
	"scheduleToPostOnX": "{x} için bir gönderi planla",
	"cancel": "Vazgeç",
	"notSpecifiedMentionWarning": "Bu notta, alıcılar arasında yer almayan kullanıcılar hakkında bilgiler bulunmaktadır.",
	"add": "Ekle",
	"annotation": "Yorumlar",
	"hashtags": "Hashtag'ler",
	"postFormUploaderTip": "Dosya henüz yüklenmemiş. Dosya menüsünden dosyayı yeniden adlandırabilir, görüntüleri kırpabilir, filigran ekleyebilir ve dosyayı sıkıştırabilir veya sıkıştırmayı kaldırabilirsin. Notu yayınladığında dosyalar otomatik olarak yüklenir.",
	"attachFile": "Dosyaları ekle",
	"upload": "Yükle",
	"fromDrive": "Drive'den",
	"poll": "Anket",
	"useCw": "İçeriği gizle",
	"mention": "Bahset",
	"addMfmFunction": "MFM ekle",
	"plugins": "Eklentiler",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Bu notu alıntı yap...",
	"postFormReplyPlaceholder": "Bu notu yanıtla...",
	"postFormChannelPlaceholder": "Bir kanala gönder...",
	"postFormPlaceholdersA": "Ne yapıyorsun?",
	"postFormPlaceholdersB": "Çevrende neler oluyor?",
	"postFormPlaceholdersC": "Aklında ne var?",
	"postFormPlaceholdersD": "Ne söylemek istiyorsun?",
	"postFormPlaceholdersE": "Yazmaya başlayın...",
	"postFormPlaceholdersF": "Yazmanızı bekliyoruz...",
	"schedule": "rezervasyon",
	"quote": "Alıntı",
	"reply": "Yanıtla",
	"note": "Not",
	"disableFederationConfirm": "Federasyonu cidden devre dışı bırakmak istiyor musun?",
	"disableFederationConfirmWarn": "Federasyondan ayrılsa bile, aksi belirtilmedikçe gönderiler herkese açık olmaya devam edecek. Genellikle bunu yapmanız gerekmez.",
	"disableFederationOk": "Devre Dışı",
	"neverShow": "Bir daha gösterme",
	"reactionAcceptance": "Tepki Kabulü",
	"all": "Tümü",
	"likeOnlyForRemote": "Tüm (Yalnızca uzak sunucu için beğeniler)",
	"nonSensitiveOnly": "Hassas olmayanlar için",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Yalnızca hassas olmayanlar (Yalnızca uzaktan beğeniler)",
	"likeOnly": "Sadece beğeniler",
	"draftsSaveToDraft": "Taslak olarak kaydet",
	"draftsCannotCreateDraft": "Bu içerikle taslak oluşturamazsınız.",
	"schedulePost": "Bir gönderi planla",
	"preview": "Önizleme",
	"reset": "Sıfırla",
	"resetAreYouSure": "Cidden sıfırlansın mı?",
	"quoteQuestion": "Alıntı olarak ekle?",
	"attachAsFileQuestion": "Panodaki metin uzun. Metin dosyası olarak eklemek ister misin?",
	"thisPostMayBeAnnoying": "Bu not başkalarını rahatsız edebilir.",
	"thisPostMayBeAnnoyingHome": "Ana panoya gönder",
	"thisPostMayBeAnnoyingCancel": "İptal",
	"thisPostMayBeAnnoyingIgnore": "Yine de gönder",
	"draftsListDrafts": "Taslaklar Listesi",
	"draftsListScheduledNotes": "Planlanmış gönderilerin listesi",
	"postFormHowToUseContent_title": "Metin",
	"postFormHowToUseContent_description": "Yayınlamak istediğiniz içeriği girin.",
	"postFormHowToUseToolbar_title": "Araç Çubuğu",
	"postFormHowToUseToolbar_description": "Dosya ve anket ekleyebilir, açıklamalar ve etiketler ekleyebilir, emoji ve bahsetme mesajları ekleyebilirsiniz.",
	"postFormHowToUseAccount_title": "Hesap Menüsü",
	"postFormHowToUseAccount_description": "Paylaşım yaptığınız hesabı değiştirebilir ve hesabınıza kaydedilmiş taslak ve planlanmış paylaşımların listesini görüntüleyebilirsiniz.",
	"postFormHowToUseVisibility_title": "Görünürlük",
	"postFormHowToUseVisibility_description": "Notlarınıza kimlerin erişebileceğinin kapsamını belirleyebilirsiniz.",
	"postFormHowToUseMenu_title": "Menü",
	"postFormHowToUseMenu_description": "Taslak olarak kaydetme, gönderi planlama ve tepki ayarlama gibi diğer işlemleri de gerçekleştirebilirsiniz.",
	"postFormHowToUseSubmit_title": "Gönder düğmesi",
	"postFormHowToUseSubmit_description": "Bir not paylaşacağım. Ctrl + Enter / Cmd + Enter tuşlarını kullanarak da paylaşım yapabilirsiniz.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "Yüklenmemiş dosyalar var, bunları silip formu kapatmak ister misin?",
	"yes": "Evet",
	"no": "Hayır"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"account": "Account",
	"visibility": "Visibility",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Other",
	"quoteAttached": "Quote",
	"recipient": "Recipient",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Cancel",
	"notSpecifiedMentionWarning": "This note contains mentions of users not included as recipients",
	"add": "Add",
	"annotation": "Comments",
	"hashtags": "Hashtags",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Attach files",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"poll": "Poll",
	"useCw": "Hide content",
	"mention": "Mention",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugins",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Quote this note...",
	"postFormReplyPlaceholder": "Reply to this note...",
	"postFormChannelPlaceholder": "Post to a channel...",
	"postFormPlaceholdersA": "What are you up to?",
	"postFormPlaceholdersB": "What's happening around you?",
	"postFormPlaceholdersC": "What's on your mind?",
	"postFormPlaceholdersD": "What do you want to say?",
	"postFormPlaceholdersE": "Start writing...",
	"postFormPlaceholdersF": "Waiting for you to write...",
	"schedule": "Schedule",
	"quote": "Quote",
	"reply": "Reply",
	"note": "Note",
	"disableFederationConfirm": "Really disable federation?",
	"disableFederationConfirmWarn": "Even if defederated, posts will continue to be public unless set otherwise. You usually do not need to do this.",
	"disableFederationOk": "Disable",
	"neverShow": "Don't show again",
	"reactionAcceptance": "Reaction Acceptance",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Preview",
	"reset": "Reset",
	"resetAreYouSure": "Really reset?",
	"quoteQuestion": "Append as quote?",
	"attachAsFileQuestion": "The text in clipboard is long. Would you want to attach it as text file?",
	"thisPostMayBeAnnoying": "This note may annoy others.",
	"thisPostMayBeAnnoyingHome": "Post to home timeline",
	"thisPostMayBeAnnoyingCancel": "Cancel",
	"thisPostMayBeAnnoyingIgnore": "Post anyway",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Visibility",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Yes",
	"no": "No"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"account": "Акаунти",
	"visibility": "Видимість",
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
	"visibilityDisableFederation": "Defederate",
	"other": "Інше",
	"quoteAttached": "Цитата",
	"recipient": "Отримувач",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Заплановано створити нотатку на {x}",
	"cancel": "Скасувати",
	"notSpecifiedMentionWarning": "Згадки, не включені до пункту призначення",
	"add": "Додати",
	"annotation": "Коментарі",
	"hashtags": "Хештеґ",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Прикріпити файл",
	"upload": "Завантажити",
	"fromDrive": "З диска",
	"poll": "Опитування",
	"useCw": "Приховати вміст",
	"mention": "Згадка",
	"addMfmFunction": "Додати MFM",
	"plugins": "Плагіни",
	"emoji": "Емодзі",
	"postFormQuotePlaceholder": "Прокоментуйте цю нотатку...",
	"postFormReplyPlaceholder": "Відповідь на цю нотатку...",
	"postFormChannelPlaceholder": "Опублікувати в каналі",
	"postFormPlaceholdersA": "Чим займаєтесь?",
	"postFormPlaceholdersB": "Що відбувається навколо вас?",
	"postFormPlaceholdersC": "Що у вас на думці?",
	"postFormPlaceholdersD": "Що ви хочете висловити?",
	"postFormPlaceholdersE": "Напишіть тут, будь ласка...",
	"postFormPlaceholdersF": "Чекаю коли ви напишете...",
	"schedule": "Запланувати",
	"quote": "Цитата",
	"reply": "Відповісти",
	"note": "Запис",
	"disableFederationConfirm": "Справді вимкнути федерацію?",
	"disableFederationConfirmWarn": "Навіть якщо федерацію вимкнено, дописи залишатимуться публічними, якщо не вказано інше. Зазвичай вам не потрібно цього робити.",
	"disableFederationOk": "Не федерується",
	"neverShow": "Більше не показувати",
	"reactionAcceptance": "Прийняття реакцій",
	"all": "Всі",
	"likeOnlyForRemote": "Усі — лише вподобання для віддалених інстансів",
	"nonSensitiveOnly": "Тільки нечутливий контент",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Тільки нечутливий контент (тільки віддалені вподобання)",
	"likeOnly": "Лише вподобання",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Запланувати нотатку",
	"preview": "Попередній перегляд",
	"reset": "Скинути",
	"resetAreYouSure": "Справді скинути?",
	"quoteQuestion": "Ви хочете додати цитату?",
	"attachAsFileQuestion": "Текст у буфері обміну довгий. Хочете прикріпити його як текстовий файл?",
	"thisPostMayBeAnnoying": "Ця нотатка може дратувати інших.",
	"thisPostMayBeAnnoyingHome": "Опублікувати в домашній стрічці",
	"thisPostMayBeAnnoyingCancel": "Скасувати",
	"thisPostMayBeAnnoyingIgnore": "Усе одно опублікувати",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Видимість",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Меню",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Так",
	"no": "Ні"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"account": "Tài khoản của bạn",
	"visibility": "Hiển thị",
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
	"visibilityDisableFederation": "Không liên hợp",
	"other": "Khác",
	"quoteAttached": "Trích dẫn",
	"recipient": "Người nhận",
	"postFormShowHowToUse": "Show how to use this form",
	"scheduleToPostOnX": "Scheduled to note on {x}",
	"cancel": "Hủy",
	"notSpecifiedMentionWarning": "Tút này có đề cập đến những người không mong muốn",
	"add": "Thêm",
	"annotation": "Bình luận",
	"hashtags": "Hashtag",
	"postFormUploaderTip": "The file has not yet been uploaded. From the file menu, you can rename, crop images, watermark and compress or uncompress the file. Files are automatically uploaded when you publish a note.",
	"attachFile": "Đính kèm tập tin",
	"upload": "Tải lên",
	"fromDrive": "Từ ổ đĩa",
	"poll": "Bình chọn",
	"useCw": "Ẩn nội dung",
	"mention": "Nhắc đến",
	"addMfmFunction": "Add MFM",
	"plugins": "Plugin",
	"emoji": "Emoji",
	"postFormQuotePlaceholder": "Trích dẫn tút này",
	"postFormReplyPlaceholder": "Trả lời tút này",
	"postFormChannelPlaceholder": "Đăng lên một kênh",
	"postFormPlaceholdersA": "Bạn đang định làm gì?",
	"postFormPlaceholdersB": "Hôm nay bạn có gì vui?",
	"postFormPlaceholdersC": "Bạn đang nghĩ gì?",
	"postFormPlaceholdersD": "Bạn muốn nói gì?",
	"postFormPlaceholdersE": "Cứ viết trên đây",
	"postFormPlaceholdersF": "Đang chờ bạn viết...",
	"schedule": "Schedule",
	"quote": "Trích dẫn",
	"reply": "Trả lời",
	"note": "Bài viết",
	"disableFederationConfirm": "Bạn có muốn làm điều đó mà không cần liên minh không?",
	"disableFederationConfirmWarn": "Ngay cả khi bị trì hoãn, bài đăng vẫn sẽ tiếp tục là công khai trừ khi được thiết lập khác. Bạn thường không cần phải làm điều này.",
	"disableFederationOk": "Vô hiệu hoá",
	"neverShow": "Không hiển thị nữa",
	"reactionAcceptance": "Phản ứng chấp nhận",
	"all": "Tất cả",
	"likeOnlyForRemote": "Tất cả (chỉ bao gồm lượt thích trên các máy chủ khác)",
	"nonSensitiveOnly": "Chỉ nội dung không nhạy cảm",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Chỉ nội dung không nhạy cảm (chỉ bao gồm lượt thích từ máy chủ khác)",
	"likeOnly": "Chỉ lượt thích",
	"draftsSaveToDraft": "Save to Draft",
	"draftsCannotCreateDraft": "You cannot create a draft with this content.",
	"schedulePost": "Schedule note",
	"preview": "Xem trước",
	"reset": "cài lại",
	"resetAreYouSure": "Bạn có chắc muốn đặt lại?",
	"quoteQuestion": "Trích dẫn lại?",
	"attachAsFileQuestion": "Văn bản ở trong bộ nhớ tạm rất dài. Bạn có muốn đăng nó dưới dạng một tệp văn bản không?",
	"thisPostMayBeAnnoying": "Bạn đăng bài này có thể làm phiền cho người ta.",
	"thisPostMayBeAnnoyingHome": "Đăng trên trang chính",
	"thisPostMayBeAnnoyingCancel": "Từ chối",
	"thisPostMayBeAnnoyingIgnore": "Đăng bài để nguyên",
	"draftsListDrafts": "List of Drafts",
	"draftsListScheduledNotes": "Scheduled notes list",
	"postFormHowToUseContent_title": "Body",
	"postFormHowToUseContent_description": "Enter the content you wish to post here.",
	"postFormHowToUseToolbar_title": "Toolbars",
	"postFormHowToUseToolbar_description": "You can attach files or poll, add annotations or hashtags, and insert emojis or mentions.",
	"postFormHowToUseAccount_title": "Account menu",
	"postFormHowToUseAccount_description": "You can switch between accounts for posting, or view a list of drafts and scheduled posts saved to your account.",
	"postFormHowToUseVisibility_title": "Hiển thị",
	"postFormHowToUseVisibility_description": "You can configure the visibility of your notes.",
	"postFormHowToUseMenu_title": "Menu",
	"postFormHowToUseMenu_description": "You can save current content to drafts, schedule posts, set reactions, and perform other actions.",
	"postFormHowToUseSubmit_title": "Post button",
	"postFormHowToUseSubmit_description": "Post your notes by pressing this button. You can also post using Ctrl + Enter / Cmd + Enter.",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "There are files that have not been uploaded, do you want to discard them and close the form?",
	"yes": "Đồng ý",
	"no": "Từ chối"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"account": "账户",
	"visibility": "可见性",
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
	"visibilityDisableFederation": "仅限本地",
	"other": "其他",
	"quoteAttached": "已引用",
	"recipient": "收件人",
	"postFormShowHowToUse": "显示窗口说明",
	"scheduleToPostOnX": "预定在 {x} 发出",
	"cancel": "取消",
	"notSpecifiedMentionWarning": "有未添加到收件人的提及",
	"add": "添加",
	"annotation": "注解",
	"hashtags": "话题标签",
	"postFormUploaderTip": "文件尚未上传。您可以在文件菜单中设置重命名、裁剪图片、添加水印以及是否压缩等功能。文件将在帖子发布时自动上传。",
	"attachFile": "添加附件",
	"upload": "本地上传",
	"fromDrive": "从网盘中",
	"poll": "投票",
	"useCw": "隐藏内容",
	"mention": "提及",
	"addMfmFunction": "添加装饰",
	"plugins": "插件",
	"emoji": "表情符号",
	"postFormQuotePlaceholder": "引用该贴…",
	"postFormReplyPlaceholder": "回复该帖…",
	"postFormChannelPlaceholder": "发布到频道…",
	"postFormPlaceholdersA": "最近怎么样？",
	"postFormPlaceholdersB": "有什么新鲜事吗？",
	"postFormPlaceholdersC": "在想些什么呢？",
	"postFormPlaceholdersD": "想说些什么？",
	"postFormPlaceholdersE": "写些什么吧",
	"postFormPlaceholdersF": "期待您的发文…",
	"schedule": "定时",
	"quote": "引用",
	"reply": "回复",
	"note": "发帖",
	"disableFederationConfirm": "确定要禁用联邦交互？",
	"disableFederationConfirmWarn": "即使禁用联邦交互，也不会将帖子设为私有。在大多数情况下，没有必要禁用联邦交互。",
	"disableFederationOk": "禁用联邦",
	"neverShow": "不再显示",
	"reactionAcceptance": "接受表情回应",
	"all": "全部",
	"likeOnlyForRemote": "全部（远程仅点赞）",
	"nonSensitiveOnly": "仅限非敏感内容",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "仅限非敏感内容（远程仅点赞）",
	"likeOnly": "仅点赞",
	"draftsSaveToDraft": "保存到草稿",
	"draftsCannotCreateDraft": "此内容无法创建草稿。",
	"schedulePost": "定时发布",
	"preview": "预览",
	"reset": "重置",
	"resetAreYouSure": "确定要重置吗？",
	"quoteQuestion": "是否引用此链接内容？",
	"attachAsFileQuestion": "剪贴板内的文字过长。要转换为文本文件并添加吗？",
	"thisPostMayBeAnnoying": "该帖文可能会使他人感到不适。",
	"thisPostMayBeAnnoyingHome": "发布到首页",
	"thisPostMayBeAnnoyingCancel": "取消",
	"thisPostMayBeAnnoyingIgnore": "就这样发布",
	"draftsListDrafts": "草稿列表",
	"draftsListScheduledNotes": "定时发布列表",
	"postFormHowToUseContent_title": "正文",
	"postFormHowToUseContent_description": "在此输入要发布的内容。",
	"postFormHowToUseToolbar_title": "工具栏",
	"postFormHowToUseToolbar_description": "可在此添加文件和投票、设置注释和话题标签、插入表情符号和提及等。",
	"postFormHowToUseAccount_title": "账号菜单",
	"postFormHowToUseAccount_description": "可在此切换发帖用的账号、查看账户下保存的草稿及定时发送帖。",
	"postFormHowToUseVisibility_title": "可见性",
	"postFormHowToUseVisibility_description": "可在此设置帖子的公开范围。",
	"postFormHowToUseMenu_title": "菜单",
	"postFormHowToUseMenu_description": "可在此进行保存草稿、设置定时发帖、设置回应等其它操作。",
	"postFormHowToUseSubmit_title": "发帖按钮",
	"postFormHowToUseSubmit_description": "发布帖子。也可用 Ctrl + Enter / Cmd + Enter 来发帖。",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "还有一些文件尚未上传，要放弃上传并关闭窗口吗？",
	"yes": "是",
	"no": "否"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"account": "帳戶",
	"visibility": "可見性",
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
	"visibilityDisableFederation": "停用聯邦",
	"other": "其他",
	"quoteAttached": "引用",
	"recipient": "收件人",
	"postFormShowHowToUse": "顯示表單說明",
	"scheduleToPostOnX": "排定在 {x} 發布",
	"cancel": "取消",
	"notSpecifiedMentionWarning": "此貼文有未指定的提及",
	"add": "新增",
	"annotation": "註解",
	"hashtags": "標籤",
	"postFormUploaderTip": "檔案尚未上傳。您可以從檔案選單中設定重新命名、裁切圖片、加上浮水印、是否壓縮等選項。檔案會在發布貼文時自動上傳。\n",
	"attachFile": "上傳附件",
	"upload": "上傳",
	"fromDrive": "從雲端空間中選擇",
	"poll": "票選活動",
	"useCw": "隱藏內容",
	"mention": "提及",
	"addMfmFunction": "插入 MFM 功能語法",
	"plugins": "外掛",
	"emoji": "表情符號",
	"postFormQuotePlaceholder": "引用此貼文...",
	"postFormReplyPlaceholder": "回覆此貼文...",
	"postFormChannelPlaceholder": "發佈到頻道",
	"postFormPlaceholdersA": "今天過得如何？",
	"postFormPlaceholdersB": "有什麼新鮮事嗎？",
	"postFormPlaceholdersC": "有什麼新鮮想法嗎？",
	"postFormPlaceholdersD": "想要發佈些什麼嗎？",
	"postFormPlaceholdersE": "寫些什麼吧……",
	"postFormPlaceholdersF": "靜待發文……",
	"schedule": "排定",
	"quote": "引用",
	"reply": "回覆",
	"note": "貼文",
	"disableFederationConfirm": "要停止聯邦功能嗎？",
	"disableFederationConfirmWarn": "即使停止了聯邦功能，貼文也不會變成私密的。在大部分的情況下，沒有必要停止聯邦功能。",
	"disableFederationOk": "停止聯邦功能",
	"neverShow": "不再顯示",
	"reactionAcceptance": "接受表情反應",
	"all": "全部",
	"likeOnlyForRemote": "全部（遠端僅限讚）",
	"nonSensitiveOnly": "僅限非敏感",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "僅限非敏感（遠端僅限讚）",
	"likeOnly": "僅限讚",
	"draftsSaveToDraft": "儲存為草稿",
	"draftsCannotCreateDraft": "無法以此內容建立草稿。\n",
	"schedulePost": "排定發布",
	"preview": "預覽",
	"reset": "重設",
	"resetAreYouSure": "確定要重設嗎？",
	"quoteQuestion": "是否要引用？",
	"attachAsFileQuestion": "剪貼簿的文字較長。請問是否要將其以文字檔的方式附加呢？",
	"thisPostMayBeAnnoying": "這篇貼文可能會造成別人的困擾。",
	"thisPostMayBeAnnoyingHome": "發佈到首頁",
	"thisPostMayBeAnnoyingCancel": "退出",
	"thisPostMayBeAnnoyingIgnore": "直接發佈貼文",
	"draftsListDrafts": "草稿清單",
	"draftsListScheduledNotes": "排定發布列表",
	"postFormHowToUseContent_title": "內文",
	"postFormHowToUseContent_description": "請輸入要發布的內容。",
	"postFormHowToUseToolbar_title": "工具列",
	"postFormHowToUseToolbar_description": "可以附加檔案或票選活動、設定註解與標籤、插入表情符號或提及等。",
	"postFormHowToUseAccount_title": "帳號選單",
	"postFormHowToUseAccount_description": "可以切換要發布的帳號，並查看該帳號所儲存的草稿與預約發布列表。",
	"postFormHowToUseVisibility_title": "可見性",
	"postFormHowToUseVisibility_description": "可以設定貼文的公開範圍。",
	"postFormHowToUseMenu_title": "選單",
	"postFormHowToUseMenu_description": "可以進行其他操作，例如儲存為草稿、預約發佈貼文、或設定反應等。\n",
	"postFormHowToUseSubmit_title": "貼文按鈕",
	"postFormHowToUseSubmit_description": "發布貼文。也可以使用 Ctrl + Enter 或 Cmd + Enter 來發布。",
	"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm": "尚有未上傳的檔案，確定要放棄並關閉表單嗎？",
	"yes": "是",
	"no": "否"
}
</locale>
