/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { queueCounterSchema } from '../../../queue.schema.js';

export const adminQueueStatsErrors = {} as const;

const requestName = 'admin/queue/stats';
export const adminQueueStatsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.strictObject({ deliver: queueCounterSchema, inbox: queueCounterSchema, db: queueCounterSchema, objectStorage: queueCounterSchema }));

export type AdminQueueStatsInput = v.InferOutput<NonNullable<typeof adminQueueStatsContract['~orpc']['inputSchema']>>;
export type AdminQueueStatsOutput = v.InferOutput<NonNullable<typeof adminQueueStatsContract['~orpc']['outputSchema']>>;
