<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkPostForm
			v-if="state === 'writing'"
			fixed
			:instant="true"
			:initialText="initialText"
			:initialVisibility="visibility"
			:initialFiles="files"
			:initialLocalOnly="localOnly"
			:reply="reply"
			:renote="renote"
			:initialVisibleUsers="visibleUsers"
			class="_panel"
			@posted="onPosted"
		/>
		<div v-else-if="state === 'posted'" class="_buttonsCenter">
			<MkButton primary @click="close">{{ $locale.sfc.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ $locale.sfc.goToMisskey }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
// SPECIFICATION: https://misskey-hub.net/docs/for-users/features/share-form/

import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkPostForm from '@features/notes/frontend/components/MkPostForm.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { postMessageToParentWindow } from '@features/web/frontend/utility/post-message.js';

const urlParams = new URLSearchParams(window.location.search);
const localOnlyQuery = urlParams.get('localOnly');
const visibilityQuery = urlParams.get('visibility') as typeof Misskey.noteVisibilities[number];

const state = ref<'fetching' | 'writing' | 'posted'>('fetching');
const title = ref(urlParams.get('title'));
const text = urlParams.get('text');
const url = urlParams.get('url');
const initialText = ref<string | undefined>();
const reply = ref<Misskey.entities.Note | undefined>();
const renote = ref<Misskey.entities.Note | undefined>();
const visibility = ref(Misskey.noteVisibilities.includes(visibilityQuery) ? visibilityQuery : undefined);
const localOnly = ref(localOnlyQuery === '0' ? false : localOnlyQuery === '1' ? true : undefined);
const files = ref([] as Misskey.entities.DriveFile[]);
const visibleUsers = ref([] as Misskey.entities.UserDetailed[]);

async function init() {
	let noteText = '';
	if (title.value) {
		noteText += `[ ${title.value} ]\n`;

		//#region add text to note text
		if (text?.startsWith(title.value)) {
			// For the Google app https://github.com/misskey-dev/misskey/issues/16224
			noteText += text.replace(title.value, '').trimStart();
		} else if (text) {
			noteText += `${text}\n`;
		}
		//#endregion
	} else if (text) {
		noteText += `${text}\n`;
	}

	if (url) {
		try {
			// Normalize the URL to URL-encoded and puny-coded from with the URL constructor.
			//
			// It's common to use unicode characters in the URL for better visibility of URL
			//     like: https://ja.wikipedia.org/wiki/ミスキー
			//  or like: https://藍.moe/
			// However, in the MFM, the unicode characters must be URL-encoded to be parsed as `url` node
			//     like: https://ja.wikipedia.org/wiki/%E3%83%9F%E3%82%B9%E3%82%AD%E3%83%BC
			//  or like: https://xn--931a.moe/
			// Therefore, we need to normalize the URL to URL-encoded form.
			//
			// The URL constructor will parse the URL and normalize unicode characters
			//   in the host to punycode and in the path component to URL-encoded form.
			//   (see url.spec.whatwg.org)
			//
			// In addition, the current MFM renderer decodes the URL-encoded path and / punycode encoded host name so
			//   this normalization doesn't make the visible URL ugly.
			//   (see MkUrl.vue)

			noteText += new URL(url).href;
		} catch {
			// fallback to original URL if the URL is invalid.
			// note that this is extremely rare since the `url` parameter is designed to share a URL and
			// the URL constructor will throw TypeError only if failure, which means the URL is not valid.
			noteText += url;
		}
	}
	initialText.value = noteText.trim();

	if (visibility.value === 'specified') {
		const visibleUserIds = urlParams.get('visibleUserIds');
		const visibleAccts = urlParams.get('visibleAccts');
		await Promise.all(
			[
				...(visibleUserIds ? visibleUserIds.split(',').map(userId => ({ userId })) : []),
				...(visibleAccts ? visibleAccts.split(',').map(Misskey.acct.parse) : []),
			]
			// @ts-expect-error payloadの引数側の型が正常に解決されない
				.map(q => misskeyApi('users/show', q)
					.then(user => {
						visibleUsers.value.push(user);
					}, () => {
						console.error(`Invalid user query: ${JSON.stringify(q)}`);
					}),
				),
		);
	}

	try {
		//#region Reply
		const replyId = urlParams.get('replyId');
		const replyUri = urlParams.get('replyUri');
		if (replyId) {
			reply.value = await misskeyApi('notes/show', {
				noteId: replyId,
			});
		} else if (replyUri) {
			const obj = await misskeyApi('ap/show', {
				uri: replyUri,
			});
			if (obj.type === 'Note') {
				reply.value = obj.object;
			}
		}
		//#endregion

		//#region Renote
		const renoteId = urlParams.get('renoteId');
		const renoteUri = urlParams.get('renoteUri');
		if (renoteId) {
			renote.value = await misskeyApi('notes/show', {
				noteId: renoteId,
			});
		} else if (renoteUri) {
			const obj = await misskeyApi('ap/show', {
				uri: renoteUri,
			});
			if (obj.type === 'Note') {
				renote.value = obj.object;
			}
		}
		//#endregion

		//#region Drive files
		const fileIds = urlParams.get('fileIds');
		if (fileIds) {
			await Promise.all(
				fileIds.split(',')
					.map(fileId => misskeyApi('drive/files/show', { fileId })
						.then(file => {
							files.value.push(file);
						}, () => {
							console.error(`Failed to fetch a file ${fileId}`);
						}),
					),
			);
		}
		//#endregion
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: err.message,
			text: err.name,
		});
	}

	state.value = 'writing';
}

init();

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		window.location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	window.location.href = '/';
}

function onPosted(): void {
	state.value = 'posted';
	postMessageToParentWindow('misskey:shareForm:shareCompleted');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.share,
	icon: 'ti ti-share',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"close": "اغلق",
	"goToMisskey": "لميسكي",
	"share": "شارِك"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"close": "Tanca",
	"goToMisskey": "Ves a Misskey",
	"share": "Comparteix"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"close": "Zavřít",
	"goToMisskey": "Jít na Misskey",
	"share": "Sdílet"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"share": "Share"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"close": "Schließen",
	"goToMisskey": "Zu Misskey",
	"share": "Teilen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"share": "Share"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"close": "Cerrar",
	"goToMisskey": "ir a Misskey",
	"share": "Compartir"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"close": "Fermer",
	"goToMisskey": "Retour vers Misskey",
	"share": "Partager"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"close": "Tutup",
	"goToMisskey": "Ke Misskey",
	"share": "Bagikan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"close": "Chiudi",
	"goToMisskey": "Vai a Misskey",
	"share": "Condividi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"close": "閉じる",
	"goToMisskey": "Misskeyへ",
	"share": "共有"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"close": "さいなら",
	"goToMisskey": "Misskeyへ",
	"share": "わけわけ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"share": "Share"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"share": "Share"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"close": "닫기",
	"goToMisskey": "Misskey로",
	"share": "공유"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"close": "Sluiten",
	"goToMisskey": "To Misskey",
	"share": "Delen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"close": "Lukk",
	"goToMisskey": "To Misskey",
	"share": "Del"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"close": "Zamknij",
	"goToMisskey": "To Misskey",
	"share": "Udostępnij"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"close": "Fechar",
	"goToMisskey": "Ao Misskey",
	"share": "Compartilhar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"close": "Закрыть",
	"goToMisskey": "К Misskey",
	"share": "Поделиться"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"close": "Zavrieť",
	"goToMisskey": "To Misskey",
	"share": "Zdieľať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"close": "ปิด",
	"goToMisskey": "ถึง Misskey",
	"share": "แบ่งปัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"close": "Kapat",
	"goToMisskey": "Misskey'e",
	"share": "Paylaş"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"share": "Share"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"close": "Закрити",
	"goToMisskey": "До Misskey",
	"share": "Поділитись"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"close": "Đóng",
	"goToMisskey": "Tới Misskey",
	"share": "Chia sẻ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"close": "关闭",
	"goToMisskey": "去往 Misskey",
	"share": "分享"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"close": "關閉",
	"goToMisskey": "往 Misskey",
	"share": "分享"
}
</locale>
