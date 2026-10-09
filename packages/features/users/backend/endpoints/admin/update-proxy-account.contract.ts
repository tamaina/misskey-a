/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, description } from '../../users.input.schema.js';
import { packedMeDetailedSchema } from '../../user.schema.js';
export const portableAdminUpdateProxyAccountInput = v.pipe(objectInput({
	'description': v.exactOptional(v.nullable(description)),
}), v.metadata({ 'required': undefined }));
export const adminUpdateProxyAccountErrors = {} as const;
export const adminUpdateProxyAccountContract = oc.$meta<{ requestName: 'admin/update-proxy-account' }>({ requestName: 'admin/update-proxy-account' })
	.route({ method: 'POST', path: '/admin/update-proxy-account', operationId: 'post___admin___update-proxy-account', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(portableAdminUpdateProxyAccountInput).output(packedMeDetailedSchema);
