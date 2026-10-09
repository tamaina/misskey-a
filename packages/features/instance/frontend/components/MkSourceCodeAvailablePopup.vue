<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel _shadow" :class="$style.root">
	<div :class="$style.icon">
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-open-source" width="40" height="40" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
			<path d="M12 3a9 9 0 0 1 3.618 17.243l-2.193 -5.602a3 3 0 1 0 -2.849 0l-2.193 5.603a9 9 0 0 1 3.617 -17.244z"/>
		</svg>
	</div>
	<div :class="$style.main">
		<div :class="$style.title">
			<I18n :src="$locale.sfc.aboutX" tag="span">
				<template #x>
					{{ instance.name ?? host }}
				</template>
			</I18n>
		</div>
		<div :class="$style.text">
			<I18n :src="$locale.sfc.aboutMisskeyThisIsModifiedVersion" tag="span">
				<template #name>
					{{ instance.name ?? host }}
				</template>
			</I18n>
			<I18n :src="$locale.sfc.correspondingSourceIsAvailable" tag="span">
				<template #anchor>
					<MkA to="/about-misskey" class="_link">{{ $locale.sfc.aboutMisskey }}</MkA>
				</template>
			</I18n>
		</div>
		<div class="_buttons">
			<MkButton @click="close">{{ $locale.sfc.gotIt }}</MkButton>
		</div>
	</div>
	<button class="_button" :class="$style.close" @click="close"><i class="ti ti-x"></i></button>
</div>
</template>

<script lang="ts" setup>
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { host } from '@features/boot/frontend/shared/config.js';
import { instance } from '@features/instance/frontend/instance.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import * as os from '@features/ui/frontend/os.js';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('low');

function close() {
	miLocalStorage.setItem('modifiedVersionMustProminentlyOfferInAgplV3Section13Read', 'true');
	emit('closed');
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: var(--MI-margin);
	left: 0;
	right: 0;
	margin: auto;
	box-sizing: border-box;
	width: calc(100% - (var(--MI-margin) * 2));
	max-width: 500px;
	display: flex;
}

.icon {
	text-align: center;
	padding-top: 25px;
	width: 100px;
	color: var(--MI_THEME-accent);
}
@media (max-width: 500px) {
	.icon {
		width: 80px;
	}
}
@media (max-width: 450px) {
	.icon {
		width: 70px;
	}
}

.main {
	padding: 25px 25px 25px 0;
	flex: 1;
}

.close {
	position: absolute;
	top: 8px;
	right: 8px;
	padding: 8px;
}

.title {
	font-weight: bold;
}

.text {
	margin: 0.7em 0 1em 0;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"aboutX": "عن {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "عن Misskey",
	"gotIt": "فهِمت"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"aboutX": "Respecte a {x}",
	"aboutMisskeyThisIsModifiedVersion": "En {name} fa servir una versió modificada de Misskey.",
	"correspondingSourceIsAvailable": "El codi font corresponent està disponible a {anchor}.",
	"aboutMisskey": "Quant a Misskey",
	"gotIt": "D'acord "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "O Misskey",
	"gotIt": "Rozumím!"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"aboutX": "About {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "About Misskey",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"aboutX": "Über {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} verwendet eine modifizierte Version des ursprünglichen Misskey.",
	"correspondingSourceIsAvailable": "Der entsprechende Quellcode ist verfügbar unter {anchor}",
	"aboutMisskey": "Über Misskey",
	"gotIt": "Verstanden!"
}
</locale>

<locale lang="json" locale="en-US">
{
	"aboutX": "About {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "About Misskey",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"aboutX": "Acerca de {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} usa una versión modificada de Misskey.",
	"correspondingSourceIsAvailable": "El código fuente correspondiente se encuentra disponible en {anchor}",
	"aboutMisskey": "Sobre Misskey",
	"gotIt": "¡Lo tengo!"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"aboutX": "À propos de {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "Le code source correspondant est disponible à {anchor}",
	"aboutMisskey": "À propos de Misskey",
	"gotIt": "J’ai compris !"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"aboutX": "Tentang {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} menggunakan versi modifikasi dari Misskey yang asli.",
	"correspondingSourceIsAvailable": "Sumber kode terkait tersedia di {anchor}",
	"aboutMisskey": "Tentang Misskey",
	"gotIt": "Mengerti"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"aboutX": "Informazioni su {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} sta usando una versione modificata diversa da Misskey originale.",
	"correspondingSourceIsAvailable": "Il codice sorgente corrispondente è disponibile su {anchor}.",
	"aboutMisskey": "A proposito di Misskey",
	"gotIt": "ok!"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"aboutX": "{x}について",
	"aboutMisskeyThisIsModifiedVersion": "{name}はオリジナルのMisskeyを改変したバージョンを使用しています。",
	"correspondingSourceIsAvailable": "対応するソースコードは{anchor}から利用可能です。",
	"aboutMisskey": "Misskeyについて",
	"gotIt": "わかった"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"aboutX": "{x}について",
	"aboutMisskeyThisIsModifiedVersion": "{name}はオリジナルのMisskeyをいじったバージョンをつこうてるで。",
	"correspondingSourceIsAvailable": "{anchor}",
	"aboutMisskey": "Misskeyってなんや？",
	"gotIt": "ほい"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"aboutX": "About {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "About Misskey",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"aboutX": "About {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "About Misskey",
	"gotIt": "ಅರ್ಥವಾಯಿತು!"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"aboutX": "{x}에 대하여",
	"aboutMisskeyThisIsModifiedVersion": "{name}에서는 원본 미스키를 수정한 버전을 사용하고 있습니다.",
	"correspondingSourceIsAvailable": "소스 코드는 {anchor}에서 받아보실 수 있습니다.",
	"aboutMisskey": "Misskey에 대하여",
	"gotIt": "알겠어요"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"aboutX": "Over {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "De bijbehorende broncode is beschikbaar bij {anchor}",
	"aboutMisskey": "Over Misskey",
	"gotIt": "Begrepen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"aboutX": "Om {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "Om Misskey",
	"gotIt": "Skjønner"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "Odpowiedni kod źródłowy jest dostępny pod {anchor}.",
	"aboutMisskey": "O Misskey",
	"gotIt": "Rozumiem!"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"aboutX": "Sobre {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} utiliza uma versão modificada do Misskey original.",
	"correspondingSourceIsAvailable": "O código-fonte correspondente está disponível em {anchor}",
	"aboutMisskey": "Sobre Misskey",
	"gotIt": "Entendi"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"aboutX": "Описание {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "Соответствующий исходный код можно найти по адресу {anchor} ",
	"aboutMisskey": "О Misskey",
	"gotIt": "Ясно!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "O Misskey",
	"gotIt": "Rozumiem!"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"aboutX": "เกี่ยวกับ {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} ใช้ Misskey เวอร์ชันดัดแปลง",
	"correspondingSourceIsAvailable": "ซอร์สโค้ดที่เกี่ยวข้องมีอยู่ที่ {anchor}",
	"aboutMisskey": "เกี่ยวกับ Misskey",
	"gotIt": "เข้าใจแล้ว !"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"aboutX": "{x} hakkında",
	"aboutMisskeyThisIsModifiedVersion": "{name} orijinal Misskey'in değiştirilmiş bir sürümünü kullanır.",
	"correspondingSourceIsAvailable": "İlgili kaynak kodu {anchor} adresinde mevcuttur.",
	"aboutMisskey": "Misskey Hakkında",
	"gotIt": "Anladım!"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"aboutX": "About {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "The corresponding source code is available at {anchor}",
	"aboutMisskey": "About Misskey",
	"gotIt": "Got it!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"aboutX": "Про {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "Відповідний вихідний код доступний за посиланням: {anchor}",
	"aboutMisskey": "Про Misskey",
	"gotIt": "Зрозуміло!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"aboutX": "Giới thiệu {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"correspondingSourceIsAvailable": "Mã nguồn có thể được xem tại {anchor}",
	"aboutMisskey": "Về Misskey",
	"gotIt": "Hiểu rồi!"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"aboutX": "关于 {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name}正在使用修改后的 Misskey。",
	"correspondingSourceIsAvailable": "对应的源代码可在{anchor}找到",
	"aboutMisskey": "关于 Misskey",
	"gotIt": "好"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"aboutX": "關於{x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} 使用原始 Misskey 的修改版本。",
	"correspondingSourceIsAvailable": "對應的原始碼可以在 {anchor} 處找到。",
	"aboutMisskey": "關於 Misskey",
	"gotIt": "知道了"
}
</locale>
