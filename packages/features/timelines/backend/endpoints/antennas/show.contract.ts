/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedAntennaSchema } from '../../antenna.schema.js';

export const antennasShowErrors = {
	noSuchAntenna: { message: 'No such antenna.', code: 'NO_SUCH_ANTENNA', id: 'c06569fb-b025-4f23-b22d-1fcd20d2816b' },
} as const;

const requestName = 'antennas/show';
export const antennasShowContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_ANTENNA: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'antennaId': misskeyId,
	}))
	.output(packedAntennaSchema);
