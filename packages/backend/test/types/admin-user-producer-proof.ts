/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { call, type InferRouterCurrentContexts } from '@orpc/server';
import type { createAdminShowUserProcedure } from '@features/moderation/backend/endpoints/admin/show-user.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { moderationContract } from '@features/moderation/backend/api.definition.js';
type Documented = InferSchemaOutput<NonNullable<typeof moderationContract.adminShowUser['~orpc']['outputSchema']>>;
type Input = InferSchemaOutput<NonNullable<typeof moderationContract.adminShowUser['~orpc']['inputSchema']>>;
declare const actor: ApiActor;
type Procedure = ReturnType<typeof createAdminShowUserProcedure<ApiActor>>;
type HandlerContext = InferRouterCurrentContexts<Procedure>;
declare const procedure: Procedure;
declare const context: ApiContext<ApiActor>;
const trustedPrincipal: HandlerContext['principal'] = actor;
const input: Input = { userId: 'user123' };
const native: Promise<Documented> = call(procedure, input, { context });
// Signins expose the real producer fields; their stored headers are genuine JSON.
const signins: Documented['signins'] = [{
	id: 'signin123', userId: 'user123', ip: '127.0.0.1',
	headers: { 'user-agent': 'browser', extension: [1, true, null] }, success: true,
}];
// @ts-expect-error Native timestamps must be converted to their public ISO string.
const unconvertedDate: Documented['lastActiveDate'] = new Date();
// @ts-expect-error Stored headers cannot contain native Date instances.
const unconvertedHeaders: Documented['signins'][number]['headers'] = { receivedAt: new Date() };
// @ts-expect-error Required credentials cannot be replaced by an anonymous principal.
const anonymousPrincipal: HandlerContext['principal'] = null;
// @ts-expect-error A caller cannot substitute a numeric user selector.
const wrongInput: Input = { userId: 42 };
