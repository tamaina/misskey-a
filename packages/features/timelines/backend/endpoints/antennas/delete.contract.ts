/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';

export const antennasDeleteErrors = {
	noSuchAntenna: { message: 'No such antenna.', code: 'NO_SUCH_ANTENNA', id: 'b34dcf9d-348f-44bb-99d0-6c9314cfe2df' },
} as const;

const requestName = 'antennas/delete';
export const antennasDeleteContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ANTENNA: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'antennaId': misskeyId,
	}))
	.output(v.void());
