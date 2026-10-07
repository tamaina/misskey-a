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
				<MkButton v-if="favorited" v-tooltip="$locale.sfc.unfavorite" asLike class="button" rounded primary :class="$style.favorite" @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
				<MkButton v-else v-tooltip="$locale.sfc.favorite" asLike class="button" rounded :class="$style.favorite" @click="favorite()"><i class="ti ti-star"></i></MkButton>
				<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : undefined }" :class="$style.banner">
					<div :class="$style.bannerStatus">
						<div><i class="ti ti-users ti-fw"></i><I18n :src="$locale.sfc.channelUsersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
						<div><i class="ti ti-pencil ti-fw"></i><I18n :src="$locale.sfc.channelNotesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
						<div v-if="$i != null && channel != null && $i.id === channel.userId" style="color: var(--MI_THEME-warn)"><i class="ti ti-user-star ti-fw"></i><span style="margin-left: 4px;">{{ $locale.sfc.youAreAdmin }}</span></div>
					</div>
					<div v-if="channel.isSensitive" :class="$style.sensitiveIndicator">{{ $locale.sfc.sensitive }}</div>
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
					<MkButton primary rounded style="margin-top: 8px;" @click="search()">{{ $locale.sfc.search }}</MkButton>
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
import { computed, watch, ref, markRaw, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
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
			value: 'indefinitely', label: $locale.value.sfc.indefinitely,
		}, {
			value: 'tenMinutes', label: $locale.value.sfc.tenMinutes,
		}, {
			value: 'oneHour', label: $locale.value.sfc.oneHour,
		}, {
			value: 'oneDay', label: $locale.value.sfc.oneDay,
		}, {
			value: 'oneWeek', label: $locale.value.sfc.oneWeek,
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
			text: $locale.value.sfc.copyUrl,
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
				text: $locale.value.sfc.share,
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
				text: $locale.value.sfc.mute,
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
				text: $locale.value.sfc.edit,
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
	title: $locale.value.sfc.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'timeline',
	title: $locale.value.sfc.timeline,
	icon: 'ti ti-home',
}, {
	key: 'featured',
	title: $locale.value.sfc.featured,
	icon: 'ti ti-bolt',
}, {
	key: 'search',
	title: $locale.value.sfc.search,
	icon: 'ti ti-search',
}]);

definePage(() => ({
	title: channel.value ? channel.value.name : $locale.value.sfc.channel,
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
	"unfavorite": "إزالة من المفضلة",
	"favorite": "أضفها للمفضلة",
	"channelUsersCount": "{n} منتسب",
	"channelNotesCount": "{n} ملاحظة",
	"youAreAdmin": "You are admin",
	"sensitive": "محتوى حساس",
	"pinnedNotes": "ملاحظة مثبتة",
	"thisChannelArchived": "أُرشفت هذه القناة.",
	"search": "البحث",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "انشر في قناة",
	"unfavoriteConfirm": "أتريد إزالتها من المفضلة؟",
	"mutePeriod": "مدة الكتم",
	"indefinitely": "أبدًا",
	"tenMinutes": "10 دقائق",
	"oneHour": "ساعة",
	"oneDay": "يوم",
	"oneWeek": "أسبوع",
	"copyUrl": "انسخ الرابط",
	"share": "شارِك",
	"mute": "اكتم",
	"unmute": "إلغاء الكتم",
	"edit": "التعديل",
	"overview": "ملخص عام",
	"timeline": "الخيط الزمني",
	"featured": "المتداولة",
	"channel": "القنوات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"unfavorite": "Eliminar dels preferits",
	"favorite": "Afegeix als preferits",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "Ets l'administrador ",
	"sensitive": "Sensible",
	"pinnedNotes": "Nota fixada",
	"thisChannelArchived": "Aquest Canal ha sigut arxivat.",
	"search": "Cercar",
	"notesSearchNotAvailable": "La cerca de notes no es troba disponible.",
	"postToTheChannel": "Publicar a un Canal",
	"unfavoriteConfirm": "Esborrar dels favorits?",
	"mutePeriod": "Duració del silenci",
	"indefinitely": "Permanent",
	"tenMinutes": "10 minuts",
	"oneHour": "1 hora",
	"oneDay": "Un dia",
	"oneWeek": "Una setmana",
	"copyUrl": "Copia l'URL",
	"share": "Comparteix",
	"mute": "Silencia",
	"unmute": "Deixa de silenciar",
	"edit": "Editar",
	"overview": "Visió General",
	"timeline": "Línia de temps",
	"featured": "Destacat",
	"channel": "Canals"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"unfavorite": "Odebrat z oblízených",
	"favorite": "Oblíbené",
	"channelUsersCount": "{n} Účastníků",
	"channelNotesCount": "{n} Poznámek",
	"youAreAdmin": "You are admin",
	"sensitive": "NSFW",
	"pinnedNotes": "Připnutá poznámka",
	"thisChannelArchived": "Tenhle kanál je archivovaný",
	"search": "Vyhledávání",
	"notesSearchNotAvailable": "Vyhledávání poznámek je nedostupné.",
	"postToTheChannel": "Vložit do kanálu",
	"unfavoriteConfirm": "Opravdu chcete odstranit z oblíbených?",
	"mutePeriod": "Délka ztlumení",
	"indefinitely": "Navždy",
	"tenMinutes": "10 minut",
	"oneHour": "1 hodina",
	"oneDay": "1 den",
	"oneWeek": "1 týden",
	"copyUrl": "Kopírovat URL",
	"share": "Sdílet",
	"mute": "Ztlumit",
	"unmute": "Odmlčet",
	"edit": "Upravit",
	"overview": "Shrnutí",
	"timeline": "Časová osa",
	"featured": "Oblíbené poznámky",
	"channel": "Kanály"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Search",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "Copy URL",
	"share": "Share",
	"mute": "Mute",
	"unmute": "Unmute",
	"edit": "Edit",
	"overview": "Overview",
	"timeline": "Timeline",
	"featured": "Featured",
	"channel": "Channels"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"unfavorite": "Aus Favoriten entfernen",
	"favorite": "Zu Favoriten hinzufügen",
	"channelUsersCount": "{n} Teilnehmer",
	"channelNotesCount": "{n} Notizen",
	"youAreAdmin": "Sie sind ein Administrator",
	"sensitive": "Sensibel",
	"pinnedNotes": "Angeheftete Notizen",
	"thisChannelArchived": "Dieser Kanal wurde archiviert.",
	"search": "Suchen",
	"notesSearchNotAvailable": "Die Notizsuche ist nicht verfügbar.",
	"postToTheChannel": "In Kanal senden",
	"unfavoriteConfirm": "Wirklich aus Favoriten entfernen?",
	"mutePeriod": "Stummschaltungsdauer",
	"indefinitely": "Dauerhaft",
	"tenMinutes": "10 Minuten",
	"oneHour": "Eine Stunde",
	"oneDay": "Einen Tag",
	"oneWeek": "Eine Woche",
	"copyUrl": "URL kopieren",
	"share": "Teilen",
	"mute": "Stummschalten",
	"unmute": "Stummschaltung aufheben",
	"edit": "Bearbeiten",
	"overview": "Übersicht",
	"timeline": "Chronik",
	"featured": "Beliebt",
	"channel": "Kanäle"
}
</locale>

<locale lang="json" locale="en-US">
{
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Search",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "Copy URL",
	"share": "Share",
	"mute": "Mute",
	"unmute": "Unmute",
	"edit": "Edit",
	"overview": "Overview",
	"timeline": "Timeline",
	"featured": "Featured",
	"channel": "Channels"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"unfavorite": "Quitar de favoritos",
	"favorite": "Añadir a favoritos",
	"channelUsersCount": "{n} participantes",
	"channelNotesCount": "{n} notas",
	"youAreAdmin": "Eres administrador.",
	"sensitive": "Marcado como sensible (NSFW)",
	"pinnedNotes": "Nota fijada",
	"thisChannelArchived": "El canal ha sido archivado.",
	"search": "Buscar",
	"notesSearchNotAvailable": "No se puede buscar una nota",
	"postToTheChannel": "Publicar en el canal",
	"unfavoriteConfirm": "¿Desea quitar de favoritos?",
	"mutePeriod": "Período de silenciamiento",
	"indefinitely": "Sin límite de tiempo",
	"tenMinutes": "10 minutos",
	"oneHour": "1 hora",
	"oneDay": "1 día",
	"oneWeek": "1 semana",
	"copyUrl": "Copiar URL",
	"share": "Compartir",
	"mute": "Silenciar",
	"unmute": "Dejar de silenciar",
	"edit": "Editar",
	"overview": "Resumen",
	"timeline": "Línea de tiempo",
	"featured": "Destacados",
	"channel": "Canal"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"unfavorite": "Retirer des favoris",
	"favorite": "Ajouter aux favoris",
	"channelUsersCount": "{n} Participant·e·s",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Contenu sensible",
	"pinnedNotes": "Note épinglée",
	"thisChannelArchived": "Ce canal a été archivé.",
	"search": "Rechercher",
	"notesSearchNotAvailable": "La recherche de notes n'est pas disponible.",
	"postToTheChannel": "Publier au canal",
	"unfavoriteConfirm": "Vraiment supprimer des favoris ?",
	"mutePeriod": "Durée de mise en sourdine",
	"indefinitely": "Illimité",
	"tenMinutes": "10 minutes",
	"oneHour": "1 heure",
	"oneDay": "1 jour",
	"oneWeek": "1 semaine",
	"copyUrl": "Copier l’URL",
	"share": "Partager",
	"mute": "Masquer",
	"unmute": "Ne plus masquer",
	"edit": "Editer",
	"overview": "Aperçu",
	"timeline": "Fil",
	"featured": "Tendances",
	"channel": "Canaux"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"unfavorite": "Hapus dari favorit",
	"favorite": "Favorit",
	"channelUsersCount": "{n} Partisipan",
	"channelNotesCount": "terdapat {n} catatan",
	"youAreAdmin": "You are admin",
	"sensitive": "Konten sensitif",
	"pinnedNotes": "Catatan yang disematkan",
	"thisChannelArchived": "Kanal ini telah diarsipkan.",
	"search": "Cari",
	"notesSearchNotAvailable": "Pencarian catatan tidak tersedia.",
	"postToTheChannel": "Buat Catatan ke Kanal",
	"unfavoriteConfirm": "Yakin ingin menghapusnya dari favorit?",
	"mutePeriod": "Batas waktu bisu",
	"indefinitely": "Selamanya",
	"tenMinutes": "10 Menit",
	"oneHour": "1 Jam",
	"oneDay": "1 Hari",
	"oneWeek": "1 Bulan",
	"copyUrl": "Salin tautan",
	"share": "Bagikan",
	"mute": "Bisukan",
	"unmute": "Hapus bisukan",
	"edit": "Sunting",
	"overview": "Ikhtisar",
	"timeline": "Lini masa",
	"featured": "Sorotan",
	"channel": "Kanal"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"unfavorite": "Rimuovi nota dai preferiti",
	"favorite": "Preferiti",
	"channelUsersCount": "{n} partecipanti",
	"channelNotesCount": "{n} note",
	"youAreAdmin": "Sei un amministratore",
	"sensitive": "Esplicito",
	"pinnedNotes": "Note in primo piano",
	"thisChannelArchived": "Questo canale è stato archiviato.",
	"search": "Cerca",
	"notesSearchNotAvailable": "Non è possibile cercare tra le Note.",
	"postToTheChannel": "Pubblica nel canale",
	"unfavoriteConfirm": "Vuoi davvero rimuovere la preferenza?",
	"mutePeriod": "Durata del mute",
	"indefinitely": "Non scade",
	"tenMinutes": "10 minuti",
	"oneHour": "1 ora",
	"oneDay": "1 giorno",
	"oneWeek": "1 settimana",
	"copyUrl": "Copia URL",
	"share": "Condividi",
	"mute": "Silenziare",
	"unmute": "Dai voce",
	"edit": "Modifica",
	"overview": "Anteprima",
	"timeline": "Timeline",
	"featured": "In evidenza",
	"channel": "Canale"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"unfavorite": "お気に入り解除",
	"favorite": "お気に入り",
	"channelUsersCount": "{n}人が参加中",
	"channelNotesCount": "{n}投稿があります",
	"youAreAdmin": "あなたは管理者です",
	"sensitive": "センシティブ",
	"pinnedNotes": "ピン留めされたノート",
	"thisChannelArchived": "このチャンネルはアーカイブされています。",
	"search": "検索",
	"notesSearchNotAvailable": "ノート検索は利用できません。",
	"postToTheChannel": "チャンネルに投稿",
	"unfavoriteConfirm": "お気に入り解除しますか？",
	"mutePeriod": "ミュートする期限",
	"indefinitely": "無期限",
	"tenMinutes": "10分",
	"oneHour": "1時間",
	"oneDay": "1日",
	"oneWeek": "1週間",
	"copyUrl": "URLをコピー",
	"share": "共有",
	"mute": "ミュート",
	"unmute": "ミュート解除",
	"edit": "編集",
	"overview": "概要",
	"timeline": "タイムライン",
	"featured": "ハイライト",
	"channel": "チャンネル"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"unfavorite": "やっぱ気に入らん",
	"favorite": "お気に入り",
	"channelUsersCount": "{n}人が参加しとる",
	"channelNotesCount": "{n}こ投稿があるで",
	"youAreAdmin": "あんた、管理者やで",
	"sensitive": "気いつけて見いや",
	"pinnedNotes": "ピン留めされとるノート",
	"thisChannelArchived": "このチャンネル、アーカイブされとるで。",
	"search": "探す",
	"notesSearchNotAvailable": "なんかノート探せへん。",
	"postToTheChannel": "チャンネルに投稿",
	"unfavoriteConfirm": "ほんまに気に入らんの？",
	"mutePeriod": "ミュートする期間",
	"indefinitely": "無期限",
	"tenMinutes": "10分",
	"oneHour": "1時間",
	"oneDay": "1日",
	"oneWeek": "1週間",
	"copyUrl": "URLをコピー",
	"share": "わけわけ",
	"mute": "ミュート",
	"unmute": "ミュートやめたる",
	"edit": "編集",
	"overview": "概要",
	"timeline": "タイムライン",
	"featured": "ハイライト",
	"channel": "チャンネル"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Nadi",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "Copy URL",
	"share": "Share",
	"mute": "Mute",
	"unmute": "Unmute",
	"edit": "Edit",
	"overview": "Overview",
	"timeline": "Timeline",
	"featured": "Featured",
	"channel": "Channels"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"unfavorite": "ಮೆಚ್ಚುಗೆ ಅಳಿಸು",
	"favorite": "ಮೆಚ್ಚಿನ",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"search": "ಹುಡುಕು",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "Copy URL",
	"share": "Share",
	"mute": "Mute",
	"unmute": "Unmute",
	"edit": "Edit",
	"overview": "Overview",
	"timeline": "ಸಮಯಸಾಲು",
	"featured": "Featured",
	"channel": "Channels"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"unfavorite": "즐겨찾기에서 제거",
	"favorite": "즐겨찾기",
	"channelUsersCount": "{n}명 참여 중",
	"channelNotesCount": "{n}노트",
	"youAreAdmin": "당신은 관리자입니다.",
	"sensitive": "열람 주의",
	"pinnedNotes": "고정된 노트",
	"thisChannelArchived": "이 채널은 보존되었습니다.",
	"search": "검색",
	"notesSearchNotAvailable": "노트 검색을 이용하실 수 없습니다.",
	"postToTheChannel": "채널에 게시하기",
	"unfavoriteConfirm": "즐겨찾기를 해제하시겠습니까?",
	"mutePeriod": "뮤트할 기간",
	"indefinitely": "무기한",
	"tenMinutes": "10분",
	"oneHour": "1시간",
	"oneDay": "1일",
	"oneWeek": "일주일",
	"copyUrl": "URL 복사",
	"share": "공유",
	"mute": "뮤트",
	"unmute": "뮤트 해제",
	"edit": "편집",
	"overview": "요약",
	"timeline": "타임라인",
	"featured": "유행",
	"channel": "채널"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"unfavorite": "Verwijderen uit favorieten",
	"favorite": "Favorieten",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "NSFW",
	"pinnedNotes": "Vastgemaakte notitie",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Zoeken",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "URL kopiëren",
	"share": "Delen",
	"mute": "Dempen",
	"unmute": "Stop dempen",
	"edit": "Bewerken",
	"overview": "Overzicht",
	"timeline": "Tijdlijn",
	"featured": "Uitgelicht",
	"channel": "Kanalen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"unfavorite": "Fjern fra favoritter",
	"favorite": "Legg til i favoritter",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Festet Note",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Søk",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutter",
	"oneHour": "1 time",
	"oneDay": "1 dag",
	"oneWeek": "1 uke",
	"copyUrl": "Kopier URL",
	"share": "Del",
	"mute": "Skjul",
	"unmute": "Vis",
	"edit": "Rediger",
	"overview": "Overview",
	"timeline": "Tidslinje",
	"featured": "Featured",
	"channel": "Kanaler"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"unfavorite": "Usuń z ulubionych",
	"favorite": "Dodaj do ulubionych",
	"channelUsersCount": "{n} uczestnicy",
	"channelNotesCount": "{n} wpisy",
	"youAreAdmin": "You are admin",
	"sensitive": "NSFW",
	"pinnedNotes": "Przypięty wpis",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Szukaj",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Publikuj na kanale",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Okres wyciszenia",
	"indefinitely": "Nigdy",
	"tenMinutes": "10 minut",
	"oneHour": "1 godzina",
	"oneDay": "1 dzień",
	"oneWeek": "1 tydzień",
	"copyUrl": "Skopiuj adres URL",
	"share": "Udostępnij",
	"mute": "Wycisz",
	"unmute": "Cofnij wyciszenie",
	"edit": "Edytuj",
	"overview": "Przegląd",
	"timeline": "Oś czasu",
	"featured": "Wyróżnione",
	"channel": "Kanały"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"unfavorite": "Remover dos favoritos",
	"favorite": "Adicionar aos favoritos",
	"channelUsersCount": "{n} usuários ativos",
	"channelNotesCount": "{n} notas",
	"youAreAdmin": "You are admin",
	"sensitive": "Conteúdo sensível",
	"pinnedNotes": "Post fixado",
	"thisChannelArchived": "Esse canal foi arquivado.",
	"search": "Pesquisar",
	"notesSearchNotAvailable": "A pesquisa de notas está indisponível.",
	"postToTheChannel": "Publicar ao canal",
	"unfavoriteConfirm": "Deseja realmente remover dos favoritos?",
	"mutePeriod": "Duração de silenciamento",
	"indefinitely": "Indefinitivamente",
	"tenMinutes": "10 minutos",
	"oneHour": "1 hora",
	"oneDay": "1 dia",
	"oneWeek": "1 semana",
	"copyUrl": "Copiar URL",
	"share": "Compartilhar",
	"mute": "Silenciar",
	"unmute": "Desmutar",
	"edit": "Editar",
	"overview": "Visão geral",
	"timeline": "Linha do tempo",
	"featured": "Destaques",
	"channel": "Canais"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"unfavorite": "Убрать из избранного",
	"favorite": "В избранное",
	"channelUsersCount": "Участников: {n}",
	"channelNotesCount": "Заметок: {n}",
	"youAreAdmin": "Вы администратор",
	"sensitive": "Содержимое не для всех",
	"pinnedNotes": "Закреплённая заметка",
	"thisChannelArchived": "Этот канал находится в архиве.",
	"search": "Поиск",
	"notesSearchNotAvailable": "Поиск заметок недоступен",
	"postToTheChannel": "Отправить в канал",
	"unfavoriteConfirm": "Удалить избранное?",
	"mutePeriod": "Продолжительность скрытия",
	"indefinitely": "вечно",
	"tenMinutes": "10 минут",
	"oneHour": "1 час",
	"oneDay": "1 день",
	"oneWeek": "1 неделя",
	"copyUrl": "Копировать ссылку",
	"share": "Поделиться",
	"mute": "Скрыть",
	"unmute": "Отменить скрытие",
	"edit": "Изменить",
	"overview": "Обзор",
	"timeline": "Лента",
	"featured": "Горячее",
	"channel": "Каналы"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"unfavorite": "Nepáči sa mi",
	"favorite": "Páči sa mi",
	"channelUsersCount": "{n} účastníkov",
	"channelNotesCount": "{n} poznámok",
	"youAreAdmin": "You are admin",
	"sensitive": "NSFW",
	"pinnedNotes": "Pripnuté poznámky",
	"thisChannelArchived": "This channel has been archived.",
	"search": "Hľadať",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Trvanie stíšenia",
	"indefinitely": "Navždy",
	"tenMinutes": "10 minút",
	"oneHour": "1 hodina",
	"oneDay": "1 deň",
	"oneWeek": "1 týždeň",
	"copyUrl": "Kopírovať URL",
	"share": "Zdieľať",
	"mute": "Vypnúť zvuk",
	"unmute": "Zapnúť zvuk",
	"edit": "Upraviť",
	"overview": "Prehľad",
	"timeline": "Časová os",
	"featured": "Obľúbené poznámky",
	"channel": "Kanály"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"unfavorite": "ลบออกจากรายการโปรด",
	"favorite": "รายการโปรด",
	"channelUsersCount": "{n} ผู้เข้าร่วม",
	"channelNotesCount": "มี {n} โน้ต",
	"youAreAdmin": "คุณคือผู้ดูแลระบบ",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"pinnedNotes": "โน้ตที่ปักหมุดไว้",
	"thisChannelArchived": "ช่องนี้ถูกเก็บถาวรแล้วนะ",
	"search": "ค้นหา",
	"notesSearchNotAvailable": "การค้นหาโน้ตไม่พร้อมใช้งาน",
	"postToTheChannel": "โพสต์ลงช่อง",
	"unfavoriteConfirm": "ลบออกจากรายการโปรดแน่ใจหรอ?",
	"mutePeriod": "ระยะเวลาปิดเสียง",
	"indefinitely": "ตลอดไป",
	"tenMinutes": "10 นาที",
	"oneHour": "1 ชั่วโมง",
	"oneDay": "1 วัน",
	"oneWeek": "1 สัปดาห์",
	"copyUrl": "คัดลอก URL",
	"share": "แบ่งปัน",
	"mute": "ปิดเสียง",
	"unmute": "ยกเลิกการปิดเสียง",
	"edit": "แก้ไข",
	"overview": "ภาพรวม",
	"timeline": "ไทม์ไลน์",
	"featured": "ไฮไลท์",
	"channel": "ช่อง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"unfavorite": "Favoriden kaldır",
	"favorite": "Favori",
	"channelUsersCount": "{n} Katılımcılar",
	"channelNotesCount": "{n} Notlar",
	"youAreAdmin": "Siz yöneticisiniz.",
	"sensitive": "Hassas",
	"pinnedNotes": "Sabitlenmiş notlar",
	"thisChannelArchived": "Bu kanal arşivlenmiş.",
	"search": "Ara",
	"notesSearchNotAvailable": "Not arama özelliği kullanılamıyor.",
	"postToTheChannel": "Kanalına gönder",
	"unfavoriteConfirm": "Cidden favorilerden kaldırmak istiyor musunuz?",
	"mutePeriod": "Sessiz kalma süresi",
	"indefinitely": "Kalıcı olarak",
	"tenMinutes": "10 dakika",
	"oneHour": "1 saat",
	"oneDay": "1 gün",
	"oneWeek": "1 hafta",
	"copyUrl": "URL kopyala",
	"share": "Paylaş",
	"mute": "Gizle",
	"unmute": "sesi aç",
	"edit": "Düzenle",
	"overview": "Genel Bakış",
	"timeline": "Pano",
	"featured": "Öne çıkan",
	"channel": "Kanallar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"unfavorite": "Remove from favorites",
	"favorite": "Add to favorites",
	"channelUsersCount": "{n} Participants",
	"channelNotesCount": "{n} Notes",
	"youAreAdmin": "You are admin",
	"sensitive": "Sensitive",
	"pinnedNotes": "Pinned notes",
	"thisChannelArchived": "This channel has been archived.",
	"search": "ئىزدەش",
	"notesSearchNotAvailable": "Note search is unavailable.",
	"postToTheChannel": "Post to channel",
	"unfavoriteConfirm": "Really remove from favorites?",
	"mutePeriod": "Mute duration",
	"indefinitely": "Permanently",
	"tenMinutes": "10 minutes",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"copyUrl": "Copy URL",
	"share": "Share",
	"mute": "Mute",
	"unmute": "Unmute",
	"edit": "Edit",
	"overview": "Overview",
	"timeline": "Timeline",
	"featured": "Featured",
	"channel": "Channels"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"unfavorite": "Видалити з обраного",
	"favorite": "Обране",
	"channelUsersCount": "{n} учасників",
	"channelNotesCount": "{n} дописів",
	"youAreAdmin": "Ви адмін",
	"sensitive": "NSFW",
	"pinnedNotes": "Закріплена нотатка",
	"thisChannelArchived": "Цей канал заархівовано.",
	"search": "Пошук",
	"notesSearchNotAvailable": "Пошук нотаток недоступний.",
	"postToTheChannel": "Опублікувати в каналі",
	"unfavoriteConfirm": "Справді видалити з обраного?",
	"mutePeriod": "Тривалість приховування",
	"indefinitely": "Ніколи",
	"tenMinutes": "10 хвилин",
	"oneHour": "1 година",
	"oneDay": "1 день",
	"oneWeek": "1 тиждень",
	"copyUrl": "Копіювати URL",
	"share": "Поділитись",
	"mute": "Ігнорувати",
	"unmute": "Показувати",
	"edit": "Редагувати",
	"overview": "Огляд",
	"timeline": "Стрічка",
	"featured": "Популярні",
	"channel": "Канали"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"unfavorite": "Bỏ thích",
	"favorite": "Thêm vào yêu thích",
	"channelUsersCount": "{n} Thành viên",
	"channelNotesCount": "{n} Tút",
	"youAreAdmin": "You are admin",
	"sensitive": "Nhạy cảm",
	"pinnedNotes": "Bài viết đã ghim",
	"thisChannelArchived": "Kênh này đã được lưu trữ.",
	"search": "Tìm kiếm",
	"notesSearchNotAvailable": "Tìm kiếm bài đăng hiện không khả dụng.",
	"postToTheChannel": "Đăng lên kênh",
	"unfavoriteConfirm": "Bạn thực sự muốn xoá khỏi mục yêu thích?",
	"mutePeriod": "Thời hạn ẩn",
	"indefinitely": "Vĩnh viễn",
	"tenMinutes": "10 phút",
	"oneHour": "1 giờ",
	"oneDay": "1 ngày",
	"oneWeek": "1 tuần",
	"copyUrl": "Sao chép URL",
	"share": "Chia sẻ",
	"mute": "Ẩn",
	"unmute": "Bỏ ẩn",
	"edit": "Sửa",
	"overview": "Tổng quan",
	"timeline": "Bảng tin",
	"featured": "Nổi bật",
	"channel": "Kênh"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"unfavorite": "取消收藏",
	"favorite": "收藏",
	"channelUsersCount": "{n} 人参与",
	"channelNotesCount": "{n} 篇帖子",
	"youAreAdmin": "你是管理员",
	"sensitive": "敏感内容",
	"pinnedNotes": "置顶的帖子",
	"thisChannelArchived": "该频道已被归档。",
	"search": "搜索",
	"notesSearchNotAvailable": "帖子检索不可用",
	"postToTheChannel": "发布到频道",
	"unfavoriteConfirm": "确定要取消收藏吗？",
	"mutePeriod": "隐藏时长",
	"indefinitely": "永久",
	"tenMinutes": "10分钟",
	"oneHour": "1 小时",
	"oneDay": "1天",
	"oneWeek": "1 周",
	"copyUrl": "复制链接",
	"share": "分享",
	"mute": "屏蔽",
	"unmute": "取消隐藏",
	"edit": "编辑",
	"overview": "概览",
	"timeline": "时间线",
	"featured": "热门",
	"channel": "频道"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"unfavorite": "從我的最愛中移除",
	"favorite": "我的最愛",
	"channelUsersCount": "有 {n} 人參與",
	"channelNotesCount": "有 {n} 篇貼文",
	"youAreAdmin": "您是管理員",
	"sensitive": "敏感內容",
	"pinnedNotes": "已置頂的貼文",
	"thisChannelArchived": "這個頻道已被封存。",
	"search": "搜尋",
	"notesSearchNotAvailable": "無法使用搜尋貼文功能。",
	"postToTheChannel": "發佈到頻道",
	"unfavoriteConfirm": "要取消收錄我的最愛嗎？",
	"mutePeriod": "靜音的期限",
	"indefinitely": "無期限",
	"tenMinutes": "十分鐘",
	"oneHour": "一小時",
	"oneDay": "一天",
	"oneWeek": "一週",
	"copyUrl": "複製URL",
	"share": "分享",
	"mute": "靜音",
	"unmute": "解除靜音",
	"edit": "編輯",
	"overview": "概覽",
	"timeline": "時間軸",
	"featured": "精選",
	"channel": "頻道"
}
</locale>
