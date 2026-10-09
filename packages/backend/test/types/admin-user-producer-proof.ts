/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { moderationContract } from '@features/moderation/backend/api.contract.js';
import type { ModerationOperations } from '@features/moderation/backend/api.operations.js';

type Documented = InferSchemaOutput<NonNullable<typeof moderationContract.adminShowUser['~orpc']['outputSchema']>>;
type Input = InferSchemaOutput<NonNullable<typeof moderationContract.adminShowUser['~orpc']['inputSchema']>>;
declare const actor: ApiActor;
declare const operations: ModerationOperations<ApiActor>;
const input: Input = { userId: 'user123' };
const native: Promise<Documented> = operations.adminShowUser(input, actor);

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
operations.adminShowUser(input, null);
// @ts-expect-error A caller cannot substitute a numeric user selector.
const wrongInput: Input = { userId: 42 };
