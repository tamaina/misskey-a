<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/connect" :label="$locale.sfc.serviceConnection" :keywords="['app', 'service', 'connect', 'webhook', 'api', 'token']" icon="ti ti-link">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f517.png" color="#ff0088">
			<SearchText>{{ $locale.sfc.serviceConnectionBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['api', 'app', 'token', 'accessToken']">
			<FormSection>
				<template #label><i class="ti ti-api"></i> <SearchLabel>{{ $locale.sfc.api }}</SearchLabel></template>

				<div class="_gaps_m">
					<MkButton primary @click="generateToken">{{ $locale.sfc.generateAccessToken }}</MkButton>
					<FormLink to="/settings/apps">{{ $locale.sfc.manageAccessTokens }}</FormLink>
					<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null">API console</FormLink>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['webhook']">
			<FormSection>
				<template #label><i class="ti ti-webhook"></i> <SearchLabel>{{ $locale.sfc.webhook }}</SearchLabel></template>

				<div class="_gaps_m">
					<FormLink :to="`/settings/webhook/new`">
						{{ $locale.sfc.createWebhook }}
					</FormLink>

					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.manage }}</template>

						<MkPagination :paginator="paginator" withControl>
							<template #default="{items}">
								<div class="_gaps">
									<FormLink v-for="webhook in items" :key="webhook.id" :to="`/settings/webhook/edit/${webhook.id}`">
										<template #icon>
											<i v-if="webhook.active === false" class="ti ti-player-pause"></i>
											<i v-else-if="webhook.latestStatus === null" class="ti ti-circle"></i>
											<i v-else-if="[200, 201, 204].includes(webhook.latestStatus)" class="ti ti-check" :style="{ color: 'var(--MI_THEME-success)' }"></i>
											<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--MI_THEME-error)' }"></i>
										</template>
										{{ webhook.name || webhook.url }}
										<template #suffix>
											<MkTime v-if="webhook.latestSentAt" :time="webhook.latestSentAt"></MkTime>
										</template>
									</FormLink>
								</div>
							</template>
						</MkPagination>
					</MkFolder>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, defineAsyncComponent, markRaw } from 'vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const isDesktop = ref(window.innerWidth >= 1100);

const paginator = markRaw(new Paginator('i/webhooks/list', {
	limit: 100,
	noPaging: true,
}));

async function generateToken() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/auth/frontend/components/MkTokenGenerateWindow.vue').then(x => x.default), {}, {
		done: async result => {
			const { name, permissions } = result;
			const { token } = await misskeyApi('miauth/gen-token', {
				session: null,
				name: name,
				permission: permissions,
			});

			os.alert({
				type: 'success',
				title: $locale.value.sfc.accessToken,
				text: token,
			});
		},
		closed: () => dispose(),
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.serviceConnection,
	icon: 'ti ti-link',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "ولّد رمز الوصول",
	"manageAccessTokens": "إدارة رموز الوصول",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "إدارة "
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"accessToken": "Token d'accés",
	"serviceConnection": "Relació entre serveis",
	"serviceConnectionBanner": "Pots configurar i gestionar tokens d'accés i webhooks per integrar serveis i aplicacions externes.",
	"api": "API",
	"generateAccessToken": "Genera codi d'accés",
	"manageAccessTokens": "Administrar claus de seguretat d'accés ",
	"webhook": "Webhook",
	"createWebhook": "Crear un Webhook",
	"manage": "Administració"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Vygenerovat přístupový token",
	"manageAccessTokens": "Spravovat přístupové tokeny",
	"webhook": "Webhook",
	"createWebhook": "Vytvořit Webhook",
	"manage": "Administrace"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Integrierte Dienste",
	"serviceConnectionBanner": "Du kannst Zugriffstoken und Webhooks für die Integration mit externen Anwendungen und Diensten verwalten und konfigurieren.",
	"api": "API",
	"generateAccessToken": "Zugriffstoken generieren",
	"manageAccessTokens": "Zugriffstokens verwalten",
	"webhook": "Webhook",
	"createWebhook": "Webhook erstellen",
	"manage": "Verwaltung"
}
</locale>

<locale locale="en-US" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"accessToken": "Token de acceso",
	"serviceConnection": "Integraciones",
	"serviceConnectionBanner": "Gestione y configure tokens de acceso y Webhooks para integrarse con aplicaciones o servicios externos.",
	"api": "API",
	"generateAccessToken": "Generar token de acceso",
	"manageAccessTokens": "Administrar tokens de acceso",
	"webhook": "Webhook",
	"createWebhook": "Crear Webhook",
	"manage": "Administrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Générer un jeton d'accès",
	"manageAccessTokens": "Gérer les jetons d'accès",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Gestion"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Buat token akses",
	"manageAccessTokens": "Kelola token akses",
	"webhook": "Webhook",
	"createWebhook": "Buat Webhook",
	"manage": "Manajemen"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"accessToken": "Codice di accesso",
	"serviceConnection": "Integrazione servizi",
	"serviceConnectionBanner": "Puoi gestire i codici di accesso e i Webhook per collegare App o servizi esterni.",
	"api": "API",
	"generateAccessToken": "Genera token di accesso",
	"manageAccessTokens": "Gestisci token di accesso",
	"webhook": "Webhook",
	"createWebhook": "Creazione Webhook",
	"manage": "Gestione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"accessToken": "アクセストークン",
	"serviceConnection": "サービス連携",
	"serviceConnectionBanner": "外部のアプリ・サービスと連携するためのアクセストークンやWebhookの管理と設定が行えます。",
	"api": "API",
	"generateAccessToken": "アクセストークンの発行",
	"manageAccessTokens": "アクセストークンの管理",
	"webhook": "Webhook",
	"createWebhook": "Webhookを作成",
	"manage": "管理"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"accessToken": "アクセストークン",
	"serviceConnection": "サービス連携",
	"serviceConnectionBanner": "外部のアプリ・サービスと連携するのに使うとるアクセストークンとかWebhookの管理と設定ができるで。",
	"api": "API",
	"generateAccessToken": "アクセストークンの発行",
	"manageAccessTokens": "アクセストークンの管理",
	"webhook": "Webhook",
	"createWebhook": "Webhookをつくる",
	"manage": "管理"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"accessToken": "접근 토큰",
	"serviceConnection": "서비스 연동",
	"serviceConnectionBanner": "외부 앱, 서비스와 연결하기 위한 액세스 토큰과 웹 훅 관리 설정을 합니다.",
	"api": "API",
	"generateAccessToken": "액세스 토큰 생성",
	"manageAccessTokens": "액세스 토큰 관리",
	"webhook": "Webhook",
	"createWebhook": "Webhook 생성",
	"manage": "관리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Toegangstoken genereren",
	"manageAccessTokens": "Toegangstokens beheren",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Beheer"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generuj token dostępu",
	"manageAccessTokens": "Zarządzaj tokenami dostępu",
	"webhook": "Webhook",
	"createWebhook": "Stwórz Webhook",
	"manage": "Zarządzanie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Integração de serviço",
	"serviceConnectionBanner": "Administre e configure tokens de acesso e webhooks para interagir com aplicações e serviços externos.",
	"api": "API",
	"generateAccessToken": "Gerar token de acesso",
	"manageAccessTokens": "Gerenciar tokens de acesso",
	"webhook": "Webhook",
	"createWebhook": "Criar Webhook",
	"manage": "Administrar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"accessToken": "Токен доступа",
	"serviceConnection": "Интеграция сервисов",
	"serviceConnectionBanner": "Настраивайте и управляйте токенами и вебхуками для интеграции с внешними приложениями или сервисами.",
	"api": "API",
	"generateAccessToken": "Создать токен доступа",
	"manageAccessTokens": "Управление токенами доступа",
	"webhook": "Вебхук",
	"createWebhook": "Создать вебхук",
	"manage": "Управление"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Vygenerovať prístupový token",
	"manageAccessTokens": "Spravovať prístupové tokeny",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Administrácia"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "การเชื่อมต่อกับบริการ",
	"serviceConnectionBanner": "สามารถจัดการและตั้งค่าโทเค็นการเข้าถึงและ Webhook เพื่อเชื่อมต่อกับแอปหรือบริการภายนอกได้",
	"api": "API",
	"generateAccessToken": "สร้างโทเค็นการเข้าถึง",
	"manageAccessTokens": "การจัดการโทเค็นการเข้าถึง",
	"webhook": "Webhook",
	"createWebhook": "สร้าง Webhook",
	"manage": "การจัดการ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Hizmet entegrasyonu",
	"serviceConnectionBanner": "Dış uygulamalar veya hizmetlerle entegrasyon sağlamak için erişim belirteçlerini ve Webhook'ları yönetin ve yapılandırın.",
	"api": "API",
	"generateAccessToken": "Erişim jetonu oluştur",
	"manageAccessTokens": "Acces Tokens yönet",
	"webhook": "Webhook",
	"createWebhook": "Webhook oluştur",
	"manage": "Yönetim"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Generate access token",
	"manageAccessTokens": "Manage access tokens",
	"webhook": "Webhook",
	"createWebhook": "Create Webhook",
	"manage": "Management"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"accessToken": "Токен доступу",
	"serviceConnection": "Інтеграції",
	"serviceConnectionBanner": "Керуйте та налаштовуйте токени доступу та веб хуки задля інтегрування сторонніх додатків або сервісів.",
	"api": "API",
	"generateAccessToken": "Згенерувати токен доступу",
	"manageAccessTokens": "Керування токенами доступу",
	"webhook": "Веб хук",
	"createWebhook": "Create Webhook",
	"manage": "Управління"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"accessToken": "Access Token",
	"serviceConnection": "Service integration",
	"serviceConnectionBanner": "Manage and configure access tokens and Webhooks to integrate with external apps or services.",
	"api": "API",
	"generateAccessToken": "Tạo mã truy cập",
	"manageAccessTokens": "Tạo mã truy cập",
	"webhook": "Webhook",
	"createWebhook": "Tạo Webhook",
	"manage": "Quản lý"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"accessToken": "访问令牌",
	"serviceConnection": "连接服务",
	"serviceConnectionBanner": "可在此管理用于连接外部应用或服务的访问令牌及 Webhook。",
	"api": "API",
	"generateAccessToken": "生成访问令牌",
	"manageAccessTokens": "管理访问令牌",
	"webhook": "Webhook",
	"createWebhook": "创建 Webhook",
	"manage": "管理"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"accessToken": "存取權杖",
	"serviceConnection": "服務整合",
	"serviceConnectionBanner": "您可以管理和設定存取權杖與 Webhooks，以便與外部應用程式和服務整合。",
	"api": "API",
	"generateAccessToken": "發行存取權杖",
	"manageAccessTokens": "管理存取權杖",
	"webhook": "Webhook",
	"createWebhook": "建立 Webhook",
	"manage": "管理"
}
</locale>
