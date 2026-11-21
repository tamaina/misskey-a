<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<template v-if="html != null">
	<iframe sandbox="" referrerpolicy="no-referrer" :title="fallback" :srcdoc="rendered.documentHtml" :class="$style.frame"></iframe>
	<div v-if="rendered.imageId || rendered.audioId" :class="$style.controls">
		<span v-if="rendered.imageId && !image">
			<MkButton small :disabled="imageBusy" :wait="imageBusy" @click="load('image')">{{ $locale.sfc.loadImage }}</MkButton>
			<span v-if="imageError" role="alert">{{ $locale.sfc.imageFailed }}</span>
		</span>
		<template v-if="rendered.audioId">
			<audio v-if="audio" ref="player" :src="audio" controls preload="none" :aria-label="$locale.sfc.audio" @error="audio = undefined; audioError = true"></audio>
			<span v-else>
				<MkButton small :disabled="audioBusy" :wait="audioBusy" @click="load('audio')">{{ $locale.sfc.loadAudio }}</MkButton>
				<span v-if="audioError" role="alert">{{ $locale.sfc.audioFailed }}</span>
			</span>
		</template>
	</div>
</template>
<p v-else :class="$style.text">{{ fallback }}</p>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { staticAnkiDocument } from '../static-anki-document.js';
import { staticAnkiMediaUrl } from '../static-anki-media.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const props = defineProps<{ fallback: string; html?: string; css?: string; deckId?: string }>();
const image = ref<{ id: string; url: string }>();
const audio = ref<string>();
const player = ref<HTMLAudioElement>();
const imageBusy = ref(false);
const audioBusy = ref(false);
const imageError = ref(false);
const audioError = ref(false);
let requests = new AbortController();
const rendered = computed(() => staticAnkiDocument(props.html ?? '', props.css ?? '', props.deckId ? {
	image: image.value, imageLabel: $locale.value.sfc.image, audioLabel: $locale.value.sfc.audio,
} : undefined));

function stopMedia() {
	requests.abort();
	if (player.value && !player.value.paused) player.value.pause();
}

watch([() => props.deckId, () => props.html], () => {
	stopMedia();
	requests = new AbortController();
	image.value = undefined;
	audio.value = undefined;
	imageBusy.value = false;
	audioBusy.value = false;
	imageError.value = false;
	audioError.value = false;
}, { flush: 'sync' });
onBeforeUnmount(stopMedia);

async function load(kind: 'image' | 'audio') {
	const isImage = kind === 'image';
	const busy = isImage ? imageBusy : audioBusy;
	const error = isImage ? imageError : audioError;
	const id = props.deckId;
	const mediaId = isImage ? rendered.value.imageId : rendered.value.audioId;
	if (!id || !mediaId || busy.value) return;
	const { signal } = requests;
	busy.value = true;
	error.value = false;
	try {
		const asset = await misskeyApi('fukushu/materials/anki-media', { id, mediaId }, undefined, signal);
		signal.throwIfAborted();
		const url = staticAnkiMediaUrl(asset, mediaId, isImage ? 'image/png' : 'audio/wav');
		if (isImage) image.value = { id: mediaId, url };
		else audio.value = url;
	} catch {
		if (!signal.aborted) error.value = true;
	} finally {
		if (!signal.aborted) busy.value = false;
	}
}
</script>
<style module>
.frame { display: block; width: 100%; height: 12rem; border: 0; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
.controls { display: flex; flex-wrap: wrap; align-items: start; gap: .5em; }
.controls audio { max-inline-size: 100%; }
</style>
<locale locale="ja-JP" lang="json">
{
	"image": "画像",
	"audio": "音声",
	"loadImage": "画像を表示",
	"loadAudio": "音声を読み込む",
	"imageFailed": "画像を読み込めませんでした。もう一度お試しください。",
	"audioFailed": "音声を読み込めませんでした。もう一度お試しください。"
}
</locale>
<locale locale="en-US" lang="json">
{
	"image": "Image",
	"audio": "Audio",
	"loadImage": "Show image",
	"loadAudio": "Load audio",
	"imageFailed": "Could not load the image. Try again.",
	"audioFailed": "Could not load the audio. Try again."
}
</locale>
