/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminFederationUpdateInstanceInput = objectInput({
	"host": v.string(),
	"isSuspended": v.exactOptional(v.boolean()),
	"moderationNote": v.exactOptional(v.string()),
});
export const adminFederationUpdateInstanceOutput = v.void();
export const adminFederationUpdateInstanceErrors = {} as const;

const requestName = 'admin/federation/update-instance';
export const adminFederationUpdateInstanceContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminFederationUpdateInstanceInput).output(adminFederationUpdateInstanceOutput);
