<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="content" :class="[$style.content, { [$style.omitted]: omitted }]">
	<slot></slot>
	<button v-if="omitted" :class="$style.fade" class="_button" @click="() => { ignoreOmit = true; omitted = false; }">
		<span :class="$style.fadeLabel">{{ $locale.sfc.showMore }}</span>
	</button>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef, ref } from 'vue';

const props = withDefaults(defineProps<{
	maxHeight?: number;
}>(), {
	maxHeight: 200,
});

const content = useTemplateRef('content');
const omitted = ref(false);
const ignoreOmit = ref(false);

const calcOmit = () => {
	if (omitted.value || ignoreOmit.value || content.value == null) return;
	omitted.value = content.value.offsetHeight > props.maxHeight;
};

const omitObserver = new ResizeObserver((entries, observer) => {
	calcOmit();
});

onMounted(() => {
	calcOmit();
	omitObserver.observe(content.value as HTMLElement);
});

onUnmounted(() => {
	omitObserver.disconnect();
});
</script>

<style lang="scss" module>
.content {
	--MI-stickyTop: 0px;

	&.omitted {
		position: relative;
		max-height: v-bind("props.maxHeight + 'px'");
		overflow: hidden;

		> .fade {
			display: block;
			position: absolute;
			z-index: 10;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));

			> .fadeLabel {
				display: inline-block;
				background: var(--MI_THEME-panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--MI_THEME-panelHighlight);
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "showMore": "عرض المزيد"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "showMore": "Veure més"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "showMore": "Zobrazit více"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "showMore": "Show more"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "showMore": "Mehr anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "showMore": "Show more"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "showMore": "Ver más"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "showMore": "Voir plus"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "showMore": "Selebihnya"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "showMore": "Espandi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "showMore": "もっと見る"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "showMore": "まだまだあるで！"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "showMore": "Wali ugar"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "showMore": "ಇನ್ನಷ್ಟು ನೋಡು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "showMore": "더 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "showMore": "Toon meer"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "showMore": "Vis mer"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "showMore": "Załaduj więcej"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "showMore": "Ver mais"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "showMore": "Показать ещё"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "showMore": "Zobraziť viac"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "showMore": "แสดงเพิ่มเติม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "showMore": "Daha fazlasını göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "showMore": "Show more"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "showMore": "Показати більше"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "showMore": "Xem thêm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "showMore": "查看更多"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "showMore": "載入更多"
}
</locale>
