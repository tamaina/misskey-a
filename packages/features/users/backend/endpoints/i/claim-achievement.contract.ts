/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../users.input.schema.js';
import { packedAchievementNameSchema } from '../../user.schema.js';
export const iClaimAchievementErrors = {} as const;
export const iClaimAchievementContract = oc.$meta({
	requestName: 'i/claim-achievement',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/claim-achievement', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
	'name': packedAchievementNameSchema,
})).output(v.void());
