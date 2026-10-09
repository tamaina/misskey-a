<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 500px;">
	<div :class="$style.root" class="_gaps">
		<div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
			<span>({{ $locale.sfc.reversiBlack }})</span>
			<MkAvatar style="width: 32px; height: 32px;" :user="blackUser" :showIndicator="true"/>
			<span> vs </span>
			<MkAvatar style="width: 32px; height: 32px;" :user="whiteUser" :showIndicator="true"/>
			<span>({{ $locale.sfc.reversiWhite }})</span>
		</div>

		<div style="overflow: clip; line-height: 28px;">
			<div v-if="!iAmPlayer && !game.isEnded && turnUser">
				<Mfm :key="'turn:' + turnUser.id" :text="interpolateLocaleParameters($locale.sfc.reversiTurnOf, { name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
				<MkEllipsis/>
			</div>
			<div v-if="(logPos !== game.logs.length) && turnUser">
				<Mfm :key="'past-turn-of:' + turnUser.id" :text="interpolateLocaleParameters($locale.sfc.reversiPastTurnOf, { name: turnUser.name ?? turnUser.username })" :plain="true" :customEmojis="turnUser.emojis"/>
			</div>
			<div v-if="iAmPlayer && !game.isEnded && !isMyTurn">{{ $locale.sfc.reversiOpponentTurn }}<MkEllipsis/><span style="margin-left: 1em; opacity: 0.7;">({{ interpolateLocaleParameters($locale.sfc.remainingN, { n: opTurnTimerRmain }) }})</span></div>
			<div v-if="iAmPlayer && !game.isEnded && isMyTurn"><span style="display: inline-block; font-weight: bold; animation: global-tada 1s linear infinite both;">{{ $locale.sfc.reversiMyTurn }}</span><span style="margin-left: 1em; opacity: 0.7;">({{ interpolateLocaleParameters($locale.sfc.remainingN, { n: myTurnTimerRmain }) }})</span></div>
			<div v-if="game.isEnded && logPos == game.logs.length">
				<template v-if="game.winner">
					<Mfm :key="'won'" :text="interpolateLocaleParameters($locale.sfc.reversiWon, { name: game.winner.name ?? game.winner.username })" :plain="true" :customEmojis="game.winner.emojis"/>
					<span v-if="game.surrenderedUserId != null"> ({{ $locale.sfc.reversiSurrendered }})</span>
					<span v-if="game.timeoutUserId != null"> ({{ $locale.sfc.reversiTimeout }})</span>
				</template>
				<template v-else>{{ $locale.sfc.reversiDrawn }}</template>
			</div>
		</div>

		<div class="_woodenFrame">
			<div :class="$style.boardInner">
				<div v-if="showBoardLabels" :class="$style.labelsX">
					<span v-for="i in game.map[0].length" :key="i" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
				</div>
				<div style="display: flex;">
					<div v-if="showBoardLabels" :class="$style.labelsY">
						<div v-for="i in game.map.length" :key="i" :class="$style.labelsYLabel">{{ i }}</div>
					</div>
					<div :class="$style.boardCells" :style="cellsStyle">
						<div
							v-for="(stone, i) in engine.board"
							:key="i"
							v-tooltip="`${String.fromCharCode(65 + engine.posToXy(i)[0])}${engine.posToXy(i)[1] + 1}`"
							:class="[$style.boardCell, {
								[$style.boardCell_empty]: stone == null,
								[$style.boardCell_none]: engine.map[i] === 'null',
								[$style.boardCell_isEnded]: game.isEnded,
								[$style.boardCell_myTurn]: !game.isEnded && isMyTurn,
								[$style.boardCell_can]: turnUser ? engine.canPut(turnUser.id === blackUser.id, i) : null,
								[$style.boardCell_prev]: engine.prevPos === i
							}]"
							@click="putStone(i)"
						>
							<Transition
								:enterActiveClass="$style.transition_flip_enterActive"
								:leaveActiveClass="$style.transition_flip_leaveActive"
								:enterFromClass="$style.transition_flip_enterFrom"
								:leaveToClass="$style.transition_flip_leaveTo"
								mode="default"
							>
								<template v-if="useAvatarAsStone">
									<img v-if="stone === true" :class="$style.boardCellStone" :src="blackUser.avatarUrl ?? undefined"/>
									<img v-else-if="stone === false" :class="$style.boardCellStone" :src="whiteUser.avatarUrl ?? undefined"/>
								</template>
								<template v-else>
									<img v-if="stone === true" :class="$style.boardCellStone" src="/client-assets/reversi/stone_b.png"/>
									<img v-else-if="stone === false" :class="$style.boardCellStone" src="/client-assets/reversi/stone_w.png"/>
								</template>
							</Transition>
						</div>
					</div>
					<div v-if="showBoardLabels" :class="$style.labelsY">
						<div v-for="i in game.map.length" :key="i" :class="$style.labelsYLabel">{{ i }}</div>
					</div>
				</div>
				<div v-if="showBoardLabels" :class="$style.labelsX">
					<span v-for="i in game.map[0].length" :key="i" :class="$style.labelsXLabel">{{ String.fromCharCode(64 + i) }}</span>
				</div>
			</div>
		</div>

		<div v-if="game.isEnded" class="_panel _gaps_s" style="padding: 16px;">
			<div>{{ logPos }} / {{ game.logs.length }}</div>
			<div v-if="!autoplaying" class="_buttonsCenter">
				<MkButton :disabled="logPos === 0" @click="logPos = 0"><i class="ti ti-chevrons-left"></i></MkButton>
				<MkButton :disabled="logPos === 0" @click="logPos--"><i class="ti ti-chevron-left"></i></MkButton>
				<MkButton :disabled="logPos === game.logs.length" @click="logPos++"><i class="ti ti-chevron-right"></i></MkButton>
				<MkButton :disabled="logPos === game.logs.length" @click="logPos = game.logs.length"><i class="ti ti-chevrons-right"></i></MkButton>
			</div>
			<MkButton style="margin: auto;" :disabled="autoplaying" @click="autoplay()"><i class="ti ti-player-play"></i></MkButton>
		</div>

		<div class="_panel" style="padding: 16px;">
			<div>
				<b>{{ interpolateLocaleParameters($locale.sfc.reversiTurnCount, { count: logPos }) }}</b> {{ $locale.sfc.reversiBlack }}:{{ engine.blackCount }} {{ $locale.sfc.reversiWhite }}:{{ engine.whiteCount }} {{ $locale.sfc.reversiTotal }}:{{ engine.blackCount + engine.whiteCount }}
			</div>
			<div>
				<div style="display: flex; align-items: center;">
					<span style="margin-right: 8px;">({{ $locale.sfc.reversiBlack }})</span>
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="blackUser" :showIndicator="true"/>
					<MkA :to="userPage(blackUser)"><MkUserName :user="blackUser"/></MkA>
				</div>
				<div> vs </div>
				<div style="display: flex; align-items: center;">
					<span style="margin-right: 8px;">({{ $locale.sfc.reversiWhite }})</span>
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="whiteUser" :showIndicator="true"/>
					<MkA :to="userPage(whiteUser)"><MkUserName :user="whiteUser"/></MkA>
				</div>
			</div>
			<div>
				<p v-if="game.isLlotheo">{{ $locale.sfc.reversiIsLlotheo }}</p>
				<p v-if="game.loopedBoard">{{ $locale.sfc.reversiLoopedMap }}</p>
				<p v-if="game.canPutEverywhere">{{ $locale.sfc.reversiCanPutEverywhere }}</p>
			</div>
		</div>

		<MkFolder>
			<template #label>{{ $locale.sfc.options }}</template>
			<div class="_gaps_s" style="text-align: left;">
				<MkSwitch v-model="showBoardLabels">{{ $locale.sfc.reversiShowBoardLabels }}</MkSwitch>
				<MkSwitch v-model="useAvatarAsStone">{{ $locale.sfc.reversiUseAvatarAsStone }}</MkSwitch>
			</div>
		</MkFolder>

		<div class="_buttonsCenter">
			<MkButton v-if="!game.isEnded && iAmPlayer" danger @click="surrender">{{ $locale.sfc.reversiSurrender }}</MkButton>
			<MkButton @click="share">{{ $locale.sfc.share }}</MkButton>
		</div>

		<MkA v-if="game.isEnded" :to="`/reversi`">
			<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; width: 200px; margin: auto;"/>
		</MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as Reversi from 'misskey-reversi';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { url } from '@features/boot/frontend/shared/config.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { $i } from '@features/auth/frontend/i.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
import * as os from '@features/ui/frontend/os.js';
import { confetti } from '@features/ui/frontend/utility/confetti.js';
import { genId } from '@features/runtime/frontend/utility/id.js';

const props = defineProps<{
	game: Misskey.entities.ReversiGameDetailed;
	connection?: Misskey.IChannelConnection<Misskey.Channels['reversiGame']> | null;
}>();

const showBoardLabels = ref<boolean>(false);
const useAvatarAsStone = ref<boolean>(true);
const autoplaying = ref<boolean>(false);
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const game = ref<Misskey.entities.ReversiGameDetailed & { logs: Reversi.Serializer.SerializedLog[] }>(deepClone(props.game));
const logPos = ref<number>(game.value.logs.length);
const engine = shallowRef<Reversi.Game>(Reversi.Serializer.restoreGame({
	map: game.value.map,
	isLlotheo: game.value.isLlotheo,
	canPutEverywhere: game.value.canPutEverywhere,
	loopedBoard: game.value.loopedBoard,
	logs: game.value.logs,
}));

const iAmPlayer = computed(() => {
	return game.value.user1Id === $i?.id || game.value.user2Id === $i?.id;
});

const myColor = computed(() => {
	if (!iAmPlayer.value) return null;
	if (game.value.user1Id === $i?.id && game.value.black === 1) return true;
	if (game.value.user2Id === $i?.id && game.value.black === 2) return true;
	return false;
});

const opColor = computed(() => {
	if (!iAmPlayer.value) return null;
	return !myColor.value;
});

const blackUser = computed(() => {
	return game.value.black === 1 ? game.value.user1 : game.value.user2;
});

const whiteUser = computed(() => {
	return game.value.black === 1 ? game.value.user2 : game.value.user1;
});

const turnUser = computed(() => {
	if (engine.value.turn === true) {
		return game.value.black === 1 ? game.value.user1 : game.value.user2;
	} else if (engine.value.turn === false) {
		return game.value.black === 1 ? game.value.user2 : game.value.user1;
	} else {
		return null;
	}
});

const isMyTurn = computed(() => {
	if (!iAmPlayer.value) return false;
	const u = turnUser.value;
	if (u == null) return false;
	return u.id === $i?.id;
});

const cellsStyle = computed(() => {
	return {
		'grid-template-rows': `repeat(${game.value.map.length}, 1fr)`,
		'grid-template-columns': `repeat(${game.value.map[0].length}, 1fr)`,
	};
});

watch(logPos, (v) => {
	if (!game.value.isEnded) return;
	engine.value = Reversi.Serializer.restoreGame({
		map: game.value.map,
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
		logs: game.value.logs.slice(0, v),
	});
});

if (game.value.isStarted && !game.value.isEnded) {
	useInterval(() => {
		if (game.value.isEnded) return;
		const crc32 = engine.value.calcCrc32();
		if (_DEV_) console.log('crc32', crc32);
		misskeyApi('reversi/verify', {
			gameId: game.value.id,
			crc32: crc32.toString(),
		}).then((res) => {
			if (res.desynced) {
				if (_DEV_) console.log('resynced');
				restoreGame(res.game!);
			}
		});
	}, 10000, { immediate: false, afterMounted: true });
}

const appliedOps: string[] = [];

function putStone(pos: number) {
	if (game.value.isEnded) return;
	if (!iAmPlayer.value) return;
	if (!isMyTurn.value) return;
	if (!engine.value.canPut(myColor.value!, pos)) return;

	engine.value.putStone(pos);

	triggerRef(engine);

	sound.playUrl('/client-assets/reversi/put.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	const id = genId();
	props.connection!.send('putStone', {
		pos: pos,
		id,
	});
	appliedOps.push(id);

	myTurnTimerRmain.value = game.value.timeLimitForEachTurn;
	opTurnTimerRmain.value = game.value.timeLimitForEachTurn;

	checkEnd();
}

const myTurnTimerRmain = ref<number>(game.value.timeLimitForEachTurn);
const opTurnTimerRmain = ref<number>(game.value.timeLimitForEachTurn);

const TIMER_INTERVAL_SEC = 3;
if (!props.game.isEnded) {
	useInterval(() => {
		if (myTurnTimerRmain.value > 0) {
			myTurnTimerRmain.value = Math.max(0, myTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}
		if (opTurnTimerRmain.value > 0) {
			opTurnTimerRmain.value = Math.max(0, opTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}

		if (iAmPlayer.value) {
			if ((isMyTurn.value && myTurnTimerRmain.value === 0) || (!isMyTurn.value && opTurnTimerRmain.value === 0)) {
				props.connection!.send('claimTimeIsUp', {});
			}
		}
	}, TIMER_INTERVAL_SEC * 1000, {
		immediate: false,
		afterMounted: true,
		keepRunningWhenHidden: true, // 対局の制限時間管理のため、バックグラウンドでも止めない
	});
}

async function onStreamLog(log: Reversi.Serializer.Log & { id: string | null }) {
	game.value.logs = Reversi.Serializer.serializeLogs([
		...Reversi.Serializer.deserializeLogs(game.value.logs),
		log,
	]);

	logPos.value++;

	if (log.id == null || !appliedOps.includes(log.id)) {
		switch (log.operation) {
			case 'put': {
				sound.playUrl('/client-assets/reversi/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				if (log.player !== engine.value.turn) { // = desyncが発生している
					const _game = await misskeyApi('reversi/show-game', {
						gameId: props.game.id,
					});
					restoreGame(_game);
					return;
				}

				engine.value.putStone(log.pos);
				triggerRef(engine);

				myTurnTimerRmain.value = game.value.timeLimitForEachTurn;
				opTurnTimerRmain.value = game.value.timeLimitForEachTurn;

				checkEnd();
				break;
			}

			default:
				break;
		}
	}
}

function onStreamEnded(x: {
	winnerId: Misskey.entities.User['id'] | null;
	game: Misskey.entities.ReversiGameDetailed;
}) {
	game.value = deepClone(x.game);

	if (game.value.winnerId === $i?.id) {
		confetti({
			duration: 1000 * 3,
		});

		sound.playUrl('/client-assets/reversi/win.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	} else {
		sound.playUrl('/client-assets/reversi/lose.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}
}

function checkEnd() {
	game.value.isEnded = engine.value.isEnded;
	if (game.value.isEnded) {
		if (engine.value.winner === true) {
			game.value.winnerId = game.value.black === 1 ? game.value.user1Id : game.value.user2Id;
			game.value.winner = game.value.black === 1 ? game.value.user1 : game.value.user2;
		} else if (engine.value.winner === false) {
			game.value.winnerId = game.value.black === 1 ? game.value.user2Id : game.value.user1Id;
			game.value.winner = game.value.black === 1 ? game.value.user2 : game.value.user1;
		} else {
			game.value.winnerId = null;
			game.value.winner = null;
		}
	}
}

function restoreGame(_game: Misskey.entities.ReversiGameDetailed) {
	game.value = deepClone(_game);

	engine.value = Reversi.Serializer.restoreGame({
		map: game.value.map,
		isLlotheo: game.value.isLlotheo,
		canPutEverywhere: game.value.canPutEverywhere,
		loopedBoard: game.value.loopedBoard,
		logs: game.value.logs,
	});

	logPos.value = game.value.logs.length;

	checkEnd();
}

async function surrender() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	misskeyApi('reversi/surrender', {
		gameId: game.value.id,
	});
}

function autoplay() {
	autoplaying.value = true;
	logPos.value = 0;
	const logs = Reversi.Serializer.deserializeLogs(game.value.logs);

	window.setTimeout(() => {
		logPos.value = 1;

		let i = 1;
		let previousLog = logs[0];
		const tick = () => {
			const log = logs[i];
			const time = log.time - previousLog.time;
			window.setTimeout(() => {
				i++;
				logPos.value++;
				previousLog = log;

				if (i < logs.length) {
					tick();
				} else {
					autoplaying.value = false;
				}
			}, time);
		};

		tick();
	}, 1000);
}

function share() {
	os.post({
		initialText: `#MisskeyReversi\n${url}/reversi/g/${game.value.id}`,
		instant: true,
	});
}

onMounted(() => {
	if (props.connection != null) {
		props.connection.on('log', onStreamLog);
		props.connection.on('ended', onStreamEnded);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('log', onStreamLog);
		props.connection.on('ended', onStreamEnded);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
		props.connection.off('ended', onStreamEnded);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('log', onStreamLog);
		props.connection.off('ended', onStreamEnded);
	}
});
</script>

<style lang="scss" module>
@use "sass:math";

.transition_flip_enterActive,
.transition_flip_leaveActive {
	backface-visibility: hidden;
	transition: opacity 0.5s ease, transform 0.5s ease;
}
.transition_flip_enterFrom {
	transform: rotateY(-180deg);
	opacity: 0;
}
.transition_flip_leaveTo {
	transform: rotateY(180deg);
	opacity: 0;
}

$label-size: 16px;
$gap: 4px;

.root {
	text-align: center;
}

.boardInner {
	padding: 32px;

	background: var(--MI_THEME-panel);
	box-shadow: 0 0 2px 1px #ce8a5c, inset 0 0 1px 1px #693410;
	border-radius: 8px;
}

@container (max-width: 400px) {
	.boardInner {
		padding: 16px;
	}
}

.labelsX {
	height: $label-size;
	padding: 0 $label-size;
	display: flex;
}

.labelsXLabel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.8em;

	&:first-child {
		margin-left: -(math.div($gap, 2));
	}

	&:last-child {
		margin-right: -(math.div($gap, 2));
	}
}

.labelsY {
	width: $label-size;
	display: flex;
	flex-direction: column;
}

.labelsYLabel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;

	&:first-child {
		margin-top: -(math.div($gap, 2));
	}

	&:last-child {
		margin-bottom: -(math.div($gap, 2));
	}
}

.boardCells {
	flex: 1;
	display: grid;
	grid-gap: $gap;
}

.boardCell {
	background: transparent;
	border-radius: 100%;
	aspect-ratio: 1;
	transform-style: preserve-3d;
	perspective: 150px;
	transition: border 0.25s ease, opacity 0.25s ease;

	&.boardCell_empty {
		border: solid 2px var(--MI_THEME-divider);
	}

	&.boardCell_empty.boardCell_can {
		border-color: var(--MI_THEME-accent);
		opacity: 0.5;
	}

	&.boardCell_empty.boardCell_myTurn {
		border-color: var(--MI_THEME-divider);
		opacity: 1;

		&.boardCell_can {
			border-color: var(--MI_THEME-accent);
			cursor: pointer;

			&:hover {
				background: var(--MI_THEME-accent);
			}
		}
	}

	&.boardCell_prev {
		box-shadow: 0 0 0 4px var(--MI_THEME-accent);
	}

	&.boardCell_isEnded {
		border-color: var(--MI_THEME-divider);
	}

	&.boardCell_none {
		border-color: transparent !important;
	}
}

.boardCellStone {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	user-select: none;
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 100%;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "المجموع",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "خيارات",
	"reversiShowBoardLabels": "اعرض ترقيم الصفوف والأعمدة على اللوح",
	"reversiUseAvatarAsStone": "حوَل الحجارة إلى صور مستخدمين",
	"reversiSurrender": "Surrender",
	"share": "شارِك",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"reversiBlack": "Negres",
	"reversiWhite": "Blanques",
	"reversiTurnOf": "Li toca a {name}",
	"reversiPastTurnOf": "Torn de {name}",
	"reversiOpponentTurn": "Torn de l'oponent ",
	"remainingN": "Queden: {n}",
	"reversiMyTurn": "El teu torn",
	"reversiWon": "{name} ha guanyat",
	"reversiSurrendered": "T'has rendit",
	"reversiTimeout": "Temps esgotat",
	"reversiDrawn": "Empat",
	"reversiTurnCount": "Torn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "Qui tingui menys pedres guanya (Llotheo)",
	"reversiLoopedMap": "Mapa de recursiu",
	"reversiCanPutEverywhere": "Les fitxes es poden posar a qualsevol lloc",
	"options": "Opcions",
	"reversiShowBoardLabels": "Mostrar el número de línia i columna al tauler de joc",
	"reversiUseAvatarAsStone": "Fer servir els avatars dels usuaris com a fitxes",
	"reversiSurrender": "Rendeix-te",
	"share": "Comparteix",
	"areYouSure": "Estàs segur?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Celkem",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Možnosti",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Sdílet",
	"areYouSure": "Jste si jistí?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Share",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"reversiBlack": "Schwarz",
	"reversiWhite": "Weiß",
	"reversiTurnOf": "{name} ist am Zug",
	"reversiPastTurnOf": "Zug von {name}",
	"reversiOpponentTurn": "Dein Gegner ist an der Reihe",
	"remainingN": "Verbleibend: {n}",
	"reversiMyTurn": "Du bist am Zug",
	"reversiWon": "{name} hat gewonnen",
	"reversiSurrendered": "Aufgegeben",
	"reversiTimeout": "Zeit abgelaufen",
	"reversiDrawn": "Unentschieden",
	"reversiTurnCount": " Zug {count}",
	"reversiTotal": "Gesamt",
	"reversiIsLlotheo": "Der mit weniger Steinen gewinnt (Llotheo)",
	"reversiLoopedMap": "Wiederholendes Spielbrett",
	"reversiCanPutEverywhere": "Steine können überall platziert werden",
	"options": "Optionen",
	"reversiShowBoardLabels": "Anzeige der Zeilen- und Spaltennummern am Spielbrett",
	"reversiUseAvatarAsStone": "Steine in Benutzeravatare umwandeln",
	"reversiSurrender": "Aufgeben",
	"share": "Teilen",
	"areYouSure": "Bist du sicher?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Share",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"reversiBlack": "Negras",
	"reversiWhite": "Blancas",
	"reversiTurnOf": "Le toca a {name}",
	"reversiPastTurnOf": "Turno de {name}",
	"reversiOpponentTurn": "Turno del oponente",
	"remainingN": "Faltan: {n}",
	"reversiMyTurn": "¡Tu turno!",
	"reversiWon": "{name} ha ganado",
	"reversiSurrendered": "Te has rendido",
	"reversiTimeout": "Se acabó el tiempo",
	"reversiDrawn": "Empate",
	"reversiTurnCount": "Turno {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "El que tenga menos fichas gana (LLoTheO)",
	"reversiLoopedMap": "Mapa en bucle",
	"reversiCanPutEverywhere": "Las fichas se pueden poner a cualquier lugar\n",
	"options": "Opciones",
	"reversiShowBoardLabels": "Mostrar el número de línea y la letra de columna en el tablero de juego.",
	"reversiUseAvatarAsStone": "Usar los avatares de los usuarios como fichas\n",
	"reversiSurrender": "Rendirse",
	"share": "Compartir",
	"areYouSure": "¿Estás conforme?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "C'est le tour de {name}",
	"reversiPastTurnOf": "Tour de {name}",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Restants : {n}",
	"reversiMyTurn": "C’est votre tour",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Par abandon",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Se rendre",
	"share": "Partager",
	"areYouSure": "Êtes-vous sûr·e ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"reversiBlack": "Hitam",
	"reversiWhite": "Putih",
	"reversiTurnOf": "Giliran {name}",
	"reversiPastTurnOf": "Giliran {name}",
	"reversiOpponentTurn": "Giliran lawan",
	"remainingN": "Sisa : {n}",
	"reversiMyTurn": "Giliran kamu",
	"reversiWon": "{name} menang",
	"reversiSurrendered": "Telah menyerah",
	"reversiTimeout": "Waktu habis",
	"reversiDrawn": "Seri",
	"reversiTurnCount": "Langkah ke {count}",
	"reversiTotal": "Jumlah",
	"reversiIsLlotheo": "Pemain dengan batu yang sedikit menang (Llotheo)",
	"reversiLoopedMap": "Peta melingkar",
	"reversiCanPutEverywhere": "Keping dapat ditaruh dimana saja",
	"options": "Opsi peran",
	"reversiShowBoardLabels": "Tampilkan penomoran baris dan kolom pada papan",
	"reversiUseAvatarAsStone": "Ubah batu menjadi avatar pengguna",
	"reversiSurrender": "Menyerah",
	"share": "Bagikan",
	"areYouSure": "Apakah kamu yakin?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"reversiBlack": "Neri",
	"reversiWhite": "Bianchi",
	"reversiTurnOf": "Tocca a {name}",
	"reversiPastTurnOf": "Turno di {name}",
	"reversiOpponentTurn": "Turno avversario",
	"remainingN": "Rimangono: {n}",
	"reversiMyTurn": "Tocca a te",
	"reversiWon": "Ha vinto {name}",
	"reversiSurrendered": "Ha ceduto",
	"reversiTimeout": "Tempo scaduto",
	"reversiDrawn": "Pareggio",
	"reversiTurnCount": "Turno N. {count}",
	"reversiTotal": "Totale",
	"reversiIsLlotheo": "Vince chi ha meno pietre (Roseo)",
	"reversiLoopedMap": "Mappa ricorsiva",
	"reversiCanPutEverywhere": "Modalità che può essere posizionata ovunque",
	"options": "Opzioni del ruolo",
	"reversiShowBoardLabels": "Mostra le coordinate del gioco",
	"reversiUseAvatarAsStone": "Immagini profilo come pedine",
	"reversiSurrender": "Mi arrendo",
	"share": "Condividi",
	"areYouSure": "Confermi?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"reversiBlack": "黒",
	"reversiWhite": "白",
	"reversiTurnOf": "{name}のターンです",
	"reversiPastTurnOf": "{name}のターン",
	"reversiOpponentTurn": "相手のターンです",
	"remainingN": "残り: {n}",
	"reversiMyTurn": "あなたのターンです",
	"reversiWon": "{name}の勝ち",
	"reversiSurrendered": "投了により",
	"reversiTimeout": "時間切れ",
	"reversiDrawn": "引き分け",
	"reversiTurnCount": "{count}ターン目",
	"reversiTotal": "合計",
	"reversiIsLlotheo": "石の少ない方が勝ち(ロセオ)",
	"reversiLoopedMap": "ループマップ",
	"reversiCanPutEverywhere": "どこでも置けるモード",
	"options": "オプション",
	"reversiShowBoardLabels": "盤面に行・列番号を表示",
	"reversiUseAvatarAsStone": "石をアイコンにする",
	"reversiSurrender": "投了",
	"share": "共有",
	"areYouSure": "よろしいですか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"reversiBlack": "黒",
	"reversiWhite": "白",
	"reversiTurnOf": "{name}のターンやで",
	"reversiPastTurnOf": "{name}のターン",
	"reversiOpponentTurn": "相手のターンやで",
	"remainingN": "残り:{n}",
	"reversiMyTurn": "あんさんのターンや",
	"reversiWon": "{name}の勝ち",
	"reversiSurrendered": "投了により",
	"reversiTimeout": "時間切れ",
	"reversiDrawn": "引き分け",
	"reversiTurnCount": "{count}ターン目",
	"reversiTotal": "合計",
	"reversiIsLlotheo": "石の少ない方が勝ち(ロセオ)",
	"reversiLoopedMap": "ループマップ",
	"reversiCanPutEverywhere": "どこでも置けるモード",
	"options": "オプション",
	"reversiShowBoardLabels": "盤面に行・列番号を表示",
	"reversiUseAvatarAsStone": "石をアイコンにする",
	"reversiSurrender": "投了",
	"share": "わけわけ",
	"areYouSure": "いいん？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Share",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Share",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"reversiBlack": "흑",
	"reversiWhite": "백",
	"reversiTurnOf": "{name}님의 차례입니다",
	"reversiPastTurnOf": "{name}님의 차례",
	"reversiOpponentTurn": "상대의 차례입니다",
	"remainingN": "나머지: {n}",
	"reversiMyTurn": "나의 차례입니다",
	"reversiWon": "{name}님의 승리",
	"reversiSurrendered": "상대의 기권",
	"reversiTimeout": "시간 초과",
	"reversiDrawn": "무승부",
	"reversiTurnCount": "{count}번째 수",
	"reversiTotal": "합계",
	"reversiIsLlotheo": "돌이 적은 쪽이 승리(로세오)",
	"reversiLoopedMap": "순환 지도",
	"reversiCanPutEverywhere": "어디든 둘 수 있는 모드",
	"options": "옵션",
	"reversiShowBoardLabels": "판에 행·열 번호 표시",
	"reversiUseAvatarAsStone": "돌을 아이콘으로 표시",
	"reversiSurrender": "기권",
	"share": "공유",
	"areYouSure": "계속 진행하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Totaal",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Delen",
	"areYouSure": "Weet je het zeker?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Alternativ",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Del",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Łącznie",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Udostępnij",
	"areYouSure": "Na pewno?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"reversiBlack": "Preto",
	"reversiWhite": "Branco",
	"reversiTurnOf": "É o turno de {name}",
	"reversiPastTurnOf": "Turno de {name}",
	"reversiOpponentTurn": "Turno do oponente",
	"remainingN": "Restante: {n}",
	"reversiMyTurn": "Seu turno",
	"reversiWon": "{name} venceu",
	"reversiSurrendered": "Desistiu",
	"reversiTimeout": "Fim do tempo",
	"reversiDrawn": "Empate",
	"reversiTurnCount": "Turno {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "Aquele com menos pedras vence (Llotheo)",
	"reversiLoopedMap": "Mapa em ‘loop’",
	"reversiCanPutEverywhere": "É possível pôr em qualquer lugar",
	"options": "Opções",
	"reversiShowBoardLabels": "Exibir numeração de linha e coluna no tabuleiro",
	"reversiUseAvatarAsStone": "Utilizar avatares de usuário como as pedras",
	"reversiSurrender": "Desistir",
	"share": "Compartilhar",
	"areYouSure": "Tem certeza?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Остаётся: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Всего",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Настройки ролей",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Поделиться",
	"areYouSure": "Вы уверены?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Celkom",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Zdieľať",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"reversiBlack": "ดำ",
	"reversiWhite": "ขาว",
	"reversiTurnOf": "ตาของ{name}",
	"reversiPastTurnOf": "ตาของ{name}",
	"reversiOpponentTurn": "ตาอีกฝ่าย",
	"remainingN": "เหลือ : {n}",
	"reversiMyTurn": "ตาของคุณ",
	"reversiWon": "{name}ชนะ",
	"reversiSurrendered": "ยอมแพ้แล้ว",
	"reversiTimeout": "หมดเวลาแล้ว",
	"reversiDrawn": "เสมอ",
	"reversiTurnCount": "ตาที่{count}",
	"reversiTotal": "รวมทั้งหมด",
	"reversiIsLlotheo": "คนที่มีตัวหมากน้อยกว่าชนะ (Roseo)",
	"reversiLoopedMap": "ลูปแมป",
	"reversiCanPutEverywhere": "โหมดที่สามารถวางได้ทุกที่",
	"options": "ตัวเลือก",
	"reversiShowBoardLabels": "แสดงหมายเลขแถว/คอลัมน์บนกระดาน",
	"reversiUseAvatarAsStone": "ใช้ไอคอนประจำตัวเป็นหมาก",
	"reversiSurrender": "ยอมแพ้",
	"share": "แบ่งปัน",
	"areYouSure": "แน่ใจแล้วใช่ไหมคะ?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"reversiBlack": "Siyah",
	"reversiWhite": "Beyaz",
	"reversiTurnOf": "Sıra {name}'de.",
	"reversiPastTurnOf": "{name}'nin sırası",
	"reversiOpponentTurn": "Rakibin sırası",
	"remainingN": "Kalan: {n}",
	"reversiMyTurn": "Sıra sende",
	"reversiWon": "{name} kazandı",
	"reversiSurrendered": "Teslim oldu",
	"reversiTimeout": "Zaman doldu",
	"reversiDrawn": "Çiz",
	"reversiTurnCount": "{count} döndür",
	"reversiTotal": "Toplam",
	"reversiIsLlotheo": "Taş sayısı daha az olan kazanır (Llotheo)",
	"reversiLoopedMap": "Döngüsel harita",
	"reversiCanPutEverywhere": "Fayanslar her yere yerleştirilebilir.",
	"options": "Seçenekler",
	"reversiShowBoardLabels": "Tahtada satır ve sütun numaralarını göster",
	"reversiUseAvatarAsStone": "Taşları kullanıcı avatarlarına dönüştürün",
	"reversiSurrender": "Teslimiyet",
	"share": "Paylaş",
	"areYouSure": "Emin misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Total",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Options",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Share",
	"areYouSure": "Are you sure?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Залишилося: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Всього",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Опції",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Поділитись",
	"areYouSure": "Ви впевнені?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"reversiBlack": "Black",
	"reversiWhite": "White",
	"reversiTurnOf": "It's {name}'s turn",
	"reversiPastTurnOf": "{name}'s turn",
	"reversiOpponentTurn": "Opponent's turn",
	"remainingN": "Remaining: {n}",
	"reversiMyTurn": "Your turn",
	"reversiWon": "{name} wins",
	"reversiSurrendered": "Surrendered",
	"reversiTimeout": "Out of time",
	"reversiDrawn": "Draw",
	"reversiTurnCount": "Turn {count}",
	"reversiTotal": "Tổng cộng",
	"reversiIsLlotheo": "The one with fewer stones wins (Llotheo)",
	"reversiLoopedMap": "Looping map",
	"reversiCanPutEverywhere": "Tiles are placeable everywhere",
	"options": "Tùy chọn",
	"reversiShowBoardLabels": "Display row and column numbering on the board",
	"reversiUseAvatarAsStone": "Turn stones into user avatars",
	"reversiSurrender": "Surrender",
	"share": "Chia sẻ",
	"areYouSure": "Bạn chắc chứ?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"reversiBlack": "黑",
	"reversiWhite": "白",
	"reversiTurnOf": "{name}的回合",
	"reversiPastTurnOf": "{name}的回合",
	"reversiOpponentTurn": "对手的回合",
	"remainingN": "剩余：{n}",
	"reversiMyTurn": "你的回合",
	"reversiWon": "{name} 获胜",
	"reversiSurrendered": "已认输",
	"reversiTimeout": "超时",
	"reversiDrawn": "平局",
	"reversiTurnCount": "第{count}回合",
	"reversiTotal": "总计",
	"reversiIsLlotheo": "落子少的一方获胜（黑白棋规则）",
	"reversiLoopedMap": "循环棋盘",
	"reversiCanPutEverywhere": "无限制放置模式",
	"options": "选项",
	"reversiShowBoardLabels": "显示行号和列号",
	"reversiUseAvatarAsStone": "用头像作为棋子",
	"reversiSurrender": "认输",
	"share": "分享",
	"areYouSure": "你确定吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"reversiBlack": "黑",
	"reversiWhite": "白",
	"reversiTurnOf": "{name} 的回合",
	"reversiPastTurnOf": "{name} 的回合",
	"reversiOpponentTurn": "對手的回合",
	"remainingN": "剩餘：{n}",
	"reversiMyTurn": "您的回合",
	"reversiWon": "{name} 獲勝",
	"reversiSurrendered": "對手認輸",
	"reversiTimeout": "時間到",
	"reversiDrawn": "平手",
	"reversiTurnCount": "{count} 回合",
	"reversiTotal": "合計",
	"reversiIsLlotheo": "子較少的一方為勝（顛倒規則）",
	"reversiLoopedMap": "循環棋盤",
	"reversiCanPutEverywhere": "隨意置放模式",
	"options": "選項",
	"reversiShowBoardLabels": "在棋盤上顯示行、列號",
	"reversiUseAvatarAsStone": "用大頭貼當作棋子",
	"reversiSurrender": "認輸",
	"share": "分享",
	"areYouSure": "是否確定？"
}
</locale>
