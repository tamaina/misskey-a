/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../users.input.schema.js';
import { packedAchievementNameSchema } from '../../user.schema.js';
export const constantIClaimAchievementInput = objectInput({
	'name': packedAchievementNameSchema,
});
export const iClaimAchievementErrors = {} as const;
export const iClaimAchievementContract = oc.$meta<{ requestName: 'i/claim-achievement' }>({ requestName: 'i/claim-achievement' })
	.route({ method: 'POST', path: '/i/claim-achievement', operationId: 'post___i___claim-achievement', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(constantIClaimAchievementInput).output(v.void());
