<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<Transition :name="prefer.s.animation ? 'fade' : ''" mode="out-in">
			<div v-if="note">
				<div v-if="showNext" class="_margin">
					<MkNotesTimeline direction="up" :withControl="false" :pullToRefresh="false" class="" :paginator="showNext === 'channel' ? nextChannelPaginator : nextUserPaginator" :noGap="true" :forceDisableInfiniteScroll="true" />
				</div>

				<div class="_margin">
					<div v-if="!showNext" class="_buttons" :class="$style.loadNext">
						<MkButton v-if="note.channelId" rounded :class="$style.loadButton" @click="showNext = 'channel'"><i class="ti ti-chevron-up"></i> <i class="ti ti-device-tv"></i></MkButton>
						<MkButton rounded :class="$style.loadButton" @click="showNext = 'user'"><i class="ti ti-chevron-up"></i> <i class="ti ti-user"></i></MkButton>
					</div>
					<div class="_margin _gaps_s">
						<MkRemoteCaution v-if="note.user.host != null" :href="note.url ?? note.uri"/>
						<MkNoteDetailed :key="note.id" v-model:note="note" :initialTab="initialTab" :class="$style.note"/>
					</div>
					<div v-if="clips && clips.length > 0" class="_margin">
						<div style="font-weight: bold; padding: 12px;">{{ $locale.sfc.clip }}</div>
						<div class="_gaps">
							<MkClipPreview v-for="item in clips" :key="item.id" :clip="item"/>
						</div>
					</div>
					<div v-if="!showPrev" class="_buttons" :class="$style.loadPrev">
						<MkButton v-if="note.channelId" rounded :class="$style.loadButton" @click="showPrev = 'channel'"><i class="ti ti-chevron-down"></i> <i class="ti ti-device-tv"></i></MkButton>
						<MkButton rounded :class="$style.loadButton" @click="showPrev = 'user'"><i class="ti ti-chevron-down"></i> <i class="ti ti-user"></i></MkButton>
					</div>
				</div>

				<div v-if="showPrev" class="_margin">
					<MkNotesTimeline :withControl="false" :pullToRefresh="false" class="" :paginator="showPrev === 'channel' ? prevChannelPaginator : prevUserPaginator" :noGap="true"/>
				</div>
			</div>
			<MkError v-else-if="error" @retry="fetchNote()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { host } from '@@/js/config.js';
import MkNoteDetailed from '@features/notes/frontend/components/MkNoteDetailed.vue';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkRemoteCaution from '@features/federation/frontend/components/MkRemoteCaution.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { dateString } from '@features/ui/frontend/filters/date.js';
import MkClipPreview from '@features/collections/frontend/components/MkClipPreview.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';
import { getAppearNote } from '@features/notes/frontend/utility/get-appear-note.js';
import { serverContext, assertServerContext } from '@features/runtime/frontend/server-context.js';
import { $i } from '@features/auth/frontend/i.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

// contextは非ログイン状態の情報しかないためログイン時は利用できない
const CTX_NOTE = !$i && assertServerContext(serverContext, 'note') ? serverContext.note : null;

const props = defineProps<{
	noteId: string;
	initialTab?: string;
}>();

const note = ref<null | Misskey.entities.Note>(CTX_NOTE);
const clips = ref<Misskey.entities.Clip[]>();
const showPrev = ref<'user' | 'channel' | false>(false);
const showNext = ref<'user' | 'channel' | false>(false);
const initialTab = computed<'reactions' | 'replies' | 'renotes' | undefined>(() => {
	if (['reactions', 'replies', 'renotes'].includes(props.initialTab ?? '')) {
		return props.initialTab as 'reactions' | 'replies' | 'renotes';
	}
	return undefined;
});
const error = ref();

const prevUserPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	initialId: props.noteId,
	computedParams: computed(() => note.value ? ({
		userId: note.value.userId,
	}) : undefined),
}));

const nextUserPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	initialId: props.noteId,
	initialDirection: 'newer',
	computedParams: computed(() => note.value ? ({
		userId: note.value.userId,
	}) : undefined),
}));

const prevChannelPaginator = markRaw(new Paginator('channels/timeline', {
	limit: 10,
	initialId: props.noteId,
	computedParams: computed(() => note.value && note.value.channelId != null ? ({
		channelId: note.value.channelId,
	}) : undefined),
}));

const nextChannelPaginator = markRaw(new Paginator('channels/timeline', {
	limit: 10,
	initialId: props.noteId,
	initialDirection: 'newer',
	computedParams: computed(() => note.value && note.value.channelId != null ? ({
		channelId: note.value.channelId,
	}) : undefined),
}));

function fetchNote() {
	showPrev.value = false;
	showNext.value = false;
	note.value = null;

	if (CTX_NOTE && CTX_NOTE.id === props.noteId) {
		note.value = CTX_NOTE;
		return;
	}

	misskeyApi('notes/show', {
		noteId: props.noteId,
	}).then(res => {
		note.value = res;
		const appearNote = getAppearNote(res) ?? res;
		// 古いノートは被クリップ数をカウントしていないので、2023-10-01以前のものは強制的にnotes/clipsを叩く
		if ((appearNote.clippedCount ?? 0) > 0 || new Date(appearNote.createdAt).getTime() < new Date('2023-10-01').getTime()) {
			misskeyApi('notes/clips', {
				noteId: appearNote.id,
			}).then((_clips) => {
				clips.value = _clips;
			});
		}
	}).catch(err => {
		if (['fbcc002d-37d9-4944-a6b0-d9e29f2d33ab', '145f88d2-b03d-4087-8143-a78928883c4b'].includes(err.id)) {
			pleaseLogin({
				path: '/',
				message: err.id === 'fbcc002d-37d9-4944-a6b0-d9e29f2d33ab' ? $locale.value.sfc.thisContentsAreMarkedAsSigninRequiredByAuthor : $locale.value.sfc.signinOrContinueOnRemote,
				openOnRemote: {
					type: 'lookup',
					url: `https://${host}/notes/${props.noteId}`,
				},
			});
		}
		error.value = err;
	});
}

watch(() => props.noteId, fetchNote, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.note,
	...note.value ? {
		subtitle: dateString(note.value.createdAt),
		avatar: note.value.user,
		path: `/notes/${note.value.id}`,
		share: {
			title: interpolateLocaleParameters($locale.value.sfc.noteOf, { user: note.value.user.name ?? note.value.user.username }),
			text: note.value.text,
		},
	} : {},
}));
</script>

<style lang="scss" module>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.loadNext,
.loadPrev {
	justify-content: center;
}

.loadNext {
	margin-bottom: var(--MI-margin);
}

.loadPrev {
	margin-top: var(--MI-margin);
}

.loadButton {
	min-width: 0;
}

.note {
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "ملاحظة",
	"noteOf": "ملاحظات {user}",
	"clip": "مِشبك"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "L'autor requereix l'inici de sessió per poder veure",
	"signinOrContinueOnRemote": "Per continuar necessites moure el teu servidor o registrar-te / iniciar sessió en aquest servidor.",
	"note": "Nota",
	"noteOf": "Publicació de: {user}",
	"clip": "Retalls"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Poznámka",
	"noteOf": "{user} poznámky",
	"clip": "Oříznout"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Logge dich ein, um weitere Inhalte von diesem Nutzer zu sehen.",
	"signinOrContinueOnRemote": "Um fortzufahren, gehe zu deiner Instanz oder registriere bzw. melde dich an dieser Instanz an. ",
	"note": "Notiz",
	"noteOf": "Notiz von {user}",
	"clip": "Clip erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": " Establecido por el autor: requiere iniciar  sesión para ver",
	"signinOrContinueOnRemote": "Para continuar, tendrá que ir a su servidor o registrarse e iniciar sesión en este servidor",
	"note": "Nota",
	"noteOf": "Notas de {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Notes de {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Penulis mengatur konten ini hanya bisa dilihat setelah masuk",
	"signinOrContinueOnRemote": "Untuk melanjutkan, anda perlu berpindah peladen atau mendaftar / masuk ke peladen ini.",
	"note": "Catatan",
	"noteOf": "Catatan milik {user}",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "L'autore richiede di iscriversi per vedere il contenuto",
	"signinOrContinueOnRemote": "Per continuare, devi accedere alla tua istanza o registrarti su questa e poi accedere",
	"note": "Nota",
	"noteOf": "Note di {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "投稿者により、表示にはログインが必要と設定されています",
	"signinOrContinueOnRemote": "続行するには、お使いのサーバーに移動するか、このサーバーに登録・ログインする必要があります",
	"note": "ノート",
	"noteOf": "{user}のノート",
	"clip": "クリップ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "投稿者が、表示にログインが要るって設定してるで",
	"signinOrContinueOnRemote": "続行するには、お使いのサーバーに移動するか、このサーバーに登録・ログインする必要があるで",
	"note": "ノート",
	"noteOf": "{user}はんのノート",
	"clip": "クリップ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "게시자에 의해 로그인해야 볼 수 있도록 설정되어 있습니다.",
	"signinOrContinueOnRemote": "계속하려면 사용하는 서버로 이동하거나 이 서버에 로그인해야 합니다.",
	"note": "노트",
	"noteOf": "{user}의 노트",
	"clip": "클립"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "Ga naar je eigen instantie of registreer je/log in op deze server om door te gaan.",
	"note": "Notitie",
	"noteOf": "Notitie van {user}",
	"clip": "Clip aanmaken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Utwórz wpis",
	"noteOf": "Wpisy {user}",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "O autor exige que você esteja cadastrado para ver",
	"signinOrContinueOnRemote": "Para continuar, você precisa mover o seu servidor ou entrar/cadastrar-se nesse servidor.",
	"note": "Publicar",
	"noteOf": "Publicação de {user}",
	"clip": "Clipe"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Автор сообщения установил требование в виде авторизации для просмотра",
	"signinOrContinueOnRemote": "Чтобы продолжить, вам необходимо войти в аккаунт на своём сервере или зарегистрироваться / войти в аккаунт на этом.",
	"note": "Заметка",
	"noteOf": "Что пишет {user}",
	"clip": "Подборка"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Poznámka",
	"noteOf": "Poznámky používateľa {user}",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "ผู้โพสต์ได้ตั้งค่าว่าต้องเข้าสู่ระบบจึงจะสามารถดูได้",
	"signinOrContinueOnRemote": "เพื่อดำเนินการต่อได้ คุณต้องไปที่เซิร์ฟเวอร์ที่คุณใช้งานอยู่ หรือลงทะเบียน/เข้าสู่ระบบเซิร์ฟเวอร์นี้",
	"note": " โน้ต",
	"noteOf": "โน้ตของ {user}",
	"clip": "คลิป"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Yazar tarafından görüntülemek için oturum açma gerektirir.",
	"signinOrContinueOnRemote": "Devam etmek için sunucunuzu taşıyın veya bu sunucuya kaydolun / giriş yapın.",
	"note": "Not",
	"noteOf": "{user} not'u",
	"clip": "Klip"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "To continue, you need to move your server or sign up / log in to this server.",
	"note": "Note",
	"noteOf": "Note by {user}",
	"clip": "Clip"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Автор встановив необхідність авторизації для перегляду",
	"signinOrContinueOnRemote": "Щоб продовжити, потрібно перейти на свій сервер або зареєструватися / увійти на цей сервер.",
	"note": "Запис",
	"noteOf": "Нотатка {user}",
	"clip": "Добірка"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "Set by the author to require login to view",
	"signinOrContinueOnRemote": "Để tiếp tục, bạn cần chuyển máy chủ hoặc đăng nhập/đăng ký ở máy chủ này.",
	"note": "Bài viết",
	"noteOf": "Tút của {user}",
	"clip": "Lưu bài viết"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "根据发帖者的设定，需要登录才能显示",
	"signinOrContinueOnRemote": "若要继续，需要转到您所使用的实例，或者在此服务器上注册或登录。",
	"note": "发帖",
	"noteOf": "{user} 的帖子",
	"clip": "便签"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"thisContentsAreMarkedAsSigninRequiredByAuthor": "作者將其設定為需要登入才能顯示。",
	"signinOrContinueOnRemote": "若要繼續，需前往您所在的伺服器，或者註冊並登入此伺服器",
	"note": "貼文",
	"noteOf": "{user}的貼文",
	"clip": "摘錄"
}
</locale>
