/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { call } from '@orpc/server';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import type { ApiServices } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { createAdminQueuePauseProcedure } from '@features/operations/backend/endpoints/admin/queue/pause.js';
import { createAdminQueueClearProcedure } from '@features/operations/backend/endpoints/admin/queue/clear.js';
import { AdminQueuePauseApplicationService } from '@features/operations/backend/endpoints/admin/queue/pause.application.js';
import { AdminQueueClearApplicationService } from '@features/operations/backend/endpoints/admin/queue/clear.application.js';
import type { OperationsApiContext, OperationsApiOperations } from '@features/operations/backend/operations.js';
import { createIExportFollowingProcedure } from '@features/portability/backend/endpoints/i/export-following.js';
import { createIExportNotesProcedure } from '@features/portability/backend/endpoints/i/export-notes.js';
import { createPortabilityOperations, type PortabilityDependencies } from '@features/portability/backend/operations.js';
import type { PortabilityContext } from '@features/portability/backend/api.router.js';

const actor = mockDeep<MiLocalUser>({ id: 'trusted-user', isSuspended: false, movedToUri: null });

function services(principal: MiLocalUser | null = actor) {
 const result = mockDeep<ApiServices<MiLocalUser>>();
 result.authenticate.mockResolvedValue([principal, null]);
 result.limitActor.mockReturnValue('trusted-user');
 result.rateLimitFactor.mockResolvedValue(1);
 result.limit.mockResolvedValue(null);
 return result;
}

test('native queue transport validates, checks moderator/token policy and retains trusted actor', async () => {
 const queue = mockDeep<QueueService>();
 const log = mockDeep<ModerationLogService>();
 const pause = new AdminQueuePauseApplicationService(queue, log);
 const clear = new AdminQueueClearApplicationService(queue, log);
 const operations = mockDeep<OperationsApiOperations<MiLocalUser>>();
 operations.adminQueuePause.mockImplementation((input, principal) => pause.execute(input, principal));
 operations.adminQueueClear.mockImplementation((input, principal) => clear.execute(input, principal));
 const context: OperationsApiContext<MiLocalUser> = { services: services(), authorization: { rootUserId: () => actor.id, roles: async () => [], policyAllowed: async () => false }, operations: { operations }, credential: null, ip: '127.0.0.1', headers: {} };
 const procedure = createAdminQueuePauseProcedure<MiLocalUser>();
 const forged = { queue: 'db' as const, actor: { id: 'forged' } };
 await call(procedure, forged, { context });
 expect(queue.queuePause).toHaveBeenCalledWith('db');
 expect(log.log).toHaveBeenCalledWith(actor, 'pauseQueue');
 const handler = new OpenAPIHandler({ pause: procedure, clear: createAdminQueueClearProcedure<MiLocalUser>() });
 for (const [path, input] of [['pause', { queue: 'unknown' }], ['clear', { queue: 'db', state: 'unknown' }]] as const) {
  const result = await handler.handle(new Request(`https://local.test/admin/queue/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }), { context });
  expect(result.response?.status).toBe(400);
 }
 context.services.authenticate = async () => [null, null];
 await expect(call(procedure, { queue: 'db' }, { context })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
 context.services.authenticate = async () => [actor, { permission: ['read:admin:queue'] }];
 await expect(call(procedure, { queue: 'db' }, { context })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
 context.services.authenticate = async () => [actor, null];
 context.authorization = { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false };
 await expect(call(procedure, { queue: 'db' }, { context })).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED' });
 expect(queue.queuePause).toHaveBeenCalledTimes(1);
 expect(queue.queueClear).not.toHaveBeenCalled();
});

test('native export transport preserves defaults, secure token rejection and rate windows', async () => {
 const deps = mockDeep<PortabilityDependencies<MiLocalUser, { id: string; size: number; url: string }>>();
 const context: PortabilityContext<MiLocalUser> = { services: services(), operations: { portability: createPortabilityOperations(deps) }, credential: null, ip: '127.0.0.1', headers: {} };
 const following = createIExportFollowingProcedure<MiLocalUser>();
 const notes = createIExportNotesProcedure<MiLocalUser>();
 const handler = new OpenAPIHandler({ following });
 const forged = await handler.handle(new Request('https://local.test/i/export-following', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actor: { id: 'forged' } }) }), { context });
 expect(forged.response?.status).toBeLessThan(300);
 expect(deps.createExportFollowingJob).toHaveBeenCalledWith({ id: actor.id }, false, false);
 await call(following, { excludeMuting: true, excludeInactive: true }, { context });
 expect(deps.createExportFollowingJob).toHaveBeenLastCalledWith({ id: actor.id }, true, true);
 const invalid = await handler.handle(new Request('https://local.test/i/export-following', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ excludeMuting: 'yes' }) }), { context });
 expect(invalid.response?.status).toBe(400);
 expect(await call(notes, {}, { context })).toBeUndefined();
 expect(deps.createExportNotesJob).toHaveBeenCalledWith({ id: actor.id });
 expect(context.services.limit).toHaveBeenCalledWith({ key: 'i/export-following', duration: 3600000, max: 1 }, actor.id, 1);
 expect(context.services.limit).toHaveBeenCalledWith({ key: 'i/export-notes', duration: 86400000, max: 1 }, actor.id, 1);
 context.services.authenticate = async () => [null, null];
 await expect(call(following, {}, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
 context.services.authenticate = async () => [actor, { permission: [] }];
 await expect(call(following, {}, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
 expect(deps.createExportFollowingJob).toHaveBeenCalledTimes(2);
});
