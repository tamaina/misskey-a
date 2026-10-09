/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { adminSendEmailInput, adminSendEmailOutput } from './endpoints/admin/send-email.contract.js';
import type { adminSystemWebhookCreateInput, adminSystemWebhookCreateOutput } from './endpoints/admin/system-webhook/create.contract.js';
import type { adminSystemWebhookDeleteInput, adminSystemWebhookDeleteOutput } from './endpoints/admin/system-webhook/delete.contract.js';
import type { adminSystemWebhookListInput, adminSystemWebhookListOutput } from './endpoints/admin/system-webhook/list.contract.js';
import type { adminSystemWebhookShowInput, adminSystemWebhookShowOutput } from './endpoints/admin/system-webhook/show.contract.js';
import type { adminSystemWebhookTestInput, adminSystemWebhookTestOutput } from './endpoints/admin/system-webhook/test.contract.js';
import type { adminSystemWebhookUpdateInput, adminSystemWebhookUpdateOutput } from './endpoints/admin/system-webhook/update.contract.js';
import type { fetchExternalResourcesInput, fetchExternalResourcesOutput } from './endpoints/fetch-external-resources.contract.js';
import type { fetchRssInput, fetchRssOutput } from './endpoints/fetch-rss.contract.js';
import type { iWebhooksCreateInput, iWebhooksCreateOutput } from './endpoints/i/webhooks/create.contract.js';
import type { iWebhooksDeleteInput, iWebhooksDeleteOutput } from './endpoints/i/webhooks/delete.contract.js';
import type { iWebhooksListInput, iWebhooksListOutput } from './endpoints/i/webhooks/list.contract.js';
import type { iWebhooksShowInput, iWebhooksShowOutput } from './endpoints/i/webhooks/show.contract.js';
import type { iWebhooksTestInput, iWebhooksTestOutput } from './endpoints/i/webhooks/test.contract.js';
import type { iWebhooksUpdateInput, iWebhooksUpdateOutput } from './endpoints/i/webhooks/update.contract.js';

export interface IntegrationsOperations<Actor extends ApiActor> {
	adminSendEmail(input: v.InferOutput<typeof adminSendEmailInput>, actor: Actor): Promise<v.InferOutput<typeof adminSendEmailOutput>>;
	adminSystemWebhookCreate(input: v.InferOutput<typeof adminSystemWebhookCreateInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookCreateOutput>>;
	adminSystemWebhookDelete(input: v.InferOutput<typeof adminSystemWebhookDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookDeleteOutput>>;
	adminSystemWebhookList(input: v.InferOutput<typeof adminSystemWebhookListInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookListOutput>>;
	adminSystemWebhookShow(input: v.InferOutput<typeof adminSystemWebhookShowInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookShowOutput>>;
	adminSystemWebhookTest(input: v.InferOutput<typeof adminSystemWebhookTestInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookTestOutput>>;
	adminSystemWebhookUpdate(input: v.InferOutput<typeof adminSystemWebhookUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof adminSystemWebhookUpdateOutput>>;
	fetchExternalResources(input: v.InferOutput<typeof fetchExternalResourcesInput>, actor: Actor): Promise<v.InferOutput<typeof fetchExternalResourcesOutput>>;
	fetchRss(input: v.InferOutput<typeof fetchRssInput>, actor: Actor | null): Promise<v.InferOutput<typeof fetchRssOutput>>;
	iWebhooksCreate(input: v.InferOutput<typeof iWebhooksCreateInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksCreateOutput>>;
	iWebhooksDelete(input: v.InferOutput<typeof iWebhooksDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksDeleteOutput>>;
	iWebhooksList(input: v.InferOutput<typeof iWebhooksListInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksListOutput>>;
	iWebhooksShow(input: v.InferOutput<typeof iWebhooksShowInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksShowOutput>>;
	iWebhooksTest(input: v.InferOutput<typeof iWebhooksTestInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksTestOutput>>;
	iWebhooksUpdate(input: v.InferOutput<typeof iWebhooksUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof iWebhooksUpdateOutput>>;
}
export type IntegrationsContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { integrations: IntegrationsOperations<Actor> } };
export type IntegrationsApplications<Actor extends ApiActor> = { [K in keyof IntegrationsOperations<Actor>]: { execute: IntegrationsOperations<Actor>[K] } };

export function createIntegrationsOperations<Actor extends ApiActor>(applications: IntegrationsApplications<Actor>): IntegrationsOperations<Actor> {
	return {
		adminSendEmail: (input, actor) => applications.adminSendEmail.execute(input, actor),
		adminSystemWebhookCreate: (input, actor) => applications.adminSystemWebhookCreate.execute(input, actor),
		adminSystemWebhookDelete: (input, actor) => applications.adminSystemWebhookDelete.execute(input, actor),
		adminSystemWebhookList: (input, actor) => applications.adminSystemWebhookList.execute(input, actor),
		adminSystemWebhookShow: (input, actor) => applications.adminSystemWebhookShow.execute(input, actor),
		adminSystemWebhookTest: (input, actor) => applications.adminSystemWebhookTest.execute(input, actor),
		adminSystemWebhookUpdate: (input, actor) => applications.adminSystemWebhookUpdate.execute(input, actor),
		fetchExternalResources: (input, actor) => applications.fetchExternalResources.execute(input, actor),
		fetchRss: (input, actor) => applications.fetchRss.execute(input, actor),
		iWebhooksCreate: (input, actor) => applications.iWebhooksCreate.execute(input, actor),
		iWebhooksDelete: (input, actor) => applications.iWebhooksDelete.execute(input, actor),
		iWebhooksList: (input, actor) => applications.iWebhooksList.execute(input, actor),
		iWebhooksShow: (input, actor) => applications.iWebhooksShow.execute(input, actor),
		iWebhooksTest: (input, actor) => applications.iWebhooksTest.execute(input, actor),
		iWebhooksUpdate: (input, actor) => applications.iWebhooksUpdate.execute(input, actor),
	};
}
