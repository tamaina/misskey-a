<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel _shadow" :class="$style.root">
	<!-- TODO: インスタンス運営者が任意のテキストとリンクを設定できるようにする -->
	<div :class="$style.icon">
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pig-money" width="40" height="40" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
			<path d="M15 11v.01"></path>
			<path d="M5.173 8.378a3 3 0 1 1 4.656 -1.377"></path>
			<path d="M16 4v3.803a6.019 6.019 0 0 1 2.658 3.197h1.341a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-1.342c-.336 .95 -.907 1.8 -1.658 2.473v2.027a1.5 1.5 0 0 1 -3 0v-.583a6.04 6.04 0 0 1 -1 .083h-4a6.04 6.04 0 0 1 -1 -.083v.583a1.5 1.5 0 0 1 -3 0v-2l.001 -.027a6 6 0 0 1 3.999 -10.473h2.5l4.5 -3h.001z"></path>
		</svg>
	</div>
	<div :class="$style.main">
		<div :class="$style.title">{{ $locale.sfc.didYouLikeMisskey }}</div>
		<div :class="$style.text">
			<I18n :src="$locale.sfc.pleaseDonate" tag="span">
				<template #host>
					{{ instance.name ?? host }}
				</template>
			</I18n>
			<div style="margin-top: 0.2em;">
				<MkLink target="_blank" url="https://misskey-hub.net/docs/for-users/resources/donate/">{{ $locale.sfc.learnMore }}</MkLink>
			</div>
		</div>
		<div class="_buttons">
			<MkButton @click="close">{{ $locale.sfc.remindMeLater }}</MkButton>
			<MkButton @click="neverShow">{{ $locale.sfc.neverShow }}</MkButton>
		</div>
	</div>
	<button class="_button" :class="$style.close" @click="close"><i class="ti ti-x"></i></button>
</div>
</template>

<script lang="ts" setup>
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import { host } from '@features/boot/frontend/shared/config.js';
import * as os from '@features/ui/frontend/os.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { instance } from '@features/instance/frontend/instance.js';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('low');

function close() {
	miLocalStorage.setItem('latestDonationInfoShownAt', Date.now().toString());
	emit('closed');
}

function neverShow() {
	miLocalStorage.setItem('neverShowDonationInfo', 'true');
	close();
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
	"didYouLikeMisskey": "هل أعجبك ميسكي؟",
	"pleaseDonate": "يستخدم {host} البرمجية الحرة ميسكي. نتمنى أن تتبرعوا للمشروع مما سيسمح لنا متابعة تطويره!",
	"learnMore": "راجع المزيد",
	"remindMeLater": "ربما لاحقا",
	"neverShow": "لا تظهره مجددًا"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"didYouLikeMisskey": "T'està agradant Misskey?",
	"pleaseDonate": "A {host} fem servir el software lliure Misskey. Considera fer un donatiu a Misskey perquè pugui continuar el seu desenvolupament!",
	"learnMore": "Saber-ne més ",
	"remindMeLater": "Recorda-m'ho més tard",
	"neverShow": "No mostrar més "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"didYouLikeMisskey": "Oblíbili jste si Misskey?",
	"pleaseDonate": "{host} používá bezplatný software Misskey. Velmi bychom ocenili vaše dary, aby mohl vývoj Misskey pokračovat!",
	"learnMore": "Zjistit více",
	"remindMeLater": "Možná později",
	"neverShow": "Znovu nezobrazovat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"didYouLikeMisskey": "Kan du lide Misskey?",
	"pleaseDonate": "{host} bruger den gratis software Misskey. Vi sætter stor pris på donationer, så udviklingen af Misskey kan fortsætte!",
	"learnMore": "Læs mere",
	"remindMeLater": "Måske senere",
	"neverShow": "Vis ikke igen"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"didYouLikeMisskey": "Gefällt dir Misskey?",
	"pleaseDonate": "Misskey ist die kostenlose Software, die von {host} verwendet wird. Wir würden uns über Spenden freuen, damit dessen Entwicklung weitergeführt werden kann!",
	"learnMore": "Mehr erfahren",
	"remindMeLater": "Vielleicht später",
	"neverShow": "Nicht wieder anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"didYouLikeMisskey": "Have you taken a liking to Misskey?",
	"pleaseDonate": "{host} uses the free software, Misskey. We would highly appreciate your donations so development of Misskey can continue!",
	"learnMore": "Learn more",
	"remindMeLater": "Maybe later",
	"neverShow": "Don't show again"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"didYouLikeMisskey": "¿Te gusta Misskey?",
	"pleaseDonate": "{host} usa el software gratuito Misskey. Por favor ¡Considera donar al proyecto principal para que podamos continuar!",
	"learnMore": "Ver más",
	"remindMeLater": "Recordar después",
	"neverShow": "No mostrar de nuevo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"didYouLikeMisskey": "Avez-vous aimé Misskey ?",
	"pleaseDonate": "Misskey est le logiciel libre utilisé par {host}. Merci de faire un don pour que nous puissions continuer à le développer !",
	"learnMore": "Plus d'informations",
	"remindMeLater": "Peut-être plus tard",
	"neverShow": "Ne plus afficher"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"didYouLikeMisskey": "Apakah kamu mulai menyukai Misskey?",
	"pleaseDonate": "{host} menggunakan perangkat lunak bebas yaitu Misskey. Kami sangat mengapresiasi sekali donasi dari kamu agar pengembangan Misskey tetap dapat berlanjut!",
	"learnMore": "Pelajari lebih lanjut",
	"remindMeLater": "Mungkin nanti",
	"neverShow": "Jangan tampilkan lagi"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"didYouLikeMisskey": "Ti piace Misskey?",
	"pleaseDonate": "Misskey è il software libero utilizzato su {host}. Offrendo una donazione è più facile continuare a svilupparlo!",
	"learnMore": "Per saperne di più",
	"remindMeLater": "Rimanda",
	"neverShow": "Non mostrare più"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"didYouLikeMisskey": "Misskeyを気に入っていただけましたか？",
	"pleaseDonate": "Misskeyは{host}が使用している無料のソフトウェアです。これからも開発を続けられるように、ぜひ寄付をお願いします！",
	"learnMore": "詳しく",
	"remindMeLater": "また後で",
	"neverShow": "今後表示しない"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"didYouLikeMisskey": "Misskey気に入ってくれた？",
	"pleaseDonate": "Misskeyは{host}が使うとる無料のソフトウェアやで。これからも開発を続けれるように、寄付したってな～。",
	"learnMore": "詳しく",
	"remindMeLater": "また後で",
	"neverShow": "今後表示しない"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"didYouLikeMisskey": "Tḥemmleḍ Misskey?",
	"pleaseDonate": "{host} iseqdac aseɣẓan ilelli Misskey. Ma tzemrem, efket-d tikci i wakken ad tkemmel tneflit n Misskey!",
	"learnMore": "Issin ugar",
	"remindMeLater": "Ahat ticki",
	"neverShow": "Ur t-id-skan ara tikkelt-nniḍen"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"didYouLikeMisskey": "ನಿಮಗೆ Misskey ಇಷ್ಟವಾಯಿತೇ?",
	"pleaseDonate": "{host} ಉಚಿತ ಸಾಫ್ಟ್‌ವೇರ್ ಆದ Misskeyಯನ್ನು ಬಳಸುತ್ತದೆ. Misskeyಯ ಅಭಿವೃದ್ಧಿ ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ದೇಣಿಗೆ ನೀಡಿ!",
	"learnMore": "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
	"remindMeLater": "ನಂತರ ನೋಡೋಣ",
	"neverShow": "ಮತ್ತೆ ತೋರಿಸಬೇಡಿ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"didYouLikeMisskey": "Misskey가 마음에 드시나요?",
	"pleaseDonate": "Misskey는 {host} 서버의 무료 소프트웨어입니다. 앞으로도 개발을 이어 나가려면 후원이 절실히 필요합니다!",
	"learnMore": "자세히",
	"remindMeLater": "나중에 알림",
	"neverShow": "다시 보지 않기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"didYouLikeMisskey": "Vind je Misskey leuk?",
	"pleaseDonate": "{host} gebruikt de gratis software Misskey. We stellen donaties zeer op prijs, zodat de ontwikkeling van Misskey kan doorgaan!",
	"learnMore": "Meer leren",
	"remindMeLater": "Misschien later",
	"neverShow": "Niet meer tonen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"didYouLikeMisskey": "Likte du Misskey?",
	"pleaseDonate": "{host} bruker den gratis programvaren Misskey. Vi setter stor pris på donasjoner, slik at utviklingen av Misskey kan fortsette!",
	"learnMore": "Les mer",
	"remindMeLater": "Kanskje senere",
	"neverShow": "Ikke vis igjen"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"didYouLikeMisskey": "Czy Misskey się tobie spodobało?",
	"pleaseDonate": "{host} używa darmowego oprogramowania — Misskey. Bylibyśmy bardzo wdzięczni za datki, które pozwolą na kontynuację rozwoju Misskey!",
	"learnMore": "Dowiedz się więcej",
	"remindMeLater": "Przypomnij później",
	"neverShow": "Nie pokazuj ponownie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"didYouLikeMisskey": "Você gostou do Misskey?",
	"pleaseDonate": "O Misskey é um software gratuito utilizado por {host}. Para que possamos continuar o desenvolvimento, pedimos que considerem fazer doações. A sua contribuição é muito importante!",
	"learnMore": "Saiba mais",
	"remindMeLater": "Lembrar mais tarde",
	"neverShow": "Não exibir novamente"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"didYouLikeMisskey": "Вам нравится Misskey?",
	"pleaseDonate": "Сайт {host} работает на Misskey. Это бесплатное программное обеспечение, и ваши пожертвования очень бы помогли продолжать его разработку!",
	"learnMore": "Подробнее",
	"remindMeLater": "Напомнить позже",
	"neverShow": "Больше не показывать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"didYouLikeMisskey": "Páči sa vám Misskey?",
	"pleaseDonate": "Misskey je bezplatný softvér, ktorý používa {host}. Prosím, prispejte, aby sme ho mohli ďalej rozvíjať!",
	"learnMore": "Zistiť viac",
	"remindMeLater": "Pripomenúť neskôr",
	"neverShow": "Nabudúce nezobrazovať"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"didYouLikeMisskey": "คุณชอบ Misskey ไหม?",
	"pleaseDonate": "Misskey เป็นซอฟต์แวร์ฟรีที่ใช้งานโดย {host} เราขอขอบคุณการสนับสนุนของคุณอย่างสูงเพื่อให้การพัฒนา Misskey สามารถดำเนินต่อไปได้!",
	"learnMore": "แสดงให้ดูหน่อย",
	"remindMeLater": "ไว้ครั้งหน้าแล้วกัน",
	"neverShow": "ไม่ต้องแสดงข้อความนี้อีก"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"didYouLikeMisskey": "Misskey'i sevdin mi?",
	"pleaseDonate": "{host} ücretsiz yazılım Misskey kullanmaktadır. Misskey'in geliştirilmesinin devam edebilmesi için bağışlarınızı çok takdir ederiz!",
	"learnMore": "Daha fazla bilgi edinin",
	"remindMeLater": "Belki daha sonra",
	"neverShow": "Bir daha gösterme"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"didYouLikeMisskey": "Misskey نى ياقتۇردىڭىزمۇ؟",
	"pleaseDonate": "{host} ھەقسىز يۇمشاق دېتال Misskey نى ئىشلىتىدۇ. Misskey نىڭ تەرەققىياتىنى داۋاملاشتۇرۇش ئۈچۈن ئىئانە قىلىشىڭىزنى ئۈمىد قىلىمىز!",
	"learnMore": "تېخىمۇ كۆپ بىلىش",
	"remindMeLater": "كېيىنچە",
	"neverShow": "قايتا كۆرسەتمە"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"didYouLikeMisskey": "Вам сподобався Misskey?",
	"pleaseDonate": "{host} використовує вільне програмне забезпечення Misskey. Ми будемо дуже вдячні за ваші донати, щоб розробка Misskey могла тривати!",
	"learnMore": "Докладніше",
	"remindMeLater": "Можливо, пізніше",
	"neverShow": "Більше не показувати"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"didYouLikeMisskey": "Bạn có ưa thích Mískey không?",
	"pleaseDonate": "Misskey là phần mềm miễn phí mà {host} đang sử dụng. Xin mong bạn quyên góp cho chúng tôi để chúng tôi có thể tiếp tục phát triển dịch vụ này. Xin cảm ơn!!",
	"learnMore": "Tìm hiểu thêm",
	"remindMeLater": "Để sau",
	"neverShow": "Không hiển thị nữa"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"didYouLikeMisskey": "您喜欢 Misskey 吗？",
	"pleaseDonate": "Misskey 是 {host} 所使用的免费软件。为了今后也能够维持 Misskey 的开发，请在有余力的情况下进行捐助！",
	"learnMore": "更多信息",
	"remindMeLater": "稍后提醒我",
	"neverShow": "不再显示"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"didYouLikeMisskey": "您喜歡 Misskey 嗎？",
	"pleaseDonate": "Misskey是由{host}使用的免費軟體。請贊助我們，讓開發的工作能夠持續！",
	"learnMore": "更多資訊",
	"remindMeLater": "以後再說",
	"neverShow": "不再顯示"
}
</locale>

<locale lang="json" locale="bn-BD">
{
	"didYouLikeMisskey": "আপনার কি Misskey ভালো লেগেছে?",
	"pleaseDonate": "{host} বিনামূল্যের সফটওয়্যার Misskey ব্যবহার করে। Misskey-এর উন্নয়ন চালিয়ে যেতে আপনার অনুদান আমাদের অনেক সাহায্য করবে!",
	"learnMore": "আরও জানুন",
	"remindMeLater": "পরে মনে করিয়ে দিন",
	"neverShow": "আর দেখাবেন না"
}
</locale>

<locale lang="json" locale="el-GR">
{
	"didYouLikeMisskey": "Σας αρέσει το Misskey;",
	"pleaseDonate": "Το {host} χρησιμοποιεί το δωρεάν λογισμικό Misskey. Θα εκτιμούσαμε ιδιαίτερα τη δωρεά σας, ώστε να συνεχιστεί η ανάπτυξη του Misskey!",
	"learnMore": "Μάθετε περισσότερα",
	"remindMeLater": "Ίσως αργότερα",
	"neverShow": "Να μην εμφανιστεί ξανά"
}
</locale>

<locale lang="json" locale="fa-IR">
{
	"didYouLikeMisskey": "آیا از Misskey خوشتان آمده است؟",
	"pleaseDonate": "{host} از نرم‌افزار رایگان Misskey استفاده می‌کند. با کمک مالی شما می‌توانیم توسعهٔ Misskey را ادامه دهیم!",
	"learnMore": "بیشتر بدانید",
	"remindMeLater": "بعداً یادآوری کن",
	"neverShow": "دیگر نشان نده"
}
</locale>

<locale lang="json" locale="hr-HR">
{
	"didYouLikeMisskey": "Sviđa li vam se Misskey?",
	"pleaseDonate": "{host} koristi besplatni softver Misskey. Bili bismo vrlo zahvalni na vašim donacijama kako bi se razvoj Misskeyja mogao nastaviti!",
	"learnMore": "Saznajte više",
	"remindMeLater": "Možda kasnije",
	"neverShow": "Ne prikazuj ponovno"
}
</locale>

<locale lang="json" locale="ht-HT">
{
	"didYouLikeMisskey": "Èske ou renmen Misskey?",
	"pleaseDonate": "{host} sèvi ak Misskey, yon lojisyèl gratis. Nou ta apresye don ou anpil pou devlopman Misskey kapab kontinye!",
	"learnMore": "Aprann plis",
	"remindMeLater": "Petèt pita",
	"neverShow": "Pa montre sa ankò"
}
</locale>

<locale lang="json" locale="hu-HU">
{
	"didYouLikeMisskey": "Tetszik a Misskey?",
	"pleaseDonate": "{host} az ingyenes Misskey szoftvert használja. Nagyon hálásak lennénk az adományodért, hogy folytatódhasson a Misskey fejlesztése!",
	"learnMore": "További információ",
	"remindMeLater": "Talán később",
	"neverShow": "Ne jelenjen meg újra"
}
</locale>

<locale lang="json" locale="jbo-EN">
{
	"didYouLikeMisskey": "xu do nelci la'o gy. Misskey .gy.",
	"pleaseDonate": "la'o gy. {host} .gy. cu pilno la'o gy. Misskey .gy. noi samru'e gi'e se jdima li no .i .e'o ko dunda lo jdini mi te zu'e lo nu lo nu zbasu la'o gy. Misskey .gy. cu ranji",
	"learnMore": "ko cilre lo zmadu",
	"remindMeLater": "ko ba gasnu lo nu mi morji ti",
	"neverShow": "ko na za'u re'u jarco"
}
</locale>

<locale lang="json" locale="ko-GS">
{
	"didYouLikeMisskey": "Misskey가 맘에 드십니꺼?",
	"pleaseDonate": "Misskey넌 {host}서 서넌 무료 소프트웨어입니다. 앞으로도 개발얼 이을 수 잇도록 후원해 주이소!",
	"learnMore": "더 알아보기",
	"remindMeLater": "나중에 알려 주이소",
	"neverShow": "다시 비이지 않기"
}
</locale>

<locale lang="json" locale="lo-LA">
{
	"didYouLikeMisskey": "ເຈົ້າມັກ Misskey ບໍ່?",
	"pleaseDonate": "{host} ໃຊ້ຊອບແວຟຣີ Misskey. ການບໍລິຈາກຂອງເຈົ້າຈະຊ່ວຍໃຫ້ການພັດທະນາ Misskey ສາມາດດຳເນີນຕໍ່ໄປໄດ້!",
	"learnMore": "ຮຽນຮູ້ເພີ່ມເຕີມ",
	"remindMeLater": "ແຈ້ງເຕືອນຂ້ອຍພາຍຫຼັງ",
	"neverShow": "ບໍ່ຕ້ອງສະແດງອີກ"
}
</locale>

<locale lang="json" locale="ro-RO">
{
	"didYouLikeMisskey": "A început sa îți placa Misskey?",
	"pleaseDonate": "{host} folosește software-ul gratuit, Misskey. Am aprecia foarte mult donațiile dumneavoastră, astfel încât dezvoltarea Misskey să poată continua!",
	"learnMore": "Află mai multe",
	"remindMeLater": "Poate mai târziu",
	"neverShow": "Nu mai afișa"
}
</locale>

<locale lang="json" locale="si-LK">
{
	"didYouLikeMisskey": "ඔබ Misskey වලට කැමතිද?",
	"pleaseDonate": "{host} භාවිත කරන්නේ නොමිලේ ලබා දෙන Misskey මෘදුකාංගයයි. Misskey සංවර්ධනය දිගටම කරගෙන යාමට ඔබගේ පරිත්‍යාග අපට බෙහෙවින් උපකාරී වේ!",
	"learnMore": "තව දැනගන්න",
	"remindMeLater": "පසුව මතක් කරන්න",
	"neverShow": "නැවත නොපෙන්වන්න"
}
</locale>

<locale lang="json" locale="sv-SE">
{
	"didYouLikeMisskey": "Tycker du om Misskey?",
	"pleaseDonate": "Misskey är en gratis programvara som används på {host}. Donera gärna för att göra utvecklingen ständigt, tack!",
	"learnMore": "Läs mer",
	"remindMeLater": "Kanske senare",
	"neverShow": "Visa inte igen"
}
</locale>

<locale lang="json" locale="tl-PH">
{
	"didYouLikeMisskey": "Nagustuhan mo ba ang Misskey?",
	"pleaseDonate": "Ginagamit ng {host} ang libreng software na Misskey. Malaking tulong ang inyong mga donasyon upang maipagpatuloy ang pagbuo ng Misskey!",
	"learnMore": "Alamin pa",
	"remindMeLater": "Ipaalala sa akin mamaya",
	"neverShow": "Huwag nang ipakita muli"
}
</locale>

<locale lang="json" locale="uz-UZ">
{
	"didYouLikeMisskey": "Misskey sizga yoqdimi?",
	"pleaseDonate": "{host} bepul Misskey dasturidan foydalanadi. Misskey rivojlantirilishini davom ettirish uchun xayriyangizdan juda minnatdor bo‘lamiz!",
	"learnMore": "Batafsilroq",
	"remindMeLater": "Balki keyinroq",
	"neverShow": "Boshqa ko‘rsatilmasin"
}
</locale>
