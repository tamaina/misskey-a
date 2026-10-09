/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adminSendEmailContract } from './endpoints/admin/send-email.contract.js';
import { adminSystemWebhookCreateContract } from './endpoints/admin/system-webhook/create.contract.js';
import { adminSystemWebhookDeleteContract } from './endpoints/admin/system-webhook/delete.contract.js';
import { adminSystemWebhookListContract } from './endpoints/admin/system-webhook/list.contract.js';
import { adminSystemWebhookShowContract } from './endpoints/admin/system-webhook/show.contract.js';
import { adminSystemWebhookTestContract } from './endpoints/admin/system-webhook/test.contract.js';
import { adminSystemWebhookUpdateContract } from './endpoints/admin/system-webhook/update.contract.js';
import { fetchExternalResourcesContract } from './endpoints/fetch-external-resources.contract.js';
import { fetchRssContract } from './endpoints/fetch-rss.contract.js';
import { iWebhooksCreateContract } from './endpoints/i/webhooks/create.contract.js';
import { iWebhooksDeleteContract } from './endpoints/i/webhooks/delete.contract.js';
import { iWebhooksListContract } from './endpoints/i/webhooks/list.contract.js';
import { iWebhooksShowContract } from './endpoints/i/webhooks/show.contract.js';
import { iWebhooksTestContract } from './endpoints/i/webhooks/test.contract.js';
import { iWebhooksUpdateContract } from './endpoints/i/webhooks/update.contract.js';

export const integrationsContract = {
	adminSendEmail: adminSendEmailContract,
	adminSystemWebhookCreate: adminSystemWebhookCreateContract,
	adminSystemWebhookDelete: adminSystemWebhookDeleteContract,
	adminSystemWebhookList: adminSystemWebhookListContract,
	adminSystemWebhookShow: adminSystemWebhookShowContract,
	adminSystemWebhookTest: adminSystemWebhookTestContract,
	adminSystemWebhookUpdate: adminSystemWebhookUpdateContract,
	fetchExternalResources: fetchExternalResourcesContract,
	fetchRss: fetchRssContract,
	iWebhooksCreate: iWebhooksCreateContract,
	iWebhooksDelete: iWebhooksDeleteContract,
	iWebhooksList: iWebhooksListContract,
	iWebhooksShow: iWebhooksShowContract,
	iWebhooksTest: iWebhooksTestContract,
	iWebhooksUpdate: iWebhooksUpdateContract,
};
