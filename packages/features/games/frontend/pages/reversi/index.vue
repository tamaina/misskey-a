<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!matchingAny && !matchingUser" class="_spacer" style="--MI_SPACER-w: 600px;">
	<div class="_gaps">
		<div>
			<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
		</div>

		<div class="_panel _gaps" style="padding: 16px;">
			<div class="_buttonsCenter">
				<MkButton primary gradate rounded @click="matchAny">{{ $locale.sfc.reversiFreeMatch }}</MkButton>
				<MkButton primary gradate rounded @click="matchUser">{{ $locale.sfc.invite }}</MkButton>
			</div>
			<div style="font-size: 90%; opacity: 0.7; text-align: center;"><i class="ti ti-music"></i> {{ $locale.sfc.soundWillBePlayed }}</div>
		</div>

		<MkFolder v-if="invitations.length > 0" :defaultOpen="true">
			<template #label>{{ $locale.sfc.invitations }}</template>
			<div class="_gaps_s">
				<button v-for="user in invitations" :key="user.id" v-panel :class="$style.invitation" class="_button" tabindex="-1" @click="accept(user)">
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="user" :showIndicator="true"/>
					<span style="margin-right: 8px;"><b><MkUserName :user="user"/></b></span>
					<span>@{{ user.username }}</span>
				</button>
			</div>
		</MkFolder>

		<MkFolder v-if="$i" :defaultOpen="true">
			<template #label>{{ $locale.sfc.reversiMyGames }}</template>
			<MkPagination :paginator="myGamesPaginator">
				<template #default="{ items }">
					<div :class="$style.gamePreviews">
						<MkA v-for="g in items" :key="g.id" v-panel :class="[$style.gamePreview, !g.isStarted && !g.isEnded && $style.gamePreviewWaiting, g.isStarted && !g.isEnded && $style.gamePreviewActive]" tabindex="-1" :to="`/reversi/g/${g.id}`">
							<div :class="$style.gamePreviewPlayers">
								<span v-if="g.winnerId === g.user1Id" style="margin-right: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-right: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user1"/>
								<span style="margin: 0 1em;">vs</span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user2"/>
								<span v-if="g.winnerId === g.user1Id" style="margin-left: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-left: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
							</div>
							<div :class="$style.gamePreviewFooter">
								<span v-if="g.isStarted && !g.isEnded" :class="$style.gamePreviewStatusActive">{{ $locale.sfc.reversiPlaying }}</span>
								<span v-else-if="!g.isEnded" :class="$style.gamePreviewStatusWaiting"><MkEllipsis/></span>
								<span v-else>{{ $locale.sfc.reversiEnded }}</span>
								<MkTime style="margin-left: auto; opacity: 0.7;" :time="g.createdAt"/>
							</div>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #label>{{ $locale.sfc.reversiAllGames }}</template>
			<MkPagination :paginator="gamesPaginator">
				<template #default="{ items }">
					<div :class="$style.gamePreviews">
						<MkA v-for="g in items" :key="g.id" v-panel :class="[$style.gamePreview, !g.isStarted && !g.isEnded && $style.gamePreviewWaiting, g.isStarted && !g.isEnded && $style.gamePreviewActive]" tabindex="-1" :to="`/reversi/g/${g.id}`">
							<div :class="$style.gamePreviewPlayers">
								<span v-if="g.winnerId === g.user1Id" style="margin-right: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-right: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user1"/>
								<span style="margin: 0 1em;">vs</span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user2"/>
								<span v-if="g.winnerId === g.user1Id" style="margin-left: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-left: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
							</div>
							<div :class="$style.gamePreviewFooter">
								<span v-if="g.isStarted && !g.isEnded" :class="$style.gamePreviewStatusActive">{{ $locale.sfc.reversiPlaying }}</span>
								<span v-else-if="!g.isEnded" :class="$style.gamePreviewStatusWaiting"><MkEllipsis/></span>
								<span v-else>{{ $locale.sfc.reversiEnded }}</span>
								<MkTime style="margin-left: auto; opacity: 0.7;" :time="g.createdAt"/>
							</div>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>
	</div>
</div>
<div v-else class="_spacer" style="--MI_SPACER-w: 600px;">
	<div :class="$style.waitingScreen">
		<div v-if="matchingUser" :class="$style.waitingScreenTitle">
			<I18n :src="$locale.sfc.waitingFor" tag="span">
				<template #x>
					<b><MkUserName :user="matchingUser"/></b>
				</template>
			</I18n>
			<MkEllipsis/>
		</div>
		<div v-else :class="$style.waitingScreenTitle">
			{{ $locale.sfc.reversiLookingForPlayer }}<MkEllipsis/>
		</div>
		<div class="cancel">
			<MkButton inline rounded @click="cancelMatching">{{ $locale.sfc.cancel }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useStream } from '@features/api/frontend/stream.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { $i } from '@features/auth/frontend/i.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import * as os from '@features/ui/frontend/os.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const myGamesPaginator = markRaw(new Paginator('reversi/games', {
	limit: 10,
	params: {
		my: true,
	},
}));

const gamesPaginator = markRaw(new Paginator('reversi/games', {
	limit: 10,
}));

const router = useRouter();

if ($i) {
	const connection = useStream().useChannel('reversi');

	connection.on('matched', x => {
		if (matchingUser.value != null || matchingAny.value) {
			startGame(x.game);
		}
	});

	connection.on('invited', invitation => {
		if (invitations.value.some(x => x.id === invitation.user.id)) return;
		invitations.value.unshift(invitation.user);
	});

	onUnmounted(() => {
		connection.dispose();
	});
}

const invitations = ref<Misskey.entities.UserLite[]>([]);
const matchingUser = ref<Misskey.entities.UserLite | null>(null);
const matchingAny = ref<boolean>(false);
const noIrregularRules = ref<boolean>(false);

function startGame(game: Misskey.entities.ReversiGameDetailed) {
	matchingUser.value = null;
	matchingAny.value = false;

	sound.playUrl('/client-assets/reversi/matched.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	router.push('/reversi/g/:gameId', {
		params: {
			gameId: game.id,
		},
	});
}

async function matchHeatbeat() {
	if (matchingUser.value) {
		const res = await misskeyApi('reversi/match', {
			userId: matchingUser.value.id,
		});

		if (res != null) {
			startGame(res);
		}
	} else if (matchingAny.value) {
		const res = await misskeyApi('reversi/match', {
			userId: null,
			noIrregularRules: noIrregularRules.value,
		});

		if (res != null) {
			startGame(res);
		}
	}
}

async function matchUser() {
	const isLoggedIn = await pleaseLogin();
	if (!isLoggedIn) return;

	const user = await os.selectUser({ includeSelf: false, localOnly: true });
	if (user == null) return;

	matchingUser.value = user;

	matchHeatbeat();
}

async function matchAny(ev: PointerEvent) {
	const isLoggedIn = await pleaseLogin();
	if (!isLoggedIn) return;

	os.popupMenu([{
		text: $locale.value.sfc.reversiAllowIrregularRules,
		action: () => {
			noIrregularRules.value = false;
			matchingAny.value = true;
			matchHeatbeat();
		},
	}, {
		text: $locale.value.sfc.reversiDisallowIrregularRules,
		action: () => {
			noIrregularRules.value = true;
			matchingAny.value = true;
			matchHeatbeat();
		},
	}], ev.currentTarget ?? ev.target);
}

function cancelMatching() {
	if (matchingUser.value) {
		misskeyApi('reversi/cancel-match', { userId: matchingUser.value.id });
		matchingUser.value = null;
	} else if (matchingAny.value) {
		misskeyApi('reversi/cancel-match', { userId: null });
		matchingAny.value = false;
	}
}

async function accept(user: Misskey.entities.UserLite) {
	const game = await misskeyApi('reversi/match', {
		userId: user.id,
	});
	if (game != null) {
		startGame(game);
	}
}

useInterval(matchHeatbeat, 1000 * 5, {
	immediate: false,
	afterMounted: true,
	keepRunningWhenHidden: true, // バックグラウンドタブでもマッチング待機を維持する必要がある
});

onMounted(() => {
	misskeyApi('reversi/invitations').then(_invitations => {
		invitations.value = _invitations;
	});

	window.addEventListener('beforeunload', cancelMatching);
});

onDeactivated(() => {
	cancelMatching();
});

onUnmounted(() => {
	cancelMatching();
});

definePage(() => ({
	title: 'Reversi',
	icon: 'ti ti-device-gamepad',
}));
</script>

<style lang="scss" module>
@keyframes blink {
	0% { opacity: 1; }
	50% { opacity: 0.2; }
}

.invitation {
	display: flex;
	box-sizing: border-box;
	width: 100%;
	padding: 16px;
	line-height: 32px;
	text-align: left;
}

.gamePreviews {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}

.gamePreview {
	font-size: 90%;
	border-radius: 8px;
	overflow: clip;
}

.gamePreviewActive {
	box-shadow: inset 0 0 8px 0px var(--MI_THEME-accent);
}

.gamePreviewWaiting {
	box-shadow: inset 0 0 8px 0px var(--MI_THEME-warn);
}

.gamePreviewPlayers {
	text-align: center;
	padding: 16px;
	line-height: 32px;
}

.gamePreviewPlayersAvatar {
	width: 32px;
	height: 32px;

	&:first-child {
		margin-right: 8px;
	}

	&:last-child {
		margin-left: 8px;
	}
}

.gamePreviewFooter {
	display: flex;
	align-items: baseline;
	border-top: solid 0.5px var(--MI_THEME-divider);
	padding: 6px 10px;
	font-size: 0.9em;
}

.gamePreviewStatusActive {
	color: var(--MI_THEME-accent);
	font-weight: bold;
	animation: blink 2s infinite;
}

.gamePreviewStatusWaiting {
	color: var(--MI_THEME-warn);
	font-weight: bold;
	animation: blink 2s infinite;
}

.waitingScreen {
	text-align: center;
}

.waitingScreenTitle {
	font-size: 1.5em;
	margin-bottom: 16px;
	margin-top: 32px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"reversiFreeMatch": "Free Match",
	"invite": "دعوة",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "دعوة",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "في انتظار {x}",
	"reversiLookingForPlayer": "يبحث عن خصم...",
	"cancel": " إلغاء",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"reversiFreeMatch": "Partida lliure",
	"invite": "Convida",
	"soundWillBePlayed": "Es reproduiran efectes de so",
	"invitations": "Convida",
	"reversiMyGames": "Jugades",
	"reversiPlaying": "Jugant",
	"reversiEnded": "Acabat",
	"reversiAllGames": "Totes les jugades",
	"waitingFor": "Esperant {x}",
	"reversiLookingForPlayer": "Buscant contrincant...",
	"cancel": "Cancel·lar",
	"reversiAllowIrregularRules": "Regles irregulars (totalment lliure)",
	"reversiDisallowIrregularRules": "Sense regles irregulars"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Pozvat",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Pozvat",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Čeká se na {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Zrušit",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Invite",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Invites",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Waiting for {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Cancel",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"reversiFreeMatch": "Freies Spiel",
	"invite": "Einladen",
	"soundWillBePlayed": "Es wird Ton wiedergegeben",
	"invitations": "Einladungen",
	"reversiMyGames": "Meine Runden",
	"reversiPlaying": "Partie läuft",
	"reversiEnded": "Beendet",
	"reversiAllGames": "Alle Runden",
	"waitingFor": "Warte auf {x} …",
	"reversiLookingForPlayer": "Gegner werden gesucht...",
	"cancel": "Abbrechen",
	"reversiAllowIrregularRules": "Irreguläre Regeln (völlig frei)",
	"reversiDisallowIrregularRules": "Keine irregulären Regeln"
}
</locale>

<locale lang="json" locale="en-US">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Invite",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Invites",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Waiting for {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Cancel",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"reversiFreeMatch": "Partida libre",
	"invite": "Invitar",
	"soundWillBePlayed": "Con música y efectos sonoros",
	"invitations": "Invitar",
	"reversiMyGames": "Mis rondas",
	"reversiPlaying": "Jugando actualmente",
	"reversiEnded": "Finalizado",
	"reversiAllGames": "Todos los juegos",
	"waitingFor": "Esperando a {x}",
	"reversiLookingForPlayer": "Buscando oponente",
	"cancel": "Cancelar",
	"reversiAllowIrregularRules": "Reglas irregulares (completamente libre)",
	"reversiDisallowIrregularRules": "Sin reglas irregulares "
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Inviter",
	"soundWillBePlayed": "Le son sera joué",
	"invitations": "Invitations",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "En cours",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "En attente de {x}",
	"reversiLookingForPlayer": "Recherche d'adversaire",
	"cancel": "Annuler",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"reversiFreeMatch": "Pertandingan bebas",
	"invite": "Undang",
	"soundWillBePlayed": "Suara yang akan dimainkan",
	"invitations": "Undangan",
	"reversiMyGames": "Rondeku",
	"reversiPlaying": "Sedang bermain",
	"reversiEnded": "Selesai",
	"reversiAllGames": "Semua ronde",
	"waitingFor": "Menunggu untuk {x}",
	"reversiLookingForPlayer": "Mencari lawan...",
	"cancel": "Batalkan",
	"reversiAllowIrregularRules": "Aturan non-reguler (bebas sepenuhnya)",
	"reversiDisallowIrregularRules": "Tanpa aturan non-reguler"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"reversiFreeMatch": "Sfida libera",
	"invite": "Invita",
	"soundWillBePlayed": "Con musica ed effetti sonori",
	"invitations": "Inviti",
	"reversiMyGames": "Le mie sfide",
	"reversiPlaying": "In gioco",
	"reversiEnded": "Conclusione",
	"reversiAllGames": "Tutte le sfide",
	"waitingFor": "Aspettando {x}",
	"reversiLookingForPlayer": "Alla ricerca di un avversario",
	"cancel": "Annulla",
	"reversiAllowIrregularRules": "Regole inconsuete (completamente libere)",
	"reversiDisallowIrregularRules": "Impedire le regole inconsuete"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"reversiFreeMatch": "フリーマッチ",
	"invite": "招待",
	"soundWillBePlayed": "サウンドが再生されます",
	"invitations": "招待",
	"reversiMyGames": "自分の対局",
	"reversiPlaying": "対局中",
	"reversiEnded": "終了",
	"reversiAllGames": "みんなの対局",
	"waitingFor": "{x}を待っています",
	"reversiLookingForPlayer": "対戦相手を探しています",
	"cancel": "キャンセル",
	"reversiAllowIrregularRules": "変則許可 (完全フリー)",
	"reversiDisallowIrregularRules": "変則なし"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"reversiFreeMatch": "フリーマッチ",
	"invite": "来てや",
	"soundWillBePlayed": "サウンドが再生されるで",
	"invitations": "来てや",
	"reversiMyGames": "自分の対局",
	"reversiPlaying": "対局中",
	"reversiEnded": "終了",
	"reversiAllGames": "みんなの対局",
	"waitingFor": "{x}を待っとるで",
	"reversiLookingForPlayer": "対戦相手を探してるで",
	"cancel": "やめる",
	"reversiAllowIrregularRules": "変則許可 (完全フリー)",
	"reversiDisallowIrregularRules": "変則なし"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Invite",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Invites",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Waiting for {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Cancel",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Invite",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Invites",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Waiting for {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "ರದ್ದು",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"reversiFreeMatch": "자유 대국",
	"invite": "초대",
	"soundWillBePlayed": "소리가 재생됩니다",
	"invitations": "초대",
	"reversiMyGames": "내 대국",
	"reversiPlaying": "대국 중",
	"reversiEnded": "종료",
	"reversiAllGames": "모든 대국",
	"waitingFor": "{x}을(를) 기다리고 있습니다",
	"reversiLookingForPlayer": "대국 상대를 찾고 있습니다",
	"cancel": "취소",
	"reversiAllowIrregularRules": "규칙 변경 허용(완전 자유)",
	"reversiDisallowIrregularRules": "규칙 변경 없음"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Uitnodigen",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Uitnodigen",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Wachten op {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Annuleren",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Inviter",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Inviter",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Venter på {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Avbryt",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Zaproś",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Zaproś",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Oczekiwanie na {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Anuluj",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"reversiFreeMatch": "Partida Livre",
	"invite": "Convidar",
	"soundWillBePlayed": "Sons serão reproduzidos",
	"invitations": "Convidar",
	"reversiMyGames": "Meus jogos",
	"reversiPlaying": "Atualmente jogando",
	"reversiEnded": "Terminado",
	"reversiAllGames": "Todos os jogos",
	"waitingFor": "Aguardando por {x}",
	"reversiLookingForPlayer": "À procura de adversários...",
	"cancel": "Cancelar",
	"reversiAllowIrregularRules": "Regras irregulares (completamente livre)",
	"reversiDisallowIrregularRules": "Sem regras irregulares"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Пригласить",
	"soundWillBePlayed": "Будет воспроизведен звук",
	"invitations": "Приглашения",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Ждём, когда {x} ответит",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Отмена",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Pozvať",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Pozvať",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Čaká sa na {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Zrušiť",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"reversiFreeMatch": "ฟรีแมตช์",
	"invite": "คำเชิญ",
	"soundWillBePlayed": "จะมีการเล่นเอฟเฟกต์เสียง",
	"invitations": "คำเชิญ",
	"reversiMyGames": "การเล่นของตัวเอง",
	"reversiPlaying": "กำลังเล่น",
	"reversiEnded": "จบ",
	"reversiAllGames": "การเล่นของทุกคน",
	"waitingFor": "กำลังรอ {x}",
	"reversiLookingForPlayer": "กำลังมองหาคู่ต่อสู้อยู่",
	"cancel": "ยกเลิก",
	"reversiAllowIrregularRules": "อนุญาตกฎที่ไม่ปรกติ (โหมดฟรีทุกอย่าง)",
	"reversiDisallowIrregularRules": "ไม่อนุญาตกฎที่ไม่ปรกติ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"reversiFreeMatch": "Ücretsiz Eşleştirme",
	"invite": "Davet et",
	"soundWillBePlayed": "Ses çalınacaktır",
	"invitations": "Davetler",
	"reversiMyGames": "Benim turlarım",
	"reversiPlaying": "Şu anda oynatılıyor",
	"reversiEnded": "Sona erdi",
	"reversiAllGames": "Tüm turlar",
	"waitingFor": "{x} bekleniyor",
	"reversiLookingForPlayer": "Rakip aranıyor...",
	"cancel": "Vazgeç",
	"reversiAllowIrregularRules": "Düzensiz kurallar (tamamen ücretsiz)",
	"reversiDisallowIrregularRules": "Düzensiz kurallar yok"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Invite",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Invites",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Waiting for {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Cancel",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Запросити",
	"soundWillBePlayed": "Буде відтворено звук",
	"invitations": "Запрошення",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Чекаємо на {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Скасувати",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"reversiFreeMatch": "Free Match",
	"invite": "Mời",
	"soundWillBePlayed": "Sound will be played",
	"invitations": "Mời",
	"reversiMyGames": "My rounds",
	"reversiPlaying": "Currently playing",
	"reversiEnded": "Ended",
	"reversiAllGames": "All rounds",
	"waitingFor": "Đang đợi {x}",
	"reversiLookingForPlayer": "Finding opponent...",
	"cancel": "Hủy",
	"reversiAllowIrregularRules": "Irregular rules (completely free)",
	"reversiDisallowIrregularRules": "No irregular rules"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"reversiFreeMatch": "自由匹配",
	"invite": "邀请",
	"soundWillBePlayed": "声音将会播放",
	"invitations": "邀请",
	"reversiMyGames": "我的对局",
	"reversiPlaying": "对局中",
	"reversiEnded": "结束",
	"reversiAllGames": "所有对局",
	"waitingFor": "等待 {x}",
	"reversiLookingForPlayer": "正在寻找对手",
	"cancel": "取消",
	"reversiAllowIrregularRules": "允许特殊规则（完全自由）",
	"reversiDisallowIrregularRules": "禁止特殊规则"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"reversiFreeMatch": "自由對戰",
	"invite": "邀請",
	"soundWillBePlayed": "將播放音效",
	"invitations": "邀請",
	"reversiMyGames": "我的對弈",
	"reversiPlaying": "正在對弈",
	"reversiEnded": "已結束",
	"reversiAllGames": "所有對弈",
	"waitingFor": "等待{x}",
	"reversiLookingForPlayer": "正在搜尋對手",
	"cancel": "取消",
	"reversiAllowIrregularRules": "允許異常規則（完全自由）",
	"reversiDisallowIrregularRules": "不允許異常規則"
}
</locale>
