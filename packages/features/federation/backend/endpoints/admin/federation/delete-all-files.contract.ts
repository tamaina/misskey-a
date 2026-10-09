/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminFederationDeleteAllFilesInput = objectInput({
	"host": v.string(),
});
export const adminFederationDeleteAllFilesOutput = v.void();
export const adminFederationDeleteAllFilesErrors = {} as const;

const requestName = 'admin/federation/delete-all-files';
export const adminFederationDeleteAllFilesContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminFederationDeleteAllFilesInput).output(adminFederationDeleteAllFilesOutput);
