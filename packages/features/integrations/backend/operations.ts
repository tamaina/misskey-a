/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { adminSendEmailContract } from './endpoints/admin/send-email.contract.js';
import type { adminSystemWebhookCreateContract } from './endpoints/admin/system-webhook/create.contract.js';
import type { adminSystemWebhookDeleteContract } from './endpoints/admin/system-webhook/delete.contract.js';
import type { adminSystemWebhookListContract } from './endpoints/admin/system-webhook/list.contract.js';
import type { adminSystemWebhookShowContract } from './endpoints/admin/system-webhook/show.contract.js';
import type { adminSystemWebhookTestContract } from './endpoints/admin/system-webhook/test.contract.js';
import type { adminSystemWebhookUpdateContract } from './endpoints/admin/system-webhook/update.contract.js';
import type { fetchExternalResourcesContract } from './endpoints/fetch-external-resources.contract.js';
import type { fetchRssContract } from './endpoints/fetch-rss.contract.js';
import type { iWebhooksCreateContract } from './endpoints/i/webhooks/create.contract.js';
import type { iWebhooksDeleteContract } from './endpoints/i/webhooks/delete.contract.js';
import type { iWebhooksListContract } from './endpoints/i/webhooks/list.contract.js';
import type { iWebhooksShowContract } from './endpoints/i/webhooks/show.contract.js';
import type { iWebhooksTestContract } from './endpoints/i/webhooks/test.contract.js';
import type { iWebhooksUpdateContract } from './endpoints/i/webhooks/update.contract.js';

export interface IntegrationsOperations<Actor extends ApiActor> {
	adminSendEmail(input: v.InferOutput<NonNullable<typeof adminSendEmailContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSendEmailContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookCreate(input: v.InferOutput<NonNullable<typeof adminSystemWebhookCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookCreateContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookDelete(input: v.InferOutput<NonNullable<typeof adminSystemWebhookDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookDeleteContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookList(input: v.InferOutput<NonNullable<typeof adminSystemWebhookListContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookListContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookShow(input: v.InferOutput<NonNullable<typeof adminSystemWebhookShowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookShowContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookTest(input: v.InferOutput<NonNullable<typeof adminSystemWebhookTestContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookTestContract['~orpc']['outputSchema']>>>;
	adminSystemWebhookUpdate(input: v.InferOutput<NonNullable<typeof adminSystemWebhookUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookUpdateContract['~orpc']['outputSchema']>>>;
	fetchExternalResources(input: v.InferOutput<NonNullable<typeof fetchExternalResourcesContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof fetchExternalResourcesContract['~orpc']['outputSchema']>>>;
	fetchRss(input: v.InferOutput<NonNullable<typeof fetchRssContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof fetchRssContract['~orpc']['outputSchema']>>>;
	iWebhooksCreate(input: v.InferOutput<NonNullable<typeof iWebhooksCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksCreateContract['~orpc']['outputSchema']>>>;
	iWebhooksDelete(input: v.InferOutput<NonNullable<typeof iWebhooksDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksDeleteContract['~orpc']['outputSchema']>>>;
	iWebhooksList(input: v.InferOutput<NonNullable<typeof iWebhooksListContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksListContract['~orpc']['outputSchema']>>>;
	iWebhooksShow(input: v.InferOutput<NonNullable<typeof iWebhooksShowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksShowContract['~orpc']['outputSchema']>>>;
	iWebhooksTest(input: v.InferOutput<NonNullable<typeof iWebhooksTestContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksTestContract['~orpc']['outputSchema']>>>;
	iWebhooksUpdate(input: v.InferOutput<NonNullable<typeof iWebhooksUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof iWebhooksUpdateContract['~orpc']['outputSchema']>>>;
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
