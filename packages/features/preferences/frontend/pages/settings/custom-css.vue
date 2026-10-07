<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ $locale.sfc.customCssWarn }}</FormInfo>

	<FormInfo v-if="isSafeMode" warn>{{ $locale.sfc.customCssIsDisabledBecauseSafeMode }}</FormInfo>

	<MkCodeEditor v-model="localCustomCss" manualSave lang="css">
		<template #label>CSS</template>
	</MkCodeEditor>
</div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';
import { isSafeMode } from '@features/boot/frontend/shared/config.js';
import * as os from '@features/ui/frontend/os.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';

const localCustomCss = ref(miLocalStorage.getItem('customCss') ?? '');

async function apply() {
	miLocalStorage.setItem('customCss', localCustomCss.value);

	const { canceled } = await os.confirm({
		type: 'info',
		text: $locale.value.sfc.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

watch(localCustomCss, async () => {
	await apply();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.customCss,
	icon: 'ti ti-code',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"customCssWarn": "استخدم هذه الإعداد فقط إن كان لك علم بماهيّته. إدخال قيمة غير مناسبة سيسسب ضررًا للعميل.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "سيُطبق هذا الإعداد بعد إعادة تحميل الصفحة، أتريد إعادة تحميلها الآن؟",
	"customCss": "CSS مخصصة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"customCssWarn": "Aquesta configuració només hauries de configurar-la si saps que fas. Si poses valors inadequats pots fer que el client deixi de funcionar correctament.",
	"customCssIsDisabledBecauseSafeMode": "El CSS personalitzat no s'aplica perquè el mode segur es troba activat.",
	"reloadToApplySetting": "Aquest ajust només s'aplicarà després de recarregar la pàgina. Vols fer-ho ara?",
	"customCss": "CSS personalitzat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"customCssWarn": "Tohle nastavení by mělo být použito pouze v případě pokud víte co děláte. Vložením nesprávných hodnot může způsobit nefunkčnost klienta.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Tohle nastavení se použije až po obnovení stránky. Obnovit teď?",
	"customCss": "Vlastní CSS"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"customCssWarn": "Verwende diese Einstellung nur, wenn du weißt, was sie tut. Ungültige Eingaben können dazu führen, dass der Client nicht mehr normal funktioniert.",
	"customCssIsDisabledBecauseSafeMode": "Da der abgesicherte Modus aktiviert ist, wird benutzerdefiniertes CSS nicht angewendet.",
	"reloadToApplySetting": "Diese Einstellung tritt nach einer Aktualisierung der Seite in Kraft. Jetzt aktualisieren?",
	"customCss": "Benutzerdefiniertes CSS"
}
</locale>

<locale locale="en-US" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"customCssWarn": "Este ajuste sólo debe utilizarse si se sabe lo que hace. Introducir valores inadecuados puede hacer que el cliente deje de funcionar con normalidad.",
	"customCssIsDisabledBecauseSafeMode": "El modo seguro está activado, por lo que no se aplica el CSS personalizado.",
	"reloadToApplySetting": "Esta configuración sólo se aplicará después de recargar la página. ¿Recargar ahora?",
	"customCss": "CSS personalizado"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"customCssWarn": "Utilisez cette fonctionnalité uniquement si vous savez exactement ce que vous faites. Une configuration inadaptée peut empêcher le client de s'exécuter normalement.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Vos paramètres seront appliqués lorsque vous rechargerez la page. Souhaitez-vous recharger ?",
	"customCss": "CSS personnalisé"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"customCssWarn": "Pengaturan ini seharusnya digunakan jika kamu tahu cara kerjanya. Memasukkan nilai yang tidak tepat dapat menyebabkan klien tidak berfungsi semestinya.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Pengaturan ini akan diterapkan saat memuat halaman kembali. Apakah kamu ingin memuat halaman kembali sekarang?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"customCssWarn": "Questa impostazione deve essere eseguita da una persona esperta. Una configurazione errata può impedire al client di utilizzare correttamente il sistema.",
	"customCssIsDisabledBecauseSafeMode": "Il CSS personalizzato non è stato applicato, poiché la modalità sicura è attiva.",
	"reloadToApplySetting": "Le tue preferenze verranno impostate dopo il ricaricamento della pagina. Vuoi ricaricare adesso?",
	"customCss": "CSS personalizzato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"customCssWarn": "この設定は必ず知識のある方が行ってください。不適切な設定を行うとクライアントが正常に使用できなくなる恐れがあります。",
	"customCssIsDisabledBecauseSafeMode": "セーフモードが有効なため、カスタムCSSは適用されていません。",
	"reloadToApplySetting": "設定はページリロード後に反映されます。",
	"customCss": "カスタムCSS"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"customCssWarn": "この設定は必ず知識のある人がやらなあかんで。あんま良くない設定をしたるとクライアントがちゃんと使えへんくなってくで。",
	"customCssIsDisabledBecauseSafeMode": "セーフモードがオンやから、カスタムCSSは適用されてへんで。",
	"reloadToApplySetting": "設定はページリロード後に反映されるで。今リロードしとくか？",
	"customCss": "カスタムCSS"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"customCssWarn": "이 설정은 기능을 알고 있는 경우에만 사용해야 합니다. 잘못된 값을 입력하면 클라이언트가 정상적으로 작동하지 않을 수 있습니다.",
	"customCssIsDisabledBecauseSafeMode": "세이프 모드가 활성화돼있기에 커스텀 CSS는 적용되지 않습니다.",
	"reloadToApplySetting": "이 설정을 적용하려면 페이지를 새로고침해야 합니다. 바로 새로고침하시겠습니까?",
	"customCss": "CSS 사용자화"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"customCssWarn": "Gebruik deze instelling alleen als je weet wat het doet. Ongeldige invoer kan ertoe leiden dat de client niet meer normaal functioneert.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Deze instelling gaat pas in nadat de pagina herladen is. Nu herladen?",
	"customCss": "Aangepaste CSS"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"customCssWarn": "Używaj tego ustawienia tylko wtedy, gdy wiesz co ono robi. Nieprawidłowe wpisy mogą spowodować, że klient przestanie działać poprawnie.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "To ustawienie zostanie zastosowane po odświeżeniu strony. Chcesz odświeżyć?",
	"customCss": "Własny CSS"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"customCssWarn": "Esta configuração só deve ser usada se souber o que está fazendo. Valores impróprios podem causar erros no funcionamento do cliente.",
	"customCssIsDisabledBecauseSafeMode": "CSS personalizado não está aplicado porque o modo seguro está habilitado.",
	"reloadToApplySetting": "As configurações serão refletidas após recarregar a página. Deseja recarregar agora?",
	"customCss": "CSS Personalizado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"customCssWarn": "Используйте эту настройку только если знаете, что делаете. Ошибки здесь чреваты тем, что у вас перестанет нормально работать сайт.",
	"customCssIsDisabledBecauseSafeMode": "Пользовательский CSS не применяется из-за безопасного режима.",
	"reloadToApplySetting": "Это настройка вступает в силу при загрузке страницы. Перезагрузить сейчас?",
	"customCss": "Пользовательский CSS"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"customCssWarn": "Toto nastavenie by sa malo používať iba ak viete čo robíte. Zadanie nesprávnych hodnôt môže spôsobiť nenormálne správanie klienta.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Toto nastavenia sa prejaví až po obnovení stránky. Obnoviť teraz?",
	"customCss": "Vlastné CSS"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"customCssWarn": "ควรใช้การตั้งค่านี้เฉพาะต่อเมื่อคุณรู้มันใช้ทำอะไร การตั้งค่าที่ไม่เหมาะสมอาจทำให้ไคลเอ็นต์ไม่สามารถใช้งานได้อย่างถูกต้อง",
	"customCssIsDisabledBecauseSafeMode": "เนื่องจากโหมดปลอดภัยถูกเปิดใช้งาน CSS แบบกำหนดเองจึงไม่ได้ถูกนำมาใช้",
	"reloadToApplySetting": "การตั้งค่านี้จะมีผลหลังจากโหลดหน้าซ้ำเท่านั้น ต้องการที่จะโหลดใหม่เลยไหม?",
	"customCss": "CSS แบบกำหนดเอง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"customCssWarn": "Bu ayar, yalnızca ne işe yaradığını biliyorsanız kullanılmalıdır. Yanlış değerler girilmesi, istemcinin normal şekilde çalışmamasına neden olabilir.",
	"customCssIsDisabledBecauseSafeMode": "Güvenli mod etkin olduğu için özel CSS uygulanmıyor.",
	"reloadToApplySetting": "Bu ayar, sayfa yeniden yüklendikten sonra geçerli olacaktır. Şimdi yeniden yüklemek ister misin?",
	"customCss": "Özel CSS"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"customCssWarn": "This setting should only be used if you know what it does. Entering improper values may cause the client to stop functioning normally.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "This setting will only apply after a page reload. Reload now?",
	"customCss": "Custom CSS"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"customCssWarn": "Використовуйте це налаштування лише якщо розумієте, що воно робить. Неправильні значення можуть призвести до некоректної роботи клієнта.",
	"customCssIsDisabledBecauseSafeMode": "Користувацький CSS не застосовується, оскільки ввімкнено безпечний режим.",
	"reloadToApplySetting": "Налаштування ввійде в дію при перезавантаженні. Перезавантажити?",
	"customCss": "Власний CSS"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"customCssWarn": "Chỉ sử dụng những cài đặt này nếu bạn biết rõ về nó. Việc nhập các giá trị không đúng có thể khiến máy chủ hoạt động không bình thường.",
	"customCssIsDisabledBecauseSafeMode": "Custom CSS is not applied because safe mode is enabled.",
	"reloadToApplySetting": "Cài đặt này sẽ chỉ áp dụng sau khi tải lại trang. Tải lại ngay bây giờ?",
	"customCss": "Tùy chỉnh CSS"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"customCssWarn": "这些设置必须有相关的基础知识，不当的配置可能导致客户端无法正常使用。",
	"customCssIsDisabledBecauseSafeMode": "因启用了安全模式，无法应用自定义 CSS。",
	"reloadToApplySetting": "页面刷新后设置才会生效。是否现在刷新页面？",
	"customCss": "自定义 CSS"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"customCssWarn": "這個設定必須由具備相關知識的人員操作，不當的設定可能導致客戶端無法正常使用。",
	"customCssIsDisabledBecauseSafeMode": "由於啟用安全模式，所有的客製 CSS 都被停用。",
	"reloadToApplySetting": "設定將會在頁面重新載入之後生效。要現在就重載頁面嗎？",
	"customCss": "自定義 CSS"
}
</locale>
