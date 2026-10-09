/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AdminSendEmailApplicationService } from './endpoints/admin/send-email.application.js';
import { AdminSystemWebhookCreateApplicationService } from './endpoints/admin/system-webhook/create.application.js';
import { AdminSystemWebhookDeleteApplicationService } from './endpoints/admin/system-webhook/delete.application.js';
import { AdminSystemWebhookListApplicationService } from './endpoints/admin/system-webhook/list.application.js';
import { AdminSystemWebhookShowApplicationService } from './endpoints/admin/system-webhook/show.application.js';
import { AdminSystemWebhookTestApplicationService } from './endpoints/admin/system-webhook/test.application.js';
import { AdminSystemWebhookUpdateApplicationService } from './endpoints/admin/system-webhook/update.application.js';
import { FetchExternalResourcesApplicationService } from './endpoints/fetch-external-resources.application.js';
import { FetchRssApplicationService } from './endpoints/fetch-rss.application.js';
import { IWebhooksCreateApplicationService } from './endpoints/i/webhooks/create.application.js';
import { IWebhooksDeleteApplicationService } from './endpoints/i/webhooks/delete.application.js';
import { IWebhooksListApplicationService } from './endpoints/i/webhooks/list.application.js';
import { IWebhooksShowApplicationService } from './endpoints/i/webhooks/show.application.js';
import { IWebhooksTestApplicationService } from './endpoints/i/webhooks/test.application.js';
import { IWebhooksUpdateApplicationService } from './endpoints/i/webhooks/update.application.js';

export const integrationsApplicationProviders = [
	AdminSendEmailApplicationService,
	AdminSystemWebhookCreateApplicationService,
	AdminSystemWebhookDeleteApplicationService,
	AdminSystemWebhookListApplicationService,
	AdminSystemWebhookShowApplicationService,
	AdminSystemWebhookTestApplicationService,
	AdminSystemWebhookUpdateApplicationService,
	FetchExternalResourcesApplicationService,
	FetchRssApplicationService,
	IWebhooksCreateApplicationService,
	IWebhooksDeleteApplicationService,
	IWebhooksListApplicationService,
	IWebhooksShowApplicationService,
	IWebhooksTestApplicationService,
	IWebhooksUpdateApplicationService,
];
export const integrationsApplicationMap = {
	adminSendEmail: AdminSendEmailApplicationService,
	adminSystemWebhookCreate: AdminSystemWebhookCreateApplicationService,
	adminSystemWebhookDelete: AdminSystemWebhookDeleteApplicationService,
	adminSystemWebhookList: AdminSystemWebhookListApplicationService,
	adminSystemWebhookShow: AdminSystemWebhookShowApplicationService,
	adminSystemWebhookTest: AdminSystemWebhookTestApplicationService,
	adminSystemWebhookUpdate: AdminSystemWebhookUpdateApplicationService,
	fetchExternalResources: FetchExternalResourcesApplicationService,
	fetchRss: FetchRssApplicationService,
	iWebhooksCreate: IWebhooksCreateApplicationService,
	iWebhooksDelete: IWebhooksDeleteApplicationService,
	iWebhooksList: IWebhooksListApplicationService,
	iWebhooksShow: IWebhooksShowApplicationService,
	iWebhooksTest: IWebhooksTestApplicationService,
	iWebhooksUpdate: IWebhooksUpdateApplicationService,
};
