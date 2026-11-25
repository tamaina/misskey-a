<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/plugin" :label="$locale.sfc.plugins" :keywords="['plugin', 'addon', 'extension']" icon="ti ti-plug">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f50c.png" color="#ffbb00">
			<SearchText>{{ $locale.sfc.settingsPluginBanner }}</SearchText>
		</MkFeatureBanner>

		<MkInfo v-if="isSafeMode" warn>{{ $locale.sfc.pluginsAreDisabledBecauseSafeMode }}</MkInfo>

		<FormLink v-else to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ $locale.sfc.pluginInstall }}</FormLink>

		<FormSection>
			<template #label>{{ $locale.sfc.manage }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="plugin in plugins" :key="plugin.installId">
					<template #icon><i class="ti ti-plug"></i></template>
					<template #suffix>
						<i v-if="plugin.active" class="ti ti-player-play" style="color: var(--MI_THEME-success);"></i>
						<i v-else class="ti ti-player-pause" style="opacity: 0.7;"></i>
					</template>
					<template #label>
						<div :style="plugin.active ? '' : 'opacity: 0.7;'">
							{{ plugin.name }}
							<span style="margin-left: 1em; opacity: 0.7;">v{{ plugin.version }}</span>
						</div>
					</template>
					<template #caption>
						{{ plugin.description }}
					</template>
					<template #footer>
						<div class="_buttons">
							<MkButton :disabled="!plugin.active" @click="reload(plugin)"><i class="ti ti-refresh"></i> {{ globalLocale.env.reload }}</MkButton>
							<MkButton danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ $locale.sfc.uninstall }}</MkButton>
							<MkButton v-if="plugin.config" style="margin-left: auto;" @click="config(plugin)"><i class="ti ti-settings"></i> {{ globalLocale.env.settings }}</MkButton>
						</div>
					</template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<MkSwitch :modelValue="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ $locale.sfc.makeActive }}</MkSwitch>
						</div>

						<div class="_gaps_s">
							<MkKeyValue>
								<template #key>{{ $locale.sfc.author }}</template>
								<template #value>{{ plugin.author }}</template>
							</MkKeyValue>
							<MkKeyValue>
								<template #key>{{ globalLocale.env.description }}</template>
								<template #value>{{ plugin.description }}</template>
							</MkKeyValue>
							<MkKeyValue>
								<template #key>{{ globalLocale.env.permission }}</template>
								<template #value>
									<ul style="margin-top: 0; margin-bottom: 0;">
										<li v-for="permission in plugin.permissions" :key="permission">{{ (copyLocaleDictionary(globalLocale.env._permissions) as Record<string, string>)[permission] ?? permission }}</li>
										<li v-if="!plugin.permissions || plugin.permissions.length === 0">{{ globalLocale.env.none }}</li>
									</ul>
								</template>
							</MkKeyValue>
						</div>

						<div class="_gaps_s">
							<MkFolder>
								<template #icon><i class="ti ti-terminal-2"></i></template>
								<template #label>{{ $locale.sfc.logs }}</template>

								<div>
									<div v-for="log in pluginLogs.get(plugin.installId)" :class="[$style.log, { [$style.isSystemLog]: log.isSystem }]">
										<div class="_monospace">{{ timeToHhMmSs(log.at) }} {{ log.message }}</div>
									</div>
								</div>
							</MkFolder>

							<MkFolder :withSpacer="false">
								<template #icon><i class="ti ti-code"></i></template>
								<template #label>{{ $locale.sfc.pluginViewSource }}</template>

								<div class="_gaps_s">
									<MkCode :code="plugin.src ?? ''" lang="ais"/>
								</div>
							</MkFolder>
						</div>
					</div>
				</MkFolder>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { nextTick, ref, computed } from 'vue';
import { isSafeMode } from '@features/boot/frontend/shared/config.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { changePluginActive, configPlugin, pluginLogs, uninstallPlugin, reloadPlugin } from '@features/integrations/frontend/plugin.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import * as os from '@features/ui/frontend/os.js';
import type { Plugin } from '@features/integrations/frontend/plugin.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const plugins = prefer.r.plugins;

async function uninstall(plugin: Plugin) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters(globalLocale.value.env.removeAreYouSure, { x: plugin.name }),
	});
	if (canceled) return;

	await uninstallPlugin(plugin);

	os.success();
}

function reload(plugin: Plugin) {
	reloadPlugin(plugin);
}

async function config(plugin: Plugin) {
	await configPlugin(plugin);
}

function changeActive(plugin: Plugin, active: boolean) {
	changePluginActive(plugin, active);
}

function timeToHhMmSs(unixtime: number) {
	return new Date(unixtime).toTimeString().split(' ')[0];
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.plugins,
	icon: 'ti ti-plug',
}));
</script>

<style module>
.log {
}

.isSystemLog {
	opacity: 0.5;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"plugins": "الإضافات",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "ثبّت إضافات",
	"manage": "إدارة ",
	"uninstall": "إلغاء التثبيت",
	"makeActive": "تفعيل",
	"author": "الكاتب",
	"logs": "السِجلّات",
	"pluginViewSource": "اظهر المصدر"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"plugins": "Extensions",
	"settingsPluginBanner": "Els complements poden fer-se servir per ampliar les funcionalitats del client. Els complements poden instal·lar-se, configurar-se individualment i gestionar-se.",
	"pluginsAreDisabledBecauseSafeMode": "Les extensions no estan activades perquè el mode segur està activat.",
	"pluginInstall": "Instal·lar un afegit ",
	"manage": "Administració",
	"uninstall": "Desinstal·la",
	"makeActive": "Activar",
	"author": "Autor",
	"logs": "Registres",
	"pluginViewSource": "Veure l'origen "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"plugins": "Pluginy",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Instalovat plugin",
	"manage": "Administrace",
	"uninstall": "Odinstalovat",
	"makeActive": "Aktivovat",
	"author": "Autor",
	"logs": "Logy",
	"pluginViewSource": "Zobrazit zdroj"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Uninstall",
	"makeActive": "Activate",
	"author": "Author",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "Du kannst die Funktionen des Clients mit Plugins erweitern. Plugins können installiert, individuell konfiguriert und verwaltet werden.",
	"pluginsAreDisabledBecauseSafeMode": "Da der abgesicherte Modus aktiviert ist, sind alle Plugins deaktiviert.",
	"pluginInstall": "Plugins installieren",
	"manage": "Verwaltung",
	"uninstall": "Deinstallieren",
	"makeActive": "Aktivieren",
	"author": "Autor",
	"logs": "Protokolle",
	"pluginViewSource": "Quelltext anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Uninstall",
	"makeActive": "Activate",
	"author": "Author",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "Puedes ampliar las funciones del cliente con plugins. Puedes instalar plugins, configurarlos y gestionarlos individualmente.",
	"pluginsAreDisabledBecauseSafeMode": "El modo seguro está activado, por lo que todos los plugins están desactivados.",
	"pluginInstall": "Instalar plugins",
	"manage": "Administrar",
	"uninstall": "Desinstalar",
	"makeActive": "Activar",
	"author": "Autor",
	"logs": "Registros",
	"pluginViewSource": "Ver la fuente"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"plugins": "Extensions",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Installation d'extensions",
	"manage": "Gestion",
	"uninstall": "Désinstaller",
	"makeActive": "Activer",
	"author": "Auteur·rice",
	"logs": "Journaux",
	"pluginViewSource": "Afficher la source"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"plugins": "Plugin",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Memasang plugin",
	"manage": "Manajemen",
	"uninstall": "Copot pemasangan",
	"makeActive": "Aktifkan",
	"author": "Pembuat",
	"logs": "Log",
	"pluginViewSource": "Lihat sumber"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"plugins": "Estensioni",
	"settingsPluginBanner": "Consentono di migliorare le funzionalità. Le estensioni si possono configurare e gestire singolarmente.",
	"pluginsAreDisabledBecauseSafeMode": "Tutti i plugin sono disattivati, poiché la modalità sicura è attiva.",
	"pluginInstall": "Installa estensioni",
	"manage": "Gestione",
	"uninstall": "Disinstalla",
	"makeActive": "Attiva",
	"author": "Autore",
	"logs": "Log",
	"pluginViewSource": "Visualizza sorgente"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"plugins": "プラグイン",
	"settingsPluginBanner": "プラグインを利用するとクライアントの機能を拡張することができます。プラグインのインストール、個別の設定と管理が行えます。",
	"pluginsAreDisabledBecauseSafeMode": "セーフモードが有効なため、プラグインはすべて無効化されています。",
	"pluginInstall": "プラグインのインストール",
	"manage": "管理",
	"uninstall": "アンインストール",
	"makeActive": "アクティブにする",
	"author": "作者",
	"logs": "ログ",
	"pluginViewSource": "ソースを表示"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"plugins": "プラグイン",
	"settingsPluginBanner": "プラグインを使うとクライアントの機能を拡張できるねん。プラグインのインストール、個別の設定と管理ができるで。",
	"pluginsAreDisabledBecauseSafeMode": "セーフモードがオンやから、プラグインは全部無効化されてるで。",
	"pluginInstall": "プラグインのインストール",
	"manage": "管理",
	"uninstall": "アンインストール",
	"makeActive": "使うで",
	"author": "作者",
	"logs": "ログ",
	"pluginViewSource": "ソース見る"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"plugins": "Izegrar",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Uninstall",
	"makeActive": "Activate",
	"author": "Author",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Uninstall",
	"makeActive": "Activate",
	"author": "Author",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"plugins": "플러그인",
	"settingsPluginBanner": "플러그인을 사용하면 클라이언트 기능을 확장할 수 있습니다. 플러그인 설치와 개별적인 설정을 합니다.",
	"pluginsAreDisabledBecauseSafeMode": "세이프 모드가 활성화돼있기에 플러그인은 전부 비활성화됩니다.",
	"pluginInstall": "플러그인 설치",
	"manage": "관리",
	"uninstall": "삭제",
	"makeActive": "활성화",
	"author": "작성자",
	"logs": "로그",
	"pluginViewSource": "소스 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Beheer",
	"uninstall": "Deinstalleren",
	"makeActive": "Activeren",
	"author": "Auteur",
	"logs": "Protocollen",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Avinstaller",
	"makeActive": "Activate",
	"author": "Forfatter",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"plugins": "Wtyczki",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Zainstaluj wtyczki",
	"manage": "Zarządzanie",
	"uninstall": "Odinstaluj",
	"makeActive": "Aktywuj",
	"author": "Autor",
	"logs": "Dzienniki",
	"pluginViewSource": "Zobacz źródło"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "Você pode ampliar as funções do cliente com plugins. Você pode instalar plugins, configurar e administrar individualmente.",
	"pluginsAreDisabledBecauseSafeMode": "Todos os plugins estão desabilitados porque o modo seguro está habilitado.",
	"pluginInstall": "Instalar plugins",
	"manage": "Administrar",
	"uninstall": "Desinstalar",
	"makeActive": "Ativar",
	"author": "Autor",
	"logs": "Logs",
	"pluginViewSource": "Ver código-fonte"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"plugins": "Расширения",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "Все плагины выключены из-за безопасного режима",
	"pluginInstall": "Установка расширений",
	"manage": "Управление",
	"uninstall": "Удалить",
	"makeActive": "Активировать",
	"author": "Автор",
	"logs": "Журналы",
	"pluginViewSource": "Просмотр исходника"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"plugins": "Pluginy",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Inštalova pluginy",
	"manage": "Administrácia",
	"uninstall": "Odinštalovať",
	"makeActive": "Aktivovať",
	"author": "Autor",
	"logs": "Logy",
	"pluginViewSource": "Ukázať zdroj"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"plugins": "ปลั๊กอิน",
	"settingsPluginBanner": "สามารถขยายความสามารถของไคลเอนต์ด้วยปลั๊กอินได้ ติดตั้ง ตั้งค่า และจัดการปลั๊กอินแต่ละตัวได้",
	"pluginsAreDisabledBecauseSafeMode": "เนื่องจากโหมดปลอดภัยถูกเปิดใช้งาน ปลั๊กอินทั้งหมดจึงถูกปิดใช้งาน",
	"pluginInstall": "ติดตั้งปลั๊กอิน",
	"manage": "การจัดการ",
	"uninstall": "ถอนการติดตั้ง",
	"makeActive": "เปิดใช้งาน",
	"author": "ผู้เขียน",
	"logs": "ปูม",
	"pluginViewSource": "ดูต้นฉบับ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"plugins": "Eklentiler",
	"settingsPluginBanner": "Eklentilerle istemci özelliklerini genişletebilirsin. Eklentileri yükleyebilir, ayrı ayrı yapılandırabilir ve yönetebilirsin.",
	"pluginsAreDisabledBecauseSafeMode": "Güvenli mod etkinleştirildiği için tüm eklentiler devre dışı bırakılmıştır.",
	"pluginInstall": "Eklentileri yükle takip isteği aldınız",
	"manage": "Yönetim",
	"uninstall": "Kaldır",
	"makeActive": "Etkinleştir",
	"author": "Yazar",
	"logs": "Günlükler",
	"pluginViewSource": "Kaynak görüntüle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"plugins": "Plugins",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Install plugins",
	"manage": "Management",
	"uninstall": "Uninstall",
	"makeActive": "Activate",
	"author": "Author",
	"logs": "Logs",
	"pluginViewSource": "View source"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"plugins": "Плагіни",
	"settingsPluginBanner": "Ви можете розширювати функції клієнту за допомогою плагінів. Ви можете завантажити плагіни, налаштовувати та керувати окремо.",
	"pluginsAreDisabledBecauseSafeMode": "Усі плагіни вимкнено, оскільки ввімкнено безпечний режим.",
	"pluginInstall": "Встановити плагін",
	"manage": "Управління",
	"uninstall": "Видалити",
	"makeActive": "Активувати",
	"author": "Автор",
	"logs": "Журнал",
	"pluginViewSource": "Переглянути вихідний код"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"plugins": "Plugin",
	"settingsPluginBanner": "You can extend client features with plugins. You can install plugins, configure and manage individually.",
	"pluginsAreDisabledBecauseSafeMode": "All plugins are disabled because safe mode is enabled.",
	"pluginInstall": "Cài đặt tiện ích",
	"manage": "Quản lý",
	"uninstall": "Gỡ bỏ",
	"makeActive": "Kích hoạt",
	"author": "Tác giả",
	"logs": "Nhật ký",
	"pluginViewSource": "Xem mã nguồn"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"plugins": "插件",
	"settingsPluginBanner": "使用插件可以扩展客户端的功能。可以在此安装、单独管理插件。",
	"pluginsAreDisabledBecauseSafeMode": "因启用了安全模式，所有插件均已被禁用。",
	"pluginInstall": "安装插件",
	"manage": "管理",
	"uninstall": "卸载",
	"makeActive": "启用",
	"author": "作者",
	"logs": "日志",
	"pluginViewSource": "查看源代码"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"plugins": "外掛",
	"settingsPluginBanner": "可使用外掛擴充用戶端的功能。您可以安裝外掛，實施個別的設定與管理。",
	"pluginsAreDisabledBecauseSafeMode": "由於啟用安全模式，所有的外掛都被停用。",
	"pluginInstall": "安裝外掛組件",
	"manage": "管理",
	"uninstall": "解除安裝",
	"makeActive": "啟用",
	"author": "作者",
	"logs": "日誌",
	"pluginViewSource": "檢視原始碼"
}
</locale>
