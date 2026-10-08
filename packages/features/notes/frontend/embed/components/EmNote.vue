<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-show="!isDeleted"
	ref="rootEl"
	:class="[$style.root]"
	:tabindex="isDeleted ? '-1' : '0'"
>
	<EmNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="pinned" :class="$style.tip"><i class="ti ti-pin"></i> {{ $locale.sfc.pinnedNote }}</div>
	<!--<div v-if="appearNote._prId_" class="tip"><i class="ti ti-speakerphone"></i> {{ i18n.ts.promotion }}<button class="_textButton hide" @click="readPromo()">{{ i18n.ts.hideThisNote }} <i class="ti ti-x"></i></button></div>-->
	<!--<div v-if="appearNote._featuredId_" class="tip"><i class="ti ti-bolt"></i> {{ i18n.ts.featured }}</div>-->
	<div v-if="isRenote" :class="$style.renote">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<EmAvatar :class="$style.renoteAvatar" :user="note.user" link/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<I18n :src="$locale.sfc.renotedBy" tag="span" :class="$style.renoteText">
			<template #user>
				<EmA :class="$style.renoteUserName" :to="userPage(note.user)">
					<EmUserName :user="note.user"/>
				</EmA>
			</template>
		</I18n>
		<div :class="$style.renoteInfo">
			<button ref="renoteTime" :class="$style.renoteTime" class="_button">
				<i class="ti ti-dots" :class="$style.renoteMenu"></i>
				<EmTime :time="note.createdAt"/>
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
	<article :class="$style.article">
		<div v-if="appearNote.channel" :class="$style.colorBar" :style="{ background: appearNote.channel.color }"></div>
		<EmAvatar :class="$style.avatar" :user="appearNote.user" link/>
		<div :class="$style.main">
			<EmNoteHeader :note="appearNote" :mini="true"/>
			<EmInstanceTicker v-if="appearNote.user.instance != null" :instance="appearNote.user.instance"/>
			<div style="container-type: inline-size;">
				<p v-if="appearNote.cw != null" :class="$style.cw">
					<EmMfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
					<button style="display: block; width: 100%; margin: 4px 0;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? $locale.sfc.cwHide : $locale.sfc.cwShow }}</button>
				</p>
				<div v-show="appearNote.cw == null || showContent" :class="[{ [$style.contentCollapsed]: collapsed }]">
					<div :class="$style.text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $locale.sfc.private }})</span>
						<EmA v-if="appearNote.replyId" :class="$style.replyIcon" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></EmA>
						<EmMfm
							v-if="appearNote.text"
							:parsedNodes="parsed"
							:text="appearNote.text"
							:author="appearNote.user"
							:nyaize="'respect'"
							:emojiUrls="appearNote.emojis"
							:enableEmojiMenu="!true"
							:enableEmojiMenuReaction="true"
						/>
					</div>
					<div v-if="appearNote.files && appearNote.files.length > 0">
						<EmMediaList :mediaList="appearNote.files" :originalEntityUrl="`${url}/notes/${appearNote.id}`"/>
					</div>
					<EmPoll v-if="appearNote.poll" :noteId="appearNote.id" :poll="appearNote.poll" :readOnly="true" :class="$style.poll"/>
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
			<EmReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" :note="appearNote" :maxNumber="16">
				<template #more>
					<EmA :to="`/notes/${appearNote.id}/reactions`" :class="[$style.reactionOmitted]">{{ $locale.sfc.more }}</EmA>
				</template>
			</EmReactionsViewer>
			<footer :class="$style.footer">
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-arrow-back-up"></i>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-repeat"></i>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
					<i v-else class="ti ti-plus"></i>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-dots"></i>
				</a>
			</footer>
		</div>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, shallowRef } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { shouldCollapsed } from '@features/notes/frontend/shared/collapsed.js';
import { url } from '@features/boot/frontend/shared/config.js';
import I18n from '@features/runtime/frontend/embed/components/I18n.vue';
import EmNoteSub from '@features/notes/frontend/embed/components/EmNoteSub.vue';
import EmNoteHeader from '@features/notes/frontend/embed/components/EmNoteHeader.vue';
import EmNoteSimple from '@features/notes/frontend/embed/components/EmNoteSimple.vue';
import EmInstanceTicker from '@features/federation/frontend/embed/components/EmInstanceTicker.vue';
import EmReactionsViewer from '@features/notes/frontend/embed/components/EmReactionsViewer.vue';
import EmMediaList from '@features/drive/frontend/embed/components/EmMediaList.vue';
import EmPoll from '@features/notes/frontend/embed/components/EmPoll.vue';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';
import EmA from '@features/navigation/frontend/embed/components/EmA.vue';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmUserName from '@features/users/frontend/embed/components/EmUserName.vue';
import EmTime from '@features/ui/frontend/embed/components/EmTime.vue';
import { userPage } from '@features/web/frontend/embed/utils.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';

function getAppearNote(note: Misskey.entities.Note) {
	return Misskey.note.isPureRenote(note) ? note.renote : note;
}

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	pinned?: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'reaction', emoji: string): void;
	(ev: 'removeReaction', emoji: string): void;
}>();

const inChannel = inject('inChannel', null);

const note = ref((props.note));

const isRenote = Misskey.note.isPureRenote(note.value);

const rootEl = shallowRef<HTMLElement>();
const renoteTime = shallowRef<HTMLElement>();
const appearNote = computed(() => getAppearNote(note.value) ?? note.value);
const showContent = ref(false);
const parsed = computed(() => appearNote.value.text ? mfm.parse(appearNote.value.text) : null);
const isLong = shouldCollapsed(appearNote.value, []);
const collapsed = ref(appearNote.value.cw == null && isLong);
const isDeleted = ref(false);
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;
	content-visibility: auto;
  contain-intrinsic-size: 0 150px;

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
		opacity: 1;
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
	position: sticky !important;
	top: calc(22px + var(--MI-stickyTop, 0px));
	left: 0;
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

.footerButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;
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
		top: calc(14px + var(--MI-stickyTop, 0px));
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

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
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
	"cwHide": "隱藏",
	"cwShow": "顯示內容",
	"private": "私密",
	"showMore": "載入更多",
	"showLess": "關閉",
	"more": "更多！"
}
</locale>
