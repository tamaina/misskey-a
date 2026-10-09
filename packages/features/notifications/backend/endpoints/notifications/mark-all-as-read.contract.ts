/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
const emptyInput = v.optional(v.lazy(input => Array.isArray(input) ? v.never() : objectInput({})), {});

export const markAllAsReadInput = emptyInput;
export const markAllAsReadOutput = v.void();
const requestName = 'notifications/mark-all-as-read';
export const markAllAsReadContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notifications', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors(commonErrors)
	.input(markAllAsReadInput)
	.output(markAllAsReadOutput);
