/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());
export const statsInput = v.optional(objectInput({}), {});
export const statsOutput = v.strictObject({
	notesCount: finiteNumber,
	originalNotesCount: finiteNumber,
	usersCount: finiteNumber,
	originalUsersCount: finiteNumber,
	reactionsCount: finiteNumber,
	instances: finiteNumber,
	driveUsageLocal: finiteNumber,
	driveUsageRemote: finiteNumber,
});

const requestName = 'stats';
export const statsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName, tags: ['meta'] })
	.errors(commonErrors)
	.input(statsInput)
	.output(statsOutput);
