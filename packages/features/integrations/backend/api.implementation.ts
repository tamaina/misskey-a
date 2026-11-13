/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { integrationsContract } from './api.definition.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createAdminSendEmailProcedure } from './endpoints/admin/send-email.js';
import type { AdminSendEmailDependencies } from './endpoints/admin/send-email.js';
import { createAdminSystemWebhookCreateProcedure } from './endpoints/admin/system-webhook/create.js';
import type { AdminSystemWebhookCreateDependencies } from './endpoints/admin/system-webhook/create.js';
import { createAdminSystemWebhookDeleteProcedure } from './endpoints/admin/system-webhook/delete.js';
import type { AdminSystemWebhookDeleteDependencies } from './endpoints/admin/system-webhook/delete.js';
import { createAdminSystemWebhookListProcedure } from './endpoints/admin/system-webhook/list.js';
import type { AdminSystemWebhookListDependencies } from './endpoints/admin/system-webhook/list.js';
import { createAdminSystemWebhookShowProcedure } from './endpoints/admin/system-webhook/show.js';
import type { AdminSystemWebhookShowDependencies } from './endpoints/admin/system-webhook/show.js';
import { createAdminSystemWebhookTestProcedure } from './endpoints/admin/system-webhook/test.js';
import type { AdminSystemWebhookTestDependencies } from './endpoints/admin/system-webhook/test.js';
import { createAdminSystemWebhookUpdateProcedure } from './endpoints/admin/system-webhook/update.js';
import type { AdminSystemWebhookUpdateDependencies } from './endpoints/admin/system-webhook/update.js';
import { createFetchExternalResourcesProcedure } from './endpoints/fetch-external-resources.js';
import type { FetchExternalResourcesDependencies } from './endpoints/fetch-external-resources.js';
import { createFetchRssProcedure } from './endpoints/fetch-rss.js';
import type { FetchRssDependencies } from './endpoints/fetch-rss.js';
import { createIWebhooksCreateProcedure } from './endpoints/i/webhooks/create.js';
import type { IWebhooksCreateDependencies } from './endpoints/i/webhooks/create.js';
import { createIWebhooksDeleteProcedure } from './endpoints/i/webhooks/delete.js';
import type { IWebhooksDeleteDependencies } from './endpoints/i/webhooks/delete.js';
import { createIWebhooksListProcedure } from './endpoints/i/webhooks/list.js';
import type { IWebhooksListDependencies } from './endpoints/i/webhooks/list.js';
import { createIWebhooksShowProcedure } from './endpoints/i/webhooks/show.js';
import type { IWebhooksShowDependencies } from './endpoints/i/webhooks/show.js';
import { createIWebhooksTestProcedure } from './endpoints/i/webhooks/test.js';
import type { IWebhooksTestDependencies } from './endpoints/i/webhooks/test.js';
import { createIWebhooksUpdateProcedure } from './endpoints/i/webhooks/update.js';
import type { IWebhooksUpdateDependencies } from './endpoints/i/webhooks/update.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { SystemWebhookService } from './services/SystemWebhookService.js';
import { SystemWebhookEntityService } from './serializers/SystemWebhookEntityService.js';
import { WebhookTestService } from './services/WebhookTestService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

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

@Injectable()
export class IntegrationsApiProvider {
	private router: ReturnType<typeof createIntegrationsRouter> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		if (this.router !== undefined) return this.router;
		this.router = createIntegrationsRouter({
			'adminSendEmail': { emailService: this.moduleRef.get<AdminSendEmailDependencies['emailService']>(EmailService, { strict: false }) },
			'adminSystemWebhookCreate': { systemWebhookService: this.moduleRef.get<AdminSystemWebhookCreateDependencies['systemWebhookService']>(SystemWebhookService, { strict: false }), systemWebhookEntityService: this.moduleRef.get<AdminSystemWebhookCreateDependencies['systemWebhookEntityService']>(SystemWebhookEntityService, { strict: false }) },
			'adminSystemWebhookDelete': { systemWebhookService: this.moduleRef.get<AdminSystemWebhookDeleteDependencies['systemWebhookService']>(SystemWebhookService, { strict: false }) },
			'adminSystemWebhookList': { systemWebhookService: this.moduleRef.get<AdminSystemWebhookListDependencies['systemWebhookService']>(SystemWebhookService, { strict: false }), systemWebhookEntityService: this.moduleRef.get<AdminSystemWebhookListDependencies['systemWebhookEntityService']>(SystemWebhookEntityService, { strict: false }) },
			'adminSystemWebhookShow': { systemWebhookService: this.moduleRef.get<AdminSystemWebhookShowDependencies['systemWebhookService']>(SystemWebhookService, { strict: false }), systemWebhookEntityService: this.moduleRef.get<AdminSystemWebhookShowDependencies['systemWebhookEntityService']>(SystemWebhookEntityService, { strict: false }) },
			'adminSystemWebhookTest': { webhookTestService: this.moduleRef.get<AdminSystemWebhookTestDependencies['webhookTestService']>(WebhookTestService, { strict: false }) },
			'adminSystemWebhookUpdate': { systemWebhookService: this.moduleRef.get<AdminSystemWebhookUpdateDependencies['systemWebhookService']>(SystemWebhookService, { strict: false }), systemWebhookEntityService: this.moduleRef.get<AdminSystemWebhookUpdateDependencies['systemWebhookEntityService']>(SystemWebhookEntityService, { strict: false }) },
			'fetchExternalResources': { httpRequestService: this.moduleRef.get<FetchExternalResourcesDependencies['httpRequestService']>(HttpRequestService, { strict: false }) },
			'fetchRss': { httpRequestService: this.moduleRef.get<FetchRssDependencies['httpRequestService']>(HttpRequestService, { strict: false }) },
			'iWebhooksCreate': { webhooksRepository: this.moduleRef.get<IWebhooksCreateDependencies['webhooksRepository']>(DI.webhooksRepository, { strict: false }), idService: this.moduleRef.get<IWebhooksCreateDependencies['idService']>(IdService, { strict: false }), globalEventService: this.moduleRef.get<IWebhooksCreateDependencies['globalEventService']>(GlobalEventService, { strict: false }), roleService: this.moduleRef.get<IWebhooksCreateDependencies['roleService']>(RoleService, { strict: false }) },
			'iWebhooksDelete': { webhooksRepository: this.moduleRef.get<IWebhooksDeleteDependencies['webhooksRepository']>(DI.webhooksRepository, { strict: false }), globalEventService: this.moduleRef.get<IWebhooksDeleteDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'iWebhooksList': { webhooksRepository: this.moduleRef.get<IWebhooksListDependencies['webhooksRepository']>(DI.webhooksRepository, { strict: false }) },
			'iWebhooksShow': { webhooksRepository: this.moduleRef.get<IWebhooksShowDependencies['webhooksRepository']>(DI.webhooksRepository, { strict: false }) },
			'iWebhooksTest': { webhookTestService: this.moduleRef.get<IWebhooksTestDependencies['webhookTestService']>(WebhookTestService, { strict: false }) },
			'iWebhooksUpdate': { webhooksRepository: this.moduleRef.get<IWebhooksUpdateDependencies['webhooksRepository']>(DI.webhooksRepository, { strict: false }), globalEventService: this.moduleRef.get<IWebhooksUpdateDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
		});
		return this.router;
	}
}
