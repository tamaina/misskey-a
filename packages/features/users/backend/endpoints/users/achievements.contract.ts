/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../users.input.schema.js';
import { packedAchievementSchema } from '../../user.schema.js';
export const referenceUsersAchievementsInput = objectInput({
	'userId': misskeyId,
});
export const usersAchievementsErrors = {} as const;
export const usersAchievementsContract = oc.$meta<{ requestName: 'users/achievements' }>({ requestName: 'users/achievements' })
	.route({ method: 'POST', path: '/users/achievements', operationId: 'post___users___achievements' })
	.errors({ ...commonErrors }).input(referenceUsersAchievementsInput).output(v.array(packedAchievementSchema));
