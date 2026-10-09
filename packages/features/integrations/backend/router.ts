/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { IntegrationsContext } from './operations.js';
import { integrationsContract } from './api.contract.js';
import { createAdminSendEmailProcedure } from './endpoints/admin/send-email.js';
import { createAdminSystemWebhookCreateProcedure } from './endpoints/admin/system-webhook/create.js';
import { createAdminSystemWebhookDeleteProcedure } from './endpoints/admin/system-webhook/delete.js';
import { createAdminSystemWebhookListProcedure } from './endpoints/admin/system-webhook/list.js';
import { createAdminSystemWebhookShowProcedure } from './endpoints/admin/system-webhook/show.js';
import { createAdminSystemWebhookTestProcedure } from './endpoints/admin/system-webhook/test.js';
import { createAdminSystemWebhookUpdateProcedure } from './endpoints/admin/system-webhook/update.js';
import { createFetchExternalResourcesProcedure } from './endpoints/fetch-external-resources.js';
import { createFetchRssProcedure } from './endpoints/fetch-rss.js';
import { createIWebhooksCreateProcedure } from './endpoints/i/webhooks/create.js';
import { createIWebhooksDeleteProcedure } from './endpoints/i/webhooks/delete.js';
import { createIWebhooksListProcedure } from './endpoints/i/webhooks/list.js';
import { createIWebhooksShowProcedure } from './endpoints/i/webhooks/show.js';
import { createIWebhooksTestProcedure } from './endpoints/i/webhooks/test.js';
import { createIWebhooksUpdateProcedure } from './endpoints/i/webhooks/update.js';

export function createIntegrationsRouter<Actor extends ApiActor>() {
	return implement(integrationsContract).$context<IntegrationsContext<Actor>>().router({
		adminSendEmail: createAdminSendEmailProcedure<Actor>(),
		adminSystemWebhookCreate: createAdminSystemWebhookCreateProcedure<Actor>(),
		adminSystemWebhookDelete: createAdminSystemWebhookDeleteProcedure<Actor>(),
		adminSystemWebhookList: createAdminSystemWebhookListProcedure<Actor>(),
		adminSystemWebhookShow: createAdminSystemWebhookShowProcedure<Actor>(),
		adminSystemWebhookTest: createAdminSystemWebhookTestProcedure<Actor>(),
		adminSystemWebhookUpdate: createAdminSystemWebhookUpdateProcedure<Actor>(),
		fetchExternalResources: createFetchExternalResourcesProcedure<Actor>(),
		fetchRss: createFetchRssProcedure<Actor>(),
		iWebhooksCreate: createIWebhooksCreateProcedure<Actor>(),
		iWebhooksDelete: createIWebhooksDeleteProcedure<Actor>(),
		iWebhooksList: createIWebhooksListProcedure<Actor>(),
		iWebhooksShow: createIWebhooksShowProcedure<Actor>(),
		iWebhooksTest: createIWebhooksTestProcedure<Actor>(),
		iWebhooksUpdate: createIWebhooksUpdateProcedure<Actor>(),
	});
}
