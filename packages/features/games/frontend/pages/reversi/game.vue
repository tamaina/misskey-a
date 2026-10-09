<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="game == null || (!game.isEnded && connection == null)"><MkLoading/></div>
<GameSetting v-else-if="!game.isStarted" v-model:shareWhenStart="shareWhenStart" :game="game" :connection="connection!"/>
<GameBoard v-else :game="game" :connection="connection"/>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted, shallowRef, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import GameSetting from '@features/games/frontend/pages/reversi/game.setting.vue';
import GameBoard from '@features/games/frontend/pages/reversi/game.board.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useStream } from '@features/api/frontend/stream.js';
import { $i } from '@features/auth/frontend/i.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import * as os from '@features/ui/frontend/os.js';
import { url } from '@features/boot/frontend/shared/config.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';

const router = useRouter();

const props = defineProps<{
	gameId: string;
}>();

const game = shallowRef<Misskey.entities.ReversiGameDetailed | null>(null);
const connection = shallowRef<Misskey.IChannelConnection<Misskey.Channels['reversiGame']> | null>(null);
const shareWhenStart = ref(false);

watch(() => props.gameId, () => {
	fetchGame();
});

function start(_game: Misskey.entities.ReversiGameDetailed) {
	if (game.value?.isStarted) return;

	if (shareWhenStart.value) {
		misskeyApi('notes/create', {
			text: `${$locale.value.sfc.iStartedAGame}\n${url}/reversi/g/${props.gameId}`,
			visibility: 'home',
		});
	}

	game.value = _game;
}

async function fetchGame() {
	const _game = await misskeyApi('reversi/show-game', {
		gameId: props.gameId,
	});

	game.value = _game;
	shareWhenStart.value = false;

	if (connection.value) {
		connection.value.dispose();
	}
	if (!game.value.isEnded) {
		connection.value = useStream().useChannel('reversiGame', {
			gameId: game.value.id,
		});
		connection.value.on('started', x => {
			start(x.game);
		});
		connection.value.on('canceled', x => {
			connection.value?.dispose();

			if (x.userId !== $i?.id) {
				os.alert({
					type: 'warning',
					text: $locale.value.sfc.gameCanceled,
				});
				router.push('/reversi');
			}
		});
	}
}

// 通信を取りこぼした場合の救済
useInterval(async () => {
	if (game.value == null) return;
	if (game.value.isStarted) return;

	const _game = await misskeyApi('reversi/show-game', {
		gameId: props.gameId,
	});

	if (_game.isStarted) {
		start(_game);
	} else {
		game.value = _game;
	}
}, 1000 * 10, {
	immediate: false,
	afterMounted: true,
});

onMounted(() => {
	fetchGame();
});

onUnmounted(() => {
	if (connection.value) {
		connection.value.dispose();
	}
});

definePage(() => ({
	title: 'Reversi',
	icon: 'ti ti-device-gamepad',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "أُلغيت اللعبة."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"iStartedAGame": "La partida ha començat! #MisskeyReversi",
	"gameCanceled": "La partida s'ha cancel·lat "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"iStartedAGame": "Das Spiel hat begonnen! #MisskeyReversi",
	"gameCanceled": "Das Spiel wurde abgesagt."
}
</locale>

<locale locale="en-US" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"iStartedAGame": "¡La partida ha comenzado!",
	"gameCanceled": "La partida ha sido cancelada."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"iStartedAGame": "Permainan telah dimulai! #MisskeyReversi",
	"gameCanceled": "Permainan ini telah dibatalkan."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"iStartedAGame": "Inizia la sfida! #MisskeyReversi",
	"gameCanceled": "Sfida cancellata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"iStartedAGame": "対局を開始しました！ #MisskeyReversi",
	"gameCanceled": "対局がキャンセルされました"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"iStartedAGame": "対局し始めたで！ #MisskeyReversi",
	"gameCanceled": "対局がキャンセルされたわ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"iStartedAGame": "대국을 시작하였습니다! #MisskeyReversi",
	"gameCanceled": "대국이 취소되었습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"iStartedAGame": "O jogo começou! #MisskeyReversi",
	"gameCanceled": "A partida foi cancelada."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"iStartedAGame": "เริ่มเล่นหมากรีเวอร์ซีแล้ว! #MisskeyReversi",
	"gameCanceled": "ยกเลิกการเล่นแล้ว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"iStartedAGame": "Oyun başladı! #MisskeyReversi",
	"gameCanceled": "Oyun iptal edildi."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"iStartedAGame": "The game has begun! #MisskeyReversi",
	"gameCanceled": "The game has been cancelled."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"iStartedAGame": "对局开始！#MisskeyReversi",
	"gameCanceled": "对局被取消了"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"iStartedAGame": "對弈開始了！ #MisskeyReversi",
	"gameCanceled": "對弈已被取消"
}
</locale>
