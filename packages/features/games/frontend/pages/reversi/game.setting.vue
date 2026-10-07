<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<div class="_spacer" style="--MI_SPACER-w: 600px;">
		<div style="text-align: center;"><b><MkUserName :user="game.user1"/></b> vs <b><MkUserName :user="game.user2"/></b></div>

		<div :class="{ [$style.disallow]: isReady }">
			<div class="_gaps" :class="{ [$style.disallowInner]: isReady }">
				<div style="font-size: 1.5em; text-align: center;">{{ $locale.sfc.reversiGameSettings }}</div>

				<template v-if="game.noIrregularRules">
					<div>{{ $locale.sfc.reversiDisallowIrregularRules }}</div>
				</template>
				<template v-else>
					<div class="_panel">
						<div style="display: flex; align-items: center; padding: 16px; border-bottom: solid 1px var(--MI_THEME-divider);">
							<div>{{ mapName }}</div>
							<MkButton style="margin-left: auto;" @click="chooseMap">{{ $locale.sfc.reversiChooseBoard }}</MkButton>
						</div>

						<div style="padding: 16px;">
							<div v-if="game.map == null"><i class="ti ti-dice"></i></div>
							<div v-else :class="$style.board" :style="{ 'grid-template-rows': `repeat(${ game.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.map[0].length }, 1fr)` }">
								<div v-for="(x, i) in game.map.join('')" :class="[$style.boardCell, { [$style.boardCellNone]: x == ' ' }]" @click="onMapCellClick(i, x)">
									<i v-if="x === 'b' || x === 'w'" style="pointer-events: none; user-select: none;" :class="x === 'b' ? 'ti ti-circle-filled' : 'ti ti-circle'"></i>
								</div>
							</div>
						</div>
					</div>

					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.reversiBlackOrWhite }}</template>

						<MkRadios
							v-model="game.bw"
							:options="[
								{ value: 'random', label: $locale.sfc.random },
								{ value: '1', slotId: 'user1' },
								{ value: '2', slotId: 'user2' },
							]"
						>
							<template #option-user1>
								<I18n :src="$locale.sfc.reversiBlackIs" tag="span">
									<template #name>
										<b><MkUserName :user="game.user1"/></b>
									</template>
								</I18n>
							</template>
							<template #option-user2>
								<I18n :src="$locale.sfc.reversiBlackIs" tag="span">
									<template #name>
										<b><MkUserName :user="game.user2"/></b>
									</template>
								</I18n>
							</template>
						</MkRadios>
					</MkFolder>

					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.reversiTimeLimitForEachTurn }}</template>
						<template #suffix>{{ game.timeLimitForEachTurn }}{{ $locale.sfc.timeSecond }}</template>

						<MkRadios
							v-model="game.timeLimitForEachTurn"
							:options="gameTurnOptionsDef"
						>
						</MkRadios>
					</MkFolder>

					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.reversiRules }}</template>

						<div class="_gaps_s">
							<MkSwitch v-model="game.isLlotheo" @update:modelValue="updateSettings('isLlotheo')">{{ $locale.sfc.reversiIsLlotheo }}</MkSwitch>
							<MkSwitch v-model="game.loopedBoard" @update:modelValue="updateSettings('loopedBoard')">{{ $locale.sfc.reversiLoopedMap }}</MkSwitch>
							<MkSwitch v-model="game.canPutEverywhere" @update:modelValue="updateSettings('canPutEverywhere')">{{ $locale.sfc.reversiCanPutEverywhere }}</MkSwitch>
						</div>
					</MkFolder>
				</template>
			</div>
		</div>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<div style="text-align: center;" class="_gaps_s">
					<div v-if="opponentHasSettingsChanged" style="color: var(--MI_THEME-warn);">{{ $locale.sfc.reversiOpponentHasSettingsChanged }}</div>
					<div>
						<template v-if="isReady && isOpReady">{{ $locale.sfc.reversiThisGameIsStartedSoon }}<MkEllipsis/></template>
						<template v-if="isReady && !isOpReady">{{ $locale.sfc.reversiWaitingForOther }}<MkEllipsis/></template>
						<template v-if="!isReady && isOpReady">{{ $locale.sfc.reversiWaitingForMe }}</template>
						<template v-if="!isReady && !isOpReady">{{ $locale.sfc.reversiWaitingBoth }}<MkEllipsis/></template>
					</div>
					<div class="_buttonsCenter">
						<MkButton rounded danger @click="cancel">{{ $locale.sfc.cancel }}</MkButton>
						<MkButton v-if="!isReady" rounded primary @click="ready">{{ $locale.sfc.reversiReady }}</MkButton>
						<MkButton v-if="isReady" rounded @click="unready">{{ $locale.sfc.reversiCancelReady }}</MkButton>
					</div>
					<div>
						<MkSwitch v-model="shareWhenStart">{{ $locale.sfc.reversiShareToTlTheGameWhenStart }}</MkSwitch>
					</div>
				</div>
			</div>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import * as Reversi from 'misskey-reversi';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { $i } from '@features/auth/frontend/i.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import * as os from '@features/ui/frontend/os.js';
import type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios.vue';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const mapCategories = Array.from(new Set(Object.values(Reversi.maps).map(x => x.category)));

const props = defineProps<{
	game: Misskey.entities.ReversiGameDetailed;
	connection: Misskey.IChannelConnection<Misskey.Channels['reversiGame']>;
}>();

const shareWhenStart = defineModel<boolean>('shareWhenStart', { default: false });

const game = ref<Misskey.entities.ReversiGameDetailed>(deepClone(props.game));

const gameTurnOptionsDef = [
	{ value: 5, label: '5' + $locale.value.sfc.timeSecond },
	{ value: 10, label: '10' + $locale.value.sfc.timeSecond },
	{ value: 30, label: '30' + $locale.value.sfc.timeSecond },
	{ value: 60, label: '60' + $locale.value.sfc.timeSecond },
	{ value: 90, label: '90' + $locale.value.sfc.timeSecond },
	{ value: 120, label: '120' + $locale.value.sfc.timeSecond },
	{ value: 180, label: '180' + $locale.value.sfc.timeSecond },
	{ value: 3600, label: '3600' + $locale.value.sfc.timeSecond },
] as MkRadiosOption<number>[];

const mapName = computed(() => {
	if (game.value.map == null) return 'Random';
	const found = Object.values(Reversi.maps).find(x => x.data.join('') === game.value.map.join(''));
	return found ? found.name! : '-Custom-';
});
const isReady = computed(() => {
	if (game.value.user1Id === $i?.id && game.value.user1Ready) return true;
	if (game.value.user2Id === $i?.id && game.value.user2Ready) return true;
	return false;
});
const isOpReady = computed(() => {
	if (game.value.user1Id !== $i?.id && game.value.user1Ready) return true;
	if (game.value.user2Id !== $i?.id && game.value.user2Ready) return true;
	return false;
});

const opponentHasSettingsChanged = ref(false);

watch(() => game.value.bw, () => {
	updateSettings('bw');
});

watch(() => game.value.timeLimitForEachTurn, () => {
	updateSettings('timeLimitForEachTurn');
});

function chooseMap(ev: PointerEvent) {
	const menu: MenuItem[] = [];

	for (const c of mapCategories) {
		const maps = Object.values(Reversi.maps).filter(x => x.category === c);
		if (maps.length === 0) continue;
		if (c != null) {
			menu.push({
				type: 'label',
				text: c,
			});
		}
		for (const m of maps) {
			menu.push({
				text: m.name!,
				action: () => {
					game.value.map = m.data;
					updateSettings('map');
				},
			});
		}
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	props.connection.send('cancel', {});

	router.push('/reversi');
}

function ready() {
	props.connection.send('ready', true);
	opponentHasSettingsChanged.value = false;
}

function unready() {
	props.connection.send('ready', false);
}

function onChangeReadyStates(states: {
	user1: boolean;
	user2: boolean;
}) {
	game.value.user1Ready = states.user1;
	game.value.user2Ready = states.user2;
}

function updateSettings(key: typeof Misskey.reversiUpdateKeys[number]) {
	props.connection.send('updateSettings', {
		key: key,
		value: game.value[key],
	});
}

function onUpdateSettings<K extends typeof Misskey.reversiUpdateKeys[number]>({ userId, key, value }: { userId: string; key: K; value: Misskey.entities.ReversiGameDetailed[K]; }) {
	if (userId === $i?.id) return;
	if (game.value[key] === value) return;
	game.value[key] = value;
	if (isReady.value) {
		opponentHasSettingsChanged.value = true;
		unready();
	}
}

function onMapCellClick(pos: number, pixel: string) {
	const x = pos % game.value.map[0].length;
	const y = Math.floor(pos / game.value.map[0].length);
	const newPixel =
		pixel === ' ' ? '-' :
		pixel === '-' ? 'b' :
		pixel === 'b' ? 'w' :
		' ';
	const line = game.value.map[y].split('');
	line[x] = newPixel;
	game.value.map[y] = line.join('');
	updateSettings('map');
}

props.connection.on('changeReadyStates', onChangeReadyStates);
props.connection.on('updateSettings', onUpdateSettings);

onUnmounted(() => {
	props.connection.off('changeReadyStates', onChangeReadyStates);
	props.connection.off('updateSettings', onUpdateSettings);
});
</script>

<style lang="scss" module>
.disallow {
	cursor: not-allowed;
}
.disallowInner {
	pointer-events: none;
	user-select: none;
	opacity: 0.7;
}

.board {
	display: grid;
	grid-gap: 4px;
	width: 300px;
	height: 300px;
	margin: 0 auto;
	color: var(--MI_THEME-fg);
}

.boardCell {
	display: grid;
	place-items: center;
	background: transparent;
	border: solid 2px var(--MI_THEME-divider);
	border-radius: 6px;
	overflow: clip;
	cursor: pointer;
}
.boardCellNone {
	border-color: transparent;
}

.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "عشوائي",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "ثا",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "غيَر الخصم إعدادته.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": " إلغاء",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"reversiGameSettings": "Opcions del joc",
	"reversiDisallowIrregularRules": "Sense regles irregulars",
	"reversiChooseBoard": "Escull un tauler",
	"reversiBlackOrWhite": "Negres/Blanques",
	"random": "Aleatori ",
	"reversiBlackIs": "{name} juga amb negres ",
	"reversiTimeLimitForEachTurn": "Temps límit per jugada",
	"timeSecond": "Segon(s)",
	"reversiRules": "Regles",
	"reversiIsLlotheo": "Qui tingui menys pedres guanya (Llotheo)",
	"reversiLoopedMap": "Mapa de recursiu",
	"reversiCanPutEverywhere": "Les fitxes es poden posar a qualsevol lloc",
	"reversiOpponentHasSettingsChanged": "L'oponent h canviat la seva configuració ",
	"reversiThisGameIsStartedSoon": "El joc començarà en breu",
	"reversiWaitingForOther": "Esperant la tirada de l'oponent ",
	"reversiWaitingForMe": "Esperant el teu torn",
	"reversiWaitingBoth": "Prepara't ",
	"cancel": "Cancel·lar",
	"reversiReady": "Preparat ",
	"reversiCancelReady": " No preparat ",
	"reversiShareToTlTheGameWhenStart": "Compartir la partida a la línia de temps quan comenci",
	"areYouSure": "Estàs segur?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Náhodně",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Sekund",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Zrušit",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Jste si jistí?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Random",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Cancel",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"reversiGameSettings": "Spieleinstellungen",
	"reversiDisallowIrregularRules": "Keine irregulären Regeln",
	"reversiChooseBoard": "Spielbrett auswählen",
	"reversiBlackOrWhite": "Schwarz/Weiß",
	"random": "Zufällig",
	"reversiBlackIs": "{name} spielt Schwarz",
	"reversiTimeLimitForEachTurn": "Zeitlimit eines Zugs",
	"timeSecond": "Sekunde(n)",
	"reversiRules": "Regeln",
	"reversiIsLlotheo": "Der mit weniger Steinen gewinnt (Llotheo)",
	"reversiLoopedMap": "Wiederholendes Spielbrett",
	"reversiCanPutEverywhere": "Steine können überall platziert werden",
	"reversiOpponentHasSettingsChanged": "Der Gegner hat seine Einstellungen geändert.",
	"reversiThisGameIsStartedSoon": "Das Spiel wird in Kürze beginnen",
	"reversiWaitingForOther": "Warte auf den Zug des Gegenspielers",
	"reversiWaitingForMe": "Warte auf deinen Zug",
	"reversiWaitingBoth": "Mach dich bereit",
	"cancel": "Abbrechen",
	"reversiReady": "Bereit",
	"reversiCancelReady": "Nicht bereit",
	"reversiShareToTlTheGameWhenStart": "Spiel in der Chronik teilen, wenn es gestartet wurde",
	"areYouSure": "Bist du sicher?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Random",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Cancel",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"reversiGameSettings": "Configuración del juego",
	"reversiDisallowIrregularRules": "Sin reglas irregulares ",
	"reversiChooseBoard": "Elegir tablero",
	"reversiBlackOrWhite": "Negras/Blancas",
	"random": "Aleatorio",
	"reversiBlackIs": "{name} juega con negras",
	"reversiTimeLimitForEachTurn": "Tiempo límite por jugada.",
	"timeSecond": "Segundos",
	"reversiRules": "Reglas",
	"reversiIsLlotheo": "El que tenga menos fichas gana (LLoTheO)",
	"reversiLoopedMap": "Mapa en bucle",
	"reversiCanPutEverywhere": "Las fichas se pueden poner a cualquier lugar\n",
	"reversiOpponentHasSettingsChanged": "El oponente ha cambiado su configuración",
	"reversiThisGameIsStartedSoon": "El juego comenzará en breve",
	"reversiWaitingForOther": "Esperando el turno del adversario",
	"reversiWaitingForMe": "Esperando tu turno",
	"reversiWaitingBoth": "Prepárate",
	"cancel": "Cancelar",
	"reversiReady": "Listo",
	"reversiCancelReady": "No estoy listo",
	"reversiShareToTlTheGameWhenStart": "Compartir la partida en la línea de tiempo cuando comience ",
	"areYouSure": "¿Estás conforme?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Aléatoire",
	"reversiBlackIs": "{name} joue les noirs",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "s",
	"reversiRules": "Règles",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Préparez-vous",
	"cancel": "Annuler",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Êtes-vous sûr·e ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"reversiGameSettings": "Pengaturan permainan",
	"reversiDisallowIrregularRules": "Tanpa aturan non-reguler",
	"reversiChooseBoard": "Pilih papan",
	"reversiBlackOrWhite": "Hitam/Putih",
	"random": "Acak",
	"reversiBlackIs": "{name} bermain sebagai Hitam",
	"reversiTimeLimitForEachTurn": "Batas waktu untuk gantian",
	"timeSecond": "detik",
	"reversiRules": "Aturan",
	"reversiIsLlotheo": "Pemain dengan batu yang sedikit menang (Llotheo)",
	"reversiLoopedMap": "Peta melingkar",
	"reversiCanPutEverywhere": "Keping dapat ditaruh dimana saja",
	"reversiOpponentHasSettingsChanged": "Lawan telah mengganti pengaturan mereka.",
	"reversiThisGameIsStartedSoon": "Permainan akan segera dimulai",
	"reversiWaitingForOther": "Menunggu langkah giliran dari lawan",
	"reversiWaitingForMe": "Menungguh langkah giliran dari kamu",
	"reversiWaitingBoth": "Bersiap",
	"cancel": "Batalkan",
	"reversiReady": "Siap",
	"reversiCancelReady": "Belum siap",
	"reversiShareToTlTheGameWhenStart": "Bagikan permainan ke lini masa ketika dimulai",
	"areYouSure": "Apakah kamu yakin?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"reversiGameSettings": "Impostazioni di gioco",
	"reversiDisallowIrregularRules": "Impedire le regole inconsuete",
	"reversiChooseBoard": "Segli la tavola",
	"reversiBlackOrWhite": "Neri / Bianchi",
	"random": "Casuale",
	"reversiBlackIs": "{name} muove i Neri",
	"reversiTimeLimitForEachTurn": "Tempo limite per turno",
	"timeSecond": "s",
	"reversiRules": "Regole del gioco",
	"reversiIsLlotheo": "Vince chi ha meno pietre (Roseo)",
	"reversiLoopedMap": "Mappa ricorsiva",
	"reversiCanPutEverywhere": "Modalità che può essere posizionata ovunque",
	"reversiOpponentHasSettingsChanged": "L'avversario ha cambiato configurazione",
	"reversiThisGameIsStartedSoon": "Il gioco sta per iniziare",
	"reversiWaitingForOther": "Attendere l'avversario",
	"reversiWaitingForMe": "Ti stanno aspettando",
	"reversiWaitingBoth": "Preparatevi",
	"cancel": "Annulla",
	"reversiReady": "Pronti",
	"reversiCancelReady": "Riprendere la preparazione",
	"reversiShareToTlTheGameWhenStart": "Pubblica l'inizio della partita sulla tua Timeline",
	"areYouSure": "Confermi?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"reversiGameSettings": "対局の設定",
	"reversiDisallowIrregularRules": "変則なし",
	"reversiChooseBoard": "ボードを選択",
	"reversiBlackOrWhite": "先行/後攻",
	"random": "ランダム",
	"reversiBlackIs": "{name}が黒(先行)",
	"reversiTimeLimitForEachTurn": "1ターンの時間制限",
	"timeSecond": "秒",
	"reversiRules": "ルール",
	"reversiIsLlotheo": "石の少ない方が勝ち(ロセオ)",
	"reversiLoopedMap": "ループマップ",
	"reversiCanPutEverywhere": "どこでも置けるモード",
	"reversiOpponentHasSettingsChanged": "相手が設定を変更しました",
	"reversiThisGameIsStartedSoon": "対局はまもなく開始されます",
	"reversiWaitingForOther": "相手の準備が完了するのを待っています",
	"reversiWaitingForMe": "あなたの準備が完了するのを待っています",
	"reversiWaitingBoth": "準備してください",
	"cancel": "キャンセル",
	"reversiReady": "準備完了",
	"reversiCancelReady": "準備を再開",
	"reversiShareToTlTheGameWhenStart": "開始時に対局をタイムラインに投稿",
	"areYouSure": "よろしいですか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"reversiGameSettings": "対局の設定",
	"reversiDisallowIrregularRules": "変則なし",
	"reversiChooseBoard": "ボードを選択",
	"reversiBlackOrWhite": "先行/後攻",
	"random": "ランダム",
	"reversiBlackIs": "{name}が黒(先行)",
	"reversiTimeLimitForEachTurn": "1ターンの時間制限",
	"timeSecond": "秒",
	"reversiRules": "ルール",
	"reversiIsLlotheo": "石の少ない方が勝ち(ロセオ)",
	"reversiLoopedMap": "ループマップ",
	"reversiCanPutEverywhere": "どこでも置けるモード",
	"reversiOpponentHasSettingsChanged": "相手が設定変えたで",
	"reversiThisGameIsStartedSoon": "対局、そろそろ開始されるで。",
	"reversiWaitingForOther": "相手の準備が完了するのを待ってんで。",
	"reversiWaitingForMe": "あんさんの準備が完了すんのを待ってんで",
	"reversiWaitingBoth": "準備してなー",
	"cancel": "やめる",
	"reversiReady": "準備完了",
	"reversiCancelReady": "準備を再開",
	"reversiShareToTlTheGameWhenStart": "初めの時に対局をタイムラインに投稿するで",
	"areYouSure": "いいん？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Random",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Cancel",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Random",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "ರದ್ದು",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"reversiGameSettings": "대국 설정",
	"reversiDisallowIrregularRules": "규칙 변경 없음",
	"reversiChooseBoard": "보드 선택",
	"reversiBlackOrWhite": "선공/후공",
	"random": "무작위",
	"reversiBlackIs": "{name}님이 흑(선공)",
	"reversiTimeLimitForEachTurn": "각 수의 시간 제한",
	"timeSecond": "초",
	"reversiRules": "규칙",
	"reversiIsLlotheo": "돌이 적은 쪽이 승리(로세오)",
	"reversiLoopedMap": "순환 지도",
	"reversiCanPutEverywhere": "어디든 둘 수 있는 모드",
	"reversiOpponentHasSettingsChanged": "상대가 설정을 변경했습니다",
	"reversiThisGameIsStartedSoon": "대국을 곧 시작합니다",
	"reversiWaitingForOther": "상대의 준비가 끝나기를 기다리고 있습니다.",
	"reversiWaitingForMe": "나의 준비가 끝나기를 기다리고 있습니다.",
	"reversiWaitingBoth": "준비하세요",
	"cancel": "취소",
	"reversiReady": "준비 완료",
	"reversiCancelReady": "준비되지 않음",
	"reversiShareToTlTheGameWhenStart": "대국이 시작할 때 타임라인에 공유",
	"areYouSure": "계속 진행하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Willekeurig",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Annuleren",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Weet je het zeker?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Tilfeldig",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Sekunder",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Avbryt",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Losowe",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "sekunda",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Anuluj",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Na pewno?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"reversiGameSettings": "Configurações de jogo",
	"reversiDisallowIrregularRules": "Sem regras irregulares",
	"reversiChooseBoard": "Escolha um tabuleiro",
	"reversiBlackOrWhite": "Preto/Branco",
	"random": "Aleatório",
	"reversiBlackIs": "{name} é as peças Pretas",
	"reversiTimeLimitForEachTurn": "Tempo limite por turno",
	"timeSecond": "Segundo(s)",
	"reversiRules": "Regras",
	"reversiIsLlotheo": "Aquele com menos pedras vence (Llotheo)",
	"reversiLoopedMap": "Mapa em ‘loop’",
	"reversiCanPutEverywhere": "É possível pôr em qualquer lugar",
	"reversiOpponentHasSettingsChanged": "O oponente alterou as configurações dele",
	"reversiThisGameIsStartedSoon": "O jogo começará em breve",
	"reversiWaitingForOther": "Esperando o turno do oponente",
	"reversiWaitingForMe": "Esperando o seu turno",
	"reversiWaitingBoth": "Prepare-se",
	"cancel": "Cancelar",
	"reversiReady": "Pronto",
	"reversiCancelReady": "Não pronto",
	"reversiShareToTlTheGameWhenStart": "Compartilhar jogo na linha do tempo ao iniciar",
	"areYouSure": "Tem certeza?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Случайные",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "с",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Отмена",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Вы уверены?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Náhodné",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "s",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Zrušiť",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"reversiGameSettings": "ตั้งค่าการเล่น",
	"reversiDisallowIrregularRules": "ไม่อนุญาตกฎที่ไม่ปรกติ",
	"reversiChooseBoard": "เลือกกระดาน",
	"reversiBlackOrWhite": "ดำ/ขาว",
	"random": "สุ่มค่า",
	"reversiBlackIs": "{name}เป็นสีดำ",
	"reversiTimeLimitForEachTurn": "จำกัดเวลาต่อแต่ละตา",
	"timeSecond": "วินาที",
	"reversiRules": "กฎ",
	"reversiIsLlotheo": "คนที่มีตัวหมากน้อยกว่าชนะ (Roseo)",
	"reversiLoopedMap": "ลูปแมป",
	"reversiCanPutEverywhere": "โหมดที่สามารถวางได้ทุกที่",
	"reversiOpponentHasSettingsChanged": "อีกฝ่ายเปลี่ยนการตั้งค่า",
	"reversiThisGameIsStartedSoon": "การเล่นจะเริ่มแล้ว",
	"reversiWaitingForOther": "กำลังรออีกฝ่ายเตรียมตัวให้เสร็จ",
	"reversiWaitingForMe": "กำลังรอฝ่ายคุณเตรียมตัวให้เสร็จ",
	"reversiWaitingBoth": "กรุณาเตรียมตัว",
	"cancel": "ยกเลิก",
	"reversiReady": "เตรียมตัวพร้อมแล้ว",
	"reversiCancelReady": "ยกเลิกการเตรียมตัวพร้อม",
	"reversiShareToTlTheGameWhenStart": "โพสต์ลงไทม์ไลน์เมื่อเริ่มการเล่น",
	"areYouSure": "แน่ใจแล้วใช่ไหมคะ?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"reversiGameSettings": "Oyun ayarları",
	"reversiDisallowIrregularRules": "Düzensiz kurallar yok",
	"reversiChooseBoard": "Bir tahta seçin",
	"reversiBlackOrWhite": "Siyah/Beyaz",
	"random": "Rastgele",
	"reversiBlackIs": "{name} siyah oynuyor.",
	"reversiTimeLimitForEachTurn": "Sıra için zaman sınırı",
	"timeSecond": "Saniye(ler)",
	"reversiRules": "Kurallar",
	"reversiIsLlotheo": "Taş sayısı daha az olan kazanır (Llotheo)",
	"reversiLoopedMap": "Döngüsel harita",
	"reversiCanPutEverywhere": "Fayanslar her yere yerleştirilebilir.",
	"reversiOpponentHasSettingsChanged": "Rakip ayarlarını değiştirmiş.",
	"reversiThisGameIsStartedSoon": "Oyun kısa süre içinde başlayacak.",
	"reversiWaitingForOther": "Rakibin sırasını bekle",
	"reversiWaitingForMe": "Sıranı bekliyorsun",
	"reversiWaitingBoth": "Hazır olun",
	"cancel": "Vazgeç",
	"reversiReady": "Hazır",
	"reversiCancelReady": "Hazır değil",
	"reversiShareToTlTheGameWhenStart": "Oyun başlatıldığında panoda paylaş",
	"areYouSure": "Emin misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Random",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "Second(s)",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Cancel",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Випадковий",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "с",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Скасувати",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Ви впевнені?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"reversiGameSettings": "Game settings",
	"reversiDisallowIrregularRules": "No irregular rules",
	"reversiChooseBoard": "Choose a board",
	"reversiBlackOrWhite": "Black/White",
	"random": "Ngẫu nhiên",
	"reversiBlackIs": "{name} is playing Black",
	"reversiTimeLimitForEachTurn": "Time limit for turn",
	"timeSecond": "s",
	"reversiRules": "Rules",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"reversiOpponentHasSettingsChanged": "The opponent has changed their settings.",
	"reversiThisGameIsStartedSoon": "The game will begin shortly",
	"reversiWaitingForOther": "Waiting for opponent's turn",
	"reversiWaitingForMe": "Waiting for your turn",
	"reversiWaitingBoth": "Get ready",
	"cancel": "Hủy",
	"reversiReady": "Ready",
	"reversiCancelReady": "Not ready",
	"reversiShareToTlTheGameWhenStart": "Share Game to timeline when started",
	"areYouSure": "Bạn chắc chứ?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"reversiGameSettings": "对局设置",
	"reversiDisallowIrregularRules": "禁止特殊规则",
	"reversiChooseBoard": "选择棋盘",
	"reversiBlackOrWhite": "先手/后手",
	"random": "随机",
	"reversiBlackIs": "{name}执黑（先手）",
	"reversiTimeLimitForEachTurn": "1回合的时间限制",
	"timeSecond": "秒",
	"reversiRules": "规则",
	"reversiIsLlotheo": "落子少的一方获胜（黑白棋规则）",
	"reversiLoopedMap": "循环棋盘",
	"reversiCanPutEverywhere": "无限制放置模式",
	"reversiOpponentHasSettingsChanged": "对手更改了设定",
	"reversiThisGameIsStartedSoon": "对局即将开始",
	"reversiWaitingForOther": "等待对手准备",
	"reversiWaitingForMe": "等待你的准备",
	"reversiWaitingBoth": "请准备",
	"cancel": "取消",
	"reversiReady": "准备就绪",
	"reversiCancelReady": "重新准备",
	"reversiShareToTlTheGameWhenStart": "开始时在时间线发布对局",
	"areYouSure": "你确定吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"reversiGameSettings": "對弈設定",
	"reversiDisallowIrregularRules": "不允許異常規則",
	"reversiChooseBoard": "選擇棋盤",
	"reversiBlackOrWhite": "先手/後手",
	"random": "隨機",
	"reversiBlackIs": "{name} 為黑棋（先攻）",
	"reversiTimeLimitForEachTurn": "每回合的時間限制",
	"timeSecond": "秒",
	"reversiRules": "規則",
	"reversiIsLlotheo": "子較少的一方為勝（顛倒規則）",
	"reversiLoopedMap": "循環棋盤",
	"reversiCanPutEverywhere": "隨意置放模式",
	"reversiOpponentHasSettingsChanged": "對手更改了設定",
	"reversiThisGameIsStartedSoon": "對弈即將開始",
	"reversiWaitingForOther": "等待對手準備就緒",
	"reversiWaitingForMe": "等待您準備就緒",
	"reversiWaitingBoth": "請準備",
	"cancel": "取消",
	"reversiReady": "準備就緒",
	"reversiCancelReady": "重新準備",
	"reversiShareToTlTheGameWhenStart": "在遊戲開始時將對弈資訊發布到時間軸",
	"areYouSure": "是否確定？"
}
</locale>
