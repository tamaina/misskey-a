/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { packedAntennaSchema } from '../../antenna.schema.js';

const requestName = 'antennas/list';
export const antennasListContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(objectInput({}))
	.output(v.array(packedAntennaSchema));
