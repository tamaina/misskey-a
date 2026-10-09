/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportFollowingErrors = {} as const;
export const iExportFollowingContract = oc.$meta({ requestName: 'i/export-following' } as const)
	.route({ method: 'POST', path: '/i/export-following', operationId: 'post___i___export-following', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({ excludeMuting: v.optional(v.boolean(), false), excludeInactive: v.optional(v.boolean(), false) }), { excludeMuting: false, excludeInactive: false })).output(v.void());

export type IExportFollowingInput = v.InferOutput<NonNullable<typeof iExportFollowingContract['~orpc']['inputSchema']>>;
