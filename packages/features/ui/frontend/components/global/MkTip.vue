<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!store.r.tips.value[props.k]" :class="[$style.root, { [$style.warn]: warn }]" class="_selectable _gaps_s">
	<div style="font-weight: bold;"><i class="ti ti-bulb"></i> {{ $locale.sfc.tip }}:</div>
	<div><slot></slot></div>
	<div>
		<MkButton inline primary rounded small @click="_closeTip()"><i class="ti ti-check"></i> {{ $locale.sfc.gotIt }}</MkButton>
		<button class="_button" style="padding: 8px; margin-left: 4px;" @click="showMenu"><i class="ti ti-dots"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { store } from '@features/preferences/frontend/store.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { TIPS, hideAllTips, closeTip } from '@features/web/frontend/tips.js';

const props = withDefaults(defineProps<{
	k: typeof TIPS[number];
	warn?: boolean;
}>(), {
	warn: false,
});

function _closeTip() {
	closeTip(props.k);
}

function showMenu(ev: PointerEvent) {
	os.popupMenu([{
		icon: 'ti ti-bulb-off',
		text: $locale.value.sfc.hideAllTips,
		danger: true,
		action: () => {
			hideAllTips();
			os.success();
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	padding: 12px 14px;
	font-size: 90%;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	border-radius: var(--MI-radius);

	&.warn {
		background: var(--MI_THEME-infoWarnBg);
		color: var(--MI_THEME-infoWarnFg);
	}
}

</style>

<locale locale="ar-SA" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "فهِمت",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"tip": "Trucs i consells",
	"gotIt": "D'acord ",
	"hideAllTips": "Amagar tots els trucs i consells"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Rozumím!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="da-DK" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Got it!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="de-DE" lang="json">
{
	"tip": "Tipps und Tricks",
	"gotIt": "Verstanden!",
	"hideAllTips": "Alle „Tipps und Tricks“ ausblenden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Got it!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="es-ES" lang="json">
{
	"tip": "Consejos y trucos",
	"gotIt": "¡Lo tengo!",
	"hideAllTips": "Ocultar todos los \"Trucos y consejos\""
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "J’ai compris !",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="id-ID" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Mengerti",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="it-IT" lang="json">
{
	"tip": "Suggerimento",
	"gotIt": "ok!",
	"hideAllTips": "Nascondi tutti i suggerimenti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"tip": "ヒントとコツ",
	"gotIt": "わかった",
	"hideAllTips": "全ての「ヒントとコツ」を非表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"tip": "ヒントとコツ",
	"gotIt": "ほい",
	"hideAllTips": "「ヒントとコツ」は全部表示せんでええ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Got it!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "ಅರ್ಥವಾಯಿತು!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"tip": "팁과 유용한 정보",
	"gotIt": "알겠어요",
	"hideAllTips": "모든 '팁과 유용한 정보'를 비표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Begrepen",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="no-NO" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Skjønner",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Rozumiem!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"tip": "Dicas e Truques",
	"gotIt": "Entendi",
	"hideAllTips": "Ocultas todas as \"Dicas e Truques\""
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"tip": "Советы и рекомендации",
	"gotIt": "Ясно!",
	"hideAllTips": "Скрыть все \"Советы и рекомендации\""
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Rozumiem!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="th-TH" lang="json">
{
	"tip": "คำแนะนำและเคล็ดลับ",
	"gotIt": "เข้าใจแล้ว !",
	"hideAllTips": "ซ่อนคำแนะนำและเคล็ดลับทั้งหมด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"tip": "İpucu & Püf Nokta",
	"gotIt": "Anladım!",
	"hideAllTips": "Tüm “İpucu & Püf Nokta” gizle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Got it!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"tip": "Поради та підказки",
	"gotIt": "Зрозуміло!",
	"hideAllTips": "Приховати всі «Поради й підказки»"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"tip": "Tips & Tricks",
	"gotIt": "Hiểu rồi!",
	"hideAllTips": "Hide all \"Tips & Tricks\""
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"tip": "提示和技巧",
	"gotIt": "好",
	"hideAllTips": "隐藏所有的 “提示与技巧”"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"tip": "提示與技巧",
	"gotIt": "知道了",
	"hideAllTips": "隱藏所有「提示與技巧」"
}
</locale>
