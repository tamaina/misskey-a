/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { integrationsContract } from './api.contract.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { createAdminSendEmailProcedure, type AdminSendEmailDependencies } from './endpoints/admin/send-email.js';
import { createAdminSystemWebhookCreateProcedure, type AdminSystemWebhookCreateDependencies } from './endpoints/admin/system-webhook/create.js';
import { createAdminSystemWebhookDeleteProcedure, type AdminSystemWebhookDeleteDependencies } from './endpoints/admin/system-webhook/delete.js';
import { createAdminSystemWebhookListProcedure, type AdminSystemWebhookListDependencies } from './endpoints/admin/system-webhook/list.js';
import { createAdminSystemWebhookShowProcedure, type AdminSystemWebhookShowDependencies } from './endpoints/admin/system-webhook/show.js';
import { createAdminSystemWebhookTestProcedure, type AdminSystemWebhookTestDependencies } from './endpoints/admin/system-webhook/test.js';
import { createAdminSystemWebhookUpdateProcedure, type AdminSystemWebhookUpdateDependencies } from './endpoints/admin/system-webhook/update.js';
import { createFetchExternalResourcesProcedure, type FetchExternalResourcesDependencies } from './endpoints/fetch-external-resources.js';
import { createFetchRssProcedure, type FetchRssDependencies } from './endpoints/fetch-rss.js';
import { createIWebhooksCreateProcedure, type IWebhooksCreateDependencies } from './endpoints/i/webhooks/create.js';
import { createIWebhooksDeleteProcedure, type IWebhooksDeleteDependencies } from './endpoints/i/webhooks/delete.js';
import { createIWebhooksListProcedure, type IWebhooksListDependencies } from './endpoints/i/webhooks/list.js';
import { createIWebhooksShowProcedure, type IWebhooksShowDependencies } from './endpoints/i/webhooks/show.js';
import { createIWebhooksTestProcedure, type IWebhooksTestDependencies } from './endpoints/i/webhooks/test.js';
import { createIWebhooksUpdateProcedure, type IWebhooksUpdateDependencies } from './endpoints/i/webhooks/update.js';
export interface IntegrationsRouterDependencies {
	adminSendEmail: AdminSendEmailDependencies;
	adminSystemWebhookCreate: AdminSystemWebhookCreateDependencies;
	adminSystemWebhookDelete: AdminSystemWebhookDeleteDependencies;
	adminSystemWebhookList: AdminSystemWebhookListDependencies;
	adminSystemWebhookShow: AdminSystemWebhookShowDependencies;
	adminSystemWebhookTest: AdminSystemWebhookTestDependencies;
	adminSystemWebhookUpdate: AdminSystemWebhookUpdateDependencies;
	fetchExternalResources: FetchExternalResourcesDependencies;
	fetchRss: FetchRssDependencies;
	iWebhooksCreate: IWebhooksCreateDependencies;
	iWebhooksDelete: IWebhooksDeleteDependencies;
	iWebhooksList: IWebhooksListDependencies;
	iWebhooksShow: IWebhooksShowDependencies;
	iWebhooksTest: IWebhooksTestDependencies;
	iWebhooksUpdate: IWebhooksUpdateDependencies;
}
export function createIntegrationsRouter(deps: IntegrationsRouterDependencies) {
	return implement(integrationsContract).$context<ApiContext<MiLocalUser>>().router({
		adminSendEmail: createAdminSendEmailProcedure(deps.adminSendEmail),
		adminSystemWebhookCreate: createAdminSystemWebhookCreateProcedure(deps.adminSystemWebhookCreate),
		adminSystemWebhookDelete: createAdminSystemWebhookDeleteProcedure(deps.adminSystemWebhookDelete),
		adminSystemWebhookList: createAdminSystemWebhookListProcedure(deps.adminSystemWebhookList),
		adminSystemWebhookShow: createAdminSystemWebhookShowProcedure(deps.adminSystemWebhookShow),
		adminSystemWebhookTest: createAdminSystemWebhookTestProcedure(deps.adminSystemWebhookTest),
		adminSystemWebhookUpdate: createAdminSystemWebhookUpdateProcedure(deps.adminSystemWebhookUpdate),
		fetchExternalResources: createFetchExternalResourcesProcedure(deps.fetchExternalResources),
		fetchRss: createFetchRssProcedure(deps.fetchRss),
		iWebhooksCreate: createIWebhooksCreateProcedure(deps.iWebhooksCreate),
		iWebhooksDelete: createIWebhooksDeleteProcedure(deps.iWebhooksDelete),
		iWebhooksList: createIWebhooksListProcedure(deps.iWebhooksList),
		iWebhooksShow: createIWebhooksShowProcedure(deps.iWebhooksShow),
		iWebhooksTest: createIWebhooksTestProcedure(deps.iWebhooksTest),
		iWebhooksUpdate: createIWebhooksUpdateProcedure(deps.iWebhooksUpdate),
	});
}
