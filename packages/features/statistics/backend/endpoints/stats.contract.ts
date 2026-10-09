/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());

const requestName = 'stats';
export const statsContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName, tags: ['meta'] })
	.errors(commonErrors)
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({
		notesCount: finiteNumber,
		originalNotesCount: finiteNumber,
		usersCount: finiteNumber,
		originalUsersCount: finiteNumber,
		reactionsCount: finiteNumber,
		instances: finiteNumber,
		driveUsageLocal: finiteNumber,
		driveUsageRemote: finiteNumber,
	}));
