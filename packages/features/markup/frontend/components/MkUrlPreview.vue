<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<template v-if="player.url && playerEnabled">
	<div
		:class="$style.player"
		:style="player.width ? `padding: ${(player.height || 0) / player.width * 100}% 0 0` : `padding: ${(player.height || 0)}px 0 0`"
	>
		<iframe
			v-if="player.url.startsWith('http://') || player.url.startsWith('https://')"
			sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-storage-access-by-user-activation allow-same-origin"
			scrolling="no"
			:allow="player.allow == null ? 'autoplay;encrypted-media;fullscreen' : player.allow.filter(x => ['autoplay', 'clipboard-write', 'fullscreen', 'encrypted-media', 'picture-in-picture', 'web-share'].includes(x)).join(';')"
			:class="$style.playerIframe"
			:src="transformPlayerUrl(player.url)"
			:style="{ border: 0 }"
		></iframe>
		<span v-else>invalid url</span>
	</div>
	<div :class="$style.action">
		<MkButton :small="true" inline @click="playerEnabled = false">
			<i class="ti ti-x"></i> {{ $locale.sfc.disablePlayer }}
		</MkButton>
	</div>
</template>
<template v-else-if="tweetId && tweetExpanded">
	<div ref="twitter">
		<iframe
			ref="tweet"
			allow="fullscreen;web-share"
			sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
			scrolling="no"
			:style="{ position: 'relative', width: '100%', height: `${tweetHeight}px`, border: 0 }"
			:src="`https://platform.twitter.com/embed/index.html?embedId=${embedId}&amp;hideCard=false&amp;hideThread=false&amp;lang=en&amp;theme=${store.s.darkMode ? 'dark' : 'light'}&amp;id=${tweetId}`"
		></iframe>
	</div>
	<div :class="$style.action">
		<MkButton :small="true" inline @click="tweetExpanded = false">
			<i class="ti ti-x"></i> {{ $locale.sfc.close }}
		</MkButton>
	</div>
</template>
<div v-else>
	<component :is="self ? 'MkA' : 'a'" :class="[$style.link, { [$style.compact]: compact }]" :[attr]="maybeRelativeUrl" rel="nofollow noopener" :target="target" :title="url">
		<div v-if="thumbnail && !sensitive" :class="$style.thumbnail" :style="prefer.s.dataSaver.urlPreviewThumbnail ? '' : { backgroundImage: `url('${thumbnail}')` }">
		</div>
		<article :class="$style.body">
			<header :class="$style.header">
				<h1 v-if="unknownUrl" :class="$style.title">{{ url }}</h1>
				<h1 v-else-if="fetching" :class="$style.title"><MkEllipsis/></h1>
				<h1 v-else :class="$style.title" :title="title ?? undefined">{{ title }}</h1>
			</header>
			<p v-if="unknownUrl" :class="$style.text">{{ $locale.sfc.failedToPreviewUrl }}</p>
			<p v-else-if="fetching" :class="$style.text"><MkEllipsis/></p>
			<p v-else-if="description" :class="$style.text" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
			<footer :class="$style.footer">
				<img v-if="icon" :class="$style.siteIcon" :src="icon"/>
				<p v-if="unknownUrl" :class="$style.siteName">{{ requestUrl.host }}</p>
				<p v-else-if="fetching" :class="$style.siteName"><MkEllipsis/></p>
				<p v-else :class="$style.siteName" :title="sitename ?? requestUrl.host">{{ sitename ?? requestUrl.host }}</p>
			</footer>
		</article>
	</component>
	<template v-if="showActions">
		<div v-if="tweetId" :class="$style.action">
			<MkButton :small="true" inline @click="tweetExpanded = true">
				<i class="ti ti-brand-x"></i> {{ $locale.sfc.expandTweet }}
			</MkButton>
		</div>
		<div v-if="!playerEnabled && player.url" :class="$style.action">
			<MkButton :small="true" inline @click="playerEnabled = true">
				<i class="ti ti-player-play"></i> {{ $locale.sfc.enablePlayer }}
			</MkButton>
			<MkButton v-if="!isMobile" :small="true" inline @click="openPlayer()">
				<i class="ti ti-picture-in-picture"></i> {{ $locale.sfc.openInWindow }}
			</MkButton>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onDeactivated, onUnmounted, ref } from 'vue';
import { url as local } from '@features/boot/frontend/shared/config.js';
import { versatileLang } from '@features/ui/frontend/shared/intl-const.js';
import type { SummalyResult } from '@misskey-dev/summaly';
import * as os from '@features/ui/frontend/os.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { transformPlayerUrl } from '@features/markup/frontend/utility/url-preview.js';
import { store } from '@features/preferences/frontend/store.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { maybeMakeRelative } from '@features/web/frontend/shared/url.js';

const props = withDefaults(defineProps<{
	url: string;
	detail?: boolean;
	compact?: boolean;
	showActions?: boolean;
}>(), {
	detail: false,
	compact: false,
	showActions: true,
});

const MOBILE_THRESHOLD = 500;
const isMobile = ref(deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD);

const maybeRelativeUrl = maybeMakeRelative(props.url, local);
const self = maybeRelativeUrl !== props.url;
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';
const fetching = ref(true);
const summalyResult = ref<SummalyResult | null>(null);
const title = computed(() => summalyResult.value?.title ?? null);
const description = computed(() => summalyResult.value?.description ?? null);
const thumbnail = computed(() => summalyResult.value?.thumbnail ?? null);
const icon = computed(() => summalyResult.value?.icon ?? null);
const sitename = computed(() => summalyResult.value?.sitename ?? null);
const sensitive = computed(() => summalyResult.value?.sensitive ?? false);
const player = computed(() => summalyResult.value?.player ?? { url: null, width: null, height: null });
const playerEnabled = ref(false);
const tweetId = ref<string | null>(null);
const tweetExpanded = ref(props.detail);
const embedId = `embed${Math.random().toString().replace(/\D/, '')}`;
const tweetHeight = ref(150);
const unknownUrl = ref(false);

onDeactivated(() => {
	playerEnabled.value = false;
});

const requestUrl = new URL(props.url, window.location.href);
if (!['http:', 'https:'].includes(requestUrl.protocol)) throw new Error('invalid url');

if (requestUrl.hostname === 'twitter.com' || requestUrl.hostname === 'mobile.twitter.com' || requestUrl.hostname === 'x.com' || requestUrl.hostname === 'mobile.x.com') {
	const m = requestUrl.pathname.match(/^\/.+\/status(?:es)?\/(\d+)/);
	if (m) tweetId.value = m[1];
}

if (requestUrl.hostname === 'music.youtube.com' && requestUrl.pathname.match('^/(?:watch|channel)')) {
	requestUrl.hostname = 'www.youtube.com';
}

requestUrl.hash = '';

window.fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${versatileLang}`)
	.then(res => {
		if (!res.ok) {
			if (_DEV_) {
				console.warn(`[HTTP${res.status}] Failed to fetch url preview`);
			}
			return null;
		}

		return res.json();
	})
	.then((info: SummalyResult | null) => {
		if (!info || info.url == null) {
			fetching.value = false;
			unknownUrl.value = true;
			return;
		}

		fetching.value = false;
		unknownUrl.value = false;

		summalyResult.value = info;
	});

function adjustTweetHeight(message: MessageEvent) {
	if (message.origin !== 'https://platform.twitter.com') return;
	const embed = message.data?.['twttr.embed'];
	if (embed?.method !== 'twttr.private.resize') return;
	if (embed?.id !== embedId) return;
	const height = embed?.params[0]?.height;
	if (height) tweetHeight.value = height;
}

function openPlayer(): void {
	if (!summalyResult.value) return;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@features/drive/frontend/components/MkYouTubePlayer.vue')), {
		urlOrSummalyResult: summalyResult.value,
	}, {
		closed: () => {
			dispose();
		},
	});
}

window.addEventListener('message', adjustTweetHeight);

onUnmounted(() => {
	window.removeEventListener('message', adjustTweetHeight);
});
</script>

<style lang="scss" module>
.player {
	position: relative;
	width: 100%;
}

.disablePlayer {
	position: absolute;
	top: -1.5em;
	right: 0;
	font-size: 1em;
	width: 1.5em;
	height: 1.5em;
	padding: 0;
	margin: 0;
	color: var(--MI_THEME-fg);
	background: rgba(128, 128, 128, 0.2);
	opacity: 0.7;

	&:hover {
		opacity: 0.9;
	}
}

.playerIframe {
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
}

.link {
	position: relative;
	display: block;
	font-size: 14px;
	box-shadow: 0 0 0 1px var(--MI_THEME-divider);
	border-radius: 8px;
	overflow: clip;
	text-align: left;

	&:hover {
		text-decoration: none;
		border-color: rgba(0, 0, 0, 0.2);

		> .body > .header > .title {
			text-decoration: underline;
		}
	}

	&.compact {
		> .body {
			> .header .title, .text, .footer {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}
}

.thumbnail {
	position: absolute;
	width: 100px;
	height: 100%;
	background-position: center;
	background-size: cover;
	background-color: var(--MI_THEME-bg);
	display: flex;
	justify-content: center;
	align-items: center;

	& + .body {
		left: 100px;
		width: calc(100% - 100px);
	}
}

.body {
	position: relative;
	box-sizing: border-box;
	padding: 16px;
}

.header {
	margin-bottom: 8px;
}

.title {
	margin: 0;
	font-size: 1em;
}

.text {
	margin: 0;
	font-size: 0.8em;
}

.footer {
	margin-top: 8px;
	height: 16px;
}

.siteIcon {
	display: inline-block;
	width: 16px;
	height: 16px;
	margin-right: 4px;
	vertical-align: top;
}

.siteName {
	display: inline-block;
	margin: 0;
	font-size: 0.8em;
	line-height: 16px;
	vertical-align: top;
}

.action {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
	margin-top: 6px;
}

@container (max-width: 400px) {
	.link {
		font-size: 12px;
	}

	.thumbnail {
		height: 80px;
	}

	.body {
		padding: 12px;
	}
}

@container (max-width: 350px) {
	.link {
		font-size: 10px;

		&.compact {
			> .thumbnail {
				position: absolute;
				width: 56px;
				height: 100%;
			}

			> .body {
				left: 56px;
				width: calc(100% - 56px);
				padding: 4px;

				> .header {
					margin-bottom: 2px;
				}

				> .footer {
					margin-top: 2px;
				}
			}
		}
	}

	.thumbnail {
		height: 70px;
	}

	.body {
		padding: 8px;
	}

	.header {
		margin-bottom: 4px;
	}

	.footer {
		margin-top: 4px;
	}

	.siteIcon {
		width: 12px;
		height: 12px;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "disablePlayer": "أغلق مشغل الفيديو",
  "close": "اغلق",
  "failedToPreviewUrl": "تتعذر المعاينة",
  "expandTweet": "وسّع التغريدة",
  "enablePlayer": "افتح مشغل الفيديو",
  "openInWindow": "افتح في نافذة جديدة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "disablePlayer": "Tanca el reproductor de vídeo",
  "close": "Tanca",
  "failedToPreviewUrl": "Vista prèvia no disponible",
  "expandTweet": "Expandir post",
  "enablePlayer": "Obre el reproductor de vídeo",
  "openInWindow": "Obrir en una finestra nova"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "disablePlayer": "Zavřít video přehrávač",
  "close": "Zavřít",
  "failedToPreviewUrl": "Náhled se nezdařil",
  "expandTweet": "Rozbalit tweet",
  "enablePlayer": "Otevřít video přehrávač",
  "openInWindow": "Otevřít v novém okně"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Close",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Open in window"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "disablePlayer": "Video-Player schließen",
  "close": "Schließen",
  "failedToPreviewUrl": "Vorschau nicht anzeigbar",
  "expandTweet": "Tweet ausklappen",
  "enablePlayer": "Video-Player öffnen",
  "openInWindow": "In einem Fenster öffnen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Close",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Open in window"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "disablePlayer": "Cerrar reproductor",
  "close": "Cerrar",
  "failedToPreviewUrl": "No se pudo generar la vista previa",
  "expandTweet": "Expandir tweet",
  "enablePlayer": "Abrir reproductor",
  "openInWindow": "Abrir en una ventana"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "disablePlayer": "Fermer le lecteur vidéo",
  "close": "Fermer",
  "failedToPreviewUrl": "Aperçu d'URL échoué",
  "expandTweet": "Étendre le tweet",
  "enablePlayer": "Ouvrir dans le lecteur vidéo",
  "openInWindow": "Ouvrir dans une nouvelle fenêtre"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "disablePlayer": "Tutup pemutar video",
  "close": "Tutup",
  "failedToPreviewUrl": "Tidak dapat dipratinjau",
  "expandTweet": "Perluas utas",
  "enablePlayer": "Buka pemutar video",
  "openInWindow": "Buka di jendela"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "disablePlayer": "Chiudi",
  "close": "Chiudi",
  "failedToPreviewUrl": "Anteprima non disponibile",
  "expandTweet": "Espandi tweet",
  "enablePlayer": "Visualizza",
  "openInWindow": "Apri in una finestra"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "disablePlayer": "プレイヤーを閉じる",
  "close": "閉じる",
  "failedToPreviewUrl": "プレビューできません",
  "expandTweet": "ポストを展開する",
  "enablePlayer": "プレイヤーを開く",
  "openInWindow": "ウィンドウで開く"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "disablePlayer": "プレイヤー閉じる",
  "close": "さいなら",
  "failedToPreviewUrl": "プレビューできへん",
  "expandTweet": "ポスト展開しとく",
  "enablePlayer": "プレイヤー開く",
  "openInWindow": "ウィンドウで開く"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Close",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Open in window"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Close",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Open in window"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "disablePlayer": "플레이어 닫기",
  "close": "닫기",
  "failedToPreviewUrl": "미리 볼 수 없음",
  "expandTweet": "게시물 확장하기",
  "enablePlayer": "플레이어 열기",
  "openInWindow": "창으로 열기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "disablePlayer": "Videospeler sluiten",
  "close": "Sluiten",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Notitie uitklappen",
  "enablePlayer": "Videospeler openen",
  "openInWindow": "In een venster openen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Lukk",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Åpne i vindu"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "disablePlayer": "Zamknij odtwarzacz wideo",
  "close": "Zamknij",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Rozwiń tweet",
  "enablePlayer": "Otwórz odtwarzacz wideo",
  "openInWindow": "Otwórz w oknie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "disablePlayer": "Fechar o reprodutor de mídia",
  "close": "Fechar",
  "failedToPreviewUrl": "Não foi possível carregar prévia",
  "expandTweet": "Expandir tweet",
  "enablePlayer": "Abrir o reprodutor de mídia",
  "openInWindow": "Abrir em um janela"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "disablePlayer": "Выключить проигрыватель",
  "close": "Закрыть",
  "failedToPreviewUrl": "Предварительный просмотр недоступен",
  "expandTweet": "Развернуть заметку",
  "enablePlayer": "Включить проигрыватель",
  "openInWindow": "Открыть в плавающем окне"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "disablePlayer": "Zavrieť video prehrávač",
  "close": "Zavrieť",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Rozšíriť tweet",
  "enablePlayer": "Otvoriť video prehrávač",
  "openInWindow": "Otvoriť v novom okne"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "disablePlayer": "ปิดเครื่องเล่นวิดีโอ",
  "close": "ปิด",
  "failedToPreviewUrl": "ไม่สามารถดูตัวอย่างได้",
  "expandTweet": "ขยายทวีต",
  "enablePlayer": "เปิดเครื่องเล่นวิดีโอ",
  "openInWindow": "เปิดในหน้าต่าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "disablePlayer": "Video oynatıcıyı kapat",
  "close": "Kapat",
  "failedToPreviewUrl": "Önizleme yapılamadı",
  "expandTweet": "Notu genişlet",
  "enablePlayer": "Video oynatıcıyı aç",
  "openInWindow": "Pencerede aç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "disablePlayer": "Close video player",
  "close": "Close",
  "failedToPreviewUrl": "Could not preview",
  "expandTweet": "Expand post",
  "enablePlayer": "Open video player",
  "openInWindow": "Open in window"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "disablePlayer": "Закрити відеоплеєр",
  "close": "Закрити",
  "failedToPreviewUrl": "Не вдалося переглянути",
  "expandTweet": "Розгорнути твіт",
  "enablePlayer": "Відкрити відеоплеєр",
  "openInWindow": "Відкрити у вікні"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "disablePlayer": "Đóng trình phát video",
  "close": "Đóng",
  "failedToPreviewUrl": "Không thể xem trước",
  "expandTweet": "Mở rộng tweet",
  "enablePlayer": "Mở trình phát video",
  "openInWindow": "Mở trong cửa sổ mới"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "disablePlayer": "关闭播放器",
  "close": "关闭",
  "failedToPreviewUrl": "无法预览",
  "expandTweet": "展开帖子",
  "enablePlayer": "打开播放器",
  "openInWindow": "在新窗口中打开"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "disablePlayer": "關閉播放器",
  "close": "關閉",
  "failedToPreviewUrl": "無法預覽",
  "expandTweet": "展開推文",
  "enablePlayer": "開啟播放器",
  "openInWindow": "在新視窗開啟"
}
</locale>
