<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="$style.transition_zoom_enterActive"
	:leaveActiveClass="$style.transition_zoom_leaveActive"
	:enterFromClass="$style.transition_zoom_enterFrom"
	:leaveToClass="$style.transition_zoom_leaveTo"
	:moveClass="$style.transition_zoom_move"
	mode="out-in"
>
	<div v-if="!gameStarted" class="_spacer" style="--MI_SPACER-w: 800px;">
		<div :class="$style.root">
			<div class="_gaps">
				<div class="_woodenFrame" style="text-align: center;">
					<div class="_woodenFrameInner">
						<img src="/client-assets/drop-and-fusion/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
					</div>
				</div>
				<div class="_woodenFrame" style="text-align: center;">
					<div class="_woodenFrameInner">
						<div class="_gaps" style="padding: 16px;">
							<MkSelect v-model="gameMode" :items="gameModeDef">
							</MkSelect>
							<MkButton primary gradate large rounded inline @click="start">{{ $locale.sfc.start }}</MkButton>
						</div>
					</div>
					<div class="_woodenFrameInner">
						<div class="_gaps" style="padding: 16px;">
							<div style="font-size: 90%;"><i class="ti ti-music"></i> {{ $locale.sfc.soundWillBePlayed }}</div>
							<MkSwitch v-model="mute">
								<template #label>{{ $locale.sfc.mute }}</template>
							</MkSwitch>
						</div>
					</div>
				</div>
				<div class="_woodenFrame">
					<div class="_woodenFrameInner">
						<div class="_gaps_s" style="padding: 16px;">
							<div><b>{{ interpolateLocaleParameters($locale.sfc.lastNDays, { n: 7 }) }} {{ $locale.sfc.ranking }}</b> ({{ gameMode.toUpperCase() }})</div>
							<div v-if="ranking" class="_gaps_s">
								<div v-for="r in ranking" :key="r.id" :class="$style.rankingRecord">
									<MkAvatar v-if="r.user" :link="true" style="width: 24px; height: 24px; margin-right: 4px;" :user="r.user"/>
									<MkUserName v-if="r.user" :user="r.user" :nowrap="true"/>
									<b style="margin-left: auto;">{{ r.score.toLocaleString() }} {{ getScoreUnit(gameMode) }}</b>
								</div>
							</div>
							<div v-else>{{ $locale.sfc.loading }}</div>
						</div>
					</div>
				</div>
				<div class="_woodenFrame">
					<div class="_woodenFrameInner" style="padding: 16px;">
						<div style="font-weight: bold;">{{ $locale.sfc.howToPlay }}</div>
						<ol>
							<li>{{ $locale.sfc.section1 }}</li>
							<li>{{ $locale.sfc.section2 }}</li>
							<li>{{ $locale.sfc.section3 }}</li>
						</ol>
					</div>
				</div>
				<div class="_woodenFrame">
					<div class="_woodenFrameInner">
						<div class="_gaps_s" style="padding: 16px;">
							<div><b>Credit</b></div>
							<div>
								<div>Ai-chan illustration: @poteriri@misskey.io</div>
								<div>BGM: @ys@misskey.design</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<XGame v-else :gameMode="gameMode" :mute="mute" @end="onGameEnd"/>
</Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XGame from '@features/games/frontend/pages/drop-and-fusion.game.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';

const {
	model: gameMode,
	def: gameModeDef,
} = useMkSelect({
	items: [
		{ label: 'NORMAL', value: 'normal' },
		{ label: 'SQUARE', value: 'square' },
		{ label: 'YEN', value: 'yen' },
		{ label: 'SWEETS', value: 'sweets' },
		//{ label: 'SPACE', value: 'space' },
	],
	initialValue: 'normal',
});
const gameStarted = ref(false);
const mute = ref(false);
const ranking = ref<Misskey.entities.BubbleGameRankingResponse | null>(null);

watch(gameMode, async () => {
	ranking.value = await misskeyApiGet('bubble-game/ranking', { gameMode: gameMode.value });
}, { immediate: true });

function getScoreUnit(gameMode: string) {
	return gameMode === 'normal' ? 'pt' :
		gameMode === 'square' ? 'pt' :
		gameMode === 'yen' ? '円' :
		gameMode === 'sweets' ? 'kcal' :
		gameMode === 'space' ? 'pt' :
		'' as never;
}

async function start() {
	gameStarted.value = true;
}

function onGameEnd() {
	gameStarted.value = false;
}

definePage(() => ({
	title: $locale.value.sfc.bubbleGame,
	icon: 'ti ti-device-gamepad',
}));
</script>

<style lang="scss" module>
.transition_zoom_move,
.transition_zoom_enterActive,
.transition_zoom_leaveActive {
	transition: opacity 0.5s cubic-bezier(0,.5,.5,1), transform 0.5s cubic-bezier(0,.5,.5,1) !important;
}
.transition_zoom_enterFrom,
.transition_zoom_leaveTo {
	opacity: 0;
	transform: scale(0.8);
}

.root {
	margin: 0 auto;
	max-width: 600px;
	user-select: none;

	* {
		user-select: none;
	}
}

.rankingRecord {
	display: flex;
	line-height: 24px;
	padding-top: 4px;
	white-space: nowrap;
	overflow: visible;
	text-overflow: ellipsis;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"bubbleGame": "Bubble Game",
	"start": "البداية",
	"soundWillBePlayed": "Sound will be played",
	"mute": "اكتم",
	"lastNDays": "آخر {n} أيام",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"bubbleGame": "Bubble Game",
	"start": "Comença",
	"soundWillBePlayed": "Es reproduiran efectes de so",
	"mute": "Silencia",
	"lastNDays": "Últims {n} dies",
	"ranking": "Classificació",
	"loading": "S’està carregant",
	"howToPlay": "Com es juga",
	"section1": "Ajusta la posició i deixa caure l'objecte dintre la caixa.",
	"section2": "Quan dos objectes del mateix tipus es toquen, canviaran en un objecte diferent i guanyares punts.",
	"section3": "El joc s'acabarà quan els objectes sobresurtin de la caixa. Intenta aconseguir la puntuació més gran possible fusionant objectes mentre impedeixes que sobresurtin de la caixa!"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"bubbleGame": "Bubble Game",
	"start": "Začít",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Ztlumit",
	"lastNDays": "Posledních {n} dnů",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Mute",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"bubbleGame": "Bubble Game",
	"start": "Anfangen",
	"soundWillBePlayed": "Es wird Ton wiedergegeben",
	"mute": "Stummschalten",
	"lastNDays": "Letzte {n} Tage",
	"ranking": "Rangliste",
	"loading": "Laden",
	"howToPlay": "Wie man spielt",
	"section1": "Passe die Position an und lasse das Objekt in das Spielfeld fallen.",
	"section2": "Wenn sich zwei Objekte der gleichen Art berühren, verwandeln sie sich in ein anderes Objekt und du bekommst Punkte.",
	"section3": "Das Spiel ist vorbei, wenn die Objekte aus dem Spielfeld herausragen. Versuche eine hohe Punktzahl zu erreichen, indem du die Objekte miteinander verschmelzt, ohne dass das Spielfeld überläuft!"
}
</locale>

<locale lang="json" locale="en-US">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Mute",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"bubbleGame": "Bubble Game",
	"start": "Comenzar",
	"soundWillBePlayed": "Con música y efectos sonoros",
	"mute": "Silenciar",
	"lastNDays": "Últimos {n} días",
	"ranking": "Clasificación",
	"loading": "Cargando",
	"howToPlay": "Cómo jugar",
	"section1": "Ajuste la posición y deje caer el objeto en la caja",
	"section2": "Cuando dos objetos del mismo tipo se tocan, cambian a otro tipo y consigues puntos",
	"section3": "El juego termina cuando la caja se desborda de objetos. ¡Intenta conseguir una puntuación alta al juntar objetos mientras evitas desbordar la caja!"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"bubbleGame": "Jeu de bulles",
	"start": "Commencer",
	"soundWillBePlayed": "Le son sera joué",
	"mute": "Masquer",
	"lastNDays": "Derniers {n} jours",
	"ranking": "Classement",
	"loading": "Chargement en cours",
	"howToPlay": "Comment jouer",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"bubbleGame": "Bubble Game",
	"start": "Mulai",
	"soundWillBePlayed": "Suara yang akan dimainkan",
	"mute": "Bisukan",
	"lastNDays": "{n} hari terakhir",
	"ranking": "Peringkat",
	"loading": "Memuat...",
	"howToPlay": "Cara bermain",
	"section1": "Atur posisi dan jatuhkan obyek ke dalam kotak.",
	"section2": "Ketika dua obyek menyentuh tipe yang sama satu sama lain, obyek tersebut akan berganti dan kamu mendapatkan poin skor.",
	"section3": "Permainan berakhir jika obyek memenuhi kotak. Capai skor tertinggi dengan menggabungkan obyek bersama sambil menghindari obyek tersebut memenuhi kotak permainan!"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"bubbleGame": "Bubble Game",
	"start": "Inizia!",
	"soundWillBePlayed": "Con musica ed effetti sonori",
	"mute": "Silenziare",
	"lastNDays": "Ultimi {n} giorni",
	"ranking": "Classifica",
	"loading": "Caricamento",
	"howToPlay": "Come giocare",
	"section1": "Scegli la posizione e rilascia l'oggetto nel contenitore.",
	"section2": "Se due oggetti dello stesso tipo si toccano, si trasformano in un oggetto diverso, aumentando il punteggio.",
	"section3": "Se gli oggetti escono dal limite superiore del contenitore, il gioco finisce. Cerca di ottenere un punteggio elevato fondendo gli oggetti, evitando che escano dal contenitore!"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"bubbleGame": "バブルゲーム",
	"start": "始める",
	"soundWillBePlayed": "サウンドが再生されます",
	"mute": "ミュート",
	"lastNDays": "直近{n}日",
	"ranking": "ランキング",
	"loading": "読み込み中",
	"howToPlay": "遊び方",
	"section1": "位置を調整してハコにモノを落とします。",
	"section2": "同じ種類のモノがくっつくと別のモノに変化して、スコアが得られます。",
	"section3": "モノがハコからあふれるとゲームオーバーです。ハコからあふれないようにしつつモノを融合させてハイスコアを目指そう！"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"bubbleGame": "バブルゲーム",
	"start": "始める",
	"soundWillBePlayed": "サウンドが再生されるで",
	"mute": "ミュート",
	"lastNDays": "直近{n}日",
	"ranking": "ランキング",
	"loading": "読み込み中",
	"howToPlay": "遊び方",
	"section1": "位置を調整してハコにモノを落とすで。",
	"section2": "同じもんがくっついたら別のやつになって、スコアがもらえるで。",
	"section3": "モノがハコからあふれたらゲームオーバーや。ハコからあふれんようにしながらモノを融合させてハイスコアを目指しいや！"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Mute",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Mute",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"bubbleGame": "버블 게임",
	"start": "시작하기",
	"soundWillBePlayed": "소리가 재생됩니다",
	"mute": "뮤트",
	"lastNDays": "최근 {n}일",
	"ranking": "랭킹",
	"loading": "불러오는 중",
	"howToPlay": "설명",
	"section1": "위치를 조정하여 상자에 물건을 떨어뜨립니다.",
	"section2": "같은 종류의 물건이 붙으면 다른 물건으로 바뀌면서 점수를 얻게 됩니다.",
	"section3": "상자에서 물건이 넘치면 게임 오버입니다. 상자에서 물건이 넘치지 않도록 하면서 물건을 융합하여 높은 점수를 획득하세요!"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"bubbleGame": "Bubble Game",
	"start": "Aan de slag",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Dempen",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Skjul",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"bubbleGame": "Bubble Game",
	"start": "Rozpocznij",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Wycisz",
	"lastNDays": "W ciągu ostatnich {n} dni",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"bubbleGame": "Bubble Game",
	"start": "começar",
	"soundWillBePlayed": "Sons serão reproduzidos",
	"mute": "Silenciar",
	"lastNDays": "Últimos {n} dias",
	"ranking": "Ranking",
	"loading": "Carregando",
	"howToPlay": "Como jogar",
	"section1": "Ajuste a posição e solte o objeto na caixa.",
	"section2": "Quando dois objetos do mesmo tipo tocam-se, eles tornam-se outro objeto e você ganha pontos.",
	"section3": "O jogo acaba quando objetos transbordam da caixa. Busque uma pontuação alta ao fundir objetos enquanto evita transbordar a caixa."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"bubbleGame": "BubbleGame",
	"start": "Начать",
	"soundWillBePlayed": "Будет воспроизведен звук",
	"mute": "Скрыть",
	"lastNDays": "Последние {n} сут",
	"ranking": "Рейтинги",
	"loading": "Загрузка",
	"howToPlay": "How to play",
	"section1": "Выберите позицию и отпустите объект.",
	"section2": "Когда два объекта одинакового типа соприкасаются, они превращаются в другой объект и вы получаете очки.",
	"section3": "Игра заканчивается, когда коробка переполняется. Старайтесь набрать больший счёт объединяя объекты, не давай коробке переполниться!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"bubbleGame": "Bubble Game",
	"start": "Začať",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Vypnúť zvuk",
	"lastNDays": "Posledných {n} dní",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"bubbleGame": "เกมบับเบิ้ล",
	"start": "เริ่ม",
	"soundWillBePlayed": "จะมีการเล่นเอฟเฟกต์เสียง",
	"mute": "ปิดเสียง",
	"lastNDays": "ล่าสุด {n} วันที่แล้ว",
	"ranking": "อันดับ",
	"loading": "กำลังโหลด",
	"howToPlay": "วิธีเล่น",
	"section1": "ขยับตำแหน่งและวางวัตถุลงในกล่อง",
	"section2": "เมื่อวัตถุประเภทเดียวกันมารวมกัน พวกมันจะกลายเป็นวัตถุใหม่และคุณจะได้รับคะแนน",
	"section3": "หากวัตถุล้นออกมาจากกล่อง เกมก็จะจบลง ตั้งเป้าทำคะแนนให้สูงด้วยการหลอมวัตถุต่าง ๆ โดยไม่ทำให้ล้นกล่อง!"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"bubbleGame": "Kabarcık Oyunu",
	"start": "Başla",
	"soundWillBePlayed": "Ses çalınacaktır",
	"mute": "Gizle",
	"lastNDays": "Son {n} gün",
	"ranking": "Sıralama",
	"loading": "Yükleniyor",
	"howToPlay": "Nasıl oynanır",
	"section1": "Konumu ayarlayın ve nesneyi kutuya bırakın.",
	"section2": "Aynı türden iki nesne birbirine dokunduğunda, farklı bir nesneye dönüşür ve puan kazanırsınız.",
	"section3": "Kutu dolduğunda oyun biter. Kutuyu doldurmadan nesneleri birleştirerek yüksek puan almaya çalış!"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"bubbleGame": "Bubble Game",
	"start": "Begin",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Mute",
	"lastNDays": "Last {n} days",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"bubbleGame": "Bubble Game",
	"start": "Розпочати",
	"soundWillBePlayed": "Буде відтворено звук",
	"mute": "Ігнорувати",
	"lastNDays": "Останні {n} днів",
	"ranking": "Рейтинг",
	"loading": "Завантаження",
	"howToPlay": "Як грати",
	"section1": "Відкоректуйте позицію та скиньте об'єкт у коробку.",
	"section2": "Коли два однакових об'єкти доторкаються один одного, вони створять один більший об'єкт, й ви отримаєте бали до рахунку.",
	"section3": "Гра закінчується коли об'єкти переповнюють коробку. Розраховуйте на більший рахунок, поки з'єднуєте об'єкти заради уникнення переповнення коробки!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"bubbleGame": "Bubble Game",
	"start": "Bắt đầu",
	"soundWillBePlayed": "Sound will be played",
	"mute": "Ẩn",
	"lastNDays": "{n} ngày trước",
	"ranking": "Ranking",
	"loading": "Loading",
	"howToPlay": "How to play",
	"section1": "Adjust the position and drop the object into the box.",
	"section2": "When two objects of the same type touch each other, they will change into a different object and you score points.",
	"section3": "The game is over when objects overflow from the box. Aim for a high score by fusing objects together while you avoid overflowing the box!"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"bubbleGame": "泡泡游戏",
	"start": "开始",
	"soundWillBePlayed": "声音将会播放",
	"mute": "屏蔽",
	"lastNDays": "最近{n}天",
	"ranking": "排行榜",
	"loading": "读取中",
	"howToPlay": "游戏说明",
	"section1": "对准位置将Emoji投入盒子。",
	"section2": "相同的Emoji相互接触合成后会得到新的Emoji，以此获得分数。",
	"section3": "如果Emoji从箱子中溢出游戏将会结束。在防止Emoji溢出的同时，不断合成新的Emoji，来获取更高的分数吧！"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"bubbleGame": "氣泡遊戲",
	"start": "開始",
	"soundWillBePlayed": "將播放音效",
	"mute": "靜音",
	"lastNDays": "過去 {n} 天",
	"ranking": "排行榜",
	"loading": "載入中",
	"howToPlay": "玩法說明",
	"section1": "調整位置並將物體放入盒子中。",
	"section2": "當相同類型的物體黏在一起時，它們會變成不同的物體，您就會得到分數。",
	"section3": "如果物體從盒子裡溢出，遊戲就結束了。透過融合物體而不溢出盒子來獲得高分！"
}
</locale>
