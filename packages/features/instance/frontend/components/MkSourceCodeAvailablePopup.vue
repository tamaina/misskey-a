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
	"aboutMisskeyThisIsModifiedVersion": "يستخدم {name} نسخة معدّلة من Misskey الأصلي.",
	"correspondingSourceIsAvailable": "الشيفرة المصدرية لهذه النسخة متاحة عبر {anchor}",
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
	"aboutMisskeyThisIsModifiedVersion": "{name} používá upravenou verzi původního Misskey.",
	"correspondingSourceIsAvailable": "Odpovídající zdrojový kód je dostupný na {anchor}",
	"aboutMisskey": "O Misskey",
	"gotIt": "Rozumím!"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"aboutX": "Om {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} bruger en ændret version af den oprindelige Misskey.",
	"correspondingSourceIsAvailable": "Den tilhørende kildekode er tilgængelig på {anchor}",
	"aboutMisskey": "Om Misskey",
	"gotIt": "Forstået!"
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
	"aboutMisskeyThisIsModifiedVersion": "{name} utilise une version modifiée du Misskey original.",
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
	"correspondingSourceIsAvailable": "このバージョンのソースコードは{anchor}から見られるで。",
	"aboutMisskey": "Misskeyってなんや？",
	"gotIt": "ほい"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"aboutX": "Ɣef {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} iseqdac lqem yettwabeddlen n Misskey aneṣli.",
	"correspondingSourceIsAvailable": "Tangalt n uɣbalu n lqem-a tella deg {anchor}",
	"aboutMisskey": "Ɣef Misskey",
	"gotIt": "Gziɣ!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"aboutX": "{x} ಕುರಿತು",
	"aboutMisskeyThisIsModifiedVersion": "{name} ಮೂಲ Misskeyಯ ಮಾರ್ಪಡಿಸಿದ ಆವೃತ್ತಿಯನ್ನು ಬಳಸುತ್ತದೆ.",
	"correspondingSourceIsAvailable": "ಈ ಆವೃತ್ತಿಯ ಮೂಲ ಕೋಡ್ {anchor} ನಲ್ಲಿ ಲಭ್ಯವಿದೆ",
	"aboutMisskey": "Misskey ಕುರಿತು",
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
	"aboutMisskeyThisIsModifiedVersion": "{name} gebruikt een aangepaste versie van de oorspronkelijke Misskey.",
	"correspondingSourceIsAvailable": "De bijbehorende broncode is beschikbaar bij {anchor}",
	"aboutMisskey": "Over Misskey",
	"gotIt": "Begrepen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"aboutX": "Om {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} bruker en endret versjon av den opprinnelige Misskey.",
	"correspondingSourceIsAvailable": "Den tilhørende kildekoden er tilgjengelig på {anchor}",
	"aboutMisskey": "Om Misskey",
	"gotIt": "Skjønner"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} korzysta ze zmodyfikowanej wersji oryginalnego Misskey.",
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
	"aboutMisskeyThisIsModifiedVersion": "{name} использует изменённую версию оригинального Misskey.",
	"correspondingSourceIsAvailable": "Соответствующий исходный код можно найти по адресу {anchor} ",
	"aboutMisskey": "О Misskey",
	"gotIt": "Ясно!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} používa upravenú verziu pôvodného Misskey.",
	"correspondingSourceIsAvailable": "Príslušný zdrojový kód je dostupný na {anchor}",
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
	"aboutX": "{x} ھەققىدە",
	"aboutMisskeyThisIsModifiedVersion": "{name} ئەسلى Misskey نىڭ ئۆزگەرتىلگەن نۇسخىسىنى ئىشلىتىدۇ.",
	"correspondingSourceIsAvailable": "بۇ نۇسخىنىڭ مەنبە كودى {anchor} دا بار",
	"aboutMisskey": "Misskey ھەققىدە",
	"gotIt": "چۈشەندىم!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"aboutX": "Про {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} використовує змінену версію оригінального Misskey.",
	"correspondingSourceIsAvailable": "Відповідний вихідний код доступний за посиланням: {anchor}",
	"aboutMisskey": "Про Misskey",
	"gotIt": "Зрозуміло!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"aboutX": "Giới thiệu {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} sử dụng phiên bản đã chỉnh sửa của Misskey gốc.",
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

<locale lang="json" locale="bn-BD">
{
	"aboutX": "{x} সম্পর্কে",
	"aboutMisskeyThisIsModifiedVersion": "{name} মূল Misskey-এর একটি পরিবর্তিত সংস্করণ ব্যবহার করছে।",
	"correspondingSourceIsAvailable": "সংশ্লিষ্ট সোর্স কোড {anchor} থেকে পাওয়া যায়।",
	"aboutMisskey": "Misskey সম্পর্কে",
	"gotIt": "বুঝেছি"
}
</locale>

<locale lang="json" locale="el-GR">
{
	"aboutX": "Σχετικά με {x}",
	"aboutMisskeyThisIsModifiedVersion": "Το {name} χρησιμοποιεί μια τροποποιημένη έκδοση του αρχικού Misskey.",
	"correspondingSourceIsAvailable": "Ο αντίστοιχος πηγαίος κώδικας είναι διαθέσιμος στο {anchor}.",
	"aboutMisskey": "Σχετικά με το Misskey",
	"gotIt": "Τό'πιασα!"
}
</locale>

<locale lang="json" locale="fa-IR">
{
	"aboutX": "دربارهٔ {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} از نسخه‌ای تغییریافته از Misskey اصلی استفاده می‌کند.",
	"correspondingSourceIsAvailable": "کد منبع مربوطه از طریق {anchor} در دسترس است.",
	"aboutMisskey": "دربارهٔ Misskey",
	"gotIt": "متوجه شدم"
}
</locale>

<locale lang="json" locale="hr-HR">
{
	"aboutX": "O {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} koristi izmijenjenu verziju izvornog Misskeyja.",
	"correspondingSourceIsAvailable": "Odgovarajući izvorni kod dostupan je na {anchor}.",
	"aboutMisskey": "O Misskeyju",
	"gotIt": "Razumijem"
}
</locale>

<locale lang="json" locale="ht-HT">
{
	"aboutX": "Konsènan {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} sèvi ak yon vèsyon modifye Misskey orijinal la.",
	"correspondingSourceIsAvailable": "Kòd sous ki koresponn lan disponib nan {anchor}.",
	"aboutMisskey": "Konsènan Misskey",
	"gotIt": "Konprann"
}
</locale>

<locale lang="json" locale="hu-HU">
{
	"aboutX": "{x} névjegye",
	"aboutMisskeyThisIsModifiedVersion": "{name} az eredeti Misskey módosított változatát használja.",
	"correspondingSourceIsAvailable": "A megfelelő forráskód itt érhető el: {anchor}.",
	"aboutMisskey": "A Misskey névjegye",
	"gotIt": "Rendben"
}
</locale>

<locale lang="json" locale="jbo-EN">
{
	"aboutX": "srana la'o gy. {x} .gy.",
	"aboutMisskeyThisIsModifiedVersion": "la'o gy. {name} .gy. cu pilno la'o gy. Misskey .gy. poi pu se galfi",
	"correspondingSourceIsAvailable": "lo se ciska poi platu lo samru'e cu se cpacu fi la'o gy. {anchor} .gy.",
	"aboutMisskey": "srana la'o gy. Misskey .gy.",
	"gotIt": "mi jimpe"
}
</locale>

<locale lang="json" locale="ko-GS">
{
	"aboutX": "{x}에 대해서",
	"aboutMisskeyThisIsModifiedVersion": "{name}넌 원래 Misskey럴 곤친 버전얼 서고 잇십니다.",
	"correspondingSourceIsAvailable": "요 소스 코드넌 {anchor}서 받아볼 수 잇십니다.",
	"aboutMisskey": "Misskey넌예",
	"gotIt": "알것어예"
}
</locale>

<locale lang="json" locale="lo-LA">
{
	"aboutX": "ກ່ຽວກັບ {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} ໃຊ້ Misskey ລຸ້ນທີ່ດັດແປງຈາກຕົ້ນສະບັບ.",
	"correspondingSourceIsAvailable": "ສາມາດເບິ່ງລະຫັດຕົ້ນສະບັບທີ່ກ່ຽວຂ້ອງໄດ້ທີ່ {anchor}.",
	"aboutMisskey": "ກ່ຽວກັບ Misskey",
	"gotIt": "ເຂົ້າໃຈແລ້ວ!"
}
</locale>

<locale lang="json" locale="ro-RO">
{
	"aboutX": "Despre {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} folosește o versiune modificată a software-ului Misskey original.",
	"correspondingSourceIsAvailable": "Codul sursă corespunzător este disponibil la {anchor}",
	"aboutMisskey": "Despre Misskey",
	"gotIt": "Am înțeles!"
}
</locale>

<locale lang="json" locale="si-LK">
{
	"aboutX": "{x} ගැන",
	"aboutMisskeyThisIsModifiedVersion": "{name} භාවිත කරන්නේ මුල් Misskey හි වෙනස් කළ අනුවාදයකි.",
	"correspondingSourceIsAvailable": "අදාළ මූලාශ්‍ර කේතය {anchor} වෙතින් ලබා ගත හැක.",
	"aboutMisskey": "Misskey ගැන",
	"gotIt": "තේරුණා"
}
</locale>

<locale lang="json" locale="sv-SE">
{
	"aboutX": "Om {x}",
	"aboutMisskeyThisIsModifiedVersion": "{name} använder en modifierad version av det ursprungliga Misskey.",
	"correspondingSourceIsAvailable": "Den tillhörande källkoden finns tillgänglig på {anchor}.",
	"aboutMisskey": "Om Misskey",
	"gotIt": "Uppfattat!"
}
</locale>

<locale lang="json" locale="tl-PH">
{
	"aboutX": "Tungkol sa {x}",
	"aboutMisskeyThisIsModifiedVersion": "Gumagamit ang {name} ng binagong bersiyon ng orihinal na Misskey.",
	"correspondingSourceIsAvailable": "Makukuha ang kaukulang source code sa {anchor}.",
	"aboutMisskey": "Tungkol sa Misskey",
	"gotIt": "Naiintindihan ko"
}
</locale>

<locale lang="json" locale="uz-UZ">
{
	"aboutX": "{x} haqida",
	"aboutMisskeyThisIsModifiedVersion": "{name} asl Misskey dasturining o‘zgartirilgan versiyasidan foydalanadi.",
	"correspondingSourceIsAvailable": "Tegishli manba kodi {anchor} orqali mavjud.",
	"aboutMisskey": "Misskey haqida",
	"gotIt": "Tushunarli!"
}
</locale>
