<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="channel && tab === 'overview'" class="_gaps">
			<div class="_panel" :class="$style.bannerContainer">
				<XChannelFollowButton :channel="channel" :full="true" :class="$style.subscribe"/>
				<MkButton v-if="favorited" v-tooltip="globalLocale.env.unfavorite" asLike class="button" rounded primary :class="$style.favorite" @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
				<MkButton v-else v-tooltip="globalLocale.env.favorite" asLike class="button" rounded :class="$style.favorite" @click="favorite()"><i class="ti ti-star"></i></MkButton>
				<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : undefined }" :class="$style.banner">
					<div :class="$style.bannerStatus">
						<div><i class="ti ti-users ti-fw"></i><I18n :src="$locale.sfc.channelUsersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
						<div><i class="ti ti-pencil ti-fw"></i><I18n :src="$locale.sfc.channelNotesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
						<div v-if="$i != null && channel != null && $i.id === channel.userId" style="color: var(--MI_THEME-warn)"><i class="ti ti-user-star ti-fw"></i><span style="margin-left: 4px;">{{ $locale.sfc.youAreAdmin }}</span></div>
					</div>
					<div v-if="channel.isSensitive" :class="$style.sensitiveIndicator">{{ globalLocale.env.sensitive }}</div>
					<div :class="$style.bannerFade"></div>
				</div>
				<div v-if="channel.description" :class="$style.description">
					<Mfm :text="channel.description" :isNote="false"/>
				</div>
			</div>

			<MkFoldableSection>
				<template #header><i class="ti ti-pin ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.pinnedNotes }}</template>
				<div v-if="channel.pinnedNotes && channel.pinnedNotes.length > 0" class="_gaps">
					<MkNote v-for="note in channel.pinnedNotes" :key="note.id" class="_panel" :note="note"/>
				</div>
			</MkFoldableSection>
		</div>
		<div v-if="channel && tab === 'timeline'" class="_gaps">
			<MkInfo v-if="channel.isArchived" warn>{{ $locale.sfc.thisChannelArchived }}</MkInfo>

			<!-- スマホ・タブレットの場合、キーボードが表示されると投稿が見づらくなるので、デスクトップ場合のみ自動でフォーカスを当てる -->
			<MkPostForm v-if="$i && prefer.r.showFixedPostFormInChannel.value" :channel="channel" class="post-form _panel" fixed :autofocus="deviceKind === 'desktop'"/>

			<MkStreamingNotesTimeline :key="channelId" src="channel" :channel="channelId"/>
		</div>
		<div v-else-if="tab === 'featured'">
			<MkNotesTimeline :paginator="featuredPaginator"/>
		</div>
		<div v-else-if="tab === 'search'">
			<div v-if="notesSearchAvailable" class="_gaps">
				<div>
					<MkInput v-model="searchQuery" @enter="search()">
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>
					<MkButton primary rounded style="margin-top: 8px;" @click="search()">{{ globalLocale.env.search }}</MkButton>
				</div>
				<MkNotesTimeline v-if="searchPaginator" :key="searchKey" :paginator="searchPaginator"/>
			</div>
			<div v-else>
				<MkInfo warn>{{ $locale.sfc.notesSearchNotAvailable }}</MkInfo>
			</div>
		</div>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<div class="_buttonsCenter">
					<MkButton inline rounded primary gradate @click="openPostForm()"><i class="ti ti-pencil"></i> {{ $locale.sfc.postToTheChannel }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, watch, ref, markRaw, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import MkPostForm from '@features/notes/frontend/components/MkPostForm.vue';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import XChannelFollowButton from '@features/channels/frontend/components/MkChannelFollowButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { $i, iAmModerator } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import { favoritedChannelsCache } from '@features/runtime/frontend/cache.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { isSupportShare } from '@features/navigation/frontend/utility/navigator.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { notesSearchAvailable } from '@features/roles/frontend/utility/check-permissions.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const props = defineProps<{
	channelId: string;
}>();

const tab = ref('overview');

const channel = ref<Misskey.entities.Channel | null>(null);
const favorited = ref(false);
const searchQuery = ref('');
const searchPaginator = shallowRef();
const searchKey = ref('');
const featuredPaginator = markRaw(new Paginator('notes/featured', {
	limit: 10,
	computedParams: computed(() => ({
		channelId: props.channelId,
	})),
}));

useInterval(() => {
	if (channel.value == null) return;
	miLocalStorage.setItemAsJson(`channelLastReadedAt:${channel.value.id}`, Date.now());
}, 3000, {
	immediate: true,
	afterMounted: true,
});

watch(() => props.channelId, async () => {
	const _channel = await misskeyApi('channels/show', {
		channelId: props.channelId,
	});

	favorited.value = _channel.isFavorited ?? false;
	if (favorited.value || _channel.isFollowing) {
		tab.value = 'timeline';
	}

	if ((favorited.value || _channel.isFollowing) && _channel.lastNotedAt) {
		const lastReadedAt: number = miLocalStorage.getItemAsJson(`channelLastReadedAt:${_channel.id}`) ?? 0;
		const lastNotedAt = Date.parse(_channel.lastNotedAt);

		if (lastNotedAt > lastReadedAt) {
			miLocalStorage.setItemAsJson(`channelLastReadedAt:${_channel.id}`, lastNotedAt);
		}
	}

	channel.value = _channel;
}, { immediate: true });

function edit() {
	router.push('/channels/:channelId/edit', {
		params: {
			channelId: props.channelId,
		},
	});
}

function openPostForm() {
	os.post({
		channel: channel.value,
	});
}

function favorite() {
	if (!channel.value) return;

	os.apiWithDialog('channels/favorite', {
		channelId: channel.value.id,
	}).then(() => {
		favorited.value = true;
		favoritedChannelsCache.delete();
	});
}

async function unfavorite() {
	if (!channel.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('channels/unfavorite', {
		channelId: channel.value.id,
	}).then(() => {
		favorited.value = false;
		favoritedChannelsCache.delete();
	});
}

async function mute() {
	if (!channel.value) return;
	const _channel = channel.value;

	const { canceled, result: period } = await os.select({
		title: $locale.value.sfc.mutePeriod,
		items: [{
			value: 'indefinitely', label: globalLocale.value.env.indefinitely,
		}, {
			value: 'tenMinutes', label: $locale.value.sfc.tenMinutes,
		}, {
			value: 'oneHour', label: globalLocale.value.env.oneHour,
		}, {
			value: 'oneDay', label: globalLocale.value.env.oneDay,
		}, {
			value: 'oneWeek', label: globalLocale.value.env.oneWeek,
		}],
		default: 'indefinitely',
	});
	if (canceled) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'tenMinutes' ? Date.now() + (1000 * 60 * 10)
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: null;

	os.apiWithDialog('channels/mute/create', {
		channelId: _channel.id,
		expiresAt,
	}).then(() => {
		_channel.isMuting = true;
	});
}

async function unmute() {
	if (!channel.value) return;
	const _channel = channel.value;

	os.apiWithDialog('channels/mute/delete', {
		channelId: _channel.id,
	}).then(() => {
		_channel.isMuting = false;
	});
}

async function search() {
	if (!channel.value) return;

	const query = searchQuery.value.toString().trim();

	if (query == null) return;

	searchPaginator.value = markRaw(new Paginator('notes/search', {
		limit: 10,
		params: {
			query: query,
			channelId: channel.value.id,
		},
	}));

	searchKey.value = query;
}

const headerActions = computed(() => {
	if (channel.value) {
		const headerItems: PageHeaderItem[] = [];

		headerItems.push({
			icon: 'ti ti-link',
			text: globalLocale.value.env.copyUrl,
			handler: async (): Promise<void> => {
				if (!channel.value) {
					console.warn('failed to copy channel URL. channel.value is null.');
					return;
				}
				copyToClipboard(`${url}/channels/${channel.value.id}`);
			},
		});

		if (isSupportShare()) {
			headerItems.push({
				icon: 'ti ti-share',
				text: globalLocale.value.env.share,
				handler: async (): Promise<void> => {
					if (!channel.value) {
						console.warn('failed to share channel. channel.value is null.');
						return;
					}

					navigator.share({
						title: channel.value.name,
						text: channel.value.description ?? undefined,
						url: `${url}/channels/${channel.value.id}`,
					});
				},
			});
		}

		if (!channel.value.isMuting) {
			headerItems.push({
				icon: 'ti ti-volume',
				text: globalLocale.value.env.mute,
				handler: async (): Promise<void> => {
					await mute();
				},
			});
		} else {
			headerItems.push({
				icon: 'ti ti-volume-off',
				text: $locale.value.sfc.unmute,
				handler: async (): Promise<void> => {
					await unmute();
				},
			});
		}

		if (($i && $i.id === channel.value.userId) || iAmModerator) {
			headerItems.push({
				icon: 'ti ti-settings',
				text: globalLocale.value.env.edit,
				handler: edit,
			});
		}

		return headerItems.length > 0 ? headerItems : null;
	} else {
		return null;
	}
});

const headerTabs = computed(() => [{
	key: 'overview',
	title: globalLocale.value.env.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'timeline',
	title: globalLocale.value.env.timeline,
	icon: 'ti ti-home',
}, {
	key: 'featured',
	title: $locale.value.sfc.featured,
	icon: 'ti ti-bolt',
}, {
	key: 'search',
	title: globalLocale.value.env.search,
	icon: 'ti ti-search',
}]);

definePage(() => ({
	title: channel.value ? channel.value.name : globalLocale.value.env.channel,
	icon: 'ti ti-device-tv',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.bannerContainer {
	position: relative;
}

.subscribe {
	position: absolute;
	z-index: 1;
	top: 16px;
	left: 16px;
}

.favorite {
	position: absolute;
	z-index: 1;
	top: 16px;
	right: 16px;
}

.banner {
	position: relative;
	height: 200px;
	background-position: center;
	background-size: cover;
}

.bannerFade {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));
}

.bannerStatus {
	position: absolute;
	z-index: 1;
	bottom: 16px;
	right: 16px;
	padding: 8px 12px;
	font-size: 80%;
	background: rgba(0, 0, 0, 0.7);
	border-radius: 6px;
	color: #fff;
}

.description {
	padding: 16px;
}

.sensitiveIndicator {
	position: absolute;
	z-index: 1;
	bottom: 16px;
	left: 16px;
	background: rgba(0, 0, 0, 0.7);
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	font-weight: bold;
	font-size: 1em;
	padding: 4px 7px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"channelUsersCount": "{n} منتسب",
	"channelNotesCount": "{n} ملاحظة",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "ملاحظة مثبتة",
	"thisChannelArchived": "أُرشفت هذه القناة.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "انشر في قناة",
	"unfavoriteConfirm": "أتريد إزالتها من المفضلة؟",
	"mutePeriod": "مدة الكتم",
	"tenMinutes": "10 دقائق",
	"unmute": "إلغاء الكتم",
	"featured": "المتداولة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "Ets l'administrador ",
	"pinnedNotes": "Nota fixada",
	"thisChannelArchived": "Aquest Canal ha sigut arxivat.",
	"notesSearchNotAvailable": "La cerca de notes no es troba disponible.",
	"postToTheChannel": "Publicar a un Canal",
	"unfavoriteConfirm": "Esborrar dels favorits?",
	"mutePeriod": "Duració del silenci",
	"tenMinutes": "10 minuts",
	"unmute": "Deixa de silenciar",
	"featured": "Destacat"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"channelUsersCount": "{n} Účastníků",
	"channelNotesCount": "{n} Poznámek",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Připnutá poznámka",
	"thisChannelArchived": "Tenhle kanál je archivovaný",
	"notesSearchNotAvailable": "Vyhledávání poznámek je nedostupné.",
	"postToTheChannel": "Vložit do kanálu",
	"unfavoriteConfirm": "Opravdu chcete odstranit z oblíbených?",
	"mutePeriod": "Délka ztlumení",
	"tenMinutes": "10 minut",
	"unmute": "Odmlčet",
	"featured": "Oblíbené poznámky"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Unmute",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"channelUsersCount": "{n} Teilnehmer",
	"channelNotesCount": "{n} Notizen",
	"youAreAdmin": "Sie sind ein Administrator",
	"pinnedNotes": "Angeheftete Notizen",
	"thisChannelArchived": "Dieser Kanal wurde archiviert.",
	"notesSearchNotAvailable": "Die Notizsuche ist nicht verfügbar.",
	"postToTheChannel": "In Kanal senden",
	"unfavoriteConfirm": "Wirklich aus Favoriten entfernen?",
	"mutePeriod": "Stummschaltungsdauer",
	"tenMinutes": "10 Minuten",
	"unmute": "Stummschaltung aufheben",
	"featured": "Beliebt"
}
</locale>

<locale lang="json" locale="en-US">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Unmute",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"channelUsersCount": "{n} participantes",
	"channelNotesCount": "{n} notas",
	"youAreAdmin": "Eres administrador.",
	"pinnedNotes": "Nota fijada",
	"thisChannelArchived": "El canal ha sido archivado.",
	"notesSearchNotAvailable": "No se puede buscar una nota",
	"postToTheChannel": "Publicar en el canal",
	"unfavoriteConfirm": "¿Desea quitar de favoritos?",
	"mutePeriod": "Período de silenciamiento",
	"tenMinutes": "10 minutos",
	"unmute": "Dejar de silenciar",
	"featured": "Destacados"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"channelUsersCount": "{n} Participant·e·s",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Note épinglée",
	"thisChannelArchived": "Ce canal a été archivé.",
	"notesSearchNotAvailable": "La recherche de notes n'est pas disponible.",
	"postToTheChannel": "Publier au canal",
	"unfavoriteConfirm": "Vraiment supprimer des favoris ?",
	"mutePeriod": "Durée de mise en sourdine",
	"tenMinutes": "10 minutes",
	"unmute": "Ne plus masquer",
	"featured": "Tendances"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"channelUsersCount": "{n} Partisipan",
	"channelNotesCount": "terdapat {n} catatan",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Catatan yang disematkan",
	"thisChannelArchived": "Kanal ini telah diarsipkan.",
	"notesSearchNotAvailable": "Pencarian catatan tidak tersedia.",
	"postToTheChannel": "Buat Catatan ke Kanal",
	"unfavoriteConfirm": "Yakin ingin menghapusnya dari favorit?",
	"mutePeriod": "Batas waktu bisu",
	"tenMinutes": "10 Menit",
	"unmute": "Hapus bisukan",
	"featured": "Sorotan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"channelUsersCount": "{n} partecipanti",
	"channelNotesCount": "{n} note",
	"youAreAdmin": "Sei un amministratore",
	"pinnedNotes": "Note in primo piano",
	"thisChannelArchived": "Questo canale è stato archiviato.",
	"notesSearchNotAvailable": "Non è possibile cercare tra le Note.",
	"postToTheChannel": "Pubblica nel canale",
	"unfavoriteConfirm": "Vuoi davvero rimuovere la preferenza?",
	"mutePeriod": "Durata del mute",
	"tenMinutes": "10 minuti",
	"unmute": "Dai voce",
	"featured": "In evidenza"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"channelUsersCount": "{n}人が参加中",
	"channelNotesCount": "{n}投稿があります",
	"youAreAdmin": "あなたは管理者です",
	"pinnedNotes": "ピン留めされたノート",
	"thisChannelArchived": "このチャンネルはアーカイブされています。",
	"notesSearchNotAvailable": "ノート検索は利用できません。",
	"postToTheChannel": "チャンネルに投稿",
	"unfavoriteConfirm": "お気に入り解除しますか？",
	"mutePeriod": "ミュートする期限",
	"tenMinutes": "10分",
	"unmute": "ミュート解除",
	"featured": "ハイライト"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"channelUsersCount": "{n}人が参加しとる",
	"channelNotesCount": "{n}こ投稿があるで",
	"youAreAdmin": "あんた、管理者やで",
	"pinnedNotes": "ピン留めされとるノート",
	"thisChannelArchived": "このチャンネル、アーカイブされとるで。",
	"notesSearchNotAvailable": "なんかノート探せへん。",
	"postToTheChannel": "チャンネルに投稿",
	"unfavoriteConfirm": "ほんまに気に入らんの？",
	"mutePeriod": "ミュートする期間",
	"tenMinutes": "10分",
	"unmute": "ミュートやめたる",
	"featured": "ハイライト"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Unmute",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Unmute",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"channelUsersCount": "{n}명 참여 중",
	"channelNotesCount": "{n}노트",
	"youAreAdmin": "당신은 관리자입니다.",
	"pinnedNotes": "고정된 노트",
	"thisChannelArchived": "이 채널은 보존되었습니다.",
	"notesSearchNotAvailable": "노트 검색을 이용하실 수 없습니다.",
	"postToTheChannel": "채널에 게시하기",
	"unfavoriteConfirm": "즐겨찾기를 해제하시겠습니까?",
	"mutePeriod": "뮤트할 기간",
	"tenMinutes": "10분",
	"unmute": "뮤트 해제",
	"featured": "유행"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Vastgemaakte notitie",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Stop dempen",
	"featured": "Uitgelicht"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Festet Note",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutter",
	"unmute": "Vis",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"channelUsersCount": "{n} uczestnicy",
	"channelNotesCount": "{n} wpisy",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Przypięty wpis",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Publikuj na kanale",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Okres wyciszenia",
	"tenMinutes": "10 minut",
	"unmute": "Cofnij wyciszenie",
	"featured": "Wyróżnione"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"channelUsersCount": "{n} usuários ativos",
	"channelNotesCount": "{n} notas",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Post fixado",
	"thisChannelArchived": "Esse canal foi arquivado.",
	"notesSearchNotAvailable": "A pesquisa de notas está indisponível.",
	"postToTheChannel": "Publicar ao canal",
	"unfavoriteConfirm": "Deseja realmente remover dos favoritos?",
	"mutePeriod": "Duração de silenciamento",
	"tenMinutes": "10 minutos",
	"unmute": "Desmutar",
	"featured": "Destaques"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"channelUsersCount": "Участников: {n}",
	"channelNotesCount": "Заметок: {n}",
	"youAreAdmin": "Вы администратор",
	"pinnedNotes": "Закреплённая заметка",
	"thisChannelArchived": "Этот канал находится в архиве.",
	"notesSearchNotAvailable": "Поиск заметок недоступен",
	"postToTheChannel": "Отправить в канал",
	"unfavoriteConfirm": "Удалить избранное?",
	"mutePeriod": "Продолжительность скрытия",
	"tenMinutes": "10 минут",
	"unmute": "Отменить скрытие",
	"featured": "Горячее"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"channelUsersCount": "{n} účastníkov",
	"channelNotesCount": "{n} poznámok",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pripnuté poznámky",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Trvanie stíšenia",
	"tenMinutes": "10 minút",
	"unmute": "Zapnúť zvuk",
	"featured": "Obľúbené poznámky"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"channelUsersCount": "{n} ผู้เข้าร่วม",
	"channelNotesCount": "มี {n} โน้ต",
	"youAreAdmin": "คุณคือผู้ดูแลระบบ",
	"pinnedNotes": "โน้ตที่ปักหมุดไว้",
	"thisChannelArchived": "ช่องนี้ถูกเก็บถาวรแล้วนะ",
	"notesSearchNotAvailable": "การค้นหาโน้ตไม่พร้อมใช้งาน",
	"postToTheChannel": "โพสต์ลงช่อง",
	"unfavoriteConfirm": "ลบออกจากรายการโปรดแน่ใจหรอ?",
	"mutePeriod": "ระยะเวลาปิดเสียง",
	"tenMinutes": "10 นาที",
	"unmute": "ยกเลิกการปิดเสียง",
	"featured": "ไฮไลท์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"channelUsersCount": "{n} Katılımcılar",
	"channelNotesCount": "{n} Notlar",
	"youAreAdmin": "Siz yöneticisiniz.",
	"pinnedNotes": "Sabitlenmiş notlar",
	"thisChannelArchived": "Bu kanal arşivlenmiş.",
	"notesSearchNotAvailable": "Not arama özelliği kullanılamıyor.",
	"postToTheChannel": "Kanalına gönder",
	"unfavoriteConfirm": "Cidden favorilerden kaldırmak istiyor musunuz?",
	"mutePeriod": "Sessiz kalma süresi",
	"tenMinutes": "10 dakika",
	"unmute": "sesi aç",
	"featured": "Öne çıkan"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"tenMinutes": "10 minutes",
	"unmute": "Unmute",
	"featured": "Featured"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"channelUsersCount": "{n} учасників",
	"channelNotesCount": "{n} дописів",
	"youAreAdmin": "Ви адмін",
	"pinnedNotes": "Закріплена нотатка",
	"thisChannelArchived": "Цей канал заархівовано.",
	"notesSearchNotAvailable": "Пошук нотаток недоступний.",
	"postToTheChannel": "Опублікувати в каналі",
	"unfavoriteConfirm": "Справді видалити з обраного?",
	"mutePeriod": "Тривалість приховування",
	"tenMinutes": "10 хвилин",
	"unmute": "Показувати",
	"featured": "Популярні"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"channelUsersCount": "{n} Thành viên",
	"channelNotesCount": "{n} Tút",
	"youAreAdmin": "You are admin",
	"pinnedNotes": "Bài viết đã ghim",
	"thisChannelArchived": "Kênh này đã được lưu trữ.",
	"notesSearchNotAvailable": "Tìm kiếm bài đăng hiện không khả dụng.",
	"postToTheChannel": "Đăng lên kênh",
	"unfavoriteConfirm": "Bạn thực sự muốn xoá khỏi mục yêu thích?",
	"mutePeriod": "Thời hạn ẩn",
	"tenMinutes": "10 phút",
	"unmute": "Bỏ ẩn",
	"featured": "Nổi bật"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"channelUsersCount": "{n} 人参与",
	"channelNotesCount": "{n} 篇帖子",
	"youAreAdmin": "你是管理员",
	"pinnedNotes": "置顶的帖子",
	"thisChannelArchived": "该频道已被归档。",
	"notesSearchNotAvailable": "帖子检索不可用",
	"postToTheChannel": "发布到频道",
	"unfavoriteConfirm": "确定要取消收藏吗？",
	"mutePeriod": "隐藏时长",
	"tenMinutes": "10分钟",
	"unmute": "取消隐藏",
	"featured": "热门"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"channelUsersCount": "有 {n} 人參與",
	"channelNotesCount": "有 {n} 篇貼文",
	"youAreAdmin": "您是管理員",
	"pinnedNotes": "已置頂的貼文",
	"thisChannelArchived": "這個頻道已被封存。",
	"notesSearchNotAvailable": "無法使用搜尋貼文功能。",
	"postToTheChannel": "發佈到頻道",
	"unfavoriteConfirm": "要取消收錄我的最愛嗎？",
	"mutePeriod": "靜音的期限",
	"tenMinutes": "十分鐘",
	"unmute": "解除靜音",
	"featured": "精選"
}
</locale>
