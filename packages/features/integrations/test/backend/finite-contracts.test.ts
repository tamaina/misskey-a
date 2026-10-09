/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import Parser from 'rss-parser';
import { systemWebhookSchema as packedSystemWebhookSchema, userWebhookSchema as packedUserWebhookSchema } from '../../backend/webhook.schema.js';
import { iWebhooksCreateContract } from '../../backend/endpoints/i/webhooks/create.contract.js';
import { iWebhooksTestContract } from '../../backend/endpoints/i/webhooks/test.contract.js';
import { fetchExternalResourcesContract } from '../../backend/endpoints/fetch-external-resources.contract.js';
import { fetchRssContract } from '../../backend/endpoints/fetch-rss.contract.js';
import { iWebhooksUpdateContract } from '../../backend/endpoints/i/webhooks/update.contract.js';
import { SystemWebhookEntityService } from '../../backend/serializers/SystemWebhookEntityService.js';
import { IWebhooksCreateApplicationService as CreateEndpoint } from '../../backend/endpoints/i/webhooks/create.application.js';
import { IWebhooksListApplicationService as ListEndpoint } from '../../backend/endpoints/i/webhooks/list.application.js';
import { IWebhooksShowApplicationService as ShowEndpoint } from '../../backend/endpoints/i/webhooks/show.application.js';
import { FetchExternalResourcesApplicationService as ResourcesEndpoint } from '../../backend/endpoints/fetch-external-resources.application.js';
import type { MiSystemWebhook, WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { RolePolicies, RoleService } from '@features/roles/backend/services/RoleService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const date = new Date('2026-10-07T00:00:00.000Z');
const me = mockDeep<MiLocalUser>({ id: 'user123' });
const params = { name: 'Fixture', url: 'https://example.com/webhook', on: ['note'] as ['note'] };
const webhook = { id: 'webhook123', userId: me.id, name: params.name, on: params.on, url: params.url, secret: '', active: true, latestSentAt: null, latestStatus: null };

function checkFinite(schema: v.GenericSchema, value: Record<string, unknown>) {
	expect(v.parse(schema, value)).toEqual(value);
	for (const bad of [{ ...value, future: true }, { ...value, id: 7 }, { ...value, secret: null }]) expect(v.safeParse(schema, bad).success).toBe(false);
	const { id: _id, ...missing } = value;
	expect(v.safeParse(schema, missing).success).toBe(false);
}

test.each([false, true])('real SystemWebhook serializer covers delivery status and nullable dates: %s', async delivered => {
	const model = { id: webhook.id, isActive: true, updatedAt: date, latestSentAt: delivered ? date : null, latestStatus: delivered ? 200 : null, name: webhook.name, on: ['abuseReport'], url: webhook.url, secret: webhook.secret } satisfies MiSystemWebhook;
	const serializer = new SystemWebhookEntityService(mockDeep());
	const result = await serializer.pack(model);
	checkFinite(packedSystemWebhookSchema, result);
	expect(result.latestSentAt).toBe(delivered ? date.toISOString() : null);
});

test('real user webhook create/list/show handlers retain defaults, timestamps, ownership and errors', async () => {
	const repository = mockDeep<WebhooksRepository>();
	const ids = mockDeep<IdService>();
	const roles = mockDeep<RoleService>();
	ids.gen.mockReturnValue(webhook.id);
	repository.countBy.mockResolvedValue(0);
	roles.getUserPolicies.mockResolvedValue(mockDeep<RolePolicies>({ webhookLimit: 3 }));
	repository.insertOne.mockResolvedValue({ ...webhook, user: null });
	repository.findBy.mockResolvedValue([{ ...webhook, user: null }]);
	repository.findOneBy.mockResolvedValue({ ...webhook, user: null });
	const created = await new CreateEndpoint(repository, ids, mockDeep(), roles).execute(v.parse(requiredSchema(iWebhooksCreateContract['~orpc'].inputSchema), params), me);
	checkFinite(requiredSchema(iWebhooksCreateContract['~orpc'].outputSchema), created);
	expect(created.secret).toBe('');
	const listed = await new ListEndpoint(repository).execute({}, me);
	checkFinite(packedUserWebhookSchema, listed[0]);
	const show = new ShowEndpoint(repository);
	checkFinite(packedUserWebhookSchema, await show.execute({ webhookId: webhook.id }, me));
	expect(repository.findOneBy).toHaveBeenCalledWith({ id: webhook.id, userId: me.id });
	repository.findOneBy.mockResolvedValue({ ...webhook, user: null, latestSentAt: date, latestStatus: 202 });
	expect(await show.execute({ webhookId: webhook.id }, me)).toHaveProperty('latestSentAt', date.toISOString());
	repository.findOneBy.mockResolvedValue(null);
	await expect(show.execute({ webhookId: webhook.id }, me)).rejects.toMatchObject({ code: 'NO_SUCH_WEBHOOK' });
});

test('real external resource handler retains hash verification and only its finite declared result', async () => {
	const http = mockDeep<HttpRequestService>();
	const data = 'Fixture\r\nresource';
	http.getJson.mockResolvedValue({ type: 'fixture', data, extraRemote: true });
	const endpoint = new ResourcesEndpoint(http);
	const hash = createHash('sha512').update(data.replace(/\r\n/g, '\n')).digest('hex');
	const result = await endpoint.execute({ url: 'https://example.com/resource', hash }, me);
	expect(v.parse(requiredSchema(fetchExternalResourcesContract['~orpc'].outputSchema), result)).toEqual({ type: 'fixture', data });
	expect(v.safeParse(requiredSchema(fetchExternalResourcesContract['~orpc'].outputSchema), { ...result, future: true }).success).toBe(false);
	await expect(endpoint.execute({ url: 'https://example.com/resource', hash: 'wrong' }, me)).rejects.toMatchObject({ code: 'EXT_RESOURCE_HASH_DIDNT_MATCH' });
});

test('native webhook and resource inputs strip extras, preserve defaults and reject missing/wrong fields', () => {
	expectTypeOf<v.InferOutput<NonNullable<typeof fetchExternalResourcesContract['~orpc']['outputSchema']>>>().toEqualTypeOf<{ type: string; data: string }>();
	expect(v.parse(requiredSchema(iWebhooksCreateContract['~orpc'].inputSchema), { ...params, future: true })).toEqual({ ...params, secret: '' });
	expect(v.parse(requiredSchema(iWebhooksUpdateContract['~orpc'].inputSchema), { webhookId: webhook.id, future: true })).toEqual({ webhookId: webhook.id });
	expect(v.parse(requiredSchema(iWebhooksTestContract['~orpc'].inputSchema), { webhookId: webhook.id, type: 'note', override: { url: 'url', future: true }, future: true })).toEqual({ webhookId: webhook.id, type: 'note', override: { url: 'url' } });
	for (const bad of [{}, { ...params, on: ['invalid'] }, { ...params, name: 7 }, { ...params, secret: null }]) expect(v.safeParse(requiredSchema(iWebhooksCreateContract['~orpc'].inputSchema), bad).success).toBe(false);
	for (const bad of [{}, { url: 'url', hash: 7 }]) expect(v.safeParse(requiredSchema(fetchExternalResourcesContract['~orpc'].inputSchema), bad).success).toBe(false);
	for (const bad of [{ type: 'fixture' }, { type: 7, data: '' }, { type: 'fixture', data: null }]) expect(v.safeParse(requiredSchema(fetchExternalResourcesContract['~orpc'].outputSchema), bad).success).toBe(false);
});

test('RSS parser extension fields remain a separate dynamic producer boundary', async () => {
	const feed = await new Parser().parseString('<rss version="2.0"><channel><title>Fixture</title><language>ja</language><generator>fixture</generator><item><title>Entry</title><comments>https://example.com/comments</comments></item></channel></rss>');
	expect(feed).toHaveProperty('language', 'ja');
	expect(v.parse(requiredSchema(fetchRssContract['~orpc'].outputSchema), feed)).toEqual(feed);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
