<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="600"
	:height="650"
	@close="close(true)"
	@closed="emit('closed')"
>
	<template v-if="page === 1" #header><i class="ti ti-pencil"></i> {{ $locale.sfc.initialTutorialNoteTitle }}</template>
	<template v-else-if="page === 2" #header><i class="ti ti-mood-smile"></i> {{ $locale.sfc.initialTutorialReactionTitle }}</template>
	<template v-else-if="page === 3" #header><i class="ti ti-home"></i> {{ $locale.sfc.initialTutorialTimelineTitle }}</template>
	<template v-else-if="page === 4" #header><i class="ti ti-pencil-plus"></i> {{ $locale.sfc.initialTutorialPostNoteTitle }}</template>
	<template v-else-if="page === 5" #header><i class="ti ti-eye-exclamation"></i> {{ $locale.sfc.initialTutorialHowToMakeAttachmentsSensitiveTitle }}</template>
	<template v-else #header>{{ $locale.sfc.initialTutorialTitle }}</template>

	<div style="overflow-x: clip;">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<template v-if="page === 0">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-confetti" style="display: block; margin: auto; font-size: 3em; color: var(--MI_THEME-accent);"></i>
							<div style="font-size: 120%;">{{ $locale.sfc.initialTutorialLandingTitle }}</div>
							<div>{{ $locale.sfc.initialTutorialLandingDescription }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" @click="page++">{{ $locale.sfc.initialTutorialLaunchTutorial }} <i class="ti ti-arrow-right"></i></MkButton>
							<MkButton style="margin: 0 auto;" transparent rounded @click="close(true)">{{ $locale.sfc.close }}</MkButton>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 1">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<XNote phase="aboutNote"/>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton v-if="initialPage !== 1" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 2">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<div class="_gaps">
								<XNote phase="howToReact" @reacted="isReactionTutorialPushed = true"/>
								<div v-if="!isReactionTutorialPushed">{{ $locale.sfc.initialTutorialReactionReactToContinue }}</div>
							</div>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton v-if="initialPage !== 2" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate :disabled="!isReactionTutorialPushed" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 3">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<XTimeline/>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton v-if="initialPage !== 3" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 4">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<XPostNote/>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton v-if="initialPage !== 3" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 5">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<div class="_gaps">
								<XSensitive @succeeded="isSensitiveTutorialSucceeded = true"/>
								<div v-if="!isSensitiveTutorialSucceeded">{{ $locale.sfc.initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue }}</div>
							</div>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton v-if="initialPage !== 2" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate :disabled="!isSensitiveTutorialSucceeded" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 6">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-check" style="display: block; margin: auto; font-size: 3em; color: var(--MI_THEME-accent);"></i>
							<div style="font-size: 120%;">{{ $locale.sfc.initialTutorialDoneTitle }}</div>
							<I18n :src="$locale.sfc.initialTutorialDoneDescription" tag="div" style="padding: 0 16px;">
								<template #link>
									<a href="https://misskey-hub.net/docs/for-users/" target="_blank" class="_link">{{ $locale.sfc.help }}</a>
								</template>
							</I18n>
							<div>{{ interpolateLocaleParameters($locale.sfc.initialAccountSettingHaveFun, { name: instance.name ?? host }) }}</div>
							<div class="_buttonsCenter" style="margin-top: 16px;">
								<MkButton v-if="initialPage !== 4" rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton rounded primary gradate @click="close(false)">{{ $locale.sfc.close }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, watch } from 'vue';
import { host } from '@features/boot/frontend/shared/config.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import XNote from '@features/notes/frontend/components/MkTutorialDialog.Note.vue';
import XTimeline from '@features/timelines/frontend/components/MkTutorialDialog.Timeline.vue';
import XPostNote from '@features/notes/frontend/components/MkTutorialDialog.PostNote.vue';
import XSensitive from '@features/media/frontend/components/MkTutorialDialog.Sensitive.vue';
import MkAnimBg from '@features/web/frontend/components/MkAnimBg.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { instance } from '@features/instance/frontend/instance.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import * as os from '@features/ui/frontend/os.js';

const props = defineProps<{
	initialPage?: number;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const page = ref(props.initialPage ?? 0);

watch(page, (to) => {
	// チュートリアルの枚数を増やしたら必ず変更すること！！
	if (to === 6) {
		claimAchievement('tutorialCompleted');
	}
});

const isReactionTutorialPushed = ref<boolean>(false);
const isSensitiveTutorialSucceeded = ref<boolean>(false);

async function close(skip: boolean) {
	if (skip) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.initialTutorialSkipAreYouSure,
		});
		if (canceled) return;
	}

	dialog.value?.close();
}
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100cqh;
	padding-bottom: 30px;
	box-sizing: border-box;
}

.pageRoot {
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.pageMain {
	flex-grow: 1;
	line-height: 1.5;
}

.pageFooter {
	position: sticky;
	z-index: 1;
	bottom: 0;
	left: 0;
	flex-shrink: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: blur(15px);
	backdrop-filter: blur(15px);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "اغلق",
	"goBack": "رجوع",
	"continue": "متابعة",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "المساعدة",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"initialTutorialNoteTitle": "Què és una Nota?",
	"initialTutorialReactionTitle": "Què són les Reaccions?",
	"initialTutorialTimelineTitle": "El concepte de les línies de temps",
	"initialTutorialPostNoteTitle": "Configuració de la publicació de les notes",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Com marcar adjunts com a contingut sensible?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Benvingut al tutorial",
	"initialTutorialLandingDescription": "Aquí aprendràs el bàsic per poder fer servir Misskey i les seves característiques.",
	"initialTutorialLaunchTutorial": "Començar tutorial",
	"close": "Tanca",
	"goBack": "Tornar",
	"continue": "Continuar",
	"initialTutorialReactionReactToContinue": "Afegeix una reacció per continuar.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Marca el fitxer adjunt com a sensible per poder continuar.",
	"initialTutorialDoneTitle": "Has completat el tutorial 🎉",
	"initialTutorialDoneDescription": "Les funcions explicades aquí és una petita mostra. Per una explicació més detallada de com fer servir MissKey consulta {link}.",
	"help": "Ajuda",
	"initialAccountSettingHaveFun": "Disfruta {name}!",
	"initialTutorialSkipAreYouSure": "Sortir del tutorial?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Zavřít",
	"goBack": "Zpět",
	"continue": "Pokračovat",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Nápověda",
	"initialAccountSettingHaveFun": "Užívejte {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Close",
	"goBack": "Back",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"initialTutorialNoteTitle": "Was sind Notizen?",
	"initialTutorialReactionTitle": "Was sind Reaktionen?",
	"initialTutorialTimelineTitle": "So funktionieren die Chroniken",
	"initialTutorialPostNoteTitle": "Optionen bei Abschicken einer Notiz",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Wie markiert man Anhänge als sensibel?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Willkommen zum Tutorial",
	"initialTutorialLandingDescription": "Hier kannst du sehen, wie Misskey funktioniert",
	"initialTutorialLaunchTutorial": "Tutorial ansehen",
	"close": "Schließen",
	"goBack": "Zurück",
	"continue": "Fortfahren",
	"initialTutorialReactionReactToContinue": "Füge eine Reaktion hinzu, um fortzufahren.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Markiere die angehängte Datei als sensibel, um fortzufahren.",
	"initialTutorialDoneTitle": "Du hast das Tutorial abgeschlossen! 🎉",
	"initialTutorialDoneDescription": "Die hier beschriebenen Funktionen sind nur ein kleiner Teil dessen, was Misskey zu bieten hat; um mehr darüber zu erfahren, wie du Misskey benutzen kannst, besuche bitte {link}.",
	"help": "Hilfe",
	"initialAccountSettingHaveFun": "Viel Spaß mit {name}!",
	"initialTutorialSkipAreYouSure": "Möchtest du das Tutorial verlassen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Close",
	"goBack": "Back",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"initialTutorialNoteTitle": "¿Qué es una nota?",
	"initialTutorialReactionTitle": "¿Qué son las reacciones?",
	"initialTutorialTimelineTitle": "El concepto de Línea de tiempo",
	"initialTutorialPostNoteTitle": "Ajustes de publicación de nota",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "¿Cómo puedo marcar adjuntos como contenido sensible?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Bienvenid@ al tutorial",
	"initialTutorialLandingDescription": "Aquí podrás aprender las nociones básicas sobre cómo usar Misskey y sus funciones.",
	"initialTutorialLaunchTutorial": "Comenzar tutorial",
	"close": "Cerrar",
	"goBack": "Anterior",
	"continue": "Continuar",
	"initialTutorialReactionReactToContinue": "Añade una reacción para continuar.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Marca el archivo adjunto como sensible para continuar.",
	"initialTutorialDoneTitle": "¡Has completado el tutorial! 🎉",
	"initialTutorialDoneDescription": "Las funciones que mostramos aquí son sólo una pequeña parte. Para más detalles sobre el funcionamiento de Misskey, pulsa en este enlace: {link}",
	"help": "Ayuda",
	"initialAccountSettingHaveFun": "¡Disfruta de {name}!",
	"initialTutorialSkipAreYouSure": "¿Salir del tutorial?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"initialTutorialNoteTitle": "Qu'est-ce que les notes ?",
	"initialTutorialReactionTitle": "Qu'est-ce que les réactions ?",
	"initialTutorialTimelineTitle": "Fonctionnement des fils",
	"initialTutorialPostNoteTitle": "Paramètres de la publication de note",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Comment marquer un fichier joint comme sensible ?",
	"initialTutorialTitle": "Tutoriel",
	"initialTutorialLandingTitle": "Bienvenue dans le tutoriel",
	"initialTutorialLandingDescription": "Ici, vous pouvez apprendre l'utilisation de base de Misskey et ses fonctionnalités.",
	"initialTutorialLaunchTutorial": "Visionner le tutoriel",
	"close": "Fermer",
	"goBack": "Retour",
	"continue": "Continuer",
	"initialTutorialReactionReactToContinue": "Ajoutez une réaction pour procéder.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Marquez le fichier joint comme sensible pour procéder.",
	"initialTutorialDoneTitle": "Le tutoriel est terminé ! 🎉",
	"initialTutorialDoneDescription": "Les fonctionnalités introduites ici ne sont que quelques-unes. Pour savoir plus sur l'utilisation de Misskey, veuillez consulter {link}.",
	"help": "Aide",
	"initialAccountSettingHaveFun": "Profitez de {name}\u00a0!",
	"initialTutorialSkipAreYouSure": "Quitter le tutoriel ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"initialTutorialNoteTitle": "Apa itu Catatan?",
	"initialTutorialReactionTitle": "Apa itu Reaksi?",
	"initialTutorialTimelineTitle": "Konsep Lini Masa",
	"initialTutorialPostNoteTitle": "Pengaturan posting Catatan",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Bagaimana menandai lampiran sebagai sensitif?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Selamat datang di Tutorial",
	"initialTutorialLandingDescription": "Di sini kamu dapat mempelajari dasar-dasar dari penggunaan Misskey dan fitur-fiturnya.",
	"initialTutorialLaunchTutorial": "Lihat Tutorial",
	"close": "Tutup",
	"goBack": "Kembali",
	"continue": "Lanjutkan",
	"initialTutorialReactionReactToContinue": "Tambahkan reaksi untuk melanjutkan.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Tandai berkas terlampir sebagai sensitif untuk melanjutkan.",
	"initialTutorialDoneTitle": "Kamu telah menyelesaikan tutorial! 🎉",
	"initialTutorialDoneDescription": "Fungsi yang diperkenalkan di sini merupakan sebagian kecil dari fitur yang ada. Untuk pemahaman lebih detil dalam menggunakan Misskey, kamu dapat merujuk ke {link}.",
	"help": "Bantuan",
	"initialAccountSettingHaveFun": "Selamat menikmati, {name}!",
	"initialTutorialSkipAreYouSure": "Berhenti dari Tutorial?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"initialTutorialNoteTitle": "Cosa sono le Note?",
	"initialTutorialReactionTitle": "Cosa sono le Reazioni?",
	"initialTutorialTimelineTitle": "Come funziona la Timeline",
	"initialTutorialPostNoteTitle": "La Nota e le sue impostazioni",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Come indicare che gli allegati sono espliciti?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Eccoci nel tutorial",
	"initialTutorialLandingDescription": "Qui puoi verificare l'uso delle funzionalità base di Misskey.",
	"initialTutorialLaunchTutorial": "Inizia il tutorial",
	"close": "Chiudi",
	"goBack": "Indietro",
	"continue": "Continua",
	"initialTutorialReactionReactToContinue": "Aggiungere la Reazione ti consentirà di procedere col tutorial.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Imposta l'immagine come esplicita per procedere col tutorial.",
	"initialTutorialDoneTitle": "Il tutorial è finito! 🎉",
	"initialTutorialDoneDescription": "Queste sono solamente alcune delle funzionalità principali di Misskey. Per ulteriori informazioni, {link}.",
	"help": "Guida",
	"initialAccountSettingHaveFun": "Divertiti con {name}!",
	"initialTutorialSkipAreYouSure": "Vuoi davvero interrompere il tutorial?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"initialTutorialNoteTitle": "ノートって何？",
	"initialTutorialReactionTitle": "リアクションって何？",
	"initialTutorialTimelineTitle": "タイムラインのしくみ",
	"initialTutorialPostNoteTitle": "ノートの投稿設定",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "添付ファイルをセンシティブにするには？",
	"initialTutorialTitle": "チュートリアル",
	"initialTutorialLandingTitle": "チュートリアルへようこそ",
	"initialTutorialLandingDescription": "ここでは、Misskeyの基本的な使い方や機能を確認できます。",
	"initialTutorialLaunchTutorial": "チュートリアルを見る",
	"close": "閉じる",
	"goBack": "戻る",
	"continue": "続ける",
	"initialTutorialReactionReactToContinue": "リアクションをつけると先に進めるようになります。",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "画像をセンシティブに設定すると先に進めるようになります。",
	"initialTutorialDoneTitle": "チュートリアルは終了です🎉",
	"initialTutorialDoneDescription": "ここで紹介した機能はほんの一部にすぎません。Misskeyの使い方をより詳しく知るには、{link}をご覧ください。",
	"help": "ヘルプ",
	"initialAccountSettingHaveFun": "{name}をお楽しみください！",
	"initialTutorialSkipAreYouSure": "チュートリアルを終了しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"initialTutorialNoteTitle": "ノートってなんや？",
	"initialTutorialReactionTitle": "ツッコミってなんや？",
	"initialTutorialTimelineTitle": "タイムラインのしくみ",
	"initialTutorialPostNoteTitle": "ノートの投稿設定",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "のっけたファイルをセンシティブにするんは？",
	"initialTutorialTitle": "チュートリアルやで",
	"initialTutorialLandingTitle": "チュートリアルによう来たな",
	"initialTutorialLandingDescription": "ここでは、Misskeyのカンタンな使い方とか機能を確かめれんで。",
	"initialTutorialLaunchTutorial": "チュートリアル見るで",
	"close": "さいなら",
	"goBack": "戻る",
	"continue": "続けるで",
	"initialTutorialReactionReactToContinue": "ツッコんだら進めるようになるで。",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "画像をちゃんと設定したら先に進めるで。",
	"initialTutorialDoneTitle": "チュートリアル終わり！おつかれさん🎉",
	"initialTutorialDoneDescription": "ここで紹介したのは全部の中のちょび～っとだけや。もっと使い方知りたいんやったら、{link}を見ときや。",
	"help": "ヘルプ",
	"initialAccountSettingHaveFun": "{name}、楽しんでな～",
	"initialTutorialSkipAreYouSure": "チュートリアルやめるか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Close",
	"goBack": "Back",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Close",
	"goBack": "Back",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"initialTutorialNoteTitle": "'노트'가 무엇인가요?",
	"initialTutorialReactionTitle": "'리액션'이 무엇인가요?",
	"initialTutorialTimelineTitle": "타임라인에 대하여",
	"initialTutorialPostNoteTitle": "노트 게시 설정",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "첨부 파일을 열람주의로 설정하려면?",
	"initialTutorialTitle": "튜토리얼",
	"initialTutorialLandingTitle": "튜토리얼에 오신 걸 환영합니다",
	"initialTutorialLandingDescription": "여기서는 미스키의 기본적인 사용법이나 기능을 확인할 수 있습니다.",
	"initialTutorialLaunchTutorial": "튜토리얼 보기",
	"close": "닫기",
	"goBack": "뒤로",
	"continue": "계속",
	"initialTutorialReactionReactToContinue": "다음으로 진행하려면 리액션을 보내세요.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "이미지를 열람 주의로 설정하면 다음으로 넘어갈 수 있게 됩니다.",
	"initialTutorialDoneTitle": "튜토리얼이 끝났습니다! 🎉",
	"initialTutorialDoneDescription": "여기에서 소개한 기능은 극히 일부에 지나지 않습니다. Misskey의 사용 방법을 더 자세히 알아보려면 {link}를 확인해 주세요!",
	"help": "도움말",
	"initialAccountSettingHaveFun": "{name}와 함께 즐거운 시간 보내세요!",
	"initialTutorialSkipAreYouSure": "튜토리얼을 종료하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Sluiten",
	"goBack": "Terug",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Lukk",
	"goBack": "Back",
	"continue": "Fortsett",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Hjelp",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Zamknij",
	"goBack": "Wróć",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Pomoc",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"initialTutorialNoteTitle": "O que é uma Nota?",
	"initialTutorialReactionTitle": "O que são Reações?",
	"initialTutorialTimelineTitle": "O Conceito das Linhas do Tempo",
	"initialTutorialPostNoteTitle": "Opções de Postagem de Nota",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Como Marcar Anexos como Sensíveis?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Bem-vindo ao Tutorial!",
	"initialTutorialLandingDescription": "Aqui, você pode aprender o básico de como usar o Misskey e as suas funções.",
	"initialTutorialLaunchTutorial": "Iniciar Tutorial",
	"close": "Fechar",
	"goBack": "Voltar",
	"continue": "Continuar",
	"initialTutorialReactionReactToContinue": "Adicione uma reação para continuar.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Marque o anexo como sensível para prosseguir.",
	"initialTutorialDoneTitle": "Você completou o tutorial! 🎉",
	"initialTutorialDoneDescription": "As funções apresentadas aqui são apenas uma pequena parte. Para um conhecimento mais detalhado do uso do Misskey, acesse {link}.",
	"help": "Ajuda",
	"initialAccountSettingHaveFun": "Aproveite {name}!",
	"initialTutorialSkipAreYouSure": "Sair do Tutorial?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"initialTutorialNoteTitle": "Что такое заметка?",
	"initialTutorialReactionTitle": "Что такое реакции?",
	"initialTutorialTimelineTitle": "Концепция Лент",
	"initialTutorialPostNoteTitle": "Настройки выкладывания заметки",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Туториал",
	"initialTutorialLandingTitle": "Добро пожаловать в Туториал",
	"initialTutorialLandingDescription": "Здесь вы можете изучить основы пользования Misskey и его особенностями.",
	"initialTutorialLaunchTutorial": "Пройти обучение",
	"close": "Закрыть",
	"goBack": "Выход",
	"continue": "Продолжить",
	"initialTutorialReactionReactToContinue": "Добавьте реакцию, чтобы продолжить.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "Вы прошли туториал! 🎉",
	"initialTutorialDoneDescription": "Вещи показанные тут это лишь малая часть. Для более детального понимания Misskey загляните в {link}.",
	"help": "Помощь",
	"initialAccountSettingHaveFun": "Наслаждайтесь {name}!",
	"initialTutorialSkipAreYouSure": "Покинуть Туториал?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Zavrieť",
	"goBack": "Späť",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Pomoc",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"initialTutorialNoteTitle": "โน้ตคืออะไร?",
	"initialTutorialReactionTitle": "รีแอคชั่นคืออะไร?",
	"initialTutorialTimelineTitle": "แนวคิดเรื่องของไทม์ไลน์",
	"initialTutorialPostNoteTitle": "ตั้งค่าการโพสต์โน้ต",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "จะทำเครื่องหมายไฟล์แนบว่ามีเนื้อหาละเอียดอ่อนได้อย่างไร?",
	"initialTutorialTitle": "บทช่วยสอน",
	"initialTutorialLandingTitle": "ยินดีต้อนรับสู่บทช่วยสอน",
	"initialTutorialLandingDescription": "คุณสามารถตรวจสอบการใช้งานและฟังก์ชั่นพื้นฐานของ Misskey ได้ที่นี่",
	"initialTutorialLaunchTutorial": "เริ่มบทช่วยสอน",
	"close": "ปิด",
	"goBack": "ย้อนกลับ",
	"continue": "ดำเนินการต่อ",
	"initialTutorialReactionReactToContinue": "เพิ่มรีแอคชั่นเพื่อดำเนินการต่อ",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "ทำเครื่องหมายกับรูปภาพว่ามีเนื้อหาละเอียดอ่อน เพื่อดำเนินการต่อ",
	"initialTutorialDoneTitle": "บทเรียนจบลงแล้วจ้า เย่เย่เย่  🎉",
	"initialTutorialDoneDescription": "คุณสมบัติที่แนะนำในที่นี่เป็นเพียงบางส่วนเท่านั้น หากต้องการเรียนรู้เพิ่มเติมเกี่ยวกับวิธีใช้ Misskey โปรดไปที่ {link}",
	"help": "ช่วยเหลือ",
	"initialAccountSettingHaveFun": "ขอให้สนุกกับ {name}!",
	"initialTutorialSkipAreYouSure": "ต้องการออกจากบทช่วยสอนใช่ไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"initialTutorialNoteTitle": "Not nedir?",
	"initialTutorialReactionTitle": "Reaksiyonlar nedir?",
	"initialTutorialTimelineTitle": "Pano Kavramı",
	"initialTutorialPostNoteTitle": "Not Yayınlama Ayarları",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Ekleri Hassas Olarak İşaretleme",
	"initialTutorialTitle": "Öğretici",
	"initialTutorialLandingTitle": "Öğreticiye hoş geldin",
	"initialTutorialLandingDescription": "Burada, Misskey'i kullanmanın temellerini ve özelliklerini öğrenebilirsin.",
	"initialTutorialLaunchTutorial": "Öğreticiyi izle",
	"close": "Kapat",
	"goBack": "Geri",
	"continue": "Devam et",
	"initialTutorialReactionReactToContinue": "Devam etmek için bir tepki ekle.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Devam etmek için ek dosyayı hassas olarak işaretle.",
	"initialTutorialDoneTitle": "Eğitimi tamamladınız! 🎉",
	"initialTutorialDoneDescription": "Burada tanıtılan işlevler sadece küçük bir kısmıdır. Misskey'i kullanma konusunda daha ayrıntılı bilgi için lütfen şu kaynağa bakın: {link}.",
	"help": "Yardım",
	"initialAccountSettingHaveFun": "{name} ile iyi eğlenceler!",
	"initialTutorialSkipAreYouSure": "Öğreticiyi kapatmak mı istiyorsunuz?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"initialTutorialNoteTitle": "What is a Note?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Tutorial",
	"initialTutorialLandingTitle": "Welcome to the Tutorial",
	"initialTutorialLandingDescription": "Here, you can learn the basics of using Misskey and its features.",
	"initialTutorialLaunchTutorial": "Start Tutorial",
	"close": "Close",
	"goBack": "Back",
	"continue": "Continue",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Help",
	"initialAccountSettingHaveFun": "Enjoy {name}!",
	"initialTutorialSkipAreYouSure": "Quit Tutorial?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"initialTutorialNoteTitle": "Що таке нотатка?",
	"initialTutorialReactionTitle": "Що таке реакція?",
	"initialTutorialTimelineTitle": "Концепт Стрічок",
	"initialTutorialPostNoteTitle": "Налаштування публікації нотатки",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "Як позначати додатки як чутливі?",
	"initialTutorialTitle": "Посібник",
	"initialTutorialLandingTitle": "Ласкаво просимо до Посібника",
	"initialTutorialLandingDescription": "Тут ви можете ознайомитися з основами використання Misskey та його особливостями. ",
	"initialTutorialLaunchTutorial": "Почати посібник",
	"close": "Закрити",
	"goBack": "Назад",
	"continue": "Продовжити",
	"initialTutorialReactionReactToContinue": "Додайте реакцію, щоб продовжити.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Позначте доданий файл як чутливий щоб продовжити.",
	"initialTutorialDoneTitle": "Ви завершили посібник! 🎉",
	"initialTutorialDoneDescription": "Показані функції це лише мала частина. Щоб дізнатися детальніше про використання Misskey, зверніться до {link}.",
	"help": "Допомога",
	"initialAccountSettingHaveFun": "Насолоджуйтесь {name}!",
	"initialTutorialSkipAreYouSure": "Вимкнути посібник?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"initialTutorialNoteTitle": "Bài Viết là gì?",
	"initialTutorialReactionTitle": "What are Reactions?",
	"initialTutorialTimelineTitle": "The Concept of Timelines",
	"initialTutorialPostNoteTitle": "Note Posting Settings",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "How to Mark Attachments as Sensitive?",
	"initialTutorialTitle": "Hướng dẫn",
	"initialTutorialLandingTitle": "Chào mừng đến với Hướng dẫn",
	"initialTutorialLandingDescription": "Tại đây, bạn có thể tìm hiểu những điều cơ bản về cách sử dụng Misskey và các tính năng của nó.",
	"initialTutorialLaunchTutorial": "Bắt đầu hướng dẫn",
	"close": "Đóng",
	"goBack": "Quay lại",
	"continue": "Tiếp tục",
	"initialTutorialReactionReactToContinue": "Add a reaction to proceed.",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "Mark the attachment file as sensitive to proceed.",
	"initialTutorialDoneTitle": "You've completed the tutorial! 🎉",
	"initialTutorialDoneDescription": "The functions introduced here are just a small part. For a more detailed understanding of using Misskey, please refer to {link}.",
	"help": "Trợ giúp",
	"initialAccountSettingHaveFun": "Hãy tận hưởng {name} nhé!",
	"initialTutorialSkipAreYouSure": "Thoát khỏi hướng dẫn?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"initialTutorialNoteTitle": "什么是帖子？",
	"initialTutorialReactionTitle": "什么是回应？",
	"initialTutorialTimelineTitle": "时间线的运作方式",
	"initialTutorialPostNoteTitle": "帖子发布设置",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "如何标记附件为敏感内容？",
	"initialTutorialTitle": "教学",
	"initialTutorialLandingTitle": "欢迎来到教学",
	"initialTutorialLandingDescription": "在这里，您可以查看 Misskey 的基本使用方法和功能。",
	"initialTutorialLaunchTutorial": "观看教学",
	"close": "关闭",
	"goBack": "返回",
	"continue": "继续",
	"initialTutorialReactionReactToContinue": "添加一个回应来继续",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "将图像标记为敏感后才能够继续",
	"initialTutorialDoneTitle": "恭喜您，已经完成了教程🎉\n",
	"initialTutorialDoneDescription": "这里介绍的只是其中一小部分的功能。 要了解更多有关如何使用 Misskey 的更多信息，请访问 {link}。",
	"help": "帮助",
	"initialAccountSettingHaveFun": "希望 {name} 在这里玩得开心！",
	"initialTutorialSkipAreYouSure": "是否退出教学？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"initialTutorialNoteTitle": "什麼是貼文？",
	"initialTutorialReactionTitle": "什麼是反應？",
	"initialTutorialTimelineTitle": "時間軸如何運作",
	"initialTutorialPostNoteTitle": "貼文的發布設定",
	"initialTutorialHowToMakeAttachmentsSensitiveTitle": "如何標記上傳附件為敏感內容？",
	"initialTutorialTitle": "新手教學",
	"initialTutorialLandingTitle": "歡迎使用本教學課程",
	"initialTutorialLandingDescription": "在這裡您可以查看 Misskey 的基本使用方法和功能。",
	"initialTutorialLaunchTutorial": "觀看教學課程",
	"close": "關閉",
	"goBack": "返回",
	"continue": "繼續",
	"initialTutorialReactionReactToContinue": "添加反應以繼續教學課程。",
	"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue": "把圖像標記為敏感內容以繼續教學課程。",
	"initialTutorialDoneTitle": "教學課程已結束",
	"initialTutorialDoneDescription": "這裡介紹的功能只是其中的一小部分。要了解更多有關如何使用Misskey的資訊，請瀏覽{link}。",
	"help": "幫助",
	"initialAccountSettingHaveFun": "盡情享受{name}吧！",
	"initialTutorialSkipAreYouSure": "結束教學模式？"
}
</locale>
