/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient, getRouter, isProcedure } from '@orpc/server';
import * as v from 'valibot';
import { pilotContract } from '@features/index/backend/api.contract.js';
import { createApiRouter } from '@features/index/backend/api.router.js';
import type { ApiExecutionContext } from '@features/index/backend/api.context.js';
import type { ApiActor, ApiToken } from '@features/api/backend/transport/context.js';
import { requestRoutes } from '@features/api/shared/api-routing.js';
import { apiError, normalizeError } from '@features/api/backend/transport/orpc-error.js';
import { clipCommandErrors, clipFavoriteErrors } from '@features/collections/backend/api.errors.js';
import { relationshipsErrors } from '@features/relationships/backend/endpoints/relationships.errors.js';
import { createAnnouncementsOperations } from '@features/announcements/backend/api.operations.js';
import type { AnnouncementsDependencies } from '@features/announcements/backend/api.operations.js';
import baseline from './command-metadata.fixture.json' with { type: 'json' };

const errorSchema = v.object({ message: v.string(), code: v.string(), id: v.string() });
const metadataSchema = v.object({
 // The legacy list favorite/unfavorite handlers omitted tags; native contracts use an empty list.
 tags: v.optional(v.array(v.string()), []), requireCredential: v.boolean(), kind: v.string(),
 errors: v.optional(v.record(v.string(), errorSchema), {}),
 limit: v.exactOptional(v.object({ duration: v.number(), max: v.number(), key: v.exactOptional(v.string()), minInterval: v.exactOptional(v.number()) })),
 prohibitMoved: v.optional(v.boolean(), false), requireModerator: v.optional(v.boolean(), false),
 requiredRolePolicy: v.exactOptional(v.string()), description: v.exactOptional(v.string()),
});
const snapshots = v.parse(v.record(v.string(), metadataSchema), baseline);
const router = createApiRouter<ApiActor>();
const routes = requestRoutes(pilotContract);
const actor: ApiActor = { id: 'trustedUser', isSuspended: false, movedToUri: null };

const errorLoaders: Record<string, () => Promise<object>> = {
	'channels/follow': () => import('@features/channels/backend/endpoints/channels/follow.contract.js'),
	'channels/unfollow': () => import('@features/channels/backend/endpoints/channels/unfollow.contract.js'),
	'channels/favorite': () => import('@features/channels/backend/endpoints/channels/favorite.contract.js'),
	'channels/unfavorite': () => import('@features/channels/backend/endpoints/channels/unfavorite.contract.js'),
	'channels/mute/create': () => import('@features/channels/backend/endpoints/channels/mute/create.contract.js'),
	'channels/mute/delete': () => import('@features/channels/backend/endpoints/channels/mute/delete.contract.js'),
	'i/webhooks/update': () => import('@features/integrations/backend/endpoints/i/webhooks/update.contract.js'),
	'i/webhooks/delete': () => import('@features/integrations/backend/endpoints/i/webhooks/delete.contract.js'),
	'chat/read-all': () => import('@features/chat/backend/endpoints/chat/read-all.contract.js'),
	'chat/rooms/join': () => import('@features/chat/backend/endpoints/chat/rooms/join.contract.js'),
	'chat/rooms/leave': () => import('@features/chat/backend/endpoints/chat/rooms/leave.contract.js'),
	'chat/rooms/mute': () => import('@features/chat/backend/endpoints/chat/rooms/mute.contract.js'),
	'chat/rooms/delete': () => import('@features/chat/backend/endpoints/chat/rooms/delete.contract.js'),
	'chat/rooms/invitations/ignore': () => import('@features/chat/backend/endpoints/chat/rooms/invitations/ignore.contract.js'),
	'chat/messages/react': () => import('@features/chat/backend/endpoints/chat/messages/react.contract.js'),
	'chat/messages/unreact': () => import('@features/chat/backend/endpoints/chat/messages/unreact.contract.js'),
	'chat/messages/delete': () => import('@features/chat/backend/endpoints/chat/messages/delete.contract.js'),
};

for (const [name, snapshot] of Object.entries(snapshots)) {
 test(`${name} retains native metadata, trusted dispatch, authorization and limits`, async () => {
  const route = routes.find(route => route.name === name);
  if (!route) throw new Error(`Missing native route ${name}`);
  const procedure = getRouter(router, [...route.path]);
  if (!isProcedure(procedure)) throw new Error(`Missing native procedure ${name}`);
  expect(procedure['~orpc'].route.tags).toEqual(snapshot.tags);
  expect(procedure['~orpc'].route.description).toEqual(snapshot.description);
  expect(procedure['~orpc'].meta.requestName).toBe(name);
  const context = mockDeep<ApiExecutionContext<ApiActor>>();
  context.credential = 'trusted'; context.ip = '127.0.0.1'; context.headers = {};
  // A deep mock would invent a truthy error mapper that returns undefined.
  context.mapError = normalizeError;
  const token: ApiToken = { id: 'trustedToken', name: 'App', iconUrl: null, permission: [snapshot.kind] };
  context.services.authenticate.mockResolvedValue([actor, token]);
  context.services.limitActor.mockReturnValue(actor.id);
  context.services.rateLimitFactor.mockResolvedValue(1);
  context.services.limit.mockResolvedValue(null);
  context.authorization?.rootUserId.mockReturnValue(actor.id);
  const operation = vi.fn(async (..._args: unknown[]) => undefined);
  const feature = Reflect.get(context.operations, route.path[0]);
  Reflect.set(feature, route.path[route.path.length - 1], operation);
  const call = createProcedureClient(procedure, { context });
  const input = {
   id: 'id1', listId: 'list1', userId: 'user1', announcementId: 'announcement1', webhookId: 'webhook1',
   channelId: 'channel1', clipId: 'clip1', noteId: 'note1', roomId: 'room1', messageId: 'message1',
   mute: false, reaction: '👍', ids: ['emoji1'], aliases: ['alias'],
   category: null, license: null, body: 'hello', header: null,
   ...(name.startsWith('admin/announcements/') ? {} : { icon: null }),
   actor: { id: 'forged' }, token: { id: 'forged' },
  };
  await call(input);
  expect(operation).toHaveBeenCalledTimes(1);
  const args = operation.mock.calls[0];
  expect(args[1]).toBe(actor);
  expect(args[0]).not.toHaveProperty('actor');
  expect(args[0]).not.toHaveProperty('token');
  if (name === 'notifications/create') expect(args[2]).toBe(token);
  if (snapshot.limit) expect(context.services.limit).toHaveBeenCalledWith({ ...snapshot.limit, key: snapshot.limit.key ?? name }, actor.id, 1);
  else expect(context.services.limit).not.toHaveBeenCalled();

  operation.mockClear();
  context.services.authenticate.mockResolvedValue([null, null]);
  await expect(call(input)).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', status: 401 });
  context.services.authenticate.mockResolvedValue([{ ...actor, isSuspended: true }, token]);
  await expect(call(input)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED', status: 403 });
  context.services.authenticate.mockResolvedValue([actor, { ...token, permission: [] }]);
  await expect(call(input)).rejects.toMatchObject({ code: 'PERMISSION_DENIED', status: 403 });
  context.services.authenticate.mockResolvedValue([actor, token]);
  if (snapshot.prohibitMoved) {
   context.services.authenticate.mockResolvedValue([{ ...actor, movedToUri: 'https://example.com/user' }, token]);
   await expect(call(input)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED', status: 403 });
   context.services.authenticate.mockResolvedValue([actor, token]);
  }
  if (snapshot.requireModerator || snapshot.requiredRolePolicy) {
   context.authorization?.rootUserId.mockReturnValue(null);
   context.authorization?.roles.mockResolvedValue([]);
   context.authorization?.policyAllowed.mockResolvedValue(false);
   await expect(call(input)).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED', status: 403 });
   if (snapshot.requiredRolePolicy) expect(context.authorization?.policyAllowed).toHaveBeenCalledWith(actor, snapshot.requiredRolePolicy);
   context.authorization?.rootUserId.mockReturnValue(actor.id);
  }
  if (snapshot.limit) {
   context.services.limit.mockResolvedValue({ info: {} });
   await expect(call(input)).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', status: 429 });
   context.services.limit.mockResolvedValue(null);
  }
  expect(operation).not.toHaveBeenCalled();

  let definitions: unknown = {};
  const load = errorLoaders[name];
  if (load) {
   const module = await load();
   const entry = Object.entries(module).find(([key]) => key.endsWith('Errors'));
   if (!entry) throw new Error(`Missing native error definitions ${name}`);
   definitions = entry[1];
  } else if (name.startsWith('clips/')) definitions = Reflect.get({ ...clipCommandErrors, ...clipFavoriteErrors }, name);
  else if (name.startsWith('users/lists/')) definitions = Reflect.get(relationshipsErrors, name);
  // Announcement IDs are asserted against real application behavior below.
  if (!name.includes('announcements/')) expect(v.parse(v.record(v.string(), errorSchema), definitions)).toEqual(snapshot.errors);
  for (const definition of Object.values(snapshot.errors)) {
   expect(procedure['~orpc'].errorMap).toHaveProperty(definition.code);
   operation.mockRejectedValueOnce(apiError(definition));
   await expect(call(input)).rejects.toMatchObject({ code: definition.code, message: definition.message, data: { id: definition.id } });
  }
 });
}

for (const method of ['delete', 'update'] as const) {
 test(`announcement ${method} retains the application missing-row error UUID`, async () => {
  const dependencies = mockDeep<AnnouncementsDependencies<ApiActor>>();
  dependencies.announcementsRepository.findOneBy.mockResolvedValue(null);
  const operations = createAnnouncementsOperations(dependencies);
  const definition = snapshots[`admin/announcements/${method}`].errors.noSuchAnnouncement;
  await expect(operations[method]({ id: 'missing' }, actor)).rejects.toMatchObject({ code: definition.code, message: definition.message, data: { id: definition.id } });
 });
}
