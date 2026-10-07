<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="chosen && !shouldHide">
	<div
		v-if="!showMenu"
		:class="[$style.main, {
			[$style.form_square]: chosen.place === 'square',
			[$style.form_horizontal]: chosen.place === 'horizontal',
			[$style.form_horizontalBig]: chosen.place === 'horizontal-big',
			[$style.form_vertical]: chosen.place === 'vertical',
		}]"
	>
		<component
			:is="self ? 'MkA' : 'a'"
			:class="$style.link"
			v-bind="self ? {
				to: chosen.url.substring(local.length),
			} : {
				href: chosen.url,
				rel: 'nofollow noopener',
				target: '_blank',
			}"
		>
			<img :src="chosen.imageUrl" :class="$style.img">
			<button class="_button" :class="$style.i" @click.prevent.stop="toggleMenu"><i :class="$style.iIcon" class="ti ti-info-circle"></i></button>
		</component>
	</div>
	<div v-else :class="$style.menu">
		<div>Ads by {{ host }}</div>
		<!--<MkButton class="button" primary>{{ i18n.ts._ad.like }}</MkButton>-->
		<MkButton v-if="chosen.ratio !== 0" :class="$style.menuButton" @click="reduceFrequency">{{ $locale.sfc.reduceFrequencyOfThisAd }}</MkButton>
		<button class="_textButton" @click="toggleMenu">{{ $locale.sfc.back }}</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { url as local, host } from '@@/js/config.js';
import { instance } from '@features/instance/frontend/instance.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { store } from '@features/preferences/frontend/store.js';
import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

type Ad = (typeof instance)['ads'][number];

const props = defineProps<{
	preferForms?: string[];
	specify?: Ad;
}>();

const showMenu = ref(false);
const toggleMenu = (): void => {
	showMenu.value = !showMenu.value;
};

const choseAd = (): Ad | null => {
	if (props.specify) {
		return props.specify;
	}

	const allAds = instance.ads.map(ad => store.s.mutedAds.includes(ad.id) ? {
		...ad,
		ratio: 0,
	} : ad);

	let ads = props.preferForms ? allAds.filter(ad => props.preferForms!.includes(ad.place)) : allAds;

	if (ads.length === 0) {
		ads = allAds.filter(ad => ad.place === 'square');
	}

	const lowPriorityAds = ads.filter(ad => ad.ratio === 0);
	ads = ads.filter(ad => ad.ratio !== 0);

	if (ads.length === 0) {
		if (lowPriorityAds.length !== 0) {
			return lowPriorityAds[Math.floor(Math.random() * lowPriorityAds.length)];
		} else {
			return null;
		}
	}

	const totalFactor = ads.reduce((a, b) => a + b.ratio, 0);
	const r = Math.random() * totalFactor;

	let stackedFactor = 0;
	for (const ad of ads) {
		if (r >= stackedFactor && r <= stackedFactor + ad.ratio) {
			return ad;
		} else {
			stackedFactor += ad.ratio;
		}
	}

	return null;
};

const chosen = ref(choseAd());

const self = computed(() => chosen.value?.url.startsWith(local));

const shouldHide = ref(!prefer.s.forceShowAds && $i && $i.policies.canHideAds && (props.specify == null));

function reduceFrequency(): void {
	if (chosen.value == null) return;
	if (store.s.mutedAds.includes(chosen.value.id)) return;
	store.push('mutedAds', chosen.value.id);
	os.success();
	chosen.value = choseAd();
	showMenu.value = false;
}
</script>

<style lang="scss" module>
.main {
	text-align: center;

	&.form_square {
		> .link,
		> .link > .img {
			max-width: min(300px, 100%);
			max-height: 300px;
		}
	}

	&.form_horizontal {
		> .link,
		> .link > .img {
			max-width: min(600px, 100%);
			max-height: 80px;
		}
	}

	&.form_horizontalBig {
		> .link,
		> .link > .img {
			max-width: min(600px, 100%);
			max-height: 250px;
		}
	}

	&.form_vertical {
		> .link,
		> .link > .img {
			max-width: min(100px, 100%);
		}
	}
}

.link {
	display: inline-block;
	position: relative;
	vertical-align: bottom;

	&:hover {
		> .img {
			filter: contrast(120%);
		}
	}
}

.img {
	display: block;
	object-fit: contain;
	margin: auto;
	border-radius: 5px;
}

.i {
	position: absolute;
	top: 1px;
	right: 1px;
	display: grid;
	place-content: center;
	background: var(--MI_THEME-panel);
	border-radius: 100%;
	padding: 2px;
}

.iIcon {
	font-size: 14px;
	line-height: 17px;
}

.menu {
	text-align: center;
	padding: 8px;
	margin: 0 auto;
	max-width: 400px;
	background: var(--MI_THEME-panel);
	border: solid 1px var(--MI_THEME-divider);
}

.menuButton {
	margin: 8px auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"reduceFrequencyOfThisAd": "قلل عرض هذا الإعلان",
	"back": "رجوع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"reduceFrequencyOfThisAd": "Mostrar menys aquest anunci",
	"back": "Tornar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"reduceFrequencyOfThisAd": "Zobrazovat tuto reklamu méně",
	"back": "Zpět"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"reduceFrequencyOfThisAd": "Diese Werbung weniger anzeigen",
	"back": "Zurück"
}
</locale>

<locale locale="en-US" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"reduceFrequencyOfThisAd": "Mostrar menos este anuncio.",
	"back": "Anterior"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"reduceFrequencyOfThisAd": "Voir cette publicité moins souvent",
	"back": "Retour"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"reduceFrequencyOfThisAd": "Tampilkan iklan ini lebih sedikit",
	"back": "Kembali"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"reduceFrequencyOfThisAd": "Visualizza questa pubblicità meno spesso",
	"back": "Indietro"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"reduceFrequencyOfThisAd": "この広告の表示頻度を下げる",
	"back": "戻る"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"reduceFrequencyOfThisAd": "この広告ちょっとうざったらしいわ",
	"back": "戻る"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"reduceFrequencyOfThisAd": "이 광고의 표시 빈도 낮추기",
	"back": "뒤로"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Terug"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"reduceFrequencyOfThisAd": "Pokazuj tę reklamę rzadziej",
	"back": "Wróć"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"reduceFrequencyOfThisAd": "Diminuir frequência deste anúncio",
	"back": "Voltar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"reduceFrequencyOfThisAd": "Реже показывать эту рекламу",
	"back": "Выход"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"reduceFrequencyOfThisAd": "Túto reklamu zobrazovať menej",
	"back": "Späť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"reduceFrequencyOfThisAd": "แสดงโฆษณานี้ให้น้อยลง",
	"back": "ย้อนกลับ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"reduceFrequencyOfThisAd": "Bu reklamı daha az göster",
	"back": "Geri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"reduceFrequencyOfThisAd": "Show this ad less",
	"back": "Back"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"reduceFrequencyOfThisAd": "Показувати цю рекламу менше",
	"back": "Назад"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"reduceFrequencyOfThisAd": "Hiện ít lại",
	"back": "Quay lại"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"reduceFrequencyOfThisAd": "减少此广告的频率",
	"back": "返回"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"reduceFrequencyOfThisAd": "降低此廣告的頻率 ",
	"back": "返回"
}
</locale>
