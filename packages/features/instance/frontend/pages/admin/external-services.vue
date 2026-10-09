<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/external-services" :label="$locale.sfc.externalServices" :keywords="['external', 'services', 'thirdparty']" icon="ti ti-link">
			<div class="_gaps_m">
				<SearchMarker v-slot="slotProps">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>Google Analytics</SearchLabel><span class="_beta">{{ $locale.sfc.beta }}</span></template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkInput v-model="googleAnalyticsMeasurementId">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>Measurement ID</SearchLabel></template>
								</MkInput>
							</SearchMarker>

							<MkButton primary @click="save_googleAnalytics">Save</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>DeepL Translation</SearchLabel></template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkInput v-model="deeplAuthKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>Auth Key</SearchLabel></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker>
								<MkSwitch v-model="deeplIsPro">
									<template #label><SearchLabel>Pro account</SearchLabel></template>
								</MkSwitch>
							</SearchMarker>

							<MkButton primary @click="save_deepl">Save</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';

const meta = await misskeyApi('admin/meta');

const deeplAuthKey = ref(meta.deeplAuthKey ?? '');
const deeplIsPro = ref(meta.deeplIsPro);
const googleAnalyticsMeasurementId = ref(meta.googleAnalyticsMeasurementId ?? '');

function save_deepl() {
	os.apiWithDialog('admin/update-meta', {
		deeplAuthKey: deeplAuthKey.value,
		deeplIsPro: deeplIsPro.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function save_googleAnalytics() {
	os.apiWithDialog('admin/update-meta', {
		googleAnalyticsMeasurementId: googleAnalyticsMeasurementId.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.externalServices,
	icon: 'ti ti-link',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"externalServices": "External Services",
	"beta": "بيتا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"externalServices": "Serveis externs",
	"beta": "Proves"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta verze"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"externalServices": "Externe Dienste",
	"beta": "Beta"
}
</locale>

<locale locale="en-US" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"externalServices": "Servicios Externos",
	"beta": "Beta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"externalServices": "Services externes",
	"beta": "Bêta"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"externalServices": "Layanan eksternal",
	"beta": "Beta"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"externalServices": "Servizi esterni",
	"beta": "Versione beta"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"externalServices": "外部サービス",
	"beta": "ベータ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"externalServices": "他のサイトのサービス",
	"beta": "ベータ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"externalServices": "외부 서비스",
	"beta": "베타"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"externalServices": "Serviços Externos",
	"beta": "Beta"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"externalServices": "Интеграции",
	"beta": "Бета"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"externalServices": "บริการภายนอก",
	"beta": "เบต้า"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"externalServices": "Dış Hizmetler",
	"beta": "Beta"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"externalServices": "External Services",
	"beta": "Beta"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"externalServices": "Зовнішні сервіси",
	"beta": "Бета"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"externalServices": "Các dịch vụ bên ngoài",
	"beta": "Beta"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"externalServices": "外部服务",
	"beta": "测试"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"externalServices": "外部服務",
	"beta": "測試版"
}
</locale>
