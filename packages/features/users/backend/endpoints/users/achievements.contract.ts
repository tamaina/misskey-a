/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../users.input.schema.js';
import { packedAchievementSchema } from '../../user.schema.js';
export const usersAchievementsErrors = {} as const;
export const usersAchievementsContract = oc.$meta({
	requestName: 'users/achievements',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/users/achievements' })
	.errors({ ...commonErrors }).input(objectInput({
	'userId': misskeyId,
})).output(v.array(packedAchievementSchema));
