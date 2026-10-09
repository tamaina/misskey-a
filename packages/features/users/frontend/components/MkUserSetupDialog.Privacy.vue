<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ $locale.sfc.theseSettingsCanEditLater }}</MkInfo>

	<MkFolder>
		<template #label>{{ $locale.sfc.makeFollowManuallyApprove }}</template>
		<template #icon><i class="ti ti-lock"></i></template>
		<template #suffix>{{ isLocked ? $locale.sfc.on : $locale.sfc.off }}</template>

		<MkSwitch v-model="isLocked">{{ $locale.sfc.makeFollowManuallyApprove }}<template #caption>{{ $locale.sfc.lockedAccountInfo }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ $locale.sfc.hideOnlineStatus }}</template>
		<template #icon><i class="ti ti-eye-off"></i></template>
		<template #suffix>{{ hideOnlineStatus ? $locale.sfc.on : $locale.sfc.off }}</template>

		<MkSwitch v-model="hideOnlineStatus">{{ $locale.sfc.hideOnlineStatus }}<template #caption>{{ $locale.sfc.hideOnlineStatusDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ $locale.sfc.noCrawle }}</template>
		<template #icon><i class="ti ti-world-x"></i></template>
		<template #suffix>{{ noCrawle ? $locale.sfc.on : $locale.sfc.off }}</template>

		<MkSwitch v-model="noCrawle">{{ $locale.sfc.noCrawle }}<template #caption>{{ $locale.sfc.noCrawleDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ $locale.sfc.preventAiLearning }}</template>
		<template #icon><i class="ti ti-photo-shield"></i></template>
		<template #suffix>{{ preventAiLearning ? $locale.sfc.on : $locale.sfc.off }}</template>

		<MkSwitch v-model="preventAiLearning">{{ $locale.sfc.preventAiLearning }}<template #caption>{{ $locale.sfc.preventAiLearningDescription }}</template></MkSwitch>
	</MkFolder>

	<MkInfo>{{ $locale.sfc.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const isLocked = ref(false);
const hideOnlineStatus = ref(false);
const noCrawle = ref(false);
const preventAiLearning = ref(true);

watch([isLocked, hideOnlineStatus, noCrawle, preventAiLearning], () => {
	misskeyApi('i/update', {
		isLocked: !!isLocked.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
	});
});
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
  "theseSettingsCanEditLater": "يمكنك تغيير هذه الإعدادات لاحقًا.",
  "makeFollowManuallyApprove": "قبول طلبات الإشتراك يدويا",
  "on": "مفعل",
  "off": "معطل",
  "lockedAccountInfo": "ستكون هذه الملاحظة مرئية للجميع مالم تحدد مرئتيها إلى \"للمتابعين فقط\"",
  "hideOnlineStatus": "اخف الحالة",
  "hideOnlineStatusDescription": "قد يؤدي جعل اخفاء حالتك إلى تعطيل أداء بعض الميزات ، مثل البحث.",
  "noCrawle": "ارفض فهرسة زاحف الويب",
  "noCrawleDescription": "يطلب من محركات البحث ألّا يُفهرسوا ملفك الشخصي وملاحظات وصفحاتك وما شابه.",
  "preventAiLearning": "منع استخدام البيانات في تعليم الآلة",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "theseSettingsCanEditLater": "Aquests ajustos es poden canviar més tard.",
  "makeFollowManuallyApprove": "Les sol·licituds de seguiment requereixen aprovació",
  "on": "Activar",
  "off": "Desactivar",
  "lockedAccountInfo": "Tret que establiu la visibilitat de la nota a \"Només seguidors\", les vostres notes seran visibles per qualsevol persona, fins i tot si heu d'aprovar els seguidors manualment",
  "hideOnlineStatus": "Ocultar l'estat de connexió",
  "hideOnlineStatusDescription": "Ocultant el teu estat de connexió redueix les funcionalitats d'algunes funcions com la cerca.",
  "noCrawle": "Rebutjar la indexació dels buscadors",
  "noCrawleDescription": "No permetis que els buscadors indexin el teu perfil, notes, pàgines, etc.",
  "preventAiLearning": "Descartar l'ús d'aprenentatge automàtic (IA Generativa)",
  "preventAiLearningDescription": "Demanar els indexadors no fer servir els texts, imatges, etc. en cap conjunt de dades per alimentar l'aprenentatge automàtic (IA Predictiva/ Generativa). Això s'aconsegueix afegint la etiqueta \"noai\" com a resposta HTML al contingut corresponent. Prevenir aquest ús totalment pot ser que no sigui aconseguit, ja que molts indexadors poden obviar aquesta etiqueta.",
  "youCanEditMoreSettingsInSettingsPageLater": "A més d'això, es poden fer diferents configuracions a través de la pàgina de configuració. Assegureu-vos de comprovar-ho més tard."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "theseSettingsCanEditLater": "Tato nastavení můžete vždy později změnit.",
  "makeFollowManuallyApprove": "Žádosti o sledování vyžadují potvrzení",
  "on": "Zapnuto",
  "off": "Vypnuto",
  "lockedAccountInfo": "Pokud nenastavíte viditelnost poznámek na \"Pouze pro sledující\", budou poznámky viditelné všem i přesto že vyžadujete manuální potvrzení pro sledování.",
  "hideOnlineStatus": "Skrýt Váš online status",
  "hideOnlineStatusDescription": "Skrytí vašeho online stavu může snížit funkcionalitu některých funkcí, například vyhledávání.",
  "noCrawle": "Odmítat indexování crawleru",
  "noCrawleDescription": "Požádat vyhledávače aby neindexovali váš profil, poznámky, stránky, atd.",
  "preventAiLearning": "Odmítnout použití v strojovém učení (Generative AI)",
  "preventAiLearningDescription": "Požaduje, aby prohlížeče nepoužívaly zveřejněný textový nebo obrazový materiál atd. v datových sadách pro strojové učení (prediktivní / generativní umělá inteligence). Toho se dosáhne přidáním příznaku \"noai\" HTML-Response k příslušnému obsahu. Úplné prevence však tímto příznakem nelze dosáhnout, protože může být jednoduše ignorován.",
  "youCanEditMoreSettingsInSettingsPageLater": "Na stránce \"Nastavení\" můžete nakonfigurovat mnoho dalších nastavení. Nezapomeňte ji navštívit později."
}
</locale>

<locale locale="da-DK" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="de-DE" lang="json">
{
  "theseSettingsCanEditLater": "Diese Einstellungen kannst du jederzeit ändern.",
  "makeFollowManuallyApprove": "Follow-Anfragen benötigen Bestätigung",
  "on": "An",
  "off": "Aus",
  "lockedAccountInfo": "Auch wenn du Follow-Anfragen auf manuelle Bestätigung setzt, wird jede deiner Notizen öffentlich sichtbar sein, sofern du ihre Notizsichtbarkeit nicht auf \"Nur Follower\" setzt.",
  "hideOnlineStatus": "Onlinestatus verbergen",
  "hideOnlineStatusDescription": "Das Verbergen deines Onlinestatuses reduziert die Nützlichkeit von Funktionen wie der Suche.",
  "noCrawle": "Crawler-Indexierung ablehnen",
  "noCrawleDescription": "Suchmaschinen bitten, die eigene Profilseite, Notizen, Seiten usw. nicht zu indexieren.",
  "preventAiLearning": "Verwendung in machinellem Lernen (Generative bzw. Prediktive AI/KI) ablehnen",
  "preventAiLearningDescription": "Fordert Crawler auf, gepostetes Text- oder Bildmaterial usw. nicht in Datensätzen für maschinelles Lernen (Generative bzw. Prediktive AI/KI) zu verwenden. Dies wird durch das Hinzufügen einer \"noai\"-Flag in der HTML-Antwort des jeweiligen Inhalts erreicht. Da diese Flag jedoch ignoriert werden kann, ist eine vollständige Verhinderung hierdurch nicht möglich.",
  "youCanEditMoreSettingsInSettingsPageLater": "In den Einstellungen findest du noch viele weitere Optionen. Schau dort später mal vorbei."
}
</locale>

<locale locale="en-US" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="es-ES" lang="json">
{
  "theseSettingsCanEditLater": "Puedes cambiar estos ajustes más tarde.",
  "makeFollowManuallyApprove": "Aprobar manualmente las solicitudes de seguimiento",
  "on": "Activado",
  "off": "Desactivado",
  "lockedAccountInfo": "A menos que configures la visibilidad de tus notas como \"Sólo seguidores\", tus notas serán visibles para cualquiera, incluso si requieres que los seguidores sean aprobados manualmente.",
  "hideOnlineStatus": "Mostrarse como desconectado",
  "hideOnlineStatusDescription": "Ocultar su estado en línea puede reducir la eficacia de algunas funciones, como la búsqueda",
  "noCrawle": "Rechazar indexación del crawler",
  "noCrawleDescription": "Pedir a los motores de búsqueda que no indexen tu perfil, notas, páginas, etc.",
  "preventAiLearning": "Rechazar el uso en el Aprendizaje de Máquinas. (IA Generativa)",
  "preventAiLearningDescription": "Pedirle a las arañas (crawlers) no usar los textos publicados o imágenes en el aprendizaje automático (IA Predictiva / Generativa). Ésto se logra añadiendo una marca respuesta HTML con la cadena \"noai\" al cantenido. Una prevención total no podría lograrse sólo usando ésta marca, ya que puede ser simplemente ignorada.",
  "youCanEditMoreSettingsInSettingsPageLater": "Desde la pestaña de \"Configuración\" puedes modificar más ajustes. Asegúrate de visitarla después."
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Accepter manuellement les demandes d’abonnement",
  "on": "Activé",
  "off": "Désactivé",
  "lockedAccountInfo": "À moins que vous ne définissiez la visibilité de votre note sur \"Abonné-e-s\", vos notes sont visibles par tous, même si vous exigez que les demandes d'abonnement soient approuvées manuellement.",
  "hideOnlineStatus": "Se rendre invisible",
  "hideOnlineStatusDescription": "Rendre votre statut invisible peut diminuer les performances de certaines fonctionnalités, telles que la Recherche.",
  "noCrawle": "Refuser l'indexation par les robots",
  "noCrawleDescription": "Demandez aux moteurs de recherche de ne pas indexer votre page de profil, vos notes, vos pages, etc.",
  "preventAiLearning": "Refuser l'usage dans l'apprentissage automatique d'IA générative",
  "preventAiLearningDescription": "Demander aux robots d'indexation de ne pas utiliser le contenu publié, tel que les notes et les images, dans l'apprentissage automatique d'IA générative. Cela est réalisé en incluant le drapeau « noai » dans la réponse HTML. Une prévention complète n'est toutefois pas possible, car il est au robot d'indexation de respecter cette demande.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="id-ID" lang="json">
{
  "theseSettingsCanEditLater": "Kamu selalu bisa mengganti pengaturan ini lain kali.",
  "makeFollowManuallyApprove": "Permintaan mengikuti butuh persetujuan",
  "on": "Nyala",
  "off": "Mati",
  "lockedAccountInfo": "Kecuali kamu menyetel visibilitas catatan milikmu ke \"Hanya pengikut\", catatan milikmu akan dapat dilihat oleh siapa saja, bahkan jika kamu memerlukan pengikut untuk disetujui secara manual.",
  "hideOnlineStatus": "Sembunyikan status daring",
  "hideOnlineStatusDescription": "Menyembunyikan status daring kamu akan mengurangi kenyamanan untuk beberapa fungsi, seperti contohnya pencarian.",
  "noCrawle": "Tolak pengindeksan perayap web",
  "noCrawleDescription": "Meminta mesin pencari untuk tidak mengindeks halaman profil kamu, catatan, Halaman, dll.",
  "preventAiLearning": "Tolak penggunaan Pembelajaran Mesin (AI Generatif)",
  "preventAiLearningDescription": "Minta perayap web untuk tidak menggunakan materi teks atau gambar yang telah diposting ke dalam set data Pembelajaran Mesin (Prediktif / Generatif). Hal ini dicapai dengan menambahkan flag HTML-Response \"noai\" ke masing-masing konten. Pencegahan penuh mungkin tidak dapat dicapai dengan flag ini, karena juga dapat diabaikan begitu saja.",
  "youCanEditMoreSettingsInSettingsPageLater": "Ada banyak pengaturan yang dapat kamu atur dari halaman \"Pengaturan\". Pastikan untuk mengunjungi halaman tersebut nanti."
}
</locale>

<locale locale="it-IT" lang="json">
{
  "theseSettingsCanEditLater": "In seguito, potrai cambiare la tua scelta.",
  "makeFollowManuallyApprove": "Approva i follower manualmente",
  "on": "Acceso",
  "off": "Spento",
  "lockedAccountInfo": "A meno che non imposti la visibilità delle tue note su \"Solo ai follower\", le tue note sono visibili da tutti, anche se hai configurato l'account per confermare manualmente le richieste di follow.",
  "hideOnlineStatus": "Modalità invisibile",
  "hideOnlineStatusDescription": "Attivando questa opzione potresti ridurre l'usabilità di alcune funzioni, come la ricerca.",
  "noCrawle": "Rifiuta l'indicizzazione dai robot.",
  "noCrawleDescription": "Richiedi che i motori di ricerca non indicizzino la tua pagina di profilo, le tue note, pagine, ecc.",
  "preventAiLearning": "Impedisci l'apprendimento della IA",
  "preventAiLearningDescription": "Aggiungendo il campo \"noai\" alla risposta HTML, si indica ai Robot esterni di non usare testi e allegati per addestrare sistemi di Machine Learning (IA predittiva/generativa). Anche se è impossibile sapere se la richiesta venga onorata o semplicemente ignorata.",
  "youCanEditMoreSettingsInSettingsPageLater": "Nella pagina \"Impostazioni\", è possibile personalizzare di più il tuo profilo. Dacci un'occhiata dopo!"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "theseSettingsCanEditLater": "これらの設定は後から変更できます。",
  "makeFollowManuallyApprove": "フォローを承認制にする",
  "on": "オン",
  "off": "オフ",
  "lockedAccountInfo": "フォローを承認制にしても、ノートの公開範囲を「フォロワー」にしない限り、誰でもあなたのノートを見ることができます。",
  "hideOnlineStatus": "オンライン状態を隠す",
  "hideOnlineStatusDescription": "オンライン状態を隠すと、検索などの一部機能において利便性が低下することがあります。",
  "noCrawle": "クローラーによるインデックスを拒否",
  "noCrawleDescription": "外部の検索エンジンにあなたのユーザーページ、ノート、Pagesなどのコンテンツを登録(インデックス)しないよう要求します。",
  "preventAiLearning": "生成AIによる学習を拒否",
  "preventAiLearningDescription": "外部の文章生成AIや画像生成AIに対して、投稿したノートや画像などのコンテンツを学習の対象にしないように要求します。これはnoaiフラグをHTMLレスポンスに含めることによって実現されますが、この要求に従うかはそのAI次第であるため、学習を完全に防止するものではありません。",
  "youCanEditMoreSettingsInSettingsPageLater": "この他にも様々な設定を「設定」ページから行えます。ぜひ後で確認してみてください。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "theseSettingsCanEditLater": "この設定はあとから変えれるで。",
  "makeFollowManuallyApprove": "ええって言わなフォローできへんようにする",
  "on": "オン",
  "off": "オフ",
  "lockedAccountInfo": "フォローを承認制にしとっても、ノートの公開範囲を「フォロワー」にせぇへん限り、誰でもあんたのノートを見れるで。",
  "hideOnlineStatus": "オンライン状態を隠すで",
  "hideOnlineStatusDescription": "オンライン状態を隠すと、検索とかの一部の機能で使いにくくなるかもしれんよ。",
  "noCrawle": "クローラーによるインデックスを拒否するで",
  "noCrawleDescription": "検索エンジンにあんたのユーザーページ、ノート、Pagesとかのコンテンツを登録(インデックス)せんように頼むで。邪魔すんねんやったら帰って〜。",
  "preventAiLearning": "生成AIの学習に使わんといて",
  "preventAiLearningDescription": "他の文章生成AIとか画像生成AIに、投稿したノートとか画像なんかを勝手に使わんように頼むで。具体的にはnoaiフラグをHTMLレスポンスに含めるんやけど、これ聞いてくれるんはAIの気分次第やから、使われる可能性もちょっとはあるな。",
  "youCanEditMoreSettingsInSettingsPageLater": "これ以外にもいろんな設定を「設定」ページからできるで。後で確認してみてな。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "theseSettingsCanEditLater": "이 설정들은 나중에도 변경할 수 있습니다.",
  "makeFollowManuallyApprove": "팔로우를 수동으로 승인",
  "on": "켜짐",
  "off": "꺼짐",
  "lockedAccountInfo": "팔로우를 승인으로 승인받더라도 노트의 공개 범위를 '팔로워'로 하지 않는 한 누구나 당신의 노트를 볼 수 있습니다.",
  "hideOnlineStatus": "온라인 상태 숨기기",
  "hideOnlineStatusDescription": "온라인 상태를 숨기면, 검색과 같은 일부 기능에 영향을 미칠 수 있습니다.",
  "noCrawle": "검색엔진의 인덱싱 거부",
  "noCrawleDescription": "검색엔진에 유저 페이지, 노트, 페이지 등의 콘텐츠를 인덱싱되지 않게 합니다.",
  "preventAiLearning": "기계학습(생성형 AI)으로의 사용을 거부",
  "preventAiLearningDescription": "외부의 문장 생성 AI나 이미지 생성 AI에 대해 제출한 노트나 이미지 등의 콘텐츠를 학습의 대상으로 사용하지 않도록 요구합니다. 다만, 이 요구사항을 지킬 의무는 없기 때문에 학습을 완전히 방지하는 것은 아닙니다.",
  "youCanEditMoreSettingsInSettingsPageLater": "이 외에도 '설정' 페이지에서 다양한 설정을 나의 입맛에 맞게 조절할 수 있습니다. 꼭 확인해 보세요!"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Volgverzoeken vergen een goedkeuring",
  "on": "Op",
  "off": "Uit",
  "lockedAccountInfo": "Tenzij je de zichtbaarheid van je notities instelt op “Alleen volgers”, zijn je notities zichtbaar voor iedereen, zelfs als je vereist dat volgers handmatig worden goedgekeurd.",
  "hideOnlineStatus": "Online status verbergen",
  "hideOnlineStatusDescription": "Het verbergen van je online status vermindert het nut van functies zoals zoeken.",
  "noCrawle": "Crawler-indexering verwerpen",
  "noCrawleDescription": "Vraag zoekmachines om je eigen profielpagina, notities, pagina's, enz. niet te indexeren.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "theseSettingsCanEditLater": "Du kan endre disse innstillingene senere.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Prośby o możliwość obserwacji wymagają zatwierdzenia",
  "on": "Włączone",
  "off": "Wyłączone",
  "lockedAccountInfo": "Dopóki nie ustawisz widoczności wpisu na \"Obserwujący\", twoje wpisy będą mogli widzieć wszyscy, nawet jeśli ustawisz manualne zatwierdzanie obserwujących.",
  "hideOnlineStatus": "Ukryj status online",
  "hideOnlineStatusDescription": "Ukrywanie statusu online ogranicza wygody niektórych funkcji, tj. wyszukiwanie",
  "noCrawle": "Odrzuć indeksowanie przez crawlery",
  "noCrawleDescription": "Proś wyszukiwarki internetowe, aby nie indeksowały Twojego profilu, wpisów, stron itd.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "theseSettingsCanEditLater": "Você pode alterar estas configurações mais tarde.",
  "makeFollowManuallyApprove": "Pedidos de seguidores precisam ser aprovados",
  "on": "Ligado",
  "off": "Desligado",
  "lockedAccountInfo": "Mesmo que você defina a aprovação para seguir, a menos que você defina o alcance da nota para 'Apenas seguidores', qualquer pessoa poderá ver suas notas.",
  "hideOnlineStatus": "Ocultar o status on-line.",
  "hideOnlineStatusDescription": "Esconder que está Ativo reduzirá a utilidade de certas funções (como, por exemplo, a Pesquisa).",
  "noCrawle": "Recusar indexação por crawler",
  "noCrawleDescription": "Solicitar que os mecanismos de pesquisa externos não indexem o conteúdo de suas páginas de usuário, notas, páginas etc.",
  "preventAiLearning": "Rejeitar uso de Aprendizado de Máquina (IA Generativa)",
  "preventAiLearningDescription": "Solicita-se que o conteúdo de notas e imagens enviadas não seja usado como objeto de aprendizado por sistemas externos de geração de texto ou imagens. Isso é alcançado incluindo a flag 'noai' na resposta HTML. No entanto, o cumprimento dessa solicitação depende do próprio sistema de IA, portanto, não é garantia total de prevenção de aprendizado.",
  "youCanEditMoreSettingsInSettingsPageLater": "Há mais configurações na página \"Configurações\". Não se esqueça de visitá-la mais tarde."
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "theseSettingsCanEditLater": "Вы всегда сможете поменять эти настройки позже.",
  "makeFollowManuallyApprove": "Принимать подписчиков вручную",
  "on": "Вкл.",
  "off": "Выкл.",
  "lockedAccountInfo": "Даже если вы вручную подтверждаете подписки, кто угодно может читать ваши заметки, если вы не отмечаете их «для подписчиков».",
  "hideOnlineStatus": "Скрыть присутствие",
  "hideOnlineStatusDescription": "Сокрытие присутствия делает некоторые функции, такие как поиск, менее удобными.",
  "noCrawle": "Запретить паукам индексировать сайт",
  "noCrawleDescription": "Просьба поисковым системам не ходить по вашему профилю, по заметкам, страницам и не индексировать их.",
  "preventAiLearning": "Отказаться от использования в машинном обучении (Генеративный ИИ)",
  "preventAiLearningDescription": "Запросить краулеров не использовать опубликованный текст или изображения и т.д. для машинного обучения (Прогнозирующий / Генеративный ИИ) датасетов. Это достигается путём добавления \"noai\" HTTP-заголовка в ответ на соответствующий контент. Полного предотвращения через этот заголовок не избежать, так как он может быть просто проигнорирован.",
  "youCanEditMoreSettingsInSettingsPageLater": "Есть ещё много настроек на странице \"Настройки\". Не забудьте заглянуть туда позже."
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Žiadosti o sledovanie treba schváliť",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Pokým nenastavíte viditeľnosť poznámok na \"Len pre sledujúcich\", vaše príspevky bude vidieť hocikto, aj keď vyžadujete manuálne potvrdenie sledovania.",
  "hideOnlineStatus": "Skryť online status",
  "hideOnlineStatusDescription": "Skrytie vášho online statusu zníži pohodlnosť niektorých funkcií ako napríklad vyhľadávanie.",
  "noCrawle": "Odmietať indexovanie crawlerov",
  "noCrawleDescription": "Požiadať vyhľadávače, aby neindexovali váš profil, poznámky, stránky, atď.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="th-TH" lang="json">
{
  "theseSettingsCanEditLater": "คุณสามารถเปลี่ยนการตั้งค่าเหล่านี้ได้ในภายหลังได้ตลอดเวลานะ",
  "makeFollowManuallyApprove": "อนุมัติคำขอติดตามด้วยตนเอง",
  "on": "เปิด",
  "off": "ปิด",
  "lockedAccountInfo": "แม้ว่าการอนุมัติการติดตามถูกเปิดใช้งานอยู่ทุกคนก็ยังคงสามารถเห็นโน้ตของคุณได้ เว้นแต่ว่าคุณจะเปลี่ยนการเปิดเผยโน้ตของคุณเป็น  “เฉพาะผู้ติดตาม”",
  "hideOnlineStatus": "ซ่อนสถานะออนไลน์",
  "hideOnlineStatusDescription": "การซ่อนสถานะออนไลน์อาจทำให้ฟังก์ชันบางอย่าง เช่น การค้นหา สะดวกน้อยลง",
  "noCrawle": "ปฏิเสธการจัดทำดัชนีของ Crawler (โปรแกรมรวบรวมข้อมูล)",
  "noCrawleDescription": "ขอให้เครื่องมือค้นหาไม่จัดทำดัชนีหน้าโปรไฟล์ โน้ต หน้าเพจ ฯลฯ",
  "preventAiLearning": "ปฏิเสธการเรียนรู้ด้วย generative AI",
  "preventAiLearningDescription": "ส่งคำร้องขอไม่ให้ใช้ ข้อความในโน้ตที่โพสต์, หรือเนื้อหารูปภาพ ฯลฯ ในการเรียนรู้ของเครื่อง(machine learning) / Predictive AI / Generative AI โดยการเพิ่มแฟล็ก “noai” ลง HTML-Response ให้กับเนื้อหาที่เกี่ยวข้อง แต่ทั้งนี้ ไม่ได้ป้องกัน AI จากการเรียนรู้ได้อย่างสมบูรณ์ เนื่องจากมี AI บางตัวเท่านั้นที่จะเคารพคำขอดังกล่าว",
  "youCanEditMoreSettingsInSettingsPageLater": "สามารถตั้งค่าเพิ่มเติมได้ที่หน้า “การตั้งค่า” อย่าลืมไปเยี่ยมชมภายหลังด้วย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "theseSettingsCanEditLater": "Bu ayarları daha sonra istediğin zaman değiştirebilirsin.",
  "makeFollowManuallyApprove": "Takip istekleri onay gerektirir",
  "on": "Açık",
  "off": "Kapalı",
  "lockedAccountInfo": "Notunuzun görünürlüğünü “Yalnızca takipçiler” olarak ayarlamadığınız sürece, takipçilerin manuel olarak onaylanmasını gerektirse bile notlarınız herkes tarafından görülebilir.",
  "hideOnlineStatus": "Çevrimiçi durumunu gizle",
  "hideOnlineStatusDescription": "Çevrimiçi durumunuzu gizlemek, arama gibi bazı özelliklerin kullanışlılığını azaltır.",
  "noCrawle": "Tarayıcı indekslemesini reddet",
  "noCrawleDescription": "Arama motorlarından profilinde, notlarında, sayfalarında  vb. dolaşılmamasını ve dizine eklememesini talep et.",
  "preventAiLearning": "Makine Öğreniminde (Üretken Ai) kullanımını reddet",
  "preventAiLearningDescription": "Tarayıcılardan, makine öğrenimi (Tahminsel / Üretken Ai) veri kümelerinde yayınlanan metin veya görsel materyalleri vb. kullanmamalarını talep eder. Bu, ilgili içeriğe “noai” HTML-Response bayrağı eklenerek gerçekleştirilir. Ancak, bu bayrakla tam bir önleme sağlanamaz, çünkü bu bayrak basitçe göz ardı edilebilir.",
  "youCanEditMoreSettingsInSettingsPageLater": "“Ayarlar” sayfasından yapılandırabileceğin daha birçok ayar bulunmaktadır. Daha sonra mutlaka ziyaret et."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "theseSettingsCanEditLater": "You can always change these settings later.",
  "makeFollowManuallyApprove": "Follow requests require approval",
  "on": "On",
  "off": "Off",
  "lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
  "hideOnlineStatus": "Hide online status",
  "hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
  "noCrawle": "Reject crawler indexing",
  "noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
  "preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "theseSettingsCanEditLater": "Ви завжди можете змінити ці налаштування пізніше.",
  "makeFollowManuallyApprove": "Підтверджувати підписників уручну",
  "on": "Увімкнено",
  "off": "Вимкнено",
  "lockedAccountInfo": "Якщо видимість вашого запису не встановлена як \"Тільки підписники\", то кожен зможе побачити ваш запис, навіть якщо ви вимагаєте підтвердження підписок вручну.",
  "hideOnlineStatus": "Приховати онлайн статус.",
  "hideOnlineStatusDescription": "Приховування вашого онлайн-статусу може обмежити зручність деяких функцій, зокрема пошуку.",
  "noCrawle": "Заборонити індексацію",
  "noCrawleDescription": "Просити пошукові системи не індексувати ваш профіль, нотатки, сторінки тощо.",
  "preventAiLearning": "Відхилити використання в машинному навчанні (генеративному ШІ)",
  "preventAiLearningDescription": "Запит до пошукових роботів не використовувати опубліковані тексти, зображення тощо в наборах даних для машинного навчання (прогнозного / генеративного ШІ). Це досягається додаванням HTML-прапорця відповіді «noai» до відповідного вмісту. Однак повного запобігання за допомогою цього прапорця досягти неможливо, оскільки його можуть просто ігнорувати.",
  "youCanEditMoreSettingsInSettingsPageLater": "Є ще багато налаштувань які ви можете змінити у розділу \"Налаштування\". Обов'язково завітайте туди."
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "theseSettingsCanEditLater": "Bạn vẫn có thể thay đổi những cài đặt này.",
  "makeFollowManuallyApprove": "Yêu cầu theo dõi cần được duyệt",
  "on": "Bật",
  "off": "Tắt",
  "lockedAccountInfo": "Ghi chú của bạn sẽ hiển thị với bất kỳ ai, trừ khi bạn đặt chế độ hiển thị tút của mình thành \"Chỉ người theo dõi\".",
  "hideOnlineStatus": "Ẩn trạng thái online",
  "hideOnlineStatusDescription": "Ẩn trạng thái online của bạn làm giảm sự tiện lợi của một số tính năng như tìm kiếm.",
  "noCrawle": "Từ chối lập chỉ mục",
  "noCrawleDescription": "Không cho công cụ tìm kiếm lập chỉ mục trang hồ sơ, tút, Trang, etc.",
  "preventAiLearning": "Từ chối sử dụng công nghệ Máy Học (AI Sáng Tạo)",
  "preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
  "youCanEditMoreSettingsInSettingsPageLater": "Còn rất nhiều những cài đặt khác bạn có thể thay đổi ở trang \"Cài đặt\". Hãy nhớ ghé thăm trong lần sau nhé."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "theseSettingsCanEditLater": "也可以在稍后修改这里的设置。",
  "makeFollowManuallyApprove": "关注请求需要批准",
  "on": "开启",
  "off": "关闭",
  "lockedAccountInfo": "即使启用该功能，只要帖子可见范围不是 “仅关注者”，任何人都可以看到您的帖子。",
  "hideOnlineStatus": "隐藏在线状态",
  "hideOnlineStatusDescription": "隐藏在线状态后，可能会降低搜索等功能的便利性。",
  "noCrawle": "拒绝搜索引擎的索引",
  "noCrawleDescription": "拒绝搜索引擎收录（索引）您的个人资料，帖子，页面等。",
  "preventAiLearning": "拒绝用于训练生成式 AI",
  "preventAiLearningDescription": "要求文章生成 AI 或图像生成 AI 不能够以发布的帖子和图像等内容作为学习对象。这是通过在 HTML 响应中包含 noai 标志来实现的，这不能完全阻止 AI 学习你的发布内容，并不是所有 AI 都会遵守这类请求。",
  "youCanEditMoreSettingsInSettingsPageLater": "还可以在 “设置” 页面进行各种其它设置，稍后来确认一下吧。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "theseSettingsCanEditLater": "這裡的設定可以在之後變更。",
  "makeFollowManuallyApprove": "追隨需要核准",
  "on": "開啟",
  "off": "關閉",
  "lockedAccountInfo": "即使追隨需要核准，除非你將貼文的可見性設定為 「追隨者」，否則任何人都能看見你的貼文。",
  "hideOnlineStatus": "隱藏上線狀態",
  "hideOnlineStatusDescription": "隱藏上線狀態後，可能會降低搜尋等功能的便利性。",
  "noCrawle": "拒絕搜尋引擎索引",
  "noCrawleDescription": "要求網路搜尋引擎不要索引你的個人資料頁、貼文及頁面等。",
  "preventAiLearning": "拒絕接受生成式AI的訓練",
  "preventAiLearningDescription": "要求站外生成式 AI 不使用您發佈的內容訓練模型。此功能會使伺服器於 HTML 回應新增「noai」標籤，而因為要視乎 AI 會否遵守該標籤，所以此功能無法完全阻止所有 AI 使用您的內容。",
  "youCanEditMoreSettingsInSettingsPageLater": "除此之外，還可以在「設定」頁面進行各種設定。之後請確認看看。"
}
</locale>
