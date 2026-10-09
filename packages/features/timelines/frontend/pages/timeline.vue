<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="src" :actions="headerActions" :tabs="$i ? headerTabs : headerTabsWhenNotLogin" :swipable="true" :displayMyAvatar="true" :canOmitTitle="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkTip v-if="isBasicTimeline(src)" :k="`tl.${src}`" style="margin-bottom: var(--MI-margin);">
			{{ copyLocaleDictionary($locale.sfc.timelineDescriptionLabels)[src] }}
		</MkTip>
		<MkPostForm v-if="prefer.r.showFixedPostForm.value" :class="$style.postForm" class="_panel" fixed style="margin-bottom: var(--MI-margin);"/>
		<MkStreamingNotesTimeline
			ref="tlComponent"
			:key="src + withRenotes + withReplies + onlyFiles + withSensitive"
			:class="$style.tl"
			:src="(src.split(':')[0] as (BasicTimelineType | 'list'))"
			:list="src.split(':')[1]"
			:withRenotes="withRenotes"
			:withReplies="withReplies"
			:withSensitive="withSensitive"
			:onlyFiles="onlyFiles"
			:sound="true"
		/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, provide, useTemplateRef, ref, onMounted, onActivated } from 'vue';
import type { Tab } from '@features/navigation/frontend/components/global/MkPageHeader.tabs.vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { BasicTimelineType } from '@features/timelines/frontend/timelines.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import MkPostForm from '@features/notes/frontend/components/MkPostForm.vue';
import * as os from '@features/ui/frontend/os.js';
import { store } from '@features/preferences/frontend/store.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { $i } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache, userListsCache, favoritedChannelsCache } from '@features/runtime/frontend/cache.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import { deepMerge } from '@features/runtime/frontend/utility/merge.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { availableBasicTimelines, hasWithReplies, isAvailableBasicTimeline, isBasicTimeline, basicTimelineIconClass } from '@features/timelines/frontend/timelines.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const tlComponent = useTemplateRef('tlComponent');

type TimelinePageSrc = BasicTimelineType | `list:${string}`;

const srcWhenNotSignin = ref<'local' | 'global'>(isAvailableBasicTimeline('local') ? 'local' : 'global');
const src = computed<TimelinePageSrc>({
	get: () => ($i ? store.r.tl.value.src : srcWhenNotSignin.value),
	set: (x) => saveSrc(x),
});
const withRenotes = computed<boolean>({
	get: () => store.r.tl.value.filter.withRenotes,
	set: (x) => saveTlFilter('withRenotes', x),
});

// computed内での無限ループを防ぐためのフラグ
const localSocialTLFilterSwitchStore = ref<'withReplies' | 'onlyFiles' | false>(
	store.r.tl.value.filter.withReplies ? 'withReplies' :
	store.r.tl.value.filter.onlyFiles ? 'onlyFiles' :
	false,
);

const withReplies = computed<boolean>({
	get: () => {
		if (!$i) return false;
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'onlyFiles') {
			return false;
		} else {
			return store.r.tl.value.filter.withReplies;
		}
	},
	set: (x) => saveTlFilter('withReplies', x),
});
const onlyFiles = computed<boolean>({
	get: () => {
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'withReplies') {
			return false;
		} else {
			return store.r.tl.value.filter.onlyFiles;
		}
	},
	set: (x) => saveTlFilter('onlyFiles', x),
});

watch([withReplies, onlyFiles], ([withRepliesTo, onlyFilesTo]) => {
	if (withRepliesTo) {
		localSocialTLFilterSwitchStore.value = 'withReplies';
	} else if (onlyFilesTo) {
		localSocialTLFilterSwitchStore.value = 'onlyFiles';
	} else {
		localSocialTLFilterSwitchStore.value = false;
	}
});

const withSensitive = computed<boolean>({
	get: () => store.r.tl.value.filter.withSensitive,
	set: (x) => saveTlFilter('withSensitive', x),
});

const showFixedPostForm = prefer.model('showFixedPostForm');

async function chooseList(ev: PointerEvent): Promise<void> {
	const lists = await userListsCache.fetch();
	const items: (MenuItem | undefined)[] = [
		...lists.map(list => ({
			type: 'link' as const,
			text: list.name,
			to: `/timeline/list/${list.id}`,
		})),
		(lists.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: $locale.value.sfc.createNew,
			to: '/my/lists',
		},
	];
	os.popupMenu(items.filter(i => i != null), ev.currentTarget ?? ev.target);
}

async function chooseAntenna(ev: PointerEvent): Promise<void> {
	const antennas = await antennasCache.fetch();
	const items: (MenuItem | undefined)[] = [
		...antennas.map(antenna => ({
			type: 'link' as const,
			text: antenna.name,
			indicate: antenna.hasUnreadNote,
			to: `/timeline/antenna/${antenna.id}`,
		})),
		(antennas.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: $locale.value.sfc.createNew,
			to: '/my/antennas',
		},
	];
	os.popupMenu(items.filter(i => i != null), ev.currentTarget ?? ev.target);
}

async function chooseChannel(ev: PointerEvent): Promise<void> {
	const channels = await favoritedChannelsCache.fetch();
	const items: (MenuItem | undefined)[] = [
		...channels.map(channel => {
			const lastReadedAt = miLocalStorage.getItemAsJson(`channelLastReadedAt:${channel.id}`) ?? null;
			const hasUnreadNote = (lastReadedAt && channel.lastNotedAt) ? Date.parse(channel.lastNotedAt) > lastReadedAt : !!(!lastReadedAt && channel.lastNotedAt);

			return {
				type: 'link' as const,
				text: channel.name,
				indicate: hasUnreadNote,
				to: `/channels/${channel.id}`,
			};
		}),
		(channels.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link',
			icon: 'ti ti-plus',
			text: $locale.value.sfc.createNew,
			to: '/channels/new',
		},
	];
	os.popupMenu(items.filter(i => i != null), ev.currentTarget ?? ev.target);
}

function saveSrc(newSrc: TimelinePageSrc): void {
	const out = deepMerge({ src: newSrc }, store.s.tl);

	if (newSrc.startsWith('userList:')) {
		const id = newSrc.substring('userList:'.length);
		out.userList = prefer.r.pinnedUserLists.value.find(l => l.id === id) ?? null;
	}

	store.set('tl', out);
	if (['local', 'global'].includes(newSrc)) {
		srcWhenNotSignin.value = newSrc as 'local' | 'global';
	}
}

function saveTlFilter(key: keyof typeof store.s.tl.filter, newValue: boolean) {
	if (key !== 'withReplies' || $i) {
		const out = deepMerge({ filter: { [key]: newValue } }, store.s.tl);
		store.set('tl', out);
	}
}

function switchTlIfNeeded() {
	if (isBasicTimeline(src.value) && !isAvailableBasicTimeline(src.value)) {
		src.value = availableBasicTimelines()[0];
	}
}

onMounted(() => {
	switchTlIfNeeded();
});
onActivated(() => {
	switchTlIfNeeded();
});

const headerActions = computed<PageHeaderItem[]>(() => {
	const items: PageHeaderItem[] = [{
		icon: 'ti ti-dots',
		text: $locale.value.sfc.options,
		handler: (ev) => {
			const menuItems: MenuItem[] = [];

			menuItems.push({
				type: 'switch',
				icon: 'ti ti-repeat',
				text: $locale.value.sfc.showRenotes,
				ref: withRenotes,
			});

			if (isBasicTimeline(src.value) && hasWithReplies(src.value)) {
				menuItems.push({
					type: 'switch',
					icon: 'ti ti-messages',
					text: $locale.value.sfc.showRepliesToOthersInTimeline,
					ref: withReplies,
					disabled: onlyFiles,
				});
			}

			menuItems.push({
				type: 'switch',
				icon: 'ti ti-eye-exclamation',
				text: $locale.value.sfc.withSensitive,
				ref: withSensitive,
			}, {
				type: 'switch',
				icon: 'ti ti-photo',
				text: $locale.value.sfc.fileAttachedOnly,
				ref: onlyFiles,
				disabled: isBasicTimeline(src.value) && hasWithReplies(src.value) ? withReplies : false,
			}, {
				type: 'divider',
			}, {
				type: 'switch',
				text: $locale.value.sfc.showFixedPostForm,
				ref: showFixedPostForm,
			});

			os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
		},
	}];

	if (deviceKind === 'desktop') {
		items.unshift({
			icon: 'ti ti-refresh',
			text: $locale.value.sfc.reload,
			handler: () => {
				tlComponent.value?.reloadTimeline();
			},
		});
	}

	return items;
});

const headerTabs = computed(() => [...(prefer.r.pinnedUserLists.value.map(l => ({
	key: 'list:' + l.id,
	title: l.name,
	icon: 'ti ti-star',
	iconOnly: true,
}))), ...availableBasicTimelines().map(tl => ({
	key: tl,
	title: copyLocaleDictionary($locale.value.sfc.timelinesLabels)[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
})), {
	icon: 'ti ti-list',
	title: $locale.value.sfc.lists,
	iconOnly: true,
	onClick: chooseList,
}, {
	icon: 'ti ti-antenna',
	title: $locale.value.sfc.antennas,
	iconOnly: true,
	onClick: chooseAntenna,
}, {
	icon: 'ti ti-device-tv',
	title: $locale.value.sfc.channel,
	iconOnly: true,
	onClick: chooseChannel,
}] as Tab[]);

const headerTabsWhenNotLogin = computed(() => [...availableBasicTimelines().map(tl => ({
	key: tl,
	title: copyLocaleDictionary($locale.value.sfc.timelinesLabels)[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
}))] as Tab[]);

definePage(() => ({
	title: $locale.value.sfc.timeline,
	icon: isBasicTimeline(src.value) ? basicTimelineIconClass(src.value) : 'ti ti-home',
}));
</script>

<style lang="scss" module>
.new {
	position: sticky;
	top: calc(var(--MI-stickyTop, 0px) + 16px);
	z-index: 1000;
	width: 100%;
	margin: calc(-0.675em - 8px) 0;

	&:first-child {
		margin-top: calc(-0.675em - 8px - var(--MI-margin));
	}
}

.newButton {
	display: block;
	margin: var(--MI-margin) auto 0 auto;
	padding: 8px 16px;
	border-radius: 32px;
}

.postForm {
	border-radius: var(--MI-radius);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "أنشِئ جديد",
	"options": "خيارات",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "أظهر نموذج الكتابة في أعلى الصفحة",
	"reload": "انعش",
	"timelinesLabels": {
		"home": "الرئيسي",
		"local": "المحلي",
		"social": "الاجتماعي",
		"global": "الشامل"
	},
	"lists": "القوائم",
	"antennas": "الهوائيات",
	"channel": "القنوات",
	"timeline": "الخيط الزمني"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"timelineDescriptionLabels": {
		"home": "A la línia de temps d'Inici pots veure les notes dels usuaris que segueixes.",
		"local": "A la línia de temps Local pots veure les notes de tots els usuaris d'aquest servidor.",
		"social": "La línia de temps Social mostren les notes de les línies de temps d'Inici i Local.",
		"global": "A la línia de temps Global pots veure les notes de tots els servidors connectats."
	},
	"createNew": "Crear",
	"options": "Opcions",
	"showRenotes": "Mostrar impulsos",
	"showRepliesToOthersInTimeline": "Mostrar les respostes a altres a la línia de temps",
	"withSensitive": "Incloure notes amb fitxers sensibles",
	"fileAttachedOnly": "Només notes amb adjunts",
	"showFixedPostForm": "Mostrar el formulari per escriure a l'inici de la línia de temps",
	"reload": "Actualitzar",
	"timelinesLabels": {
		"home": "Inici",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Llistes",
	"antennas": "Antena",
	"channel": "Canals",
	"timeline": "Línia de temps"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Vytvořit nový",
	"options": "Možnosti",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Zobrazit formulář pro nové příspěvky nad časovou osou",
	"reload": "Aktualizovat",
	"timelinesLabels": {
		"home": "Domů",
		"local": "Místní",
		"social": "Sociální síť",
		"global": "Globální"
	},
	"lists": "Seznamy",
	"antennas": "Antény",
	"channel": "Kanály",
	"timeline": "Časová osa"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lists",
	"antennas": "Antennas",
	"channel": "Channels",
	"timeline": "Timeline"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"timelineDescriptionLabels": {
		"home": "In der Startseiten-Chronik kannst du Notizen von Konten sehen, denen du folgst.",
		"local": "In der lokalen Chronik siehst du Notizen von allen Benutzern auf diesem Server.",
		"social": "Die soziale Chronik zeigt Notizen von der Startseite und der lokalen Chronik.",
		"global": "In der globalen Chronik siehst du Notizen von allen föderierten Servern."
	},
	"createNew": "Neu erstellen",
	"options": "Optionen",
	"showRenotes": "Renotes anzeigen",
	"showRepliesToOthersInTimeline": "Antworten in Chronik anzeigen",
	"withSensitive": "Zeige \"sensitive Inhalte\" an",
	"fileAttachedOnly": "Nur Notizen mit Dateien",
	"showFixedPostForm": "Bereich zum Schreiben neuer Notizen am Anfang der Chronik anzeigen",
	"reload": "Aktualisieren",
	"timelinesLabels": {
		"home": "Startseite",
		"local": "Lokal",
		"social": "Sozial",
		"global": "Global"
	},
	"lists": "Listen",
	"antennas": "Antennen",
	"channel": "Kanäle",
	"timeline": "Chronik"
}
</locale>

<locale lang="json" locale="en-US">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lists",
	"antennas": "Antennas",
	"channel": "Channels",
	"timeline": "Timeline"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"timelineDescriptionLabels": {
		"home": "En la línea de tiempo de Inicio puedes ver las notas de las cuentas a las que sigues.",
		"local": "En la línea de tiempo Local puedes ver las notas de todos los usuarios del servidor.",
		"social": "En la línea de tiempo Social verás las notas de Inicio y Local a la vez.",
		"global": "En la línea de tiempo Global verás las notas de todos los servidores conectados."
	},
	"createNew": "Crear Nuevo",
	"options": "Opciones",
	"showRenotes": "Mostrar renotas",
	"showRepliesToOthersInTimeline": "Mostrar respuestas a otros en la línea de tiempo",
	"withSensitive": "Mostrar notas que contengan material sensible",
	"fileAttachedOnly": "Solo notas con archivos",
	"showFixedPostForm": "Mostrar formulario de publicación sobre la línea de tiempo.",
	"reload": "Recargar",
	"timelinesLabels": {
		"home": "Inicio",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Listas",
	"antennas": "Antenas",
	"channel": "Canal",
	"timeline": "Línea de tiempo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"timelineDescriptionLabels": {
		"home": "Sur le fil principal, vous pouvez voir les notes des utilisateurs auxquels vous êtes abonné·e.",
		"local": "Sur le fil local, vous pouvez voir les notes de tous les utilisateurs sur cette instance.",
		"social": "Sur le fil social, les notes des fils principal et local sont affichées.",
		"global": "Sur le fil global, vous pouvez voir les notes de toutes les instances connectées."
	},
	"createNew": "Créer",
	"options": "Options",
	"showRenotes": "Afficher les renotes",
	"showRepliesToOthersInTimeline": "Afficher les réponses aux autres dans le fil",
	"withSensitive": "Afficher les notes contenant des fichiers joints sensibles",
	"fileAttachedOnly": "Avec fichiers joints seulement",
	"showFixedPostForm": "Afficher le formulaire de publication en haut du fil d'actualité",
	"reload": "Rafraîchir",
	"timelinesLabels": {
		"home": "Principal",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Listes",
	"antennas": "Antennes",
	"channel": "Canaux",
	"timeline": "Fil"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"timelineDescriptionLabels": {
		"home": "Pada linimasa Beranda, kamu dapat melihat catatan dari akun yang kamu ikuti.",
		"local": "Pada linimasa Lokal, kamu dapat melihat catatan dari semua pengguna yang ada pada peladen ini.",
		"social": "Linimasa sosial menampilkan catatan dari kedua linimasa Beranda dan Lokal.",
		"global": "Pada linimasa Global, kamu dapat melihat catatan dari semua peladen yang terhubung."
	},
	"createNew": "Buat baru",
	"options": "Opsi peran",
	"showRenotes": "Tampilkan renote",
	"showRepliesToOthersInTimeline": "Tampilkan balasan ke pengguna lain dalam lini masa",
	"withSensitive": "Lampirkan catatan dengan berkas sensitif",
	"fileAttachedOnly": "Hanya catatan dengan berkas",
	"showFixedPostForm": "Tampilkan form posting di atas lini masa",
	"reload": "Muat ulang",
	"timelinesLabels": {
		"home": "Beranda",
		"local": "Lokal",
		"social": "Sosial",
		"global": "Global"
	},
	"lists": "Daftar",
	"antennas": "Antena",
	"channel": "Kanal",
	"timeline": "Lini masa"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"timelineDescriptionLabels": {
		"home": "Nella Timeline Home, la tua cronologia principale, puoi vedere le Note provenienti dai profili che segui (Following).",
		"local": "La Timeline Locale è un flusso di Note pubblicate dai profili iscritti a questo server.",
		"social": "La Timeline Sociale elenca, in ordine cronologico, il flusso di Note nella Timeline Home e Locale.",
		"global": "Nella Timeline Federata trovi il flusso di Note provenienti da profili iscritti ad altri server, federati a questo."
	},
	"createNew": "Crea",
	"options": "Opzioni del ruolo",
	"showRenotes": "Includi le Rinota",
	"showRepliesToOthersInTimeline": "Risposte altrui nella TL",
	"withSensitive": "Mostra le Note con allegati espliciti",
	"fileAttachedOnly": "Solo con allegati",
	"showFixedPostForm": "Visualizzare la finestra di pubblicazione in cima alla timeline",
	"reload": "Ricarica",
	"timelinesLabels": {
		"home": "Home",
		"local": "Locale",
		"social": "Sociale",
		"global": "Federata"
	},
	"lists": "Liste",
	"antennas": "Antenne",
	"channel": "Canale",
	"timeline": "Timeline"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"timelineDescriptionLabels": {
		"home": "ホームタイムラインでは、あなたがフォローしているアカウントの投稿を見られます。",
		"local": "ローカルタイムラインでは、このサーバーにいるユーザー全員の投稿を見られます。",
		"social": "ソーシャルタイムラインには、ホームタイムラインとローカルタイムラインの投稿が両方表示されます。",
		"global": "グローバルタイムラインでは、接続している他のすべてのサーバーからの投稿を見られます。"
	},
	"createNew": "新規作成",
	"options": "オプション",
	"showRenotes": "リノートを表示",
	"showRepliesToOthersInTimeline": "TLに他の人への返信を含める",
	"withSensitive": "センシティブなファイルを含むノートを表示",
	"fileAttachedOnly": "ファイル付きのみ",
	"showFixedPostForm": "タイムライン上部に投稿フォームを表示する",
	"reload": "リロード",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"lists": "リスト",
	"antennas": "アンテナ",
	"channel": "チャンネル",
	"timeline": "タイムライン"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"timelineDescriptionLabels": {
		"home": "ホームタイムラインは、あんたがフォローしとるアカウントの投稿だけ見れるで。",
		"local": "ローカルタイムラインは、このサーバーにおる全員の投稿を見れるで。",
		"social": "ソーシャルタイムラインは、ホームタイムラインの投稿もローカルタイムラインのも一緒に見れるで。",
		"global": "グローバルタイムラインは、繋がっとる他のサーバーの投稿、全部ひっくるめて見れるで。"
	},
	"createNew": "新しく作るで",
	"options": "オプション",
	"showRenotes": "リノート出す",
	"showRepliesToOthersInTimeline": "タイムラインに他の人への返信とかも入れるで",
	"withSensitive": "センシティブなファイルを含むノートを表示",
	"fileAttachedOnly": "ファイルのっけてあるやつだけ",
	"showFixedPostForm": "タイムラインの上の方で投稿できるようにするわ",
	"reload": "リロード",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"lists": "リスト",
	"antennas": "アンテナ",
	"channel": "チャンネル",
	"timeline": "タイムライン"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Tibdarin",
	"antennas": "Antennas",
	"channel": "Channels",
	"timeline": "Timeline"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lists",
	"antennas": "Antennas",
	"channel": "Channels",
	"timeline": "ಸಮಯಸಾಲು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"timelineDescriptionLabels": {
		"home": "홈 타임라인에서는, 내가 팔로우한 계정의 게시물을 볼 수 있습니다.",
		"local": "로컬 타임라인에서는, 이 서버의 모든 유저의 게시물을 볼 수 있습니다.",
		"social": "소셜 타임라인에서는, 홈 타임라인과 로컬 타임라인의 게시물을 모두 볼 수 있습니다.",
		"global": "글로벌 타임라인에서는, 여기와 연결된 다른 모든 서버의 게시물을 볼 수 있습니다."
	},
	"createNew": "새로 만들기",
	"options": "옵션",
	"showRenotes": "리노트 보기",
	"showRepliesToOthersInTimeline": "타임라인에 다른 사람에게 보내는 답글을 포함",
	"withSensitive": "민감한 파일이 포함된 노트 보기",
	"fileAttachedOnly": "미디어를 포함한 노트만",
	"showFixedPostForm": "타임라인 상단에 글 입력란을 표시",
	"reload": "새로고침",
	"timelinesLabels": {
		"home": "홈",
		"local": "로컬",
		"social": "소셜",
		"global": "글로벌"
	},
	"lists": "리스트",
	"antennas": "안테나",
	"channel": "채널",
	"timeline": "타임라인"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Nieuwe aanmaken",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Het postingformulier bovenaan de tijdbalk weergeven",
	"reload": "Verversen",
	"timelinesLabels": {
		"home": "Startpagina",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lijsten",
	"antennas": "Antennes",
	"channel": "Kanalen",
	"timeline": "Tijdlijn"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Alternativ",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Hjem",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lister",
	"antennas": "Antenner",
	"channel": "Kanaler",
	"timeline": "Tidslinje"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Utwórz nowy",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Wyświetlaj formularz tworzenia wpisu w górnej części osi czasu",
	"reload": "Odśwież",
	"timelinesLabels": {
		"home": "Strona główna",
		"local": "Lokalne",
		"social": "Społeczność",
		"global": "Globalna"
	},
	"lists": "Listy",
	"antennas": "Anteny",
	"channel": "Kanały",
	"timeline": "Oś czasu"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"timelineDescriptionLabels": {
		"home": "Na linha do tempo Início, você verá notas dos usuários que você segue.",
		"local": "Na linha do tempo Local, você verá notas de todos os usuários da instância.",
		"social": "Na linha do tempo Social, você verá notas do Início e Local.",
		"global": "Na linha do tempo Global, você verá notas de todas as instâncias conectadas."
	},
	"createNew": "Criar novo",
	"options": "Opções",
	"showRenotes": "Exibir reposts",
	"showRepliesToOthersInTimeline": "Mostrar respostas aos outros na linha do tempo",
	"withSensitive": "Incluir notas com arquivos sensíveis",
	"fileAttachedOnly": "Apenas notas com arquivos",
	"showFixedPostForm": "Exibir o formulário de postagem na parte superior da linha do tempo",
	"reload": "Recarregar",
	"timelinesLabels": {
		"home": "Início",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Listas",
	"antennas": "Antenas",
	"channel": "Canais",
	"timeline": "Linha do tempo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"timelineDescriptionLabels": {
		"home": "В персональной ленте располагаются заметки тех, на которых вы подписаны.",
		"local": "Местная лента показывает заметки всех пользователей этого экземпляра.",
		"social": "В социальной ленте собирается всё, что есть в персональной и местной лентах.",
		"global": "В глобальную ленту попадает вообще всё со связанных экземпляров."
	},
	"createNew": "Новый документ",
	"options": "Настройки ролей",
	"showRenotes": "Показывать репосты",
	"showRepliesToOthersInTimeline": "Показывать ответы в ленте",
	"withSensitive": "Показывать заметки с NSFW контентом",
	"fileAttachedOnly": "Только заметки с файлами",
	"showFixedPostForm": "Показывать поле для ввода новой заметки наверху ленты",
	"reload": "Перезагрузить",
	"timelinesLabels": {
		"home": "Персональная",
		"local": "Местная",
		"social": "Социальная",
		"global": "Всеобщая"
	},
	"lists": "Списки",
	"antennas": "Антенны",
	"channel": "Каналы",
	"timeline": "Лента"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Vytvoriť nový",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Zobraziť formulár na nové príspevky nad časovou osou",
	"reload": "Obnoviť",
	"timelinesLabels": {
		"home": "Domov",
		"local": "Lokálne",
		"social": "Sociálne",
		"global": "Globálne"
	},
	"lists": "Zoznamy",
	"antennas": "Antény",
	"channel": "Kanály",
	"timeline": "Časová os"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"timelineDescriptionLabels": {
		"home": "บนไทม์ไลน์หลัก คุณสามารถดูโพสต์จากบัญชีที่ติดตามอยู่ได้",
		"local": "ไทม์ไลน์ท้องถิ่นช่วยให้เห็นโพสต์จากผู้ใช้ทั้งหมดบนเซิร์ฟเวอร์นี้",
		"social": "ไทม์ไลน์โซเชียลจะแสดงโพสต์จากทั้งไทม์ไลน์หลักและไทม์ไลน์ท้องถิ่น",
		"global": "ในไทม์ไลน์ทั่วโลก คุณสามารถดูโน้ตจากเซิร์ฟเวอร์ที่เชื่อมต่อทั้งหมดได้"
	},
	"createNew": "สร้างใหม่",
	"options": "ตัวเลือก",
	"showRenotes": "แสดงรีโน้ต",
	"showRepliesToOthersInTimeline": "แสดงการตอบกลับผู้อื่นลงในไทม์ไลน์",
	"withSensitive": "แสดงโน้ตที่มีไฟล์เนื้อหาละเอียดอ่อน",
	"fileAttachedOnly": "เฉพาะโน้ตที่มีไฟล์เท่านั้น",
	"showFixedPostForm": "แสดงแบบฟอร์มการโพสต์ที่ด้านบนสุดของไทม์ไลน์",
	"reload": "รีโหลด",
	"timelinesLabels": {
		"home": "หน้าหลัก",
		"local": "ท้องถิ่น",
		"social": "โซเชียล",
		"global": "ทั่วโลก"
	},
	"lists": "รายชื่อ",
	"antennas": "เสาอากาศ",
	"channel": "ช่อง",
	"timeline": "ไทม์ไลน์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"timelineDescriptionLabels": {
		"home": "Ana Pano'da, takip ettiğin hesapların notlarını görebilirsin.",
		"local": "Yerel Pano'da, bu sunucudaki tüm kullanıcıların notlarını görebilirsin.",
		"social": "Pano, Sosyal Pano ve Yerel Pano'dan gelen notları görüntüler.",
		"global": "Global Pano'da, bağlı tüm sunuculardan gelen notları görebilirsin."
	},
	"createNew": "Yeni oluştur",
	"options": "Seçenekler",
	"showRenotes": "Renote'ları göster",
	"showRepliesToOthersInTimeline": "Pano'da diğer kişilere verilen yanıtları göster",
	"withSensitive": "Hassas dosyalara notlar ekle",
	"fileAttachedOnly": "Yalnızca dosya içeren notlar",
	"showFixedPostForm": "Gönderi formunu pano üstünde görüntüle",
	"reload": "Yenile",
	"timelinesLabels": {
		"home": "Pano",
		"local": "Yerel",
		"social": "Sosyal",
		"global": "Global"
	},
	"lists": "Listeler",
	"antennas": "Antenler",
	"channel": "Kanallar",
	"timeline": "Pano"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"timelineDescriptionLabels": {
		"home": "In the Home timeline, you can see notes from accounts you follow.",
		"local": "In the Local timeline, you can see notes from all users on this server.",
		"social": "The Social timeline displays notes from both the Home and Local timelines.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Create new",
	"options": "Options",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"reload": "Refresh",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"lists": "Lists",
	"antennas": "Antennas",
	"channel": "Channels",
	"timeline": "Timeline"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"timelineDescriptionLabels": {
		"home": "У домашній стрічці ви можете бачити нотатки від облікових записів, на які ви підписані.",
		"local": "У локальній стрічці ви можете побачити нотатки від усіх користувачів серверу.",
		"social": "Соціальна стрічка показує нотатки й з домашньої, й з локальної стрічок. ",
		"global": "У глобальній стрічці ви можете побачити нотатки з усіх під'єднаних серверів."
	},
	"createNew": "Створити новий",
	"options": "Опції",
	"showRenotes": "Показати поширення",
	"showRepliesToOthersInTimeline": "Показувати відповіді іншим у стрічці",
	"withSensitive": "Допис від {name} містить чутливий вміст",
	"fileAttachedOnly": "Лише нотатки з файлами",
	"showFixedPostForm": "Показати форму запису над стрічкою новин.",
	"reload": "Оновити",
	"timelinesLabels": {
		"home": "Домівка",
		"local": "Локальна",
		"social": "Соціальна",
		"global": "Глобальна"
	},
	"lists": "Списки",
	"antennas": "Антени",
	"channel": "Канали",
	"timeline": "Стрічка"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"timelineDescriptionLabels": {
		"home": "Trong dòng thời gian Trang chính, bạn có thể xem ghi chú từ các tài khoản bạn theo dõi.",
		"local": "Trong dòng thời gian cục bộ, bạn có thể xem ghi chú từ tất cả người dùng trên máy chủ này.",
		"social": "Dòng thời gian Xã hội hiển thị các ghi chú từ cả dòng thời gian Trang chủ và Địa phương.",
		"global": "In the Global timeline, you can see notes from all connected servers."
	},
	"createNew": "Tạo mới",
	"options": "Tùy chọn",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"withSensitive": "Include notes with sensitive files",
	"fileAttachedOnly": "Only notes with files",
	"showFixedPostForm": "Hiện khung soạn tút ở phía trên bảng tin",
	"reload": "Tải lại",
	"timelinesLabels": {
		"home": "Trang chính",
		"local": "Máy chủ này",
		"social": "Xã hội",
		"global": "Liên hợp"
	},
	"lists": "Danh sách",
	"antennas": "Trạm phát sóng",
	"channel": "Kênh",
	"timeline": "Bảng tin"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"timelineDescriptionLabels": {
		"home": "首页时间线可以查看您关注的账户的帖子。",
		"local": "本地时间线可以查看这个服务器上所有用户发表的帖子。",
		"social": "社交时间线将同时显示首页时间线和本地时间线的内容。",
		"global": "全局时间线可以查看所有已联合的服务器上的帖子。"
	},
	"createNew": "新建",
	"options": "选项",
	"showRenotes": "显示转帖",
	"showRepliesToOthersInTimeline": "在时间线中显示对他人的回复",
	"withSensitive": "显示包含敏感媒体的帖子",
	"fileAttachedOnly": "仅限媒体",
	"showFixedPostForm": "在时间线顶部显示发帖框",
	"reload": "刷新",
	"timelinesLabels": {
		"home": "首页",
		"local": "本地",
		"social": "社交",
		"global": "全局"
	},
	"lists": "列表",
	"antennas": "天线",
	"channel": "频道",
	"timeline": "时间线"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"timelineDescriptionLabels": {
		"home": "在首頁時間軸上，可以看到您追隨的使用者的貼文。",
		"local": "在本地時間軸上，可以看到此伺服器所有使用者的貼文。",
		"social": "在社交時間軸上，可以看到首頁與本地時間軸的貼文。",
		"global": "在公開時間軸上，可以看到其他已連接伺服器的貼文。\n"
	},
	"createNew": "新建",
	"options": "選項",
	"showRenotes": "顯示其他人的轉發貼文",
	"showRepliesToOthersInTimeline": "在時間軸上顯示給其他人的回覆",
	"withSensitive": "顯示包含敏感檔案的貼文",
	"fileAttachedOnly": "只顯示包含附件的貼文",
	"showFixedPostForm": "於時間軸頁頂顯示「發送貼文」方框",
	"reload": "重新整理",
	"timelinesLabels": {
		"home": "首頁",
		"local": "本地",
		"social": "社交",
		"global": "公開"
	},
	"lists": "清單",
	"antennas": "天線",
	"channel": "頻道",
	"timeline": "時間軸"
}
</locale>
