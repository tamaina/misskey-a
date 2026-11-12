<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ $locale.sfc.pluginInstallWarn }}</FormInfo>

	<MkCodeEditor v-model="code" lang="is">
		<template #label>{{ $locale.sfc.code }}</template>
	</MkCodeEditor>

	<div>
		<MkButton :disabled="code == null || code.trim() === ''" primary inline @click="install"><i class="ti ti-check"></i> {{ globalLocale.env.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { nextTick, ref, computed } from 'vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { installPlugin } from '@features/integrations/frontend/plugin.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();
const code = ref<string | null>(null);

async function install() {
	if (!code.value) return;

	try {
		await installPlugin(code.value);
		os.success();
		code.value = null;

		router.push('/settings/plugin');
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: 'Install failed',
			text: err.toString() ?? null,
		});
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.pluginInstall,
	icon: 'ti ti-download',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"pluginInstallWarn": "رجاءً لا تثبت إضافات غير موثوقة.",
	"code": "Code",
	"pluginInstall": "ثبّت إضافات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pluginInstallWarn": "Si us plau, no instal·lis extensions que no siguin de confiança.",
	"code": "Codi",
	"pluginInstall": "Instal·lar un afegit "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pluginInstallWarn": "Neinstalujte nedůvěryhodné pluginy.",
	"code": "Code",
	"pluginInstall": "Instalovat plugin"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pluginInstallWarn": "Installiere bitte nur vertrauenswürdige Plugins.",
	"code": "Code",
	"pluginInstall": "Plugins installieren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pluginInstallWarn": "Por favor no instale plugins que no son de confianza",
	"code": "Código",
	"pluginInstall": "Instalar plugins"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pluginInstallWarn": "N’installez que des extensions provenant de sources de confiance.",
	"code": "Code",
	"pluginInstall": "Installation d'extensions"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pluginInstallWarn": "Mohon jangan memasang plugin yang tidak dapat dipercayai.",
	"code": "Kode",
	"pluginInstall": "Memasang plugin"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pluginInstallWarn": "Si prega di installare soltanto estensioni che provengono da fonti affidabili.",
	"code": "Codice",
	"pluginInstall": "Installa estensioni"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pluginInstallWarn": "信頼できないプラグインはインストールしないでください。",
	"code": "コード",
	"pluginInstall": "プラグインのインストール"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pluginInstallWarn": "信頼できへんプラグインはインストールせんとってな",
	"code": "コード",
	"pluginInstall": "プラグインのインストール"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pluginInstallWarn": "신뢰할 수 없는 플러그인은 설치하지 않는 것이 좋습니다.",
	"code": "문자열",
	"pluginInstall": "플러그인 설치"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pluginInstallWarn": "Nie instaluj niezaufanych wtyczek.",
	"code": "Code",
	"pluginInstall": "Zainstaluj wtyczki"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pluginInstallWarn": "Por favor, não instale plugins duvidosos.",
	"code": "Código",
	"pluginInstall": "Instalar plugins"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pluginInstallWarn": "Пожалуйста, не устанавливайте расширения, которым не доверяете.",
	"code": "Код",
	"pluginInstall": "Установка расширений"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pluginInstallWarn": "Prosím neinštalujte nedôveryhodné pluginy.",
	"code": "Code",
	"pluginInstall": "Inštalova pluginy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pluginInstallWarn": "กรุณาอย่าติดตั้งปลั๊กอินที่ไม่น่าเชื่อถือนะคะ",
	"code": "โค้ด",
	"pluginInstall": "ติดตั้งปลั๊กอิน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pluginInstallWarn": "Güvenilir olmayan eklentileri yükleme.",
	"code": "Kod",
	"pluginInstall": "Eklentileri yükle takip isteği aldınız"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pluginInstallWarn": "Please do not install untrustworthy plugins.",
	"code": "Code",
	"pluginInstall": "Install plugins"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pluginInstallWarn": "Будь ласка, не встановлюйте плагінів, яким ви не довіряєте.",
	"code": "Код",
	"pluginInstall": "Встановити плагін"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pluginInstallWarn": "Vui lòng không cài đặt những tiện ích đáng ngờ.",
	"code": "Code",
	"pluginInstall": "Cài đặt tiện ích"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pluginInstallWarn": "请不要安装不可信的插件。",
	"code": "代码",
	"pluginInstall": "安装插件"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pluginInstallWarn": "請不要安裝來源不明的外掛。",
	"code": "程式碼",
	"pluginInstall": "安裝外掛組件"
}
</locale>
