<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkPagination :paginator="paginator">
		<template #empty><MkResult type="empty"/></template>
		<template #default="{items}">
			<div class="_gaps">
				<MkFolder v-for="token in items" :key="token.id" :defaultOpen="true">
					<template #icon>
						<img v-if="token.iconUrl" :class="$style.appIcon" :src="token.iconUrl" alt=""/>
						<i v-else class="ti ti-plug"></i>
					</template>
					<template #label>{{ token.name }}</template>
					<template #caption>{{ token.description }}</template>
					<template v-if="token.lastUsedAt != null" #suffix><MkTime :time="token.lastUsedAt"/></template>
					<template #footer>
						<MkButton danger @click="revoke(token)"><i class="ti ti-trash"></i> {{ globalLocale.env.delete }}</MkButton>
					</template>

					<div class="_gaps_s">
						<div v-if="token.description">{{ token.description }}</div>
						<div>
							<MkKeyValue oneline>
								<template #key>{{ $locale.sfc.installedDate }}</template>
								<template #value><MkTime :time="token.createdAt" :mode="'detail'"/></template>
							</MkKeyValue>
							<MkKeyValue oneline>
								<template #key>{{ $locale.sfc.tokenExpiry }}</template>
								<template #value><MkTime v-if="token.expiresAt" :time="token.expiresAt" :mode="'detail'"/><span v-else>{{ $locale.sfc.unbounded }}</span></template>
							</MkKeyValue>
							<MkKeyValue v-if="token.lastUsedAt != null" oneline>
								<template #key>{{ $locale.sfc.lastUsedDate }}</template>
								<template #value><MkTime :time="token.lastUsedAt" :mode="'detail'"/></template>
							</MkKeyValue>
						</div>
						<MkFolder>
							<template #label>{{ globalLocale.env.permission }}</template>
							<template #suffix>{{ Object.keys(token.permission).length === 0 ? globalLocale.env.none : Object.keys(token.permission).length }}</template>
							<ul>
								<li v-for="p in token.permission" :key="p">{{ (copyLocaleDictionary(globalLocale.env._permissions) as Record<string, string>)[p] ?? p }}</li>
							</ul>
						</MkFolder>
					</div>
				</MkFolder>
			</div>
		</template>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const paginator = markRaw(new Paginator('i/apps', {
	limit: 100,
	noPaging: true,
	params: {
		sort: '+lastUsedAt',
	},
}));

function revoke(token: Misskey.entities.IAppsResponse[number]) {
	misskeyApi('i/revoke-token', { tokenId: token.id }).then(() => {
		paginator.reload();
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.installedApps,
	icon: 'ti ti-plug',
}));
</script>

<style lang="scss" module>
.appIcon {
	display: block;
	width: 20px;
	height: 20px;
	border-radius: 4px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"installedDate": "تاريخ التثبيت",
	"lastUsedDate": "آخر استخدام",
	"installedApps": "التطبيقات المُخوّلة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"installedDate": "Data d'instal·lació",
	"lastUsedDate": "Utilitzat per última vegada",
	"installedApps": "Aplicacions autoritzades "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"installedDate": "Datum autorizace",
	"lastUsedDate": "Poslední použití",
	"installedApps": "Autorizované aplikace"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"installedDate": "Authorisiert am",
	"lastUsedDate": "Zuletzt verwendet am",
	"installedApps": "Authorisierte Anwendungen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"installedDate": "Autorizado",
	"lastUsedDate": "Utilizado el",
	"installedApps": "Aplicaciones Autorizadas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"installedDate": "Date d'installation",
	"lastUsedDate": "Dernière utilisation",
	"installedApps": "Applications installées"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"installedDate": "Diijinkan",
	"lastUsedDate": "Terakhir digunakan",
	"installedApps": "Aplikasi yang diijinkan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"installedDate": "Data installazione",
	"lastUsedDate": "Data di ultimo uso",
	"installedApps": "Applicazioni installate"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"installedDate": "インストール日時",
	"lastUsedDate": "最終使用日時",
	"installedApps": "インストールされたアプリ",
	"tokenExpiry": "アクセストークンの有効期限",
	"unbounded": "無期限"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"installedDate": "インストールした日時",
	"lastUsedDate": "最後に使った日時",
	"installedApps": "インストールされとるアプリ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"installedDate": "승인한 날짜",
	"lastUsedDate": "마지막 사용",
	"installedApps": "인증된 애플리케이션"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"installedDate": "Geautoriseerd at",
	"lastUsedDate": "Laatst gebruikt at",
	"installedApps": "Geautoriseerde toepassingen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"installedDate": "Autoryzowano",
	"lastUsedDate": "Ostatnie użycie",
	"installedApps": "Autoryzowane aplikacje"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"installedDate": "Data de instalação",
	"lastUsedDate": "Data de última utilização",
	"installedApps": "Aplicativos instalados"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"installedDate": "Дата установки",
	"lastUsedDate": "Дата использования",
	"installedApps": "Установленные приложения"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"installedDate": "Dátum autorizácie",
	"lastUsedDate": "Naposledy použité",
	"installedApps": "Autorizované aplikácie"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"installedDate": "วันที่ติดตั้ง",
	"lastUsedDate": "ใช้งานครั้งล่าสุด",
	"installedApps": "แอปที่ติดตั้งแล้ว"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"installedDate": "Yetkili",
	"lastUsedDate": "En son kullanıldığı tarih",
	"installedApps": "Yetkili Uygulamalar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"installedDate": "Authorized at",
	"lastUsedDate": "Last used at",
	"installedApps": "Authorized Applications"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"installedDate": "Дата встановлення",
	"lastUsedDate": "Дата використання",
	"installedApps": "Встановлені аплікації"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"installedDate": "Cho phép vào",
	"lastUsedDate": "Dùng gần nhất",
	"installedApps": "Ứng dụng đã cài đặt"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"installedDate": "授权日期",
	"lastUsedDate": "最近使用",
	"installedApps": "已授权的应用"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"installedDate": "安裝時間",
	"lastUsedDate": "最後上線日期",
	"installedApps": "已授權的應用程式"
}
</locale>
