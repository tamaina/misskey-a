/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminFederationRefreshRemoteInstanceMetadataInput = objectInput({
	"host": v.string(),
});
export const adminFederationRefreshRemoteInstanceMetadataOutput = v.void();
export const adminFederationRefreshRemoteInstanceMetadataErrors = {} as const;

const requestName = 'admin/federation/refresh-remote-instance-metadata';
export const adminFederationRefreshRemoteInstanceMetadataContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminFederationRefreshRemoteInstanceMetadataInput).output(adminFederationRefreshRemoteInstanceMetadataOutput);
