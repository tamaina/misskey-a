/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain, registryJsonValue } from './registry.schema.js';

export const registryGetDetailInput = objectInput({ key: v.string(), scope: registryScope, domain: registryDomain });
export const registryGetDetailOutput = v.strictObject({ updatedAt: v.pipe(v.string(), v.metadata({ format: 'date-time' })), value: registryJsonValue });

const requestName = 'i/registry/get-detail';
export const registryGetDetailContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___get-detail', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_KEY: { status: 400, data: apiErrorData } })
	.input(registryGetDetailInput).output(registryGetDetailOutput);
