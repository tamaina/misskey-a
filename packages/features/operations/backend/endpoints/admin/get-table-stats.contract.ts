/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { tableStatsSchema } from '../../queue.schema.js';

export const adminGetTableStatsInput = objectInput({});
export const adminGetTableStatsOutput = tableStatsSchema;
export const adminGetTableStatsErrors = {} as const;

const requestName = 'admin/get-table-stats';
export const adminGetTableStatsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminGetTableStatsInput).output(adminGetTableStatsOutput);
