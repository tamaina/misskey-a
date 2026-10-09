/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain, registryJsonValue } from './registry.schema.js';

const requestName = 'i/registry/get-detail';
export const registryGetDetailContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___get-detail', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_KEY: { status: 400, data: apiErrorData } })
	.input(objectInput({ key: v.string(), scope: registryScope, domain: registryDomain })).output(v.strictObject({ updatedAt: v.pipe(v.string(), v.metadata({ format: 'date-time' })), value: registryJsonValue }));
