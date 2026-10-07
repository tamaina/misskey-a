/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import Parser from 'rss-parser';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedSystemWebhookSchema, packedUserWebhookSchema } from '../../contract/packed.js';
import { constantIWebhooksCreateInput, constantIWebhooksCreateOutput, constantIWebhooksCreateDefinition, constantIWebhooksTestInput } from '../../contract/source-constant-endpoint-definitions.js';
import { inlineFetchExternalResourcesInput, inlineFetchExternalResourcesOutput, inlineFetchRssOutput } from '../../contract/endpoint-definitions.js';
import { webhookInputs } from '../../contract/index.js';
import { SystemWebhookEntityService } from '../../backend/serializers/SystemWebhookEntityService.js';
import { EndpointImplementation as CreateEndpoint } from '../../backend/endpoints/i/webhooks/create.js';
import { EndpointImplementation as ListEndpoint } from '../../backend/endpoints/i/webhooks/list.js';
import { EndpointImplementation as ShowEndpoint } from '../../backend/endpoints/i/webhooks/show.js';
import { EndpointImplementation as ResourcesEndpoint } from '../../backend/endpoints/fetch-external-resources.js';
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
	const created = await new CreateEndpoint(repository, ids, mockDeep(), roles).exec({ ...params }, me, null);
	checkFinite(constantIWebhooksCreateOutput, created);
	expect(created.secret).toBe('');
	const listed = await new ListEndpoint(repository).exec({}, me, null);
	checkFinite(packedUserWebhookSchema, listed[0]);
	const show = new ShowEndpoint(repository);
	checkFinite(packedUserWebhookSchema, await show.exec({ webhookId: webhook.id }, me, null));
	expect(repository.findOneBy).toHaveBeenCalledWith({ id: webhook.id, userId: me.id });
	repository.findOneBy.mockResolvedValue({ ...webhook, user: null, latestSentAt: date, latestStatus: 202 });
	expect(await show.exec({ webhookId: webhook.id }, me, null)).toHaveProperty('latestSentAt', date.toISOString());
	repository.findOneBy.mockResolvedValue(null);
	await expect(show.exec({ webhookId: webhook.id }, me, null)).rejects.toMatchObject({ code: 'NO_SUCH_WEBHOOK' });
});

test('real external resource handler retains hash verification and only its finite declared result', async () => {
	const http = mockDeep<HttpRequestService>();
	const data = 'Fixture\r\nresource';
	http.getJson.mockResolvedValue({ type: 'fixture', data, extraRemote: true });
	const endpoint = new ResourcesEndpoint(http);
	const hash = createHash('sha512').update(data.replace(/\r\n/g, '\n')).digest('hex');
	const result = await endpoint.exec({ url: 'https://example.com/resource', hash }, me, null);
	expect(v.parse(inlineFetchExternalResourcesOutput, result)).toEqual({ type: 'fixture', data });
	expect(v.safeParse(inlineFetchExternalResourcesOutput, { ...result, future: true }).success).toBe(false);
	await expect(endpoint.exec({ url: 'https://example.com/resource', hash: 'wrong' }, me, null)).rejects.toMatchObject({ code: 'EXT_RESOURCE_HASH_DIDNT_MATCH' });
});

test('native webhook and resource inputs strip extras, preserve defaults and reject missing/wrong fields', () => {
	expectTypeOf<v.InferOutput<typeof inlineFetchExternalResourcesOutput>>().toEqualTypeOf<{ type: string; data: string }>();
	expect(v.parse(constantIWebhooksCreateInput, { ...params, future: true })).toEqual({ ...params, secret: '', future: true });
	expect(v.parse(webhookInputs['i/webhooks/update'], { webhookId: webhook.id, future: true })).toEqual({ webhookId: webhook.id });
	expect(v.parse(constantIWebhooksTestInput, { webhookId: webhook.id, type: 'note', override: { url: 'url', future: true }, future: true })).toEqual({ webhookId: webhook.id, type: 'note', override: { url: 'url', future: true }, future: true });
	for (const bad of [{}, { ...params, on: ['invalid'] }, { ...params, name: 7 }, { ...params, secret: null }]) expect(v.safeParse(constantIWebhooksCreateInput, bad).success).toBe(false);
	for (const bad of [{}, { url: 'url', hash: 7 }]) expect(v.safeParse(inlineFetchExternalResourcesInput, bad).success).toBe(false);
	for (const bad of [{ type: 'fixture' }, { type: 7, data: '' }, { type: 'fixture', data: null }]) expect(v.safeParse(inlineFetchExternalResourcesOutput, bad).success).toBe(false);
});

test('RSS parser extension fields remain a separate dynamic producer boundary', async () => {
	const feed = await new Parser().parseString('<rss version="2.0"><channel><title>Fixture</title><language>ja</language><generator>fixture</generator><item><title>Entry</title><comments>https://example.com/comments</comments></item></channel></rss>');
	expect(feed).toHaveProperty('language', 'ja');
	expect(v.parse(inlineFetchRssOutput, feed)).toEqual(feed);
});

test('legacy HTTP retains unknown inputs/defaults and unparsed responses', async () => {
	const projection = projectEndpointContract(constantIWebhooksCreateDefinition);
	const input = { ...params, i: 'transport', future: true };
	const response = { ...webhook, future: true };
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(input); expect(ps).toHaveProperty('secret', ''); return response; });
	expect(await endpoint.exec(input, me, null)).toBe(response);
	expect(v.safeParse(constantIWebhooksCreateOutput, response).success).toBe(false);
	expect(projection.input.additionalProperties).toBeUndefined();
	expect(projection.response).toHaveProperty('additionalProperties', false);
});
