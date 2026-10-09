<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.done]: closed || isVoted }">
	<ul :class="$style.choices">
		<li v-for="(choice, i) in choices" :key="i" :class="$style.choice" @click="vote(i)">
			<div :class="$style.bg" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span :class="$style.fg">
				<template v-if="choice.isVoted"><i class="ti ti-check" style="margin-right: 4px; color: var(--MI_THEME-accent);"></i></template>
				<Mfm :text="choice.text" :plain="true" :author="author" :emojiUrls="emojiUrls"/>
				<span v-if="showResult" style="margin-left: 4px; opacity: 0.7;">({{ interpolateLocaleParameters($locale.sfc.pollVotesCount, { n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="!readOnly" :class="$style.info">
		<span>{{ interpolateLocaleParameters($locale.sfc.pollTotalVotes, { n: total }) }}</span>
		<span> · </span>
		<a v-if="!closed && !isVoted" style="color: inherit;" @click="showResult = !showResult">{{ showResult ? $locale.sfc.pollVote : $locale.sfc.pollShowResult }}</a>
		<span v-if="isVoted">{{ $locale.sfc.pollVoted }}</span>
		<span v-else-if="closed">{{ $locale.sfc.pollClosed }}</span>
		<span v-if="remaining > 0"> · {{ timer }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { host } from '@features/boot/frontend/shared/config.js';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import { sum } from '@features/runtime/frontend/utility/array.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useLowresTime } from '@features/ui/frontend/shared/use-lowres-time.js';

const props = defineProps<{
	noteId: string;
	multiple: NonNullable<Misskey.entities.Note['poll']>['multiple'];
	expiresAt: NonNullable<Misskey.entities.Note['poll']>['expiresAt'];
	choices: NonNullable<Misskey.entities.Note['poll']>['choices'];
	readOnly?: boolean;
	emojiUrls?: Record<string, string>;
	author?: Misskey.entities.UserLite;
}>();

const now = useLowresTime();

const expiresAtTime = computed(() => props.expiresAt ? new Date(props.expiresAt).getTime() : null);

const remaining = computed(() => {
	if (expiresAtTime.value == null) return -1;
	return Math.floor(Math.max(expiresAtTime.value - now.value, 0) / 1000);
});

const total = computed(() => sum(props.choices.map(x => x.votes)));
const closed = computed(() => props.expiresAt != null && remaining.value <= 0);
const isVoted = computed(() => !props.multiple && props.choices.some(c => c.isVoted));
const timer = computed(() => interpolateLocaleParameters($locale.value.sfc.pollLabels[
	remaining.value >= 86400 ? 'remainingDays' :
	remaining.value >= 3600 ? 'remainingHours' :
	remaining.value >= 60 ? 'remainingMinutes' : 'remainingSeconds'
], {
	s: Math.floor(remaining.value % 60),
	m: Math.floor(remaining.value / 60) % 60,
	h: Math.floor(remaining.value / 3600) % 24,
	d: Math.floor(remaining.value / 86400),
}));

const showResult = ref(props.readOnly || isVoted.value || closed.value);

if (!closed.value) {
	const closedWatchStop = watch(closed, (isNowClosed) => {
		if (isNowClosed) {
			showResult.value = true;
			closedWatchStop();
		}
	});
}

const pleaseLoginContext = computed<OpenOnRemoteOptions>(() => ({
	type: 'lookup',
	url: `https://${host}/notes/${props.noteId}`,
}));

const vote = async (id: number) => {
	if (props.readOnly || closed.value || isVoted.value) return;

	const isLoggedIn = await pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	if (!isLoggedIn) return;

	const { canceled } = await os.confirm({
		type: 'question',
		text: interpolateLocaleParameters($locale.value.sfc.voteConfirm, { choice: props.choices[id].text }),
	});
	if (canceled) return;

	await misskeyApi('notes/polls/vote', {
		noteId: props.noteId,
		choice: id,
	});
	if (!showResult.value) showResult.value = !props.multiple;
};
</script>

<style lang="scss" module>
.choices {
	display: block;
	margin: 0;
	padding: 0;
	list-style: none;
}

.choice {
	display: block;
	position: relative;
	margin: 4px 0;
	padding: 4px;
	//border: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-accentedBg);
	border-radius: 4px;
	overflow: clip;
	cursor: pointer;
}

.bg {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: var(--MI_THEME-accent);
	background: linear-gradient(90deg,var(--MI_THEME-buttonGradateA),var(--MI_THEME-buttonGradateB));
	transition: width 1s ease;
}

.fg {
	position: relative;
	display: inline-block;
	padding: 3px 5px;
	background: var(--MI_THEME-panel);
	border-radius: 3px;
}

.info {
	color: var(--MI_THEME-fg);
}

.done {
	.choice {
		cursor: initial;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pollVotesCount": "{n} أصوات",
	"pollTotalVotes": "المجموع {n} أصوات",
	"pollVote": "قم بالتصويت",
	"pollShowResult": "اعرض النتائج",
	"pollVoted": "تم التصويت",
	"pollClosed": "انتهى",
	"pollLabels": {
		"noOnlyOneChoice": "تحتاج إلى خيارَين على الأقل",
		"choiceN": "الخيار {n}",
		"noMore": "لا يمكنك إضافة خيارات أخرى",
		"canMultipleVote": "السماح بالإجابات المتعددة",
		"expiration": "ينتهي استطلاع الرأي في",
		"infinite": "أبدًا",
		"at": "تاريخ الإنتهاء",
		"after": "ينتهي بعد…",
		"deadlineDate": "تاريخ الانتهاء",
		"deadlineTime": "سا",
		"duration": "المدة",
		"votesCount": "{n} أصوات",
		"totalVotes": "المجموع {n} أصوات",
		"vote": "قم بالتصويت",
		"showResult": "اعرض النتائج",
		"voted": "تم التصويت",
		"closed": "انتهى",
		"remainingDays": "{d} أيام و {h} ساعات متبقية",
		"remainingHours": "{h} ساعات و {m} دقائق متبقية",
		"remainingMinutes": "{m} دقائق و {s} ثوانٍ متبقية",
		"remainingSeconds": "{s} ثوانٍ متبقية"
	},
	"voteConfirm": "متيقِّن من تصويتك لـ {choice}؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pollVotesCount": "{n} vots",
	"pollTotalVotes": "{n} vots en total",
	"pollVote": "Votar en una enquesta",
	"pollShowResult": "Veure resultats",
	"pollVoted": "Has votat",
	"pollClosed": "Finalitzada",
	"pollLabels": {
		"noOnlyOneChoice": "Es necessita escollir dues opcions com a mínim ",
		"choiceN": "Opció {n}",
		"noMore": "No pots afegir més opcions",
		"canMultipleVote": "Permetre escollir diferents opcions",
		"expiration": "Finalitza el",
		"infinite": "Mai",
		"at": "Finalitza en...",
		"after": "Finalitza després...",
		"deadlineDate": "Data de finalització ",
		"deadlineTime": "Hor(a)(es)",
		"duration": "Duració ",
		"votesCount": "{n} vots",
		"totalVotes": "{n} vots en total",
		"vote": "Votar en una enquesta",
		"showResult": "Veure resultats",
		"voted": "Has votat",
		"closed": "Finalitzada",
		"remainingDays": "Queden {d} dies i {h} hores per finalitzar",
		"remainingHours": "Queden {h} hores i {m} minuts",
		"remainingMinutes": "Queden {m} minuts i {s} segons",
		"remainingSeconds": "Queden {s} segons"
	},
	"voteConfirm": "Confirma el teu vot \"{choice}\""
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pollVotesCount": "{n} hlasů",
	"pollTotalVotes": "{n} hlasů celkově",
	"pollVote": "Hlasovat v anketě",
	"pollShowResult": "Zobrazit výsledky",
	"pollVoted": "Odhlasováno",
	"pollClosed": "Uzavřeno",
	"pollLabels": {
		"noOnlyOneChoice": "Jsou zapotřebí alespoň dvě možnosti",
		"choiceN": "Volba {n}",
		"noMore": "Více už přidat nemůžete",
		"canMultipleVote": "Umožnit výběr více možností",
		"expiration": "Ukončení ankety",
		"infinite": "Nikdy",
		"at": "Ukončit v",
		"after": "Ukončit po",
		"deadlineDate": "Datum ukončení",
		"deadlineTime": "Hodin",
		"duration": "Trvání",
		"votesCount": "{n} hlasů",
		"totalVotes": "{n} hlasů celkově",
		"vote": "Hlasovat v anketě",
		"showResult": "Zobrazit výsledky",
		"voted": "Odhlasováno",
		"closed": "Uzavřeno",
		"remainingDays": "Zbývá {d} den/dní a {h} hodin/a",
		"remainingHours": "Zbývá {h} hodin/a a {m} minut/a",
		"remainingMinutes": "Zbývá {m} minut/a a {s} sekund/a",
		"remainingSeconds": "Zbývá {s} sekund/a"
	},
	"voteConfirm": "Potvrdit hlas pro \"{choice}\"?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pollVotesCount": "{n} Stimmen",
	"pollTotalVotes": "Insgesamt {n} Stimmen",
	"pollVote": "Abstimmen",
	"pollShowResult": "Ergebnis anzeigen",
	"pollVoted": "Abgestimmt",
	"pollClosed": "Beendet",
	"pollLabels": {
		"noOnlyOneChoice": "Es müssen mindestens zwei Antwortmöglichkeiten vorhanden sein",
		"choiceN": "Auswahl {n}",
		"noMore": "Du kannst keine weiteren Auswahlmöglichkeiten hinzufügen",
		"canMultipleVote": "Auswahl mehrerer Antworten erlauben",
		"expiration": "Abstimmung beenden",
		"infinite": "Nie",
		"at": "Beenden am …",
		"after": "Beenden nach …",
		"deadlineDate": "Enddatum",
		"deadlineTime": "Zeit",
		"duration": "Dauer",
		"votesCount": "{n} Stimmen",
		"totalVotes": "Insgesamt {n} Stimmen",
		"vote": "Abstimmen",
		"showResult": "Ergebnis anzeigen",
		"voted": "Abgestimmt",
		"closed": "Beendet",
		"remainingDays": "{d} Tag(e) {h} Stunde(n) verbleibend",
		"remainingHours": "{h} Stunde(n) {m} Minute(n) verbleibend",
		"remainingMinutes": "{m} Minute(n) {s} Sekunde(n) verbleibend",
		"remainingSeconds": "{s} Sekunde(n) verbleibend"
	},
	"voteConfirm": "Wirklich für „{choice}“ abstimmen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pollVotesCount": "{n} votos",
	"pollTotalVotes": "Total {n} votos",
	"pollVote": "Votar",
	"pollShowResult": "Ver resultado",
	"pollVoted": "Votado",
	"pollClosed": "Cerrada",
	"pollLabels": {
		"noOnlyOneChoice": "Se necesitan al menos 2 opciones",
		"choiceN": "Opción {n}",
		"noMore": "No se pueden agregar más",
		"canMultipleVote": "Permitir seleccionar varias opciones",
		"expiration": "Termina el",
		"infinite": "Sin límite de tiempo",
		"at": "Elegir fecha y hora",
		"after": "Elegir lapso de tiempo",
		"deadlineDate": "Fecha de fin",
		"deadlineTime": "Horas",
		"duration": "Duración",
		"votesCount": "{n} votos",
		"totalVotes": "Total {n} votos",
		"vote": "Votar",
		"showResult": "Ver resultado",
		"voted": "Votado",
		"closed": "Cerrada",
		"remainingDays": "Quedan {d} días y {h} horas para que finalice",
		"remainingHours": "Quedan {h} horas y {m} minutos para que finalice",
		"remainingMinutes": "Quedan {m} minutos y {s} segundos para que finalice",
		"remainingSeconds": "Quedan {s} segundos para que finalice"
	},
	"voteConfirm": "¿Confirma su voto a {choice}?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes au total",
	"pollVote": "Voter",
	"pollShowResult": "Voir résultats",
	"pollVoted": "Déjà voté",
	"pollClosed": "Terminé",
	"pollLabels": {
		"noOnlyOneChoice": "Au moins 2 réponses nécéssaires",
		"choiceN": "Choix {n}",
		"noMore": "Vous ne pouvez pas en ajouter davantage",
		"canMultipleVote": "Autoriser le multi-choix",
		"expiration": "Fin du sondage",
		"infinite": "Illimité",
		"at": "Choisir une date",
		"after": "Choisir la durée",
		"deadlineDate": "Date de fin",
		"deadlineTime": "Heure de fin",
		"duration": "Durée",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes au total",
		"vote": "Voter",
		"showResult": "Voir résultats",
		"voted": "Déjà voté",
		"closed": "Terminé",
		"remainingDays": "{d} jours, {h} heures restantes",
		"remainingHours": "{h} heures et {m} minutes restantes",
		"remainingMinutes": "{m} minutes et {s} secondes restantes",
		"remainingSeconds": "{s} secondes restantes"
	},
	"voteConfirm": "Confirmez-vous votre vote pour « {choice} » ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pollVotesCount": "{n} suara",
	"pollTotalVotes": "Total {n} suara",
	"pollVote": "Beri suara",
	"pollShowResult": "Lihat hasil",
	"pollVoted": "Telah memilih",
	"pollClosed": "Telah berakhir",
	"pollLabels": {
		"noOnlyOneChoice": "Dibutuhkan sedikitnya dua pilihan",
		"choiceN": "Pilihan {n}",
		"noMore": "Kamu tidak dapat menambahkan pilihan lagi",
		"canMultipleVote": "Bolehkan memilih banyak",
		"expiration": "Batas akhir",
		"infinite": "Selamanya",
		"at": "Berakhir pada...",
		"after": "Berakhir setelah...",
		"deadlineDate": "Tanggal batas akhir",
		"deadlineTime": "jam",
		"duration": "Durasi",
		"votesCount": "{n} suara",
		"totalVotes": "Total {n} suara",
		"vote": "Beri suara",
		"showResult": "Lihat hasil",
		"voted": "Telah memilih",
		"closed": "Telah berakhir",
		"remainingDays": "Berakhir dalam {d} hari {h} jam",
		"remainingHours": "Berakhir dalam {h} jam {m} menit",
		"remainingMinutes": "Berakhir dalam {m} menit {s} detik",
		"remainingSeconds": "Berakhir dalam {s} detik"
	},
	"voteConfirm": "Konfirmasi suara kamu untuk ({choice})？"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pollVotesCount": "{n} voti",
	"pollTotalVotes": "Totale di {n} voti",
	"pollVote": "Vota",
	"pollShowResult": "Visualizza risultati",
	"pollVoted": "Hai votato",
	"pollClosed": "Terminato",
	"pollLabels": {
		"noOnlyOneChoice": "Sono necessarie almeno 2 risposte",
		"choiceN": "Opzione {n}",
		"noMore": "Hai raggiunto il limite di opzioni.",
		"canMultipleVote": "Possibilità di risposte multiple",
		"expiration": "Scadenza",
		"infinite": "Non scade",
		"at": "Seleziona data",
		"after": "Seleziona durata",
		"deadlineDate": "Data di scadenza",
		"deadlineTime": "Ora di scadenza",
		"duration": "Durata",
		"votesCount": "{n} voti",
		"totalVotes": "Totale di {n} voti",
		"vote": "Vota",
		"showResult": "Visualizza risultati",
		"voted": "Hai votato",
		"closed": "Terminato",
		"remainingDays": "Mancano {d} giorni e {h} ore",
		"remainingHours": "Mancano {h} ore e {m} minuti",
		"remainingMinutes": "Rimangono {m} minuti e {s} secondi",
		"remainingSeconds": "Rimangono {s} secondi"
	},
	"voteConfirm": "Votare per「{choice}」?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "計{n}票",
	"pollVote": "投票する",
	"pollShowResult": "結果を見る",
	"pollVoted": "投票済み",
	"pollClosed": "終了済み",
	"pollLabels": {
		"noOnlyOneChoice": "選択肢は最低2つ必要です",
		"choiceN": "選択肢{n}",
		"noMore": "これ以上追加できません",
		"canMultipleVote": "複数回答可",
		"expiration": "期限",
		"infinite": "無期限",
		"at": "日時指定",
		"after": "経過指定",
		"deadlineDate": "期日",
		"deadlineTime": "時間",
		"duration": "期間",
		"votesCount": "{n}票",
		"totalVotes": "計{n}票",
		"vote": "投票する",
		"showResult": "結果を見る",
		"voted": "投票済み",
		"closed": "終了済み",
		"remainingDays": "終了まであと{d}日{h}時間",
		"remainingHours": "終了まであと{h}時間{m}分",
		"remainingMinutes": "終了まであと{m}分{s}秒",
		"remainingSeconds": "終了まであと{s}秒"
	},
	"voteConfirm": "「{choice}」に投票しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "計{n}票",
	"pollVote": "投票する",
	"pollShowResult": "結果を見るで",
	"pollVoted": "投票済みやで",
	"pollClosed": "終了済みやで",
	"pollLabels": {
		"noOnlyOneChoice": "選択肢は最低2つ必要やで",
		"choiceN": "選択肢{n}",
		"noMore": "これ以上追加でけへん",
		"canMultipleVote": "複数回答可",
		"expiration": "期限",
		"infinite": "無期限",
		"at": "日時指定",
		"after": "経過指定",
		"deadlineDate": "期日",
		"deadlineTime": "時間",
		"duration": "期間",
		"votesCount": "{n}票",
		"totalVotes": "計{n}票",
		"vote": "投票する",
		"showResult": "結果を見るで",
		"voted": "投票済みやで",
		"closed": "終了済みやで",
		"remainingDays": "終了まであと{d}日{h}時間や",
		"remainingHours": "終了まであと{h}時間{m}分や",
		"remainingMinutes": "終了まであと{m}分{s}秒や",
		"remainingSeconds": "終了まであと{s}秒や"
	},
	"voteConfirm": "「{choice}」に投票するんか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pollVotesCount": "{n}표",
	"pollTotalVotes": "총 {n}표",
	"pollVote": "투표하기",
	"pollShowResult": "결과 보기",
	"pollVoted": "투표함",
	"pollClosed": "종료됨",
	"pollLabels": {
		"noOnlyOneChoice": "투표 항목이 최소 2개 필요합니다",
		"choiceN": "선택지 {n}",
		"noMore": "더 이상 추가할 수 없습니다",
		"canMultipleVote": "복수 응답 허용",
		"expiration": "투표 기한",
		"infinite": "무기한",
		"at": "일시 지정",
		"after": "기간 지정",
		"deadlineDate": "기한",
		"deadlineTime": "시간",
		"duration": "기간",
		"votesCount": "{n}표",
		"totalVotes": "총 {n}표",
		"vote": "투표하기",
		"showResult": "결과 보기",
		"voted": "투표함",
		"closed": "종료됨",
		"remainingDays": "종료까지 앞으로 {d}일 {h}시간",
		"remainingHours": "종료까지 앞으로 {h}시간 {m}분",
		"remainingMinutes": "종료까지 앞으로 {m}분 {s}초",
		"remainingSeconds": "종료까지 앞으로 {s}초"
	},
	"voteConfirm": "\"{choice}\"에 투표하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Bevestig je je stem op “{choice}”?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pollVotesCount": "{n} stemmer",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Stem",
	"pollShowResult": "Vis resultatet",
	"pollVoted": "Stemt",
	"pollClosed": "Avsluttet",
	"pollLabels": {
		"noOnlyOneChoice": "Trenger minst to valger.",
		"choiceN": "Valg {n}",
		"noMore": "Du kan ikke legge til flere.",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Timer",
		"duration": "Duration",
		"votesCount": "{n} stemmer",
		"totalVotes": "{n} votes in total",
		"vote": "Stem",
		"showResult": "Vis resultatet",
		"voted": "Stemt",
		"closed": "Avsluttet",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pollVotesCount": "{n} głosów",
	"pollTotalVotes": "Łącznie {n} głosów",
	"pollVote": "Głosowanie w ankiecie",
	"pollShowResult": "Pokaż wyniki",
	"pollVoted": "Zagłosowano",
	"pollClosed": "Zakończono",
	"pollLabels": {
		"noOnlyOneChoice": "Wymagane są przynajmniej dwie opcje",
		"choiceN": "Opcja {n}",
		"noMore": "Nie możesz dodać więcej opcji",
		"canMultipleVote": "Pozwól na wiele odpowiedzi",
		"expiration": "Ankieta kończy się",
		"infinite": "Nigdy",
		"at": "Zakończ o…",
		"after": "Zakończ po…",
		"deadlineDate": "Data zakończenia",
		"deadlineTime": "godz.",
		"duration": "Czas trwania",
		"votesCount": "{n} głosów",
		"totalVotes": "Łącznie {n} głosów",
		"vote": "Głosowanie w ankiecie",
		"showResult": "Pokaż wyniki",
		"voted": "Zagłosowano",
		"closed": "Zakończono",
		"remainingDays": "Pozostało {d} dni i {h} godzin",
		"remainingHours": "Pozostali {h} godzin i {m} minut",
		"remainingMinutes": "Pozostało {m} minut i {s} sekund",
		"remainingSeconds": "Pozostało {s} sekund"
	},
	"voteConfirm": "Potwierdzić swój głos na \"{choice}\"?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pollVotesCount": "{n} votos",
	"pollTotalVotes": "{n} votos totais",
	"pollVote": "Votar em enquetes",
	"pollShowResult": "Ver resultados",
	"pollVoted": "Votada",
	"pollClosed": "Encerrada",
	"pollLabels": {
		"noOnlyOneChoice": "São necessárias, no mínimo, duas escolhas",
		"choiceN": "Escolha {n}",
		"noMore": "Você não pode adicionar mais escolhas",
		"canMultipleVote": "Permitir múltipla seleção",
		"expiration": "Encerrar enquete",
		"infinite": "Nunca",
		"at": "Terminar em...",
		"after": "Terminar após...",
		"deadlineDate": "Data de término",
		"deadlineTime": "Tempo",
		"duration": "Duração",
		"votesCount": "{n} votos",
		"totalVotes": "{n} votos totais",
		"vote": "Votar em enquetes",
		"showResult": "Ver resultados",
		"voted": "Votada",
		"closed": "Encerrada",
		"remainingDays": "{d} dia(s) {h} hora(s) restantes",
		"remainingHours": "{h} hora(s) {m} minuto(s) restantes",
		"remainingMinutes": "{m} minuto(s) {s} segundo(s) restantes",
		"remainingSeconds": "{s} segundo(s) restantes"
	},
	"voteConfirm": "Deseja confirmar o seu voto em \"{choice}\"?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pollVotesCount": "Голосов: {n}",
	"pollTotalVotes": "Голосов всего: {n}",
	"pollVote": "Проголосовать",
	"pollShowResult": "Смотреть результаты",
	"pollVoted": "Голос отдан",
	"pollClosed": "Завершено",
	"pollLabels": {
		"noOnlyOneChoice": "Нужно хотя бы два варианта.",
		"choiceN": "Выбор {n}",
		"noMore": "Больше вариантов добавить нельзя",
		"canMultipleVote": "Можно выбрать несколько вариантов",
		"expiration": "Опрос длится",
		"infinite": "вечно",
		"at": "до указанной даты",
		"after": "заданное время",
		"deadlineDate": "Дата окончания",
		"deadlineTime": "Время",
		"duration": "Длительность",
		"votesCount": "Голосов: {n}",
		"totalVotes": "Голосов всего: {n}",
		"vote": "Проголосовать",
		"showResult": "Смотреть результаты",
		"voted": "Голос отдан",
		"closed": "Завершено",
		"remainingDays": "Осталось {d} сут {h} ч",
		"remainingHours": "Осталось {h} ч {m} мин",
		"remainingMinutes": "Осталось {m} мин {s} с",
		"remainingSeconds": "Осталось {s} с"
	},
	"voteConfirm": "Отдать голос за «{choice}»?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pollVotesCount": "{n} hlasov",
	"pollTotalVotes": "{n} hlasov celkom",
	"pollVote": "Hlasovať",
	"pollShowResult": "Vidieť výsledky hlasovania",
	"pollVoted": "Zahlasované",
	"pollClosed": "Skončilo",
	"pollLabels": {
		"noOnlyOneChoice": "Treba aspoň dve voľby",
		"choiceN": "Voľba {n}",
		"noMore": "Nemôžete pridať viac volieb",
		"canMultipleVote": "Povoliť hlasovať za viac volieb.",
		"expiration": "Ukončiť hlasovanie",
		"infinite": "Nikdy",
		"at": "Konkrétny dátum...",
		"after": "Ukončiť po...",
		"deadlineDate": "Dátum ukončenia",
		"deadlineTime": "hod",
		"duration": "Trvanie",
		"votesCount": "{n} hlasov",
		"totalVotes": "{n} hlasov celkom",
		"vote": "Hlasovať",
		"showResult": "Vidieť výsledky hlasovania",
		"voted": "Zahlasované",
		"closed": "Skončilo",
		"remainingDays": "zostáva {d} dní {h} hodín",
		"remainingHours": "zostáva {h} hodín {m} minút",
		"remainingMinutes": "zostáva {m} minút {s} sekúnd",
		"remainingSeconds": "zostáva {s} sekúnd"
	},
	"voteConfirm": "Potvrdzujete svoj hlas za \"{choice}\"?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pollVotesCount": "{n} คะแนนเสียง",
	"pollTotalVotes": "ทั้งหมด {n} คะแนนเสียง",
	"pollVote": "โหวต",
	"pollShowResult": "ดูผลลัพธ์",
	"pollVoted": "โหวตแล้ว",
	"pollClosed": "สิ้นสุดแล้ว",
	"pollLabels": {
		"noOnlyOneChoice": "จำเป็นต้องมีอย่างน้อยสองตัวเลือก",
		"choiceN": "ตัวเลือกที่ {n}",
		"noMore": "เพิ่มตัวเลือกอีกไม่ได้แล้ว",
		"canMultipleVote": "สามารถตอบได้หลายคำตอบ",
		"expiration": "สิ้นสุดโพล",
		"infinite": "ไม่กำหนดระยะเวลา",
		"at": "ระบุวันเวลา",
		"after": "ระบุระยะเวลา",
		"deadlineDate": "วันสิ้นสุด",
		"deadlineTime": "เวลา",
		"duration": "ระยะเวลา",
		"votesCount": "{n} คะแนนเสียง",
		"totalVotes": "ทั้งหมด {n} คะแนนเสียง",
		"vote": "โหวต",
		"showResult": "ดูผลลัพธ์",
		"voted": "โหวตแล้ว",
		"closed": "สิ้นสุดแล้ว",
		"remainingDays": "เหลืออีก {d} วัน {h} ชั่วโมง",
		"remainingHours": "เหลืออีก {h} ชั่วโมง {m} นาที",
		"remainingMinutes": "เหลืออีก {m} นาที {s} วินาที",
		"remainingSeconds": "เหลืออีก {s} วินาที"
	},
	"voteConfirm": "ต้องการโหวต “{choice}” ใช่ไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pollVotesCount": "{n} oy",
	"pollTotalVotes": "Toplam {n} oy",
	"pollVote": "Oy ver",
	"pollShowResult": "Sonuçları görüntüle",
	"pollVoted": "Oylandı",
	"pollClosed": "Sona erdi",
	"pollLabels": {
		"noOnlyOneChoice": "En az iki seçenek gereklidir.",
		"choiceN": "Seçim {n}",
		"noMore": "Daha fazla seçenek ekleyemezsin.",
		"canMultipleVote": "Birden fazla seçenek seçilmesine izin ver",
		"expiration": "Anketi sonlandır",
		"infinite": "Asla",
		"at": "Şurada bitir...",
		"after": "Sonrasında bitir...",
		"deadlineDate": "Bitiş tarihi",
		"deadlineTime": "Zaman",
		"duration": "Süre",
		"votesCount": "{n} oy",
		"totalVotes": "Toplam {n} oy",
		"vote": "Oy ver",
		"showResult": "Sonuçları görüntüle",
		"voted": "Oylandı",
		"closed": "Sona erdi",
		"remainingDays": "{d} gün {h} saat kaldı",
		"remainingHours": "{h} saat {m} dakika kaldı",
		"remainingMinutes": "{m} dakika {s} saniye kaldı",
		"remainingSeconds": "{s} saniye kaldı"
	},
	"voteConfirm": "\"{choice}\" için oyunuzu onaylıyor musunuz?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total",
	"pollVote": "Vote",
	"pollShowResult": "View results",
	"pollVoted": "Voted",
	"pollClosed": "Ended",
	"pollLabels": {
		"noOnlyOneChoice": "At least two choices are needed",
		"choiceN": "Choice {n}",
		"noMore": "You cannot add more choices",
		"canMultipleVote": "Allow selecting multiple choices",
		"expiration": "End poll",
		"infinite": "Never",
		"at": "End at...",
		"after": "End after...",
		"deadlineDate": "End date",
		"deadlineTime": "Time",
		"duration": "Duration",
		"votesCount": "{n} votes",
		"totalVotes": "{n} votes in total",
		"vote": "Vote",
		"showResult": "View results",
		"voted": "Voted",
		"closed": "Ended",
		"remainingDays": "{d} day(s) {h} hour(s) remaining",
		"remainingHours": "{h} hour(s) {m} minute(s) remaining",
		"remainingMinutes": "{m} minute(s) {s} second(s) remaining",
		"remainingSeconds": "{s} second(s) remaining"
	},
	"voteConfirm": "Confirm your vote for \"{choice}\"?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pollVotesCount": "{n} голосів",
	"pollTotalVotes": "Всього {n} голосів",
	"pollVote": "Голосувати",
	"pollShowResult": "Переглянути результати",
	"pollVoted": "Проголосовано",
	"pollClosed": "Завершено",
	"pollLabels": {
		"noOnlyOneChoice": "Потрібні принаймні два варіанти.",
		"choiceN": "Варіант {n}",
		"noMore": "Більше варіантів додати не можна",
		"canMultipleVote": "Можна вибрати кілька варіантів",
		"expiration": "Опитування закінчується",
		"infinite": "Ніколи",
		"at": "На даті...",
		"after": "Через...",
		"deadlineDate": "Дата закінчення",
		"deadlineTime": "г",
		"duration": "Тривалість",
		"votesCount": "{n} голосів",
		"totalVotes": "Всього {n} голосів",
		"vote": "Голосувати",
		"showResult": "Переглянути результати",
		"voted": "Проголосовано",
		"closed": "Завершено",
		"remainingDays": "Залишилось {d} днів {h} годин",
		"remainingHours": "Залишилось {h} годин {m} хвилин",
		"remainingMinutes": "Залишилось {m} хвилин {s} секунд",
		"remainingSeconds": "Залишилось {s} секунд"
	},
	"voteConfirm": "Підтверджуєте свій голос за \"{choice}\"?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pollVotesCount": "{n} bình chọn",
	"pollTotalVotes": "{n} tổng bình chọn",
	"pollVote": "Bình chọn",
	"pollShowResult": "Xem kết quả",
	"pollVoted": "Đã bình chọn",
	"pollClosed": "Đã kết thúc",
	"pollLabels": {
		"noOnlyOneChoice": "Cần ít nhất hai lựa chọn.",
		"choiceN": "Lựa chọn {n}",
		"noMore": "Bạn không thể thêm lựa chọn",
		"canMultipleVote": "Cho phép chọn nhiều lựa chọn",
		"expiration": "Thời hạn",
		"infinite": "Vĩnh viễn",
		"at": "Kết thúc vào...",
		"after": "Kết thúc sau...",
		"deadlineDate": "Ngày kết thúc",
		"deadlineTime": "giờ",
		"duration": "Thời hạn",
		"votesCount": "{n} bình chọn",
		"totalVotes": "{n} tổng bình chọn",
		"vote": "Bình chọn",
		"showResult": "Xem kết quả",
		"voted": "Đã bình chọn",
		"closed": "Đã kết thúc",
		"remainingDays": "{d} ngày {h} giờ còn lại",
		"remainingHours": "{h} giờ {m} phút còn lại",
		"remainingMinutes": "{m} phút {s}s còn lại",
		"remainingSeconds": "{s}s còn lại"
	},
	"voteConfirm": "Xác nhận bình chọn \"{choice}\"?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "总计{n}票",
	"pollVote": "投票",
	"pollShowResult": "查看结果",
	"pollVoted": "已投票",
	"pollClosed": "已截止",
	"pollLabels": {
		"noOnlyOneChoice": "需要至少两个选项",
		"choiceN": "选项{n}",
		"noMore": "无法再添加更多了",
		"canMultipleVote": "允许多选",
		"expiration": "截止时间",
		"infinite": "永久",
		"at": "指定日期",
		"after": "指定时长",
		"deadlineDate": "截止日期",
		"deadlineTime": "时间",
		"duration": "期限",
		"votesCount": "{n}票",
		"totalVotes": "总计{n}票",
		"vote": "投票",
		"showResult": "查看结果",
		"voted": "已投票",
		"closed": "已截止",
		"remainingDays": "{d}天{h}小时后截止",
		"remainingHours": "{h}小时{m}分后截止",
		"remainingMinutes": "{m}分{s}秒后截止",
		"remainingSeconds": "{s}秒后截止"
	},
	"voteConfirm": "要投给 “{choice}” 吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "合計 {n} 票",
	"pollVote": "投票",
	"pollShowResult": "顯示結果",
	"pollVoted": "已投票",
	"pollClosed": "已結束",
	"pollLabels": {
		"noOnlyOneChoice": "需要至少兩個選項。",
		"choiceN": "選項 {n}",
		"noMore": "沒辦法再添加選項了",
		"canMultipleVote": "允許複選",
		"expiration": "期限",
		"infinite": "無期限",
		"at": "結束時間",
		"after": "指定時效",
		"deadlineDate": "截止日期",
		"deadlineTime": "小時",
		"duration": "時長",
		"votesCount": "{n}票",
		"totalVotes": "合計 {n} 票",
		"vote": "投票",
		"showResult": "顯示結果",
		"voted": "已投票",
		"closed": "已結束",
		"remainingDays": "{d} 天 {h} 小時後結束",
		"remainingHours": "{h} 小時 {m} 分後結束",
		"remainingMinutes": "{m} 分 {s} 秒後結束",
		"remainingSeconds": "{s} 秒後截止"
	},
	"voteConfirm": "確定投給「{choice}」？"
}
</locale>
