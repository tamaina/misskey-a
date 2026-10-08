<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-show="!isDeleted"
	ref="rootEl"
	:class="$style.root"
>
	<EmNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="isRenote" :class="$style.renote">
		<EmAvatar :class="$style.renoteAvatar" :user="note.user" link/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<span :class="$style.renoteText">
			<I18n :src="$locale.sfc.renotedBy" tag="span">
				<template #user>
					<EmA :class="$style.renoteName" :to="userPage(note.user)">
						<EmUserName :user="note.user"/>
					</EmA>
				</template>
			</I18n>
		</span>
		<div :class="$style.renoteInfo">
			<div class="$style.renoteTime">
				<EmTime :time="note.createdAt"/>
			</div>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		</div>
	</div>
	<article :class="$style.note">
		<header :class="$style.noteHeader">
			<EmAvatar :class="$style.noteHeaderAvatar" :user="appearNote.user" indicator link/>
			<div :class="$style.noteHeaderBody">
				<div :class="$style.noteHeaderBodyUpper">
					<div style="min-width: 0;">
						<div class="_nowrap">
							<EmA :class="$style.noteHeaderName" :to="userPage(appearNote.user)">
								<EmUserName :nowrap="true" :user="appearNote.user"/>
							</EmA>
							<span v-if="appearNote.user.isBot" :class="$style.isBot">bot</span>
						</div>
						<div :class="$style.noteHeaderUsername"><EmAcct :user="appearNote.user"/></div>
					</div>
					<div :class="$style.noteHeaderInfo">
						<a :href="url" :class="$style.noteHeaderInstanceIconLink" target="_blank" rel="noopener noreferrer">
							<img :src="serverMetadata.iconUrl || '/favicon.ico'" alt="" :class="$style.noteHeaderInstanceIcon"/>
						</a>
					</div>
				</div>
				<EmInstanceTicker v-if="appearNote.user.instance != null" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div :class="[$style.noteContent, { [$style.contentCollapsed]: collapsed }]">
			<p v-if="appearNote.cw != null" :class="$style.cw">
				<EmMfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
				<button style="display: block; width: 100%; margin: 4px 0;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? $locale.sfc.cwHide : $locale.sfc.cwShow }}</button>
			</p>
			<div v-show="appearNote.cw == null || showContent">
				<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $locale.sfc.private }})</span>
				<EmA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></EmA>
				<EmMfm
					v-if="appearNote.text"
					:parsedNodes="parsed"
					:text="appearNote.text"
					:author="appearNote.user"
					:nyaize="'respect'"
					:emojiUrls="appearNote.emojis"
				/>
				<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
				<div v-if="appearNote.files && appearNote.files.length > 0">
					<EmMediaList :mediaList="appearNote.files" :originalEntityUrl="`${url}/notes/${appearNote.id}`"/>
				</div>
				<EmPoll v-if="appearNote.poll" ref="pollViewer" :noteId="appearNote.id" :poll="appearNote.poll" :readOnly="true" :class="$style.poll"/>
				<div v-if="appearNote.renote" :class="$style.quote"><EmNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
				<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
					<span :class="$style.collapsedLabel">{{ $locale.sfc.showMore }}</span>
				</button>
				<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
					<span :class="$style.showLessLabel">{{ $locale.sfc.showLess }}</span>
				</button>
			</div>
			<EmA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</EmA>
		</div>
		<footer>
			<div :class="$style.noteFooterInfo">
				<span v-if="appearNote.visibility !== 'public'" style="display: inline-block; margin-right: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[appearNote.visibility]">
					<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
					<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
					<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
				</span>
				<span v-if="appearNote.localOnly" style="display: inline-block; margin-right: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
				<EmA :to="notePage(appearNote)">
					<EmTime :time="appearNote.createdAt" mode="detail" colored/>
				</EmA>
			</div>
			<EmReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" ref="reactionsViewer" :maxNumber="16" :note="appearNote">
				<template #more>
					<EmA :to="`/notes/${appearNote.id}`" :class="[$style.reactionOmitted]">{{ $locale.sfc.more }}</EmA>
				</template>
			</EmReactionsViewer>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-arrow-back-up"></i>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-repeat"></i>
				<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.renoteCount) }}</p>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
				<i v-else class="ti ti-plus"></i>
				<p v-if="(appearNote.reactionAcceptance === 'likeOnly') && appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.reactionCount) }}</p>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-dots"></i>
			</a>
		</footer>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import I18n from '@features/runtime/frontend/embed/components/I18n.vue';
import EmMediaList from '@features/drive/frontend/embed/components/EmMediaList.vue';
import EmNoteSub from '@features/notes/frontend/embed/components/EmNoteSub.vue';
import EmNoteSimple from '@features/notes/frontend/embed/components/EmNoteSimple.vue';
import EmInstanceTicker from '@features/federation/frontend/embed/components/EmInstanceTicker.vue';
import EmReactionsViewer from '@features/notes/frontend/embed/components/EmReactionsViewer.vue';
import EmPoll from '@features/notes/frontend/embed/components/EmPoll.vue';
import EmA from '@features/navigation/frontend/embed/components/EmA.vue';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmTime from '@features/ui/frontend/embed/components/EmTime.vue';
import EmUserName from '@features/users/frontend/embed/components/EmUserName.vue';
import EmAcct from '@features/users/frontend/embed/components/EmAcct.vue';
import { userPage } from '@features/web/frontend/embed/utils.js';
import { notePage } from '@features/web/frontend/embed/utils.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { DI } from '@features/boot/frontend/embed/di.js';
import { shouldCollapsed } from '@features/notes/frontend/shared/collapsed.js';
import { url } from '@features/boot/frontend/shared/config.js';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const serverMetadata = inject(DI.serverMetadata)!;

const inChannel = inject('inChannel', null);

const note = ref(props.note);

const isRenote = (
	note.value.renote != null &&
	note.value.reply == null &&
	note.value.text == null &&
	note.value.cw == null &&
	note.value.fileIds && note.value.fileIds.length === 0 &&
	note.value.poll == null
);

const appearNote = computed(() => isRenote ? note.value.renote as Misskey.entities.Note : note.value);
const showContent = ref(false);
const isDeleted = ref(false);
const parsed = appearNote.value.text ? mfm.parse(appearNote.value.text) : null;
const isLong = shouldCollapsed(appearNote.value, []);
const collapsed = ref(appearNote.value.cw == null && isLong);
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: clip;
	contain: content;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
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
	padding: 24px 32px 16px;
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
	width: 50px;
	height: 50px;
}

.noteHeaderBody {
	flex: 1;
	display: flex;
	min-width: 0;
	flex-direction: column;
	justify-content: center;
	padding-left: 16px;
	font-size: 0.95em;
}

.noteHeaderBodyUpper {
	display: flex;
	min-width: 0;
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
	margin-left: auto;
	display: flex;
	gap: 0.5em;
	align-items: center;
}

.noteHeaderInstanceIconLink {
	display: inline-block;
	margin-left: 4px;
}

.noteHeaderInstanceIcon {
	width: 32px;
	height: 32px;
	border-radius: 4px;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	line-height: 1.3;
	word-wrap: anywhere;
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

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
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
	background: linear-gradient(0deg, var(--MI_THEME-panel), var(--MI_THEME-X15));

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

.footerButtonLink:hover,
.footerButtonLink:focus,
.footerButtonLink:active {
	text-decoration: none;
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--MI_THEME-accent);
	}
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
</style>

<locale lang="json" locale="ar-SA">
{
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
	"cwHide": "إخفاء",
	"cwShow": "عرض المزيد",
	"private": "خاص",
	"showMore": "عرض المزيد",
	"showLess": "اغلق",
	"more": "المزيد!"
}
</locale>

<locale lang="json" locale="ca-ES">
{
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
	"cwHide": "Amagar",
	"cwShow": "Carregar més",
	"private": "Privat",
	"showMore": "Veure més",
	"showLess": "Mostrar menys",
	"more": "Més"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
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
	"cwHide": "Skrýt",
	"cwShow": "Zobrazit více",
	"private": "Soukromý",
	"showMore": "Zobrazit více",
	"showLess": "Zavřít",
	"more": "Více!"
}
</locale>

<locale lang="json" locale="da-DK">
{
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
	"cwHide": "Hide",
	"cwShow": "Show content",
	"private": "Private",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!"
}
</locale>

<locale lang="json" locale="de-DE">
{
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
	"cwHide": "Inhalt verbergen",
	"cwShow": "Inhalt anzeigen",
	"private": "Privat",
	"showMore": "Mehr anzeigen",
	"showLess": "Schließen",
	"more": "Mehr!"
}
</locale>

<locale lang="json" locale="en-US">
{
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
	"cwHide": "Hide",
	"cwShow": "Show content",
	"private": "Private",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!"
}
</locale>

<locale lang="json" locale="es-ES">
{
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
	"cwHide": "Ocultar",
	"cwShow": "Ver más",
	"private": "Privado",
	"showMore": "Ver más",
	"showLess": "Cerrar",
	"more": "¡Más!"
}
</locale>

<locale lang="json" locale="fr-FR">
{
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
	"cwHide": "Masquer",
	"cwShow": "Afficher le contenu",
	"private": "Privé",
	"showMore": "Voir plus",
	"showLess": "Fermer",
	"more": "Plus !"
}
</locale>

<locale lang="json" locale="id-ID">
{
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
	"cwHide": "Sembunyikan",
	"cwShow": "Lihat konten",
	"private": "Tersembunyi",
	"showMore": "Selebihnya",
	"showLess": "Tutup",
	"more": "Lainnya"
}
</locale>

<locale lang="json" locale="it-IT">
{
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
	"cwHide": "Nascondere",
	"cwShow": "Continua la lettura...",
	"private": "Privato",
	"showMore": "Espandi",
	"showLess": "Comprimi",
	"more": "Di più!"
}
</locale>

<locale lang="json" locale="ja-JP">
{
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
	"cwHide": "隠す",
	"cwShow": "もっと見る",
	"private": "非公開",
	"showMore": "もっと見る",
	"showLess": "閉じる",
	"more": "もっと！"
}
</locale>

<locale lang="json" locale="ja-KS">
{
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
	"cwHide": "隠す",
	"cwShow": "続き見して！",
	"private": "非公開",
	"showMore": "まだまだあるで！",
	"showLess": "さいなら",
	"more": "他のん"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
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
	"cwHide": "Hide",
	"cwShow": "Wali ugar",
	"private": "Private",
	"showMore": "Wali ugar",
	"showLess": "Close",
	"more": "More!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
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
	"cwHide": "Hide",
	"cwShow": "ಇನ್ನಷ್ಟು ನೋಡು",
	"private": "Private",
	"showMore": "ಇನ್ನಷ್ಟು ನೋಡು",
	"showLess": "Close",
	"more": "More!"
}
</locale>

<locale lang="json" locale="ko-KR">
{
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
	"cwHide": "숨기기",
	"cwShow": "더 보기",
	"private": "비공개",
	"showMore": "더 보기",
	"showLess": "닫기",
	"more": "더 보기!"
}
</locale>

<locale lang="json" locale="nl-NL">
{
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
	"cwHide": "Hide",
	"cwShow": "Laad meer",
	"private": "Privé",
	"showMore": "Toon meer",
	"showLess": "Sluiten",
	"more": "Meer!"
}
</locale>

<locale lang="json" locale="no-NO">
{
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
	"cwHide": "Skjul",
	"cwShow": "Vis mer",
	"private": "Private",
	"showMore": "Vis mer",
	"showLess": "Lukk",
	"more": "Mer!"
}
</locale>

<locale lang="json" locale="pl-PL">
{
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
	"cwHide": "Ukryj",
	"cwShow": "Załaduj więcej",
	"private": "Prywatne",
	"showMore": "Załaduj więcej",
	"showLess": "Zamknij",
	"more": "Więcej!"
}
</locale>

<locale lang="json" locale="pt-PT">
{
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
	"cwHide": "Esconder",
	"cwShow": "Carregar mais",
	"private": "Privado",
	"showMore": "Ver mais",
	"showLess": "Fechar",
	"more": "Mais!"
}
</locale>

<locale lang="json" locale="ru-RU">
{
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
	"cwHide": "Спрятать",
	"cwShow": "Показать",
	"private": "Личное",
	"showMore": "Показать ещё",
	"showLess": "Закрыть",
	"more": "Ещё!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
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
	"cwHide": "Skryť",
	"cwShow": "Zobraziť viac",
	"private": "Súkromné",
	"showMore": "Zobraziť viac",
	"showLess": "Zavrieť",
	"more": "Viac!"
}
</locale>

<locale lang="json" locale="th-TH">
{
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
	"cwHide": "ซ่อน",
	"cwShow": "ดูเพิ่มเติม",
	"private": "ส่วนตัว",
	"showMore": "แสดงเพิ่มเติม",
	"showLess": "ปิด",
	"more": "เพิ่มเติม!"
}
</locale>

<locale lang="json" locale="tr-TR">
{
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
	"cwHide": "Gizle",
	"cwShow": "İçeriği göster",
	"private": "Özel",
	"showMore": "Daha fazlasını göster",
	"showLess": "Kapat",
	"more": "Daha fazlası!"
}
</locale>

<locale lang="json" locale="ug-CN">
{
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
	"cwHide": "Hide",
	"cwShow": "Show content",
	"private": "Private",
	"showMore": "Show more",
	"showLess": "Close",
	"more": "More!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
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
	"cwHide": "Сховати",
	"cwShow": "Показати більше",
	"private": "Приватне",
	"showMore": "Показати більше",
	"showLess": "Закрити",
	"more": "Бiльше!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
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
	"cwHide": "Ẩn",
	"cwShow": "Tải thêm",
	"private": "Riêng tư",
	"showMore": "Xem thêm",
	"showLess": "Đóng",
	"more": "Thêm nữa!"
}
</locale>

<locale lang="json" locale="zh-CN">
{
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
	"cwHide": "隐藏",
	"cwShow": "查看更多",
	"private": "私密",
	"showMore": "查看更多",
	"showLess": "关闭",
	"more": "更多！"
}
</locale>

<locale lang="json" locale="zh-TW">
{
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
	"cwHide": "隱藏",
	"cwShow": "顯示內容",
	"private": "私密",
	"showMore": "載入更多",
	"showLess": "關閉",
	"more": "更多！"
}
</locale>
