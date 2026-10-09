<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkLoading v-if="!loaded"/>
<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" appear>
	<div v-show="loaded" :class="$style.root">
		<img v-if="instance.serverErrorImageUrl" :src="instance.serverErrorImageUrl" draggable="false" :class="$style.img"/>
		<div class="_gaps">
			<div><b><i class="ti ti-alert-triangle"></i> {{ $locale.sfc.pageLoadError }}</b></div>
			<div v-if="meta && (version === meta.version)">{{ $locale.sfc.pageLoadErrorDescription }}</div>
			<div v-else-if="serverIsDead">{{ $locale.sfc.serverIsDead }}</div>
			<template v-else>
				<div>{{ $locale.sfc.newVersionOfClientAvailable }}</div>
				<div>{{ $locale.sfc.youShouldUpgradeClient }}</div>
				<MkButton style="margin: 8px auto;" @click="reload">{{ $locale.sfc.reload }}</MkButton>
			</template>
			<div><MkLink url="https://misskey-hub.net/docs/for-users/resources/troubleshooting/" target="_blank">{{ $locale.sfc.troubleshooting }}</MkLink></div>
			<div v-if="error" style="opacity: 0.7;">ERROR: {{ error }}</div>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { version } from '@features/boot/frontend/shared/config.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { instance } from '@features/instance/frontend/instance.js';

const props = withDefaults(defineProps<{
	error?: Error;
}>(), {
});

const loaded = ref(false);
const serverIsDead = ref(false);
const meta = ref<Misskey.entities.MetaResponse | null>(null);

misskeyApi('meta', {
	detail: false,
}).then(res => {
	loaded.value = true;
	serverIsDead.value = false;
	meta.value = res;
	miLocalStorage.setItem('v', res.version);
}, () => {
	loaded.value = true;
	serverIsDead.value = true;
});

function reload() {
	unisonReload();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.error,
	icon: 'ti ti-alert-triangle',
}));
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 24px;
	border-radius: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"error": "خطأ",
	"pageLoadError": "فشل تحميل الصفحة",
	"pageLoadErrorDescription": "عادة ما يكون السبب خطأ في الشبكة أو التخزين المؤقت للمتصفح. امسح التخزين المؤقت ثم أعد المحاولة لاحقًا.",
	"serverIsDead": "الخادم لا يستجيب، حاول بعد قليل",
	"newVersionOfClientAvailable": "تتوفر نسخة أحدث للعميل",
	"youShouldUpgradeClient": "حدّث الصفحة لعرضها.",
	"reload": "انعش",
	"troubleshooting": "استكشاف الأخطاء وإصلاحها"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"error": "Error",
	"pageLoadError": "S'ha produït un error en carregar la pàgina",
	"pageLoadErrorDescription": "Això normalment és a causa d'errors a la xarxa o a la memòria cau del navegador. Prova d'esborrar la memòria cau i torna-ho a provar després d'esperar un temps.",
	"serverIsDead": "Aquest servidor no respon. Espera una estona i torna-ho a provar.",
	"newVersionOfClientAvailable": "Tens disponible una versió del client més recent.",
	"youShouldUpgradeClient": "Per veure aquesta pàgina, actualitzeu-la per actualitzar el vostre client.",
	"reload": "Actualitzar",
	"troubleshooting": "Solucionar problemes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"error": "Chyba",
	"pageLoadError": "Nepodařilo se načíst stránku",
	"pageLoadErrorDescription": "Tohle je obvykle způsobeno chybou sítě nebo mezipaměti prohlížeče. Zkuste vymazat mezipaměť a po chvíli čekání to zkuste znovu.",
	"serverIsDead": "Server neodpovídá. Počkejte chvíli a zkuste to znovu.",
	"newVersionOfClientAvailable": "Nová verze klienta je k dispozici.",
	"youShouldUpgradeClient": "Pro zobrazení této stránky obnovte stránku pro aktualizaci klienta.",
	"reload": "Aktualizovat",
	"troubleshooting": "Poradce při potížích"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"error": "Error",
	"pageLoadError": "An error occurred while loading the page.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "This server is not responding. Please wait for a while and try again.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"error": "Fehler",
	"pageLoadError": "Die Seite konnte nicht geladen werden.",
	"pageLoadErrorDescription": "Dieser Fehler wird meist durch Netzwerkfehler oder den Browser-Cache verursacht. Bitte leere den Cache oder versuche es nach einiger Zeit erneut.",
	"serverIsDead": "Dieser Server antwortet nicht. Bitte warte einen Moment und versuche es dann erneut.",
	"newVersionOfClientAvailable": "Eine neuere Version deines Clients ist verfügbar.",
	"youShouldUpgradeClient": "Bitte aktualisiere diese Seite, um eine neuere Version deines Clients zu verwenden.",
	"reload": "Aktualisieren",
	"troubleshooting": "Problembehandlung"
}
</locale>

<locale locale="en-US" lang="json">
{
	"error": "Error",
	"pageLoadError": "An error occurred while loading the page.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "This server is not responding. Please wait for a while and try again.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"error": "Error",
	"pageLoadError": "Error al leer la página",
	"pageLoadErrorDescription": "Normalmente es debido a la red o al caché del navegador. Por favor limpie el caché o intente más tarde.",
	"serverIsDead": "No hay respuesta del servidor. Espera un momento y vuelve a intentarlo.",
	"newVersionOfClientAvailable": "Hay una versión más nueva de su cliente disponible.",
	"youShouldUpgradeClient": "Para ver esta página, recarga el navegador para actualizar el cliente.",
	"reload": "Recargar",
	"troubleshooting": "Solución de problemas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"error": "Erreur",
	"pageLoadError": "Le chargement de la page a échoué",
	"pageLoadErrorDescription": "Cela est généralement causé par le cache du navigateur ou par un problème réseau. Veuillez vider votre cache ou attendre un peu et réessayer.",
	"serverIsDead": "Le serveur ne répond pas. Patientez quelques instants puis essayez à nouveau.",
	"newVersionOfClientAvailable": "Une nouvelle version de votre client est disponible.",
	"youShouldUpgradeClient": "Si la page ne s'affiche pas correctement, rechargez-la pour mettre votre client à jour.",
	"reload": "Rafraîchir",
	"troubleshooting": "Résolution de problèmes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"error": "Galat",
	"pageLoadError": "Gagal memuat halaman.",
	"pageLoadErrorDescription": "Umumnya disebabkan jaringan atau tembolok peramban. Cobalah bersihkan tembolok peramban lalu tunggu sesaat sebelum mencoba kembali.",
	"serverIsDead": "Tidak ada respon dari peladen. Mohon tunggu dan coba beberapa saat lagi.",
	"newVersionOfClientAvailable": "Versi terbaru dari klien kamu telah tersedia.",
	"youShouldUpgradeClient": "Untuk melihat halaman ini, mohon muat ulang untuk memutakhirkan klienmu.",
	"reload": "Muat ulang",
	"troubleshooting": "Penyelesaian Masalah"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"error": "Errore",
	"pageLoadError": "Caricamento pagina non riuscito. ",
	"pageLoadErrorDescription": "Questo problema viene normalmente causato da errori di rete o dalla cache del browser. Si prega di pulire la cache, o di attendere e riprovare più tardi.",
	"serverIsDead": "Il server non risponde. Si prega di attendere e riprovare più tardi.",
	"newVersionOfClientAvailable": "Una nuova versione del tuo client è disponibile.",
	"youShouldUpgradeClient": "Per visualizzare la pagina è necessario aggiornare il client alla nuova versione e ricaricare.",
	"reload": "Ricarica",
	"troubleshooting": "Risoluzione problemi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"error": "エラー",
	"pageLoadError": "ページの読み込みに失敗しました。",
	"pageLoadErrorDescription": "これは通常、ネットワークまたはブラウザキャッシュが原因です。キャッシュをクリアするか、しばらく待ってから再度試してください。",
	"serverIsDead": "サーバーの応答がありません。しばらく待ってから再度試してください。",
	"newVersionOfClientAvailable": "新しいバージョンのクライアントが利用可能です。",
	"youShouldUpgradeClient": "このページを表示するためには、リロードして新しいバージョンのクライアントをご利用ください。",
	"reload": "リロード",
	"troubleshooting": "トラブルシューティング"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"error": "おかしなったで",
	"pageLoadError": "ページが読み込めんかったわ。",
	"pageLoadErrorDescription": "これは普通ならネットワークかブラウザキャッシュが悪さしてるんよ。キャッシュをほかすか、もうちょっとだけ待ってくれへん？",
	"serverIsDead": "サーバーからの応答がないで。もうちょい待ってから試してみてな。",
	"newVersionOfClientAvailable": "新しいバージョンのクライアントが使えるで。",
	"youShouldUpgradeClient": "このページを表示するには、リロードして新しいバージョンのクライアントを使ってなー。",
	"reload": "リロード",
	"troubleshooting": "トラブルシューティング"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"error": "Error",
	"pageLoadError": "An error occurred while loading the page.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "This server is not responding. Please wait for a while and try again.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"error": "Error",
	"pageLoadError": "An error occurred while loading the page.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "This server is not responding. Please wait for a while and try again.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"error": "오류",
	"pageLoadError": "페이지를 불러오지 못했습니다.",
	"pageLoadErrorDescription": "네트워크 연결 또는 브라우저 캐시로 인해 발생했을 가능성이 높습니다. 캐시를 삭제하거나, 잠시 후 다시 시도해 주세요.",
	"serverIsDead": "서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.",
	"newVersionOfClientAvailable": "새로운 버전의 클라이언트를 이용할 수 있습니다.",
	"youShouldUpgradeClient": "이 페이지를 표시하려면 새로고침하여 새로운 버전의 클라이언트를 이용해 주십시오.",
	"reload": "새로고침",
	"troubleshooting": "문제 해결"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"error": "Fout",
	"pageLoadError": "Pagina laden mislukt",
	"pageLoadErrorDescription": "Dit wordt normaal gesproken veroorzaakt door netwerkfouten of door de cache van de browser. Probeer de cache te wissen en probeer het na een tijdje wachten opnieuw.",
	"serverIsDead": "De server reageert niet. Wacht even en probeer het opnieuw.",
	"newVersionOfClientAvailable": "Er is een nieuwere versie van je client beschikbaar.",
	"youShouldUpgradeClient": "Werk je client bij om deze pagina te zien.",
	"reload": "Verversen",
	"troubleshooting": "Probleemoplossing"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"error": "Feil",
	"pageLoadError": "Kunne ikke hente side.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "Denne serveren svarer ikke. Vennligst vent en stund og prøv igjen.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"error": "Błąd",
	"pageLoadError": "Nie udało się załadować strony",
	"pageLoadErrorDescription": "Zwykle jest to spowodowane problemem z siecią lub cache przeglądarki. Spróbuj wyczyścić cache i sprawdź jeszcze raz za chwilę.",
	"serverIsDead": "Serwer nie odpowiada. Zaczekaj chwilę i spróbuj ponownie.",
	"newVersionOfClientAvailable": "Nowsza wersja klienta jest dostępna.",
	"youShouldUpgradeClient": "Odśwież stronę, by zaaktualizować klienta.",
	"reload": "Odśwież",
	"troubleshooting": "Rozwiązywanie problemów"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"error": "Erro",
	"pageLoadError": "Ocorreu um erro ao carregar a página.",
	"pageLoadErrorDescription": "Isso geralmente acontece devido ao cache do navegador ou da rede. Tente limpar o cache ou aguarde um pouco antes de tentar novamente.",
	"serverIsDead": "Não há resposta do servidor. Aguarde um momento e tente novamente.",
	"newVersionOfClientAvailable": "Nova versão do cliente disponível",
	"youShouldUpgradeClient": "Para visualizar esta página, recarregue-a e utilize a nova versão do cliente.",
	"reload": "Recarregar",
	"troubleshooting": "Resolução de problemas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"error": "Ошибка",
	"pageLoadError": "Не удалось загрузить страницу",
	"pageLoadErrorDescription": "Обычно это случается из-за сбоев в сети или кэша браузера. Попробуйте очистить кэш, или подождать пару минут, а потом попытаться загрузить страницу снова.",
	"serverIsDead": "Ответа от сервера нет. Пожалуйста, подождите немного и повторите попытку.",
	"newVersionOfClientAvailable": "Доступна более свежая версия клиента.",
	"youShouldUpgradeClient": "Чтобы просмотреть эту страницу, пожалуйста, обновите ее.",
	"reload": "Перезагрузить",
	"troubleshooting": "Разрешение проблем"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"error": "Chyba",
	"pageLoadError": "Nepodarilo sa načítať stránku",
	"pageLoadErrorDescription": "Toto môže byť spôsobené problémami so sieťou alebo cachou prehliadača. Skúste vyčistiť cache a potom skúsiť znova po chvíli.",
	"serverIsDead": "Tento server nereaguje. Prosím chvíľu počkajte a skúste znova.",
	"newVersionOfClientAvailable": "Je dostupná novšia verzia vášho klienta.",
	"youShouldUpgradeClient": "Na pozretie tejto stránky prosím obnovte svojho klienta.",
	"reload": "Obnoviť",
	"troubleshooting": "Riešenie problémov"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"error": "ผิดพลาด!",
	"pageLoadError": "เกิดข้อผิดพลาดในการโหลดหน้านี้",
	"pageLoadErrorDescription": "ปัญหานี้มักเกิดจากแคชของเครือข่ายหรือเบราว์เซอร์ ควรล้างแคช, รอสักครู่ แล้วลองใหม่อีกครั้ง",
	"serverIsDead": "เซิร์ฟเวอร์นี้ไม่มีการตอบสนอง โปรดกรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
	"newVersionOfClientAvailable": "มีไคลเอ็นต์เวอร์ชันใหม่กว่าของคุณพร้อมใช้งานนะ",
	"youShouldUpgradeClient": "หากต้องการดูหน้านี้ กรุณาโหลดหน้าใหม่เพื่ออัปเดตไคลเอ็นต์ของคุณ",
	"reload": "รีโหลด",
	"troubleshooting": "แก้ปัญหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"error": "Hata",
	"pageLoadError": "Sayfa yüklenirken bir hata oluştu.",
	"pageLoadErrorDescription": "Bu durum genellikle ağ hataları veya tarayıcının önbelleği nedeniyle oluşur. Önbelleği temizleyin ve bir süre bekledikten sonra tekrar dene.",
	"serverIsDead": "Bu sunucu yanıt vermiyor. Lütfen bir süre bekleyin ve tekrar dene.",
	"newVersionOfClientAvailable": "İstemcinin daha yeni bir sürümü var.",
	"youShouldUpgradeClient": "Bu sayfayı görüntülemek için lütfen yenileyerek istemcini güncelle.",
	"reload": "Yenile",
	"troubleshooting": "Sorun Giderme"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"error": "Error",
	"pageLoadError": "An error occurred while loading the page.",
	"pageLoadErrorDescription": "This is normally caused by network errors or the browser's cache. Try clearing the cache and then try again after waiting a little while.",
	"serverIsDead": "This server is not responding. Please wait for a while and try again.",
	"newVersionOfClientAvailable": "There is a newer version of your client available.",
	"youShouldUpgradeClient": "To view this page, please refresh to update your client.",
	"reload": "Refresh",
	"troubleshooting": "Troubleshooting"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"error": "Помилка",
	"pageLoadError": "Помилка при завантаженні сторінки",
	"pageLoadErrorDescription": "Зазвичай це пов’язано з помилками мережі або кешем браузера. Очистіть кеш або почекайте трохи й спробуйте ще раз.",
	"serverIsDead": "Відповіді від сервера немає. Зачекайте деякий час і повторіть спробу.",
	"newVersionOfClientAvailable": "Доступніша свіжа версія клієнта.",
	"youShouldUpgradeClient": "Перезавантажте та використовуйте нову версію клієнта, щоб переглянути цю сторінку.",
	"reload": "Оновити",
	"troubleshooting": "Усунення проблем"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"error": "Lỗi",
	"pageLoadError": "Xảy ra lỗi khi tải trang.",
	"pageLoadErrorDescription": "Có thể là do bộ nhớ đệm của trình duyệt. Hãy thử xóa bộ nhớ đệm và thử lại sau ít phút.",
	"serverIsDead": "Máy chủ không phản hồi. Vui lòng thử lại sau giây lát.",
	"newVersionOfClientAvailable": "Có phiên bản mới cho bạn cập nhật.",
	"youShouldUpgradeClient": "Để xem trang này, hãy làm tươi để cập nhật ứng dụng.",
	"reload": "Tải lại",
	"troubleshooting": "Khắc phục sự cố"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"error": "错误",
	"pageLoadError": "页面加载失败。",
	"pageLoadErrorDescription": "这通常是由于网络或浏览器缓存的原因。请清除缓存或等待片刻后重试。",
	"serverIsDead": "服务器未响应。 请稍后再试。",
	"newVersionOfClientAvailable": "新版本的客户端可用。",
	"youShouldUpgradeClient": "请刷新并使用新版本客户端查看此页面。",
	"reload": "刷新",
	"troubleshooting": "故障排除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"error": "錯誤",
	"pageLoadError": "無法載入頁面。",
	"pageLoadErrorDescription": "這通常是網路錯誤或瀏覽器快取殘留而引起的。請先清除瀏覽器快取，稍後再重試。",
	"serverIsDead": "伺服器沒有回應。請稍等片刻再試。",
	"newVersionOfClientAvailable": "新版本的客戶端可用。",
	"youShouldUpgradeClient": "請重新載入以使用新版客戶端顯示此頁面。",
	"reload": "重新整理",
	"troubleshooting": "故障排除"
}
</locale>
